import { BUFFS, type School } from './buffs';

/** CP4 §7-4 usage rule (rc4 revision): core buffs B1/O1/A1/W1 uncapped; every other buff in ≤80% of clear sets;
 * each own-school buff picked ≥5% of the times it is offered under that school's strategy. Sim acceptance only. */
export const CP4_CORE = ['B1', 'O1', 'A1', 'W1'] as const;
export const CP4_MAX_SHARE = 0.8;
export const CP4_MIN_PICK = 0.05;
export interface Cp4Check { pass: boolean; over: string[]; dead: string[] }
export function cp4UsageCheck(clearSets: string[][], picked: Record<string, number>, offered: Record<string, number>, school: School | null): Cp4Check {
  const freq: Record<string, number> = {};
  for (const set of clearSets) for (const k of new Set(set)) freq[k] = (freq[k] ?? 0) + 1;
  const n = clearSets.length;
  const over = n ? Object.entries(freq).filter(([k, v]) => !(CP4_CORE as readonly string[]).includes(k) && v / n > CP4_MAX_SHARE).map(([k, v]) => `${k}:${Math.round(100 * v / n)}%`) : [];
  const dead = school && school !== 'none' ? BUFFS.filter((b) => b.school === school && (offered[b.id] ?? 0) > 0 && (picked[b.id] ?? 0) / offered[b.id]! < CP4_MIN_PICK).map((b) => b.id) : [];
  return { pass: !over.length && !dead.length, over, dead };
}
