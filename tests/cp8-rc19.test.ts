import { readFileSync } from 'node:fs';
import { describe, expect, it , beforeAll, afterAll} from 'vitest';
import { CP9 } from '../src/core/cp8';
// cp9（自訂）: these pin the rc19–rc21 advice rules, superseded by cp9 (c); run them with the CP9 layer off.
beforeAll(() => { CP9.on = false; }); afterAll(() => { CP9.on = true; });
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
describe('rc19 (d) potion unusable + estimate ≥ HP → D / S / A through chargeAdvice', () => {
  // defended estimate = est × (1 − DEF.mitigation)-ish; pick adb so est ≥ HP but defended < HP, then so both ≥ HP.
  const setup = (ratio: number, pots: number) => { const b = mk((hp) => hp); b.potions.health = pots; b.itemCd.health = 0; b.oc = 0;
    const m = b.monsters[0]!; const unit = chargeAdvice(b).est; m.adb = m.adb * (b.hp * ratio) / Math.max(1, unit); return b; };
  it('defended estimate below HP → D', () => withCp8(() => {
    const b = setup(1.1, 0); const a = chargeAdvice(b);
    expect(a.danger).toBe(true); expect(a.keys).toEqual(['D']); expect(a.text).toContain('防禦後估計');
  }));
  it('defence cannot hold, spirit usable → S', () => withCp8(() => {
    const b = setup(5, 0); b.oc = 250; const a = chargeAdvice(b);
    expect(a.danger).toBe(true); expect(a.keys).toEqual(['S']);
  }));
  it('defence cannot hold, spirit unusable → A', () => withCp8(() => {
    const b = setup(5, 0); b.oc = 0; const a = chargeAdvice(b);
    expect(a.keys).toEqual(['A']);
  }));
  it('potion on cooldown counts as unusable too', () => withCp8(() => {
    const b = setup(1.1, 3); b.itemCd.health = 2; expect(chargeAdvice(b).keys).toEqual(['D']);
  }));
  it('potion usable keeps D/Z', () => withCp8(() => { const b = setup(1.1, 3); b.hp -= 1; expect(chargeAdvice(b).keys[0]).toBe('Z'); /* rc21 item 1: Z first */ }));
});
import { deathHint } from '../src/core/battle';
describe('rc19 (e) death hint: last hit ≥ 15% max HP is not 「被慢慢磨光」', () => {
  it('last hit 15% → no 慢慢磨光', () => { const t = deathHint(150, 150, 1000); expect(t).not.toContain('慢慢磨光'); expect(t).toContain('15%'); });
  it('last hit 20%, biggest earlier hit 25% → no 慢慢磨光', () => expect(deathHint(250, 200, 1000)).not.toContain('慢慢磨光'));
  it('last hit 14%, all small → 慢慢磨光', () => expect(deathHint(140, 140, 1000)).toContain('慢慢磨光'));
  it('≥ 30% keeps the 三成 text', () => expect(deathHint(300, 100, 1000)).toContain('三成'));
  it('both death-screen branches use deathHint', () => { const s = readFileSync('src/game/app.ts', 'utf8'); expect(s.match(/deathHint\(/g)!.length).toBe(2); expect(s).not.toContain('慢慢磨光'); });
});
