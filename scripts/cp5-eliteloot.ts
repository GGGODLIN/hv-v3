/** CP5 r3: average loot value per elite fight — old (elite + normal) vs solo (+extra roll). Sim only. */
import { readFileSync } from 'node:fs';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer } from '../src/core/player';
import { RULES, battleLoot, encounter, startRun } from '../src/core/run';
import { CP5 } from '../src/core/cp5';
import { sellPrice } from '../src/core/items';
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
RULES.cp5Bosses = true;
const N = Number(process.argv[2] ?? 2000);
const POT = 10; // 暫定: potion counted as 10C for the comparison only
function measure(solo: number, extra: number, floors: number[]) {
  CP5.eliteSolo = solo; CP5.eliteExtraRoll = extra;
  let v = 0, eq = 0, exp = 0, c = 0, n = 0;
  for (let s = 1; s <= N; s++) for (const f of floors) {
    const r = startRun(newPlayer(), s * 7919 + f); r.floor = f; r.weakNext = false; r.foundEquip = true;
    const ms = encounter(r, pool, 'elite');
    const l = battleLoot(r, ms, 'elite');
    const pots = Object.values(l.potions).reduce((a, b) => a + (b ?? 0), 0);
    const ev = l.equips.reduce((a, e) => a + sellPrice(e), 0);
    v += ev + l.credits + pots * POT; eq += l.equips.length; exp += l.exp; c += l.credits; n++;
  }
  return `價值 ${(v / n).toFixed(1)} | 裝備 ${(eq / n).toFixed(3)} 件 | Credits ${(c / n).toFixed(1)} | EXP ${(exp / n).toFixed(0)}`;
}
for (const [zh, fl] of [['F1-20', Array.from({ length: 20 }, (_, i) => i + 1).filter((f) => f % 5)], ['F6-9', [6, 7, 8, 9]]] as [string, number[]][]) {
  console.log(`== ${zh} (N=${N}/層, 藥水=${POT}C)`);
  console.log(`舊：精英+普通怪 | ${measure(0, 0, fl)}`);
  console.log(`單獨，無補償   | ${measure(1, 0, fl)}`);
  console.log(`單獨+多擲一次  | ${measure(1, 1, fl)}`);
}
