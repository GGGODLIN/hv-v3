import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/engine.js';
import { createCommissionWeapon } from '../src/loot.js';
import { fullUI, clone, find, collect } from './helpers/comparison-focus-harness.mjs';
const all = n => [n, ...n.children.flatMap(all)];
const snap = h => JSON.stringify({ state: h.state, calls: h.calls, writes: h.writes });
function fixture() {
  const s = createGame(42);
  for (const family of ['axe', 'rapier', 'club']) s.inventory.push({ ...createCommissionWeapon(family, 1), id: `visual-${family}`, locked: false });
  return s;
}
for (const family of ['axe', 'rapier', 'club']) test(`RPG artwork: ${family} uses its actual resolver identity and retains full name/quality text`, () => {
  const h = fullUI(fixture()), card = h.card('inventory', `visual-${family}`), image = find(card, n => n.tag === 'img');
  const item = h.state.inventory.find(i => i.id === `visual-${family}`);
  assert.equal(image.attributes.src, `./assets/equipment/${family}.svg`);
  assert.equal(image.attributes.alt, ''); assert.equal(image.parentElement.attributes['aria-hidden'], 'true');
  assert.ok(collect(card).includes(item.name)); assert.match(collect(card), /Lv\.1/);
  assert.match(card.attributes['aria-label'], /等級 1/);
});
for (const [slot, expected] of [['weapon', 'unknown'], ['armor', 'armor'], ['accessory', 'accessory']]) test(`RPG artwork: starter ${slot} has a bounded, local ${expected} image`, () => {
  const h = fullUI(), card = h.card('equipment', h.state.equipment[slot].id);
  assert.equal(find(card, n => n.tag === 'img').attributes.src, `./assets/equipment/${expected}.svg`);
});
test('RPG artwork: item name markup is text and never an asset URL or new element', () => {
  const s = fixture(); s.inventory[0].name = '<img src="https://example.invalid/">名稱';
  const h = fullUI(s), card = h.card('inventory', s.inventory[0].id);
  assert.equal(all(card).filter(n => n.tag === 'img').length, 1);
  assert.ok(all(card).some(n => n.textContent === s.inventory[0].name));
});
test('RPG selection: repeated comparison restores exact focus and adds selected equipped state without mutation', async () => {
  const h = fullUI(fixture()), before = snap(h);
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const id = h.state.equipment[slot].id;
    h.card('equipment', id).focus(); await h.card('equipment', id).click();
    assert.equal(h.document.activeElement, h.card('equipment', id));
    assert.equal(h.card('equipment', id).attributes['aria-pressed'], 'true');
    assert.ok(h.card('equipment', id).className.includes('selected'));
  }
  assert.equal(snap(h), before);
});
test('RPG inventory: inspect-card then independent sale checkbox follows visual and DOM order', () => {
  const h = fullUI(fixture());
  for (const row of h.dom['inventory-list'].children) {
    assert.ok(row.children[0].className.includes('inventory-card'));
    assert.equal(row.children[1].tag, 'label');
    const check = find(row.children[1], n => n.tag === 'input');
    assert.match(check.attributes['aria-label'], /選取出售.*ID：visual-/);
    assert.equal(check.checked, false);
  }
});
test('RPG comparison: details precede disposal controls and expose current to candidate plus signed difference', async () => {
  const h = fullUI(fixture()), before = snap(h); await h.card('inventory', 'visual-axe').click();
  const siblings = h.dom['item-detail'].parentElement.children;
  const sale = siblings.find(n => n.className === 'selected-sale-tools');
  assert.ok(siblings.indexOf(h.dom['inventory-list']) < siblings.indexOf(h.dom['item-detail']));
  assert.ok(siblings.indexOf(h.dom['item-detail']) < siblings.indexOf(sale));
  assert.match(collect(h.dom['item-detail']), /現穿 → 選取/);
  const row = find(h.dom['item-detail'], n => n.className === 'compare-row');
  assert.equal(row.children.length, 3); assert.match(row.children[1].textContent, / → /);
  assert.equal(snap(h), before);
});
test('RPG comparison: wearing a selected item updates local icon and current identity through unchanged equip action', async () => {
  const h = fullUI(fixture()); await h.card('inventory', 'visual-rapier').click();
  const equip = find(h.dom['item-detail'], n => n.tag === 'button' && n.textContent === '換上裝備'); await equip.click();
  assert.equal(h.state.equipment.weapon.id, 'visual-rapier');
  assert.equal(find(h.card('equipment', 'visual-rapier'), n => n.tag === 'img').attributes.src, './assets/equipment/rapier.svg');
  assert.equal(h.dom['current-weapon-label'].textContent, h.state.equipment.weapon.name);
  assert.equal(h.calls.filter(c => c.action === 'equip').length, 1);
});
test('RPG inventory: inspection never checks a sale checkbox, including after filter re-render', async () => {
  const h = fullUI(fixture()), before = snap(h); await h.card('inventory', 'visual-club').click();
  h.dom['family-filter'].value = 'axe'; await h.dom['family-filter'].emit('change');
  assert.equal(h.run('selectedSaleIds.size'), 0);
  assert.match(collect(h.dom['item-detail']), /篩選外/);
  assert.equal(snap(h), before);
});
