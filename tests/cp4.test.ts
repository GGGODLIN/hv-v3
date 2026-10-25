import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BUFFS, combos, formed, migrateBonus, schoolCounts, SCHOOLS, sumMods } from '../src/core/buffs';
import { RULES, startRun as startRunP } from '../src/core/run';
import { buffPreview } from '../src/game/buffpreview';
import { newPlayer as newPlayerP } from '../src/core/player';

describe('CP4 step 1: buff data', () => {
  it('flag defaults on (CP4 accepted)', () => expect(RULES.cp4RunBuffs).toBe(true));
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
    expect(sumMods(['B2', 'S-might']).d.adbPct).toBeCloseTo(0.3);
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
    const was = RULES.cp4RunBuffs; RULES.cp4RunBuffs = false;
    try {
      const s = deserialize(raw({ dmg: 0.15, hp: 0.2 }))!;
      expect(s.run!.bonus).toEqual({ dmg: 0.15, hp: 0.2 }); expect(s.run!.buffs).toBeUndefined();
    } finally { RULES.cp4RunBuffs = was; }
  });
  it('flag on: CP3 save bonus becomes buffs', () => {
    RULES.cp4RunBuffs = true;
    try {
      const s = deserialize(raw({ dmg: 0.15, hp: 0.2 }))!;
      expect(s.run!.buffs).toEqual(['S-might', 'S-vigor']); expect(s.run!.bonus).toEqual({ dmg: 0, hp: 0 });
    } finally { RULES.cp4RunBuffs = true; }
  });
});

import { act, startBattle, skillOc, type BattleState } from '../src/core/battle';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { armBattle, encounter, openingOc, runDerived, startRun } from '../src/core/run';
import { starterKit } from '../src/core/auto';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const on = <T,>(f: () => T): T => { RULES.cp4RunBuffs = true; try { return f(); } finally { RULES.cp4RunBuffs = true; } };

describe('CP4 step 2: buffs apply as run-layer mods', () => {
  const p = newPlayer(); starterKit(p);
  it('flag off: buffs held have no effect', () => {
    RULES.cp4RunBuffs = false;
    try {
      const r = startRun(p, 3); r.buffs = ['B2', 'W4', 'O3'];
      expect(runDerived(p, r)).toEqual(derive(p));
      const b = startBattle(derive(p), { hp: 1, mp: 1, sp: 1 }, [], p.potions); armBattle(b, r);
      expect(b.mods).toBeUndefined(); expect(openingOc(p, 'battle', r)).toBe(0);
    } finally { RULES.cp4RunBuffs = true; }
  });
  it('flag on: derived mods and opening OC', () => on(() => {
    const r = startRun(p, 3); r.buffs = ['B2', 'W4', 'O3'];
    const d0 = derive(p), d = runDerived(p, r);
    expect(d.adb).toBeCloseTo(d0.adb * 1.15); expect(d.hp).toBe(Math.round(d0.hp * 1.12));
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

import { coreFloor, eligible, merchantBuffs, openOffer, rollBuffs, takeBuff } from '../src/core/buffoffer';
import { BUFF } from '../src/core/buffs';
import { prog } from '../src/core/progress';
describe('CP4 step 3: acquisition', () => {
  const p = newPlayer(); starterKit(p);
  it('offers do not touch the run RNG stream', () => on(() => {
    const r = startRun(p, 11); const rng0 = r.rng;
    openOffer(p, r, 'elite'); expect(r.rng).toBe(rng0); expect(r.offer!.ids.length).toBe(3);
  }));
  it('boss offers always include a rare or legend; merchant never legend (decision 7)', () => on(() => {
    for (let s = 1; s < 200; s++) {
      const r = startRun(p, s);
      expect(rollBuffs(p, r, 'boss', 3).some((id) => BUFF[id]!.rarity !== 'common')).toBe(true);
      for (const x of merchantBuffs(p, r)) expect(BUFF[x.id]!.rarity).not.toBe('legend');
    }
  }));
  it('core guaranteed after 2 of a school', () => on(() => {
    const r = startRun(p, 2); r.buffs = ['B2', 'B3'];
    expect(rollBuffs(p, r, 'shrine', 3)).toContain('B1');
  }));
  it('r3: bulwark combo ripostes after an evade (normal physHit, 暫定 ×0.8)', () => on(() => {
    const r = startRun(p, 3); r.buffs = BUFFS.filter((b) => b.school === 'bulwark').slice(0, 4).map((b) => b.id);
    const m = buildMonster(pool.rows[0]!, 5, 'normal'); m.hp = m.maxHp = 1e9; m.evade = m.parry = 0;
    const b = startBattle(runDerived(p, r), { hp: 999, mp: 999, sp: 99 }, [m], p.potions); armBattle(b, r);
    expect(b.mods?.combo.bulwark).toBe(true);
    b.d = { ...b.d, evade: 1 };
    const ev = act(b, { kind: 'attack', target: 0 }, new Rng(4));
    expect(ev.some((e) => e.t === 'hit' && e.label === '反擊')).toBe(true);
  }));
  it('r3: -nofloor strategy turns both core guarantees off only for that run', () => on(() => {
    coreFloor.on = false;
    try {
      const r = startRun(p, 2); r.buffs = ['B2', 'B3'];
      let hits = 0; for (let i = 0; i < 20; i++) if (rollBuffs(p, r, 'shrine', 3).includes('B1')) hits++;
      expect(hits).toBeLessThan(20);
    } finally { coreFloor.on = true; }
  }));
  it('locked systems gate buffs', () => {
    const q = newPlayer(); prog(q).unlocked = ['defend', 'potion'];
    expect(eligible(q, BUFF['A2']!)).toBe(false); expect(eligible(q, BUFF['B2']!)).toBe(true);
  });
  it('takeBuff stores and clears the offer', () => on(() => {
    const r = startRun(p, 2); openOffer(p, r, 'shrine'); const id = r.offer!.ids[0]!;
    takeBuff(p, r, id); expect(r.buffs).toEqual([id]); expect(r.offer).toBeNull();
  }));
});

import { openShrine, takeRisk } from '../src/core/buffoffer';
describe('CP4 step 4: shrine risks', () => {
  const p = newPlayer(); starterKit(p);
  const mk = () => { const r = startRun(p, 21); r.buffs = []; return r; };
  it('shrine opens a 3-choice plus one risk', () => on(() => { const r = mk(); const s = openShrine(p, r); expect(s.ids.length).toBe(3); expect(r.risk).toBe(s.risk); }));
  it('blood: -30% HP, rare-only offer', () => on(() => { const r = mk(); r.hp = 100; takeRisk(p, r, 'blood'); expect(r.hp).toBe(70); expect(r.offer!.ids.every((id) => BUFF[id]!.rarity === 'rare')).toBe(true); }));
  it('tithe: pays 40% credits', () => on(() => { const r = mk(); r.credits = 100; takeRisk(p, r, 'tithe'); expect(r.credits).toBe(60); expect(r.offer!.ids.length).toBe(3); }));
  it('curse: random legend, mitigation -5%', () => on(() => {
    const r = mk(); takeRisk(p, r, 'curse'); expect(BUFF[r.buffs![0]!]!.rarity).toBe('legend');
    const d = runDerived(p, r), r2 = mk(); r2.buffs = [...r.buffs!]; const d2 = runDerived(p, r2);
    expect(d.physMit).toBeCloseTo(Math.max(0, d2.physMit - 0.05));
  }));
  it('discard: removes and offers same rarity', () => on(() => { const r = mk(); r.buffs = ['B2']; takeRisk(p, r, 'discard', 'B2'); expect(r.buffs).toEqual([]); expect(r.offer!.ids.every((id) => BUFF[id]!.rarity === 'common')).toBe(true); }));
  it('gamble: either a common buff or OC 0 next battle (ignores O3)', () => on(() => {
    let lost = 0, won = 0;
    for (let s = 1; s < 40; s++) {
      const r = startRun(p, s); r.buffs = ['O3']; takeRisk(p, r, 'gamble');
      if (r.ocZeroNext) {
        lost++; expect(openingOc(p, 'battle', r)).toBe(0);
        const b = startBattle(derive(p), { hp: 1, mp: 1, sp: 1 }, [], p.potions); b.oc = 30; armBattle(b, r); expect(b.oc).toBe(0); expect(r.ocZeroNext).toBe(false);
      } else { won++; expect(r.buffs!.length).toBe(2); }
    }
    expect(lost).toBeGreaterThan(5); expect(won).toBeGreaterThan(5);
  }));
});

import { OFFER_RARITY, winOffers } from '../src/core/buffoffer';
import { autoRun } from '../src/core/auto';
describe('CP4 step 6: tuning + sim strategies', () => {
  const p = newPlayer(); starterKit(p);
  it('first-slot rarity matches OFFER_RARITY within ±1pp over 100k draws', () => on(() => {
    const r = startRun(p, 5);
    for (const src of ['shrine', 'elite'] as const) {
      const n = 100000; const c = { common: 0, rare: 0, legend: 0 };
      for (let i = 0; i < n; i++) c[BUFF[rollBuffs(p, r, src, 1)[0]!]!.rarity]++;
      const w = OFFER_RARITY[src]; const tot = w[0] + w[1] + w[2];
      expect(Math.abs(c.common / n - w[0] / tot)).toBeLessThan(0.01);
      expect(Math.abs(c.rare / n - w[1] / tot)).toBeLessThan(0.01);
      expect(Math.abs(c.legend / n - w[2] / tot)).toBeLessThan(0.01);
    }
  }));
  it('win offers: boss 1, elite on 1st/4th elite win', () => {
    const r = startRun(p, 1);
    expect(winOffers('boss', r)).toBe(1); expect(winOffers('battle', r)).toBe(0);
    expect([1, 2, 3, 4].map(() => winOffers('elite', r))).toEqual([1, 0, 0, 1]);
  });
  it('buff strategies turn the flag on only inside the run and record buffs', () => {
    const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
    const q = newPlayer(); starterKit(q, 3);
    RULES.cp4RunBuffs = false;
    let rep;
    try { rep = autoRun(q, pool, 3001, 'buff:blade'); expect(RULES.cp4RunBuffs).toBe(false); } finally { RULES.cp4RunBuffs = true; }
    expect(rep.cp4).toBeDefined();
    const q2 = newPlayer(); starterKit(q2, 3);
    expect(autoRun(q2, pool, 3001, 'human').cp4).toBeUndefined();
  });
});

describe('CP4 decision 2026-10-25 #1: formation', () => {
  const p = newPlayer(); starterKit(p);
  it('formed = core + 1 of the same school; 3 without core is not formed', () => {
    expect(formed(['B1', 'B2'])).toEqual(['blade']);
    expect(formed(['B2', 'B3', 'B4'])).toEqual([]);
  });
  it('holding 1 of a school guarantees a same-school option (its core while unheld)', () => on(() => {
    for (let s = 1; s < 300; s++) {
      const r = startRun(p, s); r.buffs = ['W2'];
      expect(rollBuffs(p, r, 'shrine', 3)).toContain('W1');
      r.buffs = ['W1'];
      expect(rollBuffs(p, r, 'elite', 3).some((id) => BUFF[id]!.school === 'bulwark')).toBe(true);
    }
  }));
});

describe('CP4 r2 step 3: buff preview', () => {
  it('shows before -> after for derived, battle and formed rows', () => {
    const was = RULES.cp4RunBuffs; (RULES as { cp4RunBuffs: boolean }).cp4RunBuffs = true;
    try {
      const p = newPlayerP(); const run = startRunP(p, 7); run.buffs = ['B2'];
      const b1 = buffPreview(p, run, 'B1');
      const adb = b1.find((r) => r.k === 'adb')!; expect(Number(adb.after)).toBeGreaterThan(Number(adb.before));
      expect(b1.find((r) => r.k === 'critMod')).toBeTruthy();
      expect(b1.find((r) => r.k === 'formed')?.after).toBe('刃鋒');
      expect(buffPreview(p, run, 'O2').find((r) => r.k === 'b.ocGain')).toMatchObject({ before: '+0', after: '+2' });
      expect(buffPreview(p, run, 'B7').find((r) => r.k === 'cd.mercifulBlow')?.after).toBeDefined();
    } finally { (RULES as { cp4RunBuffs: boolean }).cp4RunBuffs = was; }
  });
});

describe('CP4 r2 step 4: nocore control strategy', () => {
  it('buff:blade takes the core first, buff:blade-nocore keeps offer order among own-school buffs', async () => {
    const { prefBuff } = await import('../src/core/auto');
    const rng = { int: () => 0 } as never;
    expect(prefBuff(['B2', 'B1', 'W2'], 'buff:blade', rng)).toBe('B1');
    expect(prefBuff(['B2', 'B1', 'W2'], 'buff:blade-nocore', rng)).toBe('B2');
    expect(prefBuff(['W2', 'N1', 'B1'], 'buff:blade-nocore', rng)).toBe('B1');
  });
});
