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
