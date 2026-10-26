/**
 * CP7 手感 (docs/cp7-feel.md). Everything here is used only when RULES.cp7 is on.
 * Knobs marked 暫定 have no original-game source (Clean Room rule: documented in docs/cp7-feel.md).
 */
import { type Equip, type Slot, blocksOffHand, generateEquip, type Quality } from './items';
import { type Player, derive, powerScore } from './player';
import type { Rng } from './rng';

export const CP7 = {
  /** "比身上好" threshold: wearing the item raises 戰力 (powerScore) by more than this fraction. Same 5% as the sim's
   *  AUTO_EQUIP_MARGIN, so the UI badge and the sim metric use one rule. 暫定（缺原版出處）. */
  betterMargin: 0.05,
  /** 暫定（缺原版出處）: smart-loot pity. When a loot event of a trip has no better-than-worn piece and the trip has had fewer
   *  than `pityUntil` such pieces so far, one extra armour piece is rolled (up to `pityTries` times) until one beats the worn slot. */
  pityUntil: 1,
  pityTries: 16,
  pityMinQuality: 'average' as Quality,
  pitySlots: ['head', 'body', 'hands', 'legs', 'feet'] as Slot[],
  /** 暫定（缺原版出處）: abyss only — after a won battle restore this fraction of max HP / MP / SP (P3). 0 = off. */
  winHeal: 0,
};

/** Power gain fraction if `e` were worn now (an off-hand next to a two-hander/staff cannot be worn → 0). */
export function wearGain(p: Player, e: Equip): number {
  if (e.slot === 'offHand' && blocksOffHand(p.equipped.mainHand)) return 0;
  const cur = powerScore(derive(p));
  const trial: Player = { ...p, equipped: { ...p.equipped, [e.slot]: e } };
  if (blocksOffHand(e)) delete trial.equipped.offHand;
  return cur > 0 ? powerScore(derive(trial)) / cur - 1 : 1;
}
/** CP7 P1 definition of a better drop (UI badge + sim metric). */
export const betterThanWorn = (p: Player, e: Equip): boolean => wearGain(p, e) > CP7.betterMargin;

/** Smart-loot pity piece (see CP7.pityUntil). Returns null if no roll beats the worn gear. */
export function pityPiece(rng: Rng, p: Player, level: number): Equip | null {
  for (let i = 0; i < CP7.pityTries; i++) {
    const slot = rng.pick(CP7.pitySlots);
    const group = rng.pick<'cloth' | 'light' | 'heavy'>(['cloth', 'light', 'heavy']);
    const e = generateEquip(rng, level, { group, slot, minQuality: CP7.pityMinQuality });
    if (betterThanWorn(p, e)) return e;
  }
  return null;
}
