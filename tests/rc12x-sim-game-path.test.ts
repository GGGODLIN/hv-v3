// rc12x（製作人，自訂）: the sim (autoRun → finishBattle / battleLoot / autoAllocate) and the game (App.endBattle, 出發前整備 自動分配 = prepAlloc)
// share one code path for the win heal, the elite potion drop and stat-point allocation.
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { App } from '../src/game/app';
import { presetPlayer, type Preset } from '../src/core/preset';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, startAbyss, encounter, battleLoot, finishBattle, runDerived } from '../src/core/run';
import { startBattle } from '../src/core/battle';
import { autoRun, type Strategy } from '../src/core/auto';
import { prepAlloc } from '../src/core/prep';
import { CP7 } from '../src/core/cp7';
import { RUN12U, RUN12X, curveSchool12g } from '../src/core/cp8';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const PR = JSON.parse(readFileSync('public/data/cp6-presets.json', 'utf8')) as Record<string, Preset>;
const SCHOOLS = ['blade', 'bulwark', 'oc', 'arcane'] as const;
const noop = () => undefined;
const stage = new Proxy({ speed: 1 }, { get: (t: any, k) => (k in t ? t[k] : k === 'lootBeams' ? async () => undefined : noop) });
const mem: Record<string, string> = {};
(globalThis as any).localStorage ??= { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = String(v); }, removeItem: (k: string) => { delete mem[k]; } };
function app(sc: string, depth: number, type: string, seed: number) {
  const p = presetPlayer(PR[`postF20-${sc}`]!);
  const run = startAbyss(p, seed, depth) as any;
  run.tower.floors[run.floor - 1] = { n: run.floor, options: [type] };
  const a = Object.create(App.prototype) as any;
  Object.assign(a, { data: { player: p, run, settings: { skipAnim: true } }, notice: [], pending: {}, stage, pool, root: { querySelectorAll: () => [] }, recent: [], log: [] });
  a.go = noop; a.render = noop; a.save = noop;
  return a;
}
/** Game path: App.enterNode → endBattle at hp0 (fraction of max). Sim path: the same start state through finishBattle (what autoRun calls). */
async function both(sc: string, depth: number, type: string, seed: number, hp0 = 0.3) {
  const a = app(sc, depth, type, seed); const st = structuredClone({ p: a.data.player, run: a.data.run });
  await a.enterNode(0); const b = a.battle; const max = b.d.hp;
  const simB = structuredClone(b);
  for (const x of [b, simB]) { for (const m of x.monsters) m.hp = 0; x.over = 'win'; x.hp = Math.round(max * hp0); }
  const h0 = a.p.potions.health; await a.endBattle();
  const game = { hp: a.run.hp, max: runDerived(a.p, a.run).hp, pot: a.p.potions.health - h0, rng: a.run.rng };
  // sim: replay enterNode's rng use (encounter) on the clone, then finishBattle with the same monsters.
  const ms = encounter(st.run, pool, type as any, curveSchool12g(st.p)); expect(ms.map((m) => m.name)).toEqual(a.monsters.map((m: any) => m.name));
  const sb = startBattle(runDerived(st.p, st.run), { hp: st.run.hp, mp: st.run.mp, sp: st.run.sp, oc: st.run.oc }, ms, st.p.potions); Object.assign(sb, { monsters: simB.monsters, over: 'win', hp: simB.hp, potions: { ...simB.potions } });
  const h1 = sb.potions.health; finishBattle(st.p, st.run, sb, ms, type as any);
  const sim = { hp: st.run.hp, max: runDerived(st.p, st.run).hp, pot: st.p.potions.health - h1, rng: st.run.rng };
  return { game, sim, start: Math.round(max * hp0), max0: max };
}
describe('rc12x sim == game path', () => {
  let o: boolean[] = [];
  beforeAll(() => { o = [RULES.cp6Abyss, RULES.cp5Bosses, RULES.cp4RunBuffs, RULES.cp7, RULES.cp8]; RULES.cp6Abyss = RULES.cp5Bosses = RULES.cp4RunBuffs = RULES.cp7 = RULES.cp8 = true; });
  afterAll(() => { [RULES.cp6Abyss, RULES.cp5Bosses, RULES.cp4RunBuffs, RULES.cp7, RULES.cp8] = o as [boolean, boolean, boolean, boolean, boolean]; });
  it('win heal: every win (battle / elite / boss) heals 20% max HP, game == sim', async () => {
    expect(RUN12X.winHealAll).toBe(1); expect(CP7.winHeal + CP7.winHealNormal).toBeCloseTo(0.2);
    for (const sc of SCHOOLS) for (const type of ['battle', 'elite', 'boss']) {
      const { game, sim, start, max0 } = await both(sc, 30, type, 11);
      expect(game).toEqual(sim);
      if (game.max === max0) expect(game.hp - start).toBe(Math.round(max0 * 0.2));
    }
  });
  it('elite potion: one shared 35% rule from F15 for every school; game == sim per seed', async () => {
    expect(RUN12U.elitePotP).toBe(0.35); expect(RUN12U.elitePotFrom).toBe(15);
    for (const sc of SCHOOLS) {
      for (const seed of [3, 4, 5]) { const { game, sim } = await both(sc, 20, 'elite', seed); expect(game.pot).toBe(sim.pot); }
      const p = presetPlayer(PR[`postF20-${sc}`]!); let h = 0, h14 = 0; const N = 400;
      for (let s = 1; s <= N; s++) {
        const r = startAbyss(p, s * 7 + 3, 20); h += battleLoot(r, encounter(r, pool, 'elite', curveSchool12g(p)), 'elite', p).potions.health ?? 0;
        const r2 = startAbyss(p, s * 7 + 3, 14); h14 += battleLoot(r2, encounter(r2, pool, 'elite', curveSchool12g(p)), 'elite', p).potions.health ?? 0;
      }
      expect(h / N).toBeGreaterThan(0.29); expect(h / N).toBeLessThan(0.41); expect(h14).toBe(0);
    }
  }, 120000);
  it('allocation: sim town prep (SIM_NOPREP=alloc, the scripts default) == 出發前整備 自動分配 (prepAlloc)', () => {
    for (const f of ['scripts/rc12m-fullrun.ts', 'scripts/rc12u-bossdiag.ts']) expect(readFileSync(f, 'utf8')).toContain("SIM_NOPREP: 'alloc'");
    const E = process.env, keep = E.SIM_NOPREP; E.SIM_NOPREP = 'alloc';
    try {
      for (const sc of SCHOOLS) {
        const g = presetPlayer(PR[`postF20-${sc}`]!); const spent = prepAlloc(g); expect(spent).toBeGreaterThan(0);
        const s = presetPlayer(PR[`postF20-${sc}`]!); autoRun(s, pool, 101, `buff:${sc}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 1, ms: 0 });
        expect(s.attrs).toEqual(g.attrs);
      }
    } finally { if (keep === undefined) delete E.SIM_NOPREP; else E.SIM_NOPREP = keep; }
  });
  it('sim does not autoEquip from the bag mid-run (game only auto-wears ▲ drops via applyLoot)', () => {
    expect(RUN12X.gamePath).toBe(1);
    expect(readFileSync('src/core/auto.ts', 'utf8').match(/!SIM_AI\.naive && !\(RUN12X\.gamePath && RULES\.cp8\)/g)?.length).toBe(2);
  });
});
