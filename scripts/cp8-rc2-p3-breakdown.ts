/** cp8-rc2 P3: monster-strength breakdown at d16/18/20/21/22/24, same method as rc7-d16-breakdown.ts, with the P3 character
 * (cp7-sim snapshot at record best ≥ 20, cp7+cp8 on) and the P3 fight (first battle of a trip that starts at `depth`, start buffs
 * picked by school preference). Usage: SEED0=0 npx tsx scripts/cp8-rc2-p3-breakdown.ts [N=32] [F=4] */
import { readFileSync } from 'node:fs';
import { autoRun, decide, prefBuff, profsOf, starterKit, type BuffStrategy, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, type Player } from '../src/core/player';
import { RULES, abyssOpen, armBattle, battleLocks, encounter, openingOc, runDerived, startAbyss } from '../src/core/run';
import { abyssMult, abyssPl, abyssTier, checkpointStart, diffAt, emptyRecord, recordTitles, recordTrip, type AbyssSchool } from '../src/core/abyss';
import { act, armCp5, startBattle } from '../src/core/battle';
import { simPickStart } from '../src/core/cp7';
import { openOffer, takeBuff } from '../src/core/buffoffer';
import { Rng } from '../src/core/rng';
const E = process.env;
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = E.CP8 !== '0';
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const N = Number(process.argv[2] ?? 32), F = Number(process.argv[3] ?? 4), S0 = Number(E.SEED0 ?? 0);
const DEPTHS = (E.DEPTHS ?? '16,18,20,21,22,24').split(',').map(Number);
const clone = <X>(x: X): X => JSON.parse(JSON.stringify(x));
type Acc = Record<string, number>; const add = (a: Acc, k: string, v: number) => { a[k] = (a[k] ?? 0) + v; };
function one(p0: Player, strat: Strategy, depth: number, seed: number, a: Acc) {
  const p = clone(p0); const run = startAbyss(p, seed, depth); const prng = new Rng(seed * 13 + 1); let nb = 0;
  if (run.startPick) { while (run.offer) { const id = prefBuff(run.offer.ids, strat as BuffStrategy, prng); if (id) { takeBuff(p, run, id); nb++; } else run.offer = null; if (run.offersLeft) { run.offersLeft--; openOffer(p, run, 'boss'); } } run.startPick = false; }
  const type = run.tower.floors[0]!.options.includes('boss') ? 'boss' : 'battle';
  const ms = encounter(run, pool, type);
  const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run); b.oc += openingOc(p, type, run); armCp5(b, run.pdot);
  add(a, 'n', 1); add(a, 'buffs', nb); add(a, 'boss', type === 'boss' ? 1 : 0); add(a, 'mons', ms.length);
  add(a, 'mhp', ms.reduce((x, m) => x + m.maxHp, 0)); add(a, 'adb', ms.reduce((x, m) => x + m.adb, 0)); add(a, 'php', b.d.hp);
  add(a, 'aff', ms.reduce((x, m) => x + ((m as { affixes?: string[] }).affixes?.length ?? 0), 0)); add(a, 'elite', ms.filter((m) => m.rank !== 'normal').length);
  const rng = new Rng(seed * 31 + 7), profs = profsOf(p);
  while (!b.over && b.turn < 400) {
    const h0 = b.hp; const ev = act(b, decide(b, strat, 'counter'), rng, profs) as { t: string; to?: unknown; dmg?: number; label?: string; element?: string; kind?: string }[];
    for (const e of ev) {
      if (e.t === 'hit' && e.to === 'player') { add(a, e.label ? 'skill' : e.element ? 'elem' : 'normal', e.dmg ?? 0); add(a, 'swings', 1); if (!e.dmg) add(a, 'avoided', 1); }
      if (e.t === 'pdot') add(a, 'dot', e.dmg ?? 0);
    }
    add(a, 'lost', Math.max(0, h0 - b.hp));
  }
  add(a, 'turns', b.turn); if (b.over === 'win') add(a, 'win', 1);
}
const out: Record<string, Record<number, Acc>> = {}; const all: Record<number, Acc> = {};
for (const sc of ['blade', 'oc', 'arcane', 'bulwark']) {
  const strat = `buff:${sc}` as Strategy; const acc: Record<number, Acc> = (out[sc] = {}); let deep = 0;
  for (let s = S0 + 1; s <= S0 + N; s++) {
    const p = newPlayer(); starterKit(p, s); let ok = false;
    for (let i = 1; i <= 60; i++) if (autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3 }).settlement.outcome === 'clear') { ok = true; break; }
    if (!ok || !abyssOpen(p)) continue;
    const rec = emptyRecord(); let last = null as { start: number; cleared: number; dead: boolean } | null; let snap20: Player | null = null;
    for (let t = 1; t <= 10; t++) { const st = simPickStart(rec.best, last);
      const r = autoRun(p, pool, s * 1000 + 100 + t, strat, { mode: 'counter', retreat: 0.3, abyss: st, cap: 60, ms: rec.ms });
      last = { start: st, cleared: r.abyss!.cleared, dead: r.settlement.outcome === 'dead' };
      recordTitles(rec, r.abyss!.ms, r.abyss!.titles); recordTrip(rec, r.abyss!.cleared, r.abyss!.school as AbyssSchool);
      if (!snap20 && rec.best >= 20) snap20 = clone(p); }
    if (!snap20) continue; deep++;
    for (const d of DEPTHS) for (let f = 1; f <= F; f++) { one(snap20, strat, d, s * 100 + f, (acc[d] ??= {})); one(snap20, strat, d, s * 100 + f, (all[d] ??= {})); }
  }
  console.log(`== ${sc} chars ${deep}/${N}`);
}
const line = (lab: string, a: Acc | undefined, d: number) => { if (!a) return; const n = a.n!, T = a.turns!, m = abyssMult(d);
  console.log(`${lab} d${d} tier ${abyssTier(d)} pl ${abyssPl(d)} diff hp ${diffAt(d, 'hp', 3).toFixed(2)} dmg ${diffAt(d, 'dmg', 3).toFixed(2)} mult hp ${m.hp.toFixed(3)} dmg ${m.dmg.toFixed(3)}`
    + ` | win ${((100 * (a.win ?? 0)) / n).toFixed(1)}% n=${n} buffs ${(a.buffs! / n).toFixed(1)} boss ${((a.boss ?? 0) / n).toFixed(2)} turns ${(T / n).toFixed(1)} | mons ${(a.mons! / n).toFixed(2)} elite ${((a.elite ?? 0) / n).toFixed(2)} affix ${((a.aff ?? 0) / n).toFixed(2)}`
    + ` | monHP ${Math.round(a.mhp! / n)} adb ${(a.adb! / n).toFixed(1)} pHP ${Math.round(a.php! / n)} | dmg/turn ${(a.lost! / T).toFixed(1)} (normal ${((a.normal ?? 0) / T).toFixed(1)} elem ${((a.elem ?? 0) / T).toFixed(1)} skill ${((a.skill ?? 0) / T).toFixed(1)} dot ${((a.dot ?? 0) / T).toFixed(1)}) avoided ${Math.round((100 * (a.avoided ?? 0)) / (a.swings ?? 1))}%`); };
for (const sc of Object.keys(out)) for (const d of DEPTHS) line(sc, out[sc]![d], d);
for (const d of DEPTHS) line('ALL', all[d], d);
