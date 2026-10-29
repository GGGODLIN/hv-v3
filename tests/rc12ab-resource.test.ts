import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { RUN12AB, winHeal12ab, RUN12AA } from '../src/core/cp8';
import { bossPot12p } from '../src/core/run';
// rc12ab（自訂）: 深層資源端消耗，遊戲與 sim 共用，預設開啟。
describe('rc12ab resource drain (defaults on)', () => {
  it('keeps rc12aa items', () => { expect(RUN12AA.arcChg).toBe(0.2); expect(RUN12AA.b70Hp).toBe(0.3); expect(RUN12AA.b70Dmg).toBe(1); });
  it('win heal curve: 20% to F60, linear to 5% at F80, floor 5%', () => {
    expect(winHeal12ab(30)).toBeCloseTo(0.2); expect(winHeal12ab(60)).toBeCloseTo(0.2); expect(winHeal12ab(70)).toBeCloseTo(0.125);
    expect(winHeal12ab(80)).toBeCloseTo(0.05); expect(winHeal12ab(100)).toBeCloseTo(0.05);
  });
  it('boss +1 potion stops from F70; elite potion F70+ uses elite70P', () => {
    expect(bossPot12p(65)).toBe(1); expect(bossPot12p(69)).toBe(1); expect(bossPot12p(75)).toBe(0); expect(bossPot12p(95)).toBe(0); /* rc12ad 3（自訂）: F70/80/90/100 保底 +1，見 rc12ad-star.test */
    expect(RUN12AB.elite70From).toBe(70); expect(RUN12AB.elite70P).toBe(0.2);
    const run = readFileSync('src/core/run.ts', 'utf8');
    expect(run).toContain('RUN12AB.elite70From ? RUN12AB.elite70P : RUN12U.elitePotP');
    expect(run).toContain('winHeal12ab(depthOf(run) || run.floor) / RUN12AB.healHi');
    for (const f of ['src/game/app.ts', 'src/main.ts']) expect(readFileSync(f, 'utf8')).not.toMatch(/SIM_R12AB/);
  });
});
