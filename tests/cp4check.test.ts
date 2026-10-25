import { describe, expect, it } from 'vitest';
import { cp4UsageCheck } from '../src/core/cp4check';

describe('CP4 usage rule (rc4)', () => {
  const sets = [['B1', 'B2'], ['B1', 'B2'], ['B1', 'B2'], ['B1', 'B2'], ['B1', 'B3']];
  it('core buff uncapped; non-core at exactly 80% passes, above fails', () => {
    expect(cp4UsageCheck(sets, {}, {}, null)).toEqual({ pass: true, over: [], dead: [] });
    const r = cp4UsageCheck([...sets, ['B2']], {}, {}, null);
    expect(r.pass).toBe(false); expect(r.over).toEqual(['B2:83%']);
  });
  it('own-school pick rate below 5% fails, other schools ignored', () => {
    const r = cp4UsageCheck([], { B4: 1, O2: 0 }, { B4: 30, O2: 30 }, 'blade');
    expect(r.dead).toEqual(['B4']); expect(r.pass).toBe(false);
    expect(cp4UsageCheck([], { B4: 2 }, { B4: 30 }, 'blade').pass).toBe(true);
  });
});
