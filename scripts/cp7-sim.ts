/** CP7 手感 sim (docs/cp7-feel.md §指標). One school × one seed set → one JSON line; scripts/cp7-report.ts turns the lines into CHECK lines.
 * Per seed: main-tower trips (counter AI, retreat 0.3) until the first F20 clear (max 60), then T=10 abyss trips from the checkpoint
 * (cap d60), then fresh fights like rc9-tune (d1/d2/d3 normal + d5 boss from the first-clear character; d13/d16/d18 normal + d20 boss
 * from the snapshot at best ≥ 15). No character cache (CP7 changes the main tower too).
 * Env: SC=<school> SEED0 CP7=0|1 (default 1) PITY WINHEAL (CP7 knobs) ; Usage: npx tsx scripts/cp7-sim.ts [N=256] [F=4] */
import { readFileSync } from 'node:fs';
import { SIM_AI, autoRun, fight, profsOf, starterKit, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { level, newPlayer, type Player } from '../src/core/player';
import { RULES, abyssOpen, armBattle, battleLocks, encounter, openingOc, runDerived, startAbyss } from '../src/core/run';
import { checkpointStart, emptyRecord, recordTitles, recordTrip, type AbyssSchool } from '../src/core/abyss';
import { RDMG, armCp5, startBattle } from '../src/core/battle';
import { CP7, simPickStart } from '../src/core/cp7';
import { Rng } from '../src/core/rng';
import { CP8 } from '../src/core/cp8';
import { act, type BattleState } from '../src/core/battle';
import { decide, prefBuff, LEAN_ALLOC, LEAN_ROUTE, LEAN_KIT, LEAN_BUFF_FIRST, BULWARK_STYLE, type BuffStrategy } from '../src/core/auto';
import { openOffer, takeBuff } from '../src/core/buffoffer';
import { derive } from '../src/core/player';
const E = process.env;
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = E.CP7 !== '0'; RULES.cp8 = E.CP8 === '1';
for (const k of Object.keys(CP8) as (keyof typeof CP8)[]) if (E[`K8_${k}`] !== undefined) (CP8 as unknown as Record<string, unknown>)[k] = Array.isArray(CP8[k]) ? E[`K8_${k}`]!.split(",").map(Number) : Number(E[`K8_${k}`]);
for (const k of Object.keys(CP7) as (keyof typeof CP7)[]) if (E[`K_${k}`] && typeof CP7[k] === "number") (CP7 as Record<string, unknown>)[k] = Number(E[`K_${k}`]);
for (const l of ['blade', 'oc', 'arcane', 'bulwark'] as const) if (E[`K_ALLOC_${l}`]) { const v = E[`K_ALLOC_${l}`]!.split(',').map(Number); LEAN_ALLOC[l] = Object.fromEntries(['str', 'dex', 'end', 'agi', 'int', 'wis'].map((k, i) => [k, v[i]!])); } // cp8-rc6 Part B tuning
for (const l of ['blade', 'oc', 'arcane', 'bulwark'] as const) if (E[`K_ROUTE_${l}`]) { const [a, b] = E[`K_ROUTE_${l}`]!.split(',').map(Number); LEAN_ROUTE[l] = { restBelow: a!, eliteAbove: b! }; } // cp8 (b) tuning
for (const l of ['blade', 'oc', 'arcane', 'bulwark'] as const) if (E[`K_KIT_${l}`]) { const [b, m] = E[`K_KIT_${l}`]!.split(','); LEAN_KIT[l] = { body: (b || undefined) as 'cloth' | undefined, mana: Number(m || 0) }; } // cp8 (b) tuning
for (const l of ['blade', 'oc', 'arcane', 'bulwark'] as const) if (E[`K_BUFF1_${l}`]) LEAN_BUFF_FIRST[l] = E[`K_BUFF1_${l}`]!.split(','); // cp8 (b) tuning
if (E.K_BW_ARMOR !== undefined) BULWARK_STYLE.armor = (E.K_BW_ARMOR || undefined) as 'heavy' | undefined;
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const N = Number(process.argv[2] ?? 256), F = Number(process.argv[3] ?? 4), T = 10, S0 = Number(E.SEED0 ?? 0), sc = E.SC!;
const strat = `buff:${sc}` as Strategy; const potDeath: [number, number] = [0, 0]; // cp8-rc9 P0-4: [trip deaths, deaths with HP potions left]
const pd = (r: { end?: { why: string; hpPots?: number } }) => { if (r.end?.why === 'dead') { potDeath[0]++; if ((r.end!.hpPots ?? 0) > 0) potDeath[1]++; } }; const clone = <X>(x: X): X => JSON.parse(JSON.stringify(x));
function one(p0: Player, depth: number, type: 'boss' | 'battle', seed: number): boolean {
  const p = clone(p0); const run = startAbyss(p, seed, depth);
  if (type === 'boss') run.tower.floors[0]!.options = ['boss'];
  const ms = encounter(run, pool, type);
  const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run); b.oc += openingOc(p, type, run); armCp5(b, run.pdot);
  fight(b, strat, new Rng(seed * 31 + 7), profsOf(p), 'counter'); return b.over === 'win';
}
/** CP8 P3: first battle of a trip that starts at `depth` (start buffs picked by the school preference, as autoRun does). */
function first21(p0: Player, depth: number, seed: number): boolean {
  const p = clone(p0); const run = startAbyss(p, seed, depth); const prng = new Rng(seed * 13 + 1);
  if (run.startPick) { while (run.offer) { const id = prefBuff(run.offer.ids, strat as BuffStrategy, prng); if (id) takeBuff(p, run, id); else run.offer = null; if (run.offersLeft) { run.offersLeft--; openOffer(p, run, 'boss'); } } run.startPick = false; }
  const type = run.tower.floors[0]!.options.includes('boss') ? 'boss' : 'battle';
  const ms = encounter(run, pool, type);
  const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run); b.oc += openingOc(p, type, run); armCp5(b, run.pdot);
  fight(b, strat, new Rng(seed * 31 + 7), profsOf(p), 'counter'); return b.over === 'win';
}
/** CP8 P5: over a whole fight at `depth`, every turn is replayed once from full HP; counts turns where that full-HP replay dies. */
function oneTurnKills(p0: Player, depth: number, type: 'boss' | 'battle', seed: number): { n: number; k: number; maxHit: number } {
  const p = clone(p0); const run = startAbyss(p, seed, depth); run.startPick = false; run.offer = null;
  if (type === 'boss') run.tower.floors[0]!.options = ['boss'];
  const ms = encounter(run, pool, type);
  const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run); b.oc += openingOc(p, type, run); armCp5(b, run.pdot);
  const rng = new Rng(seed * 31 + 7), profs = profsOf(p); let n = 0, k = 0, maxHit = 0;
  while (!b.over && b.turn < 200) {
    const c = structuredClone(b) as BattleState; c.hp = c.d.hp; const r2 = new Rng(1); r2.state = rng.state;
    act(c, decide(c, strat, 'counter'), r2, profs); n++; if (c.over === 'lose') k++; maxHit = Math.max(maxHit, c.d.hp - c.hp);
    act(b, decide(b, strat, 'counter'), rng, profs);
  }
  return { n, k, maxHit: maxHit / b.d.hp };
}
const p5: { hp: number; d: Record<number, { n: number; k: number; mx: number }> }[] = []; const p3d21 = { n: 0, w: 0 }; const second: number[] = [];
const W = () => ({ w: 0, n: 0 }); const c: Record<string, { w: number; n: number }> = { d1: W(), d2: W(), d3: W(), d5: W(), d10: W(), d10np: W(), d13: W(), d16: W(), d18: W(), d20: W() };
const upgWon: number[] = [], first: number[] = [], firstClear: number[] = [], upgMain: number[] = [], upgAbyss: number[] = [], depthClip: number[] = [];
const rd1: number[] = [], rdAll: number[] = [], rd1raw: number[] = [], rdSt: number[] = [], rdCl: number[] = []; // cp8-rc6: worst monster round / max HP per trip (st ≤ 30)
const reach: Record<number, number> = {}, endAt: Record<number, number> = {};
const p3 = { rest: { n: 0, full: 0 }, none: { n: 0, full: 0 } };
const b10 = { n: 0, w: 0 }; let built = 0, deep = 0, shallow = 0, cpTrips = 0, cpDeadFirst = 0; const zero = { main: 0, mainNoLoot: 0, abyss: 0, abyssNoLoot: 0 };
for (let s = S0 + 1; s <= S0 + N; s++) {
  const p = newPlayer(); starterKit(p, s, (['blade', 'oc', 'arcane', 'bulwark'] as const).find((x) => x === sc)); let ok = false, i = 1;
  // debug only (stderr): kit / heavy-armor timing
  const kitS = (tag: string) => { const b = p.equipped.body, d = derive(p); return `${tag} ${s} ${b ? b.group + ':' + b.base + ':' + b.quality : '-'} hp ${d.hp} pm ${d.physMit.toFixed(3)} mh ${p.equipped.mainHand ? p.equipped.mainHand.group + ':' + p.equipped.mainHand.quality + ':L' + p.equipped.mainHand.level + ':ad' + Math.round(p.equipped.mainHand.stats.attackDamage ?? 0) : '-'} lv ${level(p)}`; }; let heavyAt = p.equipped.body?.group === 'heavy' ? 'kit' : '';
  if (E.DBGKIT) console.error(kitS('K0'));
  // cp8-rc12 diagnosis: SIM_SKILLS_FROM=abyss — the main-story trips run A-only (same F20 clear as SIM_NAIVE_AONLY), skills from the abyss on.
  const skAb = E.SIM_SKILLS_FROM === 'abyss' && E.SIM_NAIVE_AONLY !== '1'; if (skAb) SIM_AI.add.delete('skills');
  for (; i <= 60; i++) { const r = autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3 }); pd(r); if (E.DBGKIT && !heavyAt && p.equipped.body?.group === 'heavy') heavyAt = 'm' + i; upgMain.push(r.upg ?? 0); if (r.kills) upgWon.push(r.upg ?? 0); if (!r.upg) { zero.main++; if (!r.kills) zero.mainNoLoot++; } if (r.settlement.outcome === 'clear') { ok = true; break; } }
  firstClear.push(ok ? i : 99);
  if (skAb) SIM_AI.add.add('skills');
  if (!ok || !abyssOpen(p)) continue; built++;
  for (let f = 1; f <= F; f++) { for (const d of [1, 2, 3]) { c[`d${d}`]!.n++; if (one(p, d, 'battle', s * 100 + f)) c[`d${d}`]!.w++; } c.d5!.n++; if (one(p, 5, 'boss', s * 100 + f)) c.d5!.w++;
    // cp7-rc3: fresh d10 boss with the post-F20 character, and the same with no potions (a player who skipped the shop).
    c.d10!.n++; if (one(p, 10, 'boss', s * 100 + f)) c.d10!.w++; const np = clone(p); np.potions = { health: 0, mana: 0, spirit: 0 }; c.d10np!.n++; if (one(np, 10, 'boss', s * 100 + f)) c.d10np!.w++; }
  const rec = emptyRecord(); let snap: Player | null = null; let snap20: Player | null = null; let last = null as { start: number; cleared: number; dead: boolean } | null;
  for (let t = 1; t <= T; t++) {
    const st: number = RULES.cp7 ? simPickStart(rec.best, last) : checkpointStart(rec.best); // CP7 decision 2 (暫定 AI rule)
    if (st < checkpointStart(rec.best)) shallow++;
    if (E.DBGKIT && t === 1) console.error(kitS('K1') + ' heavyAt ' + (heavyAt || 'none'));
    RDMG.max = 0; RDMG.raw = 0; const r = autoRun(p, pool, s * 1000 + 100 + t, strat, { mode: 'counter', retreat: 0.3, abyss: st, cap: 60, ms: rec.ms }); pd(r);
    const cl = r.abyss!.cleared, dead = r.settlement.outcome === 'dead'; last = { start: st, cleared: cl, dead };
    if (E.DBGKIT && !heavyAt && p.equipped.body?.group === 'heavy') { heavyAt = 'a' + t; console.error('HA', s, t); }
    if (E.DBGST) console.error('ST', st, dead && !r.kills ? 1 : 0, cl - st + 1);
    if (E.DBGW && r.kills && !r.upg) console.error('WON0', s, t, st, cl, r.kills, r.battles, r.settlement.outcome, level(p), Object.values(p.equipped).map((e) => e ? e.slot + ':' + e.quality[0] + e.roll + 'L' + e.level : '').join(' '));
    if (st <= 60 && st > 1) { cpTrips++; if (dead && !r.kills) cpDeadFirst++; }
    if (E.DBGP2 && t <= 2) { const z = r.settlement as { cp8?: { pw0: number; pw1: number; worn: string[] }; lostItems?: unknown[]; kept?: unknown[]; levelBefore?: number; levelAfter?: number }; console.error('P2', JSON.stringify({ s, t, st, cl, dead, pw0: z.cp8?.pw0, pw1: z.cp8?.pw1, worn: z.cp8?.worn.length, lost: z.lostItems?.length ?? 0, kept: z.kept?.length ?? 0, lv0: z.levelBefore, lv1: z.levelAfter, kills: r.kills })); } // cp8-rc2 P2 diagnosis (stderr only)
    if (RULES.cp8 && st <= 30) { rdAll.push(+RDMG.max.toFixed(3)); rdSt.push(st); rdCl.push(cl); if (t === 1) { rd1.push(+RDMG.max.toFixed(3)); rd1raw.push(+RDMG.raw.toFixed(3)); } }
    if (E.DBGRD && st <= 30) console.error('RD', JSON.stringify({ s, t, st, cl, max: +RDMG.max.toFixed(3), av: RDMG.av, hits: RDMG.hits, mh: p.equipped.mainHand?.group, oh: p.equipped.offHand?.group, body: p.equipped.body?.group, lean: p.lean }));
    if (E.DBGLOW && t === 1) console.error('LOW', JSON.stringify({ s, cl, why: r.end?.why, type: r.end?.type, hpPots: r.end?.hpPots, mp: r.end?.mp, mpMax: r.end?.mpMax, mpPots: r.end?.mpPots, hpCd: r.end?.hpCd, mpCd: r.end?.mpCd, hp0: r.end?.hp0, rd: +RDMG.max.toFixed(3), bturns: r.end?.bturns, foes: r.end?.foes.map((f) => f.rank + (f.affixes ? ':' + f.affixes.join('+') : '')), lv: level(p), mh: p.equipped.mainHand ? p.equipped.mainHand.quality + ' L' + p.equipped.mainHand.level : '-', pot0: p.potions.health }));
    if (t === 2) second.push(cl);
    if (t === 1) { first.push(cl); for (const b of r.bosses) if (b.floor === 10) { b10.n++; b10.w += +b.won; } } // cp7-rc3: trip-1 d10 boss
    if (st <= 60) upgAbyss.push(r.upg ?? 0); if (st <= 60 && r.kills) upgWon.push(r.upg ?? 0); // trips starting past the d60 sim cap retreat at once (not a real trip)
    if (st <= 60 && !r.upg) { zero.abyss++; if (!r.kills) { zero.abyssNoLoot++; if (E.DBG && (E.DBG === 'all' || zero.abyssNoLoot < 15)) console.error(st, cl, r.settlement.outcome, r.floorReached, r.battles); } } depthClip.push(Math.min(20, Math.max(10, cl)));
    if (dead) endAt[cl + 1] = (endAt[cl + 1] ?? 0) + 1;
    for (let d = st; d <= cl + (dead ? 1 : 0); d++) reach[d] = (reach[d] ?? 0) + 1;
    if (st <= 13 && cl >= 12) { const k = (r.rests ?? []).some((d) => d >= 13 && d < 20) ? 'rest' : 'none'; p3[k].n++; if (cl >= 20) p3[k].full++; }
    recordTitles(rec, r.abyss!.ms, r.abyss!.titles); recordTrip(rec, cl, r.abyss!.school as AbyssSchool);
    if (!snap && rec.best >= 15) snap = clone(p);
    if (RULES.cp8 && !snap20 && rec.best >= 20) snap20 = clone(p);
  }
  if (RULES.cp8 && snap20) for (let f = 1; f <= F; f++) { p3d21.n++; if (first21(snap20, 21, s * 100 + f)) p3d21.w++; }
  if (RULES.cp8 && E.P5 !== '0') { const row = { hp: derive(p).hp, d: {} as Record<number, { n: number; k: number; mx: number }> };
    for (let d = 1; d <= 30; d++) { const o = oneTurnKills(p, d, d % 5 === 0 ? 'boss' : 'battle', s * 100 + d); row.d[d] = { n: o.n, k: o.k, mx: o.maxHit }; } p5.push(row); }
  if (!snap) continue; deep++;
  for (let f = 1; f <= F; f++) for (const [d, ty] of [[13, 'battle'], [18, 'battle'], [16, 'battle'], [20, 'boss']] as const) { c[`d${d}`]!.n++; if (one(snap, d, ty, s * 100 + f)) c[`d${d}`]!.w++; }
}
const win = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.n ? v.w / v.n : null]));
console.log(JSON.stringify({ sc, S0, N, cp7: RULES.cp7, ...(RULES.cp8 ? { rd1, rdAll, rd1raw, rdSt, rdCl } : {}), knobs: Object.fromEntries(Object.entries(CP7).filter(([, v]) => typeof v === "number")), built, deep, zero, shallow, cpTrips, cpDeadFirst, upgWon, first, firstClear, upgMain, upgAbyss, depthClip, reach, endAt, p3, win, b10, cp8: RULES.cp8, naive: !!E.SIM_AI && E.SIM_AI === 'naive', second, p3d21, p5, potDeath }));
