/** CP5 §4 sim (flag on inside autoRun). Usage: npx tsx scripts/cp5-sim.ts [N=32] [M=12] [strats=auto,buff:blade,buff:oc,buff:arcane,buff:bulwark]
 * Per boss floor: counter vs paired ignore (same snapshot) win rate, mean turns, potions; trips to first clear (F10 win) and full clear (F20). */
import { readFileSync } from 'node:fs';
import { autoRun, starterKit, type Strategy, type BossFight } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';
import { CP5 } from '../src/core/cp5';
for (const kv of process.argv.slice(5)) { const [k, v] = kv.split('='); { const [a, b] = k!.split('.'); const o = CP5 as unknown as Record<string, any>; if (b) o[a!][b] = Number(v); else o[a!] = Number(v); } console.log(`override ${k}=${v}`); }
const N = Number(process.argv[2] ?? 32), M = Number(process.argv[3] ?? 12);
const STRATS = (process.argv[4] ?? 'auto,buff:blade,buff:oc,buff:arcane,buff:bulwark').split(',') as Strategy[];
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1]! : NaN; };
const f = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '—');
/** CP5 r5 (暫定): B20 growth curve — keep playing past the full clear and also report F20 fights from trips 6–10 only (player level at those trips). */
const all: Record<number, BossFight[]> = {}; const allT1: Record<number, BossFight[]> = {};
for (const strat of STRATS) {
  const bf: Record<number, BossFight[]> = {}; const t1: Record<number, BossFight[]> = {};
  const fc: number[] = [], full: number[] = []; let dead20 = 0; const b20: BossFight[] = []; const lv20: number[] = [];
  for (let s = 1; s <= N; s++) {
    const p = newPlayer(); starterKit(p, s);
    let a = Infinity, z = Infinity;
    for (let i = 1; i <= Math.max(M, 10); i++) {
      const r = autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', pair: true, retreat: 0.3 });
      if (i >= 6 && i <= 10) for (const b of r.bosses) if (b.floor === 20) { b20.push(b); lv20.push(r.level); }
      if (i > M || z !== Infinity) continue;
      for (const b of r.bosses) ((i === 1 ? t1 : bf)[b.floor] ??= []).push(b);
      if (a === Infinity && r.bosses.some((b) => b.floor === 10 && b.won)) a = i;
      if (r.floorReached > 20) z = i;
    }
    fc.push(a); full.push(z); if (z === Infinity) dead20++;
  }
  console.log(`\n== ${strat}  N=${N} M=${M}`);
  console.log(`first clear (F10 win) trip: median ${med(fc)} mean ${f(mean(fc.filter(Number.isFinite)))} never ${fc.filter((x) => !Number.isFinite(x)).length}`);
  console.log(`full clear (F20) trip: median ${med(full)} mean ${f(mean(full.filter(Number.isFinite)))} never ${dead20}`);
  console.log('floor | n | counter win% | ignore win% | gap pp | turns c/i | pots c/i | trip1 turns(n)');
  for (const fl of [5, 10, 15, 20]) {
    const xs = bf[fl] ?? []; const ys = t1[fl] ?? [];
    (all[fl] ??= []).push(...xs); (allT1[fl] ??= []).push(...ys);
    const cw = mean(xs.map((b) => +b.won)) * 100, iw = mean(xs.map((b) => +!!b.alt?.won)) * 100;
    if (fl === 20) console.log(`F20@trip6-10 | ${b20.length} | ${f(mean(b20.map((b) => +b.won)) * 100)} | ${f(mean(b20.map((b) => +!!b.alt?.won)) * 100)} | ${f(mean(b20.map((b) => +b.won - +!!b.alt?.won)) * 100)} | lv mean ${f(mean(lv20))} |`);
    console.log(`F${fl} | ${xs.length} | ${f(cw)} | ${f(iw)} | ${f(cw - iw)} | ${f(mean(xs.map((b) => b.turns)))}/${f(mean(xs.map((b) => b.alt!.turns)))} | ${f(mean(xs.map((b) => b.potions)), 2)}/${f(mean(xs.map((b) => b.alt!.potions)), 2)} | ${f(mean(ys.map((b) => b.turns)))}(${ys.length})`);
  }
}
