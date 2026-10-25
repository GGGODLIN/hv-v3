/** rc4 B4 diagnostics: seeds that never full-clear F20 within M trips (cp5-sim settings: counter, retreat 0.3).
 * Per school: stuck floor (best floorReached) distribution, how each trip ended (death: node type + foe/affix/boss sig; retreat).
 * Usage: npx tsx scripts/rc4-noclear.ts [N=32] [M=12] [strats] */
import { readFileSync } from 'node:fs';
import { autoRun, starterKit, type Strategy, type RunReport } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, derive } from '../src/core/player';
const N = Number(process.argv[2] ?? 32), M = Number(process.argv[3] ?? 12);
const STRATS = (process.argv[4] ?? 'auto,buff:blade,buff:oc,buff:arcane,buff:bulwark').split(',') as Strategy[];
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const inc = (o: Record<string, number>, k: string) => { o[k] = (o[k] ?? 0) + 1; };
const top = (o: Record<string, number>, n = 8) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}:${v}`).join(' ');
const desc = (e: NonNullable<RunReport['end']>) => e.why === 'retreat' ? `retreat@F${e.floor}` : `${e.type}@F${e.floor}`;
const foeKey = (e: NonNullable<RunReport['end']>) => { const lead = e.foes.find((f) => f.rank !== 'normal') ?? e.foes[0]; return lead ? `${lead.rank}${lead.sig ? '[' + lead.sig + ']' : ''}${lead.affixes ? '{' + lead.affixes.join('+') + '}' : ''}` : '-'; };
for (const strat of STRATS) {
  let never = 0; const stuck: Record<string, number> = {}; const endsAll: Record<string, number> = {}; const endsNever: Record<string, number> = {}; const foesNever: Record<string, number> = {}; const lastEnds: Record<string, number> = {};
  const rows: string[] = [];
  for (let s = 1; s <= N; s++) {
    const p = newPlayer(); starterKit(p, s);
    let z = Infinity, best = 0; const ends: RunReport['end'][] = [];
    for (let i = 1; i <= M && z === Infinity; i++) {
      const r = autoRun(p, pool, s * 1000 + i, strat, { mode: 'counter', pair: true, retreat: 0.3 });
      best = Math.max(best, r.floorReached); ends.push(r.end);
      if (r.end) inc(endsAll, desc(r.end));
      if (r.floorReached > 20) z = i;
    }
    if (z !== Infinity) continue;
    never++; inc(stuck, `F${Math.min(best, 20)}`);
    for (const e of ends) if (e) { inc(endsNever, desc(e)); if (e.why === 'dead') inc(foesNever, `${e.type}@F${e.floor} ${foeKey(e)}`); }
    const le = ends[ends.length - 1]; if (le) inc(lastEnds, desc(le));
    const d = derive(p); rows.push(`  seed ${s}: best F${best} lv ${d.level} main ${p.equipped.mainHand?.base ?? 'NONE'} off ${p.equipped.offHand?.base ?? '-'} | ends ${ends.map((e) => (e ? desc(e) : 'ok')).join(',')}`);
  }
  console.log(`\n== ${strat}  N=${N} M=${M}  never full-clear: ${never} (${(never / N * 100).toFixed(0)}%)`);
  console.log(`stuck floor (best reached): ${top(stuck, 20)}`);
  console.log(`run ends, never-clear seeds: ${top(endsNever, 12)}`);
  console.log(`deaths, never-clear seeds (node, lead foe [boss sig] {elite affixes}): ${top(foesNever, 12)}`);
  console.log(`run ends, all seeds: ${top(endsAll, 12)}`);
  for (const r of rows) console.log(r);
}
