import { describe, expect, it } from 'vitest';
import { DEEP12G, deep12g, bwBossHp12i } from '../src/core/cp8';
import { RUN12O as RUN12O_T } from '../src/core/cp8';
import { afterAll as afterAll_T, beforeAll as beforeAll_T } from 'vitest';
// rc12o: these pin the rc12n RUN12M table (rc12o layer off here; rc12o values in tests/rc12o.test.ts)
beforeAll_T(() => { RUN12O_T.on = false; }); afterAll_T(() => { RUN12O_T.on = true; });
// rc12i（自訂）: blade deep curve is HP-only stronger (k 4, hp ×1.5 → F100 HP ×7, dmg still ×5); bulwark boss-HP knob defaults off.
describe('rc12i curve', () => {
  it('blade: F100 HP ×1.6, dmg ×13 (rc12k r2)', () => { expect(deep12g(100, 'hp', 'blade')).toBeCloseTo(1.6); expect(deep12g(100, 'dmg', 'blade')).toBeCloseTo(13); });
  it('arcane / oc unchanged (0)', () => { for (const l of ['arcane'] /* rc12m: oc deepK 1 */) { expect(deep12g(100, 'hp', l)).toBe(1); expect(deep12g(100, 'dmg', l)).toBe(1); } });
  it('bulwark boss HP: ×1 <F30, ×0.3 F30–65 (rc12t), → ×0.3 (rc12k r2) at F100（方案 b）; output / cap knobs off', () => { expect(bwBossHp12i(29)).toBe(1); expect(bwBossHp12i(30)).toBeCloseTo(0.5); expect(bwBossHp12i(65)).toBeCloseTo(0.5); expect(bwBossHp12i(100)).toBeCloseTo(0.3) /* rc12u（自訂）: 0.3→0.5 */; expect(DEEP12G.bwOut).toBe(1); expect(DEEP12G.bwCap).toBe(1); });
});
