/** CP6 abyss sim (docs/cp6-abyss.md §6.1). Usage: npx tsx scripts/cp6-abyss-sim.ts [N=24] [T=5] [strats]
 * Each seed: CP5 main-tower trips (counter AI) until the first F20 clear (max 60 trips), then T abyss trips from the checkpoint (counter AI, cap d60).
 * Also reports loot inflation: equipment kept per abyss trip and its quality mix.
 * Reports first-trip stop depth distribution, best after T trips, per-5-depth boss win rate and turns. */
import { readFileSync } from 'node:fs';
import { autoRun, starterKit, type Strategy, type BossFight } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { ABYSS, checkpointStart, emptyRecord, recordTitles, recordTrip, type AbyssSchool } from '../src/core/abyss';
import { QUALITIES } from '../src/core/items';
import { powerScore } from '../src/core/player';
RULES.cp6Abyss = true;
const N = Number(process.argv[2] ?? 24), T = Number(process.argv[3] ?? 5);
const STRATS = (process.argv[4] ?? 'auto,buff:blade,buff:oc,buff:arcane,buff:bulwark').split(',') as Strategy[];
for (const kv of process.argv.slice(5)) { const [k, v] = kv.split("="); (ABYSS as unknown as Record<string, number>)[k!] = Number(v); console.log(`override ${k}=${v}`); }
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const q = (a: number[], k: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(k * s.length))]! : NaN; };
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const f = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '—');
console.log(`CP6 abyss sim N=${N} T=${T} (main tower until first F20 clear, then abyss)`);
for (const strat of STRATS) {
  const first: number[] = [], best: number[] = [], lv: number[] = [], pw: number[] = [], mt: number[] = [], kept: number[] = [], died: number[] = [], qmix: Record<string, number> = {}, schools: Record<string, number> = {};
  let noClear = 0, titles = 0;
  const boss: Record<number, BossFight[]> = {};
  for (let s = 1; s <= N; s++) {
    const p = newPlayer(); starterKit(p, s);
    let i = 0;
    for (; i < 60;) { i++; if (autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3 }).settlement.outcome === 'clear') break; }
    if (i >= 60) noClear++;
    mt.push(i);
    const rec = emptyRecord();
    for (let t = 1; t <= T; t++) {
      const r = autoRun(p, pool, s * 1000 + 100 + t, strat, { mode: 'counter', retreat: 0.3, abyss: checkpointStart(rec.best), cap: 60, ms: rec.ms });
      if (t === 1) { first.push(r.abyss!.cleared); lv.push(r.level); pw.push(r.power); }
      recordTitles(rec, r.abyss!.ms, r.abyss!.titles); titles += r.abyss!.titles.length;
      died.push(+(r.settlement.outcome === 'dead')); kept.push(r.settlement.kept.length); for (const e of r.settlement.kept) qmix[e.quality] = (qmix[e.quality] ?? 0) + 1;
      recordTrip(rec, r.abyss!.cleared, r.abyss!.school as AbyssSchool);
      schools[r.abyss!.school] = (schools[r.abyss!.school] ?? 0) + 1;
      for (const b of r.bosses) (boss[b.floor] ??= []).push(b);
    }
    best.push(rec.best);
  }
  const tq = Object.values(qmix).reduce((a, b) => a + b, 0);
  console.log(`\n== ${strat}  main trips to F20 clear: median ${q(mt, 0.5)} (no clear in 60: ${noClear})  lv@abyss1 p10 ${q(lv, 0.1)} median ${q(lv, 0.5)} p90 ${q(lv, 0.9)} mean ${f(mean(lv))}  power median ${f(q(pw, 0.5), 0)}`);
  console.log(`schools ${JSON.stringify(schools)}  titles earned ${titles}`);
  console.log(`abyss trips ending in death ${f(mean(died) * 100)}% | equipment kept per abyss trip: mean ${f(mean(kept))} median ${q(kept, 0.5)} p90 ${q(kept, 0.9)} | quality ${QUALITIES.filter((k) => qmix[k]).map((k) => `${k} ${f((qmix[k]! / tq) * 100)}%`).join(' ')}`);
  console.log(`trip1 cleared depth: p10 ${q(first, 0.1)} p25 ${q(first, 0.25)} median ${q(first, 0.5)} p75 ${q(first, 0.75)} p90 ${q(first, 0.9)} mean ${f(mean(first))}`);
  console.log(`best after ${T} trips: p10 ${q(best, 0.1)} median ${q(best, 0.5)} p90 ${q(best, 0.9)} max ${Math.max(...best)}`);
  console.log('boss fights by abyss depth | n | win% | turns');
  for (const k of Object.keys(boss).map(Number).sort((a, b) => a - b)) { const xs = boss[k]!; console.log(`  d${k} | ${xs.length} | ${f(mean(xs.map((b) => +b.won)) * 100)} | ${f(mean(xs.map((b) => b.turns)))}`); }
}
