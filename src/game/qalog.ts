// rc11 item 6 (QA tools, display/debug only, no effect on the game): a pre-boss save snapshot and a per-turn boss-damage log.
type St = Pick<Storage, 'getItem' | 'setItem'> & Partial<Pick<Storage, 'removeItem'>>;
type Mon = { hp: number; rank?: string };
// rc11b item 1: rows carry runId + lean, kept across runs (never cleared); snapshots are keyed by run (hv-v3-qa-snap:<runId>:F<n>) and the
// oldest are evicted past QA_SNAPCAP (a snapshot is a full player+run JSON, tens of KB; localStorage is ~5 MB shared with the save).
export const QA_SNAP = 'hv-v3-qa-snap:', QA_SNAPIDX = 'hv-v3-qa-snapidx', QA_TURNLOG = 'hv-v3-qa-turnlog', QA_TURNCAP = 8000, QA_SNAPCAP = 12;
/** rc12b item 2（自訂）: one run is never cut — an F100 run is 20 bosses; even at 200 turns each (QA max seen ≈ 40) it fits QA_RUNCAP.
 *  Past QA_TURNCAP rows (or on a quota error after every snapshot is gone) whole older runs are evicted first, oldest first. ~120 B/row → ~1 MB. */
export const QA_RUNCAP = 4000;
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
  log = trimRuns([...log, row], QA_TURNCAP, row.runId);
  if (!writeLog(st, log)) { // quota with no snapshot left: drop whole older runs until it fits
    while (log.some((r) => r.runId !== row.runId)) { log = dropOldestRun(log, row.runId); try { st.setItem(QA_TURNLOG, JSON.stringify(log)); break; } catch { /* still full */ } }
  }
  MEM.set(st, log); return log;
}
/** rc12 item 5: write the in-memory log again (called when the player dies, before the result screen). true = stored. */
export const flushTurnLog = (st: St): boolean => { const m = MEM.get(st); return m ? writeLog(st, m) : true; };
const readJson = <T>(st: St, k: string, d: T): T => { try { return JSON.parse(st.getItem(k) ?? 'null') ?? d; } catch { return d; } };
export function snapBeforeBoss(st: St, runId: string, floor: number, level: number, player: unknown, run: unknown): string {
  const key = `${QA_SNAP}${runId}:F${floor}`;
  let idx = readJson<string[]>(st, QA_SNAPIDX, []).filter((k) => k !== key); idx.push(key);
  while (idx.length > QA_SNAPCAP) { const old = idx.shift()!; st.removeItem?.(old); }
  const body = JSON.stringify({ at: new Date().toISOString(), rngAt: 'pre-encounter' /* rc12f: saved before the boss roll */, runId, floor, level, player, run });
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

/** rc12b item 2: drop the oldest run (by first appearance) other than `keep`. Rows without runId (pre-rc11b) count as one oldest run. */
export function dropOldestRun(log: TurnRow[], keep: string): TurnRow[] {
  const victim = log.find((r) => r.runId !== keep); if (!victim) return log;
  return log.filter((r) => r.runId !== victim.runId);
}
/** rc12b item 2: keep ≤ cap rows by evicting whole older runs; the current run keeps its newest QA_RUNCAP rows. */
export function trimRuns(log: TurnRow[], cap: number, keep: string): TurnRow[] {
  const cur = log.filter((r) => r.runId === keep);
  if (cur.length > QA_RUNCAP) { let n = cur.length - QA_RUNCAP; log = log.filter((r) => !(r.runId === keep && n-- > 0)); }
  while (log.length > cap && log.some((r) => r.runId !== keep)) log = dropOldestRun(log, keep);
  return log;
}
/** rc12ak（自訂，QA 用，不影響遊戲）: 每場首領戰的逐回合「對首領造成」紀錄，存在 localStorage，重新載入後接續累計，
 *  所以 turns 包含重新載入前的回合。key = runId + 樓層；換一場就重開。 */
export const QA_FIGHT = 'hv-v3-qa-fight';
export interface FightTally { runId: string; floor: number; turns: number; bossDmg: number[]; sum: number; avg: number; reloads: number }
export function fightTurn(st: St, runId: string, floor: number, bossDmg: number, fresh = false): FightTally {
  const o = readJson<FightTally | null>(st, QA_FIGHT, null);
  const t: FightTally = o && o.runId === runId && o.floor === floor ? o : { runId, floor, turns: 0, bossDmg: [], sum: 0, avg: 0, reloads: 0 };
  if (fresh && t.turns > 0) t.reloads++;
  t.bossDmg.push(Math.max(0, Math.round(bossDmg))); t.turns = t.bossDmg.length; t.sum = t.bossDmg.reduce((a, b) => a + b, 0); t.avg = Math.round(t.sum / t.turns);
  try { st.setItem(QA_FIGHT, JSON.stringify(t)); } catch { /* quota: tally lost only */ }
  return t;
}
