/** Difficulty check (round 5): N fresh characters (seeds 1..N), each plays up to M runs.
 * Reports mean floor reached on run 1 and the median run of first clear. Usage: npx tsx scripts/difficulty.ts [N=20] [M=15]
 * CP2b: prints both strategies — 'auto' (uses Spirit Stance / OC skills, combat routes) and 'human' (see auto.ts chooseHuman), plus 'avoid' (human battle play, never picks a battle when anything else is offered) as a reference. */
import { readFileSync } from 'node:fs';
import { autoRun, starterKit, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';

const N = Number(process.argv[2] ?? 16);
const M = Number(process.argv[3] ?? 15);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const STRATS = (process.argv[4] ?? 'auto,human,noweak,avoid').split(',') as Strategy[];
for (const strat of STRATS) {
const run1: number[] = [];
const first: number[] = [];
const deaths = new Map<number, number>();
const ur3: number[] = [];
const t1f5: boolean[] = [];
const lv: number[][] = [[], [], []];
const bossF: { floor: number; turns: number; potions: number; won: boolean; spirit: boolean }[] = [];
let nb = 0, ns = 0;
const bossAll: typeof bossF = [];
for (let s = 1; s <= N; s++) {
  const p = newPlayer();
  starterKit(p, s);
  let fc = Infinity;
  let ur = 0;
  for (let i = 1; i <= M; i++) {
    const r = autoRun(p, pool, s * 1000 + i, strat);
    if (i <= 3) bossAll.push(...r.bosses);
    if (i <= 3) { nb += r.battles; ns += r.spiritBattles; }
    if (i <= 3) { ur = r.unlockRate; lv[i - 1]!.push(r.settlement.levelAfter); }
    if (i === 1) t1f5.push(r.bosses.some((b) => b.floor === 5 && b.won));
    if (fc === Infinity) bossF.push(...r.bosses);
    if (i === 1) run1.push(Math.min(r.floorReached, 11));
    if (r.floorReached > 10 && fc === Infinity) fc = i;
    if (fc !== Infinity && i >= 3) break;
    void 0;
    if (r.floorReached > 10) continue;
    deaths.set(r.floorReached, (deaths.get(r.floorReached) ?? 0) + 1);
  }
  first.push(fc);
  ur3.push(ur);
}
const sorted = [...first].sort((a, b) => a - b);
const med = N % 2 ? sorted[(N - 1) / 2]! : (sorted[N / 2 - 1]! + sorted[N / 2]!) / 2;
console.log(`\n== strategy ${strat} == seeds=${N} maxRuns=${M}`);
console.log(`run-1 floor reached: mean ${(run1.reduce((a, b) => a + b, 0) / N).toFixed(2)}  [${run1.join(',')}] (11 = clear)`);
console.log(`first clear run: median ${med}  [${first.map((x) => (x === Infinity ? '-' : x)).join(',')}]  cleared ${first.filter((x) => x !== Infinity).length}/${N}`);
console.log(`unlock rate after trip 3 : mean ${(100 * ur3.reduce((a, b) => a + b, 0) / N).toFixed(0)}%  min ${(100 * Math.min(...ur3)).toFixed(0)}%`);
console.log(`deaths by floor: ${[...deaths].sort((a, b) => a[0] - b[0]).map(([f, n]) => `F${f}:${n}`).join(' ')}`);
console.log(`trip-1 F5 boss win: ${t1f5.filter(Boolean).length}/${N}`);
console.log(`level after trip 1/2/3 (mean): ${lv.map((xs) => (xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)).toFixed(1)).join(' / ')}  trip1 [${lv[0]!.join(',')}]`);
console.log(`spirit stance used (trips 1-3): ${ns}/${nb} battles (${(100 * ns / Math.max(1, nb)).toFixed(0)}%)`);
for (const f of [5, 10]) {
  const xs = bossF.filter((b) => b.floor === f);
  const avg = (k: 'turns' | 'potions') => (xs.reduce((a, b) => a + b[k], 0) / Math.max(1, xs.length)).toFixed(1);
  const ys = bossAll.filter((b) => b.floor === f);
  console.log(`boss F${f} (all trips 1-3): fights ${ys.length}, won ${ys.filter((b) => b.won).length} (${(100 * ys.filter((b) => b.won).length / Math.max(1, ys.length)).toFixed(0)}%), mean turns ${(ys.reduce((a, b) => a + b.turns, 0) / Math.max(1, ys.length)).toFixed(1)}, spirit used ${ys.filter((b) => b.spirit).length}`);
  console.log(`boss F${f}: fights ${xs.length}, won ${xs.filter((b) => b.won).length}, mean turns ${avg('turns')}, spirit used ${xs.filter((b) => b.spirit).length}, mean potions ${avg('potions')}`);
}
}
