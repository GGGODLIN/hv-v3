// @ts-nocheck — rc16 item 5 diag (sim only): why the skill hint (suggestSkill) lights or not, per school preset. Usage: SC=bulwark npx tsx scripts/rc16-skillhint-diag.ts [N=48]
import { readFileSync } from 'node:fs';
process.env.SIM_ROUTE ??= 'battle'; process.env.SIM_AI ??= 'naive';
const { autoRun } = await import('../src/core/auto');
const { SKILL_HINT_STATS: H, SKILL_HINT_EDGE } = await import('../src/core/battle');
const { makePool } = await import('../src/core/monsters');
const { RULES } = await import('../src/core/run');
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp8 = true;
const sc = process.env.SC ?? 'bulwark', N = Number(process.argv[2] ?? 48);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')));
const pre = JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8'));
H.on = true;
for (let s = 1; s <= N; s++) autoRun(JSON.parse(JSON.stringify(pre[`postF20-${sc}`].player)), pool, 777000 + s * 10, `buff:${sc}`, { mode: 'counter', retreat: 0.3, abyss: 1, cap: 100, ms: 0 });
const r = [...H.ratios].sort((a, b) => a - b), q = (f) => r.length ? r[Math.floor((r.length - 1) * f)].toFixed(2) : '-';
console.log(`${sc}: turns ${H.calls} lit ${H.lit} (${(H.lit / H.calls * 100).toFixed(1)}%) noOC ${H.noOc} (${(H.noOc / H.calls * 100).toFixed(1)}%) usable-but-below-edge ${H.belowEdge} other(cd/lock/no kit) ${H.other}; best-skill/A ratio p50 ${q(0.5)} p90 ${q(0.9)} max ${q(1)} (edge ${1 + SKILL_HINT_EDGE})`);
