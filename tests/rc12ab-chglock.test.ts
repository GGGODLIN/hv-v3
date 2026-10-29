// rc12ab 1/2（自訂）: 每場共用蓄力鎖 + 一般/精英戰每回合蓄力預算 40% + 精英戰小怪蓄力上限 = 一般戰上限。
// QA rc12aa bl1 F53：兩隻怪交替蓄力，連續回合吃 25–30% 蓄力而死。
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, derive } from '../src/core/player';
import { encounter, startRun, RULES } from '../src/core/run';
import { CP9, RUN12AB, RUN12AC } from '../src/core/cp8';
import { act, startBattle, hitCap9, type BattleState } from '../src/core/battle';
import { autoRun, TURN_HOOK9, starterKit, type Strategy } from '../src/core/auto';
import { presetPlayer, type Preset } from '../src/core/preset';
import { Rng } from '../src/core/rng';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const CHG = /蓄力一擊|重擊|脈衝/;
type H = { from: unknown; to: unknown; dmg: number; label?: string; t: string };
function fight(n: number, elite: boolean, seed: number) {
  const p = newPlayer(); starterKit(p); const d = derive(p); const r = startRun(p, seed); r.floor = 60;
  const ms = Array.from({ length: n }, (_, k) => { const m = encounter(r, pool, 'battle')[0]!; m.hp = m.maxHp = 1e7; m.adb = d.hp * (0.8 + 0.3 * k); m.rank = (elite && k === 0 ? 'elite' : 'normal') as never; return m; });
  return { b: startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, ms, { health: 0, mana: 0, spirit: 0 }), d };
}
describe('rc12ab: shared charge lock & budget', () => {
  it('defaults（自訂）', () => { expect(RUN12AB.chgLock).toBe(1); expect(RUN12AB.chgBudget).toBe(0.4); expect(RUN12AB.eliteMinion).toBe(1); });
  for (const elite of [false, true]) it(`${elite ? 'elite' : 'normal'} fight, 2–3 big monsters ×40 seeds: ≤1 charged hit per round, never 3 rounds in a row, round charged dmg ≤ 40%`, () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      let maxRun = 0, maxPer = 0, maxDmg = 0, total = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const { b, d } = fight(2 + (seed % 2), elite, seed); const rng = new Rng(seed); let run = 0;
        for (let t = 0; t < 40 && !b.over; t++) {
          const ev = act(b, t % 4 === 3 ? { kind: 'defend' } : { kind: 'attack', target: 0 } as never, rng) as H[];
          const ch = ev.filter((e) => e.t === 'hit' && e.to === 'player' && CHG.test(e.label ?? ''));
          total += ch.length; maxPer = Math.max(maxPer, ch.length); maxDmg = Math.max(maxDmg, ch.reduce((a, e) => a + e.dmg, 0) / d.hp);
          run = ch.length ? run + 1 : 0; maxRun = Math.max(maxRun, run); b.hp = b.d.hp;
        }
      }
      expect(total).toBeGreaterThan(40);
      expect(maxPer).toBe(1); expect(maxRun).toBeLessThanOrEqual(2); expect(maxDmg).toBeLessThanOrEqual(0.4 + 1e-9);
    } finally { RULES.cp8 = o; }
  });
  it('item 2: elite fight — minion charged cap = normal cap (rc12ac 25%（自訂）, arcane chg12aa 20%), elite body 40%', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      const { b, d } = fight(2, true, 7); const [e, m] = b.monsters as [never, never];
      expect(hitCap9(b, e, 2, true)).toBe(Math.floor(CP9.minionCharge * d.hp));
      expect(hitCap9(b, m, 2, true)).toBe(Math.floor(RUN12AC.minion * d.hp)); // rc12ac 1（自訂）
      (m as { chg12aa?: number }).chg12aa = 0.2; expect(hitCap9(b, m, 2, true)).toBe(Math.floor(0.2 * d.hp));
    } finally { RULES.cp8 = o; }
  });
  it('locked monster that wanted to wind up hits ≤ heldHit (no unannounced big hit)', () => {
    const o = RULES.cp8; RULES.cp8 = true;
    try {
      let worstPlain = 0;
      for (let seed = 1; seed <= 20; seed++) { const { b, d } = fight(2, false, seed); const rng = new Rng(seed);
        for (let t = 0; t < 30 && !b.over; t++) { const ev = act(b, { kind: 'attack', target: 0 } as never, rng) as H[];
          for (const h of ev) if (h.t === 'hit' && h.to === 'player' && !h.label) worstPlain = Math.max(worstPlain, h.dmg / d.hp); b.hp = b.d.hp; } }
      expect(worstPlain).toBeLessThanOrEqual(RUN12AB.heldHit + 1e-9);
    } finally { RULES.cp8 = o; }
  });
  it('sim (all schools ×6 seeds): no death after ≥3 consecutive rounds of charged hits', () => {
    const R0 = { ...RULES }; RULES.cp6Abyss = true; RULES.cp5Bosses = true; RULES.cp4RunBuffs = true; RULES.cp7 = true; RULES.cp8 = true;
    const presets = JSON.parse(readFileSync('public/data/cp6-presets.json', 'utf8')) as Record<string, Preset>;
    const seen = new Set<BattleState>(); const prev = TURN_HOOK9.fn;
    try {
      TURN_HOOK9.fn = (b) => { seen.add(b); };
      for (const sc of ['blade', 'bulwark', 'oc', 'arcane']) for (let s = 1; s <= 6; s++) {
        const p = presetPlayer(presets[`postF20-${sc}`]!); p.potions.health += 10;
        autoRun(p, pool, s * 1000 + 101, `buff:${p.lean ?? sc}` as Strategy, { mode: 'counter', retreat: 0, abyss: 1, cap: 100, ms: 0 });
      }
    } finally { TURN_HOOK9.fn = prev; Object.assign(RULES, R0); }
    const lost = [...seen].filter((b) => b.over === 'lose');
    expect(seen.size).toBeGreaterThan(100); expect(lost.length).toBeGreaterThan(0);
    expect(lost.filter((b) => (b.chgRunMax12ab ?? 0) >= 3).length).toBe(0);
  });
});
