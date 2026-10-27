import { BOSS_SEP, markDuplicates } from './names';
import { AFFIX_IDS, BOSS_BY_FLOOR, CP5, CP5_FORCE, type AffixId, type Cp5Mon, affixWeight, applyAffixes, compatible, themeOf, themeWeight } from './cp5';
import { CONSTANTS as C } from './data/constants';
import { attrCost, monsterExp } from './formulas';
import { type Equip, type Quality, QUALITIES, generateEquip, sellPrice } from './items';
import { buildMonster, pickRows, pickTop, plWindow, type Monster, type MonsterPool, type Rank } from './monsters';
import { type Player, type Prof, PROFS, allocate, equip, derive, level, profValue, powerScore } from './player';
import { Rng } from './rng';
import { CP7, betterThanWorn, pityPiece, pityWeapon } from './cp7';
import { CP8, cp8ThemeDmg, startBuffs } from './cp8';
import { openOffer } from './buffoffer';
import type { MonsterRow } from './monsters';
import { type NodeType, type Tower, TOWER, floorLevel, floorPl, generateTower } from './tower';
import { F3_GIFT, F3_GIFT_POTIONS, STARTER_POTIONS, TIPS, carryMult, has, prog, tip, unlock } from './progress';
import type { BattleState, PotionId } from './battle';
import { combos, formed, schoolCounts, sumMods } from './buffs';
import { ABYSS, abyssCarry, titleFor, abyssBaseLevel, abyssMonLevel, abyssFloor, abyssMult, abyssPl, affixCount, bossAffixCount, bossKey, guaranteeQuality, pickAffixes, themeKey, TRIPLE_BANNED, type AbyssSchool } from './abyss';

/** Approved design defaults + provisional tuning. */
export const RULES = {
  dropAccel: 8,
  /** CP3: EXP multiplier back to the original x1 (P-exp-multiplier). Early pacing comes from the trip carry-back multiplier. */
  expMult: C['P-exp-multiplier'].value.playerMultipliers,
  /** 暫定 (gameplay layer, CP3-2; CP3-fix 3 was 5/2): boss / elite kill EXP multipliers (no findings source). */
  /** 暫定 (CP3-fix 8): extra boss phases (see battle.ts BOSS_PHASE_HP). */
  bossPhases: 1,
  /** 暫定 (CP3-bugfix 4, gameplay layer): monster level follows the player: + round(k × max(0, playerLv − free)). No source. */
  monLvFollow: { k: 0.8, free: 4, bossHp: 0.18 },
  /** rc11 (OFF, producer decision): findings 003 §1.1 — Crude/Fair/Average drop "Level Unassigned" (synced to the player's level when first worn),
   *  Superior+ get the player's current level at drop. ON = main-tower loot level = player level at run start. OFF = floorLevel(floor) (rc10). */
  lootPlayerLevel: false,
  /** 暫定 (CP3-fix 10): boss battles open with this much OC once Spirit Stance is unlocked (sourced start OC 0 and entry 50 unchanged). */
  bossOpenOc: 50,
  rankExp: { boss: 8, elite: 3, normal: 1 },
  /** 暫定 (CP3-4): in-tower merchant sells equipment at sellPrice x this (no source for an equipment shop price). */
  merchantMarkup: 1.25, // CP3-fix 1: was 3.5 (Average ~8,845 C, about 5 trips of income)
  death: { exp: 0.5, credits: 0.5, keepBestItems: 1, loseConsumables: true },
  potionPrice: { health: 50, mana: 100, spirit: 100 } as Record<PotionId, number>,
  restHeal: 0.5,
  floorCredits: 15,
  /** 暫定 (round 5): at least one equipment drop is guaranteed by this floor. */
  earlyEquipByFloor: 4,
  /** CP4 feature flag (docs/cp4-run-buffs.md §11). Off = identical to tag cp3-pass. On by default since cp4-pass (2026-10-25). */
  cp4RunBuffs: true, // CP4 accepted 2026-10-25 (cp4-pass): run buffs on by default
  /** CP4 decision 5 (暫定): boss max HP × (1 + k × buffs held). Gameplay layer, monsters.json untouched. */
  cp4BossHpPerBuff: 0.06,
  /** CP5 feature flag (docs/cp5-bosses-floors.md). Off = identical to the CP4 baseline. On by default since cp5-pass (2026-10-26). */
  cp5Bosses: true, // CP5 accepted 2026-10-26 (cp5-pass): bosses/floors on by default
  /** CP6 feature flag (docs/cp6-abyss.md §9). Off = identical to cp5-rc. `?cp6` in the URL turns it on (implies cp5Bosses). */
  cp6Abyss: true, // CP6 accepted (cp6-pass): default on
  /** CP7 手感 feature flag (docs/cp7-feel.md). Off = identical to cp6-pass. On by default since cp7-pass. */
  cp7: true, // CP7 accepted (cp7-pass): default on
  /** CP8 真實遊玩 flag (docs/cp8-real-play.md). Off = identical to cp7-pass. `?cp8` in the URL turns it on. */
  cp8: false,
};

export interface Shrine { id: 'might' | 'vigor' | 'gamble'; zh: string; desc: string }
export const SHRINES: Shrine[] = [
  { id: 'might', zh: '力量祝福', desc: '本趟攻擊與法術傷害 +15%' },
  { id: 'vigor', zh: '生命祝福', desc: '本趟最大 HP +20%，並回滿 HP' },
  { id: 'gamble', zh: '血之賭注', desc: '失去 30% 目前 HP，換一件優良以上裝備' },
];

export interface MerchantStock { equips: { e: Equip; price: number }[] }

export interface RunState {
  seed: number;
  /** CP3-bugfix 4: player level at trip start (monster level follow). */
  plv?: number;
  rng: number;
  tower: Tower;
  floor: number;
  /** Index of the chosen option on each cleared floor. */
  path: number[];
  hp: number; mp: number; sp: number;
  bonus: { dmg: number; hp: number };
  bag: Equip[];
  exp: number;
  credits: number;
  profExp: Partial<Record<Prof, number>>;
  kills: number;
  current: { type: NodeType; option: number } | null;
  merchant: MerchantStock | null;
  done: 'clear' | 'dead' | 'retreat' | null;
  /** Some equipment has dropped this run (early-loot guarantee). */
  foundEquip?: boolean;
  /** CP3: 1-based trip number (carry-back multiplier) and pending unlock / tutorial messages for the UI. */
  trip?: number;
  /** CP7 P1: better-than-worn drops this trip (counted at drop time). */
  upg?: number;
  tutorial?: boolean;
  /** Next elite is picked with an elemental weakness (CP3-7 grimoire lesson). */
  weakNext?: boolean;
  notes?: string[];
  /** CP4 (flag): buff ids held this run. Cleared every run, never written to Player. */
  buffs?: string[];
  /** CP4: open pick-one offer, offer stream counter, pending extra offers (boss gives 2). */
  offer?: { src: 'shrine' | 'elite' | 'boss'; ids: string[] } | null;
  offerN?: number;
  offersLeft?: number;
  /** cp8-rc5: start-pick offer set aside when the player went into a node first (「待選」, pickable any time this trip) + offers still owed. */
  held?: { src: 'shrine' | 'elite' | 'boss'; ids: string[] } | null;
  heldLeft?: number;
  /** CP4: elite wins this trip (for winOffers) */
  eliteWins?: number;
  /** CP4 step 4: shrine risk shown, curse mitigation penalty, next battle opens at OC 0. */
  risk?: import('./buffoffer').RiskId | null;
  curse?: number;
  ocZeroNext?: boolean;
  buffStock?: { id: string; price: number }[];
  /** CP4-rc-fix 3: non-stackable buffs already shown by a merchant this trip (never listed again). */
  merchantSeen?: string[];
  /** CP5 (flag): this run uses the 20-floor tower and CP5 mechanics; f10 = the floor-10 boss was beaten this run. */
  cp5?: boolean;
  f10?: boolean;
  /** CP5: player bleed / burn carried between battles (cleared by rest, health potion, defend). */
  pdot?: import('./cp5').PDot;
  /** CP8: ids of drops auto-worn this run (CP8.autoWear). */
  worn?: string[];
  /** CP8 P3: the start-buff picks are still open (map screen shows them before the first node). */
  startPick?: boolean;
  /** CP8 P2: 戰力 (powerScore) at run start, for the settlement screen. */
  pw0?: number;
  /** CP6 (flag): abyss trip; start = depth of floor 1. Depth of the current floor = start + floor − 1. */
  abyss?: { start: number; /** highest milestone depth already claimed (record) */ ms?: number; /** titles earned this trip */ titles?: string[] };
}

export function startRun(p: Player, seed: number): RunState {
  const rng = new Rng(seed);
  const g = prog(p);
  const trip = g.trips + 1;
  const notes: string[] = [];
  if (trip >= 2) { const m = unlock(p, 'shrine'); if (m) notes.push(m + '（本趟保證出現 1 個神龕）'); }
  // CP3-fix 2: before the town shop opens there is no way to restock, so top up to the starter stock.
  if (!has(p, 'shop')) for (const k of Object.keys(STARTER_POTIONS) as PotionId[]) p.potions[k] = Math.max(p.potions[k], STARTER_POTIONS[k]);
  const tutorial = !has(p, 'spell');
  const locked: NodeType[] = [];
  if (!has(p, 'shrine')) locked.push('shrine');
  if (!has(p, 'merchant')) locked.push('merchant');
  const tower = generateTower(rng, { tutorial, locked, shrine: notes.length > 0, ...(RULES.cp5Bosses ? { long: true } : {}), ...(RULES.cp6Abyss ? { distinct: true } : {}), ...(RULES.cp8 ? { restBeforeBoss: true } : {}) });
  const d = derive(p);
  return {
    seed, plv: level(p), rng: rng.state, tower, floor: 1, path: [], hp: d.hp, mp: d.mp, sp: d.sp, bonus: { dmg: 0, hp: 0 },
    bag: [], exp: 0, credits: 0, profExp: {}, kills: 0, current: null, merchant: null, done: null, trip, tutorial, notes,
    ...(RULES.cp4RunBuffs ? { buffs: [] as string[] } : {}),
    ...(RULES.cp5Bosses ? { cp5: true } : {}),
    ...(RULES.cp8 ? { pw0: powerScore(d) } : {}),
  };
}

/** CP6: abyss depth of the current floor (0 = not an abyss run). */
export const depthOf = (run: RunState): number => (run.abyss ? run.abyss.start + run.floor - 1 : 0);
/** CP6: unlocked by the first full 20-floor clear (doc §4; Arena 'clear the previous stage' rule, findings 003 §3.2(2)). */
export const abyssOpen = (p: Player): boolean => !!(prog(p) as { abyssOpen?: boolean }).abyssOpen;
/** CP6: start an abyss trip at depth `start` (a checkpoint). Uses CP5 mechanics; does not count as a main-tower trip. */
export function startAbyss(p: Player, seed: number, start = 1, ms = 0): RunState {
  const rng = new Rng(seed);
  const d = derive(p);
  const tower: Tower = { floors: [abyssFloor(rng, start, 1)] };
  const run: RunState = {
    seed, plv: level(p), rng: rng.state, tower, floor: 1, path: [], hp: d.hp, mp: d.mp, sp: d.sp, bonus: { dmg: 0, hp: 0 },
    bag: [], exp: 0, credits: 0, profExp: {}, kills: 0, current: null, merchant: null, done: null, trip: 99, notes: [],
    ...(RULES.cp4RunBuffs ? { buffs: [] as string[] } : {}), cp5: true, abyss: { start, ms, titles: [] },
    ...(RULES.cp8 ? { pw0: powerScore(d) } : {}),
  };
  // CP8 P3 (暫定 N): from a checkpoint, pick startBuffs(start) run buffs from the CP4 pool before the first floor.
  const n = RULES.cp8 && RULES.cp4RunBuffs ? startBuffs(start) : 0;
  if (n > 0) { run.startPick = true; run.offersLeft = n - 1; openOffer(p, run, 'boss'); }
  return run;
}
/** CP6: monster / item / merchant / chest level at the current depth (r2 decision 7: one formula). */
/** CP6: carry-back multiplier an abyss run would get if it ended now (same as settle). */
/** rc5 (a): floor number shown in titles — absolute abyss depth in the abyss, tower floor otherwise. */
export const floorLabel = (run: RunState): number => (run.abyss ? depthOf(run) : run.floor);
/** rc5 (c): new-record notice; the record counts depths cleared. */
/** cp8-rc9 P1-10: one wording everywhere — 「到達第 N 層（已通過 M 層）」 (reached = the depth stood on, passed = depths cleared). */
export const reachedMsg = (reached: number, passed: number, abyss = true): string => `到達${abyss ? '深淵' : ''}第 ${reached} 層（已通過 ${passed} 層）`;
export const abyssBestMsg = (n: number): string => `深淵新紀錄：${reachedMsg(n + 1, n, false)}`;
/** rc5 (d): on death, say what the run had so a +0 result (died before any reward) is explained. */
export const deathCarryMsg = (exp: number, credits: number): string => `戰死：本趟累積 ${exp} EXP、${credits} C，帶回 ${Math.round(RULES.death.exp * 100)}%${exp || credits ? '' : '（本趟尚未獲得任何獎勵）'}`;
export const abyssCarryAt = (run: RunState): number => abyssCarry(depthOf(run));
/** rc5: monster-level follow added on top of the depth base (the map used to show the base only: d16 'Lv71' while the fight is Lv80 for a Lv15 player). */
export const abyssLvFollow = (run: RunState): number => Math.round(ABYSS.lvFollowK * Math.max(0, (run.plv ?? 0) - RULES.monLvFollow.free));
export const abyssLevel = (run: RunState): number => abyssMonLevel(depthOf(run), run.plv ?? 0, abyssLvFollow(run));
/** CP6: deepest depth cleared by a finished abyss run. */
export function abyssCleared(run: RunState): number {
  if (!run.abyss) return 0;
  return depthOf(run) - 1;
}
/** CP6: record key = first formed CP4 school, else none. */
export const abyssSchool = (run: RunState): AbyssSchool => (formed(run.buffs ?? [])[0] as AbyssSchool | undefined) ?? 'none';

/** CP3: called when a node is entered. Unlocks and one-time tutorial tips; returns the messages to show. */
export function enterNode(p: Player, run: RunState, type: NodeType): string[] {
  const out: string[] = [];
  const push = (m: string | null) => { if (m) out.push(m); };
  const f = run.floor;
  if (type === 'battle' || type === 'elite' || type === 'boss') { push(unlock(p, 'defend')); push(unlock(p, 'potion')); push(tip(p, 'f1', TIPS.f1)); }
  if (f >= 2) { push(unlock(p, 'ocSkill')); push(tip(p, 'f2', TIPS.f2)); }
  if (type === 'merchant' && run.tutorial && f === 3) {
    push(unlock(p, 'spell')); push(unlock(p, 'merchant'));
    const t = tip(p, 'f3', TIPS.f3);
    if (t) { push(t + `（+${F3_GIFT} 金、生命藥水 +${F3_GIFT_POTIONS}）`); run.credits += F3_GIFT; p.potions.health += F3_GIFT_POTIONS; run.weakNext = true; }
  }
  if (f >= 4) push(unlock(p, 'spirit'));
  run.notes = [...(run.notes ?? []), ...out];
  return out;
}

/** Battle-time locks for systems not yet opened (CP3-7). */
export function battleLocks(p: Player): { skill: boolean; spell: boolean; spirit: boolean } {
  return { skill: !has(p, 'ocSkill'), spell: !has(p, 'spell'), spirit: !has(p, 'spirit') };
}

/** CP3-fix 10: run buff "首領戰意" — opening OC for a battle of this node type. */
export function openingOc(p: Player, type: NodeType, run?: RunState): number {
  const base = type === 'boss' && has(p, 'spirit') ? RULES.bossOpenOc : 0;
  if (RULES.cp4RunBuffs && run?.ocZeroNext) return 0;
  if (!cp4On(run)) return base;
  const b = sumMods(run!.buffs!).b;
  return base + (type === 'boss' ? (b.bossOc ?? 0) : (b.ocOpen ?? 0));
}

/** CP4: flag on and the run holds buffs. */
export const cp4On = (run?: RunState): boolean => RULES.cp4RunBuffs && !!run?.buffs?.length;

/** CP4: attach run-buff battle mods (combo triggers included). No-op with the flag off. */
export function armBattle(b: BattleState, run: RunState): void {
  if (!RULES.cp4RunBuffs) return;
  if (run.ocZeroNext) { run.ocZeroNext = false; b.oc = 0; }
  if (!cp4On(run)) return;
  const ids = run.buffs!;
  b.mods = { ...sumMods(ids).b, combo: combos(ids), ...(schoolCounts(ids).bulwark ? { bulwarkN: schoolCounts(ids).bulwark } : {}) };
}

export function withRng<T>(run: RunState, f: (r: Rng) => T): T {
  const r = new Rng(1);
  r.state = run.rng;
  const out = f(r);
  run.rng = r.state;
  return out;
}

/** Derived stats with run bonuses applied. */
export function runDerived(p: Player, run: RunState) {
  const d = derive(p);
  const out = { ...d, adb: d.adb * (1 + run.bonus.dmg), mdb: d.mdb * (1 + run.bonus.dmg), hp: Math.round(d.hp * (1 + run.bonus.hp)) };
  if (!cp4On(run)) return out;
  // CP4 step 2: run-buff derived mods (doc §1 variables only; all values 暫定).
  const m = sumMods(run.buffs!).d;
  const cap = (x: number) => Math.min(1, x);
  out.adb *= 1 + (m.adbPct ?? 0); out.mdb *= 1 + (m.mdbPct ?? 0);
  out.hp = Math.round(out.hp * (1 + (m.hpPct ?? 0))); out.mp = Math.round(out.mp * (1 + (m.mpPct ?? 0))); out.sp = Math.round(out.sp * (1 + (m.spPct ?? 0)));
  out.physAcc *= 1 + (m.physAccPct ?? 0); out.magAcc *= 1 + (m.magAccPct ?? 0);
  out.physCrit = cap(out.physCrit + (m.physCrit ?? 0)); out.magCrit = cap(out.magCrit + (m.magCrit ?? 0));
  out.critMod += m.critMod ?? 0; out.spellCritMod += m.spellCritMod ?? 0;
  out.evade = cap(out.evade + (m.evade ?? 0)); out.parry = cap(out.parry + (m.parry ?? 0)); out.block = cap(out.block + (m.block ?? 0));
  out.physMit = Math.min(0.9, out.physMit + (m.physMit ?? 0)); out.magMit = Math.min(0.9, out.magMit + (m.magMit ?? 0));
  if (m.specMitAll) out.specMit = Object.fromEntries(Object.entries(out.specMit).map(([k, v]) => [k, v + m.specMitAll!])) as typeof out.specMit;
  if (m.edb || m.edbAll) out.edb = Object.fromEntries(Object.entries(out.edb).map(([k, v]) => [k, v + (m.edbAll ?? 0) + ((m.edb as Record<string, number> | undefined)?.[k] ?? 0)])) as typeof out.edb;
  out.manaCons = Math.min(0.5, out.manaCons + (m.manaCons ?? 0));
  out.counterResist += m.counterResist ?? 0;
  if (run.curse) { out.physMit = Math.max(0, out.physMit - run.curse); out.magMit = Math.max(0, out.magMit - run.curse); }
  return out;
}

const ELEM_COLS = [9, 10, 11, 12] as const; // cold, wind, elec, fire in monsters.json rows
/** CP3-7: an elite row with a negative elemental resistance, nearest the window (monster data unchanged). */
function weakRow(pool: MonsterPool, lo: number, hi: number) {
  const weak = pool.rows.filter((r) => ELEM_COLS.some((c) => (r[c] as number) < 0));
  if (!weak.length) return null;
  const mid = (lo + hi) / 2;
  return weak.reduce((a, r) => (Math.abs(r[3] - mid) < Math.abs(a[3] - mid) ? r : a));
}

/** CP3-bugfix 4 (暫定): floor monster level, raised when the player out-levels the floor. */
export function monsterLevel(run: RunState): number {
  const { k, free } = RULES.monLvFollow;
  return floorLevel(run.floor) + Math.round(k * Math.max(0, (run.plv ?? 0) - free));
}
export function encounter(run: RunState, pool: MonsterPool, type: NodeType): Monster[] {
  const ab = depthOf(run);
  /** CP6: CP5 key floor (boss signature / theme) for this depth. */
  const f = ab ? (type === 'boss' ? bossKey(ab) : themeKey(ab)) : run.floor;
  const L = ab ? abyssLevel(run) : monsterLevel(run);
  const { lo, hi } = plWindow(pool, ab ? abyssPl(ab) : floorPl(f));
  return withRng(run, (rng) => {
    const plan: Rank[] =
      type === 'boss' ? ['boss', 'normal'] /* 暫定 (round 6): floor-10 boss has at most 1 minion */ :
      type === 'elite' ? (run.weakNext || (run.cp5 && CP5.eliteSolo) ? ['elite'] /* 暫定 (CP3-7): tutorial elite fights alone */ : ['elite', 'normal']) :
      ['normal', 'normal'] /* 暫定 (CP2b/CP2c): at most 2 per wave on every floor (CP2c: floors 1-4 too, was 2-3) */;
    const th = run.cp5 && !CP5_FORCE.themeOff ? themeOf(f) : null;
    const w = th ? (r: MonsterRow) => themeWeight(th, r) : undefined;
    const out = plan.map((rank) => {
      const weak = rank === 'elite' && run.weakNext ? weakRow(pool, lo, hi) : null;
      const row = weak ?? (rank === 'normal' ? pickRows(rng, pool, lo, hi, 1, w)[0] : pickTop(rng, pool, lo, hi, w));
      const m = buildMonster(row!, rank === 'boss' ? L + 2 : rank === 'elite' ? L + 1 : L, rank);
      if (rank === 'boss') {
        m.phases = RULES.bossPhases;
        // CP3-bugfix 4 (暫定): boss HP grows with player level over the free level so trips 2+ last 10-15 turns.
        const g = 1 + RULES.monLvFollow.bossHp * Math.max(0, (run.plv ?? 0) - (floorLevel(ab ? 20 : run.floor) / 2 - 1)); // free level for bosses = half the floor level - 1
        m.maxHp = m.hp = Math.round(m.maxHp * g);
      }
      if (rank === 'boss' && run.cp5 && BOSS_BY_FLOOR[f]) m.name = `${BOSS_BY_FLOOR[f]!.title}${BOSS_SEP}${row![2]}`;
      if (rank === 'boss' && cp4On(run)) { m.maxHp = Math.round(m.maxHp * (1 + RULES.cp4BossHpPerBuff * run.buffs!.length)); m.hp = m.maxHp; }
      if (run.cp5) cp5Monster(rng, pool, lo, hi, L, f, m, w, ab);
      if (run.cp5 && !ab && type === 'boss' && rank === 'normal') m.adb *= CP5.bossMinionAdb[f] ?? 1; // CP5 rc2 fix 5
      if (ab) { const k = abyssMult(ab); m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * k.hp)); m.adb *= k.dmg * (rank === 'boss' ? (RULES.cp8 && ab === 25 ? CP8.boss25Dmg : ABYSS.bossDmgAt[ab] ?? 1) : 1);
        if (RULES.cp7 && type !== 'boss') m.adb *= 1 - CP7.themeK * (1 - (RULES.cp8 && ab > 20 ? cp8ThemeDmg(f) : CP7.themeDmg[f] ?? 1));
        if (ABYSS.physResScale !== 1) { m.physMit *= ABYSS.physResScale; for (const t of ['piercing', 'crushing', 'slashing'] as const) if (m.spec[t] > 0) m.spec[t] = Math.round(m.spec[t] * ABYSS.physResScale); } }
      return m;
    });
    if (type === 'elite') run.weakNext = false;
    markDuplicates(out.map((m) => m.name)).forEach((n, i) => { out[i]!.name = n; });
    return out;
  });
}

/** CP5: boss signature + summon reserve, elite affixes + split children. Only called with the flag on. */
function cp5Monster(rng: Rng, pool: MonsterPool, lo: number, hi: number, L: number, f: number, m: Monster, w?: (r: MonsterRow) => number, ab = 0): void {
  const x = m as Monster & Cp5Mon;
  if (m.rank === 'boss' && BOSS_BY_FLOOR[f]) {
    x.sig = BOSS_BY_FLOOR[f]!.sig; x.sigTurns = 0;
    const hk = CP5.bossHp[f] ?? 1, ak = CP5.bossAdb[f] ?? 1;
    if (hk !== 1) m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * hk));
    if (ak !== 1) m.adb *= ak;
    if (x.sig === 'summon') x.reserve = pickRows(rng, pool, lo, hi, CP5.summonMax, w).map((r) => Object.assign(buildMonster(r, L, 'normal'), { summoned: true }));
    // CP6 (暫定): bosses gain affixes from the 2nd rotation, never 法抗/反魔.
    if (ab && bossAffixCount(ab)) applyAffixes(m, pickAffixes(rng, bossAffixCount(ab), [...TRIPLE_BANNED, 'split']));
  }
  if (m.rank !== 'elite') return;
  if (CP5.eliteHp !== 1) m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * CP5.eliteHp));
  if (CP5.eliteAdb !== 1) m.adb *= CP5.eliteAdb;
  let ids: AffixId[];
  if (CP5_FORCE.affixes) ids = [...CP5_FORCE.affixes];
  else if (ab) ids = pickAffixes(rng, affixCount(rng, ab));
  else {
    ids = [rng.weighted(AFFIX_IDS.map((a) => [a, affixWeight(a)] as [AffixId, number]))];
    if (f >= CP5.eliteDoubleFloor && rng.chance(CP5.eliteDoubleChance)) ids.push(rng.weighted(AFFIX_IDS.filter((b) => compatible(ids[0]!, b, f)).map((a) => [a, affixWeight(a)] as [AffixId, number])));
  }
  if (ids.length > 1 && CP5.doubleHp !== 1) m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * CP5.doubleHp));
  if (ab && ids.length > 2) m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * ABYSS.tripleHp));
  if (ids.includes('split')) x.splitInto = pickRows(rng, pool, lo, hi, 2, w).map((r) => { const c = buildMonster(r, L, 'normal'); c.maxHp = c.hp = Math.max(1, Math.round(m.maxHp * CP5.splitHp)); return c; });
  applyAffixes(m, ids);
}

export interface Loot { equips: Equip[]; credits: number; potions: Partial<Record<PotionId, number>>; exp: number; /** rc10: ids of the boss's guaranteed pieces (UI label only; rc11 adds the main-tower clear-bonus piece). */ guaranteed?: string[]; /** CP7: id of the smart-loot pity piece (UI label). */ better?: string[] }

const LR = C['F-003-loot-rolls'].value;
export function equipDropChance(pl: number, accel = RULES.dropAccel): number {
  const drop = LR.baseDrop + Math.min(LR.plBonus.cap, Math.max(0, (pl - LR.plBonus.offset) / LR.plBonus.divisor));
  return drop * Math.min(1, LR.equipmentRoll * accel);
}

/** Quality floor rises every 5 floors (design §5). */
// 暫定 (round 5): floors 1-5 raised from crude to fair to speed early progression.
export const floorMinQuality = (_f: number): Quality => 'fair';

/** rc11: main-tower loot level (see RULES.lootPlayerLevel). */
/** CP7 decision 1: RULES.cp7 implies lootPlayerLevel (findings 003 §1.1), plus CP7.lootLvAdd (暫定) so main-tower gear keeps up with floor monsters. */
export const lootLevel = (run: RunState): number =>
  RULES.cp7 ? Math.max(1, (run.plv ?? 1) + CP7.lootLvAdd) : RULES.lootPlayerLevel ? Math.max(1, run.plv ?? 1) : floorLevel(run.floor);
/** cp7-rc3: drop level for every loot source (battle, chest, merchant, pity) under CP7 = player level + lootLvAdd, in the main
 *  tower AND the abyss. rc2 used abyssLevel (= player level, no +5) for abyss drops — playtest: drops mostly at player level. */
export const dropLevel = (run: RunState): number => RULES.cp7 ? lootLevel(run) : run.abyss ? abyssLevel(run) : lootLevel(run);
export function battleLoot(run: RunState, monsters: Monster[], type: NodeType, p?: Player): Loot {
  const ab = depthOf(run);
  const L = dropLevel(run);
  return withRng(run, (rng) => {
    const loot: Loot = { equips: [], credits: 0, potions: {}, exp: 0 };
    // CP5 r3 (暫定): a solo elite rolls the drop table once more for the missing normal add (producer decision 1).
    const extra = run.cp5 && type === 'elite' && CP5.eliteSolo && CP5.eliteExtraRoll && !monsters.some((m) => m.rank === 'normal')
      ? monsters.filter((m) => m.rank === 'elite').slice(0, 1).map((m) => ({ ...m, rank: 'normal' as Rank })) : [];
    for (const m of [...monsters, ...extra]) {
      loot.exp += Math.round(monsterExp(m.level, m.pl, RULES.expMult) * RULES.rankExp[m.rank]);
      const drop = LR.baseDrop + Math.min(LR.plBonus.cap, Math.max(0, (m.pl - LR.plBonus.offset) / LR.plBonus.divisor));
      if (rng.chance(drop)) {
        if (rng.chance(Math.min(1, LR.equipmentRoll * RULES.dropAccel * (cp4On(run) ? 1 + (sumMods(run.buffs!).r.dropAccelMult ?? 0) : 1)))) loot.equips.push(generateEquip(rng, L, { minQuality: floorMinQuality(run.floor) }));
        else {
          const k = rng.weighted<PotionId>([['health', 3], ['mana', 1], ['spirit', 1]]);
          loot.potions[k] = (loot.potions[k] ?? 0) + 1;
        }
      } else if (rng.chance(0.2)) loot.credits += Math.round((5 + m.level * 2) * (0.8 + rng.next() * 0.4));
    }
    if (type === 'elite') loot.equips.push(generateEquip(rng, L, { minQuality: 'fair', qualityBump: (run.floor > 5 ? 1 : 0) + (cp4On(run) ? sumMods(run.buffs!).r.qualityBump ?? 0 : 0) }));
    if (type === 'boss') {
      const n = ab ? ABYSS.bossDrops : run.floor >= 10 ? 3 : 2; // CP6 r2 decision 6 (暫定): abyss bosses 2 + guaranteed
      for (let i = 0; i < n; i++) loot.equips.push(generateEquip(rng, L, { minQuality: C['F-003-clear-bonus'].value.minQuality as Quality, qualityBump: i === 0 ? 1 : 0 }));
      // rc11: main tower — the first piece is the sourced clear-bonus guarantee (F-003-clear-bonus: 1 drop, Average+); label it 保底. Extra pieces are 暫定.
      if (!ab) (loot.guaranteed ??= []).push(loot.equips[loot.equips.length - n]!.id);
      loot.credits += 40 * run.floor;
      // CP6 decision 5: guaranteed piece every 5 depths, min quality from the original trophy table (Items.md).
      if (ab) { const g = generateEquip(rng, L, { minQuality: guaranteeQuality(ab) }); loot.equips.push(g); (loot.guaranteed ??= []).push(g.id); }
      // CP6 r2 decision 9 (暫定): first clear of every 10th depth → 1 more guaranteed piece + a title.
      if (ab && ab % ABYSS.milestoneEvery === 0 && ab > (run.abyss!.ms ?? 0)) {
        const g = generateEquip(rng, L, { minQuality: guaranteeQuality(ab) }); loot.equips.push(g); (loot.guaranteed ??= []).push(g.id);
        run.abyss!.ms = ab; (run.abyss!.titles ??= []).push(titleFor(ab));
        (run.notes ??= []).push(`里程碑：深淵 ${ab} 層，獲得稱號「${titleFor(ab)}」與 1 件保底裝備`);
      }
      // rc10: tell the player a checkpoint was passed (next trip may start right after it).
      if (ab && ab % ABYSS.checkpoint === 0) (run.notes ??= []).push(`檢查點：已通過深淵 ${ab} 層，回城後下一趟可從第 ${ab + 1} 層出發`);
    }
    loot.credits += RULES.floorCredits * run.floor;
    // 暫定 early-loot guarantee (round 5): the first won battle on floors 1-4 with no equipment found yet this run drops one.
    if (run.floor <= RULES.earlyEquipByFloor && !run.foundEquip && loot.equips.length === 0) loot.equips.push(generateEquip(rng, L, { minQuality: floorMinQuality(run.floor) }));
    if (loot.equips.length) run.foundEquip = true;
    if (RULES.cp7 && p) cp7Pity(rng, p, run, loot, L);
    return loot;
  });
}

/** CP7 P1: count better-than-worn drops this trip; add the smart-loot pity piece when needed (CP7.pityUntil). */
function cp7Pity(rng: Rng, p: Player, run: RunState, loot: Loot, L: number): void {
  let u = loot.equips.filter((e) => betterThanWorn(p, e)).length;
  if (u === 0 && (run.upg ?? 0) < CP7.pityUntil) {
    const e = pityPiece(rng, p, L) ?? pityWeapon(rng, p, L); // cp7-rc3: weapon fallback everywhere (was abyss only)
    if (e) { loot.equips.push(e); (loot.better ??= []).push(e.id); u = 1; }
  }
  run.upg = (run.upg ?? 0) + u;
}

export function chestLoot(run: RunState, p?: Player): Loot {
  const L = dropLevel(run); // CP6 r2 decision 7; cp7-rc3 +lootLvAdd in the abyss
  // design §5: chests drop 2-3 items (暫定 single-player acceleration).
  return withRng(run, (rng) => {
    const loot: Loot = {
      equips: Array.from({ length: rng.int(2, 3) }, () => generateEquip(rng, L, { minQuality: 'fair', qualityBump: (rng.chance(0.25) ? 1 : 0) + (cp4On(run) ? sumMods(run.buffs!).r.qualityBump ?? 0 : 0) })),
      credits: rng.int(10, 30) * run.floor, potions: rng.chance(0.5) ? { health: 1 } : {}, exp: 0,
    };
    if (RULES.cp7 && p) { cp7Pity(rng, p, run, loot, L); }
    return loot;
  });
}

export function applyLoot(p: Player, run: RunState, loot: Loot): void {
  run.bag.push(...loot.equips);
  if (RULES.cp8 && CP8.autoWear) for (const e of loot.equips) if (betterThanWorn(p, e)) {
    // CP8 P1 (暫定): wear a badged drop at once so it survives death; the replaced piece goes to the (persistent) inventory.
    equip(p, e); run.bag = run.bag.filter((x) => x !== e); (run.worn ??= []).push(e.id);
  }
  run.credits += loot.credits;
  run.exp += loot.exp;
  for (const [k, v] of Object.entries(loot.potions)) p.potions[k as PotionId] += v!;
}

export function finishBattle(p: Player, run: RunState, b: BattleState, monsters: Monster[], type: NodeType): Loot | null {
  run.hp = b.hp; run.mp = b.mp; run.sp = b.sp;
  p.potions = { ...b.potions };
  if (run.cp5) run.pdot = undefined; // CP5 rc2 fix 2: all DoTs end with the battle (was carried into the next fight)
  if (b.over !== 'win') { run.done = 'dead'; return null; }
  if (run.cp5 && type === 'boss' && run.floor === 10) run.f10 = true;
  run.kills += monsters.length;
  const loot = battleLoot(run, monsters, type, p);
  if (RULES.cp7 && run.abyss && CP7.winHeal > 0) { const d = runDerived(p, run); run.hp = Math.min(d.hp, run.hp + Math.round(d.hp * CP7.winHeal)); run.mp = Math.min(d.mp, run.mp + Math.round(d.mp * CP7.winHeal)); run.sp = Math.min(d.sp, run.sp + Math.round(d.sp * CP7.winHeal)); }
  // Proficiency EXP (002-02a): battle EXP x4, shared across what was used.
  const total = Object.values(b.used).reduce((a, c) => a + (c ?? 0), 0) || 1;
  for (const k of PROFS) {
    const u = b.used[k];
    if (u) run.profExp[k] = (run.profExp[k] ?? 0) + Math.round((loot.exp * C['002-02a'].value.proficiencyExpPerBattleExp * u) / total);
  }
  applyLoot(p, run, loot);
  return loot;
}

export function merchantStock(run: RunState): MerchantStock {
  const L = dropLevel(run); // CP6 r2 decision 7; cp7-rc3 +lootLvAdd in the abyss
  return withRng(run, (rng) => ({
    equips: [0, 1, 2].map((i) => {
      const e = generateEquip(rng, L, { minQuality: i === 0 ? 'average' : 'fair' });
      return { e, price: Math.round(sellPrice(e) * RULES.merchantMarkup * (cp4On(run) ? 1 + (sumMods(run.buffs!).r.priceMult ?? 0) : 1)) };
    }),
  }));
}

export function rest(p: Player, run: RunState, choice: 'heal' | 'upgrade', equipSlot?: string): string {
  const d = runDerived(p, run);
  if (choice === 'heal') {
    if (run.cp5) run.pdot = undefined;
    run.hp = Math.min(d.hp, run.hp + Math.round(d.hp * RULES.restHeal));
    run.mp = Math.min(d.mp, run.mp + Math.round(d.mp * RULES.restHeal));
    run.sp = Math.min(d.sp, run.sp + Math.round(d.sp * RULES.restHeal));
    return `回復 ${Math.round(RULES.restHeal * 100)}% HP／MP／SP`;
  }
  const e = p.equipped[equipSlot as keyof Player['equipped']];
  if (!e) return '沒有裝備可強化';
  e.iw++;
  return `${e.base} 強化至 +${e.iw}`;
}

export function shrine(p: Player, run: RunState, id: Shrine['id']): string {
  const d = runDerived(p, run);
  if (id === 'might') { run.bonus.dmg += 0.15; return '傷害 +15%'; }
  if (id === 'vigor') { run.bonus.hp += 0.2; run.hp = runDerived(p, run).hp; return '最大 HP +20%，HP 全滿'; }
  run.hp = Math.max(1, Math.round(run.hp - d.hp * 0.3));
  const e = withRng(run, (rng) => generateEquip(rng, RULES.cp7 ? dropLevel(run) : floorLevel(run.floor), { minQuality: 'superior' }));
  run.bag.push(e);
  return `獲得 ${e.quality} 裝備`;
}

export function advance(run: RunState, option: number): void {
  run.path.push(option);
  run.current = null;
  run.merchant = null;
  run.buffStock = undefined; // stale stock must not leak to the next node
  if (run.abyss) { const d = depthOf(run) + 1; withRng(run, (r) => run.tower.floors.push(abyssFloor(r, d, run.floor + 1))); run.floor++; return; }
  if (run.floor >= run.tower.floors.length) run.done = 'clear';
  else run.floor++;
}

export interface Settlement {
  outcome: 'clear' | 'dead' | 'retreat';
  /** cp8-rc9 P1-10: floors / depths cleared this trip. */
  passed?: number;
  exp: number; credits: number; kept: Equip[]; lost: number; lostItems: Equip[]; lostPotions: Partial<Record<PotionId, number>>; levelBefore: number; levelAfter: number;
  /** CP8 P2: what came back (戰力 at start → now, auto-worn drops, attribute points now affordable). */
  cp8?: { pw0: number; pw1: number; worn: string[]; attrPts: number };
  floor: number;
  /** CP3: carry-back multiplier applied and systems opened by this return. */
  mult: number; unlocks: string[];
  /** CP6 (abyss runs only): `floor` is then the abyss depth reached. */
  abyss?: boolean;
}

/** Apply the run result to the persistent character (design §8 death rules). */
export function settle(p: Player, run: RunState): Settlement {
  const outcome = run.done ?? 'retreat';
  const dead = outcome === 'dead';
  const before = level(p);
  const g = prog(p);
  const mult = run.abyss ? abyssCarryAt(run) : carryMult(run.trip ?? g.trips + 1);
  const exp = Math.round(run.exp * (dead ? RULES.death.exp : 1) * mult);
  const credits = Math.round(run.credits * (dead ? RULES.death.credits : 1) * mult);
  if (RULES.cp8) p.lastWorn = (run.worn ?? []).filter((id) => Object.values(p.equipped).some((e) => e?.id === id)); // cp8-rc3 item 2
  let kept = run.bag;
  let lostPotions: Partial<Record<PotionId, number>> = {};
  if (dead) {
    kept = [...run.bag].sort((a, b) => score(b) - score(a)).slice(0, RULES.death.keepBestItems);
    if (RULES.death.loseConsumables) { lostPotions = { ...p.potions }; p.potions = { health: 0, mana: 0, spirit: 0 }; }
  }
  p.exp = Math.round(p.exp + exp);
  p.credits += credits;
  for (const [k, v] of Object.entries(run.profExp)) p.profExp[k as Prof] += Math.round(v! * (dead ? RULES.death.exp : 1) * mult);
  p.inventory.push(...kept);
  if (!run.abyss) g.trips++;
  const unlocks: string[] = [];
  if (RULES.cp6Abyss && run.cp5 && !run.abyss && outcome === 'clear' && !abyssOpen(p)) { (g as { abyssOpen?: boolean }).abyssOpen = true; unlocks.push('深淵塔開放：城鎮可以進入無限層的深淵塔'); }
  if (g.trips >= 1) { const m = unlock(p, 'alloc'); if (m) unlocks.push(m); }
  if (g.trips >= 2) { const m = unlock(p, 'shop'); if (m) unlocks.push(m); }
  if (outcome === 'clear' || run.f10) { const m = unlock(p, 'iw'); if (m) unlocks.push(m + '（第一次免費）'); }
  return { outcome, exp, credits, mult, unlocks, kept, lost: run.bag.length - kept.length, lostItems: run.bag.filter((e) => !kept.includes(e)), lostPotions, levelBefore: before, levelAfter: level(p), floor: run.abyss ? depthOf(run) : run.floor, passed: run.abyss ? abyssCleared(run) : outcome === 'clear' ? run.floor : run.floor - 1, ...(run.abyss ? { abyss: true } : {}),
    ...(RULES.cp8 ? { cp8: { pw0: Math.round(run.pw0 ?? 0), pw1: Math.round(powerScore(derive(p))), worn: [...(run.worn ?? [])], attrPts: cp8AttrPts(p) } } : {}) };
}

/** CP8 P2: attribute points the 「自動分配」 logic could buy now (same greedy rule as the sim's autoAllocate). */
export function cp8AttrPts(p: Player): number {
  const t: Player = JSON.parse(JSON.stringify(p)); let n = 0;
  for (let g = 0; g < 2000; g++) { const a = (['str', 'dex', 'end', 'agi', 'int', 'wis'] as const).map((k) => [k, attrCost(t.attrs[k] + 1) - attrCost(t.attrs[k])] as const).sort((x, y) => x[1] - y[1])[0]!; if (allocate(t, a[0]) === 0) break; n++; }
  return n;
}
export function score(e: Equip): number {
  return QUALITIES.indexOf(e.quality) * 1000 + e.roll + e.level * 5 + e.iw * 200;
}

export { powerScore, profValue };

/** rc16 item 3（自訂，非原版）: drink a health potion on the map, no cooldown. parsed_wiki only describes Restoratives as Battle Items,
 *  so out-of-battle use is our own rule; the heal amount is the same as in battle. Returns HP gained (0 = nothing done). */
export const MAP_LOW_HP = 0.5; // 暫定: map warning below this HP fraction
export function mapPotion(p: Player, run: RunState): number {
  const d = runDerived(p, run);
  if (p.potions.health <= 0 || run.hp >= d.hp) return 0;
  const before = run.hp; p.potions.health--;
  run.hp = Math.min(d.hp, run.hp + Math.round(d.hp * C['F-002-items'].value.healthPotion.fraction));
  return run.hp - before;
}
