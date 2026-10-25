/** rc6 item 1 target harness (sim only). Per school, seeds 1..N: character at its first F20 clear → d5 boss fights;
 * then abyss trips (counter AI, ≤T) until record best ≥ 15 → d16 normal fights and d20 boss fights. Each fight: full HP, fresh trip at that depth.
 * Targets (provisional, producer): d5 boss ≥75%, d16 battle ≥60%, d20 boss ≥35%.
 * Knobs via env: K (ABYSS.lvFollowK), PR (ABYSS.physResScale). SIM_AI=omni = old all-knowing reference.
 * Usage: [K=0.8] [PR=1] npx tsx scripts/rc6-targets.ts [N=24] [F=4] */
import { readFileSync } from 'node:fs';
import { autoRun, fight, profsOf, starterKit, SIM_AI, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, type Player } from '../src/core/player';
import { RULES, abyssOpen, armBattle, battleLocks, encounter, openingOc, runDerived, startAbyss } from '../src/core/run';
import { ABYSS, checkpointStart, emptyRecord, recordTitles, recordTrip, type AbyssSchool } from '../src/core/abyss';
import { armCp5, startBattle } from '../src/core/battle';
import { Rng } from '../src/core/rng';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true;
if (process.env.K) ABYSS.lvFollowK = Number(process.env.K);
if (process.env.PR) ABYSS.physResScale = Number(process.env.PR);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const N = Number(process.argv[2] ?? 24), F = Number(process.argv[3] ?? 4), T = 10;
const clone = <X>(x: X): X => JSON.parse(JSON.stringify(x));
function one(p0: Player, strat: Strategy, depth: number, type: 'boss' | 'battle', seed: number): boolean {
  const p = clone(p0); const run = startAbyss(p, seed, depth);
  if (type === 'boss') run.tower.floors[0]!.options = ['boss'];
  const ms = encounter(run, pool, type);
  const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run); b.oc += openingOc(p, type, run); armCp5(b, run.pdot);
  fight(b, strat, new Rng(seed * 31 + 7), profsOf(p), 'counter'); return b.over === 'win';
}
const pct = (w: number, n: number) => (n ? `${Math.round((100 * w) / n)}% (${w}/${n})` : 'n/a');
console.log(`# rc6 targets  AI=${SIM_AI.omni ? 'omni(reference)' : 'UI-only'}  lvFollowK=${ABYSS.lvFollowK}  physResScale=${ABYSS.physResScale}  N=${N} F=${F}`);
console.log('school | d5 boss | d16 battle | d20 boss | chars@best≥15');
for (const sc of ['blade', 'oc', 'arcane', 'bulwark']) {
  const strat = `buff:${sc}` as Strategy; const c = { d5: { w: 0, n: 0 }, d16: { w: 0, n: 0 }, d20: { w: 0, n: 0 } }; let deep = 0;
  for (let s = 1; s <= N; s++) {
    const p = newPlayer(); starterKit(p, s); let ok = false;
    for (let i = 1; i <= 60; i++) if (autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3 }).settlement.outcome === 'clear') { ok = true; break; }
    if (!ok || !abyssOpen(p)) continue;
    for (let f = 1; f <= F; f++) { c.d5.n++; if (one(p, strat, 5, 'boss', s * 100 + f)) c.d5.w++; }
    const rec = emptyRecord();
    for (let t = 1; t <= T && rec.best < 15; t++) { const r = autoRun(p, pool, s * 1000 + 100 + t, strat, { mode: 'counter', retreat: 0.3, abyss: checkpointStart(rec.best), cap: 60, ms: rec.ms });
      recordTitles(rec, r.abyss!.ms, r.abyss!.titles); recordTrip(rec, r.abyss!.cleared, r.abyss!.school as AbyssSchool); }
    if (rec.best < 15) continue; deep++;
    for (let f = 1; f <= F; f++) { c.d16.n++; if (one(p, strat, 16, 'battle', s * 100 + f)) c.d16.w++; c.d20.n++; if (one(p, strat, 20, 'boss', s * 100 + f)) c.d20.w++; }
  }
  console.log(`${sc} | ${pct(c.d5.w, c.d5.n)} | ${pct(c.d16.w, c.d16.n)} | ${pct(c.d20.w, c.d20.n)} | ${deep}/${N}`);
}
