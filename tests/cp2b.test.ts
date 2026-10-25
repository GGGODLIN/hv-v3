import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, canUse, DEF, HEALTH_POTION_CD, startBattle, whyNot, type Action, type BattleState } from '../src/core/battle';
import { autoRun, chooseHuman, HUMAN_COMBAT_SHARE, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { allocate, derive, newPlayer, resetAttrs, unspentExp } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { EARLY_FLOOR_MULT, encounter, MID_FLOOR_MULT, startRun } from '../src/core/run';

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
  it('7. defend cuts the charged boss blow by DEF.mitigation (25%)', () => {
    expect(DEF.mitigation).toBe(0.25);
    const blow = (a: Action) => {
      const b = setup('boss'); b.oc = 0; b.monsters[0]!.charge = 1;
      const ev = act(b, a, new Rng(42), {});
      const h = ev.find((e) => e.t === 'hit' && e.to === 'player');
      expect(h && h.t === 'hit' && h.label).toBe('重擊！');
      return h && h.t === 'hit' ? h.dmg : NaN;
    };
    const plain = blow({ kind: 'item', id: 'mana' });
    const def = blow({ kind: 'defend' });
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
    expect(MID_FLOOR_MULT.dmg).toBe(1);
    expect(EARLY_FLOOR_MULT).toEqual({ from: 1, to: 4, hp: 1.4, dmg: 1.8 });
    const p = newPlayer();
    for (let s = 1; s <= 40; s++) {
      const run = startRun(p, s);
      for (const f of [6, 7, 8, 9]) { run.floor = f; expect(encounter(run, pool, 'battle').length).toBeLessThanOrEqual(2); }
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
