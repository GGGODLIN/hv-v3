import { describe, expect, it } from 'vitest';
import { DEEP12G, deep12g, bwBossHp12i } from '../src/core/cp8';
// rc12i（自訂）: blade deep curve is HP-only stronger (k 4, hp ×1.5 → F100 HP ×7, dmg still ×5); bulwark boss-HP knob defaults off.
describe('rc12i curve', () => {
  it('blade: F100 HP ×4, dmg ×13 (rc12k)', () => { expect(deep12g(100, 'hp', 'blade')).toBeCloseTo(4); expect(deep12g(100, 'dmg', 'blade')).toBeCloseTo(13); });
  it('arcane / oc unchanged (0)', () => { for (const l of ['arcane', 'oc']) { expect(deep12g(100, 'hp', l)).toBe(1); expect(deep12g(100, 'dmg', l)).toBe(1); } });
  it('bulwark boss HP: ×1 <F30, ×0.2 F30–65, → ×2.5 at F100（方案 b）; output / cap knobs off', () => { expect(bwBossHp12i(29)).toBe(1); expect(bwBossHp12i(30)).toBeCloseTo(0.2); expect(bwBossHp12i(65)).toBeCloseTo(0.2); expect(bwBossHp12i(100)).toBeCloseTo(2.5); expect(DEEP12G.bwOut).toBe(1); expect(DEEP12G.bwCap).toBe(1); });
});
