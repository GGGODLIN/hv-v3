import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BUFFS, combos, formed, migrateBonus, schoolCounts, SCHOOLS, sumMods } from '../src/core/buffs';
import { RULES } from '../src/core/run';

describe('CP4 step 1: buff data', () => {
  it('flag defaults off', () => expect(RULES.cp4RunBuffs).toBe(false));
  it('pool is 30-40 with three rarities, bulwark has 8', () => {
    expect(BUFFS.length).toBeGreaterThanOrEqual(30); expect(BUFFS.length).toBeLessThanOrEqual(40);
    const r = (x: string) => BUFFS.filter((b) => b.rarity === x).length;
    expect([r('common'), r('rare'), r('legend')]).toEqual([21, 13, 6]);
    expect(schoolCounts(BUFFS.map((b) => b.id)).bulwark).toBe(8);
    for (const s of SCHOOLS) expect(BUFFS.filter((b) => b.school === s && b.core).length).toBe(1);
    expect(new Set(BUFFS.map((b) => b.id)).size).toBe(BUFFS.length);
  });
  it('every mod key is in the doc §1 variable list', () => {
    const ok = new Set(['adbPct', 'mdbPct', 'hpPct', 'mpPct', 'spPct', 'physAccPct', 'magAccPct', 'physCrit', 'magCrit', 'critMod', 'spellCritMod', 'evade', 'parry', 'block', 'physMit', 'magMit', 'specMitAll', 'edb', 'edbAll', 'manaCons', 'counterResist',
      'ocGain', 'ocCap', 'ocOpen', 'bossOc', 'ssDamage', 'ssSpPct', 'focOcPct', 'focMpPct', 'skillCd', 'skillOcPct', 'itemCd', 'bleedMult', 'weakMult', 'defHpPct', 'bashStun', 'dropAccelMult', 'priceMult', 'qualityBump']);
    for (const b of BUFFS) for (const m of [b.d, b.b, b.r]) for (const k of Object.keys(m ?? {})) expect(ok.has(k), `${b.id}.${k}`).toBe(true);
    const doc = readFileSync('docs/cp4-run-buffs.md', 'utf8');
    for (const b of BUFFS) expect(doc.includes(`| ${b.id} |`), b.id).toBe(true);
  });
  it('sums, combos and formed', () => {
    expect(sumMods(['B2', 'S-might']).d.adbPct).toBeCloseTo(0.25);
    expect(sumMods(['A2', 'A1']).d.edb?.fire).toBe(15);
    expect(combos(['B2', 'B3', 'B4']).blade).toBe(true);
    expect(combos(['B2', 'B3', 'O2', 'O3']).bladeOc).toBe(true);
    expect(formed(['B1', 'B2'])).toEqual(['blade']);
    expect(formed(['B2', 'B3'])).toEqual([]);
  });
  it('old save bonus migrates to S-might / S-vigor (decision 4)', () => {
    const run = { bonus: { dmg: 0.3, hp: 0.2 } } as { bonus: { dmg: number; hp: number }; buffs?: string[] };
    migrateBonus(run);
    expect(run.buffs).toEqual(['S-might', 'S-might', 'S-vigor']);
    expect(run.bonus).toEqual({ dmg: 0, hp: 0 });
  });
});

import { deserialize, SAVE_VERSION } from '../src/core/save';
describe('CP4 step 1: save migration', () => {
  const raw = (bonus: object) => JSON.stringify({ v: SAVE_VERSION, player: { name: 'x' }, run: { bonus }, settings: {}, stats: {} });
  it('flag off: CP3 save loads untouched', () => {
    const s = deserialize(raw({ dmg: 0.15, hp: 0.2 }))!;
    expect(s.run!.bonus).toEqual({ dmg: 0.15, hp: 0.2 }); expect(s.run!.buffs).toBeUndefined();
  });
  it('flag on: CP3 save bonus becomes buffs', () => {
    RULES.cp4RunBuffs = true;
    try {
      const s = deserialize(raw({ dmg: 0.15, hp: 0.2 }))!;
      expect(s.run!.buffs).toEqual(['S-might', 'S-vigor']); expect(s.run!.bonus).toEqual({ dmg: 0, hp: 0 });
    } finally { RULES.cp4RunBuffs = false; }
  });
});
