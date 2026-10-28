/** rc12f（自訂，僅分析）: the boss a QA pre-boss snapshot really met.
 *  Snapshots with `rngAt: 'pre-encounter'` (rc12f+) hold the rng before the boss roll → encounter(run) directly.
 *  Older snapshots were written after encounter() (rng already past the roll). mulberry32 advances by a constant, so rewind n steps
 *  and keep the n whose encounter() lands exactly on the snapshot state. */
import { encounter, type RunState } from '../src/core/run';
import type { MonsterPool } from '../src/core/monsters';
export function realBoss(run: RunState, pool: MonsterPool, pre = false) {
  if (pre) { const r2 = structuredClone(run); return { ms: encounter(r2, pool, 'boss'), n: 0 }; }
  const S = run.rng >>> 0;
  for (let n = 1; n <= 2000; n++) { const r2 = structuredClone(run); r2.rng = (S - Math.imul(n, 0x6d2b79f5)) >>> 0; const ms = encounter(r2, pool, 'boss'); if (r2.rng >>> 0 === S) return { ms, n }; }
  throw new Error('no rewind');
}
