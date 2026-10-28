import { describe, expect, it } from 'vitest';
import { newPlayer } from '../src/core/player';
import { routeAdvice9, runDerived, startAbyss } from '../src/core/run';
// rc11 item 7: QA oc-4 HP 80/792, no potions, ★ pointed at a F31 battle and died. Low HP → rest > merchant/chest > shrine > battle/elite.
function at(opts: string[], depth: number, pots: number, hp: number, credits: number) {
  const p = newPlayer(); p.potions.health = pots; p.credits = credits;
  const run = startAbyss(p, 1, depth) as any;
  run.floor = 1; run.tower.floors[0] = { n: 1, options: opts }; run.tower.floors.length = 1;
  run.hp = Math.min(hp, runDerived(p, run).hp); return routeAdvice9(p, run);
}
describe('rc11 item 7: low-HP route', () => {
  for (const credits of [0, 500]) for (const opts of [['battle', 'chest'], ['battle', 'merchant'], ['elite', 'battle', 'shrine'], ['battle', 'elite', 'rest', 'merchant'], ['battle', 'chest', 'merchant']])
    it(`HP 10%, 0 potions, ${credits}C: ${opts.join('/')} → not a fight`, () => {
      const a = at(opts, 30, 0, 8, credits)!; // newPlayer HP is small: 8 HP ≈ the QA 80/792 fraction
      expect(['battle', 'elite']).not.toContain(opts[a.i]);
      if (opts.includes('rest')) expect(opts[a.i]).toBe('rest');
    });
});
describe('rc11 item 7: QA oc-4 F31 (combat-only floor, HP 80/792, 0 potions) → ★ 撤退回城', () => {
  const frac = (opts: string[], f: number, pots = 0) => { const p = newPlayer(); p.potions.health = pots; const run = startAbyss(p, 1, 30) as any;
    run.floor = 1; run.tower.floors[0] = { n: 1, options: opts }; run.tower.floors.length = 1; run.hp = runDerived(p, run).hp * f; return routeAdvice9(p, run); };
  it('QA case', () => { const a = frac(['battle', 'elite'], 80 / 792)!; expect(a.retreat).toBe(true); expect(a.i).toBe(-1); expect(a.why).toMatch(/撤退回城/); });
  it('with a potion or healthy HP it still advises the fight', () => {
    expect(frac(['battle', 'elite'], 80 / 792, 1)?.retreat).toBeUndefined();
    expect(frac(['battle', 'elite'], 0.5)?.retreat).toBeUndefined();
  });
});
