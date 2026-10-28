// rc11 item 6 (QA tools, display/debug only, no effect on the game): a pre-boss save snapshot and a per-turn boss-damage log.
type St = Pick<Storage, 'getItem' | 'setItem'> & Partial<Pick<Storage, 'removeItem'>>;
type Mon = { hp: number; rank?: string };
// rc11b item 1: rows carry runId + lean, kept across runs (never cleared); snapshots are keyed by run (hv-v3-qa-snap:<runId>:F<n>) and the
// oldest are evicted past QA_SNAPCAP (a snapshot is a full player+run JSON, tens of KB; localStorage is ~5 MB shared with the save).
export const QA_SNAP = 'hv-v3-qa-snap:', QA_SNAPIDX = 'hv-v3-qa-snapidx', QA_TURNLOG = 'hv-v3-qa-turnlog', QA_TURNCAP = 5000, QA_SNAPCAP = 24;
export const newRunId = (now = Date.now(), r = Math.random()): string => `${new Date(now).toISOString().slice(0, 19).replace(/[-:T]/g, '')}-${Math.floor(r * 36 ** 4).toString(36).padStart(4, '0')}`;
export interface TurnRow { runId: string; lean: string; floor: number; level: number; turn: number; bossDmg: number; bossHp: number; bossMaxHp?: number }
/** HP the boss(es) lost on one player action (sum over rank 'boss'; heals are not counted). */
export function bossDmg(before: number[], after: Mon[]): number {
  let d = 0; after.forEach((m, i) => { if (m.rank === 'boss') d += Math.max(0, (before[i] ?? m.hp) - Math.max(0, m.hp)); }); return Math.round(d);
}
/** rc12 item 5: last full turn log in memory — a row whose localStorage write hit the quota (pre-boss snapshots fill it) still reaches the export. */
const MEM = new WeakMap<object, TurnRow[]>(); // per storage object
/** rc12 item 5（QA blade-3 F40 / blade-4 F45: the fatal boss fight was missing）: on a quota error the turn log wins over snapshots —
 *  evict the oldest snapshot and retry until it fits; true = the log is in storage. */
function writeLog(st: St, log: TurnRow[]): boolean {
  const body = JSON.stringify(log);
  for (;;) {
    try { st.setItem(QA_TURNLOG, body); return true; } catch { /* quota */ }
    const idx = readJson<string[]>(st, QA_SNAPIDX, []), old = idx.shift();
    if (!old || !st.removeItem) return false;
    st.removeItem(old); try { st.setItem(QA_SNAPIDX, JSON.stringify(idx)); } catch { /* ignore */ }
  }
}
export function logTurn(st: St, row: TurnRow): TurnRow[] {
  let log: TurnRow[] = readJson<TurnRow[]>(st, QA_TURNLOG, []);
  const mem = MEM.get(st); if (mem && mem.length >= log.length) log = mem; // rows a failed write kept only in memory
  log = [...log, row]; if (log.length > QA_TURNCAP) log = log.slice(-QA_TURNCAP);
  MEM.set(st, log); writeLog(st, log); return log;
}
/** rc12 item 5: write the in-memory log again (called when the player dies, before the result screen). true = stored. */
export const flushTurnLog = (st: St): boolean => { const m = MEM.get(st); return m ? writeLog(st, m) : true; };
const readJson = <T>(st: St, k: string, d: T): T => { try { return JSON.parse(st.getItem(k) ?? 'null') ?? d; } catch { return d; } };
export function snapBeforeBoss(st: St, runId: string, floor: number, level: number, player: unknown, run: unknown): string {
  const key = `${QA_SNAP}${runId}:F${floor}`;
  let idx = readJson<string[]>(st, QA_SNAPIDX, []).filter((k) => k !== key); idx.push(key);
  while (idx.length > QA_SNAPCAP) { const old = idx.shift()!; st.removeItem?.(old); }
  const body = JSON.stringify({ at: new Date().toISOString(), runId, floor, level, player, run });
  for (;;) { try { st.setItem(key, body); break; } catch { const old = idx.shift(); if (!old || old === key) break; st.removeItem?.(old); } } // quota: drop oldest
  try { st.setItem(QA_SNAPIDX, JSON.stringify(idx)); } catch { /* ignore */ } return key;
}
/** Everything QA needs in one JSON (turn log + every kept snapshot), for the download button / Shift+L. */
export function qaExport(st: St): { exportedAt: string; turnlog: TurnRow[]; snaps: Record<string, unknown> } {
  const snaps: Record<string, unknown> = {}; for (const k of readJson<string[]>(st, QA_SNAPIDX, [])) { const v = readJson<unknown>(st, k, null); if (v) snaps[k] = v; }
  return { exportedAt: new Date().toISOString(), turnlog: ((l, m = MEM.get(st)) => (m && m.length > l.length ? m : l))(readJson<TurnRow[]>(st, QA_TURNLOG, [])), snaps }; // rc12 item 5: memory wins when storage lost rows
}
/** rc11 item 8: damage the player dealt on one action (hits from 'player' to a monster, incl. skills and multi-hits). */
export function dealtBy(ev: readonly { t: string; from?: unknown; to?: unknown; dmg?: number }[]): number {
  return ev.reduce((t, e) => t + (e.t === 'hit' && e.from === 'player' && typeof e.to === 'number' ? Math.max(0, e.dmg ?? 0) : 0), 0);
}
