import { describe, it, expect } from 'vitest';
import { deep12g, plainAt12h, potCdAt12h, deepK12g, CP9 } from '../src/core/cp8';
describe('rc12h bulwark deep curve（自訂）', () => {
  it('bulwark HP grows little, potion pressure and plain cap ramp to F100', () => {
    expect(deep12g(100, 'hp', 'bulwark')).toBeCloseTo(1 + 7 * 0.05, 5);
    expect(deep12g(40, 'hp', 'bulwark')).toBe(1);
    expect(potCdAt12h(40, 'bulwark')).toBe(0);
    expect(potCdAt12h(100, 'bulwark')).toBe(6); expect(potCdAt12h(75, 'bulwark')).toBe(4); // rc12k item 1: cap +6（自訂）
    expect(plainAt12h(100, 'bulwark')).toBeLessThanOrEqual(CP9.bossAtk);
    expect(plainAt12h(40, 'bulwark')).toBeCloseTo(CP9.bossPlain, 5);
  });
  it('arcane / oc stay at 0, blade unchanged', () => {
    expect(deepK12g('arcane')).toBe(0); expect(deepK12g('oc')).toBe(0); expect(deepK12g('blade')).toBe(4);
    expect(deep12g(100, 'hp', 'blade')).toBeCloseTo(7); // rc12i: blade hpS 1.5（自訂）
    expect(potCdAt12h(100, 'arcane')).toBe(0); expect(plainAt12h(100, 'oc')).toBeUndefined();
  });
});
