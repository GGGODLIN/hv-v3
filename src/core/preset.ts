import { SAVE_KEY, SAVE_VERSION, type KV, type SaveData } from './save';
import { ABYSS_KEY } from './abyss';

export interface Preset { player: SaveData['player']; record: unknown }
/** Every localStorage key the game owns. A preset must replace all of them, not merge into an old save. */
export const GAME_KEYS = [SAVE_KEY, ABYSS_KEY] as const;

/**
 * rc10: load a debug preset as a complete replacement of the local save (character, run, stats and the abyss
 * record / trip count). Old keys are removed first so nothing from a previous save survives.
 */
export function applyPreset(kv: KV, pr: Preset): SaveData {
  for (const k of GAME_KEYS) kv.removeItem(k);
  const save: SaveData = { v: SAVE_VERSION, player: structuredClone(pr.player), run: null, settings: { speed: 1, skipAnim: false }, stats: { runs: 0, bestFloor: 20, clears: 1 } };
  kv.setItem(SAVE_KEY, JSON.stringify(save));
  kv.setItem(ABYSS_KEY, JSON.stringify(pr.record));
  return save;
}

/** rc10: drop `preset` from a query string so a later reload keeps the player's progress instead of re-applying it. */
export function stripPreset(search: string): string {
  const q = new URLSearchParams(search); q.delete('preset');
  const s = q.toString().replace(/=(?=&|$)/g, '');
  return s ? `?${s}` : '';
}
