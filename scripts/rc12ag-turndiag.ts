/** rc12ag 診斷（自訂，僅 sim）: 一般戰 F[LO..HI] 每回合玩家行為分類（有輸出／防禦／無輸出）與怪物數、怪 HP。 Usage: SC=oc LO=58 HI=76 npx tsx scripts/rc12ag-turndiag.ts [seeds] */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, FIGHT_CTX, ACT_HOOK12AF, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: 'alloc', SIM_BUYPOT: '10', SIM_MERCHTHR: '0', SIM_RETREAT9: '1' })) process.env[k] ??= v;
const E = process.env, K = Number(process.argv[2] ?? 32), LO = Number(E.LO ?? 58), HI = Number(E.HI ?? 76);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!);
const c: Record<string, number> = {}; let dmg = 0, hpSum = 0, n = 0, mons = 0, fights = new Set<unknown>();
ACT_HOOK12AF.fn = (b, ev) => {
  if (FIGHT_CTX.type !== 'battle' || FIGHT_CTX.depth < LO || FIGHT_CTX.depth > HI) return; n++; fights.add(b);
  const out = ev.filter((e) => e.t === 'hit' && e.to !== 'player').reduce((t, e) => t + ((e as { dmg: number }).dmg ?? 0), 0);
  const def = ev.some((e) => e.t === 'heal' && (e as { label?: string }).label === '防禦');
  const k = def ? 'defend' : out > 0 ? 'dmg' : 'zero'; c[k] = (c[k] ?? 0) + 1; dmg += out;
  hpSum += b.monsters.reduce((t, m) => t + m.maxHp, 0); mons += b.monsters.length;
  const ts = [...new Set(ev.map((e) => e.t))].sort().join(','); c['ev:' + ts] = (c['ev:' + ts] ?? 0) + 1;
};
for (let s = 1; s <= K; s++) { const p = structuredClone(P0); p.potions.health += Number(E.SIM_BUYPOT); autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); }
const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12);
console.log(`TD ${E.SC} F${LO}-${HI} fights=${fights.size} turns=${n} perFight=${(n / Math.max(1, fights.size)).toFixed(1)} dmgPerTurn=${(dmg / Math.max(1, n)).toFixed(0)} monsTotalHp=${(hpSum / Math.max(1, n)).toFixed(0)} mons=${(mons / Math.max(1, n)).toFixed(2)}`, JSON.stringify(top));
