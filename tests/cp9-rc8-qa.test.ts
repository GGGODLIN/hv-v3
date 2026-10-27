// cp9-rc8 QA（自訂）: bug b banner copy; QA c boss never winds up on the boss turn right after its own telegraphed heavy hit.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { act, startBattle, WIND9 } from '../src/core/battle';
import { urgentLine } from '../src/game/app';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { Rng } from '../src/core/rng';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);

describe('cp9-rc8 QA', () => {
  it('bug b: lethal but survivable by defending → orange 不防禦會死; still lethal when defending → red', () => {
    const o = urgentLine({ est: 425, hp: 384 }, 297);
    expect(o).toContain('warn-def'); expect(o).toContain('不防禦會死：暴擊估 425 ≥ HP 384，防禦後 297'); expect(o).not.toContain('class="warn"');
    const r = urgentLine({ est: 425, hp: 384 }, 400);
    expect(r).toContain('class="warn"'); expect(r).not.toContain('不防禦會死');
    expect(urgentLine({ est: 425, hp: 384 })).toContain('class="warn"');
  });
  it('QA c: no boss wind-up on the boss turn after its telegraphed heavy hit (boss + minions, many seeds)', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      WIND9.hits = 0; WIND9.viol = 0; WIND9.minion = 0; WIND9.ex.length = 0;
      for (let seed = 1; seed <= 150; seed++) {
        const p = newPlayer(); starterKit(p); const d = derive(p);
        const boss = buildMonster(pool.rows[seed % pool.rows.length]!, 30, 'boss'); boss.hp = boss.maxHp = 1e6; boss.adb = d.hp * (0.3 + (seed % 5) * 0.2);
        const mins = [1, 2].map((k) => { const m = buildMonster(pool.rows[(seed * 7 + k) % pool.rows.length]!, 30, 'normal'); m.hp = m.maxHp = 1e6; m.adb = d.hp * 0.05; return m; });
        const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [boss, ...mins], { health: 0, mana: 0, spirit: 0 });
        const rng = new Rng(seed);
        for (let t = 0; t < 40 && !b.over; t++) { b.hp = b.d.hp; act(b, t % 3 ? { kind: 'attack', target: 0 } : { kind: 'defend' }, rng); }
      }
      expect(WIND9.hits).toBeGreaterThan(0);
      expect(WIND9.viol, WIND9.ex.join('\n')).toBe(0);
    } finally { RULES.cp8 = o; }
  });
});
