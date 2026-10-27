import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as engine from '../src/engine.js';
import { createCommissionWeapon } from '../src/loot.js';
import { fullUI, clone, find, collect } from './helpers/comparison-focus-harness.mjs';

// Independent source/controller audit, not browser layout, real keyboard, or
// accessibility-tree acceptance. Controlled valid fixtures are not earned play.
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const all = element => [element, ...element.children.flatMap(all)];
const snapshot = h => ({ state: JSON.stringify(h.state), calls: clone(h.calls), writes: clone(h.writes) });
const critical = ['hp-label', 'mp-label', 'level-badge', 'mode-badge', 'save-status', 'tab-status', 'soul-fragment-balance', 'world-seed-balance', 'stage-select', 'start-button', 'heal-button', 'finish-camp-button', 'finish-camp-status', 'retreat-button', 'control-hint', 'slot-filter', 'equipment'];
// Unlike the shared focus harness, this oracle explicitly models CLOSED native
// details ancestry. It does not claim computed-CSS visibility or pixel geometry.
function presented(el) {
  if (!el?.isConnected) return false;
  for (let parent = el; parent; parent = parent.parentElement) {
    if (parent.hidden || parent.inert || (parent.tag === 'dialog' && !parent.open)) return false;
    if (parent.tag === 'details' && !parent.open) {
      const summary = parent.children.find(child => child.tag === 'summary');
      if (!summary?.contains(el)) return false;
    }
  }
  return true;
}
function exposed(h, ids = critical) { for (const id of ids) assert.ok(presented(h.dom[id]), `${id} must remain exposed outside closed disclosures/hidden panels`); }
function closeAllDetails(h) { for (const el of all(h.document).filter(el => el.tag === 'details')) el.open = false; }
function fixture() {
  const s = engine.createGame(42);
  s.hero.level = 8; s.soulFragments = 1000; s.worldSeeds = 3;
  s.inventory = [
    { ...createCommissionWeapon('rapier', 3, 'nimble'), id: 'audit-weapon', locked: false },
    { ...clone(s.equipment.armor), id: 'audit-armor', locked: false },
    { ...clone(s.equipment.accessory), id: 'audit-locked', locked: true },
  ];
  return engine.validateSave(s);
}

for (const mode of ['town', 'battle', 'defeat']) test(`scene-first audit: ${mode} exposes essentials with every details closed and each tool tab selected`, async () => {
  const h = fullUI(fixture());
  if (mode === 'battle') await h.dom['start-button'].click();
  if (mode === 'defeat') h.run("state.mode='defeat';state.hero.hp=0;render(true)");
  closeAllDetails(h);
  for (const name of ['gear', 'growth', 'battle']) {
    const before = snapshot(h); await h.dom[`camp-tab-${name}`].click();
    exposed(h); assert.deepEqual(snapshot(h), before);
    assert.ok(h.document.activeElement === h.dom[`camp-tab-${name}`]);
    assert.equal(h.dom[`camp-panel-${name}`].hidden, false);
  }
});

test('scene-first audit: readonly warning stays exposed and stale primary actions cannot mutate or save', async () => {
  const h = fullUI(fixture());
  // Controlled ownership boundary: the existing Web Locks result is not mocked
  // into a real lock. We exercise the renderer/dispatch guard after ownership loss.
  h.run('ownership.supported=true;tabOwner=false;ownershipStatus();render(true)'); closeAllDetails(h);
  exposed(h); assert.match(h.dom['save-status'].textContent, /唯讀.*不寫入/);
  assert.match(h.dom['tab-status'].textContent, /唯讀/);
  const before = snapshot(h);
  for (const id of ['start-button', 'heal-button', 'retreat-button', 'finish-camp-button']) {
    assert.equal(h.dom[id].disabled, true); await h.dom[id].emit('click');
  }
  assert.deepEqual(snapshot(h), before); assert.deepEqual(h.faults, []);
});

test('scene-first audit: rejected saved data remains protected and exposes a live warning rather than hiding it in tools', () => {
  const broken = fixture(); broken.version = 999;
  const h = fullUI(broken); closeAllDetails(h);
  assert.equal(h.run('preventOverwrite'), true);
  assert.match(h.run('loadProblem'), /原始資料尚未覆寫/);
  assert.ok(h.dom.notice.textContent.length > 0); assert.ok(presented(h.dom.notice));
  assert.equal(h.dom.notice.attributes.role, 'status');
  // Unsupported-lock fallback has its own warning; both conditions still block
  // writes. Do not call that fallback a supported-browser takeover test.
  const beforeWrites = clone(h.writes); h.run('save(true)');
  assert.deepEqual(clone(h.writes), beforeWrites);
  assert.equal(h.writes.filter(([key]) => key.endsWith('save-v3')).length, 0); exposed(h);
});

test('scene-first audit: complete native disclosure summaries and ARIA references resolve without nested interactive summaries', () => {
  const h = fullUI(fixture()), nodes = all(h.document);
  for (const details of nodes.filter(el => el.tag === 'details')) {
    assert.equal(details.children[0]?.tag, 'summary', 'summary is the first direct child');
    const summary = details.children[0];
    assert.ok(!all(summary).slice(1).some(el => ['button', 'select', 'input', 'a'].includes(el.tag)), 'summary must not nest another interactive control');
  }
  for (const [, content] of html.matchAll(/<summary\b[^>]*>([\s\S]*?)<\/summary>/g)) assert.ok(content.replace(/<[^>]+>/g, '').trim());
  for (const el of nodes) for (const key of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
    for (const id of (el.attributes[key] || '').split(/\s+/).filter(Boolean)) assert.equal(nodes.filter(node => node.id === id).length, 1, `${key}: ${id}`);
  }
});

test('scene-first audit: roving tab keyboard navigation keeps focus visible and never touches gameplay', async () => {
  const h = fullUI(fixture()); closeAllDetails(h); const before = snapshot(h);
  for (const [from, key, to] of [['battle', 'ArrowLeft', 'growth'], ['growth', 'Home', 'battle'], ['battle', 'End', 'growth'], ['growth', 'ArrowRight', 'battle'], ['battle', 'ArrowRight', 'gear']]) {
    let prevented = false;
    await h.dom[`camp-tab-${from}`].emit('keydown', { key, preventDefault() { prevented = true; } });
    assert.equal(prevented, true); assert.ok(h.document.activeElement === h.dom[`camp-tab-${to}`]);
    assert.ok(presented(h.document.activeElement));
    assert.equal(['battle', 'gear', 'growth'].filter(name => h.dom[`camp-tab-${name}`].tabIndex === 0).length, 1);
  }
  assert.deepEqual(snapshot(h), before); exposed(h);
});

test('scene-first audit: each equipped comparison stays exposed and repeated exact-ID focus survives collapsed secondary controls', async () => {
  const h = fullUI(fixture()); closeAllDetails(h); const before = snapshot(h);
  for (const item of Object.values(h.state.equipment)) for (let i = 0; i < 3; i++) {
    const old = h.card('equipment', item.id); assert.ok(presented(old)); old.focus(); await old.click();
    assert.equal(old.isConnected, false); assert.ok(h.document.activeElement === h.card('equipment', item.id));
    assert.ok(presented(h.document.activeElement));
  }
  assert.deepEqual(snapshot(h), before);
});

test('scene-first audit: item moving from backpack to equipped row follows exact identity without opening a secondary tab', async () => {
  const h = fullUI(fixture()); closeAllDetails(h);
  await h.dom['camp-tab-growth'].click(); const id = 'audit-weapon';
  const card = h.card('inventory', id); card.focus(); await card.click();
  h.run(`act(state,'equip',${JSON.stringify(id)});render(true)`);
  assert.equal(h.state.equipment.weapon.id, id);
  assert.ok(h.document.activeElement === h.card('equipment', id)); assert.ok(presented(h.document.activeElement));
  assert.equal(h.dom['camp-tab-growth'].attributes['aria-selected'], 'true');
});

test('scene-first audit: removed item fallback and filter-reset focus remain exposed with details closed', async () => {
  const h = fullUI(fixture()); closeAllDetails(h);
  h.card('inventory', 'audit-weapon').focus(); await h.card('inventory', 'audit-weapon').click();
  h.run("act(state,'sell','audit-weapon');render(true)");
  assert.ok(h.document.activeElement === h.dom['slot-filter']); assert.ok(presented(h.document.activeElement));
  h.dom['slot-filter'].value = 'armor'; h.render();
  h.dom['reset-inventory-filters'].focus(); await h.dom['reset-inventory-filters'].click();
  assert.equal(h.dom['slot-filter'].value, 'all'); assert.ok(h.document.activeElement === h.dom['slot-filter']); assert.ok(presented(h.document.activeElement));
});

test('scene-first audit: hidden selected-sale items stay disclosed beside the operation; cancel preserves all resources and returns focus', async () => {
  const h = fullUI(fixture()); closeAllDetails(h);
  h.run("toggleSelectedSale('audit-weapon',true);toggleSelectedSale('audit-armor',true)");
  h.dom['slot-filter'].value = 'weapon'; h.render();
  assert.ok(presented(h.dom['selected-sale-status'])); assert.match(h.dom['selected-sale-status'].textContent, /另有 1 件在目前篩選外/);
  const before = snapshot(h), opener = h.dom['review-selected-sale']; opener.focus(); await opener.click();
  assert.equal(h.dom['selected-sale-dialog'].open, true);
  for (const id of ['selected-sale-summary', 'selected-sale-feedback', 'selected-sale-list', 'selected-sale-confirm']) assert.ok(presented(h.dom[id]), id);
  assert.match(collect(h.dom['selected-sale-list']), /audit-weapon/); assert.match(collect(h.dom['selected-sale-list']), /audit-armor/);
  assert.match(h.dom['selected-sale-feedback'].textContent, /確認後無法買回/);
  h.run('closeSelectedSale();confirmSelectedSale()');
  assert.deepEqual(snapshot(h), before); assert.ok(h.document.activeElement === opener); assert.ok(presented(opener));
});

test('scene-first audit: ownership loss invalidates open selected-sale consent and leaves the reason visible in the open modal', async () => {
  const h = fullUI(fixture()); closeAllDetails(h);
  h.run("toggleSelectedSale('audit-weapon',true);openSelectedSale()");
  const before = snapshot(h); h.run('tabOwner=false;render(true);confirmSelectedSale()');
  assert.deepEqual(snapshot(h), before); assert.equal(h.dom['selected-sale-confirm'].disabled, true);
  assert.match(h.dom['selected-sale-feedback'].textContent, /已取消.*未出售任何裝備.*控制權/);
  assert.ok(presented(h.dom['selected-sale-feedback']));
});

test('scene-first audit: permanent binding quote keeps cost and irreversibility warning outside secondary disclosure and cancel spends nothing', async () => {
  const h = fullUI(fixture()); closeAllDetails(h); await h.card('inventory', 'audit-weapon').click();
  const opener = find(h.dom['item-detail'], el => el.dataset.soulbindId === 'audit-weapon'); assert.ok(presented(opener)); opener.focus();
  const before = snapshot(h); await opener.click();
  assert.equal(h.dom['soulbind-dialog'].open, true);
  for (const id of ['soulbind-cost', 'soulbind-warning', 'soulbind-feedback', 'soulbind-confirm']) assert.ok(presented(h.dom[id]), id);
  assert.match(h.dom['soulbind-cost'].textContent, /現有 1,000.*品質費用 100.*綁定後 900/);
  assert.match(h.dom['soulbind-feedback'].textContent, /尚未綁定或扣除碎片/);
  h.run('closeSoulbindWeapon();confirmSoulbindWeapon()');
  assert.deepEqual(snapshot(h), before); assert.ok(h.document.activeElement === opener); assert.ok(presented(opener));
});

test('scene-first audit: Item World quote and retreat loss warning remain exposed after paid entry with secondary disclosures closed', async () => {
  const s = fixture(); engine.act(s, 'soulbindWeapon', engine.previewSoulbindWeapon(s, 'audit-weapon'));
  const h = fullUI(s); closeAllDetails(h); await h.card('inventory', 'audit-weapon').click();
  const opener = find(h.dom['item-detail'], el => el.dataset.itemWorldId === 'audit-weapon'); opener.focus();
  const before = snapshot(h); await opener.click();
  for (const id of ['item-world-cost', 'item-world-warning', 'item-world-feedback', 'item-world-confirm']) assert.ok(presented(h.dom[id]), id);
  assert.deepEqual(snapshot(h), before); assert.match(h.dom['item-world-cost'].textContent, /現有 3.*入場費 1.*入場後 2/);
  await h.dom['item-world-confirm'].click();
  assert.equal(h.state.worldSeeds, 2); assert.equal(engine.itemWorldView(h.state).active, true);
  assert.ok(h.document.activeElement === h.dom['retreat-button']); assert.ok(presented(h.document.activeElement));
  assert.match(h.dom['finish-camp-status'].textContent, /撤退.*不獲 IW1.*種子不退還/); exposed(h);
});

test('scene-first audit: pending loot inspection and claim retain visible exact-ID focus without touching closed tools', async () => {
  const s = fixture(); s.pendingLoot = [{ ...clone(s.equipment.accessory), id: 'audit-pending', locked: false }];
  const h = fullUI(s); closeAllDetails(h); await h.dom['camp-tab-growth'].click();
  const old = h.card('pending', 'audit-pending'); assert.ok(presented(old)); old.focus(); await old.click();
  const before = snapshot(h); h.render(); assert.deepEqual(snapshot(h), before);
  h.run("act(state,'claimPending');render(true)");
  assert.ok(h.document.activeElement === h.card('inventory', 'audit-pending')); assert.ok(presented(h.document.activeElement));
  assert.equal(h.dom['pending-loot'].hidden, true); assert.equal(h.dom['camp-tab-growth'].attributes['aria-selected'], 'true');
});
