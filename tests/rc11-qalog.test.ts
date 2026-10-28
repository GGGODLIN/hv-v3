import { describe, expect, it } from 'vitest';
import { bossDmg, logTurn, newRunId, qaExport, snapBeforeBoss, QA_SNAPCAP, QA_TURNLOG, QA_RUNCAP } from '../src/game/qalog';
const mem = (quota = Infinity) => { const m = new Map<string, string>(); const size = () => [...m.values()].reduce((t, v) => t + v.length, 0);
  return { getItem: (k: string) => m.get(k) ?? null, removeItem: (k: string) => void m.delete(k), setItem: (k: string, v: string) => { if (size() - (m.get(k)?.length ?? 0) + v.length > quota) throw new Error('quota'); m.set(k, v); }, m }; };
describe('rc11 item 6: QA tools', () => {
  it('bossDmg counts only boss HP loss, not heals or minions', () => {
    expect(bossDmg([1000, 50], [{ hp: 880, rank: 'boss' }, { hp: 0, rank: 'normal' }])).toBe(120);
    expect(bossDmg([800], [{ hp: 900, rank: 'boss' }])).toBe(0);
    expect(bossDmg([30], [{ hp: -10, rank: 'boss' }])).toBe(30);
  });
  it('turn log persists, appends and is capped', () => {
    const s = mem(); for (let i = 0; i < QA_RUNCAP + 5; i++) logTurn(s, { runId: 'r1', lean: 'blade', floor: 30, level: 14, turn: i, bossDmg: 1, bossHp: 9 });
    const log = JSON.parse(s.getItem(QA_TURNLOG)!); expect(log.length).toBe(QA_RUNCAP); expect(log.at(-1).turn).toBe(QA_RUNCAP + 4); // rc12b: one run keeps its newest QA_RUNCAP rows
  }, 60000);
  it('pre-boss snapshot is a re-loadable JSON with level and run', () => {
    const s = mem(); const k = snapBeforeBoss(s, 'r1', 30, 14, { exp: 1 }, { floor: 3 });
    expect(k).toBe('hv-v3-qa-snap:r1:F30'); const o = JSON.parse(s.getItem(k)!); expect(o.level).toBe(14); expect(o.run.floor).toBe(3);
  });
});
import { dealtBy } from '../src/game/qalog';
describe('rc11 item 8: battle log damage dealt', () => {
  it('sums player hits on monsters only (not reflect onto the player, not monster hits)', () => {
    expect(dealtBy([{ t: 'hit', from: 'player', to: 0, dmg: 120 }, { t: 'hit', from: 'player', to: 1, dmg: 30 }, { t: 'hit', from: 0, to: 'player', dmg: 99 }, { t: 'status' }])).toBe(150);
  });
  it('app map shows level + gear (collapsible) and the turn line prints 造成', () => {
    const src = require('node:fs').readFileSync('src/game/app.ts', 'utf8');
    expect(src).toMatch(/<details class="mapgear" data-mapgear><summary>Lv\$\{level\(this\.p\)\}/); expect(src).toMatch(/data-dealt>造成 \$\{dealt\}/);
  });
});

describe('rc11b item 1: QA log across runs', () => {
  it('a second run neither clears the turn log nor overwrites the first run\'s F30 snapshot; rows carry runId + lean', () => {
    const s = mem(); const a = newRunId(1, 0.1), b = newRunId(2, 0.2); expect(a).not.toBe(b);
    snapBeforeBoss(s, a, 30, 14, { n: 'a' }, {}); logTurn(s, { runId: a, lean: 'blade', floor: 30, level: 14, turn: 1, bossDmg: 50, bossHp: 900 });
    snapBeforeBoss(s, b, 30, 13, { n: 'b' }, {}); logTurn(s, { runId: b, lean: 'oc', floor: 30, level: 13, turn: 1, bossDmg: 40, bossHp: 910 });
    const x = qaExport(s); expect(Object.keys(x.snaps).sort()).toEqual([`hv-v3-qa-snap:${a}:F30`, `hv-v3-qa-snap:${b}:F30`].sort());
    expect(x.turnlog.map((r) => [r.runId, r.lean])).toEqual([[a, 'blade'], [b, 'oc']]);
  });
  it('snapshots are capped (oldest evicted) and a full storage drops old ones instead of failing', () => {
    const s = mem(); for (let i = 0; i < QA_SNAPCAP + 3; i++) snapBeforeBoss(s, 'r' + i, 5, 1, {}, {});
    expect(Object.keys(qaExport(s).snaps).length).toBe(QA_SNAPCAP); expect(s.getItem('hv-v3-qa-snap:r0:F5')).toBeNull();
    const q = mem(3000); const big = 'x'.repeat(900); for (let i = 0; i < 6; i++) snapBeforeBoss(q, 'q' + i, 5, 1, big, {});
    expect(q.getItem('hv-v3-qa-snap:q5:F5')).not.toBeNull();
  });
  it('app: run start mints qaId; result screen has a download button and Shift+L exports', () => {
    const src = require('node:fs').readFileSync('src/game/app.ts', 'utf8');
    expect(src.match(/qaId = newRunId\(\)/g)?.length).toBe(2); expect(src).toMatch(/data-qaexport>下載 QA 紀錄/); expect(src).toMatch(/KeyL' && e\.shiftKey/);
  });
});
