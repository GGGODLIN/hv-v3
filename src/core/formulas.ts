import { CONSTANTS as C } from './data/constants';

export const ATTRS = ['str', 'dex', 'agi', 'end', 'int', 'wis'] as const;
export type Attr = (typeof ATTRS)[number];
export type Attrs = Record<Attr, number>;
export const zeroAttrs = (): Attrs => ({ str: 0, dex: 0, agi: 0, end: 0, int: 0, wis: 0 });

const EXP = C['F-002-1.1A-exp'].value;
/** Cumulative EXP needed to be at level L (level 1 = 0). */
export function expForLevel(L: number): number {
  if (L <= 1) return 0;
  return Math.round(Math.pow(L + EXP.offset, Math.pow(EXP.exponentBase, 1 + L / EXP.exponentLevelDivisor)));
}
export function levelForExp(exp: number): number {
  let L = 1;
  while (L < EXP.maxLevel && expForLevel(L + 1) <= exp) L++;
  return L;
}

const AC = C['F-002-1.1C-attribute-cost'].value;
/** Total EXP spent to raise one attribute from 0 to S (S = 0 costs 0). */
export function attrCost(S: number): number {
  if (S <= 0) return 0;
  return Math.pow(S + 1, Math.pow(AC.exponentBase, 1 + S / AC.exponentPointDivisor)) - 1;
}
export function attrsSpent(a: Attrs): number {
  return ATTRS.reduce((s, k) => s + attrCost(a[k]), 0);
}

const MX = C['F-002-1.1D-monster-exp'].value;
export function monsterExp(level: number, pl: number, mult = 1): number {
  const l = Math.min(MX.levelClampMax, Math.max(1, level));
  return Math.ceil((MX.base + Math.pow(l, MX.levelExponent) / MX.levelDivisor) * (1 + pl / MX.plDivisor) * mult);
}

const ADB = C['F-002-1.2C-adb'].value;
const lnBase = Math.log(ADB.logBase);
export function adbFromAttrs(str: number, dex: number, monster = false): number {
  const v = Math.log(ADB.intercept + ADB.strengthWeight * str + ADB.dexterityWeight * dex) / lnBase;
  return Math.max(0, v - (monster ? ADB.monsterOffset : ADB.playerOffset));
}
/** Magic base damage: same shape as ADB with INT in the strength slot and WIS in the dexterity slot. */
export function mdbFromAttrs(int: number, wis: number, monster = false): number {
  return adbFromAttrs(int, wis, monster);
}

const V = C['F-002-1.2B-vitals'].value;
export function baseHp(level: number, end: number): number {
  return V.hp.base + V.hp.perLevel * level + V.hp.perEnd * end;
}
export function baseMp(level: number, wis: number): number {
  return V.mp.base + V.mp.perLevel * level + V.mp.perWis * wis;
}
export function baseSp(a: Attrs): number {
  return Math.floor(V.sp.base + ATTRS.reduce((s, k) => s + a[k], 0) / V.sp.attributeDivisor);
}

const CR = C['F-002-1.2F-crit'].value;
/** Attribute crit chance (fraction). primary = DEX (phys) or WIS (magic), secondary = STR or INT. */
export function attrCrit(primary: number, secondary: number): number {
  return 1 - CR.attributeConstant / (CR.attributeConstant + primary + secondary * CR.strengthWeight);
}

const MIT = C['F-002-1.2H-mitigation'].value;
export function attrMitigation(end: number, other: number, monster = false): number {
  const base = monster ? MIT.monsterBase : MIT.playerBase;
  return Math.min(MIT.attributeCap, 1 - base / (base + end + other * MIT.agilityWeight));
}

const AV = C['002-01c'].value;
/** Monster avoidance from one attribute, as a fraction. */
export function monsterAvoid(attr: number, level: number): number {
  return Math.max(0, Math.min(AV.cap, attr / AV.attributeDivisor, (attr - level) / AV.levelDivisor)) / 100;
}

/** 1 - prod(1 - v/100): stacking percentage mitigations multiplicatively. */
export function stackPct(values: number[]): number {
  return 1 - values.reduce((p, v) => p * (1 - v / 100), 1);
}
