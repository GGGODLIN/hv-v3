/** CP4 rc balance table: per school (buff:<school>), N fresh characters x up to M runs.
 * Usage: npx tsx scripts/cp4-balance.ts [N=32] [M=8]
 * Columns: 首次F10勝率 = share of characters that win their FIRST F10 boss fight; T1通關 = trip-1 clear;
 * F9菁英 = F9 elite fights won / fought (trips up to first clear); 首通buff中位 = buffs held when the first clear ends. */
import { readFileSync } from 'node:fs';
import { applyKnobs, KN } from './cp4-knobs';
import { autoRun, starterKit, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';
const args = process.argv.slice(2).filter((a) => !a.includes('='));
const N = Number(args[0] ?? 32), M = Number(args[1] ?? 8);
applyKnobs(process.argv.slice(2));
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2]! : (s[n / 2 - 1]! + s[n / 2]!) / 2) : NaN; };
const pc = (a: number, b: number) => `${(100 * a / Math.max(1, b)).toFixed(0)}%`;
console.log(`seeds=${N} maxRuns=${M} overrides=${process.argv.slice(2).filter((a) => a.includes('=')).join(' ') || 'none'}`);
console.log('流派 | 首次F10勝率 | 8趟內通關 | T1通關 | 首通趟中位 | F9菁英勝率 | F9菁英剩HP | F10首領回合 | 首通buff中位 | buff分佈');
for (const school of ['blade', 'oc', 'arcane', 'bulwark']) {
  const sh: Record<string, [number, number]> = {};
  let f10first = 0, f10firstN = 0, t1 = 0, e9w = 0, e9n = 0; const hp9: number[] = [], fc: number[] = [], atClear: number[] = [], t10: number[] = [];
  for (let s = 1; s <= N; s++) {
    const p = newPlayer(); starterKit(p, s); let first = true, cleared = false;
    for (let i = 1; i <= M && !cleared; i++) {
      const r = autoRun(p, pool, s * 1000 + i, `buff:${school}` as Strategy, KN.cp5);
      for (const e of r.elites ?? []) if (e.floor === 9) { e9n++; if (e.won) { e9w++; hp9.push(e.hpPct); } }
      const b10 = r.bosses.find((b) => b.floor === 10);
      if (b10 && first) { first = false; f10firstN++; if (b10.won) f10first++; t10.push(b10.turns); const k = p.equipped.offHand?.group === 'shield' ? p.equipped.offHand.base : 'none'; const x = (sh[k] ??= [0, 0]); x[1]++; if (b10.won) x[0]++; }
      if (r.floorReached > 10) { cleared = true; fc.push(i); if (i === 1) t1++; atClear.push(r.cp4?.buffs.length ?? 0); }
    }
  }
  const hist: Record<number, number> = {}; for (const x of atClear) hist[x] = (hist[x] ?? 0) + 1;
  console.log(`${school} | ${pc(f10first, f10firstN)} (${f10first}/${f10firstN}) | ${pc(fc.length, N)} | ${pc(t1, N)} | ${med(fc)} | ${pc(e9w, e9n)} (${e9w}/${e9n}) | ${(100 * med(hp9)).toFixed(0)}% | ${med(t10)} | ${med(atClear)} | ${JSON.stringify(hist)} | 盾@首F10 ${Object.entries(sh).map(([k, [w, n]]) => `${k}:${w}/${n}`).join(' ')}`);
}
