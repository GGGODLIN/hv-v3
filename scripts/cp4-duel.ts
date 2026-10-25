/** CP4 rc balance duel: same characters (seeds 1..N after 1 'human' trip), each school given an equal 3-buff set
 * (core + 2 commons, so the school combo is on), fights K fresh F9 elite / F10 boss encounters from full HP.
 * Play: arcane and none-h use 'human' (casts at weaknesses); the others 'noweak' (attacks, boss Spirit Stance) — what a player of that school does.
 * shield=tower|keep: force a Tower shield (sourced stats via generateEquip) or keep the gear. Sim only.
 * Usage: npx tsx scripts/cp4-duel.ts [N=32] [K=6] [shield=keep] [rip.mult=..] [rip.perTurn=..] */
import { readFileSync } from 'node:fs';
import { applyKnobs } from './cp4-knobs';
import { autoRun, fight, profsOf, starterKit } from '../src/core/auto';
import { startBattle } from '../src/core/battle';
import { generateEquip } from '../src/core/items';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';
import { armBattle, battleLocks, encounter, RULES, runDerived, startRun } from '../src/core/run';
import { Rng } from '../src/core/rng';
const kv = Object.fromEntries(process.argv.slice(2).filter((a) => a.includes('=')).map((a) => a.split('=')));
const args = process.argv.slice(2).filter((a) => !a.includes('='));
const N = Number(args[0] ?? 32), K = Number(args[1] ?? 6);
const SETS: Record<string, string[]> = { none: [], 'none-h': [], blade: ['B1', 'B2', 'B4'], oc: ['O1', 'O2', 'O3'], arcane: ['A1', 'A2', 'A6'], bulwark: ['W1', 'W2', 'W3'], ...(kv.extra ? JSON.parse(kv.extra) : {}) };
applyKnobs(process.argv.slice(2));
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
RULES.cp4RunBuffs = true;
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)]! : NaN; };
console.log(`duel seeds=${N} K=${K} ${Object.entries(kv).map(([k, v]) => `${k}=${v}`).join(' ') || ''}`);
console.log('set | F9菁英勝率 | 剩HP中位 | 回合中位 | F10首領勝率 | 剩HP中位 | 回合中位');
const chars = Array.from({ length: N }, (_, i) => { const p = newPlayer(); starterKit(p, i + 1); autoRun(p, pool, (i + 1) * 1000 + 1, 'human'); autoRun(p, pool, (i + 1) * 1000 + 2, 'human');
  if (kv.shield === 'tower') { const e = generateEquip(new Rng(i + 77), 20, { minQuality: 'fair' }); void e; } return p; });
for (const [name, set] of Object.entries(SETS)) {
  const out: Record<number, { w: number; n: number; hp: number[]; t: number[] }> = { 9: { w: 0, n: 0, hp: [], t: [] }, 10: { w: 0, n: 0, hp: [], t: [] } };
  chars.forEach((p0, ci) => {
    for (const f of [9, 10]) for (let k = 0; k < K; k++) {
      const p = structuredClone(p0);
      if (kv.shield === 'tower') { for (let j = 0; j < 400; j++) { const e = generateEquip(new Rng(ci * 997 + j), 18, { minQuality: 'fair' }); if (e.group === 'shield' && e.base === 'tower') { p.equipped.offHand = e; if (p.equipped.mainHand?.group === 'twoHand' || p.equipped.mainHand?.group === 'staff') p.equipped.offHand = undefined; break; } } }
      const run = startRun(p, ci * 100 + k + 1); run.floor = f; run.buffs = [...set];
      const d = runDerived(p, run); run.hp = d.hp; run.mp = d.mp; run.sp = d.sp;
      const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, encounter(run, pool, f === 10 ? 'boss' : 'elite'), p.potions);
      b.locked = battleLocks(p); armBattle(b, run);
      fight(b, name.startsWith('arcane') || name === 'none-h' ? 'human' : 'noweak', new Rng(ci * 31 + k * 7 + f), profsOf(p));
      const o = out[f]!; o.n++; if (b.over === 'win') { o.w++; o.hp.push(b.hp / b.d.hp); } o.t.push(b.turn);
    }
  });
  const r = (f: number) => { const o = out[f]!; return `${(100 * o.w / o.n).toFixed(0)}% | ${(100 * med(o.hp)).toFixed(0)}% | ${med(o.t)}`; };
  console.log(`${name}[${set.join(',')}] | ${r(9)} | ${r(10)}`);
}
