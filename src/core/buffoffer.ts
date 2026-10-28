/** CP4 step 3: how buffs are acquired (docs/cp4-run-buffs.md §4). Every number here is 暫定. */
import { BUFF, BUFFS, type BuffDef, type Rarity, schoolCounts, SCHOOLS } from './buffs';
import { has } from './progress';
import type { Player } from './player';
import { Rng } from './rng';
import { RUN12Q, blade12q } from './cp8';
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
/** Sim-only control switch (CP4 r3 step 2): when false both core guarantees are off. Game code never changes it. */
export const coreFloor = { on: true };
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
/** rc12d (a)(b)（自訂，製作人決定）: does this buff's effect apply to the player's build?
 *  Casts spells = lean arcane or a staff in hand. Arcane / needs:'spell' buffs → 需要法術 for non-casters;
 *  blade (physical-damage) buffs → 對你無效 for an arcane caster. oc / bulwark / none apply to everyone. No lean → everything fits. */
export function buffFit(p: Player, id: string): { ok: boolean; why?: '需要法術' | '對你無效' } {
  const b = BUFF[id]; if (!b || !p.lean) return { ok: true };
  const caster = p.lean === 'arcane' || (p.equipped?.mainHand as { base?: string } | undefined)?.base === 'staff';
  if ((b.school === 'arcane' || b.needs === 'spell') && !caster) return { ok: false, why: '需要法術' };
  if (b.school === 'blade' && p.lean === 'arcane' && caster) return { ok: false, why: '對你無效' };
  return { ok: true };
}
/** rc12d (a)（自訂）: weight of a buff the build can use vs one it cannot, in the open draw (weighted, not a hard filter). */
export const FIT_WEIGHT = 3;
/** rc12d (a)（自訂）: a pick-one offer of OFFER_SIZE has at least this many buffs that fit the build (the rest may be anything). */
export const FIT_MIN = 2;
/** rc12f（自訂，製作人決定）: how much of a fitting buff the build can actually use (0..1) and which part is dead.
 *  W1 不動之盾 without a shield: the block third is dead (offHand = shield group only). */
export function buffUse(p: Player, id: string): { use: number; dead?: string } {
  if (!buffFit(p, id).ok) return { use: 0 };
  if (id === 'W1' && !p.equipped?.offHand) return { use: 2 / 3, dead: '格擋（搭盾才有）' };
  // rc12g item 3（自訂，製作人要求）: 磐石 family without a shield. 震盪's only effect (bash stun +1) is off without a shield
  // (armBattle drops it); 厚皮 / 不滅 keep their own stats, but the 磐石反擊 combo's block trigger is dead.
  if (id === 'W8' && !p.equipped?.offHand) return { use: 0.25, dead: '盾擊暈眩（搭盾才有）' };
  if ((id === 'W2' || id === 'W6') && !p.equipped?.offHand) return { use: 0.85, dead: '磐石反擊的格擋觸發（搭盾才有）' };
  return { use: 1 };
}
/** rc12f（自訂）: value of another school's buff to a lean (1 = own school). Generic (none) buffs stay useful to all;
 *  bulwark ↔ blade share 磐石＋刃鋒, oc stance / opening-OC buffs are worth little to a shield tank. */
export const SCHOOL_AFF: Record<string, Record<string, number>> = {
  blade: { blade: 1, oc: 0.5, bulwark: 0.4, arcane: 0.2, none: 0.7 },
  oc: { oc: 1, blade: 0.5, bulwark: 0.4, arcane: 0.2, none: 0.7 },
  arcane: { arcane: 1, oc: 0.4, bulwark: 0.4, blade: 0.1, none: 0.7 },
  bulwark: { bulwark: 1, blade: 0.3, oc: 0.2, arcane: 0.2, none: 0.7 },
};
/** rc12d (b) → rc12f（自訂）: the ★ for an offer — only a fitting buff; score = usable share × school affinity (own core +0.5),
 *  rarity only breaks near-ties (+0.05 / step). A partly-dead buff (W1 without shield) loses to a fully usable own-school one. */
export function offerStar(p: Player, ids: string[]): string | null {
  const R: Record<Rarity, number> = { common: 0, rare: 1, legend: 2 };
  const fit = ids.filter((id) => buffFit(p, id).ok); if (!fit.length) return null;
  const sc = (id: string) => { const b = BUFF[id]!; const aff = p.lean ? (SCHOOL_AFF[p.lean]?.[b.school] ?? 0.5) : 1;
    const u = buffUse(p, id); return u.use * (u.dead ? 0.6 : 1) /* partly dead: extra ×0.6 so it never beats a fully usable card */ * (aff + (b.school === p.lean && b.core ? 0.5 : 0)) + 0.05 * R[b.rarity]; };
  return fit.reduce((a, x) => (sc(x) > sc(a) ? x : a));
}
export function rollBuffs(p: Player, run: RunState, src: OfferSource | 'merchant', n: number, weights?: [number, number, number], exclude: string[] = []): string[] {
  const rng = offerRng(run);
  const held = run.buffs ?? [];
  const cnt = schoolCounts(held);
  const out: string[] = [];
  // Core guarantee: 2 of a school and no core yet -> the core is in the offer.
  for (const s of SCHOOLS) {
    const core = BUFFS.find((b) => b.school === s && b.core)!;
    if (cnt[s] >= 2 && !held.includes(core.id) && eligible(p, core) && out.length < n && src !== 'merchant' && !weights && coreFloor.on) out.push(core.id);
  }
  // Decision 2026-10-25 #1 (暫定): once a school has ≥1 buff, the next pick-one offer has ≥1 option of it
  // (the most-held school; ties → the one held first). Merchant and weighted test rolls are exempt.
  if (SCHOOL_GUARANTEE && src !== 'merchant' && !weights && out.length < n) {
    const top = SCHOOLS.filter((s) => cnt[s] > 0).sort((a, b) => cnt[b] - cnt[a] || held.findIndex((id) => BUFF[id]!.school === a) - held.findIndex((id) => BUFF[id]!.school === b))[0];
    if (top && !out.some((id) => BUFF[id]!.school === top)) {
      const pool = BUFFS.filter((b) => b.school === top && eligible(p, b) && !held.includes(b.id) && (src === 'boss' || b.rarity !== 'legend'));
      const core = pool.find((b) => b.core);
      if (core && CORE_FIRST && coreFloor.on) out.push(core.id);
      else if (pool.length) out.push(rng.weighted(pool.map((b) => [b.id, OFFER_RARITY[src][b.rarity === 'common' ? 0 : b.rarity === 'rare' ? 1 : 2] || 1] as [string, number])));
    }
  }
  const [c, r, l0] = weights ?? OFFER_RARITY[src];
  const l = src === 'boss' && !weights && blade12q(p.lean) ? l0 * RUN12Q.legend : l0; // rc12q（自訂，預設關）
  let needRare = src === 'boss';
  while (out.length < n) {
    const rar: Rarity = needRare ? (rng.chance(l / (r + l)) ? 'legend' : 'rare') : rng.weighted<Rarity>([['common', c], ['rare', r], ['legend', l]].filter((x) => (x[1] as number) > 0) as [Rarity, number][]);
    const pool = BUFFS.filter((b) => b.rarity === rar && eligible(p, b) && !out.includes(b.id) && (b.id.startsWith('S-') || (!held.includes(b.id) && !exclude.includes(b.id))));
    if (!pool.length) { if (rar === 'common') break; needRare = false; continue; }
    out.push(rng.weighted(pool.map((b) => [b.id, (b.school !== 'none' && cnt[b.school] > 0 ? SAME_SCHOOL_WEIGHT : 1) * (buffFit(p, b.id).ok ? FIT_WEIGHT : 1)] as [string, number])));
    if (BUFF[out[out.length - 1]!]!.rarity !== 'common') needRare = false;
  }
  // rc12d (a)（自訂）: pick-one offers keep ≥ FIT_MIN fitting buffs — replace non-fitting ones from the end with a fitting draw.
  if (src !== 'merchant' && !weights && n >= OFFER_SIZE) {
    for (let i = out.length - 1; i >= 0 && out.filter((id) => buffFit(p, id).ok).length < FIT_MIN; i--) {
      if (buffFit(p, out[i]!).ok) continue;
      const pool = BUFFS.filter((b) => buffFit(p, b.id).ok && eligible(p, b) && !out.includes(b.id) && (src === 'boss' || b.rarity !== 'legend') && (b.id.startsWith('S-') || (!held.includes(b.id) && !exclude.includes(b.id))));
      if (pool.length) out[i] = rng.weighted(pool.map((b) => [b.id, (b.school !== 'none' && cnt[b.school] > 0 ? SAME_SCHOOL_WEIGHT : 1) * (OFFER_RARITY[src][b.rarity === 'common' ? 0 : b.rarity === 'rare' ? 1 : 2] || 1)] as [string, number]));
    }
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
export const ELITE_OFFER_EVERY = 3; // 暫定, CP4 rc: was 2
/** Mutable copy of the 暫定 offer knobs, changed only by sim scripts (scripts/cp4-knobs.ts). */
export const OFFER_KNOBS = { eliteEvery: ELITE_OFFER_EVERY, bossFloors: [] as number[] /* boss floors that give NO offer */ };
export function winOffers(type: NodeType, run: RunState): number {
  if (type === 'boss') return OFFER_KNOBS.bossFloors.includes(run.floor) ? 0 : 1;
  if (type !== 'elite') return 0;
  run.eliteWins = (run.eliteWins ?? 0) + 1;
  return (run.eliteWins - 1) % OFFER_KNOBS.eliteEvery === 0 ? 1 : 0;
}
export function merchantBuffs(p: Player, run: RunState): { id: string; price: number }[] {
  const pm = 1 + ((run.buffs ?? []).filter((x) => x === 'N2').length * -0.15);
  // CP4-rc-fix 3: within one trip a merchant never lists a non-stackable buff another merchant already listed, nor one held.
  // S- (generic stat) buffs stack by design and may repeat.
  const seen = run.merchantSeen ?? [];
  let ids = rollBuffs(p, run, 'merchant', MERCHANT_BUFFS, undefined, seen);
  // Guarantee (CP4 rc): never an empty buff shelf. Fallback only; the normal roll and its RNG are unchanged.
  if (!ids.length) { const c = BUFFS.find((b) => b.rarity === 'common' && eligible(p, b) && (b.id.startsWith('S-') || (!(run.buffs ?? []).includes(b.id) && !seen.includes(b.id)))); if (c) ids = [c.id]; }
  run.merchantSeen = [...seen, ...ids.filter((id) => !id.startsWith('S-'))];
  return ids.map((id) => ({ id, price: Math.round(BUFF_PRICE[BUFF[id]!.rarity as 'common'] * RULES.merchantMarkup * pm) }));
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
