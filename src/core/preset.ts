import { SAVE_KEY, SAVE_VERSION, type KV, type SaveData } from './save';
import { ABYSS_KEY } from './abyss';
import { RULES } from './run';
import { qaReset } from '../game/qalog';

export interface Preset { player: SaveData['player']; record: unknown }
/** Every localStorage key the game owns. A preset must replace all of them, not merge into an old save. */
export const GAME_KEYS = [SAVE_KEY, ABYSS_KEY] as const;

/**
 * rc10: load a debug preset as a complete replacement of the local save (character, run, stats and the abyss
 * record / trip count). Old keys are removed first so nothing from a previous save survives.
 */
/** rc12n: the player a preset loads as (cp8-rc5 lean = preset school). Shared by applyPreset and the full-run sim so both agree. */
export function presetPlayer(pr: Preset): SaveData['player'] {
  const player = structuredClone(pr.player) as SaveData['player']; const sc = (pr as { school?: string }).school;
  if (RULES.cp8 && (sc === 'blade' || sc === 'oc' || sc === 'arcane' || sc === 'bulwark')) player.lean = sc; // cp8-rc5
  return player;
}

export function applyPreset(kv: KV, pr: Preset): SaveData {
  for (const k of GAME_KEYS) kv.removeItem(k);
  const player = presetPlayer(pr);
  const save: SaveData = { v: SAVE_VERSION, player, run: null, settings: { speed: 1, skipAnim: false }, stats: { runs: (pr.player as { prog?: { trips?: number } }).prog?.trips ?? 0, bestFloor: 20, clears: 1 } }; // cp7 fix: town sortie count = the character's trip count (banner 第 N 趟 = trips+1)
  kv.setItem(SAVE_KEY, JSON.stringify(save));
  kv.setItem(ABYSS_KEY, JSON.stringify(pr.record));
  return save;
}

/** rc10: drop `preset` from a query string so a later reload keeps the player's progress instead of re-applying it. */
export function stripPreset(search: string): string {
  const q = new URLSearchParams(search); q.delete('preset'); q.delete('fresh');
  const s = q.toString().replace(/=(?=&|$)/g, '');
  return s ? `?${s}` : '';
}

/** cp8-rc5 playtest: the active save belongs to one slot (a preset name, or 'default'). Switching to another preset parks the
 *  current keys under `hv-v3-slot:<slot>:<key>` and restores the target slot if it was parked before, so presets no longer
 *  overwrite each other. Loading the preset of the slot already active (or `fresh`) still re-applies it from scratch. */
export const SLOT_KEY = 'hv-v3-slot';
const parked = (slot: string, k: string) => `${SLOT_KEY}:${slot}:${k}`;
export function switchSlot(kv: KV, name: string, pr: Preset, fresh = false): 'fresh' | 'restored' {
  if (fresh) qaReset(kv); // rc12al: &fresh also clears the QA turn log / fight tally / snapshots
  const cur = kv.getItem(SLOT_KEY) ?? 'default';
  if (cur !== name) for (const k of GAME_KEYS) { const v = kv.getItem(k); if (v === null) kv.removeItem(parked(cur, k)); else kv.setItem(parked(cur, k), v); }
  kv.setItem(SLOT_KEY, name);
  if (cur !== name && !fresh && kv.getItem(parked(name, SAVE_KEY)) !== null) {
    for (const k of GAME_KEYS) { const v = kv.getItem(parked(name, k)); if (v === null) kv.removeItem(k); else kv.setItem(k, v); }
    return 'restored';
  }
  applyPreset(kv, pr); return 'fresh';
}
