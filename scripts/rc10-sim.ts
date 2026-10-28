/** cp9-rc10 diag（自訂，僅 sim）: runs the standard sim (scripts/cp7-sim.ts) or the preset sim (scripts/cp9-preset-sim.ts) unchanged and
 * prints one extra line `RC10 {...}` with the behaviour-neutral RC10 counters from auto.ts (abyss trips only for the potion ledger/floors).
 * Env: RC10_SIM=std|preset (default std) plus that script's env. Usage: SC=oc SEED0=0 RC10_SIM=std npx tsx scripts/rc10-sim.ts 128 4 */
import { RC10, SIM_DIAG, SIM_TURNLOG } from '../src/core/auto';
import { writeFileSync } from 'node:fs';
const kind = process.env.RC10_SIM ?? 'std';
await import(kind === 'preset' ? './cp9-preset-sim.ts' : './cp7-sim.ts');
const bt = [...SIM_DIAG.bossTurns].sort((a, b) => a - b);
console.log('RC10 ' + JSON.stringify({ kind, sc: process.env.SC, S0: Number(process.env.SEED0 ?? 0), route: process.env.SIM_ROUTE, pot: RC10.pot, lc: RC10.lc, rt: RC10.route, q: RC10.q, bossAct: RC10.bossAct, buypot: Number(process.env.SIM_BUYPOT ?? 0), trips: RC10.trips, bossTmed: bt.length ? (bt[(bt.length - 1) >> 1]! + bt[bt.length >> 1]!) / 2 : null, bossN: bt.length, dh30: SIM_DIAG.dh30, mix30: SIM_DIAG.mix30 }));

if (process.env.SIM_TURNLOG) writeFileSync(process.env.SIM_TURNLOG, JSON.stringify({ source: 'sim', turnlog: SIM_TURNLOG })); // rc11c: file only, stdout unchanged
