import { readFileSync } from 'node:fs';
import { describe, expect, it, afterEach } from 'vitest';
import { act, chargeEstimate, potHint, startBattle, windingUp } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { RULES } from '../src/core/run';
import { CP8 } from '../src/core/cp8';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const snap = { ...RULES };
afterEach(() => Object.assign(RULES, snap));
const cp8 = () => { RULES.cp7 = true; RULES.cp8 = true; RULES.cp5Bosses = true; RULES.cp6Abyss = true; };
const setup = (rank: 'elite' | 'normal', adb: number) => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1, rank); m.adb = adb; m.acc = 1e6;
  const b = startBattle({ ...d, evade: 0, parry: 0, block: 0 }, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 2, mana: 0, spirit: 0 });
  m.hp = m.maxHp = 1e9; return b;
};
describe('cp8-rc9 P0-1 big single hit is wound up first (自訂，非原版)', () => {
  it('elite hit ≥ 50% max HP: 1 round wind-up (shown as windingUp with its estimate), then the hit', () => {
    cp8(); const b = setup('elite', 1); const m = b.monsters[0]!;
    m.adb = 1; while (chargeEstimate(b, m) < CP8.bigTele * b.d.hp) m.adb *= 1.5;
    const hp0 = b.hp; act(b, { kind: 'focus' }, new Rng(3), {});
    expect(b.hp).toBe(hp0); expect(windingUp(m)).toBe(true); expect(chargeEstimate(b, m)).toBeGreaterThanOrEqual(CP8.bigTele * b.d.hp);
    act(b, { kind: 'focus' }, new Rng(3), {});
    expect(windingUp(m)).toBe(false);
  });
  it('small elite hit and normal monsters are not wound up', () => {
    cp8(); const b = setup('elite', 1); act(b, { kind: 'focus' }, new Rng(3), {}); expect(windingUp(b.monsters[0]!)).toBe(false);
    const c = setup('normal', 1e5); act(c, { kind: 'focus' }, new Rng(3), {}); expect(windingUp(c.monsters[0]!)).toBe(false);
  });
});
describe('cp8-rc9 P0-2 potion hint uses HP − next hit estimate', () => {
  it('lights at 80% HP when the next hit leaves < potAfter, not at 80% HP vs a weak hit', () => {
    cp8(); const b = setup('normal', 1); b.hp = b.d.hp * 0.8; b.itemCd.health = 0;
    expect(potHint(b)).toBe(false);
    const m = b.monsters[0]!; while (chargeEstimate(b, m) < b.d.hp * 0.6) m.adb *= 1.5;
    expect(potHint(b)).toBe(true);
  });
});
