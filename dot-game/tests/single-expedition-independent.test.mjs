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
    performance: {now: () => now}, navigator: options.navigator || {}, crypto: {randomUUID: () => 'ranked-abilities-ui-test'},
    console: {warn() {}, error(...args) { faults.push(args); }}, confirm: () => { confirmations++; return approve; },
    localStorage: {getItem: key => { if(options.storageThrows)throw Error('storage blocked');return key.endsWith('save-v3') ? raw : null; }, setItem: (...args) => {if(options.storageThrows)throw Error('storage blocked');writes.push(args);}},
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

// Independent v066 audit: existing explicit start + queue is the behavioral oracle.
for (const seed of [1, 29, 909]) for (const strategy of ['balanced','assault','sustain']) {
  test(`single expedition matches explicit start/queue through natural win: ${seed}/${strategy}`, () => {
    const a=engine.createGame(seed), b=engine.createGame(seed);
    a.strategy=b.strategy=strategy;
    engine.act(a,'startOnce'); engine.act(b,'start'); engine.act(b,'finishThenCamp',true);
    assert.equal(engine.finishThenCampView(a).queued,true);
    assert.deepEqual(a,b);
    for(let i=0;i<2400 && a.mode==='battle';i++) {
      engine.advance(a,.25); engine.advance(b,.25); assert.deepEqual(a,b);
    }
    assert.equal(a.mode,'town'); assert.equal(a.wins,1); assert.equal(a.worldSeeds,1);
    assert.equal(engine.finishThenCampView(a).queued,false);
    const done=clone(a); engine.advance(a,100); assert.deepEqual(a,done);
    assert.deepEqual(engine.expeditionReports(a),engine.expeditionReports(b));
  });
}
test('repeated and ordinary-fight startOnce do not restart, queue or change combat',()=>{
  const a=engine.createGame(5); engine.act(a,'startOnce'); engine.advance(a,.25);
  let before=clone(a); engine.act(a,'startOnce'); assert.deepEqual(a,before); assert.equal(engine.finishThenCampView(a).queued,true);
  engine.act(a,'finishThenCamp',false); before=clone(a); engine.act(a,'startOnce'); assert.deepEqual(a,before); assert.equal(engine.finishThenCampView(a).queued,false);
});
test('defeat and unsupported modes cannot single-start',()=>{
  for(const mode of ['defeat','paused']) {const a=engine.createGame(6);a.mode=mode; const before=clone(a);engine.act(a,'startOnce');assert.deepEqual(a,before);assert.equal(engine.finishThenCampView(a).queued,false);}
});
test('blocked departure does not leave latent reservation for later continuous start',()=>{
  for(const kind of ['pending','full']) {
    const a=engine.createGame(7);
    if(kind==='pending')a.pendingLoot=[{...a.equipment.weapon,id:'held'}];
    else a.inventory=Array.from({length:engine.INVENTORY_LIMIT-4},(_,i)=>({...a.equipment.weapon,id:`held-${i}`}));
    engine.act(a,'startOnce');assert.equal(a.mode,'town');assert.equal(engine.finishThenCampView(a).queued,false);
    a.inventory=[];a.pendingLoot=[];engine.act(a,'start');assert.equal(engine.finishThenCampView(a).queued,false);
  }
});
test('cancelled one-shot resumes normal repeated expeditions',()=>{
 const a=engine.createGame(8);engine.act(a,'startOnce');engine.act(a,'finishThenCamp',false);
 for(let i=0;i<2400&&a.wins<2;i++)engine.advance(a,.25);
 assert.equal(a.wins,2);assert.equal(a.mode,'battle');
});
test('saving single expedition does not persist reservation, loading returns camp',()=>{
 const a=engine.createGame(9);engine.act(a,'startOnce');
 const b=engine.validateSave(clone(a));assert.equal(b.mode,'town');assert.equal(engine.finishThenCampView(b).queued,false);
 engine.act(b,'start');assert.equal(engine.finishThenCampView(b).queued,false);
});
test('natural defeat clears one-shot reservation without granting win',()=>{
 const a=engine.createGame(11);a.stage=a.unlocked=30;engine.act(a,'startOnce');
 for(let i=0;i<2400&&a.mode==='battle';i++)engine.advance(a,.25);
 assert.equal(a.mode,'defeat');assert.equal(a.wins,0);assert.equal(engine.finishThenCampView(a).queued,false);
 engine.act(a,'retreat');a.stage=1;engine.act(a,'start');assert.equal(engine.finishThenCampView(a).queued,false);
});
test('UI single-start is native, queues synchronously, exposes cancel and preserves repeated-click time',async()=>{
 assert.match(html,/<button[^>]*id="start-once-button"/);
 const h=fullUI(); assert.equal(h.dom['start-once-button'].disabled,false);
 h.at(1000);await h.dom['start-once-button'].click();assert.equal(h.state.mode,'battle');assert.equal(engine.finishThenCampView(h.state).queued,true);
 assert.equal(h.dom['start-once-button'].disabled,true);assert.equal(h.dom['finish-camp-button'].attributes['aria-pressed'],'true');
 h.at(1249);await h.dom['start-once-button'].click();h.at(1250);assert.equal(h.tick(),.25);
 await h.dom['finish-camp-button'].click();assert.equal(engine.finishThenCampView(h.state).queued,false);assert.equal(h.faults.length,0);
});
test('UI read-only and stale defeat single-start do not mutate state',async()=>{
 const h=fullUI();h.run('tabOwner=false;render(true)');const before=clone(h.state);await h.dom['start-once-button'].click();assert.deepEqual(clone(h.state),before);assert.equal(h.calls.length,0);
 h.run("tabOwner=true;state.mode='defeat';render(true)");const defeated=clone(h.state);await h.dom['start-once-button'].click();assert.deepEqual(clone(h.state),defeated);assert.equal(engine.finishThenCampView(h.state).queued,false);assert.equal(h.faults.length,0);
});
test('UI pending/full departure disables both entry buttons and never queues',async()=>{
 for(const kind of ['pending','full']) {
  const a=engine.createGame(7);const h=fullUI(a);
  if(kind==='pending')h.state.pendingLoot=[{...h.state.equipment.weapon,id:'held'}];
  else h.state.inventory=Array.from({length:engine.INVENTORY_LIMIT-4},(_,i)=>({...h.state.equipment.weapon,id:`held-${i}`}));
  h.render();assert.equal(h.dom['start-button'].disabled,true);assert.equal(h.dom['start-once-button'].disabled,true);
  await h.dom['start-once-button'].click();assert.equal(h.state.mode,'town');assert.equal(engine.finishThenCampView(h.state).queued,false);assert.equal(h.faults.length,0);
 }
});

test('active Item World refuses engine and UI single-start without changing seed or trial',async()=>{
 const h=fullUI();h.state.worldSeeds=1;
 const target=loot.createSoulboundItem({...loot.createCommissionWeapon('rapier',1),id:'audit-iw'},1);
 h.state.inventory.push(target);const quote=engine.previewItemWorld(h.state,target.id);assert.equal(quote.available,true,quote.reason);
 engine.act(h.state,'enterItemWorld',quote);assert.equal(engine.itemWorldView(h.state).active,true);h.render();
 const before=clone(h.state);engine.act(h.state,'startOnce');await h.dom['start-once-button'].click();assert.deepEqual(clone(h.state),before);
 assert.equal(h.dom['start-once-button'].disabled,true);assert.equal(engine.finishThenCampView(h.state).queued,false);assert.equal(h.faults.length,0);
});
test('hidden or page-inactive controller refuses stale one-shot activation',async()=>{
 for(const code of ['document.hidden=true','pageActive=false']){const h=fullUI();h.run(code);const before=clone(h.state);await h.dom['start-once-button'].click();assert.deepEqual(clone(h.state),before);assert.equal(h.calls.length,0);}
});
test('unsupported-lock/storage-blocked compatibility stays foreground playable but never writes saves',async()=>{
 const h=fullUI(undefined,{storageThrows:true});await h.dom['start-once-button'].click();assert.equal(h.state.mode,'battle');assert.equal(engine.finishThenCampView(h.state).queued,true);
 assert.equal(h.writes.length,0);assert.equal(h.faults.length,0);assert.match(h.dom['tab-status'].textContent,/相容模式/);
});
test('supported lock not granted cannot start even before a rerender',async()=>{
 const h=fullUI(undefined,{navigator:{locks:{request:()=>new Promise(()=>{})}}});
 const before=clone(h.state);await h.dom['start-once-button'].click();assert.deepEqual(clone(h.state),before);assert.equal(h.calls.length,0);assert.equal(engine.finishThenCampView(h.state).queued,false);
});
