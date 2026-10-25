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
