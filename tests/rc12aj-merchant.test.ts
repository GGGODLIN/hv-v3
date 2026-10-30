import { describe, it, expect } from 'vitest';
import { merchantHp, MERCHANT_HP_POTIONS, MERCHANT_HP_POTIONS_DEEP, MERCHANT_HP_DEEP_FROM, type RunState } from '../src/core/run';
// rc12aj（自訂，非原版）: 深淵 F45+ 商人每位賣 2 瓶生命藥水；之前 1 瓶
describe('rc12aj merchant deep potions', () => {
  const at = (d: number) => ({ floor: 1, abyss: { start: d } }) as unknown as RunState;
  it('F44 1 瓶、F45+ 2 瓶', () => {
    expect(MERCHANT_HP_DEEP_FROM).toBe(45); expect(MERCHANT_HP_POTIONS_DEEP).toBe(2);
    expect(merchantHp(at(44))).toBe(MERCHANT_HP_POTIONS); expect(merchantHp(at(45))).toBe(2); expect(merchantHp(at(80))).toBe(2);
  });
});
