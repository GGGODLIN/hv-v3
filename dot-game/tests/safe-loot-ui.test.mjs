import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createGame, act, previewSafeSale, validateSave } from '../src/engine.js';
import { loadVersionedSave } from '../src/session.js';

const js = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const extract = (first, next) => js.slice(js.indexOf(first), js.indexOf(next));
const controllers = extract('function safeSaleSignature(', 'function playSound(');
function node(tag, className = '', text = '') {
  return { tag, className, textContent: String(text), open: false, hidden: false, disabled: false, checked: false, children: [], events: new Map(),
    append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; },
    addEventListener(name, listener) { this.events.set(name, [...(this.events.get(name) || []), listener]); },
    emit(name, event = {}) { return Promise.all((this.events.get(name) || []).map(listener => listener({ target: this, ...event }))); },
    showModal() { this.open = true; }, close() { if (!this.open) return; this.open = false; this.emit('close'); },
  };
}
const collect = element => [element.textContent, ...element.children.map(collect)].filter(Boolean).join(' ');
const item = (id, overrides = {}) => ({ id, slot: 'weapon', weaponFamily: 'rapier', name: '普通・逐風刺劍', quality: 'Average', level: 3, power: 20,
  stats: { attack: 10, crit: .02 }, locked: false, ...overrides });
function fixture() {
  const state = createGame(812);
  state.equipment.weapon = item('keeper', { stats: { attack: 11, crit: .02 } });
  state.inventory = [item('first'), item('second', { stats: { attack: 9, crit: .02 } })];
  return state;
}
function harness(state = fixture(), options = {}) {
  const dom = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], node('div')]));
  const window = node('window'), calls = [], toasts = [];
  const context = { state, tabOwner: true, lease: true, window, node, $: id => dom[id],
    format: value => String(Math.round(value)), qualityName: quality => ({ Average: '普通' }[quality] || quality),
    slotNames: { weapon: '武器', armor: '護甲', accessory: '飾品' },
    statNames: { attack: '攻擊', defense: '防禦', hp: '生命', crit: '暴擊', evade: '閃避', block: '格擋' },
    previewSafeSale: options.preview || previewSafeSale,
    claimLease: () => context.tabOwner && context.lease,
    showToast: message => toasts.push(message),
    dispatch(action, payload) {
      calls.push({ action, payload: structuredClone(payload) });
      // The VM is another realm; recreate only the public payload, as a browser's
      // UI and engine normally share one realm and engine intentionally rejects foreign prototypes.
      if (!options.noop) act(state, action, typeof payload === 'object' ? { ids: Array.from(payload.ids) } : payload);
      runInNewContext('renderSafeLoot();', context);
      return true;
    },
  };
  runInNewContext(`let safeSaleBatch = null; let lastSafeLootSignature = ''; ${controllers}
    ${extract("$('sell-safe').addEventListener", "$('sound-toggle').addEventListener")}
    ${extract("window.addEventListener('popstate'", "window.addEventListener('pagehide'")}
    renderSafeLoot();`, context);
  return { state, dom, context, calls, toasts, window, run: source => runInNewContext(source, context) };
}

test('safe loot UI: defaults OFF, camp-only, no broad low-quality action, and complete safety explanation', () => {
  const h = harness();
  assert.equal(h.dom['auto-sell-toggle'].checked, false);
  assert.equal(h.dom['auto-sell-toggle'].disabled, false);
  assert.match(h.dom['auto-sell-state'].textContent, /關 · 預設/);
  assert.doesNotMatch(html.match(/<input id="auto-sell-toggle"[^>]+>/)[0], /checked/);
  assert.doesNotMatch(js, /sellCommon|sell-common/);
  for (const fragment of ['之後的新掉落', '開啟不清理既有背包', '背包中已鎖定', '七項均不低', '至少一項較高', '不以評分判定', '屬性相同', '有高有低', 'Superior', '未辨識裝備', '不是無限掛機', '舊版分頁可能移除']) assert.ok(html.includes(fragment), fragment);
  for (const mode of ['battle', 'defeat']) {
    h.state.mode = mode; h.run('renderSafeLoot();');
    assert.equal(h.dom['auto-sell-toggle'].disabled, true);
    assert.equal(h.dom['sell-safe'].disabled, true);
    const before = structuredClone(h.state);
    h.run('openSafeSalePreview(); setSafeAutoSell(true);');
    assert.deepEqual(h.state, before);
    assert.equal(h.calls.length, 0);
    assert.equal(h.dom['safe-sale-dialog'].open, false);
  }
  h.state.mode = 'town'; h.context.tabOwner = false; h.run('renderSafeLoot();');
  assert.equal(h.dom['auto-sell-toggle'].disabled, true);
  assert.equal(h.dom['sell-safe'].disabled, true);
  h.run('openSafeSalePreview(); setSafeAutoSell(true);');
  assert.equal(h.calls.length, 0);
  assert.match(h.toasts.at(-1), /唯讀.*未變更/);
});

test('safe loot UI: enabling is explicit and only changes opt-in, OFF and missing opt-in render faithfully', () => {
  const h = harness(), inventory = structuredClone(h.state.inventory), gold = h.state.hero.gold;
  h.dom['auto-sell-toggle'].checked = true;
  h.dom['auto-sell-toggle'].emit('change');
  assert.deepEqual(h.calls, [{ action: 'setAutoSell', payload: true }]);
  assert.equal(h.state.autoSell, true);
  assert.deepEqual(h.state.inventory, inventory);
  assert.equal(h.state.hero.gold, gold);
  assert.match(h.toasts.at(-1), /之後的新掉落，既有背包不變/);
  h.dom['auto-sell-toggle'].checked = false;
  h.dom['auto-sell-toggle'].emit('change');
  assert.equal(h.state.autoSell, undefined);
  assert.equal(h.dom['auto-sell-toggle'].checked, false);
  h.run('setSafeAutoSell(true);'); delete h.state.autoSell; h.run('renderSafeLoot();');
  assert.equal(h.dom['auto-sell-toggle'].checked, false, 'older-tab removal must not resurrect opt-in from preferences');
  h.context.tabOwner = false; h.dom['auto-sell-toggle'].checked = true; h.dom['auto-sell-toggle'].emit('change');
  assert.equal(h.dom['auto-sell-toggle'].checked, false, 'failed readonly interaction restores the actual state');
});

test('safe loot UI: preview shows exact names, IDs, protected keeper, reason, count and total without mutation', () => {
  for (const lockedKeeper of [false, true]) {
    const state = fixture();
    if (lockedKeeper) {
      state.inventory.push({ ...state.equipment.weapon, id: 'locked-keeper', locked: true });
      state.equipment.weapon = item('other-equipped', { stats: { attack: 1 } });
    }
    const h = harness(state), before = structuredClone(state), preview = previewSafeSale(state);
    h.dom['sell-safe'].emit('click');
    assert.deepEqual(state, before);
    assert.equal(h.calls.length, 0);
    assert.equal(h.dom['safe-sale-dialog'].open, true);
    assert.match(h.dom['safe-sale-summary'].textContent, new RegExp(`2 件 · 合計 ${preview.total} 金幣`));
    assert.equal(h.dom['safe-sale-list'].children.length, 2);
    const rows = h.dom['safe-sale-list'].children.map(collect);
    for (const [index, entry] of preview.items.entries()) {
      assert.ok(rows[index].includes(entry.name));
      assert.ok(rows[index].includes(`出售 ID：${entry.id}`));
      assert.ok(rows[index].includes(`ID：${entry.keeperId}`));
      assert.ok(rows[index].includes(`${entry.value} 金幣`));
      assert.match(rows[index], /七項屬性均不低.*攻擊較高.*不以評分判定/);
      assert.ok(rows[index].includes(lockedKeeper ? '背包已鎖定' : '已裝備'));
    }
    assert.match(h.dom['safe-sale-feedback'].textContent, /尚未出售/);
    const rowsBefore = h.dom['safe-sale-list'].children;
    h.run('openSafeSalePreview();');
    assert.equal(h.dom['safe-sale-list'].children, rowsBefore, 'repeated open does not replace displayed consent');
  }
});

test('safe loot UI: confirm sells only displayed IDs at displayed total, never expands, and cannot repeat', () => {
  const h = harness(), total = previewSafeSale(h.state).total, gold = h.state.hero.gold;
  h.run('openSafeSalePreview();');
  h.state.inventory.push(item('later-eligible'));
  h.run('renderSafeLoot(); confirmSafeSale(); confirmSafeSale();');
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls)), [{ action: 'sellSafe', payload: { ids: ['first', 'second'] } }]);
  assert.deepEqual(h.state.inventory.map(item => item.id), ['later-eligible']);
  assert.equal(h.state.hero.gold, gold + total);
  assert.equal(h.state.equipment.weapon.id, 'keeper');
  assert.equal(h.dom['safe-sale-dialog'].open, false);
  assert.match(h.toasts.at(-1), /已安全出售預覽的 2 件/);
});

test('safe loot UI: cancel, close, Escape, Back and reopened previews never retain consent or mutate loot', () => {
  for (const method of ['close', 'cancel', 'back', 'explicit']) {
    const h = harness(), before = structuredClone(h.state);
    h.run('openSafeSalePreview();');
    if (method === 'back') h.window.emit('popstate');
    else if (method === 'explicit') h.run('closeSafeSalePreview();');
    else if (method === 'cancel') h.dom['safe-sale-dialog'].emit('cancel');
    else h.dom['safe-sale-dialog'].close();
    h.run('confirmSafeSale();');
    assert.equal(h.dom['safe-sale-dialog'].open, false, method);
    assert.deepEqual(h.state, before, method);
    assert.equal(h.calls.length, 0, method);
    h.state.inventory.pop(); h.run('openSafeSalePreview();');
    assert.equal(h.dom['safe-sale-list'].children.length, 1);
    h.run('closeSafeSalePreview(); confirmSafeSale();');
    assert.equal(h.calls.length, 0);
  }
  assert.match(js, /window\.addEventListener\('pagehide', \(\) => \{ closeSafeSalePreview\(\)/);
  assert.match(html, /data-close="safe-sale-dialog"[^>]+autofocus/);
  assert.equal((html.match(/data-close="safe-sale-dialog"/g) || []).length, 2, 'both close and cancel use native close');
  const queued = harness(), before = structuredClone(queued.state);
  queued.run('openSafeSalePreview();');
  queued.dom['safe-sale-dialog'].open = false; // Native close event may be queued after open becomes false.
  queued.run('confirmSafeSale();');
  assert.deepEqual(queued.state, before);
  assert.equal(queued.calls.length, 0, 'closed dialog cannot consume consent before its queued close listener runs');
});

test('safe loot UI: stale eligibility, stats, witness, mode or ownership abort the whole batch without sale', () => {
  const mutations = {
    locked: h => { h.state.inventory[0].locked = true; },
    removed: h => { h.state.inventory.shift(); },
    candidateStatsChanged: h => { h.state.inventory[0].stats.attack = 9.5; },
    candidatePriceChanged: h => { h.state.inventory[0].power = 25; },
    candidateNameChanged: h => { h.state.inventory[0].name = '尚可・逐風刺劍'; h.state.inventory[0].quality = 'Fair'; },
    witnessNameChanged: h => { h.state.equipment.weapon.name = '粗製・逐風刺劍'; h.state.equipment.weapon.quality = 'Crude'; },
    witnessChanged: h => { h.state.equipment.weapon.stats.attack = 12; },
    witnessLost: h => { h.state.equipment.weapon = item('replacement', { stats: { attack: 1 } }); },
    battle: h => { h.state.mode = 'battle'; },
    ownerLost: h => { h.context.tabOwner = false; },
    leaseLost: h => { h.context.lease = false; },
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    const h = harness(); h.run('openSafeSalePreview();'); mutate(h);
    const before = structuredClone(h.state);
    h.run('confirmSafeSale(); confirmSafeSale();');
    assert.deepEqual(h.state, before, name);
    assert.equal(h.calls.length, 0, name);
    assert.equal(h.dom['safe-sale-confirm'].disabled, true, name);
    assert.match(h.dom['safe-sale-feedback'].textContent, /已取消，未出售任何裝備/, name);
  }
  const h = harness(); h.run('openSafeSalePreview();'); h.context.tabOwner = false; h.run('renderSafeLoot();');
  h.context.tabOwner = true; h.run('renderSafeLoot(); confirmSafeSale();');
  assert.equal(h.calls.length, 0, 'regaining ownership cannot resurrect old consent');
  assert.match(js, /changed: owner =>.*renderSafeLoot\(\)/, 'ownership loss invalidates immediately, even before next animation frame');
});

test('safe loot UI: unlocking a protected inventory keeper aborts even if an alternative keeper exists', () => {
  const state = fixture();
  state.equipment.weapon = item('weak-equipped', { stats: { attack: 1 } });
  state.inventory.push(item('locked-primary', { stats: { attack: 20, crit: .02 }, locked: true }), item('locked-spare', { stats: { attack: 21, crit: .02 }, locked: true }));
  const h = harness(state); h.run('openSafeSalePreview();');
  state.inventory.find(item => item.id === 'locked-primary').locked = false;
  const before = structuredClone(state);
  h.run('renderSafeLoot(); confirmSafeSale();');
  assert.deepEqual(state, before);
  assert.equal(h.calls.length, 0);
  assert.match(h.dom['safe-sale-feedback'].textContent, /已取消，未出售任何裝備/);
});

test('safe loot UI: empty preview and engine no-op cannot report a completed sale', () => {
  const empty = fixture(); empty.inventory = [];
  const h = harness(empty); h.run('openSafeSalePreview(); confirmSafeSale();');
  assert.equal(h.dom['safe-sale-confirm'].disabled, true);
  assert.match(h.dom['safe-sale-summary'].textContent, /0 件.*0 金幣/);
  assert.match(h.dom['safe-sale-feedback'].textContent, /沒有符合條件/);
  assert.equal(h.calls.length, 0);
  const noOp = harness(fixture(), { noop: true }), before = structuredClone(noOp.state);
  noOp.run('openSafeSalePreview(); confirmSafeSale();');
  assert.deepEqual(noOp.state, before);
  assert.match(noOp.dom['safe-sale-feedback'].textContent, /已取消，未出售任何裝備/);
  assert.equal(noOp.toasts.some(text => text.includes('已安全出售')), false);
});

test('safe loot UI: preview renders supplied names as text, never HTML; long names/IDs wrap and dialog scrolls', () => {
  const state = fixture(), preview = previewSafeSale(state);
  preview.items[0].name = '<img src=x onerror=bad()>';
  preview.items[0].keeperName = '<script>bad()</script>';
  const h = harness(state, { preview: () => preview }); h.run('openSafeSalePreview();');
  const text = collect(h.dom['safe-sale-list']);
  assert.ok(text.includes('<img src=x onerror=bad()>'));
  assert.ok(text.includes('<script>bad()</script>'));
  assert.doesNotMatch(controllers, /innerHTML|insertAdjacentHTML/);
  assert.match(css, /\.safe-sale-item \{[^}]*overflow-wrap: anywhere/);
  assert.match(css, /\.safe-sale-dialog \{[^}]*max-height:[^}]*overflow-y: auto/);
  assert.match(html, /id="safe-sale-dialog"[^>]*aria-labelledby="safe-sale-title"/);
});

test('safe loot UI: automatic-sale loot banner reports sale, not kept loot; event is shown only once', () => {
  const h = harness(), events = [{ id: 1, type: 'loot', text: '自動出售 普通・逐風刺劍 · +29 金幣', value: 29, target: 'sold' }];
  Object.assign(h.context, { prefs: { reducedMotion: true }, playSound() {}, clearTimeout() {}, setTimeout() { return 1; } });
  h.state.events = events;
  h.run(`const seenEvents = new Set(); let lastProcessedEvent; let bannerTimer;
    ${extract('function eventEffects(', 'function setMeter(')} eventEffects(); eventEffects();`);
  assert.equal(h.dom['reward-banner'].textContent, events[0].text);
  assert.doesNotMatch(h.dom['reward-banner'].textContent, /獲得|保留|帶回/);
});

test('safe loot UI: unsupported imported equipment metadata shows meaningful error before confirmation and preserves progress', async () => {
  const h = harness(), before = structuredClone(h.state), stored = JSON.stringify(h.state);
  const storage = new Map([['SAVE_KEY', stored]]);
  let confirmationCount = 0;
  Object.assign(h.context, { validateSave, console: { warn() {} }, confirm() { confirmationCount++; return true; }, save() { storage.set('SAVE_KEY', JSON.stringify(h.context.state)); } });
  h.run(extract("let importGeneration = 0;", "window.addEventListener('popstate'"));
  for (const mutate of [save => { save.inventory[0].futureTrait = true; }, save => { save.inventory[0].stats.luck = 10; }, save => { save.inventory[0].rolls = { luck: 70 }; }]) {
    const input = structuredClone(h.state); mutate(input);
    const bytes = JSON.stringify(input), event = { target: { files: [{ size: bytes.length, text: async () => bytes }], value: 'file' } };
    await h.dom['save-file'].emit('change', event);
    assert.deepEqual(h.state, before);
    assert.equal(JSON.stringify(h.state), stored);
    assert.equal(storage.get('SAVE_KEY'), stored, 'failed import must not call the save boundary');
    assert.match(h.toasts.at(-1), /不支援的裝備欄位或格式.*目前進度沒有改變/);
    assert.equal(confirmationCount, 0, 'rejected data must never reach replace-progress confirmation');
  }
  assert.match(js, /原始資料尚未覆寫/);
  assert.match(js, /let preventOverwrite = loaded\.error \|\| !storeAvailable/);
  const corrupt = JSON.parse(stored); corrupt.inventory[0].futureTrait = true;
  const bytes = JSON.stringify(corrupt), reads = [];
  const result = loadVersionedSave({ read(key) { reads.push(key); return bytes; }, currentKey: 'v3', legacyKeys: ['v2'], validate: validateSave, create: () => createGame(1) });
  assert.equal(result.error, true);
  assert.equal(result.raw, bytes);
  assert.deepEqual(reads, ['v3']);
  const ordinary = validateSave(JSON.parse(stored));
  assert.equal(ordinary.inventory.length, before.inventory.length);
  const unknownName = JSON.parse(stored); unknownName.inventory[0].name = '外來但結構已知的武器';
  assert.equal(validateSave(unknownName).inventory[0].name, unknownName.inventory[0].name);
  assert.equal(previewSafeSale(validateSave(unknownName)).items.some(item => item.id === 'first'), false);
});

test('safe loot UI: ownership loss during awaited file read aborts import before confirmation or saving', async () => {
  const h = harness(), before = structuredClone(h.state), stored = JSON.stringify(h.state);
  const storage = new Map([['SAVE_KEY', stored]]), incoming = createGame(36);
  incoming.hero.gold = 999; incoming.autoSell = true;
  let resolveRead, confirmations = 0;
  const read = new Promise(resolve => { resolveRead = resolve; });
  Object.assign(h.context, { validateSave, console: { warn() {} }, confirm() { confirmations++; return true; }, save() { storage.set('SAVE_KEY', JSON.stringify(h.context.state)); } });
  h.run(extract("let importGeneration = 0;", "window.addEventListener('popstate'"));
  const pending = h.dom['save-file'].emit('change', { target: { value: 'file', files: [{ size: 1000, text: () => read }] } });
  h.context.tabOwner = false;
  resolveRead(JSON.stringify(incoming));
  await pending;
  assert.equal(confirmations, 0);
  assert.deepEqual(h.context.state, before);
  assert.equal(storage.get('SAVE_KEY'), stored);
  assert.match(h.toasts.at(-1), /失去進度控制權，未匯入/);
});
