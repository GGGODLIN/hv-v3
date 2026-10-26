import { describe, expect, it, afterEach } from 'vitest';
import { newPlayer, equip } from '../src/core/player';
import { RULES } from '../src/core/run';
import { autoAllocate, autoEquip, leanStyle } from '../src/core/auto';
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
    for (const x of [b, o, w]) { expect(x.int).toBe(base.int); expect(x.wis).toBe(base.wis); }
    expect(a.int).toBeGreaterThan(a.end); expect(a.int).toBeGreaterThan(a.str);
    expect(w.end).toBeGreaterThan(w.str);
    expect(b).not.toEqual(o);
  });
  it('bug 2: armour class is school-locked (arcane no heavy, bulwark no cloth) and a disallowed worn piece is replaced', () => {
    cp8(); const rng = new Rng(5);
    const p = newPlayer(); p.lean = 'arcane';
    const heavy = generateEquip(rng, 5, { group: 'heavy', slot: 'legs' }), cloth = generateEquip(rng, 1, { group: 'cloth', slot: 'legs' });
    expect(leanAllows(p, heavy)).toBe(false); expect(leanAllows(p, cloth)).toBe(true);
    equip(p, heavy); p.inventory.push(cloth);
    expect(betterThanWorn(p, cloth)).toBe(true);
    autoEquip(p, [], leanStyle(p)); expect(p.equipped.legs?.group).toBe('cloth');
    const q = newPlayer(); q.lean = 'bulwark'; expect(leanAllows(q, cloth)).toBe(false);
  });
});
