import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import * as engine from '../src/engine.js';
import * as session from '../src/session.js';
import * as loot from '../src/loot.js';

const source = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
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

function progress(state) {
  return copy({ seed: state.seed, hero: { level: state.hero.level, xp: state.hero.xp, gold: state.hero.gold },
    wins: state.wins, kills: state.kills, stage: state.stage, unlocked: state.unlocked, equipment: state.equipment,
    inventory: state.inventory, pendingLoot: state.pendingLoot, strategy: state.strategy, autoSell: state.autoSell });
}
async function repairedPair(t) {
  const w = world(), a = w.tab(), b = w.tab(); t.after(() => w.close()); await w.flush();
  assert.equal(a.owner, true); assert.equal(b.owner, false);
  assert.equal(a.protected, true); assert.equal(b.protected, true); assert.equal(w.raw, '{broken');
  const restored = engine.createGame(42); restored.hero.gold = 123;
  await a.import(JSON.stringify(restored)); await w.flush();
  assert.equal(a.confirmations, 1); assert.equal(a.protected, false); assert.equal(b.state.hero.gold, 123);
  assert.equal(b.protected, true, 'a follower notification alone never authorizes overwrite');
  assert.equal(b.run('lastSavedRaw'), w.raw, 'the repair was already adopted before takeover');
  assert.equal(w.writes.length, 1); assert.equal(w.writes[0].lockHolder, a.id);
  return { w, a, b };
}

test('repaired save → real takeover → natural play/equip/replay → durable reload retains earned progress', async t => {
  const { w, a, b } = await repairedPair(t), beforeReads = b.saveReads;
  await b.takeover(); await w.flush();
  assert.equal(a.owner, false); assert.equal(b.owner, true);
  assert.ok(b.saveReads > beforeReads, 'takeover actually rereads durable storage');
  assert.equal(b.protected, false, 'freshly validated repair clears the old protection');
  assert.equal(b.dom.notice.hidden, true, 'the now-recovered load warning is removed');
  assert.equal(b.state.hero.gold, 123);
  await b.dom['start-button'].emit('click');
  for (let ticks = 0; ticks < 2000 && b.state.wins < 1 && b.state.mode === 'battle'; ticks++) b.tick();
  assert.equal(b.state.wins, 1); assert.ok(b.state.inventory.length > 0); assert.ok(b.state.hero.gold > 123);
  await b.dom['retreat-button'].emit('click');
  const item = b.state.inventory[0]; b.run(`dispatch('equip', ${JSON.stringify(item.id)})`);
  assert.equal(b.state.equipment[item.slot].id, item.id);
  await b.dom['start-button'].emit('click');
  for (let ticks = 0; ticks < 2000 && b.state.wins < 2 && b.state.mode === 'battle'; ticks++) b.tick();
  assert.equal(b.state.wins, 2); await b.dom['retreat-button'].emit('click');
  const earned = progress(b.state); assert.deepEqual(progress(engine.validateSave(JSON.parse(w.raw))), earned);
  await b.close(); const reloaded = w.tab(); await w.flush();
  assert.deepEqual(progress(reloaded.state), earned); assert.equal(reloaded.protected, false);
  assert.equal(reloaded.state.mode, 'town'); assert.equal(reloaded.state.equipment[item.slot].id, item.id);
  assert.ok(w.writes.every(write => write.lockHolder === write.id), 'all saves occurred under the real ownership controller');
  assert.deepEqual([...a.faults, ...b.faults, ...reloaded.faults], []);
});

for (const badRaw of ['{broken again', '', 'null', JSON.stringify({ ...engine.createGame(42), inventory: [{ ...engine.createGame(42).equipment.weapon, id: 'unknown', futureTrait: true }] })]) {
  test(`repaired follower cannot overwrite current invalid durable bytes on takeover: ${badRaw.slice(0, 25)}`, async t => {
    const { w, a, b } = await repairedPair(t);
    await a.close(); await w.flush(); const adopted = progress(b.state); w.raw = badRaw;
    const writes = w.writes.length; await b.takeover();
    assert.equal(b.owner, true); assert.equal(b.protected, true); assert.deepEqual(progress(b.state), adopted);
    assert.equal(b.run('save(true)'), false); b.tick(5000);
    assert.equal(w.writes.length, writes); assert.equal(w.raw, badRaw);
  });
}

test('repaired then deleted durable data stays protected rather than saving adopted or temporary progress', async t => {
  const { w, a, b } = await repairedPair(t);
  await a.close(); await w.flush(); w.raw = null; const writes = w.writes.length;
  await b.takeover(); assert.equal(b.owner, true); assert.equal(b.protected, true);
  assert.equal(b.run('save(true)'), false); assert.equal(w.raw, null); assert.equal(w.writes.length, writes);
});

test('read failure at takeover cannot be mistaken for a valid repair or an empty new game', async t => {
  const { w, a, b } = await repairedPair(t);
  await a.close(); await w.flush(); const raw = w.raw, writes = w.writes.length, adopted = progress(b.state);
  b.failRead = true; await b.takeover();
  assert.equal(b.owner, true); assert.equal(b.protected, true); assert.deepEqual(progress(b.state), adopted);
  assert.equal(b.run('save(true)'), false); assert.equal(w.raw, raw); assert.equal(w.writes.length, writes);
  assert.match(b.dom.notice.textContent, /無法核對最新存檔/);
});

test('read-only repaired follower cannot play, import or save before ownership is actually granted', async t => {
  const { w, a, b } = await repairedPair(t), before = progress(b.state), raw = w.raw, writes = w.writes.length;
  await b.dom['start-button'].emit('click'); b.tick(1000);
  const other = engine.createGame(1); other.hero.gold = 9000; await b.import(JSON.stringify(other));
  assert.equal(b.confirmations, 0); assert.equal(b.run('save(true)'), false);
  assert.equal(b.owner, false); assert.equal(a.owner, true); assert.equal(b.protected, true);
  assert.deepEqual(progress(b.state), before); assert.equal(w.raw, raw); assert.equal(w.writes.length, writes);
});

test('takeover recovers from a valid durable repair even when its storage notification was missed', async t => {
  const w = world(), a = w.tab(), b = w.tab(); t.after(() => w.close()); await w.flush();
  await a.close(); const restored = engine.createGame(7); restored.hero.gold = 456; w.raw = JSON.stringify(restored);
  assert.equal(b.protected, true); assert.notEqual(b.state.hero.gold, 456);
  await b.takeover(); assert.equal(b.protected, false); assert.equal(b.state.hero.gold, 456);
  assert.equal(b.run('save(true)'), true); assert.equal(JSON.parse(w.raw).hero.gold, 456);
});

test('takeover uses newer durable progress, not an earlier valid storage-event snapshot', async t => {
  const { w, a, b } = await repairedPair(t);
  await a.close(); await w.flush(); const newer = engine.createGame(7); newer.hero.gold = 789; w.raw = JSON.stringify(newer);
  assert.equal(b.state.hero.gold, 123); await b.takeover();
  assert.equal(b.protected, false); assert.equal(b.state.hero.gold, 789); assert.equal(b.state.seed, 7);
  assert.equal(b.run('save(true)'), true); assert.equal(JSON.parse(w.raw).hero.gold, 789);
});

test('queued valid storage events cannot launder a currently corrupt durable save into overwrite permission', async t => {
  const { w, a, b } = await repairedPair(t);
  await a.close(); await w.flush(); const repairedRaw = w.raw, before = progress(b.state);
  w.raw = '{latest corrupt';
  await b.window.emit('storage', { key: SAVE_KEY, newValue: w.raw });
  assert.deepEqual(progress(b.state), before, 'invalid external state is never adopted');
  await b.window.emit('storage', { key: SAVE_KEY, newValue: repairedRaw });
  assert.equal(b.protected, true); const writes = w.writes.length;
  await b.takeover(); assert.equal(b.protected, true); assert.equal(b.run('save(true)'), false);
  assert.equal(w.raw, '{latest corrupt'); assert.equal(w.writes.length, writes);
});

test('a previously valid follower also protects a save deleted before takeover', async t => {
  const w = world(JSON.stringify(engine.createGame(42))), a = w.tab(), b = w.tab(); t.after(() => w.close());
  await w.flush(); assert.equal(b.protected, false); await a.close(); await w.flush();
  w.raw = null; const writes = w.writes.length; await b.takeover();
  assert.equal(b.owner, true); assert.equal(b.protected, true); assert.equal(b.run('save(true)'), false);
  assert.equal(w.raw, null); assert.equal(w.writes.length, writes);
});

test('corrupt legacy bytes with a missing current slot are never converted into a new automatic save', async t => {
  const w = world(null); t.after(() => w.close()); w.storage.set('hv-v3-dot-stable-save-v2', '{bad legacy');
  const a = w.tab(); await w.flush(); assert.equal(a.owner, true); assert.equal(a.protected, true);
  assert.equal(a.run('save(true)'), false); a.tick(5000);
  assert.equal(w.raw, null); assert.equal(w.storage.get('hv-v3-dot-stable-save-v2'), '{bad legacy');
  assert.equal(w.writes.length, 0);
});

test('failed initial storage read retains protection even when current bytes were actually absent', async t => {
  const w = world(null), a = w.tab({ failRead: true }); t.after(() => w.close()); await w.flush();
  assert.equal(a.owner, true); assert.equal(a.protected, true); assert.equal(a.run('save(true)'), false);
  a.tick(5000); assert.equal(w.raw, null); assert.equal(w.writes.length, 0);
});

test('unsupported item/stat/roll imports still reject before confirmation without clearing protection', async t => {
  const w = world(), a = w.tab(); t.after(() => w.close()); await w.flush();
  for (const change of [item => { item.futureTrait = true; }, item => { item.stats.luck = 1; }, item => { item.rolls = { luck: 20 }; }]) {
    const invalid = engine.createGame(42); change(invalid.equipment.weapon); const before = progress(a.state);
    await a.import(JSON.stringify(invalid));
    assert.equal(a.protected, true); assert.deepEqual(progress(a.state), before); assert.equal(a.confirmations, 0);
    assert.equal(w.raw, '{broken'); assert.equal(w.writes.length, 0);
    assert.match(a.dom.toast.textContent, /不支援的裝備欄位或格式/);
  }
});

test('canceling a valid recovery import cannot clear protection or replace durable bytes', async t => {
  const w = world(), a = w.tab({ confirm: false }); t.after(() => w.close()); await w.flush();
  const before = progress(a.state); await a.import(JSON.stringify(engine.createGame(42)));
  assert.equal(a.confirmations, 1); assert.equal(a.protected, true); assert.deepEqual(progress(a.state), before);
  assert.equal(w.raw, '{broken'); assert.equal(w.writes.length, 0);
});

test('ownership lost while an import file is reading cannot repair or overwrite after the await', async t => {
  const w = world(), a = w.tab(), b = w.tab(); t.after(() => w.close()); await w.flush();
  let finishRead;
  const bytes = JSON.stringify(engine.createGame(42)), before = progress(a.state);
  const pending = a.dom['save-file'].emit('change', { target: { value: 'selected.json', files: [{ size: bytes.length,
    text: () => new Promise(resolve => { finishRead = resolve; }) }] } });
  await b.takeover(); assert.equal(a.owner, false); assert.equal(b.owner, true);
  finishRead(bytes); await pending;
  assert.equal(a.confirmations, 0); assert.equal(a.protected, true); assert.deepEqual(progress(a.state), before);
  assert.equal(w.raw, '{broken'); assert.equal(w.writes.length, 0);
});

test('failed persistence after a validated repair does not claim a successful save or alter durable bytes', async t => {
  const { w, a, b } = await repairedPair(t);
  await b.takeover(); await w.flush(); assert.equal(a.owner, false); assert.equal(b.protected, false);
  const raw = w.raw, writes = w.writes.length; b.failWrite = true;
  assert.equal(b.run('save(true)'), false); assert.equal(w.raw, raw); assert.equal(w.writes.length, writes);
  assert.match(b.dom['save-status'].textContent, /請匯出/); assert.match(b.dom.notice.textContent, /無法寫入/);
});

test('fresh empty current storage and validated legacy migration retain their normal first-save paths', async t => {
  for (const legacy of [false, true]) {
    const w = world(null); t.after(() => w.close());
    const restored = engine.createGame(75); restored.hero.gold = 321; const raw = JSON.stringify(restored);
    if (legacy) w.storage.set('hv-v3-dot-stable-save-v2', raw);
    const a = w.tab(); await w.flush(); assert.equal(a.owner, true); assert.equal(a.protected, false);
    assert.equal(a.run('save(true)'), true); assert.ok(w.raw);
    if (legacy) { assert.equal(a.state.hero.gold, 321); assert.equal(w.storage.get('hv-v3-dot-stable-save-v2'), raw); }
  }
});

test('storage without Web Locks remains foreground/export-only after a valid repair', async t => {
  const w = world(), a = w.tab({ unsupported: true }); t.after(() => w.close());
  await a.import(JSON.stringify(engine.createGame(42)));
  assert.equal(a.run('save(true)'), false); a.tick(5000);
  assert.equal(w.raw, '{broken'); assert.equal(w.writes.length, 0);
});
