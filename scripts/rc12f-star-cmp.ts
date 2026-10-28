/** rc12f（僅分析）: ★ misfit / off-school share, rc12d rule vs rc12f rule, same offers. */
import { readFileSync } from 'node:fs';
import { BUFF, type Rarity } from '../src/core/buffs';
import { buffFit, buffUse, offerStar, openOffer } from '../src/core/buffoffer';
import { RULES, startRun } from '../src/core/run';
import { newPlayer, type Player } from '../src/core/player';
import { autoRun, starterKit } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const old = (p: Player, ids: string[]) => { const R: Record<Rarity, number> = { common: 0, rare: 1, legend: 2 }; const fit = ids.filter((id) => buffFit(p, id).ok); if (!fit.length) return null;
  const sc = (id: string) => { const b = BUFF[id]!; return (b.school === p.lean ? 10 : 0) + (b.school === p.lean && b.core ? 5 : 0) + R[b.rarity]; }; return fit.reduce((a, x) => (sc(x) > sc(a) ? x : a)); };
const P0 = (() => { const p = newPlayer(); starterKit(p, 1); for (let i = 1; i <= 3; i++) autoRun(p, pool, 2000 + i, 'buff:blade'); return p; })();
RULES.cp4RunBuffs = true;
for (const lean of ['blade', 'oc', 'arcane', 'bulwark']) for (const sh of [true, false]) {
  const p = structuredClone(P0); p.lean = lean as never; if (!sh) delete (p.equipped as Record<string, unknown>).offHand; else p.equipped.offHand ??= { base: 'buckler' } as never;
  const q = structuredClone(p); delete (q.equipped as Record<string, unknown>).offHand;
  const c = { old: { mis: 0, ocb: 0, part: 0 }, neu: { mis: 0, ocb: 0, part: 0 } }; let n = 0;
  for (let seed = 1; seed <= 2000; seed++) { const run = startRun(q, seed); run.buffs = []; const ids = openOffer(p, run, (['shrine', 'elite', 'boss'] as const)[seed % 3]!); n++;
    const full = ids.filter((id) => buffUse(p, id).use === 1), good = full.filter((id) => [lean, 'none'].includes(BUFF[id]!.school));
    for (const [k, st] of [['old', old(p, ids)], ['neu', offerStar(p, ids)]] as const) { if (!st) continue; const s = BUFF[st]!.school, x = c[k];
      if (s !== lean && s !== 'none' && good.length) x.mis++; if (buffUse(p, st).use < 1) x.part++; if (lean === 'bulwark' && ['O6', 'O9', 'B8'].includes(st)) x.ocb++; } }
  const f = (x: { mis: number; ocb: number; part: number }) => `不適配 ${(x.mis / n * 100).toFixed(1)}%、部分無效 ${(x.part / n * 100).toFixed(1)}%${lean === 'bulwark' ? `、魂燃/王者氣魄/千刃 ${(x.ocb / n * 100).toFixed(1)}%` : ''}`;
  console.log(`${lean}${sh ? '+盾' : '無盾'} n=${n}｜rc12d：${f(c.old)}｜rc12f：${f(c.neu)}`);
}
