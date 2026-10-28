/** rc12q prep（自訂）: replay QA pre-boss snapshots through the REAL App (enterNode→startBattle→battleHtml ★→command→…), pressing the ★ key
 *  every turn like the QA driver, vs fight() (sim). Usage: npx tsx scripts/rc12q-appreplay.ts save.json runId K [fromF] [toF] */
import { readFileSync } from 'node:fs';
process.env.SIM_POLICY ??= 'primary';
const mem: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = String(v); }, removeItem: (k: string) => { delete mem[k]; } };
(globalThis as any).window ??= globalThis;
const { App } = await import('../src/game/app');
const { makePool } = await import('../src/core/monsters');
const { RULES } = await import('../src/core/run') as any;
const { Rng } = await import('../src/core/rng') as any;
const { fight, profsOf } = await import('../src/core/auto');
const { encounter, runDerived, battleLocks, openingOc, armBattle } = await import('../src/core/run') as any;
const { startBattle, armCp5, primaryKey } = await import('../src/core/battle'); const { curveSchool12g } = await import('../src/core/cp8');
RULES.cp6Abyss = RULES.cp5Bosses = RULES.cp4RunBuffs = RULES.cp7 = RULES.cp8 = true;
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')));
const [f, rid, K = '16', lo = '55', hi = '70'] = process.argv.slice(2);
const d = JSON.parse(readFileSync(f!, 'utf8')) as Record<string, string>;
const noop = () => undefined;
const stage = new Proxy({ speed: 1 }, { get: (t: any, k) => (k in t ? t[k] : ['lootBeams', 'play'].includes(String(k)) ? async () => undefined : noop) });
const toCmd = (a: any): string => a.kind === 'skill' || a.kind === 'spell' || a.kind === 'item' ? `${a.kind}:${a.id}` : a.kind;
const med = (x: number[]) => [...x].sort((a, b) => a - b)[x.length >> 1];
const out: any[] = [];
for (const [k, v] of Object.entries(d)) { const m = k.match(/^hv-v3-qa-snap:(.+):F(\d+)$/); if (!m || m[1] !== rid || +m[2]! < +lo || +m[2]! > +hi) continue;
  const s = JSON.parse(v); const app: number[] = [], sim: number[] = [], keys: Record<string, number> = {}, simPot: number[] = [], appPot: number[] = [];
  let seq0 = '';
  for (let i = 0; i < +K; i++) {
    { const p = structuredClone(s.player), r = structuredClone(s.run); if (i) r.rng = (r.rng + i * 7919) >>> 0;
      const ms = encounter(r, pool, 'boss', curveSchool12g(p)); const dd = runDerived(p, r);
      const b = startBattle(dd, { hp: r.hp, mp: r.mp, sp: r.sp, oc: r.oc }, ms, p.potions); b.locked = battleLocks(p);
      const oc0 = openingOc(p, 'boss', r); armBattle(b, r, p.lean, !!p.equipped?.offHand); b.oc += oc0; if (r.cp5) armCp5(b, r.pdot);
      const p0 = b.potions.health; fight(b, 'buff:blade' as any, new Rng(1000 + i), profsOf(p), 'counter'); sim.push(b.turn); simPot.push(p0 - b.potions.health); }
    const p = structuredClone(s.player), r = structuredClone(s.run); if (i) r.rng = (r.rng + i * 7919) >>> 0;
    r.tower.floors[r.floor - 1] = { ...r.tower.floors[r.floor - 1], options: ['boss'] };
    const a = Object.create(App.prototype) as any;
    Object.assign(a, { data: { player: p, run: r, settings: { skipAnim: true } }, notice: [], pending: {}, stage, pool, root: { querySelectorAll: () => [], innerHTML: '' }, recent: [], log: [], rng: new Rng(1000 + i), target: 0, chargeHoldUntil: 0, busy: false });
    a.go = noop; a.render = noop; a.save = noop; a.endBattle = async () => undefined;
    await a.enterNode(0); const b = a.battle; const p0 = b.potions.health; let seq = '';
    while (!b.over && b.turn < 400) { a.chargeHoldUntil = 0; a.busy = false; try { a.battleHtml(); } catch { /* html helpers */ }
      const pk = primaryKey(b, a.target); keys[pk.key] = (keys[pk.key] ?? 0) + 1; if (i === 0) seq += pk.key;
      const t0 = b.turn; await a.command(toCmd(pk.action)); if (b.turn === t0 && !b.over) { keys['stuck:' + pk.key] = (keys['stuck:' + pk.key] ?? 0) + 1; await a.command('attack'); if (b.turn === t0) break; } }
    app.push(b.turn); appPot.push(p0 - b.potions.health); if (i === 0) seq0 = seq;
  }
  out.push({ F: +m[2]!, appMed: med(app), simMed: med(sim), app0: app[0], sim0: sim[0], appMax: Math.max(...app), simMax: Math.max(...sim), appPot: +(appPot.reduce((x, y) => x + y, 0) / +K).toFixed(1), simPot: +(simPot.reduce((x, y) => x + y, 0) / +K).toFixed(1), keys, seq0 });
}
console.log(JSON.stringify(out.sort((a, b) => a.F - b.F), null, 1));
