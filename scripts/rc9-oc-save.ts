// cp9-rc9 item 5（自訂，僅 sim 診斷）: continue the rc8 oc1 F61 QA save over many seeds.
// Usage: SAVE=path START=61 N=64 npx tsx scripts/rc9-oc-save.ts  (env as /tmp/cp9/run.sh: CP8=1 SIM_AI=naive SIM_ROUTE=battle SIM_POTPOLICY=ui)
import { readFileSync } from 'node:fs';
import { POTSRC, autoRun, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import type { Player } from '../src/core/player';
const E = process.env;
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = E.CP7 !== '0'; RULES.cp8 = E.CP8 === '1';
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const save = JSON.parse(JSON.parse(readFileSync(E.SAVE!, 'utf8'))['hv-v3-save']);
const base = save.player as Player; const st = Number(E.START ?? 61), N = Number(E.N ?? 64), CAP = Number(E.SIM_CAP ?? 100);
const floors: number[] = []; let f100 = 0; const pot = { ...POTSRC }; for (const k in POTSRC) (POTSRC as Record<string, number>)[k] = 0;
for (let s = 0; s < N; s++) {
  const p = structuredClone(base) as Player;
  const r = autoRun(p, pool, 900000 + s, 'buff:oc' as Strategy, { mode: 'counter', retreat: 0.3, abyss: st, cap: CAP, ms: Math.max(0, st - 1) });
  const fl = r.abyss ? r.abyss.cleared : r.floorReached;
  floors.push(fl); if (fl >= CAP) f100++;
}
floors.sort((a, b) => a - b); const med = (floors[(N - 1) >> 1]! + floors[N >> 1]!) / 2;
console.log(JSON.stringify({ start: st, N, med, p25: floors[Math.floor(N * 0.25)], p75: floors[Math.floor(N * 0.75)], max: floors[N - 1], f100: f100 / N, potPerRun: Object.fromEntries(Object.entries(POTSRC).map(([k, v]) => [k, +(v / N).toFixed(2)])), pot0: base.potions, credits: base.credits }));
void pot;
