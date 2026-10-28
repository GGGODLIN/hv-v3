// rc12m 候選（自訂）: oc run-wide pressure is behind OC12M.on, OFF by default (rc12l behaviour unchanged).
import { describe, expect, it } from 'vitest';
import { OC12M, ocMob12m, ocRest12m, ocPotDrop12m, deepK12g } from '../src/core/cp8';
describe('rc12m OC12M flag', () => {
  it('is off by default and every oc lever is ×1 / k 0', () => {
    expect(OC12M.on).toBe(false);
    for (const f of [30, 60, 100]) { expect(ocMob12m(f, 'mobHp')).toBe(1); expect(ocMob12m(f, 'mobDmg')).toBe(1); }
    expect(ocRest12m('oc')).toBe(1); expect(ocPotDrop12m('oc')).toBe(1); expect(deepK12g('oc')).toBe(0);
  });
  it('candidate values (for rc12m) are the measured ones', () => {
    expect(OC12M).toMatchObject({ mobFrom: 30, mobHp: 2, mobDmg: 2, rest: 1, potDrop: 1, deepK: 1, hit: 0.4 });
  });
});
