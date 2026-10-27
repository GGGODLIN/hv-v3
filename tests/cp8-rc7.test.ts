import { describe, expect, it, afterEach } from 'vitest';
import { newPlayer, equip, allocate } from '../src/core/player';
import { RULES } from '../src/core/run';
import { autoAllocate, allocWeights, autoEquip, leanStyle } from '../src/core/auto';
import { betterThanWorn, leanAllows } from '../src/core/cp7';
import { generateEquip } from '../src/core/items';
import { Rng } from '../src/core/rng';
const snap = { ...RULES };
afterEach(() => Object.assign(RULES, snap));
const cp8 = () => { RULES.cp7 = true; RULES.cp8 = true; RULES.cp5Bosses = true; RULES.cp6Abyss = true; };
const alloc = (lean: 'blade' | 'oc' | 'arcane' | 'bulwark') => { const p = newPlayer(); p.lean = lean; p.exp = 20000; autoAllocate(p); return p.attrs; };
describe('cp8-rc7 P0', () => {
  it('bug 1: 自動分配 is school-specific', () => {
    cp8();
    const b = alloc('blade'), o = alloc('oc'), a = alloc('arcane'), w = alloc('bulwark'), base = newPlayer().attrs;
    for (const x of [b, w]) { expect(x.int).toBe(base.int); expect(x.wis).toBe(base.wis); } // cp8-rc10 P0-1: leftover EXP never buys blade / bulwark INT/WIS
    expect(a.int).toBeGreaterThan(a.end); expect(a.int).toBeGreaterThan(a.str);
    expect(w.end).toBeGreaterThan(w.str);
    expect(b).not.toEqual(o);
  });
  it('cp8-rc10 P1-8: after 自動分配 no allowed attribute is still affordable', () => {
    cp8();
    for (const lean of ['blade', 'oc', 'arcane', 'bulwark'] as const) for (const exp of [3000, 7777, 20000]) {
      const p = newPlayer(); p.lean = lean; p.exp = exp; autoAllocate(p);
      const w = allocWeights(p);
      for (const k of Object.keys(p.attrs) as (keyof typeof p.attrs)[]) if ((w[k] ?? 0) > 0) { const q = structuredClone(p); expect(allocate(q, k)).toBe(0); }
    }
  });
  it('bug 2: armour class is school-locked (arcane no heavy, bulwark no cloth) and a disallowed worn piece is replaced', () => {
    cp8(); const rng = new Rng(5);
    const p = newPlayer(); p.lean = 'arcane';
    const heavy = generateEquip(rng, 5, { group: 'heavy', slot: 'legs' }), cloth = generateEquip(rng, 30, { group: 'cloth', slot: 'legs', quality: 'magnificent' }); // rc9 P1-7: the swap must not lower 戰力
    expect(leanAllows(p, heavy)).toBe(false); expect(leanAllows(p, cloth)).toBe(true);
    equip(p, heavy); p.inventory.push(cloth);
    expect(betterThanWorn(p, cloth)).toBe(true);
    autoEquip(p, [], leanStyle(p)); expect(p.equipped.legs?.group).toBe('cloth');
    const q = newPlayer(); q.lean = 'bulwark'; expect(leanAllows(q, cloth)).toBe(false);
  });
});
import { chargeEstimate, windingUp } from '../src/core/battle';
describe('cp8-rc7 P1 item 3', () => {
  const s = { d: { physMit: 0.2, magMit: 0.2, specMit: { fire: 0, cold: 0, crushing: 0, slashing: 0, piercing: 0 } } } as never;
  it('元素脈衝 counts as a wind-up and is estimated with pulseMult', () => {
    const m = { rank: 'boss', adb: 100, attackType: 'crushing', charge: 0, pulseNext: true, shieldEl: 'fire', hp: 10 } as never;
    expect(windingUp(m)).toBe(true);
    const plain = { ...(m as object), pulseNext: false } as never;
    expect(windingUp(plain)).toBe(false);
    expect(chargeEstimate(s, m)).toBeGreaterThan(0);
  });
});
