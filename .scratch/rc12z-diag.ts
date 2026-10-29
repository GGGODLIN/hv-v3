/** rc12z diag（自訂，僅 sim）: boss F45–65 per-turn: who is winding (boss/minion/none) × action (D/Z/Q/W/A), minion alive%, minion hp share. SC=<school> */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, FIGHT_CTX, TURN_HOOK9, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import { windingUp, type BattleState } from '../src/core/battle';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: 'alloc', SIM_BUYPOT: '10', SIM_MERCHTHR: '7', SIM_RETREAT9: '1' })) process.env[k] ??= v;
const E = process.env, K = Number(process.argv[2] ?? 32);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!);
const mix: Record<string, number> = {}; let last: BattleState | null = null, inF = false; let pv = { dt: 0, pot: 0, cd: 0, w: 'none' };
const cdKey = (b: BattleState) => Object.values(b.cooldowns).reduce((t, x) => t + x, 0);
let fights = 0, turns = 0;
TURN_HOOK9.fn = (b) => {
  const fresh = b !== last; last = b;
  if (fresh) { inF = FIGHT_CTX.type === 'boss' && FIGHT_CTX.depth >= 45 && FIGHT_CTX.depth <= 65; if (inF) fights++; }
  else if (inF) { const a = b.defendTurns > pv.dt ? 'D' : b.potions.health < pv.pot ? 'Z' : cdKey(b) > pv.cd ? 'S' : 'A'; const k = pv.w + ':' + a; mix[k] = (mix[k] ?? 0) + 1; turns++; }
  if (!inF) return;
  const wb = b.monsters.some((m) => m.rank === 'boss' && m.hp > 0 && windingUp(m)), wm = b.monsters.some((m) => m.rank !== 'boss' && m.hp > 0 && windingUp(m));
  pv = { dt: b.defendTurns, pot: b.potions.health, cd: cdKey(b), w: wb ? 'boss' : wm ? 'minion' : 'none' };
};
for (let s = 1; s <= K; s++) { const p = structuredClone(P0); p.potions.health += Number(E.SIM_BUYPOT); autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); }
console.log(`DIAG ${E.SC} fights=${fights} turns=${turns} ` + Object.entries(mix).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${(100 * v / turns).toFixed(1)}%`).join(' '));
