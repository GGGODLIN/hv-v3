// rc12b item 2: a full run (F100) is never cut; older runs are evicted whole; fewer snapshots; quota drops older runs, never the current one.
import { describe, expect, it } from 'vitest';
import { QA_RUNCAP, QA_SNAPCAP, QA_TURNCAP, QA_TURNLOG, logTurn, newRunId, trimRuns } from '../src/game/qalog';
function quotaStore(limit: number) {
  const m = new Map<string, string>(); const size = () => [...m].reduce((t, [k, v]) => t + k.length + v.length, 0);
  return { m, getItem: (k: string) => m.get(k) ?? null, removeItem: (k: string) => void m.delete(k),
    setItem(k: string, v: string) { const old = m.get(k); m.set(k, v); if (size() > limit) { if (old == null) m.delete(k); else m.set(k, old); throw new Error('QuotaExceededError'); } } };
}
const row = (runId: string, floor: number, turn: number) => ({ runId, lean: 'blade', floor, level: 40, turn, bossDmg: 10, bossHp: 100 });
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; };
describe('rc12b turn log cap', () => {
  it('constants: run cap fits F100 (20 bosses × 200 turns), total ≥ 2 runs, snapshots fewer than rc12 (24)', () => {
    expect(QA_RUNCAP).toBeGreaterThanOrEqual(20 * 200); expect(QA_TURNCAP).toBeGreaterThanOrEqual(2 * QA_RUNCAP); expect(QA_SNAPCAP).toBeLessThan(24);
    expect(newRunId(0, 0.5)).toMatch(/^\d{14}-[0-9a-z]{4}$/);
  });
  it('an F100 run after older runs keeps every row; older runs go whole, oldest first', () => {
    const st = mem();
    for (const id of ['old1', 'old2']) for (let i = 0; i < 3000; i++) logTurn(st, row(id, 5 + 5 * Math.floor(i / 150), i % 150));
    let last: ReturnType<typeof logTurn> = [];
    for (let f = 5; f <= 100; f += 5) for (let t = 1; t <= 200; t++) last = logTurn(st, row('cur', f, t));
    const stored = JSON.parse(st.getItem(QA_TURNLOG)!) as { runId: string }[];
    expect(stored.filter((r) => r.runId === 'cur')).toHaveLength(4000); expect(last.filter((r) => r.runId === 'cur')).toHaveLength(4000);
    expect(stored.some((r) => r.runId === 'old1')).toBe(false); // whole oldest run evicted
    const o2 = stored.filter((r) => r.runId === 'old2').length; expect(o2 === 0 || o2 === 3000).toBe(true); // never a partial run
  }, 180000);
  it('pre-rc11b rows without runId are evicted as one oldest run', () => {
    const log = [...Array(10)].map((_, i) => ({ ...row('x', 5, i), runId: undefined as unknown as string })).concat([row('cur', 5, 1)]);
    expect(trimRuns(log, 5, 'cur')).toEqual([row('cur', 5, 1)]);
  });
  it('quota with no snapshot left: older runs are dropped, the current run is kept', () => {
    const st = quotaStore(40000);
    for (let i = 0; i < 250; i++) logTurn(st, row('old', 10, i));
    for (let i = 0; i < 200; i++) logTurn(st, row('cur', 20, i));
    const stored = JSON.parse(st.getItem(QA_TURNLOG)!) as { runId: string }[];
    expect(stored.filter((r) => r.runId === 'cur')).toHaveLength(200); expect(stored.some((r) => r.runId === 'old')).toBe(false);
  });
});
