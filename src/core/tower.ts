import type { Rng } from './rng';

export type NodeType = 'battle' | 'elite' | 'chest' | 'merchant' | 'rest' | 'shrine' | 'boss';
export const NODE_ZH: Record<NodeType, string> = { battle: '戰鬥', elite: '精英', chest: '寶箱', merchant: '商人', rest: '營火', shrine: '神龕', boss: '首領' };
export const NODE_ICON: Record<NodeType, string> = { battle: '⚔', elite: '☠', chest: '◆', merchant: '$', rest: '♨', shrine: '✦', boss: '♛' };

/** Provisional tower tuning (design §6). */
export const TOWER = {
  floors: 10,
  bossFloors: [5, 10],
  /** 暫定 (CP3-10): rest moved 9 -> 8 so it sits on an even (non-combat) floor; odd floors are combat-only. */
  restFloors: [4, 8],
  /** 暫定 (CP3-10): anti-avoid. These floors offer only battle / elite, so no route has two non-combat nodes in a row. */
  combatFloors: [1, 3, 7, 9],
  /** Monster level on floor f = base + perFloor * (f - 1). */
  baseLevel: 1,
  /** 暫定 (CP3, gameplay layer): 3 -> 2 so the median first clear lands on trip 3 with original x1 EXP. */
  levelPerFloor: 2,
  /** Monster PL window centre on floor f. */
  /** 暫定 (provisional): tower base PL; not in findings/design, kept by producer decision. */
  plBase: 40,
  /** design §2: PL = base × (1 + 0.08 × floor). base 40 is this branch's existing value; not in findings/design. */
  plPerFloor: 0.08,
  weights: [['battle', 45], ['elite', 12], ['chest', 10], ['merchant', 10], ['rest', 13], ['shrine', 10]] as [NodeType, number][],
};

/** CP5 decision 1 (暫定, flag RULES.cp5Bosses only): 20-floor tower. Boss every 5 floors, rest / combat pattern repeated. */
export const CP5_TOWER = { floors: 20, bossFloors: [5, 10, 15, 20], restFloors: [4, 8, 14, 18], combatFloors: [1, 3, 7, 9, 11, 13, 17, 19] };
/** The tower layout rules in effect (CP5 20-floor tower when long). Single source for UI text such as boss floors. */
export const towerRules = (long?: boolean) => (long ? { ...TOWER, ...CP5_TOWER } : TOWER);
export interface Floor { n: number; options: NodeType[] }
export interface Tower { floors: Floor[] }

export const floorLevel = (f: number) => TOWER.baseLevel + TOWER.levelPerFloor * (f - 1);
/** Monster PL centre on floor f (design §2, base 暫定). */
export const floorPl = (f: number): number => TOWER.plBase * (1 + TOWER.plPerFloor * f);

export interface TowerOpts {
  /** First trip tutorial (spell still locked): F2 battle only, F3 the fixed shop, F4 a long elite. */
  tutorial?: boolean;
  /** Node types that are still locked (never offered). */
  locked?: NodeType[];
  /** Guarantee at least one shrine (CP3-9: trip 2 onwards). */
  shrine?: boolean;
  /** CP5: 20 floors (flag on). */
  long?: boolean;
  /** CP6 rc2 (c), flag cp6Abyss: no floor offers two routes of the same type. */
  distinct?: boolean;
  /** cp8-rc6 item 2 (flag RULES.cp8): the floor before each boss floor always offers a rest. */
  restBeforeBoss?: boolean;
}
const COMBAT: NodeType[] = ['battle', 'elite'];
export const isCombat = (t: NodeType) => t === 'battle' || t === 'elite' || t === 'boss';

/**
 * Floors 1..10. Boss floors have one option. Rest floors always offer a rest. Odd floors (TOWER.combatFloors) offer only
 * battle / elite; even floors offer only non-combat nodes. So every route alternates combat / non-combat and can never
 * take two non-combat nodes in a row (CP3-10, 暫定). No-triple rule: a type offered on both previous floors may not be offered again.
 */
export function generateTower(rng: Rng, opts: TowerOpts = {}): Tower {
  const floors: Floor[] = [];
  const has = (n: number, t: NodeType) => (floors[n - 1]?.options ?? []).includes(t);
  const locked = new Set(opts.locked ?? []);
  const T = towerRules(opts.long);
  for (let n = 1; n <= T.floors; n++) {
    if (T.bossFloors.includes(n)) { floors.push({ n, options: ['boss'] }); continue; }
    // CP5 rc2 fix 8 (flag on via long): tutorial floors still offer ≥2 routes (taught node first; no rng draw, 暫定).
    if (opts.long && opts.tutorial && n >= 2 && n <= 4) { floors.push({ n, options: opts.distinct ? (n === 2 ? ['battle', 'elite'] : n === 3 ? ['merchant', 'chest'] : ['elite', 'battle']) : n === 2 ? ['battle', 'battle'] : n === 3 ? ['merchant', 'merchant'] : ['elite', 'elite'] }); continue; } // CP6 rc2 (c): two different routes, taught node first (暫定（缺原版出處）)
    if (opts.tutorial && n === 2) { floors.push({ n, options: ['battle'] }); continue; }
    if (opts.tutorial && n === 3) { floors.push({ n, options: ['merchant'] }); continue; }
    if (opts.tutorial && n === 4) { floors.push({ n, options: ['elite'] }); continue; }
    const combatOnly = T.combatFloors.includes(n);
    const count = rng.chance(0.5) ? 3 : 2;
    if (n === 1) { floors.push({ n, options: opts.long && opts.distinct ? ['battle', 'elite'] : Array<NodeType>(count).fill('battle') }); continue; } // CP6 rc2 (c): no same-type pair (count still drawn so the rng stream is unchanged; 暫定（缺原版出處）)
    const banned = (t: NodeType) => locked.has(t) || (has(n - 1, t) && has(n - 2, t));
    const options: NodeType[] = [];
    if (T.restFloors.includes(n)) options.push('rest');
    while (options.length < count) {
      const pool = TOWER.weights.filter(([t]) => !banned(t) && !options.includes(t) && (combatOnly ? COMBAT.includes(t) : !COMBAT.includes(t)));
      if (!pool.length) break;
      options.push(rng.weighted(pool));
    }
    if (!options.length) options.push(COMBAT.find((t) => !banned(t)) ?? 'battle');
    if (options[0] === 'rest' && T.restFloors.includes(n)) { const i = rng.int(0, options.length - 1); [options[0], options[i]] = [options[i]!, options[0]!]; }
    // cp8-rc6 item 2 (producer): the floor right before a boss floor always offers a rest node (added after the rng draws, so the
    // stream and every other floor stay as before; restFloors / combatFloors values unchanged). On a combat-only floor it is an extra route.
    if (opts.restBeforeBoss && T.bossFloors.includes(n + 1) && !options.includes('rest') && !locked.has('rest')) options.push('rest');
    floors.push({ n, options });
  }
  if (opts.shrine && !floors.some((f) => f.options.includes('shrine'))) {
    const f = floors.find((x) => x.n >= 6 && !T.combatFloors.includes(x.n) && !T.bossFloors.includes(x.n))!;
    const i = f.options.findIndex((t) => t !== 'rest' && !isCombat(t));
    if (i >= 0) f.options[i] = 'shrine'; else f.options.push('shrine');
  }
  return { floors };
}

/** Count of (floor, type) where the type is offered on that floor and the two before it (any route through it is a triple). */
export function tripleViolations(t: Tower): number {
  const f = t.floors;
  let v = 0;
  for (let n = 2; n < f.length; n++) for (const ty of new Set(f[n]!.options)) if (f[n - 1]!.options.includes(ty) && f[n - 2]!.options.includes(ty)) v++;
  return v;
}

/** True if some route can be forced into the same type on three consecutive floors. */
export function forcedTriple(t: Tower): boolean {
  const f = t.floors;
  for (let n = 2; n < f.length; n++) {
    const a = f[n]!.options;
    if (new Set(a).size !== 1) continue;
    if (f[n - 1]!.options.includes(a[0]!) && f[n - 2]!.options.includes(a[0]!)) return true;
  }
  return false;
}
