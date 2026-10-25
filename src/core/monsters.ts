import { bossName, cleanRow } from './names';
import { CONSTANTS as C } from './data/constants';
import { type Attrs, ATTRS, adbFromAttrs, attrMitigation, monsterAvoid } from './formulas';
import type { DmgType, Element } from './player';
import type { Rng } from './rng';

/** [id, race, name, pl, attack, trainer, piercing, crushing, slashing, cold, wind, elec, fire, dark, holy] */
export type MonsterRow = [number, string, string, number, string, string, number, number, number, number, number, number, number, number, number];

export interface MonsterPool {
  rows: MonsterRow[];
}

const EXCL = new Set<string>(C['F-005-pool-exclusions'].value.trainers as readonly string[]);
/** rc7 (c): monster base damage has no level term in the source (parsed_wiki/Monster_Stats.md:56, STR*2+DEX only).
 *  The old `+ level * 0.5` (since 4a8aefa) had no source; 0 = source. Sim A/B switch only. */
export const MON_ADB = { levelTerm: 0 };

export function makePool(rows: MonsterRow[]): MonsterPool {
  // CP3-bugfix 2: neutral display names for sexual / inappropriate / gibberish names (stats unchanged).
  return { rows: rows.filter((r) => !EXCL.has(r[5])).map((r) => cleanRow(r)).sort((a, b) => a[3] - b[3]) };
}

export function pickRows(rng: Rng, pool: MonsterPool, plMin: number, plMax: number, n: number, w?: (r: MonsterRow) => number): MonsterRow[] {
  const lo = lowerBound(pool.rows, plMin);
  const hi = Math.max(lo + 1, lowerBound(pool.rows, plMax + 1));
  const out: MonsterRow[] = [];
  for (let i = 0; i < n; i++) out.push(w ? weightedPick(rng, pool, lo, hi, w) : pool.rows[Math.min(pool.rows.length - 1, rng.int(lo, hi - 1))]!);
  return out;
}
/** CP5 §3: weighted pick inside [lo, hi) (theme weighting, never a filter). One rng draw. */
function weightedPick(rng: Rng, pool: MonsterPool, lo: number, hi: number, w: (r: MonsterRow) => number): MonsterRow {
  hi = Math.min(hi, pool.rows.length);
  let tot = 0;
  for (let i = lo; i < hi; i++) tot += w(pool.rows[i]!);
  if (!(tot > 0)) return pool.rows[Math.min(pool.rows.length - 1, rng.int(lo, hi - 1))]!;
  let x = rng.next() * tot;
  for (let i = lo; i < hi; i++) { x -= w(pool.rows[i]!); if (x < 0) return pool.rows[i]!; }
  return pool.rows[hi - 1]!;
}
/** design §4: PL centre ±15%; if empty, widen to ±25% then ±40%. */
export const PL_WINDOWS = [0.15, 0.25, 0.4] as const;
/** Safety floor: a monster needs PL 25 to join battles (constants F-005-pl-window.minParticipationPl). */
export const MIN_PL: number = C['F-005-pl-window'].value.minParticipationPl;
export const widenLog: { center: number; width: number }[] = [];
export function plWindow(pool: MonsterPool, center: number): { lo: number; hi: number; width: number } {
  for (const w of PL_WINDOWS) {
    const lo = Math.max(MIN_PL, Math.round(center * (1 - w))), hi = Math.max(MIN_PL, Math.round(center * (1 + w)));
    if (lowerBound(pool.rows, hi + 1) > lowerBound(pool.rows, lo)) {
      if (w !== PL_WINDOWS[0]) widenLog.push({ center, width: w });
      return { lo, hi, width: w };
    }
  }
  const w = PL_WINDOWS[PL_WINDOWS.length - 1]!;
  widenLog.push({ center, width: -1 });
  return { lo: Math.max(MIN_PL, Math.round(center * (1 - w))), hi: Math.max(MIN_PL, Math.round(center * (1 + w))), width: -1 };
}
/** design §4: elites/bosses come from the top 10% PL of the window (at least one row). */
export function pickTop(rng: Rng, pool: MonsterPool, plMin: number, plMax: number, w?: (r: MonsterRow) => number): MonsterRow {
  const a = lowerBound(pool.rows, plMin);
  const b = Math.max(a + 1, lowerBound(pool.rows, plMax + 1));
  const start = Math.max(a, b - Math.max(1, Math.ceil((b - a) * 0.1)));
  if (w) return weightedPick(rng, pool, start, b, w);
  return pool.rows[Math.min(pool.rows.length - 1, rng.int(start, b - 1))]!;
}
function lowerBound(rows: MonsterRow[], pl: number): number {
  let a = 0, b = rows.length;
  while (a < b) { const m = (a + b) >> 1; if (rows[m]![3] < pl) a = m + 1; else b = m; }
  return a;
}

export type Rank = 'normal' | 'elite' | 'boss';
export interface Monster {
  uid: number;
  name: string;
  race: string;
  pl: number;
  level: number;
  rank: Rank;
  attrs: Attrs;
  hp: number; maxHp: number;
  adb: number;
  attackType: DmgType;
  acc: number;
  evade: number; parry: number; resist: number;
  physMit: number; magMit: number;
  spec: Record<DmgType | Element, number>;
  status: { stun: number; bleed: number; bleedTurns: number };
  charge: number;
  /** CP3-fix 8 (暫定): extra boss phases left; at 0 HP the boss rises again instead of dying. */
  phases?: number;
  enraged?: boolean;
}

const CLASSES = C['F-005-monster-classes'].value as unknown as Record<string, { start: Attrs; resist: Record<string, number>; attack: string }>;
const GROW = C['F-005-monster-growth'].value;
const SCALE = C['F-005-monster-scaling'].value;
const HP = C['F-005-monster-hp'].value;

/** Points N in each primary such that 6 * PL(N) roughly equals the monster's PL. PL(N) = N*(6+(N-1)*0.5)/2. */
export function primaryPointsForPl(pl: number): number {
  const per = pl / 6;
  let n = 0;
  while (n < GROW.attributePointCap && ((n + 1) * (2 * GROW.primaryPlFirst + n * GROW.primaryPlStep)) / 2 <= per) n++;
  return n;
}

export function scaleStat(base: number, L: number): number {
  return Math.floor(SCALE.levelFactor * base * L + Math.pow(L, SCALE.levelExponent) * SCALE.levelCoefficient);
}

/** Provisional rank multipliers on HP and damage for elites and bosses in the tower. */
export const RANK_MULT: Record<Rank, { hp: number; dmg: number }> = {
  normal: { hp: 1, dmg: 1 },
  elite: { hp: 2.5, dmg: 1.25 },
  boss: { hp: 2.2, dmg: 0.6 }, // 暫定 (CP2b): hp 5 -> 2.5 (CP2) -> 2.2 so boss fights last ~10-15 turns; dmg 暫定 (round 5)
};

let uid = 1;
export function buildMonster(row: MonsterRow, level: number, rank: Rank = 'normal'): Monster {
  const [, race, name, pl, attack, , pierce, crush, slash, cold, wind, elec, fire, dark, holy] = row;
  const cls = CLASSES[race] ?? CLASSES.Beast!;
  const n = primaryPointsForPl(pl);
  const attrs = {} as Attrs;
  for (const a of ATTRS) {
    const inc = Math.min(GROW.incrementMax, Math.max(GROW.incrementMin, cls.start[a] / GROW.incrementDivisor));
    attrs[a] = scaleStat(cls.start[a] + n * inc, level);
  }
  const hpMod = Math.max(1, (level - HP.levelModFloorLevel) * HP.levelModPerLevel);
  const maxHp = Math.round((HP.base + HP.perLevel * level + HP.perEnd * attrs.end) * hpMod * RANK_MULT[rank].hp);
  const physTypes = ['Piercing', 'Crushing', 'Slashing'];
  const attackType = (physTypes.includes(attack) ? attack.toLowerCase() : 'crushing') as DmgType;
  return {
    uid: uid++, name: rank === 'boss' ? bossName(name) : name, race, pl, level, rank, attrs, hp: maxHp, maxHp,
    adb: (adbFromAttrs(attrs.str, attrs.dex, true) + level * MON_ADB.levelTerm) * RANK_MULT[rank].dmg,
    attackType,
    acc: (attrs.dex * C['P-monster-accuracy'].value.accuracyPerDexterity) / 100,
    evade: monsterAvoid(attrs.agi, level),
    parry: monsterAvoid(attrs.dex, level),
    resist: monsterAvoid(attrs.wis, level),
    physMit: attrMitigation(attrs.end, attrs.agi, true),
    magMit: attrMitigation(attrs.end, attrs.wis, true),
    spec: { piercing: pierce, crushing: crush, slashing: slash, cold, wind, elec, fire, dark, holy },
    status: { stun: 0, bleed: 0, bleedTurns: 0 },
    charge: 0,
  };
}
