import { describe, it, expect } from 'vitest';
import { RUN12AG, mob12ag, boss12ag } from '../src/core/cp8';
describe('rc12ag 調參', () => {
  it('mob12ag：F55 前為 1，F75 達 mobK', () => {
    expect(mob12ag(50, 'oc')).toBe(1);
    expect(mob12ag(75, 'oc')).toBeCloseTo(RUN12AG.mobK.oc);
    expect(mob12ag(75, 'arcane')).toBe(1);
  });
  it('boss12ag 只作用 F45–69', () => {
    expect(boss12ag(40, 'blade')).toBe(1);
    expect(boss12ag(50, 'blade')).toBeCloseTo(RUN12AG.bossK.blade);
    expect(boss12ag(70, 'blade')).toBe(1);
  });
  it('oc 前段首領藥水關閉', () => { expect(RUN12AG.potEarly.oc).toBe(0); expect(RUN12AG.potEarly.blade).toBe(1); });
});
