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

const rowByLabel = (root, label) => root.children.find(row => row.children?.[0]?.textContent === label);
const previewGear = { currentStats: { attack: 80, maxHp: 600, maxMp: 20, mitigation: .2, crit: .1, evade: .05, block: .06, parry: .035 }, nextStats: { attack: 75, maxHp: 610, maxMp: 20, mitigation: .2, crit: .1, evade: .05, block: .06, parry: .1975 }, currentCounter: { eligible: true, chance: .3, maxPerTurn: 1 }, nextCounter: { eligible: true, chance: .3, maxPerTurn: 1 } };

test('parry UI distinguishes raw equipment rating from probability', () => {
 const h=fullUI();
 assert.equal(h.run("statNames.parry"),'招架值');
 assert.equal(h.run("rateStats.has('parry')"),false);
 h.run("renderPlayerParry({parry:.1975});");
 assert.equal(h.dom['stat-parry'].textContent,'19.75%');
 assert.match(html,/招架值合計除以 100/);assert.match(html,/基礎 3.5%/);assert.match(html,/最高 50%/);
 assert.match(html,/不是原版依攻擊者命中計算/);assert.match(html,/不是完全招架率/);
});
test('legacy rating absent is zero in item review, never retroactively invented', () => {
 const h=fullUI();
 const table=h.run("selectedSaleComparison({item:{stats:{attack:3}},currentEquipment:{stats:{attack:4}}})");
 const row=rowByLabel(table,'招架值');
 assert.equal(row.children[1].textContent,'0');assert.equal(row.children[2].textContent,'相同');
 assert.match(html,/舊裝備未列招架值時為 0，不會自動回填/);
});
test('selected-sale review lists raw rating and a numerical delta, not percent points',()=>{
 const h=fullUI();
 const table=h.run("selectedSaleComparison({item:{stats:{parry:14.325}},currentEquipment:{stats:{parry:10}}})");
 const row=rowByLabel(table,'招架值');
 assert.equal(row.children[1].textContent,'14.325');assert.equal(row.children[2].textContent,'+4.325');
 assert.doesNotMatch(collect(row),/%|百分/);assert.equal(table.children.length,7);
});
test('selected-sale review exposes lost parry even when selected gear has higher attack',()=>{
 const h=fullUI();
 const table=h.run("selectedSaleComparison({item:{stats:{attack:100}},currentEquipment:{stats:{attack:90,parry:12.5}}})");
 const row=rowByLabel(table,'招架值');assert.equal(row.children[2].textContent,'-12.5');assert.match(row.children[2].className,/negative/);
});
test('item detail preserves fractional rating and shows negative missing-stat comparisons',()=>{
 const h=fullUI();
 h.run("state.equipment.weapon.stats.parry=12.345; selectedSlot='weapon';selectedId=null;renderItemDetail();");
 let table=h.dom['item-detail'].children.find(row=>row.className==='compare-table');let row=rowByLabel(table,'招架值');
 assert.equal(row.children[1].textContent,'12.3');assert.equal(row.children[2].textContent,'—');
 h.run("state.inventory.push({...state.equipment.weapon,id:'old-no-parry',stats:{attack:99}});selectedSlot=null;selectedId='old-no-parry';renderItemDetail();");
 table=h.dom['item-detail'].children.find(row=>row.className==='compare-table');row=rowByLabel(table,'招架值');
 assert.equal(row.children[1].textContent,'12.3 → 0.0');assert.equal(row.children[2].textContent,'-12.345');assert.doesNotMatch(collect(row),/%/);
 assert.match(collect(h.dom['item-detail']),/招架值是裝備評級，不是機率百分比/);
});
test('preset preview shows final chance without changing conditional counter chance',()=>{
 const h=fullUI();h.run(`globalThis.parryPreview=${JSON.stringify(previewGear)}`);
 const table=h.run('gearSetComparison(parryPreview)');const row=rowByLabel(table,'招架判定率');
 assert.equal(row.children[1].textContent,'3.50% → 19.75%');
 assert.match(collect(table),/30.00%／回合最多 1 次 → 30.00%／回合最多 1 次/);
 assert.match(collect(table),/不是每次受擊機率/);
});
test('safe cleanup explains seven-stat dominance including raw rating',()=>{
 assert.match(html,/攻擊、防禦、生命、暴擊、閃避、格擋、招架值七項均不低/);
 assert.match(js,/同型的七項屬性均不低/);
 assert.doesNotMatch(html,/六項均不低|六項屬性比較/);
 assert.doesNotMatch(js,/同型的六項/);
});
test('commission compares seventh raw stat, while its fixed suffix remains Slaughter',()=>{
 const h=fullUI();h.run("state.wins=1;state.hero.gold=10000;openWeaponCommission('rapier');");
 assert.equal(h.dom['commission-dialog'].open,true);
 const row=rowByLabel(h.dom['commission-comparison'],'招架值');assert.ok(row);
 assert.doesNotMatch(collect(row),/%|百分點/);assert.equal(h.dom['commission-comparison'].children.length,8);
 assert.match(h.dom['commission-item-meta'].textContent,/屠戮（Slaughter）/);
 assert.match(html,/七項屬性比較/);
});
test('new suffix and compatibility explanation do not imply free retroactive upgrades',()=>{
 assert.match(html,/靈巧（Nimble）/);assert.match(html,/取代屠戮／平衡路線的加成/);assert.match(html,/不是同時疊加/);
 assert.match(html,/舊版無法理解新裝備招架欄位/);assert.match(html,/重新整理舊分頁再接手/);
 assert.match(html,/不保證更快通關/);
});
test('parry readout is separate, semantic and wrap-safe without crowding hero grid',()=>{
 assert.match(html,/class="player-parry" aria-label="角色招架判定率"/);assert.match(html,/id="stat-parry"/);
 assert.match(css,/\.player-parry \{[^}]*grid-column: 1 \/ -1;[^}]*min-width: 0;[^}]*overflow-wrap: anywhere/);
 assert.match(js,/renderPlayerParry\(derived\);/);
});

test('live legacy hero remains at 3.50% and merely rendering does not change held records',()=>{
 const s=engine.createGame(42),h=fullUI(s),before=clone(h.state);
 assert.equal(h.dom['stat-parry'].textContent,'3.50%');
 h.render();assert.deepEqual(clone(h.state),before);
 assert.ok(Object.values(h.state.equipment).every(item=>item.stats.parry===undefined));
});
test('actual newly commissioned rapier rating flows through equip, item view and final chance',()=>{
 const s=engine.createGame(42);s.wins=1;s.hero.gold=10000;
 const h=fullUI(s);h.run("openWeaponCommission('rapier');");
 const item=h.run('commissionConsent.item');assert.ok(item.stats.parry>0);
 let row=rowByLabel(h.dom['commission-comparison'],'招架值');
 assert.equal(row.children[1].textContent,Number(item.stats.parry.toFixed(4)).toLocaleString('zh-TW',{maximumFractionDigits:4}));
 assert.equal(row.children[2].textContent,'0');assert.doesNotMatch(collect(row),/%/);
 h.run("confirmWeaponCommission();dispatch('equip',state.inventory.at(-1).id);render(true);");
 assert.equal(h.dom['stat-parry'].textContent,`${(engine.stats(h.state).parry*100).toFixed(2)}%`);
 assert.notEqual(h.dom['stat-parry'].textContent,'3.50%');
 h.run("selectedSlot='weapon';selectedId=null;renderItemDetail();");
 row=rowByLabel(h.dom['item-detail'].children.find(el=>el.className==='compare-table'),'招架值');
 assert.equal(row.children[1].textContent,item.stats.parry.toFixed(1));assert.equal(h.faults.length,0);
});
