/** CP7 手感 sim (docs/cp7-feel.md §指標). One school × one seed set → one JSON line; scripts/cp7-report.ts turns the lines into CHECK lines.
 * Per seed: main-tower trips (counter AI, retreat 0.3) until the first F20 clear (max 60), then T=10 abyss trips from the checkpoint
 * (cap d60), then fresh fights like rc9-tune (d1/d2/d3 normal + d5 boss from the first-clear character; d13/d16/d18 normal + d20 boss
 * from the snapshot at best ≥ 15). No character cache (CP7 changes the main tower too).
 * Env: SC=<school> SEED0 CP7=0|1 (default 1) PITY WINHEAL (CP7 knobs) ; Usage: npx tsx scripts/cp7-sim.ts [N=256] [F=4] */
import { readFileSync } from 'node:fs';
import { autoRun, fight, profsOf, starterKit, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, type Player } from '../src/core/player';
import { RULES, abyssOpen, armBattle, battleLocks, encounter, openingOc, runDerived, startAbyss } from '../src/core/run';
import { checkpointStart, emptyRecord, recordTitles, recordTrip, type AbyssSchool } from '../src/core/abyss';
import { armCp5, startBattle } from '../src/core/battle';
import { CP7 } from '../src/core/cp7';
import { Rng } from '../src/core/rng';
const E = process.env;
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = E.CP7 !== '0';
for (const k of Object.keys(CP7) as (keyof typeof CP7)[]) if (E[`K_${k}`] && typeof CP7[k] === "number") (CP7 as Record<string, unknown>)[k] = Number(E[`K_${k}`]);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const N = Number(process.argv[2] ?? 256), F = Number(process.argv[3] ?? 4), T = 10, S0 = Number(E.SEED0 ?? 0), sc = E.SC!;
const strat = `buff:${sc}` as Strategy; const clone = <X>(x: X): X => JSON.parse(JSON.stringify(x));
function one(p0: Player, depth: number, type: 'boss' | 'battle', seed: number): boolean {
  const p = clone(p0); const run = startAbyss(p, seed, depth);
  if (type === 'boss') run.tower.floors[0]!.options = ['boss'];
  const ms = encounter(run, pool, type);
  const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run); b.oc += openingOc(p, type, run); armCp5(b, run.pdot);
  fight(b, strat, new Rng(seed * 31 + 7), profsOf(p), 'counter'); return b.over === 'win';
}
const W = () => ({ w: 0, n: 0 }); const c: Record<string, { w: number; n: number }> = { d1: W(), d2: W(), d3: W(), d5: W(), d13: W(), d16: W(), d18: W(), d20: W() };
const first: number[] = [], firstClear: number[] = [], upgMain: number[] = [], upgAbyss: number[] = [], depthClip: number[] = [];
const reach: Record<number, number> = {}, endAt: Record<number, number> = {};
const p3 = { rest: { n: 0, full: 0 }, none: { n: 0, full: 0 } };
let built = 0, deep = 0;
for (let s = S0 + 1; s <= S0 + N; s++) {
  const p = newPlayer(); starterKit(p, s); let ok = false, i = 1;
  for (; i <= 60; i++) { const r = autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3 }); upgMain.push(r.upg ?? 0); if (r.settlement.outcome === 'clear') { ok = true; break; } }
  firstClear.push(ok ? i : 99);
  if (!ok || !abyssOpen(p)) continue; built++;
  for (let f = 1; f <= F; f++) { for (const d of [1, 2, 3]) { c[`d${d}`]!.n++; if (one(p, d, 'battle', s * 100 + f)) c[`d${d}`]!.w++; } c.d5!.n++; if (one(p, 5, 'boss', s * 100 + f)) c.d5!.w++; }
  const rec = emptyRecord(); let snap: Player | null = null;
  for (let t = 1; t <= T; t++) {
    const st = checkpointStart(rec.best);
    const r = autoRun(p, pool, s * 1000 + 100 + t, strat, { mode: 'counter', retreat: 0.3, abyss: st, cap: 60, ms: rec.ms });
    const cl = r.abyss!.cleared, dead = r.settlement.outcome === 'dead';
    if (t === 1) first.push(cl);
    upgAbyss.push(r.upg ?? 0); depthClip.push(Math.min(20, Math.max(10, cl)));
    if (dead) endAt[cl + 1] = (endAt[cl + 1] ?? 0) + 1;
    for (let d = st; d <= cl + (dead ? 1 : 0); d++) reach[d] = (reach[d] ?? 0) + 1;
    if (st <= 13 && cl >= 12) { const k = (r.rests ?? []).some((d) => d >= 13 && d < 20) ? 'rest' : 'none'; p3[k].n++; if (cl >= 20) p3[k].full++; }
    recordTitles(rec, r.abyss!.ms, r.abyss!.titles); recordTrip(rec, cl, r.abyss!.school as AbyssSchool);
    if (!snap && rec.best >= 15) snap = clone(p);
  }
  if (!snap) continue; deep++;
  for (let f = 1; f <= F; f++) for (const [d, ty] of [[13, 'battle'], [18, 'battle'], [16, 'battle'], [20, 'boss']] as const) { c[`d${d}`]!.n++; if (one(snap, d, ty, s * 100 + f)) c[`d${d}`]!.w++; }
}
const win = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.n ? v.w / v.n : null]));
console.log(JSON.stringify({ sc, S0, N, cp7: RULES.cp7, knobs: Object.fromEntries(Object.entries(CP7).filter(([, v]) => typeof v === "number")), built, deep, first, firstClear, upgMain, upgAbyss, depthClip, reach, endAt, p3, win }));
