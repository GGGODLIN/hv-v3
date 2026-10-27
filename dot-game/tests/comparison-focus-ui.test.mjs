import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import { fullUI, clone, find, collect } from './helpers/comparison-focus-harness.mjs';

// Controlled supported-save fixtures, not earned-play or browser evidence.
function fixture() {
  const s = engine.createGame(42), name = '同名比較裝備';
  s.inventory = [
    { ...clone(s.equipment.weapon), id: 'bag-plain', name, locked: false },
    { ...clone(s.equipment.armor), id: `bag-\"']\\:#`, name, locked: false },
  ];
  s.pendingLoot = [{ ...clone(s.equipment.accessory), id: `pending-\"']\\:#`, name, locked: false }];
  for (const item of Object.values(s.equipment)) item.name = name;
  return engine.validateSave(s);
}
const ids = h => ({ inventory: h.state.inventory[1].id, pending: h.state.pendingLoot[0].id, equipment: h.state.equipment.weapon.id });
const snapshot = h => ({ state: JSON.stringify(h.state), calls: clone(h.calls), writes: clone(h.writes) });
for (const location of ['inventory', 'pending', 'equipment']) {
  test(`${location} keyboard comparison retains the connected exact-ID replacement on repeated selection`, async () => {
    const h = fullUI(fixture()), id = ids(h)[location], before = snapshot(h);
    for (let i = 0; i < 3; i++) {
      const original = h.card(location, id); original.focus();
      assert.ok(h.document.activeElement === original);
      await original.click();
      const replacement = h.card(location, id);
      assert.ok(replacement !== original); assert.equal(original.isConnected, false);
      assert.ok(h.document.activeElement === replacement, `${location}: replacement must retain focus; actual ${h.document.activeElement.tag}`);
      assert.equal(replacement.isConnected, true);
      assert.equal(h.run(location === 'equipment' ? 'selectedSlot' : 'selectedId'), location === 'equipment' ? 'weapon' : id);
    }
    assert.deepEqual(snapshot(h), before); assert.deepEqual(h.faults, []);
  });
}

test('unchanged passive render keeps the same node and never calls focus again', () => {
  const h = fullUI(fixture()), card = h.card('inventory', h.state.inventory[0].id);
  card.focus(); const count = h.focusEvents.length; h.render(false);
  assert.ok(h.document.activeElement === card); assert.equal(h.focusEvents.length, count);
});

test('comparison-only forced renders and changing combat display preserve every game byte', async () => {
  const s = fixture(); s.pendingLoot = [];
  const h = fullUI(s); h.run("dispatch('start');"); assert.equal(h.state.mode, 'battle');
  const id = h.state.inventory[0].id; h.card('inventory', id).focus();
  const before = snapshot(h);
  for (let i = 0; i < 5; i++) h.render();
  assert.ok(h.document.activeElement === h.card('inventory', id)); assert.deepEqual(snapshot(h), before);
  assert.deepEqual(clone(h.focusEvents.at(-1).options), { preventScroll: true });
});

test('filter and sort controls keep focus despite an existing inspected item', async () => {
  for (const [control, value] of [['slot-filter', 'weapon'], ['family-filter', 'club'], ['investment-filter', 'bound'], ['sort-select', 'power']]) {
    const h = fullUI(fixture()); await h.card('inventory', h.state.inventory[0].id).click();
    const before = snapshot(h), filter = h.dom[control]; filter.focus(); filter.value = value;
    await filter.emit('change');
    assert.ok(h.document.activeElement === filter, control); assert.deepEqual(snapshot(h), before);
  }
});

test('automatic renders never take focus from unrelated controls, dialog controls, or body', async () => {
  const h = fullUI(fixture()); await h.card('inventory', h.state.inventory[0].id).click();
  for (const control of ['help-toggle', 'stage-select', 'heal-button', 'camp-tab-growth', 'settings-toggle']) {
    const target = h.dom[control]; target.disabled = false; target.focus(); const before = h.focusEvents.length;
    h.render(); assert.ok(h.document.activeElement === target, control); assert.equal(h.focusEvents.length, before);
  }
  h.dom['settings-dialog'].showModal(); h.dom['import-save'].focus(); h.render();
  assert.ok(h.document.activeElement === h.dom['import-save']);
  h.dom['settings-dialog'].close(); h.document.activeElement = h.document.body;
  h.render(); assert.ok(h.document.activeElement === h.document.body);
});

test('unrelated elements cannot impersonate comparison controls with matching data attributes', () => {
  const h = fullUI(fixture()), control = h.dom['slot-filter'];
  Object.assign(control.dataset, { pendingLootId: ids(h).pending, inventoryId: ids(h).inventory });
  control.focus(); h.render(); assert.ok(h.document.activeElement === control);
});

test('read-only comparison keeps focus without dispatching or saving', async () => {
  for (const location of ['inventory', 'pending', 'equipment']) {
    const h = fullUI(fixture()); h.run('tabOwner=false;'); h.render();
    const before = snapshot(h), id = ids(h)[location]; h.card(location, id).focus(); await h.card(location, id).click();
    assert.ok(h.document.activeElement === h.card(location, id)); assert.deepEqual(snapshot(h), before);
  }
});

test('pending item moved into backpack follows its exact ID after all lists repaint', async () => {
  const h = fullUI(fixture()), id = ids(h).pending;
  h.card('pending', id).focus(); await h.card('pending', id).click();
  h.run("act(state,'claimPending');render(true);");
  assert.ok(h.document.activeElement === h.card('inventory', id));
  assert.equal(h.dom['pending-loot'].hidden, true);
  assert.equal(h.run('selectedId'), id);
});

test('inventory item moved into equipment follows its exact ID, not the newly filled old slot', async () => {
  const h = fullUI(fixture()), id = h.state.inventory[0].id;
  h.card('inventory', id).focus(); await h.card('inventory', id).click();
  h.run(`act(state,'equip',${JSON.stringify(id)});render(true);`);
  assert.ok(h.document.activeElement === h.card('equipment', id));
  assert.equal(h.state.equipment.weapon.id, id);
});

test('equipment moved into inventory follows the old item ID, never its same-name slot replacement', async () => {
  const h = fullUI(fixture()), id = h.state.equipment.weapon.id, replacementId = h.state.inventory[0].id;
  h.card('equipment', id).focus(); await h.card('equipment', id).click();
  h.run(`act(state,'equip',${JSON.stringify(replacementId)});render(true);`);
  assert.ok(h.document.activeElement === h.card('inventory', id));
  assert.ok(h.document.activeElement !== h.card('equipment', replacementId));
});

test('moved but filtered-out comparison uses a stable visible fallback', async () => {
  const h = fullUI(fixture()), id = ids(h).pending;
  h.dom['slot-filter'].value = 'armor'; h.render();
  h.card('pending', id).focus(); await h.card('pending', id).click();
  h.run("act(state,'claimPending');render(true);");
  assert.ok(h.document.activeElement === h.dom['slot-filter']);
  assert.match(collect(h.dom['item-detail']), /位於背包篩選外/);
});

test('removed comparison falls back without selecting another same-name item', async () => {
  const h = fullUI(fixture()), id = h.state.inventory[0].id;
  h.card('inventory', id).focus(); await h.card('inventory', id).click();
  h.run(`act(state,'sell',${JSON.stringify(id)});render(true);`);
  assert.ok(h.document.activeElement === h.dom['slot-filter']);
  assert.equal(h.card('inventory', id), undefined);
  assert.match(collect(h.dom['item-detail']), /看看下一件好東西/);
});

test('hidden originals do not initiate fallback focus or target hidden replacements', () => {
  const h = fullUI(fixture()), id = h.state.inventory[0].id, card = h.card('inventory', id);
  card.focus(); h.dom['inventory-list'].hidden = true; const count = h.focusEvents.length;
  h.render(); assert.ok(h.document.activeElement === h.document.body); assert.equal(h.focusEvents.length, count);
  h.dom['inventory-list'].hidden = false; h.card('inventory', id).focus();
  h.run("const oldRenderInventory=renderInventory;renderInventory=()=>{oldRenderInventory();$('inventory-list').hidden=true;};");
  h.render(); assert.ok(h.document.activeElement === h.dom['slot-filter']);
});

test('a later renderer-selected connected control is never overridden by comparison restoration', () => {
  const h = fullUI(fixture()), id = h.state.inventory[0].id;
  h.card('inventory', id).focus();
  h.run("const previousReports=renderExpeditionReports;renderExpeditionReports=()=>{previousReports();$('help-toggle').focus();};");
  h.render(); assert.ok(h.document.activeElement === h.dom['help-toggle']);
});

test('stale detached comparison click cannot pull focus away from an unrelated current control', async () => {
  const h = fullUI(fixture()), stale = h.card('inventory', h.state.inventory[0].id);
  h.render(); h.dom['family-filter'].focus(); await stale.click();
  assert.ok(h.document.activeElement === h.dom['family-filter']);
});

test('existing explicit claim completion focus remains authoritative', async () => {
  const h = fullUI(fixture()), id = ids(h).pending;
  await h.card('pending', id).click(); h.dom['claim-pending'].focus(); await h.dom['claim-pending'].click();
  assert.equal(h.document.activeElement.className, 'detail-name');
  assert.ok(h.document.activeElement.isConnected);
  const other = fullUI(fixture()); other.dom['claim-pending'].focus(); await other.dom['claim-pending'].click();
  assert.ok(other.document.activeElement === other.dom['slot-filter']);
});

test('sale checkboxes and valid imports keep their established control focus, not inspected-item focus', async () => {
  const h = fullUI(fixture()), id = h.state.inventory[0].id;
  await h.card('inventory', id).click();
  let check = find(h.dom['inventory-list'], el => el.tag === 'input'); check.focus(); check.checked = true; await check.emit('change');
  assert.equal(h.document.activeElement.tag, 'input'); assert.ok(h.document.activeElement.isConnected);
  h.dom['settings-dialog'].showModal(); h.dom['import-save'].focus(); await h.import(fixture());
  assert.ok(h.document.activeElement === h.dom['import-save']); assert.equal(h.run('selectedId'), null);
  assert.equal(h.run('selectedSlot'), null); assert.deepEqual(h.faults, []);
});

test('punctuation IDs never become selector strings and comparison focus uses exact identity', async () => {
  const h = fullUI(fixture()), { inventory, pending } = ids(h);
  for (const [location, id] of [['inventory', inventory], ['pending', pending]]) {
    h.card(location, id).focus(); await h.card(location, id).click(); h.render();
    assert.ok(h.document.activeElement === h.card(location, id));
    assert.ok(!h.selectorCalls.some(selector => selector.includes(id)));
  }
});


test('removed item falls back to visible settings when its stable inventory filter is hidden', () => {
  const h = fullUI(fixture()), id = h.state.inventory[0].id;
  h.card('inventory', id).focus(); h.dom['slot-filter'].hidden = true;
  h.run(`act(state,'sell',${JSON.stringify(id)});render(true);`);
  assert.ok(h.document.activeElement === h.dom['settings-toggle']);
});
