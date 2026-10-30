import { describe, it, expect } from 'vitest';
import { fightTurn, logTurn, qaExport, snapBeforeBoss, QA_FIGHT } from '../src/game/qalog';
import { switchSlot, type Preset } from '../src/core/preset';
const mk = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m }; };
const pr = { player: { prog: { trips: 0 } }, record: {} } as unknown as Preset;
const row = (runId: string, turn: number) => ({ runId, lean: 'blade', floor: 65, level: 50, turn, bossDmg: 100, bossHp: 1 });
describe('rc12al &fresh 清空 QA 紀錄', () => {
  it('&fresh 開新局後匯出的 turnlog 是空的，只含本局新增', () => {
    const st = mk(); for (let i = 0; i < 5; i++) logTurn(st, row('old', i)); snapBeforeBoss(st, 'old', 65, 50, {}, {}); fightTurn(st, 'old', 65, 100);
    switchSlot(st, 'postF20-blade', pr, true);
    const e = qaExport(st); expect(e.turnlog).toEqual([]); expect(Object.keys(e.snaps)).toEqual([]); expect(st.m.has(QA_FIGHT)).toBe(false);
    logTurn(st, row('new', 0)); expect(qaExport(st).turnlog.map((r) => r.runId)).toEqual(['new']);
  });
  it('沒有 &fresh 的切換不清紀錄', () => {
    const st = mk(); logTurn(st, row('a', 0)); switchSlot(st, 'x', pr, false); expect(qaExport(st).turnlog).toHaveLength(1);
  });
  it('bossturns 跨重新載入連續計數：N 回合（中途重載）記 N', () => {
    const st = mk(); let t; for (let i = 0; i < 30; i++) t = fightTurn(st, 'r', 65, 10, i === 0 || i === 12);
    expect(t!.turns).toBe(30); expect(t!.reloads).toBe(1);
  });
});
