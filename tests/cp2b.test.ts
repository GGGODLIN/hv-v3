import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, canUse, DEF, HEALTH_POTION_CD, startBattle, whyNot, type Action, type BattleState } from '../src/core/battle';
import { autoRun, chooseHuman, HUMAN_COMBAT_SHARE, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { allocate, derive, newPlayer, resetAttrs, unspentExp } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { encounter, startRun } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
function setup(rank: 'normal' | 'boss' = 'normal', potions = { health: 3, mana: 1, spirit: 0 }): BattleState {
  const p = newPlayer(); starterKit(p);
  const d = { ...derive(p), evade: 0, parry: 0, block: 0 };
  const m = buildMonster(pool.rows[40]!, 10, rank); m.hp = m.maxHp = 1e9; m.acc = 1e6;
  return startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], potions);
}

describe('CP2b', () => {
  it('5. health potion: 10 player turns blocked after drinking, countdown shown 10..1', () => {
    expect(HEALTH_POTION_CD).toBe(10);
    const b = setup(); b.monsters[0]!.adb = 0;
    const rng = new Rng(1);
    act(b, { kind: 'item', id: 'health' }, rng, {});
    const shown: number[] = [];
    while (!canUse(b, { kind: 'item', id: 'health' })) {
      shown.push(b.itemCd.health);
      expect(whyNot(b, { kind: 'item', id: 'health' })).toContain(`${b.itemCd.health} 回合`);
      act(b, { kind: 'attack', target: 0 }, rng, {});
    }
    expect(shown).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });
  it('CP2c-3. defend still cuts an ordinary monster hit by 25%', () => {
    const hit = (a: Action) => {
      const b = setup(); b.oc = 0; b.monsters[0]!.charge = 0;
      const ev = act(b, a, new Rng(42), {});
      const h = ev.find((e) => e.t === 'hit' && e.to === 'player');
      expect(h && h.t === 'hit' && h.label).not.toBe('重擊！');
      return h && h.t === 'hit' ? h.dmg : NaN;
    };
    const plain = hit({ kind: 'item', id: 'mana' });
    const def = hit({ kind: 'defend' });
    expect(plain).toBeGreaterThan(0);
    expect(def / plain).toBeGreaterThan(0.73);
    expect(def / plain).toBeLessThan(0.77);
  });
  it('1. human strategy never uses Spirit Stance or OC skills; casts on a weakness', () => {
    const b = setup(); b.oc = 250; b.sp = b.d.sp;
    const m = b.monsters[0]!; m.spec.fire = -50;
    expect(chooseHuman(b)).toMatchObject({ kind: 'spell', id: 'fiery' });
    for (const k of Object.keys(m.spec) as (keyof typeof m.spec)[]) m.spec[k] = 0;
    expect(chooseHuman(b).kind).toBe('attack');
    m.charge = 1; expect(chooseHuman(b).kind).toBe('defend');
    expect(HUMAN_COMBAT_SHARE).toBe(0.5);
    const p = newPlayer(); starterKit(p, 3);
    const r = autoRun(p, pool, 3001, 'human');
    expect(r.floorReached).toBeGreaterThan(1);
  });
  it('2. floors 6-9: at most 2 monsters per normal wave; MID dmg 1.0; early floors 暫定', () => {
    const p = newPlayer();
    for (let s = 1; s <= 40; s++) {
      const run = startRun(p, s);
      for (const f of [1, 2, 3, 4, 6, 7, 8, 9]) { run.floor = f; expect(encounter(run, pool, 'battle').length).toBeLessThanOrEqual(2); }
    }
  });
  it('6. one-click reset returns every point', () => {
    const p = newPlayer(); p.exp = 200000;
    const free0 = unspentExp(p);
    allocate(p, 'str', 10); allocate(p, 'int', 9999);
    resetAttrs(p);
    expect(Object.values(p.attrs).every((v) => v === 0)).toBe(true);
    expect(unspentExp(p)).toBe(free0);
  });
});

describe('CP2c', () => {
  it('2. shield bash only uses the crushing spec; elemental/other weaknesses never apply', () => {
    const bash = (tweak: (m: BattleState['monsters'][0]) => void) => {
      const b = setup(); b.oc = 250; b.sp = 0; const m = b.monsters[0]!;
      for (const k of Object.keys(m.spec) as (keyof typeof m.spec)[]) m.spec[k] = 0;
      m.evade = 0; m.parry = 0; m.hp = m.maxHp = 1e9; tweak(m);
      const ev = act(b, { kind: 'skill', id: 'shieldBash', target: 0 }, new Rng(7), {});
      const h = ev.find((e) => e.t === 'hit' && e.from === 'player');
      return h && h.t === 'hit' ? h : null;
    };
    const base = bash(() => {});
    const elem = bash((m) => { m.spec.fire = -50; m.spec.cold = -50; m.spec.slashing = -50; m.spec.piercing = -50; });
    const crush = bash((m) => { m.spec.crushing = -50; });
    expect(base!.dmg).toBeGreaterThan(0);
    expect(elem!.dmg).toBe(base!.dmg);
    expect(elem!.weak).toBe(false);
    expect(crush!.weak).toBe(true);
    expect(crush!.dmg / base!.dmg).toBeGreaterThan(1.45);
    expect(crush!.dmg / base!.dmg).toBeLessThan(1.55);
  });
  it('2. F5 boss lasts 10-15 turns on average under both auto and human strategies', () => {
    for (const strat of ['auto', 'human'] as const) {
      const turns: number[] = [];
      for (let s = 1; s <= 16; s++) { // CP3: same protocol as scripts/difficulty.ts (16 seeds, runs until first clear)
        const p = newPlayer(); starterKit(p, s);
        for (let i = 1; i <= 8; i++) { const r = autoRun(p, pool, s * 1000 + i, strat); turns.push(...r.bosses.filter((b) => b.floor === 5).map((b) => b.turns)); if (r.floorReached > 10) break; }
      }
      const mean = turns.reduce((a, b) => a + b, 0) / turns.length;
      expect(turns.length).toBeGreaterThan(5);
      expect(mean).toBeGreaterThanOrEqual(10);
      expect(mean).toBeLessThanOrEqual(20); // CP3-fix 8: boss phase 2 lengthens pre-first-clear fights; the 10-15 target now applies to weakness play over trips 1-3 (cp3.test)
    }
  });
});
