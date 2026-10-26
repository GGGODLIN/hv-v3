import test from 'node:test';
import assert from 'node:assert/strict';
import {loadInventoryMatcher,inspectInventory,earnInventory} from '../scripts/inventory-workbench-natural.mjs';
import {validateSave,previewSelectedSale} from '../src/engine.js';
const copy=structuredClone;
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const {matches}=await loadInventoryMatcher();

for(const seed of [29,42,77])test(`workbench natural: seed ${seed} earns items/resources and all 80 AND views retain exact state`,()=>{
  const earned=earnInventory(seed),s=earned.state,before=JSON.stringify(s);
  assert.equal(s.wins,20);assert.equal(earned.runs.filter(row=>row.outcome==='win').length,20);
  assert.ok(earned.runs.length>=20);assert.equal(earned.boundTargets.length,2);
  assert.equal(earned.itemWorld.outcome,'win');assert.ok(s.inventory.length>=30);
  assert.equal(s.inventory.find(item=>item.id===earned.boundTargets[0]).itemWorld.level,1);
  assert.equal(s.inventory.find(item=>item.id===earned.boundTargets[1]).itemWorld,undefined);
  const result=inspectInventory(s,matches);
  assert.equal(result.rows.length,80);assert.equal(result.investmentCounts.bound,1);assert.equal(result.investmentCounts.iw1,1);
  assert.equal(result.investmentCounts.unbound,s.inventory.length-2);
  assert.equal(result.familyCounts.unknown,1,'naturally retained starter sword stays discoverable as unknown');
  assert.ok(result.hiddenSelection.some(row=>row.hiddenSelected===2));
  assert.ok(result.hiddenSelection.every(row=>row.visibleSelected+row.hiddenSelected===2));
  assert.equal(JSON.stringify(s),before);assert.deepEqual(validateSave(copy(s)).inventory.map(item=>item.id),s.inventory.map(item=>item.id));
});

test('workbench natural: repeated views work on deeply frozen earned state',()=>{
  const s=freeze(earnInventory(42).state),before=JSON.stringify(s);
  const first=inspectInventory(s,matches),second=inspectInventory(s,matches);
  assert.deepEqual(second,first);assert.equal(JSON.stringify(s),before);
});

test('workbench natural: equipped investment never appears in backpack results or changes selected-sale quote',()=>{
  const s=earnInventory(29).state,before=copy(s),result=inspectInventory(s,matches);
  const equippedIds=new Set(Object.values(s.equipment).map(item=>item.id));
  assert.ok(result.rows.every(row=>row.ids.every(id=>!equippedIds.has(id))));
  const q=previewSelectedSale(s,result.selectedQuoteIds);assert.equal(q.available,true);
  for(const row of result.rows){s.inventory.filter(item=>matches(item,row.filters));assert.deepEqual(previewSelectedSale(s,result.selectedQuoteIds),q);}
  assert.deepEqual(s,before);
});
