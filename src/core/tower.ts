import type { Rng } from './rng';

export type NodeType = 'battle' | 'elite' | 'chest' | 'merchant' | 'rest' | 'shrine' | 'boss';
export const NODE_ZH: Record<NodeType, string> = { battle: '戰鬥', elite: '精英', chest: '寶箱', merchant: '商人', rest: '營火', shrine: '神龕', boss: '首領' };
export const NODE_ICON: Record<NodeType, string> = { battle: '⚔', elite: '☠', chest: '◆', merchant: '$', rest: '♨', shrine: '✦', boss: '♛' };

/** Provisional tower tuning (design §6). */
export const TOWER = {
  floors: 10,
  bossFloors: [5, 10],
  restFloors: [4, 9],
  /** Monster level on floor f = base + perFloor * (f - 1). */
  baseLevel: 1,
  levelPerFloor: 3,
  /** Monster PL window centre on floor f. */
  /** 暫定 (provisional): tower base PL; not in findings/design, kept by producer decision. */
  plBase: 40,
  /** design §2: PL = base × (1 + 0.08 × floor). base 40 is this branch's existing value; not in findings/design. */
  plPerFloor: 0.08,
  weights: [['battle', 45], ['elite', 12], ['chest', 10], ['merchant', 10], ['rest', 13], ['shrine', 10]] as [NodeType, number][],
};

export interface Floor { n: number; options: NodeType[] }
export interface Tower { floors: Floor[] }

export const floorLevel = (f: number) => TOWER.baseLevel + TOWER.levelPerFloor * (f - 1);
/** Monster PL centre on floor f (design §2, base 暫定). */
export const floorPl = (f: number): number => TOWER.plBase * (1 + TOWER.plPerFloor * f);

/**
 * Floors 1..10. Boss floors have one option. Rest floors always offer a rest. Floor 1 offers battles only.
 * No-triple rule: a type offered on both previous floors may not be offered again, so no route can pass the same
 * node type three floors in a row (rest included). Before a forced rest floor, rest is banned if the floor before had one.
 */
export function generateTower(rng: Rng): Tower {
  const floors: Floor[] = [];
  const has = (n: number, t: NodeType) => (floors[n - 1]?.options ?? []).includes(t);
  for (let n = 1; n <= TOWER.floors; n++) {
    if (TOWER.bossFloors.includes(n)) { floors.push({ n, options: ['boss'] }); continue; }
    const count = rng.chance(0.5) ? 3 : 2;
    if (n === 1) { floors.push({ n, options: Array<NodeType>(count).fill('battle') }); continue; }
    const banned = (t: NodeType) =>
      (has(n - 1, t) && has(n - 2, t)) || (t === 'rest' && TOWER.restFloors.includes(n + 1) && has(n - 1, 'rest'));
    const options: NodeType[] = [];
    if (TOWER.restFloors.includes(n)) options.push('rest');
    while (options.length < count) {
      const pool = TOWER.weights.filter(([t]) => !banned(t) && !options.includes(t));
      options.push(rng.weighted(pool));
    }
    if (options[0] === 'rest' && TOWER.restFloors.includes(n)) { const i = rng.int(0, count - 1); [options[0], options[i]] = [options[i]!, options[0]!]; }
    floors.push({ n, options });
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
