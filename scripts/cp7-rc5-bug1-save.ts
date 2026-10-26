/** cp7-rc5 bug 1: postF20-bulwark preset + 優良 raccoon clubs (one ▲9 and one ▲≥ betterMargin) → /tmp/rc5-bug1.json for the headless check. */
import { readFileSync, writeFileSync } from 'node:fs';
import { derive, equip, level, powerScore, type Player } from '../src/core/player';
import { RULES } from '../src/core/run';
import { generateEquip, type Equip } from '../src/core/items';
import { gearVerdict, wearGain } from '../src/core/cp7';
import { Rng } from '../src/core/rng';
RULES.cp6Abyss = RULES.cp5Bosses = RULES.cp4RunBuffs = RULES.cp7 = true;
const pr = JSON.parse(readFileSync('public/data/cp6-presets.json', 'utf8'))['postF20-bulwark'];
const p: Player = pr.player; const rng = new Rng(7); const out: Record<string, Equip> = {};
const cur = powerScore(derive(p));
for (let k = 0; k < 4000 && Object.keys(out).length < 2; k++) {
  const e = generateEquip(rng, level(p) + 5, { group: 'oneHand', base: 'club', slot: 'mainHand', quality: 'superior', suffix: 'raccoon' } as never);
  if (e.suffix !== 'raccoon') continue;
  const c = structuredClone(p); equip(c, structuredClone(e)); const d = powerScore(derive(c)) - cur; const v = gearVerdict(p, e);
  if (d === 9 && !out.d9) { out.d9 = e; console.log('▲9', (wearGain(p, e) * 100).toFixed(2) + '%', v); }
  if (v === 'better' && !out.big) { out.big = e; console.log('▲' + d, (wearGain(p, e) * 100).toFixed(2) + '%', v); }
}
console.log('power', cur, 'mh', p.equipped.mainHand?.base, 'oh', p.equipped.offHand?.group, 'Lv', level(p));
writeFileSync('/tmp/rc5-bug1.json', JSON.stringify(out));
