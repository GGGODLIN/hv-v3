import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { potHint, startBattle } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { abyssMult } from '../src/core/abyss';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const mk = () => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e6; m.adb = d.hp; // estimate far above HP → hpDanger
  return startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 3, mana: 0, spirit: 0 });
};
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; } };
describe('rc14 playtest fixes', () => {
  it('cp8 monster HP multiplier rises on every floor d16–d21 (暫定)', () => withCp8(() => {
    const v = [16, 17, 18, 19, 20, 21].map((d) => abyssMult(d).hp);
    for (let i = 1; i < v.length; i++) expect(v[i]!).toBeGreaterThan(v[i - 1]!);
  }));
  it('pothint stays dark at high HP when most of the heal would be wasted', () => withCp8(() => {
    const b = mk(); b.hp = b.d.hp - 1; expect(potHint(b)).toBe(false);
    b.hp = b.d.hp * 0.4; expect(potHint(b)).toBe(true);
  }));
  it('UI copy: potion unusable → S/A only, death advice no longer says 先按 D', () => {
    const app = readFileSync('src/game/app.ts', 'utf8');
    expect(app).toMatch(/guardOnly\(b: BattleState\): boolean \{ return RULES\.cp8 && !canUse\(b, \{ kind: 'item', id: 'health' \}\); \}/);
    expect(app).not.toMatch(/先按 D·防禦/);
  });
});
