/** cp7-rc5 bug 1 probe: bulwark main tower → retreat at F≥6, then a 優良 raccoon club in the bag. Prints 裝備欄 ▲ (absolute) vs wearGain. */
import { readFileSync } from 'node:fs';
import { autoRun, starterKit } from '../src/core/auto';
import { makePool, type MonsterRow } from '../src/core/monsters';
import { newPlayer, derive, equip, powerScore, level } from '../src/core/player';
import { RULES } from '../src/core/run';
import { generateEquip } from '../src/core/items';
import { wearGain, betterThanWorn } from '../src/core/cp7';
import { prepIssues } from '../src/core/prep';
import { Rng } from '../src/core/rng';
RULES.cp6Abyss = RULES.cp5Bosses = RULES.cp4RunBuffs = RULES.cp7 = true;
const pool = makePool(JSON.parse(readFileSync('public/data/monsters.json', 'utf8')) as MonsterRow[]);
for (let s = 1; s <= 6; s++) {
  const p = newPlayer(); starterKit(p, s);
  for (let i = 1; i <= 30; i++) { const r = autoRun(p, pool, s * 1000 + i, 'buff:bulwark', { mode: 'counter', retreat: 0.3 }); if (r.floorReached >= 6) break; }
  const rng = new Rng(s); const L = level(p) + 5;
  for (let k = 0; k < 400; k++) {
    const e = generateEquip(rng, L, { group: 'oneHand', base: 'club', slot: 'mainHand', quality: 'superior' });
    const c = structuredClone(p); const a = powerScore(derive(c)); equip(c, structuredClone(e)); const d = powerScore(derive(c)) - a;
    if (d >= 5 && d <= 12) { p.inventory.push(e); console.log(`seed ${s} Lv${level(p)} 戰力 ${a} mh=${p.equipped.mainHand?.base}/${p.equipped.mainHand?.quality} oh=${p.equipped.offHand?.group} club ▲${d} gain=${(wearGain(p, e) * 100).toFixed(2)}% better=${betterThanWorn(p, e)} issues=${prepIssues(p)}`); break; }
  }
}
