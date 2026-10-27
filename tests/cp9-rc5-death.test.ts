// cp9-rc5（自訂，暫定）: QA rc4 bugs — death headline = lethal turn total; potion-on-cooldown tip.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { deathHeadline, deathTip } from '../src/core/battle';

describe('cp9-rc5 bug 1: death headline uses the lethal turn total', () => {
  it('oc8: turn -375 with a 97 last hit → headline 375 (50%)', () => {
    const r = [{ turn: 10, taken: 375 }, { turn: 11, taken: 0 }, { turn: 12, taken: 375 }];
    const h = deathHeadline(r, { who: '風尾戰士', label: '蓄力一擊！', dmg: 97, charged: true }, 750);
    expect(h).toContain('第 12 回合共受 375 傷害（佔最大 HP 50%）');
    expect(h).toContain('最後一擊是 （蓄力大招）風尾戰士 蓄力一擊！ 97');
    expect(h).not.toMatch(/最後一擊 97 傷害/);
  });
  it('bulwark: 200 single hit inside a -337 turn → 337 (43%)', () => {
    expect(deathHeadline([{ turn: 5, taken: 337 }], { who: 'x', dmg: 200, charged: false }, 784)).toContain('共受 337 傷害（佔最大 HP 43%）');
  });
  it('app headline is built from deathHeadline (same number as the turn log)', () => {
    const src = readFileSync('src/game/app.ts', 'utf8');
    expect(src).toContain('${deathHeadline(r, last, maxHp, esc)}');
    expect(src).not.toContain("最後一擊 ${last.dmg} 傷害（佔最大 HP");
  });
});

describe('cp9-rc5 bug 2: cooldown is not "used up"', () => {
  it('pots left + cooldown → cooldown wording, never 已用完', () => {
    for (const pots of [4, 22]) {
      const t = deathTip({ lastDmg: 97, maxHp: 750, pots, potCd: 1, charged: true });
      expect(t).toContain('還在冷卻');
      expect(t).toContain(`剩 ${pots} 瓶`);
      expect(t).not.toContain('已用完');
    }
  });
  it('app reads a per-turn potion snapshot, since this.battle is null on the death screen', () => {
    const src = readFileSync('src/game/app.ts', 'utf8');
    expect(src).toContain('this.potSnap = { pots: b.potions.health, cd: b.itemCd.health }');
    expect(src.match(/this\.potSnap\?\.pots \?\? 0/g)?.length).toBe(2);
  });
});
