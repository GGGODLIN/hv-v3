/** rc12f（僅分析，自訂）: bulwark F30+ boss fights replayed from the rc12d QA pre-boss snapshots (★ only, SIM_POLICY=primary),
 *  strict 0-damage turns (boss HP not reduced) broken down by the ★ key and the cause.
 *  Usage: SIM_POLICY=primary npx tsx scripts/rc12f-zero.ts K dump1.json ... */
import { readFileSync } from 'node:fs';
import { decide, profsOf } from '../src/core/auto';
import { act, startBattle, armCp5, primaryKey } from '../src/core/battle';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, armBattle, battleLocks, openingOc, runDerived, type RunState } from '../src/core/run';
import { Rng } from '../src/core/rng';
import type { Player } from '../src/core/player';
import { realBoss } from './rc12f-realboss';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const [K0, ...files] = process.argv.slice(2); const K = Number(K0 ?? 32);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const RUNS: Record<string, string> = { bw1: '20261028100912-3yv1', bw2: '20261028101807-1anh' };
const snap: Record<string, { player: Player; run: RunState; rngAt?: string }> = {};
for (const f of files) { const d = JSON.parse(readFileSync(f, 'utf8')) as Record<string, string>;
  for (const [k, v] of Object.entries(d)) { const m = k.match(/^hv-v3-qa-snap:(.+):F(\d+)$/); const o = m && Object.entries(RUNS).find(([, id]) => id === m[1]); if (o && +m![2]! >= 30) snap[`${o[0]}:F${m![2]}`] = JSON.parse(v); } }
const C: Record<string, number> = {}; let turns = 0, zero = 0; const add = (k: string) => (C[k] = (C[k] ?? 0) + 1);
const bossHp = (b: { monsters: { rank: string; hp: number }[] }) => b.monsters.reduce((t, m) => t + (m.rank === 'boss' ? Math.max(0, m.hp) : 0), 0);
for (const key of Object.keys(snap)) for (let seed = 1; seed <= K; seed++) {
  const P = snap[key]!; const p = structuredClone(P.player), run = structuredClone(P.run);
  const ms = structuredClone(realBoss(P.run, pool, P.rngAt === 'pre-encounter').ms), d = runDerived(p, run);
  const b = startBattle(d, { hp: run.hp, mp: run.mp, sp: run.sp, oc: run.oc }, ms, p.potions);
  b.locked = battleLocks(p); armBattle(b, run, p.lean); b.oc += openingOc(p, 'boss', run); if (run.cp5) armCp5(b, run.pdot);
  const rng = new Rng(seed ^ 0x5bd1e995), profs = profsOf(p);
  while (!b.over && b.turn < 400) {
    const t0 = Math.max(0, b.monsters.findIndex((m) => m.hp > 0)), pk = primaryKey(b, t0).key, a = decide(b, 'buff:bulwark' as never, 'counter');
    const bh = bossHp(b), ev = act(b, a, rng, profs); turns++;
    if (bossHp(b) < bh) continue; zero++;
    const ak = a.kind === 'skill' ? `skill` : a.kind;
    const hits = ev.filter((e) => e.t === 'hit' && e.from === 'player' && typeof e.to === 'number') as unknown as { to: number; dmg: number; avoided?: string }[];
    const onBoss = hits.filter((h) => b.monsters[h.to]?.rank === 'boss');
    let why: string;
    if (ak === 'defend') why = 'D 防禦';
    else if (ak === 'item') why = 'Z 喝藥';
    else if (ak === 'focus') why = 'F 專注';
    else if (/^[QWER]$/.test(pk) && ak === 'attack') why = '想放技能但 OC 不足 → 普攻落空';
    else if (onBoss.length && onBoss.every((h) => h.avoided)) why = `打王被${[...new Set(onBoss.map((h) => ({ evade: '閃避', parry: '招架', block: '格擋', miss: '未命中', resist: '抵抗' } as Record<string, string>)[h.avoided!] ?? h.avoided))].join('/')}`;
    else if (hits.length && !onBoss.length) why = '打小怪';
    else if (onBoss.length) why = '打王但被吸收/回血抵銷';
    else why = `${ak}（無命中事件）`;
    add(`${pk}｜${why}`);
  }
}
console.log(JSON.stringify({ fights: Object.keys(snap).length * K, keys: Object.keys(snap), turns, zero, share: +(zero / turns).toFixed(3) }));
for (const [k, v] of Object.entries(C).sort((a, b) => b[1] - a[1])) console.log(`${k}\t${v}\t${(v / zero * 100).toFixed(1)}%\t${(v / turns * 100).toFixed(1)}%`);
