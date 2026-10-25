import type { Player } from './player';
import type { RunState } from './run';

export const SAVE_KEY = 'hv-v3-save';
export const SAVE_VERSION = 1;
export interface SaveData { v: number; player: Player; run: RunState | null; settings: Settings; stats: { runs: number; bestFloor: number; clears: number } }
export interface Settings { speed: 1 | 2 | 4; skipAnim: boolean }

export function serialize(s: SaveData): string {
  return JSON.stringify(s);
}
export function deserialize(raw: string | null): SaveData | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as SaveData;
    if (s.v !== SAVE_VERSION || !s.player) return null;
    return s;
  } catch {
    return null;
  }
}
export interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }
export const saveTo = (kv: KV, s: SaveData) => kv.setItem(SAVE_KEY, serialize(s));
export const loadFrom = (kv: KV) => deserialize(kv.getItem(SAVE_KEY));
