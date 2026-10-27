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
  const r = autoRun(p, pool, s * 1000 + 101, `buff:${sc}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 });
  cl.push(r.abyss!.cleared + (r.settlement.outcome === "dead" ? 1 : 0)); if (E.DBGEND) console.error("END", cl.at(-1), r.settlement.outcome, JSON.stringify(r.end ?? null).slice(0, 160));
}
const med = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b.length ? (b[(b.length - 1) >> 1]! + b[b.length >> 1]!) / 2 : 0; };
const q = (f: number) => [...cl].sort((x, y) => x - y)[Math.floor(cl.length * f)];
console.log(JSON.stringify({ sc, S0, N, floor: med(cl), p25: q(0.25), p75: q(0.75), bossT: med(SIM_DIAG.bossTurns), bossBurstMax: Math.max(0, ...SIM_DIAG.bossBurst), normBurstMax: Math.max(0, ...SIM_DIAG.normBurst), normBurstP90: [...SIM_DIAG.normBurst].sort((a, b) => a - b)[Math.floor(SIM_DIAG.normBurst.length * 0.9)] }));
