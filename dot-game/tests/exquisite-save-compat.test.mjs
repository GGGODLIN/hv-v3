import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createContext,runInContext} from 'node:vm';
import * as engine from './fixtures/v0.25/src/engine.js';
import * as session from './fixtures/v0.25/src/session.js';
import * as loot from './fixtures/v0.25/src/loot.js';
import * as currentEngine from '../src/engine.js';
import * as currentLoot from '../src/loot.js';
import {acquireNatural,trialNatural} from '../scripts/exquisite-item-world-measure.mjs';
const source=readFileSync(new URL('./fixtures/v0.25/src/ui.js',import.meta.url),'utf8');
const currentSource=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const html=readFileSync(new URL('./fixtures/v0.25/index.html',import.meta.url),'utf8');
const hash=x=>createHash('sha256').update(x).digest('hex');
const SAVE_KEY = 'hv-v3-dot-stable-save-v3';
const LOCK_NAME = 'hv-v3-dot-stable-writer-v3';
const settle = () => new Promise(resolve => setImmediate(resolve));
const copy = value => JSON.parse(JSON.stringify(value));

function element(tag = 'div') {
  const listeners = new Map(), descendants = new Map();
  return {
    tag, textContent: '', hidden: false, disabled: false, open: false, value: '', children: [], dataset: {},
    style: { setProperty() {} }, classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(type, listener) { listeners.set(type, [...(listeners.get(type) || []), listener]); },
    async emit(type, event = {}) { await Promise.all((listeners.get(type) || []).map(listener => listener({ target: this, ...event }))); },
    append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = children; },
    setAttribute() {}, remove() {}, click() { return this.emit('click'); },
    querySelector(selector) { if (!descendants.has(selector)) descendants.set(selector, element()); return descendants.get(selector); },
    showModal() { this.open = true; }, close() { if (this.open) { this.open = false; void this.emit('close'); } },
    getBoundingClientRect() { return { width: 640, height: 360, left: 0, top: 0, right: 640, bottom: 360 }; },
    getContext() { return {}; },
  };
}

// Run the entire production UI (only its ESM imports are injected), including
// initialization, actual storage/import/takeover listeners, timer, dispatcher,
// save/refresh functions and createOwnership/createPump. Only browser APIs are
// simulated. Storage events and lock completion are deliberately asynchronous.
function world(initialRaw = '{broken') {
  const storage = new Map(initialRaw === null ? [] : [[SAVE_KEY, initialRaw]]);
  const tabs = [], channels = [], held = new Map(), writes = [], storageEvents = [];
  let serial = 0;
  function tab(options = {}) {
    const id = `tab-${++serial}`, dom = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], element()]));
    dom['slot-filter'].value = 'all'; dom['sort-select'].value = 'new';
    const window = element('window'), document = element('document'), timers = [];
    Object.assign(document, { hidden: false, body: element('body'), getElementById: key => dom[key], createElement: element,
      querySelectorAll: selector => selector === 'dialog' ? Object.entries(dom).filter(([key]) => key.endsWith('-dialog')).map(([, value]) => value) : [] });
    window.matchMedia = () => ({ matches: true });
    let now = 0, confirmations = 0, failRead = Boolean(options.failRead), failWrite = false, saveReads = 0;
    const faults = [], context = createContext({
      ...(options.current ? currentEngine : engine), ...session, ...(options.current ? currentLoot : loot), JSON, window, document,
      location: { pathname: '/' }, performance: { now: () => now }, crypto: { randomUUID: () => id },
      console: { warn() {}, error(...args) { faults.push(args); } },
      confirm() { confirmations++; return options.confirm !== false; },
      setTimeout() { return 1; }, clearTimeout() {}, setInterval(callback) { timers.push(callback); return timers.length; },
      requestAnimationFrame() {}, ResizeObserver: class { observe() {} },
      navigator: { locks: options.unsupported ? undefined : { async request(name, options, callback) {
        assert.deepEqual(copy(options), { mode: 'exclusive', ifAvailable: true });
        if (held.has(name)) return callback(null);
        held.set(name, id);
        try { return await callback({ name }); } finally { held.delete(name); }
      } } },
      localStorage: {
        getItem(key) { if (key === SAVE_KEY) { saveReads++; if (failRead) throw Error('read denied'); } return storage.get(key) ?? null; },
        setItem(key, raw) {
          if (key === SAVE_KEY && failWrite) throw Error('write denied');
          const oldValue = storage.get(key) ?? null; storage.set(key, raw);
          if (key === SAVE_KEY) writes.push({ id, raw, lockHolder: held.get(LOCK_NAME) });
          if (raw !== oldValue) storageEvents.push({ from: id, key, oldValue, newValue: raw });
        },
      },
      BroadcastChannel: class {
        constructor(name) { this.name = name; this.id = id; channels.push(this); }
        postMessage(data) { for (const other of channels) if (other !== this && other.name === this.name) queueMicrotask(() => other.onmessage?.({ data })); }
      },
    });
    const run = code => runInContext(code, context);
    run((options.current ? currentSource : source).replace(/^import .+;\n/gm, ''));
    const result = {
      id, dom, window, document, faults, run,
      get state() { return run('state'); }, get protected() { return run('preventOverwrite'); },
      get owner() { return run('tabOwner'); }, get confirmations() { return confirmations; },
      get saveReads() { return saveReads; },
      set failRead(value) { failRead = value; }, set failWrite(value) { failWrite = value; },
      async import(raw) { await dom['save-file'].emit('change', { target: { value: 'selected.json', files: [{ size: raw.length, text: async () => raw }] } }); },
      tick(milliseconds = 250) { now += milliseconds; for (const callback of timers) callback(); },
      async close() { await window.emit('pagehide'); await settle(); },
      async takeover() { await dom['takeover-button'].emit('click'); await settle(); this.tick(); await settle(); },
    };
    tabs.push(result);
    return result;
  }
  return {
    storage, writes, tab,
    get raw() { return storage.get(SAVE_KEY) ?? null; },
    set raw(raw) { if (raw === null) storage.delete(SAVE_KEY); else storage.set(SAVE_KEY, raw); },
    async flush() {
      await settle();
      while (storageEvents.length) {
        const event = storageEvents.shift();
        for (const target of tabs) if (target.id !== event.from) await target.window.emit('storage', event);
      }
      await settle();
    },
    async close() { for (const target of tabs) await target.close(); },
  };
}



// Source-earned, portable input: not a private save or synthetic currency/gear.
function earnedPair(){
  const acquired=acquireNatural(42);assert.equal(acquired.status,'ready');const original=JSON.stringify(acquired.state),id=acquired.targetId;
  const current=currentEngine.validateSave(JSON.parse(original));const outcome=trialNatural(current,id);assert.equal(outcome.outcome,'win');return {original,raw:JSON.stringify(current),id};
}
test('v026 compatibility: all five v025 old reader/UI baseline files retain exact accepted bytes',()=>{
  const expected={'src/engine.js':'54dda1cf9982b4eab2336071d43cf398a1ad35fbe4397508f6fed5afedb5d974','src/loot.js':'8ca322c77ab265d88ebfdf1b64247e9170cbdd47fdb14f68b702903c368259cd','src/session.js':'821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a','src/ui.js':'9303c16d361ece0c2bec431ee1d16b2b5619326db1e30ff4099e6a08aed3436a','index.html':'9ce28d081f4d5db6e1130be6bb10bb2f43ef03fb0909e9f6ebd89e8802030c35'};
  for(const [file,sha] of Object.entries(expected))assert.equal(hash(readFileSync(new URL('./fixtures/v0.25/'+file,import.meta.url))),sha,file);
});
test('v026 compatibility: actual old v025 format3 reader rejects new ExquisiteIW1 and retains raw data',()=>{
  const {original,raw}=earnedPair();assert.doesNotThrow(()=>engine.validateSave(JSON.parse(original)));assert.equal(currentEngine.validateSave(JSON.parse(raw)).version,3);assert.throws(()=>engine.validateSave(JSON.parse(raw)));
  const loaded=session.loadVersionedSave({read:key=>key==='current'?raw:null,currentKey:'current',validate:engine.validateSave,create:()=>engine.createGame(1)});assert.equal(loaded.error,true);assert.equal(loaded.raw,raw);assert.equal(loaded.migrated,false);
});
test('v026 compatibility: old production UI startup/timer/forced-save/release cannot overwrite unsupported current data',async t=>{
  const {raw}=earnedPair(),w=world(raw),old=w.tab();t.after(()=>w.close());await w.flush();assert.equal(old.owner,true);assert.equal(old.protected,true);assert.equal(old.run('save(true)'),false);old.tick(5000);assert.equal(w.writes.length,0);assert.equal(w.raw,raw);await old.close();assert.equal(w.raw,raw);assert.deepEqual(old.faults,[]);
});
test('v026 compatibility: previously valid old follower revalidates at takeover and refuses import before confirmation',async t=>{
  const {original,raw,id}=earnedPair(),w=world(original),newer=w.tab({current:true}),follower=w.tab();t.after(()=>w.close());await w.flush();assert.equal(newer.owner,true);assert.equal(follower.owner,false);assert.equal(follower.protected,false);
  await newer.import(raw);await w.flush();assert.equal(newer.confirmations,1);const durable=w.raw;assert.equal(currentEngine.validateSave(JSON.parse(durable)).inventory.find(i=>i.id===id)?.itemWorld?.level??currentEngine.validateSave(JSON.parse(durable)).equipment.weapon.itemWorld?.level,1);
  const count=w.writes.length;await follower.takeover();await w.flush();assert.equal(follower.owner,true);assert.equal(follower.protected,true);assert.equal(follower.run('save(true)'),false);follower.tick(5000);assert.equal(w.raw,durable);assert.equal(w.writes.slice(count).filter(row=>row.id===follower.id).length,0);
  const confirmations=follower.confirmations;await follower.import(durable);assert.equal(follower.confirmations,confirmations);assert.equal(follower.protected,true);assert.equal(w.raw,durable);await follower.close();assert.equal(w.raw,durable);assert.deepEqual([...newer.faults,...follower.faults],[]);
});
