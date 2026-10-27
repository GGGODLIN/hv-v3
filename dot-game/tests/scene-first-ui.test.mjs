import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, act } from '../src/engine.js';
import { fullUI, clone, find } from './helpers/comparison-focus-harness.mjs';

// Full controller + parsed source ancestry. Not browser geometry, native-details
// keyboard behavior, paint, accessibility-tree or pixel acceptance.
const snapshot = h => JSON.stringify({ state: h.state, calls: h.calls, writes: h.writes });
const ancestry = node => { const parents = []; for (let p = node.parentElement; p; p = p.parentElement) parents.push(p); return parents; };
const preorder = node => [node, ...node.children.flatMap(preorder)];
const tactics = h => find(h.document, node => node.className.split(' ').includes('tactics-disclosure'));
function fixture() {
  const state = createGame(42);
  state.inventory.push({ ...clone(state.equipment.weapon), id: 'scene-test-weapon', name: '測試用另一把武器', locked: false });
  return state;
}

test('scene-first: compact weapon label renders actual equipped name as text without changing game', () => {
  const state = fixture(); state.equipment.weapon.name = '<b>只是名稱，不是標記</b>';
  const h = fullUI(state), before = snapshot(h);
  for (let i = 0; i < 4; i++) h.render();
  assert.equal(h.dom['current-weapon-label'].textContent, state.equipment.weapon.name);
  assert.equal(h.dom['current-weapon-label'].children.length, 0);
  assert.equal(snapshot(h), before);
});

test('scene-first: selecting a different item does not mislabel it as equipped', async () => {
  const h = fullUI(fixture()), before = snapshot(h);
  await h.card('inventory', 'scene-test-weapon').click();
  assert.equal(h.run('selectedId'), 'scene-test-weapon');
  assert.equal(h.dom['current-weapon-label'].textContent, h.state.equipment.weapon.name);
  assert.notEqual(h.dom['current-weapon-label'].textContent, '測試用另一把武器');
  assert.equal(snapshot(h), before);
});

test('scene-first: equipping updates compact identity with exactly the existing engine result', () => {
  const h = fullUI(fixture()), expected = clone(h.state); act(expected, 'equip', 'scene-test-weapon');
  h.run("dispatch('equip', 'scene-test-weapon')");
  assert.deepEqual(clone(h.state), expected);
  assert.equal(h.dom['current-weapon-label'].textContent, expected.equipment.weapon.name);
});

test('scene-first: successful import refreshes compact weapon identity, not a stale selected item', async () => {
  const h = fullUI(fixture()); await h.card('inventory', 'scene-test-weapon').click();
  const restored = createGame(73); restored.equipment.weapon.name = '匯入測試武器';
  await h.import(restored);
  assert.equal(h.dom['current-weapon-label'].textContent, '匯入測試武器');
  assert.equal(h.run('selectedId'), null);
});

test('scene-first: readonly storage refresh updates visible equipped name without acquiring ownership', async () => {
  const h = fullUI(); h.run('tabOwner=false;render(true)');
  const next = createGame(73); next.equipment.weapon.name = '另一分頁的測試武器';
  const calls = h.calls.length, writes = h.writes.length;
  await h.window.emit('storage', { key: h.run('SAVE_KEY'), newValue: JSON.stringify(next) });
  assert.equal(h.run('tabOwner'), false);
  assert.equal(h.dom['current-weapon-label'].textContent, next.equipment.weapon.name);
  assert.equal(h.calls.length, calls); assert.equal(h.writes.length, writes);
});

test('scene-first: opening and closing secondary disclosures has no game, RNG, action or write effect', async () => {
  const h = fullUI(), before = snapshot(h);
  const disclosures = preorder(h.document).filter(node => node.tag === 'details');
  assert.ok(disclosures.length > 5);
  for (const disclosure of disclosures) {
    disclosure.open = true; await disclosure.emit('toggle');
    disclosure.open = false; await disclosure.emit('toggle');
  }
  h.render(); assert.equal(snapshot(h), before);
});

test('scene-first: collapsed tactics does not hide, start or cancel the one-shot return request', async () => {
  const h = fullUI(), detail = tactics(h); assert.ok(detail); assert.equal(detail.open, false);
  await h.dom['start-button'].click(); await h.dom['finish-camp-button'].click();
  assert.equal(h.dom['finish-camp-button'].attributes['aria-pressed'], 'true');
  const before = snapshot(h);
  detail.open = true; await detail.emit('toggle'); detail.open = false; await detail.emit('toggle'); h.render();
  assert.equal(snapshot(h), before);
  assert.equal(h.dom['finish-camp-button'].attributes['aria-pressed'], 'true');
  assert.equal(h.state.mode, 'battle');
});

test('scene-first: disclosed tactic still calls existing strategy action, not a new setting path', async () => {
  const h = fullUI(createGame(42)), expected = clone(h.state); act(expected, 'setStrategy', 'assault');
  tactics(h).open = true;
  h.dom['strategy-select'].value = 'assault'; await h.dom['strategy-select'].emit('change');
  assert.deepEqual(clone(h.state), expected);
  assert.deepEqual(h.calls.at(-1), { action: 'setStrategy', payload: 'assault' });
  assert.equal(tactics(h).open, true);
});

test('scene-first: main source order prioritizes scene then primary actions before live details and tactics', () => {
  const h = fullUI(), nodes = preorder(h.dom.main), position = el => nodes.indexOf(el);
  const scene = h.dom['battle-scene'], controls = h.dom['start-button'].parentElement.parentElement;
  assert.equal(scene.parentElement, controls.parentElement);
  assert.equal(scene.parentElement.children.indexOf(controls), scene.parentElement.children.indexOf(scene) + 1);
  for (const id of ['start-button', 'heal-button', 'finish-camp-button', 'retreat-button']) {
    assert.ok(position(h.dom[id]) > position(scene));
    assert.ok(position(h.dom[id]) < position(h.dom['enemy-status-panel']));
    assert.ok(position(h.dom[id]) < position(tactics(h)));
  }
  assert.ok(position(h.dom['enemy-status-panel']) < position(tactics(h)));
  assert.ok(position(h.dom['inventory-list']) < position(h.dom['camp-tab-battle']));
});

test('scene-first: health, current weapon, ownership and comparison focus anchors remain outside disclosures and tabs', () => {
  const h = fullUI();
  for (const id of ['hp-label', 'mp-label', 'current-weapon-label', 'tab-status', 'save-status', 'mode-badge', 'equipment', 'slot-filter', 'start-button', 'retreat-button']) {
    assert.ok(h.dom[id]);
    for (const parent of ancestry(h.dom[id])) {
      assert.notEqual(parent.tag, 'details', `${id} must not need disclosure`);
      assert.notEqual(parent.attributes.role, 'tabpanel', `${id} must not need a tab`);
      assert.equal(parent.hidden, false, `${id} must not have hidden ancestry`);
    }
  }
});

test('scene-first: header update does not steal comparison focus after an equipment swap', () => {
  const h = fullUI(fixture()), button = h.card('inventory', 'scene-test-weapon'); button.focus();
  h.run("dispatch('equip', 'scene-test-weapon')");
  assert.equal(h.document.activeElement, h.card('equipment', 'scene-test-weapon'));
  assert.equal(h.dom['current-weapon-label'].textContent, h.state.equipment.weapon.name);
  assert.notEqual(h.document.activeElement, h.dom['current-weapon-label']);
});
