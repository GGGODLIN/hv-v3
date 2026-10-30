// rc12ac（自訂）: 非 arcane 一般/精英戰小怪蓄力 25%、arcane 20%、精英本體 40%、首領戰小怪 30%（首領本體不變）。
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, derive } from '../src/core/player';
import { encounter, startRun, RULES } from '../src/core/run';
import { CP9, RUN12AC } from '../src/core/cp8';
import { startBattle, hitCap9 } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
function fight(ranks: string[]) {
  const p = newPlayer(); starterKit(p); const d = derive(p); const r = startRun(p, 5); r.floor = 60;
  const ms = ranks.map((rk) => { const m = encounter(r, pool, 'battle')[0]!; m.hp = m.maxHp = 1e7; m.rank = rk as never; return m; });
  return { b: startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 0, mana: 0, spirit: 0 }), d };
}
const w = <T>(f: () => T) => { const o = RULES.cp8; RULES.cp8 = true; try { return f(); } finally { RULES.cp8 = o; } };
describe('rc12ac caps（自訂）', () => {
  it('defaults', () => { expect(RUN12AC.minion).toBe(0.25); expect(RUN12AC.bossMinion).toBe(0.3); });
  it('normal fight: minion 25%, arcane chg12aa 20%', () => w(() => {
    const { b, d } = fight(['normal', 'normal']); const m = b.monsters[0]!;
    expect(hitCap9(b, m, 2, true)).toBe(Math.floor(0.25 * d.hp));
    (m as { chg12aa?: number }).chg12aa = 0.2; expect(hitCap9(b, m, 2, true)).toBe(Math.floor(0.2 * d.hp));
  }));
  it('elite fight: body 40%, minion 25%', () => w(() => {
    const { b, d } = fight(['elite', 'normal']);
    expect(hitCap9(b, b.monsters[0]!, 2, true)).toBe(Math.floor(Math.min(CP9.minionCharge, 0.35) * d.hp)); // rc12al（自訂）: 單擊上限 0.35
    expect(hitCap9(b, b.monsters[1]!, 2, true)).toBe(Math.floor(0.25 * d.hp));
  }));
  it('boss fight: minions (incl. elite adds) 30%; boss body uncapped by this rule', () => w(() => {
    const { b, d } = fight(['boss', 'normal', 'elite']);
    expect(hitCap9(b, b.monsters[1]!, 2, true)).toBe(Math.floor(0.3 * d.hp));
    expect(hitCap9(b, b.monsters[2]!, 2, true)).toBe(Math.floor(0.3 * d.hp));
    expect(hitCap9(b, b.monsters[0]!, 2, true)).not.toBe(Math.floor(0.3 * d.hp));
  }));
});
