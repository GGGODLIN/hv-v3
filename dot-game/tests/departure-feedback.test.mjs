import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import * as engine from '../src/engine.js';
import * as session from '../src/session.js';
import * as loot from '../src/loot.js';

const js = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const collect = element => [element.textContent, ...element.children.map(collect)].filter(Boolean).join(' ');
function fullUI(initial = engine.createGame(42), options = {}) {
  let document;
  function element(tag = 'div') {
    const listeners = new Map(), descendants = new Map();
    return { tag, className: '', textContent: '', children: [], hidden: false, disabled: false, open: false, value: '', dataset: {}, attributes: {},
      style: { setProperty() {} }, classList: { add() {}, remove() {}, toggle() {} },
      append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = children; },
      addEventListener(type, listener) { listeners.set(type, [...(listeners.get(type) || []), listener]); },
      async emit(type, event = {}) { for (const listener of listeners.get(type) || []) await listener({target: this, ...event}); },
      // Deliberately invoke disabled/stale controls too: handlers must revalidate.
      click() { return this.emit('click'); }, focus() { document.activeElement = this; },
      setAttribute(key, value) { this.attributes[key] = value; }, remove() {},
      querySelector(selector) { if (!descendants.has(selector)) descendants.set(selector, element()); return descendants.get(selector); },
      showModal() { this.open = true; }, close() { this.open = false; },
      getBoundingClientRect() { return {width: 640, height: 360, left: 0, top: 0, right: 640, bottom: 360}; }, getContext() { return {}; },
    };
  }
  const dom = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], element()]));
  const window = element('window'); document = element('document');
  dom['slot-filter'].value = 'all'; dom['sort-select'].value = 'new';
  Object.assign(document, {hidden: false, body: element('body'), activeElement: null, getElementById: id => dom[id], createElement: element,
    querySelectorAll: selector => selector === 'dialog' ? Object.entries(dom).filter(([id]) => id.endsWith('-dialog')).map(([, el]) => el) : []});
  window.matchMedia = () => ({matches: true});
  let raw = JSON.stringify(initial), confirmations = 0, approve = true, now = 0;
  const tones = [];
  window.AudioContext = class {
    state = 'running'; currentTime = 0; destination = {};
    createOscillator() { return { frequency: { setValueAtTime(value) { tones.push(value); }, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  };
  const faults = [], writes = [], calls = [];
  const context = createContext({...engine, ...session, ...loot,
    previewSelectedSale: (state, ids) => engine.previewSelectedSale(state, JSON.parse(JSON.stringify(ids))), JSON, window, document, location: {pathname: '/'},
    act(state, action, payload) { calls.push({action, payload}); options.beforeAction?.(state, action, payload); if (!options.noop) return engine.act(state, action, payload && typeof payload === 'object' ? JSON.parse(JSON.stringify(payload)) : payload); return state; },
    performance: {now: () => now}, navigator: {}, crypto: {randomUUID: () => 'ranked-abilities-ui-test'},
    console: {warn() {}, error(...args) { faults.push(args); }}, confirm: () => { confirmations++; return approve; },
    localStorage: {getItem: key => key.endsWith('save-v3') ? raw : null, setItem: (...args) => writes.push(args)},
    setTimeout() {return 1;}, clearTimeout() {}, setInterval() {return 1;}, requestAnimationFrame() {}, ResizeObserver: class {observe() {}}});
  const run = code => runInContext(code, context);
  run(js.replace(/^import .+;\n/gm, ''));
  const card = id => dom['ability-choices'].children.find(entry => entry.dataset.abilityId === id);
  const button = (id, action) => card(id).children.find(entry => entry.className === 'ability-actions').children.find(entry => entry.dataset.abilityAction === action);
  return {dom, document, run, card, button, calls, faults, writes, tones,
    at(value) { assert.ok(value >= now); now = value; }, tick() { return run('pump.tick()'); },
    get state() { return run('state'); }, get confirmations() { return confirmations; }, set approve(value) { approve = value; },
    render() { run('render(true);'); }, set saved(value) { raw = JSON.stringify(value); },
    async import(value) { const input = typeof value === 'string' ? value : JSON.stringify(value); await dom['save-file'].emit('change', {target: {value: 'save.json', files: [{size: input.length, text: async () => input}]}}); },
  };
}

// These are deterministic boundary fixtures, not claimed naturally earned profiles.
// Production validation, rendering, click handlers, engine and pump are exercised.
function inventoryFixture(count) {
  const state = engine.createGame(42);
  state.inventory = Array.from({length: count}, (_, index) => ({...clone(state.equipment.armor), id: `capacity-${index}`, locked: false}));
  return state;
}

for (const count of [0, 114, 115, 116, 117, 120]) {
  test(`departure UI and engine agree with ${count} inventory items`, async () => {
    const h = fullUI(inventoryFixture(count));
    assert.equal(h.dom['start-button'].disabled, count > 115);
    const before = clone(h.state);
    h.run('departureReadiness()'); h.render();
    assert.deepEqual(clone(h.state), before, 'readiness and render are pure');
    if (count > 115) {
      assert.match(h.dom['control-hint'].textContent, new RegExp(`保留 5 格.*差 ${count - 115} 格`));
    } else assert.doesNotMatch(h.dom['control-hint'].textContent, /空位|待領/);
    await h.dom['start-button'].click(); // Exercise stale/programmatic disabled click too.
    assert.equal(h.state.mode, count > 115 ? 'town' : 'battle');
    assert.equal(h.faults.length, 0);
  });
}

test('pending loot takes precedence and blocks departure even with spare capacity', async () => {
  const h = fullUI(inventoryFixture(115));
  // Pending data can arise while already loaded; do not rely on loader FIFO refill.
  h.run("state.pendingLoot=[{...state.equipment.armor,id:'pending-capacity'}];render(true)");
  assert.equal(h.dom['start-button'].disabled, true);
  assert.match(h.dom['control-hint'].textContent, /1 件待領.*5 格/);
  await h.dom['start-button'].click();
  assert.equal(h.state.mode, 'town');
  assert.equal(h.state.pendingLoot.length, 1);
  assert.equal(h.faults.length, 0);
});

test('one-by-one real sales update deficit then enable start at exact threshold', async () => {
  const h = fullUI(inventoryFixture(117));
  h.run("dispatch('sell','capacity-0')");
  assert.equal(h.state.inventory.length, 116);
  assert.equal(h.dom['start-button'].disabled, true);
  assert.match(h.dom['control-hint'].textContent, /差 1 格/);
  h.run("dispatch('sell','capacity-1')");
  assert.equal(h.state.inventory.length, 115);
  assert.equal(h.dom['start-button'].disabled, false);
  assert.doesNotMatch(h.dom['control-hint'].textContent, /空位不足|差 \d 格/);
  await h.dom['start-button'].click();
  assert.equal(h.state.mode, 'battle');
});

test('a sale that refills pending loot does not falsely make a full bag ready', () => {
  const h = fullUI(inventoryFixture(120));
  h.run("state.pendingLoot=[{...state.equipment.armor,id:'pending-capacity'}];render(true)");
  h.run("dispatch('sell','capacity-0')");
  assert.equal(h.state.pendingLoot.length, 0);
  assert.equal(h.state.inventory.length, 120);
  assert.equal(h.dom['start-button'].disabled, true);
  assert.match(h.dom['control-hint'].textContent, /差 5 格/);
});

test('successful start alone emits win tone and resets the pump at the actual transition', async () => {
  const h = fullUI(inventoryFixture(115));
  await h.dom['sound-toggle'].click(); h.tones.length = 0;
  h.at(249); await h.dom['start-button'].click();
  assert.equal(h.state.mode, 'battle'); assert.deepEqual(h.tones, [530]);
  h.at(250); assert.equal(h.tick(), .001);
  assert.equal(h.state.battle.elapsed, .001);
  h.tones.length = 0;
  h.at(499); await h.dom['start-button'].click();
  assert.deepEqual(h.tones, [], 'repeated start is not a new success');
  h.at(500); assert.equal(h.tick(), .25);
  assert.equal(h.state.battle.elapsed, .251);
});

for (const reason of ['capacity', 'pending', 'readonly', 'no-op engine']) {
  test(`refused ${reason} start emits no tone and preserves the pump interval`, async () => {
    const h = fullUI(inventoryFixture(reason === 'capacity' ? 117 : 0), {noop: reason === 'no-op engine'});
    if (reason === 'pending') h.run("state.pendingLoot=[{...state.equipment.armor,id:'pending-capacity'}];render(true)");
    if (reason === 'readonly') h.run('tabOwner=false;render(true)');
    await h.dom['sound-toggle'].click(); h.tones.length = 0;
    h.at(249); await h.dom['start-button'].click();
    assert.equal(h.state.mode, 'town'); assert.deepEqual(h.tones, []);
    if (reason === 'readonly') h.run('tabOwner=true');
    h.at(250); assert.equal(h.tick(), .25, 'a refused start must not reset at 249ms');
    assert.equal(h.state.battle.elapsed, 0); assert.equal(h.state.timing.tu, 0);
    assert.equal(h.faults.length, 0);
  });
}

test('capacity readiness never overrides readonly, battle or defeat guards/hints', () => {
  const h = fullUI();
  h.run('tabOwner=false;render(true)'); assert.equal(h.dom['start-button'].disabled, true);
  h.run("tabOwner=true;state.mode='battle';render(true)");
  assert.equal(h.dom['start-button'].disabled, true); assert.match(h.dom['control-hint'].textContent, /自動重刷|自動推進/);
  h.run("state.mode='defeat';render(true)");
  assert.equal(h.dom['start-button'].disabled, true); assert.match(h.dom['control-hint'].textContent, /回營整備/);
});
