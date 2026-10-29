/** rc12af item 4 診斷（自訂，僅 sim）: 面板 lo/hi vs 實際受傷。 Usage: SC=blade npx tsx scripts/rc12af-estprobe.ts [seeds] */
import { readFileSync } from 'node:fs';
import { presetPlayer, type Preset } from '../src/core/preset';
import { autoRun, FIGHT_CTX, TURN_HOOK9, ACT_HOOK12AF, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES } from '../src/core/run';
import { roundRange12ad, actHits12ae, chargeEstimate, hitCap9, budget9, ACT9, worstHit, nextRoundEstimate, roundEstimate, type BattleState } from '../src/core/battle';
RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
const E = process.env, K = Number(process.argv[2] ?? 32);
const pool = makePool(JSON.parse(readFileSync(new URL('../public/data/monsters.json', import.meta.url), 'utf8')) as MonsterRow[]);
const P0 = presetPlayer((JSON.parse(readFileSync(new URL('../public/data/cp6-presets.json', import.meta.url), 'utf8')) as Record<string, Preset>)[`postF20-${E.SC}`]!);
let pre: { lo: number; hi: number; hp: number; alive: number; stun: number; snap: string } | null = null;
const cnt: Record<string, number> = {}; const ex: Record<string, string[]> = {}; let n = 0;
const add = (k: string, s: string) => { cnt[k] = (cnt[k] ?? 0) + 1; (ex[k] ??= []).length < 3 && ex[k]!.push(s); };
TURN_HOOK9.fn = (b) => { const r = roundRange12ad(b); if (!r) { pre = null; return; } pre = { lo: r.lo, hi: r.hi, hp: b.hp, alive: b.monsters.filter((m) => m.hp > 0).length, stun: b.monsters.filter((m) => m.hp > 0 && m.status.stun > 0).length, snap: JSON.stringify({ hc: b.monsters.map((m) => m.hp > 0 ? hitCap9(b, m, 1, false) : 0), bud: [budget9(b, false), budget9(b, true), ACT9.taken], ah: actHits12ae(b, false, true), ce: b.monsters.map((m) => m.hp > 0 ? Math.round(chargeEstimate(b, m, false, true)) : 0), wh: b.monsters.map((m) => m.hp > 0 ? Math.round(worstHit(b, m)) : 0), nre: nextRoundEstimate(b, true, false), re: roundEstimate(b, true, false), mit: [b.d.physMit, b.d.magMit], hpMax: b.d.hp, ms: b.monsters.map((m) => ({ r: m.rank, hp: m.hp, adb: m.adb, en: m.enraged, ch: m.charge, st: m.status.stun, hn: (m as {heavyNext?: boolean}).heavyNext })) }) }; };
ACT_HOOK12AF.fn = (b, ev) => {
  if (!pre) return; const p = pre; pre = null; n++;
  const hits = ev.filter((e) => e.t === 'hit' && e.to === 'player') as Array<{ dmg: number; avoided: unknown; from: unknown; label?: string; crits: number }>;
  const taken = hits.reduce((t, e) => t + e.dmg, 0) + ev.filter((e) => e.t === 'pdot').reduce((t, e) => t + (e as { dmg: number }).dmg, 0) + ev.filter((e) => (e as { t: string }).t === 'reflect' || (e as { t: string }).t === 'thorn').reduce((t, e) => t + ((e as { dmg?: number }).dmg ?? 0), 0);
  const av = hits.some((e) => e.avoided);
  const kills = p.alive - b.monsters.filter((m) => m.hp > 0).length;
  const types = [...new Set(ev.map((e) => e.t))].join(',');
  const tag = `${FIGHT_CTX.type}`;
  if (taken < p.lo && !av && b.hp > 0 && !b.over) add(`LO:${tag}:${kills > 0 ? 'kill' : 'nokill'}:${ev.some((e) => e.t === "status" && String((e as {text?: string}).text).includes("暈眩")) ? "stun" : ""}${ev.some((e) => e.t === "charge") ? "chg" : ""}:${hits.length === 0 ? 'nohit' : 'hit'}`, `F${FIGHT_CTX.depth} t${b.turn} lo${p.lo} act${taken} hits=${hits.map((h) => h.dmg + (h.label ?? '')).join('/')} ev=${types}`);
  if (taken > p.hi) add(`HI:${tag}:${kills > 0 ? "kill" : "nokill"}:${hits.some((h) => h.crits) ? "crit" : "nocrit"}`, `F${FIGHT_CTX.depth} t${b.turn} hi${p.hi} act${taken} hits=${hits.map((h) => `${h.from}:${h.dmg}${h.label ?? ''}c${h.crits}`).join('/')} ev=${types}`);
  if (taken > p.hi && E.DUMP) console.log('DUMP', p.snap, '\n AFTER', JSON.stringify({ mit: [b.d.physMit, b.d.magMit], hpMax: b.d.hp, ms: b.monsters.map((m) => ({ hp: m.hp, adb: m.adb, en: m.enraged, ch: m.charge })) }), '\n EV', JSON.stringify(ev.filter((e) => e.t !== 'msg')).slice(0, 1500));
};
for (let s = 1; s <= K; s++) { const p = structuredClone(P0); p.potions.health += Number(E.SIM_BUYPOT); autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? E.SC}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 }); }
console.log(`PROBE ${E.SC} rounds=${n}`, JSON.stringify(cnt)); for (const [k, v] of Object.entries(ex)) console.log(k, '\n  ' + v.join('\n  '));
