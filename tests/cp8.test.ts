import { describe, expect, it, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { newPlayer } from '../src/core/player';
import { RULES, encounter, runDerived, startAbyss } from '../src/core/run';
import { starterKit } from '../src/core/auto';
import { act, startBattle } from '../src/core/battle';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { Rng } from '../src/core/rng';
import { CP8, startBuffs } from '../src/core/cp8';
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const flags = { ...RULES };
afterEach(() => Object.assign(RULES, flags));

describe('cp8', () => {
  it('start buff count (暫定 formula): d1 0, d6 1, d21 4, capped', () => {
    expect([1, 5, 6, 11, 21, 26, 41, 60].map(startBuffs)).toEqual([0, 0, 1, 2, 4, 5, 6, 6]);
  });
  it('cp8 on: an abyss trip from d21 opens a start-buff pick; cp8 off: none', () => {
    RULES.cp6Abyss = true;
    const p = newPlayer(); starterKit(p, 1); RULES.cp8 = false; expect(startAbyss(p, 1, 21).startPick).toBeFalsy();
    RULES.cp8 = true; const run = startAbyss(p, 1, 21); expect(run.startPick).toBe(true); expect(run.offer).toBeTruthy(); expect(run.offersLeft).toBe(3);
  });
  it('cp8 on: one monster round never takes more than turnCap × max HP (cap lowered to 0.1 to exercise it)', () => {
    const worstAt = (cp8: boolean) => { RULES.cp6Abyss = true; RULES.cp8 = cp8; let worst = 0;
      for (let s = 1; s <= 30; s++) {
        const p = newPlayer(); starterKit(p, s); const run = startAbyss(p, s, 30); run.startPick = false; run.offer = null;
        const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, encounter(run, pool, 'battle'), p.potions); const rng = new Rng(s);
        while (!b.over && b.turn < 60) { const h0 = b.hp; act(b, { kind: 'defend' } as never, rng, {} as never); if (b.hp < h0) worst = Math.max(worst, (h0 - b.hp) / b.d.hp); }
      } return worst; };
    const cap0 = CP8.turnCap; CP8.turnCap = 0.1;
    try { expect(worstAt(false)).toBeGreaterThan(0.1); expect(worstAt(true)).toBeLessThanOrEqual(0.1 + 1e-9); } finally { CP8.turnCap = cap0; }
  });
});
