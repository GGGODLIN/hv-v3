// rc12d+ items 2/3（製作人，自訂）: low-HP map text names only nodes the floor has (QA oc1 F37); retreat ★ ⇔ potions ≤ 1 and HP < 25%, 🧭 and ★ agree.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { App } from '../src/game/app';
import { newPlayer } from '../src/core/player';
import { RULES, ROUTE9, runDerived, startAbyss, lowHpMapText9 } from '../src/core/run';
function html(opts: string[], frac: number, pots: number, credits = 0) {
  const p = newPlayer(); p.potions.health = pots; p.credits = credits;
  const run = startAbyss(p, 1, 50) as any;
  run.floor = 2; run.tower.floors = [{ n: 1, options: ['battle', 'chest'] }, { n: 2, options: opts }]; run.path = [0];
  run.hp = Math.max(1, Math.floor(runDerived(p, run).hp * frac));
  const a = Object.create(App.prototype) as any; a.data = { player: p, run }; a.notice = [];
  return a.mapHtml() as string;
}
const retreatBtn = (h: string) => h.match(/<button data-retreat[^>]*>(.*?)<\/button>/)![1]!;
const why = (h: string) => h.match(/data-routewhy>(.*?)<\/div>/)?.[1] ?? '';
describe('rc12d+ map low-HP text and retreat ★', () => {
  let o: boolean[] = [];
  beforeAll(() => { o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; });
  afterAll(() => { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; });
  it('oc1 F37 (merchant/chest/shrine, 0 potions): no 「休息節點」 advice', () => {
    const h = html(['merchant', 'chest', 'shrine'], 0.17, 0, 1e6);
    expect(h).not.toMatch(/走休息節點/); expect(h).toMatch(/沒有生命藥水了：建議撤退回城/); // rc12j item 3: HP 17% + 0 potions → ★ = 撤退, text follows ★
  });
  it('rest present → 優先走休息節點; head mentions rest only when present', () => {
    expect(lowHpMapText9(['rest', 'battle'], 0, true).noPot).toMatch(/優先走休息節點/);
    expect(lowHpMapText9(['battle', 'chest'], 2, true).head).not.toMatch(/休息/);
    expect(lowHpMapText9(['battle', 'elite'], 0, true).noPot).toMatch(/撤退回城/);
  });
  it('retreat ★ iff potions ≤ 1 and HP < 25%, 🧭 says the same', () => {
    expect(ROUTE9.retreatPots).toBe(1);
    for (const [opts, frac, pots, want] of [[['merchant', 'chest', 'shrine'], 0.17, 1, true], [['battle', 'rest'], 0.2, 0, true], [['battle', 'elite'], 0.2, 2, false], [['battle', 'elite'], 0.3, 0, false]] as const) {
      const h = html([...opts], frac, pots);
      expect(retreatBtn(h).includes('★建議')).toBe(want);
      expect(why(h).includes('撤退回城')).toBe(want);
      if (want) expect(h.match(/★建議/g)!.length).toBe(1);
    }
  });
});
