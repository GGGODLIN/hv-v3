/** CP7 report: reads JSON lines from scripts/cp7-sim.ts (4 schools × sets A/B) and prints CHECK lines for P1–P5 per set.
 * Usage: npx tsx scripts/cp7-report.ts /tmp/cp7/<name>.jsonl  (docs/cp7-feel.md §指標 defines every number) */
import { readFileSync } from 'node:fs';
type R = { sc: string; S0: number; N: number; cp7: boolean; knobs: unknown; built: number; deep: number; first: number[]; firstClear: number[]; upgMain: number[]; upgAbyss: number[]; depthClip: number[];
  reach: Record<string, number>; endAt: Record<string, number>; p3: { rest: { n: number; full: number }; none: { n: number; full: number } }; win: Record<string, number | null> };
const rows = readFileSync(process.argv[2]!, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as R);
const q = (a: number[], k: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(k * s.length))]! : NaN; };
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const SCH = ['blade', 'oc', 'arcane', 'bulwark'];
let all = true;
for (const S0 of [...new Set(rows.map((r) => r.S0))].sort((a, b) => a - b)) {
  const set = rows.filter((r) => r.S0 === S0); const N = set[0]!.N;
  console.log(`\n=== set ${S0 === 0 ? 'A' : 'B'} (seeds ${S0 + 1}..${S0 + N}) cp7=${set[0]!.cp7} knobs ${JSON.stringify(set[0]!.knobs)}`);
  const checks: [string, boolean][] = [];
  const by = (sc: string) => set.find((r) => r.sc === sc)!;
  // P1
  const trips = set.flatMap((r) => [...r.upgMain, ...r.upgAbyss]);
  const ge1 = trips.filter((x) => x >= 1).length / trips.length;
  for (const sc of SCH) { const r = by(sc); const t = [...r.upgMain, ...r.upgAbyss]; console.log(`  P1 ${sc}: trips ${t.length} ≥1 better ${pct(t.filter((x) => x >= 1).length / t.length)} median ${q(t, 0.5)} (main median ${q(r.upgMain, 0.5)}, abyss median ${q(r.upgAbyss, 0.5)})`); }
  checks.push([`P1 every trip ≥1 better drop: ${pct(ge1)} of ${trips.length} trips (target 100%)`, ge1 >= 1]);
  checks.push([`P1 median better drops per trip ${q(trips, 0.5)} ≥ 2`, q(trips, 0.5) >= 2]);
  // P2
  const md = SCH.map((sc) => mean(by(sc).depthClip)); const gap = Math.max(...md) / Math.min(...md);
  console.log(`  P2 mean depth (clip 10..20) ${SCH.map((sc, i) => `${sc} ${md[i]!.toFixed(2)}`).join(' ')}`);
  checks.push([`P2 d10–d20 mean depth strongest/weakest ${gap.toFixed(3)}× ≤ 1.3×`, gap <= 1.3]);
  // P3
  const p3 = set.reduce((a, r) => ({ rn: a.rn + r.p3.rest.n, rf: a.rf + r.p3.rest.full, nn: a.nn + r.p3.none.n, nf: a.nf + r.p3.none.full }), { rn: 0, rf: 0, nn: 0, nf: 0 });
  const fr = p3.rf / p3.rn, fn = p3.nf / p3.nn;
  console.log(`  P3 d13–d20 full clear: with campfire ${pct(fr)} (${p3.rf}/${p3.rn}), without ${pct(fn)} (${p3.nf}/${p3.nn})`);
  checks.push([`P3 campfire gap ${((fr - fn) * 100).toFixed(1)}pp ≤ 20pp`, Math.abs(fr - fn) <= 0.2]);
  // P4
  const first = set.flatMap((r) => r.first); const m1 = q(first, 0.5);
  const sum = (k: 'reach' | 'endAt', d: number) => set.reduce((a, r) => a + (r[k][d] ?? 0), 0);
  const band = (lo: number, hi: number) => { let e = 0, n = 0; for (let d = lo; d <= hi; d++) { e += sum('endAt', d); n += sum('reach', d); } return e / n; };
  const lo = band(1, 5), mid = band(6, 15), m2 = band(11, 15), late = band(16, 20);
  console.log(`  P4 per-entry death rate: d1–5 ${pct(lo)} d6–15 ${pct(mid)} (d11–15 ${pct(m2)}) d16–20 ${pct(late)} | per depth ${Array.from({ length: 20 }, (_, i) => i + 1).map((d) => `${d}:${(100 * sum('endAt', d) / Math.max(1, sum('reach', d))).toFixed(0)}`).join(' ')}`);
  checks.push([`P4 trip-1 median depth ${m1} in 8–18`, m1 >= 8 && m1 <= 18]);
  checks.push([`P4 shape low→rising: d1–5 ${pct(lo)} < d6–15 ${pct(mid)}`, lo < mid]);
  checks.push([`P4 shape late flat: d16–20 ${pct(late)} ≤ 1.25 × d11–15 ${pct(m2)}`, late <= 1.25 * m2]);
  const w = (k: string) => { let ww = 0, nn = 0; for (const r of set) { const v = r.win[k]; if (v != null) { ww += v; nn++; } } return ww / nn; };
  for (const sc of SCH) console.log(`  P4 fresh win ${sc}: ${Object.entries(by(sc).win).map(([k, v]) => `${k} ${v == null ? '—' : pct(v)}`).join(' ')}`);
  for (const sc of SCH) { const r = by(sc).win; checks.push([`P4 ${sc} d1–3 ≥95% (${[r.d1, r.d2, r.d3].map((x) => pct(x!)).join('/')}) d5 ≥75% (${pct(r.d5!)}) d16 ≥60% (${pct(r.d16!)}) d20 ≥35% (${pct(r.d20!)})`, r.d1! >= 0.95 && r.d2! >= 0.95 && r.d3! >= 0.95 && r.d5! >= 0.75 && r.d16! >= 0.6 && r.d20! >= 0.35]); }
  void w;
  // P5
  const fc = by('blade').firstClear; const nv = fc.filter((x) => x > 12).length / fc.length;
  console.log(`  P5 first F20 clear trip (median) ${SCH.map((sc) => `${sc} ${q(by(sc).firstClear, 0.5)} never≤12 ${pct(by(sc).firstClear.filter((x) => x > 12).length / N)}`).join(' | ')}`);
  checks.push([`P5 blade never full-clear F20 within 12 trips ${pct(nv)} ≤ 10%`, nv <= 0.1]);
  for (const [k, ok] of checks) { console.log(`  CHECK ${ok ? 'PASS' : 'FAIL'} ${k}`); all &&= ok; }
}
console.log(`\n== CP7 VERDICT: ${all ? 'ALL PASS' : 'FAIL'}`);
