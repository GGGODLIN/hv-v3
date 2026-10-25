import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { act, canUse, startBattle, type Action } from '../src/core/battle';
import { autoRun, starterKit } from '../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { Rng } from '../src/core/rng';
import { generateTower } from '../src/core/tower';
import { applyLoot, chestLoot, encounter, equipDropChance, merchantStock, rest, RULES, settle, shrine, startRun, advance } from '../src/core/run';
import { loadFrom, saveTo, SAVE_VERSION, type KV } from '../src/core/save';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);

describe('CP1 acceptance', () => {
  it('floor 1 always offers a battle; every floor has 2-3 options except boss floors', () => {
    for (let s = 1; s < 500; s++) {
      const t = generateTower(new Rng(s));
      expect(t.floors[0]!.options).toContain('battle');
      for (const f of t.floors) if (f.n !== 5 && f.n !== 10) { expect(f.options.length).toBeGreaterThanOrEqual(2); expect(f.options.length).toBeLessThanOrEqual(3); }
    }
  });
  it('every battle action kind is usable and resolves', () => {
    const p = newPlayer(); starterKit(p);
    const d = derive(p);
    const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [buildMonster(pool.rows[0]!, 1)], { health: 1, mana: 1, spirit: 1 });
    b.monsters[0]!.hp = b.monsters[0]!.maxHp = 1e9;
    const rng = new Rng(3);
    const acts: Action[] = [{ kind: 'attack', target: 0 }, { kind: 'spell', id: 'fiery', target: 0 }, { kind: 'item', id: 'health' }, { kind: 'spirit' }, { kind: 'skill', id: 'shieldBash', target: 0 }];
    for (const a of acts) {
      b.oc = 200; b.mp = d.mp; b.sp = d.sp; b.hp = d.hp;
      expect(canUse(b, a), a.kind).toBe(true);
      const ev = act(b, a, rng, {});
      expect(ev.some((e) => e.t === 'msg' && e.text === '無法使用')).toBe(false);
    }
  });
  it('all six non-boss node handlers run and settle', () => {
    const p = newPlayer(); starterKit(p);
    const run = startRun(p, 9);
    expect(encounter(run, pool, 'battle').length).toBeGreaterThan(0);
    expect(encounter(run, pool, 'elite').length).toBeGreaterThan(0);
    expect(encounter(run, pool, 'boss').length).toBeGreaterThan(0);
    applyLoot(p, run, chestLoot(run));
    expect(run.bag.length).toBeGreaterThan(0);
    expect(merchantStock(run)).toBeTruthy();
    expect(typeof rest(p, run, 'heal')).toBe('string');
    expect(typeof shrine(p, run, 'might')).toBe('string');
    advance(run, 0);
    expect(run.floor).toBe(2);
  });
  it('8x drop acceleration is applied', () => {
    expect(RULES.dropAccel).toBe(8);
    expect(equipDropChance(1000, 8)).toBeCloseTo(equipDropChance(1000, 1) * 8, 10);
  });
  it('a character can clear all 10 floors (bosses on 5 and 10) and keeps EXP and gear; save survives reload', () => {
    const p = newPlayer(); starterKit(p, 1);
    let cleared = false;
    for (let i = 1; i <= 30 && !cleared; i++) {
      const expBefore = p.exp;
      const r = autoRun(p, pool, 1000 + i);
      if (r.settlement.outcome === 'clear') { cleared = true; expect(p.exp).toBeGreaterThan(expBefore); }
    }
    expect(cleared).toBe(true);
    const m = new Map<string, string>();
    const kv: KV = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
    saveTo(kv, { v: SAVE_VERSION, player: p, run: null, settings: { speed: 1, skipAnim: false }, stats: { runs: 1, bestFloor: 10, clears: 1 } });
    expect(loadFrom(kv)!.player.exp).toBe(p.exp);
    void settle;
  });
});
