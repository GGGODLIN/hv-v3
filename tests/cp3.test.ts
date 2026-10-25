import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
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
    expect(HEALTH_POTION_CD).toBe(10);
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
    expect(r.tower.floors.map((f) => f.options.slice().sort().join('/')).slice(1, 4)).toEqual(['battle', 'merchant', 'elite']);
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
    expect(CARRY_MULT).toEqual([5, 3, 2]); expect(carryMult(5)).toBe(2);
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
      expect(t).toBeGreaterThanOrEqual(10); expect(t).toBeLessThanOrEqual(15);
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
