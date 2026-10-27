import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { act, chargeAdvice, hpDanger, nextRoundEstimate, PHYS_RESIST_LOG, startBattle } from '../src/core/battle';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { starterKit } from '../src/core/auto';
import { Rng } from '../src/core/rng';
import { RULES } from '../src/core/run';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
function fight() {
  const p = newPlayer(); starterKit(p);
  const m = buildMonster(pool.rows[0]!, 5, 'boss'); m.hp = m.maxHp = 1e9; m.evade = m.parry = 0;
  return startBattle(derive(p), { hp: 999, mp: 999, sp: 99 }, [m], p.potions);
}
describe('rc16 single danger rule + shared advice', () => {
  it('danger iff crit estimate >= HP; safe advice has no D/Z', () => {
    const was = RULES.cp8; RULES.cp8 = true;
    try {
      const b = fight(); b.monsters[0]!.charge = 1;
      const est = nextRoundEstimate(b, true);
      b.hp = Math.ceil(est) + 1; expect(hpDanger(b)).toBe(false);
      expect(chargeAdvice(b).keys.some((k) => k === 'D' || k === 'Z')).toBe(false);
      b.hp = Math.floor(est); expect(hpDanger(b)).toBe(true);
      expect(chargeAdvice(b).danger).toBe(true);
    } finally { RULES.cp8 = was; }
  });
  it('physical hit logs resistance only at >= 25%', () => {
    for (const [spec, want] of [[PHYS_RESIST_LOG, true], [PHYS_RESIST_LOG - 1, false]] as const) {
      const b = fight(); for (const k of Object.keys(b.monsters[0]!.spec)) b.monsters[0]!.spec[k] = spec;
      b.d = { ...b.d, physAcc: 9 };
      const hit = act(b, { kind: 'attack', target: 0 }, new Rng(1)).find((e) => e.t === 'hit' && e.from === 'player' && e.dmg > 0) as any;
      expect(!!hit?.resisted).toBe(want);
    }
  });
});
