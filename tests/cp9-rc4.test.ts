// cp9-rc4（自訂，暫定）: (A) one hint function for UI + sim, (C1) defend halves drain lifesteal, (C2) drain wind-up → stun key first.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, armCp5, chargeAdvice, drainStunKey, skillKit, startBattle, turnHints, type BEvent } from '../src/core/battle';
import { chooseNaive, SIM_AI, starterKit } from '../src/core/auto';
import { CP9 } from '../src/core/cp8';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8, SIM_AI.naive]; RULES.cp7 = true; RULES.cp8 = true; SIM_AI.naive = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; SIM_AI.naive = o[2]!; } };
const mk = (oc: number) => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 5000; m.adb = 5; m.charge = 0;
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 3, mana: 0, spirit: 0 }); b.oc = oc; return b;
};
describe('cp9-rc4 (A): UI and sim read the same hint function', () => {
  const app = readFileSync('src/game/app.ts', 'utf8'), auto = readFileSync('src/core/auto.ts', 'utf8');
  const html = app.slice(app.indexOf('  battleHtml(): string {'), app.indexOf('    const sk = skillKit(b).map('));
  it('battleHtml takes skill / spell / danger from turnHints, with no lean gate', () => {
    expect(html).toMatch(/turnHints\(b, this\.target\)/); expect(html).not.toMatch(/suggestSkill\(|suggestSpell\(|arcaneSpell\(/);
    expect(app).not.toMatch(/lean === 'blade' \|\| lean === 'oc'/); expect(app).not.toMatch(/lean === 'arcane' && !dangerNow/);
  });
  it('chooseNaive presses turnHints, not suggestSkill directly', () => {
    const cn = auto.slice(auto.indexOf('export function chooseNaive'), auto.indexOf('const seen = '));
    expect(cn).toMatch(/turnHints\(b, target\)\.skill/); expect(cn).not.toMatch(/= suggestSkill\(/);
  });
  it('the sim action equals the UI hint on the same state (every OC level)', () => withCp8(() => {
    let lit = 0;
    for (const oc of [0, 25, 50, 100, 150, 250]) {
      const b = mk(oc), h = turnHints(b, 0), a = chooseNaive(b, true);
      if (h.skill) { lit++; expect(a).toEqual({ kind: 'skill', id: h.skill, target: 0 }); } else expect(a.kind).not.toBe('skill');
    }
    expect(lit).toBeGreaterThan(0);
  }));
});
describe('cp9-rc4 (C1): defending halves drain lifesteal', () => {
  it('drainDef = 0.5', () => expect(CP9.drainDef).toBe(0.5));
  it('a 吸血重擊 landing on D heals half its damage', () => withCp8(() => {
    const b = mk(0); armCp5(b); b.d.evade = 0; b.d.parry = 0; b.d.block = 0; b.hp = b.d.hp = 1e5;
    const m = b.monsters[0]! as typeof b.monsters[0] & { sig?: string; drainNext?: boolean }; m.rank = 'boss'; m.sig = 'drain'; m.drainNext = true; m.charge = 1; m.adb = 200; m.hp = 100;
    const ev: BEvent[] = act(b, { kind: 'defend' }, new Rng(1));
    const hit = ev.find((e) => e.t === 'hit' && (e as { to?: string }).to === 'player') as { dmg: number } | undefined;
    const st = ev.find((e) => e.t === 'status' && /吸血/.test((e as { text?: string }).text ?? '')) as { text: string } | undefined;
    expect(hit && hit.dmg > 0).toBe(true); expect(st?.text).toContain('防禦減半');
    expect(Number(st!.text.split('+')[1])).toBe(Math.round(hit!.dmg * 0.5));
  }));
});
describe('cp9-rc4 (C2): drain wind-up → stun skill first in chargeAdvice', () => {
  it('Q·盾擊 leads the keys when the target is charging a drain and the stun is usable', () => withCp8(() => {
    const b = mk(300); const m = b.monsters[0]! as typeof b.monsters[0] & { sig?: string; drainNext?: boolean }; m.sig = 'drain'; m.drainNext = true; m.charge = 1;
    const k = drainStunKey(b, 0); expect(k).toMatch(/^[QWE]·(盾擊|震盪打擊)$/); expect(chargeAdvice(b, 0).keys[0]).toBe(k);
    expect(skillKit(b).length).toBeGreaterThan(0);
    b.oc = 0; expect(drainStunKey(b, 0)).toBeNull(); m.drainNext = false; b.oc = 300; { const o5 = CP9.stunAll; CP9.stunAll = false; expect(drainStunKey(b, 0)).toBeNull(); CP9.stunAll = o5; } // cp9-rc5 (1)（自訂）: rc4 behaviour = stunAll off
  }));
});
