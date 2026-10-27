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
  let raw = JSON.stringify(initial), confirmations = 0, approve = true;
  const faults = [], writes = [], calls = [];
  const context = createContext({...engine, ...session, ...loot,
    previewSelectedSale: (state, ids) => engine.previewSelectedSale(state, JSON.parse(JSON.stringify(ids))), JSON, window, document, location: {pathname: '/'},
    act(state, action, payload) { calls.push({action, payload}); options.beforeAction?.(state, action, payload); if (!options.noop) return engine.act(state, action, payload && typeof payload === 'object' ? JSON.parse(JSON.stringify(payload)) : payload); return state; },
    performance: {now: () => 0}, navigator: {}, crypto: {randomUUID: () => 'gear-set-context-ui-test'},
    console: {warn() {}, error(...args) { faults.push(args); }}, confirm: () => { confirmations++; return approve; },
    localStorage: {getItem: key => key.endsWith('save-v3') ? raw : null, setItem: (...args) => writes.push(args)},
    setTimeout() {return 1;}, clearTimeout() {}, setInterval() {return 1;}, requestAnimationFrame() {}, ResizeObserver: class {observe() {}}});
  const run = code => runInContext(code, context);
  run(js.replace(/^import .+;\n/gm, ''));
  const card = id => dom['ability-choices'].children.find(entry => entry.dataset.abilityId === id);
  const button = (id, action) => card(id).children.find(entry => entry.className === 'ability-actions').children.find(entry => entry.dataset.abilityAction === action);
  return {dom, document, window, run, card, button, calls, faults, writes,
    get state() { return run('state'); }, get confirmations() { return confirmations; }, set approve(value) { approve = value; },
    render() { run('render(true);'); }, set saved(value) { raw = JSON.stringify(value); },
    async import(value) { const input = typeof value === 'string' ? value : JSON.stringify(value); await dom['save-file'].emit('change', {target: {value: 'save.json', files: [{size: input.length, text: async () => input}]}}); },
  };
}

// Explicit controlled fixtures, not earned gameplay evidence. Every ability and
// preset change below still uses its supported action or full UI controller.
function fixture(level = 30) {
  const s = engine.createGame(29); s.hero.level = level;
  s.inventory = [{...s.equipment.weapon, id:'second-weapon', locked:false, stats:{attack:35}}];
  return s;
}
function prepared(initial = fixture()) {
  const h = fullUI(initial);
  h.run("requestGearSet('a','save'); dispatch('equip','second-weapon');");
  return h;
}
const open = h => h.run("requestGearSet('a','apply');");
const currentContext = h => h.dom['gear-set-stats'].children.find(child => child.className.includes('gear-set-retained-context'));
const text = h => collect(currentContext(h));
const snapshot = h => ({state: JSON.stringify(h.state), calls: clone(h.calls), writes: clone(h.writes)});
const retained = s => ({strategy:s.strategy,targetPriority:s.targetPriority,autoProtection:s.autoProtection,emergencySupply:s.emergencySupply,abilities:clone(s.abilities || null),seed:s.seed,gold:s.hero.gold,soulFragments:s.soulFragments,worldSeeds:s.worldSeeds,potions:s.potions});

test('gear-only preview identifies CURRENT retained settings rather than the settings at preset save', () => {
  const s=fixture(); engine.act(s,'learnAbility','hp-tank'); engine.act(s,'slotAbility','hp-tank');
  const h=prepared(s), stored=JSON.stringify(h.state.gearSets);
  h.run("dispatch('setStrategy','assault'); dispatch('targetPriority','caster'); dispatch('autoProtection',true); dispatch('setEmergencySupply',true); dispatch('upgradeAbility','hp-tank'); dispatch('learnAbility','mp-tank'); dispatch('upgradeAbility','mp-tank');");
  const before=snapshot(h); open(h);
  assert.deepEqual(snapshot(h),before,'preview must not dispatch, save, roll, spend AP or alter any game state');
  assert.equal(JSON.stringify(h.state.gearSets),stored);
  const context=text(h);
  for(const expected of ['目前設定 · 套用後維持','不是配裝方案儲存的內容','目前戰術：猛攻','目前政策：施法者優先 · Protection ON','政策不代表護盾已生效','額外緊急補給 ON','HP Tank · Rank 2 · ID：hp-tank','學會但未裝配的能力不生效']) assert.ok(context.includes(expected),expected);
  assert.doesNotMatch(context,/MP Tank/,'learned unslotted rank2 must not be described as active');
  assert.equal(currentContext(h).tag,'section'); assert.equal(h.faults.length,0);
});

test('fresh low-level preview spells out default policies, no equipped ability, and locked Protection', () => {
  const h=prepared(fixture(1)),before=snapshot(h); open(h);
  const context=text(h);
  assert.match(context,/目前戰術：均衡/); assert.match(context,/目前政策：依序集火 · Protection OFF/);
  assert.match(context,/Protection 尚未解鎖（Lv\.10）.*目前不能施放/);
  assert.match(context,/額外緊急補給 OFF.*均衡／猛攻維持手動喝藥/);
  assert.match(context,/已裝配能力：無/); assert.deepEqual(snapshot(h),before);
});

for(const enabled of [false,true]) test(`Sustain keeps its independent potion rule when extra preference is ${enabled}`, () => {
  const h=prepared(); h.run(`dispatch('setStrategy','sustain'); dispatch('setEmergencySupply',${enabled});`);
  const before=snapshot(h); open(h);
  assert.match(text(h),/目前戰術：持久/);
  assert.ok(text(h).includes(`額外緊急補給 ${enabled?'ON':'OFF'}`));
  assert.match(text(h),/目前為持久：額外緊急補給開關不生效.*規則仍獨立運作，可以用最後 1 瓶/);
  assert.deepEqual(snapshot(h),before);
});

for(const [action,payload,label] of [
  ['setStrategy','assault','目前戰術：猛攻'],
  ['targetPriority','weakest','目前政策：低血量收尾'],
  ['autoProtection',true,'Protection ON'],
  ['setEmergencySupply',true,'額外緊急補給 ON']
]) test(`changed displayed ${action} cancels prior consent before any gear action`, () => {
  const h=prepared(); open(h); const oldText=text(h);
  h.run(`dispatch(${JSON.stringify(action)},${JSON.stringify(payload)});`);
  const before=snapshot(h); h.run('confirmGearSet(); confirmGearSet();');
  assert.deepEqual(snapshot(h),before); assert.equal(h.dom['gear-set-confirm'].disabled,true);
  assert.match(h.dom['gear-set-dialog-feedback'].textContent,/確認已取消/);
  assert.equal(text(h),oldText,'a canceled preview stays a snapshot, not a silently changing quote');
  assert.equal(h.calls.filter(call=>call.action==='applyGearSet').length,0);
  h.run('closeGearSetDialog();'); open(h); assert.ok(text(h).includes(label));
  assert.equal(h.dom['gear-set-confirm'].disabled,false);
});

test('preview/cancel/repeat do not mutate; actual confirmation changes only gear and does not replay settings', () => {
  const s=fixture(); engine.act(s,'learnAbility','hp-tank'); engine.act(s,'slotAbility','hp-tank');
  const h=prepared(s); h.run("dispatch('setStrategy','assault'); dispatch('targetPriority','caster'); dispatch('autoProtection',true); dispatch('setEmergencySupply',true);");
  const before=snapshot(h),settings=retained(h.state),ids=Object.keys(h.state.gearSets.a).sort();
  for(let i=0;i<3;i++){ open(h); open(h); h.run('closeGearSetDialog(); confirmGearSet();'); }
  assert.deepEqual(snapshot(h),before); assert.deepEqual(ids,['accessory','armor','weapon']);
  open(h); h.run('confirmGearSet(); confirmGearSet();');
  assert.equal(h.state.equipment.weapon.id,'starter-weapon');
  assert.deepEqual(retained(h.state),settings); assert.equal(h.dom['gear-set-dialog'].open,false);
  assert.equal(h.calls.filter(call=>call.action==='applyGearSet').length,1);
});

test('ownership loss invalidates displayed context and import cannot reuse a prior gear consent', async () => {
  const h=prepared(); open(h); h.run('tabOwner=false; render(true);');
  const before=snapshot(h); h.run('confirmGearSet();'); assert.deepEqual(snapshot(h),before);
  assert.equal(h.dom['gear-set-confirm'].disabled,true);
  h.run('tabOwner=true; syncSelection();'); assert.equal(h.dom['gear-set-dialog'].open,false);
  open(h); await h.import(engine.createGame(9)); const imported=snapshot(h); h.run('confirmGearSet();');
  assert.deepEqual(snapshot(h),imported); assert.equal(h.state.gearSets,undefined);
  assert.equal(h.dom['gear-set-dialog'].open,false); assert.equal(h.calls.filter(call=>call.action==='applyGearSet').length,0);
});

for(const event of ['popstate','pagehide']) test(`${event} closes context without applying an old preview`, async () => {
  const h=prepared(); open(h); const before=JSON.stringify(h.state); await h.window.emit(event);
  h.run('confirmGearSet();'); assert.equal(h.dom['gear-set-dialog'].open,false);
  assert.equal(JSON.stringify(h.state),before); assert.equal(h.calls.filter(call=>call.action==='applyGearSet').length,0);
});

test('overwrite and clear do not show stale apply-only current-context content', () => {
  const h=prepared(); open(h); assert.ok(currentContext(h)); h.run('closeGearSetDialog();');
  for(const kind of ['save','clear']){ h.run(`requestGearSet('a',${JSON.stringify(kind)});`); assert.equal(h.dom['gear-set-stats'].children.length,0); h.run('closeGearSetDialog();'); }
});

test('context rerender never steals unrelated focus or substitutes report history for current settings', () => {
  const h=prepared(); open(h); h.dom['gear-set-confirm'].focus(); const before=snapshot(h);
  h.run('render(true); render(true);'); assert.deepEqual(snapshot(h),before);
  assert.equal(h.document.activeElement,h.dom['gear-set-confirm']);
  assert.match(text(h),/目前設定/); assert.doesNotMatch(text(h),/出發配置詳情/);
});
