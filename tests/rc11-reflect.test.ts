// rc11 item 3（自訂）: QA rc10 blade-4 F35 t12/t13 — HP 1, no potion, 尖刺盾 (thornTurns) + boss charging. Every hint branch
// (charge, HP-1 「直接輸出」, stun key, safe/danger) must drop A and physical skills while reflectLethal9 holds.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chargeAdvice, reflectLethal9, startBattle, turnHints } from '../src/core/battle';
import { SIM_AI, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8, SIM_AI.naive]; RULES.cp7 = true; RULES.cp8 = true; SIM_AI.naive = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; SIM_AI.naive = o[2]!; } };
const phys = (k: string) => k === 'A' || /^[QWE]·/.test(k);
let seed = 11; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
describe('rc11 item 3: no A / physical skill into a lethal reflect, any branch', () => {
  it('blade-4 F35 t13 shape: thorns up, boss charging, HP 1, no potion → D', () => withCp8(() => {
    const p = newPlayer(); starterKit(p); const d = derive(p);
    const m = buildMonster(pool.rows[0]!, 35, 'boss'); m.charge = 1; (m as { thornTurns?: number }).thornTurns = 2;
    const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 }); (b as { cp5?: boolean }).cp5 = true; b.hp = 1;
    expect(reflectLethal9(b, 0)).toBe(true); const a = chargeAdvice(b, 0); expect(a.keys.some(phys), a.text).toBe(false); expect(turnHints(b, 0).skill).toBeNull();
  }));
  it('random sweep', () => withCp8(() => {
    let hit = 0;
    for (let i = 0; i < 1500; i++) {
      const p = newPlayer(); starterKit(p); const d = derive(p);
      const ms = [buildMonster(pool.rows[i % pool.rows.length]!, 20 + (i % 40), 'boss')];
      if (rnd() < 0.4) ms.push(buildMonster(pool.rows[(i * 5) % pool.rows.length]!, 20 + (i % 40), 'normal'));
      for (const m of ms) { m.charge = rnd() < 0.5 ? 1 : 0; (m as { thornTurns?: number }).thornTurns = rnd() < 0.6 ? 2 : 0; if (rnd() < 0.3) (m as { affixes?: string[] }).affixes = ['spikes']; }
      const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: rnd() < 0.3 ? 2 : 0, mana: 0, spirit: 0 }); (b as { cp5?: boolean }).cp5 = true;
      b.hp = rnd() < 0.5 ? 1 : Math.max(1, Math.round(d.hp * rnd() * 0.3)); b.oc = Math.round(rnd() * 250);
      if (!reflectLethal9(b, 0)) continue; hit++;
      const a = chargeAdvice(b, 0); expect(a.keys.some(phys), a.text).toBe(false); expect(turnHints(b, 0).skill).toBeNull();
    }
    expect(hit).toBeGreaterThan(50);
  }));
});
// rc11 item 4（說明）: QA blade-3/4 F10 t4 — blade's Q is 巨力劈砍 (two-hand kit greatCleave / rendingBlow / shatterStrike), not a stun
// (STUN_SKILLS = shieldBash / concussiveStrike), so the 「蓄力 + Q 可用 → Q 先」 rule has nothing to press: D/A first is by design.
import { STUN_SKILLS, drainStunKey } from '../src/core/battle';
describe('rc11 item 4 → rc12 scheme 6: blade interrupt needs Penetrated Armor first', () => {
  it('two-hand blade kit: Shatter Strike is a stun skill (rc12), but drainStunKey is null on a charging boss without PA', () => withCp8(() => {
    expect((STUN_SKILLS as string[]).includes('shatterStrike')).toBe(true); // rc12 scheme 6 (Skills.md:73-75)
    const pre = JSON.parse(readFileSync('public/data/cp6-presets.json', 'utf8'))['postF20-blade'].player; // the QA blade preset (Lv14)
    const p = { ...newPlayer(), ...pre }; const d = derive(p);
    const m = buildMonster(pool.rows[0]!, 10, 'boss'); m.charge = 1;
    const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 2, mana: 0, spirit: 0 }); b.oc = 250;
    expect(drainStunKey(b, 0)).toBeNull(); expect(p.equipped.mainHand?.group).toBe('twoHand');
  }));
});
