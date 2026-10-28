// rc12k item 3（自訂）: QA rc12j bulwark-1 F75 — ★ chose Q / A into a 尖刺盾 boss at low HP; the reflect plus the monsters' swing in the same
// round killed the player. Repro from the QA bulwark snapshot (1anh F60 moved to F75; save rc12j-bulwark-1-end.json).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, armCp5, nextRoundEstimate, primaryKey, reflectLethal9, reflectRisk9, startBattle } from '../src/core/battle';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, armBattle, battleLocks, openingOc, runDerived } from '../src/core/run';
import { Rng } from '../src/core/rng';
import { profsOf } from '../src/core/auto';
import { realBoss } from '../scripts/rc12f-realboss';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const P = JSON.parse(readFileSync('tests/fixtures/rc12k-bulwark-1anh-F60.json', 'utf8'));
const R0 = { ...RULES };
const on = () => { RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true; };
const off = () => Object.assign(RULES, R0);
function fight(F: number) { const p = structuredClone(P.player), run = structuredClone(P.run); run.floor = F;
  const ms = structuredClone(realBoss(run, pool, true, p.lean).ms), d = runDerived(p, run);
  const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp, oc: run.oc }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run, p.lean, !!p.equipped?.offHand); b.oc += openingOc(p, 'boss', run); if (run.cp5) armCp5(b, run.pdot);
  return { b, profs: profsOf(p) }; }
const physOn = (a: { kind: string; target?: number }, t: number) => (a.kind === 'attack' || a.kind === 'skill') && a.target === t;
describe('rc12k item 3: ★ never hits a 反傷 target when reflect + this round can kill', () => {
  it('F75 shape: thorns boss, minion alive, HP 312, potion cooling → ★ switches to the minion', () => { on(); try {
    const { b } = fight(75); expect(P.player.lean).toBe('bulwark'); expect(b.monsters.length).toBeGreaterThan(1);
    (b.monsters[0] as { thornTurns?: number }).thornTurns = 2; b.hp = 312; b.itemCd.health = 17;
    expect(reflectRisk9(b, 0)).toBeLessThan(312); expect(reflectRisk9(b, 0) + nextRoundEstimate(b)).toBeGreaterThanOrEqual(312);
    expect(reflectLethal9(b, 0)).toBe(true);
    const pk = primaryKey(b, 0); expect(physOn(pk.action as never, 0), pk.why).toBe(false);
    b.monsters.slice(1).forEach((m) => { m.hp = 0; }); const pk2 = primaryKey(b, 0); expect(physOn(pk2.action as never, 0), pk2.why).toBe(false);
  } finally { off(); } });
  it('★-only replay F75 ×64: no 反傷 death above HP 1 (rc12j: 21/128)', () => { on(); try {
    let bad = 0;
    for (let i = 0; i < 64; i++) { const { b, profs } = fight(75); const rng = new Rng((i + 1) ^ 0x5bd1e995);
      while (!b.over && b.turn < 400) { const t = b.monsters.findIndex((m) => m.hp > 0); const pk = primaryKey(b, t); const tg = (pk.action as { target?: number }).target ?? t;
        const hpBefore = b.hp; void tg;
        const ev = act(b, pk.action, rng, profs) as { label?: string }[];
        if (b.over === 'lose' && Math.round(hpBefore) > 1 && ev.some((e) => /^反傷/.test(e.label ?? '')) ) bad++; } }
    expect(bad).toBe(0);
  } finally { off(); } });
});
