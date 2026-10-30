import { describe, it, expect } from 'vitest';
import { RUN12AG, mob12ag, boss12ag } from '../src/core/cp8';
describe('rc12ag 調參', () => {
  it('mob12ag：F55 前為 1，F75 達 mobK', () => {
    expect(mob12ag(50, 'oc')).toBe(1);
    expect(mob12ag(75, 'oc')).toBeCloseTo(RUN12AG.mobK.oc!);
    expect(mob12ag(75, 'arcane')).toBe(1);
  });
  it('boss12ag 只作用 F45–69', () => {
    expect(boss12ag(40, 'blade')).toBe(1);
    expect(boss12ag(50, 'blade')).toBeCloseTo(RUN12AG.bossK.blade!);
    expect(boss12ag(70, 'blade')).toBe(1);
  });
  it('oc 前段首領藥水關閉', () => { expect(RUN12AG.potEarly.oc).toBe(0); expect(RUN12AG.potEarly.blade).toBe(1); });
});
import { curveSchool12g } from '../src/core/cp8';
describe('rc12ag 2：沒選派不推派', () => {
  it('無 lean 時不論武器都回 undefined；有 lean 回 lean', () => {
    expect(curveSchool12g({ equipped: { mainHand: { group: 'oneHand' } } })).toBeUndefined();
    expect(curveSchool12g({ equipped: { mainHand: { group: 'twoHand' } } })).toBeUndefined();
    expect(curveSchool12g({ lean: 'oc', equipped: {} })).toBe('oc');
  });
});
import { readFileSync } from 'node:fs';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, TURN_HOOK9, ACT_HOOK12AF } from '../src/core/auto';
import { RULES } from '../src/core/run';
import { roundRange12ad, roundEstimate, chargeAdvice, defHeal12ag, hiRound12ag, topRoll12af } from '../src/core/battle';
describe('rc12ag 5：面板上限', () => {
  it('hi ≥ 每隻怪最高擲骰暴擊總和、≥ ★ 用的 roundEstimate；實際受傷不超過 hi；★ 不受影響', () => {
    RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
    const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
    const P0 = presetPlayer((JSON.parse(readFileSync('public/data/cp6-presets.json', 'utf8')) as Record<string, Preset>)['postF20-oc']!);
    let pre: { hi: number } | null = null, over = 0, seen = 0, starSame = true;
    TURN_HOOK9.fn = (b) => { const r = roundRange12ad(b); if (!r) { pre = null; return; } seen++;
      const k1 = chargeAdvice(b).text; expect(r.hi).toBeGreaterThanOrEqual(Math.round(topRoll12af(() => roundEstimate(b, true, false))));
      expect(r.hi).toBe(Math.round(hiRound12ag(b))); expect(defHeal12ag(b)).toBeGreaterThanOrEqual(0); if (chargeAdvice(b).text !== k1) starSame = false; pre = r; };
    ACT_HOOK12AF.fn = (b, ev) => { if (!pre) return; const t = ev.filter((e) => e.t === 'hit' && (e as { to?: string }).to === 'player').reduce((s, e) => s + (e as { dmg: number }).dmg, 0); if (t > pre.hi) over++; pre = null; };
    try { for (let s = 1; s <= 3; s++) { const p = structuredClone(P0); autoRun(p, pool, s * 1000 + 101, 'buff:oc', { mode: 'counter', retreat: 0, abyss: 1, cap: 40, ms: 0 }); } }
    finally { TURN_HOOK9.fn = null; ACT_HOOK12AF.fn = null; }
    expect(seen).toBeGreaterThan(0); expect(over).toBe(0); expect(starSame).toBe(true);
  });
});
describe('rc12ag 5：面板文字', () => {
  it('受到的傷害與防禦回血後淨 HP 分兩行', () => {
    const src = readFileSync('src/game/app.ts', 'utf8');
    expect(src).toContain('防禦時受到的傷害約'); expect(src).toContain('data-defnet'); expect(src).toContain('後的淨 HP 約'); expect(src).not.toContain('· 防禦後約');
  });
});
