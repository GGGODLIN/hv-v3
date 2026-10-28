// rc12j items 1–3（自訂）: staff procs reachable + distinct text, ★ picks the best spell (one function for UI and sim), map text follows ★.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, bestSpell12j, canUse, primaryKey, startBattle, SPELLS, type BattleState } from '../src/core/battle';
import { decide, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { RULES, lowHpMapText9 } from '../src/core/run';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const fight = (): BattleState => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  (d as { style: string }).style = 'staff'; d.level = 30; d.wprof = 100; d.attrs.int = 200; d.attrs.wis = 200; d.mp = 10000;
  const m = buildMonster(pool.rows[0]!, 1, 'normal'); m.hp = m.maxHp = 1e7; m.adb = 0; m.evade = 0; m.resist = 0;
  return startBattle(d, { hp: 1e6, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 });
};
const withCp8 = (f: () => void) => { const o = RULES.cp8; RULES.cp8 = true; try { f(); } finally { RULES.cp8 = o; } };
describe('rc12j arcane', () => {
  it('item 1: following ★ (the UI path) for 60 turns at full MP gets ≥1 player 魔力合流 and ≥1 以太分流, both prefixed 你的法杖：', () => withCp8(() => {
    const b = fight(); b.d.hp = b.hp = 1e6; const rng = new Rng(7); let cm = 0, et = 0;
    for (let i = 0; i < 60 && !b.over; i++) { b.mp = b.d.mp; b.hp = 1e6;
      for (const e of act(b, primaryKey(b, 0).action, rng, {} as never) as { text?: string }[]) {
        if (e.text?.startsWith('你的法杖：魔力合流')) cm++; if (e.text?.startsWith('你的法杖：以太分流')) et++; } }
    expect(cm).toBeGreaterThanOrEqual(1); expect(et).toBeGreaterThanOrEqual(1);
  }));
  it('item 2: spell usable + affordable → ★ is the best spell key, never 「普通攻擊」; sim primary policy acts the same', () => withCp8(() => {
    const b = fight(); b.cm9 = {};
    const ids = (Object.keys(SPELLS) as never[]).filter((id) => canUse(b, { kind: 'spell', id, target: 0 } as never));
    expect(ids.length).toBeGreaterThan(0);
    const pk = primaryKey(b, 0); expect(pk.why).not.toBe('普通攻擊'); expect(pk.action.kind).toBe('spell');
    expect((pk.action as { id: string }).id).toBe(bestSpell12j(b, 0));
    const o = process.env.SIM_POLICY; process.env.SIM_POLICY = 'primary';
    try { expect(decide(b, 'buff:arcane' as never, 'counter')).toEqual(pk.action); } finally { if (o === undefined) delete process.env.SIM_POLICY; else process.env.SIM_POLICY = o; }
  }));
  it('item 3: ar3 F49 (★ = 撤退) → the red text says 撤退, not 休息節點; ★ = rest → 休息節點', () => {
    const t = lowHpMapText9(['rest', 'merchant', 'battle'], 0, true, { i: -1, retreat: true });
    expect(t.noPot).toMatch(/撤退回城/); expect(t.noPot).not.toMatch(/休息節點/);
    expect(lowHpMapText9(['battle', 'rest'], 0, true, { i: 1 }).noPot).toMatch(/優先走休息節點/);
  });
});
import { aoBossHp12j, DEEP12G } from '../src/core/cp8';
describe('rc12j item 4 arcane/oc boss HP（自訂）', () => {
  it('×0.8 F30–65, ×1 below F30, linear back to ×1 at F100', () => {
    expect(DEEP12G.aoBossHp).toBe(0.8);
    expect(aoBossHp12j(29)).toBe(1); expect(aoBossHp12j(30)).toBeCloseTo(0.8); expect(aoBossHp12j(65)).toBeCloseTo(0.8); expect(aoBossHp12j(100)).toBeCloseTo(1);
  });
});
