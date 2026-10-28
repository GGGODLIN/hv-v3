/** rc12f（自訂，僅統計）: rc12d-pk-diag.ts + `B30 {...}` = b.turn of every F30+ boss fight (SIM_DIAG.bossByDepth, depth ≥ 30).
 *  Usage: SIM_POLICY=primary SC=oc RC10_SIM=preset npx tsx scripts/rc12f-sim.ts 64 4 */
const { SIM_DIAG } = await import('../src/core/auto');
await import('./rc12d-pk-diag.ts');
const t = Object.entries(SIM_DIAG.bossByDepth).filter(([d]) => +d >= 30).flatMap(([, v]) => v).sort((a, b) => a - b);
const q = (p: number) => t[Math.min(t.length - 1, Math.floor(p * t.length))] ?? 0;
console.log('B30 ' + JSON.stringify({ n: t.length, med: q(0.5), p25: q(0.25), p75: q(0.75), in618: +(t.filter((x) => x >= 6 && x <= 18).length / (t.length || 1)).toFixed(3) }));
if (process.env.B30DBG) console.log(JSON.stringify(SIM_DIAG.bossByDepth[30]), JSON.stringify(t));
export {};
