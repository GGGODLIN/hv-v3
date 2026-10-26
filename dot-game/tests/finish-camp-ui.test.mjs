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

test('native keyboard-accessible toggle exposes status and begins disabled in camp', () => {
  assert.match(html, /<button id="finish-camp-button"[^>]*type="button"[^>]*aria-pressed="false"[^>]*aria-describedby="finish-camp-status"/);
  assert.match(html, /id="finish-camp-status"[^>]*role="status"[^>]*aria-live="polite"/);
  // Native buttons provide Enter/Space activation. No keydown override or custom role.
  assert.doesNotMatch(js, /\$\('finish-camp-button'\)\.addEventListener\('key/);
  const h = fullUI();
  assert.equal(h.dom['finish-camp-button'].disabled, true);
  assert.equal(h.dom['finish-camp-button'].attributes['aria-pressed'], 'false');
});

test('live handler queues and cancels once without retreat or simulation reset', async () => {
  const h = fullUI();
  await h.dom['start-button'].click();
  h.at(249);
  await h.dom['finish-camp-button'].click();
  assert.equal(engine.finishThenCampView(h.state).queued, true);
  assert.equal(h.dom['finish-camp-button'].attributes['aria-pressed'], 'true');
  assert.match(h.dom['finish-camp-status'].textContent, /已預約.*獎勵結算/);
  assert.equal(h.state.mode, 'battle');
  h.at(250); assert.equal(h.tick(), .25, 'queuing must not reset combat time');
  await h.dom['finish-camp-button'].click();
  assert.equal(engine.finishThenCampView(h.state).queued, false);
  assert.equal(h.dom['finish-camp-button'].attributes['aria-pressed'], 'false');
  assert.match(h.dom['finish-camp-status'].textContent, /已取消/);
  assert.equal(h.faults.length, 0);
});

test('stale programmatic read-only, town and defeat activations cannot queue', async () => {
  const h = fullUI();
  await h.dom['finish-camp-button'].click();
  assert.equal(h.calls.filter(c => c.action === 'finishThenCamp').length, 0);
  await h.dom['start-button'].click();
  h.run('tabOwner=false;render(true)');
  const before = clone(h.state), count = h.calls.length;
  assert.equal(h.dom['finish-camp-button'].disabled, true);
  await h.dom['finish-camp-button'].click();
  assert.equal(h.calls.length, count);
  assert.deepEqual(clone(h.state), before);
  assert.equal(engine.finishThenCampView(h.state).queued, false);
  h.run("tabOwner=true;state.mode='defeat';render(true)");
  assert.equal(h.dom['finish-camp-button'].disabled, true);
  await h.dom['finish-camp-button'].click();
  assert.equal(h.calls.length, count);
  assert.equal(h.faults.length, 0);
});

test('ownership/reset synchronization clears intent while ordinary render preserves it', async () => {
  const h = fullUI(); await h.dom['start-button'].click(); await h.dom['finish-camp-button'].click();
  h.render(); h.render();
  assert.equal(engine.finishThenCampView(h.state).queued, true);
  h.run('tabOwner=false;syncSelection();render(true)');
  assert.equal(engine.finishThenCampView(h.state).queued, false);
  assert.equal(h.dom['finish-camp-button'].attributes['aria-pressed'], 'false');
  assert.equal(h.faults.length, 0);
});

test('intermission control returns camp without a second award and resets the pump', async () => {
  const h = fullUI(); await h.dom['start-button'].click();
  // Boundary fixture exercises the real already-settled lifecycle action.
  h.run("state._phase='intermission';state._rest=3;state.enemies=[];render(true)");
  const gold = h.state.hero.gold, wins = h.state.wins, seed = h.state.seed;
  assert.match(h.dom['finish-camp-button'].textContent, /立即回營/);
  h.at(249); await h.dom['finish-camp-button'].click();
  assert.equal(h.state.mode, 'town');
  assert.equal(h.state.hero.gold, gold); assert.equal(h.state.wins, wins); assert.equal(h.state.seed, seed);
  h.at(250); assert.equal(h.tick(), .001);
  assert.equal(h.dom['finish-camp-button'].disabled, true);
  assert.equal(h.faults.length, 0);
});

test('immediate retreat stays immediate and cancels queued intent', async () => {
  const h = fullUI(); await h.dom['start-button'].click(); await h.dom['finish-camp-button'].click();
  await h.dom['retreat-button'].click();
  assert.equal(h.state.mode, 'town'); assert.equal(engine.finishThenCampView(h.state).queued, false);
  assert.equal(h.state.wins, 0); assert.equal(h.faults.length, 0);
});

test('hiding battle through camp navigation preserves queued intent and normal ticks', async () => {
  const h = fullUI(); await h.dom['start-button'].click(); await h.dom['finish-camp-button'].click();
  await h.dom['camp-tab-gear'].click();
  assert.equal(h.dom['camp-panel-battle'].hidden, true);
  h.at(250); assert.equal(h.tick(), .25);
  assert.equal(engine.finishThenCampView(h.state).queued, true);
  await h.dom['camp-tab-battle'].click(); h.render();
  assert.equal(h.dom['finish-camp-button'].attributes['aria-pressed'], 'true');
  assert.equal(h.faults.length, 0);
});

test('real import and fresh UI reload do not retain a one-shot request', async () => {
  const h = fullUI(); await h.dom['start-button'].click(); await h.dom['finish-camp-button'].click();
  const exported = clone(h.state);
  const reloaded = fullUI(exported);
  assert.equal(engine.finishThenCampView(reloaded.state).queued, false);
  assert.equal(reloaded.state.mode, 'town');
  await h.import(exported);
  assert.equal(engine.finishThenCampView(h.state).queued, false);
  assert.equal(h.state.mode, 'town');
  assert.equal(h.dom['finish-camp-button'].attributes['aria-pressed'], 'false');
  assert.equal(h.faults.length, 0);
});
