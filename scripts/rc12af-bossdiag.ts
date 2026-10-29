/** rc12af 診斷（自訂，僅 sim、不改行為）: F45–65 王戰 — 首領 maxHp、每回合對首領傷害、打小怪回合比例、回合數。
 *  Usage: SC=blade npx tsx scripts/rc12af-bossdiag.ts [seeds=128] */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, FIGHT_CTX, TURN_HOOK9, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import type { BattleState } from '../src/core/battle';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: 'alloc', SIM_BUYPOT: '10', SIM_MERCHTHR: '7', SIM_RETREAT9: '1' })) process.env[k] ??= v;
const E = process.env, K = Number(process.argv[2] ?? 128);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!);
type F = { d: number; b: BattleState; turns: number; bossHp0: number; bossLast: number; bossDmg: number; addTurns: number; addHp0: number };
const fs: F[] = []; let cur: F | null = null;
const bossOf = (b: BattleState) => b.monsters.find((m) => (m as { rank?: string }).rank === 'boss') ?? b.monsters[0]!;
TURN_HOOK9.fn = (b) => {
  if (FIGHT_CTX.type !== 'boss' || FIGHT_CTX.depth < 45 || FIGHT_CTX.depth > 65) { cur = null; return; }
  const bo = bossOf(b);
  if (!cur || cur.b !== b) { cur = { d: FIGHT_CTX.depth, b, turns: 0, bossHp0: bo.maxHp, bossLast: bo.hp, bossDmg: 0, addTurns: 0, addHp0: b.monsters.filter((m) => m !== bo).reduce((t, m) => t + m.maxHp, 0) }; fs.push(cur); return; }
  cur.turns++; const dd = cur.bossLast - bo.hp; cur.bossDmg += dd; if (dd <= 0) cur.addTurns++; cur.bossLast = bo.hp;
};
for (let s = 1; s <= K; s++) { const p = structuredClone(P0); p.potions.health += Number(E.SIM_BUYPOT); autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); }
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1]! : NaN; };
const p90 = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(0.9 * s.length)]; };
console.log(`DIAG ${E.SC} n=${fs.length} turns=${med(fs.map((f) => f.turns + 1))}/p90 ${p90(fs.map((f) => f.turns + 1))} bossHp=${med(fs.map((f) => f.bossHp0))} addHp=${med(fs.map((f) => f.addHp0))} dmgPerTurnOnBoss=${med(fs.map((f) => f.bossDmg / Math.max(1, f.turns)))} turnsToKill=${med(fs.map((f) => f.bossHp0 / Math.max(1, f.bossDmg / Math.max(1, f.turns))))} noBossDmgTurnFrac=${med(fs.map((f) => f.addTurns / Math.max(1, f.turns))).toFixed(2)}`);
