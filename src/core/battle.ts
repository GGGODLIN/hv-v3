import type { BMods, Combos } from './buffs';
import { CONSTANTS as C } from './data/constants';
import { resolveHit, type Avoid } from './damage';
import type { Monster } from './monsters';
import type { Derived, Element, Prof } from './player';
import type { Rng } from './rng';

export type SkillId = 'shieldBash' | 'vitalStrike' | 'mercifulBlow';
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
  mercifulBlow: { id: 'mercifulBlow', zh: '慈悲一擊', oc: SK.mercifulBlow.ocCost, cd: SK.mercifulBlow.cooldown, desc: `目標 HP<${SK.mercifulBlow.executeBelowHpFraction * 100}% 時 x${SK.mercifulBlow.multiplier}` },
};
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
export const BOSS_PHASE_TEXT = '復活！第二階段・狂暴';
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
  | { t: 'hit'; from: 'player' | number; to: 'player' | number; dmg: number; crits: number; avoided: Avoid; element?: string; label?: string; weak?: boolean }
  | { t: 'heal'; res: 'hp' | 'mp' | 'sp'; amount: number; label: string }
  | { t: 'status'; to: 'player' | number; text: string; phase?: boolean }
  | { t: 'death'; to: number }
  | { t: 'charge'; from: number }
  | { t: 'spirit'; on: boolean }
  | { t: 'msg'; text: string };

/** CP4 run-buff battle mods (docs/cp4-run-buffs.md). Undefined = CP3 behavior, byte for byte. Values 暫定. */
export interface BattleMods extends BMods {
  combo: Combos;
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
}

export function startBattle(d: Derived, vitals: { hp: number; mp: number; sp: number }, monsters: Monster[], potions: Record<PotionId, number>): BattleState {
  return {
    d, hp: vitals.hp, mp: vitals.mp, sp: vitals.sp, oc: C['P-oc-start'].value.initial,
    monsters, turn: 0, spirit: false, defendTurns: 0, focusTurn: false,
    cooldowns: { shieldBash: 0, vitalStrike: 0, mercifulBlow: 0 },
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

export function canUse(s: BattleState, a: Action): boolean {
  if (s.over) return false;
  switch (a.kind) {
    case 'attack': return true;
    case 'skill': {
      if (s.locked?.skill) return false;
      if (s.cooldowns[a.id] > 0 || s.oc < skillOc(s, a.id)) return false;
      if (a.id === 'mercifulBlow') {
        const m = s.monsters[a.target];
        return !!m && m.hp > 0 && m.hp < m.maxHp * SK.mercifulBlow.executeBelowHpFraction;
      }
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
export function weaknesses(m: Monster): { type: keyof Monster['spec']; pct: number }[] {
  return (Object.keys(m.spec) as (keyof Monster['spec'])[]).filter((k) => m.spec[k] < 0).map((k) => ({ type: k, pct: -m.spec[k] })).sort((a, b) => b.pct - a.pct);
}

function retarget(s: BattleState, t: number): number {
  if (s.monsters[t] && s.monsters[t]!.hp > 0) return t;
  return s.monsters.findIndex((m) => m.hp > 0);
}

function physHit(s: BattleState, rng: Rng, ti: number, mult: number, ev: BEvent[], label?: string, dtype = s.d.damageType): number {
  const m = s.monsters[ti]!;
  const M = s.mods;
  let raw = s.d.adb * mult * (s.spirit ? 1 + SS.damageBonus + (M?.ssDamage ?? 0) : 1);
  let critChance = s.d.physCrit;
  if (M) {
    if (M.weakMult && isWeak(m, dtype)) raw *= 1 + M.weakMult;
    if (M.counterReady) { M.counterReady = false; raw *= 1.3; fire(s); }
    if (M.combo.bladeOc && s.spirit) critChance += 0.05;
  }
  const r = resolveHit(rng, {
    raw, magic: false, acc: s.d.physAcc,
    evade: m.status.stun > 0 ? 0 : m.evade, parry: m.status.stun > 0 ? 0 : m.parry, block: 0, resist: 0,
    critChance, critMod: s.d.critMod, mit: m.physMit, spec: m.spec[dtype] / 100,
  });
  if (r.avoidMult > 0) {
    m.hp = Math.max(0, m.hp - r.damage);
    const cap = ocCap(s);
    s.oc = Math.min(cap, s.oc + rng.int(OC.hitGainMin, OC.hitGainMax) + (M?.ocGain ?? 0) + (M?.combo.blade && r.crits > 0 ? 5 : 0));
    if (M?.combo.blade && r.crits > 0) fire(s);
    if (M?.combo.oc && s.oc >= cap && !M.freeSkill) { M.freeSkill = true; fire(s); }
  }
  ev.push({ t: 'hit', from: 'player', to: ti, dmg: r.avoidMult > 0 ? r.damage : 0, crits: r.crits, avoided: r.avoided, label, weak: r.avoidMult > 0 && isWeak(m, dtype) });
  if (s.d.weaponProf) s.used[s.d.weaponProf] = (s.used[s.d.weaponProf] ?? 0) + 1;
  if (m.hp <= 0) ev.push({ t: 'death', to: ti });
  return r.avoidMult > 0 ? r.damage : 0;
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
    critChance: s.d.magCrit, critMod: s.d.spellCritMod, mit: m.magMit, spec: m.spec[def.element] / 100 - specReduce,
  });
  if (r.avoidMult > 0) m.hp = Math.max(0, m.hp - r.damage);
  ev.push({ t: 'hit', from: 'player', to: ti, dmg: r.avoidMult > 0 ? r.damage : 0, crits: r.crits, avoided: r.avoided, element: def.element, weak: r.avoidMult > 0 && isWeak(m, def.element) });
  if (m.hp > 0 && r.full && def.statusChance && rng.chance(def.statusChance)) {
    if (def.element === 'cold' || def.element === 'elec') { m.status.stun = Math.max(m.status.stun, M?.combo.bulwarkArcane ? 2 : 1); ev.push({ t: 'status', to: ti, text: def.element === 'cold' ? '凍結' : '麻痺' }); }
    else { m.status.bleed = Math.max(m.status.bleed, Math.ceil(r.damage * 0.15 * (1 + (M?.bleedMult ?? 0)))); m.status.bleedTurns = 3; ev.push({ t: 'status', to: ti, text: def.element === 'fire' ? '燃燒' : '撕裂' }); }
  }
  if (m.hp <= 0) ev.push({ t: 'death', to: ti });
}

/** Apply one player action, then let every live monster act. Returns the events for the renderer. */
export function act(s: BattleState, a: Action, rng: Rng, profs: Partial<Record<Prof, number>> = {}): BEvent[] {
  const ev: BEvent[] = [];
  if (!canUse(s, a)) return [{ t: 'msg', text: '無法使用' }];
  let free = false;
  let noRegen = false;
  s.focusTurn = false;
  switch (a.kind) {
    case 'attack': {
      const t = retarget(s, a.target);
      physHit(s, rng, t, 1, ev);
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
        if (m.hp > 0) { m.status.stun = SK.shieldBash.stunTicks + (s.mods?.bashStun ?? 0); ev.push({ t: 'status', to: t, text: '暈眩' }); }
      } else if (a.id === 'vitalStrike') {
        const stunned = m.status.stun > 0;
        const dmg = physHit(s, rng, t, stunned ? SK.vitalStrike.multiplierVsStunned + (s.mods?.combo.bulwarkBlade ? 0.5 : 0) : SK.vitalStrike.multiplier, ev, stunned ? '要害！' : '要害打擊');
        if (m.hp > 0 && dmg > 0) {
          m.status.bleed = Math.max(m.status.bleed, Math.ceil((dmg * BLEED.damageFactor * (1 + (s.mods?.bleedMult ?? 0))) / VSB.ticks));
          m.status.bleedTurns = VSB.ticks;
          ev.push({ t: 'status', to: t, text: '流血' });
        }
      } else {
        physHit(s, rng, t, SK.mercifulBlow.multiplier, ev, '慈悲一擊');
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
      break;
    }
    case 'defend': {
      if (s.oc >= DEF.ocCost) {
        s.oc -= DEF.ocCost;
        const before = s.hp;
        s.hp = Math.min(s.d.hp, s.hp + Math.round(s.d.hp * DEF.hpRecover * (1 + (s.mods?.defHpPct ?? 0))));
        ev.push({ t: 'heal', res: 'hp', amount: s.hp - before, label: '防禦' });
      } else ev.push({ t: 'status', to: 'player', text: '防禦' });
      s.defendTurns = DEF.turns;
      if (s.mods?.combo.bulwark) s.mods.counterReady = true;
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
  if (free) return ev;
  endOfPlayerTurn(s, ev, noRegen);
  monstersAct(s, rng, ev);
  if (s.hp <= 0) s.over = 'lose';
  return ev;
}

function endOfPlayerTurn(s: BattleState, ev: BEvent[], noRegen: boolean): void {
  s.turn++;
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
  phaseShift(s, ev);
  if (alive(s).length === 0) s.over = 'win';
}

function monstersAct(s: BattleState, rng: Rng, ev: BEvent[]): void {
  if (s.over) return;
  const defending = s.defendTurns > 0;
  s.monsters.forEach((m, i) => {
    if (m.hp <= 0 || s.hp <= 0) return;
    if (m.status.stun > 0) { m.status.stun--; return; }
    let mult = 1;
    let label: string | undefined;
    if (m.rank === 'boss') {
      if (m.charge > 0) { mult = BOSS_CHARGE_MULT; m.charge = 0; label = '重擊！'; }
      else if (++s.bossTurns % (m.enraged ? BOSS_ENRAGED_EVERY : BOSS_CHARGE_EVERY) === 0) { m.charge = 1; ev.push({ t: 'charge', from: i }); return; }
    }
    const zero = s.focusTurn;
    const r = resolveHit(rng, {
      raw: m.adb * mult, magic: false, acc: m.acc,
      evade: zero ? 0 : s.d.evade, parry: zero ? 0 : s.d.parry, block: zero ? 0 : s.d.block, resist: 0,
      critChance: 0, critMod: 0, flatCrit: { chance: MCRIT.critChance, bonus: MCRIT.critDamageBonus },
      mit: 1 - (1 - s.d.physMit) * (defending ? 1 - DEF.mitigation : 1), spec: s.d.specMit[m.attackType],
    });
    const dmg = r.avoidMult > 0 ? r.damage : 0;
    s.hp = Math.max(0, s.hp - dmg);
    ev.push({ t: 'hit', from: i, to: 'player', dmg, crits: r.crits, avoided: r.avoided, label });
    for (const p of s.d.armorProfs) s.used[p] = (s.used[p] ?? 0) + 1;
  });
  if (s.defendTurns > 0) s.defendTurns--;
}
