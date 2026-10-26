import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { newPlayer, unspentExp, type Player } from '../src/core/player';
import { RULES } from '../src/core/run';
import { autoAllocate, autoEquip, starterKit, TOWN_HP_POTIONS } from '../src/core/auto';
import { generateEquip } from '../src/core/items';
import { betterThanWorn } from '../src/core/cp7';
import { Rng } from '../src/core/rng';
import { betterInBag, canAllocate, lacksPotion, prepAlloc, prepEquip, prepIssues, prepPotions } from '../src/core/prep';
import { attrsSpent } from '../src/core/formulas';

const flags = { ...RULES };
beforeEach(() => { RULES.cp7 = true; });
afterEach(() => Object.assign(RULES, flags));

/** Veteran town save: alloc + shop open, all EXP spent, 0 extra gear. */
function town(seed = 3): Player {
  const p = newPlayer(); starterKit(p, seed);
  p.prog!.unlocked.push('alloc', 'shop'); p.prog!.trips = 3;
  p.exp = attrsSpent(p.attrs); p.inventory = [];
  return p;
}
const clone = (p: Player): Player => structuredClone(p);
const better = (p: Player) => { const r = new Rng(11); for (let i = 0; i < 400; i++) { const e = generateEquip(r, 40, { slot: 'body' }); if (betterThanWorn(p, e)) return e; } throw new Error('no better piece'); };
const worse = (p: Player) => { const r = new Rng(12); for (let i = 0; i < 400; i++) { const e = generateEquip(r, 1, { slot: 'body', quality: 'crude' }); if (!betterThanWorn(p, e)) return e; } throw new Error('no worse piece'); };

describe('cp7-rc4 出發前整備: conditions', () => {
  it('nothing to do → no reminder', () => { const p = town(); expect(prepIssues(p)).toEqual([]); });
  it('(a) unspent EXP triggers; leftover below one point does not; locked alloc does not', () => {
    const p = town(); p.exp += 1e6; expect(canAllocate(p)).toBe(true); expect(prepIssues(p)).toContain('alloc');
    const q = town(); q.exp += 1; expect(unspentExp(q)).toBe(1); expect(prepIssues(q)).not.toContain('alloc');
    const r = town(); r.exp += 1e6; r.prog!.unlocked = r.prog!.unlocked.filter((x) => x !== 'alloc'); expect(prepIssues(r)).not.toContain('alloc');
  });
  it('(b) 0 health potions triggers; ≥1 does not; before the shop opens it does not', () => {
    const p = town(); p.potions.health = 0; expect(lacksPotion(p)).toBe(true); expect(prepIssues(p)).toEqual(['potion']);
    const q = town(); q.potions.health = 1; expect(prepIssues(q)).toEqual([]);
    const r = town(); r.potions.health = 0; r.prog!.unlocked = r.prog!.unlocked.filter((x) => x !== 'shop'); expect(prepIssues(r)).toEqual([]);
  });
  it('(c) a bag piece that beats worn by betterMargin triggers; a worse one does not', () => {
    const p = town(); const e = better(p); p.inventory.push(e); expect(betterInBag(p)).toEqual([e]); expect(prepIssues(p)).toEqual(['equip']);
    const q = town(); q.inventory.push(worse(q)); expect(prepIssues(q)).toEqual([]);
  });
});

describe('cp7-rc4 出發前整備: one-click fixes', () => {
  it('自動分配 = sim autoAllocate, clears (a)', () => {
    const p = town(); p.exp += 1e6; const sim = clone(p); autoAllocate(sim);
    expect(prepAlloc(p)).toBeGreaterThan(0); expect(p.attrs).toEqual(sim.attrs); expect(canAllocate(p)).toBe(false);
  });
  it('買藥 buys up to the sim town stock; short on credits buys as many as possible; 0 credits buys none', () => {
    const p = town(); p.potions.health = 0; p.credits = 10_000; expect(prepPotions(p)).toBe(TOWN_HP_POTIONS); expect(p.potions.health).toBe(TOWN_HP_POTIONS); expect(p.credits).toBe(10_000 - TOWN_HP_POTIONS * RULES.potionPrice.health);
    const q = town(); q.potions.health = 0; q.credits = RULES.potionPrice.health * 2 + 1; expect(prepPotions(q)).toBe(2); expect(q.credits).toBe(1); expect(lacksPotion(q)).toBe(false);
    const r = town(); r.potions.health = 0; r.credits = 0; expect(prepPotions(r)).toBe(0); expect(lacksPotion(r)).toBe(true);
  });
  it('換上 = sim autoEquip, wears the better piece and clears (c)', () => {
    const p = town(); const e = better(p); p.inventory.push(e); const sim = clone(p); autoEquip(sim, []);
    expect(prepEquip(p)).toBeGreaterThan(0); expect(p.equipped.body?.id).toBe(e.id); expect(sim.equipped.body?.id).toBe(e.id); expect(betterInBag(p)).toEqual([]);
  });
  it('全部處理 order (alloc → equip → potions) clears all three', () => {
    const p = town(); p.exp += 1e6; p.potions.health = 0; p.credits = 10_000; p.inventory.push(better(p));
    expect(prepIssues(p)).toEqual(['alloc', 'potion', 'equip']);
    prepAlloc(p); prepEquip(p); prepPotions(p);
    expect(prepIssues(p)).toEqual([]); expect(p.potions.health).toBe(TOWN_HP_POTIONS);
  });
});
