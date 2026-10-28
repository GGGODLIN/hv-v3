/** rc12d bulwark（僅驗證）: QA bw1–bw4 snapshots → rc12d openOffer/offerStar. Share of ★ on A-series (arcane) vs W-series, and unfit share.
 *  Usage: CROSS_RUNS=bw1=id,... npx tsx scripts/rc12d-bw-offer.ts <F> dump... */
import { readFileSync } from 'node:fs';
import { buffFit, offerStar, openOffer } from '../src/core/buffoffer';
import { RULES, type RunState } from '../src/core/run';
import type { Player } from '../src/core/player';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const [F, ...files] = process.argv.slice(2); const RUNS = Object.fromEntries(process.env.CROSS_RUNS!.split(',').map((x) => x.split('=') as [string, string]));
for (const f of files) { const d = JSON.parse(readFileSync(f, 'utf8')) as Record<string, string>;
  for (const [b, id] of Object.entries(RUNS)) { const v = d[`hv-v3-qa-snap:${id}:F${F}`]; if (!v) continue;
    const s = JSON.parse(v) as { player: Player; run: RunState }; const c: Record<string, number> = {}; let n = 0, unfit = 0, opts = 0;
    for (let seed = 1; seed <= 300; seed++) { const run = structuredClone(s.run) as RunState & { seed?: number }; run.rng = (seed * 2654435761) >>> 0;
      const ids = openOffer(s.player, run, 'shrine'); if (!ids.length) continue; n++; opts += ids.length; unfit += ids.filter((i) => !buffFit(s.player, i).ok).length;
      const st = offerStar(s.player, ids); const k = st ? st[0]! : 'none'; c[k] = (c[k] ?? 0) + 1; }
    console.log(JSON.stringify({ b, F: Number(F), lean: s.player.lean, held: s.run.buffs, offers: n, star: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, +(v / n).toFixed(2)])), unfitShare: +(unfit / opts).toFixed(2), fitA1: buffFit(s.player, 'A1') }));
  } }
