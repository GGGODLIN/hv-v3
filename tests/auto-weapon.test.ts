import { describe, expect, it } from 'vitest';
import { autoEquip, starterKit } from '../src/core/auto';
import { newPlayer, equip } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { generateEquip } from '../src/core/items';

describe('weapon is never lost (rc4)', () => {
  it('autoEquip does not drop a staff / two-hander for an off-hand', () => {
    for (const group of ['staff', 'twoHand'] as const) {
      const p = newPlayer(); const rng = new Rng(3);
      const w = generateEquip(rng, 10, { group, quality: 'fair' }); p.inventory.push(w); equip(p, w);
      const sh = generateEquip(rng, 30, { group: 'shield', quality: 'legendary' });
      autoEquip(p, [sh]);
      expect(p.equipped.mainHand?.id).toBe(w.id);
      expect(p.equipped.offHand).toBeUndefined();
    }
  });
  it('new character starts with a main-hand weapon', () => {
    const p = newPlayer(); starterKit(p, 1); expect(p.equipped.mainHand?.group).toBe('oneHand');
  });
  it('manual equip of an off-hand next to a two-hander keeps the weapon in the inventory (game UI path)', () => {
    const p = newPlayer(); const rng = new Rng(5);
    const w = generateEquip(rng, 10, { group: 'twoHand', quality: 'fair' }); p.inventory.push(w); equip(p, w);
    const sh = generateEquip(rng, 10, { group: 'shield', quality: 'fair' }); p.inventory.push(sh); equip(p, sh);
    expect(p.inventory.some((x) => x.id === w.id)).toBe(true);
  });
});
