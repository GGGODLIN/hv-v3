import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, battleLoot, bossGearQ12o, encounter, runDerived, startAbyss } from '../src/core/run';
import { starterKit } from '../src/core/auto';
import { newPlayer } from '../src/core/player';
import { QUALITIES } from '../src/core/items';
import { guaranteeQuality } from '../src/core/abyss';
import { RUN12M, RUN12O, boss70, deepK12g, r12m, refHp9 } from '../src/core/cp8';

// rc12o（自訂）: boss-kill reward, boss HP from F70, arcane max-HP floor, hit-line turn prefix.
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const cp8 = RULES.cp8, pot = RUN12O.bossPot;
afterEach(() => { RULES.cp8 = cp8; RUN12O.bossPot = pot; });

describe('rc12o', () => {
  it('defaults on; scattered drop/chest potion chance moved to boss kills', () => {
    expect(RUN12O.on && RUN12M.on).toBe(true);
    expect(r12m('blade', 'drop')).toBe(0); expect(r12m('blade', 'chest')).toBe(0);
    expect(RUN12O.bossPot).toBeGreaterThan(0);
    expect(deepK12g('blade')).toBe(12); expect(deepK12g('bulwark')).toBe(30); // rc12s retune（自訂） expect(r12m('oc', 'bossHp')).toBe(0.5);
  });
  it('boss70: ×1 up to F65, full multiplier from F70', () => {
    expect(boss70(65, 'blade', 'bossHp70')).toBe(1);
    expect(boss70(70, 'blade', 'bossHp70')).toBeCloseTo(r12m('blade', 'bossHp70'));
    expect(boss70(90, 'oc', 'bossHp70')).toBeCloseTo(r12m('oc', 'bossHp70'));
    expect(r12m('blade', 'bossHp70')).toBeLessThan(1);
  });
  it('boss kill: guaranteed piece one quality tier higher + concentrated health potions', () => {
    RULES.cp8 = true; RUN12O.bossPot = 2;
    for (const start of [30, 50]) {
      const p = newPlayer(); starterKit(p); const run = startAbyss(p, 7, start, 0);
      const loot = battleLoot(run, encounter(run, pool, 'boss'), 'boss', p);
      const g = loot.equips.find((e) => loot.guaranteed?.includes(e.id))!;
      const want = bossGearQ12o(guaranteeQuality(start));
      expect(QUALITIES.indexOf(want)).toBe(Math.min(QUALITIES.length - 1, QUALITIES.indexOf(guaranteeQuality(start)) + 1));
      expect(QUALITIES.indexOf(g.quality)).toBeGreaterThanOrEqual(QUALITIES.indexOf(want));
      expect(loot.potions.health ?? 0).toBeGreaterThanOrEqual(2);
    }
  });
  it('arcane max HP floor = arcHp × refHp9(depth) in the abyss; other leans untouched', () => {
    RULES.cp8 = true;
    const p = newPlayer(); starterKit(p); const run = startAbyss(p, 7, 60, 0);
    p.lean = 'arcane'; const a = runDerived(p, run).hp;
    p.lean = 'blade'; const b = runDerived(p, run).hp;
    expect(a).toBeGreaterThanOrEqual(Math.round(RUN12O.arcHp * refHp9(60)));
    expect(b).toBeLessThan(a);
  });
  it('battle log: every enemy hit line carries its turn number', () => {
    const src = readFileSync('src/game/app.ts', 'utf8');
    expect(src).toMatch(/class="enemyhit" data-enemyhit="\$\{e\.dmg\}" data-hitturn="\$\{b\.turn\}">\$\{RULES\.cp8 \? `\[第 \$\{b\.turn\} 回合\] `/);
  });
});
