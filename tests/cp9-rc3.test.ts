// cp9-rc3（自訂，暫定）: QA bugs 1/2/4/5 + every-fight caps.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CP9 } from '../src/core/cp8';
import { deathTip } from '../src/core/battle';

describe('cp9-rc3 caps', () => {
  it('the 50% / 30% per-turn cap covers normal fights (allCap on by default)', () => { expect(CP9.allCap).toBe(true); expect(CP9.bossBurst).toBe(0.5); expect(CP9.bossPlain).toBe(0.3); });
});
describe('cp9-rc3 bug 1: death headline', async () => {
  const { App } = await import('../src/game/app');
  const cause = (recent: unknown[], lastHit: unknown) => (App.prototype.deathCause as () => string).call({ recent, lastHit, lastAdvice: null, adviceNote: App.prototype.adviceNote, battle: null });
  it('names the killer, not a bigger minion hit (arcane7: boss 守門者 killed, headline said 炎翼刺客)', () => {
    const h = cause([{ turn: 5, taken: 280, big: { who: '炎翼刺客', dmg: 268, charged: true } }, { turn: 6, taken: 122, big: { who: '守門者', dmg: 122, charged: false } }], { who: '守門者', dmg: 122, charged: false, maxHp: 760 });
    expect(h).toMatch(/死因：第 \d+ 回合共受 \d+ 傷害.*最後一擊是 守門者 122/) /* cp9-rc5 bug 1（自訂） */; expect(h).toContain('data-deathtop="268"');
  });
  it('a 反傷 event is named as the player\'s own reflect (bulwark8 −77)', () => {
    expect(readFileSync('src/game/app.ts', 'utf8')).toMatch(/startsWith\('反傷'\)[^\n]*反傷（你攻擊/);
    const h = cause([{ turn: 9, taken: 77, big: { who: '反傷（你攻擊 X）', dmg: 77, charged: false } }], { who: '反傷（你攻擊 X）', dmg: 77, charged: false, maxHp: 1100, reflect: true });
    expect(h).toContain('反傷（你攻擊 X）'); expect(h).toContain('自己攻擊時的反傷');
  });
});
describe('cp9-rc3 bug 5: death tip is never empty or generic', () => {
  it('potion on cooldown / potions left / none / reflect each get their own text', () => {
    const t = (o: Partial<Parameters<typeof deathTip>[0]>) => deathTip({ lastDmg: 300, maxHp: 1000, pots: 0, potCd: 0, ...o });
    expect(t({ pots: 2, potCd: 1 })).toContain('冷卻'); expect(t({ pots: 3 })).toContain('還剩 3 瓶'); expect(t({})).toContain('用完');
    expect(t({ reflect: true })).toContain('反傷'); expect(t({ charged: true })).toContain('D·防禦');
    for (const o of [{}, { pots: 1 }, { pots: 1, potCd: 2 }, { reflect: true }]) expect(t(o)).not.toContain('慢慢磨光');
  });
});
describe('cp9-rc3 bugs 2/4 (UI source)', () => {
  const s = readFileSync('src/game/app.ts', 'utf8');
  it('bug 2: the bleed / burn 「解除」 hints offer Z only when the potion is usable', () => { expect(s).not.toContain('解除：Z·生命藥水 或 D·防禦</span>'); expect(s).not.toContain('（Z·生命藥水 或 D·防禦 可解除）'); });
  it('bug 4: no 「秒後自動執行」 nag; the key is still queued (holdKey)', () => { expect(s).not.toContain('秒後自動執行'); expect(s).toMatch(/this\.holdKey = cmd/); });
});
