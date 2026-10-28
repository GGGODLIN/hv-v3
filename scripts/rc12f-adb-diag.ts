/** rc12f diag（自訂，僅統計）: boss plain hit vs player max HP by floor band. Wraps rc12d-pk-diag.ts; prints `ADB {...}`.
 *  plain = boss adb after the player's phys/mag mitigation (mean roll, not defending), ratio = plain / max HP. */
import { TURN_HOOK9, FIGHT_CTX } from '../src/core/auto';
import { chargeEstimate } from '../src/core/battle';
const R: Record<string, { n: number; hp: number[]; adb: number[]; r: number[] }> = {};
TURN_HOOK9.fn = (b) => { if (FIGHT_CTX.type !== 'boss' || b.turn !== 0) return; const m = b.monsters.find((x) => x.rank === 'boss'); if (!m) return;
  const band = String(Math.min(100, Math.floor(FIGHT_CTX.depth / 10) * 10)), o = (R[band] ??= { n: 0, hp: [], adb: [], r: [] });
  const c = m.charge; (m as { charge: number }).charge = 0; const plain = chargeEstimate(b, m); (m as { charge: number }).charge = c;
  o.n++; o.hp.push(b.d.hp); o.adb.push(m.adb); o.r.push(plain / b.d.hp); };
await import('./rc12d-pk-diag.ts');
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return +(s[s.length >> 1] ?? 0).toFixed(2); };
console.log('ADB ' + JSON.stringify(Object.fromEntries(Object.entries(R).map(([k, o]) => [k, { n: o.n, hp: med(o.hp), adb: med(o.adb), ratio: med(o.r) }]))));
