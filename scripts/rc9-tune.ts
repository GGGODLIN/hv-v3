/** rc9 tuning harness (sim only). One pass per school reproduces cp6-abyss-sim (T=10 trips: trip1 depth, per-entry death
 * rates d13/d16) and rc7-targets (fresh fights from the first-F20-clear character and from the snapshot at best ≥ 15), plus
 * the rc9 target: fresh d1/d2/d3 normal fights from the first-F20-clear character. Main-tower characters are cached in
 * /tmp/rc9cache (the abyss knobs do not touch the main tower). UI-only AI, each school plays its own style.
 * Env knobs: LPD HS DS DPD TR (ABYSS.*), SEED0. Usage: SC=blade npx tsx scripts/rc9-tune.ts [N=256] [F=4] → one JSON line. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { autoRun, fight, profsOf, starterKit, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, type Player } from '../src/core/player';
import { RULES, abyssOpen, armBattle, battleLocks, encounter, openingOc, runDerived, startAbyss } from '../src/core/run';
import { ABYSS, checkpointStart, emptyRecord, recordTitles, recordTrip, type AbyssSchool } from '../src/core/abyss';
import { armCp5, startBattle } from '../src/core/battle';
import { Rng } from '../src/core/rng';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true;
const E = process.env;
if (E.LPD) ABYSS.playerLevelPerDepth = Number(E.LPD); if (E.HS) ABYSS.hpScale = Number(E.HS); if (E.DS) ABYSS.dmgScale = Number(E.DS);
if (E.DPD) ABYSS.dmgPerDepth = Number(E.DPD); if (E.TR) ABYSS.tierRamp = Number(E.TR);
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
mkdirSync('/tmp/rc9cache', { recursive: true });
const W = () => ({ w: 0, n: 0 }); const c: Record<string, { w: number; n: number }> = { d1: W(), d2: W(), d3: W(), d5: W(), d13: W(), d16: W(), d18: W(), d20: W() };
const first: number[] = [], reach: Record<number, number> = {}, endAt: Record<number, number> = {}; let deep = 0, built = 0;
for (let s = S0 + 1; s <= S0 + N; s++) {
  const cf = `/tmp/rc9cache/${sc}-${s}.json`; let p: Player | null;
  if (existsSync(cf)) p = JSON.parse(readFileSync(cf, 'utf8'));
  else { const q = newPlayer(); starterKit(q, s); let ok = false;
    for (let i = 1; i <= 60; i++) if (autoRun(q, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3 }).settlement.outcome === 'clear') { ok = true; break; }
    p = ok && abyssOpen(q) ? q : null; writeFileSync(cf, JSON.stringify(p)); }
  if (!p) continue; built++;
  for (let f = 1; f <= F; f++) { for (const d of [1, 2, 3]) { c[`d${d}`]!.n++; if (one(p, d, 'battle', s * 100 + f)) c[`d${d}`]!.w++; } c.d5!.n++; if (one(p, 5, 'boss', s * 100 + f)) c.d5!.w++; }
  const rec = emptyRecord(); let snap: Player | null = null;
  for (let t = 1; t <= T; t++) {
    const r = autoRun(p, pool, s * 1000 + 100 + t, strat, { mode: 'counter', retreat: 0.3, abyss: checkpointStart(rec.best), cap: 60, ms: rec.ms });
    if (t === 1) first.push(r.abyss!.cleared);
    if (r.settlement.outcome === 'dead') endAt[r.abyss!.cleared + 1] = (endAt[r.abyss!.cleared + 1] ?? 0) + 1;
    { const st = checkpointStart(rec.best); for (let d = st; d <= r.abyss!.cleared + (r.settlement.outcome === 'dead' ? 1 : 0); d++) reach[d] = (reach[d] ?? 0) + 1; }
    recordTitles(rec, r.abyss!.ms, r.abyss!.titles); recordTrip(rec, r.abyss!.cleared, r.abyss!.school as AbyssSchool);
    if (!snap && rec.best >= 15) snap = clone(p);
  }
  if (!snap) continue; deep++;
  for (let f = 1; f <= F; f++) for (const [d, ty] of [[13, 'battle'], [18, 'battle'], [16, 'battle'], [20, 'boss']] as const) { c[`d${d}`]!.n++; if (one(snap, d, ty, s * 100 + f)) c[`d${d}`]!.w++; }
}
const q = (a: number[], k: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(k * s.length))]!; };
const rate = (d: number) => (reach[d] ? (endAt[d] ?? 0) / reach[d]! : NaN);
const t1d = (lo: number, hi: number) => first.filter((x) => x + 1 >= lo && x + 1 <= hi).length; // trip-1 ended at depth cleared+1
const win = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.n ? Math.round((1000 * v.w) / v.n) / 10 : null]));
console.log(JSON.stringify({ sc, S0, N, knobs: { LPD: ABYSS.playerLevelPerDepth, HS: ABYSS.hpScale, DS: ABYSS.dmgScale, DPD: ABYSS.dmgPerDepth, TR: ABYSS.tierRamp },
  built, deep, trip1: { p25: q(first, 0.25), med: q(first, 0.5), p75: q(first, 0.75) }, trip1End: { d1_3: t1d(1, 3), d4_10: t1d(4, 10), d11_20: t1d(11, 20), d21p: t1d(21, 999) },
  r13: rate(13), r16: rate(16), ratio: rate(16) / rate(13), win }));
