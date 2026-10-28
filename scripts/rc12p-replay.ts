/** rc12p B（自訂）: replay QA pre-boss snapshots through the GAME setup (encounter→startBattle→armBattle→armCp5, the App.startBattle order)
 *  with the ★ policy (SIM_POLICY=primary, same fight() the full-run sim uses). Usage: npx tsx scripts/rc12p-replay.ts save.json [runId] */
import { readFileSync } from 'node:fs';
process.env.SIM_POLICY ??= 'primary';
const { fight, profsOf } = await import('../src/core/auto');
const { makePool } = await import('../src/core/monsters');
const { RULES, encounter, runDerived, battleLocks, openingOc, armBattle } = await import('../src/core/run') as any;
const { startBattle, armCp5 } = await import('../src/core/battle'); const { curveSchool12g } = await import('../src/core/cp8');
const { Rng } = await import('../src/core/rng') as any;
RULES.cp6Abyss = RULES.cp5Bosses = RULES.cp4RunBuffs = RULES.cp7 = RULES.cp8 = true;
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')));
const [f, rid = '20261028173848-vf9k', K = '16'] = process.argv.slice(2);
const d = JSON.parse(readFileSync(f!, 'utf8')) as Record<string, string>;
const out: any[] = [];
for (const [k, v] of Object.entries(d)) { const m = k.match(/^hv-v3-qa-snap:(.+):F(\d+)$/); if (!m || m[1] !== rid || +m[2]! < 55 || +m[2]! > 70) continue;
  const s = JSON.parse(v); const turns: number[] = []; let wins = 0, potU = 0, hp = 0, adb = 0, bossHp = 0;
  for (let i = 0; i < +K; i++) { const p = structuredClone(s.player), r = structuredClone(s.run);
    if (i) r.rng = (r.rng + i * 7919) >>> 0;
    const ms = encounter(r, pool, 'boss', curveSchool12g(p)); const dd = runDerived(p, r);
    const b = startBattle(dd, { hp: r.hp, mp: r.mp, sp: r.sp, oc: r.oc }, ms, p.potions); b.locked = battleLocks(p);
    const oc0 = openingOc(p, 'boss', r); armBattle(b, r, p.lean, !!p.equipped?.offHand); b.oc += oc0; if (r.cp5) armCp5(b, r.pdot);
    const p0 = b.potions.health; fight(b, 'buff:blade' as any, new Rng(1000 + i), profsOf(p), 'counter');
    turns.push(b.turn); if (b.over === 'win') wins++; potU += p0 - b.potions.health; hp = Math.round(dd.hp); adb = Math.round(dd.adb); bossHp = Math.round(ms.find((x: any) => x.rank === 'boss')?.maxHp ?? 0); }
  turns.sort((a, b) => a - b); out.push({ F: +m[2]!, lean: s.player.lean, buffs: s.run.buffs?.length, hp, adb, bossHp, med: turns[turns.length >> 1], min: turns[0], max: turns.at(-1), win: wins / +K, potUse: +(potU / +K).toFixed(1) }); }
console.log(JSON.stringify(out.sort((a, b) => a.F - b.F)));
