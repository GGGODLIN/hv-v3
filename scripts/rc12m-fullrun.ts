/** rc12m 驗收（自訂）: FULL-RUN sim. Start characters = each QA oc run's earliest snapshot player (qa-saves rc12j-oc-*-end.json, deduped by run id),
 *  or SC=<school> → public/data/cp6-presets.json postF20-<school>. One abyss trip F1→F100, ★ only (SIM_POLICY=primary), potions/HP/credits
 *  carried across floors by autoRun. Usage: SIM_POLICY=primary [SC=oc] npx tsx scripts/rc12m-fullrun.ts [seedsPerStart=16] files... */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { SIM_DIAG, RC10, autoRun, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import type { Player } from '../src/core/player';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
// rc12m calibration（自訂 sim settings, matched to QA rc12l real play）: ★ route, ★ buffs, ★ keys, 忽略並出發 (no town prep), +10 potions bought in town.
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: '1', SIM_BUYPOT: '10', SIM_MERCHTHR: '7' })) process.env[k] ??= v;
const [K0, ...files] = process.argv.slice(2); const K = Number(K0 ?? 16), E = process.env;
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const starts: Record<string, Player> = {};
if (E.SC) starts[`preset-${E.SC}`] = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!); // rc12n: same lean as the game's applyPreset
else for (const f of files) { const d = JSON.parse(readFileSync(f, 'utf8')) as Record<string, string>; const best: Record<string, [number, Player]> = {};
  for (const [k, v] of Object.entries(d)) { const m = k.match(/^hv-v3-qa-snap:(.+):F(\d+)$/); if (!m) continue; const o = JSON.parse(v); if (o.player?.lean !== 'oc') continue; if (!best[m[1]!] || +m[2]! < best[m[1]!]![0]) best[m[1]!] = [+m[2]!, o.player]; }
  for (const [r, [F, p]] of Object.entries(best)) starts[`${r}@F${F}`] ??= p; }
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s[(s.length - 1) >> 1]! + s[s.length >> 1]!) / 2 : NaN; };
const cl: number[] = [], potEnd: number[] = [], pot0: number[] = [];
for (const [key, P] of Object.entries(starts)) for (let s = 1; s <= K; s++) { const p = structuredClone(P); if (E.SIM_BUYPOT) p.potions.health += Number(E.SIM_BUYPOT); const h0 = p.potions.health;
  const r = autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 });
  cl.push(r.abyss!.cleared + (r.settlement.outcome === 'dead' ? 1 : 0)); potEnd.push(p.potions.health); pot0.push(h0); if (E.PER) console.error(key, s, cl.at(-1)); }
const b30 = Object.entries(SIM_DIAG.bossByDepth).filter(([k]) => +k >= 30).flatMap(([, v]) => v);
const band = (lo: number, hi: number) => +(cl.filter((x) => x >= lo && x <= hi).length / cl.length).toFixed(3);
console.log(JSON.stringify({ starts: Object.keys(starts), n: cl.length, deathMed: med(cl.filter((x) => x < 100)), floorMed: med(cl), f100: band(100, 999), d50_75: band(50, 75), dlt50: band(0, 49),
  boss30Med: med(b30), boss30P90: [...b30].sort((a, b) => a - b)[Math.floor(b30.length * 0.9)], pot0: med(pot0), potSrc: Object.fromEntries(Object.entries(RC10.pot).map(([k, v]) => [k, +(v / Math.max(1, RC10.pot.runs)).toFixed(1)])), potEndMed: med(potEnd), potEndP25: [...potEnd].sort((a, b) => a - b)[potEnd.length >> 2], b30_65: med(Object.entries(SIM_DIAG.bossByDepth).filter(([k]) => +k >= 30 && +k <= 65).flatMap(([, v]) => v)), b70: med(Object.entries(SIM_DIAG.bossByDepth).filter(([k]) => +k >= 70).flatMap(([, v]) => v)), hit1Max: +SIM_DIAG.hit1.toFixed(3), hit1Boss: +SIM_DIAG.hit1B.toFixed(3), turnMaxBoss: Math.max(0, ...SIM_DIAG.bossBurst), turnMaxNorm: Math.max(0, ...SIM_DIAG.normBurst) }));
