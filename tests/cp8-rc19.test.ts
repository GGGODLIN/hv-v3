import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chargeAdvice, potHint, startBattle, zHint } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const mk = (adb: (hp: number) => number) => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e6; m.adb = adb(d.hp);
  return startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 3, mana: 0, spirit: 0 });
};
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; } };
describe('rc19 (a) Z highlight follows chargeAdvice (QA rc16 oc4 F6)', () => {
  it('45% HP, estimate far below HP: decision is not Z and Z is not lit (potHint alone would light it)', () => withCp8(() => {
    const b = mk(() => 1); b.hp = Math.round(b.d.hp * 0.45);
    const a = chargeAdvice(b); expect(a.danger).toBe(false); expect(a.est).toBeLessThan(a.hp);
    expect(potHint(b)).toBe(true); // the old path that bypassed the decision
    expect(zHint(b)).toBe(false);
  }));
  it('estimate ≥ HP with a usable potion: Z is in the decision and lit', () => withCp8(() => {
    const b = mk((hp) => hp); b.hp = Math.round(b.d.hp * 0.45);
    expect(chargeAdvice(b).keys).toContain('Z'); expect(zHint(b)).toBe(true);
  }));
  it('the battle UI lights Z through zHint, not potHint', () => {
    expect(readFileSync('src/game/app.ts', 'utf8')).toMatch(/zHint\(b, this\.target\) \? 'class="suggest pothint"/);
  });
});

import { generateTower } from '../src/core/tower';
import { abyssFloor } from '../src/core/abyss';
import { Rng } from '../src/core/rng';
import { CONSTANTS as C } from '../src/core/data/constants';
describe('rc19 (b) supply', () => {
  it('every floor before a boss offers rest (main cp8 tower + abyss)', () => {
    for (let s = 0; s < 500; s++) {
      const fl = generateTower(new Rng(s), { long: true, distinct: true, restBeforeBoss: true }).floors;
      fl.forEach((f, i) => { if (fl[i + 1]?.options.includes('boss')) expect(f.options).toContain('rest'); });
      const rng = new Rng(s); for (let d = 4; d <= 99; d += 5) expect(abyssFloor(rng, d, 1).options).toContain('rest');
    }
  });
  it('potion drop table is the sourced original roll', () => {
    expect(C['F-003-restorative-rolls'].value).toMatchObject({ restoratives: 0.35, potion: 0.19 });
    expect(RULES.origPotionDrop).toBe(true);
  });
});
