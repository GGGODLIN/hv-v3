import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ADVICE_DIAG, startBattle, act } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { RC22 } from '../src/core/cp8';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { encounter, RULES, startRun } from '../src/core/run';
import { Rng } from '../src/core/rng';
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; } };

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
describe('rc22 defaults', () => {
  it('decision (a): crit estimate defaults to the mean roll; SIM_REVERT off by default', () => { expect(ADVICE_DIAG.critRoll).toBe(1); expect(ADVICE_DIAG.revert.size).toBe(0); expect(ADVICE_DIAG.zRule).toBe('rc21'); });
  it('item 2 tuning: potCd 1 (cp9-rc6), multiK 0.65, normalCap 2 (cp9 自訂), all marked 自訂', () => {
    expect(RC22).toEqual({ potCd: 1, multiK: 0.65, normalCap: 2 });
    expect(readFileSync('src/core/cp8.ts', 'utf8')).toMatch(/rc22 defaults（自訂/);
  });
  it('decision (b): loot screen shows 「最大 HP −N」', () => expect(readFileSync('src/game/app.ts', 'utf8')).toContain('最大 HP −${l.hpDrop}'));
  it('health potion cooldown is 1 round under cp8 (cp9-rc6 自訂)', () => withCp8(() => {
    const p = newPlayer(); starterKit(p); const d = derive(p);
    const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e6; m.adb = 1;
    const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 3, mana: 0, spirit: 0 }); b.hp = 10;
    act(b, { kind: 'item', id: 'health' }, new Rng(1));
    expect(b.itemCd.health).toBeLessThanOrEqual(2); expect(b.itemCd.health).toBeGreaterThanOrEqual(1);
  }));
  it('cp9（自訂）: normal fights have 1–2 monsters under cp8', () => withCp8(() => {
    const p = newPlayer(); starterKit(p); for (let i = 0; i < 10; i++) { const n = encounter(startRun(p, i), pool, 'battle').length; expect(n).toBeGreaterThanOrEqual(1); expect(n).toBeLessThanOrEqual(2); } // cp9: NodeType is 'battle' (was 'normal', a tsc error)
  }));
});
