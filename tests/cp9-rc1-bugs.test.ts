import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { turnDamage, deathCharge, type BEvent } from '../src/core/battle';
// cp9 (d)（自訂）: qa-rc22 bugs 1–3
describe('cp9 (d) qa-rc22 bugs', () => {
  it('bug 1: turn damage counts burn/bleed ticks and every hit (blade8: 240 listed vs 263 HP)', () => {
    const ev: BEvent[] = [
      { t: 'hit', from: 0, to: 'player', dmg: 200, crits: 0, avoided: null },
      { t: 'hit', from: 1, to: 'player', dmg: 40, crits: 0, avoided: null },
      { t: 'hit', from: 'player', to: 0, dmg: 999, crits: 0, avoided: null },
      { t: 'pdot', kind: 'burn', dmg: 15 }, { t: 'pdot', kind: 'bleed', dmg: 8 },
    ];
    expect(turnDamage(ev)).toBe(263);
    const app = readFileSync('src/game/app.ts', 'utf8');
    expect(app).toContain('taken: turnDamage(ev)'); expect(app).toContain('const taken = turnDamage(ev)');
  });
  it('bug 2: death advice names the charged killer, not an earlier charger', () => {
    const a = { who: '霜棘元素靈', charged: true }, k = { who: '雷冠殭屍', charged: true }, n = { who: '小怪', charged: false };
    expect(deathCharge([a, k], k)!.who).toBe('雷冠殭屍');
    expect(deathCharge([k, a], k)!.who).toBe('雷冠殭屍');
    expect(deathCharge([a, n], n)!.who).toBe('霜棘元素靈');
    expect(deathCharge([n], n)).toBeUndefined();
  });
  it('bug 3: S is not held behind the charge hold (so the S hint clears once pressed)', () => {
    const app = readFileSync('src/game/app.ts', 'utf8');
    expect(app).not.toMatch(/\/\^\(defend\|item:\)\//);
    expect(app).toMatch(/performance\.now\(\) < this\.chargeHoldUntil && !windSafeKey\(cmd\)/); expect(readFileSync('src/core/battle.ts', 'utf8')).toContain('/^(defend|item:|spirit)/.test(cmd) || STUN_SKILLS'); // cp9-rc7 QA item 4（自訂）: S still instant via windSafeKey
  });
});
