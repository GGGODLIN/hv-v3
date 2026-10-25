/** CP6 abyss sim (docs/cp6-abyss.md §6.1). Usage: npx tsx scripts/cp6-abyss-sim.ts [N=24] [T=5] [strats]
 * Each seed: 10 CP5 main-tower trips (counter AI), then T abyss trips from the checkpoint (counter AI, cap d60).
 * Reports first-trip stop depth distribution, best after T trips, per-5-depth boss win rate and turns. */
import { readFileSync } from 'node:fs';
import { autoRun, starterKit, type Strategy, type BossFight } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { checkpointStart, emptyRecord, recordTrip, type AbyssSchool } from '../src/core/abyss';
RULES.cp6Abyss = true;
const N = Number(process.argv[2] ?? 24), T = Number(process.argv[3] ?? 5);
const STRATS = (process.argv[4] ?? 'auto,buff:blade,buff:oc,buff:arcane,buff:bulwark').split(',') as Strategy[];
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const q = (a: number[], k: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(k * s.length))]! : NaN; };
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const f = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '—');
console.log(`CP6 abyss sim N=${N} T=${T} (main trips 1-10 then abyss)`);
for (const strat of STRATS) {
  const first: number[] = [], best: number[] = [], lv: number[] = [], schools: Record<string, number> = {};
  const boss: Record<number, BossFight[]> = {};
  for (let s = 1; s <= N; s++) {
    const p = newPlayer(); starterKit(p, s);
    for (let i = 1; i <= 10; i++) autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3 });
    const rec = emptyRecord();
    for (let t = 1; t <= T; t++) {
      const r = autoRun(p, pool, s * 1000 + 100 + t, strat, { mode: 'counter', abyss: checkpointStart(rec.best), cap: 60 });
      if (t === 1) { first.push(r.abyss!.cleared); lv.push(r.level); }
      recordTrip(rec, r.abyss!.cleared, r.abyss!.school as AbyssSchool);
      schools[r.abyss!.school] = (schools[r.abyss!.school] ?? 0) + 1;
      for (const b of r.bosses) (boss[b.floor] ??= []).push(b);
    }
    best.push(rec.best);
  }
  console.log(`\n== ${strat}  lv@abyss1 mean ${f(mean(lv))}  schools ${JSON.stringify(schools)}`);
  console.log(`trip1 cleared depth: p10 ${q(first, 0.1)} p25 ${q(first, 0.25)} median ${q(first, 0.5)} p75 ${q(first, 0.75)} p90 ${q(first, 0.9)} mean ${f(mean(first))}`);
  console.log(`best after ${T} trips: p10 ${q(best, 0.1)} median ${q(best, 0.5)} p90 ${q(best, 0.9)} max ${Math.max(...best)}`);
  console.log('boss fights by abyss depth | n | win% | turns');
  for (const k of Object.keys(boss).map(Number).sort((a, b) => a - b)) { const xs = boss[k]!; console.log(`  d${k} | ${xs.length} | ${f(mean(xs.map((b) => +b.won)) * 100)} | ${f(mean(xs.map((b) => b.turns)))}`); }
}
