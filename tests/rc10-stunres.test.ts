// rc10 QA（自訂）: cp9-rc9 arcane-6 F30/F50 t2 — boss charging while 暈眩抵抗中 still got Q (stun) as the first hint key.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chargeAdvice, drainStunKey, startBattle, stunResisting9, stunTag9, turnHints, STUN_SKILLS } from '../src/core/battle';
import { SIM_AI, starterKit } from '../src/core/auto';
import { CP9 } from '../src/core/cp8';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8, SIM_AI.naive]; RULES.cp7 = true; RULES.cp8 = true; SIM_AI.naive = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; SIM_AI.naive = o[2]!; } };
const mk = (hp: number) => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 30, 'boss'); m.hp = m.maxHp = 50000; m.adb = 300; m.charge = 1;
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 3, mana: 0, spirit: 0 }); b.oc = 300; b.hp = hp; return { b, m: m as typeof m & { stunImm9?: number } };
};
const isStun = (k: string | undefined) => /盾擊|震盪打擊/.test(k ?? '');
describe('rc10 QA: no stun hint while the charging boss resists stuns', () => {
  for (const hp of [9999, 200]) it(`hp ${hp}: control → stun first; resisting → no stun key, no stun skill hint`, () => withCp8(() => {
    expect(CP9.stunImm).toBeGreaterThan(0);
    const { b, m } = mk(hp); b.hp = Math.min(hp, b.d.hp);
    expect(isStun(drainStunKey(b, 0) ?? '')).toBe(true); // control: same state without resist still suggests the stun
    m.stunImm9 = 2; expect(stunResisting9(m)).toBe(true);
    expect(drainStunKey(b, 0)).toBeNull();
    const keys = chargeAdvice(b, 0).keys; expect(keys.some(isStun)).toBe(false); expect(keys.length).toBeGreaterThan(0);
    const h = turnHints(b, 0); expect(h.skill && STUN_SKILLS.includes(h.skill)).toBeFalsy();
    expect(stunTag9(m)).toBe('暈眩抵抗中（剩 2 回合）');
  }));
  it('UI redraws boss bars (and the resist tag) after each round', () => {
    expect(readFileSync('src/game/app.ts', 'utf8')).toMatch(/this\.stage\.play\(ev, b\)[^\n]*\n\s*this\.stage\.refresh\(\)/);
  });
});
describe('rc10: vitest strips sim env switches', () => {
  it('no SIM_* / CP8 / P5 reaches the tests', () => {
    expect(Object.keys(process.env).filter((k) => /^(SIM_|CP\d+$|P5$)/.test(k))).toEqual([]);
  });
});
