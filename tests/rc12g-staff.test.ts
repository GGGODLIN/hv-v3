import { describe, it, expect } from 'vitest';
import { quickAttack, coalesced9, STAFF_BLOW_ON_CM } from '../src/core/battle';
import { RULES } from '../src/core/run';
import { CP8 } from '../src/core/cp8';
describe('rc12g staff: A on a coalesced target is an Arcane Blow', () => {
  it('quick spell normally, attack when coalesced', () => {
    RULES.cp8 = true;
    const s: any = { d: { style: 'staff', mp: 1000 }, mp: 999, monsters: [{ hp: 10 }], cm9: [0], locked: new Set() };
    const a0 = quickAttack(s, 0);
    if (CP8.staffQuickSpell) expect(a0.kind === 'spell' || a0.kind === 'attack').toBe(true);
    s.cm9 = [3]; expect(coalesced9(s, 0)).toBe(true);
    expect(STAFF_BLOW_ON_CM).toBe(true);
    expect(quickAttack(s, 0).kind).toBe(a0.kind); // MP high → same as uncoalesced
    s.mp = 100; expect(quickAttack(s, 0).kind).toBe('attack');
  });
});
import { leanAllows } from '../src/core/cp7';
describe('rc12g school weapon lock', () => {
  it('arcane never takes a non-staff main hand / bulwark keeps 1H+shield', () => {
    RULES.cp8 = true;
    const ar: any = { lean: 'arcane', equipped: {} }, bw: any = { lean: 'bulwark', equipped: {} };
    expect(leanAllows(ar, { slot: 'mainHand', group: 'oneHand' } as any)).toBe(false);
    expect(leanAllows(ar, { slot: 'mainHand', group: 'staff' } as any)).toBe(true);
    expect(leanAllows(ar, { slot: 'offHand', group: 'shield' } as any)).toBe(false);
    expect(leanAllows(bw, { slot: 'mainHand', group: 'twoHand' } as any)).toBe(false);
    expect(leanAllows(bw, { slot: 'offHand', group: 'shield' } as any)).toBe(true);
  });
});
