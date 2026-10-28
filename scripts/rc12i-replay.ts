/** rc12i item 1（僅分析，自訂）: replay QA bulwark (or LEAN=…) boss fights F30+ (bl1 = uee9, bl2 = dhgg) from their pre-encounter
 *  snapshots, ★ only (SIM_POLICY=primary), under the current SIM_DEEP. Usage: SIM_POLICY=primary npx tsx scripts/rc12g-blade-replay.ts K dump... */
import { readFileSync } from 'node:fs';
import { decide, profsOf } from '../src/core/auto';
import { act, startBattle, armCp5 } from '../src/core/battle';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, armBattle, battleLocks, openingOc, runDerived, type RunState } from '../src/core/run';
import { Rng } from '../src/core/rng';
import type { Player } from '../src/core/player';
import { realBoss } from './rc12f-realboss';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const [K0, ...files] = process.argv.slice(2); const K = Number(K0 ?? 32);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const snap: Record<string, { player: Player; run: RunState; rngAt?: string }> = {};
for (const f of files) { const d = JSON.parse(readFileSync(f, 'utf8')) as Record<string, string>;
  for (const [k, v] of Object.entries(d)) { const m = k.match(/^hv-v3-qa-snap:(.+):F(\d+)$/); if (!m || +m[2]! < 30) continue; const o = JSON.parse(v); if (o.player?.lean !== (process.env.LEAN ?? 'bulwark')) continue; snap[`${m[1]}:F${m[2]}`] ??= o; } }
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return (s[(s.length - 1) >> 1]! + s[s.length >> 1]!) / 2; };
for (const key of Object.keys(snap).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))) {
  const r = [...Array(K)].map((_, i) => { const P = snap[key]!; const p = structuredClone(P.player), run = structuredClone(P.run);
    const ms = structuredClone(realBoss(P.run, pool, P.rngAt === 'pre-encounter', p.lean ?? undefined).ms), d = runDerived(p, run);
    const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp, oc: run.oc }, ms, p.potions);
    b.locked = battleLocks(p); armBattle(b, run, p.lean, !!p.equipped?.offHand); b.oc += openingOc(p, 'boss', run); if (run.cp5) armCp5(b, run.pdot);
    const rng = new Rng((i + 1) ^ 0x5bd1e995), profs = profsOf(p), pot0 = b.potions.health;
    while (!b.over && b.turn < 400) act(b, decide(b, `buff:${p.lean ?? 'blade'}` as never, 'counter'), rng, profs);
    return { won: b.over === 'win', turns: b.turn, pots: pot0 - b.potions.health }; });
  console.log('REPLAY ' + JSON.stringify({ key, turns: med(r.map((x) => x.turns)), win: r.filter((x) => x.won).length / K, pots: med(r.map((x) => x.pots)), max: Math.max(...r.map((x) => x.turns)) }));
}
