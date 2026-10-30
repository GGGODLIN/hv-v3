import { describe, expect, it } from 'vitest';
import { bossHp12al, RUN12AL, RUN12M } from '../src/core/cp8';
import { bossPot12p } from '../src/core/run';
describe('rc12al（自訂）boss HP ramp / cal / caps', () => {
  it('game cal = 1 (sim-only knob)', () => { for (const s of ['blade', 'bulwark', 'oc', 'arcane']) expect(RUN12AL.cal[s]).toBe(1); });
  it('F44 ×1; F45 = hp45; F55 midpoint; F65–69 = hp65; F70+ = deep; no lean ×1', () => {
    expect(bossHp12al(44, 'blade')).toBe(1); expect(bossHp12al(45, 'blade')).toBe(2.2); expect(bossHp12al(55, 'blade')).toBeCloseTo(1.7);
    expect(bossHp12al(69, 'bulwark')).toBe(0.75); expect(bossHp12al(70, 'arcane')).toBe(1.5); expect(bossHp12al(90, 'oc')).toBe(1); expect(bossHp12al(60, null)).toBe(1);
  });
  it('single hit cap 0.35; boss +1 potion every boss F25–100', () => { expect(RUN12M.hit).toBe(0.35); expect(bossPot12p(25)).toBe(1); expect(bossPot12p(95)).toBe(1); });
});
