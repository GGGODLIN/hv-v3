import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import * as engine from '../src/engine.js';
import * as session from '../src/session.js';
import * as loot from '../src/loot.js';

const js = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const collect = el => [el.textContent, ...el.children.map(collect)].filter(Boolean).join(' ');
const find = (el, predicate) => predicate(el) ? el : el.children.map(child => find(child, predicate)).find(Boolean);
// Synthetic UI fixture: public generation/investment APIs, not natural-play evidence.
function fixture() {
  const state = engine.createGame(71);
  state.hero.level = 16; state.wins = 1; state.hero.gold = 100000; state.soulFragments = 1000; state.worldSeeds = 1;
  const weapon = (family, id) => {
    const draws = [({ axe: 0, rapier: .4, club: .8 })[family], .6];
    return { ...loot.generateItem(() => draws.length ? draws.shift() : .5, 1, 'weapon'), id, locked: false };
  };
  state.inventory = [weapon('axe', 'loose-axe'), weapon('rapier', 'loose-rapier'),
    { ...weapon('club', 'locked-club'), locked: true },
    { ...clone(state.equipment.weapon), id: 'unknown-weapon', locked: false },
    { ...clone(state.equipment.armor), id: 'loose-armor', locked: false },
    { ...clone(state.equipment.accessory), id: 'loose-accessory', locked: false },
    weapon('rapier', 'bound-rapier'), weapon('rapier', 'iw-rapier')];
  for (const id of ['bound-rapier', 'iw-rapier']) engine.act(state, 'soulbindWeapon', engine.previewSoulbindWeapon(state, id));
  const quote = engine.previewItemWorld(state, 'iw-rapier'); assert.ok(quote.available);
  state.inventory[state.inventory.findIndex(item => item.id === 'iw-rapier')] = clone(quote.after);
  return engine.validateSave(state);
}
function fullUI(initial = fixture(), options = {}) {
  let document;
  function element(tag = 'div') {
    const listeners = new Map(), descendants = new Map();
    return { tag, className: '', textContent: '', children: [], hidden: false, disabled: false, open: false, value: '', dataset: {}, attributes: {},
      style: { setProperty() {} }, classList: { add() {}, remove() {}, toggle() {} },
      append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = children; },
      addEventListener(type, fn) { listeners.set(type, [...(listeners.get(type) || []), fn]); },
      async emit(type, event = {}) { for (const fn of listeners.get(type) || []) await fn({ target: this, ...event }); },
      // Invoke stale/disabled handlers too: the controller, not only HTML, guards consent.
      click() { return this.emit('click'); }, focus() { document.activeElement = this; },
      setAttribute(key, value) { this.attributes[key] = value; }, remove() {},
      querySelector(selector) {
        const child = selector.startsWith('.') && find(this, el => el.className.split(' ').includes(selector.slice(1)));
        if (child) return child;
        if (!descendants.has(selector)) descendants.set(selector, element()); return descendants.get(selector);
      },
      showModal() { this.open = true; }, close() { if (!this.open) return; this.open = false; this.emit('close'); },
      getBoundingClientRect() { return { width: 640, height: 360, left: 0, top: 0, right: 640, bottom: 360 }; }, getContext() { return {}; },
    };
  }
  const dom = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], element()]));
  const window = element('window'); document = element('document');
  Object.assign(document, { hidden: false, body: element('body'), activeElement: null, getElementById: id => dom[id], createElement: element,
    querySelectorAll: selector => selector === 'dialog' ? Object.entries(dom).filter(([id]) => id.endsWith('-dialog')).map(([, el]) => el) : [] });
  dom['slot-filter'].value = 'all'; dom['sort-select'].value = 'new'; dom['family-filter'].value = 'all'; dom['investment-filter'].value = 'all';
  for (const [id, value] of Object.entries(options.restoredFilters || {})) dom[id].value = value;
  window.matchMedia = () => ({ matches: true });
  const raw = JSON.stringify(initial), calls = [], faults = [], writes = [];
  let now = 0;
  const context = createContext({ ...engine, ...session, ...loot, JSON, window, document, location: { pathname: '/' },
    previewItemWorld: options.preview || engine.previewItemWorld,
    previewSelectedSale: (state, ids) => engine.previewSelectedSale(state, clone(ids)),
    act(state, action, payload) { calls.push({ action, payload: clone(payload ?? null) }); options.beforeAction?.(state, action); if (!options.noop) return engine.act(state, action, payload && typeof payload === 'object' ? clone(payload) : payload); return state; },
    performance: { now: () => now }, navigator: {}, crypto: { randomUUID: () => 'item-world-ui-test' },
    console: { warn() {}, error(...args) { faults.push(args); } }, confirm: () => true,
    localStorage: { getItem: key => key.endsWith('save-v3') ? raw : null, setItem: (...args) => writes.push(args) },
    setTimeout() { return 1; }, clearTimeout() {}, setInterval() { return 1; }, requestAnimationFrame() {}, ResizeObserver: class { observe() {} } });
  const run = source => runInContext(source, context); run(js.replace(/^import .+;\n/gm, ''));
  return { dom, window, document, calls, faults, writes, run, at(value) { assert.ok(value >= now); now = value; }, tick() { return run('pump.tick()'); }, get state() { return run('state'); },
    inspect(id) { run(`selectedSlot=null;selectedId=${JSON.stringify(id)};render(true);`); },
    render() { run('render(true);'); },
    async import(state) { const input = JSON.stringify(state); await dom['save-file'].emit('change', { target: { value: 'save.json', files: [{ size: input.length, text: async () => input }] } }); },
  };
}const ids = h => h.dom['inventory-list'].children.map(row => find(row, el => el.dataset.inventoryId)?.dataset.inventoryId).filter(Boolean);
async function filter(h, values) {
  for (const [key, value] of Object.entries(values)) {
    const id = ({ slot: 'slot-filter', family: 'family-filter', investment: 'investment-filter', sort: 'sort-select' })[key];
    h.dom[id].value = value; await h.dom[id].emit('change');
  }
}
const choose = (h, id) => h.run(`toggleSelectedSale(${JSON.stringify(id)},true);`);

test('workbench discloses backpack-only transient intersection and preserves default latest ordering', () => {
  const h = fullUI();
  assert.deepEqual(ids(h), Array.from(h.state.inventory, item => item.id).reverse());
  assert.match(h.dom['inventory-filter-status'].textContent, /背包顯示 8／8 件.*全部裝備.*已穿裝備另列/);
  assert.equal(h.dom['reset-inventory-filters'].disabled, true);
  for (const id of ['family-filter', 'investment-filter', 'inventory-filter-help', 'inventory-filter-status', 'reset-inventory-filters'])
    assert.equal([...html.matchAll(new RegExp(`id="${id}"`, 'g'))].length, 1, id);
  assert.match(html, /for="family-filter"/); assert.match(html, /for="investment-filter"/);
  for (const wording of ['條件同時符合', '只篩選背包', '接手進度恢復全部', '不自動選售或換裝', '已綁定・未升 IW', '未辨識武器']) assert.ok(html.includes(wording), wording);
  assert.match(css, /\.loot-workbench \.loot-tools[^}]*minmax\(0, 1fr\)/);
  assert.match(css, /\.loot-panel>\.loot-workbench[^}]*grid-column: 1/);
});

test('family uses recognized identity; unknown matches weapons only and filtering has no action/save mutation', async () => {
  const h = fullUI(), before = clone(h.state), writes = h.writes.length;
  const expected = { axe: ['loose-axe'], rapier: ['iw-rapier', 'bound-rapier', 'loose-rapier'], club: ['locked-club'], unknown: ['unknown-weapon'] };
  for (const [family, result] of Object.entries(expected)) { await filter(h, { family }); assert.deepEqual(ids(h), result); }
  await filter(h, { slot: 'armor', family: 'unknown' }); assert.deepEqual(ids(h), []);
  assert.deepEqual(clone(h.state), before); assert.equal(h.calls.length, 0); assert.equal(h.writes.length, writes);
});

test('investment states are exclusive and unrelated lock does not become permanent investment', async () => {
  const h = fullUI(); await filter(h, { investment: 'unbound' });
  assert.deepEqual(ids(h), ['loose-accessory', 'loose-armor', 'unknown-weapon', 'locked-club', 'loose-rapier', 'loose-axe']);
  await filter(h, { investment: 'bound' }); assert.deepEqual(ids(h), ['bound-rapier']);
  await filter(h, { investment: 'iw1' }); assert.deepEqual(ids(h), ['iw-rapier']);
  await filter(h, { slot: 'weapon', family: 'axe' }); assert.deepEqual(ids(h), []);
  assert.match(h.dom['inventory-filter-status'].textContent, /0／8.*武器.*戰斧.*IW1/);
});

test('empty reset restores criteria but not sorting or selections, and returns keyboard focus to slot filter', async () => {
  const h = fullUI(); choose(h, 'loose-axe'); h.inspect('loose-rapier');
  await filter(h, { slot: 'armor', family: 'rapier', investment: 'iw1', sort: 'level' });
  assert.match(collect(h.dom['inventory-list']), /背包中沒有同時符合.*已穿裝備不在背包/);
  const reset = find(h.dom['inventory-list'], el => el.tag === 'button'); assert.ok(reset); await reset.click();
  assert.deepEqual(clone(h.run('inventoryFilters()')), { slot: 'all', family: 'all', investment: 'all', quality: 'all', protection: 'all', name: '' });
  assert.equal(h.dom['sort-select'].value, 'level'); assert.equal(ids(h).length, 8);
  assert.equal(h.run('selectedId'), 'loose-rapier'); assert.deepEqual(clone(h.run('[...selectedSaleIds]')), ['loose-axe']);
  assert.equal(h.document.activeElement, h.dom['slot-filter']);
});

test('inspected item persists through filters with hidden-detail note; equipped inspection is not mislabeled', async () => {
  const h = fullUI(); h.inspect('loose-axe'); await filter(h, { family: 'rapier' });
  assert.equal(h.run('selectedId'), 'loose-axe'); assert.match(collect(h.dom['item-detail']), /位於背包篩選外.*選取仍保留/);
  await filter(h, { family: 'all' }); assert.doesNotMatch(collect(h.dom['item-detail']), /位於背包篩選外/);
  h.run("selectedId=null;selectedSlot='weapon';render(true);"); await filter(h, { investment: 'iw1' });
  assert.doesNotMatch(collect(h.dom['item-detail']), /位於背包篩選外/);
});

test('full exact-ID sale preview counts and marks choices hidden by family and investment filters', async () => {
  const h = fullUI(); choose(h, 'loose-axe'); choose(h, 'loose-rapier'); choose(h, 'loose-armor');
  await filter(h, { family: 'rapier' }); assert.match(h.dom['selected-sale-status'].textContent, /已選 3 件.*另有 2 件在目前篩選外/);
  await filter(h, { investment: 'bound' }); assert.match(h.dom['selected-sale-status'].textContent, /另有 3 件在目前篩選外/);
  h.run('openSelectedSale();'); assert.equal(h.dom['selected-sale-list'].children.length, 3);
  assert.match(h.dom['selected-sale-summary'].textContent, /含背包篩選外 3 件，已全部列出/);
  for (const row of h.dom['selected-sale-list'].children) assert.match(collect(row), /背包篩選外.*完整出售清單/);
  for (const id of ['loose-axe', 'loose-rapier', 'loose-armor']) assert.match(collect(h.dom['selected-sale-list']), new RegExp(`出售 ID：${id}`));
  assert.equal(h.calls.length, 0);
});

test('reviewed exact sale survives display change; repeated confirm cannot sell additional items', async () => {
  const h = fullUI(); choose(h, 'loose-axe'); choose(h, 'loose-armor'); await filter(h, { investment: 'iw1' }); h.run('openSelectedSale();');
  const quotedIds = clone(h.run('selectedSaleConsent.ids')), before = clone(h.state);
  await filter(h, { investment: 'all', family: 'rapier' }); assert.deepEqual(clone(h.run('selectedSaleConsent.ids')), quotedIds);
  h.run('confirmSelectedSale();confirmSelectedSale();');
  assert.deepEqual(Array.from(h.state.inventory, item => item.id), before.inventory.filter(item => !quotedIds.includes(item.id)).map(item => item.id));
  assert.equal(h.calls.filter(call => call.action === 'sellSelected').length, 1); assert.ok(h.state.inventory.find(item => item.id === 'loose-rapier'));
});

test('read-only and battle views still allow filters/reset without actions or state changes', async () => {
  for (const setup of ["tabOwner=false;", "state.mode='battle';"]) {
    const h = fullUI(); h.run(setup); const before = clone(h.state), writes = h.writes.length;
    await filter(h, { family: 'rapier', investment: 'iw1' }); assert.deepEqual(ids(h), ['iw-rapier']);
    await h.dom['reset-inventory-filters'].click(); assert.equal(ids(h).length, 8);
    assert.deepEqual(clone(h.state), before); assert.equal(h.calls.length, 0); assert.equal(h.writes.length, writes);
  }
});

test('commission delivery explicitly clears conflicting criteria and retains established weapon/latest reveal', async () => {
  const h = fullUI(); await filter(h, { slot: 'armor', family: 'club', investment: 'iw1', sort: 'power' });
  h.run("openWeaponCommission('rapier');confirmWeaponCommission();");
  assert.equal(h.calls.filter(call => call.action === 'commissionWeapon').length, 1);
  assert.deepEqual(clone(h.run('inventoryFilters()')), { slot: 'weapon', family: 'all', investment: 'all', quality: 'all', protection: 'all', name: '' });
  assert.equal(h.dom['sort-select'].value, 'new'); assert.equal(ids(h)[0], h.run('selectedId'));
  assert.match(h.dom['toast'].textContent, /已重設背包篩選.*武器／最新取得.*未自動裝備/);
});

test('live binding changes membership without losing inspected ID', async () => {
  const h = fullUI(); h.inspect('loose-rapier'); await filter(h, { investment: 'unbound' });
  h.run("act(state,'soulbindWeapon',previewSoulbindWeapon(state,'loose-rapier'));render();");
  assert.ok(!ids(h).includes('loose-rapier')); assert.equal(h.run('selectedId'), 'loose-rapier');
  assert.match(collect(h.dom['item-detail']), /位於背包篩選外/);
  await filter(h, { investment: 'bound' }); assert.ok(ids(h).includes('loose-rapier'));
});

test('filters never serialize and reload/import/adopted progress starts with all criteria', async () => {
  const h = fullUI(), before = clone(h.state); await filter(h, { family: 'rapier', investment: 'iw1' }); assert.deepEqual(clone(h.state), before);
  const reloaded = fullUI(clone(h.state)); assert.equal(ids(reloaded).length, 8);
  h.run('syncSelection();render(true);'); assert.deepEqual(clone(h.run('inventoryFilters()')), { slot: 'all', family: 'all', investment: 'all', quality: 'all', protection: 'all', name: '' });
  await filter(h, { family: 'rapier', investment: 'iw1' }); await h.import(fixture());
  assert.deepEqual(clone(h.run('inventoryFilters()')), { slot: 'all', family: 'all', investment: 'all', quality: 'all', protection: 'all', name: '' }); assert.equal(ids(h).length, 8);
});


test('startup explicitly resets browser-restored native filter values before acquiring a writer lock', () => {
  const h = fullUI(fixture(), { restoredFilters: { 'slot-filter': 'armor', 'family-filter': 'rapier', 'investment-filter': 'iw1' } });
  assert.deepEqual(clone(h.run('inventoryFilters()')), { slot: 'all', family: 'all', investment: 'all', quality: 'all', protection: 'all', name: '' });
  assert.equal(ids(h).length, 8); assert.equal(h.calls.length, 0);
});
