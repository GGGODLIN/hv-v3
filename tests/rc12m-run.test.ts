// rc12m（自訂）: run-wide pressure for all four schools (ON by default) + potion-cooldown floor (Z button text after a drink).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, startBattle, POT_FLOOR12M } from '../src/core/battle';
import { RUN12M, r12m, mob12m, deepK12g } from '../src/core/cp8';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { RULES } from '../src/core/run';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
describe('rc12m RUN12M', () => {
  it('is on by default with per-school potion-source cuts; merchant untouched; boss/monster single hit cap 0.4', () => {
    expect(RUN12M.on).toBe(true);
    expect(RUN12M.hit).toBe(0.4);
    for (const sc of ['blade', 'bulwark', 'oc', 'arcane']) for (const k of ['drop', 'chest', 'elite', 'rest'] as const) expect(r12m(sc, k)).toBeLessThanOrEqual(1);
    expect(r12m('bulwark', 'elite')).toBe(0); expect(r12m(undefined, 'drop')).toBe(1);
    expect(mob12m(30, 'bulwark', 'mobHp')).toBe(1); expect(mob12m(100, 'bulwark', 'mobHp')).toBe(3.5);
    expect(deepK12g('oc')).toBe(1); expect(deepK12g('bulwark')).toBe(10);
  });
});
describe('rc12m potion cooldown floor', () => {
  it('迅捷調和 (itemCd −1) no longer drops the health-potion cooldown to 0 after the drink turn', () => {
    expect(POT_FLOOR12M).toBe(1); const o = RULES.cp8; RULES.cp8 = true; try {
    const p = newPlayer(); const d = derive(p);
    const b = startBattle(d, { hp: Math.round(d.hp / 2), mp: d.mp, sp: d.sp }, [buildMonster(pool.rows[0]!, 1)], { health: 3, mana: 0, spirit: 0 });
    b.mods = { ...(b.mods ?? {}), itemCd: -1, combo: (b.mods as { combo?: object } | undefined)?.combo ?? {} } as never;
    act(b, { kind: 'item', id: 'health' }, new Rng(1));
    expect(b.itemCd.health).toBeGreaterThanOrEqual(1); // UI shows 「藥水冷卻中（還剩 N 回合）」 instead of 「×N」
    } finally { RULES.cp8 = o; }
  });
});
