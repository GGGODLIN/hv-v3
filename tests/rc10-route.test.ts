import { describe, expect, it } from 'vitest';
import { newPlayer } from '../src/core/player';
import { RULES, ROUTE9, potNeed9, routeAdvice9, runDerived, startAbyss } from '../src/core/run';

// rc10 spec item 2（自訂）: route ★建議 — merchant before a boss when potions are low; chests are scored, not always last.
function at(opts: string[], depth: number, pots: number, hpFrac = 1, credits = 500) {
  const p = newPlayer(); p.potions.health = pots; p.credits = credits;
  const run = startAbyss(p, 1, depth) as any;
  run.floor = 1; run.tower.floors[0] = { n: 1, options: opts }; run.tower.floors.length = 1;
  run.hp = runDerived(p, run).hp * hpFrac;
  return routeAdvice9(p, run);
}
describe('rc10 route advice', () => {
  it('pre-boss floor with low potions → merchant, even over rest', () => {
    const a = at(['rest', 'merchant'], 9, 2, 0.7);
    expect(a?.i).toBe(1); expect(a?.why).toMatch(/首領/);
  });
  it('pre-boss with potions enough and HP < 90% → rest', () => { expect(at(['rest', 'merchant'], 9, 6, 0.7)?.i).toBe(0); });
  it('low potions, no credits → not merchant', () => { expect(at(['rest', 'merchant'], 9, 0, 0.95, RULES.potionPrice.health - 1)?.i).toBe(0); });
  it('chest beats shrine and battle-free filler; merchant wins when potions are low', () => {
    expect(at(['shrine', 'chest'], 7, 5)?.i).toBe(1);
    expect(at(['chest', 'merchant'], 7, 1)?.i).toBe(1);
  });
  it('single option → no advice', () => { expect(at(['boss'], 10, 0)).toBeNull(); });
});

describe('rc11 item 5: potion threshold = next boss estimate', () => {
  it('need grows with depth; 4 potions at a deep pre-boss floor → merchant, at a shallow one → rest', () => {
    expect(at(['rest', 'merchant'], 4, 4, 0.7)?.i).toBe(0);
    const a = at(['rest', 'merchant'], 39, 4, 0.7); expect(a?.i).toBe(1); expect(a?.why).toMatch(/預估 \d+ 瓶/);
  });
  it('potNeed9 is 3 up to depth 20 and capped at 8', () => {
    const p = newPlayer(); const r = startAbyss(p, 1, 9) as any; expect(potNeed9(r)).toBe(3);
    const r2 = startAbyss(p, 1, 99) as any; expect(potNeed9(r2)).toBe(8);
  });
});
