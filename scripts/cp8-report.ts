/** CP8 report: reads cp7-sim JSON lines produced with CP8=1 SIM_AI=naive (scripts/cp8-round.sh) and prints CHECK lines P1–P5 per set.
 * rc2: P4 is judged with the CURRENT AI — its CHECK lines are copied from scripts/cp7-report.ts run on the 2nd argument (a cp7-sim
 * CP8=1 file without SIM_AI, e.g. from `SIM_AI= bash scripts/cp8-round.sh`); naive is used only for P1/P2 (and P3/P5 as before).
 * rc2: P2 is pooled over sets A+B: every school's trip-2 median ≥ trip-1 median + 2. Definitions: docs/cp8-real-play.md §指標.
 * Usage: npx tsx scripts/cp8-report.ts <naive.jsonl> <current-ai.jsonl> */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
type Cell = { n: number; k: number; mx: number };
type R = { sc: string; S0: number; N: number; cp8: boolean; naive: boolean; first: number[]; second: number[]; firstClear: number[]; p3d21: { n: number; w: number }; p5: { hp: number; d: Record<string, Cell> }[] };
const file = process.argv[2]!, p4file = process.argv[3];
const rows = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as R);
const q = (a: number[], k: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(k * s.length))]! : NaN; };
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const SCH = ['blade', 'oc', 'arcane', 'bulwark'];
const cp7 = p4file ? execFileSync('npx', ['tsx', 'scripts/cp7-report.ts', p4file], { encoding: 'utf8' }).split('\n') : [];
const p4: Record<string, string[]> = {}; let cur = '';
for (const l of cp7) { const m = l.match(/^=== set (\w)/); if (m) cur = m[1]!; else { const c = l.match(/^\s*CHECK (PASS|FAIL) (P4 .*)$/); if (c) (p4[cur] ??= []).push(`${c[2]} ${c[1]}`); } }
let all = true;
for (const S0 of [...new Set(rows.map((r) => r.S0))].sort((a, b) => a - b)) {
  const set = rows.filter((r) => r.S0 === S0); const name = S0 === 0 ? 'A' : 'B'; const by = (sc: string) => set.find((r) => r.sc === sc)!;
  console.log(`\n=== set ${name} (seeds ${S0 + 1}..${S0 + set[0]!.N}) cp8=${set[0]!.cp8} naive=${set[0]!.naive}`);
  const checks: [string, boolean][] = [];
  const m1 = SCH.map((sc) => q(by(sc).first, 0.5)), m2 = SCH.map((sc) => q(by(sc).second, 0.5));
  SCH.forEach((sc, i) => console.log(`  ${sc}: trip1 median d${m1[i]} (p25 ${q(by(sc).first, 0.25)}) trip2 median d${m2[i]}  F20 clear median ${q(by(sc).firstClear, 0.5)} trips  d21 first battle ${by(sc).p3d21.w}/${by(sc).p3d21.n}`));
  checks.push([`P1 every school trip-1 median ≥ d10: ${SCH.map((sc, i) => `${sc} ${m1[i]}`).join(' ')}`, Math.min(...m1) >= 10]);
  checks.push([`P1 strongest/weakest trip-1 median ${(Math.max(...m1) / Math.min(...m1)).toFixed(3)}× ≤ 1.3×`, Math.max(...m1) / Math.min(...m1) <= 1.3]);
  console.log(`  (info) trip-2 vs trip-1 median this set: ${SCH.map((sc, i) => `${sc} ${m1[i]}→${m2[i]}`).join(' ')} — P2 is judged on A+B pooled below`);
  const p3 = set.reduce((a, r) => ({ n: a.n + r.p3d21.n, w: a.w + r.p3d21.w }), { n: 0, w: 0 });
  checks.push([`P3 d21 start (with start buffs) first battle win ${pct(p3.w / p3.n)} (${p3.w}/${p3.n}) ≥ 40%`, p3.n > 0 && p3.w / p3.n >= 0.4]);
  // rc2 decision 4: bulwark d16 is judged on a set-A N=256 rerun (env BW256=<cp7-sim jsonl, SC=bulwark>): ≥59% passes (sampling noise).
  const bw = process.env.BW256 ? (readFileSync(process.env.BW256, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { S0: number; N: number; win: Record<string, number> }).find((r) => r.S0 === S0)) : undefined;
  for (const l of p4[name] ?? []) {
    let t = l.replace(/\s*(PASS|FAIL)$/, ''), ok = /PASS$/.test(l);
    const m = t.match(/^P4 bulwark d1–3 ≥95% \(([\d.]+)%\/([\d.]+)%\/([\d.]+)%\) d5 ≥75% \(([\d.]+)%\) d16 ≥60% \(([\d.]+)%\) d20 ≥35% \(([\d.]+)%\)/);
    if (m && bw && !ok) { const v = m.slice(1).map(Number); const d16 = 100 * bw.win.d16!;
      ok = v[0]! >= 95 && v[1]! >= 95 && v[2]! >= 95 && v[3]! >= 75 && v[5]! >= 35 && d16 >= 59; t += ` → N=${bw.N} rerun d16 ${d16.toFixed(1)}% (≥59% passes, rc2 decision 4)`; }
    checks.push([t, ok]); }
  if (!(p4[name] ?? []).length) checks.push(['P4 current AI (cp7-report P4 lines missing — pass the current-AI file as 2nd arg)', false]);
  // P5: "median-HP character" = characters whose max HP is within the school's p25..p75; every depth 1..30 (every 5th is a boss fight).
  let worst = 0, where = '';
  for (const sc of SCH) { const ps = by(sc).p5; if (!ps.length) continue; const hs = ps.map((x) => x.hp); const lo = q(hs, 0.25), hi = q(hs, 0.75); const mid = ps.filter((x) => x.hp >= lo && x.hp <= hi);
    const line: string[] = [];
    for (let d = 1; d <= 30; d++) { const n = mid.reduce((a, x) => a + (x.d[d]?.n ?? 0), 0), k = mid.reduce((a, x) => a + (x.d[d]?.k ?? 0), 0); const r = k / Math.max(1, n); if (r > worst) { worst = r; where = `${sc} d${d}`; } if (d % 5 === 0) line.push(`d${d} ${pct(r)}`); }
    console.log(`  P5 ${sc} (HP ${lo}..${hi}, ${mid.length} chars) one-round death from full HP: ${line.join(' ')}`); }
  checks.push([`P5 full-HP one-round death, worst school×depth ${pct(worst)}${where ? ` (${where})` : ''} ≤ 2%`, worst <= 0.02]);
  for (const [t, ok] of checks) { console.log(`  CHECK ${t} ${ok ? 'PASS' : 'FAIL'}`); all &&= ok; }
}
// rc3 P2 (暫定, producer 2026-10-26): per school, any of (1) trip-2 median ≥ trip-1 median + 2, (2) d25-boss beaten share
// (cleared ≥ 25) trip 2 − trip 1 ≥ 10 pp, (3) trip-2 mean cleared ≥ trip-1 mean + 2. A+B pooled.
{ const cat = (sc: string, k: 'first' | 'second') => rows.filter((r) => r.sc === sc).flatMap((r) => r[k]);
  const mean = (x: number[]) => x.reduce((a, v) => a + v, 0) / Math.max(1, x.length), b25 = (x: number[]) => x.filter((v) => v >= 25).length / Math.max(1, x.length);
  console.log('\n=== A+B pooled');
  let ok = true;
  for (const sc of SCH) { const f = cat(sc, 'first'), s2 = cat(sc, 'second');
    const c1 = q(s2, 0.5) - q(f, 0.5) >= 2, c2 = b25(s2) - b25(f) >= 0.1, c3 = mean(s2) - mean(f) >= 2; ok &&= c1 || c2 || c3;
    console.log(`  P2 ${sc}: (1) median ${q(f, 0.5)}→${q(s2, 0.5)} ${c1 ? '✓' : '✗'} | (2) d25 boss beaten ${pct(b25(f))}→${pct(b25(s2))} (+${(100 * (b25(s2) - b25(f))).toFixed(1)}pp) ${c2 ? '✓' : '✗'} | (3) mean ${mean(f).toFixed(2)}→${mean(s2).toFixed(2)} (+${(mean(s2) - mean(f)).toFixed(2)}) ${c3 ? '✓' : '✗'}`); }
  console.log(`  CHECK P2 every school passes (1) median +2 or (2) d25 boss +10pp or (3) mean +2 (A+B pooled) ${ok ? 'PASS' : 'FAIL'}`); all &&= ok; }
// rc4 V (暫定, producer 2026-10-26): naive trip-1 cleared p25 ≥ 0.7 × median for every school, A+B pooled.
{ let ok = true; const parts: string[] = [];
  for (const sc of SCH) { const f = rows.filter((r) => r.sc === sc).flatMap((r) => r.first); const r = q(f, 0.25) / Math.max(1, q(f, 0.5)); ok &&= r >= 0.7; parts.push(`${sc} p10 ${q(f, 0.1)} p25 ${q(f, 0.25)} med ${q(f, 0.5)} ratio ${r.toFixed(2)}`); }
  console.log(`  ${parts.join(' | ')}`);
  console.log(`  CHECK V trip-1 p25 ≥ 0.7 × median every school (A+B pooled) ${ok ? 'PASS' : 'FAIL'}`); all &&= ok; }
// rc6 受傷 CHECK (暫定, producer 2026-10-26, no number changes): worst monster round / max HP per trip (st ≤ 30), naive, A+B pooled.
// bulwark all-trips p50 ≤ (lowest other school) − 0.10 and trip-1 p95 ≤ (lowest other school) − 0.08.
{ const rr = rows as (R & { rd1?: number[]; rdAll?: number[] })[]; const g = (sc: string, k: 'rd1' | 'rdAll') => rr.filter((r) => r.sc === sc).flatMap((r) => r[k] ?? []);
  const qf = (a: number[], k: number) => { const s2 = [...a].sort((x, y) => x - y); return s2.length ? s2[Math.min(s2.length - 1, Math.floor(k * s2.length))]! : NaN; };
  const oth = SCH.filter((sc) => sc !== 'bulwark'), f2 = (x: number) => x.toFixed(2);
  const a50 = qf(g('bulwark', 'rdAll'), 0.5), o50 = Math.min(...oth.map((sc) => qf(g(sc, 'rdAll'), 0.5)));
  const t95 = qf(g('bulwark', 'rd1'), 0.95), o95 = Math.min(...oth.map((sc) => qf(g(sc, 'rd1'), 0.95)));
  console.log(`  ${SCH.map((sc) => `${sc} trip1 p50 ${f2(qf(g(sc, 'rd1'), 0.5))} p95 ${f2(qf(g(sc, 'rd1'), 0.95))} all p50 ${f2(qf(g(sc, 'rdAll'), 0.5))} p95 ${f2(qf(g(sc, 'rdAll'), 0.95))}`).join(' | ')}`);
  const ok = a50 <= o50 - 0.1 + 1e-9 && t95 <= o95 - 0.08 + 1e-9;
  console.log(`  CHECK 受傷 bulwark all p50 ${f2(a50)} ≤ ${f2(o50)} − 0.10 and trip-1 p95 ${f2(t95)} ≤ ${f2(o95)} − 0.08 (A+B pooled, 暫定) ${ok ? 'PASS' : 'FAIL'}`); all &&= ok; }
console.log(all ? '\nCP8 ALL PASS' : '\nCP8 SOME FAIL');
