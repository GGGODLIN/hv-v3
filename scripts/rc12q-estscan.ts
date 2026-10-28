/** rc12q（自訂）: scan ★ boss fights from QA snapshots for rounds where the crit-case next-round estimate (the ★/UI number) is
 *  below the damage that actually landed. Usage: npx tsx scripts/rc12q-estscan.ts save.json runId K F */
import { readFileSync } from 'node:fs';
process.env.SIM_POLICY ??= 'primary';
const { makePool } = await import('../src/core/monsters');
const { RULES, encounter, runDerived, battleLocks, openingOc, armBattle } = await import('../src/core/run') as any;
const { Rng } = await import('../src/core/rng') as any;
const { startBattle, armCp5, primaryKey, act, nextRoundEstimate, chargeEstimate } = await import('../src/core/battle') as any; const { curveSchool12g } = await import('../src/core/cp8');
const { profsOf } = await import('../src/core/auto');
RULES.cp6Abyss = RULES.cp5Bosses = RULES.cp4RunBuffs = RULES.cp7 = RULES.cp8 = true;
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')));
const [f, rid, K = '64', F = '50'] = process.argv.slice(2);
const s = JSON.parse(JSON.parse(readFileSync(f!, 'utf8'))[`hv-v3-qa-snap:${rid}:F${F}`]);
let rounds = 0, under = 0, fatal = 0; const why: Record<string, number> = {}; const ex: string[] = [];
for (let i = 0; i < +K; i++) { const p = structuredClone(s.player), r = structuredClone(s.run); if (i) r.rng = (r.rng + i * 7919) >>> 0;
  const ms = encounter(r, pool, 'boss', curveSchool12g(p)); const b = startBattle(runDerived(p, r), { hp: r.hp, mp: r.mp, sp: r.sp, oc: r.oc }, ms, p.potions); b.locked = battleLocks(p);
  const oc0 = openingOc(p, 'boss', r); armBattle(b, r, p.lean, !!p.equipped?.offHand); b.oc += oc0; if (r.cp5) armCp5(b, r.pdot);
  const rng = new Rng(1000 + i);
  while (!b.over && b.turn < 400) { const a = primaryKey(b, Math.max(0, b.monsters.findIndex((m: any) => m.hp > 0))).action;
    const est = nextRoundEstimate(b, true, a.kind === 'defend'); const dbg = process.env.SIM_EVDUMP ? JSON.stringify(b.monsters.map((m: any) => [m.rank, m.hp, m.status.stun, Math.round(chargeEstimate(b, m, a.kind === 'defend', true))]).concat([[b.hp, b.d.hp, b.defendTurns, b.used9 ? 1 : 0, b.stand9 ? 1 : 0]])) : ''; const pre = b.monsters.map((m: any) => `${m.rank[0]}${m.hp > 0 ? '' : 'x'}c${m.charge}${m.heavyNext ? 'H' : ''}${m.pulseNext ? 'P' : ''}${m.drainNext ? 'D' : ''}${m.enraged ? 'E' : ''}${m.status?.stun ? 'S' : ''}`).join(',');
    const ev = act(b, a, rng, profsOf(p)); const hits = ev.filter((e: any) => e.to === 'player' && e.t === 'hit'); const took = ev.filter((e: any) => e.to === 'player' && typeof e.dmg === 'number').reduce((t: number, e: any) => t + e.dmg, 0);
    if (a.kind === 'item') continue; rounds++;
    if (took > est) { under++; if (b.hp <= 0) fatal++; const k = `${a.kind}|${hits.map((e: any) => `${b.monsters[e.from]?.rank[0]}:${e.label ?? '-'}`).join('+')}`; why[k] = (why[k] ?? 0) + 1;
      if (ex.length < 12) ex.push(dbg + ' ' + `seed${i} t${b.turn} ${a.kind} est${Math.round(est)} took${took} hp${b.hp} pre[${pre}] ${hits.map((e: any) => `${b.monsters[e.from]?.rank}:${e.label ?? '-'}:${e.dmg}${e.crits ? 'c' : ''}`).join(' ')} ${ev.filter((e: any) => e.to === 'player' && e.t !== 'hit' && e.dmg).map((e: any) => e.t + e.dmg).join(' ')}`); } } }
console.log(JSON.stringify({ rounds, under, fatal, why }, null, 1)); console.log(ex.join('\n'));
