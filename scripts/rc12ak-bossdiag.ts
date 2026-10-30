/** rc12ak（自訂，僅 sim 診斷）: 首領戰 F55–75 逐回合對首領傷害與按鍵（A/S技能/M法術/D/Z），對照 QA bl1 turnlog.bossDmg。Usage: SC=blade npx tsx scripts/rc12ak-bossdiag.ts [seeds] */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, FIGHT_CTX, TURN_HOOK9, ACT_HOOK12AF, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import type { BattleState } from '../src/core/battle';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: 'alloc', SIM_BUYPOT: '10', SIM_RETREAT9: '1' })) process.env[k] ??= v;
const E = process.env, K = Number(process.argv[2] ?? 64);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!);
type F = { d: number; b: BattleState; keys: string; dmg: number[]; pre: number; mp: number[]; sp: number[] };
const fs: F[] = []; let cur: F | null = null;
const bhp = (b: BattleState) => b.monsters.filter((m) => m.rank === 'boss').reduce((t, m) => t + Math.max(0, m.hp), 0);
TURN_HOOK9.fn = (b) => { if (FIGHT_CTX.type !== 'boss') { cur = null; return; } if (!cur || cur.b !== b) { cur = { d: FIGHT_CTX.depth, b, keys: '', dmg: [], pre: 0, mp: [], sp: [] }; fs.push(cur); } cur.pre = bhp(b); cur.mp.push(b.mp); cur.sp.push((b as any).sp ?? 0); };
ACT_HOOK12AF.fn = (b, _ev, a) => { if (!cur || cur.b !== b) return; cur.dmg.push(Math.max(0, cur.pre - bhp(b))); cur.keys += a?.kind === 'attack' ? 'A' : a?.kind === 'skill' ? 'S' : a?.kind === 'spell' ? 'M' : a?.kind === 'defend' ? 'D' : a?.kind === 'item' ? 'Z' : '?'; };
for (let s = 1; s <= K; s++) { const p = structuredClone(P0); p.potions.health += 10; autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); }
const med = (x: number[]) => { const s = [...x].sort((p, q) => p - q); return s[s.length >> 1] ?? 0; };
for (const F0 of [55, 60, 65, 70, 75]) {
  const a = fs.filter((f) => f.d === F0 && f.dmg.length > 0); if (!a.length) continue;
  const share = (c: string, from = 0) => { let n = 0, t = 0; for (const f of a) for (const ch of f.keys.slice(from)) { t++; if (ch === c) n++; } return (n / Math.max(1, t)).toFixed(2); };
  const after4 = a.flatMap((f) => f.dmg.slice(4)), first4 = a.flatMap((f) => f.dmg.slice(0, 4));
  console.log(`F${F0} n=${a.length} turnsMed=${med(a.map((f) => f.dmg.length))} avgMed=${med(a.map((f) => f.dmg.reduce((x, y) => x + y, 0) / f.dmg.length)).toFixed(0)} first4Med=${med(first4)} after4Med=${med(after4)} S_after4=${share('S', 4)} M_after4=${share('M', 4)} A_after4=${share('A', 4)} ex=${a[0]!.keys}`);
}
