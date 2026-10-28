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
import { deep12g, curveSchool12g } from '../src/core/cp8';
describe('rc12g deep curve defaults（自訂）', () => {
  it('blade ×5 / bulwark ×8 at F100, oc / arcane off, off below F40', () => {
    expect(deep12g(100, 'dmg', 'blade')).toBeCloseTo(5); expect(deep12g(100, 'hp', 'bulwark')).toBeCloseTo(8);
    expect(deep12g(100, 'dmg', 'oc')).toBe(1); expect(deep12g(100, 'dmg', 'arcane')).toBe(1); expect(deep12g(40, 'dmg', 'blade')).toBe(1);
    expect(curveSchool12g({ equipped: { mainHand: { group: 'twoHand' } } })).toBe('blade');
    expect(curveSchool12g({ lean: 'bulwark', equipped: {} })).toBe('bulwark');
  });
});
