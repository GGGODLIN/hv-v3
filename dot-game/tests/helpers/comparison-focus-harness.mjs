import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import * as engine from '../../src/engine.js';
import * as session from '../../src/session.js';
import * as loot from '../../src/loot.js';

const source = readFileSync(new URL('../../src/ui.js', import.meta.url), 'utf8');
const markup = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
export const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
export const find = (el, predicate) => predicate(el) ? el : el.children.map(child => find(child, predicate)).find(Boolean);
export const collect = el => [el.textContent, ...el.children.map(collect)].filter(Boolean).join(' ');

// Focus-faithful source DOM, not a browser/layout/accessibility-tree emulator.
// It parses actual ancestry, detaches replaced descendants, drops focus to body,
// and refuses focus on detached, disabled, hidden or closed-dialog descendants.
export function fullUI(initial = engine.createGame(42), options = {}) {
  let document;
  const focusEvents = [], selectorCalls = [];
  const dataKey = name => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  function element(tag = 'div') {
    const listeners = new Map();
    const el = { tag, className: '', textContent: '', children: [], parentElement: null, hidden: false, inert: false,
      disabled: false, open: false, value: '', dataset: {}, attributes: {},
      style: { setProperty() {} },
      get isConnected() { let root = this; while (root.parentElement) root = root.parentElement; return root === document; },
      contains(other) { return this === other || this.children.some(child => child.contains(other)); },
      append(...children) { for (const child of children) { child.remove(); child.parentElement = this; this.children.push(child); } },
      replaceChildren(...children) {
        if (document && this.children.some(child => child.contains(document.activeElement))) document.activeElement = document.body;
        for (const child of this.children) child.parentElement = null;
        this.children = []; this.append(...children);
      },
      remove() {
        if (!this.parentElement) return;
        if (this.contains(document?.activeElement)) document.activeElement = document.body;
        this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null;
      },
      addEventListener(type, fn) { listeners.set(type, [...(listeners.get(type) || []), fn]); },
      async emit(type, event = {}) { for (const fn of listeners.get(type) || []) await fn({ target: this, ...event }); },
      click() { if (!this.disabled) return this.emit('click'); },
      focus(options) {
        if (!this.isConnected || this.disabled || this.closest('[hidden], [inert], dialog:not([open])')) return;
        if (!['button', 'input', 'select', 'textarea', 'a'].includes(this.tag) && !Number.isInteger(this.tabIndex)) return;
        document.activeElement = this; focusEvents.push({ element: this, options });
      },
      setAttribute(key, value) {
        this.attributes[key] = String(value);
        if (key === 'id') this.id = String(value);
        else if (key === 'class') this.className = String(value);
        else if (key === 'tabindex') this.tabIndex = Number(value);
        else if (key.startsWith('data-')) this.dataset[dataKey(key.slice(5))] = String(value);
        else if (['hidden', 'disabled', 'open', 'inert'].includes(key)) this[key] = true;
        else if (key === 'value') this.value = String(value);
      },
      matches(selector) {
        return selector.split(',').some(part => {
          const s = part.trim();
          if (s === '[hidden]') return this.hidden;
          if (s === '[inert]') return this.inert;
          if (s === 'dialog:not([open])') return this.tag === 'dialog' && !this.open;
          if (s.startsWith('.')) return this.className.split(' ').includes(s.slice(1));
          if (s.startsWith('#')) return this.id === s.slice(1);
          if (s.startsWith('[')) {
            const attrs = [...s.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];
            return attrs.length > 0 && attrs.every(([, name, value]) => name.startsWith('data-')
              ? Object.hasOwn(this.dataset, dataKey(name.slice(5))) && (value === undefined || this.dataset[dataKey(name.slice(5))] === value)
              : Object.hasOwn(this.attributes, name) && (value === undefined || this.attributes[name] === value));
          }
          return this.tag === s;
        });
      },
      closest(selector) { for (let current = this; current; current = current.parentElement) if (current.matches(selector)) return current; return null; },
      querySelectorAll(selector) { selectorCalls.push(selector); const found = []; for (const child of this.children) { if (child.matches(selector)) found.push(child); found.push(...child.querySelectorAll(selector)); } return found; },
      querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
      showModal() { this.returnFocus = document.activeElement; this.open = true; (this.querySelector('button') || this).focus(); },
      close() { if (!this.open) return; this.open = false; if (this.contains(document.activeElement)) { document.activeElement = document.body; this.returnFocus?.focus(); } void this.emit('close'); },
      getBoundingClientRect() { return { width: 640, height: 360, left: 0, top: 0, right: 640, bottom: 360 }; }, getContext() { return {}; },
    };
    el.classList = {
      add(...names) { el.className = [...new Set([...el.className.split(' ').filter(Boolean), ...names])].join(' '); },
      remove(...names) { el.className = el.className.split(' ').filter(name => !names.includes(name)).join(' '); },
      toggle(name, enabled) { const present = el.className.split(' ').includes(name); (enabled ?? !present) ? this.add(name) : this.remove(name); },
    };
    return el;
  }
  document = element('document');
  const dom = {}, stack = [document], voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  for (const [, closing, tagText, attrs] of (options.html || markup).matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*)>/g)) {
    const tag = tagText.toLowerCase();
    if (closing) { const index = stack.findLastIndex(el => el.tag === tag); if (index > 0) stack.length = index; continue; }
    const el = element(tag);
    for (const [, key, double, single, unquoted] of attrs.matchAll(/([^\s=\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) el.setAttribute(key, double ?? single ?? unquoted ?? '');
    stack.at(-1).append(el); if (el.id) dom[el.id] = el;
    if (tag === 'body') document.body = el;
    if (tag === 'html') document.documentElement = el;
    if (!voidTags.has(tag) && !attrs.endsWith('/')) stack.push(el);
  }
  Object.assign(document, { hidden: false, activeElement: document.body, getElementById: id => dom[id], createElement: element });
  for (const id of ['slot-filter', 'family-filter', 'investment-filter']) dom[id].value = 'all';
  dom['sort-select'].value = 'new';
  const window = element('window'); window.matchMedia = () => ({ matches: true });
  let raw = JSON.stringify(initial), now = 0;
  const calls = [], writes = [], faults = [];
  const context = createContext({ ...engine, ...session, ...loot, JSON, window, document, location: { pathname: '/' },
    previewSelectedSale: (state, ids) => engine.previewSelectedSale(state, clone(ids)),
    act(state, action, payload) { calls.push({ action, payload: clone(payload ?? null) }); options.beforeAction?.(state, action, payload); return engine.act(state, action, clone(payload)); },
    performance: { now: () => now }, navigator: {}, crypto: { randomUUID: () => 'comparison-focus-test' },
    console: { warn() {}, error(...args) { faults.push(args); } }, confirm: () => true,
    localStorage: { getItem: key => key.endsWith('save-v3') ? raw : null, setItem: (...args) => writes.push(args) },
    setTimeout() { return 1; }, clearTimeout() {}, setInterval() { return 1; }, requestAnimationFrame() {}, ResizeObserver: class { observe() {} },
  });
  const run = code => runInContext(code, context); run((options.source || source).replace(/^import .+;\n/gm, ''));
  const card = (location, id) => location === 'inventory' ? find(dom['inventory-list'], el => el.dataset.inventoryId === id)
    : location === 'pending' ? find(dom['pending-loot-list'], el => el.dataset.pendingLootId === id)
      : dom.equipment.children.find((el, index) => Object.values(run('state.equipment'))[index]?.id === id);
  return { dom, document, window, calls, writes, faults, focusEvents, selectorCalls, run, card,
    get state() { return run('state'); }, render(force = true) { return run(`render(${force});`); },
    at(value) { now = value; }, tick() { return run('pump.tick();'); },
    set saved(value) { raw = JSON.stringify(value); },
    async import(value) { const input = JSON.stringify(value); await dom['save-file'].emit('change', { target: { value: 'save.json', files: [{ size: input.length, text: async () => input }] } }); },
  };
}
