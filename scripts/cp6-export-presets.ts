/** CP6 rc3 debug presets, exported from the abyss sim (same seeds/loop as scripts/cp6-abyss-sim.ts, seeds 1..64, counter AI).
 * postF20-<school> (rc9): among first-F20-clear characters whose gear follows the school rule (blade 2H no shield; oc 1H, shield
 *   optional; arcane staff; bulwark 1H + shield), the one closest to the school's sim median in both fresh d1 normal-fight win rate
 *   (K=50 fights, counter AI, same path as rc9-tune) and total potions: score = |d1 − med|/0.1 + |pot − med|/max(1, med); ties → closest to median power.
 * abyss10 (rc5): same as abyss15 at best >= 10; record best = 10, so entry is d11 and d15 is reachable.
 * abyss15 (rc11): among characters at the moment their record best first reaches >= 15 (four schools) whose level >= the abyss10 preset's
 *   level, the one closest to the at15 median in d1 normal-fight win rate and total potions (same score as postF20); record best = 15.
 *   (rc3..rc10 used plain power median, which picked a Lv14 / 0-potion oc character below abyss10's Lv16.)
 * abyss20 (cp7, playtest #3): a character snapshotted at the START of an abyss trip that began at d16 (record best 15) and in the sim
 *   went on to clear d20 (the d20 boss). Among rule-compliant ones, closest to the median power; record best = 15 → entry d16. Lets a
 *   playtester reach and verify d20 (abyss15's Lv17 blade dies at d18 in playtests).
 * Usage: npx tsx scripts/cp6-export-presets.ts > public/data/cp6-presets.json   (do not hand-edit the output). */
import { readFileSync } from 'node:fs';
import { autoRun, starterKit, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, derive, powerScore, level, type Player } from '../src/core/player';
import { RULES, abyssOpen, armBattle, battleLocks, encounter, openingOc, runDerived, startAbyss } from '../src/core/run';
import { fight, profsOf } from '../src/core/auto';
import { armCp5, startBattle } from '../src/core/battle';
import { Rng } from '../src/core/rng';
import { checkpointStart, emptyRecord, recordTitles, recordTrip, type AbyssRecord, type AbyssSchool } from '../src/core/abyss';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true;
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const N = 64, T = 10;
type Snap = { seed: number; school: string; level: number; power: number; player: Player; record: AbyssRecord; d1?: number; pot?: number };
const K = 50;
function d1win(p0: Player, strat: Strategy): number { let w = 0; for (let k = 1; k <= K; k++) { const p = clone(p0); const run = startAbyss(p, 9000 + k, 1);
  const ms = encounter(run, pool, 'battle'); const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run); b.oc += openingOc(p, 'battle', run); armCp5(b, run.pdot); fight(b, strat, new Rng((9000 + k) * 31 + 7), profsOf(p), 'counter'); w += +(b.over === 'win'); } return w / K; }
const pots = (p: Player) => p.potions.health + p.potions.mana + p.potions.spirit;
const ruleOk = (sc: string, p: Player): boolean => { const m = p.equipped.mainHand?.group, o = p.equipped.offHand?.group;
  if (sc === 'blade') return m === 'twoHand'; if (sc === 'arcane') return m === 'staff'; if (sc === 'bulwark') return m === 'oneHand' && o === 'shield'; return m === 'oneHand'; };
const mid = (a: number[]) => { const x = [...a].sort((u, v) => u - v); return x[Math.floor(x.length / 2)]!; };
export const sumMed: Record<string, { d1: number; pot: number; n: number; ok: number; lv: number; hp: number; mp: number }> = {};
const clone = <X>(x: X): X => JSON.parse(JSON.stringify(x));
const med = (a: Snap[]) => [...a].sort((x, y) => x.power - y.power || x.seed - y.seed)[Math.floor((a.length - 1) / 2)]!;
const out: Record<string, Snap & { note: string }> = {}; const at15: Snap[] = [], at10: Snap[] = [], d20: Snap[] = [];
const capRec = (rec: AbyssRecord, n: number): AbyssRecord => { const rr = clone(rec); rr.best = n; for (const v of Object.values(rr.bySchool)) if (v) v.best = Math.min(v.best, n); return rr; };
for (const sc of ['blade', 'oc', 'arcane', 'bulwark']) {
  const strat = `buff:${sc}` as Strategy; const snaps: Snap[] = [];
  for (let s = 1; s <= N; s++) {
    const p = newPlayer(); starterKit(p, s);
    let i = 0, ok = false;
    for (; i < 60;) { i++; if (autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3 }).settlement.outcome === 'clear') { ok = true; break; } }
    if (!ok || !abyssOpen(p)) continue;
    snaps.push({ seed: s, school: sc, level: level(p), power: powerScore(derive(p)), player: clone(p), record: emptyRecord(), d1: d1win(p, strat), pot: pots(p) });
    const rec = emptyRecord();
    for (let t = 1; t <= T; t++) {
      const pre = checkpointStart(rec.best) === 16 ? { player: clone(p), record: capRec(rec, 15) } : null;
      const r = autoRun(p, pool, s * 1000 + 100 + t, strat, { mode: 'counter', retreat: 0.3, abyss: checkpointStart(rec.best), cap: 60, ms: rec.ms });
      recordTitles(rec, r.abyss!.ms, r.abyss!.titles);
      if (pre && r.abyss!.cleared >= 20) d20.push({ seed: s, school: sc, level: level(pre.player), power: powerScore(derive(pre.player)), player: pre.player, record: pre.record });
      const was = rec.best; recordTrip(rec, r.abyss!.cleared, r.abyss!.school as AbyssSchool);
      if (was < 10 && rec.best >= 10) at10.push({ seed: s, school: sc, level: level(p), power: powerScore(derive(p)), player: clone(p), record: capRec(rec, 10) });
      if (was < 15 && rec.best >= 15) { const rr = clone(rec); rr.best = 15; for (const v of Object.values(rr.bySchool)) if (v) v.best = Math.min(v.best, 15); at15.push({ seed: s, school: sc, level: level(p), power: powerScore(derive(p)), player: clone(p), record: rr }); }
    }
  }
  const md = mid(snaps.map((x) => x.d1!)), mp = mid(snaps.map((x) => x.pot!)); const okS = snaps.filter((x) => ruleOk(sc, x.player));
  const sco = (x: Snap) => Math.abs(x.d1! - md) / 0.1 + Math.abs(x.pot! - mp) / Math.max(1, mp);
  const pw = mid(snaps.map((x) => x.power)); const m = [...okS].sort((a, b) => sco(a) - sco(b) || Math.abs(a.power - pw) - Math.abs(b.power - pw) || a.seed - b.seed)[0]!; const dv = snaps.map((x) => runDerived(x.player, startAbyss(clone(x.player), 1, 1)));
  sumMed[sc] = { d1: md, pot: mp, n: snaps.length, ok: okS.length, lv: mid(snaps.map((x) => x.level)), hp: mid(dv.map((x) => x.hp)), mp: mid(dv.map((x) => x.mp)) };
  out[`postF20-${sc}`] = { ...m, note: `closest to sim median d1 win ${(md * 100).toFixed(0)}% / potions ${mp} among ${okS.length} rule-compliant of ${snaps.length} first-F20 clears (buff:${sc}, seeds 1..${N})` };
}
const m10 = med(at10); out.abyss10 = { ...m10, note: `median power of ${at10.length} characters when best first reached >=10 (four schools, seeds 1..${N}, ${T} trips)` };
for (const x of at15) { x.d1 = d1win(x.player, `buff:${x.school}` as Strategy); x.pot = pots(x.player); }
const md15 = mid(at15.map((x) => x.d1!)), mp15 = mid(at15.map((x) => x.pot!)), pw15 = mid(at15.map((x) => x.power));
const el15 = at15.filter((x) => x.level >= m10.level && ruleOk(x.school, x.player));
const sco15 = (x: Snap) => Math.abs(x.d1! - md15) / 0.1 + Math.abs(x.pot! - mp15) / Math.max(1, mp15);
const m = [...el15].sort((a, b) => sco15(a) - sco15(b) || Math.abs(a.power - pw15) - Math.abs(b.power - pw15) || a.seed - b.seed)[0]!;
sumMed.abyss15 = { d1: md15, pot: mp15, n: at15.length, ok: el15.length, lv: mid(at15.map((x) => x.level)), hp: 0, mp: 0 };
out.abyss15 = { ...m, note: `closest to at15 median d1 win ${(md15 * 100).toFixed(0)}% / potions ${mp15} among ${el15.length} rule-compliant Lv>=${m10.level} of ${at15.length} characters when best first reached >=15 (four schools, seeds 1..${N}, ${T} trips)` };
const d20ok = d20.filter((x) => ruleOk(x.school, x.player)); const pw20 = mid(d20ok.map((x) => x.power));
const m20 = [...d20ok].sort((a, b) => Math.abs(a.power - pw20) - Math.abs(b.power - pw20) || a.seed - b.seed)[0]!;
out.abyss20 = { ...m20, note: `median power of ${d20ok.length} rule-compliant characters (of ${d20.length}) whose sim trip from d16 (best 15) cleared d20 (four schools, seeds 1..${N}, ${T} trips)` };
process.stdout.write(JSON.stringify(out) + '\n');
for (const [k, v] of Object.entries(out)) { const sc = v.school; const d = runDerived(v.player, startAbyss(clone(v.player), 1, 1)); console.error(k, 'seed', v.seed, 'Lv', v.level, 'HP', d.hp, 'MP', d.mp, 'potions', JSON.stringify(v.player.potions), 'd1', v.d1 ?? d1win(v.player, `buff:${sc}` as Strategy), 'main', v.player.equipped.mainHand?.group, 'off', v.player.equipped.offHand?.group ?? '-', 'rule', ruleOk(sc, v.player), '|', v.note); }
console.error('sim medians', JSON.stringify(sumMed));
