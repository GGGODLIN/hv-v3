/** Weapon audit (rc4 investigation): share of sim characters with no main-hand weapon after trip k, per flag config.
 * Usage: npx tsx scripts/weapon-audit.ts [N=64]. Also counts how the weapon was lost (first loss: during autoEquip of an off-hand vs. other). */
import { readFileSync } from 'node:fs';
import { autoRun, starterKit, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { checkpointStart, emptyRecord, recordTrip, type AbyssSchool } from '../src/core/abyss';
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const N = Number(process.argv[2] ?? 64); const K = [1, 3, 5, 10, 20];
type Cfg = { name: string; cp4: boolean; cp5: boolean; cp6: boolean; strats: Strategy[] };
const S4: Strategy[] = ['auto', 'buff:blade', 'buff:oc', 'buff:arcane', 'buff:bulwark'];
const cfgs: Cfg[] = [
  { name: 'flags off', cp4: false, cp5: false, cp6: false, strats: ['auto'] },
  { name: 'CP4', cp4: true, cp5: false, cp6: false, strats: S4 },
  { name: 'CP5', cp4: true, cp5: true, cp6: false, strats: S4 },
  { name: 'CP6 (main until F20 clear, then abyss)', cp4: true, cp5: true, cp6: true, strats: S4 },
];
for (const c of cfgs) {
  RULES.cp4RunBuffs = c.cp4; RULES.cp5Bosses = c.cp5; RULES.cp6Abyss = c.cp6;
  console.log(`\n== ${c.name}  N=${N}`);
  for (const st of c.strats) {
    const none: Record<number, number> = {}; const twoH: Record<number, number> = {}; let firstLoss: number[] = [];
    for (let s = 1; s <= N; s++) {
      const p = newPlayer(); starterKit(p, s); let lost = 0; const rec = emptyRecord(); let inAbyss = false;
      for (let t = 1; t <= 20; t++) {
        const cp5 = c.cp5 ? { mode: 'counter' as const, retreat: 0.3, ...(inAbyss ? { abyss: checkpointStart(rec.best), cap: 60, ms: rec.ms } : {}) } : undefined;
        const r = autoRun(p, pool, s * 1000 + (inAbyss ? 100 : 0) + t, st, cp5);
        if (inAbyss) recordTrip(rec, r.abyss!.cleared, r.abyss!.school as AbyssSchool);
        else if (c.cp6 && r.settlement.outcome === 'clear') inAbyss = true;
        if (!p.equipped.mainHand && !lost) lost = t;
        if (K.includes(t)) { if (!p.equipped.mainHand) none[t] = (none[t] ?? 0) + 1; if (p.equipped.mainHand && ['twoHand', 'staff'].includes(p.equipped.mainHand.group)) twoH[t] = (twoH[t] ?? 0) + 1; }
      }
      if (lost) firstLoss.push(lost);
    }
    firstLoss.sort((a, b) => a - b);
    console.log(`${st.padEnd(13)} no weapon after trip ${K.map((k) => `${k}:${(100 * (none[k] ?? 0) / N).toFixed(0)}%`).join(' ')} | 2H/staff held ${K.map((k) => `${k}:${twoH[k] ?? 0}`).join(' ')} | first loss trip median ${firstLoss[Math.floor(firstLoss.length / 2)] ?? '-'} (${firstLoss.length}/${N} ever)`);
  }
}
