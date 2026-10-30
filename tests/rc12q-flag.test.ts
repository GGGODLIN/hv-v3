import { describe, it, expect } from 'vitest';
import { RUN12Q, blade12q, bladeBossHp12q, mob12m, RUN12M } from '../src/core/cp8';
// rc12q CANDIDATE（自訂）: the blade flag is OFF by default, so bot/grok behaves exactly like rc12p.
describe('rc12q blade flag', () => {
  it('is off by default and touches nothing', () => {
    expect(RUN12Q.on).toBe(false);
    expect(blade12q('blade')).toBe(false);
    for (const F of [30, 50, 70, 100]) expect(bladeBossHp12q(F, 'blade')).toBe(1);
    const from = RUN12M.mobFrom, f = (F: number) => (F <= from ? 1 : 1 + (4 - 1) /* rc12ak blade mobHp 4（自訂；rc12af 6） */ /* rc12af blade mobHp 6（自訂；rc12ae 14） */ /* rc12ae 調整1 blade mobHp 14（自訂；rc12ad 23） */ * Math.min(1, (F - from) / (100 - from)));
    if (RUN12M.on) for (const F of [31, 45, 60, 100]) expect(mob12m(F, 'blade', 'mobHp')).toBeCloseTo(f(F), 9);
  });
});
