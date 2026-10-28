import { describe, expect, it } from 'vitest';
import { bossDmg, logTurn, snapBeforeBoss, QA_TURNLOG, QA_TURNCAP } from '../src/game/qalog';
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m }; };
describe('rc11 item 6: QA tools', () => {
  it('bossDmg counts only boss HP loss, not heals or minions', () => {
    expect(bossDmg([1000, 50], [{ hp: 880, rank: 'boss' }, { hp: 0, rank: 'normal' }])).toBe(120);
    expect(bossDmg([800], [{ hp: 900, rank: 'boss' }])).toBe(0);
    expect(bossDmg([30], [{ hp: -10, rank: 'boss' }])).toBe(30);
  });
  it('turn log persists, appends and is capped', () => {
    const s = mem(); for (let i = 0; i < QA_TURNCAP + 5; i++) logTurn(s, { floor: 30, level: 14, turn: i, bossDmg: 1, bossHp: 9 });
    const log = JSON.parse(s.getItem(QA_TURNLOG)!); expect(log.length).toBe(QA_TURNCAP); expect(log.at(-1).turn).toBe(QA_TURNCAP + 4);
  });
  it('pre-boss snapshot is a re-loadable JSON with level and run', () => {
    const s = mem(); const k = snapBeforeBoss(s, 30, 14, { exp: 1 }, { floor: 3 });
    expect(k).toBe('hv-v3-qa-snap:F30'); const o = JSON.parse(s.getItem(k)!); expect(o.level).toBe(14); expect(o.run.floor).toBe(3);
  });
});
