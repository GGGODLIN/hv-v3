/**
 * CP7 出發前整備提醒 (docs/cp7-feel.md §出發前整備). Used by the town UI only when RULES.cp7; the one-click fixes are the
 * sim's own town-prep functions (autoAllocate / buyHealthTo / autoEquip), so the UI and the sim share one logic.
 */
import { ATTRS } from './formulas';
import { type Player, unspentExp } from './player';
import { has } from './progress';
import { autoAllocate, autoEquip, buyHealthTo, naivePrep, TOWN_HP_POTIONS } from './auto';
import { betterThanWorn } from './cp7';
import type { Equip } from './items';

export type PrepIssue = 'alloc' | 'potion' | 'equip';

/** (a) unspent EXP that the 「自動分配」 logic (the sim's autoAllocate) would spend on ≥1 attribute point. Leftover EXP that
 *  autoAllocate stops at (its next weighted pick costs more than what is left) does not nag, so one click always clears (a). */
export const canAllocate = (p: Player): boolean => {
  if (!has(p, 'alloc') || unspentExp(p) <= 0) return false;
  const t = { ...p, attrs: { ...p.attrs } }; autoAllocate(t);
  return ATTRS.some((a) => t.attrs[a] !== p.attrs[a]);
};
/** (b) no health potion (only once the town shop is open; before that startRun tops up to STARTER_POTIONS). */
export const lacksPotion = (p: Player): boolean => has(p, 'shop') && p.potions.health <= 0;
/** (c) inventory pieces that beat the worn slot by CP7.betterMargin (the 「▲ 比身上好」 badge rule). */
export const betterInBag = (p: Player): Equip[] => {
  // cp8-rc3: judge on the character after 「自動分配」 (prepAll runs alloc before equip), so the list matches what 換上 will do.
  const t = canAllocate(p) ? { ...p, attrs: { ...p.attrs } } : p; if (t !== p) autoAllocate(t);
  return p.inventory.filter((e) => betterThanWorn(t, e));
};
/** cp8-rc3: pieces CP8.autoWear put on during the last trip that are still worn (the reminder names them once). */
export const autoWorn = (p: Player): Equip[] => Object.values(p.equipped).filter((e): e is Equip => !!e && !!p.lastWorn?.includes(e.id));

export function prepIssues(p: Player): PrepIssue[] {
  const out: PrepIssue[] = [];
  if (canAllocate(p)) out.push('alloc');
  if (lacksPotion(p)) out.push('potion');
  if (betterInBag(p).length) out.push('equip');
  return out;
}

/** 「自動分配」: the sim's autoAllocate. Returns attribute points spent. */
export function prepAlloc(p: Player): number {
  const before = ATTRS.reduce((s, a) => s + p.attrs[a], 0);
  autoAllocate(p);
  return ATTRS.reduce((s, a) => s + p.attrs[a], 0) - before;
}
/** 「買藥」: sim town prep (up to TOWN_HP_POTIONS, as many as credits allow). Returns potions bought. */
export const prepPotions = (p: Player): number => buyHealthTo(p, TOWN_HP_POTIONS);
/** 「換上」: the sim's autoEquip (no school in town → slot-by-slot, CP7.betterMargin), repeated until nothing in the bag
 *  is badged better any more (bounded). Returns the number of swaps. */
export function prepEquip(p: Player): number {
  let n = 0;
  for (let guard = 0; guard < 8 && betterInBag(p).length; guard++) {
    const before = Object.values(p.equipped).map((e) => e?.id).join();
    autoEquip(p, []);
    const after = Object.values(p.equipped).map((e) => e?.id).join();
    if (before === after) break;
    n++;
  }
  return n;
}
/** 「全部處理」: same order as the sim town prep (autoRun): alloc → equip → potions. */
export function prepAll(p: Player): void { prepAlloc(p); prepEquip(p); prepPotions(p); }

naivePrep.equip = (p: Player): void => { prepEquip(p); };
