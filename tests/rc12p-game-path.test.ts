// rc12p（製作人，自訂）: game entry point (App.enterNode → startBattle → endBattle → nodeHtml) — boss potion grant, no potions from normal/elite/chest in the abyss, gear guarantee, capped preview shared with ★.
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { App } from '../src/game/app';
import { newPlayer } from '../src/core/player';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, startAbyss, chestLoot, bossPot12p, bossGearQ12o } from '../src/core/run';
import { guaranteeQuality } from '../src/core/abyss';
import { RUN12M, RUN12O } from '../src/core/cp8';
import { chargeEstimate, hitCap9, budget9, windingUp } from '../src/core/battle';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const noop = () => undefined;
const stage = new Proxy({ speed: 1 }, { get: (t: any, k) => (k in t ? t[k] : k === 'lootBeams' ? async () => undefined : noop) });
const mem: Record<string, string> = {};
(globalThis as any).localStorage ??= { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = String(v); }, removeItem: (k: string) => { delete mem[k]; } };
function app(depth: number, type: string, seed = 7) {
  const p = newPlayer(); p.potions.health = 0;
  const run = startAbyss(p, seed, depth) as any;
  run.tower.floors[run.floor - 1] = { n: run.floor, options: [type] };
  const a = Object.create(App.prototype) as any;
  Object.assign(a, { data: { player: p, run, settings: { skipAnim: true } }, notice: [], pending: {}, stage, pool, root: { querySelectorAll: () => [] }, recent: [], log: [] });
  a.go = noop; a.render = noop; a.save = noop;
  return a;
}
async function win(a: any, type: string) {
  await a.enterNode(0);
  const b = a.battle; expect(b).toBeTruthy();
  return { b, finish: async () => { for (const m of b.monsters) m.hp = 0; b.over = 'win'; const h0 = a.p.potions.health; await a.endBattle(); return { loot: a.pending.loot, gained: a.p.potions.health - h0 }; } };
}
describe('rc12p game path', () => {
  let o: boolean[] = [];
  beforeAll(() => { o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; });
  afterAll(() => { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; });
  it('boss win (d≥25): bossReward potions ×1 (deterministic), gear ≥ guarantee, 王戰獎勵 line on the loot screen', async () => {
    expect(RUN12M.on && RUN12O.on).toBe(true); expect(bossPot12p(30)).toBe(1); expect(bossPot12p(20)).toBe(0);
    for (const seed of [1, 2, 3]) {
      const a = app(30, 'boss', seed); const { finish } = await win(a, 'boss'); const { loot, gained } = await finish();
      expect(loot.bossReward).toBeTruthy(); expect(loot.bossReward.potions).toBe(1); expect(gained).toBeGreaterThanOrEqual(1);
      const q = bossGearQ12o(guaranteeQuality(30)); expect(loot.bossReward.quality).toBe(q);
      expect(loot.equips.some((e: any) => loot.guaranteed?.includes(e.id) && e.quality === q)).toBe(true);
      const h = a.nodeHtml() as string;
      expect(h).toMatch(/王戰獎勵：藥水 ×1、裝備保底 .+ 階/); expect(h).toMatch(new RegExp(`data-bossreward="1:${q}"`));
    }
  });
  it('normal / chest in the abyss give no potions; elite drops 0 or 1 from F15 (rc12v 自訂: chance)', async () => {
    const g: number[] = []; for (let seed = 1; seed <= 12; seed++) { const a = app(40, 'elite', seed); const { finish } = await win(a, 'elite'); const { gained } = await finish(); g.push(gained); }
    expect(g.every((x) => x === 0 || x === 1)).toBe(true); expect(g).toContain(0); expect(g).toContain(1);
    for (const t of ['battle']) for (const seed of [1, 2, 3, 4, 5, 6]) {
      const a = app(40, t, seed); const { finish } = await win(a, t); const { loot, gained } = await finish();
      expect(gained).toBe(0); expect(Object.values(loot.potions).every((v) => !v)).toBe(true); expect(loot.bossReward).toBeUndefined();
      expect(a.nodeHtml()).not.toMatch(/王戰獎勵/);
    }
    for (const seed of [1, 2, 3, 4, 5, 6]) { const a = app(40, 'chest', seed); expect(Object.values(chestLoot(a.run, a.p).potions).every((v) => !v)).toBe(true); }
  });
  it('preview / ★ estimate is capped by the same hitCap9 and turn budget as the real hit', async () => {
    const a = app(70, 'boss'); const { b } = await win(a, 'boss');
    for (const m of b.monsters) { m.adb = 1e7; m.heavyNext = true; }
    for (const m of b.monsters) {
      const e = chargeEstimate(b, m, false, true);
      expect(e).toBeLessThanOrEqual(hitCap9(b, m, 1, true) + 1e-6);
      expect(e).toBeLessThanOrEqual(budget9(b, windingUp(m)) + 1e-6);
      expect(e).toBeLessThanOrEqual(b.d.hp * 0.5);
    }
  });
});
