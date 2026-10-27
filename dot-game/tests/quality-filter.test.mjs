import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import {QUALITY_TIERS, generateItem} from '../src/loot.js';
import {fullUI,clone} from './helpers/comparison-focus-harness.mjs';
function fixture(){const s=engine.createGame(42);let cumulative=0;s.inventory=QUALITY_TIERS.map((tier,i)=>{const q=(cumulative+tier.weight/2)/100;cumulative+=tier.weight;const draws=[.4,q];const item=generateItem(()=>draws.length?draws.shift():.5,3,'armor');return {...item,id:`quality-${i}`,name:'同名測試護甲',locked:false};});return engine.validateSave(s);}
const ids=h=>h.dom['inventory-list'].querySelectorAll('[data-inventory-id]').map(x=>x.dataset.inventoryId);
async function choose(h,q){h.dom['quality-filter'].value=q;await h.dom['quality-filter'].emit('change');}
test('quality options exactly cover all original existing tiers once',()=>{const h=fullUI(fixture());assert.deepEqual(h.dom['quality-filter'].children.map(x=>x.value),['all',...QUALITY_TIERS.map(x=>x.name)]);});
for(let i=0;i<8;i++)test(`exact quality ${QUALITY_TIERS[i].name} is not minimum quality or item name matching`,async()=>{const h=fullUI(fixture()),before=JSON.stringify(h.state),calls=clone(h.calls),writes=clone(h.writes);await choose(h,QUALITY_TIERS[i].name);assert.deepEqual(ids(h),[`quality-${i}`]);assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.calls,calls);assert.deepEqual(h.writes,writes);assert.match(h.dom['inventory-filter-status'].textContent,new RegExp(QUALITY_TIERS[i].label));});
test('quality intersects slot and reset restores all without discarding inspected item',async()=>{const h=fullUI(fixture());await h.card('inventory','quality-3').click();await choose(h,'Peerless');h.dom['slot-filter'].value='weapon';await h.dom['slot-filter'].emit('change');assert.deepEqual(ids(h),[]);assert.equal(h.run('selectedId'),'quality-3');await h.dom['reset-inventory-filters'].click();assert.equal(h.dom['quality-filter'].value,'all');assert.equal(ids(h).length,8);assert.equal(h.run('selectedId'),'quality-3');});
test('invalid filter value fails open and adopted journey clears quality',async()=>{const h=fullUI(fixture());await choose(h,'invented');assert.equal(ids(h).length,8);await choose(h,'Fair');h.run('syncSelection()');h.render();assert.equal(h.dom['quality-filter'].value,'all');assert.equal(ids(h).length,8);});
