import { describe, it, expect } from 'vitest';
import { RUN12AF, bladeBoss12af, r12m } from '../src/core/cp8';
// rc12af（自訂）: blade 首領 HP 係數（F30–65，F70 回到 ×1）與 blade 勝利回血倍率
describe('rc12af blade boss HP / heal', () => {
  it('blade-only boss HP factor F30–65, fades back to ×1 by F70', () => {
    expect(RUN12AF.bladeBossHp).toBe(0.5);
    expect(bladeBoss12af(29, 'blade')).toBe(1);
    for (const F of [30, 45, 60, 65]) expect(bladeBoss12af(F, 'blade')).toBe(0.5);
    expect(bladeBoss12af(67.5, 'blade')).toBeCloseTo(0.75);
    for (const F of [70, 100]) expect(bladeBoss12af(F, 'blade')).toBe(1);
    for (const sc of ['oc', 'arcane', 'bulwark']) expect(bladeBoss12af(60, sc)).toBe(1);
  });
  it('tuned constants', () => {
    expect(RUN12AF.bladeHeal).toBe(0.27);
    expect(r12m('blade', 'mobHp')).toBe(6);
    expect(r12m('blade', 'bossHp70')).toBe(1);
  });
});
