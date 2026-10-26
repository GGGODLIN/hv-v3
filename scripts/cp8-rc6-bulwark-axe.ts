/** cp8-rc6 Part A 2: postF20-bulwark preset main hand → one-hand axe (same level / quality / id as the old wakizashi), off hand stays the
 *  tower shield. Stats come from generateEquip (sourced item ranges); seed 7 fixed. Usage: npx tsx scripts/cp8-rc6-bulwark-axe.ts */
import { readFileSync, writeFileSync } from 'node:fs';
import { generateEquip } from '../src/core/items';
import { Rng } from '../src/core/rng';
const F = 'public/data/cp6-presets.json';
const all = JSON.parse(readFileSync(F, 'utf8'));
const pl = all['postF20-bulwark'].player; const old = pl.equipped.mainHand;
if (pl.equipped.offHand?.base !== 'tower') throw new Error('offHand not tower');
const e = generateEquip(new Rng(7), old.level, { group: 'oneHand', base: 'axe', quality: old.quality, slot: 'mainHand' } as never);
e.id = old.id; pl.equipped.mainHand = e;
pl.inventory = (pl.inventory ?? []).map((x: { id: string }) => (x.id === old.id ? e : x));
writeFileSync(F, JSON.stringify(all) + '\n'); console.error(JSON.stringify(e));
