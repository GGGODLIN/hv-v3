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
export function makePool(rows: MonsterRow[]): MonsterPool {
  return { rows: rows.filter((r) => !EXCL.has(r[5])).sort((a, b) => a[3] - b[3]) };
}

export function pickRows(rng: Rng, pool: MonsterPool, plMin: number, plMax: number, n: number): MonsterRow[] {
  const lo = lowerBound(pool.rows, plMin);
  const hi = Math.max(lo + 1, lowerBound(pool.rows, plMax + 1));
  const out: MonsterRow[] = [];
  for (let i = 0; i < n; i++) out.push(pool.rows[Math.min(pool.rows.length - 1, rng.int(lo, hi - 1))]!);
  return out;
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
  boss: { hp: 5, dmg: 1.3 },
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
    uid: uid++, name, race, pl, level, rank, attrs, hp: maxHp, maxHp,
    adb: (adbFromAttrs(attrs.str, attrs.dex, true) + level * 0.5) * RANK_MULT[rank].dmg,
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
