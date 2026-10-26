/**
 * CP8 真實遊玩 (docs/cp8-real-play.md). Everything here is used only when RULES.cp8 is on.
 * Knobs marked 暫定 have no original-game source (Clean Room rule: listed in docs/cp8-real-play.md §暫定值).
 */
export const CP8 = {
  /** 暫定（缺原版出處；產品規則）P1: a drop that the 「▲ 比身上好」 rule (CP7 betterThanWorn) badges is worn at once, in the run.
   *  Root cause of the naive gap: loot sits in the run bag, and on death only RULES.death.keepBestItems (=1) bag piece survives. */
  autoWear: true,
  /** 暫定（缺原版出處；產品規則）P1: boss battles open in Spirit Stance (sourced entry rule: OC ≥ 50, F-002-spirit-stance) when it
   *  can be used — the toggle is free, but a player who never presses it loses the SS damage bonus in every boss fight. */
  bossSpirit: true,
  /** 暫定（缺原版出處）P5: cap on the summed monster damage of one round, as a fraction of max HP (0 = off). */
  turnCap: 0.9,
  /** 暫定（缺原版出處）P3: run buffs picked before an abyss trip that starts at depth `start` > 1: N = floor((start − 1) / per), max `max`. */
  startBuffPer: 5,
  startBuffMax: 6,
};
/** CP8 P3 (暫定 formula): number of start buffs for an abyss trip from depth `start`. */
export const startBuffs = (start: number): number => Math.min(CP8.startBuffMax, Math.max(0, Math.floor((start - 1) / CP8.startBuffPer)));
