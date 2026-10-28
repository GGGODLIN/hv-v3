// rc12g（自訂）: A on a 魔力合流 target with MP < 50% (but the full cost still affordable) = Arcane Blow → 以太分流 can fire and is logged.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, quickAttack, spellCost, startBattle, type BattleState } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { RULES } from '../src/core/run';
import { CP8 } from '../src/core/cp8';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const fight = (): BattleState => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  (d as { style: string }).style = 'staff'; d.level = 30; d.wprof = 100; d.attrs.int = 200; d.attrs.wis = 200; d.mp = 10000;
  const m = buildMonster(pool.rows[0]!, 1, 'normal'); m.hp = m.maxHp = 1e7; m.adb = 0; m.evade = 0; m.resist = 0;
  return startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 });
};
describe('rc12g staff blow', () => {
  it('quick spell at high MP, Arcane Blow on a coalesced target at low MP, and 以太分流 shows in the log', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      const b = fight(); const id = CP8.staffQuickSpell as never;
      b.mp = 9000; b.cm9 = {}; expect(quickAttack(b, 0).kind).toBe('spell'); b.cm9 = { 0: 3 }; expect(quickAttack(b, 0).kind).toBe('attack'); // rc12j: any MP
      b.et9 = { turns: 2, stacks: 1 }; expect(quickAttack(b, 0).kind).toBe('spell'); b.et9 = undefined;
      b.mp = Math.max(spellCost(b, id), 100); expect(quickAttack(b, 0).kind).toBe('attack');
      let seen = false; const rng = new Rng(1);
      for (let i = 0; i < 300 && !seen; i++) { b.cm9 = { 0: 3 }; b.mp = Math.max(spellCost(b, id), 100);
        seen = act(b, { kind: 'attack', target: 0 }, rng, {} as never).some((e) => 'text' in e && /你的法杖：以太分流（Ether Tap）/.test(String(e.text))); }
      expect(seen).toBe(true);
    } finally { RULES.cp8 = o; }
  });
});
