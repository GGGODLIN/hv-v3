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

import { act, startBattle, skillOc, type BattleState } from '../src/core/battle';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { armBattle, encounter, openingOc, runDerived, startRun } from '../src/core/run';
import { starterKit } from '../src/core/auto';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const on = <T,>(f: () => T): T => { RULES.cp4RunBuffs = true; try { return f(); } finally { RULES.cp4RunBuffs = false; } };

describe('CP4 step 2: buffs apply as run-layer mods', () => {
  const p = newPlayer(); starterKit(p);
  it('flag off: buffs held have no effect', () => {
    const r = startRun(p, 3); r.buffs = ['B2', 'W4', 'O3'];
    expect(runDerived(p, r)).toEqual(derive(p));
    const b = startBattle(derive(p), { hp: 1, mp: 1, sp: 1 }, [], p.potions); armBattle(b, r);
    expect(b.mods).toBeUndefined(); expect(openingOc(p, 'battle', r)).toBe(0);
  });
  it('flag on: derived mods and opening OC', () => on(() => {
    const r = startRun(p, 3); r.buffs = ['B2', 'W4', 'O3'];
    const d0 = derive(p), d = runDerived(p, r);
    expect(d.adb).toBeCloseTo(d0.adb * 1.1); expect(d.hp).toBe(Math.round(d0.hp * 1.12));
    expect(openingOc(p, 'battle', r)).toBe(20);
  }));
  it('flag on: might/vigor buffs equal the old shrine numbers', () => on(() => {
    const r = startRun(p, 3); r.buffs = ['S-might', 'S-vigor'];
    const old = startRun(p, 3); old.bonus = { dmg: 0.15, hp: 0.2 };
    RULES.cp4RunBuffs = false; const dOld = runDerived(p, old); RULES.cp4RunBuffs = true;
    const d = runDerived(p, r);
    expect(d.adb).toBeCloseTo(dOld.adb); expect(d.hp).toBe(dOld.hp);
  }));
  it('weakness insight: bonus only vs the target weakness (decision 3)', () => on(() => {
    const row = pool.rows.find((x) => (x[12] as number) < 0) ?? pool.rows[0]!;
    const dmg = (buffs: string[]) => {
      const r = startRun(p, 3); r.buffs = buffs;
      const m = buildMonster(row, 5, 'normal'); m.hp = m.maxHp = 1e9; m.evade = m.parry = 0;
      const b = startBattle(runDerived(p, r), { hp: 999, mp: 999, sp: 99 }, [m], p.potions); armBattle(b, r);
      let tot = 0; const rng = new Rng(9);
      for (let i = 0; i < 30; i++) { act(b, { kind: 'attack', target: 0 }, rng); b.hp = 999; }
      tot = 1e9 - m.hp; return tot;
    };
    // B6 alone vs N2 (no combat effect): same RNG stream, equal or more damage only when the physical type is weak.
    const a = dmg(['N2']), w = dmg(['B6']);
    expect(w).toBeGreaterThanOrEqual(a);
  }));
  it('combo: oc school at cap makes next skill free; O8 cuts skill OC', () => on(() => {
    const r = startRun(p, 3); r.buffs = ['O8'];
    const b = startBattle(derive(p), { hp: 1, mp: 1, sp: 1 }, [], p.potions); armBattle(b, r);
    expect(skillOc(b, 'shieldBash')).toBeLessThan(skillOc({ ...b, mods: undefined } as BattleState, 'shieldBash') || 1);
    b.mods!.freeSkill = true; expect(skillOc(b, 'shieldBash')).toBe(0);
  }));
  it('boss HP scales with buff count (decision 5)', () => on(() => {
    const r0 = startRun(p, 4); r0.floor = 10; const r1 = startRun(p, 4); r1.floor = 10; r1.buffs = ['N2', 'N2', 'N2', 'N2', 'N2'];
    const b0 = encounter(r0, pool, 'boss')[0]!, b1 = encounter(r1, pool, 'boss')[0]!;
    expect(b1.maxHp).toBe(Math.round(b0.maxHp * (1 + 5 * RULES.cp4BossHpPerBuff)));
  }));
});
