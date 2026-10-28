// rc11 item 6 (QA tools, display/debug only, no effect on the game): a pre-boss save snapshot and a per-turn boss-damage log.
type St = Pick<Storage, 'getItem' | 'setItem'>;
type Mon = { hp: number; rank?: string };
export const QA_SNAP = 'hv-v3-qa-snap:', QA_TURNLOG = 'hv-v3-qa-turnlog', QA_TURNCAP = 2000;
export interface TurnRow { floor: number; level: number; turn: number; bossDmg: number; bossHp: number }
/** HP the boss(es) lost on one player action (sum over rank 'boss'; heals are not counted). */
export function bossDmg(before: number[], after: Mon[]): number {
  let d = 0; after.forEach((m, i) => { if (m.rank === 'boss') d += Math.max(0, (before[i] ?? m.hp) - Math.max(0, m.hp)); }); return Math.round(d);
}
export function logTurn(st: St, row: TurnRow): TurnRow[] {
  let log: TurnRow[] = []; try { log = JSON.parse(st.getItem(QA_TURNLOG) ?? '[]'); } catch { /* reset */ }
  log.push(row); if (log.length > QA_TURNCAP) log = log.slice(-QA_TURNCAP);
  try { st.setItem(QA_TURNLOG, JSON.stringify(log)); } catch { /* quota: keep in memory */ } return log;
}
export function snapBeforeBoss(st: St, floor: number, level: number, player: unknown, run: unknown): string {
  const key = QA_SNAP + 'F' + floor; try { st.setItem(key, JSON.stringify({ at: new Date().toISOString(), floor, level, player, run })); } catch { /* quota */ } return key;
}
