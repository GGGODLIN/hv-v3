// rc12aa 診斷（自訂，僅 sim）: F70+ 首領戰回合組成
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, FIGHT_CTX, TURN_HOOK9, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import type { BattleState } from '../src/core/battle';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: 'alloc', SIM_BUYPOT: '10', SIM_MERCHTHR: '7', SIM_RETREAT9: '1' })) process.env[k] ??= v;
const E = process.env, K = Number(process.argv[2] ?? 64), LO = Number(E.LO ?? 70), HI = Number(E.HI ?? 100);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!);
type F = { b: BattleState; t: number; bossHit: number; addHit: number; none: number; bh: number; ah: number; pot: number; p: number; bmax: number; amax: number; nAdd: number; healB: number };
const fs: F[] = []; let cur: F | null = null;
const bossHp = (b: BattleState) => b.monsters.filter((m) => m.rank === 'boss').reduce((a, m) => a + Math.max(0, m.hp), 0);
const addHp = (b: BattleState) => b.monsters.filter((m) => m.rank !== 'boss').reduce((a, m) => a + Math.max(0, m.hp), 0);
TURN_HOOK9.fn = (b) => {
  if (FIGHT_CTX.type !== 'boss' || FIGHT_CTX.depth < LO || FIGHT_CTX.depth > HI) { cur = null; return; }
  if (!cur || cur.b !== b) { cur = { b, t: 0, bossHit: 0, addHit: 0, none: 0, bh: bossHp(b), ah: addHp(b), pot: 0, p: b.potions.health, bmax: bossHp(b), amax: addHp(b), nAdd: b.monsters.length - 1, healB: 0 }; fs.push(cur); return; }
  const bh = bossHp(b), ah = addHp(b); cur.t++;
  if (bh < cur.bh) cur.bossHit++; else if (ah < cur.ah) cur.addHit++; else cur.none++;
  if (bh > cur.bh) cur.healB++;
  if (b.potions.health < cur.p) cur.pot++;
  cur.bh = bh; cur.ah = ah; cur.p = b.potions.health;
};
for (let s = 1; s <= K; s++) { const p = structuredClone(P0); p.potions.health += Number(E.SIM_BUYPOT); autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); }
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1]! : NaN; };
const m = (k: (f: F) => number) => med(fs.map(k));
console.log(`B70 ${E.SC} n=${fs.length} turns=${m((f) => f.t + 1)} bossHitT=${m((f) => f.bossHit)} addHitT=${m((f) => f.addHit)} noDmgT=${m((f) => f.none)} potT=${m((f) => f.pot)} bossHealT=${m((f) => f.healB)} bossHp=${m((f) => f.bmax)} addHp=${m((f) => f.amax)} nAdd=${m((f) => f.nAdd)} win=${fs.filter((f) => f.b.over === 'win').length}`);
