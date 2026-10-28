import { describe, expect, it } from 'vitest';
import { newPlayer, equip } from '../src/core/player';
import { RULES, startRun, applyLoot } from '../src/core/run';
import { generateEquip } from '../src/core/items';
import { Rng } from '../src/core/rng';
// rc12i item 4（自訂）: QA rc12g swaps — blade scythe → 戰鬥法師 scythe (2H → 2H, an attack-damage upgrade), bulwark axe → club / short sword /
// dagger (1H → 1H) and 塔盾 → 鳶盾 (shield → shield). Auto-wear keeps each school's weapon type, never drops a bulwark shield, and logs every weapon swap.
const run = (lean: 'blade' | 'bulwark', seed: number) => {
  const o = RULES.cp8; RULES.cp8 = true;
  try {
    const p = newPlayer(); p.lean = lean as never; const g = new Rng(seed);
    if (lean === 'blade') equip(p, generateEquip(g, 5, { group: 'twoHand', base: 'scythe', slot: 'mainHand', quality: 'crude' } as never));
    else { equip(p, generateEquip(g, 5, { group: 'oneHand', base: 'axe', slot: 'mainHand', quality: 'crude' } as never)); equip(p, generateEquip(g, 5, { group: 'shield', slot: 'offHand', quality: 'crude' } as never)); }
    const r = startRun(p, seed); let swaps = 0, changes = 0;
    for (let i = 0; i < 400; i++) {
      const e = generateEquip(g, 5 + (i >> 4), { group: g.pick(['oneHand', 'twoHand', 'staff', 'shield'] as const), slot: undefined } as never);
      if (e.group === 'shield') e.slot = 'offHand' as never; else e.slot = 'mainHand' as never;
      const m0 = p.equipped.mainHand?.id, o0 = p.equipped.offHand?.id; const loot = { equips: [e], credits: 0, potions: {}, exp: 0 } as never as Parameters<typeof applyLoot>[2];
      applyLoot(p, r, loot);
      changes += +(p.equipped.mainHand?.id !== m0) + +(p.equipped.offHand?.id !== o0); swaps += loot.swaps?.length ?? 0;
      expect(p.equipped.mainHand?.group).toBe(lean === 'blade' ? 'twoHand' : 'oneHand');
      if (lean === 'bulwark') expect(p.equipped.offHand?.group).toBe('shield'); else expect(p.equipped.offHand).toBeUndefined();
    }
    return { swaps, changes };
  } finally { RULES.cp8 = o; }
};
describe('rc12i: auto weapon swaps by school', () => {
  for (const lean of ['blade', 'bulwark'] as const) it(`${lean}: type kept, shield kept, every swap logged`, () => {
    for (const seed of [1, 2, 3]) { const { swaps, changes } = run(lean, seed); expect(changes).toBeGreaterThan(0); expect(swaps).toBe(changes); }
  });
});
