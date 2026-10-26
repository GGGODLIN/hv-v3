import { describe, expect, it, afterEach } from 'vitest';
import { newPlayer, equip, unspentExp } from '../src/core/player';
import { RULES } from '../src/core/run';
import { autoAllocate, autoEquip, leanStyle, starterKit, TOWN_HP_POTIONS } from '../src/core/auto';
import { betterThanWorn, leanAllows } from '../src/core/cp7';
import { prepAll, prepIssues } from '../src/core/prep';
import { unlock } from '../src/core/progress';
import { generateEquip } from '../src/core/items';
import { generateTower, CP5_TOWER } from '../src/core/tower';
import { Rng } from '../src/core/rng';
const flags = { ...RULES };
afterEach(() => Object.assign(RULES, flags));
const cp8 = () => { RULES.cp7 = true; RULES.cp8 = true; RULES.cp5Bosses = true; RULES.cp6Abyss = true; };

describe('cp8-rc6', () => {
  it('item 5: blade lean never wears a staff, even a much better one; bulwark keeps 1H + shield', () => {
    cp8();
    const r = new Rng(3);
    const p = newPlayer(); starterKit(p, 1, 'blade'); p.exp = 50000; autoAllocate(p);
    const staff = generateEquip(r, 30, { group: 'staff', quality: 'legendary' });
    expect(leanAllows(p, staff)).toBe(false);
    expect(betterThanWorn(p, staff)).toBe(false);
    p.inventory.push(staff); autoEquip(p, [], leanStyle(p));
    expect(p.equipped.mainHand?.group).not.toBe('staff');
    const two = generateEquip(r, 5, { group: 'twoHand', quality: 'average' });
    p.inventory.push(two); autoEquip(p, [], leanStyle(p));
    expect(p.equipped.mainHand?.group).toBe('twoHand');
    const b = newPlayer(); starterKit(b, 1, 'bulwark');
    for (const g of ['twoHand', 'staff'] as const) b.inventory.push(generateEquip(r, 30, { group: g, quality: 'legendary' }));
    autoEquip(b, [], leanStyle(b));
    expect(b.equipped.mainHand?.group).toBe('oneHand');
    expect(b.equipped.offHand?.group).toBe('shield');
  });
  it('bug 1: cp8 bulwark starter kit is 1H axe + buckler + leather', () => {
    cp8();
    const p = newPlayer(); starterKit(p, 1, 'bulwark');
    expect(p.equipped.mainHand?.group).toBe('oneHand');
    expect(p.equipped.offHand?.base).toMatch(/buckler/i);
  });
  it('bug 3: arcane lean allocates INT above STR; physical schools (rc7: school-specific, no longer equal to cp8-off)', () => {
    cp8();
    const a = newPlayer(); a.lean = 'arcane'; a.exp = 20000; autoAllocate(a);
    expect(a.attrs.int).toBeGreaterThan(a.attrs.str);
    expect(a.attrs.wis).toBeGreaterThan(a.attrs.dex);
    const b = newPlayer(); b.lean = 'blade'; b.exp = 20000; autoAllocate(b);
    RULES.cp8 = false; const c = newPlayer(); c.exp = 20000; autoAllocate(c);
    expect(b.attrs).not.toEqual(c.attrs); // cp8-rc7 P0 bug 1
    expect(unspentExp(a)).toBeGreaterThanOrEqual(0);
  });
  it('bug 2: 全部處理 tops up health, mana and spirit to TOWN_HP_POTIONS (暫定)', () => {
    cp8();
    const p = newPlayer(); unlock(p, 'shop'); p.credits = 100000;
    p.potions = { health: 2, mana: 0, spirit: 1 };
    expect(prepIssues(p)).toContain('potion'); prepAll(p);
    expect(p.potions).toEqual({ health: TOWN_HP_POTIONS, mana: TOWN_HP_POTIONS, spirit: TOWN_HP_POTIONS });
  });
  it('item 2: floor before each boss floor offers rest under cp8; constants and other floors unchanged', () => {
    expect(CP5_TOWER.restFloors).toEqual([4, 8, 14, 18]);
    for (let s = 1; s <= 200; s++) {
      const a = generateTower(new Rng(s), { long: true, distinct: true });
      const b = generateTower(new Rng(s), { long: true, distinct: true, restBeforeBoss: true });
      for (const f of CP5_TOWER.bossFloors) expect(b.floors[f - 2]!.options).toContain('rest');
      b.floors.forEach((f, i) => { if (!CP5_TOWER.bossFloors.includes(i + 2)) expect(f.options).toEqual(a.floors[i]!.options); });
    }
  });
});
void equip;
