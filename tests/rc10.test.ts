import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { applyPreset, stripPreset, type Preset } from '../src/core/preset';
import { loadFrom, SAVE_KEY, type KV } from '../src/core/save';
import { ABYSS_KEY, loadRecord } from '../src/core/abyss';
import { derive, level } from '../src/core/player';

const presets = JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>;
const mem = (init: Record<string, string> = {}): KV & { m: Map<string, string> } => {
  const m = new Map(Object.entries(init));
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

describe('rc10 preset load fully replaces the save', () => {
  it('postF20-blade over an old save (abyss15 + bulwark 17 / 2 trips, mid-run, 9 main trips) → Lv12 HP740 potions 3, empty record', () => {
    const old = presets.abyss15!;
    const kv = mem({
      [SAVE_KEY]: JSON.stringify({ v: 1, player: old.player, run: { floor: 3 }, settings: { speed: 4, skipAnim: true }, stats: { runs: 9, bestFloor: 20, clears: 3 } }),
      [ABYSS_KEY]: JSON.stringify({ best: 17, trips: 2, ms: 10, titles: ['深淵初探者'], bySchool: { bulwark: { best: 17, trip: 2 } } }),
    });
    applyPreset(kv, presets['postF20-blade']!);
    const s = loadFrom(kv)!;
    expect(level(s.player)).toBe(12);
    expect(derive(s.player).hp).toBe(740);
    expect(Object.values(s.player.potions).reduce((a, b) => a + b, 0)).toBe(3);
    expect(s.run).toBeNull(); expect(s.stats.runs).toBe(0);
    const rec = loadRecord(kv.getItem(ABYSS_KEY));
    expect(rec).toMatchObject({ best: 0, trips: 0, titles: [], bySchool: {} });
  });
  it('does not alias the preset object (playing must not mutate the shared preset data)', () => {
    const pr = presets['postF20-oc']!; const s = applyPreset(mem(), pr);
    expect(s.player).not.toBe(pr.player); expect(s.player).toEqual(pr.player);
  });
  it('stripPreset drops only preset, so a reload keeps progress', () => {
    expect(stripPreset('?cp6&debug&preset=postF20-blade')).toBe('?cp6&debug');
    expect(stripPreset('?preset=abyss15')).toBe('');
    expect(stripPreset('?cp6&preset=x&speed=2')).toBe('?cp6&speed=2');
  });
});
