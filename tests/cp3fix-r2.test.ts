import { describe, expect, it } from 'vitest';
import { RULES, monsterLevel, type RunState } from '../src/core/run';
import { floorLevel } from '../src/core/tower';

describe('CP3-bugfix 4: monster level follows player level (暫定)', () => {
  const run = (floor: number, plv: number) => ({ floor, plv }) as RunState;
  it('no change at or below the free level', () => {
    expect(monsterLevel(run(5, RULES.monLvFollow.free))).toBe(floorLevel(5));
    expect(monsterLevel(run(5, 1))).toBe(floorLevel(5));
  });
  it('rises with player level', () => {
    expect(monsterLevel(run(5, 9))).toBe(floorLevel(5) + Math.round(0.8 * 5));
    expect(monsterLevel(run(5, 12))).toBeGreaterThan(monsterLevel(run(5, 9)));
  });
});

import { readFileSync } from 'node:fs';
import { badName, cleanRow, neutralName } from '../src/core/names';
import { makePool, type MonsterRow } from '../src/core/monsters';
describe('CP3-bugfix 2: monster name filter', () => {
  it('flags the reported names and gibberish, keeps normal ones', () => {
    for (const n of ['Hypnotizedneiborpregnantmilf', 'New Wife New Life', 'Big Milf', 'Bqwbqw', '123123423412344234']) expect(badName(n)).not.toBeNull();
    for (const n of ['Touyama Nao', 'Iron Breastplate', 'Hypnos', 'Fire Drake', 'Peacock']) expect(badName(n)).toBeNull();
  });
  it('neutral name from race, stats kept', () => {
    const row = [7, 'Dragonkin', 'Big Milf', 100, 'Slashing', 'x', 0, 1, 2, 3, 4, 5, 6, 7, 8] as unknown as MonsterRow;
    const c = cleanRow(row);
    expect(c[2]).toBe(neutralName('Dragonkin', 7));
    expect(c[2]).toMatch(/Drake/);
    expect(c.slice(3)).toEqual(row.slice(3));
  });
  it('no flagged name survives in the real pool', () => {
    const rows = JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[];
    const pool = makePool(rows);
    expect(pool.rows.filter((r) => badName(r[2])).length).toBe(0);
  });
});

import { fmtChange } from '../src/game/text';
import { effectiveStats, type Equip } from '../src/core/items';
describe('CP3-bugfix 7: upgrade preview shows the real change', () => {
  it('evade 0.6 -> 0.624 is not shown as 0.6 -> 0.6', () => {
    const [a, b] = fmtChange('evade', 0.6, 0.624);
    expect(a).not.toBe(b);
    expect(b).toBe('+0.62%');
  });
  it('rapier attack damage grows +4% per IW level', () => {
    const e = { stats: { attackDamage: 23.37, burden: 11.38 }, iw: 0 } as unknown as Equip;
    const s = effectiveStats({ ...e, iw: 1 });
    expect(s.attackDamage).toBeCloseTo(24.3, 1);
    expect(s.burden).toBe(11.38);
  });
});
