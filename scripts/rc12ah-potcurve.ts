/** rc12ah 1 診斷（自訂，僅 sim）: 每 10 層首戰開場藥數中位（未到計 0 / 只算到達）、喝藥時 HP% 中位、各段喝藥數。
 *  Usage: SC=oc npx tsx scripts/rc12ah-potcurve.ts [seeds=128]（預設 env 同 rc12ab-accept） */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, FIGHT_CTX, TURN_HOOK9, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import type { BattleState } from '../src/core/battle';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: 'alloc', SIM_BUYPOT: '10', SIM_MERCHTHR: '0', SIM_RETREAT9: '1' })) process.env[k] ??= v;
const E = process.env, K = Number(process.argv[2] ?? 128);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!);
let seed = 0, cb: BattleState | null = null, lastPot = 0, lastHp = 0;
const first: Record<number, Record<number, number>> = {}; const drinkHp: number[] = []; const drinks: Record<string, number> = {};
TURN_HOOK9.fn = (b) => {
  if (cb !== b) { cb = b; const d = FIGHT_CTX.depth; (first[seed] ??= {}); if (d % 10 === 0 || !(Math.floor(d / 10) * 10 in first[seed]!)) first[seed]![Math.floor(d / 10) * 10] ??= b.potions.health; }
  else if (b.potions.health < lastPot) { drinkHp.push(lastHp); const k = `F${Math.floor(FIGHT_CTX.depth / 15) * 15}`; drinks[k] = (drinks[k] ?? 0) + 1; }
  lastPot = b.potions.health; lastHp = Math.round(100 * b.hp / b.d.hp);
};
let start = 0;
for (let s = 1; s <= K; s++) { seed = s; cb = null; const p = structuredClone(P0); p.potions.health += Number(E.SIM_BUYPOT); start = p.potions.health; autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); }
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s[(s.length - 1) >> 1]! + s[s.length >> 1]!) / 2 : NaN; };
const row = [10, 20, 30, 40, 50, 60, 70].map((f) => { const all = Object.keys(first).map((s) => first[+s]![f] ?? 0), r = Object.keys(first).filter((s) => f in first[+s]!).map((s) => first[+s]![f]!); return `F${f}:${med(all)}/${med(r)}(n${r.length})`; });
console.log(`POT ${E.SC} start=${start} ${row.join(' ')} drinkHpMed=${med(drinkHp)}% drinks/run=${JSON.stringify(Object.fromEntries(Object.entries(drinks).map(([k, v]) => [k, +(v / K).toFixed(1)])))}`);
