/**
 * CP8 真實遊玩 (docs/cp8-real-play.md). Everything here is used only when RULES.cp8 is on.
 * Knobs marked 暫定 have no original-game source (Clean Room rule: listed in docs/cp8-real-play.md §暫定值).
 */
import { CP7 } from './cp7';
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
  /** 暫定（缺原版出處）P3 (rc2): non-boss damage factor for abyss themes 1–3 from the 2nd rotation (d21–23, d41–43 …). CP7.themeDmg
   *  gives themes 16–19 ×0.7, so at d20→d21 the discount ended at once (adb +52% vs d18 while the tier multiplier is only +9.5%).
   *  The discount now fades out 0.7 → 1 over themes 1–3 (theme 20 is the boss floor, not affected). */
  themeTail: [0.7, 0.775, 0.85, 0.925] as number[],
};
/** CP8 rc2: theme damage factor at theme floor f (1..20) for abyss depth > 20. */
export const cp8ThemeDmg = (f: number): number => (f >= 1 && f <= CP8.themeTail.length ? CP8.themeTail[f - 1]! : CP7.themeDmg[f] ?? 1);
/** CP8 P3 (暫定 formula): number of start buffs for an abyss trip from depth `start`. */
export const startBuffs = (start: number): number => Math.min(CP8.startBuffMax, Math.max(0, Math.floor((start - 1) / CP8.startBuffPer)));
