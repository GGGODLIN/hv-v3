/** rc12d diag（自訂，僅統計）: runs scripts/rc10-sim.ts unchanged with PK_DIAG on and prints `PK {...}` — share of each ★ key
 *  (primaryKey) and, for staff users, why no spell 1–5 was ★. Usage: SIM_POLICY=primary SC=arcane RC10_SIM=preset npx tsx scripts/rc12d-pk-diag.ts 64 4 */
import { PK_DIAG } from '../src/core/battle';
PK_DIAG.on = true;
await import('./rc10-sim.ts');
const n = Object.values(PK_DIAG.key).reduce((a, b) => a + b, 0) || 1, sh = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, +(v / n).toFixed(3)]));
console.log('PK ' + JSON.stringify({ n, key: sh(PK_DIAG.key), spellWhy: sh(PK_DIAG.spellWhy) }));
