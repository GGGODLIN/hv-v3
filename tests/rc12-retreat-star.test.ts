import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { App } from '../src/game/app';
import { newPlayer } from '../src/core/player';
import { RULES, runDerived, startAbyss } from '../src/core/run';
// rc12 QA bug: 🧭 advised 撤退回城 at abyss F51 (HP 10%, 0 potions, battle/elite only) but no ★ on the retreat button.
// Root cause: mapHtml set this.retreat9 inside the per-floor map, so floors rendered after the current one reset it to false.
function html(opts: string[], frac: number, pots: number) {
  const p = newPlayer(); p.potions.health = pots;
  const run = startAbyss(p, 1, 50) as any;
  run.floor = 2; run.tower.floors = [{ n: 1, options: ['battle', 'chest'] }, { n: 2, options: opts }]; run.path = [0];
  run.hp = Math.max(1, Math.floor(runDerived(p, run).hp * frac));
  const a = Object.create(App.prototype) as any; a.data = { player: p, run }; a.notice = [];
  return a.mapHtml() as string;
}
const retreatBtn = (h: string) => h.match(/<button data-retreat[^>]*>(.*?)<\/button>/)![1]!;
describe('rc12: ★ on 撤退回城 when 🧭 advises retreat', () => {
  let o: boolean[] = [];
  beforeAll(() => { o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; });
  afterAll(() => { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; });
  it('F51 case: HP 10%, 0 potions, battle+elite → ★ on retreat, not on nodes', () => {
    const h = html(['battle', 'elite'], 0.1, 0);
    expect(h).toMatch(/建議撤退回城|撤退回城（保留 100%）/);
    expect(retreatBtn(h)).toContain('★建議');
    expect(h.match(/★建議/g)!.length).toBe(1);
  });
  it('healthy HP: no ★ on retreat', () => {
    expect(retreatBtn(html(['battle', 'elite'], 0.9, 3))).not.toContain('★建議');
  });
});
