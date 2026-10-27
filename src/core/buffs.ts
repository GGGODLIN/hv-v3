/** CP4 run buffs (docs/cp4-run-buffs.md). All values 暫定. Every key in Mods maps onto an existing variable (doc §1). */
import type { Element } from './player';
import type { SkillId } from './battle';

export type Rarity = 'common' | 'rare' | 'legend';
export type School = 'blade' | 'oc' | 'arcane' | 'bulwark' | 'none';
export const SCHOOLS: Exclude<School, 'none'>[] = ['blade', 'oc', 'arcane', 'bulwark'];
export const SCHOOL_ZH: Record<School, string> = { blade: '刃鋒', oc: '奔流', arcane: '秘術', bulwark: '磐石', none: '通用' };
export const RARITY_ZH: Record<Rarity, string> = { common: '普通', rare: '稀有', legend: '傳說' };

/** Derived-stat mods (applied in runDerived). Pct = multiply by (1+x); others add. */
export interface DMods {
  adbPct?: number; mdbPct?: number; hpPct?: number; mpPct?: number; spPct?: number;
  physAccPct?: number; magAccPct?: number;
  physCrit?: number; magCrit?: number; critMod?: number; spellCritMod?: number;
  evade?: number; parry?: number; block?: number; physMit?: number; magMit?: number; specMitAll?: number;
  edb?: Partial<Record<Element, number>>; edbAll?: number;
  manaCons?: number; counterResist?: number;
}
/** Battle mods (BattleState.mods). Absent = sourced constant unchanged. */
export interface BMods {
  ocGain?: number; ocCap?: number; ocOpen?: number; bossOc?: number;
  ssDamage?: number; ssSpPct?: number; focOcPct?: number; focMpPct?: number;
  skillCd?: Partial<Record<SkillId, number>>; skillOcPct?: number; itemCd?: number;
  bleedMult?: number; weakMult?: number; defHpPct?: number; bashStun?: number;
}
/** Run-layer mods (equipment drop / economy only — decision 6: never credits or EXP). */
export interface RMods { dropAccelMult?: number; priceMult?: number; qualityBump?: number }
export interface BuffDef { id: string; zh: string; rarity: Rarity; school: School; desc: string; core?: boolean; d?: DMods; b?: BMods; r?: RMods; needs?: 'spirit' | 'spell' | 'skill' }

const A9E = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.SIM_A9MDB;
/** cp9-rc9 step 2（自訂，製作人定案）: 大秘儀 MDB bonus 0.25 → 0.05 (arcane mr ablation: largest single arcane contributor); SIM_A9MDB overrides in sims. */
export const A9MDB = A9E !== undefined && A9E !== '' ? Number(A9E) : 0.05;
const B = (id: string, zh: string, rarity: Rarity, school: School, desc: string, m: Partial<BuffDef> = {}): BuffDef => ({ id, zh, rarity, school, desc, ...m });
export const BUFFS: BuffDef[] = [
  // ---- common (21)
  B('B2', '磨利', 'common', 'blade', '物理傷害 +15%', { d: { adbPct: 0.15 } }),
  B('B3', '精準', 'common', 'blade', '物理命中 ×1.08（乘在目前命中上）', { d: { physAccPct: 0.08 } }),
  B('B4', '銳眼', 'common', 'blade', '物理暴擊率 +4%', { d: { physCrit: 0.04 } }),
  B('B5', '破甲直覺', 'common', 'blade', '抵抗反制 +10%', { d: { counterResist: 0.1 } }),
  B('O2', '熱血', 'common', 'oc', '每次命中 OC +2', { b: { ocGain: 2 } }),
  B('O3', '先手氣勢', 'common', 'oc', '一般戰開場 OC +20', { b: { ocOpen: 20 } }),
  B('O4', '韌魂', 'common', 'oc', '最大 SP +20%', { d: { spPct: 0.2 }, needs: 'spirit' }),
  B('O5', '收斂心神', 'common', 'oc', '專注 OC 消耗 −25%', { b: { focOcPct: -0.25 } }),
  B('A2', '火之印記', 'common', 'arcane', '火焰 EDB +15', { d: { edb: { fire: 15 } }, needs: 'spell' }),
  B('A3', '冰之印記', 'common', 'arcane', '冰霜 EDB +15', { d: { edb: { cold: 15 } }, needs: 'spell' }),
  B('A4', '雷之印記', 'common', 'arcane', '雷電 EDB +15', { d: { edb: { elec: 15 } }, needs: 'spell' }),
  B('A5', '澄心', 'common', 'arcane', '法術命中 ×1.08（乘在目前命中上）', { d: { magAccPct: 0.08 }, needs: 'spell' }),
  B('A6', '魔力池', 'common', 'arcane', '最大 MP +20%', { d: { mpPct: 0.2 }, needs: 'spell' }),
  B('W2', '厚皮', 'common', 'bulwark', '物理減傷 +3%', { d: { physMit: 0.03 } }),
  B('W3', '靈巧', 'common', 'bulwark', '迴避 +3%', { d: { evade: 0.03 } }),
  B('W4', '活力', 'common', 'bulwark', '最大 HP +12%', { d: { hpPct: 0.12 } }),
  B('W7', '堅守', 'common', 'bulwark', '防禦回復的 HP ×1.5', { b: { defHpPct: 0.5 } }),
  B('N1', '尋寶者', 'common', 'none', '裝備掉落 ×1.25（不影響金幣、EXP）', { r: { dropAccelMult: 0.25 } }),
  B('N2', '節儉', 'common', 'none', '商人價格 −15%', { r: { priceMult: -0.15 } }),
  B('S-might', '力量祝福', 'common', 'none', '攻擊與法術傷害 +15%', { d: { adbPct: 0.15, mdbPct: 0.15 } }),
  B('S-vigor', '生命祝福', 'common', 'none', '最大 HP +20%，取得時回滿', { d: { hpPct: 0.2 } }),
  // ---- rare (13)
  B('B1', '鋒刃專精', 'rare', 'blade', '物理傷害 +20%、暴擊倍率 +0.25', { core: true, d: { adbPct: 0.2, critMod: 0.25 } }),
  B('B6', '弱點洞察', 'rare', 'blade', '命中目前目標的弱點時傷害 ×1.15', { b: { weakMult: 0.15 } }),
  B('B7', '處刑者', 'rare', 'blade', '慈悲一擊冷卻 −1', { b: { skillCd: { mercifulBlow: -1 } }, needs: 'skill' }),
  B('O1', '戰意湧動', 'rare', 'oc', '每次命中 OC +3、OC 上限 +50', { core: true, b: { ocGain: 3, ocCap: 50 } }),
  B('O6', '魂燃', 'rare', 'oc', '靈動架勢傷害加成 +0.15', { b: { ssDamage: 0.15 }, needs: 'spirit' }),
  B('O7', '輕盈架勢', 'rare', 'oc', '架勢每回合 SP 消耗 −30%', { b: { ssSpPct: -0.3 }, needs: 'spirit' }),
  B('A1', '元素共鳴', 'rare', 'arcane', '全元素 EDB +10、法術暴擊 +4%', { core: true, d: { edbAll: 10, magCrit: 0.04 }, needs: 'spell' }),
  B('A7', '節能詠唱', 'rare', 'arcane', '法術 MP 消耗 −15%（上限 50%）', { d: { manaCons: 0.15 }, needs: 'spell' }),
  B('A8', '冥想', 'rare', 'arcane', '專注回復 MP ×1.5', { b: { focMpPct: 0.5 }, needs: 'spell' }),
  B('W1', '不動之盾', 'rare', 'bulwark', '格擋 +3%、招架 +3%、魔法減傷 +3%', { core: true, d: { block: 0.03, parry: 0.03, magMit: 0.03 } }),
  B('W5', '撕裂', 'rare', 'bulwark', '流血傷害 ×1.5', { b: { bleedMult: 0.5 } }),
  B('W8', '震盪', 'rare', 'bulwark', '盾擊暈眩 +1 回合', { b: { bashStun: 1 }, needs: 'skill' }),
  B('N3', '良品嗅覺', 'rare', 'none', '菁英與寶箱裝備品質 +1', { r: { qualityBump: 1 } }),
  // ---- legend (6)
  B('B8', '千刃', 'legend', 'blade', '物理暴擊率 +8%、暴擊倍率 +0.5', { d: { physCrit: 0.08, critMod: 0.5 } }),
  B('O8', '無盡戰意', 'legend', 'oc', '技能 OC 消耗 −40%', { b: { skillOcPct: -0.4 }, needs: 'skill' }),
  B('O9', '王者氣魄', 'legend', 'oc', 'Boss 戰開場 OC 再 +50', { b: { bossOc: 50 }, needs: 'spirit' }),
  B('A9', '大秘儀', 'legend', 'arcane', `MDB +${Math.round(A9MDB * 100)}%、法術暴擊倍率 +0.5`, { d: { mdbPct: A9MDB, spellCritMod: 0.5 }, needs: 'spell' }),
  B('W6', '不滅', 'legend', 'bulwark', '最大 HP +25%、全種類減傷 +5%', { d: { hpPct: 0.25, specMitAll: 0.05 } }),
  B('N4', '迅捷調和', 'legend', 'none', '藥水冷卻 −1 回合', { b: { itemCd: -1 } }),
];
export const BUFF: Record<string, BuffDef> = Object.fromEntries(BUFFS.map((b) => [b.id, b]));

/** Combo / cross-school effects (decision 1). Triggered by counts of held buffs. */
export interface Combos { blade: boolean; oc: boolean; arcane: boolean; bulwark: boolean; bladeOc: boolean; arcaneOc: boolean; bulwarkBlade: boolean; bulwarkArcane: boolean }
export const COMBO_AT = 3; // 暫定
export const CROSS_AT = 2; // 暫定
export const COMBO_ZH: Record<keyof Combos, string> = {
  blade: '連斬（3 張刃鋒）：暴擊時 OC +5；對菁英與首領物理傷害 ×1.5（暫定）', oc: '滿溢（3 張奔流）：OC 達上限時，下一個技能不耗 OC', arcane: '共振（3 張秘術）：連續同元素法術，第二次 EDB +20', bulwark: '磐石反擊（3 張磐石）：防禦後下一次攻擊 ×1.5；每個敵方回合第一次格擋／迴避／招架時，立刻反擊一次普攻 ×0.5（暫定）',
  bladeOc: '刃鋒＋奔流：架勢中物理暴擊率 +5%', arcaneOc: '秘術＋奔流：架勢中法術 MP 再 −10%', bulwarkBlade: '磐石＋刃鋒：要害打擊對暈眩倍率 +0.5', bulwarkArcane: '磐石＋秘術：冰／雷附帶暈眩 +1 回合',
};
export function schoolCounts(ids: string[]): Record<School, number> {
  const c: Record<School, number> = { blade: 0, oc: 0, arcane: 0, bulwark: 0, none: 0 };
  for (const id of ids) { const b = BUFF[id]; if (b) c[b.school]++; }
  return c;
}
export function combos(ids: string[]): Combos {
  const c = schoolCounts(ids);
  const x = (a: School, b: School) => c[a] >= CROSS_AT && c[b] >= CROSS_AT;
  return { blade: c.blade >= COMBO_AT, oc: c.oc >= COMBO_AT, arcane: c.arcane >= COMBO_AT, bulwark: c.bulwark >= COMBO_AT, bladeOc: x('blade', 'oc'), arcaneOc: x('arcane', 'oc'), bulwarkBlade: x('bulwark', 'blade'), bulwarkArcane: x('bulwark', 'arcane') };
}
/** CP4 decision 2026-10-25 #1 (暫定): a school is "formed" when it holds ≥2 of its buffs and one of them is its core
 * (i.e. core + 1 more). The old "any 3 without core" path is dropped. */
export function formed(ids: string[]): Exclude<School, 'none'>[] {
  const c = schoolCounts(ids);
  return SCHOOLS.filter((s) => c[s] >= 2 && ids.some((id) => BUFF[id]?.core && BUFF[id]!.school === s));
}

/** Sum the mods of all held buffs. */
/** cp9-rc7（自訂，sim-only diag）: SIM_ABL=key,key drops those run-buff BMods (oc strength ablation). Empty in the browser. */
export const ABL9: string[] = (((globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.SIM_ABL) ?? '').split(',').filter(Boolean);
export function sumMods(ids: string[]): { d: DMods; b: BMods; r: RMods } {
  const d: Record<string, any> = {}, b: Record<string, any> = {}, r: Record<string, any> = {};
  const add = (into: Record<string, any>, m?: object) => {
    for (const [k, v] of Object.entries(m ?? {})) {
      if (typeof v === 'number') into[k] = (into[k] ?? 0) + v;
      else { into[k] ??= {}; for (const [k2, v2] of Object.entries(v as object)) into[k][k2] = (into[k][k2] ?? 0) + (v2 as number); }
    }
  };
  for (const id of ids) { const x = BUFF[id]; if (x) { add(d, x.d); add(b, x.b); add(r, x.r); } }
  for (const k of ABL9) { if (k in b) delete b[k]; if (k in d) delete d[k]; } // cp9-rc7 / rc9 step 2 ablation diag（自訂，sim only）
  return { d, b, r };
}

/** Old-save migration (decision 4): run.bonus from the CP3 shrine becomes S-might / S-vigor buffs. */
export function migrateBonus(run: { bonus: { dmg: number; hp: number }; buffs?: string[] }): void {
  run.buffs ??= [];
  for (let i = 0; i < Math.round(run.bonus.dmg / 0.15); i++) run.buffs.push('S-might');
  for (let i = 0; i < Math.round(run.bonus.hp / 0.2); i++) run.buffs.push('S-vigor');
  run.bonus = { dmg: 0, hp: 0 };
}
