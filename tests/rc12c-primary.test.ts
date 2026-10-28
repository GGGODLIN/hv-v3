// rc12c item 1–2（自訂）: one ★ key per turn, shared by the UI and the sim's SIM_POLICY=primary.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { canUse, primaryKey, startBattle, turnHints } from '../src/core/battle';
import { decide, SIM_AI, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8, SIM_AI.naive]; RULES.cp7 = true; RULES.cp8 = true; SIM_AI.naive = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; SIM_AI.naive = o[2]!; } };
const mk = (oc: number, hpPct: number, charge: number) => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 5000; m.adb = 5; m.charge = charge;
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 3, mana: 0, spirit: 0 }); b.oc = oc; b.hp = Math.max(1, Math.round(d.hp * hpPct)); return b;
};
const states = () => { const out = []; for (const oc of [0, 50, 150, 250]) for (const h of [1, 0.5, 0.2]) for (const c of [0, 1]) out.push(mk(oc, h, c)); return out; };

describe('rc12c primaryKey', () => {
  it('is always a usable action, and a skill hint becomes the ★ key when nothing is winding up and HP is safe', () => withCp8(() => {
    let skill = 0;
    for (const b of states()) {
      const pk = primaryKey(b, 0); expect(canUse(b, pk.action)).toBe(true);
      expect(pk.key).toMatch(/^[ADZSQWE1-5]$/);
      const th = turnHints(b, 0);
      if (pk.src === 'skill') { skill++; expect(pk.action).toEqual({ kind: 'skill', id: th.skill, target: 0 }); }
    }
    expect(skill).toBeGreaterThan(0);
  }));
  it('SIM_POLICY=primary: the sim presses exactly the ★ action', () => withCp8(() => {
    const o = process.env.SIM_POLICY; process.env.SIM_POLICY = 'primary';
    try { for (const b of states()) expect(decide(b, 'auto')).toEqual(primaryKey(b, 0).action); } finally { if (o === undefined) delete process.env.SIM_POLICY; else process.env.SIM_POLICY = o; }
  }));
  it('battleHtml: one ★ source (pk) for buttons, status bar and 決策; no 💡 「可以用了」, no 「建議 n·」 element hint', () => {
    const app = readFileSync('src/game/app.ts', 'utf8');
    const html = app.slice(app.indexOf('  battleHtml(): string {'), app.indexOf('  /** CP5: floor theme title (map). */'));
    expect(html).toMatch(/primaryKey\(b, this\.target\)/);
    expect(html).not.toMatch(/data-readybtn|data-sugbtn|可以用了（/);
    expect(html).toMatch(/data-primarybar="\$\{pk\.key\}">建議 ★\$\{pk\.label\}/);
    expect(app).toMatch(/決策：<b>★\$\{pk\.label\}<\/b>/);
  });
});
