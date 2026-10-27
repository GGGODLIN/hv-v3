import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import { generateItem } from '../src/loot.js';
import { fullUI, clone, collect } from './helpers/comparison-focus-harness.mjs';

function fixture() {
  const state = engine.createGame(731);
  state.inventory = [
    ['alpha-weapon','Alpha 追風刺劍','weapon'],
    ['alpha-armor','ALPHA 守望護甲','armor'],
    ['symbols','獵人 [.*] 護甲','armor'],
    ['markup','<img src=x> 霧境護甲','armor'],
    ['beta','Beta 守望護甲','armor']
  ].map(([id,name,slot]) => ({ ...generateItem(() => .5,3,slot), id,name,locked:false }));
  return engine.validateSave(state);
}
const ids = h => h.dom['inventory-list'].querySelectorAll('[data-inventory-id]').map(el => el.dataset.inventoryId);
async function search(h, value) { h.dom['name-filter'].value=value; await h.dom['name-filter'].emit('input'); }
async function choose(h, id, value) { h.dom[id].value=value; await h.dom[id].emit('change'); }

test('audit name search trims and folds case while preserving source state and acquisition order', async () => {
  const h=fullUI(fixture()), before=JSON.stringify(h.state), calls=clone(h.calls), writes=clone(h.writes);
  await search(h,'  aLpHa  ');
  assert.deepEqual(ids(h),['alpha-armor','alpha-weapon']);
  assert.equal(JSON.stringify(h.state),before); assert.deepEqual(h.calls,calls); assert.deepEqual(h.writes,writes);
  await search(h,' \t '); assert.equal(ids(h).length,5);
  await search(h,''); assert.equal(ids(h).length,5);
});

test('audit name search is a literal substring not regex, markup or metadata lookup', async () => {
  const h=fullUI(fixture());
  await search(h,'[.*]'); assert.deepEqual(ids(h),['symbols']);
  await search(h,'<img src=x>'); assert.deepEqual(ids(h),['markup']);
  assert.match(h.dom['inventory-filter-status'].textContent,/<img src=x>/);
  assert.equal(h.dom['inventory-filter-status'].children.length,0);
  await search(h,'no such item'); assert.deepEqual(ids(h),[]);
  assert.match(collect(h.dom['inventory-list']),/清除篩選/);
});

test('audit name search intersects quality, slot, family and investment criteria', async () => {
  const h=fullUI(fixture()); await search(h,'Alpha');
  await choose(h,'slot-filter','weapon'); await choose(h,'family-filter','rapier');
  await choose(h,'investment-filter','unbound');
  await choose(h,'quality-filter',h.state.inventory[0].quality);
  assert.deepEqual(ids(h),['alpha-weapon']);
  await choose(h,'investment-filter','bound'); assert.deepEqual(ids(h),[]);
  await h.dom['reset-inventory-filters'].click();
  assert.equal(h.dom['name-filter'].value,''); assert.equal(ids(h).length,5);
});

test('audit hiding a compared and selected item keeps exact IDs and sale disclosure', async () => {
  const h=fullUI(fixture());
  h.run("toggleSelectedSale('alpha-weapon',true)");
  await h.card('inventory','alpha-weapon').click(); await search(h,'Beta');
  assert.equal(h.run('selectedId'),'alpha-weapon');
  assert.deepEqual(clone(h.run('[...selectedSaleIds]')),['alpha-weapon']);
  assert.match(h.dom['selected-sale-status'].textContent,/1 件在目前篩選外/);
  await h.dom['review-selected-sale'].click();
  assert.match(h.dom['selected-sale-summary'].textContent,/含背包篩選外 1 件/);
  assert.equal(h.state.inventory.length,5); assert.equal(h.calls.length,0);
});

test('audit typing preserves input focus and import resets only the view', async () => {
  const h=fullUI(fixture()), before=clone(h.state.inventory);
  h.dom['name-filter'].focus(); await search(h,'Alpha');
  assert.equal(h.document.activeElement,h.dom['name-filter']);
  await h.import(clone(h.state));
  assert.equal(h.dom['name-filter'].value,''); assert.deepEqual(clone(h.state.inventory),before);
  assert.equal(ids(h).length,5); assert.deepEqual(h.faults,[]);
});

test('audit name-only match does not hide worn gear or pending FIFO records', async () => {
  const h=fullUI(fixture());
  h.run("state.pendingLoot = [{...state.inventory[0],id:'pending-name'}]");
  h.render();
  const worn=collect(h.dom.equipment), pending=collect(h.dom['pending-loot-list']);
  await search(h,'nothing matches');
  assert.deepEqual(ids(h),[]);
  assert.equal(collect(h.dom.equipment),worn); assert.equal(collect(h.dom['pending-loot-list']),pending);
});
