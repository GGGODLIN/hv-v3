// rc12 item 5: QA blade-3 F40 / blade-4 F45 — the fatal boss fight was missing from hv-v3-qa-turnlog (export stopped at the previous boss).
import { describe, expect, it } from 'vitest';
import { QA_TURNLOG, flushTurnLog, logTurn, qaExport, snapBeforeBoss } from '../src/game/qalog';
/** localStorage stand-in with a byte quota (setItem throws like the browser's QuotaExceededError). */
function quotaStore(limit: number) {
  const m = new Map<string, string>(); const size = () => [...m].reduce((t, [k, v]) => t + k.length + v.length, 0);
  return { m, getItem: (k: string) => m.get(k) ?? null, removeItem: (k: string) => void m.delete(k),
    setItem(k: string, v: string) { const old = m.get(k); m.set(k, v); if (size() > limit) { if (old == null) m.delete(k); else m.set(k, old); throw new Error('QuotaExceededError'); } } };
}
const row = (turn: number, floor = 40) => ({ runId: 'r', lean: 'blade', floor, level: 40, turn, bossDmg: 10, bossHp: 100 });
describe('rc12 turn log survives a full storage and a death', () => {
  it('a pre-boss snapshot that fills the quota no longer swallows the next boss fight', () => {
    const st = quotaStore(6000);
    logTurn(st, row(1, 35));
    snapBeforeBoss(st, 'r', 35, 40, { pad: 'x'.repeat(2500) }, {});
    snapBeforeBoss(st, 'r', 40, 40, { pad: 'x'.repeat(2500) }, {}); // storage now (almost) full
    for (let t = 1; t <= 12; t++) logTurn(st, row(t)); // F40 fight incl. the fatal turn
    expect(flushTurnLog(st)).toBe(true);
    const stored = JSON.parse(st.getItem(QA_TURNLOG)!);
    expect(stored.filter((r: { floor: number }) => r.floor === 40)).toHaveLength(12);
    expect(qaExport(st).turnlog.at(-1)).toMatchObject({ floor: 40, turn: 12 });
  });
  it('export still has the fatal row when even the log cannot be stored', () => {
    const st = quotaStore(10); // nothing fits
    logTurn(st, row(7, 45));
    expect(flushTurnLog(st)).toBe(false);
    expect(qaExport(st).turnlog).toEqual([row(7, 45)]);
  });
});
