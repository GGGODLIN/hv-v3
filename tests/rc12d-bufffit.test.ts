/** rc12d (a)(b)（自訂，製作人決定）: weighted buff pool with ≥2 fitting options per pick-one offer; unfit labels; ★ only on a fitting buff. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BUFF } from '../src/core/buffs';
import { buffFit, offerStar, openOffer, FIT_MIN, OFFER_SIZE } from '../src/core/buffoffer';
import { RULES, startRun } from '../src/core/run';
import { newPlayer } from '../src/core/player';
import { autoRun, starterKit } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const P0 = (() => { const p = newPlayer(); starterKit(p, 1); for (let i = 1; i <= 3; i++) autoRun(p, pool, 1000 + i, 'buff:arcane'); return p; })();
const blade = () => { const p = structuredClone(P0); p.lean = 'blade'; p.equipped.mainHand = { ...(p.equipped.mainHand ?? {}), base: 'scythe' } as never; return p; };
const arc = () => { const p = structuredClone(P0); p.lean = 'arcane'; return p; };
describe('rc12d buff fit', () => {
  it('labels: spell buffs need spells for blade; blade buffs useless for an arcane caster; generic buffs fit all', () => {
    expect(buffFit(blade(), 'A1')).toEqual({ ok: false, why: '需要法術' });
    expect(buffFit(blade(), 'B1').ok).toBe(true);
    expect(buffFit(arc(), 'B1')).toEqual({ ok: false, why: '對你無效' });
    expect(buffFit(arc(), 'A1').ok).toBe(true);
    expect(buffFit(blade(), 'W2').ok && buffFit(arc(), 'W2').ok).toBe(true);
    const p = structuredClone(P0); delete p.lean; expect(buffFit(p, 'A1').ok).toBe(true);
  });
  it('★ only points to a fitting buff (own-school core first), none when nothing fits', () => {
    expect(offerStar(blade(), ['A1', 'A9', 'B1'])).toBe('B1');
    expect(offerStar(blade(), ['A1', 'W2', 'A9'])).toBe('W2');
    expect(offerStar(blade(), ['A1', 'A9', 'A2'])).toBeNull();
  });
  it('every pick-one offer for a blade holding arcane buffs has ≥ FIT_MIN fitting options; unfit ones still appear (weighted, not filtered)', () => {
    RULES.cp4RunBuffs = true; let unfit = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const p = blade(), run = startRun(p, seed); run.buffs = ['A2', 'A3'];
      for (const src of ['shrine', 'elite', 'boss'] as const) {
        const ids = openOffer(p, run, src); if (ids.length < OFFER_SIZE) continue;
        expect(ids.filter((id) => buffFit(p, id).ok).length).toBeGreaterThanOrEqual(FIT_MIN);
        unfit += ids.filter((id) => !buffFit(p, id).ok).length; expect(new Set(ids).size).toBe(ids.length); for (const id of ids) expect(BUFF[id]).toBeTruthy();
      }
    }
    expect(unfit).toBeGreaterThan(0);
  });
  it('bulwark (QA rc12c bw1/3/4 took A-series): spell buffs are unfit and ★ never lands on them', () => {
    RULES.cp4RunBuffs = true; const bw = () => { const p = structuredClone(P0); p.lean = 'bulwark'; p.equipped.mainHand = { ...(p.equipped.mainHand ?? {}), base: 'mace' } as never; return p; };
    expect(buffFit(bw(), 'A1')).toEqual({ ok: false, why: '需要法術' });
    for (let seed = 1; seed <= 200; seed++) { const p = bw(), run = startRun(p, seed); run.buffs = ['A2'];
      const ids = openOffer(p, run, 'shrine'); const st = offerStar(p, ids); if (st) expect(buffFit(p, st).ok).toBe(true); }
  });
});
