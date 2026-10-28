// rc12k round 2 item 2（自訂）: health-potion cooldown in a boss fight ≤ 8 turns for every school × floor (QA rc12j saw F70 ~16, F100 ~30).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, armCp5, primaryKey, startBattle, POT_CD_MAX12K } from '../src/core/battle';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, armBattle, battleLocks, openingOc, runDerived } from '../src/core/run';
import { Rng } from '../src/core/rng';
import { potCdAt12h } from '../src/core/cp8';
import { realBoss } from '../scripts/rc12f-realboss';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const P = JSON.parse(readFileSync('tests/fixtures/rc12k-bulwark-1anh-F60.json', 'utf8'));
const R0 = { ...RULES };
const on = () => { RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true; };
const SCHOOLS = ['bulwark', 'blade', 'arcane', 'oc', undefined];
const FLOORS = [30, 40, 50, 60, 65, 70, 75, 80, 85, 90, 95, 100];
function fight(F: number, lean?: string) { const p = structuredClone(P.player), run = structuredClone(P.run); run.floor = F; p.lean = lean;
  const ms = structuredClone(realBoss(run, pool, true, lean).ms), d = runDerived(p, run);
  const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp, oc: run.oc }, ms, { ...p.potions, health: 5 });
  b.locked = battleLocks(p); armBattle(b, run, lean, !!p.equipped?.offHand); b.oc += openingOc(p, 'boss', run); if (run.cp5) armCp5(b, run.pdot);
  return b; }
describe('rc12k: potion cooldown cap', () => {
  it('bonus formula ≤ 6 everywhere', () => { for (const l of SCHOOLS) for (const f of FLOORS) expect(potCdAt12h(f, l)).toBeLessThanOrEqual(6); });
  it('real boss fight: drinking sets itemCd ≤ 8 for every school × floor, even with +itemCd mods', () => { on(); try {
    for (const l of SCHOOLS) for (const f of FLOORS) for (const extra of [0, 5]) {
      const b = fight(f, l); b.mods = { ...(b.mods ?? {}), itemCd: (b.mods?.itemCd ?? 0) + extra } as typeof b.mods; b.hp = Math.round(b.d.hp * 0.3);
      act(b, { kind: 'item', id: 'health' }, new Rng(1));
      expect(b.itemCd.health, `${l} F${f} +${extra}`).toBeLessThanOrEqual(POT_CD_MAX12K);
    } } finally { Object.assign(RULES, R0); } });
  it('★ does not drink while HP is high', () => { on(); try {
    for (const l of SCHOOLS) for (const f of [40, 70, 100]) { const b = fight(f, l); b.hp = Math.round(b.d.hp * 0.9);
      for (const m of b.monsters) m.charge = 0;
      expect(primaryKey(b, 0)?.key, `${l} F${f}`).not.toBe('Z'); } } finally { Object.assign(RULES, R0); } });
});
// rc12k round 2 item 4（自訂）: stable unit version of cp8-rc12-e2e item 5 (that e2e flakes before the battle opens).
describe('rc12k: S hint when HP in danger and the potion is cooling', () => {
  it('HP 1, potion cooldown, OC full → ★ S (every school)', () => { on(); try {
    for (const l of SCHOOLS) { const b = fight(40, l); const m = b.monsters.find((x) => x.hp > 0)!;
      b.monsters = [{ ...m, hp: 1e9, maxHp: 1e9, adb: 1 }]; b.hp = 1; b.itemCd.health = 3; b.oc = 999; b.spirit = false;
      const pk = primaryKey(b, 0); expect(pk?.key, String(l)).toBe('S'); expect(pk?.why).toContain('藥水冷卻中'); } } finally { Object.assign(RULES, R0); } });
});
