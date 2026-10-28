/** rc12g item 3（自訂，製作人要求）: 磐石 family (震盪／厚皮／不滅) without a shield is down-weighted and labelled; 震盪's bash stun is off. */
import { describe, expect, it } from 'vitest';
import { buffUse, offerStar } from '../src/core/buffoffer';
import { RULES, armBattle, startRun } from '../src/core/run';
import { newPlayer, type Player } from '../src/core/player';
import { starterKit } from '../src/core/auto';
const mk = (lean: string, shield: boolean): Player => { const p = newPlayer(); starterKit(p, 1); p.lean = lean as never;
  if (!shield) delete (p.equipped as Record<string, unknown>).offHand; else p.equipped.offHand ??= { base: 'buckler', slot: 'offHand' } as never; return p; };
describe('rc12g 磐石 family needs a shield', () => {
  it('labels: 震盪 bash stun dead, 厚皮／不滅 partly dead without a shield; full with one', () => {
    const n = mk('bulwark', false), y = mk('bulwark', true);
    expect(buffUse(n, 'W8')).toEqual({ use: 0.25, dead: '盾擊暈眩（搭盾才有）' });
    expect(buffUse(n, 'W2').dead).toMatch(/搭盾才有/); expect(buffUse(n, 'W2').use).toBeLessThan(1);
    expect(buffUse(n, 'W6').dead).toMatch(/搭盾才有/); expect(buffUse(n, 'W6').use).toBeLessThan(1);
    for (const id of ['W8', 'W2', 'W6']) expect(buffUse(y, id)).toEqual({ use: 1 });
  });
  it('★ prefers a fully usable card over a shield-less 磐石 card; with a shield the 磐石 card can win', () => {
    for (const lean of ['bulwark', 'blade']) for (const id of ['W8', 'W2', 'W6']) expect(offerStar(mk(lean, false), [id, 'W3', 'N1'])).not.toBe(id);
    expect(offerStar(mk('bulwark', true), ['W6', 'N2'])).toBe('W6');
  });
  it('震盪 bash stun +1 is not applied in battle without a shield', () => {
    RULES.cp4RunBuffs = true;
    for (const shield of [true, false]) {
      const run = startRun(mk('bulwark', false), 7); run.buffs = ['W8'];
      const b = {} as Parameters<typeof armBattle>[0]; armBattle(b, run, 'bulwark', shield);
      expect(b.mods?.bashStun).toBe(shield ? 1 : undefined);
    }
  });
});
