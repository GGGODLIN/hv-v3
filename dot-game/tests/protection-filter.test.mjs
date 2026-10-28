import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import {generateItem} from '../src/loot.js';
import {fullUI,clone} from './helpers/comparison-focus-harness.mjs';
function fixture(){const s=engine.createGame(42);s.inventory=['weapon','armor','accessory'].map((slot,i)=>({...generateItem(()=>.5,3,slot),id:`protect-${i}`,locked:i===0}));return engine.validateSave(s);}
const ids=h=>h.dom['inventory-list'].querySelectorAll('[data-inventory-id]').map(x=>x.dataset.inventoryId);
async function filter(h,value){h.dom['protection-filter'].value=value;await h.dom['protection-filter'].emit('change');}
test('protection filter separates locked collection and leaves all gameplay unchanged',async()=>{const h=fullUI(fixture()),before=JSON.stringify(h.state),writes=clone(h.writes),calls=clone(h.calls);await filter(h,'protected');assert.deepEqual(ids(h),['protect-0']);await filter(h,'unprotected');assert.deepEqual(ids(h),['protect-2','protect-1']);assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.writes,writes);assert.deepEqual(h.calls,calls);});
test('protection intersects slot and clearing restores all without changing inspection',async()=>{const h=fullUI(fixture());await h.card('inventory','protect-0').click();await filter(h,'protected');h.dom['slot-filter'].value='armor';await h.dom['slot-filter'].emit('change');assert.deepEqual(ids(h),[]);assert.equal(h.run('selectedId'),'protect-0');await h.dom['reset-inventory-filters'].click();assert.equal(h.dom['protection-filter'].value,'all');assert.equal(ids(h).length,3);});
test('hidden personal sale IDs survive protected-only view and clearing',async()=>{const h=fullUI(fixture());h.run("toggleSelectedSale('protect-1',true)");await filter(h,'protected');assert.deepEqual(clone(h.run('[...selectedSaleIds]')),['protect-1']);assert.match(h.dom['selected-sale-status'].textContent,/1 件在目前篩選外/);await h.dom['reset-inventory-filters'].click();assert.deepEqual(clone(h.run('[...selectedSaleIds]')),['protect-1']);});
test('accepted import resets protection view, retains imported collection and guards',async()=>{const h=fullUI(fixture());await filter(h,'protected');const before=clone(h.state.inventory);await h.import(clone(h.state));assert.equal(h.dom['protection-filter'].value,'all');assert.deepEqual(clone(h.state.inventory),before);});
