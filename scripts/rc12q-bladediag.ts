/** rc12q prep（自訂）: blade full-run per-run diagnosis — what separates F100 clears from early deaths. Same setup as rc12m-fullrun. Usage: [SC=blade] npx tsx scripts/rc12q-bladediag.ts [K=64] [cap=100] */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
RULES.cp6Abyss = RULES.cp5Bosses = RULES.cp4RunBuffs = RULES.cp7 = RULES.cp8 = true;
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: '1', SIM_BUYPOT: '10', SIM_MERCHTHR: '7' })) process.env[k] ??= v;
const CAP = Number(process.argv[3] ?? 100), SC = process.env.SC ?? 'blade', K = Number(process.argv[2] ?? 64);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${SC}`]!);
const rows: unknown[] = [];
for (let s = 1; s <= K; s++) { const p = structuredClone(P0); p.potions.health += 10;
  const r = autoRun(p, pool, s * 1000 + 101, `buff:${SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: CAP, ms: 0 });
  const cl = r.abyss!.cleared + (r.settlement.outcome === 'dead' ? 1 : 0);
  const bt = (lo: number, hi: number) => { const x = r.bosses.filter((b) => b.floor >= lo && b.floor <= hi); return x.length ? +(x.reduce((a, b) => a + b.turns, 0) / x.length).toFixed(1) : null; };
  rows.push({ s, cl, endType: r.end?.type, lvl: r.level, power: Math.round(r.power), elites: r.elites?.length ?? 0, elites50: r.elites?.filter((e) => e.floor <= 50).length ?? 0, rests: r.rests?.length ?? 0,
    buffs: r.cp4?.buffs ?? [], formed: r.cp4?.formed ?? [], b30_50: bt(30, 50), b55_70: bt(55, 70), bossPot30_50: r.bosses.filter((b) => b.floor >= 30 && b.floor <= 50).reduce((a, b) => a + b.potions, 0), upg: r.upg ?? 0, spiritB: r.spiritBattles, endPots: p.potions.health });
}
console.log(JSON.stringify(rows));
