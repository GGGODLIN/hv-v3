import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BUFF, BUFFS, SCHOOLS, schoolCounts } from '../src/core/buffs';
import { act, armCp5, startBattle } from '../src/core/battle';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { armBattle, finishBattle, RULES, runDerived, startRun } from '../src/core/run';
import { starterKit } from '../src/core/auto';
import { eligible, rollBuffs } from '../src/core/buffoffer';
import { CP5 } from '../src/core/cp5';
import { generateTower } from '../src/core/tower';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const cp5 = <T,>(f: () => T): T => { RULES.cp5Bosses = true; try { return f(); } finally { RULES.cp5Bosses = true; } };
const p = newPlayer(); starterKit(p);
function bulwarkBattle(withCp5: boolean, ids?: string[]) {
  const r = startRun(p, 3); r.buffs = ids ?? BUFFS.filter((b) => b.school === 'bulwark').slice(0, 4).map((b) => b.id);
  const m = buildMonster(pool.rows[0]!, 5, 'normal'); m.hp = m.maxHp = 1e9; m.evade = m.parry = 0;
  const b = startBattle(runDerived(p, r), { hp: 999, mp: 999, sp: 99 }, [m], p.potions); armBattle(b, r);
  if (withCp5) armCp5(b);
  return b;
}
const defHeals = (withCp5: boolean, ids?: string[]) => {
  const b = bulwarkBattle(withCp5, ids); const out: number[] = [];
  for (let i = 0; i < 3; i++) { b.hp = 1; b.oc = 999; const ev = act(b, { kind: 'defend' }, new Rng(9 + i)); { const h = ev.find((e) => e.t === 'heal' && e.label === '防禦'); out.push(h && h.t === 'heal' ? h.amount : NaN); }; b.hp = 1; }
  return out;
};
describe('CP5 r4: bulwark 3-set anti-turtle (暫定)', () => {
  it('consecutive defends heal ×decay each time; flag off unchanged', () => {
    const off = defHeals(false); expect(off[1]).toBe(off[0]); expect(off[2]).toBe(off[0]);
    const on = defHeals(true);
    expect(on[0]).toBe(off[0]);
    expect(on[1]).toBeLessThanOrEqual(Math.round(off[0]! * CP5.bulwarkDefDecay) + 1);
    expect(on[2]).toBeLessThan(on[1]!);
  });
  it('rc2 fix 1: 2-piece bulwark (不動之盾+撕裂, no 3-set) also decays ×0.5^n', () => {
    const h = defHeals(true, ['W1', 'W5']);
    expect(h[1]).toBeCloseTo(h[0]! * 0.5, -0.5); expect(h[2]).toBeCloseTo(h[0]! * 0.25, -0.5);
    const off = defHeals(false, ['W1', 'W5']); expect(off[1]).toBe(off[0]);
  });
  it('an attack resets the streak', () => {
    const b = bulwarkBattle(true); b.oc = 999;
    act(b, { kind: 'defend' }, new Rng(1)); act(b, { kind: 'attack', target: 0 }, new Rng(2));
    expect(b.defStreak).toBe(0);
  });
  it('no riposte on a defend turn with cp5; still ripostes on an attack turn', () => {
    const b = bulwarkBattle(true); b.d = { ...b.d, evade: 1 }; b.oc = 999;
    expect(act(b, { kind: 'defend' }, new Rng(4)).some((e) => e.t === 'hit' && e.label === '反擊')).toBe(false);
    const c = bulwarkBattle(true); c.d = { ...c.d, evade: 1 };
    expect(act(c, { kind: 'attack', target: 0 }, new Rng(4)).some((e) => e.t === 'hit' && e.label === '反擊')).toBe(true);
  });
});
describe('CP5: boss three-pick has ≥1 card of the main school', () => {
  it('2000 random held sets × boss offer', () => cp5(() => {
    const rng = new Rng(77);
    for (let s = 1; s <= 2000; s++) {
      const r = startRun(p, s); const k = rng.int(1, 6);
      const pick = BUFFS.filter((b) => eligible(p, b)); const held: string[] = [];
      while (held.length < k) { const b = pick[rng.int(0, pick.length - 1)]!; if (!held.includes(b.id)) held.push(b.id); }
      r.buffs = held;
      const cnt = schoolCounts(held);
      const top = SCHOOLS.filter((x) => cnt[x] > 0).sort((a, b) => cnt[b] - cnt[a] || held.findIndex((id) => BUFF[id]!.school === a) - held.findIndex((id) => BUFF[id]!.school === b))[0];
      const ids = rollBuffs(p, r, 'boss', 3);
      const left = BUFFS.some((b) => b.school === top && eligible(p, b) && !held.includes(b.id));
      if (top && left) expect(ids.some((id) => BUFF[id]!.school === top), `seed ${s} held ${held} top ${top} got ${ids}`).toBe(true);
    }
  }));
});

import { dangerHint as _dh, type AffixId as _A } from '../src/core/cp5';
import { readFileSync as _rf } from 'node:fs';
it('CP5 r5: every sim death combo (current + r4 list) has a visible counter hint', () => {
  const log = _rf(new URL('../docs/logs/cp5-deathcombo.txt', import.meta.url), 'utf8');
  const cur = [...log.matchAll(/^必死 \S+ F\d+ (\S+)/gm)].map((m) => m[1]!);
  const r4 = ['warded', 'swift+warded', 'flame+warded', 'split+warded', 'leech+warded', 'berserk+warded', 'guard+warded', 'warded+spikes', 'warded+iron', 'antimagic', 'split+antimagic', 'warded+keen'];
  for (const c of [...cur, ...r4]) { const h = _dh(c.split('+') as _A[]); expect(h, c).toBeTruthy(); expect(h!).toContain('撤退'); }
  expect(_dh(['leech'])).toBeNull();
});
describe('CP5 rc2 fix 2: DoTs end with the battle', () => {
  it('burn / bleed on the player are not carried into the next fight', () => cp5(() => {
    const r = startRun(p, 4); r.cp5 = true;
    const m = buildMonster(pool.rows[0]!, 5, 'normal'); m.hp = 0;
    const b = startBattle(runDerived(p, r), { hp: 999, mp: 999, sp: 99 }, [m], p.potions); armBattle(b, r); armCp5(b);
    b.cp5!.pdot = { ...b.cp5!.pdot, burn: 7, burnTurns: 3, bleed: 5, bleedTurns: 2 }; b.over = 'win';
    finishBattle(p, r, b, [m], 'battle');
    expect(r.pdot).toBeUndefined();
    const b2 = startBattle(runDerived(p, r), { hp: 999, mp: 999, sp: 99 }, [m], p.potions); armCp5(b2, r.pdot);
    expect(b2.cp5!.pdot.burnTurns).toBe(0); expect(b2.cp5!.pdot.bleedTurns).toBe(0);
  }));
});
describe('CP5 rc2 fix 8: F1–F3 offer ≥2 routes', () => {
  it('tutorial and normal towers with the flag on', () => cp5(() => {
    for (let s = 1; s <= 200; s++) for (const tut of [true, false]) {
      const q = newPlayer(); starterKit(q, s); const r = startRun(q, s); if (!tut) r.tutorial = false;
      const t = tut ? r.tower : generateTower(new Rng(s), { long: true });
      for (let n = 1; n <= 3; n++) expect(t.floors[n - 1]!.options.length).toBeGreaterThanOrEqual(2);
    }
  }));
});
