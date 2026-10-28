// rc12q bug fix（QA rc12p bl2 F50 t9）: ★/UI 「下回合全體暴擊估計 278 < HP 350」 → attacked → took 419 (minion 蓄力一擊 208 + boss) and died with 8 potions.
// Root cause: the estimate read the per-act burst budget (budget9/def9) from ACT9, which still held the PREVIOUS act's damage (t8 took 293),
// and the boss hit used the plain budget even while a minion was winding up. The estimate must not depend on what the last act took.
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { App } from '../src/game/app';
import { newPlayer } from '../src/core/player';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { RULES, startAbyss } from '../src/core/run';
import { act, nextRoundEstimate, chargeEstimate, primaryKey, type BattleState } from '../src/core/battle';
import { Rng } from '../src/core/rng';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const noop = () => undefined;
const stage = new Proxy({ speed: 1 }, { get: (t: any, k) => (k in t ? t[k] : k === 'lootBeams' ? async () => undefined : noop) });
const mem: Record<string, string> = {};
(globalThis as any).localStorage ??= { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = String(v); }, removeItem: (k: string) => { delete mem[k]; } };
async function bossAt(depth: number, seed: number): Promise<BattleState> {
  const p = newPlayer(); const run = startAbyss(p, seed, depth) as any; run.tower.floors[run.floor - 1] = { n: run.floor, options: ['boss'] };
  const a = Object.create(App.prototype) as any;
  Object.assign(a, { data: { player: p, run, settings: { skipAnim: true } }, notice: [], pending: {}, stage, pool, root: { querySelectorAll: () => [] }, recent: [], log: [] });
  a.go = noop; a.render = noop; a.save = noop; await a.enterNode(0); return a.battle as BattleState;
}
describe('rc12q next-round estimate', () => {
  let o: boolean[] = [];
  beforeAll(() => { o = [RULES.cp7, RULES.cp8]; RULES.cp7 = true; RULES.cp8 = true; });
  afterAll(() => { RULES.cp7 = o[0]!; RULES.cp8 = o[1]!; });
  it('F50 boss + charging minion: estimate is the same before and after an act that took damage (QA bl2 t8→t9)', async () => {
    let checked = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const b = await bossAt(50, seed); const minion = b.monsters.find((m) => m.rank !== 'boss'); if (!minion) continue;
      b.d.hp = 844; b.hp = 350; (minion as any).heavyNext = true; b.potions.health = 8; b.itemCd.health = 1;
      const snap = structuredClone(b); const e0 = nextRoundEstimate(b, true, false), c0 = b.monsters.map((m) => chargeEstimate(b, m, false, true));
      // a previous act that lands damage (like QA t8: took 293) — then put the battle back exactly as it was
      const big = structuredClone(b); big.hp = big.d.hp = 1e7; for (const m of big.monsters) m.status.stun = 0;
      act(big, { kind: 'defend' }, new Rng(9)); expect(big.hp).toBeLessThan(1e7);
      Object.assign(b, structuredClone(snap));
      expect(nextRoundEstimate(b, true, false)).toBe(e0);
      expect(b.monsters.map((m) => chargeEstimate(b, m, false, true))).toEqual(c0);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
  it('a minion wind-up opens the boss-fight burst budget for the boss hit too (same test as the real act)', async () => {
    const b = await bossAt(50, 2); const minion = b.monsters.find((m) => m.rank !== 'boss'), boss = b.monsters.find((m) => m.rank === 'boss')!;
    if (!minion) return; b.hp = b.d.hp;
    const plain = chargeEstimate(b, boss, false, true); (minion as any).heavyNext = true; const withTele = chargeEstimate(b, boss, false, true);
    expect(withTele).toBeGreaterThanOrEqual(plain);
  });
  it('★ does not attack into a next round it cannot survive when a potion or defend is available', async () => {
    let n3 = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const b = await bossAt(50, seed); const minion = b.monsters.find((m) => m.rank !== 'boss'); if (!minion) continue;
      b.hp = Math.floor(b.d.hp * 0.41); (minion as any).heavyNext = true; b.potions.health = 8; b.itemCd.health = 0;
      if (nextRoundEstimate(b, true, false) < b.hp) continue;
      n3++; expect(primaryKey(b, 0).action.kind).not.toBe("attack");
    }
    expect(n3).toBeGreaterThan(0);
  });
});
