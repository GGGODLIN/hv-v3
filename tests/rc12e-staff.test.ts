// rc12e（製作人決策 1）: staff Coalesced Mana / Ether Tap with the original values (Fighting_Styles.md:151-172, findings/002:281,
// Spells.md:84,88). Sim and UI share spellCost/canUse/quickAttack, so the halved cost reaches the ★ and the A button alike.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, canUse, quickAttack, spellCost, startBattle, STAFF9, type BattleState } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { baseMp } from '../src/core/formulas';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { RULES } from '../src/core/run';
import { CP8 } from '../src/core/cp8';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const fight = (style: 'staff' | 'oneHand' = 'staff', hp = 1e6, n = 1): BattleState => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  (d as { style: string }).style = style; d.level = 30; d.wprof = 100; d.attrs.int = 200; d.attrs.wis = 200;
  const ms = Array.from({ length: n }, () => { const m = buildMonster(pool.rows[0]!, 1, 'normal'); m.hp = m.maxHp = hp; m.adb = 0; m.evade = 0; m.resist = 0; return m; });
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 0, mana: 0, spirit: 0 });
  b.mp = 1e4; return b;
};
const spell = 'fiery' as const;

describe('rc12e Coalesced Mana', () => {
  it('halves the spell cost on that target only, stacks with Spirit Stance (Spells.md:88)', () => {
    const b = fight('staff', 1e6, 2); b.d.level = 400; b.d.interference = 0; b.d.manaCons = 0;
    const base = (400 * 10) / 100; // fiery baseCost read back from the full cost below
    const full = spellCost(b, spell, 1); b.cm9 = { 0: 3 };
    expect(spellCost(b, spell, 0)).toBe(Math.ceil(full * 0.5)); expect(spellCost(b, spell)).toBe(full); void base;
    b.spirit = true;
    expect(spellCost(b, spell, 1)).toBe(Math.ceil(full * 0.75)); expect(spellCost(b, spell, 0)).toBe(Math.ceil(full * 0.75 * 0.5));
  });
  it('MP between half and full cost: castable only on the coalesced target; A (quick spell) follows the same rule', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      const b = fight('staff', 1e6, 2); const id = CP8.staffQuickSpell as typeof spell;
      b.cm9 = { 0: 3 }; b.mp = spellCost(b, id, 0);
      if (b.mp < spellCost(b, id, 1)) {
        expect(canUse(b, { kind: 'spell', id, target: 0 })).toBe(true); expect(canUse(b, { kind: 'spell', id, target: 1 })).toBe(false);
        expect(quickAttack(b, 0).kind).toBe('spell'); expect(quickAttack(b, 1).kind).toBe('attack');
      }
    } finally { RULES.cp8 = o; }
  });
  it('proc rate on spell hits ≈ min(35%, 10 + (INT+WIS)*0.01 + Staff/20) %; never without a staff', () => {
    const rng = new Rng(7); let hit = 0, n = 0;
    for (let i = 0; i < 3000; i++) { const b = fight('staff'); const ev = act(b, { kind: 'spell', id: spell, target: 0 }, rng); if (b.monsters[0]!.hp < 1e6) { n++; if ((b.cm9?.[0] ?? 0) > 0) hit++; void ev; } }
    const want = Math.min(STAFF9.cmCap, 10 + 0.01 * 400 + 100 / 20) / 100; // 19%
    expect(Math.abs(hit / n - want)).toBeLessThan(0.03);
    const b = fight('oneHand'); for (let i = 0; i < 200; i++) act(b, { kind: 'spell', id: spell, target: 0 }, rng);
    expect(b.cm9).toBeUndefined();
  });
  it('lasts 5 ticks then expires', () => {
    const b = fight('staff'); b.cm9 = { 0: STAFF9.cmTicks }; const rng = new Rng(3);
    for (let i = 0; i < STAFF9.cmTicks; i++) act(b, { kind: 'defend' }, rng);
    expect(b.cm9[0]).toBe(0); expect(spellCost(b, spell, 0)).toBe(spellCost(b, spell, 1 as never));
  });
});

describe('rc12e Ether Tap', () => {
  it('Arcane Blow kill on a coalesced target always procs: removes Coalesced Mana, restores 2% Base_MP per turn for 4 turns', () => {
    for (let seed = 1; seed < 50; seed++) {
      const b = fight('staff', 1); b.cm9 = { 0: 3 }; b.mp = 0;
      act(b, { kind: 'attack', target: 0 }, new Rng(seed));
      if (b.monsters[0]!.hp > 0) continue; // missed
      expect(b.et9).toEqual({ turns: STAFF9.etTicks, stacks: 1 }); expect(b.cm9[0]).toBe(0);
      return;
    }
    throw new Error('no hit in 50 seeds');
  });
  it('restore per turn = stacks × 2% Base_MP on top of natural regen; stacks once (x2)', () => {
    const b = fight('staff'); b.mp = 0; b.et9 = { turns: 4, stacks: 2 }; b.monsters[0]!.adb = 0;
    const rng = new Rng(1); act(b, { kind: 'defend' }, rng);
    const nat = 5 + b.d.attrs.wis / 25, et = 2 * 0.02 * baseMp(b.d.level, b.d.attrs.wis);
    expect(b.mp).toBeCloseTo(Math.min(b.d.mp, nat + et), 1);
    for (let i = 0; i < 3; i++) act(b, { kind: 'defend' }, rng);
    expect(b.et9.turns).toBe(0); const m0 = b.mp; act(b, { kind: 'defend' }, rng); expect(b.mp - m0).toBeLessThanOrEqual(nat + 0.01);
  });
  it('no proc without Coalesced Mana or with a non-staff', () => {
    const rng = new Rng(9);
    for (let i = 0; i < 200; i++) { const b = fight('staff', 1); act(b, { kind: 'attack', target: 0 }, rng); expect(b.et9).toBeUndefined(); }
    for (let i = 0; i < 200; i++) { const b = fight('oneHand', 1); b.cm9 = { 0: 3 }; act(b, { kind: 'attack', target: 0 }, rng); expect(b.et9).toBeUndefined(); }
  });
});
