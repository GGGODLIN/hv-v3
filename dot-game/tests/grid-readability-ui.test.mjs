import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGame, validateSave, act } from '../src/engine.js';
import { createCommissionWeapon, createSoulboundItem, createItemWorldUpgrade } from '../src/loot.js';
import { fullUI, clone, find, collect } from './helpers/comparison-focus-harness.mjs';

// Controlled source DOM fixtures and CSS arithmetic, not browser layout or an AT test.
const snapshot = h => JSON.stringify({ state: h.state, calls: h.calls, writes: h.writes });
const badge = card => find(card, node => node.className === 'comparison-marker');
function fixture() {
  const s = createGame(42);
  const base = family => ({ ...createCommissionWeapon(family, 1), id: `readable-${family}`, locked: false });
  s.inventory = [base('axe'), base('rapier'), base('club')];
  const bound = createSoulboundItem({ ...base('rapier'), id: 'readable-iw' }, 1);
  s.inventory.push(createItemWorldUpgrade(bound, 1));
  s.pendingLoot = [{ ...clone(s.inventory.at(-1)), id: 'readable-pending' }];
  return validateSave(s);
}
for (const [location, id] of [['inventory', 'readable-iw'], ['pending', 'readable-pending']]) {
  test(`${location} accessible card name retains family and visible IW1 investment metadata`, () => {
    const h = fullUI(fixture()), card = h.card(location, id);
    assert.match(collect(card), /IW1/);
    for (const text of ['刺劍', '靈魂綁定', '永久鎖定', '隨等級成長', 'IW1', '永久成長']) assert.ok(card.attributes['aria-label'].includes(text), text);
    if (location === 'pending') assert.match(card.attributes['aria-label'], /第 1 件待領.*ID：readable-pending.*僅查看比較/);
  });
}
test('inventory accessible name retains the visible gear-set protection and score marker', () => {
  const s = fixture();
  act(s, 'saveGearSet', 'a'); act(s, 'equip', 'readable-axe');
  s.inventory[s.inventory.findIndex(item => item.id === 'readable-club')] = { ...createCommissionWeapon('club', 20), id: 'readable-club', locked: false };
  const h = fullUI(s), protectedCard = h.card('inventory', 'starter-weapon');
  assert.match(collect(protectedCard), /配裝/);
  assert.match(protectedCard.attributes['aria-label'], /配裝保護/);
  const otherFamily = h.card('inventory', 'readable-club');
  assert.match(collect(otherFamily), /異路線/);
  assert.match(otherFamily.attributes['aria-label'], /異路線/);
});
for (const [location, target] of [['inventory', 'readable-axe'], ['pending', 'readable-pending'], ['equipment', 'starter-weapon']]) {
  test(`${location} comparison has a visible text badge independent of sale and retains exact focus`, async () => {
    const h = fullUI(fixture()), before = snapshot(h);
    assert.equal(badge(h.card(location, target)), undefined);
    for (let repeat = 0; repeat < 3; repeat++) {
      const card = h.card(location, target); card.focus(); await card.click();
      const replacement = h.card(location, target);
      assert.equal(badge(replacement)?.textContent, '比較中');
      assert.equal(replacement.attributes['aria-pressed'], 'true');
      assert.equal(h.document.activeElement, replacement);
      if (location !== 'equipment') assert.match(replacement.attributes['aria-label'], /比較中/);
      assert.equal(h.run('selectedSaleIds.size'), 0);
    }
    assert.equal(snapshot(h), before);
  });
}
test('comparison badge moves to the exact selected item without retaining the old badge', async () => {
  const h = fullUI(fixture()), before = snapshot(h);
  await h.card('inventory', 'readable-axe').click();
  await h.card('pending', 'readable-pending').click();
  assert.equal(badge(h.card('inventory', 'readable-axe')), undefined);
  assert.equal(badge(h.card('pending', 'readable-pending'))?.textContent, '比較中');
  await h.card('equipment', 'starter-weapon').click();
  assert.equal(badge(h.card('pending', 'readable-pending')), undefined);
  assert.equal(badge(h.card('equipment', 'starter-weapon'))?.textContent, '比較中');
  assert.equal(snapshot(h), before);
});
test('sale selection remains separate from comparison and filtering does not select another card', async () => {
  const h = fullUI(fixture()); await h.card('inventory', 'readable-axe').click();
  const check = find(h.card('inventory', 'readable-club').parentElement, el => el.tag === 'input');
  check.checked = true; await check.emit('change');
  assert.equal(badge(h.card('inventory', 'readable-club')), undefined);
  assert.equal(badge(h.card('inventory', 'readable-axe'))?.textContent, '比較中');
  h.dom['family-filter'].value = 'club'; await h.dom['family-filter'].emit('change');
  assert.equal(h.card('inventory', 'readable-axe'), undefined);
  assert.equal(badge(h.card('inventory', 'readable-club')), undefined);
  assert.equal(h.run("selectedSaleIds.has('readable-club')"), true);
  assert.match(collect(h.dom['item-detail']), /篩選外/);
});
test('read-only comparison retains visible and accessible selection without authorizing a sale', async () => {
  const h = fullUI(fixture()); h.run('tabOwner=false;render(true);'); const before = snapshot(h);
  await h.card('inventory', 'readable-iw').click();
  const card = h.card('inventory', 'readable-iw');
  assert.equal(badge(card)?.textContent, '比較中'); assert.match(card.attributes['aria-label'], /比較中/);
  assert.equal(find(card.parentElement, el => el.tag === 'input').disabled, true);
  assert.equal(snapshot(h), before);
});
test('focus outlines for scroll-contained comparison cards are fully inset by source arithmetic', () => {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  const match = css.match(/\.inventory-card:focus-visible,\s*\.pending-loot-card:focus-visible,\s*\.gear-button:focus-visible\s*\{([^}]+)\}/);
  assert.ok(match, 'explicit card rules must outrank the general button outline and pending rule');
  const width = Number(match[1].match(/outline:\s*(\d+)px\s+solid/)[1]);
  const offset = Number(match[1].match(/outline-offset:\s*(-?\d+)px/)[1]);
  assert.ok(width >= 2); assert.ok(width + offset <= 0, 'the ring must not require scrollport padding');
});
