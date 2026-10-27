// cp9-rc6（自訂，暫定）: revive clears the wind-up; potion cooldown 1; never hint Z while the potion is on cooldown.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { act, canUse, chargeAdvice, startBattle, zHint, BOSS_PHASE_TEXT } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { RC22 } from '../src/core/cp8';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { Rng } from '../src/core/rng';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const mk = (n: number) => {
  const p = newPlayer(); starterKit(p);
  const d = { ...derive(p), style: 'oneHand' } as ReturnType<typeof derive>;
  const ms = Array.from({ length: n }, () => { const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e6; return m; });
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 3, mana: 0, spirit: 0 }); b.oc = 300; b.itemCd.health = 0;
  ms[0]!.charge = 1; ms[0]!.adb = d.hp * 3; b.hp = Math.round(d.hp * 0.5); return b;
};
const withCp8 = (f: () => void) => { const o = RULES.cp8; RULES.cp8 = true; try { f(); } finally { RULES.cp8 = o; } };

describe('cp9-rc6', () => {
  it('item 1: a boss revive clears charge / heavyNext / pulseNext / drainNext — no charged hit that turn', () => withCp8(() => {
    const b = mk(1); const m = b.monsters[0] as unknown as Record<string, unknown> & { hp: number; maxHp: number };
    m.phases = 1; m.hp = 1; m.maxHp = 1000; 
    const ev = act(b, { kind: 'attack', target: 0 }, new Rng(1));
    expect(ev.some((e) => e.t === 'status' && (e as { text?: string }).text === BOSS_PHASE_TEXT)).toBe(true);
    expect(m.hp).toBeGreaterThan(0);
    expect(ev.some((e) => (e as { charged?: boolean }).charged)).toBe(false);
    expect(m.charge).toBe(0); // pre-rc6 the revived boss kept charge 1 and fired the ×mult hit next round
  }));
  it('item 2: potion cooldown is 1 under cp8', () => expect(RC22.potCd).toBe(1));
  it('item 3: Z is never hinted while the potion is on cooldown (lethal → D or the stun)', () => withCp8(() => {
    for (const n of [1, 2]) for (const hpf of [0.05, 0.2, 0.35, 0.5, 0.9]) for (const adb of [0.3, 1, 3]) for (const cd of [1, 2]) {
      const b = mk(n); b.itemCd.health = cd; b.hp = Math.max(1, Math.round(b.d.hp * hpf)); b.monsters.forEach((m) => { m.adb = b.d.hp * adb; });
      expect(canUse(b, { kind: 'item', id: 'health' })).toBe(false);
      const a = chargeAdvice(b, 0);
      expect(a.keys).not.toContain('Z'); expect(a.text).not.toMatch(/Z·/); expect(zHint(b, 0)).toBe(false);
      if (a.est >= a.hp) expect(a.keys[0]).toMatch(/^(D|S|[QWE]·)/);
    }
  }));
});
