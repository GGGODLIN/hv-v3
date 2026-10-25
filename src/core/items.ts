import { CONSTANTS as C } from './data/constants';
import type { Rng } from './rng';
import { ARMOR_SLOT_ZH, BASE_ZH, PREFIX_ZH, SUFFIX_ZH } from './equip-zh';

export const QUALITIES = ['crude', 'fair', 'average', 'superior', 'exquisite', 'magnificent', 'legendary', 'peerless'] as const;
export type Quality = (typeof QUALITIES)[number];
export const QUALITY_ZH: Record<Quality, string> = {
  crude: '粗糙', fair: '尚可', average: '普通', superior: '優良', exquisite: '精良', magnificent: '華麗', legendary: '傳說', peerless: '無雙',
};
export const QUALITY_COLOR: Record<Quality, number> = {
  crude: 0x8a8a8a, fair: 0xd8d8d8, average: 0x4fd06a, superior: 0x4aa3ff, exquisite: 0xb36bff, magnificent: 0xff9f2e, legendary: 0xffd84a, peerless: 0xff4a6a,
};

export const SLOTS = ['mainHand', 'offHand', 'head', 'body', 'hands', 'legs', 'feet'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_ZH: Record<Slot, string> = { mainHand: '主手', offHand: '副手', head: '頭', body: '身', hands: '手', legs: '腿', feet: '腳' };

export type Group = 'oneHand' | 'twoHand' | 'staff' | 'shield' | 'cloth' | 'light' | 'heavy';
export type StatKey = keyof typeof C['F-003-equip-stats']['value'];

export interface Equip {
  id: string;
  base: string;
  group: Group;
  slot: Slot;
  quality: Quality;
  roll: number;
  level: number;
  prefix: string | null;
  suffix: string | null;
  pabs: string[];
  damageType: 'slashing' | 'crushing' | 'piercing' | null;
  /** Item World upgrade level (rest node). */
  iw: number;
  stats: Partial<Record<StatKey, number>>;
}

const RANGES = C['F-003-equip-ranges'].value as unknown as Record<string, [string, string, number, number][]>;
const BASES = C['F-003-equip-bases'].value as unknown as Record<string, { name: string; kind: Group; damage?: string; prefixes: [string, number][]; suffixes: [string, number][] }>;
const DERIVED = C['F-003-derived-bases'].value as unknown as Record<string, { ref: string; arrows: Record<string, number>; borrow?: { from: string; stats: string[] } }>;
const STAT_DEF = C['F-003-equip-stats'].value as unknown as Record<string, { fluc: number; scale: number | null }>;
const GROUPS = C['F-003-base-groups'].value as unknown as Record<Group, { slots: string[]; common: string[]; rare: string[] }>;
const QRANGE = C['003-01a'].value as unknown as Record<string, [number, number]>;
const ARMOR_MULT = C['F-003-armor-slots'].value as unknown as Record<string, number>;
const ARROW = C['F-003-arrow-factor'].value.perArrow;
const CURVE = C['P-003-roll-curve'].value as unknown as { exponent?: number };
const CURVE_EXP = typeof CURVE.exponent === 'number' ? CURVE.exponent : 1.52;
const PAB_SUFFIX = C['F-003-pab-suffixes'].value as unknown as Record<string, string>;
const PAB_COUNTS = C['F-003-pab-counts'].value as unknown as Record<string, number[]>;
const AFFIX = C['P-affix-chance'].value as unknown as { suffix: Record<string, number>; prefix: Record<string, number> };
const PREFIX_NAMES = C['F-003-prefix-names'].value as unknown as Record<string, string>;
const SUFFIX_NAMES = C['F-003-suffix-names'].value as unknown as Record<string, string>;
const SLOT_NAMES = C['F-003-armor-slot-names'].value as unknown as Record<string, Record<string, string>>;
const ATTR_KEYS = ['str', 'dex', 'agi', 'end', 'int', 'wis'];

export function baseName(base: string): string {
  return BASES[base]?.name ?? base;
}

/** Ranges for a base, resolving derived bases through ref + arrows (each arrow = x1.1 or /1.1). */
export function rangesFor(base: string): [string, string, number, number][] {
  if (RANGES[base]) return RANGES[base]!;
  const d = DERIVED[base];
  if (!d) throw new Error(`no ranges for ${base}`);
  const rows = rangesFor(d.ref).map(([s, w, a, b]) => {
    const n = d.arrows[s] ?? 0;
    const f = Math.pow(ARROW, n);
    return [s, w, a * f, b * f] as [string, string, number, number];
  });
  if (d.borrow) {
    const from = rangesFor(d.borrow.from).filter(([s]) => d.borrow!.stats.includes(s));
    return [...rows.filter(([s]) => !d.borrow!.stats.includes(s)), ...from];
  }
  return rows;
}

/** Stat value at quality roll R (0..200): B0 + (B200 - B0) * (R/200)^1.52, then level scaling. */
export function statValue(stat: string, min: number, max: number, R: number, level: number): number {
  const def = STAT_DEF[stat];
  if (!def) return 0;
  const b0 = min * def.fluc;
  const b200 = max * def.fluc;
  const share = R <= 200 ? Math.pow(R / 200, CURVE_EXP) : R / 200;
  const v = b0 + (b200 - b0) * share;
  return def.scale ? v * (1 + level / def.scale) : v;
}

function condMatches(when: string, prefix: string | null, suffix: string | null): boolean {
  if (!when) return true;
  return when.split('+').every((c) => {
    const [k, v] = c.split('=');
    return k === 'p' ? prefix === v : k === 's' ? suffix === v : false;
  });
}

export function rollQuality(rng: Rng, min: Quality = 'crude', bump = 0): Quality {
  const w = Object.entries(C['003-03a'].value) as [Quality, number][];
  let q: Quality = rng.weighted(w);
  if (rng.chance(C['003-03b'].value.magnificentChance)) q = 'magnificent';
  let idx = Math.max(QUALITIES.indexOf(q), QUALITIES.indexOf(min)) + bump;
  idx = Math.min(idx, QUALITIES.indexOf('legendary'));
  return QUALITIES[idx]!;
}

let idCounter = 0;
export function newId(rng: Rng): string {
  return `e${Date.now().toString(36)}${(idCounter++).toString(36)}${rng.int(0, 1e6).toString(36)}`;
}

export interface GenOpts {
  minQuality?: Quality;
  qualityBump?: number;
  group?: Group;
  base?: string;
  slot?: Slot;
  quality?: Quality;
}

export function generateEquip(rng: Rng, level: number, opts: GenOpts = {}): Equip {
  const weights = Object.entries(C['F-003-slot-weights'].value) as [Group, number][];
  const group = opts.group ?? rng.weighted(weights);
  const g = GROUPS[group];
  const pool = g.common.filter((b) => BASES[b] && (RANGES[b] || DERIVED[b]));
  const base = opts.base ?? rng.pick(pool);
  const slotName = opts.slot ?? (rng.pick(g.slots) as Slot);
  const quality = opts.quality ?? rollQuality(rng, opts.minQuality, opts.qualityBump ?? 0);
  const [lo, hi] = QRANGE[quality]!;
  const roll = rng.int(lo, hi);
  const def = BASES[base]!;

  let suffix: string | null = null;
  let prefix: string | null = null;
  const qi = QUALITIES.indexOf(quality);
  const sufChance = qi >= QUALITIES.indexOf('superior') ? 1 : (AFFIX.suffix[quality] ?? 0);
  const preChance = qi < QUALITIES.indexOf('superior') ? 0 : (AFFIX.prefix[quality] ?? 1);
  if (def.suffixes.length && rng.chance(sufChance)) suffix = rng.weighted(def.suffixes);
  if (def.prefixes.length && rng.chance(preChance)) prefix = rng.weighted(def.prefixes);

  // Primary attribute bonuses: count from the quality table, plus the one a PAB suffix forces.
  const rows = rangesFor(base);
  const attrRows = rows.filter(([s]) => ATTR_KEYS.includes(s)).map(([s]) => s);
  const pabs: string[] = [];
  if (suffix && PAB_SUFFIX[suffix] && attrRows.includes(PAB_SUFFIX[suffix]!)) pabs.push(PAB_SUFFIX[suffix]!);
  const counts = PAB_COUNTS[qi >= 5 ? 'magnificent' : quality];
  if (counts) {
    const n = rng.weighted(counts.map((w, i) => [i, w] as const));
    const free = attrRows.filter((a) => !pabs.includes(a));
    for (let i = 0; i < n && free.length; i++) pabs.push(free.splice(rng.int(0, free.length - 1), 1)[0]!);
  }

  const slotMult = group === 'cloth' || group === 'light' || group === 'heavy' ? (ARMOR_MULT[slotName] ?? 1) : 1;
  const stats: Partial<Record<StatKey, number>> = {};
  for (const [stat, when, min, max] of rows) {
    if (stat in stats) continue;
    if (ATTR_KEYS.includes(stat) && !pabs.includes(stat)) continue;
    if (!condMatches(when, prefix, suffix)) continue;
    let v = statValue(stat, min, max, roll, level);
    if (stat !== 'burden' && stat !== 'interference') v *= slotMult;
    if (v !== 0) stats[stat as StatKey] = Math.round(v * 100) / 100;
  }
  const dmg = def.damage as Equip['damageType'] | undefined;
  return {
    id: newId(rng), base, group, slot: slotName, quality, roll, level, prefix, suffix, pabs,
    damageType: dmg ?? (group === 'staff' ? 'crushing' : null), iw: 0, stats,
  };
}

/** CP3 polish: Chinese display name, e.g. 「優良・平衡之烈焰長劍+2」 (all words 暫定, see equip-zh.ts). */
export function equipName(e: Equip): string {
  let core = BASE_ZH[e.base] ?? baseName(e.base);
  if (['cloth', 'light', 'heavy'].includes(e.group)) {
    const fam = e.base === 'power' ? 'power' : e.group;
    const slot: string = ARMOR_SLOT_ZH[fam]?.[e.slot] ?? e.slot;
    core += slot;
  }
  const pre = e.prefix ? PREFIX_ZH[e.prefix] ?? e.prefix : '';
  const suf = e.suffix ? `${SUFFIX_ZH[e.suffix] ?? e.suffix}之` : '';
  return `${QUALITY_ZH[e.quality]}・${suf}${pre}${core}${e.iw ? `+${e.iw}` : ''}`;
}

/** The pre-polish English name from the sourced word lists (kept for reference / tooltips). */
export function equipNameEn(e: Equip): string {
  let core = baseName(e.base);
  if (['cloth', 'light', 'heavy'].includes(e.group)) {
    const fam = e.base === 'power' ? 'power' : e.group;
    core = `${core} ${SLOT_NAMES[fam]?.[e.slot] ?? e.slot}`;
  } else if (e.group === 'staff' && !/\bStaff$/.test(core)) core = `${core} Staff`;
  else if (e.group === 'shield' && !/\bShield$/.test(core)) core = `${core} Shield`; // CP3-fix 5: base names like 'Kite Shield' already end in it
  const pre = e.prefix ? `${PREFIX_NAMES[e.prefix] ?? e.prefix} ` : '';
  const sufName = e.suffix ? SUFFIX_NAMES[e.suffix] ?? e.suffix : '';
  const suf = sufName ? (/^of /i.test(sufName) ? ` ${sufName}` : ` of ${sufName}`) : '';
  const q = e.quality[0]!.toUpperCase() + e.quality.slice(1);
  return `${q} ${pre}${core}${suf}${e.iw ? ` +${e.iw}` : ''}`;
}

/** Item World level multiplier on level-scaling stats (provisional: +4% per IW level). */
export const IW_STEP = 0.04;
export function effectiveStats(e: Equip): Partial<Record<StatKey, number>> {
  if (!e.iw) return e.stats;
  const out: Partial<Record<StatKey, number>> = {};
  for (const [k, v] of Object.entries(e.stats)) {
    const scaled = STAT_DEF[k]?.scale ? v! * (1 + IW_STEP * e.iw) : v!;
    out[k as StatKey] = Math.round(scaled * 100) / 100;
  }
  return out;
}

const SELL = C['F-005-003-04e-sell'].value;
/** Sell price in credits: findings/005 003-04e (F-005-003-04e-sell). */
/** 暫定 (CP3-fix 1): per-tier sell-price step above Average. */
export const SELL_TIER_STEP = 1.2;

export function sellPrice(e: Equip): number {
  if (e.quality === 'crude' || e.quality === 'fair' || e.quality === 'average') return Math.min(SELL.cap, Math.round(SELL.belowSuperior[e.quality] * (1 + e.level / SELL.levelDivisor)));
  const s = SELL.salvage[e.quality];
  const salvage = Math.round(SELL.materialPrice[s.grade as 'low' | 'mid' | 'high'] * s.count * SELL.salvageShare);
  // 暫定 (CP3-fix 1): 003-04e as written gives Superior 1 Low x 200 x 50% = 100 C, below Average (2,500+).
  // Floor every tier above Average at the Average price (no 5,000 cap) x SELL_TIER_STEP per tier, so higher quality never sells for less.
  const tiers = QUALITIES.indexOf(e.quality) - QUALITIES.indexOf('average');
  const floor = Math.round(SELL.belowSuperior.average * (1 + e.level / SELL.levelDivisor) * SELL_TIER_STEP ** tiers);
  return Math.max(salvage, floor);
}

export function blocksOffHand(e: Equip | undefined): boolean {
  return !!e && (e.group === 'twoHand' || e.group === 'staff');
}
