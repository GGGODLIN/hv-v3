// rc10 spec item 5（自訂）: QA bulwark b3 — HP 1, no potion, hint A, boss 反傷 26 killed the player. A lethal reflect → no A / physical skill.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chargeAdvice, reflectLethal9, reflectRisk9, startBattle, turnHints } from '../src/core/battle';
import { SIM_AI, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8, SIM_AI.naive]; RULES.cp7 = true; RULES.cp8 = true; SIM_AI.naive = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; SIM_AI.naive = o[2]!; } };
const mk = (spikes: boolean, hp: number) => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 30, 'boss'); m.hp = m.maxHp = 50000; m.adb = 1; m.charge = 0;
  (m as { affixes?: string[] }).affixes = spikes ? ['spikes'] : [];
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 }); (b as { cp5?: boolean }).cp5 = true; b.oc = 0; b.hp = hp; return b;
};
const phys = (k: string) => k === 'A' || /^[QWE]·/.test(k);
describe('rc10 spec 5: no A into a lethal reflect', () => {
  it('HP 1, no potion, spiked boss → D, no A / physical skill', () => withCp8(() => {
    const b = mk(true, 1); expect(reflectRisk9(b, 0)).toBeGreaterThanOrEqual(1); expect(reflectLethal9(b, 0)).toBe(true);
    const a = chargeAdvice(b, 0); expect(a.keys[0]).toBe('D'); expect(a.keys.some(phys)).toBe(false); expect(a.text).toMatch(/反傷/);
    expect(turnHints(b, 0).skill).toBeNull();
  }));
  it('control: no reflect → A stays', () => withCp8(() => { const b = mk(false, 1); expect(reflectLethal9(b, 0)).toBe(false); expect(chargeAdvice(b, 0).keys).toContain('A'); }));
  it('reflect far below HP → A stays', () => withCp8(() => { const b = mk(true, 99999); b.hp = b.d.hp; expect(reflectLethal9(b, 0)).toBe(false); }));
});
