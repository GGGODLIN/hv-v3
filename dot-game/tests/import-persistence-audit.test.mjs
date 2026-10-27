import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import * as engine from '../src/engine.js';
import * as session from '../src/session.js';
import * as loot from '../src/loot.js';

const source = readFileSync(process.env.IMPORT_UI_SOURCE || new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
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
      ...engine, ...session, ...loot, JSON, window, document,
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
    run(source.replace(/^import .+;\n/gm, ''));
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



function journey(gold) { const value=engine.createGame(91);value.hero.gold=gold;return JSON.stringify(value); }
test('audit: failed import write leaves old durable save and accurately describes new memory',async t=>{
 const w=world(journey(10)),a=w.tab();t.after(()=>w.close());await w.flush();const before=w.raw;a.failWrite=true;
 await a.import(journey(99));
 assert.equal(a.state.hero.gold,99);assert.equal(w.raw,before);assert.equal(a.confirmations,1);
 assert.match(a.dom.toast.textContent,/此分頁/);assert.match(a.dom.toast.textContent,/尚未保存/);assert.match(a.dom.toast.textContent,/匯出/);
 assert.match(a.dom.notice.textContent,/無法寫入/);
});
test('audit: a fresh confirmed import can persist after temporary write failure resolves',async t=>{
 const w=world(journey(10)),a=w.tab();t.after(()=>w.close());await w.flush();a.failWrite=true;await a.import(journey(99));
 a.failWrite=false;await a.import(journey(101));
 assert.equal(a.state.hero.gold,101);assert.equal(JSON.parse(w.raw).hero.gold,101);assert.equal(a.confirmations,2);
 assert.match(a.dom.toast.textContent,/保存/);assert.doesNotMatch(a.dom.toast.textContent,/尚未保存/);assert.equal(a.dom.notice.hidden,true);
});
test('audit: declining replacement leaves memory and durable state untouched without success message',async t=>{
 const w=world(journey(10)),a=w.tab({confirm:false});t.after(()=>w.close());await w.flush();const before=w.raw,view=JSON.stringify(a.state);a.failWrite=true;
 await a.import(journey(99));assert.equal(w.raw,before);assert.equal(JSON.stringify(a.state),view);assert.equal(a.confirmations,1);assert.doesNotMatch(a.dom.toast.textContent,/已匯入|僅在此分頁載入/);
});
test('audit: a follower cannot import or receive persistence-success feedback',async t=>{
 const w=world(journey(10)),a=w.tab();t.after(()=>w.close());await w.flush();const b=w.tab();await w.flush();assert.equal(b.owner,false);const before=w.raw,view=JSON.stringify(b.state);
 await b.import(journey(99));assert.equal(w.raw,before);assert.equal(JSON.stringify(b.state),view);assert.equal(b.confirmations,0);assert.match(b.dom.toast.textContent,/未匯入/);
});
test('audit: compatibility mode imports only memory and explicitly prompts backup',async t=>{
 const w=world(journey(10)),a=w.tab({unsupported:true});t.after(()=>w.close());await w.flush();const before=w.raw;
 await a.import(journey(99));assert.equal(w.raw,before);assert.equal(a.state.hero.gold,99);assert.match(a.dom.toast.textContent,/尚未保存/);assert.match(a.dom.toast.textContent,/匯出備份/);
});
