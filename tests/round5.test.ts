import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOSS_CHARGE_MULT, act, canUse, startBattle, spellCost, whyNot } from '../src/core/battle';
import { autoEquip, starterKit } from '../src/core/auto';
import { generateEquip } from '../src/core/items';
import { RANK_MULT, buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { battleLoot, chestLoot, encounter, startRun } from '../src/core/run';
import { generateTower, tripleViolations } from '../src/core/tower';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const fresh = () => {
  const p = newPlayer(); starterKit(p);
  const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e9;
  return { p, d, b: startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], p.potions) };
};

describe('round 5', () => {
  it('1. a spell deducts MP and the regen is reported as a separate event', () => {
    const { b } = fresh();
    b.d = { ...b.d, mp: 1000 }; b.mp = 500;
    const cost = spellCost(b, 'fiery');
    const ev = act(b, { kind: 'spell', id: 'fiery', target: 0 }, new Rng(1), {});
    expect(ev.some((e) => e.t === 'msg' && e.text.includes(`消耗 ${cost} MP`))).toBe(true);
    expect(ev.some((e) => e.t === 'msg' && e.text.includes(`剩 ${500 - cost}`))).toBe(true);
    const regen = ev.find((e) => e.t === 'heal' && e.res === 'mp');
    expect(regen && regen.t === 'heal' ? regen.amount : 0).toBeGreaterThan(0);
    expect(b.mp).toBeCloseTo(500 - cost + (regen as { amount: number }).amount, 1);
  });
  it('2. (CP3) battle starts at OC 0; spirit opens once attacks build OC to 50', () => {
    const { b } = fresh();
    expect(b.oc).toBe(0);
    let n = 0;
    while (!canUse(b, { kind: 'spirit' }) && n < 40) { act(b, { kind: 'attack', target: 0 }, new Rng(n), {}); n++; }
    expect(b.oc).toBeGreaterThanOrEqual(50);
    expect(canUse(b, { kind: 'spirit' })).toBe(true);
    b.oc = 0;
    expect(whyNot(b, { kind: 'spirit' })).toContain('OC 不足');
  });
  it('4/5. floor 1 is all battle; 0 triple violations over 1000 seeds (incl. 33)', () => {
    let v = 0;
    for (let s = 0; s < 1000; s++) {
      const t = generateTower(new Rng(s));
      expect(new Set(t.floors[0]!.options)).toEqual(new Set(['battle']));
      expect(t.floors[3]!.options).toContain('rest');
      expect(t.floors[7]!.options).toContain('rest');
      v += tripleViolations(t);
    }
    expect(v).toBe(0);
    expect(tripleViolations({ floors: [{ n: 7, options: ['rest'] }, { n: 8, options: ['rest', 'battle'] }, { n: 9, options: ['rest'] }] })).toBe(1);
  });
  it('6. chests drop 2-3 items', () => {
    const p = newPlayer();
    for (let s = 1; s < 200; s++) { const n = chestLoot(startRun(p, s)).equips.length; expect(n).toBeGreaterThanOrEqual(2); expect(n).toBeLessThanOrEqual(3); }
  });
  it('7. auto-equip keeps an IW-upgraded weapon over a near-equal drop; EXP is an integer', () => {
    const p = newPlayer(); starterKit(p);
    const w = p.equipped.mainHand!; w.iw = 5;
    const drop = JSON.parse(JSON.stringify(w)); drop.id = 'x'; drop.iw = 0; drop.roll = Math.min(1, w.roll + 0.01);
    autoEquip(p, [drop]);
    expect(p.equipped.mainHand!.id).toBe(w.id);
    const run = startRun(p, 3);
    const loot = battleLoot(run, encounter(run, pool, 'battle'), 'battle');
    expect(Number.isInteger(loot.exp)).toBe(true);
  });
  it('9. every battle pays credits and an equipment drops by floor 4', () => {
    const p = newPlayer();
    for (let s = 1; s < 200; s++) {
      const run = startRun(p, s);
      const l = battleLoot(run, encounter(run, pool, 'battle'), 'battle');
      expect(l.credits).toBeGreaterThan(0);
      expect(l.equips.length).toBeGreaterThan(0);
    }
  });
  it('8. 暫定 difficulty values are in place (boss dmg x0.6, charge x2)', () => {
    expect(RANK_MULT.boss.dmg).toBe(0.6);
    expect(BOSS_CHARGE_MULT).toBe(2);
  });
  void generateEquip;
});
