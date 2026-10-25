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
export const SCHOOL_GUARANTEE = true; // decision 2026-10-25 #1, 暫定
/** The guaranteed same-school option is the school's core while it is not held (暫定). */
export const CORE_FIRST = true;
export const SAME_SCHOOL_WEIGHT = 4; // step 6 tuning (was 2), 暫定
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
export function rollBuffs(p: Player, run: RunState, src: OfferSource | 'merchant', n: number, weights?: [number, number, number]): string[] {
  const rng = offerRng(run);
  const held = run.buffs ?? [];
  const cnt = schoolCounts(held);
  const out: string[] = [];
  // Core guarantee: 2 of a school and no core yet -> the core is in the offer.
  for (const s of SCHOOLS) {
    const core = BUFFS.find((b) => b.school === s && b.core)!;
    if (cnt[s] >= 2 && !held.includes(core.id) && eligible(p, core) && out.length < n && src !== 'merchant' && !weights) out.push(core.id);
  }
  // Decision 2026-10-25 #1 (暫定): once a school has ≥1 buff, the next pick-one offer has ≥1 option of it
  // (the most-held school; ties → the one held first). Merchant and weighted test rolls are exempt.
  if (SCHOOL_GUARANTEE && src !== 'merchant' && !weights && out.length < n) {
    const top = SCHOOLS.filter((s) => cnt[s] > 0).sort((a, b) => cnt[b] - cnt[a] || held.findIndex((id) => BUFF[id]!.school === a) - held.findIndex((id) => BUFF[id]!.school === b))[0];
    if (top && !out.some((id) => BUFF[id]!.school === top)) {
      const pool = BUFFS.filter((b) => b.school === top && eligible(p, b) && !held.includes(b.id) && (src === 'boss' || b.rarity !== 'legend'));
      const core = pool.find((b) => b.core);
      if (core && CORE_FIRST) out.push(core.id);
      else if (pool.length) out.push(rng.weighted(pool.map((b) => [b.id, OFFER_RARITY[src][b.rarity === 'common' ? 0 : b.rarity === 'rare' ? 1 : 2] || 1] as [string, number])));
    }
  }
  const [c, r, l] = weights ?? OFFER_RARITY[src];
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
/** Offers after a won fight (step 6 tuning, 暫定): boss 1; elite 1 on every ELITE_OFFER_EVERY-th elite win of the trip (1st, 3rd, ...). Mutates run.eliteWins. */
export const ELITE_OFFER_EVERY = 2;
export function winOffers(type: NodeType, run: RunState): number {
  if (type === 'boss') return 1;
  if (type !== 'elite') return 0;
  run.eliteWins = (run.eliteWins ?? 0) + 1;
  return (run.eliteWins - 1) % ELITE_OFFER_EVERY === 0 ? 1 : 0;
}
export function merchantBuffs(p: Player, run: RunState): { id: string; price: number }[] {
  const pm = 1 + ((run.buffs ?? []).filter((x) => x === 'N2').length * -0.15);
  return rollBuffs(p, run, 'merchant', MERCHANT_BUFFS).map((id) => ({ id, price: Math.round(BUFF_PRICE[BUFF[id]!.rarity as 'common'] * RULES.merchantMarkup * pm) }));
}

// ---- CP4 step 4: shrine risk events (doc §5). All 暫定.
export type RiskId = 'blood' | 'tithe' | 'curse' | 'discard' | 'gamble';
export const RISKS: Record<RiskId, { zh: string; cost: string; reward: string }> = {
  blood: { zh: '血祭', cost: '失去 30% 目前 HP', reward: '稀有 buff 三選一' },
  tithe: { zh: '獻金', cost: '支付本趟 Credits 的 40%', reward: '傳說機率 ×3 的三選一' },
  curse: { zh: '詛咒契約', cost: '本趟物理／魔法減傷 −5%', reward: '隨機一個傳說 buff' },
  discard: { zh: '捨棄', cost: '移除一個已持有的 buff', reward: '同稀有度三選一' },
  gamble: { zh: '賭運', cost: '50%：下一場開場 OC 歸 0（不受 O3 影響）', reward: '50%：一個普通 buff' },
};
export const CURSE_MIT = 0.05;
/** Shrine (flag on): a normal 3-choice plus one random risk. */
export function openShrine(p: Player, run: RunState): { ids: string[]; risk: RiskId } {
  const ids = openOffer(p, run, 'shrine');
  const rng = offerRng(run);
  const pool: RiskId[] = ['blood', 'tithe', 'curse', 'gamble', ...((run.buffs ?? []).length ? ['discard' as RiskId] : [])];
  const risk = pool[rng.int(0, pool.length - 1)]!;
  run.risk = risk;
  return { ids, risk };
}
export function takeRisk(p: Player, run: RunState, risk: RiskId, discard?: string): string {
  run.risk = null; run.offer = null;
  const set = (ids: string[], src: OfferSource = 'shrine') => { run.offer = ids.length ? { src, ids } : null; };
  switch (risk) {
    case 'blood':
      run.hp = Math.max(1, Math.round(run.hp * 0.7));
      set(rollBuffs(p, run, 'shrine', OFFER_SIZE, [0, 1, 0])); return '血祭：失去 30% HP';
    case 'tithe': {
      const pay = Math.round(run.credits * 0.4); run.credits -= pay;
      const [c, r, l] = OFFER_RARITY.shrine; set(rollBuffs(p, run, 'shrine', OFFER_SIZE, [c, r, l * 3])); return `獻金：支付 ${pay} Credits`;
    }
    case 'curse': {
      run.curse = (run.curse ?? 0) + CURSE_MIT;
      const [id] = rollBuffs(p, run, 'shrine', 1, [0, 0, 1]);
      return id ? `詛咒契約：減傷 −5%。${takeBuff(p, run, id)}` : '詛咒契約：減傷 −5%（沒有可用的傳說）';
    }
    case 'discard': {
      const held = run.buffs ?? []; const id = discard && held.includes(discard) ? discard : held[0];
      if (!id) return '沒有可捨棄的 buff';
      held.splice(held.indexOf(id), 1);
      const rar = BUFF[id]!.rarity;
      set(rollBuffs(p, run, 'shrine', OFFER_SIZE, [rar === 'common' ? 1 : 0, rar === 'rare' ? 1 : 0, rar === 'legend' ? 1 : 0]));
      return `捨棄【${BUFF[id]!.zh}】`;
    }
    case 'gamble': {
      const rng = offerRng(run);
      if (rng.chance(0.5)) { const [id] = rollBuffs(p, run, 'shrine', 1, [1, 0, 0]); return id ? `賭運成功。${takeBuff(p, run, id)}` : '賭運成功，但沒有可用的 buff'; }
      run.ocZeroNext = true; return '賭運失敗：下一場戰鬥開場 OC 歸 0';
    }
  }
}
