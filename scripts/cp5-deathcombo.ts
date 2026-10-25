/** CP5 §4.3 death-combo sweep. For each school × seed, play counter runs and snapshot (player, run) the first time a run enters F3/F8/F13/F18.
 * Then for every legal 1–2 affix combo, build that floor's elite (forced affixes) and fight it at full HP with the counter AI.
 * Usage: npx tsx scripts/cp5-deathcombo.ts [N=32] [M=12] > docs/logs/cp5-deathcombo.txt */
import { readFileSync } from 'node:fs';
import { autoRun, fight, starterKit, type Strategy } from '../src/core/auto';
import { startBattle } from '../src/core/battle';
import { CP5, CP5_FORCE, affixCombos } from '../src/core/cp5';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, type Player } from '../src/core/player';
import { RULES, armBattle, battleLocks, encounter, openingOc, runDerived, type RunState } from '../src/core/run';
import { armCp5 } from '../src/core/battle';
import { Rng } from '../src/core/rng';
import { profsOf } from '../src/core/auto';
for (const kv of process.argv.slice(4)) { const [k, v] = kv.split('='); (CP5 as unknown as Record<string, number>)[k!] = Number(v); console.log(`# override ${k}=${v}`); }
const N = Number(process.argv[2] ?? 32), M = Number(process.argv[3] ?? 12);
const STRATS = ['auto', 'buff:blade', 'buff:oc', 'buff:arcane', 'buff:bulwark'] as Strategy[];
const FLOORS = [3, 8, 13, 18];
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const combos = affixCombos();
type Snap = { p: Player; run: RunState };
let dead = 0, warn = 0, rel = 0; const lines: string[] = [];
console.log(`# CP5 death-combo sweep  N=${N} seeds, snapshots from counter runs (≤${M} trips), ${combos.length} combos × F${FLOORS.join('/F')} × ${STRATS.length} schools`);
console.log('# 必死 = counter win < 50%, 警告 = < 70%. Elite fought at full HP/MP/SP from the snapshot.');
for (const strat of STRATS) {
  const snaps: Record<number, Snap[]> = {};
  for (let s = 1; s <= N; s++) {
    const p = newPlayer(); starterKit(p, s); const got = new Set<number>();
    for (let i = 1; i <= M && got.size < FLOORS.length; i++)
      autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3, snap: (pp, run) => {
        if (FLOORS.includes(run.floor) && !got.has(run.floor)) { got.add(run.floor); (snaps[run.floor] ??= []).push(structuredClone({ p: pp, run })); }
      } });
  }
  for (const fl of FLOORS) {
    const ss = snaps[fl] ?? []; let worst = 1, worstC = '';
    let ctrl = NaN;
    for (const c of [[], ...combos]) {
      let w = 0;
      const flag = RULES.cp5Bosses, b4 = RULES.cp4RunBuffs; RULES.cp5Bosses = true; RULES.cp4RunBuffs = strat.startsWith('buff:');
      try {
        ss.forEach((sn, k) => {
          const { p, run } = structuredClone(sn); CP5_FORCE.affixes = c;
          const d = runDerived(p, run); run.hp = d.hp; run.mp = d.mp; run.sp = d.sp; run.pdot = undefined;
          const ms = encounter(run, pool, 'elite'); CP5_FORCE.affixes = null;
          const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
          b.locked = battleLocks(p); armBattle(b, run); b.oc += openingOc(p, 'elite', run); armCp5(b);
          fight(b, strat, new Rng(fl * 7919 + k), profsOf(p), 'counter');
          if (b.over === 'win') w++;
        });
      } finally { RULES.cp5Bosses = flag; RULES.cp4RunBuffs = b4; CP5_FORCE.affixes = null; }
      const r = ss.length ? w / ss.length : 1;
      if (!c.length) { ctrl = r; continue; }
      if (r < worst) { worst = r; worstC = c.join('+'); }
      if (r < ctrl - 0.25) { rel++; lines.push(`相對 ${strat} F${fl} ${c.join('+')} ${(r * 100).toFixed(0)}% vs 無詞綴 ${(ctrl * 100).toFixed(0)}%`); }
      if (r < 0.5) { dead++; lines.push(`必死 ${strat} F${fl} ${c.join('+')} ${(r * 100).toFixed(0)}% (n=${ss.length})`); }
      else if (r < 0.7) { warn++; lines.push(`警告 ${strat} F${fl} ${c.join('+')} ${(r * 100).toFixed(0)}% (n=${ss.length})`); }
    }
    console.log(`${strat} F${fl}: snapshots ${ss.length}, no-affix control ${(ctrl * 100).toFixed(0)}%, worst ${worstC} ${(worst * 100).toFixed(0)}%`);
  }
}
console.log(lines.join('\n'));
console.log(`必死 ${dead}  警告 ${warn}  相對必死(比無詞綴對照低 >25pp) ${rel}`);
