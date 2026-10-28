// rc12l 製作人（自訂）: oc boss HP ×1 F30–65 (rc12j 0.8 removed for oc only); arcane unchanged.
import { describe, expect, it } from 'vitest';
import { aoBossHp12j } from '../src/core/cp8';
describe('rc12l oc boss HP', () => {
  it('oc ×1 F30–100, arcane keeps ×0.8 F30–65', () => {
    for (const f of [30, 50, 65, 80, 100]) expect(aoBossHp12j(f, 'oc')).toBeCloseTo(1);
    expect(aoBossHp12j(50, 'arcane')).toBeCloseTo(0.8); expect(aoBossHp12j(100, 'arcane')).toBeCloseTo(1);
  });
});
import { ocDmg12l, ocPlain12l } from '../src/core/cp8';
describe('rc12l oc F70+ damage (自訂)', () => {
  it('×1 before F70, ramps to ×1.5 at F100; plain raised F70+', () => {
    expect(ocDmg12l(50)).toBe(1); expect(ocDmg12l(69)).toBe(1);
    expect(ocDmg12l(100)).toBeCloseTo(1.5); expect(ocDmg12l(85)).toBeGreaterThan(1);
    expect(ocPlain12l(50)).toBeUndefined(); expect(ocPlain12l(100)).toBeCloseTo(0.3);
  });
});
