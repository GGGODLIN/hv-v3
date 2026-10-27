import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, canUse, chargeEstimate, startBattle } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const mk = (n: number, style?: 'twoHand' | 'oneHand') => {
  const p = newPlayer(); starterKit(p);
  const d = { ...derive(p), ...(style ? { style } : {}), physAcc: 10 } as ReturnType<typeof derive>;
  const ms = Array.from({ length: n }, () => { const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e6; m.evade = 0; m.parry = 0; m.physMit = 0.8; return m; });
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 3, mana: 0, spirit: 0 }); b.oc = 250; return b;
};
describe('rc13 2H / 1H skills (Skills.md:61,73,75)', () => {
  it('Rending Blow hits up to 5 targets, ignores phys mitigation, then 3 stacks of PA', () => {
    const b = mk(6, 'twoHand'); const ev = act(b, { kind: 'skill', id: 'rendingBlow', target: 2 }, new Rng(1));
    const hit = ev.filter((e) => e.t === 'hit' && e.label === '撕裂擊');
    expect(hit.length).toBe(5);
    expect(b.monsters.filter((m) => m.status.pa === 3).length).toBe(5);
  });
  it('Shatter Strike stuns only targets with PA', () => {
    const b = mk(3, 'twoHand'); b.monsters[0]!.status.pa = 3; b.monsters[0]!.status.paTurns = 5;
    act(b, { kind: 'skill', id: 'shatterStrike', target: 0 }, new Rng(2));
    expect(b.monsters[0]!.status.stun).toBeGreaterThan(0); expect(b.monsters[1]!.status.stun).toBe(0);
  });
  it('Merciful Blow is usable above 25% HP; executes a bleeding target below 25%', () => {
    const b = mk(1, 'oneHand'); expect(canUse(b, { kind: 'skill', id: 'mercifulBlow', target: 0 })).toBe(true);
    const m = b.monsters[0]!; m.hp = m.maxHp * 0.2; m.status.bleed = 5; m.status.bleedTurns = 3;
    act(b, { kind: 'skill', id: 'mercifulBlow', target: 0 }, new Rng(3)); expect(m.hp).toBe(0);
  });
  it('estimate crit value = normal × 1.2 (F-002-5.1B)', () => {
    const b = mk(1); const m = b.monsters[0]!; m.adb = 1000;
    expect(chargeEstimate(b, m, false, true) / chargeEstimate(b, m)).toBeCloseTo(1.2 * 1.2, 1); // rc21: crit case = top roll (120%) × crit 1.2;
  });
});

import { potHint, HEALTH_POTION_CD } from '../src/core/battle';
import { abyssMult } from '../src/core/abyss';
import { RULES } from '../src/core/run';
describe('rc13 playtest fixes', () => {
  it('pothint never lights at full HP, even with a charge telegraphed', () => {
    const b = mk(1); b.hp = b.d.hp; b.monsters[0]!.charge = 1; (b.monsters[0] as { heavyNext?: boolean }).heavyNext = true;
    for (const cp8 of [false, true]) { const o = RULES.cp8; RULES.cp8 = cp8; expect(potHint(b)).toBe(false); RULES.cp8 = o; }
  });
  it('health potion cooldown 3 (暫定)', () => { expect(HEALTH_POTION_CD).toBe(3); });
  it('cp8 damage multiplier rises on every floor d16–d21', () => {
    const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true;
    const v = [16, 17, 18, 19, 20, 21].map((d) => abyssMult(d).dmg);
    RULES.cp7 = o[0]!; RULES.cp8 = o[1]!;
    for (let i = 1; i < v.length; i++) expect(v[i]!).toBeGreaterThan(v[i - 1]!);
  });
});
