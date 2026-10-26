/** rc14 playtest-vs-sim probe (sim only): trip-1..T abyss trips (start d1) from the exported postF20 preset, like the playtester.
 * Env passes through (SIM_AI=naive, SIM_NOPREP, SIM_POTHINT, SIM_NAIVE40, SIM_SKILLHINT, SIM_NAIVE_AONLY). Prints median floor reached per trip,
 * and per-floor mean HP lost (fraction of max) + potions drunk. Usage: SC=blade npx tsx scripts/rc14-preset-trip.ts [N=128] [T=1] */
import { readFileSync } from 'node:fs';
import { autoRun, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { type Player } from '../src/core/player';
import { RULES } from '../src/core/run';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp8 = true;
process.env.SIM_ROUTE ??= 'battle'; // rc14: baseline route (SIM_ROUTE=elite = reference)
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const pre = JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8'));
const sc = process.env.SC ?? 'blade', N = Number(process.argv[2] ?? 128), T = Number(process.argv[3] ?? 1);
const strat = `buff:${sc}` as Strategy;
const reached: number[][] = Array.from({ length: T }, () => []);
for (let s = 1; s <= N; s++) {
  const p = JSON.parse(JSON.stringify(pre[`postF20-${sc}`].player)) as Player;
  for (let t = 0; t < T; t++) { const r = autoRun(p, pool, 777000 + s * 10 + t, strat, { mode: 'counter', retreat: 0.3, abyss: 1, cap: 60, ms: 0 }); reached[t]!.push(r.abyss!.cleared + (r.settlement.outcome === 'dead' ? 1 : 0)); }
}
const med = (a: number[]) => { const x = [...a].sort((u, v) => u - v); return (x[(x.length - 1) >> 1]! + x[x.length >> 1]!) / 2; };
console.log(sc, Object.entries(process.env).filter(([k]) => k.startsWith('SIM_')).map(([k, v]) => `${k}=${v}`).join(' '), 'median reached per trip:', reached.map(med).join(' / '));
