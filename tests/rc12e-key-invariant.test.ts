// rc12e QA bug (rc12d oc2 F40t14, boss charging, HP 159): decision line ★Z·喝藥 while the red line said 「只能靠保命」 and the
// payoff line 「按 D·防禦」. Invariant over many sim turns: every 「按 X」 in the rendered battle panel names the ★ key (primaryKey).
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { App } from '../src/game/app';
import { autoRun, starterKit, TURN_HOOK9 } from '../src/core/auto';
import { primaryKey, type BattleState } from '../src/core/battle';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, type Player } from '../src/core/player';
import { RULES, startRun } from '../src/core/run';
import { urgentLine } from '../src/game/app';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const strip = (h: string) => h.replace(/<[^>]+>/g, '');
/** Keys named by a 「按 X」 instruction in plain text (X = a battle key letter or a spell number). */
const pressed = (t: string) => [...t.matchAll(/按\s*★?\s*([A-Z1-6])(?=·|\b)/g)].map((m) => m[1]!);

describe('rc12e: hint texts name only the ★ key', () => {
  let o: boolean[] = [];
  beforeAll(() => { o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; });
  afterAll(() => { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; TURN_HOOK9.fn = null; });

  it('QA case: saveOnly verdict with ★Z → red line says ★Z·喝藥, no 「只能靠保命活下來」', () => {
    const u = urgentLine({ est: 404, hp: 159 }, 158, 282, { key: 'Z', label: 'Z·喝藥' });
    expect(strip(u)).toContain('按 ★Z·喝藥'); expect(u).not.toMatch(/只能靠保命活下來|按 D/);
    expect(urgentLine({ est: 404, hp: 159 }, 158, 282, { key: 'D', label: 'D·防禦' })).toContain('只能靠保命活下來');
  });

  it('sim sweep: every 「按 X」 in the battle panel equals the ★ key', () => {
    let turns = 0, named = 0; const bad: string[] = [];
    for (const lean of ['blade', 'oc', 'arcane', 'bulwark'] as Player['lean'][]) for (let seed = 1; seed <= 6; seed++) {
      const p = newPlayer(); p.lean = lean; starterKit(p, seed);
      const a = Object.create(App.prototype) as any; a.data = { player: p, run: startRun(p, seed), settings: { speed: 1, skipAnim: true } }; a.notice = []; Object.assign(a, { pk: null, log: [], pending: {}, enc: [], encAt: 0, cp5TipBox: [], recent: [], cdPending: [], cdShown: [], cdBattle: null, lastAdvice: null, lastHit: null, potSnap: null, queued: null, queued2: null, refused: '', chargeHoldUntil: 0, windWas: false, holdKey: null, monsters: [], screen: 'battle' });
      TURN_HOOK9.fn = (b: BattleState) => {
        a.battle = b; a.target = Math.max(0, b.monsters.findIndex((m) => m.hp > 0)); a.battleType = b.monsters.some((m) => (m as { boss?: boolean }).boss) ? 'boss' : 'battle';
        const pk = primaryKey(b, a.target);
        const keys = pressed(strip(a.battleHtml() as string)); turns++;
        for (const k of keys) { named++; if (k !== pk.key && bad.length < 5) bad.push(`${lean}/${seed} t${b.turn} ★${pk.key} 按${k}`); }
      };
      for (let i = 0; i < 3; i++) autoRun(p, pool, seed * 100 + i);
      TURN_HOOK9.fn = null;
    }
    expect(bad).toEqual([]);
    expect(turns).toBeGreaterThan(2000); expect(named).toBeGreaterThan(20);
  }, 120000);
});
