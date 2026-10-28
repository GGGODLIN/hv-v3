import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import {generateItem,createCommissionWeapon} from '../src/loot.js';
import {fullUI,clone} from './helpers/comparison-focus-harness.mjs';
function fixture(){
 const s=engine.createGame(42);
 s.inventory=['weapon','armor','accessory'].map((slot,i)=>({...generateItem(()=>.5,3,slot),id:`audit-protection-${i}`,locked:false}));
 engine.act(s,'saveGearSet','a');engine.act(s,'equip','audit-protection-0');engine.act(s,'lock','audit-protection-1');
 return engine.validateSave(s);
}
const ids=h=>h.dom['inventory-list'].querySelectorAll('[data-inventory-id]').map(x=>x.dataset.inventoryId);
async function filter(h,value){h.dom['protection-filter'].value=value;await h.dom['protection-filter'].emit('change');}
test('audit protection classifies live locked and preset items without mutating state or storage',async()=>{
 const h=fullUI(fixture()),before=JSON.stringify(h.state),calls=clone(h.calls),writes=clone(h.writes);
 assert.deepEqual(h.dom['protection-filter'].children.map(x=>x.value),['all','protected','unprotected']);
 await filter(h,'protected');assert.deepEqual(ids(h).sort(),['audit-protection-1','starter-weapon']);
 await filter(h,'unprotected');assert.deepEqual(ids(h),['audit-protection-2']);
 assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.calls,calls);assert.deepEqual(h.writes,writes);assert.deepEqual(h.faults,[]);
});
test('audit genuine soulbound weapon remains protected after validated save import',async()=>{
 const s=engine.createGame(9);s.hero.level=7;s.soulFragments=1000;s.inventory=[{...createCommissionWeapon('axe',3),id:'bound-audit'}];
 const q=engine.previewSoulbindWeapon(s,'bound-audit');assert.equal(q.available,true);engine.act(s,'soulbindWeapon',q);
 const h=fullUI(engine.validateSave(s));await filter(h,'protected');assert.deepEqual(ids(h),['bound-audit']);await filter(h,'unprotected');assert.deepEqual(ids(h),[]);
});
test('audit protection intersects name and slot and reset restores all cards',async()=>{
 const h=fullUI(fixture());await filter(h,'protected');h.dom['slot-filter'].value='armor';await h.dom['slot-filter'].emit('change');assert.deepEqual(ids(h),['audit-protection-1']);
 h.dom['name-filter'].value='no matching equipment';await h.dom['name-filter'].emit('input');assert.deepEqual(ids(h),[]);
 await h.dom['reset-inventory-filters'].click();assert.equal(h.dom['protection-filter'].value,'all');assert.equal(h.dom['name-filter'].value,'');assert.equal(ids(h).length,3);
});
test('audit hiding unprotected selection preserves exact inspection and sale consent IDs',async()=>{
 const h=fullUI(fixture());await h.card('inventory','audit-protection-2').click();h.run("toggleSelectedSale('audit-protection-2',true)");await filter(h,'protected');
 assert.equal(h.run('selectedId'),'audit-protection-2');assert.deepEqual(clone(h.run('[...selectedSaleIds]')),['audit-protection-2']);assert.match(h.dom['selected-sale-status'].textContent,/1 件在目前篩選外/);
 await h.dom['review-selected-sale'].click();assert.match(h.dom['selected-sale-summary'].textContent,/含背包篩選外 1 件/);assert.equal(h.calls.length,0);assert.equal(h.state.inventory.length,3);
});
test('audit successful import clears protection view without altering owned item records',async()=>{
 const h=fullUI(fixture());await filter(h,'unprotected');const items=clone(h.state.inventory);await h.import(clone(h.state));assert.equal(h.dom['protection-filter'].value,'all');assert.deepEqual(clone(h.state.inventory),items);assert.equal(ids(h).length,3);
});
test('audit invalid protection choice fails to all and does not steal unrelated focus',async()=>{
 const h=fullUI(fixture());h.dom['sort-select'].focus();await filter(h,'future');assert.equal(ids(h).length,3);assert.equal(h.document.activeElement,h.dom['sort-select']);h.run('syncSelection()');assert.equal(h.dom['protection-filter'].value,'all');
});
