import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { newPlayer } from '../src/core/player';
import { RULES, abyssCarryAt, settle, startAbyss, startRun } from '../src/core/run';
import { starterKit } from '../src/core/auto';
import { abyssCarry, abyssDangerHint, tierZh, TIER_ZH, DIFF } from '../src/core/abyss';
import { dangerHint } from '../src/core/cp5';

describe('CP6 rc3 fixes', () => {
  let was = false;
  beforeAll(() => { was = RULES.cp6Abyss; RULES.cp6Abyss = true; RULES.cp5Bosses = true; });
  afterAll(() => { RULES.cp6Abyss = was; });
  it('1: abyss carry is 1+0.05×tier, map value = settlement value', () => {
    const p = newPlayer(); starterKit(p, 1);
    const r = startAbyss(p, 3, 16); r.done = 'retreat';
    expect(abyssCarryAt(r)).toBe(abyssCarry(16)); expect(abyssCarry(16)).toBeCloseTo(1.1);
    const s = settle(p, r); expect(s.mult).toBe(abyssCarryAt(r)); expect(s.abyss).toBe(true);
  });
  it('2: settlement floor is the abyss depth reached, not floor 1', () => {
    const p = newPlayer(); starterKit(p, 1);
    const r = startAbyss(p, 3, 11); r.done = 'dead';
    expect(settle(p, r).floor).toBe(11);
  });
  it('2: main-tower settlement unchanged (no abyss field)', () => {
    const p = newPlayer(); starterKit(p, 1);
    const r = startRun(p, 3); r.done = 'retreat'; const s = settle(p, r);
    expect(s.floor).toBe(1); expect('abyss' in s).toBe(false);
  });
  it('5: tier names are 中文（英文）, one per DIFF tier', () => {
    expect(TIER_ZH.length).toBe(DIFF.length);
    TIER_ZH.forEach((t, i) => expect(t).toContain(`（${DIFF[i]!.zh}）`));
    expect(tierZh(16)).toBe('惡夢（Nightmare）');
  });
  it('6: abyss 3-affix and physical-hard sets warn; CP5 dangerHint unchanged', () => {
    expect(dangerHint(['spikes', 'hard'])).toBeNull();
    expect(abyssDangerHint(['spikes'])).toContain('克制物理');
    expect(abyssDangerHint(['leech', 'swift', 'split'])).toContain('三詞綴');
    expect(abyssDangerHint(['leech'])).toBeNull();
    expect(abyssDangerHint(['warded', 'leech'])).toBe(dangerHint(['warded', 'leech']));
    expect(abyssDangerHint(['spikes', 'split', 'swift'])!.startsWith('⚠ 高危險精英（尖刺＋')).toBe(true);
  });
});
