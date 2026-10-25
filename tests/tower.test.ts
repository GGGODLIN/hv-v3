import { describe, expect, it } from 'vitest';
import { generateTower, TOWER } from '../src/core/tower';
import { Rng } from '../src/core/rng';

describe('tower', () => {
  it('10 floors, bosses on 5/10, rest on 4/9, no lane repeats 3x', () => {
    for (let s = 1; s < 300; s++) {
      const t = generateTower(new Rng(s));
      expect(t.floors).toHaveLength(TOWER.floors);
      expect(t.floors[4]!.options).toEqual(['boss']);
      expect(t.floors[9]!.options).toEqual(['boss']);
      expect(t.floors[3]!.options).toContain('rest');
      expect(t.floors[8]!.options).toContain('rest');
      expect(t.floors[0]!.options).not.toContain('elite');
      for (const f of t.floors) expect(new Set(f.options).size).toBe(f.options.length);
      for (let n = 2; n < t.floors.length; n++) {
        for (let lane = 0; lane < 3; lane++) {
          const a = t.floors[n]!.options[lane], b = t.floors[n - 1]!.options[lane], c = t.floors[n - 2]!.options[lane];
          if (a && a !== 'rest') expect(a === b && b === c).toBe(false);
        }
      }
    }
  });
  it('all six node types appear', () => {
    const seen = new Set<string>();
    for (let s = 1; s < 50; s++) generateTower(new Rng(s)).floors.forEach((f) => f.options.forEach((o) => seen.add(o)));
    for (const t of ['battle', 'elite', 'chest', 'merchant', 'rest', 'shrine', 'boss']) expect(seen.has(t)).toBe(true);
  });
});
