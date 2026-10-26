/** rc7 item 1: d16 wall breakdown (sim only, UI-only AI). Characters = same as rc6-targets (record best ≥15).
 * For each school and depth 13/16/18 (normal 'battle' fights, full HP): monsters, level, HP, adb, abyssMult, affixes, theme key,
 * win rate, and damage taken per turn by source. Usage: npx tsx scripts/rc7-d16-breakdown.ts [N=16] [F=4] */
import { readFileSync } from 'node:fs';
import { autoRun, decide, profsOf, starterKit, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, type Player } from '../src/core/player';
import { RULES, abyssOpen, armBattle, battleLocks, encounter, openingOc, runDerived, startAbyss, abyssLevel } from '../src/core/run';
import { abyssMult, abyssPl, abyssTier, checkpointStart, diffAt, emptyRecord, recordTitles, recordTrip, themeKey, type AbyssSchool } from '../src/core/abyss';
import { act, armCp5, startBattle } from '../src/core/battle';
import { Rng } from '../src/core/rng';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true;
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const N = Number(process.argv[2] ?? 16), F = Number(process.argv[3] ?? 4), DEPTHS = [13, 16, 18];
const clone = <X>(x: X): X => JSON.parse(JSON.stringify(x));
type Acc = Record<string, number>;
const add = (a: Acc, k: string, v: number) => { a[k] = (a[k] ?? 0) + v; };
function one(p0: Player, strat: Strategy, depth: number, seed: number, a: Acc) {
  const p = clone(p0); const run = startAbyss(p, seed, depth);
  const ms = encounter(run, pool, 'battle');
  const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run); b.oc += openingOc(p, 'battle', run); armCp5(b, run.pdot);
  add(a, 'n', 1); add(a, 'mons', ms.length); add(a, 'plv', run.plv ?? 0); add(a, 'mlv', ms.reduce((x, m) => x + (m.level ?? 0), 0) / ms.length);
  add(a, 'mhp', ms.reduce((x, m) => x + m.maxHp, 0)); add(a, 'adb', ms.reduce((x, m) => x + m.adb, 0)); add(a, 'php', b.d.hp);
  add(a, 'affixed', ms.filter((m) => (m as { affixes?: string[] }).affixes?.length).length); add(a, 'elite', ms.filter((m) => m.rank !== 'normal').length);
  add(a, 'physMit', ms.reduce((x, m) => x + m.physMit, 0) / ms.length); add(a, 'evade', ms.reduce((x, m) => x + m.evade + m.parry, 0) / ms.length);
  const rng = new Rng(seed * 31 + 7), profs = profsOf(p);
  while (!b.over && b.turn < 400) {
    const h0 = b.hp; const ev = act(b, decide(b, strat, 'counter'), rng, profs) as { t: string; to?: unknown; dmg?: number; label?: string; element?: string; kind?: string }[];
    let known = 0;
    for (const e of ev) {
      if (e.t === 'hit' && e.to === 'player') { const k = e.label ? `skill:${e.label}` : e.element ? 'elemHit' : 'normalHit'; add(a, k, e.dmg ?? 0); known += e.dmg ?? 0; add(a, 'swings', 1); if (!e.dmg) add(a, 'avoided', 1); }
      if (e.t === 'pdot') { add(a, `dot:${e.kind}`, e.dmg ?? 0); known += e.dmg ?? 0; }
    }
    const lost = Math.max(0, h0 - b.hp); add(a, 'lostNet', lost);
  }
  add(a, 'turns', b.turn); if (b.over === 'win') add(a, 'win', 1);
  if (b.over !== 'win') add(a, 'loseTurns', b.turn);
}
for (const sc of ['blade', 'oc', 'arcane', 'bulwark']) {
  const strat = `buff:${sc}` as Strategy; const acc: Record<number, Acc> = {}; let deep = 0;
  for (let s = 1; s <= N; s++) {
    const p = newPlayer(); starterKit(p, s); let ok = false;
    for (let i = 1; i <= 60; i++) if (autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3 }).settlement.outcome === 'clear') { ok = true; break; }
    if (!ok || !abyssOpen(p)) continue;
    const rec = emptyRecord();
    for (let t = 1; t <= 10 && rec.best < 15; t++) { const r = autoRun(p, pool, s * 1000 + 100 + t, strat, { mode: 'counter', retreat: 0.3, abyss: checkpointStart(rec.best), cap: 60, ms: rec.ms });
      recordTitles(rec, r.abyss!.ms, r.abyss!.titles); recordTrip(rec, r.abyss!.cleared, r.abyss!.school as AbyssSchool); }
    if (rec.best < 15) continue; deep++;
    for (const d of DEPTHS) for (let f = 1; f <= F; f++) one(p, strat, d, s * 100 + f, (acc[d] ??= {}));
  }
  console.log(`== ${sc} chars ${deep}/${N}`);
  for (const d of DEPTHS) { const a = acc[d]; if (!a) continue; const n = a.n!, T = a.turns!;
    const srcs = Object.keys(a).filter((k) => /Hit|skill:|dot:/.test(k)).map((k) => `${k} ${(a[k]! / T).toFixed(1)}`).join(', ');
    const m = abyssMult(d);
    console.log(`d${d} tier ${abyssTier(d)} theme F${themeKey(d)} pl ${abyssPl(d)} diff hp ${diffAt(d, 'hp').toFixed(2)} dmg ${diffAt(d, 'dmg').toFixed(2)} mult hp ${m.hp.toFixed(3)} dmg ${m.dmg.toFixed(3)}`
      + ` | win ${Math.round((100 * (a.win ?? 0)) / n)}% n=${n} turns ${(T / n).toFixed(1)} | mons ${(a.mons! / n).toFixed(2)} elite ${(a.elite ?? 0) / n} affixed ${((a.affixed ?? 0) / n).toFixed(2)}`
      + ` | plv ${(a.plv! / n).toFixed(1)} mLv ${(a.mlv! / n).toFixed(1)} monHP(sum) ${Math.round(a.mhp! / n)} adb(sum) ${(a.adb! / n).toFixed(1)} pHP ${Math.round(a.php! / n)} mPhysMit ${(a.physMit! / n).toFixed(3)} mEva+Par ${(a.evade! / n).toFixed(3)}`
      + ` | dmg/turn net ${(a.lostNet! / T).toFixed(1)}: ${srcs} | avoided ${Math.round((100 * (a.avoided ?? 0)) / (a.swings ?? 1))}%`); }
}
