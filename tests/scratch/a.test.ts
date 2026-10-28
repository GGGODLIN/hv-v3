import { it } from 'vitest';
import { defendEst9, act, startBattle } from '../../src/core/battle';
import { starterKit } from '../../src/core/auto';
import { buildMonster, makePool, type MonsterRow } from '../../src/core/monsters';
import { derive, newPlayer } from '../../src/core/player';
import { RULES } from '../../src/core/run';
import { Rng } from '../../src/core/rng';
import { readFileSync } from 'node:fs';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
const L: string[] = [];
it('a', () => {
  RULES.cp8 = true;
  for (const kind of ['heavy', 'charge', 'pulse', 'drain']) for (let r = 0; r < 6; r++) {
    const p = newPlayer(); starterKit(p); const d = derive(p);
    const boss = buildMonster(pool.rows[r]!, 40, 'boss'); boss.hp = boss.maxHp = 1e6; boss.adb = d.hp * 1.5;
    const b = startBattle(d, { hp: d.hp, mp: d.mp, sp: d.sp }, [boss], { health: 0, mana: 0, spirit: 0 });
    const B = boss as any; if (kind === 'heavy') B.heavyNext = true; if (kind === 'charge') boss.charge = 1; if (kind === 'pulse') B.pulseNext = true; if (kind === 'drain') { B.drainNext = true; boss.charge = 1; }
    const e = defendEst9(b)!; const h0 = b.hp; const ev = act(b, { kind: 'defend' }, new Rng(r));
    L.push([kind, r, 'maxHp', d.hp, 'est', e, 'took', h0 - b.hp, JSON.stringify((ev as any[]).filter((x) => x.t === 'hit' || x.t === 'sig' || x.t==='status').map((x) => [x.t, x.dmg, x.label, x.text])).slice(0, 200)].join(' '));
  }
  require('node:fs').writeFileSync('/tmp/a.out', L.join('\n'));
});
