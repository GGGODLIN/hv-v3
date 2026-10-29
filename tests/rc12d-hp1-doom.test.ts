// rc12d QA items 1/2（製作人）: HP 1 + no potion + no option that ensures survival/kill → 「此戰幾乎必敗」 after every filter;
// the 保命-only verdict reads the same in the decision line and the red urgent line.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chargeAdvice, saveOnlyNote9, startBattle, nextRoundEstimate, defVerdictAt9 } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { urgentLine } from '../src/game/app';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const fight = (adbShare: number, wind: boolean, spikes = false) => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1, 'boss'); m.hp = m.maxHp = 1e6; m.adb = d.hp * adbShare; m.charge = 0;
  if (wind) (m as { heavyNext?: boolean }).heavyNext = true;
  if (spikes) { (m as { thornTurns?: number }).thornTurns = 3; }
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 });
  if (spikes) (b as { cp5?: boolean }).cp5 = true;
  b.hp = 1; b.oc = 0; return b;
};
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; } };
describe('rc12d HP 1 必敗', () => {
  it('bw1-like: reflect (刺盾) rewrites A → D, 「此戰幾乎必敗」 survives the rewrite', () => withCp8(() => {
    const b = fight(0.05, false, true), a = chargeAdvice(b);
    expect(a.keys[0]).not.toBe('A'); expect(a.text).toMatch(/此戰幾乎必敗/);
  }));
  it('D that only holds through 保命 at HP 1 is not a sure survival → 必敗 + D', () => withCp8(() => {
    for (const k of [0.3, 1, 2, 5]) { const b = fight(k, true), a = chargeAdvice(b);
      if (a.keys[0] === 'D' && defVerdictAt9(b, b.hp) !== 'safe') expect(a.text).toMatch(/此戰幾乎必敗/); }
  }));
  it('the 必敗 tag is never doubled', () => withCp8(() => {
    for (const k of [0.05, 2]) for (const w of [true, false]) expect(chargeAdvice(fight(k, w)).text.split('此戰幾乎必敗').length).toBeLessThanOrEqual(2);
  }));
});
describe('rc12d T60: decision line and urgent line share the 保命 verdict', () => {
  it('saveOnly text is one shared string and never says 「下一擊撐不住」 alone', () => {
    const u = urgentLine({ est: 404, hp: 1 }, 0, 282);
    expect(u).toContain(saveOnlyNote9(282, 1));
    expect(u).not.toMatch(/，下一擊撐不住</);
  });
  it('HP 1 boss charging, D via 保命: the decision text carries the same note as the urgent line', () => withCp8(() => {
    for (const k of [0.3, 1, 2]) { const b = fight(k, true), a = chargeAdvice(b);
      if (a.keys[0] === 'D' && defVerdictAt9(b, b.hp) === 'saveOnly') {
        const note = saveOnlyNote9(Math.round(nextRoundEstimate(b, true, true, true)), 1);
        expect(a.text).toContain(note);
        expect(urgentLine({ est: a.est, hp: 1 }, Math.round(nextRoundEstimate(b, true, true)), Math.round(nextRoundEstimate(b, true, true, true)))).toContain(note);
      } }
  }));
});
describe('rc12d+ item 4: 必敗 also in normal fights (QA oc2 F36)', () => {
  it('HP 1, 0 potions, normal monster that will hit → 必敗', () => withCp8(() => {
    const p = newPlayer(); starterKit(p); const d = derive(p);
    const m = buildMonster(pool.rows[0]!, 1, 'normal'); m.hp = m.maxHp = 1e6; m.adb = d.hp * 0.25; m.charge = 0; /* rc12ae（自訂）: adb ≥ bigTele would wind up first (0 this round, real act loop) → keep the plain hit below bigTele */
    const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 }); b.hp = 1; b.oc = 0;
    if (Math.round(nextRoundEstimate(b, true)) > 0) expect(chargeAdvice(b).text).toMatch(/此戰幾乎必敗/);
    expect(Math.round(nextRoundEstimate(b, true))).toBeGreaterThan(0);
  }));
});
