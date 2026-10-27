import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BIG_NEXT, chargeAdvice, chargeEstimate, hpDanger, startBattle, zHint, type BattleState } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { maxHit } from '../src/core/damage';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; } };
/** HP set to hp/max of max HP; one non-charging monster scaled so the next-round estimate ≈ estShare × max HP. */
const qa = (hp: number, max: number, estShare: number, pots = 5): BattleState => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e6; m.charge = 0; m.adb = d.hp * 0.05;
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: pots, mana: 0, spirit: 0 });
  b.hp = Math.max(1, Math.round(d.hp * hp / max)); b.itemCd.health = 0; b.oc = 0;
  for (let i = 0; i < 6; i++) m.adb *= (d.hp * estShare) / Math.max(1, chargeEstimate(b, m, false, true));
  return b;
};
describe('rc21 item 1: estimate ≥ HP + potion usable → Z only; D only if the defended estimate < HP', () => {
  it('blade8 F? 681 HP, estimate 966 (1.42×) → Z first, no D when defended estimate ≥ HP', () => withCp8(() => {
    const b = qa(681, 1000, 0.966); const a = chargeAdvice(b);
    expect(a.est).toBeGreaterThanOrEqual(a.hp); expect(a.keys[0]).toBe('Z'); expect(zHint(b)).toBe(true);
    const estD = Number(/防禦後估計 (\d+)/.exec(a.text)![1]); expect(a.keys.includes('D')).toBe(estD < a.hp);
  }));
  it('huge hit: defended estimate ≥ HP → keys exactly [Z]', () => withCp8(() => { const a = chargeAdvice(qa(300, 1000, 3)); expect(a.keys).toEqual(['Z']); expect(a.text).toContain('防禦擋不住'); }));
  it('blade7: 46% HP, estimate just over HP → Z before D', () => withCp8(() => { const a = chargeAdvice(qa(376, 818, 0.5)); expect(a.keys[0]).toBe('Z'); }));
  it('no ordering D before Z anywhere in chargeAdvice', () => expect(readFileSync('src/core/battle.ts', 'utf8')).not.toMatch(/\['D', 'Z'\]/));
});
describe('rc21 item 2: hint on non-charging turns when the next round could take ≥ 40% max HP', () => {
  it('BIG_NEXT is the producer 40%', () => expect(BIG_NEXT).toBe(0.4));
  it('crit-case estimate = top roll × crit (worst case, 暫定)', () => withCp8(() => {
    const b = qa(500, 1000, 0.3); const m = b.monsters[0]!; expect(chargeEstimate(b, m, false, true) / chargeEstimate(b, m)).toBeCloseTo(1.44, 1);
    expect(maxHit).toBeTypeOf('function');
  }));
  it('oc1 F16: 449/798 (56%), next hit could be 406 (51%) → danger, Z lit', () => withCp8(() => {
    const b = qa(449, 798, 406 / 798); const a = chargeAdvice(b); expect(a.danger).toBe(true); expect(hpDanger(b)).toBe(true); expect(a.keys[0]).toBe('Z'); expect(a.text).toContain('40%');
  }));
  it('next round 30% of max at 56% HP → no hint', () => withCp8(() => expect(chargeAdvice(qa(449, 798, 0.3)).danger).toBe(false)));
});
