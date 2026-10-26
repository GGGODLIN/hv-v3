/** cp8-rc5 (producer call, 暫定): the postF20-blade debug preset's twoHand was 'fair' L6 while the other schools' presets carry
 *  superior/exquisite main hands (L10–15). Re-roll it as a superior scythe at L13 (mean of the others' main-hand levels), fixed seed. */
import { readFileSync, writeFileSync } from 'node:fs';
import { Rng } from '../src/core/rng';
import { generateEquip } from '../src/core/items';
const f = new URL('../public/data/cp6-presets.json', import.meta.url);
const d = JSON.parse(readFileSync(f, 'utf8'));
const old = d['postF20-blade'].player.equipped.mainHand;
const e = generateEquip(new Rng(8005), 13, { group: 'twoHand', base: 'scythe', slot: 'mainHand', quality: 'superior' });
e.id = old.id; d['postF20-blade'].player.equipped.mainHand = e;
writeFileSync(f, JSON.stringify(d)); console.log(JSON.stringify(e));
