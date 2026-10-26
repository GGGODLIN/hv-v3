/**
 * CP7 手感 (docs/cp7-feel.md). Everything here is used only when RULES.cp7 is on.
 * Knobs marked 暫定 have no original-game source (Clean Room rule: documented in docs/cp7-feel.md).
 */
import { type Equip, type Slot, QUALITIES, blocksOffHand, generateEquip, type Quality } from './items';
import { type Player, derive, powerScore } from './player';
import type { Rng } from './rng';
import { RULES } from './run';

export const CP7 = {
  /** "比身上好" threshold: wearing the item raises 戰力 (powerScore) by more than this fraction. Under CP7 the sim's armour
   *  auto-equip uses the same margin, so the UI badge, the AI and the sim metric share one rule. 暫定（缺原版出處）: one armour
   *  piece moves total 戰力 only ~1–4%, so the old 5% sim margin almost never fires for armour late in the game. */
  betterMargin: 0.02,
  /** 暫定（缺原版出處）: smart-loot pity. When a loot event of a trip has no better-than-worn piece and the trip has had fewer
   *  than `pityUntil` such pieces so far, one extra armour piece is rolled (up to `pityTries` times) until one beats the worn slot. */
  pityUntil: 2,
  pityTries: 32,
  pityPasses: 8, // cp7-rc2: was 3 (暫定)
  /** cp7-rc3: was 3 with no cap — pass 8 rolled worn+24 (the Lv33/Lv39 drops in playtest). Now each pass is +1 level, capped at
   *  `pityLevelCap` above the drop level (player Lv + lootLvAdd), and later passes raise quality instead (`pityQualityPerPass`) (暫定). */
  pityLevelStep: 1,
  pityLevelCap: 3,
  pityQualityPerPass: 1,
  /** 暫定: every `pityBumpEvery` failed pity rolls the quality floor rises one step (so late-game gear can still be beaten). */
  pityBumpEvery: 2,
  pityMinQuality: 'average' as Quality,
  pitySlots: ['head', 'body', 'hands', 'legs', 'feet'] as Slot[],
  /** 暫定（缺原版出處）: abyss only — after a won battle restore this fraction of max HP / MP / SP (P3). 0 = off. */
  winHeal: 0.1,
  /** 暫定（缺原版出處）P4 curve: replaces ABYSS.dmgPerDepth. Damage grows `dmgMid` per depth up to `knee`, then `dmgLate`
   *  (low → mid rising → late flat). `dmgScale` multiplies ABYSS.dmgScale. */
  dmgMid: 0.2,
  dmgLate: 0,
  knee: 15,
  dmgScale: 1,
  /** 暫定（缺原版出處）P4: the tier PL (The_Tower.md DIFF table) is phased in over `plRamp` depths (ABYSS.tierRamp otherwise)
   *  and scaled by `plScale`, so the jump at d15–17 does not make d16/d18 a wall. */
  plRamp: 3,
  /** 暫定: tier HP/damage ramp length under CP7 (ABYSS.tierRamp = 3 otherwise); 5 spreads each tier jump over the whole tier. */
  tierRamp: 3,
  /** 暫定: non-boss abyss damage factor by CP5 theme floor (themeKey). Themes 16–19 pick ~12% stronger rows (sim: base adb 80→90), which made d16/d18 the death spike. */
  themeDmg: { 16: 0.7, 17: 0.7, 18: 0.7, 19: 0.7 } as Record<number, number>,
  /** sim knob: scales every themeDmg entry's distance from 1 (1 = as listed). */
  themeK: 1,
  plScale: 1,
  /** 暫定（缺原版出處）decision 1: main-tower loot level under CP7 = player level at trip start + this (findings 003 §1.1 says
   *  player level; the offset compensates main-tower monsters that still follow floorLevel, which is what made P5 worse). */
  lootLvAdd: 5,
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
/** cp8-rc6 item 5: weapon layout per lean school (same as auto.ts gearStyle('buff:<school>'): blade 2H no shield, oc 1H shield free,
 *  arcane staff no shield, bulwark 1H + shield). May `e` be worn by this player's lean school? Non-weapon slots / no lean: always. */
export const LEAN_HANDS = { blade: ['twoHand', false], oc: ['oneHand', true], arcane: ['staff', false], bulwark: ['oneHand', true] } as const;
export function leanAllows(p: Player, e: Equip): boolean {
  if (!RULES.cp8 || !p.lean) return true;
  const [main, shield] = LEAN_HANDS[p.lean];
  if (e.slot === 'mainHand') return e.group === main;
  if (e.slot === 'offHand') return shield;
  return true;
}
/** CP7 P1 definition of a better drop (UI badge + sim metric). */
export function betterThanWorn(p: Player, e: Equip): boolean {
  if (!leanAllows(p, e)) return false; // cp8-rc6 item 5: school-locked weapon layout (badge, autoWear, 換上 all share this)
  if (RULES.cp8 && p.lean === 'bulwark') { // cp8-rc5 (layout only): a bulwark-leaning player keeps 1H + shield and heavy armour
    const w = p.equipped[e.slot], arm = ['cloth', 'light', 'heavy'].includes(e.group);
    if (e.slot === 'mainHand' && e.group !== 'oneHand') return false;
    if (arm && w?.group === 'heavy' && e.group !== 'heavy') return false;
    if (arm && e.group === 'heavy' && w && w.group !== 'heavy') return wearGain(p, e) >= 0 && e.id !== w.id;
  }
  return wearGain(p, e) > CP7.betterMargin;
}
/** cp7-rc5 bug 1: one verdict for every 「▲」 the UI shows (裝備欄 compare, 「▲ 比身上好」 badge, 出發前整備). `small` = 戰力 goes up
 *  but by no more than CP7.betterMargin, so the badge / reminder do not list it (the UI says so instead of a bare ▲). */
export function gearVerdict(p: Player, e: Equip): 'better' | 'small' | 'none' {
  const g = wearGain(p, e);
  return g > CP7.betterMargin ? 'better' : g > 0 ? 'small' : 'none';
}

/** Smart-loot pity piece (see CP7.pityUntil). Rolls `pityTries` armour pieces at max(loot level, highest worn level) in the worn
 *  piece's family and quality (or `pityMinQuality` if higher, one step up on every `pityBumpEvery`-th roll) and keeps the one
 *  with the SMALLEST gain that still clears betterMargin — a "slightly better" piece, so pity does not inflate gear (暫定).
 *  Returns null if no roll beats the worn gear. */
export function pityPiece(rng: Rng, p: Player, level: number): Equip | null {
  let best: Equip | null = null, bestGain = Infinity;
  const top = level; // cp7-rc3: from the drop level, not the highest worn level (that ratcheted worn gear up +cap every pity: Lv38/51 in sim)
  // pass 0 at the top worn level; if nothing beats the worn gear, later passes roll `pityLevelStep` levels higher (暫定).
  for (let pass = 0; pass <= CP7.pityPasses && !best; pass++) for (let i = 0; i < CP7.pityTries; i++) {
    const slot = rng.pick(CP7.pitySlots);
    const w = p.equipped[slot];
    const group = (pass < 2 || i % 2 === 0) && (w?.group === 'cloth' || w?.group === 'light' || w?.group === 'heavy') ? w.group : // cp7-rc3: from pass 2, odd tries may switch armour family (暫定)
       rng.pick<'cloth' | 'light' | 'heavy'>(['cloth', 'light', 'heavy']);
    const qi = Math.max(QUALITIES.indexOf(CP7.pityMinQuality), w ? QUALITIES.indexOf(w.quality) : 0) + ((i + 1) % CP7.pityBumpEvery === 0 ? 1 : 0) + pass * CP7.pityQualityPerPass;
    const e = generateEquip(rng, top + Math.min(CP7.pityLevelCap, pass * CP7.pityLevelStep), { group, slot, quality: QUALITIES[Math.min(QUALITIES.length - 1, qi)] });
    const g = wearGain(p, e);
    if (g > CP7.betterMargin && g < bestGain) { best = e; bestGain = g; }
  }
  return best;
}

/** CP7 decision 2: unlocked abyss start depths (1, 6, 11, … up to checkpointStart(best)); the UI lets the player pick a shallower one. */
export const checkpointOptions = (best: number, step = 5): number[] => {
  const top = step * Math.floor(best / step) + 1;
  const out: number[] = []; for (let d = 1; d <= top; d += step) out.push(d); return out;
};
/** 暫定（缺原版出處）sim AI start pick: deepest unlocked checkpoint, except right after a trip that died without clearing a single
 *  depth — then one checkpoint shallower than that trip's start (never below 1). */
export const simPickStart = (best: number, last: { start: number; cleared: number; dead: boolean } | null, step = 5): number => {
  const opts = checkpointOptions(best, step); const deepest = opts[opts.length - 1]!;
  if (last && last.dead && last.cleared < last.start) return Math.max(1, Math.min(deepest, last.start - step));
  return deepest;
};

/** cp7-rc2 (暫定): last-resort pity when no armour roll clears betterMargin (casters: armour alone can stay under 2%) —
 *  a main hand of the worn base, rolled like pityPiece (smallest gain above margin). Only runs after pityPiece returned null. */
export function pityWeapon(rng: Rng, p: Player, level: number): Equip | null {
  const mh = p.equipped.mainHand; if (!mh) return null;
  let best: Equip | null = null, bestGain = Infinity;
  const top = level; // cp7-rc3: from the drop level, not the highest worn level (that ratcheted worn gear up +cap every pity: Lv38/51 in sim)
  for (let pass = 0; pass <= CP7.pityPasses && !best; pass++) for (let i = 0; i < CP7.pityTries; i++) {
    const qi = QUALITIES.indexOf(mh.quality) + ((i + 1) % CP7.pityBumpEvery === 0 ? 1 : 0) + pass * CP7.pityQualityPerPass;
    const e = generateEquip(rng, top + Math.min(CP7.pityLevelCap, pass * CP7.pityLevelStep), { group: mh.group, base: mh.base, slot: 'mainHand', quality: QUALITIES[Math.min(QUALITIES.length - 1, qi)] });
    const g = wearGain(p, e);
    if (g > CP7.betterMargin && g < bestGain) { best = e; bestGain = g; }
  }
  return best;
}
