// cp9-rc8（自訂，製作人定案）: post-hit charge lock 1 turn (revive lock 2), bulwarkDefCounter extra ×0.5 vs bosses, merchant 1 potion.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { act, startBattle } from '../src/core/battle';
import { starterKit } from '../src/core/auto';
import { CP9 } from '../src/core/cp8';
import { buildMonster, makePool, type MonsterRow } from '../src/core/monsters';
import { derive, newPlayer } from '../src/core/player';
import { RULES } from '../src/core/run';
import { Rng } from '../src/core/rng';

const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const withCp8 = (f: () => void) => { const o = RULES.cp8; RULES.cp8 = true; try { f(); } finally { RULES.cp8 = o; } };

describe('cp9-rc8', () => {
  it('knobs', () => { expect(CP9.windHitCd).toBe(1); expect(CP9.windCd).toBe(2); expect(CP9.bwdcBoss).toBe(0.5); });
  it('item 1: never two ≥50%-HP hits on consecutive turns (strong boss, many seeds)', () => withCp8(() => {
    let big = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const p = newPlayer(); starterKit(p);
      const d = derive(p);
      const m = buildMonster(pool.rows[seed % pool.rows.length]!, 1, 'boss'); m.hp = m.maxHp = 1e6; m.adb = d.hp * (0.2 + (seed % 7) * 0.15);
      const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [m], { health: 0, mana: 0, spirit: 0 });
      const rng = new Rng(seed); let prev = false;
      for (let t = 0; t < 60 && !b.over; t++) {
        b.hp = b.d.hp;
        const ev = act(b, seed % 2 ? { kind: 'attack', target: 0 } : { kind: 'defend' }, rng);
        const dmg = ev.filter(e => e.t === 'hit' && e.to === 'player').reduce((a, e) => a + ((e as { dmg?: number }).dmg ?? 0), 0);
        const now = dmg >= 0.5 * b.d.hp; if (now) big++;
        expect(prev && now).toBe(false); prev = now;
      }
    }
    expect(big).toBeGreaterThan(0); // the scenario does produce 50% hits
  }));
  it('item 1: revive still locks 2 turns', () => withCp8(() => {
    const src = readFileSync('src/core/battle.ts', 'utf8');
    expect(src).toMatch(/c\.windCd = CP9\.windRev \? CP9\.windCd : 0/); expect(src).toMatch(/m\.windCd = CP9\.windHitCd/);
  }));
});
