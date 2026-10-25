import { describe, expect, it } from 'vitest';
import { adbFromAttrs, attrCost, baseHp, expForLevel, levelForExp, monsterExp, monsterAvoid } from '../src/core/formulas';

describe('formulas', () => {
  it('EXP curve: level 2 needs 99, monotonic, inverse works', () => {
    expect(expForLevel(1)).toBe(0);
    expect(expForLevel(2)).toBe(99);
    for (let L = 2; L < 100; L++) expect(expForLevel(L + 1)).toBeGreaterThan(expForLevel(L));
    expect(levelForExp(98)).toBe(1);
    expect(levelForExp(99)).toBe(2);
    expect(levelForExp(expForLevel(37))).toBe(37);
  });
  it('attribute cost: 0 is free and strictly increasing marginal cost', () => {
    expect(attrCost(0)).toBe(0);
    let prev = 0;
    for (let s = 1; s < 50; s++) {
      const m = attrCost(s) - attrCost(s - 1);
      expect(m).toBeGreaterThan(prev);
      prev = m;
    }
  });
  it('vitals and ADB', () => {
    expect(baseHp(10, 20)).toBe(500 + 100 + 120);
    expect(adbFromAttrs(0, 0)).toBeCloseTo(9.8, 0);
    expect(adbFromAttrs(0, 0, true)).toBeCloseTo(0, 1);
    expect(adbFromAttrs(50, 0)).toBeGreaterThan(adbFromAttrs(0, 50));
  });
  it('monster EXP and avoidance cap', () => {
    expect(monsterExp(1, 0)).toBe(Math.ceil(3 + 1 / 6));
    expect(monsterAvoid(5000, 10)).toBe(0.1);
    expect(monsterAvoid(5, 10)).toBe(0);
  });
});
