import { CONSTANTS as C } from './data/constants';
import type { Rng } from './rng';

export type Avoid = 'evade' | 'parry' | 'block' | 'resist' | null;
export interface HitInput {
  raw: number;
  magic: boolean;
  /** Attacker accuracy (fraction) — scales the defender's avoid chances by (1 - acc). */
  acc: number;
  evade: number; parry: number; block: number; resist: number;
  counterResist?: number;
  critChance: number; critMod: number;
  /** Monster crit: fixed chance, single multiplier, no stacking. */
  flatCrit?: { chance: number; bonus: number };
  mit: number;
  spec: number;
  canEvade?: boolean;
}
export interface HitResult {
  damage: number;
  avoided: Avoid;
  /** Damage multiplier from avoidance (1 = full hit, 0.5 = glancing/partial, 0 = fully avoided). */
  avoidMult: number;
  crits: number;
  full: boolean;
}

const TWO_ROLL = C['002-01b'].value.multipliersBySuccesses;
const RESIST = [1, 0.5, 0.25, 0.1];
const CRIT = C['F-002-1.2F-crit'].value;
const ROLL = C['F-002-5.1D-roll'].value;

function rolls(rng: Rng, n: number, p: number): number {
  let k = 0;
  for (let i = 0; i < n; i++) if (rng.chance(p)) k++;
  return k;
}

/**
 * The damage chain (findings 002 5.1): evade -> parry (phys) -> block -> resist (spells) -> crit (full hits only)
 * -> mitigation -> specific mitigation -> uniform 0.80..1.20 roll.
 */
/** cp8-rc6 item 6: expected damage of a hit that lands in full — mean damage roll, no crit, no avoidance (same formula as below). */
/** cp8-rc10 P0-3: the largest damage one hit can roll (top roll, crit multiplier `critMult`), before avoidance and the per-turn cap. */
export const maxHit = (raw: number, mit: number, spec: number, critMult = 1): number => Math.max(1, Math.floor(raw * critMult * (1 - mit) * (1 - spec) * (ROLL.max / 100)));
export const meanHit = (raw: number, mit: number, spec: number): number => Math.max(1, Math.floor(raw * (1 - mit) * (1 - spec) * ((ROLL.min + ROLL.max) / 200)));
export function resolveHit(rng: Rng, h: HitInput): HitResult {
  let mult = 1;
  let avoided: Avoid = null;
  const eff = (p: number) => Math.max(0, p * (1 - h.acc));
  const step = (name: Avoid, n: number, p: number, table: readonly number[]) => {
    if (mult === 0 || p <= 0) return;
    const k = rolls(rng, n, p);
    const m = table[Math.min(k, table.length - 1)]!;
    if (m < 1) { mult *= m; avoided ??= name; }
  };
  if (h.canEvade !== false) step('evade', 2, eff(h.evade), TWO_ROLL);
  if (!h.magic) step('parry', 2, eff(h.parry), TWO_ROLL);
  if (!h.magic) step('block', 2, eff(h.block), TWO_ROLL);
  if (h.magic) step('resist', 3, Math.max(0, h.resist * (1 - (h.counterResist ?? 0))), RESIST);
  if (mult === 0) return { damage: 0, avoided, avoidMult: 0, crits: 0, full: false };
  const full = mult === 1;
  let crits = 0;
  let critMult = 1;
  if (full) {
    if (h.flatCrit) {
      if (rng.chance(h.flatCrit.chance)) { crits = 1; critMult = 1 + h.flatCrit.bonus; }
    } else if (rng.chance(Math.min(CRIT.firstRollCap, h.critChance))) {
      crits = 1;
      const p2 = Math.min(CRIT.stackRollCap, h.critChance * CRIT.stackRollFactor);
      while (crits < CRIT.maxStacks && rng.chance(p2)) crits++;
      critMult = 1 + crits * h.critMod;
    }
  }
  const roll = rng.int(ROLL.min, ROLL.max) / 100;
  const dmg = Math.floor(h.raw * mult * critMult * (1 - h.mit) * (1 - h.spec) * roll);
  return { damage: Math.max(1, dmg), avoided, avoidMult: mult, crits, full };
}
