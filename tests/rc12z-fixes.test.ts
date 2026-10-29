import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { RUN12Z } from '../src/core/cp8';
// rc12z（自訂）: 遊戲本體與 sim 共用 src/core（run.ts encounter / battle.ts monstersAct0），預設開啟，無 SIM_* 時即生效.
describe('rc12z fixes (game path, defaults on)', () => {
  it('defaults', () => {
    expect(RUN12Z).toEqual({ noWind: 1, bwAddCap: 0.15, bwAddFrom: 45, bwAddTo: 65, ocBossHp: 0.6, tiredAt: 25, tiredCap: 0.15 });
  });
  it('defaults do not depend on a process env (browser build)', () => {
    const src = readFileSync('src/core/cp8.ts', 'utf8');
    expect(src).toContain("const RC22_ENV = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;");
    for (const k of ['BWADDCAP\') ?? 0.15', 'OCBOSSHP\') ?? 0.6', 'TIREDAT\') ?? 25', 'TIREDCAP\') ?? 0.15']) expect(src).toContain(`num('SIM_R12Z_${k}`);
  });
  it('wired into the shared encounter and battle code', () => {
    const run = readFileSync('src/core/run.ts', 'utf8'), bat = readFileSync('src/core/battle.ts', 'utf8');
    expect(run).toContain("lean === 'bulwark' && (ab || run.floor) >= RUN12Z.bwAddFrom && (ab || run.floor) <= RUN12Z.bwAddTo && RUN12Z.bwAddCap > 0)");
    expect(run.indexOf('// rc12z 1（自訂）')).toBeGreaterThan(run.indexOf('hitCap12m = RUN12M.hit;'));
    // rc12aa 2：oc 王 ×0.6 階梯改為 ocBoss12aa 平滑曲線（自訂）
    expect(run).toContain('ocBoss12aa(ab || run.floor)');
    expect(bat).toContain("s.turn > RUN12Z.tiredAt && !s.monsters.some((m) => m.rank === 'boss')");
    expect(bat).toContain('!(m as { tired12z?: boolean }).tired12z /* rc12z 3（自訂） */');
    for (const f of ['src/game/app.ts', 'src/main.ts']) expect(readFileSync(f, 'utf8')).not.toMatch(/SIM_R12Z/);
  });
});
