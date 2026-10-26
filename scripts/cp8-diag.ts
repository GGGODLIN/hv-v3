/** CP8 diag: main-tower trips per AI. Env SC, SIM_AI. Prints per-trip floor/outcome/level for a few seeds. */
import { readFileSync } from 'node:fs';
import { autoRun, starterKit, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, level } from '../src/core/player';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const sc = process.env.SC ?? 'blade';
for (let s = 1; s <= Number(process.argv[2] ?? 3); s++) {
  const p = newPlayer(); starterKit(p, s); const out: string[] = [];
  for (let i = 1; i <= 30; i++) { const r = autoRun(p, pool, s * 1000 + i, `buff:${sc}` as Strategy, { mode: 'counter', retreat: 0.3 });
    out.push(`${r.floorReached}${r.settlement.outcome[0]}L${level(p)}${r.end ? ':' + r.end.type[0] + r.end.foes.map((f) => f.rank[0]).join('') : ''}`); if (r.settlement.outcome === 'clear') break; }
  console.log(s, out.join(' '));
}
