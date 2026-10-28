import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';
import { encounter, startRun } from '../src/core/run';
import { snapBeforeBoss } from '../src/game/qalog';
import { realBoss } from '../scripts/rc12f-realboss';
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
  it('snapshot is marked pre-encounter; old post-encounter states rewind to the same boss', () => {
    const p = newPlayer(); const r = startRun(p, 9); r.floor = 35; const s = mem(); const o = JSON.parse(s.getItem(snapBeforeBoss(s, 'r', 35, 1, p, r))!);
    expect(o.rngAt).toBe('pre-encounter');
    const pre = structuredClone(r), live = encounter(r, pool, 'boss'); // r is now a post-encounter (pre-rc12f) snapshot state
    const key = (ms: typeof live) => ms.map((m) => [m.name, m.maxHp]);
    expect(key(realBoss(pre, pool, true).ms)).toEqual(key(live)); expect(key(realBoss(structuredClone(r), pool).ms)).toEqual(key(live));
  });
  it('app.ts saves the snapshot before encounter() in startBattle', () => {
    const src = readFileSync('src/game/app.ts', 'utf8'); const i = src.indexOf('async startBattle('), body = src.slice(i, i + 1200);
    expect(body.indexOf('snapBeforeBoss(')).toBeGreaterThan(-1); expect(body.indexOf('snapBeforeBoss(')).toBeLessThan(body.indexOf('encounter('));
  });
});

import { CP9, refHp9 } from '../src/core/cp8';
import { RULES } from '../src/core/run';
import { act, startBattle, windingUp, BOSS_CHARGE_MULT } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { derive } from '../src/core/player';
import { Rng } from '../src/core/rng';
// rc12f item 1（自訂，製作人決定）: boss plain attack ≤ 40% of the floor's typical max HP; 蓄力 hit announced, and ≤ 50% max HP after D.
describe('rc12f: boss attack cap (CP9 rule 5)', () => {
  it('boss plain-attack adb is capped at bossAtk × refHp9(floor) from F30 on (default 0.40)', () => {
    expect(CP9.bossAtk).toBe(0.4);
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      for (const f of [30, 40, 60, 100]) for (const seed of [1, 2, 3, 4, 5]) {
        const p = newPlayer(); const r = startRun(p, seed); r.floor = f;
        const boss = encounter(r, pool, 'boss').find((m) => m.rank === 'boss')!;
        expect(boss.adb).toBeLessThanOrEqual(0.4 * refHp9(f) + 1e-9);
      }
    } finally { RULES.cp8 = o; }
  });
  it('a 蓄力 hit is announced (windingUp) and with D costs ≤ 50% max HP', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      for (const f of [30, 50, 80]) for (const seed of [1, 2, 3, 4, 5, 6]) {
        const p = newPlayer(); starterKit(p); const d = derive(p); const r = startRun(p, seed); r.floor = f;
        const ms = encounter(r, pool, 'boss').filter((m) => m.rank === 'boss');
        const m = ms[0]!; m.hp = m.maxHp = 1e7; m.charge = 1;
        expect(windingUp(m)).toBe(true); // announced before the hit lands
        expect(BOSS_CHARGE_MULT * m.adb).toBeGreaterThan(m.adb); // the charged hit may exceed the plain cap
        const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 });
        act(b, { kind: 'defend' } as never, new Rng(seed));
        expect(d.hp - b.hp).toBeGreaterThan(0); expect(d.hp - b.hp).toBeLessThanOrEqual(0.5 * d.hp);
      }
    } finally { RULES.cp8 = o; }
  });
});
