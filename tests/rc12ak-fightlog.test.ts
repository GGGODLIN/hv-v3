import { describe, it, expect } from 'vitest';
import { fightTurn, QA_FIGHT } from '../src/game/qalog';
const mk = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }; };
describe('rc12ak 首領戰逐回合傷害紀錄', () => {
  it('每回合記下對首領造成的傷害與平均', () => {
    const st = mk(); fightTurn(st, 'r', 55, 400); const t = fightTurn(st, 'r', 55, 500);
    expect(t.bossDmg).toEqual([400, 500]); expect(t.avg).toBe(450); expect(t.turns).toBe(2);
  });
  it('重新載入後 turns 接續累計（包含載入前的回合）', () => {
    const st = mk(); fightTurn(st, 'r', 60, 100); fightTurn(st, 'r', 60, 100);
    const st2 = { getItem: st.getItem, setItem: st.setItem }; // 新頁面、同一份 localStorage
    const t = fightTurn(st2, 'r', 60, 300, true);
    expect(t.turns).toBe(3); expect(t.reloads).toBe(1); expect(JSON.parse(st.m.get(QA_FIGHT)!).turns).toBe(3);
  });
  it('換樓層或換 run 重開', () => {
    const st = mk(); fightTurn(st, 'r', 60, 100); expect(fightTurn(st, 'r', 65, 50).turns).toBe(1); expect(fightTurn(st, 'x', 65, 50).turns).toBe(1);
  });
});
