import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, derive } from '../src/core/player';
import { encounter, startRun, RULES } from '../src/core/run';
import { startBattle, chargeEstimate, defNet12ah, defHeal12ag } from '../src/core/battle';
import { RUN12AH, mob12ag, boss12ag } from '../src/core/cp8';
import { starterKit } from '../src/core/auto';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
function fight(n: number, floor = 60) {
  const p = newPlayer(); starterKit(p); const d = derive(p); const r = startRun(p, 5); r.floor = floor;
  const ms = Array.from({ length: n }, () => { const m = encounter(r, pool, 'battle')[0]!; m.hp = m.maxHp = 1e7; m.rank = 'normal' as never; return m; });
  return startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 3, mana: 0, spirit: 0 });
}
const w = <T>(f: () => T) => { const o = RULES.cp8; RULES.cp8 = true; try { return f(); } finally { RULES.cp8 = o; } };
describe('rc12ah 3（自訂）: 防禦淨 HP A–B 含同回合其他怪', () => {
  it('A ≤ 舊版（只扣最大蓄力怪）且 A ≤ B ≤ maxHp', () => w(() => {
    const b = fight(3); b.monsters[0]!.charge = 1; b.oc = 1e3;
    const n = defNet12ah(b), h = defHeal12ag(b);
    const oldA = Math.max(0, Math.round(b.hp) + h - Math.round(chargeEstimate(b, b.monsters[0]!, true, true)));
    expect(n.a).toBeLessThanOrEqual(oldA); expect(n.a).toBeLessThanOrEqual(n.b); expect(n.b).toBeLessThanOrEqual(b.d.hp);
    expect(n.hiD).toBeGreaterThan(Math.round(chargeEstimate(b, b.monsters[0]!, true, true))); // 其他兩隻也計入
  }));
  it('暈眩怪不計（無復活）', () => w(() => {
    const b = fight(2); b.monsters[0]!.charge = 1; const all = defNet12ah(b).hiD; b.monsters[1]!.status.stun = 2;
    expect(defNet12ah(b).hiD).toBeLessThan(all);
  }));
});
describe('rc12ah 旋鈕（自訂）預設', () => {
  it('預設 mobFrom/mobTo/bossK/bossPot 為中性、blade bossPot 固定 0', () => {
    for (const s of ['blade', 'bulwark', 'oc', 'arcane']) { expect(RUN12AH.mobFrom[s]).toBe(0); expect(RUN12AH.bossK[s]).toBe(s === 'arcane' ? 0.85 : 1); }
    expect(RUN12AH.bossPot.blade).toBe(0); expect(mob12ag(50, 'oc')).toBe(1); expect(boss12ag(65, 'arcane')).toBe(0.85); expect(boss12ag(55, 'arcane')).toBe(1);
  });
});
