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
const controllers = js.slice(js.indexOf('function abilityNumber('), js.indexOf('function commissionQuoteSignature('));
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
  const context = createContext({...engine, ...session, ...loot, JSON, window, document, location: {pathname: '/'},
    act(state, action, payload) { calls.push({action, payload}); options.beforeAction?.(state, action, payload); if (!options.noop) return engine.act(state, action, payload); return state; },
    performance: {now: () => 0}, navigator: {}, crypto: {randomUUID: () => 'ability-ui-test'},
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
function levelFixture(level = 4, proficiency = 2.4) { const state = engine.createGame(42); state.hero.level = level; state.hero.proficiency = proficiency; return state; }
async function learnAndSlot(h, id) { await h.button(id, 'learn').click(); await h.button(id, 'slot').click(); }

for (const level of [1, 4, 19]) {
  test(`legacy level ${level} starts unallocated with exact earned AP and five free slots`, () => {
    const initial = levelFixture(level), h = fullUI(initial);
    assert.equal(Object.hasOwn(h.state, 'abilities'), false);
    assert.equal(h.dom['ability-ap'].textContent, `可用 AP ${level} / 累計 ${level}`);
    assert.equal(h.dom['ability-slots'].textContent, 'Major 槽 0 / 5 · 全部免費');
    assert.equal(h.dom['ability-choices'].children.length, 3);
    assert.equal(h.button('hp-tank', 'learn').disabled, false);
    assert.equal(h.button('mp-tank', 'learn').disabled, false);
    assert.equal(h.button('one-handed-damage', 'learn').disabled, level < 2);
    for (const id of ['hp-tank', 'mp-tank', 'one-handed-damage']) {
      assert.equal(h.button(id, 'slot').disabled, true); assert.equal(h.button(id, 'refund').disabled, true);
    }
    assert.deepEqual(h.calls, []); assert.deepEqual(h.faults, []);
  });
}

test('fresh previews show exact pools, fractional sheet attack and a genuinely zero 1H bonus', () => {
  const h = fullUI();
  assert.match(collect(h.card('hp-tank')), /生命上限：目前 575 → 裝配後 630/);
  assert.match(collect(h.card('mp-tank')), /魔力上限：目前 19 → 裝配後 20/);
  assert.match(collect(h.card('one-handed-damage')), /面板攻擊 ADB：目前 36\.95 → 裝配後 36\.95/);
  assert.match(collect(h.card('one-handed-damage')), /有效單手熟練度 0 · 此能力 ADB 加成：目前 \+0 → 裝配後 \+0/);
  assert.match(collect(h.card('one-handed-damage')), /學習費用 2 AP · 可用 AP 不足/);
});

test('learning spends AP but does not equip; slotting is a separate free action with exact pool recovery', async () => {
  const h = fullUI(), seed = h.state.seed, gold = h.state.hero.gold, before = engine.stats(h.state);
  const oldLearn = h.button('hp-tank', 'learn'); oldLearn.focus(); await oldLearn.click();
  assert.deepEqual(clone(h.state.abilities), {learned: ['hp-tank'], slotted: []});
  assert.deepEqual(engine.stats(h.state), before); assert.equal(h.dom['ability-ap'].textContent, '可用 AP 0 / 累計 1');
  assert.match(h.dom['ability-feedback'].textContent, /尚未裝配.*另按「裝入能力槽」才生效/);
  assert.equal(h.document.activeElement, h.button('hp-tank', 'slot'), 'keyboard focus advances to the separate available slot action');
  await oldLearn.click(); assert.equal(h.calls.length, 1, 'stale repeated learn is rejected before dispatch');
  h.state.hero.hp = 1; h.state.hero.mp = 1;
  await h.button('hp-tank', 'slot').click();
  assert.deepEqual(clone(h.state.abilities.slotted), ['hp-tank']); assert.equal(engine.stats(h.state).maxHp, 630);
  assert.equal(h.state.hero.hp, 630); assert.equal(h.state.hero.mp, 19);
  assert.equal(h.dom['ability-slots'].textContent, 'Major 槽 1 / 5 · 全部免費');
  assert.match(collect(h.card('hp-tank')), /目前 630 → 裝配後 630（已包含此能力）/);
  assert.equal(h.state.seed, seed); assert.equal(h.state.hero.gold, gold); assert.equal(h.confirmations, 0);
});

test('all three nodes can coexist in five slots; AP, not a fake one-slot restriction, limits early choices', async () => {
  const h = fullUI(levelFixture());
  for (const id of ['hp-tank', 'mp-tank', 'one-handed-damage']) await learnAndSlot(h, id);
  assert.equal(h.dom['ability-ap'].textContent, '可用 AP 0 / 累計 4');
  assert.equal(h.dom['ability-slots'].textContent, 'Major 槽 3 / 5 · 全部免費');
  assert.equal(engine.abilityView(h.state).majorUsed, 3);
  assert.equal(h.dom['ability-choices'].children.every(card => card.className.includes('is-slotted')), true);
  assert.equal(h.confirmations, 0); assert.deepEqual(h.faults, []);
});

test('unslot retains learning/AP; refund simultaneously unlearns, unslots and restores exact AP without currency or RNG', async () => {
  const h = fullUI(levelFixture()), seed = h.state.seed, gold = h.state.hero.gold;
  await learnAndSlot(h, 'one-handed-damage');
  const learnedStats = engine.stats(h.state);
  await h.button('one-handed-damage', 'slot').click();
  assert.deepEqual(clone(h.state.abilities), {learned: ['one-handed-damage'], slotted: []});
  assert.equal(h.dom['ability-ap'].textContent, '可用 AP 2 / 累計 4');
  assert.match(h.dom['ability-feedback'].textContent, /仍已學習，AP 不退還/);
  assert.ok(engine.stats(h.state).attack < learnedStats.attack);
  await h.button('one-handed-damage', 'slot').click();
  const staleRefund = h.button('one-handed-damage', 'refund'); await staleRefund.click();
  assert.equal(Object.hasOwn(h.state, 'abilities'), false); assert.equal(h.dom['ability-ap'].textContent, '可用 AP 4 / 累計 4');
  assert.match(h.dom['ability-feedback'].textContent, /免費遺忘.*同時卸下並退還 2 AP/);
  const before = JSON.stringify(h.state), count = h.calls.length; await staleRefund.click();
  assert.equal(JSON.stringify(h.state), before); assert.equal(h.calls.length, count);
  assert.equal(h.state.seed, seed); assert.equal(h.state.hero.gold, gold); assert.equal(h.confirmations, 0);
});

test('free refund permits a fresh level-one choice without an irreversible confirm overlay', async () => {
  const h = fullUI(); await learnAndSlot(h, 'hp-tank'); await h.button('hp-tank', 'refund').click(); await learnAndSlot(h, 'mp-tank');
  assert.deepEqual(clone(h.state.abilities), {learned: ['mp-tank'], slotted: ['mp-tank']});
  assert.equal(engine.stats(h.state).maxHp, 575); assert.equal(engine.stats(h.state).maxMp, 20);
  assert.equal(h.confirmations, 0);
  assert.equal(Object.entries(h.dom).filter(([id]) => id.endsWith('-dialog')).some(([, el]) => el.open), false);
});

for (const mode of ['battle', 'defeat', 'readonly', 'inactive']) {
  test(`${mode} disables all ability mutations, including forced stale handlers`, async () => {
    const h = fullUI(levelFixture()); await learnAndSlot(h, 'hp-tank');
    const oldButtons = ['learn', 'slot', 'refund'].map(kind => h.button('mp-tank', kind));
    const refund = h.button('hp-tank', 'refund');
    if (mode === 'readonly') h.run('tabOwner = false;'); else if (mode === 'inactive') h.run('pageActive = false;'); else h.state.mode = mode;
    h.render();
    assert.equal(h.dom['ability-choices'].children.every(card => card.children.find(child => child.className === 'ability-actions').children.every(button => button.disabled)), true);
    const before = JSON.stringify(h.state), count = h.calls.length;
    for (const button of [...oldButtons, refund]) await button.click();
    assert.equal(JSON.stringify(h.state), before); assert.equal(h.calls.length, count);
    assert.match(h.dom['ability-feedback'].textContent, mode === 'readonly' || mode === 'inactive' ? /唯讀/ : /請先回營/);
  });
}

test('stale allowed-looking learn and slot recheck current AP and learning instead of claiming success', async () => {
  const h = fullUI(), oldMpLearn = h.button('mp-tank', 'learn');
  await h.button('hp-tank', 'learn').click(); const count = h.calls.length;
  await oldMpLearn.click(); await h.button('mp-tank', 'slot').click();
  assert.equal(h.calls.length, count); assert.deepEqual(clone(h.state.abilities), {learned: ['hp-tank'], slotted: []});
  assert.match(h.dom['ability-feedback'].textContent, /條件不符或已完成/);
});

test('a rejected engine action never produces success feedback, even when dispatch itself returns true', async () => {
  const h = fullUI(levelFixture(), {noop: true}), before = JSON.stringify(h.state);
  await h.button('hp-tank', 'learn').click();
  assert.equal(JSON.stringify(h.state), before); assert.equal(h.calls.length, 1);
  assert.match(h.dom['ability-feedback'].textContent, /操作未確認完成/);
  assert.doesNotMatch(h.dom['ability-feedback'].textContent, /已學習|已裝配|已免費遺忘/);
});

test('engine-side state changes between validation and dispatch cannot produce false positive completion', async () => {
  const h = fullUI(levelFixture(), {beforeAction: (state, action) => { if (action === 'learnAbility') state.mode = 'battle'; }});
  await h.button('hp-tank', 'learn').click();
  assert.equal(Object.hasOwn(h.state, 'abilities'), false); assert.match(h.dom['ability-feedback'].textContent, /操作未確認完成/);
});

test('live level, equipment and proficiency changes invalidate previews; rendered numbers come directly from engine stats', async () => {
  const h = fullUI(levelFixture(4, 1.28));
  for (const [level, proficiency, hp, attack] of [[4, 1.28, 82.5, 17.42], [9, 999, 140, 21.75], [10, .24, 1, 3]]) {
    h.state.hero.level = level; h.state.hero.proficiency = proficiency; h.state.equipment.armor.stats.hp = hp; h.state.equipment.weapon.stats.attack = attack; h.render();
    const view = engine.abilityView(h.state);
    for (const choice of view.catalog) {
      const key = choice.id === 'hp-tank' ? 'maxHp' : choice.id === 'mp-tank' ? 'maxMp' : 'attack';
      assert.ok(collect(h.card(choice.id)).includes(`目前 ${view.currentStats[key]} → 裝配後 ${choice.previewStats[key]}`));
    }
    assert.ok(collect(h.card('one-handed-damage')).includes(`有效單手熟練度 ${view.effects.effectiveProficiency}`));
    assert.ok(collect(h.card('one-handed-damage')).includes(`裝配後 +${view.catalog[2].previewEffects.attackBonus}`));
  }
  await learnAndSlot(h, 'one-handed-damage');
  const view = engine.abilityView(h.state);
  assert.ok(collect(h.card('one-handed-damage')).includes(`目前 +${view.effects.attackBonus} → 裝配後 +${view.effects.attackBonus}`));
});

test('ability rendering is side-effect-free, preserves unchanged card identity and consumes no random draws', () => {
  const h = fullUI(levelFixture()), before = JSON.stringify(h.state), cards = h.dom['ability-choices'].children, writes = clone(h.writes);
  for (let i = 0; i < 10; i++) h.render();
  assert.equal(h.dom['ability-choices'].children, cards); assert.equal(JSON.stringify(h.state), before);
  assert.deepEqual(h.calls, []); assert.deepEqual(h.writes, writes);
  const renderer = controllers.slice(controllers.indexOf('function renderAbilities('));
  assert.doesNotMatch(renderer, /\bact\(|\badvance\(|\bdispatch\(|\bsave\(|Math\.random/);
});

test('reload and accepted import retain valid explicit allocations; legacy import resets to unallocated AP, not a default build', async () => {
  const h = fullUI(levelFixture()); await learnAndSlot(h, 'hp-tank'); await h.button('mp-tank', 'learn').click();
  const saved = clone(h.state), reload = fullUI(saved);
  assert.deepEqual(clone(reload.state.abilities), clone(h.state.abilities)); assert.equal(reload.dom['ability-ap'].textContent, '可用 AP 2 / 累計 4');
  await reload.import(levelFixture(19));
  assert.equal(Object.hasOwn(reload.state, 'abilities'), false); assert.equal(reload.dom['ability-ap'].textContent, '可用 AP 19 / 累計 19');
  assert.equal(reload.dom['ability-slots'].textContent, 'Major 槽 0 / 5 · 全部免費'); assert.equal(reload.dom['ability-feedback'].textContent, '');
  await reload.import(saved); assert.deepEqual(clone(reload.state.abilities), saved.abilities);
});

test('canceled, malformed and invalid-ability imports preserve the visible allocation and current journey', async () => {
  const h = fullUI(levelFixture()); await learnAndSlot(h, 'hp-tank'); const before = JSON.stringify(h.state), text = collect(h.card('hp-tank'));
  h.approve = false; await h.import(levelFixture(19)); h.approve = true;
  await h.import('{broken');
  const invalid = levelFixture(); invalid.abilities = {learned: ['unknown'], slotted: ['unknown']}; await h.import(invalid);
  assert.equal(JSON.stringify(h.state), before); assert.equal(collect(h.card('hp-tank')), text);
});

test('ownership/adopted-state synchronization clears stale ability feedback and updates permissions', async () => {
  const h = fullUI(levelFixture()); await learnAndSlot(h, 'hp-tank');
  h.run('tabOwner = false; syncSelection(); render(true);');
  assert.equal(h.dom['ability-feedback'].textContent, ''); assert.match(h.dom['ability-status'].textContent, /唯讀/);
  assert.equal(h.button('hp-tank', 'refund').disabled, true);
  h.run('tabOwner = true; syncSelection(); render(true);'); assert.equal(h.button('hp-tank', 'refund').disabled, false);
});

test('AP controls are accessible text with compact wrapping; rules distinguish original references from adaptations', () => {
  const section = html.slice(html.indexOf('<section class="camp-abilities'), html.indexOf('<section class="expedition-reports'));
  assert.match(section, /aria-labelledby="ability-heading"[^>]*aria-describedby="ability-intro"/);
  assert.match(section, /id="ability-feedback"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
  assert.match(section, /<details class="ability-rules"><summary>/); assert.doesNotMatch(section, /<dialog|<details[^>]+\bopen\b/);
  for (const text of ['5 格皆免費', '不必只選一項', '預設不分配', 'Lv.1 累計 1 AP', '不是完整能力樹', '沒有付費加槽', '免費重配是本作改編', '固定裝備生命的順序為本作整合規則', '熟練度為 0 時加成也是 0', '保留其他已裝能力', '最大 HP 的 27%／40%／10%', '不是原版常以基礎 HP 計算的 Cure', '舊存檔都從未學習、未裝配開始', '舊版分頁可能不保留能力配置；請重新整理再接手', 'Lv.4 的 4 AP 就能學齊目前三項', '非原版最高階']) assert.ok(section.includes(text), text);
  assert.match(css, /\.ability-card \{[^}]*min-width: 0[^}]*overflow-wrap: anywhere/);
  assert.match(css, /\.ability-actions \{[^}]*flex-wrap: wrap/);
  assert.match(js, /renderSafeLoot\(\);\s*renderAbilities\(\);/);
  assert.doesNotMatch(controllers, /\.innerHTML|confirm\(|showModal\(|Math\.random/);
  const h = fullUI();
  for (const id of ['hp-tank', 'mp-tank', 'one-handed-damage']) for (const action of ['learn', 'slot', 'refund']) {
    const button = h.button(id, action); assert.equal(button.tag, 'button'); assert.ok(button.attributes['aria-label'].includes(button.textContent));
  }
});
