/** CP8 report: reads cp7-sim JSON lines produced with CP8=1 SIM_AI=naive (scripts/cp8-round.sh) and prints CHECK lines P1–P5 per set.
 * P4 reuses scripts/cp7-report.ts on the same file (its P4 CHECK lines are copied). Definitions: docs/cp8-real-play.md §指標. */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
type Cell = { n: number; k: number; mx: number };
type R = { sc: string; S0: number; N: number; cp8: boolean; naive: boolean; first: number[]; second: number[]; firstClear: number[]; p3d21: { n: number; w: number }; p5: { hp: number; d: Record<string, Cell> }[] };
const file = process.argv[2]!;
const rows = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as R);
const q = (a: number[], k: number) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(k * s.length))]! : NaN; };
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const SCH = ['blade', 'oc', 'arcane', 'bulwark'];
const cp7 = execFileSync('npx', ['tsx', 'scripts/cp7-report.ts', file], { encoding: 'utf8' }).split('\n');
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
  checks.push([`P2 trip-2 median ≥ trip-1 median + 3: ${SCH.map((sc, i) => `${sc} ${m1[i]}→${m2[i]}`).join(' ')}`, SCH.every((_, i) => m2[i]! >= m1[i]! + 3)]);
  const p3 = set.reduce((a, r) => ({ n: a.n + r.p3d21.n, w: a.w + r.p3d21.w }), { n: 0, w: 0 });
  checks.push([`P3 d21 start (with start buffs) first battle win ${pct(p3.w / p3.n)} (${p3.w}/${p3.n}) ≥ 40%`, p3.n > 0 && p3.w / p3.n >= 0.4]);
  for (const l of p4[name] ?? []) checks.push([l.replace(/\s*(PASS|FAIL)$/, ''), /PASS$/.test(l)]);
  if (!(p4[name] ?? []).length) checks.push(['P4 (cp7-report P4 lines missing)', false]);
  // P5: "median-HP character" = characters whose max HP is within the school's p25..p75; every depth 1..30 (every 5th is a boss fight).
  let worst = 0, where = '';
  for (const sc of SCH) { const ps = by(sc).p5; if (!ps.length) continue; const hs = ps.map((x) => x.hp); const lo = q(hs, 0.25), hi = q(hs, 0.75); const mid = ps.filter((x) => x.hp >= lo && x.hp <= hi);
    const line: string[] = [];
    for (let d = 1; d <= 30; d++) { const n = mid.reduce((a, x) => a + (x.d[d]?.n ?? 0), 0), k = mid.reduce((a, x) => a + (x.d[d]?.k ?? 0), 0); const r = k / Math.max(1, n); if (r > worst) { worst = r; where = `${sc} d${d}`; } if (d % 5 === 0) line.push(`d${d} ${pct(r)}`); }
    console.log(`  P5 ${sc} (HP ${lo}..${hi}, ${mid.length} chars) one-round death from full HP: ${line.join(' ')}`); }
  checks.push([`P5 full-HP one-round death, worst school×depth ${pct(worst)}${where ? ` (${where})` : ''} ≤ 2%`, worst <= 0.02]);
  for (const [t, ok] of checks) { console.log(`  CHECK ${t} ${ok ? 'PASS' : 'FAIL'}`); all &&= ok; }
}
console.log(all ? '\nCP8 ALL PASS' : '\nCP8 SOME FAIL');
