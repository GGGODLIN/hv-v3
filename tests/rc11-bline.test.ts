// rc11 item 2（自訂）: QA rc10 blade3/4 F30 t4 — decision line 「HP 危險：…419 ≥ HP 378；防禦後估計 293 < HP 378，防禦後撐得住」.
// Render-level sweep: the real text producers (chargeAdvice text + urgentLine) never say 「HP 危險」 next to 「撐得住」.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { defendVerdict9, chargeAdvice, defendEst9, defendRaw9, startBattle } from '../src/core/battle';
import { SIM_AI, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { urgentLine } from '../src/game/app';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8, SIM_AI.naive]; RULES.cp7 = true; RULES.cp8 = true; SIM_AI.naive = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; SIM_AI.naive = o[2]!; } };
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
describe('rc11 item 2: banner and decision never contradict', () => {
  it('QA shot bline-blade-4-F30t4: est 419, HP 378, defended 293 → verdict safe (orange 不防禦會死)', () => { expect(defendVerdict9(293, 293, 378)).toBe('safe'); expect(urgentLine({ est: 419, hp: 378 }, 293, 293)).toMatch(/不防禦會死/); });
  it('random boss states (charge / thorns / spikes / minion / potion)', () => withCp8(() => {
    let checked = 0, safeLethal = 0;
    for (let i = 0; i < 1500; i++) {
      const p = newPlayer(); starterKit(p); const d = derive(p);
      const ms = [buildMonster(pool.rows[i % pool.rows.length]!, 20 + (i % 40), 'boss')];
      if (rnd() < 0.4) ms.push(buildMonster(pool.rows[(i * 7) % pool.rows.length]!, 20 + (i % 40), 'normal'));
      for (const m of ms) { m.charge = rnd() < 0.5 ? 1 : 0; (m as { thornTurns?: number }).thornTurns = rnd() < 0.2 ? 2 : 0; }
      const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: rnd() < 0.5 ? 2 : 0, mana: 0, spirit: 0 }); (b as { cp5?: boolean }).cp5 = true;
      b.hp = Math.max(1, Math.round(d.hp * rnd())); if (rnd() < 0.3) b.itemCd.health = 2;
      const a = chargeAdvice(b, 0), txt = a.text + urgentLine(a, defendEst9(b), defendRaw9(b));
      if (/撐得住/.test(txt) && /不防禦會死/.test(txt)) safeLethal++;
      expect(/HP 危險/.test(txt) && /撐得住/.test(txt), txt).toBe(false); checked++;
    }
    expect(checked).toBe(1500); expect(safeLethal).toBeGreaterThan(0); // the QA case (lethal, D saves) is actually reached
  }));
});
