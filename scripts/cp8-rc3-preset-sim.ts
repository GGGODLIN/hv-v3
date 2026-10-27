/** cp8-rc3 playtest replay: the postF20-<school> debug presets (public/data/cp6-presets.json) → T abyss trips from the checkpoint
 * (SIM_AI=naive: attack only + potion <40% + 「全部處理」 prep). Prints trip-1/trip-2 cleared depth medians per school, and the
 * death causes (stderr DBG=1). Env: CP8=1 SIM_AI=naive. Usage: npx tsx scripts/cp8-rc3-preset-sim.ts [N=64] [T=2] [schools] */
import { readFileSync } from 'node:fs';
import { autoRun } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import { checkpointStart, emptyRecord, recordTitles, recordTrip, type AbyssSchool } from '../src/core/abyss';
import { derive, level, type Player } from '../src/core/player';
const E = process.env;
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = E.CP8 === '1';
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const pre = JSON.parse(readFileSync(E.PRESETS ?? new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, { player: Player; record: ReturnType<typeof emptyRecord> }>;
const N = Number(process.argv[2] ?? 64), T = Number(process.argv[3] ?? 2), schools = (process.argv[4] ?? 'blade,oc,arcane,bulwark').split(',');
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)]! : NaN; };
for (const sc of schools) {
  const trips: number[][] = Array.from({ length: T }, () => []); let hp0 = 0, lv = 0; const potDeath: [number, number] = [0, 0]; // post-rc9 #1: [deaths, deaths with HP potions left]
  for (let s = 1; s <= N; s++) {
    const p = structuredClone(pre[`postF20-${sc}`]!.player); const rec = structuredClone(pre[`postF20-${sc}`]!.record ?? emptyRecord());
    for (let t = 1; t <= T; t++) {
      const st = checkpointStart(rec.best ?? 0);
      const r = autoRun(p, pool, s * 1000 + 100 + t, `buff:${sc}` as never, { mode: 'counter', retreat: 0.3, abyss: st, cap: 60, ms: rec.ms } as never);
      if (s === 1 && t === 1) { hp0 = derive(p).hp; lv = level(p); }
      const end = (r as { end?: { why: string; hpPots?: number } }).end; if (end?.why === 'dead') { potDeath[0]++; if ((end.hpPots ?? 0) > 0) potDeath[1]++; }
      const cl = r.abyss!.cleared; trips[t - 1]!.push(cl);
      if (E.DBG) console.error(sc, s, t, st, cl, r.settlement.outcome, 'hp', derive(p).hp, 'lv', level(p));
      recordTitles(rec, r.abyss!.ms, r.abyss!.titles); recordTrip(rec, cl, r.abyss!.school as AbyssSchool);
    }
  }
  console.log(sc, 'hp', hp0, 'lv', lv, trips.map((a, i) => `trip${i + 1} median d${med(a)}`).join(' '), 'potDeath', JSON.stringify(potDeath), 'noPotShare', potDeath[0] ? ((1 - potDeath[1] / potDeath[0]) * 100).toFixed(1) + '%' : '-');
}
