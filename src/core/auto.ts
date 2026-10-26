import { CP7 } from './cp7';
import { coreFloor } from './buffoffer';
/** Headless auto-player used by the simulation and tests. Plays like a reasonable human, not optimally. */
import { type Action, type BattleState, act, alive, armCp5, canUse, potHint, quickAttack, panelSpec, startBattle, SPELLS, type SpellId } from './battle';
import type { Cp5Mon } from './cp5';
import type { Monster } from './monsters';
import { ATTRS, attrCost } from './formulas';
import { type Equip, SLOTS, blocksOffHand, sellPrice } from './items';
import { has, unlockRate } from './progress';
import type { MonsterPool } from './monsters';
import { type Player, allocate, derive, equip, unequip, powerScore, profValue, unspentExp, type Prof } from './player';
import { BUFF, formed } from './buffs';
import { merchantBuffs, openOffer, openShrine, takeBuff, winOffers } from './buffoffer';
import { Rng } from './rng';
import {
  type RunState, advance, applyLoot, chestLoot, encounter, finishBattle, merchantStock, rest, runDerived, settle, shrine, startRun, withRng, startAbyss, depthOf, abyssCleared, abyssSchool,
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

/** 暫定（缺原版出處）: sim town prep buys health potions up to this stock (shared with the CP7 出發前整備 「買藥」). */
export const TOWN_HP_POTIONS = 3;
/** Buy health potions up to `n` while credits last (sim town prep; UI 「買藥」). Returns potions bought. */
export function buyHealthTo(p: Player, n: number): number {
  let k = 0;
  while (p.potions.health < n && p.credits >= RULES.potionPrice.health) { p.credits -= RULES.potionPrice.health; p.potions.health++; k++; }
  return k;
}

/** 暫定 (round 5): auto-equip only swaps when the power score rises by at least this fraction, so IW-upgraded gear is not pushed out by a near-equal drop. */
export const AUTO_EQUIP_MARGIN = 0.05;

/** rc4 (sim only): weapon layout per play school. arcane = staff, bulwark = one-hand + shield (docs/cp4-run-buffs.md §2: W1 不動之盾 block/parry),
 * blade = one-hand, off-hand free (推定：B7 處刑者 buffs Merciful Blow, a One-Handed skill line in F-002-4.2-skills / Ticket 04),
 * oc = any main hand, shield free, best joint pair (推定：no doc names a weapon; a forced two-hander gave 97% never-clear in the sim, docs/logs/rc4-noclear-schoolgear-oc2h.txt). null = original slot-by-slot logic. */
export type GearStyle = { main: Equip['group'] | null; shield: 'yes' | 'free' | 'no'; armor?: 'heavy' } | null;
/** cp8-rc5 (producer 2026-10-26, layout only, no numbers): a bulwark-leaning player's town 換上 = 1H + shield, heavy armor preferred. */
export const BULWARK_STYLE: NonNullable<GearStyle> = { main: 'oneHand', shield: 'yes', armor: 'heavy' };
export const leanStyle = (p: Player): GearStyle => (RULES.cp8 && p.lean === 'bulwark' ? BULWARK_STYLE : null);
export function gearStyle(strategy: string): GearStyle {
  if (strategy.startsWith('buff:arcane')) return { main: 'staff', shield: 'no' };
  if (strategy.startsWith('buff:bulwark')) return RULES.cp8 ? BULWARK_STYLE : { main: 'oneHand', shield: 'yes' };
  // rc6 item 3 (school→style mapping: producer decision, 暫定，無來源; style definitions: parsed_wiki/Fighting_Styles.md).
  if (strategy.startsWith('buff:blade')) return { main: 'twoHand', shield: 'no' };
  // OC = dual wield per producer; the game has no dual wield (offHand = shield group only, constants.ts F-003-base-groups) → 1H, no shield (暫定).
  if (strategy.startsWith('buff:oc')) return { main: 'oneHand', shield: 'free' }; // rc7 item 2 (暫定): shield optional, joint pick decides
  return null;
}
/** Pick main hand + off hand together (can go back from a two-hander to one-hand + shield). Off-style weapons are only used when no
 * weapon of the school's group is owned. Returns the items taken from `extra`. */
function equipHands(p: Player, cands: Equip[], st: NonNullable<GearStyle>): Equip[] {
  const mains = [p.equipped.mainHand, ...cands.filter((x) => x.slot === 'mainHand')].filter((x): x is Equip => !!x);
  const offs = [p.equipped.offHand, ...cands.filter((x) => x.slot === 'offHand')].filter((x): x is Equip => !!x);
  const styled = st.main ? mains.filter((m) => m.group === st.main) : mains;
  const pool = styled.length ? styled : mains;
  const score = (m: Equip | undefined, o: Equip | undefined) => powerScore(derive({ ...p, equipped: { ...p.equipped, mainHand: m, offHand: o } as Player['equipped'] }));
  let best: [Equip | undefined, Equip | undefined] = [p.equipped.mainHand, p.equipped.offHand];
  const legal = (m: Equip | undefined, o: Equip | undefined) => !(o && blocksOffHand(m)) && !(o && st.shield === 'no') && !(st.shield === 'yes' && offs.length && !o && !blocksOffHand(m));
  const curOk = (!best[0] || !st.main || best[0].group === st.main || !styled.length) && legal(best[0], best[1]);
  let bestS = curOk ? score(best[0], best[1]) * (1 + (RULES.cp7 ? CP7.betterMargin : AUTO_EQUIP_MARGIN)) : -Infinity; // CP7: same margin as the badge
  for (const m of pool.length ? pool : [undefined]) for (const o of [undefined, ...offs]) {
    if (!legal(m, o)) continue;
    const v = score(m, o); if (v > bestS) { bestS = v; best = [m, o]; }
  }
  const used: Equip[] = [];
  const take = (e: Equip) => { if (!p.inventory.includes(e) && !Object.values(p.equipped).includes(e)) { p.inventory.push(e); used.push(e); } };
  const [m, o] = best;
  if (p.equipped.offHand !== o) unequip(p, 'offHand');
  if (m && p.equipped.mainHand !== m) { take(m); equip(p, m); }
  if (o && p.equipped.offHand !== o) { take(o); equip(p, o); }
  return used;
}

export function autoEquip(p: Player, extra: Equip[] = [], style: GearStyle = null): Equip[] {
  const used: Equip[] = [];
  const cands = [...p.inventory, ...extra];
  if (style) used.push(...equipHands(p, cands, style));
  for (const slot of SLOTS) {
    if (style && (slot === 'mainHand' || slot === 'offHand')) continue;
    for (const e of cands.filter((x) => x.slot === slot)) {
      // cp8-rc5: heavy preference — never trade worn heavy for non-heavy; a heavy piece replaces non-heavy when it scores at least as well (no margin).
      const w = p.equipped[slot], hv = style?.armor === 'heavy' && ['cloth', 'light', 'heavy'].includes(e.group);
      if (hv && w?.group === 'heavy' && e.group !== 'heavy') continue;
      const cur = powerScore(derive(p));
      const trial: Player = { ...p, equipped: { ...p.equipped, [slot]: e } };
      if (blocksOffHand(e)) delete trial.equipped.offHand;
      // rc4 fix: an off-hand cannot go next to a two-hander / staff. The old trial scored the illegal pair, then equip() pushed the
      // weapon to the inventory and the town sell (keep = equipped only) sold it, leaving the sim character unarmed. Never trade the main hand away.
      if (slot === 'offHand' && blocksOffHand(p.equipped.mainHand)) continue;
      // CP7: the AI wears what the UI badges as 「▲ 比身上好」 (same rule, CP7.betterMargin).
      if (powerScore(derive(trial)) > (hv && e.group === 'heavy' && w && w.group !== 'heavy' ? cur - 1e-9 : cur * (1 + (RULES.cp7 ? CP7.betterMargin : AUTO_EQUIP_MARGIN)))) {
        if (!p.inventory.includes(e)) { p.inventory.push(e); used.push(e); }
        equip(p, e);
      }
    }
  }
  return used;
}

/** rc6 item 2: sim AI view. Default (baseline for every threshold) = UI-only: monster resistances / weaknesses are read through
 * panelSpec(), the same data the battle weak panel renders. Everything else the AI reads is on screen too: HP bars, the charge
 * warning (decide box), stun bar, affix plates, boss telegraphs, own HP/MP/OC/cooldowns. Physical schools (刃鋒、磐石, producer
 * decision rc6) play physically: no offensive spells. SIM_AI=omni (env) = the pre-rc6 all-knowing AI (raw spec, every school
 * aims spells at weaknesses), kept as a reference only. */
const ENV = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
export const SIM_AI = { omni: ENV?.SIM_AI === 'omni',
  /** CP8 P1: SIM_AI=naive — a real first-time player: only normal attacks (cp8-rc5: UI default target), a health potion below 40% HP; no skills,
   *  spells, Spirit Stance, defend or CP5 telegraph counters. Town prep = 「全部處理」 (prepAll); loot is worn only in town (docs/cp8-real-play.md). */
  naive: ENV?.SIM_AI === 'naive',
  /** CP8 diagnosis only (SIM_ADD=spirit,defend,equip,counter,spells,skills): give the naive AI back one piece of the old AI. */
  add: new Set((ENV?.SIM_ADD ?? '').split(',').filter(Boolean)) };
/** CP8 naive battle choice. */
export function chooseNaive(b: BattleState): Action {
  const live = alive(b);
  // cp8-rc5 (blade sim d22 vs playtest d11–20): naive = what 「A」 hits with no clicking — the UI default target, the first live
  // monster (app.ts command()). Lowest-HP targeting needs reading every HP bar + Tab; kept as SIM_TGT=low (diagnosis). Preset sim: blade trip-1 22→17.
  const target = ENV?.SIM_TGT !== 'low' ? b.monsters.findIndex((m) => m.hp > 0) : b.monsters.indexOf(live.reduce((a, m) => (m.hp < a.hp ? m : a)));
  if (b.hp < b.d.hp * 0.4 && canUse(b, { kind: 'item', id: 'health' })) return { kind: 'item', id: 'health' };
  const A = SIM_AI.add;
  if (A.has('defend') && b.monsters.some((m) => m.hp > 0 && m.charge > 0)) return { kind: 'defend' };
  if (A.has('spirit') && !b.spirit && live.some((m) => m.rank === 'boss') && canUse(b, { kind: 'spirit' })) return { kind: 'spirit' };
  if (A.has('skills')) for (const id of ['mercifulBlow', 'vitalStrike', 'shieldBash'] as const) if (canUse(b, { kind: 'skill', id, target })) return { kind: 'skill', id, target };
  return quickAttack(b, target);
}
const seen = (m: Monster): Monster['spec'] => (SIM_AI.omni ? m.spec : panelSpec(m));
export const PHYS_SCHOOLS = ['blade', 'bulwark'];
const physPlay = (s: string) => !SIM_AI.omni && s.startsWith('buff:') && PHYS_SCHOOLS.includes(s.slice(5).replace(/-nocore(-nofloor)?$/, ''));

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
    const sp = (['fiery', 'freeze', 'shock', 'gale'] as SpellId[]).sort((x, y) => seen(tm)[SPELLS[x].element] - seen(tm)[SPELLS[y].element])[0]!;
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
  const sp = (Object.keys(SPELLS) as SpellId[]).filter((id) => seen(tm)[SPELLS[id].element as keyof typeof tm.spec] < 0)
    .sort((x, y) => seen(tm)[SPELLS[x].element as keyof typeof tm.spec] - seen(tm)[SPELLS[y].element as keyof typeof tm.spec]);
  for (const id of sp) if (canUse(b, { kind: 'spell', id, target })) return { kind: 'spell', id, target };
  if (b.mp < b.d.mp * 0.25 && canUse(b, { kind: 'item', id: 'mana' })) return { kind: 'item', id: 'mana' };
  return { kind: 'attack', target };
}

export function profsOf(p: Player): Partial<Record<Prof, number>> {
  return { elemental: profValue(p, 'elemental'), divine: profValue(p, 'divine'), forbidden: profValue(p, 'forbidden') };
}

export function pickOption(p: Player, run: RunState, strategy: Strategy = 'auto'): number {
  const opts = run.tower.floors[run.floor - 1]!.options;
  // CP6 rc2 (c): tutorial floors 2–4 now pair the taught node with a different one; the sim player follows the tutorial (taught node first), as when both routes were identical.
  if (run.tutorial && run.floor >= 2 && run.floor <= 4) return 0;
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
export interface Cp5Sim { mode: 'counter' | 'ignore' | 'base'; pair?: boolean; retreat?: number;
  /** CP6 sim: run the abyss from this depth until death or depth > cap. */
  abyss?: number; cap?: number; /** milestone depth already claimed */ ms?: number;
  /** Called on entering each node (sim snapshots for the death-combo sweep). */
  snap?: (p: Player, run: RunState) => void }
type CM = Monster & Cp5Mon;
const ELEMS: SpellId[] = ['fiery', 'freeze', 'shock', 'gale'];
/** prepEquip (prep.ts imports auto.ts; injected there to avoid a cycle). */
export const naivePrep = { equip: (p: Player): void => { autoEquip(p, [], leanStyle(p)); } }; // rc5: leanStyle = null unless cp8 + bulwark lean
let PHYS = false; // set by fight(): the current strategy plays physically (no offensive spells)
function bestSpell(b: BattleState, t: number, only?: SpellId[]): Action | null {
  if (PHYS) return null;
  const m = b.monsters[t]!, sp = seen(m);
  const ids = (only ?? (Object.keys(SPELLS) as SpellId[])).slice().sort((x, y) => sp[SPELLS[x].element] - sp[SPELLS[y].element]);
  for (const id of ids) if (sp[SPELLS[id].element] < 50 && canUse(b, { kind: 'spell', id, target: t })) return { kind: 'spell', id, target: t };
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
    if (boss.pulseNext) return { kind: 'attack', target: bi };
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
    if (boss.pulseNext && boss.charge === 0) return canUse(b, bash) ? bash : { kind: 'defend' };
    if (boss.sig === 'shield' && boss.breachEl && !low && boss.charge === 0) {
      const id = ELEMS.find((x) => SPELLS[x].element === boss.breachEl)!;
      if (!PHYS && b.d.mdb * 4 > b.d.adb * 0.8 && canUse(b, { kind: 'spell', id, target: bi })) return { kind: 'spell', id, target: bi };
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
  if (a.kind === 'spell' && b.hp < b.d.hp * 0.5 && (b.monsters[a.target] as CM | undefined)?.affixes?.includes('antimagic')) return { kind: 'attack', target: a.target };
  return a;
}
export interface RunReport { trip: number; unlockRate: number; settlement: Settlement; floorReached: number; kills: number; turns: number; level: number; power: number; bosses: BossFight[]; battles: number; spiritBattles: number; /** CP7 P1: better-than-worn drops this trip. */ upg?: number; /** CP7 P3: depths (abyss) / floors of rest nodes visited. */ rests?: number[]; /** CP6 abyss result. */ abyss?: { cleared: number; school: string; ms: number; titles: string[] }; /** CP4 rc: elite fights (floor, won). */ elites?: { floor: number; won: boolean; hpPct: number }[];
  /** rc4 diagnostics (sim-only, read by scripts/rc4-noclear.ts): why the run stopped early. */
  end?: { why: 'dead' | 'retreat'; floor: number; type: string; hpPots?: number; bturns?: number; foes: { name: string; rank: string; affixes?: string[]; sig?: string }[] };
  /** CP4 (buff strategies only) */
  cp4?: { buffs: string[]; formed: string[]; sources: Record<string, number>; offered: Record<string, number>; picked: Record<string, number>; risks: number; offers: number; contests: number } }

/** Sim-only: buff:<school> strategies listed here attack instead of casting at weaknesses (scripts/cp4-knobs.ts play=school). */
export const BUFF_PLAY = { attackOnly: [] as string[] };
const aimWeak = (s: string) => s !== 'noweak' && !BUFF_PLAY.attackOnly.includes(s);

export function autoRun(p: Player, pool: MonsterPool, seed: number, strategy: Strategy = 'auto', cp5?: Cp5Sim): RunReport {
  // Town prep. CP8 naive: the 出發前整備 「全部處理」 button (prepAll: alloc → equip (slot by slot, no school layout) → potions).
  if (SIM_AI.naive && !SIM_AI.add.has('equip')) { if (has(p, 'alloc')) autoAllocate(p); if (SIM_AI.add.has('townstyle')) autoEquip(p, [], gearStyle(strategy)); naivePrep.equip(p); if (has(p, 'shop')) buyHealthTo(p, TOWN_HP_POTIONS); }
  else {
  if (has(p, 'alloc')) autoAllocate(p);
  autoEquip(p, [], gearStyle(strategy));
  if (has(p, 'shop')) buyHealthTo(p, TOWN_HP_POTIONS);
  }
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
/** One sim decision for a strategy (the same call fight() makes each turn). */
export function decide(b: BattleState, strategy: Strategy, mode?: Cp5Sim['mode']): Action {
  if (SIM_AI.naive && RULES.cp8 && potHint(b)) return { kind: 'item', id: 'health' }; // cp8-rc4: naive drinks when the UI hint lights
  if (SIM_AI.naive && !SIM_AI.add.has('counter')) return chooseNaive(b);
  if (SIM_AI.naive) { PHYS = physPlay(strategy); return mode ? chooseCp5(b, mode, () => chooseNaive(b)) : chooseNaive(b); }
  PHYS = physPlay(strategy);
  const base = () => (strategy !== 'auto' ? chooseHuman(b, aimWeak(strategy) && !PHYS) : chooseAction(b));
  return mode ? chooseCp5(b, mode, base) : base();
}
export function fight(b: BattleState, strategy: Strategy, rng: Rng, profs: Partial<Record<Prof, number>>, mode?: Cp5Sim['mode']): void {
  while (!b.over && b.turn < 400) act(b, decide(b, strategy, mode), rng, profs);
  if (!b.over) b.over = 'lose';
}
const potCount = (b: BattleState) => b.potions.health + b.potions.mana + b.potions.spirit;
function autoRunInner(p: Player, pool: MonsterPool, seed: number, strategy: Strategy, level: number, power: number, bs: boolean, cp5?: Cp5Sim): RunReport {
  const run = cp5?.abyss ? startAbyss(p, seed, cp5.abyss, cp5.ms ?? 0) : startRun(p, seed);
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
  if (run.startPick) { while (run.offer) { resolve('start'); if (run.offersLeft) { run.offersLeft--; openOffer(p, run, 'boss'); } } run.startPick = false; }
  let turns = 0;
  const bosses: BossFight[] = [];
  const elites: { floor: number; won: boolean; hpPct: number }[] = [];
  let end: RunReport['end'];
  let battles = 0, spiritBattles = 0;
  const rests: number[] = [];
  while (!run.done) {
    if (run.abyss && depthOf(run) > (cp5?.cap ?? 60)) { run.done = 'retreat'; break; }
    const opt = pickOption(p, run, strategy);
    const type = run.tower.floors[run.floor - 1]!.options[opt]!;
    cp5?.snap?.(p, run);
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
      else fight(b, strategy, rng, profs);
      turns += b.turn;
      battles++; if (b.spiritUsed) spiritBattles++;
      if (!b.over) b.over = 'lose';
      if (type === 'elite') elites.push({ floor: run.floor, won: b.over === 'win', hpPct: b.hp / b.d.hp });
      if (type === 'boss') bosses.push({ floor: depthOf(run) || run.floor, turns: b.turn, potions: pot0 - potCount(b), won: b.over === 'win', spirit: !!b.spiritUsed, ...(bs ? { buffs: run.buffs?.length ?? 0 } : {}), ...(alt ? { alt } : {}) });
      const loot = finishBattle(p, run, b, ms, type);
      if (!loot) { end = { why: 'dead', floor: run.floor, type, hpPots: b.potions.health, bturns: b.turn, foes: ms.map((m) => { const x = m as Monster & Cp5Mon; return { name: m.name, rank: m.rank, ...(x.affixes?.length ? { affixes: [...x.affixes] } : {}), ...(x.sig ? { sig: x.sig } : {}) }; }) }; break; }
      if (!SIM_AI.naive || SIM_AI.add.has('equip') || SIM_AI.add.has('runequip')) { const used = autoEquip(p, run.bag, SIM_AI.naive && !SIM_AI.add.has('equip') ? leanStyle(p) : gearStyle(strategy));
      run.bag = run.bag.filter((e) => !used.includes(e)); }
      if (bs) for (let k = winOffers(type, run); k > 0; k--) { openOffer(p, run, type as 'elite'); resolve(type); }
      if (cp5?.retreat && type === 'boss' && (run.abyss || run.floor < run.tower.floors.length) && run.hp < runDerived(p, run).hp * cp5.retreat) { run.done = 'retreat'; end = { why: 'retreat', floor: run.floor, type, foes: [] }; break; }
    } else if (type === 'chest') {
      applyLoot(p, run, chestLoot(run, p));
      if (!SIM_AI.naive || SIM_AI.add.has('equip') || SIM_AI.add.has('runequip')) { const used = autoEquip(p, run.bag, SIM_AI.naive && !SIM_AI.add.has('equip') ? leanStyle(p) : gearStyle(strategy));
      run.bag = run.bag.filter((e) => !used.includes(e)); }
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
      rests.push(depthOf(run) || run.floor);
      const d = runDerived(p, run);
      if (run.hp < d.hp * 0.8 || !p.equipped.mainHand) rest(p, run, 'heal');
      else rest(p, run, 'upgrade', 'mainHand');
    } else if (type === 'shrine') {
      if (bs) { openShrine(p, run); run.risk = null; resolve('shrine'); }
      else shrine(p, run, run.hp > runDerived(p, run).hp * 0.7 ? 'might' : 'vigor');
    }
    advance(run, opt);
  }
  const floorReached = run.abyss ? depthOf(run) : run.done === 'clear' ? run.tower.floors.length + 1 : run.floor;
  const abyss = run.abyss ? { cleared: abyssCleared(run), school: abyssSchool(run), ms: run.abyss.ms ?? 0, titles: run.abyss.titles ?? [] } : undefined;
  const s = settle(p, run);
  // Sell the junk in town.
  const keep = new Set(Object.values(p.equipped).map((e) => e!.id));
  if (has(p, 'shop')) {
    for (const e of p.inventory.filter((x) => !keep.has(x.id))) p.credits += sellPrice(e);
    p.inventory = p.inventory.filter((x) => keep.has(x.id));
  }
  return { upg: run.upg ?? 0, rests, trip: run.trip ?? 0, unlockRate: unlockRate(p), settlement: s, floorReached, kills: run.kills, turns, level, power, bosses, battles, spiritBattles, elites, ...(end ? { end } : {}), ...(abyss ? { abyss } : {}), ...(bs ? { cp4: { ...cp4, buffs: [...(run.buffs ?? [])], formed: formed(run.buffs ?? []) } } : {}) };
}

export function starterKit(p: Player, seed = 7, lean?: Player['lean']): void {
  const rng = new Rng(seed);
  if (RULES.cp8 && lean === 'bulwark') { // cp8-rc5/rc6: bulwark start = 1H axe + buckler + light leather (rc6: heavy dropped, P1 1.318×); in-trip equip still prefers heavy
    const kit = [generateEquip(rng, 1, { group: 'oneHand', base: 'axe', quality: 'fair' }), generateEquip(rng, 1, { group: 'shield', base: 'buckler', quality: 'fair' }), generateEquip(rng, 1, { group: 'light', base: 'leather', slot: 'body', quality: 'fair' })];
    for (const e of kit) { p.inventory.push(e); equip(p, e); } p.lean = 'bulwark'; return;
  }
  const w = generateEquip(rng, 1, { group: 'oneHand', base: 'axe', quality: 'fair' });
  const a = generateEquip(rng, 1, { group: 'light', base: 'leather', slot: 'body', quality: 'fair' });
  p.inventory.push(w, a);
  equip(p, w);
  equip(p, a);
}

export { unspentExp, withRng };
