// rc12 scheme 6 (2H Rending Blow → Shatter Strike interrupt, Skills.md:73-75, SIM_RC12_SHATTER) and bug b (banner vs decision line).
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

const setup = async (shatter: boolean) => {
  vi.resetModules(); if (shatter) process.env.SIM_RC12_SHATTER = '1'; else delete process.env.SIM_RC12_SHATTER;
  const B = await import('../src/core/battle'), { starterKit } = await import('../src/core/auto'), M = await import('../src/core/monsters'), P = await import('../src/core/player'), { RULES } = await import('../src/core/run');
  RULES.cp7 = true; RULES.cp8 = true;
  const pool = M.makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')));
  const mk = (hpShare: number, adbShare: number, pots = 0) => {
    const p = P.newPlayer(); starterKit(p); const d = P.derive(p);
    const m = M.buildMonster(pool.rows[0]!, 1, 'boss'); m.hp = m.maxHp = 1e6; m.adb = d.hp * adbShare; m.charge = 0;
    const b = B.startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: pots, mana: 0, spirit: 0 }); b.hp = Math.max(1, Math.round(d.hp * hpShare)); return b;
  };
  return { B, mk };
};
describe('rc12 scheme 6: blade (2H) interrupt', () => {
  it('off (default): Shatter Strike is not a stun skill', async () => { const { B } = await setup(false); expect(B.STUN_SKILLS).not.toContain('shatterStrike'); });
  it('on: Shatter Strike is the interrupt only while the boss has Penetrated Armor; Rending Blow keeps it up', async () => {
    const { B, mk } = await setup(true); const b = mk(1, 0.01); b.d = { ...b.d, style: 'twoHand' }; b.oc = 250; const m = b.monsters[0]!;
    expect(B.STUN_SKILLS).toContain('shatterStrike');
    expect(B.stunReady9(b, 'shatterStrike', 0)).toBe(false);
    expect(B.suggestSkill(b, 0)).toBe('rendingBlow');
    m.status.pa = 3; m.status.paTurns = 5; expect(B.stunReady9(b, 'shatterStrike', 0)).toBe(true);
    (m as { heavyNext?: boolean }).heavyNext = true; expect(B.drainStunKey(b, 0)).toBe('E·粉碎擊');
    delete process.env.SIM_RC12_SHATTER;
  });
});
describe('rc12 bug b: 「不防禦會死！」 only with a lethal estimate and D advised', () => {
  it('low HP, small hits (hpDanger without lethal) → not 「不防禦會死！」', async () => {
    const { B, mk } = await setup(false); const b = mk(0.2, 0.01); const a = B.chargeAdvice(b);
    expect(B.isLethal(a.est, a.hp)).toBe(false); expect(B.dangerTag9(b, a)).toBe('HP 偏低！');
  });
  it('lethal but advice not D (e.g. A) → 「HP 危險！」, never 「不防禦會死！建議 A」', async () => {
    const { B, mk } = await setup(false); const b = mk(0.2, 0.01);
    expect(B.dangerTag9(b, { est: 999, hp: 10, keys: ['A'], text: '', danger: true } as never)).toBe('HP 危險！');
  });
  it('app banner uses dangerTag9', () => expect(readFileSync('src/game/app.ts', 'utf8')).toMatch(/dangerTag9\(b, chargeAdvice\(b, this\.target\)\)/));
});
