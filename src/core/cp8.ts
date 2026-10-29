/**
 * CP8 真實遊玩 (docs/cp8-real-play.md). Everything here is used only when RULES.cp8 is on.
 * Knobs marked 暫定 have no original-game source (Clean Room rule: listed in docs/cp8-real-play.md §暫定值).
 */
import { CP7 } from './cp7';
const RC22_ENV = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const num = (k: string): number | null => (RC22_ENV?.[k] != null && RC22_ENV[k] !== '' ? Number(RC22_ENV[k]) : null);
/** rc22 item 2 tuning（自訂，非原版，暫定）. Sim overrides: SIM_POTCD / SIM_MULTIK / SIM_NORMALCAP.
 *  potCd: health-potion cooldown under cp8 (null = data value 3). multiK: monster damage × this in non-boss abyss fights with ≥ 2
 *  monsters past d17 (1 = off). normalCap: max monsters alive in non-boss fights (0 = CP5.maxMonsters). */
// rc22 defaults（自訂，非原版，暫定）: ui-sim N=128 seeds 0/256 — potCd 2 → multiK 0.65 → normalCap 1 reached all ≥ 27, arcane/bulwark ≥ 32.
export const RC22 = { potCd: (num('SIM_POTCD') ?? 1) /* cp9-rc6 item 2（製作人要求，自訂，暫定）: 2 → 1 */ as number | null, multiK: num('SIM_MULTIK') ?? 0.65, normalCap: num('SIM_NORMALCAP') ?? 2 }; // cp9 (a)（製作人要求，自訂）: normal fights up to 2 monsters
export const CP8 = {
  /** 暫定（缺原版出處；rc3 試玩 d25 首領從滿血 936 被打死）: d25 abyss boss damage × (replaces ABYSS.bossDmgAt[25]=0.6 when cp8 is on).
   *  d25 stacks tier 3→4, plevel +10 and the first boss affix on one fight; this softens only that boss. */
  boss25Dmg: 0.5,
  /** 暫定（缺原版出處；產品規則）P1: a drop that the 「▲ 比身上好」 rule (CP7 betterThanWorn) badges is worn at once, in the run.
   *  Root cause of the naive gap: loot sits in the run bag, and on death only RULES.death.keepBestItems (=1) bag piece survives. */
  autoWear: true,
  /** 暫定（缺原版出處；產品規則）P1: boss battles open in Spirit Stance (sourced entry rule: OC ≥ 50, F-002-spirit-stance) when it
   *  can be used — the toggle is free, but a player who never presses it loses the SS damage bonus in every boss fight. */
  bossSpirit: true,
  /** cp8-rc8 P2 item 1（自訂，非原版，暫定）: bulwark defending gets +1 block-counter per turn (riposte allowed while defending, 1H counter cap +1). 0 = off. */
  bulwarkDefCounter: num('SIM_BWDC') ?? 1, // cp9-rc8 step2 ablation knob（自訂）
  /** rc9 item 1 (UI only, 自訂，非原版，暫定): ms a fresh 蓄力 / 大招 panel ignores A / skills / spells (D / potions stay instant). */
  chargeHoldMs: 700,
  /** rc9 P0-1（自訂，非原版，暫定）: a boss / elite normal hit whose estimate is ≥ this × max HP is wound up for 1 round first
   *  (telegraphed with its estimate; released next turn at ×1). 0 = off. */
  bigTele: 0.5,
  /** rc9 P0-2（自訂，非原版，暫定）: the HP-potion hint also lights when HP − the next round's estimated damage < this × max HP. */
  potAfter: 0.25,
  /** 暫定（缺原版出處）P5: cap on the summed monster damage of one round, as a fraction of max HP (0 = off). */
  turnCap: 0.75, // cp8-rc5 (暫定, own rule, producer 2026-10-26): 0.9 → 0.7 → 0.75 (lowest of 0.75/0.8 passing P4 late flat on B128+B256; docs/logs/cp8rc8/dec)
  /** 暫定（缺原版出處）P3: run buffs picked before an abyss trip that starts at depth `start` > 1: N = floor((start − 1) / per), max `max`. */
  startBuffPer: 5,
  startBuffMax: 6,
  /** 暫定（缺原版出處）P3 (rc2): non-boss damage factor for abyss themes 1–3 from the 2nd rotation (d21–23, d41–43 …). CP7.themeDmg
   *  gives themes 16–19 ×0.7, so at d20→d21 the discount ended at once (adb +52% vs d18 while the tier multiplier is only +9.5%).
   *  The discount now fades out 0.7 → 1 over themes 1–3 (theme 20 is the boss floor, not affected).
   *  cp8-rc11 item 3（暫定、自訂，非原版）: rc2's 4 steps ended at d24, so d24→d25 still jumped ×0.925→×1. The ramp now spans
   *  themes 1–9 (d21–d29), linear 0.7 + 0.3·i/9, and d30 is the first full-strength floor.
   *  (rc2–rc10 value: [0.7, 0.775, 0.85, 0.925].) */
  /** cp8-rc12 item 3（暫定、自訂，非原版）: from d21 each DIFF tier jump ramps over all 5 depths of the tier (was CP7.tierRamp 3 →
   *  depths 3–5 of a tier shared one multiplier: d22–24 ×6.08, d27–29 ×7.60). Now the multiplier rises on every floor. */
  tailRamp: 5,
  themeTail: Array.from({ length: 9 }, (_, i) => Math.round((0.7 + (0.3 * i) / 9) * 1000) / 1000) as number[],
  /** 暫定（缺原版出處；產品規則）rc3: with a staff in the main hand, 「A·攻擊」 casts this basic spell when it can (MP, unlocked),
   *  else it is a normal melee hit. Playtest: an arcane player who only presses 攻擊 hit with the staff (adb 118, wprof 5) and died at d8.
   *  '' = off. The spell itself (cost, damage) is unchanged. */
  staffQuickSpell: 'fiery' as string,
};
/** CP8 rc2: theme damage factor at theme floor f (1..20) for abyss depth > 20. */
export const cp8ThemeDmg = (f: number): number => (f >= 1 && f <= CP8.themeTail.length ? CP8.themeTail[f - 1]! : CP7.themeDmg[f] ?? 1);
/** CP8 P3 (暫定 formula): number of start buffs for an abyss trip from depth `start`. */
export const startBuffs = (start: number): number => Math.min(CP8.startBuffMax, Math.max(0, Math.floor((start - 1) / CP8.startBuffPer)));
/** CP9 rc1（自訂，非原版，暫定）. Sim overrides: SIM_BOSSBURST / SIM_BOSSPLAIN / SIM_NORMALCAP etc.
 *  bossBurst: in a boss fight, everything the player takes in one act() (hits, reflects, burn/bleed) ≤ this × max HP on a turn
 *  that was telegraphed (any monster winding up at the start of the enemy phase). bossPlain: the same cap on an un-telegraphed
 *  turn, so a big turn always has a one-turn warning. */
/** rc12 prototypes（自訂，非原版，待製作人挑選）. All sim knobs default off (= current behaviour) except hp1Tele (approved hint logic, SIM_RC12_HP1TELE=0 restores rc11).
 *  curve: abyss boss d>20 HP slope per depth replacing abyssMult.hp×CP5.bossHp sawtooth (0 = off; 自訂 0.017 / 0.012).
 *  chargeEvery: boss charge interval (0 = BOSS_CHARGE_EVERY 4). dCounter: D during a boss telegraph hits back adb×K (0 = off).
 *  preMerch: d%5==4 abyss floors always offer a merchant (0 = off). */
export const RC12 = { curve: num('SIM_RC12_CURVE') ?? 0, chargeEvery: num('SIM_RC12_CHARGEEVERY') ?? 0, dCounter: num('SIM_RC12_DCOUNTER') ?? 0.5 /* 2b 自訂, 製作人採用 rc12 */,
  preMerch: num('SIM_RC12_PREMERCH') ?? 1, shatter: num('SIM_RC12_SHATTER') !== 0 /* scheme 6: 2H Rending→Shatter as interrupt (Skills.md:73-75) */, hp1Tele: num('SIM_RC12_HP1TELE') !== 0, smooth: num('SIM_RC12_SMOOTH') !== 0 /* 自訂 abyss boss HP hull, never below original */ };
export const CP9 = { on: num('SIM_CP9') !== 0,
  /** cp9-rc7 items 2/3（自訂，暫定，無來源）: boss turns after a charged/telegraphed hit lands, and after a revive, during which it cannot start a new wind-up (charge / 蓄力 / 脈衝). */ windCd: num('SIM_WINDCD') ?? 2,
  /** cp9-rc7 item 4（自訂，暫定，無來源）: in capped fights a defending turn takes strictly < defCap × max HP (0 = off). */ defCap: num('SIM_DEFCAP') ?? 0.35,
  /** cp9-rc8（自訂，暫定）: 防禦保命 on/off (SIM_SAVE9=0 ablation) and once-per-fight mode. */ save9: (num('SIM_SAVE9') ?? 1) > 0, saveOnce: (num('SIM_SAVEONCE') ?? 0) > 0,
  /** cp9-rc8（自訂）: rc7 「敵人無法行動 → A」 hint on/off (ablation). */ stunA: (num('SIM_STUNA') ?? 1) > 0,
  /** cp9-rc8 step1（自訂，ablation）: windCd triggers — after revive / after a telegraphed hit lands. */ windRev: (num('SIM_WINDREV') ?? 1) > 0, windHit: (num('SIM_WINDHIT') ?? 1) > 0,
  /** cp9-rc8 item 1（自訂，製作人定案）: lock after a telegraphed hit lands (revive lock stays windCd = 2). */ windHitCd: num('SIM_WINDCDHIT') ?? 1,
  /** cp9-rc8 item 2（自訂，製作人定案）: bulwarkDefCounter extra counter/riposte damage vs bosses (normal monsters ×1). */ bwdcBoss: num('SIM_BWDCBOSS') ?? 0.5,
  /** cp9-rc8 (c)1（自訂，製作人定案）: boss stun immunity turns after a stun ends (0 = off). */ stunImm: num('SIM_STUNIMM') ?? 2,
  /** cp9-rc8 (c)2（自訂）: bulwark option — 1 = defend counter ×0.5 all targets, 2 = ≤1 counter/turn. */ bwOpt: num('SIM_BWOPT') ?? 2, // sim: option ii mr 49 vs option i 100
  dMin: num('SIM_DMIN') ?? 0.2, // cp9-rc7 producer item 2（自訂，暫定）: D hint only when next-round intent ≥ 20% max HP
  hp1A: (num('SIM_HP1A') ?? 1) > 0, // cp9-rc7 producer item 1（自訂，暫定）: no potion + HP 1 → hint A
  
  /** rc4 (C1)（自訂，暫定，無來源）: lifesteal share of a 吸血重擊 that lands while the player defends (1 = rc3). */ drainDef: num('SIM_DRAINDEF') ?? 0.5,
  bossBurst: num('SIM_BOSSBURST') ?? 0.5, bossPlain: num('SIM_BOSSPLAIN') ?? 0.2 /* cp9-rc5 (2)（自訂，暫定）: unannounced per-turn cap 30% → 20% */,
  /** cp9-rc5 (1)（自訂，暫定，無來源）: share of a telegraphed (charged / 蓄力 / 脈衝 / 吸血) hit still taken while defending (plain hits keep DEF.mitigation). */ chargeDef: num('SIM_CHARGEDEF') ?? 0.5,
  /** cp9-rc5 (1)（自訂，暫定）: a stun cancels every wind-up (rc4: only drain / heavy / pulse; a boss 重擊 charge survived the stun). */ stunAll: (num('SIM_STUNALL') ?? 1) > 0,
  /** (c): above this HP share the advice keeps the potion unless D cannot save the turn (≤ the producer's 50%). */ zHp: num('SIM_ZHP') ?? 0.4,
  /** (a): weight of the hit a stun skill cancels when its target is winding up (skill-hint value). */ stunW: num('SIM_STUNW') ?? 1,
  /** rc2 (b)（自訂，暫定）: boss max-HP multiplier so the median boss fight lasts 6–18 turns. */ bossHp: num('SIM_BOSSHP') ?? 1,
  /** rc2 (a)（自訂，暫定，無來源）: share of end-of-fight OC kept for the next fight of the trip (0 = off, the CP3 0-start). */ ocCarry: num('SIM_OCCARRY') ?? 1,
  /** rc3 (2)（自訂，暫定）: apply the bossBurst / bossPlain per-turn caps in normal and elite fights too. */ allCap: (num('SIM_ALLCAP') ?? 1) > 0,
  /** rc2 (2)（自訂，暫定，無來源）: per-floor boss HP multiplier: ×boss5 at floor ≤5, linear to ×boss15 at floor 15, linear to ×boss30 at floor bossEnd (25), flat after. */ boss5: num('SIM_BOSS5') ?? 3, boss15: num('SIM_BOSS15') ?? 4.5, bossEnd: num('SIM_BOSSEND') ?? 25, boss30: num('SIM_BOSS30') ?? 1.5/* cp9-rc7 item 1（自訂，暫定）: 2 → 1.5 */ /* cp9-rc5 (3)（自訂，暫定）: 1 → 2 so the preset boss fight is blade ≥3 / others ≥6 turns */,
  /** rc2 (3)（自訂，暫定，無來源）: blade skill OC cost multiplier (producer cap: ≥0.7). */ bladeOc: num('SIM_BLADEOC') ?? 0.7,
  /** rc12f item 1（自訂，非原版，CP9 第 5 條）: boss plain-attack adb ≤ bossAtk × refHp9(floor), the typical max HP at that floor (0 = off).
   *  Charged / 蓄力 / 脈衝 hits scale from this adb and stay under the bossBurst cap. */ bossAtk: num('SIM_BOSSATK') ?? 0.4, /** rc12i item 2（自訂）: non-boss charged hit ≤ this × max HP (0 = off). */ minionCharge: num('SIM_MINIONCHG') ?? 0.4, /** rc12s item 3（自訂）: charged hit cap in a normal fight (no elite / boss on the field); elite & boss fights keep minionCharge. */ normalCharge: num('SIM_NORMALCHG') ?? 0.3, // rc12f 預設 0.40（自訂，製作人決定）
  /** rc12f item 2（自訂，sim 單因素對照）: overrides RULES.cp4BossHpPerBuff (null = keep RULES). */ buffHp: num('SIM_BUFFHP') };
/** rc12f（自訂，非原版）: typical max HP of the four schools at a floor/depth — sim medians (scripts/rc12f-adb-diag.ts, preset+std, ★ policy):
 *  ~850 up to F30, then +3.5 per floor (F100 ≈ 1095). Reference for CP9.bossAtk only. */
/** rc12g item 1（自訂，製作人開放）: deep-floor curve from F = deepFrom: every monster (normal / elite / boss) HP and damage
 *  × (1 + deep·(F − deepFrom)/60) → F100 ×(1 + deep). Boss adb is still capped by bossAtk (rc12f) afterwards. 0 = off. */
export const DEEP12G = { /** rc12j item 4（自訂）: arcane / oc boss HP × this from F30 (QA replay median >18). */ aoBossHp: num('SIM_AOBOSSHP') ?? 0.8, /** rc12i（自訂）: bulwark-lean boss per-turn caps (plain & telegraphed) × this F30–65, linear back to ×1 at F100. */ bwCap: num('SIM_BWCAP') ?? 1, /** rc12i（自訂）: bulwark-lean player physical damage × this vs bosses. */ bwOut: num('SIM_BWOUT') ?? 1, /** rc12i（自訂）: bulwark-lean boss HP × this from F30 (QA real-snapshot replay: turns too long). */ bwBossHp: num('SIM_BWBOSSHP') ?? 0.5 /* rc12u（自訂）: 0.3→0.5 after adds fix */ /* rc12t（自訂；原 0.45，QA bw1 F45/F50 boss 32/24 回合） */ /* rc12k r2 製作人（自訂；原 0.2） */ /* rc12i 預設（自訂，製作人方案 b） */, bwBossFrom: 30, bwBossFlat: 65, bwBoss100: num('SIM_BWBOSS100') ?? 0.3 /* rc12k r2（自訂；原 2.5，F70+ 不靠 HP 拉長） */ /* rc12i 預設（自訂） */ /* linear from ×bwBossHp at F65 to this at F100 */, k: num('SIM_DEEP') ?? 0, hpK: num('SIM_DEEPHP') ?? 1, from: num('SIM_DEEPFROM') ?? 40,
  /** rc12g step 3（自訂）: per-school strength (overrides k when set; no lean → k). */
  school: { blade: num('SIM_DEEP_BLADE') ?? 4, oc: num('SIM_DEEP_OC'), arcane: num('SIM_DEEP_ARCANE'), bulwark: num('SIM_DEEP_BULWARK') ?? 7 /* rc12g 預設（自訂，非原版）: blade 4、bulwark 7、oc/arcane 0 */ } as Record<string, number | undefined>,
  /** rc12h（自訂）: per-school HP / attack split of the curve (multiplies k; unset → hpK / 1). */
  hpS: { blade: num('SIM_DEEPHP_BLADE') ?? 0.15 /* rc12k r2 製作人（自訂；r1 0.75、rc12i 1.5）: blade HP-only boost (k 4 × 1.5 → F100 HP ×7, dmg ×5 unchanged) */, bulwark: num('SIM_DEEPHP_BULWARK') ?? 0.05 /* rc12h 預設（自訂） */, oc: num('SIM_DEEPHP_OC') ?? undefined, arcane: num('SIM_DEEPHP_ARCANE') ?? 0.05 /* rc12u（自訂） */ /* rc12u（自訂）: optional HP share for oc / arcane */ } as Record<string, number | undefined>,
  /** rc12h（自訂）: boss un-telegraphed per-turn cap at F100 for this school (linear from bossPlain at `from`; clamped ≤ bossAtk). */
  plainS: { bulwark: num('SIM_DEEPPLAIN_BULWARK') ?? 0.5 /* rc12k r2（自訂；rc12h 0.4） */, blade: num('SIM_DEEPPLAIN_BLADE') ?? 0.6 /* rc12k item 2（自訂） */ } as Record<string, number | undefined>,
  /** rc12h（自訂）: extra health-potion cooldown turns in this school's boss fights at F100 (linear from 0 at `from`). */
  /** rc12k round 2（自訂）: deep boss charge interval per school from chgFrom (unset = BOSS_CHARGE_EVERY 4). */
  chgE: { bulwark: num('SIM_CHGE_BULWARK') ?? 3 /* rc12k r2（自訂）: F70+ 每 3 回合蓄力 */, blade: num('SIM_CHGE_BLADE') ?? undefined } as Record<string, number | undefined>, chgFrom: num('SIM_CHGFROM') ?? 70,
  potS: { bulwark: num('SIM_DEEPPOTCD_BULWARK') ?? 6 /* rc12k 製作人決定（自訂）: 上限 +6（rc12h 為 30） */ } as Record<string, number | undefined>,
  atkS: { bulwark: num('SIM_DEEPATK_BULWARK') ?? 3 /* rc12h 預設（自訂）；adb 仍受 bossAtk 上限 */, blade: num('SIM_DEEPATK_BLADE') ?? 3 /* rc12k item 2（自訂） */ } as Record<string, number | undefined> };
/** rc12g step 3（自訂）: school for the deep curve — lean, else by main hand (presets blade / oc carry no lean): 2H → blade, staff → arcane, 1H → oc. */
export const curveSchool12g = (p: { lean?: string; equipped: { mainHand?: { group?: string } } }): string | undefined =>
  p.lean ?? ({ twoHand: 'blade', staff: 'arcane', oneHand: 'oc' } as Record<string, string>)[p.equipped.mainHand?.group ?? ''];
export const deepK12g = (lean?: string): number => r12mDeepK(lean) ?? (lean ? DEEP12G.school[lean] : undefined) ?? DEEP12G.k; // rc12m（自訂）: per-school deep k (RUN12M first)
export const deep12g = (f: number, part: 'hp' | 'dmg', lean?: string): number => 1 + deepK12g(lean) * (part === 'hp' ? ((lean ? DEEP12G.hpS[lean] : undefined) ?? DEEP12G.hpK) : ((lean ? DEEP12G.atkS[lean] : undefined) ?? 1)) * Math.max(0, f - DEEP12G.from) / 60;
export const refHp9 = (f: number): number => 850 + 3.5 * Math.max(0, f - 30);
/** cp9 rc2 (2)（自訂，暫定）: boss HP multiplier for a floor. */
export const bossHp9 = (f: number): number => CP9.bossHp * (f <= 5 ? CP9.boss5 : f >= CP9.bossEnd ? CP9.boss30 : f <= 15 ? CP9.boss5 + (CP9.boss15 - CP9.boss5) * (f - 5) / 10 : CP9.boss15 + (CP9.boss30 - CP9.boss15) * (f - 15) / (CP9.bossEnd - 15));

/** rc12h（自訂）: per-school un-telegraphed boss cap at floor f (undefined = default bossPlain). */
export const plainAt12h = (f: number, lean?: string): number | undefined => { const t = lean ? DEEP12G.plainS[lean] : undefined; if (t == null) return undefined; const r = Math.min(1, Math.max(0, f - DEEP12G.from) / 60); return Math.min(CP9.bossAtk, CP9.bossPlain + (t - CP9.bossPlain) * r); };
/** rc12h（自訂）: extra potion cooldown at floor f. */
export const potCdAt12h = (f: number, lean?: string): number => { const t = lean ? DEEP12G.potS[lean] : undefined; return t ? Math.round(t * Math.min(1, Math.max(0, f - DEEP12G.from) / 60)) : 0; };

/** rc12j item 4（自訂）: arcane/oc boss HP × aoBossHp F30–65, linear back to ×1 at F100 (keeps the preset-hint F100 rate near rc12i). */
/** rc12l 製作人（自訂）: oc-lean boss HP × this F30–65 instead of aoBossHp (1 = rc12j's 0.8 removed for oc; arcane unchanged). */
export const OC12L = { bossHp: num('SIM_AOBOSSHP_OC') ?? 1, /** rc12l（自訂）: oc boss adb × 1 at F70, linear to × dmg100 at F100. */ dmg100: num('SIM_OCDMG100') ?? 1.5, /** rc12l（自訂）: oc boss un-telegraphed per-turn cap at F100 (bossPlain at F70, linear; ≤ bossAtk). */ plain100: num('SIM_OCPLAIN100') ?? 0.3 };
export const ocPlain12l = (F: number): number | undefined => OC12L.plain100 > 0 && F >= 70 ? Math.min(CP9.bossAtk, CP9.bossPlain + (OC12L.plain100 - CP9.bossPlain) * Math.min(1, (F - 70) / 30)) : undefined;
export const ocDmg12l = (F: number): number => F < 70 ? 1 : 1 + (OC12L.dmg100 - 1) * Math.min(1, (F - 70) / 30);
/** rc12m（自訂，預設開啟）: run-wide pressure for all four schools (producer scope change; supersedes the oc-only OC12M flag).
 *  Per school: drop = battle potion-drop chance ×, chest = chest health-potion chance ×, elite = elite +1 potion chance,
 *  rest = rest-node heal ×, mobHp/mobDmg = non-boss monster × at F100 (×1 up to mobFrom, linear), deepK = deep boss curve k
 *  (undefined = DEEP12G default; SIM_DEEP_<S> still overrides). bossHp (rc12n) = oc boss HP × F30–65. hit: one boss hit (incl. charged) ≤ hit × max HP. Merchant stays 1 potion.
 *  SIM_RUN12M=0 = rc12l behaviour; SIM_R12M_<KEY>_<SCHOOL> overrides one coefficient (sim sweeps). */
export const R12M_SCHOOLS = ['blade', 'bulwark', 'oc', 'arcane'] as const;
export const R12M_KEYS = ['drop', 'chest', 'elite', 'rest', 'mobHp', 'mobDmg', 'deepK', 'bossHp', 'bossHp70', 'bossDmg70'] as const;
type R12MK = (typeof R12M_KEYS)[number];
const R12M_BASE: Record<string, Partial<Record<R12MK, number>>> = {
  blade: { drop: 0.3, chest: 0.3, elite: 0.2, rest: 0.5, mobHp: 3.5, mobDmg: 3.5 }, // rc12n（自訂）: retuned with lean-correct sim (was 0.5/0.5/0.4/0.7/1/1)
  bulwark: { drop: 0.2, chest: 0.2, elite: 0, rest: 0.4, mobHp: 3.5, mobDmg: 3.5, deepK: 10 },
  oc: { drop: 0.4, chest: 0.4, elite: 0.3, rest: 0.6, mobHp: 1.3, mobDmg: 1.3, deepK: 1, bossHp: 0.7 }, // rc12n（自訂）: bossHp = oc boss HP × F30–65 (fades to ×1 by F100 with aoBossHp12j)
  arcane: { drop: 1, chest: 1, elite: 0.5, rest: 1, mobHp: 1, mobDmg: 1 },
};
/** rc12o（自訂）: overrides on top of R12M_BASE while RUN12O is on (SIM_RUN12O=0 = exact rc12n). Boss reward potions replace scattered
 *  drop/chest potions (RUN12O.scatter); deepK/mob* push late pressure, bossHp/bossHp70 keep F30+ boss fights ≤18 turns. */
const R12O_BASE: Record<string, Partial<Record<R12MK, number>>> = {
  // rc12p（自訂）: retuned after the capped preview (★ no longer over-defends) + 1 deterministic boss potion; rc12o values in docs/hv-v3-rc12p.md
  // rc12q（自訂）: retuned on top of the fixed ★ estimate (9a810c7); rc12p values: blade 12/12/33/0.3, bulwark deepK 20, arcane 3/3/—
  blade: { mobHp: 15, mobDmg: 15, /* rc12t（自訂）: 13→15 offsets post-win heal */ deepK: 55, bossHp70: 0.4 /* rc12u（自訂）: deepK 12→55, bossHp70 0.2→0.4 */ }, // rc12s（自訂）: 11→13 after the 30% normal-charge cap (blade sim floorMed 70.5 → 67)
  bulwark: { mobHp: 1.5 /* rc12u（自訂）: 21→1.5 (net ≤0.3/normal fight) */, mobDmg: 21, /* rc12t（自訂）: 16→21 offsets post-win heal + boss HP 0.3 */ deepK: 60 /* rc12u（自訂）: 30→60 */ }, // rc12s（自訂）: deep suppression (rc12q 9/9/15; with the 30% cap floorMed 92 → 66)
  oc: { mobHp: 1.5, mobDmg: 7 /* rc12v（自訂）: mobHp 2→1.5; rc12u 5/5→2/7 */, /* rc12t（自訂）: 3.5→5 */ deepK: 5 /* rc12v（自訂）: 2.2→5 */, bossHp: 0.5, bossHp70: 0.5 },
  arcane: { deepK: 14 /* rc12v（自訂）: 18→14 */, mobHp: 2.9, mobDmg: 3.3 /* rc12t（自訂）: 2.6/3→2.9/3.3 */ /* rc12s（自訂）: mobHp 2.5→2.6 mild deep suppression */, bossHp: 0.6, bossHp70: 1.2 }, // rc12q（自訂）: bossHp = arcane boss HP × (aoBossHp 0.8 ×) F30–65, pre-F50 deaths were boss fights
};
/** env SIM_R12M_<KEY>_<SCHOOL> always wins over the rc12o layer. */
const R12O_ENV = new Set(R12M_SCHOOLS.flatMap((sc) => R12M_KEYS.filter((k) => num(`SIM_R12M_${k.toUpperCase()}_${sc.toUpperCase()}`) !== null).map((k) => `${sc}.${k}`)));
export const RUN12M = {
  on: (num('SIM_RUN12M') ?? 1) === 1, mobFrom: num('SIM_R12M_MOBFROM') ?? 30, hit: num('SIM_R12M_HIT') ?? 0.4,
  school: Object.fromEntries(R12M_SCHOOLS.map((sc) => [sc, Object.fromEntries(R12M_KEYS.map((k) => [k, num(`SIM_R12M_${k.toUpperCase()}_${sc.toUpperCase()}`) ?? R12M_BASE[sc]![k]]))])) as Record<string, Partial<Record<R12MK, number>>>,
};
export const r12m = (lean: string | null | undefined, k: R12MK): number => ((RUN12M.on && lean ? (RUN12O.on && !R12O_ENV.has(`${lean}.${k}`) ? R12O_BASE[lean]?.[k] : undefined) ?? RUN12M.school[lean]?.[k] : undefined) ?? 1) * (RUN12O.on && RUN12M.on && (k === 'drop' || k === 'chest') ? RUN12O.scatter : 1);
/** rc12o（自訂，預設開啟；SIM_RUN12O=0 = rc12n）: feel pass. scatter = battle-drop / chest potion chance × (potions move to boss kills);
 *  bossPot = health potions every abyss boss kill from bossPotFrom; bossGear = extra guaranteed piece (guaranteeQuality, +1 quality bump)
 *  per abyss boss kill; arcHp = arcane max-HP floor × refHp9(depth) (less drop-dependent). */
/** rc12u（自訂，非原版）: addHpK = how much of the normal-fight mob12m HP layer the ADDS in a boss fight get (0 = none, 1 = rc12t).
 *  Diagnosis (scripts/rc12u-bossdiag.ts): bulwark F35–65 boss fights spent ~55% of turns hitting adds whose HP carried mobHp ×21.
 *  elitePotFrom = abyss depth from which an elite win gives elitePot health potions (deterministic). */
export const RUN12U = { addHpK: num('SIM_R12U_ADDHPK') ?? 0, addDmgK: num('SIM_R12U_ADDDMGK') ?? 1, elitePot: num('SIM_R12U_ELITEPOT') ?? 1, elitePotFrom: num('SIM_R12U_ELITEPOTFROM') ?? 15, /** rc12v（自訂）: elite potion drop chance, one rule for all schools */ elitePotP: num('SIM_R12U_ELITEPOTP') ?? 0.35 };
export const RUN12O = { on: (num('SIM_RUN12O') ?? 1) === 1, scatter: num('SIM_R12O_SCATTER') ?? 0, bossPot: num('SIM_R12O_BOSSPOT') ?? 1 /* rc12p: deterministic 1 per boss（自訂） */, bossPotFrom: num('SIM_R12O_BOSSPOTFROM') ?? 25, bossGear: num('SIM_R12O_BOSSGEAR') ?? 1, arcHp: num('SIM_R12O_ARCHP') ?? 1.03 };
/** rc12o（自訂）: boss HP / dmg × bossHp70 / bossDmg70 from F70 (linear in from F65). */
export const boss70 = (F: number, lean: string | null | undefined, k: 'bossHp70' | 'bossDmg70'): number => F <= 65 ? 1 : 1 + (r12m(lean, k) - 1) * Math.min(1, (F - 65) / 5);
export const r12mDeepK = (lean?: string): number | undefined => (RUN12M.on && lean ? (RUN12O.on && !R12O_ENV.has(`${lean}.deepK`) ? R12O_BASE[lean]?.deepK : undefined) ?? RUN12M.school[lean]?.deepK : undefined);
/** rc12q CANDIDATE（自訂，預設關；SIM_RUN12Q=1 開）: blade bimodal fix. Blade clears were legend-OC snowballs from boss offers (O8/O9),
 *  early deaths were mid-run attrition. legend = blade boss-offer legend weight ×; bossHp = blade boss HP × F30–65 (fades to ×1 at F70);
 *  mobFrom = blade mob ramp start (instead of RUN12M.mobFrom). OFF = exact rc12p. */
export const RUN12Q = { on: (num('SIM_RUN12Q') ?? 0) === 1, legend: num('SIM_R12Q_LEGEND') ?? 0.1, bossHp: num('SIM_R12Q_BOSSHP') ?? 1, mobFrom: num('SIM_R12Q_MOBFROM') ?? 50 };
export const blade12q = (lean: string | null | undefined): boolean => RUN12Q.on && lean === 'blade';
export const bladeBossHp12q = (F: number, lean: string | null | undefined): number => !blade12q(lean) || F < 30 ? 1 : F <= 65 ? RUN12Q.bossHp : RUN12Q.bossHp + (1 - RUN12Q.bossHp) * Math.min(1, (F - 65) / 5);
export const mob12m = (F: number, lean: string | null | undefined, k: 'mobHp' | 'mobDmg'): number => { const from = blade12q(lean) ? RUN12Q.mobFrom : RUN12M.mobFrom; return !RUN12M.on || F <= from ? 1 : 1 + (r12m(lean, k) - 1) * Math.min(1, (F - from) / (100 - from)); };
export const aoBossHp12j = (F: number, lean?: string): number => { const h = lean === 'oc' ? OC12L.bossHp * r12m(lean, 'bossHp') : DEEP12G.aoBossHp * r12m(lean, 'bossHp') /* rc12q（自訂）: arcane bossHp coefficient too */; return F < 30 ? 1 : F <= 65 ? h : h + (1 - h) * Math.min(1, (F - 65) / 35); };
/** rc12i（自訂）: bulwark-lean boss HP multiplier at floor F (×bwBossHp F30–65, then linear to ×bwBoss100 at F100). */
/** rc12k item 1（製作人，自訂）: after F65 the rise is geometric (same × per floor, ≈ ×1.43 / 5 floors at 0.2→2.5) instead of linear,
 *  so F65→F70 is no longer a ×2.6 step. SIM_BWLINEAR=1 = the rc12i linear ramp (comparison only). */
export const bwBossHp12i = (F: number): number => { const h = DEEP12G.bwBossHp, a = DEEP12G.bwBossFlat, e = DEEP12G.bwBoss100; if (F < DEEP12G.bwBossFrom) return 1; if (F <= a) return h; const r = Math.min(1, (F - a) / (100 - a)); return num('SIM_BWLINEAR') === 1 || h <= 0 || e <= 0 ? h + (e - h) * r : h * (e / h) ** r; };
/** rc12i（自訂）: bulwark boss-cap factor at floor F. */
export const bwCap12i = (F: number): number => { const h = DEEP12G.bwCap, a = DEEP12G.bwBossFlat; return F < DEEP12G.bwBossFrom ? 1 : F <= a ? h : h + (1 - h) * Math.min(1, (F - a) / (100 - a)); };
