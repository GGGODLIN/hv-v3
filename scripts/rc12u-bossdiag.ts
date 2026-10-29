/** rc12u diag（自訂，僅 sim、不改行為）: per-turn boss-fight log via TURN_HOOK9 for SC=<school>, F35–65 (or LO/HI).
 *  Splits each fight's turns into: player-damage turns, zero-damage turns (defend/potion/miss), boss HP healed (phase rise).
 *  Usage: SC=bulwark npx tsx scripts/rc12u-bossdiag.ts [seeds=32] */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, FIGHT_CTX, TURN_HOOK9, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import { windingUp, type BattleState } from '../src/core/battle';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: '1', SIM_BUYPOT: '10', SIM_MERCHTHR: '7', SIM_RETREAT9: '1' })) process.env[k] ??= v;
const E = process.env, K = Number(process.argv[2] ?? 32), LO = Number(E.LO ?? 35), HI = Number(E.HI ?? 65);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!);
type F = { d: number; turns: number; maxHp: number; dmg: number[]; heal: number; pot: number; def: number; zOther: number; zMin: number; adds: number; wind: number; windD: number; hp0: number; pmax: number; adb: number; won?: boolean; type: string };
const nets: number[] = [], npots: number[] = [], potAt: Record<number, number[]> = {}; let nf: { hp0: number; max: number; p0: number; b: BattleState; lastHp: number; lastP: number; dmg: number; used: number } | null = null;
const stepNormal = (b: BattleState) => { if (!nf) return; const used = nf.lastP - b.potions.health; nf.used += used; nf.dmg += Math.max(0, nf.lastHp - b.hp + (used > 0 ? 0 : 0)); nf.lastHp = b.hp; nf.lastP = b.potions.health; };
const closeNormal = () => { if (!nf) return; const b = nf.b; stepNormal(b); if (b.over === 'win') { const end = b.hp, heal = Math.min(nf.max - end, Math.round(nf.max * (0.1 + Number(E.NETHEAL ?? 0.2)))); nets.push((nf.dmg - heal) / nf.max); npots.push(nf.used); } nf = null; };
const fs: F[] = []; let cur: F | null = null; let last: BattleState | null = null; let prev = { bh: 0, pots: 0, dt: 0, w: false, mh: 0 };
const bossOf = (b: BattleState) => b.monsters.find((m) => m.rank === 'boss');
TURN_HOOK9.fn = (b) => {
  if (b !== last) { closeNormal(); if (FIGHT_CTX.type === 'battle' && FIGHT_CTX.depth > 50) nf = { hp0: b.hp, max: b.d.hp, p0: b.potions.health, b, lastHp: b.hp, lastP: b.potions.health, dmg: 0, used: 0 }; if (FIGHT_CTX.depth % 10 === 1) (potAt[FIGHT_CTX.depth - 1] ??= []).push(b.potions.health); last = b; const bo = bossOf(b); cur = bo && FIGHT_CTX.depth >= LO && FIGHT_CTX.depth <= HI ? { d: FIGHT_CTX.depth, turns: 0, maxHp: bo.maxHp, dmg: [], heal: 0, pot: 0, def: 0, zOther: 0, zMin: 0, adds: 0, wind: 0, windD: 0, hp0: b.hp, pmax: b.d.hp, adb: b.d.adb, type: FIGHT_CTX.type } : null; if (cur) fs.push(cur); prev = { bh: bo?.hp ?? 0, pots: b.potions.health, dt: b.defendTurns, w: b.monsters.some(windingUp), mh: b.monsters.filter((m) => m.rank !== 'boss').reduce((t, m) => t + Math.max(0, m.hp), 0) }; return; }
  if (nf && nf.b === b) stepNormal(b);
  if (!cur) return; const bo = bossOf(b)!; const dh = prev.bh - bo.hp; if (dh >= 0) cur.dmg.push(dh); else { cur.dmg.push(0); cur.heal += -dh; } const mh = b.monsters.filter((m) => m.rank !== 'boss').reduce((t, m) => t + Math.max(0, m.hp), 0); if (b.monsters.some((m) => m.rank !== 'boss' && m.hp > 0)) cur.adds++; const zd = b.defendTurns > prev.dt, zp = b.potions.health < prev.pots; cur.pot += prev.pots - b.potions.health; if (zd) cur.def++; else if (!zp && dh <= 0) { cur.zOther++; if (mh < prev.mh) cur.zMin++; } if (prev.w) { cur.wind++; if (zd || zp) cur.windD++; } cur.turns++; prev = { bh: bo.hp, pots: b.potions.health, dt: b.defendTurns, w: b.monsters.some(windingUp), mh };
};
const cl: number[] = [];
for (let s = 1; s <= K; s++) { const p = structuredClone(P0); p.potions.health += Number(E.SIM_BUYPOT); const r = autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); cl.push(r.abyss!.cleared + (r.settlement.outcome === 'dead' ? 1 : 0)); }
closeNormal();
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s[(s.length - 1) >> 1]! + s[s.length >> 1]!) / 2 : NaN; };
const by: Record<number, F[]> = {}; for (const f of fs) if (f.type === 'boss') (by[f.d] ??= []).push(f);
console.log('d\tn\tturnsMed\tbossMaxHpMed\tdmgPerHitTurnMed\tzeroTurn%\tbossHealMed\tpotsMed\tadbMed\tplayerMaxHp\tdefend%\totherZero%\twindTurn%\tD/Z-on-wind%\tzeroHitMinion%\taddsAlive%');
for (const [d, g] of Object.entries(by)) { const all = g.flatMap((f) => f.dmg); console.log([d, g.length, med(g.map((f) => f.turns + 1)), med(g.map((f) => f.maxHp)), med(all.filter((x) => x > 0)), Math.round(100 * all.filter((x) => x === 0).length / Math.max(1, all.length)), med(g.map((f) => f.heal)), med(g.map((f) => f.pot)), med(g.map((f) => Math.round(f.adb))), med(g.map((f) => Math.round(f.pmax))), ...[g.reduce((t,f)=>t+f.def,0), g.reduce((t,f)=>t+f.zOther,0), g.reduce((t,f)=>t+f.wind,0)].map((x)=>Math.round(100*x/Math.max(1,g.reduce((t,f)=>t+f.turns,0)))), Math.round(100*g.reduce((t,f)=>t+f.windD,0)/Math.max(1,g.reduce((t,f)=>t+f.wind,0))), Math.round(100*g.reduce((t,f)=>t+f.zMin,0)/Math.max(1,g.reduce((t,f)=>t+f.turns,0))), Math.round(100*g.reduce((t,f)=>t+f.adds,0)/Math.max(1,g.reduce((t,f)=>t+f.turns,0)))].join('\t')); }
const q = (a: number[], f: number) => [...a].sort((x, y) => x - y)[Math.floor(a.length * f)] ?? NaN;
console.log(`normalNet>F50 n=${nets.length} med=${med(nets).toFixed(3)} p75=${q(nets, 0.75).toFixed(3)} p90=${q(nets, 0.9).toFixed(3)} (maxHP 分數; 蓄力上限 0.30) potsPerNormal=${(npots.reduce((t, x) => t + x, 0) / Math.max(1, npots.length)).toFixed(2)}`);
console.log('potAtDepth ' + Object.entries(potAt).map(([d, a]) => `F${d}:${med(a)}(n${a.length})`).join(' '));
const b3565 = Object.entries(by).filter(([d]) => +d >= 35 && +d <= 65).flatMap(([, g]) => g.map((f) => f.turns + 1));
console.log(`SUMMARY ${E.SC} n=${cl.length} deathMed=${med(cl.filter((x) => x < 100))} floorMed=${med(cl)} f100=${(cl.filter((x) => x >= 100).length / cl.length).toFixed(3)} boss35_65Med=${med(b3565)} p25=${q(b3565, 0.25)} p75=${q(b3565, 0.75)} netMed=${med(nets).toFixed(3)}`);
