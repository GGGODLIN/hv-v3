/** rc12ah item 3 診斷（自訂，僅 sim）: 面板「防禦回血 +h 後的淨 HP 約 A–B」vs 按 D 後實際 HP。只計有蓄力怪（面板顯示該行）且本回合按 D 的回合。
 *  也算舊版（rc12ag：只扣最大一隻蓄力怪）A 以便比較。 Usage: SC=blade npx tsx scripts/rc12ah-defprobe.ts [seeds] */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, TURN_HOOK9, ACT_HOOK12AF, FIGHT_CTX, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import { defNet12ah, defHeal12ag, chargeEstimate, windingUp } from '../src/core/battle';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const E = process.env, K = Number(process.argv[2] ?? 32);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!);
let pre: { a: number; b: number; oldA: number } | null = null; let n = 0, belowA = 0, belowOld = 0, aboveB = 0; const ex: string[] = [];
TURN_HOOK9.fn = (b) => { const ch = b.monsters.filter((m) => m.hp > 0 && windingUp(m)); if (!ch.length) { pre = null; return; } const d = defNet12ah(b); const h = defHeal12ag(b); pre = { a: d.a, b: d.b, oldA: Math.max(0, Math.round(b.hp) + h - Math.round(Math.max(...ch.map((m) => chargeEstimate(b, m, true, true))))) }; };
ACT_HOOK12AF.fn = (b, ev) => { if (!pre) return; const p = pre; pre = null; const def = ev.some((e) => (e.t === 'heal' && (e as { label?: string }).label === '防禦') || (e.t === 'status' && e.to === 'player' && (e as { text?: string }).text === '防禦')); if (!def) return; n++; const hp = Math.max(0, Math.round(b.hp)); if (hp < p.a) { belowA++; ex.length < 5 && ex.push(`F${FIGHT_CTX.depth} t${b.turn} A${p.a} B${p.b} act${hp}`); } if (hp < p.oldA) belowOld++; if (hp > p.b) aboveB++; };
for (let s = 1; s <= K; s++) { const p = structuredClone(P0); p.potions.health += Number(E.SIM_BUYPOT ?? 10); autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); }
const pc = (x: number) => (n ? ((100 * x) / n).toFixed(2) : '0') + '%';
console.log(`DEFPROBE ${E.SC} n=${n} belowA=${belowA}(${pc(belowA)}) belowOldA=${belowOld}(${pc(belowOld)}) aboveB=${aboveB}(${pc(aboveB)})`); for (const x of ex) console.log('  ' + x);
