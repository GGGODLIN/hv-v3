/** rc12e item 3（僅分析，自訂）: replay each rc12d oc QA boss fight F30+ from its own pre-boss snapshot (same player, run buffs, hp/mp,
 *  same boss = encounter(run) with the run's own rng) pressing only ★ (SIM_POLICY=primary → primaryKey). Compare with the real turnlog.
 *  Usage: SIM_POLICY=primary npx tsx scripts/rc12e-oc-replay.ts K dump1.json dump2.json ... */
import { readFileSync } from 'node:fs';
import { decide, profsOf } from '../src/core/auto';
import { act, startBattle, armCp5, primaryKey } from '../src/core/battle';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, armBattle, battleLocks, encounter, openingOc, runDerived, type RunState } from '../src/core/run';
import { Rng } from '../src/core/rng';
import type { Player } from '../src/core/player';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const [K0, ...files] = process.argv.slice(2); const K = Number(K0 ?? 32);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const RUNS: Record<string, string> = { oc1: '20261028084609-9bsb', oc2: '20261028085446-b8t3', oc3: '20261028090110-wsep', oc4: '20261028091038-k3dk' };
const snap: Record<string, { player: Player; run: RunState }> = {}; const rows = new Map<string, { turn: number; bossDmg: number; bossMaxHp?: number }>();
for (const f of files) { const d = JSON.parse(readFileSync(f, 'utf8')) as Record<string, string>;
  for (const [k, v] of Object.entries(d)) { const m = k.match(/^hv-v3-qa-snap:(.+):F(\d+)$/); const o = m && Object.entries(RUNS).find(([, id]) => id === m[1]); if (o && +m![2]! >= 30) snap[`${o[0]}:F${m![2]}`] = JSON.parse(v); }
  for (const r of JSON.parse(d['hv-v3-qa-turnlog'] ?? '[]')) { const o = Object.entries(RUNS).find(([, id]) => id === r.runId); if (o) rows.set(`${o[0]}:F${r.floor}:${r.turn}`, r); }
}
/** The snapshot is written after encounter() (app.ts startBattle), so run.rng is already past the boss roll. mulberry32 advances by a
 *  constant, so rewind n steps and keep the n whose encounter() lands exactly on the snapshot state → the boss QA really met. */
function realBoss(run: RunState) { const S = run.rng >>> 0;
  for (let n = 1; n <= 2000; n++) { const r2 = structuredClone(run); r2.rng = (S - Math.imul(n, 0x6d2b79f5)) >>> 0; const ms = encounter(r2, pool, 'boss'); if (r2.rng >>> 0 === S) return { ms, n }; }
  throw new Error('no rewind'); }
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s[(s.length - 1) >> 1]! + s[s.length >> 1]!) / 2 : NaN; };
const G: Record<string, { hits: number; dmg: number; crit: number; av: Record<string, number>; minion: number; byAct: Record<string, number>; turns: number }> = {};
function fight(key: string, seed: number) {
  const P = snap[key]!; const p = structuredClone(P.player), run = structuredClone(P.run);
  const ms = structuredClone(realBoss(P.run).ms), d = runDerived(p, run);
  const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp, oc: run.oc }, ms, p.potions);
  b.locked = battleLocks(p); const oc0 = openingOc(p, 'boss', run); armBattle(b, run, p.lean); b.oc += oc0; if (run.cp5) armCp5(b, run.pdot);
  const rng = new Rng(seed ^ 0x5bd1e995), profs = profsOf(p), pot0 = b.potions.health; let seq = '', dmg = 0; const g = G[key] ??= { hits: 0, dmg: 0, crit: 0, av: {} as Record<string, number>, minion: 0, byAct: {} as Record<string, number>, turns: 0 };
  while (!b.over && b.turn < 400) {
    const t0 = Math.max(0, b.monsters.findIndex((m) => m.hp > 0)); seq += primaryKey(b, t0).key;
    const a = decide(b, 'buff:oc' as never, 'counter'); const bh = b.monsters.reduce((t, m) => t + (m.rank === 'boss' ? Math.max(0, m.hp) : 0), 0);
    const ak = a.kind === 'skill' ? (a as { id: string }).id : a.kind; g.turns++; g.byAct[ak] = (g.byAct[ak] ?? 0) + 1;
    for (const e of act(b, a, rng, profs)) if (e.t === 'hit' && e.from === 'player' && typeof e.to === 'number') { if (b.monsters[e.to]?.rank === 'boss') { g.hits++; g.dmg += e.dmg; g.crit += e.crits > 0 ? 1 : 0; const k = e.avoided ?? 'none'; g.av[k] = (g.av[k] ?? 0) + 1; } else g.minion += e.dmg; }
    dmg += bh - b.monsters.reduce((t, m) => t + (m.rank === 'boss' ? Math.max(0, m.hp) : 0), 0);
  }
  return { won: b.over === 'win', turns: b.turn, pots: pot0 - b.potions.health, dpt: dmg / Math.max(1, b.turn), seq };
}
for (const key of Object.keys(snap).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))) {
  const real = [...rows.entries()].filter(([k]) => k.startsWith(key + ':')).map(([, r]) => r).sort((a, b) => a.turn - b.turn);
  const rt = real.length ? Math.max(...real.map((r) => r.turn)) : NaN, rd = real.reduce((t, r) => t + r.bossDmg, 0);
  const s = snap[key]!, d = runDerived(s.player, s.run) as unknown as Record<string, number>, rb = realBoss(s.run), bm = rb.ms.find((m) => m.rank === 'boss')!;
  const r = [...Array(K)].map((_, i) => fight(key, i + 1)), mix: Record<string, number> = {};
  for (const x of r) for (const c of x.seq) mix[c] = (mix[c] ?? 0) + 1 / x.seq.length / K;
  console.log('REPLAY ' + JSON.stringify({ key, lv: (s.player as { level?: number }).level, hp0: s.run.hp, pot0: s.player.potions?.health ?? s.player.potions, bossSim: { name: bm.name, maxHp: bm.maxHp, rewind: rb.n, minion: rb.ms.filter((m) => m.rank !== 'boss').map((m) => m.name) }, bossRealMaxHp: real[0]?.bossMaxHp,
    real: { turns: rt, dpt: +(rd / Math.max(1, rt)).toFixed(1) }, sim: { turns: med(r.map((x) => x.turns)), tRange: [Math.min(...r.map((x) => x.turns)), Math.max(...r.map((x) => x.turns))], win: r.filter((x) => x.won).length / K, pots: med(r.map((x) => x.pots)), dpt: +med(r.map((x) => x.dpt)).toFixed(1) },
    starMix: Object.fromEntries(Object.entries(mix).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, +v.toFixed(3)])), seq1: r[0]!.seq.slice(0, 40),
    diag: ((g) => ({ hitsPerTurn: +(g.hits / g.turns).toFixed(2), dmgPerHit: Math.round(g.dmg / Math.max(1, g.hits - (g.av.evade ?? 0) - (g.av.miss ?? 0) - (g.av.parry ?? 0))), crit: +(g.crit / Math.max(1, g.hits)).toFixed(3), av: Object.fromEntries(Object.entries(g.av).map(([k, v]) => [k, +(v / g.hits).toFixed(3)])), minionShare: +(g.minion / (g.minion + g.dmg)).toFixed(3), act: Object.fromEntries(Object.entries(g.byAct).map(([k, v]) => [k, +(v / g.turns).toFixed(3)])) }))(G[key]!),
    boss: (({ physMit, evade, parry, block, spec, adb, lv, level }) => ({ physMit, evade, parry, block, spec, adb: Math.round(adb), lv: lv ?? level }))(bm as never),
    pl: { dtype: d.damageType, acc: d.acc ?? d.hit, keys: Object.keys(d).join(',') },
    stats: { maxHp: Math.round(d.hp!), adb: Math.round(d.adb!), physCrit: +(+d.physCrit!).toFixed(3), hit: d.acc, buffs: (s.run as { buffs?: unknown }).buffs } }));
}
