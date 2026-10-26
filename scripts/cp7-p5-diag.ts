/** CP7 P5 diagnosis: blade main tower only. Env LPL=0|1 (RULES.lootPlayerLevel), SC (default blade), N. Prints never≤12, death floors, level/power at trips. */
import { readFileSync } from 'node:fs';
import { autoRun, starterKit, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, derive, powerScore } from '../src/core/player';
import { RULES } from '../src/core/run';
const E = process.env;
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.lootPlayerLevel = E.LPL !== "0"; RULES.cp7 = E.CP7 !== "0";
import { CP7 } from "../src/core/cp7"; for (const k of Object.keys(CP7) as (keyof typeof CP7)[]) if (E[`K_${k}`]) (CP7 as Record<string, unknown>)[k] = Number(E[`K_${k}`]);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const N = Number(E.N ?? 256), S0 = Number(E.SEED0 ?? 0), sc = E.SC ?? 'blade'; const strat = `buff:${sc}` as Strategy;
let never = 0; const deathF: Record<string, number> = {}; const at: Record<number, { lv: number[]; pw: number[]; wl: number[]; al: number[] }> = {};
for (let s = S0 + 1; s <= S0 + N; s++) {
  const p = newPlayer(); starterKit(p, s); let ok = false;
  for (let i = 1; i <= 12; i++) {
    const r = autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3 });
    const d = derive(p); const a = (at[i] ??= { lv: [], pw: [], wl: [], al: [] });
    a.lv.push(d.level); a.pw.push(powerScore(d)); a.wl.push(p.equipped.mainHand?.level ?? 0);
    const arm = ['head','body','hands','legs','feet'].map((k) => (p.equipped as Record<string, {level:number}|undefined>)[k]?.level ?? 0); a.al.push(arm.reduce((x, y) => x + y, 0) / 5);
    if (r.settlement.outcome === 'clear') { ok = true; break; }
    const k = `${r.settlement.outcome}@F${r.floorReached}${r.end?.type ? ':' + r.end.type : ''}`; deathF[k] = (deathF[k] ?? 0) + 1;
  }
  if (!ok) never++;
}
const med = (x: number[]) => { const s = [...x].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
console.log(`cp7=${RULES.cp7} add=${CP7.lootLvAdd} ${sc} never≤12 ${(100 * never / N).toFixed(1)}%`);
for (const [i, a] of Object.entries(at)) console.log(`  trip ${i}: n ${a.lv.length} lv ${med(a.lv)} power ${med(a.pw)?.toFixed(0)} weaponLv ${med(a.wl)} armourLv ${med(a.al)}`);
console.log('  ends', Object.entries(deathF).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}:${v}`).join(' '));
