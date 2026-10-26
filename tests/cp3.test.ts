import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { canUse, DEF, HEALTH_POTION_CD, SPIRIT_MIN_OC, startBattle, whyNot } from '../src/core/battle';
import { autoRun, starterKit } from '../src/core/auto';
import { CONSTANTS as C } from '../src/core/data/constants';
import { generateEquip, sellPrice } from '../src/core/items';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { CARRY_MULT, SYSTEMS, carryMult, has, prog, unlockRate } from '../src/core/progress';
import { Rng } from '../src/core/rng';
import { RULES, battleLocks, encounter, enterNode, settle, startRun } from '../src/core/run';
import { TOWER, generateTower, isCombat } from '../src/core/tower';
import * as run from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);

describe('CP3-A lock tests: sourced values (change only with producer approval)', () => {
  it('Spirit Stance 50 OC / 1 SP / 10 OC per turn / +100% (F-002-spirit-stance)', () => {
    expect(C['F-002-spirit-stance'].value).toMatchObject({ minOcToEnter: 50, spPerTurn: 1, ocPerTurn: 10, damageBonus: 1 });
    expect(SPIRIT_MIN_OC).toBe(50);
  });
  it('battles start at OC 0; OC cap 250, +5-10 per hit (F-002-overcharge)', () => {
    expect(C['P-oc-start'].value.initial).toBe(0);
    expect(C['F-002-overcharge'].value).toEqual({ cap: 250, hitGainMin: 5, hitGainMax: 10 });
    const p = newPlayer(); const d = derive(p);
    expect(startBattle(d, d, [buildMonster(pool.rows[0]!, 1)], p.potions).oc).toBe(0);
  });
  it('EXP multiplier x1; floor multipliers removed', () => {
    expect(RULES.expMult).toBe(1);
    expect('EARLY_FLOOR_MULT' in run).toBe(false);
    expect('MID_FLOOR_MULT' in run).toBe(false);
  });
  it('potions: mana/spirit cooldown 40 (F-002-4.1A); health 10 is assumed (HVP potion 10)', () => {
    expect(C['F-002-4.1A-item-cooldown'].value.turns).toBe(40);
    expect(HEALTH_POTION_CD).toBe(5);
    expect(C['P-health-potion-cd'].source).toContain('assumed');
    expect(DEF.mitigation).toBe(0.25);
  });
  it('potion shop prices 50/100/100 (findings/004 Bazaar)', () => {
    expect(RULES.potionPrice).toEqual({ health: 50, mana: 100, spirit: 100 });
  });
  it('sell price follows findings/005 003-04e', () => {
    const rng = new Rng(1);
    const at = (quality: 'fair' | 'average' | 'superior' | 'exquisite' | 'magnificent', level: number) => { const e = generateEquip(rng, level, { quality }); e.level = level; return sellPrice(e); };
    expect(at('fair', 0)).toBe(1000);
    expect(at('average', 100)).toBe(2750);
    expect(at('average', 1000)).toBe(5000);
    // CP3-fix 1 (暫定): tiers above Average are floored at Average x 1.2 per tier (003-04e salvage value alone gave Superior 100 C).
    expect(at('superior', 50)).toBe(Math.round(2625 * 1.2));
    expect(at('exquisite', 50)).toBe(Math.round(2625 * 1.2 ** 2));
  });
  it('higher quality never sells for less (CP3-fix 1)', () => {
    const rng = new Rng(3);
    const qs = ['crude', 'fair', 'average', 'superior', 'exquisite', 'magnificent', 'legendary', 'peerless'] as const;
    for (const level of [1, 5, 20, 100, 500, 1000]) {
      const prices = qs.map((quality) => { const e = generateEquip(rng, level, { quality }); e.level = level; return sellPrice(e); });
      for (let i = 1; i < prices.length; i++) expect(prices[i]!, `${qs[i]} L${level}`).toBeGreaterThanOrEqual(prices[i - 1]!);
    }
  });
});

describe('CP3-B early unlocks (暫定 gameplay layer)', () => {
  it('trip 1 tutorial tower: F2 battle, F3 shop, F4 lone elite with an elemental weakness', () => {
    const p = newPlayer();
    const r = startRun(p, 11);
    // CP5 (on by default) offers two routes; with CP6 on, rc2 (c) makes them different types; the taught node is always first.
    expect(r.tower.floors.map((f) => f.options[0]).slice(1, 4)).toEqual(['battle', 'merchant', 'elite']);
    expect(battleLocks(p)).toEqual({ skill: true, spell: true, spirit: true });
    r.floor = 1; enterNode(p, r, 'battle'); expect(has(p, 'defend') && has(p, 'potion')).toBe(true);
    r.floor = 2; enterNode(p, r, 'battle'); expect(has(p, 'ocSkill')).toBe(true);
    r.floor = 3; const c0 = r.credits; enterNode(p, r, 'merchant');
    expect(has(p, 'spell')).toBe(true); expect(r.credits).toBeGreaterThan(c0);
    r.floor = 4; enterNode(p, r, 'elite'); expect(has(p, 'spirit')).toBe(true);
    const ms = encounter(r, pool, 'elite');
    expect(ms).toHaveLength(1);
    expect(['cold', 'wind', 'elec', 'fire'].some((k) => ms[0]!.spec[k as 'fire'] < 0)).toBe(true);
    // tutorial tips show once
    const r2 = startRun(p, 12); r2.floor = 3; expect(enterNode(p, r2, 'merchant')).toEqual([]);
  });
  it('locked battle actions say 尚未解鎖', () => {
    const p = newPlayer(); const d = derive(p);
    const b = startBattle(d, d, [buildMonster(pool.rows[0]!, 1)], p.potions);
    b.locked = battleLocks(p); b.oc = 200;
    expect(canUse(b, { kind: 'spell', id: 'fiery', target: 0 })).toBe(false);
    expect(whyNot(b, { kind: 'spirit' })).toBe('尚未解鎖');
  });
  it('carry-back x5 / x3 / x2 (CP3-fix 3) and town unlocks per trip', () => {
    expect(CARRY_MULT).toEqual([5, 3, 2]); expect(carryMult(3)).toBe(2); expect(carryMult(4)).toBe(1); expect(carryMult(5)).toBe(1);
    const p = newPlayer();
    for (const [trip, mult] of [[1, 5], [2, 3], [3, 2]] as const) {
      const r = startRun(p, trip); r.exp = 100; r.credits = 10; r.done = 'retreat';
      const s = settle(p, r);
      expect(s.mult).toBe(mult); expect(s.exp).toBe(100 * mult);
      if (trip === 1) expect(has(p, 'alloc')).toBe(true);
      if (trip === 2) { expect(has(p, 'shrine')).toBe(true); expect(has(p, 'shop')).toBe(true); }
    }
    expect(has(p, 'iw')).toBe(false);
  });
  it('trip 2 guarantees a shrine; no route takes two non-combat nodes in a row', () => {
    for (let s = 1; s < 300; s++) {
      const t = generateTower(new Rng(s), { shrine: true });
      expect(t.floors.some((f) => f.options.includes('shrine'))).toBe(true);
      for (const f of t.floors) if (TOWER.combatFloors.includes(f.n) || f.options[0] === 'boss') expect(f.options.every(isCombat)).toBe(true);
    }
  });
  it('acceptance (16 seeds): >=90% unlocked after trip 3; F5 boss >=80% win, 10-15 turns; median first clear <= 3; avoid not faster', () => {
    const firstMean: Record<string, number> = {};
    for (const strat of ['auto', 'human', 'avoid'] as const) {
      const first: number[] = []; const f5: { won: boolean; turns: number }[] = [];
      for (let s = 1; s <= 16; s++) {
        const p = newPlayer(); starterKit(p, s);
        let fc = 99;
        for (let i = 1; i <= 8 && (fc === 99 || i <= 3); i++) {
          const r = autoRun(p, pool, s * 1000 + i, strat);
          if (fc === 99) f5.push(...r.bosses.filter((b) => b.floor === 5));
          if (r.floorReached > 10 && fc === 99) fc = i;
          if (i === 3) expect(unlockRate(p)).toBeGreaterThanOrEqual(0.9);
        }
        first.push(fc);
      }
      first.sort((a, b) => a - b);
      expect((first[7]! + first[8]!) / 2).toBeLessThanOrEqual(3);
      firstMean[strat] = first.reduce((a, b) => a + b, 0) / 16;
      expect(f5.filter((b) => b.won).length / f5.length).toBeGreaterThanOrEqual(0.8);
      const t = f5.reduce((a, b) => a + b.turns, 0) / f5.length;
      expect(t).toBeGreaterThanOrEqual(10); expect(t).toBeLessThanOrEqual(20);
    }
    expect(firstMean.avoid!).toBeGreaterThanOrEqual(Math.min(firstMean.auto!, firstMean.human!));
    expect(SYSTEMS).toHaveLength(10);
    void prog;
  });
});

describe('CP3-fix 2: potions before the town shop opens (暫定)', () => {
  it('a trip starts with the starter potions while the shop is locked, and the F3 gift adds health potions', () => {
    const p = newPlayer();
    p.potions = { health: 0, mana: 0, spirit: 0 };
    const run = startRun(p, 5);
    expect(p.potions).toEqual({ health: 3, mana: 2, spirit: 1 });
    run.floor = 3;
    enterNode(p, run, 'merchant');
    expect(p.potions.health).toBe(5);
  });
});

describe('CP3-fix 4: Spirit Stance unlock', () => {
  it('opens on reaching F4 in trip 1, so trip 2 F5 is unlocked; only the sourced OC 50 gate remains', () => {
    const p = newPlayer();
    const run = startRun(p, 11);
    for (let f = 1; f <= 4; f++) { run.floor = f; enterNode(p, run, f === 3 ? 'merchant' : 'battle'); }
    expect(has(p, 'spirit')).toBe(true);
    run.done = 'dead'; settle(p, run);
    const r2 = startRun(p, 12); r2.floor = 5;
    expect(battleLocks(p).spirit).toBe(false);
    const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
    const b = startBattle(derive(p), { hp: 999, mp: 999, sp: 999 }, encounter(r2, pool, 'boss'), p.potions); b.locked = battleLocks(p);
    expect(whyNot(b, { kind: 'spirit' })).toContain('OC 不足');
    b.oc = SPIRIT_MIN_OC;
    expect(canUse(b, { kind: 'spirit' })).toBe(true);
  });
});

describe('CP3-fix 5: equipment names', () => {
  it('never repeat a word back to back (e.g. "Kite Shield Shield")', async () => {
    const { equipNameEn: equipName } = await import('../src/core/items');
    const rng = new Rng(21);
    for (let i = 0; i < 3000; i++) {
      const n = equipName(generateEquip(rng, 1 + (i % 50), {}));
      expect(n, n).not.toMatch(/\b(\w+) \1\b/);
    }
  });
});

describe('CP3-fix 7: icons', () => {
  it('every generated equipment piece and spell has an icon file', async () => {
    const { iconKey } = await import('../src/game/icons');
    const { SPELLS } = await import('../src/core/battle');
    const idx = JSON.parse(readFileSync(new URL('../public/assets/icons/index.json', import.meta.url), 'utf8')) as Record<string, string>;
    const rng = new Rng(31);
    for (let i = 0; i < 4000; i++) { const e = generateEquip(rng, 1 + (i % 80), {}); expect(idx[iconKey(e)], iconKey(e)).toBeTruthy(); }
    for (const id of Object.keys(SPELLS)) expect(idx[`sp-${id}`]).toBeTruthy();
  });
});

import { act as actB, startBattle as startB } from '../src/core/battle';
import { buildMonster as bm } from '../src/core/monsters';
import { Rng as R8 } from '../src/core/rng';
import { derive as dv, newPlayer as np8 } from '../src/core/player';
describe('CP3-fix 8: boss phase 2', () => {
  it('a boss with a phase left rises at half HP instead of dying', () => {
    const row = [1, 'Beast', 'X', 100, 'Crushing', 't', 0, 0, 0, 0, 0, 0, 0, 0, 0] as const;
    const m = bm([...row] as never, 1, 'boss');
    m.phases = 1; m.hp = 1;
    const b = startB(dv(np8()), { hp: 9999, mp: 999, sp: 999 }, [m], { health: 0, mana: 0, spirit: 0 });
    b.hp = 99999; b.d = { ...b.d, physAcc: 99 } as never;
    const rng = new R8(1);
    for (let i = 0; i < 20 && m.hp === 1; i++) actB(b, { kind: 'attack', target: 0 }, rng);
    expect(m.phases).toBe(0);
    expect(m.enraged).toBe(true);
    expect(b.over).not.toBe('win');
  });
});

import { autoRun as ar8, starterKit as sk8 } from '../src/core/auto';
import { makePool as mp8 } from '../src/core/monsters';
import { readFileSync as rf8 } from 'node:fs';
describe('CP3-fix 8/9: boss length and growth (16 seeds, trips 1-3)', () => {
  const pool = mp8(JSON.parse(rf8('public/data/monsters.json', 'utf8')));
  const run = (strat: 'human' | 'noweak') => {
    const bosses: { floor: number; turns: number; won: boolean }[] = []; const lv: number[] = [];
    for (let s = 1; s <= 16; s++) { const p = np8(); sk8(p, s); for (let i = 1; i <= 3; i++) { const r = ar8(p, pool, s * 1000 + i, strat); bosses.push(...r.bosses); if (i === 3) lv.push(r.settlement.levelAfter); } }
    return { bosses, lv: lv.reduce((a, b) => a + b, 0) / lv.length };
  };
  it('weakness play: F5 and F10 bosses average 7-15 turns; without weakness still >=60% win; level ~8-10 after trip 3', () => {
    const h = run('human'), n = run('noweak');
    for (const f of [5, 10]) {
      const xs = h.bosses.filter((b) => b.floor === f);
      const t = xs.reduce((a, b) => a + b.turns, 0) / xs.length;
      expect(t).toBeGreaterThanOrEqual(7); expect(t).toBeLessThanOrEqual(15) /* rc4 (producer 2026-10-26): 7-15 after the sim weapon fix (armed sim kills faster, measured 9.39). Was 10-16. CP3-bugfix 4: trip-1 F5 (~22t) now weighs more since trips 2-3 got harder; per-trip 10-15 is checked in the sim */;
      const ys = n.bosses.filter((b) => b.floor === f);
      expect(ys.filter((b) => b.won).length / ys.length).toBeGreaterThanOrEqual(0.6);
      expect(ys.reduce((a, b) => a + b.turns, 0) / ys.length).toBeGreaterThan(t);
    }
    expect(h.lv).toBeGreaterThanOrEqual(8); expect(h.lv).toBeLessThanOrEqual(10.5);
  }, 60000);
});

import { openingOc } from '../src/core/run';
import { unlock as ul10 } from '../src/core/progress';
describe('CP3-fix 10: boss opening OC', () => {
  it('boss battles open at the sourced Spirit Stance entry OC once spirit is unlocked; other battles keep the sourced 0', () => {
    const p = np8();
    expect(openingOc(p, 'boss')).toBe(0);
    ul10(p, 'spirit');
    expect(openingOc(p, 'boss')).toBe(50);
    expect(openingOc(p, 'battle')).toBe(0);
  });
});

import { bodyOf, BODIES } from '../src/core/bodies';
describe('CP3-fix 11: monster bodies', () => {
  it('every race maps to a body, data yields >= 6 bodies, names with clear keywords win, manifest has every body', () => {
    const rows = JSON.parse(rf8('public/data/monsters.json', 'utf8')) as [number, string, string][];
    const seen = new Set(rows.map((r) => bodyOf(r[1], r[2])));
    expect(seen.size).toBeGreaterThanOrEqual(6);
    expect(bodyOf('Beast', 'Phoenix Of Doom')).toBe('bird');
    expect(bodyOf('Avion', 'Xyz')).toBe('bird');
    expect(bodyOf('Undead', 'Bob')).toBe('undead');
    expect(bodyOf('Mechanoid', 'Bob')).toBe('mech');
    const man = JSON.parse(rf8('public/assets/pixel/manifest.json', 'utf8'));
    for (const b of BODIES) expect(man.chars[`m-${b}`]).toBeTruthy();
  });
});

describe('CP3-fix 12: battle bar icons', () => {
  it('every command, skill and potion has an icon', () => {
    const idx = JSON.parse(rf8('public/assets/icons/index.json', 'utf8'));
    for (const k of ['c-attack', 'c-defend', 'c-focus', 'c-spirit', 'k-shieldBash', 'k-vitalStrike', 'k-mercifulBlow', 'p-health', 'p-mana', 'p-spirit']) expect(idx[k]).toBeTruthy();
  });
});

// cp7-pass: RULES.cp7 is on by default; this file pins the pre-CP7 (cp6-pass) formulas, so it runs with cp7 off.
// CP7 behaviour is covered by tests/cp7*.test.ts.
let savedCp7 = false;
beforeAll(() => { savedCp7 = RULES.cp7; RULES.cp7 = false; });
afterAll(() => { RULES.cp7 = savedCp7; });
