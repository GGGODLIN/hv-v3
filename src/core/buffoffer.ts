/** CP4 step 3: how buffs are acquired (docs/cp4-run-buffs.md §4). Every number here is 暫定. */
import { BUFF, BUFFS, type BuffDef, type Rarity, schoolCounts, SCHOOLS } from './buffs';
import { has } from './progress';
import type { Player } from './player';
import { Rng } from './rng';
import { RULES, runDerived, type RunState } from './run';
import type { NodeType } from './tower';

export type OfferSource = 'shrine' | 'elite' | 'boss';
export const OFFER_RARITY: Record<OfferSource | 'merchant', [number, number, number]> = {
  shrine: [70, 27, 3], elite: [55, 38, 7], boss: [30, 55, 15], merchant: [75, 25, 0], // decision 7: merchant never sells legend
};
export const OFFER_SIZE = 3;
export const MERCHANT_BUFFS = 2;
export const BUFF_PRICE: Record<Exclude<Rarity, 'legend'>, number> = { common: 120, rare: 300 };
export const SAME_SCHOOL_WEIGHT = 2;
/** Buff offers come from their own stream so tower / loot RNG never shifts (seed derived from run.seed + counter). */
function offerRng(run: RunState): Rng {
  run.offerN = (run.offerN ?? 0) + 1;
  return new Rng(((run.seed * 2654435761) ^ (run.offerN * 40503)) >>> 0 || 1);
}
/** Buffs whose system is not unlocked yet are never offered. */
export function eligible(p: Player, b: BuffDef): boolean {
  if (b.needs === 'spirit') return has(p, 'spirit');
  if (b.needs === 'spell') return has(p, 'spell');
  if (b.needs === 'skill') return has(p, 'ocSkill');
  return true;
}
export function rollBuffs(p: Player, run: RunState, src: OfferSource | 'merchant', n: number): string[] {
  const rng = offerRng(run);
  const held = run.buffs ?? [];
  const cnt = schoolCounts(held);
  const out: string[] = [];
  // Core guarantee: 2 of a school and no core yet -> the core is in the offer.
  for (const s of SCHOOLS) {
    const core = BUFFS.find((b) => b.school === s && b.core)!;
    if (cnt[s] >= 2 && !held.includes(core.id) && eligible(p, core) && out.length < n && src !== 'merchant') out.push(core.id);
  }
  const [c, r, l] = OFFER_RARITY[src];
  let needRare = src === 'boss';
  while (out.length < n) {
    const rar: Rarity = needRare ? (rng.chance(l / (r + l)) ? 'legend' : 'rare') : rng.weighted<Rarity>([['common', c], ['rare', r], ['legend', l]].filter((x) => (x[1] as number) > 0) as [Rarity, number][]);
    const pool = BUFFS.filter((b) => b.rarity === rar && eligible(p, b) && !out.includes(b.id) && (b.id.startsWith('S-') || !held.includes(b.id)));
    if (!pool.length) { if (rar === 'common') break; needRare = false; continue; }
    out.push(rng.weighted(pool.map((b) => [b.id, b.school !== 'none' && cnt[b.school] > 0 ? SAME_SCHOOL_WEIGHT : 1] as [string, number])));
    if (BUFF[out[out.length - 1]!]!.rarity !== 'common') needRare = false;
  }
  return out;
}
/** Open a pick-one offer (shrine, elite win, boss win). */
export function openOffer(p: Player, run: RunState, src: OfferSource): string[] {
  const ids = rollBuffs(p, run, src, OFFER_SIZE);
  if (ids.length) run.offer = { src, ids };
  return ids;
}
export function takeBuff(p: Player, run: RunState, id: string): string {
  const b = BUFF[id]!;
  run.buffs = [...(run.buffs ?? []), id];
  run.offer = null;
  if (id === 'S-vigor') run.hp = runDerived(p, run).hp;
  return `獲得【${b.zh}】：${b.desc}`;
}
export const skipOffer = (run: RunState) => { run.offer = null; };
/** Offers after a won fight: elite 1, boss 2 (the second opens after the first is taken). */
export const winOffers = (type: NodeType): number => (type === 'boss' ? 2 : type === 'elite' ? 1 : 0);
export function merchantBuffs(p: Player, run: RunState): { id: string; price: number }[] {
  const pm = 1 + ((run.buffs ?? []).filter((x) => x === 'N2').length * -0.15);
  return rollBuffs(p, run, 'merchant', MERCHANT_BUFFS).map((id) => ({ id, price: Math.round(BUFF_PRICE[BUFF[id]!.rarity as 'common'] * RULES.merchantMarkup * pm) }));
}
