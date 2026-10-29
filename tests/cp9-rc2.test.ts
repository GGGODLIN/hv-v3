// cp9 rc2（自訂，暫定）: producer decisions — ocCarry on, per-floor boss HP curve, blade skill OC −30%.
import { describe, it, expect } from 'vitest';
import { CP9, bossHp9 } from '../src/core/cp8';
describe('cp9 rc2 defaults', () => {
  it('ocCarry on, blade OC cut within the 30% cap', () => { expect(CP9.ocCarry).toBe(1); expect(CP9.bladeOc).toBeGreaterThanOrEqual(0.7); expect(CP9.bladeOc).toBeLessThanOrEqual(1); /* rc12ae 調整1（自訂）: blade OC 成本 0.7→1（不再折扣） */ });
  it('boss HP curve: floor 5 ×3, peak at 15, ×1 from floor 25', () => {
    expect(bossHp9(5)).toBe(3); expect(bossHp9(15)).toBe(4.5); expect(bossHp9(25)).toBe(1.5); expect(bossHp9(30)).toBe(1.5); /* cp9-rc7（自訂）: 2 → 1.5 */ /* cp9-rc5 (3)（自訂）: boss30 1 → 2 */
    expect(bossHp9(10)).toBeCloseTo(3.75); expect(bossHp9(20)).toBeCloseTo(3) /* cp9-rc5 (3) */;
  });
});
