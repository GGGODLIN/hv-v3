import { describe, expect, it, afterEach } from 'vitest';
import { newPlayer } from '../src/core/player';
import { RULES, applyLoot, settle, startAbyss, runDerived } from '../src/core/run';
import { starterKit } from '../src/core/auto';
import { generateEquip } from '../src/core/items';
import { Rng } from '../src/core/rng';
import { quickAttack, startBattle } from '../src/core/battle';
import { betterInBag, autoWorn } from '../src/core/prep';
const flags = { ...RULES };
afterEach(() => Object.assign(RULES, flags));

describe('cp8-rc3', () => {
  it('item 2: a better drop is auto-worn in the run (so the bag reminder cannot list it) and the reminder names it once via lastWorn', () => {
    RULES.cp6Abyss = true; RULES.cp7 = true; RULES.cp8 = true;
    const p = newPlayer(); starterKit(p, 3); const run = startAbyss(p, 3, 1);
    const e = generateEquip(new Rng(5), 20, { group: 'heavy', base: 'plate', slot: 'body', quality: 'exquisite' });
    applyLoot(p, run, { equips: [e], credits: 0, exp: 0, potions: {} } as never);
    expect(p.equipped.body?.id).toBe(e.id);
    run.done = 'retreat'; settle(p, run);
    expect(betterInBag(p)).toEqual([]);
    expect(autoWorn(p).map((x) => x.id)).toEqual([e.id]);
  });
  it('item 1: staff 「攻擊」 casts the quick spell with cp8 on, melee with cp8 off or a non-staff weapon', () => {
    RULES.cp6Abyss = true; RULES.cp8 = true;
    const p = newPlayer(); starterKit(p, 3); const st = generateEquip(new Rng(2), 5, { group: 'staff', quality: 'fair' } as never);
    p.inventory.push(st); p.equipped.mainHand = st; const run = startAbyss(p, 3, 1);
    const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, [], p.potions);
    expect(quickAttack(b, 0).kind).toBe('spell'); RULES.cp8 = false; expect(quickAttack(b, 0).kind).toBe('attack');
  });
});
