import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, isWeak, startBattle, weaknesses, BOSS_CHARGE_MULT } from '../src/core/battle';
import { autoRun, starterKit } from '../src/core/auto';
import { attrCost } from '../src/core/formulas';
import { buildMonster, makePool, RANK_MULT, type MonsterRow } from '../src/core/monsters';
import { allocate, derive, newPlayer, refund, unspentExp } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { RULES } from '../src/core/run';

const rows = JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[];
const pool = makePool(rows);

describe('CP2', () => {
  it('2. regen record always carries HP, MP and SP (0 included)', () => {
    const p = newPlayer(); starterKit(p);
    const d = derive(p);
    const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: 0 }, [buildMonster(pool.rows[0]!, 1)], { health: 0, mana: 0, spirit: 0 });
    act(b, { kind: 'defend' }, new Rng(2), {});
    expect(Object.keys(b.regen).sort()).toEqual(['hp', 'mp', 'sp']);
    expect(b.regen.hp).toBe(0);
    expect(b.regen.mp).toBe(0); // MP was full
    expect(b.regen.sp).toBeGreaterThan(0);
  });
  it('5. weaknesses come straight from the monsters.json row (negative resist), and hits on them are flagged', () => {
    const row = pool.rows.find((r) => Number(r[7]) < 0)!; // crushing resist < 0
    const m = buildMonster(row, 5);
    const neg = (['piercing', 'crushing', 'slashing', 'cold', 'wind', 'elec', 'fire', 'dark', 'holy'] as const).filter((_k, i) => Number(row[6 + i]) < 0);
    expect(weaknesses(m).map((w) => w.type).sort()).toEqual([...neg].sort());
    expect(isWeak(m, 'crushing')).toBe(true);
    const p = newPlayer(); starterKit(p);
    const d = { ...derive(p), damageType: 'crushing' as const, physAcc: 10 };
    let flagged = 0;
    for (let s = 1; s < 30; s++) {
      const mm = buildMonster(row, 5); mm.evade = 0; mm.parry = 0;
      const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [mm], { health: 0, mana: 0, spirit: 0 });
      const ev = act(b, { kind: 'attack', target: 0 }, new Rng(s), {});
      for (const e of ev) if (e.t === 'hit' && e.from === 'player' && e.dmg > 0) { expect(e.weak).toBe(true); flagged++; }
    }
    expect(flagged).toBeGreaterThan(0);
  });
  it('4/7. CP2/CP2b 暫定 knobs', () => {
    expect(RANK_MULT.boss.hp).toBe(2.2);
    expect(RULES.expMult).toBe(1); // CP3: back to the original
    expect(BOSS_CHARGE_MULT).toBe(2);
  });
  it('4. sim F5 boss fights average 10-15 turns', () => {
    const turns: number[] = [];
      for (let s = 1; s <= 16; s++) { // CP3: same protocol as scripts/difficulty.ts (16 seeds, runs until first clear)
        const p = newPlayer(); starterKit(p, s);
        for (let i = 1; i <= 8; i++) { const r = autoRun(p, pool, s * 1000 + i); turns.push(...r.bosses.filter((b) => b.floor === 5).map((b) => b.turns)); if (r.floorReached > 10) break; }
      }
    const mean = turns.reduce((a, b) => a + b, 0) / turns.length;
    expect(turns.length).toBeGreaterThan(5);
    expect(mean).toBeGreaterThanOrEqual(10);
    expect(mean).toBeLessThanOrEqual(20); // CP3-fix 8: boss phase 2 lengthens pre-first-clear fights; the 10-15 target now applies to weakness play over trips 1-3 (cp3.test)
  });
  it('6. batch allocation +1 / +10 / +max and refunds', () => {
    const p = newPlayer(); p.exp = 200000;
    expect(allocate(p, 'str', 1)).toBe(1);
    expect(allocate(p, 'str', 10)).toBe(10);
    const added = allocate(p, 'dex', 9999);
    expect(added).toBeGreaterThan(0);
    expect(unspentExp(p)).toBeGreaterThanOrEqual(0);
    expect(unspentExp(p)).toBeLessThan(attrCost(p.attrs.dex + 1) - attrCost(p.attrs.dex));
    const before = p.attrs.str;
    refund(p, 'str', 10); expect(p.attrs.str).toBe(before - 10);
    refund(p, 'str', 9999); expect(p.attrs.str).toBe(0);
  });
});
