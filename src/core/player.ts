import { type Progress, freshProgress } from './progress';
import { CONSTANTS as C } from './data/constants';
import {
  ATTRS, type Attrs, zeroAttrs, adbFromAttrs, mdbFromAttrs, baseHp, baseMp, baseSp, attrCrit, attrMitigation,
  attrsSpent, levelForExp, stackPct,
} from './formulas';
import { type Equip, type Slot, effectiveStats, blocksOffHand } from './items';

export const PROFS = ['oneHand', 'twoHand', 'staff', 'cloth', 'light', 'heavy', 'elemental', 'divine', 'forbidden'] as const;
export type Prof = (typeof PROFS)[number];
export const PROF_ZH: Record<Prof, string> = {
  oneHand: '單手', twoHand: '雙手', staff: '法杖', cloth: '布甲', light: '輕甲', heavy: '重甲', elemental: '元素', divine: '神聖', forbidden: '禁忌',
};

export interface Player {
  name: string;
  /** Total EXP earned; level is derived from it. */
  exp: number;
  attrs: Attrs;
  profExp: Record<Prof, number>;
  equipped: Partial<Record<Slot, Equip>>;
  inventory: Equip[];
  credits: number;
  potions: { health: number; mana: number; spirit: number };
  /** CP3 early-unlock progress (missing on pre-CP3 saves = veteran, see progress.prog). */
  prog?: Progress;
  /** CP8 rc3: ids of the pieces CP8.autoWear put on in the last trip (shown once by the 出發前整備 reminder). */
  lastWorn?: string[];
  /** cp8-rc5: the school the player starts as (bulwark starter kit / preset school; trips do not change it — rc5: drifting on a formed school cost blade p25 17→15); bulwark → town 換上 prefers 1H + shield + heavy. */
  lean?: 'blade' | 'oc' | 'arcane' | 'bulwark';
}

export function newPlayer(name = '冒險者'): Player {
  return {
    name, exp: 0, attrs: zeroAttrs(),
    profExp: Object.fromEntries(PROFS.map((p) => [p, 0])) as Record<Prof, number>,
    equipped: {}, inventory: [], credits: 200, potions: { health: 3, mana: 2, spirit: 1 }, prog: freshProgress(),
  };
}

export const level = (p: Player) => levelForExp(p.exp);
export const unspentExp = (p: Player) => p.exp - attrsSpent(p.attrs);
/** Proficiency = level reached on the character EXP curve by prof EXP, capped at the player level. */
export function profValue(p: Player, k: Prof): number {
  return Math.min(level(p), levelForExp(p.profExp[k]) - 1);
}

export type DmgType = 'slashing' | 'crushing' | 'piercing';
export const ELEMENTS = ['fire', 'cold', 'elec', 'wind', 'holy', 'dark'] as const;
export type Element = (typeof ELEMENTS)[number];

export interface Derived {
  level: number;
  attrs: Attrs;
  hp: number; mp: number; sp: number;
  adb: number; mdb: number;
  physAcc: number; magAcc: number;
  physCrit: number; magCrit: number; critMod: number; spellCritMod: number;
  evade: number; parry: number; block: number; resist: number;
  physMit: number; magMit: number;
  specMit: Record<DmgType | Element, number>;
  edb: Record<Element, number>;
  burden: number; interference: number; manaCons: number; counterResist: number;
  damageType: DmgType;
  style: 'unarmed' | 'oneHand' | 'twoHand' | 'staff';
  weaponProf: Prof | null;
  /** rc7 (c): main-hand style proficiency value (style passives scale with it). */
  wprof: number;
  armorProfs: Prof[];
}

const UNARMED = C['F-003-unarmed'].value;
/** Provisional: weapon-style proficiency gives +1 ADB per point (stands in for the Lv.1 style ability). */
export const PROF_ADB = 1;

export function derive(p: Player): Derived {
  const L = level(p);
  const items = Object.values(p.equipped).filter(Boolean) as Equip[];
  const sum: Record<string, number> = {};
  const mitParts: Record<string, number[]> = {};
  for (const e of items) {
    for (const [k, v] of Object.entries(effectiveStats(e))) {
      if (k.endsWith('Mit') || k === 'physMitigation' || k === 'magMitigation') (mitParts[k] ??= []).push(v!);
      else sum[k] = (sum[k] ?? 0) + v!;
    }
  }
  const s = (k: string) => sum[k] ?? 0;
  const attrs = zeroAttrs();
  for (const a of ATTRS) attrs[a] = p.attrs[a] + Math.round(s(a));
  const weapon = p.equipped.mainHand;
  const style: Derived['style'] = !weapon ? 'unarmed' : (weapon.group as Derived['style']);
  const weaponProf: Prof | null = style === 'unarmed' ? null : style;
  const wprof = weaponProf ? profValue(p, weaponProf) : 0;
  const burden = Math.max(0, s('burden'));
  const burdenFactor = 1 - Math.min(burden, 75) / 75;
  const specMit = {} as Derived['specMit'];
  const map: Record<string, DmgType | Element> = {
    crushMit: 'crushing', slashMit: 'slashing', pierceMit: 'piercing',
    fireMit: 'fire', coldMit: 'cold', elecMit: 'elec', windMit: 'wind', holyMit: 'holy', darkMit: 'dark',
  };
  for (const [k, t] of Object.entries(map)) specMit[t] = stackPct(mitParts[k] ?? []);
  const edb = {} as Record<Element, number>;
  for (const el of ['fire', 'cold', 'elec', 'wind', 'holy', 'dark'] as Element[]) edb[el] = s(`${el}Edb`);
  const armorProfs = [...new Set(items.filter((e) => ['cloth', 'light', 'heavy'].includes(e.group)).map((e) => e.group as Prof))];
  return {
    level: L, attrs,
    hp: baseHp(L, attrs.end), mp: baseMp(L, attrs.wis), sp: baseSp(attrs),
    adb: adbFromAttrs(attrs.str, attrs.dex) + s('attackDamage') + (weapon ? 0 : UNARMED.attackDamage) + wprof * PROF_ADB,
    mdb: mdbFromAttrs(attrs.int, attrs.wis) + s('magicDamage'),
    physAcc: (attrs.dex * C['002-01a'].value.accuracyPerAttribute + s('attackAccuracy')) / 100,
    magAcc: (attrs.wis * 0.05 + s('magicAccuracy')) / 100,
    physCrit: attrCrit(attrs.dex, attrs.str) + s('attackCritChance') / 100,
    magCrit: attrCrit(attrs.wis, attrs.int) + s('magicCritChance') / 100,
    critMod: C['F-002-1.2F-crit'].value.baseDamageBonus + s('attackCritDamage') / 100,
    spellCritMod: C['F-002-1.2F-crit'].value.baseDamageBonus + s('spellCritDamage') / 100,
    evade: Math.min(0.9, ((0.4 * attrs.agi + s('evade')) / 100) * burdenFactor),
    parry: style === 'staff' ? 0 : Math.min(0.9, (0.4 * attrs.dex + s('parry')) / 100),
    block: Math.min(0.9, s('block') / 100),
    resist: Math.min(0.9, (0.4 * attrs.wis + s('resist')) / 100),
    physMit: 1 - (1 - attrMitigation(attrs.end, attrs.agi)) * (1 - stackPct(mitParts.physMitigation ?? [])),
    magMit: 1 - (1 - attrMitigation(attrs.end, attrs.wis)) * (1 - stackPct(mitParts.magMitigation ?? [])),
    specMit, edb, burden,
    interference: Math.max(0, s('interference')),
    manaCons: Math.min(0.5, s('manaConservation') / 100),
    counterResist: s('counterResist') / 100,
    damageType: weapon?.damageType ?? (UNARMED.damageType as DmgType),
    style, weaponProf, wprof, armorProfs,
  };
}

export function equip(p: Player, e: Equip): void {
  const idx = p.inventory.findIndex((x) => x.id === e.id);
  if (idx >= 0) p.inventory.splice(idx, 1);
  const prev = p.equipped[e.slot];
  if (prev) p.inventory.push(prev);
  p.equipped[e.slot] = e;
  if (e.slot === 'mainHand' && blocksOffHand(e) && p.equipped.offHand) {
    p.inventory.push(p.equipped.offHand);
    delete p.equipped.offHand;
  }
  if (e.slot === 'offHand' && blocksOffHand(p.equipped.mainHand)) {
    p.inventory.push(p.equipped.mainHand!);
    delete p.equipped.mainHand;
  }
}

export function unequip(p: Player, slot: Slot): void {
  const e = p.equipped[slot];
  if (!e) return;
  delete p.equipped[slot];
  p.inventory.push(e);
}

/** Allocate n points into an attribute if the EXP budget allows. Returns points actually added. */
export function allocate(p: Player, a: keyof Attrs, n = 1): number {
  let added = 0;
  for (let i = 0; i < n; i++) {
    p.attrs[a]++;
    if (unspentExp(p) < 0) { p.attrs[a]--; break; }
    added++;
  }
  return added;
}
export function refund(p: Player, a: keyof Attrs, n = 1): void {
  p.attrs[a] = Math.max(0, p.attrs[a] - n);
}

/** CP2b: one-click reset of every attribute (all EXP becomes unspent again). */
export function resetAttrs(p: Player): void {
  for (const k of Object.keys(p.attrs) as (keyof Attrs)[]) p.attrs[k] = 0;
}

/** Simple power score used by the sim and the compare arrow. */
export function powerScore(d: Derived): number {
  const off = Math.max(d.adb * (1 + d.physCrit * d.critMod), d.mdb * 3);
  const surv = d.hp / ((1 - d.physMit) * (1 - d.evade * 0.5) * (1 - d.parry * 0.5) * (1 - d.block * 0.5));
  return Math.round(Math.sqrt(off * surv));
}
