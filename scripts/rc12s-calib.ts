/** rc12s calibration（自訂 diag）: QA real snapshots (derive) vs full-run sim boss-start stats by depth. Usage: npx tsx scripts/rc12s-calib.ts snaps.json [seeds=32] */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { FIGHT_RUN_HOOK,  autoRun, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, depthOf, runDerived, type RunState } from '../src/core/run';
import { derive, powerScore, type Player } from '../src/core/player';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
for (const [k, v] of Object.entries({ SIM_ROUTE: 'hint', SIM_BUFFSTAR: '1', SIM_POLICY: 'primary', SIM_NOPREP: '1', SIM_BUYPOT: '10', SIM_MERCHTHR: '7' })) process.env[k] ??= v;
const [sf, K0] = process.argv.slice(2); const K = Number(K0 ?? 32);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const presets = JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>;
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1]! : NaN; };
const OWN: Record<string, string> = { blade: 'B', bulwark: 'W', oc: 'O', arcane: 'A' };
const D = [5, 20, 30, 40, 50, 60, 70, 80];
const row = (p: Player, r?: RunState) => { const d = r ? runDerived(p, r) as ReturnType<typeof derive> : derive(p); return { lv: d.level, hp: d.hp, pw: powerScore(d), pot: p.potions.health, mh: (p.equipped as Record<string, { rarity?: string; name?: string } | undefined>).mainHand?.rarity ?? '-' }; };
const snaps = JSON.parse(readFileSync(sf!, 'utf8')) as Record<string, Record<string, { p: Player; r: RunState }>>;
const real: Record<string, Record<number, ReturnType<typeof row>[]>> = {};
for (const [r, v] of Object.entries(snaps)) { if (r < '20261028194156') continue; const lean = Object.values(v)[0]!.p.lean!;
  for (const [f, x] of Object.entries(v)) if (D.includes(+f)) ((real[lean] ??= {})[+f] ??= []).push({ ...row(x.p, x.r), pot: x.r ? x.p.potions.health : x.p.potions.health, nb: x.r.buffs?.length ?? 0, el: x.r.eliteWins ?? 0, own: (x.r.buffs ?? []).filter((y: string) => y[0] === OWN[lean]).length, up: x.r.upg ?? 0 } as never); }
const pre: Record<string, unknown> = {};
for (const sc of ['blade', 'bulwark', 'oc', 'arcane']) {
  const P = presetPlayer(presets[`postF20-${sc}`]!); pre[sc] = row(P);
    const sim: Record<number, Record<string, number>[]> = {}; let seen = new Set<number>();
  FIGHT_RUN_HOOK.fn = (p, r, type) => { const f = depthOf(r) || r.floor; if (type !== 'boss' || !D.includes(f) || seen.has(f)) return; seen.add(f); (sim[f] ??= []).push({ ...row(p, r), nb: r.buffs?.length ?? 0, el: r.eliteWins ?? 0, up: r.upg ?? 0, own: (r.buffs ?? []).filter((x) => x[0] === OWN[sc]).length } as never); };
  for (let s = 1; s <= K; s++) { seen = new Set(); const p = structuredClone(P); p.potions.health += 10; autoRun(p, pool, s * 1000 + 101, `buff:${sc}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); }
  FIGHT_RUN_HOOK.fn = null;
  console.log(`== ${sc} preset`, JSON.stringify(pre[sc]));
  for (const f of D) { const R = real[sc]?.[f] ?? [], S = sim[f] ?? [];
    const m = (a: { [k: string]: unknown }[], k: string) => med(a.map((x) => x[k] as number));
    console.log(`F${f} real n${R.length} lv ${m(R, 'lv')} hp ${m(R, 'hp')} pw ${m(R, 'pw')} pot ${m(R, 'pot')} nb ${m(R, 'nb')} el ${m(R, 'el')} up ${m(R, 'up')} own ${m(R, 'own')} | sim n${S.length} lv ${m(S, 'lv')} hp ${m(S, 'hp')} pw ${m(S, 'pw')} pot ${m(S, 'pot')} nb ${m(S, 'nb')} el ${m(S, 'el')} up ${m(S, 'up')} own ${m(S, 'own')}`); }
}
