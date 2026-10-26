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
const controllers = js.slice(js.indexOf('function abilityNumber('), js.indexOf('function commissionQuoteSignature('));
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
    querySelector: selector => { const match = selector.match(/^\[data-ability-id="([^"]+)"\]\[data-ability-action="([^"]+)"\]$/); if (!match) return null; return dom['ability-choices'].children.flatMap(card => card.children).flatMap(child => child.children).find(button => button.dataset.abilityId === match[1] && button.dataset.abilityAction === match[2]) || null; },
    querySelectorAll: selector => selector === 'dialog' ? Object.entries(dom).filter(([id]) => id.endsWith('-dialog')).map(([, el]) => el) : []});
  window.matchMedia = () => ({matches: true});
  let raw = JSON.stringify(initial), confirmations = 0, approve = true;
  const faults = [], writes = [], calls = [];
  const context = createContext({...engine, ...session, ...loot, JSON, window, document, location: {pathname: '/'},
    act(state, action, payload) { calls.push({action, payload}); options.beforeAction?.(state, action, payload); if (!options.noop) return engine.act(state, action, payload); return state; },
    performance: {now: () => 0}, navigator: {}, crypto: {randomUUID: () => 'ability-ui-test'},
    console: {warn() {}, error(...args) { faults.push(args); }}, confirm: () => { confirmations++; return approve; },
    localStorage: {getItem: key => key.endsWith('save-v3') ? raw : null, setItem: (...args) => writes.push(args)},
    setTimeout() {return 1;}, clearTimeout() {}, setInterval() {return 1;}, requestAnimationFrame() {}, ResizeObserver: class {observe() {}}});
  const run = code => runInContext(code, context);
  run(js.replace(/^import .+;\n/gm, ''));
  const card = id => dom['ability-choices'].children.find(entry => entry.dataset.abilityId === id);
  const button = (id, action) => card(id).children.find(entry => entry.className === 'ability-actions').children.find(entry => entry.dataset.abilityAction === action);
  return {dom, document, run, card, button, calls, faults, writes,
    get state() { return run('state'); }, get confirmations() { return confirmations; }, set approve(value) { approve = value; },
    render() { run('render(true);'); }, set saved(value) { raw = JSON.stringify(value); },
    async import(value) { const input = typeof value === 'string' ? value : JSON.stringify(value); await dom['save-file'].emit('change', {target: {value: 'save.json', files: [{size: input.length, text: async () => input}]}}); },
  };
}
function levelFixture(level = 4, proficiency = 2.4) { const state = engine.createGame(42); state.hero.level = level; state.hero.proficiency = proficiency; return state; }
async function learnAndSlot(h, id) { await h.button(id, 'learn').click(); await h.button(id, 'slot').click(); }

const summary = h => h.dom['growth-tab-summary'].textContent;
const snapshot = h => ({state: JSON.stringify(h.state), writes: clone(h.writes), calls: clone(h.calls)});
const assertUnchanged = (h, before) => assert.deepEqual(snapshot(h), before, 'discovery must not mutate state, dispatch an action, save, spend AP or draw RNG');

test('fresh growth summary reports only eligible choices, not AP as a claim of eligibility', () => {
  const h = fullUI();
  assert.equal(summary(h), '可學習 2');
  assert.match(h.dom['growth-summary'].textContent, /各項分別可負擔，不代表能同時全選/);
  assert.match(h.dom['growth-summary'].textContent, /可用 AP 1.*學習與裝配是分開的兩步/);
  assert.match(h.dom['growth-summary'].textContent, /Protection 於 Lv\.10 解鎖，不需 AP/);
  assert.equal(h.dom['growth-jump'].hidden, false);
  assert.equal(h.dom['growth-jump'].disabled, false);
  assert.deepEqual(h.calls, []);
});

test('a learned unallocated ability is advertised as pending slot even with zero remaining AP', async () => {
  const h = fullUI(); await h.button('hp-tank', 'learn').click();
  assert.equal(summary(h), '待裝配 1');
  assert.match(h.dom['growth-summary'].textContent, /可用 AP 0/);
  const before = snapshot(h); await h.dom['growth-jump'].click();
  assert.equal(h.document.activeElement, h.button('hp-tank', 'slot'));
  assert.equal(h.document.activeElement.tag, 'button');
  assertUnchanged(h, before);
  assert.deepEqual(clone(h.state.abilities.slotted), []);
});

test('shortcut focuses eligible learn without performing it, then pending slot ahead of other learn choices', async () => {
  const h = fullUI(levelFixture());
  let before = snapshot(h); await h.dom['growth-jump'].click();
  assert.equal(h.document.activeElement, h.button('hp-tank', 'learn')); assertUnchanged(h, before);
  await h.button('mp-tank', 'learn').click();
  assert.match(summary(h), /待裝配 1.*可學習 2/);
  before = snapshot(h); await h.dom['growth-jump'].click();
  assert.equal(h.document.activeElement, h.button('mp-tank', 'slot')); assertUnchanged(h, before);
});

test('eligible installed ranks are labeled upgrade and focus a separate native upgrade control', async () => {
  const h = fullUI(levelFixture(25));
  for (const id of ['hp-tank', 'mp-tank', 'one-handed-damage']) await learnAndSlot(h, id);
  assert.match(summary(h), /可升階/); assert.doesNotMatch(summary(h), /可學習|待裝配/);
  const first = engine.growthReadiness(h.state).choices[0];
  assert.equal(first.action, 'upgrade');
  const before = snapshot(h); await h.dom['growth-jump'].click();
  assert.equal(h.document.activeElement, h.button(first.id, 'upgrade')); assertUnchanged(h, before);
});

for (const mode of ['battle', 'defeat', 'readonly', 'inactive']) {
  test(`${mode} summary does not advertise executable growth or let stale shortcut move to an action`, async () => {
    const h = fullUI(levelFixture());
    h.dom['growth-jump'].focus();
    if (mode === 'readonly') h.run('tabOwner = false;');
    else if (mode === 'inactive') h.run('pageActive = false;');
    else h.state.mode = mode;
    const before = snapshot(h); await h.dom['growth-jump'].click(); h.render();
    assertUnchanged(h, before);
    assert.equal(h.dom['growth-jump'].hidden, true);
    assert.equal(h.dom['growth-jump'].disabled, true);
    assert.match(summary(h), mode === 'readonly' || mode === 'inactive' ? /唯讀/ : /回營/);
    assert.doesNotMatch(summary(h), /可學習|可升階|待裝配|護盾可選/);
    assert.equal(h.document.activeElement, h.dom['growth-jump']);
  });
}

test('zero available choices explains the actual gate and hides the jump control', async () => {
  const h = fullUI(); await learnAndSlot(h, 'hp-tank');
  assert.equal(summary(h), '暫無能力可配置');
  assert.match(h.dom['growth-summary'].textContent, /仍差 1 AP/);
  assert.equal(h.dom['growth-jump'].hidden, true);
  const before = snapshot(h); await h.dom['growth-jump'].click(); assertUnchanged(h, before);
});

test('Protection discovery remains optional; focusing its checkbox does not enable or cast it', async () => {
  const h = fullUI(levelFixture(10));
  // Spend the finite AP through the supported actions until no learn/slot/upgrade remains.
  for (let i = 0; i < 40; i++) {
    const first = engine.growthReadiness(h.state).choices[0];
    if (!first) break;
    await h.button(first.id, first.action).click();
  }
  assert.equal(engine.growthReadiness(h.state).choices.length, 0);
  assert.equal(summary(h), '護盾可選');
  assert.match(h.dom['growth-summary'].textContent, /不是必選強化/);
  const before = snapshot(h); await h.dom['growth-jump'].click();
  assert.equal(h.document.activeElement, h.dom['auto-protection']); assertUnchanged(h, before);
  assert.equal(engine.protectionView(h.state).enabled, false);
});

test('keyboard tabs keep discovery reachable while Enter and Space use native button behavior', async () => {
  const h = fullUI(), before = snapshot(h); let prevented = false;
  await h.dom['camp-tab-battle'].emit('keydown', {key: 'End', preventDefault() { prevented = true; }});
  assert.equal(prevented, true); assert.equal(h.dom['camp-panel-growth'].hidden, false);
  assert.equal(h.document.activeElement, h.dom['camp-tab-growth']);
  assert.equal(h.dom['camp-tab-growth'].attributes['aria-selected'], 'true');
  assert.match(html, /<button id="growth-jump" type="button"[^>]*>/);
  h.dom['growth-jump'].focus(); await h.dom['growth-jump'].click();
  assert.equal(h.document.activeElement, h.button('hp-tank', 'learn'));
  assertUnchanged(h, before);
});

test('polling summaries are not live regions and do not change allocations, focus, or action feedback', () => {
  const h = fullUI(levelFixture(10)), before = snapshot(h);
  h.dom['camp-tab-growth'].focus();
  const feedback = h.dom['ability-feedback'].textContent;
  for (let i = 0; i < 20; i++) h.render();
  assertUnchanged(h, before); assert.equal(h.document.activeElement, h.dom['camp-tab-growth']);
  assert.equal(h.dom['ability-feedback'].textContent, feedback);
  for (const id of ['growth-tab-summary', 'growth-summary']) {
    const tag = html.match(new RegExp(`<[^>]+id="${id}"[^>]*>`))?.[0];
    assert.ok(tag); assert.doesNotMatch(tag, /aria-live|role="(?:status|alert)"/);
  }
  const discovery = js.slice(js.indexOf('function renderGrowthReadiness()'), js.indexOf('function renderAbilities()'));
  assert.doesNotMatch(discovery, /\b(?:dispatch|act|save|advance|changeAbility)\s*\(|Math\.random|showModal/);
  assert.deepEqual(h.faults, []);
});

test('a stale shortcut recomputes the live first choice rather than following its old label', async () => {
  const h = fullUI();
  assert.match(h.dom['growth-jump'].textContent, /HP Tank.*可學習/);
  engine.act(h.state, 'learnAbility', 'mp-tank');
  // A shortcut activation between state adoption and a repaint cannot dispatch or focus a disabled old slot.
  h.dom['growth-jump'].focus();
  const before = snapshot(h); await h.dom['growth-jump'].click();
  assert.equal(h.document.activeElement, h.dom['growth-jump']); assertUnchanged(h, before);
  h.render(); await h.dom['growth-jump'].click();
  assert.equal(h.document.activeElement, h.button('mp-tank', 'slot')); assertUnchanged(h, before);
});
