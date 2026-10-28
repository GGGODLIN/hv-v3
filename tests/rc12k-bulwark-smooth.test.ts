// rc12k item 1（製作人，自訂）: bulwark boss HP rises smoothly after F65 — no F65→F70 step larger than any later 5-floor step.
import { describe, expect, it } from 'vitest';
import { bwBossHp12i } from '../src/core/cp8';
describe('rc12k bulwark boss HP smooth after F65', () => {
  it('equal ratio per 5 floors F65→F100, endpoints unchanged', () => {
    expect(bwBossHp12i(65)).toBeCloseTo(0.2); expect(bwBossHp12i(100)).toBeCloseTo(2.5);
    const r = [65, 70, 75, 80, 85, 90, 95].map((f) => bwBossHp12i(f + 5) / bwBossHp12i(f));
    for (const x of r) expect(x).toBeCloseTo(r[0]!, 6); expect(r[0]!).toBeLessThan(1.5);
  });
});
