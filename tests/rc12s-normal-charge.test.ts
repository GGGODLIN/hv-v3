import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, derive } from '../src/core/player';
import { encounter, startRun, RULES } from '../src/core/run';
import { CP9 } from '../src/core/cp8';
import { act, startBattle, windingUp, hitCap9, chargeEstimate } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { Rng } from '../src/core/rng';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
// rc12s item 3（自訂）: normal fight (no elite / boss on the field) charged hit ≤ 30% max HP; elite / boss fights keep 40%; ★ / preview use the same cap.
const worst = (withElite: boolean) => {
  let w = 0, estOk = true;
  for (const f of [40, 60, 80]) for (const seed of [1, 2, 3, 4, 5]) {
    const p = newPlayer(); starterKit(p); const d = derive(p); const r = startRun(p, seed); r.floor = f;
    const m = encounter(r, pool, 'battle')[0]!;
    m.hp = m.maxHp = 1e7; m.adb = d.hp * 5; m.charge = 1; m.rank = 'normal' as never;
    if (!windingUp(m)) continue;
    const mons = [m];
    if (withElite) { const e = encounter(r, pool, 'battle')[0]!; e.rank = 'elite' as never; e.hp = e.maxHp = 1e7; e.adb = 0; mons.push(e); }
    const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, mons, { health: 0, mana: 0, spirit: 0 });
    const cap = hitCap9(b, m, 2, true); if (chargeEstimate(b, m, false, true) > cap + 1e-6) estOk = false;
    const rng = new Rng(seed);
    for (let t = 0; t < 4 && !b.over; t++) { const h0 = b.hp; act(b, { kind: 'attack', target: 0 } as never, rng); w = Math.max(w, (h0 - b.hp) / d.hp); b.hp = d.hp; }
  }
  return { w, estOk };
};
describe('rc12s: normal-fight charged-hit cap 30%', () => {
  it('defaults: normal 0.30, elite/boss 0.40', () => { expect(CP9.normalCharge).toBe(0.3); expect(CP9.minionCharge).toBe(0.4); });
  it('normal fight: real hit ≤ 30%, estimate ≤ the same cap', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try { const { w, estOk } = worst(false); expect(w).toBeGreaterThan(0.2); expect(w).toBeLessThanOrEqual(0.3 + 1e-9); expect(estOk).toBe(true); } finally { RULES.cp8 = o; }
  });
  it('elite on the field: the cap is 40% (> 30%)', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try { const { w, estOk } = worst(true); expect(w).toBeGreaterThan(0.3); expect(w).toBeLessThanOrEqual(0.41) /* + the 0-adb elite chip hit */; expect(estOk).toBe(true); } finally { RULES.cp8 = o; }
  });
});
