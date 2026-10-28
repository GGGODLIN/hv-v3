import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { RULES } from '../src/core/run';
import { applyPreset, presetPlayer, type Preset } from '../src/core/preset';

const presets = JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>;
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; };

RULES.cp8 = true; // the game runs cp8 (?cp8) and the full-run sim sets it before loading presets
describe('rc12n: full-run sim preset player lean == game applyPreset lean', () => {
  for (const sc of ['blade', 'bulwark', 'oc', 'arcane']) it(sc, () => {
    const pr = presets[`postF20-${sc}`]!; const game = applyPreset(mem() as never, pr).player;
    expect(game.lean).toBe(sc);
    expect(presetPlayer(pr).lean).toBe(game.lean);
    expect(readFileSync(new URL('../scripts/rc12m-fullrun.ts', import.meta.url), 'utf8')).toMatch(/presetPlayer\(/);
  });
});
