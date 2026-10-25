import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makePool, plWindow, widenLog, type MonsterRow } from '../src/core/monsters';
import { floorPl } from '../src/core/tower';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const row = (pl: number): MonsterRow => [pl, 'beast', 'm' + pl, pl, 'crushing', 'x', 0, 0, 0, 0, 0, 0, 0, 0, 0] as unknown as MonsterRow;

describe('PL window (design §4)', () => {
  it('uses ±15% when the window has monsters', () => {
    const w = plWindow(makePool([row(95), row(100), row(200)]), 100);
    expect(w).toEqual({ lo: 85, hi: 115, width: 0.15 });
  });
  it('widens to ±25% then ±40% when empty', () => {
    expect(plWindow(makePool([row(78), row(300)]), 100).width).toBe(0.25);
    expect(plWindow(makePool([row(62), row(300)]), 100).width).toBe(0.4);
    const n = widenLog.length;
    expect(plWindow(makePool([row(300)]), 100).width).toBe(-1);
    expect(widenLog.length).toBe(n + 1);
  });
  it('real pool: every trial-tower floor has monsters at some width', () => {
    for (let f = 1; f <= 10; f++) expect(plWindow(pool, floorPl(f)).width).not.toBe(-1);
  });
});

import { MIN_PL, pickTop, buildMonster } from '../src/core/monsters';
import { Rng } from '../src/core/rng';
describe('elite/boss pick (design §4) and PL floor', () => {
  it('pickTop only returns the top 10% PL of the window', () => {
    const p = makePool(Array.from({ length: 30 }, (_, i) => row(85 + i)));
    const rng = new Rng(1);
    for (let i = 0; i < 500; i++) expect(pickTop(rng, p, 85, 114)[3]).toBeGreaterThanOrEqual(112);
  });
  it('pickTop on a tiny window still returns the highest row', () => {
    expect(pickTop(new Rng(2), makePool([row(90), row(110)]), 85, 115)[3]).toBe(110);
  });
  it('real pool: elites/bosses on every floor sit in the window top 10%', () => {
    const rng = new Rng(5);
    for (let f = 1; f <= 10; f++) {
      const w = plWindow(pool, floorPl(f));
      const inWin = pool.rows.filter((r) => r[3] >= w.lo && r[3] <= w.hi).map((r) => r[3]);
      const cut = inWin[inWin.length - Math.max(1, Math.ceil(inWin.length * 0.1))]!;
      for (let i = 0; i < 50; i++) expect(pickTop(rng, pool, w.lo, w.hi)[3]).toBeGreaterThanOrEqual(cut);
    }
  });
  it('HP multipliers: elite x2.5, boss x2.5 (CP2 暫定)', () => {
    const r = pool.rows[50]!;
    const n = buildMonster(r, 10, 'normal').maxHp;
    expect(buildMonster(r, 10, 'elite').maxHp / n).toBeCloseTo(2.5, 1);
    expect(buildMonster(r, 10, 'boss').maxHp / n).toBeCloseTo(2.5, 1);
  });
  it('PL window never drops below 25', () => {
    expect(MIN_PL).toBe(25);
    const w = plWindow(makePool([row(25), row(30)]), 20);
    expect(w.lo).toBeGreaterThanOrEqual(25);
    expect(w.hi).toBeGreaterThanOrEqual(25);
  });
});
