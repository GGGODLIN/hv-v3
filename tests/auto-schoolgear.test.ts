import { describe, expect, it } from 'vitest';
import { autoEquip, gearStyle } from '../src/core/auto';
import { newPlayer, equip } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { generateEquip } from '../src/core/items';

describe('rc4 school gear (sim only)', () => {
  it('bulwark goes back from a two-hander to one-hand + shield (hands judged together)', () => {
    const p = newPlayer(); const rng = new Rng(7);
    const w = generateEquip(rng, 30, { group: 'twoHand', quality: 'legendary' }); p.inventory.push(w); equip(p, w);
    const one = generateEquip(rng, 10, { group: 'oneHand', quality: 'fair' });
    const sh = generateEquip(rng, 10, { group: 'shield', quality: 'fair' });
    const used = autoEquip(p, [one, sh], gearStyle('buff:bulwark'));
    expect(p.equipped.mainHand?.id).toBe(one.id); expect(p.equipped.offHand?.id).toBe(sh.id);
    expect(used.map((e) => e.id).sort()).toEqual([one.id, sh.id].sort());
    expect(p.inventory.some((x) => x.id === w.id)).toBe(true);
  });
  it('arcane takes a staff and drops the shield; never ends unarmed', () => {
    const p = newPlayer(); const rng = new Rng(8);
    const one = generateEquip(rng, 30, { group: 'oneHand', quality: 'legendary' }); p.inventory.push(one); equip(p, one);
    const sh = generateEquip(rng, 30, { group: 'shield', quality: 'legendary' }); p.inventory.push(sh); equip(p, sh);
    const st = generateEquip(rng, 5, { group: 'staff', quality: 'fair' });
    autoEquip(p, [st], gearStyle('buff:arcane'));
    expect(p.equipped.mainHand?.id).toBe(st.id); expect(p.equipped.offHand).toBeUndefined();
  });
  it('auto / random keep the original slot-by-slot logic', () => {
    expect(gearStyle('auto')).toBeNull(); expect(gearStyle('buff:random')).toBeNull(); expect(gearStyle('human')).toBeNull();
  });
});
