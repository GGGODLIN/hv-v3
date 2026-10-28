import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { startBattle, act, chargeAdvice, skillValue, turnDamage } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { CP9, RC22 } from '../src/core/cp8';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { Rng } from '../src/core/rng';
// cp9 rc1 (a)(b)(c)（自訂，非原版）
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; } };
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const boss = (adb: number) => { const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e7; m.adb = adb; m.acc = 1e9; m.rank = 'boss'; return m; };
const fresh = (adb: number) => { const p = newPlayer(); starterKit(p); const d = derive(p); return startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [boss(adb)], { health: 3, mana: 0, spirit: 0 }); };

describe('cp9 rc1', () => {
  it('defaults: normalCap 2, boss burst 50% / plain 30%, Z-hold above 40% HP', () => {
    expect(RC22.normalCap).toBe(2); expect(CP9).toMatchObject({ on: true, bossBurst: 0.5, bossPlain: 0.2 /* cp9-rc5 (2)（自訂） */, zHp: 0.4 });
  });
  it('(b) a boss turn never takes more than 50% max HP, and more than 30% only after a telegraph', () => withCp8(() => {
    for (let seed = 1; seed <= 40; seed++) {
      const b = fresh(1e5); const rng = new Rng(seed); let teleSeen = false;
      for (let t = 0; t < 6 && !b.over; t++) {
        b.hp = b.d.hp; const tele = b.monsters.some((m) => m.charge > 0 || (m as { heavyNext?: boolean }).heavyNext);
        const f = turnDamage(act(b, { kind: 'defend' }, rng)) / b.d.hp;
        expect(f).toBeLessThanOrEqual(0.5 + 1e-9); if (!tele) expect(f).toBeLessThanOrEqual(0.2 + 1e-9); if (tele) teleSeen = true;
      }
      void teleSeen;
    }
  }));
  it('(c) telegraphed charge, HP above 50% and D keeps HP > estimate → D, not Z', () => withCp8(() => {
    // rc12p（自訂）: the estimate is now capped by the 50% burst budget like the real hit, so at 80% HP the charge is no longer flagged lethal;
    // below the cap the potion still comes first.
    const b = fresh(1e5); b.monsters[0]!.charge = 1; b.hp = Math.round(b.d.hp * 0.8);
    const a = chargeAdvice(b); expect(a.est).toBeLessThanOrEqual(b.d.hp * 0.5); expect(a.keys[0]).not.toBe('Z'); b.hp = Math.round(b.d.hp * 0.3); expect(chargeAdvice(b).keys[0]).toBe('Z');
  }));
  it('(a) a stun skill is worth more when its target is winding up', () => withCp8(() => {
    const b = fresh(300); b.monsters[0]!.rank = 'elite'; const v0 = skillValue(b, 'shieldBash', 0); b.monsters[0]!.charge = 1;
    expect(skillValue(b, 'shieldBash', 0)).toBeGreaterThan(v0);
  }));
});
