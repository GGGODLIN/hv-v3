/** cp9-rc3 (自訂，暫定) playtest-matching sim: the QA bot plays ONE abyss trip from d1 with the public/data/cp6-presets.json
 * postF20-<school> character (not the sim-trained one cp7-sim.ts builds). Prints median deepest floor + boss turns / bursts.
 * Env: SC=<school> SEED0 ; Usage: npx tsx scripts/cp9-preset-sim.ts [N=128] */
import { readFileSync } from 'node:fs';
import { SIM_DIAG, autoRun, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import type { Player } from '../src/core/player';
const E = process.env;
E.SIM_ROUTE ??= 'battle';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const pre = JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, { player: Player }>;
const N = Number(process.argv[2] ?? 128), S0 = Number(E.SEED0 ?? 0), sc = E.SC!;
const cl: number[] = [];
for (let s = S0 + 1; s <= S0 + N; s++) {
  const p = structuredClone(pre[`postF20-${sc}`]!.player);
  // cp9-rc7（自訂）: SIM_BUYPOT=N — the QA brief buys N health potions in town before each run (rc6 QA: 3 + 10)
  if (E.SIM_BUYPOT) p.potions.health += Number(E.SIM_BUYPOT);
  const r = autoRun(p, pool, s * 1000 + 101, `buff:${sc}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 });
  cl.push(r.abyss!.cleared + (r.settlement.outcome === "dead" ? 1 : 0)); if (E.DBGEND) console.error("END", cl.at(-1), r.settlement.outcome, JSON.stringify(r.end ?? null).slice(0, 160));
}
const med = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b.length ? (b[(b.length - 1) >> 1]! + b[b.length >> 1]!) / 2 : 0; };
const q = (f: number) => [...cl].sort((x, y) => x - y)[Math.floor(cl.length * f)];
console.log(JSON.stringify({ sc, S0, N, floor: med(cl), p25: q(0.25), p75: q(0.75), bossT: med(SIM_DIAG.bossTurns), cbWhy: SIM_DIAG.cbWhy, cbLog: SIM_DIAG.cbLog, mix30: SIM_DIAG.mix30, st9: SIM_DIAG.st9, dh30w: process.env.SIM_DHWHY ? SIM_DIAG.dh30 : undefined, dh30: +(SIM_DIAG.dh30.d / (SIM_DIAG.dh30.n || 1)).toFixed(3), bossDepth: Object.fromEntries(Object.entries(SIM_DIAG.bossByDepth).map(([k, v]) => { const s = [...v].sort((x, y) => x - y); return [k, { n: s.length, med: s[Math.floor(s.length / 2)], p90: s[Math.floor(s.length * 0.9)], max: s[s.length - 1] }]; })), bossTq: (() => { const b = [...SIM_DIAG.bossTurns].sort((x, y) => x - y), at = (p: number) => b[Math.floor(p * (b.length - 1))]; return { n: b.length, p10: at(0.1), p25: at(0.25), p75: at(0.75), p90: at(0.9), p99: at(0.99), max: b[b.length - 1], gt18: +(b.filter((x) => x > 18).length / (b.length || 1)).toFixed(3), gt30: +(b.filter((x) => x > 30).length / (b.length || 1)).toFixed(3), top5: b.slice(-5) }; })() /* cp9-rc4（自訂）: boss-turn distribution */, cb5: { max: Math.max(0, ...SIM_DIAG.cbRun), mean: +(SIM_DIAG.cbRun.reduce((a, b) => a + b, 0) / (SIM_DIAG.cbRun.length || 1)).toFixed(2), le1: +(SIM_DIAG.cbRun.filter((x) => x <= 1).length / (SIM_DIAG.cbRun.length || 1)).toFixed(3) }, big20: SIM_DIAG.big20, big20ann: +(SIM_DIAG.big20a / (SIM_DIAG.big20 || 1)).toFixed(3), big20uMax: Math.max(0, ...SIM_DIAG.big20u) /* cp9-rc5（自訂） */, bossBurstMax: Math.max(0, ...SIM_DIAG.bossBurst), normBurstMax: Math.max(0, ...SIM_DIAG.normBurst), normBurstP90: [...SIM_DIAG.normBurst].sort((a, b) => a - b)[Math.floor(SIM_DIAG.normBurst.length * 0.9)] }));
