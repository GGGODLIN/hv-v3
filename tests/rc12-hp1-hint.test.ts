// rc12 item 4（自訂）: HP 1, no potion, boss winding up → never plain A; guaranteed stun / D that holds / 「此戰幾乎必敗」.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chargeAdvice, startBattle } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { RC12 } from '../src/core/cp8';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const fight = (adbShare: number, wind: boolean) => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1, 'boss'); m.hp = m.maxHp = 1e6; m.adb = d.hp * adbShare; m.charge = 0;
  if (wind) (m as { heavyNext?: boolean }).heavyNext = true;
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 });
  b.hp = 1; b.oc = 0; return b;
};
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; } };
describe('rc12 item 4: HP 1 + no potion + boss charging', () => {
  it('on by default (SIM_RC12_HP1TELE=0 restores rc11)', () => expect(RC12.hp1Tele).toBe(true));
  it('a big telegraphed hit → 「此戰幾乎必敗」, key D (no in-battle retreat), not A', () => withCp8(() => {
    const a = chargeAdvice(fight(2, true));
    expect(a.text).toMatch(/^此戰幾乎必敗|撐得住|必中暈眩/); expect(a.keys[0]).not.toBe('A');
  }));
  it('the hint names a survivable option or says the fight is lost — never 「直接輸出」 while the boss charges', () => withCp8(() => {
    for (const k of [0.001, 0.05, 0.5, 3]) { const a = chargeAdvice(fight(k, true)); expect(a.text).not.toMatch(/直接輸出/); expect(a.text).toMatch(/此戰幾乎必敗|撐得住|必中暈眩/); }
  }));
  it('boss not charging → rc11 rule unchanged (A, 「直接輸出」)', () => withCp8(() => {
    const a = chargeAdvice(fight(0.05, false)); if (a.keys[0] === 'A') expect(a.text).not.toMatch(/此戰幾乎必敗/);
  }));
});
