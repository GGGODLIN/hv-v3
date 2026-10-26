import { RULES } from './run';
import { cp7DepthDmg } from './cp7';
/**
 * CP6 深淵塔 (docs/cp6-abyss.md §9 producer decisions). Used only when RULES.cp6Abyss is on.
 * Sourced values cite their file; everything else is 暫定（缺原版出處）.
 */
import { AFFIX_IDS, AFFIXES, CP5, DANGER_EXTRA, affixWeight, compatible, dangerHint, type AffixId } from './cp5';
import type { Quality } from './items';
import type { Rng } from './rng';
import type { NodeType, Floor } from './tower';
import { TOWER, floorLevel, floorPl } from './tower';

export const ABYSS = {
  /** Decision 1 (暫定): +2 monster levels per depth. Original The Tower is floor × 10 (The_Tower.md:9) — deliberately not used. */
  levelPerDepth: 2,
  /** rc7 (a): monster-level base. 'player' = player Lv + playerLevelPerDepth × (d − 1); original HV spawns monsters at the player's level
   * (parsed_wiki/Monster_Stats.md:33 "monster_level = … equal to player's level"; Battles.md:220). The Tower itself uses floor × 10 (The_Tower.md:9) — not used.
   * 'floor' = rc6 curve (floorLevel(20) + levelPerDepth × d + lvFollow). */
  levelBase: 'player' as 'player' | 'floor',
  /** rc7 (a) (暫定，無來源): extra monster levels per depth on top of the player level. */
  playerLevelPerDepth: 0, // 暫定，無來源 (rc9 set A, docs/cp6-abyss.md; rc8 0)
  /** rc6 item 1 knob A (暫定，無來源): abyss-only monster-level follow k (Lv += k × max(0, player Lv − RULES.monLvFollow.free)); main tower keeps RULES.monLvFollow.k. rc5 = 0.8. */
  lvFollowK: 0.8,
  /** rc6 item 1 knob B (暫定，無來源): abyss-only × on monster physical resistance (physMit and positive piercing/crushing/slashing spec). rc5 = 1. */
  physResScale: 1,
  /** Decision 2: +2% monster damage per depth, cumulative (original: +2% per wave, Battles.md:261; wave→depth is 暫定). */
  dmgPerDepth: 0.08, // 暫定，無來源 (rc9 set A; rc8 -0.01; deviates from sourced +2%/wave Battles.md:261; must stay ≥ -0.0167 for the d60 cap)
  /** The_Tower.md:12: past F40, +5% monster damage and +5% HP every 5 floors (sourced). */
  past40: { every: 5, dmg: 0.05, hp: 0.05 },
  /** Decision 4 (暫定): checkpoint every 5 depths. */
  checkpoint: 5,
  /** 暫定: sim / UI safety cap (not a game rule). */
  simCap: 60,
  /** 暫定: 3-affix elite HP = CP5.doubleHp × this. */
  tripleHp: 0.8,
  /** r2 decision 6 (暫定): abyss boss drops (plus the guaranteed piece). */
  bossDrops: 2,
  /** r2 tuning knob (暫定): flat monster-level offset added to every depth (0 = F20 level + 2/depth). */
  levelOffset: 0,
  /** r2 tuning knob (暫定): abyss monster HP ×. */
  hpScale: 0.9, // 暫定，無來源 (rc9 set A; rc8 1.1)
  /** r2 tuning knob (暫定): abyss monster damage ×. */
  dmgScale: 2, // 暫定，無來源 (rc9 set A; rc8 6)
  /** r2b knob (暫定): extra damage × for the abyss boss at a given depth (missing = 1). */
  bossDmgAt: { 15: 0.6, 20: 0.6, 25: 0.6 } as Record<number, number>,
  /** r4 decision (c) (暫定): a tier's DIFF jump (hp/dmg/pl) phases in over its first N depths: 1/N, 2/N, … full. 1 = old step. */
  tierRamp: 3, // 暫定，無來源 (rc9 set A; rc8 5)
  /** 暫定 sim knob: shift the ramp start past the tier's first depth (0 = ramp begins on the tier's first depth). */
  tierRampOffset: 0,
  /** r2 decision 8 (暫定): carry-back multiplier = 1 + this × tier index (Normal 0 … PFUDOR 6) of the deepest depth reached. */
  carryPerTier: 0.05,
  /** r2 decision 9 (暫定): milestone every N depths cleared (first time only). */
  milestoneEvery: 10,
};
export const abyssCarry = (d: number): number => 1 + ABYSS.carryPerTier * abyssTier(Math.max(1, d));
/** r2 decision 9: milestone titles (names 暫定). */
export const TITLES = ['深淵初探者', '深淵行者', '深淵獵手', '深淵征服者', '深淵之主'];
export const titleFor = (d: number): string => TITLES[d / ABYSS.milestoneEvery - 1] ?? `深淵 ${d} 層踏破者`;

/** findings 003 §3.1 (sourced): Normal..PFUDOR monster HP / damage multipliers and PL ceiling modifier. */
export const DIFF = [
  { zh: 'Normal', hp: 1.0, dmg: 1.0, pl: 0 },
  { zh: 'Hard', hp: 1.1, dmg: 1.2, pl: 5 },
  { zh: 'Nightmare', hp: 1.2, dmg: 1.4, pl: 20 },
  { zh: 'Hell', hp: 1.4, dmg: 1.6, pl: 30 },
  { zh: 'Nintendo', hp: 1.7, dmg: 2.0, pl: 60 },
  { zh: 'IWBTH', hp: 2.0, dmg: 2.5, pl: 100 },
  { zh: 'PFUDOR', hp: 2.0, dmg: 3.0, pl: 125 },
] as const;

/** rc3 (暫定，缺原版出處): UI names for the DIFF tiers — the repo has no Chinese names, so 「中文（英文）」. */
export const TIER_ZH = ['普通（Normal）', '困難（Hard）', '惡夢（Nightmare）', '地獄（Hell）', '任天堂（Nintendo）', '我想成為英雄（IWBTH）', '粉紅獨角獸（PFUDOR）'] as const;
export const tierZh = (d: number): string => TIER_ZH[abyssTier(d)]!;
/** The_Tower.md:32-48 (sourced): d 1–9 Normal/T1, 10–14 Hard/T2 … 35+ PFUDOR/T7. Returns 0..6. */
export const abyssTier = (d: number): number => (d < 10 ? 0 : Math.min(6, Math.floor(d / 5) - 1));

/** Items.md:161-185 (sourced) trophy minimum quality by tier T1..T7. */
export const TROPHY_MIN: Quality[] = ['average', 'average', 'average', 'superior', 'superior', 'exquisite', 'magnificent'];
export const guaranteeQuality = (d: number): Quality => TROPHY_MIN[abyssTier(d)]!;

/** Monster level at depth d (decision 1, 暫定) before the existing monLvFollow term. */
export const abyssBaseLevel = (d: number): number => floorLevel(20) + ABYSS.levelOffset + ABYSS.levelPerDepth * d;
/** rc7 (a): abyss monster level at depth d for a player of level plv (see ABYSS.levelBase). follow = rc6 lvFollow term (floor mode only). */
export const abyssMonLevel = (d: number, plv: number, follow: number): number =>
  ABYSS.levelBase === 'player' ? Math.max(1, plv) + ABYSS.levelOffset + Math.round(ABYSS.playerLevelPerDepth * (d - 1)) : abyssBaseLevel(d) + follow;
/** PL centre: main-tower F20 centre + sourced PL ceiling modifier of the tier (the sum is 暫定). */
/** First depth of tier t (inverse of abyssTier). */
const tierStart = (t: number): number => (t === 0 ? 1 : 5 * (t + 1));
/** r4 (c): DIFF value of key at depth d, with the jump from the previous tier phased in over ABYSS.tierRamp depths. */
export function diffAt(d: number, key: 'hp' | 'dmg' | 'pl'): number {
  const t = abyssTier(d), cur = DIFF[t]![key];
  if (t === 0) return cur;
  const prev = DIFF[t - 1]![key], i = d - tierStart(t) - ABYSS.tierRampOffset + 1; // 1-based step inside the ramp
  const frac = Math.max(0, Math.min(1, i / Math.max(1, ABYSS.tierRamp)));
  return prev + (cur - prev) * frac;
}
export const abyssPl = (d: number): number => floorPl(20) + Math.round(diffAt(d, 'pl'));

/** HP and damage multipliers at depth d. */
export function abyssMult(d: number): { hp: number; dmg: number } {
  const t = { hp: diffAt(d, 'hp'), dmg: diffAt(d, 'dmg') };
  const k = d >= 40 ? Math.floor((d - 40) / ABYSS.past40.every) : 0; // d 40–44: base PFUDOR; +5% from 45
  return { hp: ABYSS.hpScale * t.hp * (1 + ABYSS.past40.hp * k), dmg: ABYSS.dmgScale * t.dmg * (1 + ABYSS.past40.dmg * k) * (RULES.cp7 ? cp7DepthDmg(d) : 1 + ABYSS.dmgPerDepth * (d - 1)) };
}

/** Affix count (doc §1.3, 暫定). */
export function affixCount(rng: Rng, d: number): number {
  if (d < 10) return rng.chance(CP5.eliteDoubleChance) ? 2 : 1;
  if (d < 20) return 2;
  if (d < 30) return rng.chance(0.3) ? 3 : 2;
  return 3;
}

/** Decision 6 (暫定): with 3 affixes 法抗 / 反魔 are banned (every CP5 sim death combo contains one of them = dangerHint set). */
export const TRIPLE_BANNED: AffixId[] = ['warded', 'antimagic'];
export function allowedIn(set: readonly AffixId[], id: AffixId, total: number): boolean {
  if (total >= 3 && TRIPLE_BANNED.includes(id)) return false;
  return set.every((a) => compatible(a, id));
}
export function pickAffixes(rng: Rng, n: number, banned: readonly AffixId[] = []): AffixId[] {
  const out: AffixId[] = [];
  while (out.length < n) {
    const pool = AFFIX_IDS.filter((a) => !banned.includes(a) && allowedIn(out, a, n));
    if (!pool.length) break;
    out.push(rng.weighted(pool.map((a) => [a, affixWeight(a)] as [AffixId, number])));
  }
  return out;
}
export const tripleOk = (ids: readonly AffixId[]) => ids.every((a, i) => ids.every((b, j) => i === j || compatible(a, b))) && (ids.length < 3 || !ids.some((a) => TRIPLE_BANNED.includes(a)));

/** Boss rotation (doc §1.4, 暫定): summon → shield → thorns → drain, keyed to the CP5 boss floor that owns the signature. */
export const bossKey = (d: number): number => [5, 10, 15, 20][(Math.floor(d / 5) - 1) % 4]!;
/** Boss extra affixes (暫定): 0 in round 1 (d 5–20), 1 from d 25, 2 from d 45; never 法抗/反魔. */
export const bossAffixCount = (d: number): number => (d >= 45 ? 2 : d >= 25 ? 1 : 0);
/** CP5 theme / floor key for non-boss content: cycles 1..20. */
export const themeKey = (d: number): number => ((d - 1) % 20) + 1;

/** Decision 4 (暫定): next trip may start right after the last cleared checkpoint. */
export const checkpointStart = (best: number): number => ABYSS.checkpoint * Math.floor(best / ABYSS.checkpoint) + 1;

/** One abyss floor (doc §1.5, 暫定): d%5==0 boss; d%5==4 rest + one non-combat; d%5 in 1,3 combat; d%5==2 non-combat. */
export function abyssFloor(rng: Rng, d: number, n: number): Floor {
  const r = d % 5;
  if (r === 0) return { n, options: ['boss'] };
  const combat = r === 1 || r === 3;
  const pool = TOWER.weights.filter(([t]) => (combat ? t === 'battle' || t === 'elite' : t !== 'battle' && t !== 'elite' && t !== 'rest'));
  const options: NodeType[] = r === 4 ? ['rest'] : [];
  const count = rng.chance(0.5) ? 3 : 2;
  while (options.length < count) {
    const left = pool.filter(([t]) => !options.includes(t));
    if (!left.length) break;
    options.push(rng.weighted(left));
  }
  return { n, options };
}

/** Decision 8 (暫定): local records. */
export type AbyssSchool = 'blade' | 'oc' | 'arcane' | 'bulwark' | 'none';
export interface AbyssRecord { best: number; trips: number; /** r2 decision 9: highest milestone depth claimed + titles. */ ms: number; titles: string[]; bySchool: Partial<Record<AbyssSchool, { best: number; trip: number }>> }
export const ABYSS_KEY = 'hv-v3-abyss';
export const emptyRecord = (): AbyssRecord => ({ best: 0, trips: 0, ms: 0, titles: [], bySchool: {} });
/** Record one finished trip. cleared = deepest depth cleared this trip. Returns true when a record was broken. */
export function recordTrip(rec: AbyssRecord, cleared: number, school: AbyssSchool): boolean {
  rec.trips++;
  let nb = false;
  if (cleared > rec.best) { rec.best = cleared; nb = true; }
  const s = rec.bySchool[school];
  if (!s || cleared > s.best) { rec.bySchool[school] = { best: cleared, trip: rec.trips }; nb = true; }
  return nb;
}
/** Store titles earned on a trip. */
export function recordTitles(rec: AbyssRecord, ms: number, titles: readonly string[]): void {
  rec.ms = Math.max(rec.ms, ms);
  for (const t of titles) if (!rec.titles.includes(t)) rec.titles.push(t);
}
export function loadRecord(raw: string | null): AbyssRecord {
  try { const r = raw ? JSON.parse(raw) : null; return r && typeof r.best === 'number' ? { ...emptyRecord(), ...r } : emptyRecord(); } catch { return emptyRecord(); }
}

/** rc3 design change (producer 2026-10-26, flag cp6Abyss): abyss elites also warn on 3-affix sets and on the sets hardest for
 * physical builds (尖刺 / 堅硬). Falls back to the CP5 magic warning first; text follows dangerHint's style. */
export const PHYS_HARD: AffixId[] = ['spikes', 'hard'];
export function abyssDangerHint(ids: readonly AffixId[]): string | null {
  const mag = dangerHint(ids);
  if (mag) return mag;
  const phys = ids.filter((a) => PHYS_HARD.includes(a));
  if (!phys.length && ids.length < 3) return null;
  const base = phys.length
    ? `${phys.map((a) => AFFIXES[a].zh).join('、')}克制物理：物理流改用法術或屬性技能，血量低於一半先喝藥`
    : '三詞綴精英血量與傷害都高：開場先防禦或補狀態，血量低於一半先喝藥';
  const extra = ids.filter((a) => !PHYS_HARD.includes(a)).map((a) => DANGER_EXTRA[a]).filter(Boolean);
  return `⚠ 高危險精英（${ids.map((a) => AFFIXES[a].zh).join('＋')}）：${[base, ...extra].join('；')}。本場打不過就多喝藥水慢慢打；之後在地圖上可以選別條路或先撤退回城補強。`;
}
