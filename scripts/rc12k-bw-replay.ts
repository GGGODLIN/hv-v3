/** rc12k（僅分析，自訂）: QA bulwark 1anh F60 snapshot moved to floor F, ★ only (primaryKey), N seeds: win rate / median turns / potions. */
import { readFileSync } from 'node:fs';
import { act, startBattle, armCp5, primaryKey } from '../src/core/battle';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, armBattle, battleLocks, openingOc, runDerived } from '../src/core/run';
import { Rng } from '../src/core/rng';
import { profsOf } from '../src/core/auto';
import { realBoss } from './rc12f-realboss';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const P = JSON.parse(readFileSync(process.env.SNAP ?? 'tests/fixtures/rc12k-bulwark-1anh-F60.json', 'utf8')); const N = +(process.env.N ?? 128);
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return (s[(s.length - 1) >> 1]! + s[s.length >> 1]!) / 2; };
for (const F of (process.argv[2] ?? '30,40,50,60,65,70,75,80,85,90,95,100').split(',').map(Number)) { const r = [];
  for (let i = 0; i < N; i++) { const p = structuredClone(P.player), run = structuredClone(P.run); run.floor = F;
    const ms = structuredClone(realBoss(run, pool, true, p.lean).ms), d = runDerived(p, run);
    const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp, oc: run.oc }, ms, p.potions);
    b.locked = battleLocks(p); armBattle(b, run, p.lean, !!p.equipped?.offHand); b.oc += openingOc(p, 'boss', run); if (run.cp5) armCp5(b, run.pdot);
    const rng = new Rng((i + 1) ^ 0x5bd1e995), profs = profsOf(p), p0 = b.potions.health, hp0 = b.monsters[0]!.maxHp;
    while (!b.over && b.turn < 400) act(b, primaryKey(b, Math.max(0, b.monsters.findIndex((m) => m.hp > 0))).action, rng, profs);
    r.push({ w: b.over === 'win', t: b.turn, pots: p0 - b.potions.health, hp0 }); }
  console.log(JSON.stringify({ lean: P.player.lean, F, win: +(r.filter((x) => x.w).length / N).toFixed(2), turns: med(r.map((x) => x.t)), winTurns: med(r.filter((x) => x.w).map((x) => x.t)), pots: med(r.map((x) => x.pots)), bossHp: r[0]!.hp0 })); }
