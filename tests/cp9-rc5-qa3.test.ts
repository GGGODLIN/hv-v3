// cp9-rc5 QA3（自訂，暫定）: lethal + potion usable → Z before the stun unless the stun surely cancels all damage.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { chargeAdvice, startBattle, stunGuaranteed } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const mk = (n: number) => {
  const p = newPlayer(); starterKit(p);
  const d = { ...derive(p), style: 'oneHand' } as ReturnType<typeof derive>;
  const ms = Array.from({ length: n }, () => { const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e6; return m; });
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 3, mana: 0, spirit: 0 }); b.oc = 300; b.itemCd.health = 0;
  ms[0]!.charge = 1; ms[0]!.adb = d.hp * 3; b.hp = Math.round(d.hp * 0.5); return b;
};
const withCp8 = (f: () => void) => { const o = RULES.cp8; RULES.cp8 = true; try { f(); } finally { RULES.cp8 = o; } };

describe('cp9-rc5 QA3 stun vs potion order', () => {
  it('lone charger, no phase / reflect / dot: the stun is guaranteed and leads', () => withCp8(() => {
    const b = mk(1); expect(stunGuaranteed(b, 0, 'shieldBash')).toBe(true);
    expect(chargeAdvice(b, 0).keys[0]).toMatch(/^Q·/);
  }));
  it('boss with a phase left that the bash can drop (QA oc4/oc5): Z first', () => withCp8(() => {
    const b = mk(1); const m = b.monsters[0] as unknown as { phases: number; hp: number }; m.phases = 1; m.hp = 1;
    expect(stunGuaranteed(b, 0, 'shieldBash')).toBe(false);
    const a = chargeAdvice(b, 0); expect(a.keys[0]).toBe('Z'); expect(a.keys[1]).toMatch(/^Q·/);
  }));
  it('another monster can still act: Z first', () => withCp8(() => {
    const b = mk(2); b.monsters[1]!.adb = b.d.hp; expect(stunGuaranteed(b, 0, 'shieldBash')).toBe(false);
    expect(chargeAdvice(b, 0).keys[0]).toBe('Z');
  }));
  it('no potion usable: the stun stays first', () => withCp8(() => {
    const b = mk(2); b.itemCd.health = 3; expect(chargeAdvice(b, 0).keys[0]).toMatch(/^Q·/);
  }));
});
