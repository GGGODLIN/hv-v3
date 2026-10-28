import { it } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { defendEst9, act, startBattle } from '../../src/core/battle';
import { starterKit } from '../../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../../src/core/monsters';
import { derive, newPlayer } from '../../src/core/player';
import { RULES } from '../../src/core/run';
import { Rng } from '../../src/core/rng';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const L: string[] = []; let n = 0, bad = 0;
it('b', () => {
  RULES.cp8 = true;
  for (let seed = 1; seed <= 400; seed++) {
    const p = newPlayer(); starterKit(p); const d = derive(p); const rng = new Rng(seed);
    const boss = buildMonster(pool.rows[seed % pool.rows.length]!, 40, 'boss'); boss.adb = d.hp * (0.3 + (seed % 4) * 0.3);
    const mn = buildMonster(pool.rows[(seed * 7) % pool.rows.length]!, 40, 'normal'); mn.hp = mn.maxHp = 1e6; mn.adb = d.hp * (0.1 + (seed % 3) * 0.2);
    boss.hp = boss.maxHp = 1500; (boss as any).phases = 2; mn.hp = mn.maxHp = (seed % 2) ? 1e6 : 800;
    const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [boss, mn], { health: 0, mana: 0, spirit: 0 });
    for (let t = 0; t < 60 && !b.over; t++) {
      if (b.hp < d.hp * 0.3) b.hp = d.hp * (0.3 + rng.next() * 0.7) | 0;
      const D = rng.chance(0.5); const e = D ? defendEst9(b) : null; const h0 = b.hp;
      const ev = act(b, D ? { kind: 'defend' } : { kind: 'attack', target: 0 }, rng);
      if (D && e !== null) { n++; const took = h0 - b.hp; if (took > e) { bad++; if (L.length < 20) L.push(`seed ${seed} t ${t} hp0 ${h0} est ${e} took ${took} max ${d.hp} ${JSON.stringify((ev as any[]).filter((x) => ['hit','status','sig','charge','pdot'].includes(x.t))).slice(0, 400)}`); } }
    }
  }
  writeFileSync('/tmp/b.out', `n ${n} bad ${bad}\n` + L.join('\n'));
});
