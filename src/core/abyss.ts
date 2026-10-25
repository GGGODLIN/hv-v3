/**
 * CP6 深淵塔 (docs/cp6-abyss.md §9 producer decisions). Used only when RULES.cp6Abyss is on.
 * Sourced values cite their file; everything else is 暫定（缺原版出處）.
 */
import { AFFIX_IDS, CP5, affixWeight, compatible, type AffixId } from './cp5';
import type { Quality } from './items';
import type { Rng } from './rng';
import type { NodeType, Floor } from './tower';
import { TOWER, floorLevel, floorPl } from './tower';

export const ABYSS = {
  /** Decision 1 (暫定): +2 monster levels per depth. Original The Tower is floor × 10 (The_Tower.md:9) — deliberately not used. */
  levelPerDepth: 2,
  /** Decision 2: +2% monster damage per depth, cumulative (original: +2% per wave, Battles.md:261; wave→depth is 暫定). */
  dmgPerDepth: 0.02,
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
  hpScale: 0.55,
  /** r2 tuning knob (暫定): abyss monster damage ×. */
  dmgScale: 0.55,
  /** r2b knob (暫定): extra damage × for the abyss boss at a given depth (missing = 1). */
  bossDmgAt: { 15: 0.6 } as Record<number, number>,
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

/** The_Tower.md:32-48 (sourced): d 1–9 Normal/T1, 10–14 Hard/T2 … 35+ PFUDOR/T7. Returns 0..6. */
export const abyssTier = (d: number): number => (d < 10 ? 0 : Math.min(6, Math.floor(d / 5) - 1));

/** Items.md:161-185 (sourced) trophy minimum quality by tier T1..T7. */
export const TROPHY_MIN: Quality[] = ['average', 'average', 'average', 'superior', 'superior', 'exquisite', 'magnificent'];
export const guaranteeQuality = (d: number): Quality => TROPHY_MIN[abyssTier(d)]!;

/** Monster level at depth d (decision 1, 暫定) before the existing monLvFollow term. */
export const abyssBaseLevel = (d: number): number => floorLevel(20) + ABYSS.levelOffset + ABYSS.levelPerDepth * d;
/** PL centre: main-tower F20 centre + sourced PL ceiling modifier of the tier (the sum is 暫定). */
export const abyssPl = (d: number): number => floorPl(20) + DIFF[abyssTier(d)]!.pl;

/** HP and damage multipliers at depth d. */
export function abyssMult(d: number): { hp: number; dmg: number } {
  const t = DIFF[abyssTier(d)]!;
  const k = d >= 40 ? Math.floor((d - 40) / ABYSS.past40.every) : 0; // d 40–44: base PFUDOR; +5% from 45
  return { hp: ABYSS.hpScale * t.hp * (1 + ABYSS.past40.hp * k), dmg: ABYSS.dmgScale * t.dmg * (1 + ABYSS.past40.dmg * k) * (1 + ABYSS.dmgPerDepth * (d - 1)) };
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
