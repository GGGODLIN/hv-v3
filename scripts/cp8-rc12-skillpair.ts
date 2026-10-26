/** cp8-rc12 diagnosis: paired battles (same postF20 preset character, same encounter, same RNG) — naive A-only vs naive + skills when castable.
 * Prints win rate, turns, HP lost per school × abyss depth. Env CP8=1 SIM_AI=naive. Usage: npx tsx scripts/cp8-rc12-skillpair.ts [N=200] [depths=5,10,15,20,25] */
import { readFileSync } from 'node:fs';
import { SIM_AI, fight, profsOf } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { startBattle } from '../src/core/battle';
import { RULES, startAbyss, enterNode, encounter, runDerived, battleLocks, openingOc, armBattle } from '../src/core/run';

import { Rng } from '../src/core/rng';
import type { Player } from '../src/core/player';
const E = process.env;
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const pre = JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, { player: Player }>;
const N = Number(process.argv[2] ?? 200), depths = (process.argv[3] ?? '5,10,15,20,25').split(',').map(Number);
const TY = (E.TYPE ?? 'battle') as never;
const variants = (E.VARIANTS ?? ',skills').split(',');
for (const sc of (E.SCH ?? 'blade,oc,arcane,bulwark').split(',')) for (const dep of depths) {
  const out: string[] = [];
  for (const v of variants) {
    SIM_AI.add.clear(); for (const x of v.split('+').filter(Boolean)) SIM_AI.add.add(x);
    let w = 0, turns = 0, lost = 0;
    for (let s = 1; s <= N; s++) {
      const p = structuredClone(pre[`postF20-${sc}`]!.player);
      const run = startAbyss(p, s * 7919, dep, 0); enterNode(p, run, TY);
      const ms = encounter(run, pool, TY); const d = runDerived(p, run);
      const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, p.potions); b.locked = battleLocks(p);
      const oc0 = openingOc(p, TY, run); armBattle(b, run); b.oc += oc0;
      fight(b, `buff:${sc}` as never, new Rng(s * 31 + 7), profsOf(p));
      if (b.over === 'win') w++; turns += b.turn; lost += 1 - Math.max(0, b.hp) / d.hp;
    }
    out.push(`${v || 'A-only'} win ${(100 * w / N).toFixed(1)}% turns ${(turns / N).toFixed(1)} hpLost ${(lost / N).toFixed(3)}`);
  }
  console.log(sc, 'd' + dep, out.join(' | '));
}

