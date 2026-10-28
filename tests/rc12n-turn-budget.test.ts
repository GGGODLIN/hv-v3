import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { startBattle, act, turnDamage } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { Rng } from '../src/core/rng';
// QA rc12m ar2 F35 t10（自訂）: one boss turn must never take more than floor(50% max HP), whatever mix of charged / normal /
// hitCap12m-capped hits (760 max HP → ≤ 380; QA saw 231 重擊 + 151).
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; } };
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const mon = (adb: number, rank: 'boss' | 'normal', cap?: number) => { const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e7; m.adb = adb; m.acc = 1e9; m.rank = rank; if (cap) (m as { hitCap12m?: number }).hitCap12m = cap; return m; };

describe('rc12n: per-turn budget ≤ floor(0.5 × max HP)', () => {
  for (const hp of [760, 736, 761, 1014]) it(`max HP ${hp}`, () => withCp8(() => {
    let top = 0;
    for (let seed = 1; seed <= 60; seed++) for (const adb of [231, 300, 600, 1e5]) for (const kind of ['attack', 'defend'] as const) {
      const p = newPlayer(); starterKit(p); const d = { ...derive(p), hp };
      const b = startBattle(d, { hp, mp: d.mp, sp: d.sp }, [mon(adb * 1.5, 'boss', 0.4), mon(adb, 'boss', 0.4), mon(adb, 'normal')], { health: 0, mana: 0, spirit: 0 });
      b.monsters[0]!.charge = 1; const rng = new Rng(seed);
      for (let t = 0; t < 4 && !b.over; t++) { b.hp = hp; const dmg = turnDamage(act(b, { kind, target: 0 } as never, rng)); expect(dmg).toBeLessThanOrEqual(Math.floor(hp * 0.5)); top = Math.max(top, dmg); expect(hp - b.hp).toBeLessThanOrEqual(Math.floor(hp * 0.5)); }
    }
    expect(top).toBe(Math.floor(hp * 0.5)); // the cap is actually reached (the test would catch an overshoot)
  }));
});
