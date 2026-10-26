import { RULES } from './run';
import { CP8 } from './cp8';
import type { BMods, Combos } from './buffs';
import { CONSTANTS as C } from './data/constants';
import { maxHit, meanHit, resolveHit, type Avoid } from './damage';
import type { Monster } from './monsters';
import { CP5, CP5_STAT, SIG_TEXT, type BossSig, type Cp5Mon, type PDot, emptyDot } from './cp5';
import type { Derived, Element, Prof } from './player';
import type { Rng } from './rng';

export type SkillId = 'shieldBash' | 'vitalStrike' | 'mercifulBlow' | 'greatCleave' | 'concussiveStrike' | 'rendingBlow' | 'shatterStrike';
export type SpellId = 'fiery' | 'freeze' | 'shock' | 'gale' | 'smite' | 'corruption';
export type PotionId = 'health' | 'mana' | 'spirit';

export interface SpellDef { id: SpellId; zh: string; element: Element; baseCost: number; mod: number; targets: number; school: Prof; statusChance: number }
export const SPELLS: Record<SpellId, SpellDef> = {
  fiery: { id: 'fiery', zh: '烈焰爆破', element: 'fire', baseCost: 6, mod: 4, targets: 3, school: 'elemental', statusChance: 0.25 },
  freeze: { id: 'freeze', zh: '冰封', element: 'cold', baseCost: 6, mod: 4, targets: 3, school: 'elemental', statusChance: 0.25 },
  shock: { id: 'shock', zh: '雷擊', element: 'elec', baseCost: 6, mod: 4, targets: 3, school: 'elemental', statusChance: 0.25 },
  gale: { id: 'gale', zh: '狂風', element: 'wind', baseCost: 6, mod: 4, targets: 3, school: 'elemental', statusChance: 0.25 },
  smite: { id: 'smite', zh: '聖擊', element: 'holy', baseCost: 14, mod: 4.5, targets: 1, school: 'divine', statusChance: 0 },
  corruption: { id: 'corruption', zh: '腐化', element: 'dark', baseCost: 14, mod: 4.5, targets: 1, school: 'forbidden', statusChance: 0 },
};
const SK = C['F-002-4.2-skills'].value;
export const SKILLS: Record<SkillId, { id: SkillId; zh: string; oc: number; cd: number; desc: string }> = {
  shieldBash: { id: 'shieldBash', zh: '盾擊', oc: SK.shieldBash.ocCost, cd: SK.shieldBash.cooldown, desc: `x${SK.shieldBash.multiplier} 打擊並暈眩 ${SK.shieldBash.stunTicks} 回合` },
  vitalStrike: { id: 'vitalStrike', zh: '要害打擊', oc: SK.vitalStrike.ocCost, cd: SK.vitalStrike.cooldown, desc: `x${SK.vitalStrike.multiplier}（對暈眩 x${SK.vitalStrike.multiplierVsStunned}）並流血` },
  mercifulBlow: { id: 'mercifulBlow', zh: '慈悲一擊', oc: SK.mercifulBlow.ocCost, cd: SK.mercifulBlow.cooldown, desc: `x${SK.mercifulBlow.multiplier}；目標流血且 HP<${SK.mercifulBlow.executeBelowHpFraction * 100}% 時直接擊殺` },
  greatCleave: { id: 'greatCleave', zh: '巨力劈砍', oc: SK.greatCleave.ocCost, cd: SK.greatCleave.cooldown, desc: `x${SK.greatCleave.multiplier} 必定暴擊（可觸發骨牌）` },
  rendingBlow: { id: 'rendingBlow', zh: '撕裂擊', oc: SK.rendingBlow.ocCost, cd: SK.rendingBlow.cooldown, desc: `x${SK.rendingBlow.multiplier} 最多 ${SK.rendingBlow.targets} 目標，無視物理減傷，命中後破甲 ${SK.rendingBlow.paStacks} 層` },
  shatterStrike: { id: 'shatterStrike', zh: '粉碎擊', oc: SK.shatterStrike.ocCost, cd: SK.shatterStrike.cooldown, desc: `x${SK.shatterStrike.multiplier} 最多 ${SK.shatterStrike.targets} 目標，破甲目標暈眩 ${SK.shatterStrike.stunTicks} 回合` },
  concussiveStrike: { id: 'concussiveStrike', zh: '震盪打擊', oc: SK.concussiveStrike.ocCost, cd: SK.concussiveStrike.cooldown, desc: `x${SK.concussiveStrike.multiplier} 魔法傷害並暈眩 ${SK.concussiveStrike.stunTicks} 回合` },
};
/** cp8-rc12 (sourced, Skills.md:55-79): each fighting style has its own skill set. rc11 gave every style the One-Handed set, so a
 *  2H fighter spent 25-100 OC on Shield Bash / Vital Strike (x4, no Domino) instead of Great Cleave (x10, always crits), and a staff
 *  caster traded its fiery quick-cast for a physical x4 staff hit. Unarmed has no style row in the source: keeps the 1H set (暫定).
 *  rc13: 2H T2/T3 Rending Blow / Shatter Strike built (Skills.md:73-75, 109-111); profRequired not enforced yet (CP9). */
export const KITS: Record<Derived['style'], SkillId[]> = {
  oneHand: ['shieldBash', 'vitalStrike', 'mercifulBlow'], unarmed: ['shieldBash', 'vitalStrike', 'mercifulBlow'],
  twoHand: ['greatCleave', 'rendingBlow', 'shatterStrike'], staff: ['concussiveStrike'],
};
export const skillKit = (s: BattleState): SkillId[] => KITS[s.d.style] ?? KITS.oneHand;
const OC = C['F-002-overcharge'].value;
const SS = C['F-002-spirit-stance'].value;
export const DEF = C['002-07'].value;
const FOC = C['F-002-4.2-focus'].value;
const ITEMS = C['F-002-items'].value;
const ITEM_CD = C['F-002-4.1A-item-cooldown'].value.turns;
/** 暫定 (round 6). */
export const HEALTH_POTION_CD = C['P-health-potion-cd'].value.turns;
/** Spirit Stance entry OC: sourced 50 (F-002-spirit-stance, Spirit_Stance.md:25). CP3: back to the original. */
export const SPIRIT_MIN_OC = SS.minOcToEnter;
const MCRIT = C['F-002-5.1B-monster-crit'].value;
const BLEED = C['F-002-5.2-bleed'].value;
const VSB = C['P-vital-strike-bleed'].value;
/** Boss telegraph (暫定): charge every 4th boss turn, release next turn at x2 damage (round 5: was x3). */
export const BOSS_CHARGE_EVERY = 4;
export const BOSS_CHARGE_MULT = 2;
/** CP3-fix 8 (暫定, gameplay layer): a boss with phases left rises at this fraction of max HP, enraged (charges every BOSS_ENRAGED_EVERY turns). */
export const BOSS_PHASE_HP = 0.3;
export const BOSS_ENRAGED_EVERY = 3;
/** rc11: revive clears stun/bleed (CP3-fix 8 code; not in any design doc — wording only, behaviour unchanged pending producer). */
export const BOSS_PHASE_TEXT = '復活！第二階段・狂暴（復活清除異常狀態）';
function phaseShift(s: BattleState, ev: BEvent[]): void {
  s.monsters.forEach((m, i) => {
    if (m.hp > 0 || !m.phases) return;
    m.phases--;
    m.enraged = true;
    m.hp = Math.round(m.maxHp * BOSS_PHASE_HP);
    m.status = { stun: 0, bleed: 0, bleedTurns: 0 };
    for (let k = ev.length - 1; k >= 0; k--) { const e = ev[k]!; if (e.t === 'death' && e.to === i) ev.splice(k, 1); }
    ev.push({ t: 'status', to: i, text: BOSS_PHASE_TEXT, phase: true });
  });
  if (s.cp5) cp5Split(s, ev);
}
type CM = Monster & Cp5Mon;
/** CP5 分裂: a dead split elite becomes 2 normals (monster cap CP5.maxMonsters alive). */
function cp5Split(s: BattleState, ev: BEvent[]): void {
  s.monsters.forEach((m0) => {
    const m = m0 as CM;
    if (m.hp > 0 || !m.splitInto || m.splitDone) return;
    m.splitDone = true;
    for (const c of m.splitInto) if (alive(s).length < CP5.maxMonsters) { s.monsters.push(c); ev.push({ t: 'status', to: s.monsters.length - 1, text: `分裂！${c.name} 出現` }); }
  });
}
/** CP5 鐵壁: damage halved on the elite's first turns. Returns mit unchanged otherwise. */
const PA = C['F-penetrated-armor'].value, PA_TURNS = C['P-penetrated-armor-turns'].value.turns;
/** rc13: Penetrated Armor (Equipment_Procs.md) multiplies the monster's physical mitigation by 1 − 25% × stacks. */
const paMit = (m: Monster, mit: number) => ((m.status.pa ?? 0) > 0 && (m.status.paTurns ?? 0) > 0 ? mit * (1 - PA.perStack * Math.min(PA.maxStacks, m.status.pa!)) : mit);
const ironMit = (m: Monster, mit0: number) => { const mit = paMit(m, mit0); return (m as CM).ironTurns ? 1 - (1 - mit) * CP5.ironMit : mit; };
/** rc13: the up-to-N target order shared by spells and the 2H area skills (target first, then neighbours). */
const areaOrder = (s: BattleState, t0: number, n: number) => [t0, ...[t0 - 1, t0 + 1, t0 - 2, t0 + 2, t0 - 3, t0 + 3, t0 - 4, t0 + 4].filter((i) => s.monsters[i] && s.monsters[i]!.hp > 0)].slice(0, n);
/** CP5 反傷 (守門者 stance / 尖刺 affix): reflect a share of physical damage through player physMit, spec and defend. */
function reflect(s: BattleState, ti: number, dmg: number, ev: BEvent[]): void {
  const m = s.monsters[ti] as CM;
  const frac = (m.thornTurns ? CP5.thornsFrac : 0) + (m.affixes?.includes('spikes') ? CP5.spikesFrac : 0);
  if (!frac || dmg <= 0) return;
  const out = Math.min(Math.round(s.d.hp * CP5.reflectCapHp), Math.round(dmg * frac * (1 - s.d.physMit) * (1 - s.d.specMit[m.attackType]) * (s.defendTurns > 0 ? 1 - DEF.mitigation : 1)));
  if (out <= 0) return;
  s.hp = Math.max(0, s.hp - out); CP5_STAT.reflect += out; CP5_STAT.reflectN++;
  ev.push({ t: 'hit', from: ti, to: 'player', dmg: out, crits: 0, avoided: null, label: `反傷 -${out}` });
}
/** CP5 反魔 (暫定): reflect a share of spell damage (through player defend only). */
function antimagic(s: BattleState, ti: number, dmg: number, ev: BEvent[]): void {
  if (!(s.monsters[ti] as CM).affixes?.includes('antimagic') || dmg <= 0) return;
  const out = Math.round(dmg * CP5.antimagicFrac * (s.defendTurns > 0 ? 1 - DEF.mitigation : 1));
  if (out <= 0) return;
  s.hp = Math.max(0, s.hp - out); CP5_STAT.reflect += out; CP5_STAT.reflectN++;
  ev.push({ t: 'hit', from: ti, to: 'player', dmg: out, crits: 0, avoided: null, label: `反魔 -${out}` });
}
/** Clear player bleed / burn (health potion, defend). */
function cleanse(s: BattleState, ev: BEvent[], by: string): void {
  const p = s.cp5?.pdot;
  if (!p || (!p.burnTurns && !p.bleedTurns)) return;
  s.cp5!.pdot = emptyDot();
  ev.push({ t: 'status', to: 'player', text: `${by}：解除流血／燃燒` });
}

export type Action =
  | { kind: 'attack'; target: number }
  | { kind: 'skill'; id: SkillId; target: number }
  | { kind: 'spell'; id: SpellId; target: number }
  | { kind: 'item'; id: PotionId }
  | { kind: 'defend' }
  | { kind: 'focus' }
  | { kind: 'spirit' };

export type BEvent =
  | { t: 'hit'; from: 'player' | number; to: 'player' | number; dmg: number; crits: number; avoided: Avoid; element?: string; label?: string; weak?: boolean; resisted?: number; spirit?: boolean }
  | { t: 'heal'; res: 'hp' | 'mp' | 'sp'; amount: number; label: string }
  | { t: 'status'; to: 'player' | number; text: string; phase?: boolean }
  | { t: 'death'; to: number }
  | { t: 'charge'; from: number; drain?: boolean }
  | { t: 'sig'; from: number; sig: BossSig; text: string }
  | { t: 'pdot'; kind: 'burn' | 'bleed'; dmg: number }
  | { t: 'spirit'; on: boolean }
  | { t: 'msg'; text: string };

/** CP4 run-buff battle mods (docs/cp4-run-buffs.md). Undefined = CP3 behavior, byte for byte. Values 暫定. */
export interface BattleMods extends BMods {
  combo: Combos;
  /** CP5 rc2: bulwark (磐石) buffs held this run. */
  bulwarkN?: number;
  /** combo state */
  freeSkill?: boolean; lastElem?: string; counterReady?: boolean;
  /** stats for the sim */
  comboFires?: number;
}
export interface BattleState {
  mods?: BattleMods;
  d: Derived;
  hp: number; mp: number; sp: number; oc: number;
  monsters: Monster[];
  turn: number;
  spirit: boolean;
  /** CP3-fix 10: set once Spirit Stance was entered in this battle (sim usage rate). */
  spiritUsed?: boolean;
  /** CP3: systems not yet unlocked (early-unlock layer). */
  locked?: { skill: boolean; spell: boolean; spirit: boolean };
  defendTurns: number;
  focusTurn: boolean;
  cooldowns: Record<SkillId, number>;
  itemCd: Record<PotionId, number>;
  potions: Record<PotionId, number>;
  /** Natural regen applied at the end of the last player turn (HP has no battle regen source, so it is always 0). */
  regen: { hp: number; mp: number; sp: number };
  over: 'win' | 'lose' | null;
  /** Usage counters for proficiency gain. */
  used: Partial<Record<Prof, number>>;
  bossTurns: number;
  /** CP5 (flag only): player bleed / burn. Undefined = CP4 behavior. */
  cp5?: { pdot: PDot };
  /** CP5 rc2: consecutive defend count (heal decay). */
  defStreak?: number;
  /** rc7 (c): 1H Overwhelming Strikes — turns left and Counter-Parry stacks. */
  ow?: { turns: number; stacks: number };
}

export function startBattle(d: Derived, vitals: { hp: number; mp: number; sp: number }, monsters: Monster[], potions: Record<PotionId, number>): BattleState {
  return {
    d, hp: vitals.hp, mp: vitals.mp, sp: vitals.sp, oc: C['P-oc-start'].value.initial,
    monsters, turn: 0, spirit: false, defendTurns: 0, focusTurn: false,
    cooldowns: { shieldBash: 0, vitalStrike: 0, mercifulBlow: 0, greatCleave: 0, concussiveStrike: 0, rendingBlow: 0, shatterStrike: 0 },
    itemCd: { health: 0, mana: 0, spirit: 0 }, potions: { ...potions }, over: null, used: {}, bossTurns: 0, regen: { hp: 0, mp: 0, sp: 0 },
  };
}

export const alive = (s: BattleState) => s.monsters.filter((m) => m.hp > 0);
const ocCap = (s: BattleState) => (s.mods ? OC.cap + (s.mods.ocCap ?? 0) : OC.cap);
/** OC cost of a skill after CP4 mods (O8, oc combo). */
export function skillOc(s: BattleState, id: SkillId): number {
  const M = s.mods;
  if (!M) return SKILLS[id].oc;
  if (M.freeSkill) return 0;
  return Math.round(SKILLS[id].oc * (1 + (M.skillOcPct ?? 0)));
}
const skillCd = (s: BattleState, id: SkillId) => (s.mods ? Math.max(0, SKILLS[id].cd + (s.mods.skillCd?.[id] ?? 0)) : SKILLS[id].cd);
const spPerTurn = (s: BattleState) => (s.mods?.ssSpPct ? Math.max(1, Math.round(SS.spPerTurn * (1 + s.mods.ssSpPct))) : SS.spPerTurn);
const fire = (s: BattleState) => { if (s.mods) s.mods.comboFires = (s.mods.comboFires ?? 0) + 1; };
export function spellCost(s: BattleState, id: SpellId): number {
  const sp = SPELLS[id];
  const x = s.mods?.combo.arcaneOc && s.spirit ? 0.9 : 1;
  return Math.max(1, Math.ceil(((s.d.level * sp.baseCost) / 100) * (1 + 0.005 * s.d.interference) * (1 - s.d.manaCons) * (s.spirit ? 0.75 : 1) * x));
}

/** CP8 rc3 (暫定): what 「A·攻擊」 does — the staff quick spell (CP8.staffQuickSpell) when usable, else a normal attack. */
// cp8-rc5 (playtest bug: bulwark in 靈動架勢 cast 烈焰爆破 on A): the UI also passes the live main-hand group; both must be a staff.
export function quickAttack(s: BattleState, target: number, main?: string): Action {
  const id = CP8.staffQuickSpell as SpellId;
  if (RULES.cp8 && id && s.d.style === 'staff' && (main === undefined || main === 'staff') && SPELLS[id]) { const a: Action = { kind: 'spell', id, target }; if (canUse(s, a)) return a; }
  return { kind: 'attack', target };
}
/** cp8-rc4 (decision 2026-10-26, 暫定 thresholds): the health-potion hint — HP < 50%, or < 75% while a foe is charging, and a potion is usable. The UI highlights it and the naive sim AI drinks on it. */
/** rc13 item 2: pothint / danger read the crit-case estimate (SIM_EST_CRIT=0 → rc12 normal estimate, for comparison only). */
const ENV_EST_CRIT = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.SIM_EST_CRIT !== '0';
export const POT_HINT = { hp: 0.5, charging: 0.75, /** rc14 item 4（暫定）: share of the heal that must land */ minUseful: 0.5 };
/** cp8-rc6 item 6: estimate of a charging monster's next heavy hit (mult as enemyTurn: drain → CP5.drainMult else BOSS_CHARGE_MULT,
 *  frost ×CP5.frostMult, magMit for elemental attacks; defending applies DEF.mitigation). Excludes avoidance and the per-turn cap.
 *  rc13 item 2: crit = true → the same hit as a monster crit (× 1 + F-002-5.1B critDamageBonus 0.2, Battles.md:45). */
export function chargeEstimate(s: BattleState, m0: Monster, defending = false, crit = false): number {
  const m = m0 as CM;
  const pulse = m.rank === 'boss' && !!m.pulseNext && m.charge === 0; // cp8-rc7 P1 item 3: 元素脈衝 is a telegraphed big move too
  const mult = pulse ? CP5.pulseMult : m.drainNext ? CP5.drainMult : m.charge > 0 ? BOSS_CHARGE_MULT : 1; // rc9 P0-1: heavyNext / plain hit = ×1
  const el = pulse ? m.shieldEl : m.elemAttack;
  const mit = 1 - (1 - (el ? s.d.magMit : s.d.physMit)) * (defending ? 1 - DEF.mitigation : 1);
  return meanHit(m.adb * mult * (m.elemAttack ? CP5.frostMult : 1) * (crit ? 1 + MCRIT.critDamageBonus : 1), mit, s.d.specMit[(el ?? m.attackType) as keyof typeof s.d.specMit] ?? 0);
}
/** cp8-rc10 P0-3: the biggest plain (×1) hit this monster can land now: top roll, monster crit (+ its crit bonus damage), current mitigation. */
export function worstHit(s: BattleState, m0: Monster, defending = false): number {
  const m = m0 as CM; const el = m.elemAttack;
  const mit = 1 - (1 - (el ? s.d.magMit : s.d.physMit)) * (defending ? 1 - DEF.mitigation : 1);
  return maxHit(m.adb * (el ? CP5.frostMult : 1), mit, s.d.specMit[(el ?? m.attackType) as keyof typeof s.d.specMit] ?? 0, 1 + MCRIT.critDamageBonus);
}
/** cp8-rc7 P1 item 3: a monster whose next attack is a telegraphed big move (charge / drain / 元素脈衝). */
export const windingUp = (m: Monster): boolean => m.hp > 0 && (m.charge > 0 || !!(m as CM).heavyNext || (m.rank === 'boss' && !!(m as CM).pulseNext));
/** rc9 P0-2: summed estimate of every live monster's next hit (wind-ups at their release multiplier; stunned monsters skip). */
export function nextRoundEstimate(s: BattleState, crit = false): number {
  return s.monsters.reduce((t, m) => t + (m.hp > 0 && !(m.status.stun > 0) ? chargeEstimate(s, m, s.defendTurns > 1, crit) : 0), 0);
}
/** cp8-rc12 item 5（自訂，非原版）: the HP-danger test behind potHint, without the 「can drink now」 gate. */
export function hpDanger(s: BattleState): boolean {
  if (RULES.cp8 && CP8.potAfter > 0) return s.hp < s.d.hp * POT_HINT.hp || s.hp - nextRoundEstimate(s, ENV_EST_CRIT) < s.d.hp * CP8.potAfter;
  const th = s.monsters.some((m) => m.hp > 0 && m.charge > 0) ? POT_HINT.charging : POT_HINT.hp;
  return s.hp < s.d.hp * th;
}
/** cp8-rc12 item 5（自訂，非原版）: HP in danger but the health potion cannot be drunk (cooldown / empty) → hint S (Spirit Stance) when usable.
 *  D is NOT hinted here: rc12 sim (preset arcane, 64 paired seeds, naive hinted) — pressing D on every such turn cut the trip median
 *  24 → 12, and D only on a wind-up still 24 → 19 (D skips the attack and takes only 25% off). */
export function guardHint(s: BattleState): 'spirit' | null {
  if (s.over || canUse(s, { kind: 'item', id: 'health' }) || !hpDanger(s)) return null;
  return !s.spirit && canUse(s, { kind: 'spirit' }) ? 'spirit' : null;
}
export function potHint(s: BattleState): boolean {
  if (!canUse(s, { kind: 'item', id: 'health' })) return false;
  if (s.hp >= s.d.hp) return false; // rc13 item 4: never at full HP (Z would heal +0)
  // rc14 item 4（暫定、自訂，非原版）: above 50% HP, no hint while less than half of the potion's heal would land (the rest is wasted).
  if (RULES.cp8 && s.hp >= s.d.hp * POT_HINT.hp && s.d.hp - s.hp < Math.round(s.d.hp * ITEMS.healthPotion.fraction) * POT_HINT.minUseful) return false;
  if (RULES.cp8 && CP8.potAfter > 0) return s.hp < s.d.hp * POT_HINT.hp || s.hp - nextRoundEstimate(s, ENV_EST_CRIT) < s.d.hp * CP8.potAfter; // rc9 P0-2（自訂，非原版）
  const th = s.monsters.some((m) => m.hp > 0 && m.charge > 0) ? POT_HINT.charging : POT_HINT.hp;
  return s.hp < s.d.hp * th;
}
/** cp8-rc12 item 2: the arcane element suggestion (UI 💡 + highlighted spell button; the hinted sim follows it).
 *  rc8–rc11 ('old'): the castable spell matching the target's biggest weakness — ignores MP cost (聖擊／腐化 cost 14 vs 6, hit
 *  1 target vs 3), the other targets the spell splashes, and the spell's EDB. 'new'（自訂，非原版）: expected damage of every
 *  castable spell over the targets it would hit (EDB × mod × weakness/resist, the same terms spellHit uses), per MP when MP is
 *  short (< `SPELL_HINT_MP_CASTS` casts of the cheapest spell left after it); a spell is only suggested when it beats the A·攻擊
 *  quick spell by > `SPELL_HINT_EDGE`. */
export const SPELL_HINT_MP_CASTS = 3; // 暫定（自訂，非原版）
export const SPELL_HINT_EDGE = 0.1; // 暫定（自訂，非原版）
export function spellValue(s: BattleState, id: SpellId, target: number): number {
  const def = SPELLS[id], t0 = s.monsters[target]?.hp ? target : s.monsters.findIndex((m) => m.hp > 0);
  if (t0 < 0) return 0;
  const order = [t0, ...[t0 - 1, t0 + 1, t0 - 2, t0 + 2].filter((i) => s.monsters[i] && s.monsters[i]!.hp > 0)].slice(0, def.targets);
  const base = (1 + s.d.edb[def.element] / 100) * def.mod;
  return order.reduce((a, i) => { const m = s.monsters[i]!; const sp = m.spec[def.element] / 100;
    return a + Math.min(m.hp, s.d.mdb * base * (s.mods?.weakMult && sp < 0 ? 1 + s.mods.weakMult : 1) * (1 - m.magMit) * (1 - sp)); }, 0);
}
export function suggestSpell(s: BattleState, target: number, mode: 'old' | 'new' = 'new'): { id: SpellId; type: string; pct: number } | null {
  const m = s.monsters[target]; if (!m || m.hp <= 0) return null;
  const ids = (Object.keys(SPELLS) as SpellId[]).filter((id) => canUse(s, { kind: 'spell', id, target }));
  if (mode === 'old') {
    for (const w of weaknesses(m).filter((x) => x.type in ELEM_OF).sort((x, y) => y.pct - x.pct)) {
      const id = ids.find((sp) => SPELLS[sp].element === w.type); if (id) return { id, type: w.type, pct: w.pct };
    }
    return null;
  }
  if (!ids.length) return null;
  const cheap = Math.min(...ids.map((id) => spellCost(s, id)));
  const score = (id: SpellId) => { const c = spellCost(s, id), v = spellValue(s, id, target); return s.mp - c < cheap * SPELL_HINT_MP_CASTS ? v / c : v; };
  const best = ids.reduce((a, id) => (score(id) > score(a) ? id : a));
  const q = quickAttack(s, target); const qid = q.kind === 'spell' ? q.id : null;
  if (qid && (best === qid || score(best) <= score(qid) * (1 + SPELL_HINT_EDGE))) return null;
  const el = SPELLS[best].element; return { id: best, type: el, pct: Math.max(0, -m.spec[el]) };
}
/** rc13 item 3(b)（自訂，非原版）: a skill is hinted only when its expected damage beats the quick attack by > SKILL_HINT_EDGE (same edge as the spell hint). */
export const SKILL_HINT_EDGE = SPELL_HINT_EDGE;
const physExp = (s: BattleState, m: Monster, mult: number, opts: { noMit?: boolean; crit?: boolean } = {}) => {
  const ce = opts.crit ? 1 + s.d.critMod : 1 + Math.min(1, s.d.physCrit) * s.d.critMod;
  const mit = opts.noMit ? 0 : ironMit(m, m.physMit);
  return Math.min(m.hp, s.d.adb * mult * (s.spirit ? 1 + SS.damageBonus + (s.mods?.ssDamage ?? 0) : 1) * ce * (1 - mit) * (1 - m.spec[s.d.damageType] / 100));
};
/** rc13 item 3(b): expected damage of one skill this turn (overkill capped at each target's HP; area skills sum their targets). */
export function skillValue(s: BattleState, id: SkillId, target: number): number {
  const t0 = s.monsters[target]?.hp ? target : s.monsters.findIndex((m) => m.hp > 0); if (t0 < 0) return 0;
  const m = s.monsters[t0]!;
  switch (id) {
    case 'shieldBash': return physExp(s, m, SK.shieldBash.multiplier);
    case 'vitalStrike': return physExp(s, m, m.status.stun > 0 ? SK.vitalStrike.multiplierVsStunned : SK.vitalStrike.multiplier);
    case 'mercifulBlow': return m.status.bleedTurns > 0 && m.status.bleed > 0 && m.hp < m.maxHp * SK.mercifulBlow.executeBelowHpFraction ? m.hp : physExp(s, m, SK.mercifulBlow.multiplier);
    case 'greatCleave': return physExp(s, m, SK.greatCleave.multiplier, { crit: true });
    case 'rendingBlow': return areaOrder(s, t0, SK.rendingBlow.targets).reduce((a, i) => a + physExp(s, s.monsters[i]!, SK.rendingBlow.multiplier, { noMit: true }), 0);
    case 'shatterStrike': return areaOrder(s, t0, SK.shatterStrike.targets).reduce((a, i) => a + physExp(s, s.monsters[i]!, SK.shatterStrike.multiplier), 0);
    case 'concussiveStrike': return Math.min(m.hp, s.d.mdb * SK.concussiveStrike.multiplier * (1 - m.magMit));
  }
}
/** Expected damage of the quick attack (A) on this target. */
export function attackValue(s: BattleState, target: number): number {
  const q = quickAttack(s, target);
  if (q.kind === 'spell') return spellValue(s, q.id, target);
  const m = s.monsters[target] ?? s.monsters.find((x) => x.hp > 0); return m ? physExp(s, m, 1) : 0;
}
/** rc13 item 3(b): the skill worth pressing now, or null when none beats A by more than the edge (e.g. A already kills the target). */
export function suggestSkill(s: BattleState, target: number): SkillId | null {
  const ids = skillKit(s).filter((id) => canUse(s, { kind: 'skill', id, target })); if (!ids.length) return null;
  const best = ids.reduce((a, id) => (skillValue(s, id, target) > skillValue(s, a, target) ? id : a));
  return skillValue(s, best, target) > attackValue(s, target) * (1 + SKILL_HINT_EDGE) ? best : null;
}
const ELEM_OF: Record<string, true> = { fire: true, cold: true, elec: true, wind: true, holy: true, dark: true };
export function canUse(s: BattleState, a: Action): boolean {
  if (s.over) return false;
  switch (a.kind) {
    case 'attack': return true;
    case 'skill': {
      if (s.locked?.skill || !skillKit(s).includes(a.id)) return false;
      if (s.cooldowns[a.id] > 0 || s.oc < skillOc(s, a.id)) return false;
      return true;
    }
    case 'spell': return !s.locked?.spell && s.mp >= spellCost(s, a.id);
    case 'item': return s.potions[a.id] > 0 && s.itemCd[a.id] <= 0;
    case 'defend': case 'focus': return true;
    case 'spirit': return s.spirit || (!s.locked?.spirit && s.oc >= SPIRIT_MIN_OC && s.sp >= spPerTurn(s));
  }
}

/** Player-facing reason an action is unavailable (shown in the battle log). */
export function whyNot(s: BattleState, a: Action): string {
  if ((a.kind === 'skill' && s.locked?.skill) || (a.kind === 'spell' && s.locked?.spell) || (a.kind === 'spirit' && s.locked?.spirit && !s.spirit)) return '尚未解鎖';
  switch (a.kind) {
    case 'skill': return s.cooldowns[a.id] > 0 ? `冷卻中（${s.cooldowns[a.id]} 回合）` : s.oc < skillOc(s, a.id) ? `OC 不足（需 ${skillOc(s, a.id)}，現有 ${Math.floor(s.oc)}）` : '目標血量未低於門檻';
    case 'spell': return `MP 不足（需 ${spellCost(s, a.id)}）`;
    case 'item': return s.potions[a.id] <= 0 ? '藥水用完了' : `藥水冷卻中（${s.itemCd[a.id]} 回合）`;
    case 'spirit': return s.oc < SPIRIT_MIN_OC ? `OC 不足（需 ${SPIRIT_MIN_OC}，現有 ${Math.floor(s.oc)}）` : `SP 不足（需 ${SS.spPerTurn}）`;
    default: return '無法行動';
  }
}

/** A weakness is a negative specific resistance in the monster's monsters.json row (no extra bonus is invented: the
 * negative value already raises damage through (1 - spec) in damage.ts). */
export function isWeak(m: Monster, type: keyof Monster['spec']): boolean { return m.spec[type] < 0; }
/** rc6 item 2: resistances (spec > 0) shown on the battle panel, highest first. */
export function resistances(m: Monster): { type: keyof Monster['spec']; pct: number }[] {
  return (Object.keys(m.spec) as (keyof Monster['spec'])[]).filter((k) => m.spec[k] > 0).map((k) => ({ type: k, pct: m.spec[k] })).sort((a, b) => b.pct - a.pct);
}
/** rc6 item 2: what the battle panel shows for one monster (weaknesses as negative, resistances as positive; unshown = 0).
 * The UI renders exactly this, and the UI-only sim AI reads only this. */
export function panelSpec(m: Monster): Monster['spec'] {
  const out = Object.fromEntries(Object.keys(m.spec).map((k) => [k, 0])) as Monster['spec'];
  for (const w of weaknesses(m)) out[w.type] = -w.pct;
  for (const r of resistances(m)) out[r.type] = r.pct;
  return out;
}
export function weaknesses(m: Monster): { type: keyof Monster['spec']; pct: number }[] {
  return (Object.keys(m.spec) as (keyof Monster['spec'])[]).filter((k) => m.spec[k] < 0).map((k) => ({ type: k, pct: -m.spec[k] })).sort((a, b) => b.pct - a.pct);
}

function retarget(s: BattleState, t: number): number {
  if (s.monsters[t] && s.monsters[t]!.hp > 0) return t;
  return s.monsters.findIndex((m) => m.hp > 0);
}

/** 暫定 (decision 2026-10-25 #1): bulwark combo 'next hit after defend' multiplier, was 1.3. */
export const BULWARK_COUNTER_MULT = 1.5;
/** 暫定 (decision 2026-10-25 #1): bulwark combo riposte after block/evade/parry, × normal attack (physHit, ADB). */
export const BULWARK_RIPOSTE_MULT = 0.5; // CP4 rc: was 0.8
/** 暫定 (CP4 rc balance): riposte limit per enemy phase, and which avoids trigger it. Mutated only by sim scripts. */
/** 暫定 (CP4 rc balance): blade combo 連斬 also deals × (1 + this) physical damage to elites and bosses. Mutated only by sim scripts. */
export const BLADE_BIG_GAME = { pct: 0.5 }; // CP4 rc: new
export const BULWARK_RIPOSTE = { mult: BULWARK_RIPOSTE_MULT, perTurn: 1 /* CP4 rc: was unlimited */ }; // mutable for sim overrides only (scripts/cp4-balance.ts)

/** rc7 (c): Fighting Styles passives (findings 002 §4 style table; parsed_wiki/Fighting_Styles.md). Sim A/B switch only. */
export const STYLE_PASSIVES = { on: true };
const DOMINO = { base: 40, attrK: 0.02, profDiv: 10, cap: 0.9, reach: 2, reachAt100: 3, mult: [0.75, 0.6, 0.4], multCap: [1, 0.85, 0.65], perTenProf: 0.01, ocGain: 1 };
const OVERWHELM = { base: 5, attrK: 0.01, profDiv: 20, cap: 0.3, ticks: 4 /* 暫定: 4 ticks mapped to 4 player turns */, dmg: 0.15, acc: 0.5, counterParry: 0.2, maxStacks: 5 };
/** After a normal attack that connected: 2H Domino Strike (chain to neighbours) or 1H Overwhelming Strikes (buff). */
function stylePassive(s: BattleState, rng: Rng, t: number, dealt: number, ev: BEvent[]): void {
  if (!STYLE_PASSIVES.on || dealt <= 0) return;
  const a = s.d.attrs, p = s.d.wprof;
  if (s.d.style === 'twoHand') {
    // Fighting_Styles.md:88-98: proc on the primary hit, then may proc again for each next enemy in line (dead ones are passed over).
    const chance = Math.min(DOMINO.cap, (DOMINO.base + DOMINO.attrK * (a.str + a.dex) + p / DOMINO.profDiv) / 100);
    const reach = p >= 100 ? DOMINO.reachAt100 : DOMINO.reach;
    for (const side of [-1, 1]) for (let k = 1; k <= reach; k++) {
      const m = s.monsters[t + side * k];
      if (!m || !rng.chance(chance)) break;
      if (m.hp <= 0) continue;
      const mult = Math.min(DOMINO.multCap[k - 1]!, DOMINO.mult[k - 1]! + DOMINO.perTenProf * Math.floor(p / 10));
      const oc = s.oc; physHit(s, rng, t + side * k, mult, ev, '連擊');
      s.oc = Math.min(ocCap(s), oc + DOMINO.ocGain); // findings 002 style table: +1% OC per Domino hit, not the normal-hit gain
    }
  } else if (s.d.style === 'oneHand') {
    if (!rng.chance(Math.min(OVERWHELM.cap, (OVERWHELM.base + OVERWHELM.attrK * (a.str + a.end) + p / OVERWHELM.profDiv) / 100))) return;
    s.ow = { turns: OVERWHELM.ticks, stacks: Math.min(OVERWHELM.maxStacks, (s.ow?.turns ? s.ow.stacks : 0) + 1) };
  }
}

const COUNTER = { base: 25, attrK: 0.02, profDiv: 10, cap: 0.75 };
/** rc7 (c): 1H Counter-Attack after a block or parry (Fighting_Styles.md:71-84): main-hand damage, no crit, cannot be evaded or parried; OC once per turn. */
function counterAttack(s: BattleState, rng: Rng, ti: number, done: number, ev: BEvent[], extra = 0): boolean {
  const a = s.d.attrs, p = s.d.wprof, m = s.monsters[ti]!;
  if (done >= (p >= 200 ? 3 : p >= 100 ? 2 : 1) + extra) return false;
  if (!rng.chance(Math.min(COUNTER.cap, (COUNTER.base + COUNTER.attrK * (a.str + a.dex) + p / COUNTER.profDiv) / 100))) return false;
  const raw = s.d.adb * (s.spirit ? 1 + SS.damageBonus + (s.mods?.ssDamage ?? 0) : 1) * (s.ow && s.ow.turns > 0 ? 1 + OVERWHELM.dmg : 1);
  const r = resolveHit(rng, { raw, magic: false, acc: s.d.physAcc, evade: 0, parry: 0, block: 0, resist: 0, critChance: 0, critMod: 0, mit: ironMit(m, m.physMit), spec: m.spec[s.d.damageType] / 100 });
  m.hp = Math.max(0, m.hp - r.damage);
  if (done === 0) s.oc = Math.min(ocCap(s), s.oc + rng.int(OC.hitGainMin, OC.hitGainMax));
  ev.push({ t: 'hit', from: 'player', to: ti, dmg: r.damage, crits: 0, avoided: null, label: '反擊（單手）', weak: false, spirit: s.spirit });
  if (m.hp <= 0) ev.push({ t: 'death', to: ti });
  return true;
}

function physHit(s: BattleState, rng: Rng, ti: number, mult: number, ev: BEvent[], label?: string, dtype = s.d.damageType, critOverride?: number, noMit = false): number {
  const m = s.monsters[ti]!;
  const M = s.mods;
  let raw = s.d.adb * mult * (s.spirit ? 1 + SS.damageBonus + (M?.ssDamage ?? 0) : 1);
  let critChance = critOverride ?? s.d.physCrit;
  if (M) {
    if (M.weakMult && isWeak(m, dtype)) raw *= 1 + M.weakMult;
    if (M.counterReady) { M.counterReady = false; raw *= BULWARK_COUNTER_MULT; fire(s); }
    if (M.combo.bladeOc && s.spirit) critChance += 0.05;
    if (M.combo.blade && (m.rank === 'elite' || m.rank === 'boss')) raw *= 1 + BLADE_BIG_GAME.pct;
  }
  const ow = STYLE_PASSIVES.on && s.ow && s.ow.turns > 0 ? s.ow : null;
  if (ow) raw *= 1 + OVERWHELM.dmg;
  const r = resolveHit(rng, {
    raw, magic: false, acc: s.d.physAcc * (ow ? 1 + OVERWHELM.acc : 1),
    evade: m.status.stun > 0 ? 0 : m.evade, parry: m.status.stun > 0 ? 0 : m.parry * (ow ? Math.max(0, 1 - OVERWHELM.counterParry * ow.stacks) : 1), block: 0, resist: 0,
    critChance, critMod: s.d.critMod, mit: noMit ? 0 : ironMit(m, m.physMit), spec: m.spec[dtype] / 100,
  });
  if (r.avoidMult > 0) {
    m.hp = Math.max(0, m.hp - r.damage);
    const cap = ocCap(s);
    s.oc = Math.min(cap, s.oc + rng.int(OC.hitGainMin, OC.hitGainMax) + (M?.ocGain ?? 0) + (M?.combo.blade && r.crits > 0 ? 5 : 0));
    if (M?.combo.blade && r.crits > 0) fire(s);
    if (M?.combo.oc && s.oc >= cap && !M.freeSkill) { M.freeSkill = true; fire(s); }
  }
  ev.push({ t: 'hit', from: 'player', to: ti, dmg: r.avoidMult > 0 ? r.damage : 0, crits: r.crits, avoided: r.avoided, label, weak: r.avoidMult > 0 && isWeak(m, dtype), spirit: s.spirit });
  if (s.d.weaponProf) s.used[s.d.weaponProf] = (s.used[s.d.weaponProf] ?? 0) + 1;
  if (m.hp <= 0) ev.push({ t: 'death', to: ti });
  if (s.cp5 && r.avoidMult > 0) reflect(s, ti, r.damage, ev);
  return r.avoidMult > 0 ? r.damage : 0;
}

/** cp8-rc12: Concussive Strike — MDB x6 magic damage (findings/002 4.2 "MDB x 6"). The source names no element: untyped here
 *  (no element bonus / specific mitigation; 暫定). Magic mitigation and resist apply like a spell. Coalesced Mana proc not built. */
function magicStrike(s: BattleState, rng: Rng, ti: number, mult: number, ev: BEvent[]): void {
  const m = s.monsters[ti]!;
  const r = resolveHit(rng, {
    raw: s.d.mdb * mult, magic: true, acc: s.d.magAcc,
    evade: m.status.stun > 0 ? 0 : m.evade, parry: 0, block: 0, resist: m.resist, counterResist: s.d.counterResist,
    critChance: s.d.magCrit, critMod: s.d.spellCritMod, mit: ironMit(m, m.magMit), spec: 0,
  });
  if (r.avoidMult > 0) m.hp = Math.max(0, m.hp - r.damage);
  ev.push({ t: 'hit', from: 'player', to: ti, dmg: r.avoidMult > 0 ? r.damage : 0, crits: r.crits, avoided: r.avoided, label: '震盪打擊' });
  if (m.hp <= 0) ev.push({ t: 'death', to: ti });
  if (s.cp5 && r.avoidMult > 0) antimagic(s, ti, r.damage, ev);
}
/** CP7 P2 (sourced): Damage.md:63 — specific mitigation is reduced additively but "cannot be reduced below 0, or reduced further
 * if the mitigation is already negative". cp6 subtracted the proficiency reduction from a weakness too (amplifying it). */
function cp7SpellSpec(spec: number, reduce: number): number {
  if (!RULES.cp7) return spec - reduce;
  return spec < 0 ? spec : Math.max(0, spec - reduce);
}
function spellHit(s: BattleState, rng: Rng, ti: number, def: SpellDef, profVal: number, ev: BEvent[]): void {
  const m = s.monsters[ti]!;
  const pf = Math.max(0, Math.min(1, (profVal - m.level) / Math.max(1, m.level)));
  const specReduce = Math.pow(pf, 1.5) * 0.5;
  const M = s.mods;
  let raw = s.d.mdb * (1 + s.d.edb[def.element] / 100) * def.mod;
  if (M) {
    if (M.combo.arcane && M.lastElem === def.element) { raw = s.d.mdb * (1 + (s.d.edb[def.element] + 20) / 100) * def.mod; fire(s); }
    if (M.weakMult && isWeak(m, def.element)) raw *= 1 + M.weakMult;
  }
  const r = resolveHit(rng, {
    raw, magic: true, acc: s.d.magAcc,
    evade: m.status.stun > 0 ? 0 : m.evade, parry: 0, block: 0, resist: m.resist, counterResist: 0.5 * pf + s.d.counterResist,
    critChance: s.d.magCrit, critMod: s.d.spellCritMod, mit: ironMit(m, m.magMit), spec: cp7SpellSpec(m.spec[def.element] / 100, specReduce),
  });
  if (r.avoidMult > 0) m.hp = Math.max(0, m.hp - r.damage);
  ev.push({ t: 'hit', from: 'player', to: ti, dmg: r.avoidMult > 0 ? r.damage : 0, crits: r.crits, avoided: r.avoided, element: def.element, weak: r.avoidMult > 0 && isWeak(m, def.element), resisted: r.avoidMult > 0 && m.spec[def.element] > 0 ? m.spec[def.element] : undefined });
  if (m.hp > 0 && r.full && def.statusChance && rng.chance(def.statusChance)) {
    if (def.element === 'cold' || def.element === 'elec') { m.status.stun = Math.max(m.status.stun, M?.combo.bulwarkArcane ? 2 : 1); ev.push({ t: 'status', to: ti, text: def.element === 'cold' ? '凍結' : '麻痺' }); }
    else { m.status.bleed = Math.max(m.status.bleed, Math.ceil(r.damage * 0.15 * (1 + (M?.bleedMult ?? 0)))); m.status.bleedTurns = 3; ev.push({ t: 'status', to: ti, text: def.element === 'fire' ? '燃燒' : '撕裂' }); }
  }
  if (m.hp <= 0) ev.push({ t: 'death', to: ti });
  if (s.cp5 && r.avoidMult > 0) antimagic(s, ti, r.damage, ev);
}

/** Apply one player action, then let every live monster act. Returns the events for the renderer. */
export function act(s: BattleState, a: Action, rng: Rng, profs: Partial<Record<Prof, number>> = {}): BEvent[] {
  const ev: BEvent[] = [];
  if (!canUse(s, a)) return [{ t: 'msg', text: '無法使用' }];
  let free = false;
  let noRegen = false;
  s.focusTurn = false;
  // CP5 r4 (暫定): bulwark 3-set rule (no riposte while defending) keys on the formed combo.
  const bulCp5 = !!(s.cp5 && s.mods?.combo.bulwark);
  // CP5 rc2 fix 1: consecutive-defend heal decay (×CP5.bulwarkDefDecay^n) applies as soon as any 磐石 buff is held — the r4
  // code gated it on the formed 3-set (combo.bulwark), so 1–2 piece bulwark builds (不動之盾+撕裂) healed in full every press.
  const bulDecay = !!(s.cp5 && (s.mods?.bulwarkN ?? 0) > 0);
  if (bulDecay && a.kind !== 'defend') s.defStreak = 0;
  switch (a.kind) {
    case 'attack': {
      const t = retarget(s, a.target);
      stylePassive(s, rng, t, physHit(s, rng, t, 1, ev), ev);
      break;
    }
    case 'skill': {
      const t = retarget(s, a.target);
      const m = s.monsters[t]!;
      s.oc -= skillOc(s, a.id);
      if (s.mods?.freeSkill) s.mods.freeSkill = false;
      s.cooldowns[a.id] = skillCd(s, a.id) + 1;
      if (a.id === 'shieldBash') {
        physHit(s, rng, t, SK.shieldBash.multiplier, ev, '盾擊', 'crushing');
        if (m.hp > 0) { m.status.stun = SK.shieldBash.stunTicks + (s.mods?.bashStun ?? 0); ev.push({ t: 'status', to: t, text: `暈眩 ${m.status.stun} 回合（無法行動、無法迴避）` }); }
      } else if (a.id === 'vitalStrike') {
        const stunned = m.status.stun > 0;
        const dmg = physHit(s, rng, t, stunned ? SK.vitalStrike.multiplierVsStunned + (s.mods?.combo.bulwarkBlade ? 0.5 : 0) : SK.vitalStrike.multiplier, ev, stunned ? '要害！' : '要害打擊');
        if (m.hp > 0 && dmg > 0) {
          m.status.bleed = Math.max(m.status.bleed, Math.ceil((dmg * BLEED.damageFactor * (1 + (s.mods?.bleedMult ?? 0))) / VSB.ticks));
          m.status.bleedTurns = VSB.ticks;
          ev.push({ t: 'status', to: t, text: `流血：每回合 ${m.status.bleed}，持續 ${VSB.ticks} 回合` });
        }
      } else if (a.id === 'greatCleave') {
        // Skills.md:73 / findings/002 4.2: x10, always crits, can trigger Domino (the 2H style passive).
        stylePassive(s, rng, t, physHit(s, rng, t, SK.greatCleave.multiplier, ev, '巨力劈砍', s.d.damageType, 1), ev);
      } else if (a.id === 'concussiveStrike') {
        magicStrike(s, rng, t, SK.concussiveStrike.multiplier, ev);
        if (m.hp > 0 && m.status.stun <= 0) { m.status.stun = SK.concussiveStrike.stunTicks; ev.push({ t: 'status', to: t, text: `暈眩 ${m.status.stun} 回合（無法行動、無法迴避）` }); }
      } else if (a.id === 'rendingBlow') {
        // Skills.md:73: up to 5 targets, damage bypasses monster physical mitigation, then 3 stacks of Penetrated Armor (applied after the damage).
        for (const ti of areaOrder(s, t, SK.rendingBlow.targets)) {
          const mm = s.monsters[ti]!;
          physHit(s, rng, ti, SK.rendingBlow.multiplier, ev, '撕裂擊', s.d.damageType, undefined, true);
          if (mm.hp > 0) { mm.status.pa = Math.min(PA.maxStacks, (mm.status.pa ?? 0) + SK.rendingBlow.paStacks); mm.status.paTurns = PA_TURNS; ev.push({ t: 'status', to: ti, text: `破甲 ${mm.status.pa} 層（物理減傷 ×${1 - PA.perStack * mm.status.pa}，${PA_TURNS} 回合）` }); }
        }
      } else if (a.id === 'shatterStrike') {
        // Skills.md:75: up to 5 targets; a target with Penetrated Armor is stunned 5 ticks (an existing stun is not refreshed).
        for (const ti of areaOrder(s, t, SK.shatterStrike.targets)) {
          const mm = s.monsters[ti]!;
          const had = (mm.status.pa ?? 0) > 0 && (mm.status.paTurns ?? 0) > 0;
          physHit(s, rng, ti, SK.shatterStrike.multiplier, ev, '粉碎擊');
          if (mm.hp > 0 && had && mm.status.stun <= 0) { mm.status.stun = SK.shatterStrike.stunTicks; ev.push({ t: 'status', to: ti, text: `暈眩 ${mm.status.stun} 回合（無法行動、無法迴避）` }); }
        }
      } else {
        // Skills.md:61 / 103: x10 damage; on a target with Bleeding Wound below 25% HP it kills instantly (rc13; rc12 wrongly gated the skill on HP < 25%).
        if (m.status.bleedTurns > 0 && m.status.bleed > 0 && m.hp < m.maxHp * SK.mercifulBlow.executeBelowHpFraction) {
          const dmg = m.hp; m.hp = 0;
          ev.push({ t: 'hit', from: 'player', to: t, dmg, crits: 0, avoided: null, label: '慈悲一擊・處決' }); ev.push({ t: 'death', to: t });
        } else physHit(s, rng, t, SK.mercifulBlow.multiplier, ev, '慈悲一擊');
      }
      break;
    }
    case 'spell': {
      const def = SPELLS[a.id];
      const cost = spellCost(s, a.id);
      s.mp -= cost;
      ev.push({ t: 'msg', text: `${def.zh}：消耗 ${cost} MP（剩 ${Math.floor(s.mp * 100) / 100}）` });
      const t0 = retarget(s, a.target);
      const order = [t0, ...[t0 - 1, t0 + 1, t0 - 2, t0 + 2].filter((i) => s.monsters[i] && s.monsters[i]!.hp > 0)];
      for (const ti of order.slice(0, def.targets)) spellHit(s, rng, ti, def, profs[def.school] ?? 0, ev);
      if (s.mods) s.mods.lastElem = def.element;
      s.used[def.school] = (s.used[def.school] ?? 0) + 1;
      break;
    }
    case 'item': {
      const f = ITEMS[`${a.id}Potion` as 'healthPotion'];
      s.potions[a.id]--;
      s.itemCd[a.id] = Math.max(0, (a.id === 'health' ? HEALTH_POTION_CD : ITEM_CD) + (s.mods?.itemCd ?? 0)) + 1;
      const res = f.resource as 'hp' | 'mp' | 'sp';
      const max = s.d[res];
      const before = s[res];
      s[res] = Math.min(max, s[res] + Math.round(max * f.fraction));
      ev.push({ t: 'heal', res, amount: s[res] - before, label: a.id === 'health' ? '生命藥水' : a.id === 'mana' ? '法力藥水' : '靈力藥水' });
      if (s.cp5 && a.id === 'health') cleanse(s, ev, '生命藥水');
      break;
    }
    case 'defend': {
      if (s.oc >= DEF.ocCost) {
        s.oc -= DEF.ocCost;
        const before = s.hp;
        const decay = bulDecay ? CP5.bulwarkDefDecay ** (s.defStreak ?? 0) : 1;
        s.hp = Math.min(s.d.hp, s.hp + Math.round(s.d.hp * DEF.hpRecover * (1 + (s.mods?.defHpPct ?? 0)) * decay));
        ev.push({ t: 'heal', res: 'hp', amount: s.hp - before, label: '防禦' });
      } else ev.push({ t: 'status', to: 'player', text: '防禦' });
      s.defendTurns = DEF.turns;
      if (s.cp5) cleanse(s, ev, '防禦');
      if (s.mods?.combo.bulwark) s.mods.counterReady = true;
      if (bulDecay) s.defStreak = (s.defStreak ?? 0) + 1;
      break;
    }
    case 'focus': {
      const focCost = s.mods?.focOcPct ? Math.round(FOC.ocCost * (1 + s.mods.focOcPct)) : FOC.ocCost;
      if (s.oc >= focCost) {
        s.oc -= focCost;
        const before = s.mp;
        s.mp = Math.min(s.d.mp, s.mp + Math.round(s.d.mp * FOC.mpRecover * (1 + (s.mods?.focMpPct ?? 0))));
        ev.push({ t: 'heal', res: 'mp', amount: s.mp - before, label: '專注' });
      } else ev.push({ t: 'status', to: 'player', text: '專注' });
      s.focusTurn = true;
      break;
    }
    case 'spirit': {
      s.spirit = !s.spirit;
      if (s.spirit) s.spiritUsed = true;
      ev.push({ t: 'spirit', on: s.spirit });
      free = true;
      noRegen = true;
      break;
    }
  }
  phaseShift(s, ev);
  if (alive(s).length === 0) { s.over = 'win'; return ev; }
  if (s.cp5 && s.hp <= 0) { s.over = 'lose'; return ev; } // reflected damage
  if (free) return ev;
  endOfPlayerTurn(s, ev, noRegen);
  monstersAct(s, rng, ev);
  if (s.hp <= 0) s.over = 'lose';
  else if (alive(s).length === 0) { phaseShift(s, ev); if (alive(s).length === 0) s.over = 'win'; } // a riposte can end the fight
  return ev;
}

function endOfPlayerTurn(s: BattleState, ev: BEvent[], noRegen: boolean): void {
  s.turn++;
  if (s.ow && s.ow.turns > 0) s.ow.turns--;
  for (const k of Object.keys(s.cooldowns) as SkillId[]) if (s.cooldowns[k] > 0) s.cooldowns[k]--;
  for (const k of Object.keys(s.itemCd) as PotionId[]) if (s.itemCd[k] > 0) s.itemCd[k]--;
  if (s.spirit) {
    if (s.sp >= spPerTurn(s) && s.oc >= SS.ocPerTurn) { s.sp -= spPerTurn(s); s.oc -= SS.ocPerTurn; }
    else { s.spirit = false; ev.push({ t: 'spirit', on: false }); }
  }
  s.regen = { hp: 0, mp: 0, sp: 0 };
  if (!noRegen) {
    // findings 002 §(B)4: per-tick battle regen. Reported as events so a spell's MP cost is not silently refilled.
    const mp0 = s.mp, sp0 = s.sp;
    s.mp = Math.min(s.d.mp, s.mp + 5 + s.d.attrs.wis / 25);
    s.sp = Math.min(s.d.sp, s.sp + 1 + Object.values(s.d.attrs).reduce((a, b) => a + b, 0) / 600);
    const r2 = (x: number) => Math.floor(x * 100) / 100;
    s.regen = { hp: 0, mp: r2(s.mp - mp0), sp: r2(s.sp - sp0) };
    if (r2(s.mp - mp0) > 0) ev.push({ t: 'heal', res: 'mp', amount: r2(s.mp - mp0), label: '自然回復' });
    if (r2(s.sp - sp0) > 0) ev.push({ t: 'heal', res: 'sp', amount: r2(s.sp - sp0), label: '自然回復' });
  }
  s.mp = Math.floor(s.mp * 100) / 100;
  s.sp = Math.floor(s.sp * 100) / 100;
  s.monsters.forEach((m, i) => {
    if (m.hp > 0 && m.status.bleedTurns > 0) {
      m.hp = Math.max(0, m.hp - m.status.bleed);
      m.status.bleedTurns--;
      ev.push({ t: 'hit', from: 'player', to: i, dmg: m.status.bleed, crits: 0, avoided: null, label: '持續' });
      if (m.hp <= 0) ev.push({ t: 'death', to: i });
    }
  });
  if (s.cp5) {
    const p = s.cp5.pdot;
    if (p.burnTurns > 0) { s.hp = Math.max(0, s.hp - p.burn); p.burnTurns--; ev.push({ t: 'pdot', kind: 'burn', dmg: p.burn }); }
    if (p.bleedTurns > 0) { s.hp = Math.max(0, s.hp - p.bleed); p.bleedTurns--; ev.push({ t: 'pdot', kind: 'bleed', dmg: p.bleed }); }
    if (!p.burnTurns) p.burn = 0;
    if (!p.bleedTurns) p.bleed = 0;
  }
  phaseShift(s, ev);
  if (alive(s).length === 0) s.over = 'win';
}

/** CP5 boss signature turn (not drain). Returns true when the signature used the boss's action. */
function sigTurn(s: BattleState, m: CM, i: number, ev: BEvent[]): boolean {
  const per = (base: number) => Math.max(2, base - (m.enraged ? 1 : 0));
  if (m.sig === 'summon' || m.sig === 'thorns') {
    if (m.sigPending) {
      m.sigPending = false;
      if (m.sig === 'thorns') { m.thornTurns = CP5.thornsTurns; CP5_STAT.thornsOn++; ev.push({ t: 'status', to: i, text: `尖刺盾展開（${CP5.thornsTurns} 回合）` }); return false; }
      const minions = s.monsters.filter((x) => x.hp > 0 && (x as CM).summoned).length;
      const c = m.reserve?.shift();
      if (c && minions < CP5.summonMax && alive(s).length < CP5.maxMonsters) { s.monsters.push(c); ev.push({ t: 'status', to: s.monsters.length - 1, text: `援軍 ${c.name} 出現` }); return true; }
      return false;
    }
    m.sigTurns = (m.sigTurns ?? 0) + 1;
    if (m.sigTurns % per(m.sig === 'summon' ? CP5.summonEvery : CP5.thornsEvery) === 0) { m.sigPending = true; ev.push({ t: 'sig', from: i, sig: m.sig, text: SIG_TEXT[m.sig].tele }); }
    return false;
  }
  m.sigTurns = (m.sigTurns ?? 0) + 1;
  if (m.sigTurns % per(CP5.shieldEvery) === 0) {
    rotateShield(m, i, ev);
    if (CP5.pulseMult > 0) { m.pulseNext = true; ev.push({ t: 'sig', from: i, sig: 'shield', text: SIG_TEXT.shield.tele }); }
  }
  return false;
}
/** 深淵之王: rotate fire → cold → elec → wind. Shield element spec +75, breach (next) -50, others back to base. */
export function rotateShield(m: CM, i: number, ev: BEvent[]): void {
  const o = CP5.shieldOrder;
  m.specBase ??= { ...m.spec };
  const k = m.shieldEl ? (o.indexOf(m.shieldEl) + 1) % o.length : 0;
  m.spec = { ...m.specBase };
  m.shieldEl = o[k]!; m.breachEl = o[(k + 1) % o.length]!;
  m.spec[m.shieldEl] = CP5.shieldSpec; m.spec[m.breachEl] = CP5.breachSpec;
  const Z: Record<string, string> = { fire: '火', cold: '冰', elec: '雷', wind: '風' };
  ev.push({ t: 'sig', from: i, sig: 'shield', text: `深淵之王展開 ${Z[m.shieldEl]} 之盾，破綻：${Z[m.breachEl]}` });
}
/** CP5 on-hit: vampire strike heal, 嗜血 heal + bleed, 烈焰 burn. */
function cp5OnHit(s: BattleState, m: CM, i: number, dmg: number, drain: boolean, ev: BEvent[]): void {
  const heal = (f: number, t: string) => { const h = Math.min(m.maxHp - m.hp, Math.round(dmg * f)); if (h > 0) { m.hp += h; ev.push({ t: 'status', to: i, text: `${t} +${h}` }); } };
  if (drain) { CP5_STAT.drainHits++; heal(CP5.drainFrac, '吸血'); }
  const p = s.cp5!.pdot;
  if (m.affixes?.includes('leech')) {
    heal(CP5.leechFrac, '嗜血');
    p.bleed = Math.max(p.bleed, Math.ceil(dmg * CP5.bleed.frac)); p.bleedTurns = CP5.bleed.turns;
    ev.push({ t: 'status', to: 'player', text: `流血：每回合 ${p.bleed}，${p.bleedTurns} 回合` });
  }
  if (m.affixes?.includes('flame')) {
    p.burn = Math.max(p.burn, Math.ceil(dmg * CP5.burn.frac)); p.burnTurns = CP5.burn.turns;
    ev.push({ t: 'status', to: 'player', text: `燃燒：每回合 ${p.burn}，${p.burnTurns} 回合` });
  }
}

/** CP5: attach battle state (flag on). Starts the 深淵之王 shield. Returns the opening events. */
export function armCp5(s: BattleState, pdot?: PDot): BEvent[] {
  s.cp5 = { pdot: pdot ? { ...pdot } : emptyDot() };
  const ev: BEvent[] = [];
  s.monsters.forEach((m, i) => { if ((m as CM).sig === 'shield') rotateShield(m as CM, i, ev); });
  // CP8 P1 (暫定): boss battles open already in Spirit Stance when it can be used (a naive player never presses the toggle).
  if (RULES.cp8 && CP8.bossSpirit && !s.spirit && s.monsters.some((m) => m.rank === 'boss') && canUse(s, { kind: 'spirit' })) { s.spirit = true; s.spiritUsed = true; ev.push({ t: 'spirit', on: true }); }
  return ev;
}

/** cp8-rc4 diagnostic: worst single monster round (fraction of max HP) since the last reset, with its hits. */
export const RDMG = { max: 0, raw: 0 /* cp8-rc5 injury p95: same round before CP8.turnCap */, clip: 0, hits: [] as Record<string, unknown>[], av: {} as Record<string, number> };
function monstersAct(s: BattleState, rng: Rng, ev: BEvent[]): void {
  const hits: Record<string, unknown>[] = [], h0 = s.hp;
  RDMG.clip = 0;
  monstersAct0(s, rng, ev, hits);
  const f = (h0 - s.hp) / s.d.hp;
  RDMG.raw = Math.max(RDMG.raw, f + RDMG.clip / s.d.hp);
  if (f > RDMG.max) { RDMG.max = f; RDMG.hits = hits; RDMG.av = { hp: s.d.hp, evade: s.d.evade, parry: s.d.parry, block: s.d.block, physMit: s.d.physMit, magMit: s.d.magMit }; }
}
function monstersAct0(s: BattleState, rng: Rng, ev: BEvent[], hits: Record<string, unknown>[]): void {
  if (s.over) return;
  const defending = s.defendTurns > 0;
  let ripostes = 0, counters = 0;
  const defBonus = RULES.cp8 && defending && (s.mods?.combo.bulwark || (s.d.style === 'oneHand' && s.d.block > 0)) ? CP8.bulwarkDefCounter : 0; // bulwark = 1H + shield layout (or the bulwark combo) // cp8-rc8 P2-1 自訂，非原版
  // CP8 P5 (暫定): the monsters' hits in one round add up to at most CP8.turnCap × max HP (multi-monster burst, cp7 d20/d23 724/1034).
  const hp0 = s.hp, cap = RULES.cp8 && CP8.turnCap > 0 ? CP8.turnCap * s.d.hp : Infinity;
  s.monsters.forEach((m0, i) => {
    const m = m0 as CM;
    if (m.hp <= 0 || s.hp <= 0) return;
    if (s.cp5) { if (m.thornTurns) m.thornTurns--; if (m.ironTurns) m.ironTurns--; }
    if ((m.status.paTurns ?? 0) > 0 && --m.status.paTurns! <= 0) m.status.pa = 0;
    if (m.status.stun > 0) {
      m.status.stun--;
      if (m.sig === 'summon' && m.sigPending) { m.sigPending = false; ev.push({ t: 'status', to: i, text: '召喚被打斷！' }); }
      if (m.sig === 'drain' && m.drainNext) { m.drainNext = false; m.charge = 0; ev.push({ t: 'status', to: i, text: '吸血重擊被打斷！' }); }
      if (m.pulseNext) { m.pulseNext = false; ev.push({ t: 'status', to: i, text: '元素脈衝被打斷！' }); }
      if (m.heavyNext) { m.heavyNext = false; ev.push({ t: 'status', to: i, text: '蓄力一擊被打斷！' }); }
      return;
    }
    let mult = 1;
    let label: string | undefined;
    let drain = false;
    let el = m.elemAttack;
    if (m.rank === 'boss' && m.pulseNext && m.charge === 0) { m.pulseNext = false; mult = CP5.pulseMult; el = m.shieldEl; label = '元素脈衝！'; }
    else if (m.rank === 'boss') {
      if (m.charge > 0) { mult = BOSS_CHARGE_MULT; m.charge = 0; label = '重擊！'; if (m.drainNext) { m.drainNext = false; drain = true; mult = CP5.drainMult; label = '吸血重擊！'; } }
      else if (++s.bossTurns % (m.enraged ? BOSS_ENRAGED_EVERY : BOSS_CHARGE_EVERY) === 0) {
        m.charge = 1;
        if (m.sig === 'drain' && (m.charges = (m.charges ?? 0) + 1) % CP5.drainEvery === 0) { m.drainNext = true; CP5_STAT.drainTele++; ev.push({ t: 'charge', from: i, drain: true }); ev.push({ t: 'sig', from: i, sig: 'drain', text: SIG_TEXT.drain.tele }); }
        else ev.push({ t: 'charge', from: i });
        return;
      } else if (m.sig && m.sig !== 'drain' && sigTurn(s, m, i, ev)) return;
    } else if (s.cp5 && m.affixes?.includes('berserk')) {
      if (!m.enraged && m.hp < m.maxHp * 0.5) { m.enraged = true; m.ownTurns = 0; ev.push({ t: 'status', to: i, text: '狂戰：狂暴！' }); }
      if (m.enraged) {
        if (m.charge > 0) { mult = BOSS_CHARGE_MULT; m.charge = 0; label = '重擊！'; }
        else if ((m.ownTurns = (m.ownTurns ?? 0) + 1) % BOSS_ENRAGED_EVERY === 0) { m.charge = 1; ev.push({ t: 'charge', from: i }); return; }
      }
    }
    // rc9 P0-1（自訂，非原版，暫定）: a boss / elite plain hit estimated ≥ CP8.bigTele × max HP winds up for 1 round first.
    // cp8-rc10 P0-3: every rank (rc9 skipped normal monsters — the d26 frost caster hit 462 ≈ 50% unannounced), and judged on the
    // largest possible hit (top roll × monster crit), not the mean, so no unannounced single hit can reach bigTele × max HP.
    if (RULES.cp8 && CP8.bigTele > 0 && mult === 1 && !label) {
      if (m.heavyNext) { m.heavyNext = false; label = '蓄力一擊！'; }
      else if (worstHit(s, m, defending) >= CP8.bigTele * s.d.hp) { m.heavyNext = true; ev.push({ t: 'charge', from: i }); return; }
    }
    const zero = s.focusTurn;
    const r = resolveHit(rng, {
      raw: m.adb * mult * (m.elemAttack ? CP5.frostMult : 1), magic: false, acc: m.acc,
      evade: zero ? 0 : s.d.evade, parry: zero ? 0 : s.d.parry, block: zero ? 0 : s.d.block, resist: 0,
      critChance: 0, critMod: 0, flatCrit: { chance: MCRIT.critChance + (m.critBonus ?? 0), bonus: MCRIT.critDamageBonus },
      mit: 1 - (1 - (el ? s.d.magMit : s.d.physMit)) * (defending ? 1 - DEF.mitigation : 1), spec: s.d.specMit[el ?? m.attackType],
    });
    const dmg = Math.min(r.avoidMult > 0 ? r.damage : 0, Math.max(0, Math.round(cap - (hp0 - s.hp))));
    s.hp = Math.max(0, s.hp - dmg);
    RDMG.clip += (r.avoidMult > 0 ? r.damage : 0) - dmg;
    hits.push({ rank: m.rank, raw: Math.round(m.adb * mult), label, avoided: r.avoided, avoidMult: r.avoidMult, crit: r.crits, mit: +(1 - (1 - (el ? s.d.magMit : s.d.physMit)) * (defending ? 1 - DEF.mitigation : 1)).toFixed(3), spec: s.d.specMit[el ?? m.attackType], dmg, def: defending });
    ev.push({ t: 'hit', from: i, to: 'player', dmg, crits: r.crits, avoided: r.avoided, label, ...(el ? { element: el } : {}) });
    if (s.cp5 && dmg > 0) cp5OnHit(s, m, i, dmg, drain, ev);
    if (STYLE_PASSIVES.on && s.d.style === 'oneHand' && (r.avoided === 'parry' || r.avoided === 'block') && s.hp > 0 && m.hp > 0 && counterAttack(s, rng, i, counters, ev, defBonus)) counters++;
    // Decision 2026-10-25 #1: bulwark combo riposte after a block/evade/parry, a normal physHit at a 暫定 multiplier.
    if (s.mods?.combo.bulwark && !(s.cp5 && defending && CP5.bulwarkNoRiposteDef && !defBonus) && r.avoided && r.avoided !== 'resist' && s.hp > 0 && m.hp > 0 && ripostes++ < BULWARK_RIPOSTE.perTurn + defBonus) {
      const keep = s.mods.counterReady; s.mods.counterReady = false;
      physHit(s, rng, i, BULWARK_RIPOSTE.mult, ev, '反擊');
      s.mods.counterReady = keep;
    }
    for (const p of s.d.armorProfs) s.used[p] = (s.used[p] ?? 0) + 1;
  });
  if (s.defendTurns > 0) s.defendTurns--;
}
