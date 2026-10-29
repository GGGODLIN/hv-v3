// rc12ae（自訂，bug fix）: 1 同回合全體估計／★ 致命判定只把真的在蓄力的怪算成蓄力一擊；2 反傷文字顯示反傷＋下回合估計。
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, derive } from '../src/core/player';
import { encounter, startRun, RULES } from '../src/core/run';
import { CP8, RUN12AB } from '../src/core/cp8';
import { startBattle, chargeEstimate, roundRange12ad, actHits12ae, nextRoundEstimate, worstHit, chargeAdvice } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
function fight(n: number, floor = 60) {
  const p = newPlayer(); starterKit(p); const d = derive(p); const r = startRun(p, 5); r.floor = floor;
  const ms = Array.from({ length: n }, () => { const m = encounter(r, pool, 'battle')[0]!; m.hp = m.maxHp = 1e7; m.rank = 'normal' as never; return m; });
  return startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 3, mana: 0, spirit: 0 });
}
const w = <T>(f: () => T) => { const o = RULES.cp8; RULES.cp8 = true; try { return f(); } finally { RULES.cp8 = o; } };
describe('rc12ae（自訂）', () => {
  it('1: one charger + a big hitter → the big hitter is not counted as a full plain hit (held ≤ heldHit or winds up)', () => w(() => {
    const b = fight(2); b.monsters[0]!.charge = 1;
    const big = worstHit(b, b.monsters[1]!, false) >= CP8.bigTele * b.d.hp;
    const h = actHits12ae(b, false, false);
    if (big) expect(h[1]).toBeLessThanOrEqual(Math.floor(RUN12AB.heldHit * b.d.hp));
    else expect(h[1]).toBe(Math.round(h[1]!)); // plain-hit monster keeps its plain estimate
    const one = chargeEstimate(b, b.monsters[0]!, false, false);
    expect(nextRoundEstimate(b, false, false)).toBeLessThanOrEqual(Math.round(one + Math.max(h[1]!, 0)) + 1);
  }));
  it('1: big hitters with no charger → first one winds up (0), the rest held by the shared lock', () => w(() => {
    const b = fight(3); b.d.hp = 10; b.hp = 10; // tiny max HP → every plain hit ≥ bigTele
    for (const m of b.monsters) expect(worstHit(b, m, false)).toBeGreaterThanOrEqual(CP8.bigTele * b.d.hp);
    const h = actHits12ae(b, false, false);
    expect(h[0]).toBe(0); for (const x of h.slice(1)) expect(x).toBeLessThanOrEqual(Math.floor(RUN12AB.heldHit * b.d.hp));
    const r = roundRange12ad(b)!; expect(r.lo).toBeLessThanOrEqual(r.hi);
  }));
  it('1: stunned monsters add nothing', () => w(() => {
    const b = fight(2); b.monsters[1]!.status.stun = 2; expect(actHits12ae(b, false, false)[1]).toBe(0);
  }));
  it('2: reflect-lethal text shows reflect + next-round estimate and their sum (bl1 F61 T15)', () => w(() => {
    const b = fight(2); b.monsters[0]!.charge = 1; (b as { cp5?: unknown }).cp5 ??= true; for (const m of b.monsters) (m as { thornTurns?: number }).thornTurns = 3;
    let t = '';
    for (let hp = b.d.hp; hp >= 1 && !t.includes('反傷'); hp--) { b.hp = hp; t = chargeAdvice(b, 0).text; }
    expect(t).toMatch(/反傷約 \d+，加上下回合敵方估計 \d+，合計 \d+ ≥ HP \d+，會自殺/);
    expect(t).not.toMatch(/反傷約 \d+ ≥ HP/); // rc12ad wording printed only r
    const [, r, e, sum] = t.match(/反傷約 (\d+)，加上下回合敵方估計 (\d+)，合計 (\d+)/)!.map(Number); expect(sum).toBe(r! + e!);
  }));
});
