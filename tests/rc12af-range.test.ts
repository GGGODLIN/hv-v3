// rc12af item 4（自訂，非數值）: 「同回合全體約 lo–hi」 vs the real round.
// (b) QA rc12ae bl2 F45 T12: hi 353 < real 381 — hi used the rc22 mean-roll crit; a top-roll crit is up to ×1.2. hi now uses the top roll.
// (a) real < lo with no evade/block: the player's own act killed/stunned a monster, or a monster started a wind-up (0 damage) instead.
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { autoRun, ACT_HOOK12AF, FIGHT_CTX, TURN_HOOK9, type Strategy } from '../src/core/auto';
import { ADVICE_DIAG, roundRange12ad, roundEstimate } from '../src/core/battle';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { presetPlayer, type Preset } from '../src/core/preset';
import { RULES } from '../src/core/run';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const presets = JSON.parse(readFileSync('public/data/cp6-presets.json', 'utf8')) as Record<string, Preset>;
const keys = ['cp6Abyss', 'cp5Bosses', 'cp4RunBuffs', 'cp7', 'cp8'] as const;
describe('rc12af: round range panel vs real round', () => {
  let o: boolean[] = [];
  beforeAll(() => { o = keys.map((k) => RULES[k]); for (const k of keys) RULES[k] = true; });
  afterAll(() => { keys.forEach((k, i) => (RULES[k] = o[i]!)); TURN_HOOK9.fn = null; ACT_HOOK12AF.fn = null; });
  it('hi uses the top-roll crit; advice critRoll is untouched', () => {
    let seen = 0;
    TURN_HOOK9.fn = (b) => { const r = roundRange12ad(b); if (!r || seen > 50) return; seen++;
      const k = ADVICE_DIAG.critRoll; expect(r.hi).toBeGreaterThanOrEqual(Math.round(roundEstimate(b, true, false))); expect(ADVICE_DIAG.critRoll).toBe(k); };
    try { const p = presetPlayer(presets['postF20-arcane']!); autoRun(p, pool, 1101, 'buff:arcane' as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 30, ms: 0 }); } finally { TURN_HOOK9.fn = null; }
    expect(seen).toBeGreaterThan(5);
  }, 120000);
  it('sim sweep: real ≤ hi always; real < lo without evade/block only after a kill / status / wind-up', () => {
    const bad: string[] = []; let n = 0;
    let pre: { lo: number; hi: number } | null = null;
    TURN_HOOK9.fn = (b) => { pre = roundRange12ad(b); };
    ACT_HOOK12AF.fn = (b, ev) => {
      const p = pre; pre = null; if (!p || b.over) return; n++;
      const hits = ev.filter((e) => e.t === 'hit' && e.to === 'player') as Array<{ dmg: number; avoided: unknown }>;
      const taken = hits.reduce((t, e) => t + e.dmg, 0) + ev.filter((e) => e.t === 'pdot').reduce((t, e) => t + (e as { dmg: number }).dmg, 0);
      if (taken > p.hi) bad.push(`HI F${FIGHT_CTX.depth} t${b.turn} ${taken}>${p.hi}`);
      if (taken < p.lo && !hits.some((e) => e.avoided) && !ev.some((e) => e.t === 'death' || e.t === 'status' || e.t === 'charge')) bad.push(`LO F${FIGHT_CTX.depth} t${b.turn} ${taken}<${p.lo}`);
    };
    try {
      for (const sc of ['blade', 'arcane', 'bulwark']) for (let s = 1; s <= 6; s++) {
        const p = presetPlayer(presets[`postF20-${sc}`]!); p.potions.health += 10;
        autoRun(p, pool, s * 1000 + 101, `buff:${sc}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 70, ms: 0 });
      }
    } finally { TURN_HOOK9.fn = null; ACT_HOOK12AF.fn = null; }
    expect(n).toBeGreaterThan(100); expect(bad.slice(0, 10)).toEqual([]);
  }, 120000);
});
