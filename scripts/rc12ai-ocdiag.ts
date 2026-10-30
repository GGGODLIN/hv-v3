/** rc12ai（自訂，僅 sim 診斷）: oc 一般戰 F58–80 每場回合／防禦／喝藥／暈眩怪回合，找長戰原因。Usage: SC=oc npx tsx scripts/rc12ai-ocdiag.ts [seeds] */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, FIGHT_CTX, TURN_HOOK9, ACT_HOOK12AF, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import type { BattleState } from '../src/core/battle';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: 'alloc', SIM_BUYPOT: '10', SIM_MERCHTHR: '8', SIM_RETREAT9: '1' })) process.env[k] ??= v;
const E = process.env, K = Number(process.argv[2] ?? 64);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!);
type F = { d: number; type: string; t: number; def: number; pot: number; stunT: number; b: BattleState; dmg: number; mhp: number };
const fs: F[] = []; let cur: F | null = null;
TURN_HOOK9.fn = (b) => { if (!cur || cur.b !== b) { cur = { d: FIGHT_CTX.depth, type: FIGHT_CTX.type, t: 0, def: 0, pot: 0, stunT: 0, b, dmg: 0, mhp: b.monsters.reduce((a, m) => a + m.maxHp, 0) }; fs.push(cur); } cur.t++; if (b.monsters.some((m) => m.hp > 0) && b.monsters.filter((m) => m.hp > 0).every((m) => m.status.stun > 0)) cur.stunT++; };
ACT_HOOK12AF.fn = (b, ev) => { if (!cur) return; for (const e of ev as any[]) { if ((e.t === 'heal' && e.label === '防禦') || (e.t === 'status' && e.to === undefined && e.text === '防禦')) cur.def++; if (e.t === 'hit' && e.from === 'player') cur.dmg += e.dmg ?? 0; } };
for (let s = 1; s <= K; s++) { const p = structuredClone(P0); p.potions.health += 10; autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); }
const a = fs.filter((f) => f.type === 'battle' && f.d >= 58 && f.d <= 80).sort((x, y) => y.t - x.t);
const med = (x: number[]) => { const s = [...x].sort((p, q) => p - q); return s[s.length >> 1]; };
console.log(`n=${a.length} medT=${med(a.map((f) => f.t))} defShare=${(a.reduce((s, f) => s + f.def, 0) / a.reduce((s, f) => s + f.t, 0)).toFixed(3)} stunShare=${(a.reduce((s, f) => s + f.stunT, 0) / a.reduce((s, f) => s + f.t, 0)).toFixed(3)} dmgPerTurn/mhp=${(a.reduce((s, f) => s + f.dmg / f.t / f.mhp, 0) / a.length).toFixed(3)}`);
for (const f of a.slice(0, 12)) console.log(`F${f.d} t=${f.t} def=${f.def} stunT=${f.stunT} dmg/turn=${(f.dmg / f.t).toFixed(0)} mhp=${f.mhp} n=${f.b.monsters.length}`);
