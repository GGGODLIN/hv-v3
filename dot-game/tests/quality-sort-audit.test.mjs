import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import { QUALITY_TIERS, generateItem } from '../src/loot.js';
import { fullUI, clone } from './helpers/comparison-focus-harness.mjs';

function fixture() {
  const state = engine.createGame(903);
  let cumulative = 0;
  state.inventory = QUALITY_TIERS.flatMap((tier, rank) => {
    const qualityDraw = (cumulative + tier.weight / 2) / 100;
    cumulative += tier.weight;
    return ['weapon', 'armor'].map(slot => {
      const draws = [.4, qualityDraw];
      const item = generateItem(() => draws.length ? draws.shift() : .5, rank === 0 ? 100 : 1, slot);
      assert.equal(item.quality, tier.name);
      return { ...item, id: `sort-audit-${tier.name}-${slot}`, locked: false };
    });
  });
  // Deliberately disagree with quality order in acquisition order.
  state.inventory.reverse();
  return engine.validateSave(state);
}
const ids = h => h.dom['inventory-list'].querySelectorAll('[data-inventory-id]').map(el => el.dataset.inventoryId);
async function choose(h, id, value) { h.dom[id].value = value; await h.dom[id].emit('change'); }
const expected = QUALITY_TIERS.slice().reverse().flatMap(t => ['weapon', 'armor'].map(slot => `sort-audit-${t.name}-${slot}`));

test('audit quality sort exposes a real option and orders all eight tiers descending', async () => {
  const h = fullUI(fixture());
  assert.equal(h.dom['sort-select'].children.filter(el => el.value === 'quality').length, 1);
  await choose(h, 'sort-select', 'quality');
  assert.deepEqual(ids(h), expected);
});

test('audit quality ordering does not recommend high power or level as high rarity', async () => {
  const h = fullUI(fixture());
  const crude = h.state.inventory.find(i => i.id === 'sort-audit-Crude-weapon');
  const peerless = h.state.inventory.find(i => i.id === 'sort-audit-Peerless-weapon');
  assert.ok(crude.level > peerless.level);
  assert.ok(crude.power > peerless.power);
  await choose(h, 'sort-select', 'quality');
  assert.ok(ids(h).indexOf(peerless.id) < ids(h).indexOf(crude.id));
});

test('audit equal-quality ties preserve newest-first acquisition, not name or ID', async () => {
  const state = fixture();
  const item = state.inventory.find(i => i.quality === 'Superior');
  state.inventory.push({ ...clone(item), id: 'aaa-last-acquired', name: 'AAA newest' });
  const h = fullUI(state);
  await choose(h, 'quality-filter', 'Superior');
  await choose(h, 'sort-select', 'quality');
  assert.deepEqual(ids(h), ['aaa-last-acquired', 'sort-audit-Superior-weapon', 'sort-audit-Superior-armor']);
});

test('audit quality ordering intersects all filters and changing order never changes owned data', async () => {
  const h = fullUI(fixture()), before = JSON.stringify(h.state), writes = clone(h.writes), calls = clone(h.calls);
  await choose(h, 'slot-filter', 'weapon');
  await choose(h, 'family-filter', 'rapier');
  await choose(h, 'investment-filter', 'unbound');
  await choose(h, 'sort-select', 'quality');
  assert.deepEqual(ids(h), expected.filter(id => id.endsWith('-weapon')));
  await choose(h, 'quality-filter', 'Fair');
  assert.deepEqual(ids(h), ['sort-audit-Fair-weapon']);
  assert.equal(JSON.stringify(h.state), before);
  assert.deepEqual(h.writes, writes);
  assert.deepEqual(h.calls, calls);
  assert.deepEqual(h.faults, []);
});

test('audit sorting retains inspected and manually selected exact item IDs without transactions', async () => {
  const h = fullUI(fixture());
  const id = 'sort-audit-Superior-armor';
  await h.card('inventory', id).click();
  h.run(`toggleSelectedSale('${id}', true)`);
  const state = JSON.stringify(h.state), writes = clone(h.writes), calls = clone(h.calls);
  await choose(h, 'sort-select', 'quality');
  assert.equal(h.run('selectedId'), id);
  assert.deepEqual(clone(h.run('[...selectedSaleIds]')), [id]);
  assert.equal(JSON.stringify(h.state), state);
  assert.deepEqual(h.writes, writes);
  assert.deepEqual(h.calls, calls);
});

test('audit switching back to newest restores acquisition order without mutation or stealing focus', async () => {
  const h = fullUI(fixture()), newest = ids(h);
  h.dom['sort-select'].focus();
  await choose(h, 'sort-select', 'quality');
  await choose(h, 'sort-select', 'new');
  assert.deepEqual(ids(h), newest);
  assert.equal(h.document.activeElement, h.dom['sort-select']);
});
