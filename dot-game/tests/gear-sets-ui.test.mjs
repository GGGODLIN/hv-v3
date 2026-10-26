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
function fixture() {
 const s=engine.createGame(29);s.inventory=[{...s.equipment.weapon,id:'second-weapon',locked:false,stats:{attack:35}},{...s.equipment.armor,id:'second-armor',locked:false,stats:{defense:25,hp:40,block:.2}},{...s.equipment.accessory,id:'second-accessory',locked:false,stats:{crit:.2}}];return s;
}
const changeGear=h=>h.run("dispatch('equip','second-weapon');dispatch('equip','second-armor');dispatch('equip','second-accessory');");
const saveA=h=>h.run("requestGearSet('a','save');");
const openApply=h=>h.run("requestGearSet('a','apply');");
const saved=h=>clone(h.state.gearSets);
const gearButton=(h,id,kind)=>h.dom['gear-set-choices'].children.find(c=>c.dataset.gearSetId===id).children.find(c=>c.className==='gear-set-actions').children.find(b=>b.dataset.gearSetAction===kind);

test('gear plans: three empty fixed plans; save current explicitly locks without copying',()=>{
 const h=fullUI(fixture()), before=h.state.inventory.length;
 assert.equal(h.dom['gear-set-choices'].children.length,3);assert.equal(gearButton(h,'a','apply').disabled,true);
 assert.match(collect(h.dom['gear-set-choices']),/鎖定並儲存目前配裝/);saveA(h);
 assert.equal(h.state.inventory.length,before);assert.deepEqual(saved(h).a,{weapon:'starter-weapon',armor:'starter-armor',accessory:'starter-accessory'});
 assert.ok(Object.values(h.state.equipment).every(i=>i.locked));assert.equal(h.dom['gear-set-dialog'].open,false);
 assert.match(h.dom['gear-set-feedback'].textContent,/已儲存/);assert.equal(h.faults.length,0);
});
test('gear plans: exact three-piece preview applies once, retains abilities/tactics/owned count',()=>{
 const s=fixture();engine.act(s,'learnAbility','hp-tank');engine.act(s,'slotAbility','hp-tank');
 const h=fullUI(s);saveA(h);changeGear(h);const count=h.state.inventory.length,abilities=clone(h.state.abilities),strategy=h.state.strategy;
 openApply(h);assert.equal(h.dom['gear-set-items'].children.length,3);const text=collect(h.dom['gear-set-items']);
 assert.match(text,/starter-weapon/);assert.match(text,/second-weapon/);assert.match(collect(h.dom['gear-set-stats']),/生命上限/);assert.match(collect(h.dom['gear-set-stats']),/條件反擊/);
 h.run('confirmGearSet();confirmGearSet();');assert.equal(h.state.equipment.weapon.id,'starter-weapon');assert.equal(h.state.inventory.length,count);
 assert.deepEqual(clone(h.state.abilities),abilities);assert.equal(h.state.strategy,strategy);assert.equal(h.calls.filter(c=>c.action==='applyGearSet').length,1);assert.equal(h.dom['gear-set-dialog'].open,false);
});
test('gear plans: overwrite and clear require exact separate consent; cancel preserves records',()=>{
 const h=fullUI(fixture());saveA(h);const old=saved(h);changeGear(h);
 h.run("requestGearSet('a','save');");assert.equal(h.dom['gear-set-dialog'].open,true);assert.deepEqual(saved(h),old);assert.match(h.dom['gear-set-summary'].textContent,/不會刪除或自動解鎖/);
 h.run('closeGearSetDialog();confirmGearSet();');assert.deepEqual(saved(h),old);
 h.run("requestGearSet('a','save');confirmGearSet();");assert.equal(saved(h).a.weapon,'second-weapon');assert.ok(h.state.inventory.find(i=>i.id==='starter-weapon').locked);
 h.run("requestGearSet('a','clear');");assert.ok(saved(h).a);h.run('closeGearSetDialog();confirmGearSet();');assert.ok(saved(h).a);
 h.run("requestGearSet('a','clear');confirmGearSet();confirmGearSet();");assert.equal(h.state.gearSets,undefined);assert.ok(Object.values(h.state.equipment).every(i=>i.locked));assert.equal(h.calls.filter(c=>c.action==='clearGearSet').length,1);
});
for(const mutation of ["state.inventory[0].name='changed';","state.hero.level++;","state.mode='battle';","tabOwner=false;","state.abilities={learned:['hp-tank'],slotted:[]};"]){
 test(`gear plans: stale consent ${mutation} cannot apply`,()=>{const h=fullUI(fixture());saveA(h);changeGear(h);openApply(h);h.run(mutation);const before=clone(h.state);h.run('render(true);confirmGearSet();');assert.deepEqual(clone(h.state),before);assert.equal(h.calls.filter(c=>c.action==='applyGearSet').length,0);assert.equal(h.dom['gear-set-confirm'].disabled,true);});
}
test('gear plans: old clicked controls cannot mutate battle or readonly state',()=>{
 const h=fullUI(fixture()), saveButton=gearButton(h,'a','save');h.run("state.mode='battle';render(true);");saveButton.click();assert.equal(h.state.gearSets,undefined);
 h.run("state.mode='town';tabOwner=false;render(true);");saveButton.click();assert.equal(h.state.gearSets,undefined);assert.ok(h.dom['gear-set-choices'].children.every(card=>card.children.find(c=>c.className==='gear-set-actions').children.every(b=>b.disabled)));
});
test('gear plans: referenced inventory disables unlock, singleton sale and selected-sale checkbox',()=>{
 const h=fullUI(fixture());saveA(h);changeGear(h);h.run("selectedId='starter-weapon';selectedSlot=null;render(true);");
 const actions=h.dom['item-detail'].children.find(c=>c.className==='detail-actions');assert.equal(actions.children[1].disabled,true);assert.equal(actions.children[1].textContent,'配裝保護中');assert.equal(actions.children[2].disabled,true);
 assert.match(collect(h.dom['item-detail']),/先清除或覆寫所有/);assert.equal(h.run("selectedSaleCheckboxes.get('starter-weapon').disabled"),true);
});
test('gear plans: missing reference gives no fabricated preview or mutation',()=>{
 const h=fullUI(fixture());saveA(h);changeGear(h);h.run("state.inventory=state.inventory.filter(i=>i.id!=='starter-weapon');render(true);");const before=clone(h.state);openApply(h);h.run('confirmGearSet();');assert.deepEqual(clone(h.state),before);assert.equal(h.calls.filter(c=>c.action==='applyGearSet').length,0);
});
test('gear plans: ownership resync and successful import clear consent',async()=>{
 const h=fullUI(fixture());saveA(h);changeGear(h);openApply(h);h.run('syncSelection();confirmGearSet();');assert.equal(h.dom['gear-set-dialog'].open,false);
 openApply(h);await h.import(engine.createGame(8));h.run('confirmGearSet();');assert.equal(h.dom['gear-set-dialog'].open,false);assert.equal(h.state.gearSets,undefined);assert.equal(h.calls.filter(c=>c.action==='applyGearSet').length,0);
});
test('gear plans: no-op engine cannot be reported as applied',()=>{
 const s=fixture();engine.act(s,'saveGearSet','a');engine.act(s,'equip','second-weapon');const h=fullUI(s,{noop:true});openApply(h);h.run('confirmGearSet();confirmGearSet();');assert.match(h.dom['gear-set-dialog-feedback'].textContent,/未確認完成/);assert.equal(h.calls.filter(c=>c.action==='applyGearSet').length,1);assert.equal(h.state.equipment.weapon.id,'second-weapon');
});
test('gear plans: filter/sort cannot replace IDs, no custom names or select-all; layout and lifecycle hooks',()=>{
 const h=fullUI(fixture());saveA(h);changeGear(h);h.dom['slot-filter'].value='armor';h.dom['sort-select'].value='power';h.render();openApply(h);assert.match(collect(h.dom['gear-set-items']),/starter-weapon/);h.run('confirmGearSet();');assert.equal(h.state.equipment.weapon.id,'starter-weapon');
 assert.match(js,/window.addEventListener\('pagehide', closeGearSetDialog\)/);assert.match(js,/window.addEventListener\('popstate', closeGearSetDialog\)/);assert.match(js,/\$\('import-save'\).addEventListener\('click', closeGearSetDialog\)/);assert.match(html,/autofocus>取消，不變更/);assert.match(css,/\.gear-set-choices \{ grid-template-columns: minmax\(0,1fr\);/);
});
test('gear plans: keyboard save retains the replacement button, unrelated rendering does not steal focus',()=>{
 const h=fullUI(fixture()), button=gearButton(h,'a','save');button.focus();button.click();assert.equal(h.document.activeElement,gearButton(h,'a','save'));
 h.dom['start-button'].focus();h.run("state.hero.level++;render(true);");assert.equal(h.document.activeElement,h.dom['start-button']);
});
test('gear plans: successful modal action returns focus to a usable button in that card',()=>{
 const h=fullUI(fixture());saveA(h);changeGear(h);openApply(h);h.dom['gear-set-confirm'].focus();h.run('confirmGearSet();');assert.equal(h.document.activeElement,gearButton(h,'a','save'));
 h.run("requestGearSet('a','clear');");h.dom['gear-set-confirm'].focus();h.run('confirmGearSet();');assert.equal(h.document.activeElement,gearButton(h,'a','save'));
});
