import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import {QUALITY_TIERS,generateItem} from '../src/loot.js';
import {fullUI,clone} from './helpers/comparison-focus-harness.mjs';
function fixture(){const s=engine.createGame(42);let c=0;s.inventory=QUALITY_TIERS.flatMap((tier,i)=>{const q=(c+tier.weight/2)/100;c+=tier.weight;return [0,1].map(n=>{const d=[.4,q];return {...generateItem(()=>d.length?d.shift():.5,3,'armor'),id:`q-${i}-${n}`,locked:false};});});return engine.validateSave(s);}
const ids=h=>h.dom['inventory-list'].querySelectorAll('[data-inventory-id]').map(x=>x.dataset.inventoryId);
async function sort(h,value){h.dom['sort-select'].value=value;await h.dom['sort-select'].emit('change');}
test('quality sort uses existing tier rank descending with newest tie first and no state mutation',async()=>{const h=fullUI(fixture()),before=JSON.stringify(h.state),writes=clone(h.writes),calls=clone(h.calls);await sort(h,'quality');assert.deepEqual(ids(h),QUALITY_TIERS.flatMap((_,i)=>[`q-${7-i}-1`,`q-${7-i}-0`]));assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.writes,writes);assert.deepEqual(h.calls,calls);});
test('switching back to latest restores acquisition order without reordering inventory',async()=>{const h=fullUI(fixture()),before=ids(h);await sort(h,'quality');await sort(h,'new');assert.deepEqual(ids(h),before);});
test('quality ordering preserves inspection and exact filter',async()=>{const h=fullUI(fixture());await h.card('inventory','q-3-0').click();h.dom['quality-filter'].value=QUALITY_TIERS[3].name;await h.dom['quality-filter'].emit('change');await sort(h,'quality');assert.deepEqual(ids(h),['q-3-1','q-3-0']);assert.equal(h.run('selectedId'),'q-3-0');});
