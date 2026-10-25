import { CONSTANTS as C } from './data/constants';
import { monsterExp } from './formulas';
import { type Equip, type Quality, QUALITIES, generateEquip, sellPrice } from './items';
import { buildMonster, pickRows, pickTop, plWindow, type Monster, type MonsterPool, type Rank } from './monsters';
import { type Player, type Prof, PROFS, derive, level, profValue, powerScore } from './player';
import { Rng } from './rng';
import { type NodeType, type Tower, TOWER, floorLevel, floorPl, generateTower } from './tower';
import type { BattleState, PotionId } from './battle';

/** Approved design defaults + provisional tuning. */
export const RULES = {
  dropAccel: 8,
  /** Provisional: tower battles pay EXP like an Arena-style mode. */
  expMult: 8, // 暫定 (CP2): was 6
  death: { exp: 0.5, credits: 0.5, keepBestItems: 1, loseConsumables: true },
  potionPrice: { health: 50, mana: 100, spirit: 100 } as Record<PotionId, number>,
  restHeal: 0.5,
  floorCredits: 15,
  /** 暫定 (round 5): at least one equipment drop is guaranteed by this floor. */
  earlyEquipByFloor: 4,
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
}

export function startRun(p: Player, seed: number): RunState {
  const rng = new Rng(seed);
  const tower = generateTower(rng);
  const d = derive(p);
  return {
    seed, rng: rng.state, tower, floor: 1, path: [], hp: d.hp, mp: d.mp, sp: d.sp, bonus: { dmg: 0, hp: 0 },
    bag: [], exp: 0, credits: 0, profExp: {}, kills: 0, current: null, merchant: null, done: null,
  };
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
  return { ...d, adb: d.adb * (1 + run.bonus.dmg), mdb: d.mdb * (1 + run.bonus.dmg), hp: Math.round(d.hp * (1 + run.bonus.hp)) };
}

/** 暫定 (CP2): extra HP / damage multiplier for monsters on floors 6-9 (difficulty knob, scripts/difficulty.ts). */
export const MID_FLOOR_MULT = { from: 6, to: 9, hp: 1, dmg: 1.05 };

export function encounter(run: RunState, pool: MonsterPool, type: NodeType): Monster[] {
  const f = run.floor;
  const L = floorLevel(f);
  const { lo, hi } = plWindow(pool, floorPl(f));
  return withRng(run, (rng) => {
    const plan: Rank[] =
      type === 'boss' ? ['boss', 'normal'] /* 暫定 (round 6): floor-10 boss has at most 1 minion */ :
      type === 'elite' ? ['elite', 'normal'] :
      f >= 6 ? (rng.chance(0.5) ? ['normal', 'normal', 'normal'] : ['normal', 'normal', 'normal', 'normal']) :
      rng.chance(0.5) ? ['normal', 'normal'] : ['normal', 'normal', 'normal'];
    return plan.map((rank) => {
      const row = rank === 'normal' ? pickRows(rng, pool, lo, hi, 1)[0] : pickTop(rng, pool, lo, hi);
      const m = buildMonster(row!, rank === 'boss' ? L + 2 : rank === 'elite' ? L + 1 : L, rank);
      if (f >= MID_FLOOR_MULT.from && f <= MID_FLOOR_MULT.to) { m.maxHp = m.hp = Math.round(m.maxHp * MID_FLOOR_MULT.hp); m.adb *= MID_FLOOR_MULT.dmg; }
      return m;
    });
  });
}

export interface Loot { equips: Equip[]; credits: number; potions: Partial<Record<PotionId, number>>; exp: number }

const LR = C['F-003-loot-rolls'].value;
export function equipDropChance(pl: number, accel = RULES.dropAccel): number {
  const drop = LR.baseDrop + Math.min(LR.plBonus.cap, Math.max(0, (pl - LR.plBonus.offset) / LR.plBonus.divisor));
  return drop * Math.min(1, LR.equipmentRoll * accel);
}

/** Quality floor rises every 5 floors (design §5). */
// 暫定 (round 5): floors 1-5 raised from crude to fair to speed early progression.
export const floorMinQuality = (_f: number): Quality => 'fair';

export function battleLoot(run: RunState, monsters: Monster[], type: NodeType): Loot {
  const L = floorLevel(run.floor);
  return withRng(run, (rng) => {
    const loot: Loot = { equips: [], credits: 0, potions: {}, exp: 0 };
    for (const m of monsters) {
      loot.exp += Math.round(monsterExp(m.level, m.pl, RULES.expMult) * (m.rank === 'boss' ? 5 : m.rank === 'elite' ? 2 : 1));
      const drop = LR.baseDrop + Math.min(LR.plBonus.cap, Math.max(0, (m.pl - LR.plBonus.offset) / LR.plBonus.divisor));
      if (rng.chance(drop)) {
        if (rng.chance(Math.min(1, LR.equipmentRoll * RULES.dropAccel))) loot.equips.push(generateEquip(rng, L, { minQuality: floorMinQuality(run.floor) }));
        else {
          const k = rng.weighted<PotionId>([['health', 3], ['mana', 1], ['spirit', 1]]);
          loot.potions[k] = (loot.potions[k] ?? 0) + 1;
        }
      } else if (rng.chance(0.2)) loot.credits += Math.round((5 + m.level * 2) * (0.8 + rng.next() * 0.4));
    }
    if (type === 'elite') loot.equips.push(generateEquip(rng, L, { minQuality: 'fair', qualityBump: run.floor > 5 ? 1 : 0 }));
    if (type === 'boss') {
      const n = run.floor >= 10 ? 3 : 2;
      for (let i = 0; i < n; i++) loot.equips.push(generateEquip(rng, L, { minQuality: C['F-003-clear-bonus'].value.minQuality as Quality, qualityBump: i === 0 ? 1 : 0 }));
      loot.credits += 40 * run.floor;
    }
    loot.credits += RULES.floorCredits * run.floor;
    // 暫定 early-loot guarantee (round 5): the first won battle on floors 1-4 with no equipment found yet this run drops one.
    if (run.floor <= RULES.earlyEquipByFloor && !run.foundEquip && loot.equips.length === 0) loot.equips.push(generateEquip(rng, L, { minQuality: floorMinQuality(run.floor) }));
    if (loot.equips.length) run.foundEquip = true;
    return loot;
  });
}

export function chestLoot(run: RunState): Loot {
  const L = floorLevel(run.floor);
  // design §5: chests drop 2-3 items (暫定 single-player acceleration).
  return withRng(run, (rng) => ({
    equips: Array.from({ length: rng.int(2, 3) }, () => generateEquip(rng, L, { minQuality: 'fair', qualityBump: rng.chance(0.25) ? 1 : 0 })),
    credits: rng.int(10, 30) * run.floor, potions: rng.chance(0.5) ? { health: 1 } : {}, exp: 0,
  }));
}

export function applyLoot(p: Player, run: RunState, loot: Loot): void {
  run.bag.push(...loot.equips);
  run.credits += loot.credits;
  run.exp += loot.exp;
  for (const [k, v] of Object.entries(loot.potions)) p.potions[k as PotionId] += v!;
}

export function finishBattle(p: Player, run: RunState, b: BattleState, monsters: Monster[], type: NodeType): Loot | null {
  run.hp = b.hp; run.mp = b.mp; run.sp = b.sp;
  p.potions = { ...b.potions };
  if (b.over !== 'win') { run.done = 'dead'; return null; }
  run.kills += monsters.length;
  const loot = battleLoot(run, monsters, type);
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
  const L = floorLevel(run.floor);
  return withRng(run, (rng) => ({
    equips: [0, 1, 2].map((i) => {
      const e = generateEquip(rng, L, { minQuality: i === 0 ? 'average' : 'fair' });
      return { e, price: Math.round(sellPrice(e) * 3.5) };
    }),
  }));
}

export function rest(p: Player, run: RunState, choice: 'heal' | 'upgrade', equipSlot?: string): string {
  const d = runDerived(p, run);
  if (choice === 'heal') {
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
  const e = withRng(run, (rng) => generateEquip(rng, floorLevel(run.floor), { minQuality: 'superior' }));
  run.bag.push(e);
  return `獲得 ${e.quality} 裝備`;
}

export function advance(run: RunState, option: number): void {
  run.path.push(option);
  run.current = null;
  run.merchant = null;
  if (run.floor >= TOWER.floors) run.done = 'clear';
  else run.floor++;
}

export interface Settlement {
  outcome: 'clear' | 'dead' | 'retreat';
  exp: number; credits: number; kept: Equip[]; lost: number; lostItems: Equip[]; lostPotions: Partial<Record<PotionId, number>>; levelBefore: number; levelAfter: number;
  floor: number;
}

/** Apply the run result to the persistent character (design §8 death rules). */
export function settle(p: Player, run: RunState): Settlement {
  const outcome = run.done ?? 'retreat';
  const dead = outcome === 'dead';
  const before = level(p);
  const exp = Math.round(run.exp * (dead ? RULES.death.exp : 1));
  const credits = Math.round(run.credits * (dead ? RULES.death.credits : 1));
  let kept = run.bag;
  let lostPotions: Partial<Record<PotionId, number>> = {};
  if (dead) {
    kept = [...run.bag].sort((a, b) => score(b) - score(a)).slice(0, RULES.death.keepBestItems);
    if (RULES.death.loseConsumables) { lostPotions = { ...p.potions }; p.potions = { health: 0, mana: 0, spirit: 0 }; }
  }
  p.exp = Math.round(p.exp + exp);
  p.credits += credits;
  for (const [k, v] of Object.entries(run.profExp)) p.profExp[k as Prof] += Math.round(v! * (dead ? RULES.death.exp : 1));
  p.inventory.push(...kept);
  return { outcome, exp, credits, kept, lost: run.bag.length - kept.length, lostItems: run.bag.filter((e) => !kept.includes(e)), lostPotions, levelBefore: before, levelAfter: level(p), floor: run.floor };
}

export function score(e: Equip): number {
  return QUALITIES.indexOf(e.quality) * 1000 + e.roll + e.level * 5 + e.iw * 200;
}

export { powerScore, profValue };
