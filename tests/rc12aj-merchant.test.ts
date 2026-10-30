import { describe, it, expect } from 'vitest';
import { merchantHp, MERCHANT_HP_POTIONS, MERCHANT_HP_POTIONS_DEEP, MERCHANT_HP_DEEP_FROM, type RunState } from '../src/core/run';
// rc12aj（自訂，非原版）: 深淵 F45+ 商人每位賣 2 瓶生命藥水；之前 1 瓶
describe('rc12aj merchant deep potions', () => {
  const at = (d: number) => ({ floor: 1, abyss: { start: d } }) as unknown as RunState;
  // rc12ak（自訂）: 深層 2 瓶商人預設關閉（DEEP_FROM 999，SIM_MERCHFROM 可開）
  it('rc12ak 預設全程 1 瓶', () => {
    expect(MERCHANT_HP_DEEP_FROM).toBe(999); expect(MERCHANT_HP_POTIONS_DEEP).toBe(2);
    expect(merchantHp(at(44))).toBe(MERCHANT_HP_POTIONS); expect(merchantHp(at(45))).toBe(MERCHANT_HP_POTIONS); expect(merchantHp(at(80))).toBe(MERCHANT_HP_POTIONS);
  });
});
