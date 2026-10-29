import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { RUN12AA, ocBoss12aa, RUN12Z } from '../src/core/cp8';
// rc12aa（自訂）: 遊戲與 sim 共用 src/core，預設開啟。
describe('rc12aa fixes (defaults on)', () => {
  it('defaults', () => {
    expect(RUN12AA).toEqual({ arcChg: 0.2, ocLo: 0.4, ocFrom: 40, ocMid: 65, ocTo: 70, b70Hp: 0.3, b70Dmg: 1, b70Plain: 0.35 });
    expect(RUN12Z.tiredAt).toBe(25); expect(RUN12Z.tiredCap).toBe(0.15); // rc12aa 5：保留
  });
  it('oc boss HP curve is smooth and continuous', () => {
    expect(ocBoss12aa(40)).toBeCloseTo(1); expect(ocBoss12aa(65)).toBeCloseTo(0.4); expect(ocBoss12aa(70)).toBeCloseTo(1);
    for (let f = 30; f < 80; f++) expect(Math.abs(ocBoss12aa(f + 1) - ocBoss12aa(f))).toBeLessThanOrEqual(0.13);
  });
  it('wired into shared run/battle code, not the browser entry', () => {
    const run = readFileSync('src/core/run.ts', 'utf8'), bat = readFileSync('src/core/battle.ts', 'utf8');
    expect(run).toContain('.chg12aa = RUN12AA.arcChg');
    expect(run).toContain('RUN12AA.b70Hp'); expect(run).toContain('RUN12AA.b70Plain');
    expect(bat).toContain('.chg12aa || 1');
    for (const f of ['src/game/app.ts', 'src/main.ts']) expect(readFileSync(f, 'utf8')).not.toMatch(/SIM_R12AA/);
  });
});
