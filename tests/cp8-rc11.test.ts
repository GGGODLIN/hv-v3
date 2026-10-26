import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RULES } from '../src/core/run';
import { autoAllocate, nextPointCosts } from '../src/core/auto';
import { unspentExp, level } from '../src/core/player';
import { expForLevel } from '../src/core/formulas';
import { HEALTH_POTION_CD, whyNot } from '../src/core/battle';

const presets = JSON.parse(readFileSync('public/data/cp6-presets.json', 'utf8'));
const withCp8 = <T>(f: () => T): T => { const o = { ...RULES }; Object.assign(RULES, { cp5Bosses: true, cp6Abyss: true, cp7: true, cp8: true }); try { return f(); } finally { Object.assign(RULES, o); } };

describe('cp8-rc11 4(b): 全部處理 leaves no buyable point; 下一級 is EXP to earn', () => {
  // playtest: bulwark 39 left / oc 56 left with 「下一級需 20-21」. Reproduce with the presets plus extra trip EXP.
  for (const sc of ['oc', 'bulwark', 'blade', 'arcane']) for (const add of [0, 39, 56, 137, 1000, 5000]) it(`${sc} +${add}`, () => withCp8(() => {
    const p = JSON.parse(JSON.stringify(presets['postF20-' + sc].player)); p.lean = sc; p.exp += add;
    autoAllocate(p);
    const left = unspentExp(p), nc = nextPointCosts(p);
    expect(left).toBeLessThan(nc.auto!.cost); // nothing 全部處理 may buy is still affordable
    const gap = expForLevel(level(p) + 1) - p.exp;
    expect(gap).toBeGreaterThan(0);
    // spending more EXP never changes the level: level depends on total exp only
    const lv = level(p); p.attrs.str += 1; expect(level(p)).toBe(lv);
  }));
});

describe('cp8-rc11 potion', () => {
  it('health potion cooldown 5 (暫定、非原版); empty wins over cooldown', () => {
    expect(HEALTH_POTION_CD).toBe(5);
    const s = { potions: { health: 0 }, itemCd: { health: 3 } } as never;
    expect(whyNot(s, { kind: 'item', id: 'health' })).toBe('藥水用完了');
  });
});
