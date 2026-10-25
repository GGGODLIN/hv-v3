import { describe, expect, it } from 'vitest';
import { panelSpec, resistances, weaknesses, startBattle } from '../src/core/battle';
import { buildMonster, type MonsterRow } from '../src/core/monsters';
import { readFileSync } from 'node:fs';
import { SIM_AI, decide, gearStyle } from '../src/core/auto';
import { newPlayer, derive } from '../src/core/player';

const rows = JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[];
describe('rc6 item 2: battle panel and UI-only AI', () => {
  it('panel shows every weakness and resistance (panelSpec == spec for every monster row)', () => {
    for (const r of rows.slice(0, 400)) {
      const m = buildMonster(r, 30, 'normal');
      expect(panelSpec(m)).toEqual(m.spec);
      expect(weaknesses(m).length + resistances(m).length).toBe(Object.values(m.spec).filter((v) => v !== 0).length);
    }
  });
  it('a value hidden from the panel is invisible to the AI (panelSpec zeroes what the panel does not list)', () => {
    const m = buildMonster(rows[0]!, 30, 'normal');
    expect(Object.keys(panelSpec(m)).sort()).toEqual(Object.keys(m.spec).sort());
  });
  it('baseline AI is UI-only; physical schools (blade, bulwark) cast no offensive spell', () => {
    expect(SIM_AI.omni).toBe(false);
    const p = newPlayer();
    const r = rows.find((x) => (x[9] as number) < -20)!; // strongly cold-weak row
    const mk = () => { const d = derive(p); return startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [buildMonster(r, 5, 'normal')], { health: 3, mana: 3, spirit: 0 }); };
    for (const strat of ['buff:blade', 'buff:bulwark'] as const) for (const mode of [undefined, 'counter', 'base'] as const) expect(decide(mk(), strat, mode).kind).not.toBe('spell');
    const b = mk(); b.d.mdb = 1000; // a caster: arcane still aims at the shown weakness
    expect(decide(b, 'buff:arcane', 'base')).toMatchObject({ kind: 'spell', id: 'freeze' });
  });
  it('rc6 item 3 weapon rules: blade 2H, oc 1H (no dual wield in game), arcane staff, bulwark 1H + shield', () => {
    expect(gearStyle('buff:blade')).toEqual({ main: 'twoHand', shield: 'no' });
    expect(gearStyle('buff:oc')).toEqual({ main: 'oneHand', shield: 'no' });
    expect(gearStyle('buff:arcane')).toEqual({ main: 'staff', shield: 'no' });
    expect(gearStyle('buff:bulwark')).toEqual({ main: 'oneHand', shield: 'yes' });
  });
});
