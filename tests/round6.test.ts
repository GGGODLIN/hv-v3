import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, canUse, startBattle, whyNot } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { generateEquip } from '../src/core/items';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { encounter, settle, startRun } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const fresh = () => {
  const p = newPlayer(); starterKit(p);
  const d = derive(p);
  return { p, b: startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [buildMonster(pool.rows[0]!, 1)], { health: 3, mana: 0, spirit: 0 }) };
};

describe('round 6', () => {
  it('1. spirit stance opens at OC >= 25 and SP >= 1 (暫定), so a new character can at battle start', () => {
    const { b } = fresh();
    expect(b.oc).toBe(25);
    expect(canUse(b, { kind: 'spirit' })).toBe(true);
    b.oc = 24; expect(canUse(b, { kind: 'spirit' })).toBe(false);
    expect(whyNot(b, { kind: 'spirit' })).toBe('OC 不足（需 25，現有 24）');
    b.oc = 25; b.sp = 0; expect(canUse(b, { kind: 'spirit' })).toBe(false);
    expect(whyNot(b, { kind: 'spirit' })).toContain('SP 不足');
  });
  it('4. health potion cooldown is 10 turns; floor-10 boss has at most 1 minion', () => {
    const { b } = fresh();
    b.hp = 1;
    act(b, { kind: 'item', id: 'health' }, new Rng(1), {});
    expect(b.itemCd.health).toBe(10);
    for (let s = 1; s <= 200; s++) {
      const run = startRun(newPlayer(), s); run.floor = 10;
      const ms = encounter(run, pool, 'boss');
      expect(ms.filter((m) => m.rank !== 'boss').length).toBeLessThanOrEqual(1);
    }
  });
  it('7. death settlement lists kept and lost items separately', () => {
    const p = newPlayer(); p.potions = { health: 2, mana: 1, spirit: 0 };
    const run = startRun(p, 5);
    const rng = new Rng(9);
    run.bag = [0, 1, 2].map(() => generateEquip(rng, 5, {}));
    run.done = 'dead';
    const s = settle(p, run);
    expect(s.kept).toHaveLength(1);
    expect(s.lostItems).toHaveLength(2);
    expect(s.lostItems.some((e) => s.kept.includes(e))).toBe(false);
    expect(s.lostPotions).toEqual({ health: 2, mana: 1, spirit: 0 });
  });
  it('11 (core). a clear brings every bag item home', () => {
    const p = newPlayer();
    const run = startRun(p, 5);
    const rng = new Rng(3);
    run.bag = [0, 1, 2, 3].map(() => generateEquip(rng, 5, {}));
    run.done = 'clear';
    const ids = run.bag.map((e) => e.id);
    const s = settle(p, run);
    expect(s.lostItems).toHaveLength(0);
    for (const id of ids) expect(p.inventory.some((e) => e.id === id)).toBe(true);
  });
});
