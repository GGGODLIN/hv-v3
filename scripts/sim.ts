/** Headless multi-run simulation: one character plays N tower runs back to back. Usage: npx tsx scripts/sim.ts [runs] [seed] */
import { readFileSync } from 'node:fs';
import { autoRun, starterKit } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';

const runs = Number(process.argv[2] ?? 20);
const seed = Number(process.argv[3] ?? 1);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const p = newPlayer();
starterKit(p, seed);
console.log('run | Lv | power | floor | outcome | kills | turns | +EXP | +C | kept');
for (let i = 1; i <= runs; i++) {
  const r = autoRun(p, pool, seed * 1000 + i);
  const s = r.settlement;
  console.log([i, r.level, r.power, r.floorReached > 10 ? 'CLEAR' : r.floorReached, s.outcome, r.kills, r.turns, s.exp, s.credits, s.kept.map((e) => e.quality[0]).join('')].join(' | '));
}
