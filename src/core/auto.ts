import { coreFloor } from './buffoffer';
/** Headless auto-player used by the simulation and tests. Plays like a reasonable human, not optimally. */
import { type Action, type BattleState, act, alive, armCp5, canUse, startBattle, SPELLS, type SpellId } from './battle';
import type { Cp5Mon } from './cp5';
import type { Monster } from './monsters';
import { ATTRS, attrCost } from './formulas';
import { type Equip, SLOTS, blocksOffHand, sellPrice } from './items';
import { has, unlockRate } from './progress';
import type { MonsterPool } from './monsters';
import { type Player, allocate, derive, equip, powerScore, profValue, unspentExp, type Prof } from './player';
import { BUFF, formed } from './buffs';
import { merchantBuffs, openOffer, openShrine, takeBuff, winOffers } from './buffoffer';
import { Rng } from './rng';
import {
  type RunState, advance, applyLoot, chestLoot, encounter, finishBattle, merchantStock, rest, runDerived, settle, shrine, startRun, withRng,
  RULES, type Settlement, battleLocks, enterNode, openingOc, armBattle,
} from './run';
import { generateEquip } from './items';
import type { NodeType } from './tower';

export function autoAllocate(p: Player): void {
  const weights: Record<string, number> = { str: 3, dex: 2, end: 3, agi: 2, int: 1, wis: 1 };
  for (let guard = 0; guard < 2000; guard++) {
    const best = ATTRS.map((a) => [a, (attrCost(p.attrs[a] + 1) - attrCost(p.attrs[a])) / weights[a]!] as const).sort((x, y) => x[1] - y[1])[0]!;
    if (allocate(p, best[0]) === 0) break;
  }
}

/** 暫定 (round 5): auto-equip only swaps when the power score rises by at least this fraction, so IW-upgraded gear is not pushed out by a near-equal drop. */
export const AUTO_EQUIP_MARGIN = 0.05;

export function autoEquip(p: Player, extra: Equip[] = []): Equip[] {
  const used: Equip[] = [];
  const cands = [...p.inventory, ...extra];
  for (const slot of SLOTS) {
    for (const e of cands.filter((x) => x.slot === slot)) {
      const cur = powerScore(derive(p));
      const trial: Player = { ...p, equipped: { ...p.equipped, [slot]: e } };
      if (blocksOffHand(e)) delete trial.equipped.offHand;
      if (powerScore(derive(trial)) > cur * (1 + AUTO_EQUIP_MARGIN)) {
        if (!p.inventory.includes(e)) { p.inventory.push(e); used.push(e); }
        equip(p, e);
      }
    }
  }
  return used;
}

export function chooseAction(b: BattleState): Action {
  const live = alive(b);
  const target = b.monsters.indexOf(live.reduce((a, m) => (m.hp < a.hp ? m : a)));
  const tm = b.monsters[target]!;
  if (b.hp < b.d.hp * 0.35 && canUse(b, { kind: 'item', id: 'health' })) return { kind: 'item', id: 'health' };
  if (b.monsters.some((m) => m.hp > 0 && m.charge > 0)) return b.hp < b.d.hp * 0.6 && canUse(b, { kind: 'item', id: 'health' }) ? { kind: 'item', id: 'health' } : { kind: 'defend' };
  if (b.hp < b.d.hp * 0.3 && b.oc >= 25) return { kind: 'defend' };
  if (canUse(b, { kind: 'skill', id: 'mercifulBlow', target })) return { kind: 'skill', id: 'mercifulBlow', target };
  if (tm.status.stun > 0 && canUse(b, { kind: 'skill', id: 'vitalStrike', target })) return { kind: 'skill', id: 'vitalStrike', target };
  const big = b.monsters.indexOf(live.reduce((a, m) => (m.hp > a.hp ? m : a)));
  if (canUse(b, { kind: 'skill', id: 'shieldBash', target: big }) && b.oc >= 75) return { kind: 'skill', id: 'shieldBash', target: big };
  const boss = live.some((m) => m.rank === 'boss');
  if (!b.spirit && (b.oc >= 120 || boss) && canUse(b, { kind: 'spirit' })) return { kind: 'spirit' };
  if (b.d.mdb * 4 > b.d.adb * 1.2) {
    const sp = (['fiery', 'freeze', 'shock', 'gale'] as SpellId[]).sort((x, y) => tm.spec[SPELLS[x].element] - tm.spec[SPELLS[y].element])[0]!;
    if (canUse(b, { kind: 'spell', id: sp, target })) return { kind: 'spell', id: sp, target };
  }
  return { kind: 'attack', target };
}

/** 'human' (CP3 playtest model, 暫定): no Spirit Stance, no OC skills; casts the spell matching the target's worst
 * resistance when that resistance is negative, otherwise attacks; defends or drinks on a boss charge; drinks below 40% HP. */
export type Strategy = 'auto' | 'human' | 'avoid' | 'noweak' | BuffStrategy;
/** CP4 §8: 'buff:<school>' plays like 'human' with CP4 on and picks buffs core → own school → neutral → other; 'buff:random' picks at random. */
/** CP4 r2 step 4: 'buff:<school>-nocore' is the control — core and other own-school buffs share one rank (offer order breaks ties). */
export type BuffStrategy = `buff:${'blade' | 'oc' | 'arcane' | 'bulwark'}${'' | '-nocore' | '-nocore-nofloor'}` | 'buff:random';
export const buffSchool = (s: BuffStrategy) => s.slice(5).replace(/-nocore(-nofloor)?$/, '');
export const isBuffStrat = (s: Strategy): s is BuffStrategy => s.startsWith('buff:');
export function prefBuff(ids: string[], strat: BuffStrategy, rng: Rng): string | undefined {
  if (!ids.length) return undefined;
  const school = buffSchool(strat);
  if (school === 'random') return ids[rng.int(0, ids.length - 1)];
  const nocore = strat.includes('-nocore');
  const score = (id: string) => { const b = BUFF[id]!; return b.school === school ? (b.core && !nocore ? 0 : 1) : b.school === 'none' ? 2 : 3; };
  return [...ids].sort((a, b) => score(a) - score(b) || ids.indexOf(a) - ids.indexOf(b))[0];
}
/** 暫定 (CP2b): chance the human model takes a battle when one is offered and HP is at least 55%. */
export const HUMAN_COMBAT_SHARE = 0.5;
/** CP3-fix 8 'noweak': plays like 'human' but never aims at weaknesses (spells picked without looking at resistances: always the first offensive spell). */
export function chooseHuman(b: BattleState, aimWeak = true): Action {
  const live = alive(b);
  const target = b.monsters.indexOf(live.reduce((a, m) => (m.hp < a.hp ? m : a)));
  const tm = b.monsters[target]!;
  if (b.hp < b.d.hp * 0.4 && canUse(b, { kind: 'item', id: 'health' })) return { kind: 'item', id: 'health' };
  if (b.monsters.some((m) => m.hp > 0 && m.charge > 0)) return b.hp < b.d.hp * 0.6 && canUse(b, { kind: 'item', id: 'health' }) ? { kind: 'item', id: 'health' } : { kind: 'defend' };
  // CP3-fix 10: a human enters Spirit Stance in a boss fight when the button lights up (boss battles open with OC).
  if (!b.spirit && live.some((m) => m.rank === 'boss') && canUse(b, { kind: 'spirit' })) return { kind: 'spirit' };
  if (!aimWeak) {
    if (b.mp < b.d.mp * 0.25 && canUse(b, { kind: 'item', id: 'mana' })) return { kind: 'item', id: 'mana' };
    return { kind: 'attack', target };
  }
  const sp = (Object.keys(SPELLS) as SpellId[]).filter((id) => tm.spec[SPELLS[id].element as keyof typeof tm.spec] < 0)
    .sort((x, y) => tm.spec[SPELLS[x].element as keyof typeof tm.spec] - tm.spec[SPELLS[y].element as keyof typeof tm.spec]);
  for (const id of sp) if (canUse(b, { kind: 'spell', id, target })) return { kind: 'spell', id, target };
  if (b.mp < b.d.mp * 0.25 && canUse(b, { kind: 'item', id: 'mana' })) return { kind: 'item', id: 'mana' };
  return { kind: 'attack', target };
}

export function profsOf(p: Player): Partial<Record<Prof, number>> {
  return { elemental: profValue(p, 'elemental'), divine: profValue(p, 'divine'), forbidden: profValue(p, 'forbidden') };
}

export function pickOption(p: Player, run: RunState, strategy: Strategy = 'auto'): number {
  const opts = run.tower.floors[run.floor - 1]!.options;
  const frac = run.hp / runDerived(p, run).hp;
  // 暫定 (CP2b) human route: below 55% HP always a non-combat node; otherwise a coin flip (HUMAN_COMBAT_SHARE) between
  // taking a normal battle and taking a non-combat node. A pure "never fight" route is printed separately as 'avoid'.
  const coin = new Rng(run.floor * 7919 + run.kills * 131 + Math.round(run.hp)).chance(HUMAN_COMBAT_SHARE);
  const calm: NodeType[] = ['rest', 'shrine', 'chest', 'merchant', 'battle', 'elite', 'boss'];
  const pref: NodeType[] = strategy === 'avoid' ? calm : strategy === 'human' || strategy === 'noweak' ? (frac < 0.55 || !coin ? calm : ['battle', 'chest', 'shrine', 'rest', 'merchant', 'elite', 'boss']) : frac < 0.55 ? ['rest', 'shrine', 'chest', 'merchant', 'battle', 'elite', 'boss'] : ['elite', 'chest', 'battle', 'shrine', 'rest', 'merchant', 'boss'];
  for (const t of pref) { const i = opts.indexOf(t); if (i >= 0) return i; }
  return 0;
}

export interface BossFight { floor: number; turns: number; potions: number; won: boolean; spirit: boolean; buffs?: number;
  /** CP5 paired fight: the same battle snapshot replayed with the other strategy (does not affect the run). */
  alt?: { turns: number; potions: number; won: boolean } }

/** CP5 sim options. mode = battle AI layer on top of the strategy; pair = replay each boss with 'ignore'; retreat = HP fraction below which the sim retreats after a boss floor. */
export interface Cp5Sim { mode: 'counter' | 'ignore' | 'base'; pair?: boolean; retreat?: number }
type CM = Monster & Cp5Mon;
const ELEMS: SpellId[] = ['fiery', 'freeze', 'shock', 'gale'];
function bestSpell(b: BattleState, t: number, only?: SpellId[]): Action | null {
  const m = b.monsters[t]!;
  const ids = (only ?? (Object.keys(SPELLS) as SpellId[])).slice().sort((x, y) => m.spec[SPELLS[x].element] - m.spec[SPELLS[y].element]);
  for (const id of ids) if (m.spec[SPELLS[id].element] < 50 && canUse(b, { kind: 'spell', id, target: t })) return { kind: 'spell', id, target: t };
  return null;
}
/** CP5 §4 counter / ignore play on top of a base AI. 'ignore' never reacts to a signature telegraph (normal charges still defended). */
export function chooseCp5(b: BattleState, mode: Cp5Sim['mode'], base: () => Action): Action {
  if (mode === 'base') return base();
  const live = alive(b);
  const boss = live.find((m) => m.rank === 'boss') as CM | undefined;
  const bi = boss ? b.monsters.indexOf(boss) : -1;
  const heal: Action = { kind: 'item', id: 'health' };
  const low = b.hp < b.d.hp * 0.35 && canUse(b, heal);
  const bash: Action = { kind: 'skill', id: 'shieldBash', target: bi };
  if (mode === 'ignore') {
    if (!boss?.sig) return base();
    if (low) return heal;
    if (boss.sig === 'summon') return boss.charge > 0 ? { kind: 'defend' } : { kind: 'attack', target: bi };
    if (boss.sig === 'drain' && boss.drainNext) return { kind: 'attack', target: bi };
    if (boss.sig === 'shield') { const a = base(); return a.kind === 'spell' ? (canUse(b, { kind: 'spell', id: 'fiery', target: a.target }) ? { kind: 'spell', id: 'fiery', target: a.target } : { kind: 'attack', target: a.target }) : a; }
    return base();
  }
  if (boss?.sig) {
    if (boss.sig === 'summon') {
      if (boss.sigPending && canUse(b, bash)) return bash;
      if (live.length >= 3 && !low) { const a = bestSpell(b, bi, ELEMS); if (a) return a; }
    }
    if (boss.sig === 'drain' && boss.drainNext) return canUse(b, bash) ? bash : b.hp < b.d.hp * 0.6 && canUse(b, heal) ? heal : { kind: 'defend' };
    if (boss.sig === 'thorns' && boss.thornTurns && !low) return bestSpell(b, bi) ?? (boss.charge > 0 ? base() : { kind: 'defend' });
    if (boss.sig === 'shield' && boss.breachEl && !low && boss.charge === 0) {
      const id = ELEMS.find((x) => SPELLS[x].element === boss.breachEl)!;
      if (b.d.mdb * 4 > b.d.adb * 0.8 && canUse(b, { kind: 'spell', id, target: bi })) return { kind: 'spell', id, target: bi };
      const a = base(); if (a.kind === 'spell' && SPELLS[a.id].element === boss.shieldEl) return { kind: 'attack', target: bi };
      return a;
    }
    return base();
  }
  const a = base();
  if (a.kind === 'attack' || (a.kind === 'skill' && a.id !== 'shieldBash')) {
    const m = b.monsters[a.target] as CM | undefined;
    if (m?.affixes?.some((x) => x === 'spikes' || x === 'hard')) { const s2 = bestSpell(b, a.target); if (s2) return s2; }
  }
  return a;
}
export interface RunReport { trip: number; unlockRate: number; settlement: Settlement; floorReached: number; kills: number; turns: number; level: number; power: number; bosses: BossFight[]; battles: number; spiritBattles: number;
  /** CP4 (buff strategies only) */
  cp4?: { buffs: string[]; formed: string[]; sources: Record<string, number>; offered: Record<string, number>; picked: Record<string, number>; risks: number; offers: number; contests: number } }

export function autoRun(p: Player, pool: MonsterPool, seed: number, strategy: Strategy = 'auto', cp5?: Cp5Sim): RunReport {
  // Town prep.
  if (has(p, 'alloc')) autoAllocate(p);
  autoEquip(p);
  while (has(p, 'shop') && p.potions.health < 3 && p.credits >= RULES.potionPrice.health) { p.credits -= RULES.potionPrice.health; p.potions.health++; }
  const level = derive(p).level;
  const power = powerScore(derive(p));
  const bs = isBuffStrat(strategy);
  const flag0 = RULES.cp4RunBuffs, flag5 = RULES.cp5Bosses;
  if (bs) RULES.cp4RunBuffs = true;
  if (cp5) RULES.cp5Bosses = true;
  if (strategy.endsWith('-nofloor')) coreFloor.on = false; // r3 step 2 control: both core guarantees off for this run
  try { return autoRunInner(p, pool, seed, strategy, level, power, bs, cp5); } finally { RULES.cp4RunBuffs = flag0; RULES.cp5Bosses = flag5; coreFloor.on = true; }
}
/** Play one battle to the end with a strategy (+ CP5 layer). */
export function fight(b: BattleState, strategy: Strategy, rng: Rng, profs: Partial<Record<Prof, number>>, mode?: Cp5Sim['mode']): void {
  const base = () => (strategy !== 'auto' ? chooseHuman(b, strategy !== 'noweak') : chooseAction(b));
  while (!b.over && b.turn < 400) act(b, mode ? chooseCp5(b, mode, base) : base(), rng, profs);
  if (!b.over) b.over = 'lose';
}
const potCount = (b: BattleState) => b.potions.health + b.potions.mana + b.potions.spirit;
function autoRunInner(p: Player, pool: MonsterPool, seed: number, strategy: Strategy, level: number, power: number, bs: boolean, cp5?: Cp5Sim): RunReport {
  const run = startRun(p, seed);
  const rng = new Rng(seed ^ 0x5bd1e995);
  const prng = new Rng((seed ^ 0x27d4eb2d) >>> 0 || 1);
  const cp4 = { buffs: [] as string[], formed: [] as string[], sources: {} as Record<string, number>, offered: {} as Record<string, number>, picked: {} as Record<string, number>, risks: 0, offers: 0, contests: 0 };
  /** Resolve the open offer with the strategy's preference. */
  const resolve = (src: string) => {
    if (!run.offer) return;
    for (const id of run.offer.ids) cp4.offered[id] = (cp4.offered[id] ?? 0) + 1;
    const sch = buffSchool(strategy as BuffStrategy);
    cp4.offers++; // r2 step 4: offers where core and another own-school buff compete (the only case -nocore can differ)
    if (run.offer.ids.some((x) => BUFF[x]!.school === sch && BUFF[x]!.core) && run.offer.ids.some((x) => BUFF[x]!.school === sch && !BUFF[x]!.core)) cp4.contests++;
    const id = prefBuff(run.offer.ids, strategy as BuffStrategy, prng);
    if (id) { takeBuff(p, run, id); cp4.picked[id] = (cp4.picked[id] ?? 0) + 1; cp4.sources[src] = (cp4.sources[src] ?? 0) + 1; }
    run.offer = null;
  };
  let turns = 0;
  const bosses: BossFight[] = [];
  let battles = 0, spiritBattles = 0;
  while (!run.done) {
    const opt = pickOption(p, run, strategy);
    const type = run.tower.floors[run.floor - 1]!.options[opt]!;
    enterNode(p, run, type);
    if (type === 'battle' || type === 'elite' || type === 'boss') {
      const ms = encounter(run, pool, type);
      const d = runDerived(p, run);
      const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
      b.locked = battleLocks(p);
      const oc0 = openingOc(p, type, run);
      armBattle(b, run);
      b.oc += oc0;
      if (run.cp5) armCp5(b, run.pdot);
      const profs = profsOf(p);
      const pot0 = potCount(b);
      let alt: BossFight['alt'];
      if (cp5?.pair && type === 'boss') {
        const c = structuredClone(b); const r2 = new Rng(1); r2.state = rng.state;
        fight(c, strategy, r2, profs, 'ignore');
        alt = { turns: c.turn, potions: pot0 - potCount(c), won: c.over === 'win' };
      }
      if (cp5) fight(b, strategy, rng, profs, cp5.mode);
      else while (!b.over && b.turn < 400) { act(b, strategy !== 'auto' ? chooseHuman(b, strategy !== 'noweak') : chooseAction(b), rng, profs); }
      turns += b.turn;
      battles++; if (b.spiritUsed) spiritBattles++;
      if (!b.over) b.over = 'lose';
      if (type === 'boss') bosses.push({ floor: run.floor, turns: b.turn, potions: pot0 - potCount(b), won: b.over === 'win', spirit: !!b.spiritUsed, ...(bs ? { buffs: run.buffs?.length ?? 0 } : {}), ...(alt ? { alt } : {}) });
      const loot = finishBattle(p, run, b, ms, type);
      if (!loot) break;
      const used = autoEquip(p, run.bag);
      run.bag = run.bag.filter((e) => !used.includes(e));
      if (bs) for (let k = winOffers(type, run); k > 0; k--) { openOffer(p, run, type as 'elite'); resolve(type); }
      if (cp5?.retreat && type === 'boss' && run.floor < run.tower.floors.length && run.hp < runDerived(p, run).hp * cp5.retreat) { run.done = 'retreat'; break; }
    } else if (type === 'chest') {
      applyLoot(p, run, chestLoot(run));
      const used = autoEquip(p, run.bag);
      run.bag = run.bag.filter((e) => !used.includes(e));
    } else if (type === 'merchant') {
      const st = merchantStock(run);
      while (p.potions.health < 4 && p.credits >= RULES.potionPrice.health) { p.credits -= RULES.potionPrice.health; p.potions.health++; }
      void st;
      if (bs) for (const x of merchantBuffs(p, run)) {
        const ok = strategy === 'buff:random' ? prng.chance(0.5) : BUFF[x.id]!.school === buffSchool(strategy as BuffStrategy);
        if (!ok || run.credits + p.credits < x.price) continue;
        const fromRun = Math.min(run.credits, x.price); run.credits -= fromRun; p.credits -= x.price - fromRun;
        for (const k of ['offered', 'picked'] as const) cp4[k][x.id] = (cp4[k][x.id] ?? 0) + 1;
        takeBuff(p, run, x.id); cp4.sources.merchant = (cp4.sources.merchant ?? 0) + 1;
      }
    } else if (type === 'rest') {
      const d = runDerived(p, run);
      if (run.hp < d.hp * 0.8 || !p.equipped.mainHand) rest(p, run, 'heal');
      else rest(p, run, 'upgrade', 'mainHand');
    } else if (type === 'shrine') {
      if (bs) { openShrine(p, run); run.risk = null; resolve('shrine'); }
      else shrine(p, run, run.hp > runDerived(p, run).hp * 0.7 ? 'might' : 'vigor');
    }
    advance(run, opt);
  }
  const floorReached = run.done === 'clear' ? run.tower.floors.length + 1 : run.floor;
  const s = settle(p, run);
  // Sell the junk in town.
  const keep = new Set(Object.values(p.equipped).map((e) => e!.id));
  if (has(p, 'shop')) {
    for (const e of p.inventory.filter((x) => !keep.has(x.id))) p.credits += sellPrice(e);
    p.inventory = p.inventory.filter((x) => keep.has(x.id));
  }
  return { trip: run.trip ?? 0, unlockRate: unlockRate(p), settlement: s, floorReached, kills: run.kills, turns, level, power, bosses, battles, spiritBattles, ...(bs ? { cp4: { ...cp4, buffs: [...(run.buffs ?? [])], formed: formed(run.buffs ?? []) } } : {}) };
}

export function starterKit(p: Player, seed = 7): void {
  const rng = new Rng(seed);
  const w = generateEquip(rng, 1, { group: 'oneHand', base: 'axe', quality: 'fair' });
  const a = generateEquip(rng, 1, { group: 'light', base: 'leather', slot: 'body', quality: 'fair' });
  p.inventory.push(w, a);
  equip(p, w);
  equip(p, a);
}

export { unspentExp, withRng };
