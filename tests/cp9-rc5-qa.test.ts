// cp9-rc5 QA（自訂，暫定）: bug 1 「428 ≥ 700」 lethal line; bug 2 unrounded estimates.
import { describe, it, expect } from 'vitest';
import { isLethal } from '../src/core/battle';
import { urgentLine } from '../src/game/app';

describe('cp9-rc5 QA bug 1: lethal claim matches its numbers', () => {
  it('isLethal compares the printed (rounded) values', () => {
    expect(isLethal(428, 700)).toBe(false); expect(isLethal(700, 700)).toBe(true);
    expect(isLethal(699.6, 699.7)).toBe(true); // both print 700
    expect(isLethal(699.4, 699.6)).toBe(false);
  });
  it('urgentLine never prints 「≥ 目前 HP」 when est < HP', () => {
    const t = urgentLine({ est: 428, hp: 700 });
    expect(t).not.toContain('≥ 目前 HP'); expect(t).toContain('428 < 目前 HP 700');
    expect(urgentLine({ est: 712, hp: 700 })).toContain('（712 ≥ 700）');
  });
});
describe('cp9-rc5 QA bug 2: integers only', () => {
  it('urgentLine rounds a float estimate', () => {
    const t = urgentLine({ est: 244.79999999999998, hp: 204.2 });
    expect(t).toContain('245 ≥ 204'); expect(t).not.toMatch(/\d\.\d/);
  });
});
