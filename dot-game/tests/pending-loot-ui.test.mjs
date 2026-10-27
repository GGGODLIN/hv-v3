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
// Synthetic supported-save boundaries; natural overflow has separate source-play evidence.
function queueFixture(count = 120, pendingCount = 2) {
  const s = engine.createGame(42);
  s.inventory = Array.from({length: count}, (_, i) => ({...clone(s.equipment.armor), id: `bag-${i}`, locked: false}));
  s.pendingLoot = Array.from({length: pendingCount}, (_, i) => ({...loot.createCommissionWeapon(i % 2 ? 'axe' : 'rapier', 1), id: `pending-${i}`, locked: false}));
  return engine.validateSave(s);
}
function fullUI(initial = queueFixture(), options = {}) {
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
}
const pendingIds = h => Array.from(h.dom['pending-loot-list'].children, el => el.dataset.pendingLootId);
const pendingCard = (h, id) => h.dom['pending-loot-list'].children.find(el => el.dataset.pendingLootId === id);
const detailButton = (h, text) => find(h.dom['item-detail'], el => el.tag === 'button' && el.textContent === text);

test('pending tray has native accessible controls, bounded layout and no extra storage claim', () => {
  for (const id of ['pending-loot','pending-loot-heading','pending-loot-summary','pending-loot-list','claim-pending','pending-loot-status'])
    assert.equal([...html.matchAll(new RegExp(`id="${id}"`, 'g'))].length, 1, id);
  assert.match(html, /id="pending-loot"[^>]*aria-labelledby="pending-loot-heading"[^>]*hidden/);
  assert.match(html, /id="claim-pending"[^>]*type="button"[^>]*aria-describedby="pending-loot-status"/);
  assert.match(css, /\.pending-loot\[hidden\]\s*\{ display: none/);
  assert.match(css, /\.pending-loot-list[^}]*max-height: 264px[^}]*overflow-y: auto/);
  assert.match(css, /\.pending-loot-card:focus-visible/);
  const h = fullUI(queueFixture(0,0));
  assert.equal(h.dom['pending-loot'].hidden, true); assert.equal(h.dom['claim-pending'].disabled, true);
  assert.equal(h.calls.length, 0);
});

test('full queue remains visible FIFO outside every backpack filter without count or sale pollution', async () => {
  const h = fullUI(), before = clone(h.state), writes = h.writes.length;
  h.dom['family-filter'].value='club'; h.dom['investment-filter'].value='iw1'; h.dom['sort-select'].value='power';
  h.render();
  assert.equal(h.dom['pending-loot'].hidden, false); assert.deepEqual(pendingIds(h), ['pending-0','pending-1']);
  assert.match(h.dom['pending-loot-summary'].textContent, /待領 2 件.*背包 120／120 件.*空位 0 格/);
  assert.match(h.dom['inventory-filter-status'].textContent, /背包顯示 0／120 件/);
  assert.match(h.dom['pending-loot-status'].textContent, /出售會自動依序補入待領品.*共需自行整理 7 件/);
  assert.equal(h.dom['claim-pending'].disabled, true); assert.equal(h.dom['start-button'].disabled,true);
  assert.equal(find(h.dom['pending-loot-list'], el => el.tag === 'input'), undefined);
  await h.dom['claim-pending'].click();
  assert.deepEqual(clone(h.state),before);assert.equal(h.calls.length,0);assert.equal(h.writes.length,writes);
});

test('pending inspection uses exact identity and existing comparison but offers no mutating item controls', async () => {
  const h=fullUI(),before=clone(h.state);const card=pendingCard(h,'pending-0');
  card.focus();await card.click();
  assert.equal(h.run('selectedId'),'pending-0');assert.equal(h.document.activeElement.dataset.pendingLootId,'pending-0');
  assert.equal(pendingCard(h,'pending-0').attributes['aria-pressed'],'true');
  assert.match(collect(h.dom['item-detail']),/待領戰利品.*ID：pending-0/);
  assert.match(collect(h.dom['item-detail']),/招架值.*待領裝備只供比較.*不能換裝、鎖定、出售、綁定或挑戰/);
  assert.equal(find(h.dom['item-detail'],el=>el.tag==='button'),undefined);
  assert.equal(h.run('selectedSaleIds.size'),0);assert.deepEqual(clone(h.state),before);assert.equal(h.calls.length,0);
});

test('claim transfers FIFO only, preserves selected identity and filtered-detail truth, no automatic selection', async () => {
  const h=fullUI(queueFixture(113,2));h.dom['family-filter'].value='club';h.render();
  await pendingCard(h,'pending-1').click();const before=clone(h.state),original=clone(h.state.pendingLoot[1]);
  assert.match(h.dom['pending-loot-status'].textContent,/領完後已保留出戰所需 5 格空位/);
  await h.dom['claim-pending'].click();
  assert.deepEqual(Array.from(h.state.inventory.slice(-2),i=>i.id),['pending-0','pending-1']);
  assert.equal(h.state.pendingLoot.length,0);assert.equal(h.state.inventory.length,115);
  assert.deepEqual(clone(h.state.inventory.at(-1)),original);assert.deepEqual(clone(h.state.hero),before.hero);assert.equal(h.state.seed,before.seed);
  assert.equal(h.run('selectedId'),'pending-1');assert.match(collect(h.dom['item-detail']),/位於背包篩選外/);
  assert.doesNotMatch(collect(h.dom['item-detail']),/待領戰利品|待領裝備只供比較/);
  assert.ok(detailButton(h,'換上裝備'));assert.equal(detailButton(h,'換上裝備').disabled,false);
  assert.equal(h.document.activeElement.className,'detail-name');assert.equal(h.dom['pending-loot'].hidden,true);
  assert.equal(h.dom['start-button'].disabled,false);assert.equal(h.run('selectedSaleIds.size'),0);
  assert.equal(h.calls.filter(c=>c.action==='claimPending').length,1);
  const after=clone(h.state);await h.dom['claim-pending'].click();assert.deepEqual(clone(h.state),after);assert.equal(h.calls.filter(c=>c.action==='claimPending').length,1);
});

test('partial claim fills free capacity without bypassing order or choosing/equipping items', async () => {
  const h=fullUI(queueFixture(119,3)),before=clone(h.state);
  assert.match(h.dom['claim-pending'].textContent,/領入背包 1 件/);await h.dom['claim-pending'].click();
  assert.deepEqual(pendingIds(h),['pending-1','pending-2']);assert.equal(h.state.inventory.at(-1).id,'pending-0');
  assert.equal(h.run('selectedId'),null);assert.equal(h.run('selectedSlot'),null);assert.deepEqual(clone(h.state.equipment),before.equipment);
  assert.equal(h.dom['claim-pending'].disabled,true);assert.equal(h.dom['start-button'].disabled,true);
  assert.match(h.dom['toast'].textContent,/已依序領入 1 件.*尚有 2 件待領.*沒有出售、換裝/);
});

test('all-claimed queue without inspection restores focus to an existing visible filter without selecting gear', async () => {
  const h=fullUI(queueFixture(2,1));h.dom['claim-pending'].focus();await h.dom['claim-pending'].click();
  assert.equal(h.document.activeElement,h.dom['slot-filter']);assert.equal(h.run('selectedId'),null);assert.equal(h.run('selectedSlot'),null);
});

test('read-only battle and defeat permit pending comparison but reject stale claim clicks', async () => {
  for(const setup of ['tabOwner=false;',"state.mode='battle';","state.mode='defeat';"]){
    const h=fullUI(queueFixture(2,1));h.run(setup);h.render();const before=clone(h.state),calls=h.calls.length;
    assert.equal(h.dom['claim-pending'].disabled,true);await pendingCard(h,'pending-0').click();await h.dom['claim-pending'].click();
    assert.match(collect(h.dom['item-detail']),/待領戰利品/);assert.deepEqual(clone(h.state),before);assert.equal(h.calls.length,calls);
    assert.equal(find(h.dom['item-detail'],el=>el.tag==='button'),undefined);
  }
});

test('no-op or newly full engine action never fabricates successful claim feedback', async () => {
  for(const options of [{noop:true},{beforeAction(s,action){if(action==='claimPending')while(s.inventory.length<120)s.inventory.push({...clone(s.equipment.armor),id:`late-${s.inventory.length}`});}}]){
    const h=fullUI(queueFixture(2,1),options);await h.dom['claim-pending'].click();
    assert.equal(h.state.pendingLoot.length,1);assert.doesNotMatch(h.dom['toast'].textContent,/已依序領入/);assert.equal(h.run('selectedId'),null);
  }
});

test('a claim invalidates visible selected-sale consent without changing selected IDs or selling anything', async () => {
  const h=fullUI(queueFixture(2,1));h.run("toggleSelectedSale('bag-0',true);openSelectedSale();");
  assert.equal(h.dom['selected-sale-dialog'].open,true);const gold=h.state.hero.gold;
  await h.dom['claim-pending'].click();
  assert.equal(h.run('selectedSaleConsent'),null);assert.equal(h.dom['selected-sale-confirm'].disabled,true);
  h.run('confirmSelectedSale();');assert.equal(h.state.hero.gold,gold);assert.ok(h.state.inventory.some(i=>i.id==='bag-0'));
  assert.deepEqual(clone(h.run('[...selectedSaleIds]')),['bag-0']);assert.equal(h.calls.filter(c=>c.action==='sellSelected').length,0);
});

test('existing reviewed sale auto-refills pending and preserves inspected identity outside filters', async () => {
  const h=fullUI(queueFixture(120,1));await pendingCard(h,'pending-0').click();
  h.dom['family-filter'].value='club';h.render();h.run("toggleSelectedSale('bag-0',true);openSelectedSale();");
  assert.match(h.dom['selected-sale-summary'].textContent,/含背包篩選外 1 件/);h.run('confirmSelectedSale();');
  assert.equal(h.state.pendingLoot.length,0);assert.equal(h.state.inventory.length,120);assert.equal(h.state.inventory.at(-1).id,'pending-0');
  assert.equal(h.run('selectedId'),'pending-0');assert.match(collect(h.dom['item-detail']),/位於背包篩選外/);
  assert.doesNotMatch(collect(h.dom['item-detail']),/待領裝備只供比較/);assert.equal(h.dom['start-button'].disabled,true);
  assert.equal(h.calls.filter(c=>c.action==='sellSelected').length,1);
});

test('reload and import preserve pending identity bytes but do not carry sale or inspection intent across missing IDs', async () => {
  const initial=queueFixture(115,2),h=fullUI(initial);await pendingCard(h,'pending-1').click();
  h.run("toggleSelectedSale('bag-0',true);");await h.import(queueFixture(3,0));
  assert.equal(h.run('selectedId'),null);assert.equal(h.run('selectedSaleIds.size'),0);assert.equal(h.dom['pending-loot'].hidden,true);
  const loaded=fullUI(initial);assert.deepEqual(clone(loaded.state.pendingLoot),initial.pendingLoot);assert.equal(loaded.run('selectedId'),null);
  assert.equal(loaded.state.inventory.length,115);assert.equal(loaded.dom['start-button'].disabled,true);
});

test('pending changes alone refresh the queue and read-only repeated renders preserve every game byte', () => {
  const h=fullUI(queueFixture(120,1));h.run("state.pendingLoot.push({...state.pendingLoot[0],id:'pending-new'});render();");
  assert.deepEqual(pendingIds(h),['pending-0','pending-new']);const before=clone(h.state),calls=h.calls.length;
  for(let i=0;i<8;i++)h.render();assert.deepEqual(clone(h.state),before);assert.equal(h.calls.length,calls);
  assert.equal(h.faults.length,0);
});

test('pagehide between rendered button and click is rechecked by dispatcher before moving items', async () => {
  const h=fullUI(queueFixture(3,1));assert.equal(h.dom['claim-pending'].disabled,false);
  const before=clone(h.state);await h.window.emit('pagehide');await h.dom['claim-pending'].click();
  assert.deepEqual(clone(h.state),before);assert.equal(h.calls.filter(c=>c.action==='claimPending').length,0);
  assert.match(h.dom['toast'].textContent,/唯讀/);assert.doesNotMatch(h.dom['toast'].textContent,/已依序領入/);
});

test('pending soulbound IW1 and legacy missing-parry items are inspection-only without inventing metadata', async () => {
  const s=queueFixture(120,0),base=loot.createCommissionWeapon('rapier',1),bound=loot.createSoulboundItem({...base,id:'bound-pending'},1);
  assert.ok(bound);const invested=loot.createItemWorldUpgrade(bound,1);assert.ok(invested);
  const legacy={...loot.createCommissionWeapon('rapier',1),id:'legacy-pending'};delete legacy.stats.parry;delete legacy.rolls.parry;
  s.pendingLoot=[invested,legacy];const h=fullUI(engine.validateSave(s)),before=clone(h.state);
  await pendingCard(h,'bound-pending').click();assert.match(collect(h.dom['item-detail']),/IW1.*領入背包後才可換裝/);
  assert.equal(find(h.dom['item-detail'],el=>el.tag==='button'),undefined);
  await pendingCard(h,'legacy-pending').click();assert.equal(Object.hasOwn(h.state.pendingLoot[1].stats,'parry'),false);
  assert.deepEqual(clone(h.state),before);assert.equal(h.calls.length,0);
});
