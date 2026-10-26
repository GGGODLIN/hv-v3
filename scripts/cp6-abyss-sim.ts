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
const N = Number(process.argv[2] ?? 64), T = Number(process.argv[3] ?? 10);
const STRATS = (process.argv[4] ?? 'auto,buff:blade,buff:oc,buff:arcane,buff:bulwark').split(',') as Strategy[];
for (const kv of process.argv.slice(5)) { const [k, v] = kv.split("="); const [a, b] = k!.split('.'); const o = ABYSS as unknown as Record<string, any>; if (b) o[a!][b] = Number(v); else o[a!] = Number(v); console.log(`override ${k}=${v}`); }
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const q = (a: number[], k: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(k * s.length))]! : NaN; };
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const f = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '—');
const verdicts: string[] = []; const meds: number[] = [];
console.log(`CP6 abyss sim N=${N} T=${T} seeds ${Number(process.env.SEED0 ?? 0) + 1}..${Number(process.env.SEED0 ?? 0) + N} (main tower until first F20 clear, then abyss)`);
for (const strat of STRATS) {
  const first: number[] = [], best: number[] = [], best5: number[] = [], lv: number[] = [], pw: number[] = [], mt: number[] = [], kept: number[] = [], died: number[] = [], qmix: Record<string, number> = {}, schools: Record<string, number> = {};
  let noClear = 0, titles = 0;
  const boss: Record<number, BossFight[]> = {}; const endAt: Record<number, number> = {}; const reach: Record<number, number> = {};
  const S0 = Number(process.env.SEED0 ?? 0);
  for (let s = S0 + 1; s <= S0 + N; s++) {
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
      died.push(+(r.settlement.outcome === 'dead')); if (r.settlement.outcome === 'dead') endAt[r.abyss!.cleared + 1] = (endAt[r.abyss!.cleared + 1] ?? 0) + 1; kept.push(r.settlement.kept.length); for (const e of r.settlement.kept) qmix[e.quality] = (qmix[e.quality] ?? 0) + 1;
      { const st = checkpointStart(rec.best); for (let d = st; d <= r.abyss!.cleared + (r.settlement.outcome === 'dead' ? 1 : 0); d++) reach[d] = (reach[d] ?? 0) + 1; }
      recordTrip(rec, r.abyss!.cleared, r.abyss!.school as AbyssSchool);
      schools[r.abyss!.school] = (schools[r.abyss!.school] ?? 0) + 1;
      for (const b of r.bosses) (boss[b.floor] ??= []).push(b);
      if (t === Math.min(5, T)) best5.push(rec.best);
    }
    best.push(rec.best);
  }
  const tq = Object.values(qmix).reduce((a, b) => a + b, 0);
  console.log(`\n== ${strat}  main trips to F20 clear: median ${q(mt, 0.5)} (no clear in 60: ${noClear})  lv@abyss1 p10 ${q(lv, 0.1)} median ${q(lv, 0.5)} p90 ${q(lv, 0.9)} mean ${f(mean(lv))}  power median ${f(q(pw, 0.5), 0)}`);
  console.log(`schools ${JSON.stringify(schools)}  titles earned ${titles}`);
  console.log(`abyss trips ending in death ${f(mean(died) * 100)}% | equipment kept per abyss trip: mean ${f(mean(kept))} median ${q(kept, 0.5)} p90 ${q(kept, 0.9)} | quality ${QUALITIES.filter((k) => qmix[k]).map((k) => `${k} ${f((qmix[k]! / tq) * 100)}%`).join(' ')}`);
  console.log(`trip1 cleared depth: p10 ${q(first, 0.1)} p25 ${q(first, 0.25)} median ${q(first, 0.5)} p75 ${q(first, 0.75)} p90 ${q(first, 0.9)} mean ${f(mean(first))}`);
  console.log(`best after ${T} trips: p10 ${q(best, 0.1)} median ${q(best, 0.5)} p90 ${q(best, 0.9)} max ${Math.max(...best)}`);
  if (T > 5) console.log(`best after 5 trips: p10 ${q(best5, 0.1)} median ${q(best5, 0.5)} p90 ${q(best5, 0.9)} max ${Math.max(...best5)}`);
  console.log(`boss fights by abyss depth over all ${T} trips | n | win% | turns`);
  for (const k of [...new Set([5, 10, 15, 20, 25, ...Object.keys(boss).map(Number)])].sort((a, b) => a - b)) { const xs0 = boss[k] ?? []; if (!xs0.length) { console.log(`  d${k} | 0 | — | —`); continue; } const xs = boss[k]!; console.log(`  d${k} | ${xs.length} | ${f(mean(xs.map((b) => +b.won)) * 100)} | ${f(mean(xs.map((b) => b.turns)))}`); }
  console.log(`death rate per depth (deaths/entered, %): ${Object.keys(endAt).map(Number).sort((a, b) => a - b).map((d) => `d${d}:${f((endAt[d]! / (reach[d] ?? 1)) * 100, 0)}/${reach[d] ?? 0}`).join(' ')}`);
  const rate = (d: number) => (reach[d] ? (endAt[d] ?? 0) / reach[d]! : NaN);
  const ds = Object.keys(reach).map(Number).sort((a, b) => a - b);
  console.log('death rate per entry by depth | depth | entered | died | rate%');
  for (const d of ds) console.log(`  r${d} | ${reach[d]} | ${endAt[d] ?? 0} | ${f(rate(d) * 100)}`);
  const top = Math.max(...ds.filter((d) => d !== 16).map(rate).filter(Number.isFinite));
  const r13 = rate(13), r14 = rate(14), r15 = rate(15), r16 = rate(16), r17 = rate(17), r18 = rate(18);
  console.log(`d13-d18 per-entry death rate %: ${[13, 14, 15, 16, 17, 18].map((d) => `d${d} ${f(rate(d) * 100)} (${endAt[d] ?? 0}/${reach[d] ?? 0})`).join(' | ')}  ratios d16/d13 ${f(r16 / r13, 2)} d16/d14 ${f(r16 / r14, 2)} d16/d15 ${f(r16 / r15, 2)} d16/d17 ${f(r16 / r17, 2)} d16/d18 ${f(r16 / r18, 2)}`);
  const bw = (k: number) => boss[k]?.length ? mean(boss[k]!.map((b) => +b.won)) : NaN;
  const checks: [string, boolean][] = [
    ['best5 median >= 15', q(best5.length ? best5 : best, 0.5) >= 15],
    ['d20 boss win >= 35%', bw(20) >= 0.35],
    ...(strat === 'auto' ? [] : [['trip1 median 10-30', q(first, 0.5) >= 10 && q(first, 0.5) <= 30] as [string, boolean]]),
    ['d5 boss win >= 75%', bw(5) >= 0.75],
    ['d16 rate not tower-highest', r16 < top],
    // Producer 2026-10-26 (2nd): d16 vs combat floors d13 and d18 (d14 is a rest floor, d17 non-combat). trip1 band widened to 5-12.
    // Producer 2026-10-26 (rc9 set A): d16/d13 ratio dropped (d13 almost never kills); trip1 band 10-30; d5 boss >= 75%; d20 boss >= 35%. d16 fresh win >= 60% is graded in rc7-targets / rc9-tune.
    [`d16 rate <= 1.5 x d18 (${f(r16 * 100)} vs ${f(r18 * 100)})`, r16 <= 1.5 * r18],
  ];
  // Producer 2026-10-26 (3rd): balance gates use the four schools only; auto is reference (INFO), not graded.
  const graded = strat !== 'auto';
  for (const [k, ok] of checks) { console.log(`  ${graded ? 'CHECK' : 'INFO'} ${ok ? 'PASS' : 'FAIL'} ${k}`); if (graded) verdicts.push(`${strat}: ${ok ? 'PASS' : 'FAIL'} ${k}`); }
  if (graded) meds.push(q(best5.length ? best5 : best, 0.5));
  console.log(`death depth (abyss trips dying at depth d): ${Object.keys(endAt).map(Number).sort((a, b) => a - b).map((d) => `d${d}:${endAt[d]}`).join(' ')}`);
}
const gap = Math.max(...meds) / Math.min(...meds);
verdicts.push(`all: ${gap <= 1.5 ? 'PASS' : 'FAIL'} school gap (4 schools) ${f(gap, 2)}x <= 1.5x`);
console.log(`\n== VERDICT: ${verdicts.every((v) => v.includes('PASS')) ? 'ALL PASS' : 'FAIL'}`); for (const v of verdicts) if (!v.includes('PASS')) console.log(`  ${v}`);
