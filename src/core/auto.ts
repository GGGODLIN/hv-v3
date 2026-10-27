import { CP7, leanAllows } from './cp7';
import { coreFloor } from './buffoffer';
/** Headless auto-player used by the simulation and tests. Plays like a reasonable human, not optimally. */
import { type Action, type BattleState, type SkillId, skillKit, suggestSkill, ocCap, act, alive, armCp5, canUse, potHint, guardHint, suggestSpell, quickAttack, windingUp, panelSpec, startBattle, SPELLS, type SpellId } from './battle';
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
  type RunState, advance, applyLoot, chestLoot, encounter, finishBattle, merchantStock, rest, runDerived, settle, shrine, startRun, withRng, startAbyss, depthOf, abyssCleared, abyssSchool, mapPotion, MAP_LOW_HP,
  RULES, type Settlement, battleLocks, enterNode, openingOc, armBattle,
} from './run';
import { generateEquip } from './items';
import type { NodeType } from './tower';

/** Physical weights (pre-rc6 rule for everyone). cp8-rc6 bug 3: an arcane-leaning player mirrors them onto the caster stats
 *  (INT takes STR's 3, WIS takes DEX's 2, STR/DEX drop to INT/WIS's 1; END/AGI unchanged). 暫定（缺原版出處：findings 無配點建議）. */
/** sim diag only (never read by the game): battle-entry HP buckets and HP potions left at each death. */
export const SIM_DIAG = { battles: 0, low50: 0, low30: 0, deathPots: {} as Record<number, number> };
export const ALLOC_WEIGHTS = { phys: { str: 3, dex: 2, end: 3, agi: 2, int: 1, wis: 1 }, arcane: { str: 1, dex: 1, end: 3, agi: 2, int: 3, wis: 2 } } as const;
/** cp8-rc6 Part B (暫定，缺原版出處): per-lean 自動分配 weights under cp8; a lean missing here uses phys (arcane: ALLOC_WEIGHTS.arcane). Sim override: K_ALLOC_<lean>=str,dex,end,agi,int,wis. */
/** cp8-rc7 P0 bug 1 (暫定，缺原版出處，our own AI knob — not a game value): rc6 only had arcane here, so blade / oc / bulwark all used phys
 *  (STR 3 = END 3, INT/WIS 1 still bought once cheap → INT/WIS 7 on blade/oc, END = STR on bulwark) and arcane had END 3 = INT 3.
 *  Weight 0 = never buy. Each school's main stats now lead: blade STR/DEX, oc STR/AGI, bulwark END, arcane INT/WIS (INT > STR kept). */
export const LEAN_ALLOC: Partial<Record<NonNullable<Player['lean']>, Record<string, number>>> = {
  blade: { str: 3, dex: 3, end: 2, agi: 2, int: 0, wis: 0 },
  oc: { str: 3, dex: 3, end: 3, agi: 2, int: 1, wis: 1 }, // cp8-rc8 item 1 candidate c3 (old phys 3,2,3,2,1,1 + dex 3); 暫定 AI knob
  bulwark: { str: 2, dex: 1, end: 3, agi: 1, int: 0, wis: 0 },
  arcane: { str: 0, dex: 0, end: 2, agi: 1, int: 3, wis: 2 },
};
export const allocWeights = (p: Player): Record<string, number> => (RULES.cp8 && p.lean ? LEAN_ALLOC[p.lean] ?? ALLOC_WEIGHTS.phys : ALLOC_WEIGHTS.phys);
export function autoAllocate(p: Player): void {
  const weights = allocWeights(p);
  for (let guard = 0; guard < 2000; guard++) {
    const best = ATTRS.map((a) => [a, (weights[a] ? (attrCost(p.attrs[a] + 1) - attrCost(p.attrs[a])) / weights[a]! : Infinity)] as const).sort((x, y) => x[1] - y[1])[0]!;
    if (allocate(p, best[0]) === 0) break;
  }
  // cp8-rc9 P1-8: rc8 playtest left 3 points unspent after 「全部處理」 — the cheapest weighted attribute cost more than what was left,
  // while a weight-0 attribute was still affordable. Spend the remainder on the cheapest affordable attribute so nothing is left over.
  // cp8-rc10 P0-1: only attributes the school buys (weight > 0) — rc9 let blade / bulwark leftovers fall into INT/WIS.
  // P1-8: keep buying (cheapest allowed first) until the remaining EXP cannot pay for any allowed point.
  if (RULES.cp8) for (let guard = 0; guard < 2000; guard++) {
    const c = ATTRS.filter((a) => (weights[a] ?? 0) > 0).map((a) => [a, attrCost(p.attrs[a] + 1) - attrCost(p.attrs[a])] as const).sort((x, y) => x[1] - y[1]);
    if (!c.some(([a]) => allocate(p, a) > 0)) break;
  }
}

/** cp8-rc11 bug 4(b): what the character tab shows next to 未分配 EXP. Character level comes from total EXP (levelForExp(p.exp)),
 *  so 「下一級」 is EXP still to earn; unspent EXP is already counted and cannot buy it. `auto` = cheapest point 全部處理 would buy
 *  (weight > 0), `any` = cheapest point overall (a weight-0 one can still be bought by hand). */
export function nextPointCosts(p: Player): { auto: { attr: string; cost: number } | null; any: { attr: string; cost: number } } {
  const w = allocWeights(p);
  const c = ATTRS.map((a) => ({ attr: a as string, cost: Math.ceil(attrCost(p.attrs[a] + 1) - attrCost(p.attrs[a])) })).sort((x, y) => x.cost - y.cost);
  return { auto: c.find((x) => (w[x.attr] ?? 0) > 0) ?? null, any: c[0]! };
}

/** 暫定（缺原版出處）: sim town prep buys health potions up to this stock (shared with the CP7 出發前整備 「買藥」). */
export const TOWN_HP_POTIONS = 3;
/** Buy health potions up to `n` while credits last (sim town prep; UI 「買藥」). Returns potions bought. */
export function buyHealthTo(p: Player, n: number): number {
  let k = 0;
  while (p.potions.health < n && p.credits >= RULES.potionPrice.health) { p.credits -= RULES.potionPrice.health; p.potions.health++; k++; }
  return k;
}

/** cp8-rc6 bug 2: 「全部處理」/「買藥」 also tops up mana and spirit potions. The source gives no stock quantity (findings 004: the
 *  three base potions are unlimited shop items at 50 / 100 / 100 C), so the health-potion rule (TOWN_HP_POTIONS) is reused — 暫定.
 *  Order health → mana → spirit while credits last. Returns potions bought. */
export function buyPotionsTo(p: Player, n: number): number {
  let k = buyHealthTo(p, n);
  for (const id of ['mana', 'spirit'] as const) while (p.potions[id] < n && p.credits >= RULES.potionPrice[id]) { p.credits -= RULES.potionPrice[id]; p.potions[id]++; k++; }
  return k;
}
/** 暫定 (round 5): auto-equip only swaps when the power score rises by at least this fraction, so IW-upgraded gear is not pushed out by a near-equal drop. */
export const AUTO_EQUIP_MARGIN = 0.05;

/** rc4 (sim only): weapon layout per play school. arcane = staff, bulwark = one-hand + shield (docs/cp4-run-buffs.md §2: W1 不動之盾 block/parry),
 * blade = one-hand, off-hand free (推定：B7 處刑者 buffs Merciful Blow, a One-Handed skill line in F-002-4.2-skills / Ticket 04),
 * oc = any main hand, shield free, best joint pair (推定：no doc names a weapon; a forced two-hander gave 97% never-clear in the sim, docs/logs/rc4-noclear-schoolgear-oc2h.txt). null = original slot-by-slot logic. */
export type GearStyle = { main: Equip['group'] | null; shield: 'yes' | 'free' | 'no'; armor?: 'heavy'; lock?: boolean } | null;
/** cp8-rc5 (producer 2026-10-26, layout only, no numbers): a bulwark-leaning player's town 換上 = 1H + shield, heavy armor preferred. */
export const BULWARK_STYLE: NonNullable<GearStyle> = { main: 'oneHand', shield: 'yes', armor: 'heavy' };
/** cp8-rc6 item 5 (producer 2026-10-26, layout only, no numbers): auto-equip is locked to the lean school's weapon layout (gearStyle
 *  of buff:<lean>: blade 2H, oc 1H, arcane staff, bulwark 1H + shield + heavy). No lean → null (original slot-by-slot logic). */
export const leanStyle = (p: Player): GearStyle => { const g = RULES.cp8 && p.lean ? gearStyle(`buff:${p.lean}`) : null; return g ? { ...g, lock: true } : null; };
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
  // cp8-rc6 item 5: a locked (lean) style never falls back to an off-style weapon; with none of its group owned the worn main hand stays.
  const pool = styled.length ? styled : st.lock ? [] : mains;
  const score = (m: Equip | undefined, o: Equip | undefined) => powerScore(derive({ ...p, equipped: { ...p.equipped, mainHand: m, offHand: o } as Player['equipped'] }));
  let best: [Equip | undefined, Equip | undefined] = [p.equipped.mainHand, p.equipped.offHand];
  const legal = (m: Equip | undefined, o: Equip | undefined) => !(o && blocksOffHand(m)) && !(o && st.shield === 'no') && !(st.shield === 'yes' && offs.length && !o && !blocksOffHand(m));
  const curOk = (!best[0] || !st.main || best[0].group === st.main || !styled.length) && legal(best[0], best[1]);
  if (st.lock && !styled.length) return [];
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
  if (!RULES.cp8) return autoEquip0(p, extra, style);
  // cp8-rc9 P1-7: auto-equip never lowers 戰力 (rc8 playtest: preset bulwark 467 → 446 when the school-lock swapped a cloth robe for a weaker
  // allowed piece). If the whole pass ends below the starting powerScore, it is undone (worn set and inventory restored, nothing taken).
  const eq0 = { ...p.equipped }, inv0 = [...p.inventory], pw0 = powerScore(derive(p));
  const used = autoEquip0(p, extra, style);
  if (powerScore(derive(p)) < pw0) { p.equipped = eq0; p.inventory = inv0; return []; }
  return used;
}
function autoEquip0(p: Player, extra: Equip[], style: GearStyle): Equip[] {
  const used: Equip[] = [];
  const cands = [...p.inventory, ...extra];
  if (style) used.push(...equipHands(p, cands, style));
  for (const slot of SLOTS) {
    if (style && (slot === 'mainHand' || slot === 'offHand')) continue;
    for (const e of cands.filter((x) => x.slot === slot)) {
      if (style?.lock && !leanAllows(p, e)) continue; // cp8-rc7 P0 bug 2: armour class is school-locked too
      // cp8-rc7 P0 bug 2: a worn piece the school may not wear (preset / old save) is swapped for any allowed piece
      if (style?.lock && p.equipped[slot] && !leanAllows(p, p.equipped[slot]!)) { if (!p.inventory.includes(e)) { p.inventory.push(e); used.push(e); } equip(p, e); continue; }
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
  // cp8-rc12 item 2: the naive player now presses a skill when its hint lights (castable; app.ts readyHint). SIM_NAIVE_AONLY=1 = the
  // rc11 「只按 A」 comparison (no skills).
  add: new Set([...(ENV?.SIM_ADD ?? '').split(',').filter(Boolean), ...(ENV?.SIM_NAIVE_AONLY === '1' ? [] : ['skills'])].filter((x) => !(ENV?.SIM_NAIVE_AONLY === '1' && x === 'skills'))) };
/** CP8 naive battle choice. */
export function chooseNaive(b: BattleState): Action {
  const live = alive(b);
  // cp8-rc5 (blade sim d22 vs playtest d11–20): naive = what 「A」 hits with no clicking — the UI default target, the first live
  // monster (app.ts command()). Lowest-HP targeting needs reading every HP bar + Tab; kept as SIM_TGT=low (diagnosis). Preset sim: blade trip-1 22→17.
  const target = ENV?.SIM_TGT !== 'low' ? b.monsters.findIndex((m) => m.hp > 0) : b.monsters.indexOf(live.reduce((a, m) => (m.hp < a.hp ? m : a)));
  // cp8-rc11 item 2 (diagnosis): SIM_NAIVE40=0 = the playtester pattern 「只按 A，pothint 亮才喝」 — no 40% HP drink of its own.
  if (ENV?.SIM_NAIVE40 !== '0' && b.hp < b.d.hp * 0.4 && canUse(b, { kind: 'item', id: 'health' })) return { kind: 'item', id: 'health' };
  const A = SIM_AI.add;
  if (A.has('defend') && b.monsters.some((m) => m.hp > 0 && m.charge > 0)) return { kind: 'defend' };
  if (A.has('spirit') && !b.spirit && live.some((m) => m.rank === 'boss') && canUse(b, { kind: 'spirit' })) return { kind: 'spirit' };
  // rc13 item 3(b): hinted mode presses the skill the UI hints (suggestSkill: beats A by > 10%). SIM_SKILLHINT=any = rc12 「first usable skill」.
  // rc15 item 2 (diag): SIM_SKILLHINT=off = hinted mode without skill presses (S / spell hints stay).
  if (ENV?.SIM_SKILLHINT === 'off') { /* skills off */ } else if (A.has('skills') && ENV?.SIM_SKILLHINT !== 'any' && !ENV?.SIM_SKILLS) { const g = suggestSkill(b, target); if (g) return { kind: 'skill', id: g, target }; }
  else if (A.has('skills')) for (const id of ((ENV?.SIM_SKILLS?.split(',') ?? [...skillKit(b)].reverse()) as SkillId[])) if (canUse(b, { kind: 'skill', id, target })) return { kind: 'skill', id, target };
  const qa = quickAttack(b, target);
  // rc15 arcane diag (sim only): SIM_ARC_MELEE=1 = staff A is a plain melee hit (no fiery quick-cast); SIM_ARC_FORCE=<spell> = the player
  // presses that one spell key every turn when castable (e.g. freeze = 「2冰封」), else A.
  if (ENV?.SIM_ARC_MELEE === '1' && qa.kind === 'spell') return { kind: 'attack', target };
  if (ENV?.SIM_ARC_FORCE && qa.kind === 'spell') { const f: Action = { kind: 'spell', id: ENV.SIM_ARC_FORCE as SpellId, target }; if (canUse(b, f)) return f; }
  // cp8-rc12 item 2: hinted mode follows the arcane 💡 element suggestion (app.ts arcaneSpell). SIM_SPELLHINT=old = rc11 rule, off = only A.
  if (A.has('skills') && qa.kind === 'spell' && ENV?.SIM_SPELLHINT !== 'off') { const g = suggestSpell(b, target, ENV?.SIM_SPELLHINT === 'old' ? 'old' : 'new'); if (g) return { kind: 'spell', id: g.id, target }; }
  return qa;
}
const seen = (m: Monster): Monster['spec'] => (SIM_AI.omni ? m.spec : panelSpec(m));
export const PHYS_SCHOOLS = ['blade', 'bulwark'];
const physPlay = (s: string) => !SIM_AI.omni && s.startsWith('buff:') && PHYS_SCHOOLS.includes(s.slice(5).replace(/-nocore(-nofloor)?$/, ''));

export function chooseAction(b: BattleState): Action {
  const live = alive(b);
  const target = b.monsters.indexOf(live.reduce((a, m) => (m.hp < a.hp ? m : a)));
  const tm = b.monsters[target]!;
  if (b.hp < b.d.hp * 0.35 && canUse(b, { kind: 'item', id: 'health' })) return { kind: 'item', id: 'health' };
  if (b.monsters.some((m) => (RULES.cp8 ? windingUp(m) : m.hp > 0 && m.charge > 0))) return b.hp < b.d.hp * 0.6 && canUse(b, { kind: 'item', id: 'health' }) ? { kind: 'item', id: 'health' } : { kind: 'defend' };
  if (b.hp < b.d.hp * 0.3 && b.oc >= 25) return { kind: 'defend' };
  // rc13 item 3(c): the current AI presses the hinted skill (suggestSkill covers Merciful execute, Rending, Shatter, Vital-vs-stun). SIM_P4SKILL=old = rc12 lines.
  if (ENV?.SIM_P4SKILL !== 'old') { const g = suggestSkill(b, target); if (g) return { kind: 'skill', id: g, target }; }
  else if (canUse(b, { kind: 'skill', id: 'mercifulBlow', target }) && tm.status.bleedTurns > 0 && tm.hp < tm.maxHp * 0.25) return { kind: 'skill', id: 'mercifulBlow', target };
  if (ENV?.SIM_P4SKILL === 'old' && tm.status.stun > 0 && canUse(b, { kind: 'skill', id: 'vitalStrike', target })) return { kind: 'skill', id: 'vitalStrike', target };
  const big = b.monsters.indexOf(live.reduce((a, m) => (m.hp > a.hp ? m : a)));
  if (ENV?.SIM_P4SKILL === 'old' && canUse(b, { kind: 'skill', id: 'shieldBash', target: big }) && b.oc >= 75) return { kind: 'skill', id: 'shieldBash', target: big };
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
/** cp8 (b) (producer 2026-10-26, 暫定, our own AI knob, no source): per-school buff ids the cp8 auto-pick takes before its own school
 *  (defensive / recovery first). Empty = old order. */
export const LEAN_BUFF_FIRST: Partial<Record<string, string[]>> = {
  // cp8 (b) chosen on B256 (暫定): arcane V 0.63→0.64, P1 1.421→1.227×. Death breakdown: 80% of arcane d10-12 deaths had the HP potion on cooldown.
  arcane: ['S-vigor', 'W6', 'W4', 'N4'], // blade tried (V 0.68→0.71) but blade raw p95 0.98→0.81 breaks 受傷 raw-p95 −0.08 → not adopted
};
export function prefBuff(ids: string[], strat: BuffStrategy, rng: Rng): string | undefined {
  if (!ids.length) return undefined;
  const school = buffSchool(strat);
  if (school === 'random') return ids[rng.int(0, ids.length - 1)];
  const nocore = strat.includes('-nocore'); const first = (RULES.cp8 && LEAN_BUFF_FIRST[school]) || [];
  const score = (id: string) => { const b = BUFF[id]!; if (first.includes(id)) return -1 + first.indexOf(id) / 100; return b.school === school ? (b.core && !nocore ? 0 : 1) : b.school === 'none' ? 2 : 3; };
  return [...ids].sort((a, b) => score(a) - score(b) || ids.indexOf(a) - ids.indexOf(b))[0];
}
/** 暫定 (CP2b): chance the human model takes a battle when one is offered and HP is at least 55%. */
export const HUMAN_COMBAT_SHARE = 0.5;
/** CP3-fix 8 'noweak': plays like 'human' but never aims at weaknesses (spells picked without looking at resistances: always the first offensive spell). */
/** cp8-rc9 item 2 (暫定, our own sim-AI knob, not a game value; reference only): current-AI arcane play. quick = fall back to the
 *  staff quick-cast (A) instead of a staff bonk; noweak = skip the seen-weakness spell loop; pot = drink on the UI potion hint. Env K_ARC_AI=a,b. */
export const ARC_AI = new Set<string>((ENV?.K_ARC_AI ?? 'quick').split(',').filter(Boolean));
let ARC = false; // set by decide(): the current strategy is buff:arcane*
export function chooseHuman(b: BattleState, aimWeak = true): Action {
  const live = alive(b);
  if (ARC && ARC_AI.has('pot') && RULES.cp8 && potHint(b)) return { kind: 'item', id: 'health' };
  const target = b.monsters.indexOf(live.reduce((a, m) => (m.hp < a.hp ? m : a)));
  const tm = b.monsters[target]!;
  if (b.hp < b.d.hp * 0.4 && canUse(b, { kind: 'item', id: 'health' })) return { kind: 'item', id: 'health' };
  if (b.monsters.some((m) => (RULES.cp8 ? windingUp(m) : m.hp > 0 && m.charge > 0))) return b.hp < b.d.hp * 0.6 && canUse(b, { kind: 'item', id: 'health' }) ? { kind: 'item', id: 'health' } : { kind: 'defend' };
  // CP3-fix 10: a human enters Spirit Stance in a boss fight when the button lights up (boss battles open with OC).
  if (!b.spirit && live.some((m) => m.rank === 'boss') && canUse(b, { kind: 'spirit' })) return { kind: 'spirit' };
  if (!aimWeak) {
    if (b.mp < b.d.mp * 0.25 && canUse(b, { kind: 'item', id: 'mana' })) return { kind: 'item', id: 'mana' };
    return { kind: 'attack', target };
  }
  const sp = (Object.keys(SPELLS) as SpellId[]).filter((id) => seen(tm)[SPELLS[id].element as keyof typeof tm.spec] < 0)
    .sort((x, y) => seen(tm)[SPELLS[x].element as keyof typeof tm.spec] - seen(tm)[SPELLS[y].element as keyof typeof tm.spec]);
  if (!(ARC && ARC_AI.has('noweak'))) for (const id of sp) if (canUse(b, { kind: 'spell', id, target })) return { kind: 'spell', id, target };
  if (b.mp < b.d.mp * 0.25 && canUse(b, { kind: 'item', id: 'mana' })) return { kind: 'item', id: 'mana' };
  return ARC && ARC_AI.has('quick') ? quickAttack(b, target) : { kind: 'attack', target };
}

export function profsOf(p: Player): Partial<Record<Prof, number>> {
  return { elemental: profValue(p, 'elemental'), divine: profValue(p, 'divine'), forbidden: profValue(p, 'forbidden') };
}

/** cp8 (b) (producer 2026-10-26, 暫定, our own AI knob, no source): per-lean route thresholds under cp8. restBelow = HP share below which
 *  calm nodes (rest first) win; eliteAbove = HP share needed before an elite is preferred over chest/battle. Default = the old 0.55 / 0. */
export const LEAN_ROUTE: Partial<Record<NonNullable<Player['lean']>, { restBelow: number; eliteAbove: number }>> = {};
export function pickOption(p: Player, run: RunState, strategy: Strategy = 'auto'): number {
  const opts = run.tower.floors[run.floor - 1]!.options;
  // CP6 rc2 (c): tutorial floors 2–4 now pair the taught node with a different one; the sim player follows the tutorial (taught node first), as when both routes were identical.
  if (run.tutorial && run.floor >= 2 && run.floor <= 4) return 0;
  const frac = run.hp / runDerived(p, run).hp;
  // 暫定 (CP2b) human route: below 55% HP always a non-combat node; otherwise a coin flip (HUMAN_COMBAT_SHARE) between
  // taking a normal battle and taking a non-combat node. A pure "never fight" route is printed separately as 'avoid'.
  const coin = new Rng(run.floor * 7919 + run.kills * 131 + Math.round(run.hp)).chance(HUMAN_COMBAT_SHARE);
  const calm: NodeType[] = ['rest', 'shrine', 'chest', 'merchant', 'battle', 'elite', 'boss'];
  const lr = (RULES.cp8 && p.lean && LEAN_ROUTE[p.lean]) || { restBelow: 0.55, eliteAbove: 0 };
  const pref: NodeType[] = ENV?.SIM_ROUTE === 'battle' /* rc14: QA-like route, fights 戰 before 菁英 — sim acceptance baseline (scripts set it; SIM_ROUTE=elite / unset = elite-first reference) */ ? (frac < lr.restBelow ? ['rest', 'shrine', 'chest', 'merchant', 'battle', 'elite', 'boss'] : ['battle', 'chest', 'shrine', 'rest', 'merchant', 'elite', 'boss']) : strategy === 'avoid' ? calm : strategy === 'human' || strategy === 'noweak' ? (frac < 0.55 || !coin ? calm : ['battle', 'chest', 'shrine', 'rest', 'merchant', 'elite', 'boss']) : frac < lr.restBelow ? ['rest', 'shrine', 'chest', 'merchant', 'battle', 'elite', 'boss'] : frac < lr.eliteAbove ? ['rest', 'chest', 'battle', 'shrine', 'merchant', 'elite', 'boss'] : ['elite', 'chest', 'battle', 'shrine', 'rest', 'merchant', 'boss'];
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
  end?: { why: 'dead' | 'retreat'; floor: number; type: string; hpPots?: number; bturns?: number; mp?: number; mpMax?: number; mpPots?: number; hpCd?: number; mpCd?: number; hp0?: number; foes: { name: string; rank: string; affixes?: string[]; sig?: string }[] };
  /** CP4 (buff strategies only) */
  cp4?: { buffs: string[]; formed: string[]; sources: Record<string, number>; offered: Record<string, number>; picked: Record<string, number>; risks: number; offers: number; contests: number } }

/** Sim-only: buff:<school> strategies listed here attack instead of casting at weaknesses (scripts/cp4-knobs.ts play=school). */
export const BUFF_PLAY = { attackOnly: [] as string[] };
const aimWeak = (s: string) => s !== 'noweak' && !BUFF_PLAY.attackOnly.includes(s);

export function autoRun(p: Player, pool: MonsterPool, seed: number, strategy: Strategy = 'auto', cp5?: Cp5Sim): RunReport {
  // Town prep. CP8 naive: the 出發前整備 「全部處理」 button (prepAll: alloc → equip (slot by slot, no school layout) → potions).
  // rc14 diagnosis (sim only): SIM_NOPREP=1 = the player pressed 「忽略並出發」 (no alloc / equip / potion top-up).
  if (ENV?.SIM_NOPREP === '1') { /* skip town prep */ }
  else if (SIM_AI.naive && !SIM_AI.add.has('equip')) { if (has(p, 'alloc')) autoAllocate(p); if (SIM_AI.add.has('townstyle')) autoEquip(p, [], gearStyle(strategy)); naivePrep.equip(p); if (has(p, 'shop')) (RULES.cp8 ? buyPotionsTo : buyHealthTo)(p, TOWN_HP_POTIONS); }
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
/** rc15 arcane diag (sim only): SIM_LAG=1 = reaction delay — the player presses what the UI suggested one turn earlier (if still usable). */
export function decide(b: BattleState, strategy: Strategy, mode?: Cp5Sim['mode']): Action {
  if (ENV?.SIM_LAG !== '1') return decide0(b, strategy, mode);
  const cur = decide0(b, strategy, mode), L = b as unknown as { lag?: Action }; const prev = L.lag; L.lag = cur;
  if (prev && prev.kind !== 'item' && canUse(b, 'target' in prev && b.monsters[prev.target as number]?.hp! > 0 ? prev : { ...prev, target: (cur as { target?: number }).target } as Action)) return 'target' in prev && b.monsters[prev.target as number]?.hp! > 0 ? prev : ({ ...prev, target: (cur as { target?: number }).target } as Action);
  return cur;
}
function decide0(b: BattleState, strategy: Strategy, mode?: Cp5Sim['mode']): Action {
  if (SIM_AI.naive && RULES.cp8 && ENV?.SIM_POTHINT !== '0' && potHint(b)) return { kind: 'item', id: 'health' }; // cp8-rc4: naive drinks when the UI hint lights. SIM_POTHINT=0 (post-rc9 #2): plain naive, potion only below 40% HP
  if (SIM_AI.naive && RULES.cp8 && SIM_AI.add.has('skills') && ENV?.SIM_GUARDHINT !== '0') { const g = guardHint(b); if (g) return { kind: g }; } // cp8-rc12 item 5: hinted mode follows the D hint (HP danger, potion unusable)
  if (SIM_AI.naive && !SIM_AI.add.has('counter')) return chooseNaive(b);
  if (SIM_AI.naive) { PHYS = physPlay(strategy); return mode ? chooseCp5(b, mode, () => chooseNaive(b)) : chooseNaive(b); }
  PHYS = physPlay(strategy); ARC = strategy.startsWith('buff:arcane');
  const base = () => (strategy !== 'auto' ? chooseHuman(b, aimWeak(strategy) && !PHYS) : chooseAction(b));
  return mode ? chooseCp5(b, mode, base) : base();
}
/** rc15 arcane diag (DBGFIGHT=1, sim only): one row per fight — action counts, MP-starved turns (staff A fell back to melee), HP taken, biggest hit. */
export const FIGHT_LOG: Record<string, number | string | boolean>[] = []; export const FIGHT_CTX = { depth: 0, type: '' };
export function fight(b: BattleState, strategy: Strategy, rng: Rng, profs: Partial<Record<Prof, number>>, mode?: Cp5Sim['mode']): void {
  const dbg = ENV?.DBGFIGHT ? (((b as unknown as { dbg: Record<string, number> }).dbg = {}) as Record<string, number>) : null;
  while (!b.over && b.turn < 400) { const a = decide(b, strategy, mode); if (dbg && ENV?.DBGSK) { const t = b.monsters.findIndex((e) => e.hp > 0); const ok = [...skillKit(b)].filter((id) => canUse(b, { kind: 'skill', id, target: t })); dbg.ocmax = Math.max(dbg.ocmax ?? 0, Math.round(b.oc)); if (ok.length) dbg.canSk = (dbg.canSk ?? 0) + 1; dbg.kit = [...skillKit(b)].length; } if (dbg) { const k = a.kind === 'skill' ? 'sk:' + a.id : a.kind === 'item' ? 'it:' + a.id : a.kind; dbg[k] = (dbg[k] ?? 0) + 1; } if (dbg && a.kind === 'attack' && b.d.style === 'staff') dbg.mpStarved = (dbg.mpStarved ?? 0) + 1; if (dbg && a.kind === 'spell') dbg['sp:' + a.id] = (dbg['sp:' + a.id] ?? 0) + 1; const h0 = b.hp; act(b, a, rng, profs); if (dbg && b.hp < h0) { dbg.taken = (dbg.taken ?? 0) + h0 - b.hp; dbg.maxHit = Math.max(dbg.maxHit ?? 0, (h0 - b.hp) / b.d.hp); } }
  if (dbg) FIGHT_LOG.push({ ...dbg, depth: FIGHT_CTX.depth, type: FIGHT_CTX.type, turns: b.turn, won: b.over === 'win', maxHp: Math.round(b.d.hp), maxMp: Math.round(b.d.mp ?? 0), mpEnd: Math.round(b.mp), hpEnd: Math.round(b.hp) });
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
      // rc16 item 3 sim: SIM_MAPPOT=1 drinks map potions (no CD) before a fight while HP < 50% (what the new map warning asks).
      if (ENV?.SIM_MAPPOT === '1') while (run.hp < runDerived(p, run).hp * MAP_LOW_HP && mapPotion(p, run) > 0);
      const ms = encounter(run, pool, type);
      const d = runDerived(p, run);
      const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions); const hp0Pct = run.hp / d.hp; // sim diag
      SIM_DIAG.battles++; if (hp0Pct < 0.5) SIM_DIAG.low50++; if (hp0Pct < 0.3) SIM_DIAG.low30++;
      b.locked = battleLocks(p);
      const oc0 = openingOc(p, type, run);
      armBattle(b, run);
      b.oc += oc0;
      // rc16 item 4 sim only（自訂，非原版 test）: SIM_OPEN_OC=N gives N OC at every abyss battle start (run it on the blade preset).
      if (ENV?.SIM_OPEN_OC && run.abyss) b.oc = Math.min(ocCap(b), b.oc + Number(ENV.SIM_OPEN_OC));
      if (run.cp5) armCp5(b, run.pdot);
      const profs = profsOf(p);
      const pot0 = potCount(b);
      let alt: BossFight['alt'];
      if (cp5?.pair && type === 'boss') {
        const c = structuredClone(b); const r2 = new Rng(1); r2.state = rng.state;
        fight(c, strategy, r2, profs, 'ignore');
        alt = { turns: c.turn, potions: pot0 - potCount(c), won: c.over === 'win' };
      }
      FIGHT_CTX.depth = depthOf(run) || run.floor; FIGHT_CTX.type = type;
      if (cp5) fight(b, strategy, rng, profs, cp5.mode);
      else fight(b, strategy, rng, profs);
      turns += b.turn;
      battles++; if (b.spiritUsed) spiritBattles++;
      if (!b.over) b.over = 'lose';
      if (ENV?.DBGFIGHT && run.abyss) console.error('BF ' + JSON.stringify({ st: strategy, d: depthOf(run), type, won: b.over === 'win', turns: b.turn, hp0: +hp0Pct.toFixed(2), maxHp: Math.round(d.hp), adb: Math.round(d.adb), pmit: +d.physMit.toFixed(3), ev: +(d.evade ?? 0).toFixed(3), blk: +(d.block ?? 0).toFixed(3), mh: p.equipped.mainHand?.group, oh: p.equipped.offHand?.group ?? '-', body: p.equipped.body?.group, lv: Math.round(powerScore(d)), ...(b as unknown as { dbg: object }).dbg }));
      if (type === 'elite') elites.push({ floor: run.floor, won: b.over === 'win', hpPct: b.hp / b.d.hp });
      if (type === 'boss') bosses.push({ floor: depthOf(run) || run.floor, turns: b.turn, potions: pot0 - potCount(b), won: b.over === 'win', spirit: !!b.spiritUsed, ...(bs ? { buffs: run.buffs?.length ?? 0 } : {}), ...(alt ? { alt } : {}) });
      const loot = finishBattle(p, run, b, ms, type);
      if (!loot) { SIM_DIAG.deathPots[b.potions.health] = (SIM_DIAG.deathPots[b.potions.health] ?? 0) + 1; end = { why: 'dead', floor: run.floor, type, hpPots: b.potions.health, bturns: b.turn, mp: b.mp, mpMax: b.d.mp, mpPots: b.potions.mana, hpCd: b.itemCd.health, mpCd: b.itemCd.mana, hp0: hp0Pct, foes: ms.map((m) => { const x = m as Monster & Cp5Mon; return { name: m.name, rank: m.rank, ...(x.affixes?.length ? { affixes: [...x.affixes] } : {}), ...(x.sig ? { sig: x.sig } : {}) }; }) }; break; }
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
      let left = ENV?.SIM_NOMERCHCAP === '1' ? Infinity : st.hpLeft ?? Infinity; // SIM_NOMERCHCAP: sim diag (rc18 unlimited) // rc19 item 3（自訂，非原版）: per-merchant cap
      while (left > 0 && p.potions.health < 4 && p.credits >= RULES.potionPrice.health) { p.credits -= RULES.potionPrice.health; p.potions.health++; left--; }
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

/** cp8 (b) (producer 2026-10-26, 暫定, our own kit knob, no source): per-lean starting kit tweaks under cp8. body = starting body armour
 *  group (default light leather); mana = extra starting mana potions. Empty = old kit. */
export const LEAN_KIT: Partial<Record<NonNullable<Player['lean']>, { body?: 'cloth' | 'light'; mana?: number; weapon?: { group: Equip['group']; base: string } }>> = {};
// cp8-rc11 item 2 diagnosis: K_BLADE_KIT=<group>:<base> (e.g. twoHand:longsword) sets the blade starter weapon.
{ const k = ENV?.K_BLADE_KIT; if (k) { const [group, base] = k.split(':'); LEAN_KIT.blade = { ...LEAN_KIT.blade, weapon: { group: group as Equip['group'], base: base! } }; } }
export function starterKit(p: Player, seed = 7, lean?: Player['lean']): void {
  const rng = new Rng(seed);
  if (RULES.cp8 && lean === 'bulwark') { // cp8-rc5/rc6: bulwark start = 1H axe + buckler + heavy plate body (rc9 P1-5; rc6 had light leather); in-trip equip still prefers heavy
    const kit = [generateEquip(rng, 1, { group: 'oneHand', base: 'axe', quality: 'fair' }), generateEquip(rng, 1, { group: 'shield', base: 'buckler', quality: 'fair' }), generateEquip(rng, 1, { group: 'heavy', base: 'plate', slot: 'body', quality: 'fair' })]; // cp8-rc9 P1-5: producer — bulwark starts in heavy armour (layout only)
    for (const e of kit) { p.inventory.push(e); equip(p, e); } p.lean = 'bulwark'; return;
  }
  if (RULES.cp8 && lean) p.lean = lean; // cp8-rc6: every school keeps its lean (school-locked auto-equip, school-aware 自動分配)
  const lk0 = (RULES.cp8 && lean && LEAN_KIT[lean]) || {};
  const w = generateEquip(rng, 1, lk0.weapon ? { group: lk0.weapon.group, base: lk0.weapon.base, quality: 'fair' } : { group: 'oneHand', base: 'axe', quality: 'fair' });
  const lk = (RULES.cp8 && lean && LEAN_KIT[lean]) || {};
  const a = generateEquip(rng, 1, lk.body === 'cloth' ? { group: 'cloth', base: 'cotton', slot: 'body', quality: 'fair' } : { group: 'light', base: 'leather', slot: 'body', quality: 'fair' });
  if (lk.mana) p.potions.mana += lk.mana;
  p.inventory.push(w, a);
  equip(p, w);
  equip(p, a);
}

export { unspentExp, withRng };
