// cp9-rc5（自訂，暫定）: charged-hit defend factor, stun cancels every wind-up, unannounced cap < 20%.
import { describe, it, expect } from 'vitest';
import { CP9 } from '../src/core/cp8';
import { DEF, defFactor } from '../src/core/battle';

describe('cp9-rc5 knobs', () => {
  it('defend takes only chargeDef of a telegraphed hit, plain hits keep DEF.mitigation', () => {
    expect(CP9.chargeDef).toBe(0.5);
    expect(CP9.stunAll).toBe(true);
    expect(CP9.bossPlain).toBe(0.2);
    expect(CP9.boss30).toBe(1.5); // cp9-rc7（自訂）: 2 → 1.5
    expect(defFactor(false)).toBeCloseTo(1 - DEF.mitigation);
  });
});

import { readFileSync } from 'node:fs';
import { act, startBattle } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
describe('cp9-rc5 (1) stun cancels any charge', () => {
  it('a stunned monster loses its 蓄力 charge', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      expect(defFactor(true)).toBe(CP9.chargeDef);
      const p = newPlayer(); starterKit(p); const d = derive(p);
      const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e6; m.charge = 1; m.status.stun = 2;
      const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 3, mana: 0, spirit: 0 });
      const ev = act(b, { kind: 'defend' } as never, new Rng(1));
      expect(b.monsters[0]!.charge).toBe(0);
      expect(ev.some((e) => e.t === 'status' && (e as { text?: string }).text === '蓄力被打斷！')).toBe(true);
    } finally { RULES.cp8 = o; }
  });
});
