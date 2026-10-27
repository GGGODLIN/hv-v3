import { readFileSync } from 'node:fs';
import { describe, expect, it , beforeAll, afterAll} from 'vitest';
import { CP9 } from '../src/core/cp8';
// cp9（自訂）: these pin the rc19–rc21 advice rules, superseded by cp9 (c); run them with the CP9 layer off.
beforeAll(() => { CP9.on = false; }); afterAll(() => { CP9.on = true; });
import { chargeAdvice, chargeEstimate, startBattle, type BattleState } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { applyLoot, battleLoot, encounter, runDerived, RULES, startRun } from '../src/core/run';
import { chargeKind } from '../src/game/app';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; } };
const fight = (hpShare: number, estShare: number, pots = 5, cd = 0): BattleState => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e6; m.charge = 0; m.adb = d.hp * 0.05;
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: pots, mana: 0, spirit: 0 });
  b.hp = Math.max(1, Math.round(d.hp * hpShare)); b.itemCd.health = cd; b.oc = 0;
  for (let i = 0; i < 6; i++) m.adb *= (d.hp * estShare) / Math.max(1, chargeEstimate(b, m, false, true));
  return b;
};

describe('rc21 QA bug 1: full HP → the reason Z is out is 「HP 已滿」, never 「冷卻 0 回合」', () => {
  for (const est of [0.6, 0.9, 1.3]) it(`full HP, estimate ${est}× max HP`, () => withCp8(() => {
    const a = chargeAdvice(fight(1, est));
    expect(a.text).not.toContain('冷卻 0 回合');
    if (a.text.includes('生命藥水')) expect(a.text).toContain('滿血無需喝藥');
  }));
  it('estimate ≥ HP at full HP names HP 已滿', () => withCp8(() => expect(chargeAdvice(fight(1, 1.3)).text).toContain('滿血無需喝藥')));
  it('cooldown and empty cases keep their text', () => withCp8(() => {
    expect(chargeAdvice(fight(0.5, 0.6, 5, 2)).text).not.toContain('滿血無需喝藥');
    expect(chargeAdvice(fight(1, 0.6, 0)).text).not.toContain('滿血無需喝藥');
  }));
});

describe('rc21 QA bug 2: build badge lists CP8', () => {
  // cp9 rc2 (5)（自訂）: badge is now one CP list; CP8 and CP9 must both be in it.
  it('main.ts badge has · CP8', () => { const t = readFileSync('src/main.ts', 'utf8'); expect(t).toContain("['CP8', RULES.cp8]"); expect(t).toContain("['CP9', RULES.cp8 && CP9.on]"); });
});

describe('rc21 QA bug 3: each charger gets its own wind-up text', () => {
  it('boss 重擊 and a minion 蓄力一擊 read differently', () => {
    expect(chargeKind({ charge: 1 })).toContain('重擊');
    expect(chargeKind({ charge: 0, heavyNext: true })).toContain('蓄力一擊');
    expect(chargeKind({ charge: 0 })).toContain('元素脈衝');
  });
  it('panel maps every charger through chargeKind', () => expect(readFileSync('src/game/app.ts', 'utf8')).toContain('${esc(m.name)} ${chargeKind(m)}'));
});

describe('rc21 QA bug 4: in-run max HP only drops when auto-wear swaps gear (CP8.autoWear)', () => {
  it('60 runs × 15 boss/elite loots: every max-HP drop coincides with an auto-worn piece', () => withCp8(() => {
    let drops = 0;
    for (let s = 0; s < 60; s++) {
      const p = newPlayer(); starterKit(p); const run = startRun(p, s);
      for (let k = 0; k < 15; k++) {
        const t = k % 2 ? 'boss' : 'elite';
        const before = runDerived(p, run).hp, worn0 = run.worn?.length ?? 0;
        const L = battleLoot(run, encounter(run, pool, t), t); applyLoot(p, run, L);
        const after = runDerived(p, run).hp;
        if (after < before) { drops++; expect(run.worn?.length ?? 0).toBeGreaterThan(worn0); expect(run.hp).toBeLessThanOrEqual(after); expect(L.hpDrop).toBe(before - after); } else expect(L.hpDrop).toBeUndefined();
        if ((run.worn?.length ?? 0) === worn0) expect(after).toBe(before);
      }
    }
    expect(drops).toBeGreaterThan(0); // the drop really happens (arcane7 760→736 kind)
  }));
});
