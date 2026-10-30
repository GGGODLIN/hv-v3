import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { RULES } from '../src/core/run';
import { roundRange12ad, thornPending12aj, ACT9, type BattleState } from '../src/core/battle';

/** rc12aj（自訂，非數值）: rc12af-estprobe 128 seeds，bulwark seed 123（BUYPOT 0/10 同一筆）F55 首領戰 T6，回合開始前的狀態。
 *  實際受傷 352 = 首領 28（被格擋）+ 反傷 130（首領本回合展開尖刺盾，玩家反擊打在盾上）+ 小怪 194；舊的面板 hi 是 351。 */
const load = (): BattleState => JSON.parse(readFileSync(new URL('./fixtures/rc12aj-bw-f55t6.json', import.meta.url), 'utf8')) as BattleState;
describe('rc12aj over-hi：本回合才展開的尖刺盾反傷', () => {
  beforeAll(() => { RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true; });
  it('hi ≥ 實際 352（舊 351 + 反傷上限 130）', () => {
    ACT9.taken = 286; const b = load();
    expect(thornPending12aj(b)).toBe(130);
    const r = roundRange12ad(b)!;
    expect(r.hi).toBeGreaterThanOrEqual(28 + 130 + 194);
    expect(r.hi - thornPending12aj(b)).toBe(351);
    ACT9.taken = 0;
  });
  it('盾已展開時不重複計入（extra9 已算）', () => {
    const b = load(); (b.monsters[0] as unknown as { thornTurns: number }).thornTurns = 2;
    expect(thornPending12aj(b)).toBe(0);
  });
  it('hi 是整數且向上取整', () => { const r = roundRange12ad(load())!; expect(Number.isInteger(r.hi)).toBe(true); });
});
