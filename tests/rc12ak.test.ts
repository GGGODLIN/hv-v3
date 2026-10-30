import { describe, it, expect } from 'vitest';
import { RUN12AK, bossAtk12ak } from '../src/core/cp8';
// rc12ak（自訂）: 深層首領攻擊 ×2.5（F45+）
describe('rc12ak boss atk', () => {
  it('F45+ ×2.5，F44 與無流派 ×1', () => {
    expect(RUN12AK.bossAtkFrom).toBe(45);
    for (const l of ['blade', 'bulwark', 'oc', 'arcane'] as const) { expect(bossAtk12ak(45, l)).toBe(2.5); expect(bossAtk12ak(44, l)).toBe(1); }
    expect(bossAtk12ak(80, undefined as never)).toBe(1);
  });
});
