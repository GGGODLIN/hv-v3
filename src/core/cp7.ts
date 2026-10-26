/**
 * CP7 手感 (docs/cp7-feel.md). Everything here is used only when RULES.cp7 is on.
 * Knobs marked 暫定 have no original-game source (Clean Room rule: documented in docs/cp7-feel.md).
 */
import { type Equip, type Slot, QUALITIES, blocksOffHand, generateEquip, type Quality } from './items';
import { type Player, derive, powerScore } from './player';
import type { Rng } from './rng';

export const CP7 = {
  /** "比身上好" threshold: wearing the item raises 戰力 (powerScore) by more than this fraction. Under CP7 the sim's armour
   *  auto-equip uses the same margin, so the UI badge, the AI and the sim metric share one rule. 暫定（缺原版出處）: one armour
   *  piece moves total 戰力 only ~1–4%, so the old 5% sim margin almost never fires for armour late in the game. */
  betterMargin: 0.02,
  /** 暫定（缺原版出處）: smart-loot pity. When a loot event of a trip has no better-than-worn piece and the trip has had fewer
   *  than `pityUntil` such pieces so far, one extra armour piece is rolled (up to `pityTries` times) until one beats the worn slot. */
  pityUntil: 2,
  pityTries: 24,
  /** 暫定: every `pityBumpEvery` failed pity rolls the quality floor rises one step (so late-game gear can still be beaten). */
  pityBumpEvery: 4,
  pityMinQuality: 'average' as Quality,
  pitySlots: ['head', 'body', 'hands', 'legs', 'feet'] as Slot[],
  /** 暫定（缺原版出處）: abyss only — after a won battle restore this fraction of max HP / MP / SP (P3). 0 = off. */
  winHeal: 0,
  /** 暫定（缺原版出處）P4 curve: replaces ABYSS.dmgPerDepth. Damage grows `dmgMid` per depth up to `knee`, then `dmgLate`
   *  (low → mid rising → late flat). `dmgScale` multiplies ABYSS.dmgScale. */
  dmgMid: 0.08,
  dmgLate: 0.08,
  knee: 15,
  dmgScale: 1,
};
/** CP7 depth damage factor (replaces 1 + ABYSS.dmgPerDepth·(d−1) when RULES.cp7). */
export const cp7DepthDmg = (d: number): number =>
  CP7.dmgScale * (1 + CP7.dmgMid * (Math.min(d, CP7.knee) - 1) + CP7.dmgLate * Math.max(0, d - CP7.knee));

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

/** Smart-loot pity piece (see CP7.pityUntil). Rolls `pityTries` armour pieces at max(loot level, highest worn level) in the worn
 *  piece's family and quality (or `pityMinQuality` if higher, one step up on every `pityBumpEvery`-th roll) and keeps the one
 *  with the SMALLEST gain that still clears betterMargin — a "slightly better" piece, so pity does not inflate gear (暫定).
 *  Returns null if no roll beats the worn gear. */
export function pityPiece(rng: Rng, p: Player, level: number): Equip | null {
  let best: Equip | null = null, bestGain = Infinity;
  const top = Math.max(level, ...Object.values(p.equipped).map((e) => e?.level ?? 0));
  for (let i = 0; i < CP7.pityTries; i++) {
    const slot = rng.pick(CP7.pitySlots);
    const w = p.equipped[slot];
    const group = w?.group === 'cloth' || w?.group === 'light' || w?.group === 'heavy' ? w.group : rng.pick<'cloth' | 'light' | 'heavy'>(['cloth', 'light', 'heavy']);
    const qi = Math.max(QUALITIES.indexOf(CP7.pityMinQuality), w ? QUALITIES.indexOf(w.quality) : 0) + ((i + 1) % CP7.pityBumpEvery === 0 ? 1 : 0);
    const e = generateEquip(rng, top, { group, slot, quality: QUALITIES[Math.min(QUALITIES.length - 1, qi)] });
    const g = wearGain(p, e);
    if (g > CP7.betterMargin && g < bestGain) { best = e; bestGain = g; }
  }
  return best;
}
