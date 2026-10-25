/** CP4 r2 step 3: before -> after preview for a buff choice (same idea as the IW / forge preview). Display only, no rule change. */
import { COMBO_ZH, combos, formed, SCHOOL_ZH, sumMods, type BMods, type Combos, type RMods } from '../core/buffs';
import type { Player } from '../core/player';
import { runDerived, type RunState } from '../core/run';
import { SKILLS, type SkillId } from '../core/battle';

export interface PreviewRow { k: string; zh: string; before: string; after: string }
const ELEM_ZH: Record<string, string> = { fire: '火焰', cold: '冰霜', elec: '雷電', wind: '風暴', holy: '神聖', dark: '黑暗' };
const r1 = (x: number, d = 1) => String(Math.round(x * 10 ** d) / 10 ** d);
const pct = (x: number, d = 1) => `${r1(x * 100, d)}%`;
const sgn = (x: number, s: string) => `${x >= 0 ? '+' : ''}${s}`;
/** Format a before/after pair with enough decimals that a real change is visible (0.6% -> 0.62%, not 0.6% -> 0.6%). */
function pair(a: number, b: number, f: (x: number, d: number) => string): [string, string] {
  let d = 1; while (d < 3 && f(a, d) === f(b, d)) d++; return [f(a, d), f(b, d)];
}
type DKey = 'hp' | 'mp' | 'sp' | 'adb' | 'mdb' | 'physAcc' | 'magAcc' | 'physCrit' | 'magCrit' | 'critMod' | 'spellCritMod' | 'evade' | 'parry' | 'block' | 'physMit' | 'magMit' | 'manaCons' | 'counterResist';
const DROWS: [DKey, string, (x: number, d: number) => string][] = [
  ['hp', '最大 HP', (x) => String(Math.round(x))], ['mp', '最大 MP', (x) => String(Math.round(x))], ['sp', '最大 SP', (x) => String(Math.round(x))],
  ['adb', '物理傷害（ADB）', r1], ['mdb', '魔法傷害（MDB）', r1], ['physAcc', '物理命中', r1], ['magAcc', '法術命中', r1],
  ['physCrit', '物理暴擊率', pct], ['magCrit', '法術暴擊率', pct], ['critMod', '暴擊倍率加成', (x, d) => sgn(x, r1(x, Math.max(2, d)))], ['spellCritMod', '法術暴擊倍率加成', (x, d) => sgn(x, r1(x, Math.max(2, d)))],
  ['evade', '迴避', pct], ['parry', '招架', pct], ['block', '格擋', pct], ['physMit', '物理減傷', pct], ['magMit', '魔法減傷', pct],
  ['manaCons', '法術 MP 節省', pct], ['counterResist', '抵抗反制', (x, d) => r1(x, Math.max(2, d))],
];
const BROWS: [keyof BMods, string, (x: number) => string][] = [
  ['ocGain', '每次命中額外 OC', (x) => sgn(x, r1(x))], ['ocCap', 'OC 上限加成', (x) => sgn(x, r1(x))], ['ocOpen', '一般戰開場 OC', (x) => sgn(x, r1(x))], ['bossOc', 'Boss 戰開場 OC', (x) => sgn(x, r1(x))],
  ['ssDamage', '靈動架勢傷害加成', (x) => sgn(x, r1(x, 2))], ['ssSpPct', '架勢 SP 消耗', (x) => sgn(x, pct(x, 0))], ['focOcPct', '專注 OC 消耗', (x) => sgn(x, pct(x, 0))], ['focMpPct', '專注回復 MP', (x) => sgn(x, pct(x, 0))],
  ['skillOcPct', '技能 OC 消耗', (x) => sgn(x, pct(x, 0))], ['itemCd', '藥水冷卻', (x) => sgn(x, `${r1(x)} 回合`)], ['bleedMult', '流血傷害', (x) => sgn(x, pct(x, 0))], ['weakMult', '弱點傷害', (x) => sgn(x, pct(x, 0))],
  ['defHpPct', '防禦回復 HP', (x) => sgn(x, pct(x, 0))], ['bashStun', '盾擊暈眩回合', (x) => sgn(x, r1(x))],
];
const RROWS: [keyof RMods, string, (x: number) => string][] = [
  ['dropAccelMult', '裝備掉落', (x) => sgn(x, pct(x, 0))], ['priceMult', '商人價格', (x) => sgn(x, pct(x, 0))], ['qualityBump', '菁英／寶箱裝備品質', (x) => sgn(x, r1(x))],
];

export function buffPreview(p: Player, run: RunState, id: string): PreviewRow[] {
  const held = run.buffs ?? [];
  const next = [...held, id];
  const a = runDerived(p, { ...run, buffs: held }), b = runDerived(p, { ...run, buffs: next });
  const out: PreviewRow[] = [];
  for (const [k, zh, f] of DROWS) if (a[k] !== b[k]) { const [x, y] = pair(a[k], b[k], f); out.push({ k, zh, before: x, after: y }); }
  for (const e of Object.keys(b.edb) as (keyof typeof b.edb)[]) if (a.edb[e] !== b.edb[e]) out.push({ k: `edb.${e}`, zh: `${ELEM_ZH[e] ?? e} EDB`, before: r1(a.edb[e]), after: r1(b.edb[e]) });
  const sk = Object.keys(b.specMit) as (keyof typeof b.specMit)[];
  if (sk.some((k) => a.specMit[k] !== b.specMit[k])) { const k0 = sk[0]!; const [x, y] = pair(a.specMit[k0], b.specMit[k0], pct); out.push({ k: 'specMit', zh: `各類減傷（例：${k0}）`, before: x, after: y }); }
  const ma = sumMods(held), mb = sumMods(next);
  for (const [k, zh, f] of BROWS) { const x = (ma.b[k] as number | undefined) ?? 0, y = (mb.b[k] as number | undefined) ?? 0; if (x !== y) out.push({ k: `b.${k}`, zh, before: f(x), after: f(y) }); }
  const cdA = ma.b.skillCd ?? {}, cdB = mb.b.skillCd ?? {};
  for (const s of Object.keys(cdB) as SkillId[]) if ((cdA[s] ?? 0) !== cdB[s]) out.push({ k: `cd.${s}`, zh: `${SKILLS[s].zh}冷卻`, before: String(SKILLS[s].cd + (cdA[s] ?? 0)), after: String(SKILLS[s].cd + cdB[s]!) });
  for (const [k, zh, f] of RROWS) { const x = ma.r[k] ?? 0, y = mb.r[k] ?? 0; if (x !== y) out.push({ k: `r.${k}`, zh, before: f(x), after: f(y) }); }
  const fa = formed(held), fb = formed(next);
  if (fb.length !== fa.length) out.push({ k: 'formed', zh: '流派成形', before: fa.map((s) => SCHOOL_ZH[s]).join('、') || '無', after: fb.map((s) => SCHOOL_ZH[s]).join('、') });
  const ca = combos(held), cb = combos(next);
  for (const c of Object.keys(cb) as (keyof Combos)[]) if (cb[c] && !ca[c]) out.push({ k: `combo.${c}`, zh: '組合效果', before: '未觸發', after: COMBO_ZH[c] });
  return out;
}
