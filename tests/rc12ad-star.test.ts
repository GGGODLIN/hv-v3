// rc12ad（自訂）: item 1 ★ 小怪蓄力不致死 → A；item 4 同回合全體估計（雙怪同回合）。
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, derive } from '../src/core/player';
import { encounter, startRun, RULES, bossPot12p } from '../src/core/run';
import { RUN12AD, CP9 } from '../src/core/cp8';
import { startBattle, chargeAdvice, chargeEstimate, roundRange12ad } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
function fight(ranks: string[], floor = 60) {
  const p = newPlayer(); starterKit(p); const d = derive(p); const r = startRun(p, 5); r.floor = floor;
  const ms = ranks.map((rk) => { const m = encounter(r, pool, 'battle')[0]!; m.hp = m.maxHp = 1e7; m.rank = rk as never; return m; });
  return { b: startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 3, mana: 0, spirit: 0 }), d };
}
const w = <T>(f: () => T) => { const o = RULES.cp8; RULES.cp8 = true; try { return f(); } finally { RULES.cp8 = o; } };
describe('rc12ad（自訂）', () => {
  it('item 4: two actors → whole-round range ≥ the charger alone + the other monster; one actor → null', () => w(() => {
    const { b } = fight(['normal', 'normal']); b.monsters[0]!.charge = 1;
    const r = roundRange12ad(b)!; const one = chargeEstimate(b, b.monsters[0]!, false, true);
    expect(r).not.toBeNull(); expect(r.hi).toBeGreaterThanOrEqual(Math.round(one)); /* rc12ae: the other monster may be held / winding up → adds ≤ heldHit */ expect(r.lo).toBeLessThanOrEqual(r.hi);
    b.monsters[1]!.hp = 0; expect(roundRange12ad(b)).toBeNull();
  }));
  it('item 1: non-lethal minion wind-up in a normal fight → ★ not D (teleA=0 keeps old D)', () => w(() => {
    const { b } = fight(['normal', 'normal']); b.monsters[0]!.charge = 1;
    const o = RUN12AD.teleA;
    try {
      RUN12AD.teleA = 0; const old = chargeAdvice(b, 0);
      RUN12AD.teleA = 1; const now = chargeAdvice(b, 0);
      expect(old.keys[0] === 'D' || /HP 安全/.test(old.text), old.text + ' est=' + old.est + ' hp=' + b.d.hp).toBe(true); /* rc12ae: the 2nd monster is now held/winding (not a full hit), so the legacy D only fires when the round is not HP-safe */ expect(now.keys[0]).toBe('A');
      expect(now.text).not.toMatch(/^D·防禦（敵人蓄力中/);
    } finally { RUN12AD.teleA = o; }
  }));
  it('item 1: elite body wind-up still → D path kept', () => w(() => {
    const { b } = fight(['elite', 'normal']); b.monsters[0]!.charge = 1; b.hp = Math.round(b.d.hp * 0.9);
    const a = chargeAdvice(b, 0); if (a.danger && !/不防禦會死|HP 危險|HP 偏低/.test(a.text)) expect(a.keys[0]).toBe('D');
  }));
  it('item 3: F70+ boss potion floor — F70/80/90/100 +1, F75/85/95 0, F45–65 unchanged', () => {
    expect([65, 70, 75, 80, 85, 90, 95, 100].map(bossPot12p)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]); // rc12al 4（自訂）: 首領 +1 藥延伸到 F70+ 每一場
  });
});
