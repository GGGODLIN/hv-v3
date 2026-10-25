import { describe, expect, it } from 'vitest';
import { forcedTriple, generateTower, TOWER, floorPl } from '../src/core/tower';
import { Rng } from '../src/core/rng';

describe('tower', () => {
  it('10 floors, bosses on 5/10, rest on 4/9, no route forced into the same type 3x', () => {
    for (let s = 1; s < 300; s++) {
      const t = generateTower(new Rng(s));
      expect(t.floors).toHaveLength(TOWER.floors);
      expect(t.floors[4]!.options).toEqual(['boss']);
      expect(t.floors[9]!.options).toEqual(['boss']);
      expect(t.floors[3]!.options).toContain('rest');
      expect(t.floors[8]!.options).toContain('rest');
      expect(t.floors[0]!.options).not.toContain('elite');
      for (const f of t.floors) expect(new Set(f.options).size).toBe(f.options.length);
      expect(forcedTriple(t)).toBe(false);
      // Exhaustive: for every route, any two same-type picks in a row leave a different option next floor (boss floors excepted).
      for (let n = 2; n < t.floors.length; n++) {
        const cur = t.floors[n]!.options;
        if (cur[0] === 'boss') continue;
        for (const x of t.floors[n - 1]!.options) if (t.floors[n - 2]!.options.includes(x)) expect(cur.some((o) => o !== x)).toBe(true);
      }
    }
  });
  it('forcedTriple detects a forced repeat (rest counts)', () => {
    const mk = (o: string[][]) => ({ floors: o.map((options, i) => ({ n: i + 1, options: options as never })) });
    expect(forcedTriple(mk([['rest', 'battle'], ['rest', 'chest'], ['rest']]))).toBe(true);
    expect(forcedTriple(mk([['rest', 'battle'], ['rest', 'chest'], ['rest', 'shrine']]))).toBe(false);
  });
  it('weights and PL follow design §2', () => {
    expect(Object.fromEntries(TOWER.weights)).toEqual({ battle: 45, elite: 12, chest: 10, merchant: 10, rest: 13, shrine: 10 });
    const c = (f: number) => (floorPl(f)[0] + floorPl(f)[1]) / 2;
    expect(c(10) / c(1)).toBeCloseTo(1.8 / 1.08, 1);
  });
  it('all six node types appear', () => {
    const seen = new Set<string>();
    for (let s = 1; s < 50; s++) generateTower(new Rng(s)).floors.forEach((f) => f.options.forEach((o) => seen.add(o)));
    for (const t of ['battle', 'elite', 'chest', 'merchant', 'rest', 'shrine', 'boss']) expect(seen.has(t)).toBe(true);
  });
});
