import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { RULES } from '../src/core/run';
import { hiRound12ag, type BattleState } from '../src/core/battle';
/** rc12ak（自訂，非數值）: estprobe bulwark seed 16 F45 T12 — 首領已倒地（hp 0）、尚有第二階段，本回合復活並暴擊 238；舊 hi 206 < 實際 249。 */
const load = (): BattleState => JSON.parse(readFileSync(new URL('./fixtures/rc12aj-bw-f55t6.json', import.meta.url), 'utf8')) as BattleState;
describe('rc12ak over-hi：待復活首領', () => {
  beforeAll(() => { RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true; });
  it('hp 0 且有 phases 的首領計入 hi；沒有 phases 不計', () => {
    const a = load(), b = load();
    const boss = (x: BattleState) => x.monsters.find((m) => m.rank === 'boss')! as unknown as { hp: number; phases?: number };
    boss(a).hp = 0; boss(a).phases = 1; boss(b).hp = 0; boss(b).phases = 0;
    expect(hiRound12ag(a)).toBeGreaterThan(hiRound12ag(b));
  });
});
