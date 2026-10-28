// rc12r QA（bw3 F43/F58/F81, oc1 F30/F58/F68）: 「★ 估計 = 實際蓄力一擊的一半」— root cause: the logged 449/462/340/350 hit landed in the
// round BEFORE the decision (HP 650 → 201 already included it); the round after the Z/D decision took 0. The 224/231/170/175 shown is the
// per-turn plain cap (bossPlain 20% → ceil(0.2·maxHP)−1) while no monster is winding up (post-hit windCd). Not a defend halving.
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chargeAdvice, chargeEstimate, roundEstimate, startBattle, windingUp, act, type BattleState } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { Rng } from '../src/core/rng';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const mk = (maxHp: number, hp: number): BattleState => { const p = newPlayer(); starterKit(p); const d = derive(p); d.hp = maxHp;
  const m = buildMonster(pool.rows[0]!, 30); m.hp = m.maxHp = 1e6; m.adb = 1e5; // huge hitter: every number below is a cap
  const b = startBattle(d, { hp, mp: d.mp, sp: d.sp }, [m], { health: 3, mana: 0, spirit: 0 }); return b; };
import { CP9 } from '../src/core/cp8';
// rc12s: QA scenario recorded under the 40% normal-fight cap — pin the old cap (normalCharge 0 → minionCharge 0.4); 30% is covered by rc12s-normal-charge.test.ts
let nc12s = 0; beforeAll(() => { nc12s = CP9.normalCharge; (CP9 as { normalCharge: number }).normalCharge = 0; }); afterAll(() => { (CP9 as { normalCharge: number }).normalCharge = nc12s; });
describe('rc12r QA: ★ estimate vs the charged hit (no defend halving for Z)', () => {
  let o: boolean[] = [];
  beforeAll(() => { o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; });
  afterAll(() => { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; });
  for (const [mx, full, plain] of [[1123, 449, 224], [1156, 462, 231], [852, 340, 170], [876, 350, 175]] as const) {
    it(`maxHP ${mx}: telegraph → ★Z/D estimate is the full ${full} (not ${plain}); after the hit (no telegraph) → ${plain}`, () => {
      const b = mk(mx, Math.round(mx * 0.17)); (b.monsters[0] as { heavyNext?: boolean }).heavyNext = true;
      expect(windingUp(b.monsters[0]!)).toBe(true);
      const a = chargeAdvice(b, 0);
      expect(['Z', 'D']).toContain(a.keys[0]);
      expect(a.est).toBe(full); // undefended full value drives the Z decision
      expect(Math.round(roundEstimate(b, true, false))).toBe(full);
      expect(Math.round(chargeEstimate(b, b.monsters[0]!, false, true))).toBe(full);
      // the hit lands next act at the same full value when the action is not D (Z)
      const hp0 = b.hp = mx; const ev = act(b, { kind: 'item', id: 'health' }, new Rng(1), {});
      const hit = ev.find((e) => e.t === 'hit' && e.to === 'player') as { dmg: number } | undefined;
      expect(hit?.dmg ?? 0).toBeLessThanOrEqual(full); expect(hp0 - b.hp).toBeLessThanOrEqual(full);
      // the QA-observed 「half」: the decision AFTER that hit, with no wind-up → plain per-turn cap
      expect(b.monsters.some(windingUp)).toBe(false); b.hp = Math.round(mx * 0.17); expect(chargeAdvice(b, 0).est).toBe(plain);
    });
  }
  it('defend halves only for D: estimate with def=true never used as the ★ estimate', () => {
    const b = mk(1123, 201); (b.monsters[0] as { heavyNext?: boolean }).heavyNext = true; b.monsters[0]!.adb = 600;
    const full = Math.round(roundEstimate(b, true, false)), defd = Math.round(roundEstimate(b, true, true));
    expect(defd).toBeLessThan(full); expect(chargeAdvice(b, 0).est).toBe(full);
  });
});
