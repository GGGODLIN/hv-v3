/** rc8 d1 blocker probe (sim only). For each school, seeds 1..N: build the character exactly as cp6-abyss-sim does
 * (main tower until first F20 clear), snapshot its trip-1 state, then (a) the real trip-1 result and (b) 1 fresh d1 normal fight
 * per seed with counter AI and with attack-only AI. Also runs the same fights from the exported preset.
 * Usage: npx tsx scripts/rc8-d1-probe.ts [N=64] */
import { readFileSync } from 'node:fs';
import { autoRun, fight, profsOf, starterKit, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { level, newPlayer, type Player } from '../src/core/player';
import { RULES, armBattle, battleLocks, encounter, openingOc, runDerived, startAbyss } from '../src/core/run';
import { checkpointStart, emptyRecord } from '../src/core/abyss';
import { act, armCp5, startBattle } from '../src/core/battle';
import { Rng } from '../src/core/rng';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true;
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const pre = JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8'));
const N = Number(process.argv[2] ?? 64), K = 50;
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
function d1(p0: Player, strat: Strategy, seed: number, mode: 'counter' | 'attack') {
  const p = JSON.parse(JSON.stringify(p0)) as Player; const run = startAbyss(p, seed, 1);
  const ms = encounter(run, pool, 'battle');
  const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run); b.oc += openingOc(p, 'battle', run); armCp5(b, run.pdot);
  const rng = new Rng(seed * 31 + 7); let taken = 0, turns = 0;
  if (mode === 'counter') fight(b, strat, rng, profsOf(p), 'counter');
  else while (!b.over && b.turn < 400) { const h = b.hp; act(b, { kind: 'attack', target: b.monsters.findIndex((m) => m.hp > 0) }, rng, profsOf(p)); taken += Math.max(0, h - b.hp); turns++; }
  return { win: b.over === 'win', taken, turns };
}
function rate(p: Player, strat: Strategy, mode: 'counter' | 'attack') {
  let w = 0, t = 0, n = 0; for (let k = 1; k <= K; k++) { const r = d1(p, strat, 9000 + k, mode); w += +r.win; t += r.taken; n += r.turns; } return { w: w / K, dpt: n ? t / n : 0 };
}
for (const school of ['blade', 'oc', 'arcane', 'bulwark']) {
  const strat = `buff:${school}` as Strategy;
  const hp: number[] = [], mp: number[] = [], lv: number[] = [], pot: number[] = [], c: number[] = [], a: number[] = [], dpt: number[] = [], t1: number[] = [];
  for (let s = 1; s <= N; s++) {
    const p = newPlayer(); starterKit(p, s);
    for (let i = 1; i <= 60; i++) if (autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3 }).settlement.outcome === 'clear') break;
    const run = startAbyss(JSON.parse(JSON.stringify(p)), 1, 1); const d = runDerived(p, run);
    hp.push(d.hp); mp.push(d.mp); lv.push(level(p)); pot.push(p.potions.health + p.potions.mana + p.potions.spirit);
    const rc = rate(p, strat, 'counter'), ra = rate(p, strat, 'attack'); c.push(rc.w); a.push(ra.w); dpt.push(ra.dpt);
    const r = autoRun(JSON.parse(JSON.stringify(p)), pool, s * 1000 + 101, strat, { mode: 'counter', retreat: 0.3, abyss: checkpointStart(emptyRecord().best), cap: 60, ms: emptyRecord().ms });
    t1.push(r.abyss!.cleared);
  }
  const P = pre[`postF20-${school}`].player as Player; const run = startAbyss(JSON.parse(JSON.stringify(P)), 1, 1); const dp = runDerived(P, run);
  const pc = rate(P, strat, 'counter'), pa = rate(P, strat, 'attack');
  const avg = (x: number[]) => (x.reduce((u, v) => u + v, 0) / x.length);
  console.log(`${school} SIM N=${N}: lv med ${med(lv)} HP med ${med(hp)} MP med ${med(mp)} potions med ${med(pot)} | d1 battle win counter ${(100 * avg(c)).toFixed(0)}% attack-only ${(100 * avg(a)).toFixed(0)}% dmg taken/turn ${avg(dpt).toFixed(0)} | trip1 died at d1 ${t1.filter((x) => x === 0).length}/${N}, trip1 median cleared ${med(t1)}`);
  console.log(`${school} PRESET seed ${pre[`postF20-${school}`].seed}: lv ${level(P)} HP ${dp.hp} MP ${dp.mp} potions ${JSON.stringify(P.potions)} | d1 battle win counter ${(100 * pc.w).toFixed(0)}% attack-only ${(100 * pa.w).toFixed(0)}% dmg taken/turn ${pa.dpt.toFixed(0)}`);
}
