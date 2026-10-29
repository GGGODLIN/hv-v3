import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, FIGHT_CTX, TURN_HOOK9, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import type { BattleState } from '../src/core/battle';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: 'alloc', SIM_BUYPOT: '10', SIM_MERCHTHR: '7', SIM_RETREAT9: '1' })) process.env[k] ??= v;
const E = process.env, K = Number(process.argv[2] ?? 64);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!);
type F = { d: number; turns: number; b: BattleState; p0: number; hp0: number; taken: number; bossMax: number; bossDmg: number; nAdds: number; addMax: number; lastHp: number; lastBh: number; potUsed: number; lastP: number };
const fs: F[] = []; let cur: F | null = null;
TURN_HOOK9.fn = (b) => {
  const bo = b.monsters.find((m) => m.rank === 'boss');
  if (!cur || cur.b !== b) { cur = null; if (FIGHT_CTX.type === 'boss' && bo) { const ad = b.monsters.filter((m) => m.rank !== 'boss'); cur = { d: FIGHT_CTX.depth, turns: 0, b, p0: b.potions.health, hp0: b.hp / b.d.hp, taken: 0, bossMax: bo.maxHp, bossDmg: 0, nAdds: ad.length, addMax: ad.reduce((t, m) => t + m.maxHp, 0), lastHp: b.hp, lastBh: bo.hp, potUsed: 0, lastP: b.potions.health }; fs.push(cur); } return; }
  const used = cur.lastP - b.potions.health; cur.potUsed += used; if (used === 0) cur.taken += Math.max(0, cur.lastHp - b.hp) / b.d.hp; cur.bossDmg += Math.max(0, cur.lastBh - (bo?.hp ?? 0)); cur.lastHp = b.hp; cur.lastBh = bo?.hp ?? 0; cur.lastP = b.potions.health; cur.turns++;
};
for (let s = 1; s <= K; s++) { const p = structuredClone(P0); p.potions.health += Number(E.SIM_BUYPOT); autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); }
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s[(s.length - 1) >> 1]! + s[s.length >> 1]!) / 2 : NaN; };
const r = (x: number) => Math.round(x * 100) / 100;
console.log('d n win% turns hp0 pots0 potUsed takenPerTurn bossMaxHp bossDmgPerTurn adds addMaxHp');
for (const d of [45, 50, 55, 60, 65, 70]) { const g = fs.filter((f) => f.d === d); if (!g.length) continue; console.log(E.SC, d, g.length, Math.round(100 * g.filter((f) => f.b.over === 'win').length / g.length), med(g.map((f) => f.turns + 1)), r(med(g.map((f) => f.hp0))), med(g.map((f) => f.p0)), med(g.map((f) => f.potUsed)), r(med(g.map((f) => f.taken / Math.max(1, f.turns)))), med(g.map((f) => f.bossMax)), Math.round(med(g.map((f) => f.bossDmg / Math.max(1, f.turns)))), med(g.map((f) => f.nAdds)), med(g.map((f) => f.addMax))); }
