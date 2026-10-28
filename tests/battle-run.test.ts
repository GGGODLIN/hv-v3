import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, canUse, startBattle } from '../src/core/battle';
import { autoRun, chooseAction, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer, allocate, unspentExp } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { expForLevel } from '../src/core/formulas';
import { settle, startRun } from '../src/core/run';
import { generateEquip } from '../src/core/items';
import { deserialize, serialize, SAVE_VERSION } from '../src/core/save';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);

describe('battle', () => {
  it('skills need OC; spirit stance needs 50 OC', () => {
    const p = newPlayer(); starterKit(p);
    const d = derive(p);
    const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [buildMonster(pool.rows[0]!, 1)], p.potions);
    b.oc = 0;
    expect(canUse(b, { kind: 'skill', id: 'shieldBash', target: 0 })).toBe(false);
    expect(canUse(b, { kind: 'spirit' })).toBe(false);
    b.oc = 60;
    expect(canUse(b, { kind: 'skill', id: 'shieldBash', target: 0 })).toBe(true);
    expect(canUse(b, { kind: 'spirit' })).toBe(true);
  });
  it('headless battles terminate and a geared character usually wins floor-1 fights', () => {
    const rng = new Rng(21);
    const p = newPlayer(); starterKit(p);
    let wins = 0;
    for (let i = 0; i < 100; i++) {
      const d = derive(p);
      const ms = [0, 1].map(() => buildMonster(pool.rows[rng.int(0, 400)]!, 1));
      const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 1, mana: 0, spirit: 0 });
      while (!b.over && b.turn < 500) act(b, chooseAction(b), rng);
      expect(b.over).not.toBeNull();
      if (b.over === 'win') wins++;
    }
    expect(wins).toBeGreaterThan(80);
  });
  it('allocation respects the EXP budget', () => {
    const p = newPlayer();
    p.exp = expForLevel(5);
    while (allocate(p, 'str')) {}
    expect(unspentExp(p)).toBeGreaterThanOrEqual(0);
    expect(p.attrs.str).toBeGreaterThan(5);
  });
});

describe('run + save', () => {
  it('death keeps 50% EXP/credits, best single item, never equipped gear, loses potions', () => {
    const p = newPlayer(); starterKit(p);
    const eq = p.equipped.mainHand!.id;
    const run = startRun(p, 5);
    const rng = new Rng(1);
    run.exp = 1000; run.credits = 400;
    run.bag = [generateEquip(rng, 5, { quality: 'crude' }), generateEquip(rng, 5, { quality: 'superior' }), generateEquip(rng, 5, { quality: 'fair' })];
    run.done = 'dead';
    run.trip = 3; // CP3-fix 3: carry-back multiplier x2 from trip 3
    const s = settle(p, run);
    expect(s.exp).toBe(1000 * 0.5 * 2);
    expect(s.credits).toBe(400 * 0.5 * 2);
    expect(s.kept).toHaveLength(1);
    expect(s.kept[0]!.quality).toBe('superior');
    expect(p.equipped.mainHand!.id).toBe(eq);
    expect(p.potions.health).toBe(0);
  });
  it('clear keeps 100%', () => {
    const p = newPlayer();
    const run = startRun(p, 6);
    run.exp = 300; run.credits = 50; run.done = 'clear';
    run.bag = [generateEquip(new Rng(2), 3), generateEquip(new Rng(3), 3)];
    run.trip = 3; // CP3-fix 3: carry-back multiplier x2 from trip 3
    const s = settle(p, run);
    expect(s.exp).toBe(300 * 2);
    expect(p.inventory).toHaveLength(2);
  });
  it('save round-trips', () => {
    const p = newPlayer(); starterKit(p);
    const run = startRun(p, 9);
    const data = { v: SAVE_VERSION, player: p, run, settings: { speed: 2 as const, skipAnim: false }, stats: { runs: 3, bestFloor: 7, clears: 0 } };
    expect(deserialize(serialize(data))).toEqual(data);
    expect(deserialize('garbage')).toBeNull();
    expect(deserialize(JSON.stringify({ ...data, v: 0 }))).toBeNull();
  });
  // rc12e (same root cause as the cp3 acceptance flake): 16 seeded runs that each build on the previous run's save, so they cannot be
  // split or memoized; ~2.5 s alone, 4.8 s under full-suite load vs the 5 s default. Deterministic → an explicit 30 s budget.
  it('simulation: later runs reach at least as deep and clear within 16 runs', () => {
    const p = newPlayer(); starterKit(p, 3);
    const floors: number[] = [];
    for (let i = 0; i < 16; i++) floors.push(autoRun(p, pool, 3000 + i).floorReached);
    const first = (floors[0]! + floors[1]! + floors[2]!) / 3;
    const last = (floors[13]! + floors[14]! + floors[15]!) / 3;
    expect(last).toBeGreaterThanOrEqual(first);
    expect(floors.some((f) => f > 10)).toBe(true);
    expect(derive(p).level).toBeGreaterThan(5);
  }, 30000);
});
