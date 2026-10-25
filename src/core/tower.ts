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
 * Floors 1..10. Boss floors have one option. Rest floors always offer a rest. Floor 1 always offers a battle and never an elite or rest.
 * Path rule: if a type was offered on both previous floors, this floor must offer some other type,
 * so no route is ever forced into the same node type three floors in a row (rest included).
 */
export function generateTower(rng: Rng): Tower {
  const floors: Floor[] = [];
  for (let n = 1; n <= TOWER.floors; n++) {
    if (TOWER.bossFloors.includes(n)) { floors.push({ n, options: ['boss'] }); continue; }
    const count = rng.chance(0.5) ? 3 : 2;
    const options: NodeType[] = [];
    for (let lane = 0; lane < count; lane++) {
      let t: NodeType;
      let guard = 0;
      do {
        t = rng.weighted(TOWER.weights);
        guard++;
      } while (guard < 50 && (
        (n === 1 && (t === 'elite' || t === 'rest')) ||
        options.includes(t)
      ));
      options.push(t);
    }
    if (n === 1 && !options.includes('battle')) options[0] = 'battle';
    if (TOWER.restFloors.includes(n) && !options.includes('rest')) options[rng.int(0, options.length - 1)] = 'rest';
    floors.push({ n, options });
  }
  return { floors };
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
