/** Headless auto-player used by the simulation and tests. Plays like a reasonable human, not optimally. */
import { type Action, type BattleState, act, alive, canUse, startBattle, SPELLS, type SpellId } from './battle';
import { ATTRS, attrCost } from './formulas';
import { type Equip, SLOTS, blocksOffHand } from './items';
import type { MonsterPool } from './monsters';
import { type Player, allocate, derive, equip, powerScore, profValue, unspentExp, type Prof } from './player';
import { Rng } from './rng';
import {
  type RunState, advance, applyLoot, chestLoot, encounter, finishBattle, merchantStock, rest, runDerived, settle, shrine, startRun, withRng,
  RULES, type Settlement,
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

export function autoEquip(p: Player, extra: Equip[] = []): Equip[] {
  const used: Equip[] = [];
  const cands = [...p.inventory, ...extra];
  for (const slot of SLOTS) {
    for (const e of cands.filter((x) => x.slot === slot)) {
      const cur = powerScore(derive(p));
      const trial: Player = { ...p, equipped: { ...p.equipped, [slot]: e } };
      if (blocksOffHand(e)) delete trial.equipped.offHand;
      if (powerScore(derive(trial)) > cur) {
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
  if (!b.spirit && b.oc >= 120 && canUse(b, { kind: 'spirit' })) return { kind: 'spirit' };
  if (b.d.mdb * 4 > b.d.adb * 1.2) {
    const sp = (['fiery', 'freeze', 'shock', 'gale'] as SpellId[]).sort((x, y) => tm.spec[SPELLS[x].element] - tm.spec[SPELLS[y].element])[0]!;
    if (canUse(b, { kind: 'spell', id: sp, target })) return { kind: 'spell', id: sp, target };
  }
  return { kind: 'attack', target };
}

export function profsOf(p: Player): Partial<Record<Prof, number>> {
  return { elemental: profValue(p, 'elemental'), divine: profValue(p, 'divine'), forbidden: profValue(p, 'forbidden') };
}

export function pickOption(p: Player, run: RunState): number {
  const opts = run.tower.floors[run.floor - 1]!.options;
  const frac = run.hp / runDerived(p, run).hp;
  const pref: NodeType[] = frac < 0.55 ? ['rest', 'shrine', 'chest', 'merchant', 'battle', 'elite', 'boss'] : ['elite', 'chest', 'battle', 'shrine', 'rest', 'merchant', 'boss'];
  for (const t of pref) { const i = opts.indexOf(t); if (i >= 0) return i; }
  return 0;
}

export interface RunReport { settlement: Settlement; floorReached: number; kills: number; turns: number; level: number; power: number }

export function autoRun(p: Player, pool: MonsterPool, seed: number): RunReport {
  // Town prep.
  autoAllocate(p);
  autoEquip(p);
  while (p.potions.health < 3 && p.credits >= RULES.potionPrice.health) { p.credits -= RULES.potionPrice.health; p.potions.health++; }
  const level = derive(p).level;
  const power = powerScore(derive(p));
  const run = startRun(p, seed);
  const rng = new Rng(seed ^ 0x5bd1e995);
  let turns = 0;
  while (!run.done) {
    const opt = pickOption(p, run);
    const type = run.tower.floors[run.floor - 1]!.options[opt]!;
    if (type === 'battle' || type === 'elite' || type === 'boss') {
      const ms = encounter(run, pool, type);
      const d = runDerived(p, run);
      const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
      const profs = profsOf(p);
      while (!b.over && b.turn < 400) { act(b, chooseAction(b), rng, profs); }
      turns += b.turn;
      if (!b.over) b.over = 'lose';
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
  for (const e of p.inventory.filter((x) => !keep.has(x.id))) p.credits += Math.round((8 + e.level * 3));
  p.inventory = [];
  return { settlement: s, floorReached, kills: run.kills, turns, level, power };
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
