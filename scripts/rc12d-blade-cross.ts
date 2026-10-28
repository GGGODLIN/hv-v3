/** rc12d item 2（僅分析）: blade QA b1–b4 pre-boss snapshots, cross-played: character of run X (player + run buffs/hp) vs the boss
 *  rolled from run Y's snapshot (encounter(Yrun) with Y's own rng → the same boss Y really met). Same app.ts startBattle chain as
 *  rc12-gap-replay. Env: SIM_AI=naive SIM_POTPOLICY=ui SIM_POLICY=primary. BUFFS_FROM=bN swaps run.buffs only. Usage: npx tsx scripts/rc12d-blade-cross.ts <F> [K=32] dump1 dump2 ... */
import { readFileSync } from 'node:fs';
import { decide, profsOf } from '../src/core/auto';
import { act, startBattle, armCp5 } from '../src/core/battle';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, armBattle, battleLocks, encounter, openingOc, runDerived, type RunState } from '../src/core/run';
import { Rng } from '../src/core/rng';
import type { Player } from '../src/core/player';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const [F0, K0, ...files] = process.argv.slice(2); const F = Number(F0), K = Number(K0 ?? 32);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const RUNS: Record<string, string> = process.env.CROSS_RUNS ? Object.fromEntries(process.env.CROSS_RUNS.split(',').map((x) => x.split('=') as [string, string])) /* rc12d: bulwark bw1–bw4 */ : { b1: '20261028073040-b8hm', b2: '20261028073627-axyy', b3: '20261028074006-hva3', b4: '20261028074520-g7p5' };
const snap: Record<string, { player: Player; run: RunState }> = {};
for (const f of files) { const d = JSON.parse(readFileSync(f, 'utf8')) as Record<string, string>;
  for (const [b, id] of Object.entries(RUNS)) { const v = d[`hv-v3-qa-snap:${id}:F${F}`]; if (v) snap[b] = JSON.parse(v); }
}
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s[(s.length - 1) >> 1]! + s[s.length >> 1]!) / 2 : NaN; };
const RX = /打斷|抵抗|破甲|暈眩|復活/;
function fight(cx: string, by: string, seed: number) {
  const P = snap[cx]!, B = snap[by]!; const p = structuredClone(P.player), run = structuredClone(P.run);
  const bf = process.env.BUFFS_FROM; if (bf && snap[bf]) run.buffs = structuredClone(snap[bf]!.run.buffs); // ablation: swap only the run buffs
  const ms = encounter(structuredClone(B.run), pool, 'boss'), d = runDerived(p, run);
  const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp, oc: run.oc }, ms, p.potions);
  b.locked = battleLocks(p); const oc0 = openingOc(p, 'boss', run); armBattle(b, run, p.lean); b.oc += oc0; if (run.cp5) armCp5(b, run.pdot);
  const rng = new Rng(seed ^ 0x5bd1e995), profs = profsOf(p), pot0 = b.potions.health, tags: Record<string, number> = {}, mix: Record<string, number> = {};
  let zero = 0;
  while (!b.over && b.turn < 400) {
    const a = decide(b, `buff:${process.env.SC ?? 'blade'}` as never, 'counter'); const k = a.kind === 'skill' ? `sk:${(a as { id?: string }).id}` : a.kind; mix[k] = (mix[k] ?? 0) + 1;
    const bh = b.monsters.reduce((t, m) => t + (m.rank === 'boss' ? m.hp : 0), 0);
    for (const e of act(b, a, rng, profs)) { const t = (e as { text?: string }).text; const m = t?.match(RX); if (m) tags[m[0]] = (tags[m[0]] ?? 0) + 1; }
    if (b.monsters.reduce((t, m) => t + (m.rank === 'boss' ? m.hp : 0), 0) >= bh) zero++;
  }
  return { won: b.over === 'win', turns: b.turn, pots: pot0 - b.potions.health, zero: zero / b.turn, tags, mix };
}
const info = Object.fromEntries(Object.entries(snap).map(([k, s]) => { const d = runDerived(s.player, s.run) as unknown as Record<string, number>;
  const bm = encounter(structuredClone(s.run), pool, 'boss').find((m) => m.rank === 'boss')!;
  return [k, { hp0: s.run.hp, maxHp: Math.round(d.hp!), adb: Math.round(d.adb!), physCrit: +(+d.physCrit!).toFixed(3), physMit: +(+d.physMit!).toFixed(3), pot: s.player.potions,
    gear: Object.values(s.player.equipped ?? {}).filter(Boolean).map((e) => (e as { name?: string }).name), bonus: s.run.bonus, buffs: (s.run as { buffs?: unknown }).buffs,
    boss: { name: bm.name, maxHp: bm.maxHp, phases: (bm as { phases?: number }).phases, res: (bm as { res?: unknown }).res } }]; }));
console.log(JSON.stringify({ F, info }));
for (const cx of Object.keys(snap)) for (const by of Object.keys(snap)) {
  const r = [...Array(K)].map((_, i) => fight(cx, by, i + 1)); const tags: Record<string, number> = {}, mix: Record<string, number> = {};
  for (const x of r) { for (const [k, v] of Object.entries(x.tags)) tags[k] = +((tags[k] ?? 0) + v / K).toFixed(2); for (const [k, v] of Object.entries(x.mix)) mix[k] = +((mix[k] ?? 0) + v / K).toFixed(1); }
  console.log(JSON.stringify({ char: cx, boss: by, turns: med(r.map((x) => x.turns)), win: r.filter((x) => x.won).length / K, pots: med(r.map((x) => x.pots)), zero: +med(r.map((x) => x.zero)).toFixed(2), tags, mix }));
}
