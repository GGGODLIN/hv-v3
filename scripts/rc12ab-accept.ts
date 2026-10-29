/** rc12ab 驗收（自訂，僅 sim、不改行為）: per-fight turns/outcome → floorMed, F100, F45–65 王戰中位, F65 王勝率, F50–60 王戰中位, 一般戰 >25 回合比例.
 *  Usage: SC=bulwark npx tsx scripts/rc12ab-accept.ts [seeds=128] */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, FIGHT_CTX, TURN_HOOK9, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, ELITE_POT12AA } from '../src/core/run';
import type { BattleState } from '../src/core/battle';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: 'alloc', SIM_BUYPOT: '10', SIM_MERCHTHR: '7', SIM_RETREAT9: '1' })) process.env[k] ??= v;
const E = process.env, K = Number(process.argv[2] ?? 128);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!);
type F = { d: number; type: string; turns: number; b: BattleState; p0: number; maxHit: number; lastHp: number };
const fs: F[] = []; let cur: F | null = null;
TURN_HOOK9.fn = (b) => {
  if (!cur || cur.b !== b) { cur = { d: FIGHT_CTX.depth, type: FIGHT_CTX.type, turns: 0, b, p0: b.potions.health, maxHit: 0, lastHp: b.hp }; fs.push(cur); return; }
  cur.turns++; cur.maxHit = Math.max(cur.maxHit, (cur.lastHp - b.hp) / b.d.hp); cur.lastHp = b.hp;
};
const cl: number[] = [];
for (let s = 1; s <= K; s++) { const p = structuredClone(P0); p.potions.health += Number(E.SIM_BUYPOT); const r = autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); cl.push(r.abyss!.cleared + (r.settlement.outcome === 'dead' ? 1 : 0)); }
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s[(s.length - 1) >> 1]! + s[s.length >> 1]!) / 2 : NaN; };
const boss = (lo: number, hi: number) => fs.filter((f) => f.type === 'boss' && f.d >= lo && f.d <= hi);
const t = (a: F[]) => a.map((f) => f.turns + 1);
const won = (a: F[]) => a.filter((f) => f.b.over === 'win').length;
const f65 = boss(65, 65), nor = fs.filter((f) => f.type !== 'boss'), long = nor.filter((f) => f.turns + 1 > 25);
const deadAt = (lo: number) => fs.filter((f) => f.d >= lo && f.b.over !== 'win');
const b70 = boss(70, 100), cnt = (a: F[]) => a.length;
console.log(`ACCEPT ${E.SC} n=${cl.length} floorMed=${med(cl)} f100=${(100 * cl.filter((x) => x >= 100).length / cl.length).toFixed(1)}% boss45_65Med=${med(t(boss(45, 65)))} boss50_60Med=${med(t(boss(50, 60)))} boss60Med=${med(t(boss(60, 60)))} boss70Med=${med(t(b70))}(n=${cnt(b70)}) f65Win=${(100 * won(f65) / Math.max(1, f65.length)).toFixed(0)}% normalDeaths=${nor.filter((f) => f.b.over !== 'win').length} eliteDrop=${ELITE_POT12AA.drop}/${ELITE_POT12AA.n}=${(100 * ELITE_POT12AA.drop / Math.max(1, ELITE_POT12AA.n)).toFixed(1)}%`);
// rc12ab（自訂）: 死亡前最大連續吃蓄力一擊回合數、F45+ 王戰中位、各類型死亡
const lost = fs.filter((f) => f.b.over === 'lose');
const runs = lost.map((f) => f.b.chgRunMax12ab ?? 0);
console.log(`AB ${E.SC} boss45upMed=${med(t(boss(45, 100)))}(n=${boss(45, 100).length}) deaths=${lost.length} deathTypes=${JSON.stringify(lost.reduce((o, f) => ({ ...o, [f.type]: (o[f.type] ?? 0) + 1 }), {} as Record<string, number>))} maxChgRunBeforeDeath=${Math.max(0, ...runs)} deathsChgRun3=${runs.filter((r) => r >= 3).length} allFightsMaxChgRun=${Math.max(0, ...fs.map((f) => f.b.chgRunMax12ab ?? 0))}`);
// rc12ad（自訂）: 一般戰（type battle）回合中位 / p90 / >20 回合比例
{ const nb = fs.filter((f) => f.type === 'battle').map((f) => f.turns + 1).sort((x, y) => x - y), q = (p: number) => nb[Math.min(nb.length - 1, Math.floor(p * nb.length))];
  const nb45 = fs.filter((f) => f.type === 'battle' && f.d >= 45).map((f) => f.turns + 1).sort((x, y) => x - y);
  console.log(`NRM ${E.SC} n=${nb.length} med=${med(nb)} p90=${q(0.9)} gt20=${(100 * nb.filter((x) => x > 20).length / Math.max(1, nb.length)).toFixed(1)}% f45med=${med(nb45)} f45p90=${nb45[Math.floor(0.9 * nb45.length)]}`); }
// rc12ae（自訂，僅 sim 診斷）: 一般戰回合中位／p90／場數，依樓層帶分組（排除「樣本移往深樓層」的影響）
{ const band = (lo: number, hi: number) => { const a = fs.filter((f) => f.type === 'battle' && f.d >= lo && f.d <= hi).map((f) => f.turns + 1).sort((x, y) => x - y); return `F${lo}-${hi}:${a.length ? `${a[(a.length - 1) >> 1]}/${a[Math.floor(0.9 * a.length)]}(n=${a.length})` : '-'}`; };
  console.log(`BAND ${E.SC} ${[[1, 29], [30, 44], [45, 59], [60, 74], [75, 89], [90, 100]].map(([a, b]) => band(a!, b!)).join(' ')}`); }
// rc12af（自訂，僅 sim 診斷）: F45+ 王戰 p90／最大／>30 回合場數
{ const a = t(boss(45, 100)).sort((x, y) => x - y);
  console.log(`AF ${E.SC} boss45upMed=${med(a)} boss45upP90=${a[Math.floor(0.9 * a.length)]} boss45upMax=${a[a.length - 1]} boss45upGt30=${a.filter((x) => x > 30).length}/${a.length}`); }
