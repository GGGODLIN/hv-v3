/** Headless auto-player used by the simulation and tests. Plays like a reasonable human, not optimally. */
import { type Action, type BattleState, act, alive, canUse, startBattle, SPELLS, type SpellId } from './battle';
import { ATTRS, attrCost } from './formulas';
import { type Equip, SLOTS, blocksOffHand, sellPrice } from './items';
import { has, unlockRate } from './progress';
import type { MonsterPool } from './monsters';
import { type Player, allocate, derive, equip, powerScore, profValue, unspentExp, type Prof } from './player';
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
export type Strategy = 'auto' | 'human' | 'avoid' | 'noweak';
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

export interface BossFight { floor: number; turns: number; potions: number; won: boolean; spirit: boolean }
export interface RunReport { trip: number; unlockRate: number; settlement: Settlement; floorReached: number; kills: number; turns: number; level: number; power: number; bosses: BossFight[]; battles: number; spiritBattles: number }

export function autoRun(p: Player, pool: MonsterPool, seed: number, strategy: Strategy = 'auto'): RunReport {
  // Town prep.
  if (has(p, 'alloc')) autoAllocate(p);
  autoEquip(p);
  while (has(p, 'shop') && p.potions.health < 3 && p.credits >= RULES.potionPrice.health) { p.credits -= RULES.potionPrice.health; p.potions.health++; }
  const level = derive(p).level;
  const power = powerScore(derive(p));
  const run = startRun(p, seed);
  const rng = new Rng(seed ^ 0x5bd1e995);
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
      const profs = profsOf(p);
      const pot0 = b.potions.health + b.potions.mana + b.potions.spirit;
      while (!b.over && b.turn < 400) { act(b, strategy !== 'auto' ? chooseHuman(b, strategy !== 'noweak') : chooseAction(b), rng, profs); }
      turns += b.turn;
      battles++; if (b.spiritUsed) spiritBattles++;
      if (!b.over) b.over = 'lose';
      if (type === 'boss') bosses.push({ floor: run.floor, turns: b.turn, potions: pot0 - (b.potions.health + b.potions.mana + b.potions.spirit), won: b.over === 'win', spirit: !!b.spiritUsed });
      const loot = finishBattle(p, run, b, ms, type);
      if (!loot) break;
      const used = autoEquip(p, run.bag);
      run.bag = run.bag.filter((e) => !used.includes(e));
    } else if (type === 'chest') {
      applyLoot(p, run, chestLoot(run));
      const used = autoEquip(p, run.bag);
      run.bag = run.bag.filter((e) => !used.includes(e));
    } else if (type === 'merchant') {
      const st = merchantStock(run);
      while (p.potions.health < 4 && p.credits >= RULES.potionPrice.health) { p.credits -= RULES.potionPrice.health; p.potions.health++; }
      void st;
    } else if (type === 'rest') {
      const d = runDerived(p, run);
      if (run.hp < d.hp * 0.8 || !p.equipped.mainHand) rest(p, run, 'heal');
      else rest(p, run, 'upgrade', 'mainHand');
    } else if (type === 'shrine') {
      shrine(p, run, run.hp > runDerived(p, run).hp * 0.7 ? 'might' : 'vigor');
    }
    advance(run, opt);
  }
  const floorReached = run.done === 'clear' ? 11 : run.floor;
  const s = settle(p, run);
  // Sell the junk in town.
  const keep = new Set(Object.values(p.equipped).map((e) => e!.id));
  if (has(p, 'shop')) {
    for (const e of p.inventory.filter((x) => !keep.has(x.id))) p.credits += sellPrice(e);
    p.inventory = p.inventory.filter((x) => keep.has(x.id));
  }
  return { trip: run.trip ?? 0, unlockRate: unlockRate(p), settlement: s, floorReached, kills: run.kills, turns, level, power, bosses, battles, spiritBattles };
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
