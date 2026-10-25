import type { BMods, Combos } from './buffs';
import { CONSTANTS as C } from './data/constants';
import { resolveHit, type Avoid } from './damage';
import type { Monster } from './monsters';
import { CP5, CP5_STAT, SIG_TEXT, type BossSig, type Cp5Mon, type PDot, emptyDot } from './cp5';
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
const ironMit = (m: Monster, mit: number) => ((m as CM).ironTurns ? 1 - (1 - mit) * CP5.ironMit : mit);
/** CP5 反傷 (守門者 stance / 尖刺 affix): reflect a share of physical damage through player physMit, spec and defend. */
function reflect(s: BattleState, ti: number, dmg: number, ev: BEvent[]): void {
  const m = s.monsters[ti] as CM;
  const frac = (m.thornTurns ? CP5.thornsFrac : 0) + (m.affixes?.includes('spikes') ? CP5.spikesFrac : 0);
  if (!frac || dmg <= 0) return;
  const out = Math.round(dmg * frac * (1 - s.d.physMit) * (1 - s.d.specMit[m.attackType]) * (s.defendTurns > 0 ? 1 - DEF.mitigation : 1));
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
  | { t: 'hit'; from: 'player' | number; to: 'player' | number; dmg: number; crits: number; avoided: Avoid; element?: string; label?: string; weak?: boolean; spirit?: boolean }
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
function counterAttack(s: BattleState, rng: Rng, ti: number, done: number, ev: BEvent[]): boolean {
  const a = s.d.attrs, p = s.d.wprof, m = s.monsters[ti]!;
  if (done >= (p >= 200 ? 3 : p >= 100 ? 2 : 1)) return false;
  if (!rng.chance(Math.min(COUNTER.cap, (COUNTER.base + COUNTER.attrK * (a.str + a.dex) + p / COUNTER.profDiv) / 100))) return false;
  const raw = s.d.adb * (s.spirit ? 1 + SS.damageBonus + (s.mods?.ssDamage ?? 0) : 1) * (s.ow && s.ow.turns > 0 ? 1 + OVERWHELM.dmg : 1);
  const r = resolveHit(rng, { raw, magic: false, acc: s.d.physAcc, evade: 0, parry: 0, block: 0, resist: 0, critChance: 0, critMod: 0, mit: ironMit(m, m.physMit), spec: m.spec[s.d.damageType] / 100 });
  m.hp = Math.max(0, m.hp - r.damage);
  if (done === 0) s.oc = Math.min(ocCap(s), s.oc + rng.int(OC.hitGainMin, OC.hitGainMax));
  ev.push({ t: 'hit', from: 'player', to: ti, dmg: r.damage, crits: 0, avoided: null, label: '反擊（單手）', weak: false, spirit: s.spirit });
  if (m.hp <= 0) ev.push({ t: 'death', to: ti });
  return true;
}

function physHit(s: BattleState, rng: Rng, ti: number, mult: number, ev: BEvent[], label?: string, dtype = s.d.damageType): number {
  const m = s.monsters[ti]!;
  const M = s.mods;
  let raw = s.d.adb * mult * (s.spirit ? 1 + SS.damageBonus + (M?.ssDamage ?? 0) : 1);
  let critChance = s.d.physCrit;
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
    critChance, critMod: s.d.critMod, mit: ironMit(m, m.physMit), spec: m.spec[dtype] / 100,
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
    critChance: s.d.magCrit, critMod: s.d.spellCritMod, mit: ironMit(m, m.magMit), spec: m.spec[def.element] / 100 - specReduce,
  });
  if (r.avoidMult > 0) m.hp = Math.max(0, m.hp - r.damage);
  ev.push({ t: 'hit', from: 'player', to: ti, dmg: r.avoidMult > 0 ? r.damage : 0, crits: r.crits, avoided: r.avoided, element: def.element, weak: r.avoidMult > 0 && isWeak(m, def.element) });
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
  return ev;
}

function monstersAct(s: BattleState, rng: Rng, ev: BEvent[]): void {
  if (s.over) return;
  const defending = s.defendTurns > 0;
  let ripostes = 0, counters = 0;
  s.monsters.forEach((m0, i) => {
    const m = m0 as CM;
    if (m.hp <= 0 || s.hp <= 0) return;
    if (s.cp5) { if (m.thornTurns) m.thornTurns--; if (m.ironTurns) m.ironTurns--; }
    if (m.status.stun > 0) {
      m.status.stun--;
      if (m.sig === 'summon' && m.sigPending) { m.sigPending = false; ev.push({ t: 'status', to: i, text: '召喚被打斷！' }); }
      if (m.sig === 'drain' && m.drainNext) { m.drainNext = false; m.charge = 0; ev.push({ t: 'status', to: i, text: '吸血重擊被打斷！' }); }
      if (m.pulseNext) { m.pulseNext = false; ev.push({ t: 'status', to: i, text: '元素脈衝被打斷！' }); }
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
    const zero = s.focusTurn;
    const r = resolveHit(rng, {
      raw: m.adb * mult * (m.elemAttack ? CP5.frostMult : 1), magic: false, acc: m.acc,
      evade: zero ? 0 : s.d.evade, parry: zero ? 0 : s.d.parry, block: zero ? 0 : s.d.block, resist: 0,
      critChance: 0, critMod: 0, flatCrit: { chance: MCRIT.critChance + (m.critBonus ?? 0), bonus: MCRIT.critDamageBonus },
      mit: 1 - (1 - (el ? s.d.magMit : s.d.physMit)) * (defending ? 1 - DEF.mitigation : 1), spec: s.d.specMit[el ?? m.attackType],
    });
    const dmg = r.avoidMult > 0 ? r.damage : 0;
    s.hp = Math.max(0, s.hp - dmg);
    ev.push({ t: 'hit', from: i, to: 'player', dmg, crits: r.crits, avoided: r.avoided, label, ...(el ? { element: el } : {}) });
    if (s.cp5 && dmg > 0) cp5OnHit(s, m, i, dmg, drain, ev);
    if (STYLE_PASSIVES.on && s.d.style === 'oneHand' && (r.avoided === 'parry' || r.avoided === 'block') && s.hp > 0 && m.hp > 0 && counterAttack(s, rng, i, counters, ev)) counters++;
    // Decision 2026-10-25 #1: bulwark combo riposte after a block/evade/parry, a normal physHit at a 暫定 multiplier.
    if (s.mods?.combo.bulwark && !(s.cp5 && defending && CP5.bulwarkNoRiposteDef) && r.avoided && r.avoided !== 'resist' && s.hp > 0 && m.hp > 0 && ripostes++ < BULWARK_RIPOSTE.perTurn) {
      const keep = s.mods.counterReady; s.mods.counterReady = false;
      physHit(s, rng, i, BULWARK_RIPOSTE.mult, ev, '反擊');
      s.mods.counterReady = keep;
    }
    for (const p of s.d.armorProfs) s.used[p] = (s.used[p] ?? 0) + 1;
  });
  if (s.defendTurns > 0) s.defendTurns--;
}
