// rc10（自訂，製作人決定）: items 0–3 — potion-cooldown aware tips, banner/decision consistency, post-hit 重新蓄力 text, 暈眩抵抗中 log.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chargeAdvice, coolStunKey9, deathTip, potCooling9, skillKit, startBattle, turnHints, zHint } from '../src/core/battle';
import { SIM_AI, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
export const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8, SIM_AI.naive]; RULES.cp7 = true; RULES.cp8 = true; SIM_AI.naive = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; SIM_AI.naive = o[2]!; } };
const lethalCooling = () => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 5000; m.adb = d.hp * 3; m.charge = 0;
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 3, mana: 0, spirit: 0 }); b.oc = 300; b.hp = Math.round(d.hp * 0.08); b.itemCd.health = 2; return b;
};

describe('rc10 item 0: potion cooldown → stun / S / D, never 「按 Z」', () => {
  it('deathTip: cooldown branch names 打斷技能、S、D; the Z branch carries the cooldown fallback', () => {
    const cd = deathTip({ lastDmg: 300, maxHp: 1000, pots: 2, potCd: 1 });
    expect(cd).toContain('打斷技能'); expect(cd).toContain('S·靈動架勢'); expect(cd).toContain('D·防禦'); expect(cd).not.toMatch(/按 Z/);
    const z = deathTip({ lastDmg: 300, maxHp: 1000, pots: 2, potCd: 0 });
    expect(z).toMatch(/HP 低於 60% 時就按 Z（藥水冷卻中則改用打斷技能（暈眩）、S·靈動架勢 或 D·防禦）/);
  });
  it('lethal + potion cooling + usable stun → stun key first, then S/D; no Z; sim presses the same stun', () => withCp8(() => {
    const b = lethalCooling(); expect(potCooling9(b)).toBe(true);
    const k = coolStunKey9(b, 0); expect(k).toMatch(/^[QWE]·(盾擊|震盪打擊)$/);
    const a = chargeAdvice(b, 0);
    expect(a.keys[0], a.text).toBe(k); expect(a.keys).not.toContain('Z'); expect(a.text).toContain('打斷'); expect(a.text).toMatch(/冷卻 2 回合/); expect(zHint(b)).toBe(false);
    expect(a.keys.slice(1).every((x) => x === 'S' || x === 'D')).toBe(true);
    expect(turnHints(b, 0).adv!.keys[0]).toBe(k); // UI panel and the sim's ui policy read this same chargeAdvice expect(skillKit(b).length).toBeGreaterThan(0);
  }));
  it('no stun when the target is already stunned / OC is short → falls back to S/D as before', () => withCp8(() => {
    const b = lethalCooling(); b.oc = 0; expect(coolStunKey9(b, 0)).toBeNull(); expect(chargeAdvice(b, 0).keys[0]).toMatch(/^[SDA]$/);
    const c = lethalCooling(); c.monsters[0]!.status.stun = 2; expect(coolStunKey9(c, 0)).toBeNull();
  }));
  it('potion ready (not cooling) → no stun-first rewrite', () => withCp8(() => {
    const b = lethalCooling(); b.itemCd.health = 0; expect(potCooling9(b)).toBe(false); expect(chargeAdvice(b, 0).keys[0]).not.toMatch(/^[QWE]·/);
  }));
});
