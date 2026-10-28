// rc10 spec item 4（自訂）: boss wind-up + stun usable + boss not resisting → the hint leads with Q (lethal/potion rules kept);
// item 3: between wind-ups the stun skill is kept for the interrupt (RC10H.reserveQ).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chargeAdvice, RC10H, startBattle, turnHints, STUN_SKILLS } from '../src/core/battle';
import { SIM_AI, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8, SIM_AI.naive]; RULES.cp7 = true; RULES.cp8 = true; SIM_AI.naive = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; SIM_AI.naive = o[2]!; } };
const mk = (o: { charge?: number; hp?: number; adb?: number; pots?: number } = {}) => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 30, 'boss'); m.hp = m.maxHp = 50000; m.adb = o.adb ?? 300; m.charge = o.charge ?? 1;
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: o.pots ?? 3, mana: 0, spirit: 0 }); b.oc = 300; b.hp = Math.min(o.hp ?? 99999, b.d.hp); return { b, m };
};
const isStun = (k: string | undefined) => /盾擊|震盪打擊/.test(k ?? '');
describe('rc10 spec 4: Q first on a boss wind-up', () => {
  it('safe HP: Q is the first key', () => withCp8(() => { const { b } = mk(); expect(isStun(chargeAdvice(b, 0).keys[0])).toBe(true); }));
  it('lethal + potion usable: Z or Q first, Q still offered', () => withCp8(() => {
    const { b } = mk({ hp: 5, adb: 5000 }); const k = chargeAdvice(b, 0).keys;
    expect(isStun(k[0]) || k[0] === 'Z').toBe(true); expect(k.some(isStun)).toBe(true);
  }));
  it('lethal + potion cooling down: Q first, never Z', () => withCp8(() => {
    const { b } = mk({ hp: 5, adb: 5000 }); b.itemCd.health = 3; const k = chargeAdvice(b, 0).keys;
    expect(isStun(k[0])).toBe(true); expect(k).not.toContain('Z');
  }));
  it('stun on cooldown: no Q key', () => withCp8(() => {
    const { b } = mk(); for (const id of STUN_SKILLS) b.cooldowns[id] = 5; expect(chargeAdvice(b, 0).keys.some(isStun)).toBe(false);
  }));
});
describe('rc10 spec 3: stun kept for the interrupt between wind-ups', () => {
  it('boss not winding up → skill hint is never the stun', () => withCp8(() => {
    expect(RC10H.reserveQ).toBe(true);
    const { b } = mk({ charge: 0 }); const h = turnHints(b, 0); expect(h.skill && STUN_SKILLS.includes(h.skill)).toBeFalsy();
  }));
});
