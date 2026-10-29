import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { RUN12Y } from '../src/core/cp8';
// rc12y 候選（自訂）: oc F45–65 首領戰不帶小怪；其他流派、其他樓層不變.
describe('rc12y oc solo boss', () => {
  it('defaults and gate', () => {
    expect(RUN12Y).toEqual({ ocSolo: 1, ocSoloFrom: 45, ocSoloTo: 65 });
    const src = readFileSync('src/core/run.ts', 'utf8');
    expect(src).toContain("lean === 'oc' && RUN12Y.ocSolo && ab >= RUN12Y.ocSoloFrom && ab <= RUN12Y.ocSoloTo ? ['boss']");
  });
});
