/** rc5 reconciliation (sim only, no value changes): put preset characters straight into abyss fights.
 * Usage: npx tsx scripts/rc5-recon.ts <presets.json> [seeds] */
import { readFileSync } from 'node:fs';
import { act, alive, canUse, startBattle, type Action, type BattleState } from '../src/core/battle';
import { autoRun, fight, profsOf, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { derive, type Player } from '../src/core/player';
import { RULES, abyssLevel, armBattle, battleLocks, encounter, openingOc, runDerived, startAbyss } from '../src/core/run';
import { armCp5 } from '../src/core/battle';
import { Rng } from '../src/core/rng';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true;
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const all = JSON.parse(readFileSync(process.argv[2]!, 'utf8')) as Record<string, { player: Player; school: string; level: number }>;
const S = Number(process.argv[3] ?? 200);
const clone = <X>(x: X): X => JSON.parse(JSON.stringify(x));
// "naive" = a plain human: attack the lowest-HP foe, drink a health potion under 35% HP; no spells, defend, spirit, counters.
const naive = (b: BattleState): Action => { const l = alive(b); const t = b.monsters.indexOf(l.reduce((a, m) => (m.hp < a.hp ? m : a)));
  return b.hp < b.d.hp * 0.35 && canUse(b, { kind: 'item', id: 'health' }) ? { kind: 'item', id: 'health' } : { kind: 'attack', target: t }; };
function one(key: string, depth: number, type: 'boss' | 'battle', ai: 'sim' | 'base' | 'noweak' | 'naive', seed: number) {
  const pr = all[key]!; const p = clone(pr.player);
  const run = startAbyss(p, seed, depth); // depth = start, floor 1 → depthOf = depth, full HP
  if (type === 'boss') { run.tower.floors[0]!.options = ['boss']; }
  const ms = encounter(run, pool, type);
  const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run); b.oc += openingOc(p, type, run); armCp5(b, run.pdot);
  const rng = new Rng(seed * 31 + 7), profs = profsOf(p); let dmg = 0, hits = 0;
  const strat = `buff:${pr.school === 'none' ? 'blade' : pr.school}` as Strategy;
  if (ai === 'sim') fight(b, strat, rng, profs, 'counter'); else if (ai === 'base') fight(b, strat, rng, profs, 'base'); else if (ai === 'noweak') fight(b, 'noweak', rng, profs, 'base');
  else while (!b.over && b.turn < 400) { const h = b.hp; act(b, naive(b), rng, profs); if (b.hp < h) { dmg += h - b.hp; hits++; } }
  if (!b.over) b.over = 'lose';
  return { won: b.over === 'win', turns: b.turn, dmgPerTurn: ai === 'naive' ? dmg / Math.max(1, b.turn) : NaN, lv: abyssLevel(run), foes: ms.map((m) => `${m.rank}:Lv${m.level ?? '?'}`).join(','), hp: b.d.hp };
}
const pct = (a: boolean[]) => `${Math.round(100 * a.filter(Boolean).length / a.length)}%`;
const avg = (a: number[]) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
for (const key of Object.keys(all)) for (const [depth, type] of [[5, 'boss'], [16, 'battle']] as const) {
  const row = [`${key} Lv${all[key]!.level} d${depth} ${type}`];
  for (const ai of ['sim', 'base', 'noweak', 'naive'] as const) { const xs = Array.from({ length: S }, (_, i) => one(key, depth, type, ai, i + 1));
    row.push(`${ai}: win ${pct(xs.map((x) => x.won))} turns ${avg(xs.map((x) => x.turns))}${ai === 'naive' ? ` dmg/turn ${avg(xs.map((x) => x.dmgPerTurn))}` : ''}`);
    if (ai === 'sim') row.push(`maxHP ${xs[0]!.hp} monLv ${xs[0]!.lv} foes ${xs[0]!.foes}`); }
  console.log(row.join(' | '));
}
// Full trip d1→d5 boss with the sim route (attrition included), same preset each time.
for (const key of Object.keys(all)) { const pr = all[key]!; if (!key.startsWith('postF20')) continue; const w: boolean[] = [];
  for (let s = 1; s <= S; s++) { const p = clone(pr.player); const r = autoRun(p, pool, 5000 + s, `buff:${pr.school}` as Strategy, { mode: 'counter', retreat: 0.3, abyss: 1, cap: 5 }); const bf = r.bosses.find((x) => x.floor === 5); if (bf) w.push(bf.won); }
  console.log(`${key} full trip d1→d5: reached boss ${w.length}/${S}, boss win ${pct(w)}`); }
