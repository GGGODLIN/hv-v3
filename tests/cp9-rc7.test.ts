// cp9-rc7（自訂，暫定）: charge lockout, revive 重新蓄力, defending-turn cap, HP-1 → A, D only on a ≥20% intent, oc F30+ boss ×1.3.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { act, chargeAdvice, startBattle, BOSS_PHASE_TEXT, windSafeKey } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { CP9 } from '../src/core/cp8';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES, oc30 } from '../src/core/run';
import { Rng } from '../src/core/rng';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const mk = (adbF = 3, pots = 3) => {
  const p = newPlayer(); starterKit(p);
  const d = { ...derive(p), style: 'oneHand' } as ReturnType<typeof derive>;
  const m = buildMonster(pool.rows[0]!, 1, 'boss'); m.hp = m.maxHp = 1e6; m.adb = d.hp * adbF;
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: pots, mana: 0, spirit: 0 }); b.itemCd.health = 0; return b;
};
const withCp8 = (f: () => void) => { const o = RULES.cp8; RULES.cp8 = true; try { f(); } finally { RULES.cp8 = o; } };
type WM = { windCd?: number; charge: number; heavyNext?: boolean };

describe('cp9-rc7', () => {
  it('knobs', () => { expect(CP9.windCd).toBe(2); expect(CP9.defCap).toBe(0.35); expect(CP9.dMin).toBe(0.2); expect(CP9.boss30).toBe(1.5); expect(CP9.boss30oc).toBe(1.3); });
  it('item 2: after a charged / heavy boss hit, no new charge for ≥ 2 turns', () => withCp8(() => {
    for (let seed = 1; seed <= 30; seed++) {
      const b = mk(0.01); const m = b.monsters[0] as unknown as WM; const rng = new Rng(seed); let lock = 0;
      for (let t = 0; t < 40 && !b.over; t++) {
        const was = m.charge > 0 || !!m.heavyNext; b.hp = b.d.hp;
        act(b, { kind: 'defend' }, rng);
        if (lock > 0) { expect(m.charge > 0 || !!m.heavyNext).toBe(false); lock--; }
        else if (was && (m.windCd ?? 0) > 0) lock = 2 - 1; // windCd set this turn; the next turn may not start a charge
      }
    }
  }));
  it('item 3: revive text says 重新蓄力 and sets the lockout', () => withCp8(() => {
    expect(BOSS_PHASE_TEXT).toContain('重新蓄力');
    expect(readFileSync('src/game/app.ts', 'utf8')).toContain('2 回合後重新蓄力');
    const b = mk(0.01); const m = b.monsters[0] as unknown as WM & { phases: number; hp: number; maxHp: number };
    m.phases = 1; m.hp = 1; m.maxHp = 1000;
    act(b, { kind: 'attack', target: 0 }, new Rng(1));
    expect(m.hp).toBeGreaterThan(0); expect(m.charge).toBe(0);
    act(b, { kind: 'defend' }, new Rng(2)); expect(m.charge).toBe(0);
  }));
  it('item 4: a defending turn takes < 35% max HP', () => withCp8(() => {
    for (let seed = 1; seed <= 40; seed++) {
      const b = mk(5); const rng = new Rng(seed);
      for (let t = 0; t < 10 && !b.over; t++) { b.hp = b.d.hp; act(b, { kind: 'defend' }, rng); if (!b.over) expect(b.d.hp - b.hp).toBeLessThan(0.35 * b.d.hp); }
    }
  }));
  it('producer 1: no usable potion and HP 1 → A, never 「擋不住」', () => withCp8(() => {
    for (const adb of [0.3, 1, 5]) { const b = mk(adb, 0); b.hp = 1; const a = chargeAdvice(b, 0); expect(a.keys).toContain('A'); expect(a.keys[0]).not.toBe('D'); expect(a.text).not.toContain('擋不住'); }
  }));
  it('producer 2: D is hinted only when the next-round estimate ≥ 20% max HP', () => withCp8(() => {
    for (const adb of [0.01, 0.05, 0.1, 0.3, 1, 3]) for (const hpf of [0.3, 0.6, 0.9]) for (const ch of [0, 1]) {
      const b = mk(adb, 0); b.hp = Math.round(b.d.hp * hpf); b.monsters[0]!.charge = ch;
      const a = chargeAdvice(b, 0); if (a.keys[0] === 'D') expect(a.est).toBeGreaterThanOrEqual(b.d.hp * 0.2);
    }
  }));
  it('producer 2: oc-dominant build, depth ≥ 30 → boss multiplier 1.3; others unchanged', () => {
    expect(oc30({ buffs: ['O2', 'O3'] }, 30, 3)).toBe(1.3);
    expect(oc30({ buffs: ['O2'] }, 29, 3)).toBe(3);
    expect(oc30({ buffs: [] }, 35, 3)).toBe(3);
  });
  it('QA item 4: a queued stun skill (Q) survives a fresh wind-up and the charge hold; A does not', () => {
    expect(windSafeKey('skill:shieldBash')).toBe(true); expect(windSafeKey('skill:concussiveStrike')).toBe(true);
    expect(windSafeKey('defend')).toBe(true); expect(windSafeKey('item:health')).toBe(true);
    expect(windSafeKey('attack')).toBe(false); expect(windSafeKey('skill:vitalStrike')).toBe(false);
    const app = readFileSync('src/game/app.ts', 'utf8');
    expect(app).toContain('if (q && !windSafeKey(q)) q = null'); expect(app).toContain('performance.now() < this.chargeHoldUntil && !windSafeKey(cmd)');
  });
  it('QA item 5: 「HP 危險 … ≥ HP」 never sits next to an unqualified 「撐得住，不必喝藥」', () => withCp8(() => {
    for (const adb of [0.2, 0.5, 1, 2, 5]) for (const hpf of [0.05, 0.2, 0.4, 0.6, 0.9]) for (const pots of [0, 3]) for (const ch of [0, 1]) for (const def of [0, 1]) {
      const b = mk(adb, pots); b.hp = Math.max(1, Math.round(b.d.hp * hpf)); b.monsters[0]!.charge = ch; b.defendTurns = def;
      const a = chargeAdvice(b, 0);
      if (a.text.includes('HP 危險')) { expect(a.text).not.toContain('撐得住，不必喝藥'); expect(a.text).not.toContain('還夠，不必喝藥'); }
    }
  }));
});
