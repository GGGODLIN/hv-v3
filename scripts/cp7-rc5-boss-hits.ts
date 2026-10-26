/** cp7-rc5 bug 3 probe: per-hit boss damage at abyss d20 / d23 boss fights from a debug preset (default abyss20).
 * Env: PRESET=<cp6-presets key> SC=<school strategy> CP7=0|1 (default 1). Usage: npx tsx scripts/cp7-rc5-boss-hits.ts [N=128] */
import { readFileSync } from 'node:fs';
import { decide, profsOf, type Strategy } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import type { Player } from '../src/core/player';
import { RULES, armBattle, battleLocks, encounter, openingOc, runDerived, startAbyss } from '../src/core/run';
import { act, armCp5, startBattle } from '../src/core/battle';
import { Rng } from '../src/core/rng';
const E = process.env;
RULES.cp6Abyss = RULES.cp5Bosses = RULES.cp4RunBuffs = true; RULES.cp7 = E.CP7 !== '0';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const pr = JSON.parse(readFileSync('public/data/cp6-presets.json', 'utf8'))[E.PRESET ?? 'abyss20'];
const strat = `buff:${E.SC ?? pr.school}` as Strategy; const N = Number(process.argv[2] ?? 128);
console.log(`preset ${E.PRESET ?? 'abyss20'} school ${E.SC ?? pr.school} Lv${pr.level} cp7=${RULES.cp7}`);
for (const depth of [20, 23]) {
  let maxHit = 0, maxTurn = 0, maxHitPct = 0, ge80 = 0, hits = 0, deadT1 = 0, deadBeforeAct = 0, wins = 0, hp0 = 0, oneShot = 0;
  const lab: Record<string, number> = {}; const t1: number[] = [];
  for (let s = 1; s <= N; s++) {
    const p: Player = JSON.parse(JSON.stringify(pr.player)); const run = startAbyss(p, s, depth);
    run.tower.floors[0]!.options = ['boss'];
    const ms = encounter(run, pool, 'boss');
    const b = startBattle(runDerived(p, run), { hp: run.hp, mp: run.mp, sp: run.sp }, ms, p.potions);
    b.locked = battleLocks(p); armBattle(b, run); b.oc += openingOc(p, 'boss', run); armCp5(b, run.pdot);
    if (E.HP0) b.hp = Math.min(b.d.hp, Number(E.HP0)); hp0 = b.d.hp; const rng = new Rng(s * 31 + 7); const profs = profsOf(p); let turn = 0; let mph = 0;
    if (b.hp <= 0) deadBeforeAct++;
    while (!b.over && b.turn < 400) {
      const start = b.hp; const turn0 = b.turn; const ev = act(b, decide(b, strat, 'counter'), rng, profs);
      let tot = 0;
      for (const e of ev) if (e.t === 'hit' && e.to === 'player') { hits++; tot += e.dmg; if (e.dmg > maxHit) maxHit = e.dmg; const pc = e.dmg / b.d.hp; if (pc > maxHitPct) maxHitPct = pc; if (pc >= 0.8) { ge80++; lab[e.label ?? '普攻'] = (lab[e.label ?? '普攻'] ?? 0) + 1; } if (e.dmg >= start && start >= b.d.hp * 0.99) oneShot++; }
      const monTurn = ev.some((e) => e.t === 'hit' && e.to === 'player') || b.turn > turn0;
      if (monTurn && mph === 0) { mph = 1; t1.push(start - b.hp); if (b.over === 'lose') deadT1++; }
      if (tot > maxTurn) maxTurn = tot; turn++;
    }
    if (b.over === 'win') wins++;
  }
  t1.sort((a, b) => a - b); const q = (x: number) => t1[Math.min(t1.length - 1, Math.floor(x * t1.length))];
  console.log(`d${depth} boss N=${N} maxHP=${hp0} win=${wins} | 單擊最大=${maxHit} (${(maxHitPct * 100).toFixed(1)}% maxHP) ≥80%擊數=${ge80}/${hits} ${JSON.stringify(lab)} | 單回合最大=${maxTurn} | 首個怪物回合淨失血 p50=${q(0.5)} p90=${q(0.9)} max=${t1[t1.length - 1]} | 首個怪物回合死亡=${deadT1} 行動前死亡=${deadBeforeAct} 滿血一擊死=${oneShot}`);
}
