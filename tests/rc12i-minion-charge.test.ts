import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, derive } from '../src/core/player';
import { encounter, startRun, RULES } from '../src/core/run';
import { CP9, RUN12AB, RUN12M } from '../src/core/cp8';
import { act, startBattle, windingUp } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { Rng } from '../src/core/rng';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
// rc12i item 2（自訂）: a minion (non-boss) charged hit ≤ 40% of the player's actual max HP (QA bw2 F60 610 = 50%).
const worst = (): number => {
  let w = 0;
  for (const f of [40, 60, 80]) for (const seed of [1, 2, 3, 4, 5]) {
    const p = newPlayer(); starterKit(p); const d = derive(p); const r = startRun(p, seed); r.floor = f;
    const m = encounter(r, pool, 'boss').find((x) => x.rank !== 'boss') ?? encounter(r, pool, 'battle')[0]!;
    m.hp = m.maxHp = 1e7; m.adb = d.hp * 5; m.charge = 1;
    if (!windingUp(m)) continue; // charge 1 → released on a following enemy phase
    const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 });
    const rng = new Rng(seed);
    for (let t = 0; t < 4 && !b.over; t++) { const h0 = b.hp; act(b, { kind: 'attack', target: 0 } as never, rng); w = Math.max(w, (h0 - b.hp) / d.hp); b.hp = d.hp; }
  }
  return w;
};
describe('rc12i: minion charged-hit cap', () => {
  it('default 0.40, and a huge minion 蓄力 hit takes ≤ 40% max HP', () => {
    expect(CP9.minionCharge).toBe(0.4);
    const o = RULES.cp8; RULES.cp8 = true;
    try { const w = worst(); expect(w).toBeGreaterThan(0); expect(w).toBeLessThanOrEqual(0.4); } finally { RULES.cp8 = o; }
  });
  it('without the cap the same hit goes past 40% (the cap is what holds it)', () => {
    const o = RULES.cp8, c = CP9.minionCharge; RULES.cp8 = true; (CP9 as { minionCharge: number }).minionCharge = 0; RUN12M.on = false; const bg = RUN12AB.chgBudget; (RUN12AB as { chgBudget: number }).chgBudget = 0; // rc12m: RUN12M.hit also caps it; rc12ab（自訂）: the 40% round budget too
    try { expect(worst()).toBeGreaterThan(0.4); } finally { RULES.cp8 = o; (CP9 as { minionCharge: number }).minionCharge = c; RUN12M.on = true; (RUN12AB as { chgBudget: number }).chgBudget = bg; }
  });
});
