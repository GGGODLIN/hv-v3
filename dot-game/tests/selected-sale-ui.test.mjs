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
    querySelectorAll: selector => selector === 'dialog' ? Object.entries(dom).filter(([id]) => id.endsWith('-dialog')).map(([, el]) => el) : []});
  window.matchMedia = () => ({matches: true});
  let raw = JSON.stringify(initial), confirmations = 0, approve = true;
  const faults = [], writes = [], calls = [];
  const context = createContext({...engine, ...session, ...loot,
    previewSelectedSale: (state, ids) => engine.previewSelectedSale(state, JSON.parse(JSON.stringify(ids))), JSON, window, document, location: {pathname: '/'},
    act(state, action, payload) { calls.push({action, payload}); options.beforeAction?.(state, action, payload); if (!options.noop) return engine.act(state, action, payload && typeof payload === 'object' ? JSON.parse(JSON.stringify(payload)) : payload); return state; },
    performance: {now: () => 0}, navigator: {}, crypto: {randomUUID: () => 'ranked-abilities-ui-test'},
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

function fixture() {
  const s = engine.createGame(29);
  s.inventory = [
    {...s.equipment.weapon, id:'sale-first', locked:false},
    {...s.equipment.armor, id:'sale-second', locked:false},
    {...s.equipment.accessory, id:'keep-locked', locked:true},
  ]; return s;
}
const choose = (h, id) => h.run(`toggleSelectedSale(${JSON.stringify(id)}, true);`);

test('selected sale: no implicit selection, locked check disabled and separate from inspection button', () => {
  const h = fullUI(fixture());
  assert.match(h.dom['selected-sale-status'].textContent, /已選 0 件/);
  assert.equal(h.dom['review-selected-sale'].disabled, true);
  for (const row of h.dom['inventory-list'].children) {
    // v0.32 matches visual and reading order: inspect first, independently select sale second.
    assert.equal(row.tag, 'div'); assert.equal(row.children[0].tag, 'button');
    assert.equal(row.children[1].tag, 'label'); assert.equal(row.children[1].children[0].tag, 'input');
  }
  const lock = h.dom['inventory-list'].children.find(row => row.children[1].children[0].attributes['aria-label'].includes('keep-locked'));
  assert.equal(lock.children[1].children[0].disabled, true);
  choose(h, 'keep-locked'); assert.equal(h.run('selectedSaleIds.size'), 0);
});
test('selected sale: filter/sort preserve exact intent and disclose hidden selection', () => {
  const h = fullUI(fixture()); choose(h, 'sale-first'); choose(h, 'sale-second');
  h.dom['slot-filter'].value='weapon'; h.dom['sort-select'].value='power'; h.render();
  assert.match(h.dom['selected-sale-status'].textContent, /已選 2 件.*另有 1 件在目前篩選外/);
  h.run('openSelectedSale();');
  assert.equal(h.dom['selected-sale-list'].children.length,2);
  const text=collect(h.dom['selected-sale-list']);
  assert.match(text,/sale-first/); assert.match(text,/sale-second/);
  for(const stat of ['攻擊','防禦','生命','暴擊','閃避','格擋']) assert.ok(text.includes(stat));
  assert.match(text,/正值代表將出售/); assert.match(text,/不能只看評分/);
  assert.match(h.dom['selected-sale-feedback'].textContent,/也可能包含稀有或更強裝備/);
});
test('selected sale: exact confirmed items sell once without touching equipment or locked items', () => {
  const h=fullUI(fixture()), equipment=clone(h.state.equipment), gold=h.state.hero.gold;
  choose(h,'sale-first'); choose(h,'sale-second');
  const preview=engine.previewSelectedSale(h.state,['sale-first','sale-second']);
  h.run('openSelectedSale(); confirmSelectedSale(); confirmSelectedSale();');
  assert.deepEqual(clone(h.state.inventory.map(i=>i.id)),['keep-locked']);
  assert.deepEqual(clone(h.state.equipment),equipment); assert.equal(h.state.hero.gold,gold+preview.total);
  assert.equal(h.calls.filter(c=>c.action==='sellSelected').length,1);
  assert.equal(h.run('selectedSaleIds.size'),0); assert.equal(h.dom['selected-sale-dialog'].open,false);
  assert.equal(h.faults.length,0);
});
for(const cancel of ['closeSelectedSale();','clearSelectedSale();']) test(`selected sale: ${cancel} cancels consent without sale`,()=>{
  const h=fullUI(fixture());choose(h,'sale-first'); const before=clone(h.state);
  h.run(`openSelectedSale(); ${cancel} confirmSelectedSale();`);
  assert.deepEqual(clone(h.state),before);assert.equal(h.calls.length,0);
});
for(const mutation of ["state.hero.gold++;", "state.inventory[0].locked=true;", "state.inventory[0].stats={...state.inventory[0].stats, attack:999};", "state.equipment.weapon={...state.equipment.weapon, name:'changed'};", "state.mode='battle';", "tabOwner=false;"]) test(`selected sale: stale ${mutation} aborts whole consent`,()=>{
  const h=fullUI(fixture());choose(h,'sale-first');choose(h,'sale-second');h.run('openSelectedSale();');
  h.run(mutation); const before=clone(h.state);h.run('render(true);confirmSelectedSale();');
  assert.deepEqual(clone(h.state),before);assert.equal(h.calls.filter(c=>c.action==='sellSelected').length,0);
  assert.equal(h.dom['selected-sale-confirm'].disabled,true);
});
test('selected sale: repeated open cannot replace pending batch; cancelling preserves selection for deliberate review',()=>{
  const h=fullUI(fixture());choose(h,'sale-first');h.run('openSelectedSale();');const rows=h.dom['selected-sale-list'].children;
  choose(h,'sale-second'); h.run('openSelectedSale();'); assert.equal(h.dom['selected-sale-list'].children,rows);
  assert.equal(h.run('selectedSaleIds.size'),1);h.run('closeSelectedSale();');
  assert.equal(h.run('selectedSaleIds.size'),1);h.run('openSelectedSale();');assert.equal(h.dom['selected-sale-list'].children.length,1);
});
test('selected sale: takeover sync and successful import clear all transient intent',async()=>{
  const h=fullUI(fixture());choose(h,'sale-first');h.run('openSelectedSale();syncSelection();');
  assert.equal(h.run('selectedSaleIds.size'),0);assert.equal(h.dom['selected-sale-dialog'].open,false);
  choose(h,'sale-first'); await h.import(engine.createGame(8));
  assert.equal(h.run('selectedSaleIds.size'),0);assert.equal(h.calls.filter(c=>c.action==='sellSelected').length,0);
});
test('selected sale: lifecycle and import-start hooks cancel transient selection',()=>{
  assert.match(js,/window.addEventListener\('pagehide', clearSelectedSale\)/);
  assert.match(js,/window.addEventListener\('popstate', clearSelectedSale\)/);
  assert.match(js,/\$\('import-save'\).addEventListener\('click', clearSelectedSale\)/);
  assert.match(css,/inventory-entry/);assert.match(html,/autofocus>取消，保留裝備/);
});
test('selected sale: engine no-op is not reported as successful sale',()=>{
  const h=fullUI(fixture(),{noop:true});choose(h,'sale-first');const before=clone(h.state);
  h.run('openSelectedSale();confirmSelectedSale();confirmSelectedSale();');
  assert.deepEqual(clone(h.state),before);assert.equal(h.calls.length,1);
  assert.match(h.dom['selected-sale-feedback'].textContent,/未確認完成/);
});

test('selected sale: keyboard toggling restores checkbox focus without stealing unrelated focus',()=>{
  const h=fullUI(fixture());
  const check=h.run("selectedSaleCheckboxes.get('sale-first')");check.focus();check.checked=true;
  check.emit('change');assert.equal(h.document.activeElement,h.run("selectedSaleCheckboxes.get('sale-first')"));
  const unrelated=h.dom['start-button'];unrelated.focus();choose(h,'sale-second');assert.equal(h.document.activeElement,unrelated);
});
