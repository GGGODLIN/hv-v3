import { describe, it, expect } from 'vitest';
import { fights, rowsOf, table } from '../scripts/analyze-turnlog';
describe('rc11c analyze-turnlog', () => {
  it('splits old rc11b concatenated rows into runs and fights', () => {
    const old = [ // run 1: F30 boss (3 turns), F35 boss (2 turns); run 2 (floor drops): F30 (2 turns); F10 ignored
      { floor: 30, level: 40, turn: 1, bossDmg: 100, bossHp: 900 }, { floor: 30, level: 40, turn: 2, bossDmg: 200, bossHp: 700 }, { floor: 30, level: 40, turn: 3, bossDmg: 700, bossHp: 0 },
      { floor: 35, level: 41, turn: 1, bossDmg: 50, bossHp: 1450 }, { floor: 35, level: 41, turn: 2, bossDmg: 60, bossHp: 1390 },
      { floor: 10, level: 41, turn: 1, bossDmg: 5, bossHp: 95 },
      { floor: 30, level: 42, turn: 1, bossDmg: 300, bossHp: 700 }, { floor: 30, level: 42, turn: 2, bossDmg: 700, bossHp: 0 }];
    const f = fights(rowsOf(old));
    expect(f.map((x) => [x.runId, x.floor, x.turns, x.dmgMed, x.bossMaxHp])).toEqual([['legacy-0', 30, 3, 200, 1000], ['legacy-0', 35, 2, 55, 1500], ['legacy-1', 30, 2, 500, 1000]]);
    expect(f[0]!.dmgMean).toBe(333.3);
  });
  it('turn reset on the same floor starts a new fight; new format uses runId/lean/bossMaxHp', () => {
    const j = { exportedAt: 1, turnlog: [
      { runId: 'a', lean: 'blade', floor: 30, level: 40, turn: 2, bossDmg: 10, bossHp: 90, bossMaxHp: 120 }, { runId: 'a', lean: 'blade', floor: 30, level: 40, turn: 1, bossDmg: 20, bossHp: 80, bossMaxHp: 120 },
      { runId: 'b', lean: 'oc', floor: 31, level: 39, turn: 1, bossDmg: 40, bossHp: 60 }] };
    const f = fights(rowsOf(j));
    expect(f.map((x) => [x.runId, x.lean, x.turns, x.bossMaxHp])).toEqual([['a', 'blade', 1, 120], ['a', 'blade', 1, 120], ['b', 'oc', 1, 100]]);
    expect(table({ qa: f }).split('\n')).toHaveLength(3);
  });
});
