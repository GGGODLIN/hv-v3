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
// Use the public item factory and ordinary owned-item layout, not fabricated
// combat values. UI-only abnormal presentation/failure cases stub the API below.
function fixture({ family = 'rapier', equipped = false, fragments = 1000, level = 8 } = {}) {
  const state = engine.createGame(71);
  state.hero.level = level; state.soulFragments = fragments;
  const item = { ...loot.createCommissionWeapon(family, 3, family === 'rapier' ? 'nimble' : 'slaughter'), id: 'ui-owned-weapon' };
  if (equipped) state.equipment.weapon = item; else state.inventory.push(item);
  return state;
}
function fullUI(initial = fixture(), options = {}) {
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
  dom['slot-filter'].value = 'all'; dom['sort-select'].value = 'new'; window.matchMedia = () => ({ matches: true });
  const raw = JSON.stringify(initial), calls = [], faults = [], writes = [];
  const context = createContext({ ...engine, ...session, ...loot, JSON, window, document, location: { pathname: '/' },
    previewSoulbindWeapon: options.preview || engine.previewSoulbindWeapon,
    previewSelectedSale: (state, ids) => engine.previewSelectedSale(state, clone(ids)),
    act(state, action, payload) { calls.push({ action, payload: clone(payload ?? null) }); options.beforeAction?.(state, action); if (!options.noop) return engine.act(state, action, payload && typeof payload === 'object' ? clone(payload) : payload); return state; },
    performance: { now: () => 0 }, navigator: {}, crypto: { randomUUID: () => 'soulbind-ui-test' },
    console: { warn() {}, error(...args) { faults.push(args); } }, confirm: () => true,
    localStorage: { getItem: key => key.endsWith('save-v3') ? raw : null, setItem: (...args) => writes.push(args) },
    setTimeout() { return 1; }, clearTimeout() {}, setInterval() { return 1; }, requestAnimationFrame() {}, ResizeObserver: class { observe() {} } });
  const run = source => runInContext(source, context); run(js.replace(/^import .+;\n/gm, ''));
  return { dom, window, document, calls, faults, writes, run, get state() { return run('state'); },
    inspect(equipped = false) { run(equipped ? "selectedSlot='weapon';selectedId=null;render(true);" : "selectedSlot=null;selectedId='ui-owned-weapon';render(true);"); },
    render() { run('render(true);'); },
    async import(state) { const input = JSON.stringify(state); await dom['save-file'].emit('change', { target: { value: 'save.json', files: [{ size: input.length, text: async () => input }] } }); },
  };
}
const open = h => h.run("openSoulbindWeapon('ui-owned-weapon');");
const bindButton = h => find(h.dom['item-detail'], el => el.dataset.soulbindId === 'ui-owned-weapon');

test('Soulbind UI: discoverable balance/rules, no automatic action and live balance updates', () => {
  const h = fullUI(); assert.equal(h.dom['soul-fragment-balance'].textContent, '1,000 靈魂碎片');
  h.inspect(); assert.ok(bindButton(h)); assert.equal(bindButton(h).disabled, false);
  assert.equal(h.calls.length, 0); assert.equal(h.dom['soulbind-dialog'].open, false);
  h.run('state.soulFragments += 10; render();'); assert.equal(h.dom['soul-fragment-balance'].textContent, '1,010 靈魂碎片');
  for (const copy of ['每次正常通關取得 10 靈魂碎片', '本作掛機節奏改編', '不是金幣或 AP', '精良（Exquisite）以下 100', '華麗（Magnificent）250', '傳奇（Legendary）500', '無雙（Peerless）1,000', '尚未實作鍛造', '不補發歷史獎勵']) assert.ok(html.includes(copy), copy);
  assert.match(html, /v0\.37 · 來源候選/); assert.match(html, /v0\.23 及更舊版不能讀取新格式/);
  assert.match(html, /資料格式 v3/); assert.match(html, /v3 儲存命名空間，與資料格式版本不同/);
});

test('Soulbind UI: exact full quote, level and seven before/after stats, never a gold/AP offer', () => {
  const h = fullUI(), before = clone(h.state), expected = engine.previewSoulbindWeapon(h.state, 'ui-owned-weapon');
  open(h); assert.deepEqual(clone(h.state), before); assert.equal(h.calls.length, 0);
  assert.equal(h.dom['soulbind-dialog'].open, true); assert.equal(h.dom['soulbind-confirm'].disabled, false);
  assert.equal(h.dom['soulbind-item-name'].textContent, expected.before.name);
  assert.match(h.dom['soulbind-level'].textContent, /Lv\.3 → Lv\.8/);
  const rows = h.dom['soulbind-comparison'].children; assert.equal(rows.length, 8);
  for (const [index, key] of ['attack', 'defense', 'hp', 'crit', 'evade', 'block', 'parry'].entries()) {
    const rate = ['crit', 'evade', 'block'].includes(key);
    assert.equal(rows[index + 1].children[1].textContent, h.run(`soulbindStat(${expected.before.stats[key] || 0}, ${rate})`));
    assert.equal(rows[index + 1].children[2].textContent, h.run(`soulbindStat(${expected.after.stats[key] || 0}, ${rate})`));
  }
  assert.doesNotMatch(collect(rows[7]), /%/);
  assert.equal(h.dom['soulbind-cost'].textContent, '現有 1,000 − 品質費用 100 ＝ 綁定後 900 靈魂碎片');
  assert.match(h.dom['soulbind-feedback'].textContent, /尚未綁定或扣除碎片/);
  assert.doesNotMatch(h.dom['soulbind-confirm'].textContent, /金幣|AP/);
});

test('Soulbind UI: exact fractional rates, absent parry and untrusted names remain display-only', () => {
  const h = fullUI(fixture(), { preview: (state, id) => {
    const q = engine.previewSoulbindWeapon(state, id);
    if (q.before) { q.before.name = '<img src=x onerror=bad()>'; q.before.stats = { attack: 17, crit: .0211 }; q.after.stats = { attack: 21, crit: .0218 }; }
    return q;
  } }); open(h);
  assert.equal(h.dom['soulbind-item-name'].textContent, '<img src=x onerror=bad()>');
  const rows = h.dom['soulbind-comparison'].children;
  assert.equal(rows[4].children[1].textContent, '2.11%'); assert.equal(rows[4].children[2].textContent, '2.18%');
  assert.equal(rows[7].children[1].textContent, '0'); assert.equal(rows[7].children[2].textContent, '0');
  assert.equal(h.calls.length, 0); assert.doesNotMatch(js, /\.innerHTML\s*=/);
});

for (const equipped of [false, true]) test(`Soulbind UI: one explicit whole-quote confirmation, original ${equipped ? 'equipped' : 'inventory'} position retained`, () => {
  const h = fullUI(fixture({ equipped })); h.inspect(equipped);
  const quote = engine.previewSoulbindWeapon(h.state, 'ui-owned-weapon'), gold = h.state.hero.gold, abilities = clone(h.state.abilities), inventoryIds = h.state.inventory.map(item => item.id);
  open(h); h.run('confirmSoulbindWeapon(); confirmSoulbindWeapon();');
  assert.deepEqual(h.calls, [{ action: 'soulbindWeapon', payload: quote }]);
  const item = equipped ? h.state.equipment.weapon : h.state.inventory.find(item => item.id === quote.id);
  assert.deepEqual(clone(item), quote.after); assert.equal(h.state.soulFragments, 900);
  assert.equal(h.state.hero.gold, gold); assert.deepEqual(clone(h.state.abilities), abilities); assert.deepEqual(h.state.inventory.map(item => item.id), inventoryIds);
  assert.equal(h.dom['soulbind-dialog'].open, false); assert.equal(h.run('soulbindConsent'), null);
  assert.match(h.dom.toast.textContent, /已永久靈魂綁定/); assert.match(collect(h.dom['item-detail']), /永久綁定.*不能解除、解鎖或出售/);
  assert.equal(bindButton(h), undefined); assert.equal(h.faults.length, 0);
});

test('Soulbind UI: already locked and preset-referenced weapon stays eligible; permanent protection supersedes unlock guidance', async () => {
  const s = fixture({ equipped: true }); engine.act(s, 'saveGearSet', 'a');
  const h = fullUI(s); h.inspect(true); assert.equal(bindButton(h).disabled, false); open(h); h.run('confirmSoulbindWeapon();');
  assert.match(collect(h.dom['item-detail']), /清除配裝記錄也不會解除保護/);
  assert.doesNotMatch(collect(h.dom['item-detail']), /再手動解鎖|預設鎖定.*解鎖/);
  assert.deepEqual(clone(h.state.gearSets.a), clone(s.gearSets.a));
  const inventory = fullUI(fixture()); inventory.inspect(); open(inventory); inventory.run('confirmSoulbindWeapon();');
  const detail = inventory.dom['item-detail'];
  const lock = find(detail, el => el.tag === 'button' && el.textContent === '永久綁定');
  const sell = find(detail, el => el.tag === 'button' && el.textContent === '出售');
  assert.equal(lock.disabled, true); assert.equal(sell.disabled, true);
  const before = clone(inventory.state), count = inventory.calls.length;
  await lock.click(); await sell.click(); assert.deepEqual(clone(inventory.state), before); assert.equal(inventory.calls.length, count);
  const row = inventory.dom['inventory-list'].children[0]; assert.equal(find(row, el => el.tag === 'input').disabled, true);
  assert.match(collect(row), /靈魂綁定.*永久/);
});

test('Soulbind UI: insufficient fragments explain cost without an invented ability unlock', () => {
  const h = fullUI(fixture({ fragments: 20 })); h.inspect();
  assert.equal(bindButton(h).disabled, false); assert.match(collect(h.dom['item-detail']), /靈魂碎片不足/);
  open(h); const before = clone(h.state); h.run('confirmSoulbindWeapon();');
  assert.equal(h.dom['soulbind-confirm'].disabled, true); assert.equal(h.calls.length, 0); assert.deepEqual(clone(h.state), before);
  assert.match(h.dom['soulbind-feedback'].textContent, /還差 80/); assert.match(h.dom['soulbind-cost'].textContent, /綁定後 -80/);
  assert.doesNotMatch(h.dom['soulbind-feedback'].textContent, /AP|能力|首次.*解鎖/);
});

test('Soulbind UI: required item level, pending-only, armor and unknown starter cannot bind', () => {
  for (const scenario of ['overlevel', 'pending', 'armor', 'unknown']) {
    const state = fixture({ level: scenario === 'overlevel' ? 1 : 8 });
    if (scenario === 'pending') state.pendingLoot = state.inventory.splice(0);
    if (scenario === 'armor') state.inventory = [{ ...state.equipment.armor, id: 'ui-owned-weapon' }];
    if (scenario === 'unknown') state.inventory = [{ ...state.equipment.weapon, id: 'ui-owned-weapon' }];
    const h = fullUI(state), before = clone(h.state); open(h); h.run('confirmSoulbindWeapon();');
    assert.equal(h.dom['soulbind-dialog'].open, false, scenario); assert.equal(h.calls.length, 0, scenario); assert.deepEqual(clone(h.state), before, scenario);
    if (scenario === 'overlevel') assert.match(h.dom.toast.textContent, /等級高於角色/);
  }
});

test('Soulbind UI: read-only, battle and defeat guards reject even forced clicks', () => {
  for (const mutation of ["tabOwner=false", "state.mode='battle'", "state.mode='defeat'"]) {
    const h = fullUI(); h.run(`${mutation};`); h.inspect(); assert.equal(bindButton(h).disabled, true);
    const before = clone(h.state); open(h); h.run('confirmSoulbindWeapon();');
    assert.deepEqual(clone(h.state), before); assert.equal(h.calls.length, 0); assert.equal(h.dom['soulbind-dialog'].open, false);
  }
});

test('Soulbind UI: Cancel, Escape, Back, pagehide, import entry and ownership sync clear pending consent', async () => {
  for (const cancel of ['close', 'cancel', 'back', 'pagehide', 'import', 'file-entry', 'sync']) {
    const h = fullUI(); open(h); const before = clone(h.state);
    if (cancel === 'close') h.dom['soulbind-dialog'].close();
    if (cancel === 'cancel') await h.dom['soulbind-dialog'].emit('cancel');
    if (cancel === 'back') await h.window.emit('popstate');
    if (cancel === 'pagehide') await h.window.emit('pagehide');
    if (cancel === 'import') await h.dom['import-save'].click();
    if (cancel === 'file-entry') await h.dom['save-file'].emit('change', { target: { value: '', files: [] } });
    if (cancel === 'sync') h.run('syncSelection();');
    h.run('confirmSoulbindWeapon();'); assert.equal(h.run('soulbindConsent'), null, cancel);
    assert.equal(h.calls.length, 0, cancel); assert.deepEqual(clone(h.state), before, cancel);
  }
});

test('Soulbind UI: adopted import cannot inherit previous journey consent', async () => {
  const h = fullUI(); open(h); await h.import(fixture({ family: 'club', fragments: 450 }));
  h.run('confirmSoulbindWeapon();'); assert.equal(h.calls.length, 0); assert.equal(h.run('soulbindConsent'), null);
  assert.equal(h.dom['soulbind-dialog'].open, false); assert.equal(h.state.soulFragments, 450);
  assert.equal(h.dom['soul-fragment-balance'].textContent, '450 靈魂碎片');
});

test('Soulbind UI: changed quote, item, balance, level, location or camp conditions permanently revoke stale consent', () => {
  for (const mutation of [
    'state.soulFragments++', 'state.hero.level++', 'state.stage++', "state.inventory[0].name='changed'",
    'state.inventory[0].stats.attack++', 'state.inventory[0].locked=false', 'state.inventory=[]',
    "state.mode='battle'", "state.mode='defeat'", 'tabOwner=false',
  ]) {
    const h = fullUI(); open(h); h.run(`${mutation};`); const before = clone(h.state);
    h.run('confirmSoulbindWeapon(); confirmSoulbindWeapon();');
    assert.equal(h.calls.length, 0, mutation); assert.deepEqual(clone(h.state), before, mutation); assert.equal(h.run('soulbindConsent'), null, mutation);
    assert.equal(h.dom['soulbind-confirm'].disabled, true, mutation); assert.match(h.dom['soulbind-feedback'].textContent, /確認已取消/, mutation);
  }
  const h = fullUI(); open(h); h.run('state.soulFragments++;render();state.soulFragments--;confirmSoulbindWeapon();');
  assert.equal(h.calls.length, 0, 'reverting data does not resurrect old consent');
});

test('Soulbind UI: repeated open cannot replace pending item; closed native dialog cannot submit', () => {
  const h = fullUI(); open(h); const shown = h.dom['soulbind-item-name'].textContent;
  h.run("openSoulbindWeapon('starter-weapon');"); assert.equal(h.dom['soulbind-item-name'].textContent, shown);
  h.dom['soulbind-dialog'].open = false; h.run('confirmSoulbindWeapon();');
  assert.equal(h.calls.length, 0); assert.equal(h.run('soulbindConsent'), null);
});

test('Soulbind UI: engine refusal or dispatch-time race never claims success and cannot replay', () => {
  for (const options of [{ noop: true }, { beforeAction: state => { state.soulFragments++; } }]) {
    const h = fullUI(fixture(), options); open(h); h.run('confirmSoulbindWeapon();confirmSoulbindWeapon();');
    assert.equal(h.calls.length, 1); assert.equal(h.run('soulbindConsent'), null); assert.equal(h.dom['soulbind-confirm'].disabled, true);
    assert.equal(h.state.inventory[0].soulbound, undefined); assert.match(h.dom['soulbind-feedback'].textContent, /操作未確認完成/);
    assert.doesNotMatch(h.dom.toast.textContent, /已永久靈魂綁定/);
  }
});

test('Soulbind UI: focus survives redraw; native accessible confirmation has safe autofocus and small-screen scrolling', () => {
  const h = fullUI(); h.inspect(); bindButton(h).focus(); h.run('state.soulFragments++;render();');
  assert.equal(h.document.activeElement, bindButton(h));
  assert.match(html, /id="soulbind-dialog"[^>]*aria-labelledby="soulbind-title"[^>]*aria-describedby="soulbind-warning"/);
  assert.match(html, /data-close="soulbind-dialog"[^>]*autofocus>取消，不變更/);
  assert.match(html, /id="soulbind-feedback"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(css, /\.soulbind-dialog \{[^}]*max-height:[^}]*overflow-y: auto/);
  assert.match(css, /\.soulbind-actions \{[^}]*flex-wrap: wrap/);
  assert.match(css, /\.soulbind-item-name \{[^}]*overflow-wrap: anywhere/);
});
