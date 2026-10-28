// rc12b item 1（製作人）: blade interrupt chain Rending Blow → Shatter Strike in the shared hint (UI chargeAdvice / turnHints = sim chooseNaive / SIM_POTPOLICY=ui).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chargeAdvice, isLethal, startBattle, suggestSkill, turnHints } from '../src/core/battle';
import { SIM_AI } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8, SIM_AI.naive]; RULES.cp7 = true; RULES.cp8 = true; SIM_AI.naive = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; SIM_AI.naive = o[2]!; } };
function fight(o: { pa: boolean; charge: boolean; hpFrac?: number; pots?: number; lv?: number }) {
  const pre = JSON.parse(readFileSync('public/data/cp6-presets.json', 'utf8'))['postF20-blade'].player;
  const p = { ...newPlayer(), ...pre }; const d = derive(p);
  const m = buildMonster(pool.rows[0]!, o.lv ?? 10, 'boss'); m.charge = o.charge ? 1 : 0;
  if (o.pa) { m.status.pa = 3; m.status.paTurns = 5; }
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: o.pots ?? 2, mana: 0, spirit: 0 }); b.oc = 250; b.hp = Math.max(1, Math.round(d.hp * (o.hpFrac ?? 1)));
  return b;
}
describe('rc12b chain hint', () => {
  it('Penetrated Armor full, no wind-up → Shatter Strike hinted (UI and sim share suggestSkill/turnHints)', () => withCp8(() => {
    const b = fight({ pa: true, charge: false });
    expect(suggestSkill(b, 0)).toBe('shatterStrike'); expect(turnHints(b, 0).skill).toBe('shatterStrike');
    expect(chargeAdvice(b, 0).keys[0]).toMatch(/粉碎擊/);
  }));
  it('no Penetrated Armor on the boss → Rending Blow (chain step 1)', () => withCp8(() => {
    expect(suggestSkill(fight({ pa: false, charge: false }), 0)).toBe('rendingBlow');
  }));
  it('boss winding up, PA on, HP full → Shatter first (before D/Z)', () => withCp8(() => {
    const b = fight({ pa: true, charge: true, lv: 40 }); const a = chargeAdvice(b, 0);
    expect(a.keys[0], a.text).toMatch(/粉碎擊/);
  }));
  it('boss winding up, PA on, lethal unless D and stun not guaranteed → D first, Shatter second', () => withCp8(() => {
    let hit = 0; for (const f of [0.02, 0.05, 0.1, 0.2, 0.3, 0.5]) {
      const b = fight({ pa: true, charge: true, lv: 60, hpFrac: f, pots: 0 }); b.monsters.push(buildMonster(pool.rows[1]!, 60, 'normal')); // a second monster → stun not guaranteed
      const a = chargeAdvice(b, 0);
      if (isLethal(a.est, a.hp) && a.keys.includes('D')) { expect(a.keys[0], a.text).toBe('D'); expect(a.keys[1]).toMatch(/粉碎擊/); hit++; }
    }
    expect(hit).toBeGreaterThan(0);
  }));
});
