import { describe, expect, it } from 'vitest';
import { deep12g, bwBossHp12i } from '../src/core/cp8';
// rc12i（自訂）: blade deep curve is HP-only stronger (k 4, hp ×1.5 → F100 HP ×7, dmg still ×5); bulwark boss-HP knob defaults off.
describe('rc12i curve', () => {
  it('blade: F100 HP ×7, dmg ×5', () => { expect(deep12g(100, 'hp', 'blade')).toBeCloseTo(7); expect(deep12g(100, 'dmg', 'blade')).toBeCloseTo(5); });
  it('arcane / oc unchanged (0)', () => { for (const l of ['arcane', 'oc']) { expect(deep12g(100, 'hp', l)).toBe(1); expect(deep12g(100, 'dmg', l)).toBe(1); } });
  it('bulwark boss HP knob off by default', () => { for (const f of [30, 50, 65, 80, 100]) expect(bwBossHp12i(f)).toBe(1); });
});
