import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chargeAdvice, hpDanger, lowHp, POT_HINT, startBattle, zHint } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
/** QA rc19 cases: a normal (non-charging) fight, small hits, HP set to the observed share of max HP. */
const qa = (hp: number, max: number, pots: number, cd: number, adbShare = 0.02) => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e6; m.adb = d.hp * adbShare; m.charge = 0;
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: pots, mana: 0, spirit: 0 });
  b.hp = Math.max(1, Math.round(d.hp * hp / max)); b.itemCd.health = cd; b.oc = 0; return b;
};
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; } };
describe('rc20 item 1: potion hint looks at HP (≤ 35%, 暫定)', () => {
  it('threshold is 35% and marked', () => { expect(POT_HINT.low).toBe(0.35); expect(readFileSync('src/core/battle.ts', 'utf8')).toMatch(/暫定，製作人舉例 ≤35%/); });
  it('bulwark7-death F13: 177/772, Z×12 ready, no charge → Z lit, Z first', () => withCp8(() => {
    const b = qa(177, 772, 12, 0); const a = chargeAdvice(b);
    expect(a.est).toBeLessThan(a.hp); expect(a.danger).toBe(true); expect(a.keys[0]).toBe('Z'); expect(zHint(b)).toBe(true); expect(a.text).toContain('HP 偏低');
  }));
  it('bulwark8-death F11: 189/784, Z×12 ready → Z lit', () => withCp8(() => { const b = qa(189, 784, 12, 0); expect(chargeAdvice(b).keys[0]).toBe('Z'); expect(zHint(b)).toBe(true); }));
  it('above 35% with small hits: no Z, not danger', () => withCp8(() => { const b = qa(400, 772, 12, 0); expect(chargeAdvice(b).danger).toBe(false); expect(zHint(b)).toBe(false); }));
  it('blade3 F13T2: 179/826, Z cooldown 2 → a D/S/A decision (not empty)', () => withCp8(() => {
    const b = qa(179, 826, 9, 2); const a = chargeAdvice(b); expect(a.danger).toBe(true); expect(['D', 'S', 'A']).toContain(a.keys[0]); expect(a.keys).toHaveLength(1);
  }));
  it('panel shows the decision on non-charge turns when HP is in danger', () => {
    const s = readFileSync('src/game/app.ts', 'utf8'); expect(s).toContain('data-lowhp'); expect(s).toMatch(/charging \|\| dangerNow/);
  });
});
describe('rc20 item 2: potion unusable → D / S / A, never a skill', () => {
  it('oc2 F26: HP 3/1044, Z cooldown 2, OC enough for Q → D (defended hit < 3? else S/A), never Q', () => withCp8(() => {
    const b = qa(3, 1044, 9, 2, 0.0001); b.oc = 30; const a = chargeAdvice(b);
    expect(a.danger).toBe(true); expect(a.keys.join()).not.toMatch(/盾擊|Q/); expect(['D', 'S', 'A']).toContain(a.keys[0]);
  }));
  it('D cannot hold, OC ≥ spirit threshold → S', () => withCp8(() => { const b = qa(100, 1000, 0, 0, 5); b.oc = 250; expect(chargeAdvice(b).keys).toEqual(['S']); }));
  it('D cannot hold, no OC → A', () => withCp8(() => { const b = qa(100, 1000, 0, 0, 5); expect(chargeAdvice(b).keys).toEqual(['A']); }));
  it('D holds → D', () => withCp8(() => { const b = qa(100, 1000, 0, 0, 0.0001); expect(chargeAdvice(b).keys).toEqual(['D']); }));
  it('UI drops skill / spell suggestions while in danger', () => {
    const s = readFileSync('src/game/app.ts', 'utf8'); expect(s).toMatch(/RULES\.cp8 && !dangerNow \? suggestSkill/); expect(s).toMatch(/lean === 'arcane' && !dangerNow/);
  });
  it('lowHp is part of hpDanger', () => withCp8(() => { const b = qa(100, 1000, 3, 0, 0.0001); expect(lowHp(b)).toBe(true); expect(hpDanger(b)).toBe(true); }));
});
