// @ts-nocheck — diag script (loose FIGHT_LOG rows)
/** rc15 arcane playtest-vs-sim diag (sim only, no values changed): trip-1 abyss trips from the postF20-arcane preset (what QA loads),
 * per-fight log (auto.ts FIGHT_LOG, DBGFIGHT=1): turns, HP taken, potions, MP-starved turns, spell mix, boss results by depth band.
 * Env passes through (SIM_AI=naive, SIM_ARC_*, SIM_POTHINT …). Usage: SC=arcane npx tsx scripts/rc15-arcane-diag.ts [N=128] [CAP=60] */
import { readFileSync } from 'node:fs';
process.env.DBGFIGHT = '1'; process.env.SIM_ROUTE ??= 'battle'; process.env.SIM_AI ??= 'naive';
const { autoRun, FIGHT_LOG } = await import('../src/core/auto');
const { makePool } = await import('../src/core/monsters');
const { RULES } = await import('../src/core/run');
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp8 = true;
const sc = process.env.SC ?? 'arcane', N = Number(process.argv[2] ?? 128), CAP = Number(process.argv[3] ?? 60);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')));
const pre = JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8'));
const reached: number[] = []; const why: Record<string, number> = {};
for (let s = 1; s <= N; s++) {
  const p = JSON.parse(JSON.stringify(pre[`postF20-${sc}`].player));
  const r = autoRun(p, pool, 777000 + s * 10, `buff:${sc}` as never, { mode: 'counter', retreat: 0.3, abyss: 1, cap: CAP, ms: 0 });
  const d = r.abyss!.cleared + (r.settlement.outcome === 'dead' ? 1 : 0); reached.push(d); const k = r.settlement.outcome === 'dead' ? `dead@${Math.ceil(d / 5) * 5}${d % 5 === 0 ? 'boss' : ''}` : String(r.settlement.outcome); why[k] = (why[k] ?? 0) + 1;
}
const q = (a: number[], f = 0.5) => { const x = [...a].sort((u, v) => u - v); return x.length ? x[Math.floor((x.length - 1) * f)]! : NaN; };
const L = FIGHT_LOG as Record<string, number & string>[];
console.log(`${sc} ${Object.entries(process.env).filter(([k]) => k.startsWith('SIM_')).map(([k, v]) => `${k}=${v}`).join(' ')} N=${N} cap ${CAP}: median ${q(reached)} p25 ${q(reached, 0.25)} p75 ${q(reached, 0.75)}`);
console.log('  ends:', JSON.stringify(Object.fromEntries(Object.entries(why).sort((a, b) => b[1] - a[1]).slice(0, 12))));
const p0 = L[0]; if (p0) console.log(`  char: maxHp ${p0.maxHp} maxMp ${p0.maxMp}`);
for (const [lo, hi] of [[1, 9], [10, 10], [11, 19], [20, 20], [21, 29], [30, 30], [31, 39], [40, 40]]) {
  for (const ty of ['battle', 'elite', 'boss']) {
    const f = L.filter((x) => x.depth >= lo && x.depth <= hi && x.type === ty); if (!f.length) continue;
    const sum = (k: string) => f.reduce((a, x) => a + (Number(x[k]) || 0), 0); const act = sum('attack') + sum('spell') + sum('item') + sum('defend') + sum('spirit') + Object.keys(f[0]!).filter((k) => k.startsWith('sk:')).reduce((a, k) => a + sum(k), 0);
    const spells = [...new Set(f.flatMap((x) => Object.keys(x).filter((k) => k.startsWith('sp:'))))].map((k) => `${k.slice(3)} ${(sum(k) / Math.max(1, sum('spell'))).toFixed(2)}`).join(',');
    console.log(`  d${lo}-${hi} ${ty} n${f.length} win ${(f.filter((x) => x.won).length / f.length * 100).toFixed(1)}% turns ${q(f.map((x) => x.turns))} HP taken/fight ${(sum('taken') / f.reduce((a, x) => a + x.maxHp, 0)).toFixed(2)}×max maxHit p90 ${q(f.map((x) => x.maxHit || 0), 0.9).toFixed(2)} pots/fight ${(sum('it:health') / f.length).toFixed(2)} melee(MP-starved) ${(sum('mpStarved') / Math.max(1, act)).toFixed(2)} spells ${(sum('spell') / Math.max(1, act)).toFixed(2)} [${spells}] mpEnd p50 ${q(f.map((x) => x.mpEnd))}`);
  }
}
