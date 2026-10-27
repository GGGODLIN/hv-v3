import { CP9 } from '../src/core/cp8';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chargeAdvice, hpDanger, lowHp, POT_HINT, startBattle, zHint } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
/** QA rc19 cases: a normal (non-charging) fight, small hits, HP set to the observed share of max HP. */
const qa = (hp: number, max: number, pots: number, cd: number, adbShare = 0.02) => {
  const p = newPlayer(); starterKit(p); const d = derive(p);
  const m = buildMonster(pool.rows[0]!, 1); m.hp = m.maxHp = 1e6; m.adb = d.hp * adbShare; m.charge = 0;
  const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: pots, mana: 0, spirit: 0 });
  b.hp = Math.max(1, Math.round(d.hp * hp / max)); b.itemCd.health = cd; b.oc = 0; return b;
};
const withCp8 = (f: () => void) => { const o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; try { f(); } finally { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; } };
describe('rc20 item 1: potion hint looks at HP (≤ 35%, 暫定)', () => {
  it('threshold is 35% and marked', () => { expect(POT_HINT.low).toBe(0.35); expect(readFileSync('src/core/battle.ts', 'utf8')).toMatch(/暫定，製作人舉例 ≤35%/); });
  it('bulwark7-death F13: 177/772, Z×12 ready, no charge → Z lit, Z first', () => withCp8(() => {
    const b = qa(177, 772, 12, 0); const a = chargeAdvice(b);
    expect(a.est).toBeLessThan(a.hp); expect(a.danger).toBe(true); expect(a.keys[0]).toBe('Z'); expect(zHint(b)).toBe(true); expect(a.text).toContain('HP 偏低');
  }));
  it('bulwark8-death F11: 189/784, Z×12 ready → Z lit', () => withCp8(() => { const b = qa(189, 784, 12, 0); expect(chargeAdvice(b).keys[0]).toBe('Z'); expect(zHint(b)).toBe(true); }));
  it('above 35% with small hits: no Z, not danger', () => withCp8(() => { const b = qa(400, 772, 12, 0); expect(chargeAdvice(b).danger).toBe(false); expect(zHint(b)).toBe(false); }));
  it('blade3 F13T2: 179/826, Z cooldown 2 → a D/S/A decision (not empty)', () => withCp8(() => {
    const b = qa(179, 826, 9, 2); const a = chargeAdvice(b); expect(a.danger).toBe(true); expect(['D', 'S', 'A']).toContain(a.keys[0]); expect(a.keys).toHaveLength(1);
  }));
  it('panel shows the decision on non-charge turns when HP is in danger', () => {
    const s = readFileSync('src/game/app.ts', 'utf8'); expect(s).toContain('data-lowhp'); expect(s).toMatch(/charging \|\| dangerNow/);
  });
});
describe('rc20 item 2: potion unusable → D / S / A, never a skill', () => {
  it('oc2 F26: HP 3/1044, Z cooldown 2, OC enough for Q → D (defended hit < 3? else S/A), never Q', () => withCp8(() => {
    const b = qa(3, 1044, 9, 2, 0.0001); b.oc = 30; const a = chargeAdvice(b);
    expect(a.danger).toBe(true); expect(a.keys.join()).not.toMatch(/盾擊|Q/); expect(['D', 'S', 'A']).toContain(a.keys[0]);
  }));
  it('D cannot hold, OC ≥ spirit threshold → S', () => withCp8(() => { const b = qa(100, 1000, 0, 0, 5); b.oc = 250; expect(chargeAdvice(b).keys).toEqual([CP9.defCap > 0 ? 'D' : 'S']); /* cp9-rc7 item 4（自訂）: the 35% defending cap makes D hold */ }));
  it('D cannot hold, no OC, lethal → D (cp9-rc6 item 3 自訂: was A; non-cp9 still A)', () => withCp8(() => { const b = qa(100, 1000, 0, 0, 5); expect(chargeAdvice(b).keys).toEqual([CP9.on ? 'D' : 'A']); }));
  it('D holds → D (cp9-rc7 自訂: only on a ≥ 20% estimate, else A)', () => withCp8(() => { const b = qa(100, 1000, 0, 0, 0.0001); expect(chargeAdvice(b).keys).toEqual([CP9.on && CP9.dMin > 0 ? 'A' : 'D']); }));
  it('UI drops skill / spell suggestions while in danger', () => {
    const s = readFileSync('src/core/battle.ts', 'utf8'); expect(s).toMatch(/const skill = !danger \? suggestSkill/); expect(s).toMatch(/const spell = !danger && quickAttack/); // cp9-rc4 (A)（自訂）: gate moved into turnHints
  });
  it('lowHp is part of hpDanger', () => withCp8(() => { const b = qa(100, 1000, 3, 0, 0.0001); expect(lowHp(b)).toBe(true); expect(hpDanger(b)).toBe(true); }));
});
import { deathHint, DEATH_BURST_2T } from '../src/core/battle';
describe('rc20 item 3: death screen', () => {
  it('death within 2 turns (≥ 50% max HP in last 2 turns) never says 慢慢磨光', () => {
    expect(DEATH_BURST_2T).toBe(0.5);
    const t = deathHint(120, 120, 772, 420); expect(t).not.toContain('慢慢磨光'); expect(t).toContain('兩回合');
  });
  it('real slow attrition still says 慢慢磨光', () => expect(deathHint(80, 80, 772, 160)).toContain('慢慢磨光'));
  it('biggest and lethal hits are both shown (rc21 item 3 swapped the headline to the biggest; see cp8-rc21)', () => {
    const s = readFileSync('src/game/app.ts', 'utf8'); expect(s).toContain('data-deathlast'); expect(s).toContain('data-deathbiggest');
  });
  it('death-screen small text is brightened', () => expect(readFileSync('src/style.css', 'utf8')).toMatch(/\.result\.dead \.hint[^{]*\{ color: #e8dcc6/));
});
import { battleLoot, encounter, startRun } from '../src/core/run';
describe('rc20 item 4: elite battle guarantees 1 health potion (自訂)', () => {
  it('every elite battle drops ≥ 1 health potion; normal battles keep the original rolls', () => withCp8(() => {
    for (let i = 0; i < 20; i++) {
      const p = newPlayer(); starterKit(p); const run = startRun(p, i);
      expect(battleLoot(run, encounter(run, pool, 'elite'), 'elite').potions.health ?? 0).toBeGreaterThanOrEqual(1);
    }
    expect(readFileSync('src/core/run.ts', 'utf8')).toMatch(/eliteHealthPotion[\s\S]*自訂，非原版/);
  }));
});
import { applyLoot, runDerived } from '../src/core/run';
describe('rc20 item 5: HP never above max after equipment changes', () => {
  it('applyLoot clamps HP/MP/SP to the new max', () => withCp8(() => {
    const p = newPlayer(); starterKit(p); const run = startRun(p, 3);
    run.hp = 99999; run.mp = 99999; run.sp = 99999;
    applyLoot(p, run, { equips: [], credits: 0, potions: {}, exp: 0 });
    const d = runDerived(p, run); expect(run.hp).toBe(d.hp); expect(run.mp).toBe(d.mp); expect(run.sp).toBe(d.sp);
  }));
  it('decision text names skills with their hotkey', () => expect(readFileSync('src/core/battle.ts', 'utf8')).toContain("'QWE'[skillKit(s).indexOf(g)] ?? '?'}·"));
});
