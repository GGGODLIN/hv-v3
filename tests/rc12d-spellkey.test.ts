// rc12d item 1（自訂）: a staff user's ★ can be a spell key. Spells map to keys 1–6 in SPELLS order (1 fiery = the A quick-cast,
// 2 freeze, 3 shock, 4 gale, 5 smite, 6 corruption); the ★ names another spell only when it beats the fiery quick-cast by > SPELL_HINT_EDGE.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { primaryKey, startBattle, SPELLS } from '../src/core/battle';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, type Player } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const arc = (JSON.parse(readFileSync('public/data/cp6-presets.json', 'utf8')) as Record<string, { player: Player }>)['postF20-arcane']!.player;
const mk = (spec: Partial<Record<string, number>>) => {
  const d = derive(structuredClone(arc));
  const ms = [0, 1, 2].map(() => { const m = buildMonster(pool.rows[0]!, 20); m.hp = m.maxHp = 5000; m.charge = 0; for (const k of Object.keys(m.spec)) m.spec[k as keyof typeof m.spec] = 0; Object.assign(m.spec, spec); return m; });
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 3, mana: 0, spirit: 0 }); b.oc = 0; return b;
};
const run = (f: () => void) => { const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = RULES.cp8 = true; try { f(); } finally { [RULES.cp7, RULES.cp8] = o as [boolean, boolean]; } };

describe('rc12d spell ★', () => {
  it('staff, no weakness → A (fiery quick-cast), never a spell key', () => run(() => { expect(mk({}).d.style).toBe('staff'); expect(primaryKey(mk({}), 0).key).toBe('A'); }));
  it('cold weakness → ★ 2·冰封, and the action is that spell', () => run(() => {
    const pk = primaryKey(mk({ cold: -50 }), 0); expect(pk.key).toBe('2'); expect(pk.action).toMatchObject({ kind: 'spell', id: 'freeze' });
  }));
  it('the key index matches SPELLS order for every element (keys 2–6)', () => run(() => {
    const ids = Object.keys(SPELLS); for (let i = 1; i < ids.length; i++) {
      const pk = primaryKey(mk({ [SPELLS[ids[i] as keyof typeof SPELLS].element]: -200 }), 0);
      if (/^[1-6]$/.test(pk.key)) expect((pk.action as { id: string }).id).toBe(ids[Number(pk.key) - 1]);
    }
  }));
});
