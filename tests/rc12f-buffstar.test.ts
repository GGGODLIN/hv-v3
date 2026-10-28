/** rc12f（自訂，製作人決定）: ★ weighs gear + school usefulness; partly-dead cards are down-weighted and labelled. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BUFF } from '../src/core/buffs';
import { buffUse, offerStar, openOffer, SCHOOL_AFF } from '../src/core/buffoffer';
import { RULES, startRun } from '../src/core/run';
import { newPlayer, type Player } from '../src/core/player';
import { autoRun, starterKit } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const P0 = (() => { const p = newPlayer(); starterKit(p, 1); for (let i = 1; i <= 3; i++) autoRun(p, pool, 2000 + i, 'buff:blade'); return p; })();
const mk = (lean: string, shield: boolean): Player => { const p = structuredClone(P0); p.lean = lean as never;
  if (!shield) delete (p.equipped as Record<string, unknown>).offHand; else p.equipped.offHand ??= { base: 'buckler', slot: 'offHand' } as never; return p; };
/** misfit ★ = partly dead while a fully usable own-school / generic option was offered, or off-school while a fully usable own-school option was offered. */
function misfit(p: Player, n = 400) {
  RULES.cp4RunBuffs = true; let bad = 0, off = 0, tot = 0;
  for (let seed = 1; seed <= n; seed++) {
    const q = structuredClone(p); delete (q.equipped as Record<string, unknown>).offHand; const run = startRun(q, seed); run.buffs = []; const ids = openOffer(p, run, (['shrine', 'elite', 'boss'] as const)[seed % 3]!); const st = offerStar(p, ids); if (!st) continue; tot++;
    const full = ids.filter((id) => buffUse(p, id).use === 1), own = full.filter((id) => BUFF[id]!.school === p.lean);
    if (BUFF[st]!.school !== p.lean && BUFF[st]!.school !== 'none') off++;
    if ((buffUse(p, st).use < 1 && full.some((id) => BUFF[id]!.school === p.lean || BUFF[id]!.school === 'none')) || (BUFF[st]!.school !== p.lean && own.length)) bad++;
  }
  return { bad: bad / tot, off: off / tot, tot };
}
describe('rc12f buff ★ fit', () => {
  it('W1 不動之盾 without a shield is partly dead (block) and loses the ★ to a fully usable card', () => {
    expect(buffUse(mk('blade', false), 'W1')).toEqual({ use: 2 / 3, dead: '格擋（搭盾才有）' });
    expect(buffUse(mk('bulwark', true), 'W1')).toEqual({ use: 1 });
    expect(offerStar(mk('blade', false), ['W1', 'B5', 'N1'])).toBe('B5'); // QA bl1 F41 / bl2 F1
    expect(offerStar(mk('blade', false), ['W1', 'W2', 'N2'])).not.toBe('W1');
  });
  it('bulwark ★ prefers bulwark / generic over oc / blade (魂燃、王者氣魄、千刃)', () => {
    const p = mk('bulwark', true); expect(SCHOOL_AFF.bulwark!.oc).toBeLessThan(SCHOOL_AFF.bulwark!.none!);
    expect(offerStar(p, ['O6', 'W2', 'N1'])).toBe('W2'); expect(offerStar(p, ['O9', 'B8', 'W4'])).toBe('W4'); expect(offerStar(p, ['O9', 'B8', 'S-vigor'])).toBe('S-vigor');
  });
  it('per school: misfit ★ share is 0 (report off-school share)', () => {
    const rows = (['blade', 'oc', 'arcane', 'bulwark'] as const).flatMap((l) => [true, false].map((sh) => ({ l, sh, ...misfit(mk(l, sh)) })));
    console.log('RC12F_STAR ' + JSON.stringify(rows.map((r) => ({ lean: r.l, shield: r.sh, n: r.tot, misfit: +r.bad.toFixed(3), offSchool: +r.off.toFixed(3) }))));
    for (const r of rows) expect(r.bad).toBe(0);
  }, 60000);
});
