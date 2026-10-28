// rc12r QA bug（rc12q bl1 F36 t8 / F46 t2）: 「下回合全體暴擊估計」 174 while the same panel's 「預估傷害」 and the real 蓄力一擊 were 349.
// Invariant: the ★ decision estimate (chargeAdvice → roundEstimate) is never below the biggest wind-up hit the panel shows,
// and the real charged hit stays within the rc22 mean-roll crit estimate × top roll (≤ 1.2×; the estimate is the mean roll by design).
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { act, chargeAdvice, chargeEstimate, roundEstimate, startBattle, windingUp } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const mk = (adb: number) => {
  const p = newPlayer(); starterKit(p);
  const d = { ...derive(p), hp: 874 } as ReturnType<typeof derive>; // F36 bl1 max HP
  const m = buildMonster(pool.rows[0]!, 36); m.hp = m.maxHp = 1e6; m.adb = adb; m.evade = 0;
  const b = startBattle(d, { hp: 504, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 });
  (m as { heavyNext?: boolean }).heavyNext = true; return b;
};
import { CP9 } from '../src/core/cp8';
// rc12s: QA scenario recorded under the 40% normal-fight cap — pin the old cap (normalCharge 0 → minionCharge 0.4); 30% is covered by rc12s-normal-charge.test.ts
let nc12s = 0; beforeAll(() => { nc12s = CP9.normalCharge; (CP9 as { normalCharge: number }).normalCharge = 0; }); afterAll(() => { (CP9 as { normalCharge: number }).normalCharge = nc12s; });
describe('rc12r: one round estimate for ★ and 預估傷害', () => {
  let o: boolean[] = [];
  beforeAll(() => { o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; });
  afterAll(() => { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; });
  it('charging minion at F36 stats: decision est ≥ panel crit hit ≥ 349 cap, and ≥ the real hit', () => {
    for (const adb of [300, 600, 1200, 5000]) {
      const b = mk(adb); expect(windingUp(b.monsters[0]!)).toBe(true);
      const panel = Math.round(chargeEstimate(b, b.monsters[0]!, false, true));
      const a = chargeAdvice(b, 0);
      expect(a.est).toBe(Math.round(roundEstimate(b, true)));
      expect(a.est).toBeGreaterThanOrEqual(panel);
      if (adb >= 1200) { expect(panel).toBe(349); expect(a.est).toBeGreaterThanOrEqual(349); }
      for (let seed = 1; seed <= 20; seed++) {
        const c = mk(adb), hp0 = c.hp; const ev0 = act(c, { kind: "attack", target: 0 }, new Rng(seed)) as any[];
if (hp0 - c.hp > Math.ceil(a.est * 1.2) + 1) throw new Error(`adb${adb} s${seed} drop${hp0 - c.hp} est${a.est} ${JSON.stringify(ev0.filter((e) => e.to === "player"))}`);
      }
    }
  });
});

import { App } from '../src/game/app';
import { autoRun, TURN_HOOK9 } from '../src/core/auto';
import { startRun } from '../src/core/run';
import type { BattleState } from '../src/core/battle';
import type { Player } from '../src/core/player';
describe('rc12r: rendered panel — 暴擊估計 ≥ 預估傷害 crit on every wind-up turn', () => {
  it('sim sweep (blade / bulwark)', () => {
    const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; const bad: string[] = []; let n = 0;
    const strip = (h: string) => h.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
    try {
      for (const lean of ['blade', 'bulwark'] as Player['lean'][]) for (let seed = 1; seed <= 8; seed++) {
        const p = newPlayer(); p.lean = lean; starterKit(p, seed);
        const a = Object.create(App.prototype) as any; a.data = { player: p, run: startRun(p, seed), settings: { speed: 1, skipAnim: true } }; a.notice = [];
        Object.assign(a, { pk: null, log: [], pending: {}, enc: [], encAt: 0, cp5TipBox: [], recent: [], cdPending: [], cdShown: [], cdBattle: null, lastAdvice: null, lastHit: null, potSnap: null, queued: null, queued2: null, refused: '', chargeHoldUntil: 0, windWas: false, holdKey: null, monsters: [], screen: 'battle' });
        TURN_HOOK9.fn = (b: BattleState) => {
          if (!b.monsters.some(windingUp)) return;
          a.battle = b; a.target = Math.max(0, b.monsters.findIndex((m) => m.hp > 0)); a.battleType = 'battle';
          const h = a.battleHtml() as string, t = strip(h); n++;
          const em = t.match(/下回合(?:全體)?暴擊估計\s*(\d+)/), cc = h.match(/data-chargecrit="(\d+)/);
          if (em && cc && +em[1]! < +cc[1]! && bad.length < 5) bad.push(`${lean}/${seed} t${b.turn} 估計${em[1]} < 預估${cc[1]}`);
        };
        for (let i = 0; i < 2; i++) autoRun(p, pool, seed * 100 + i);
        TURN_HOOK9.fn = null;
      }
    } finally { TURN_HOOK9.fn = null; RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; }
    expect(bad).toEqual([]); expect(n).toBeGreaterThan(100);
  }, 120000);
});
