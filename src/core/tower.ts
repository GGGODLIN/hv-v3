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
  plBase: 40,
  plPerFloor: 0.25,
  weights: [['battle', 40], ['elite', 14], ['chest', 12], ['merchant', 9], ['rest', 10], ['shrine', 15]] as [NodeType, number][],
};

export interface Floor { n: number; options: NodeType[] }
export interface Tower { floors: Floor[] }

export const floorLevel = (f: number) => TOWER.baseLevel + TOWER.levelPerFloor * (f - 1);
export function floorPl(f: number): [number, number] {
  const c = TOWER.plBase * (1 + TOWER.plPerFloor * (f - 1));
  return [Math.max(25, Math.round(c * 0.6)), Math.round(c * 1.4)];
}

/**
 * Floors 1..10. Boss floors have one option. Rest floors always offer a rest. Floor 1 always offers a battle and never an elite or rest.
 * No lane may show the same node type on three floors in a row.
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
        options.includes(t) ||
        (n >= 3 && floors[n - 2]!.options[lane] === t && floors[n - 3]!.options[lane] === t)
      ));
      options.push(t);
    }
    if (n === 1 && !options.includes('battle')) options[0] = 'battle';
    if (TOWER.restFloors.includes(n) && !options.includes('rest')) options[rng.int(0, options.length - 1)] = 'rest';
    floors.push({ n, options });
  }
  return { floors };
}
