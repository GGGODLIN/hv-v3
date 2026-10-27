import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { abyssBestMsg, abyssCarryAt, deathCarryMsg, floorLabel, settle, startAbyss, startRun } from '../src/core/run';
import { checkpointStart } from '../src/core/abyss';
import { newPlayer } from '../src/core/player';
import { starterKit } from '../src/core/auto';

const presets = JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, { record: { best: number } }>;
describe('rc5 fixes', () => {
  it('(a) battle title uses absolute abyss depth', () => {
    const p = newPlayer(); starterKit(p, 1);
    const r = startAbyss(p, 1, 16); expect(floorLabel(r)).toBe(16);
    r.floor = 5; const r6 = startAbyss(p, 1, 6); r6.floor = 5; expect(floorLabel(r6)).toBe(10);
    const t = startRun(p, 1); t.floor = 7; expect(floorLabel(t)).toBe(7);
  });
  it('(b) every postF20 preset starts at d1; abyss10 at d11; abyss15 at d16', () => {
    for (const k of ['postF20-blade', 'postF20-oc', 'postF20-arcane', 'postF20-bulwark']) expect(checkpointStart(presets[k]!.record.best), k).toBe(1);
    expect(checkpointStart(presets.abyss10!.record.best)).toBe(11);
    expect(checkpointStart(presets.abyss15!.record.best)).toBe(16);
  });
  it('(c) record message says cleared N floors', () => { expect(abyssBestMsg(12)).toBe('深淵新紀錄：到達第 13 層（已通過 12 層）') /* cp8-rc9 P1-10 */; });
  it('(d) abyss death carries back 50% × depth multiplier', () => {
    const p = newPlayer(); starterKit(p, 1); const exp0 = p.exp, c0 = p.credits;
    const r = startAbyss(p, 1, 16); r.exp = 1000; r.credits = 400; r.done = 'dead';
    const m = abyssCarryAt(r); const s = settle(p, r);
    expect(s.exp).toBe(Math.round(1000 * 0.5 * m)); expect(s.credits).toBe(Math.round(400 * 0.5 * m));
    expect(p.exp - exp0).toBe(s.exp); expect(p.credits - c0).toBe(s.credits);
    expect(deathCarryMsg(0, 0)).toContain('尚未獲得');
  });
});
