// cp9-rc5 QA3（自訂，暫定）: lethal + potion usable → Z before the stun unless the stun surely cancels all damage.
import { readFileSync } from 'node:fs';
import { describe, it, expect , beforeAll, afterAll} from 'vitest';
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
  ms[0]!.charge = 1; ms[0]!.adb = d.hp * 3; b.hp = Math.round(d.hp * 0.3); return b; // rc12p: estimate now capped at minionCharge (0.4) like the real hit, so 30% HP keeps it lethal
};
const withCp8 = (f: () => void) => { const o = RULES.cp8; RULES.cp8 = true; try { f(); } finally { RULES.cp8 = o; } };

import { CP9 } from '../src/core/cp8';
// rc12s: QA scenario recorded under the 40% normal-fight cap — pin the old cap (normalCharge 0 → minionCharge 0.4); 30% is covered by rc12s-normal-charge.test.ts
let nc12s = 0; beforeAll(() => { nc12s = CP9.normalCharge; (CP9 as { normalCharge: number }).normalCharge = 0; }); afterAll(() => { (CP9 as { normalCharge: number }).normalCharge = nc12s; });
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
  it('no potion usable: rc12b — lethal unless D and stun not guaranteed → D first, the stun second', () => withCp8(() => {
    const b = mk(2); b.itemCd.health = 3; b.hp = Math.round(b.d.hp * 0.4); /* rc12p: D still saves here under the capped estimate */ const a = chargeAdvice(b, 0); expect(a.keys[0]).toBe('D'); expect(a.keys[1]).toMatch(/^Q·/);
  }));
});
