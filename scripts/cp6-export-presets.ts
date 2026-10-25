/** CP6 rc3 debug presets, exported from the abyss sim (same seeds/loop as scripts/cp6-abyss-sim.ts, seeds 1..64, counter AI).
 * postF20-<school>: the seed whose character is the power-median at its first F20 clear (abyss unlocked, record empty).
 * abyss15: the power-median character (across the four schools) at the moment its record best first reaches >= 15; record best = 15.
 * Usage: npx tsx scripts/cp6-export-presets.ts > public/data/cp6-presets.json   (do not hand-edit the output). */
import { readFileSync } from 'node:fs';
import { autoRun, starterKit, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, derive, powerScore, level, type Player } from '../src/core/player';
import { RULES, abyssOpen } from '../src/core/run';
import { checkpointStart, emptyRecord, recordTitles, recordTrip, type AbyssRecord, type AbyssSchool } from '../src/core/abyss';
RULES.cp6Abyss = true;
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const N = 64, T = 10;
type Snap = { seed: number; school: string; level: number; power: number; player: Player; record: AbyssRecord };
const clone = <X>(x: X): X => JSON.parse(JSON.stringify(x));
const med = (a: Snap[]) => [...a].sort((x, y) => x.power - y.power || x.seed - y.seed)[Math.floor((a.length - 1) / 2)]!;
const out: Record<string, Snap & { note: string }> = {}; const at15: Snap[] = [];
for (const sc of ['blade', 'oc', 'arcane', 'bulwark']) {
  const strat = `buff:${sc}` as Strategy; const snaps: Snap[] = [];
  for (let s = 1; s <= N; s++) {
    const p = newPlayer(); starterKit(p, s);
    let i = 0, ok = false;
    for (; i < 60;) { i++; if (autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', retreat: 0.3 }).settlement.outcome === 'clear') { ok = true; break; } }
    if (!ok || !abyssOpen(p)) continue;
    snaps.push({ seed: s, school: sc, level: level(p), power: powerScore(derive(p)), player: clone(p), record: emptyRecord() });
    const rec = emptyRecord();
    for (let t = 1; t <= T; t++) {
      const r = autoRun(p, pool, s * 1000 + 100 + t, strat, { mode: 'counter', retreat: 0.3, abyss: checkpointStart(rec.best), cap: 60, ms: rec.ms });
      recordTitles(rec, r.abyss!.ms, r.abyss!.titles);
      const was = rec.best; recordTrip(rec, r.abyss!.cleared, r.abyss!.school as AbyssSchool);
      if (was < 15 && rec.best >= 15) { const rr = clone(rec); rr.best = 15; for (const v of Object.values(rr.bySchool)) if (v) v.best = Math.min(v.best, 15); at15.push({ seed: s, school: sc, level: level(p), power: powerScore(derive(p)), player: clone(p), record: rr }); }
    }
  }
  const m = med(snaps); out[`postF20-${sc}`] = { ...m, note: `median power of ${snaps.length} first-F20 clears (buff:${sc}, seeds 1..${N})` };
}
const m = med(at15); out.abyss15 = { ...m, note: `median power of ${at15.length} characters when best first reached >=15 (four schools, seeds 1..${N}, ${T} trips)` };
process.stdout.write(JSON.stringify(out) + '\n');
for (const [k, v] of Object.entries(out)) console.error(k, 'seed', v.seed, 'Lv', v.level, 'power', v.power, v.note);
