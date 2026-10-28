import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';
import { encounter, startRun } from '../src/core/run';
import { snapBeforeBoss } from '../src/game/qalog';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, removeItem: (k: string) => void m.delete(k), setItem: (k: string, v: string) => void m.set(k, v) }; };
describe('rc12f: pre-boss QA snapshot is taken before the boss is drawn', () => {
  it('loading the snapshot and calling encounter() draws the same boss as the live fight', () => {
    for (const seed of [3, 17, 40]) {
      const p = newPlayer(); const r = startRun(p, seed); r.floor = 30; const s = mem();
      const k = snapBeforeBoss(s, 'r', 30, 1, p, r); const live = encounter(r, pool, 'boss');
      const snapRun = JSON.parse(s.getItem(k)!).run; const again = encounter(snapRun, pool, 'boss');
      expect(again.map((m) => [m.name, m.maxHp, Math.round(m.adb)])).toEqual(live.map((m) => [m.name, m.maxHp, Math.round(m.adb)]));
    }
  });
  it('app.ts saves the snapshot before encounter() in startBattle', () => {
    const src = readFileSync('src/game/app.ts', 'utf8'); const i = src.indexOf('async startBattle('), body = src.slice(i, i + 1200);
    expect(body.indexOf('snapBeforeBoss(')).toBeGreaterThan(-1); expect(body.indexOf('snapBeforeBoss(')).toBeLessThan(body.indexOf('encounter('));
  });
});
