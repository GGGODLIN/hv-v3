/** rc12 gap（僅分析，不改數值）: load the QA pre-boss snapshots (hv-v3-qa-snap:<runId>:F<n>) from a QA localStorage dump, rebuild the
 *  boss fight exactly like app.ts startBattle (encounter → startBattle → battleLocks → openingOc → armBattle → armCp5) with the SAME
 *  player/run state, and let the sim AI fight it K times (run.rng reseeded → a boss of the same depth/level/HP curve).
 *  Prints, per snapshot: real turns / boss maxHp / player→boss dmg per turn (from the QA turn log) next to the sim's.
 *  Env: SIM_AI=naive SIM_POTPOLICY=ui (the playtest-matching AI). Usage: npx tsx scripts/rc12-gap-replay.ts <dump.json> [K=16] [--min 30] */
import { readFileSync } from 'node:fs';
import { decide, profsOf } from '../src/core/auto';
import { act, startBattle, armCp5, type BattleState } from '../src/core/battle';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, armBattle, battleLocks, encounter, openingOc, runDerived, type RunState } from '../src/core/run';
import { Rng } from '../src/core/rng';
import type { Player } from '../src/core/player';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const [file, K0] = process.argv.slice(2); const K = Number(K0 ?? 16); const MIN = Number(process.argv[process.argv.indexOf('--min') + 1] || 30);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const dump = JSON.parse(readFileSync(file!, 'utf8')) as Record<string, string>;
type Row = { runId: string; lean: string; floor: number; turn: number; bossDmg: number; bossHp: number; bossMaxHp?: number };
const log = JSON.parse(dump['hv-v3-qa-turnlog'] ?? '[]') as Row[];
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s[(s.length - 1) >> 1]! + s[s.length >> 1]!) / 2 : NaN; };
const isBoss = (b: BattleState, i: number) => b.monsters[i]!.rank === 'boss';
function one(p0: Player, r0: RunState, seed: number) {
  const p = structuredClone(p0), run = structuredClone(r0); run.rng = (seed * 2654435761) >>> 0 || 1;
  const ms = encounter(run, pool, 'boss'), d = runDerived(p, run);
  const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp, oc: run.oc }, ms, p.potions);
  b.locked = battleLocks(p); const oc0 = openingOc(p, 'boss', run); armBattle(b, run, p.lean); b.oc += oc0; if (run.cp5) armCp5(b, run.pdot);
  const rng = new Rng(seed ^ 0x5bd1e995), profs = profsOf(p), mix: Record<string, number> = {}; const toBoss: number[] = [], toMe: number[] = [];
  const bi = b.monsters.findIndex((m) => m.rank === 'boss'), maxHp = b.monsters[bi]!.maxHp, pot0 = b.potions.health;
  while (!b.over && b.turn < 400) {
    const a = decide(b, `buff:${p.lean === 'bulwark' ? 'bulwark' : p.lean ?? 'blade'}` as never, 'counter');
    const k = a.kind === 'skill' ? 'skill' : a.kind === 'item' ? 'Z' : a.kind === 'defend' ? 'D' : a.kind === 'attack' ? 'A' : a.kind; mix[k] = (mix[k] ?? 0) + 1;
    const bh = b.monsters.map((m) => m.hp), hp = b.hp; const ev = act(b, a, rng, profs);
    toBoss.push(b.monsters.reduce((t, m, i) => t + (isBoss(b, i) ? Math.max(0, bh[i]! - Math.max(0, m.hp)) : 0), 0));
    toMe.push(ev.filter((e) => e.t === 'hit' && (e as { to?: string }).to === 'player').reduce((t, e) => t + ((e as { dmg?: number }).dmg ?? 0), 0)); void hp;
  }
  return { won: b.over === 'win', turns: b.turn, maxHp, toBoss: med(toBoss.filter((x) => x > 0)), zero: toBoss.filter((x) => x === 0).length / toBoss.length, toMe: med(toMe), pots: pot0 - b.potions.health, mix,
    atk: Math.round((d as unknown as { adb?: number; atk?: number }).adb ?? (d as unknown as { atk?: number }).atk ?? 0), php: Math.round(d.hp), hp0: Math.round(run.hp), pot0, boss: b.monsters[bi]!.name };
}
const out: unknown[] = [];
for (const key of Object.keys(dump).filter((k) => /^hv-v3-qa-snap:[^:]+:F\d+$/.test(k))) {
  const [, runId, F] = key.match(/^hv-v3-qa-snap:([^:]+):F(\d+)$/)!; const floor = Number(F); if (floor < MIN) continue;
  const s = JSON.parse(dump[key]!) as { player: Player; run: RunState; level: number };
  const real = log.filter((r) => r.runId === runId && r.floor === floor); if (!real.length) continue;
  const sims = [...Array(K)].map((_, i) => one(s.player, s.run, i + 1)); const mix: Record<string, number> = {};
  for (const x of sims) for (const [k, v] of Object.entries(x.mix)) mix[k] = (mix[k] ?? 0) + v;
  const tot = Object.values(mix).reduce((a, b) => a + b, 0);
  out.push({ runId, lean: s.player.lean, floor, level: s.level, hp0: sims[0]!.hp0, maxHp: sims[0]!.php, pot0: sims[0]!.pot0,
    real: { turns: real.length, bossMaxHp: real[0]!.bossMaxHp, toBoss: med(real.map((r) => r.bossDmg).filter((x) => x > 0)), zero: +(real.filter((r) => r.bossDmg === 0).length / real.length).toFixed(2), won: real.at(-1)!.bossHp <= 0 },
    sim: { turns: med(sims.map((x) => x.turns)), bossMaxHp: med(sims.map((x) => x.maxHp)), toBoss: med(sims.map((x) => x.toBoss)), zero: +med(sims.map((x) => x.zero)).toFixed(2), toMe: med(sims.map((x) => x.toMe)), pots: med(sims.map((x) => x.pots)), win: sims.filter((x) => x.won).length / K,
      mix: Object.fromEntries(Object.entries(mix).map(([k, v]) => [k, +(v / tot).toFixed(2)])) } });
}
console.log(JSON.stringify(out, null, process.argv.includes('--pretty') ? 1 : 0));
