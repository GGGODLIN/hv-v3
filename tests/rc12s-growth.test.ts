// rc12s item 4（自訂）: after every boss kill the loot screen shows a before→after growth panel (level, HP, attack, mitigation, 戰力, gear swaps).
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { App, growthHtml12s } from '../src/game/app';
import { newPlayer, level } from '../src/core/player';
import { levelForExp } from '../src/core/formulas';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, startAbyss } from '../src/core/run';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const noop = () => undefined;
const stage = new Proxy({ speed: 1 }, { get: (t: any, k) => (k in t ? t[k] : k === 'lootBeams' ? async () => undefined : noop) });
const mem: Record<string, string> = {};
(globalThis as any).localStorage ??= { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = String(v); }, removeItem: (k: string) => { delete mem[k]; } };
function app(depth: number, type: string, seed = 7) {
  const p = newPlayer();
  const run = startAbyss(p, seed, depth) as any;
  run.tower.floors[run.floor - 1] = { n: run.floor, options: [type] };
  const a = Object.create(App.prototype) as any;
  Object.assign(a, { data: { player: p, run, settings: { skipAnim: true } }, notice: [], pending: {}, stage, pool, root: { querySelectorAll: () => [] }, recent: [], log: [] });
  a.go = noop; a.render = noop; a.save = noop;
  return a;
}
async function winAt(type: string, seed: number) {
  const a = app(30, type, seed); await a.enterNode(0); const b = a.battle;
  for (const m of b.monsters) m.hp = 0; b.over = 'win'; await a.endBattle();
  return a;
}
describe('rc12s growth panel', () => {
  let o: boolean[] = [];
  beforeAll(() => { o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; });
  afterAll(() => { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; });
  it('boss win: panel with before→after level / HP / 戰力 rows on the loot screen', async () => {
    for (const seed of [1, 2, 3]) {
      const a = await winAt('boss', seed); const h = a.nodeHtml() as string;
      const m = h.match(/data-growth="(\d+):(\d+):(\d+):(\d+)"/); expect(m).toBeTruthy();
      expect(Number(m![2])).toBe(level(a.p)); expect(Number(m![2])).toBeGreaterThanOrEqual(Number(m![1]));
      for (const k of ['lv', 'hp', 'mp', 'adb', 'mdb', 'mit', 'pw']) expect(h).toContain(`data-growth-row="${k}"`);
      expect(h).toMatch(/成長：/); expect(h).toMatch(/→/);
    }
  });
  it('a boss kill that levels up says 升級 and marks the row ▲', async () => {
    const a = app(30, 'boss', 4); { let x = 0; while (levelForExp(x + 1) === levelForExp(0)) x++; a.p.exp = x; } // 1 EXP short of Lv 2
    await a.enterNode(0); const b = a.battle;
    for (const m of b.monsters) m.hp = 0; b.over = 'win'; await a.endBattle();
    const g = a.pending.loot.growth12s; expect(g).toBeTruthy();
    expect(g.after.lv).toBeGreaterThan(g.before.lv);
    if (g.after.lv > g.before.lv) { const h = a.nodeHtml(); expect(h).toMatch(/升級！Lv \d+ → <b>Lv \d+<\/b>/); expect(h).toMatch(/data-growth-row="lv" class="up"/); }
    else expect(a.nodeHtml()).toMatch(/本場未升級/);
  });
  it('renderer: level, stat and gear diffs', () => {
    const s = (lv: number, hp: number, pw: number, gear: Record<string, string>) => ({ lv, hp, mp: 50, adb: 100, mdb: 10, mit: 20, pw, gear });
    const h = growthHtml12s({ before: s(30, 900, 800, { body: 'a\u0000舊甲' }), after: s(31, 960, 850, { body: 'b\u0000新甲', head: 'c\u0000新盔' }) });
    expect(h).toContain('data-growth="30:31:800:850"'); expect(h).toContain('升級！Lv 30 → <b>Lv 31</b>');
    expect(h).toMatch(/最大 HP<\/td><td>900<\/td><td>→<\/td><td><b>960<\/b><\/td><td>▲ \+60/);
    expect(h).toContain('換上 2 件裝備'); expect(h).toMatch(/舊甲 → <b>新甲<\/b>/); expect(h).toMatch(/（空） → <b>新盔<\/b>/);
  });
  it('normal and elite wins have no growth panel', async () => {
    for (const t of ['battle', 'elite']) { const a = await winAt(t, 2); expect(a.nodeHtml()).not.toMatch(/data-growth=/); }
  });
});
