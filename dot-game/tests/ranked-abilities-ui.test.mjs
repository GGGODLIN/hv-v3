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
function levelFixture(level = 4, proficiency = 2.4) { const state = engine.createGame(42); state.hero.level = level; state.hero.proficiency = proficiency; return state; }
async function learnAndSlot(h, id) { await h.button(id, 'learn').click(); await h.button(id, 'slot').click(); }

// Use the real engine and the full UI boot path. Disabled/detached button
// handlers are deliberately invoked, so capability checks are tested too.
const ids = ['hp-tank', 'mp-tank', 'one-handed-damage'];
const firstGates = {'hp-tank': 25, 'mp-tank': 30, 'one-handed-damage': 100};
const firstUpgradeCosts = {'hp-tank': 2, 'mp-tank': 2, 'one-handed-damage': 3};
const maxima = {'hp-tank': 10, 'mp-tank': 10, 'one-handed-damage': 3};
const statKey = id => id === 'hp-tank' ? 'maxHp' : id === 'mp-tank' ? 'maxMp' : 'attack';
const row = (h, id) => engine.abilityView(h.state).catalog.find(entry => entry.id === id);

for (const id of ids) {
  test(`${id}: rank zero is honest; next rank gate remains visible and locked until the exact level`, async () => {
    const gate = firstGates[id], h = fullUI(levelFixture(gate - 1));
    assert.match(collect(h.card(id)), new RegExp(`Rank 0 / ${maxima[id]}`));
    assert.match(collect(h.card(id)), /尚未學習/);
    await h.button(id, 'learn').click();
    assert.match(collect(h.card(id)), new RegExp(`Rank 1 / ${maxima[id]}`));
    assert.match(collect(h.card(id)), new RegExp(`下一階 Rank 2 · 尚需 Lv\\.${gate}`));
    assert.equal(h.button(id, 'upgrade').disabled, true);
    assert.match(collect(h.card(id)), /下一階預覽（假設升階並裝配，未直接套用）/);
    const before = JSON.stringify(h.state), count = h.calls.length;
    await h.button(id, 'upgrade').click();
    assert.equal(JSON.stringify(h.state), before); assert.equal(h.calls.length, count);
    h.state.hero.level = gate; h.render();
    assert.match(collect(h.card(id)), new RegExp(`Lv\\.${gate} 門檻已達成`));
    assert.equal(h.button(id, 'upgrade').disabled, false);
    await h.button(id, 'upgrade').click();
    assert.equal(row(h, id).currentRank, 2);
    assert.match(collect(h.card(id)), new RegExp(`Rank 2 / ${maxima[id]}`));
    assert.deepEqual(h.faults, []);
  });

  test(`${id}: inactive rank upgrade spends the incremental AP, refunds cumulative AP, and never auto-slots`, async () => {
    const h = fullUI(levelFixture(500, 2.45)), base = engine.stats(h.state), gold = h.state.hero.gold, seed = h.state.seed;
    await h.button(id, 'learn').click();
    const before = engine.abilityView(h.state), choice = row(h, id), upgradePreview = choice.upgradePreviewStats;
    assert.ok(collect(h.card(id)).includes(`目前 ${base[statKey(id)]} → ${upgradePreview[statKey(id)]}`));
    assert.match(collect(h.card(id)), /只升階仍不生效，須另行裝配/);
    await h.button(id, 'upgrade').click();
    const spent = choice.apCost + firstUpgradeCosts[id];
    assert.equal(row(h, id).spentAp, spent);
    assert.equal(engine.abilityView(h.state).availableAp, before.availableAp - firstUpgradeCosts[id]);
    assert.deepEqual(engine.stats(h.state), base);
    assert.equal(row(h, id).slotted, false);
    assert.match(h.dom['ability-feedback'].textContent, /保持未裝配，尚未生效/);
    assert.match(collect(h.card(id)), new RegExp(`累計已用 ${spent} AP · 免費遺忘退還 ${spent} AP`));
    assert.equal(h.button(id, 'refund').textContent, `免費遺忘 · 退 ${spent} AP`);
    await h.button(id, 'slot').click();
    assert.deepEqual(engine.stats(h.state), upgradePreview);
    assert.equal(engine.abilityView(h.state).majorUsed, 1);
    await h.button(id, 'refund').click();
    assert.equal(row(h, id).currentRank, 0);
    assert.equal(engine.abilityView(h.state).availableAp, 500);
    assert.deepEqual(engine.stats(h.state), base);
    assert.equal(h.state.hero.gold, gold); assert.equal(h.state.seed, seed);
    assert.equal(h.confirmations, 0); assert.deepEqual(h.faults, []);
  });

  test(`${id}: active rank upgrades preserve one slot and use the distinct next preview exactly`, async () => {
    const h = fullUI(levelFixture(500, 1.37)); await learnAndSlot(h, id);
    const choice = row(h, id), oldStats = engine.stats(h.state);
    assert.deepEqual(choice.previewStats, oldStats);
    assert.notDeepEqual(choice.upgradePreviewStats, oldStats);
    const upgrade = h.button(id, 'upgrade'); upgrade.focus(); await upgrade.click();
    assert.deepEqual(engine.stats(h.state), choice.upgradePreviewStats);
    assert.equal(engine.abilityView(h.state).majorUsed, 1);
    assert.equal(row(h, id).slotted, true);
    assert.match(h.dom['ability-feedback'].textContent, /保持裝配，新階級現在生效/);
    assert.equal(h.document.activeElement, h.button(id, 'upgrade'));
    assert.equal(h.state.hero.hp, engine.stats(h.state).maxHp);
    assert.equal(h.state.hero.mp, engine.stats(h.state).maxMp);
  });

  test(`${id}: highest rank has no invented next effect, remains slottable and fully refundable`, async () => {
    const h = fullUI(levelFixture(500)); await h.button(id, 'learn').click();
    while (row(h, id).nextRank) await h.button(id, 'upgrade').click();
    const choice = row(h, id), spent = id === 'one-handed-damage' ? 10 : 36;
    assert.equal(choice.currentRank, maxima[id]); assert.equal(choice.spentAp, spent);
    assert.match(collect(h.card(id)), new RegExp(`已達最高 Rank ${maxima[id]} · 沒有下一階`));
    assert.doesNotMatch(collect(h.card(id)), /下一階預覽|undefined|NaN/);
    assert.equal(h.button(id, 'upgrade').disabled, true);
    assert.equal(h.button(id, 'slot').disabled, false); assert.equal(h.button(id, 'refund').disabled, false);
    const before = JSON.stringify(h.state), count = h.calls.length;
    await h.button(id, 'upgrade').click(); assert.equal(JSON.stringify(h.state), before); assert.equal(h.calls.length, count);
    await h.button(id, 'refund').click();
    assert.equal(engine.abilityView(h.state).availableAp, 500);
    assert.match(h.dom['ability-feedback'].textContent, new RegExp(`退還 ${spent} AP`));
    assert.deepEqual(h.faults, []);
  });
}

test('1H next-rank preview preserves a genuinely zero or fractional proficiency bonus without claiming better damage', async () => {
  for (const proficiency of [0, 0.13, 1.37]) {
    const h = fullUI(levelFixture(200, proficiency)); await h.button('one-handed-damage', 'learn').click();
    const choice = row(h, 'one-handed-damage');
    assert.ok(collect(h.card(choice.id)).includes(`此能力 ADB 加成 +${choice.upgradePreviewEffects.attackBonus}`));
    assert.ok(collect(h.card(choice.id)).includes(`目前 ${engine.stats(h.state).attack} → ${choice.upgradePreviewStats.attack}`));
    assert.match(collect(h.card(choice.id)), /未裝配時不生效/);
    if (proficiency === 0) assert.equal(choice.upgradePreviewStats.attack, engine.stats(h.state).attack);
  }
  assert.match(html, /不是傷害或勝率保證/);
});

for (const mode of ['battle', 'defeat', 'readonly', 'inactive']) {
  test(`${mode} blocks every rank action, including forced detached handlers`, async () => {
    const h = fullUI(levelFixture(500)); await learnAndSlot(h, 'hp-tank');
    const buttons = ['upgrade', 'slot', 'refund'].map(kind => h.button('hp-tank', kind));
    if (mode === 'readonly') h.run('tabOwner = false;'); else if (mode === 'inactive') h.run('pageActive = false;'); else h.state.mode = mode;
    h.render();
    assert.equal(h.dom['ability-choices'].children.every(card => card.children.find(child => child.className === 'ability-actions').children.every(button => button.disabled)), true);
    const before = JSON.stringify(h.state), count = h.calls.length;
    for (const button of buttons) await button.click();
    assert.equal(JSON.stringify(h.state), before); assert.equal(h.calls.length, count);
    assert.match(h.dom['ability-feedback'].textContent, /唯讀|請先回營/);
  });
}

test('one rendered upgrade buys one rank only; repeated and rank-stale controls never buy another or refund an unseen amount', async () => {
  const h = fullUI(levelFixture(500)); await h.button('hp-tank', 'learn').click();
  const oldUpgrade = h.button('hp-tank', 'upgrade'), oldRefund = h.button('hp-tank', 'refund'), oldSlot = h.button('hp-tank', 'slot');
  await oldUpgrade.click();
  const before = JSON.stringify(h.state), count = h.calls.length;
  for (const stale of [oldUpgrade, oldUpgrade, oldRefund, oldSlot]) await stale.click();
  assert.equal(JSON.stringify(h.state), before); assert.equal(h.calls.length, count);
  assert.equal(row(h, 'hp-tank').currentRank, 2);
  assert.match(h.dom['ability-feedback'].textContent, /查看最新階級與費用/);
  await h.button('hp-tank', 'upgrade').click(); assert.equal(row(h, 'hp-tank').currentRank, 3);
});

test('detached buttons remain stale after refund/relearn or same-rank save adoption', async () => {
  const h = fullUI(levelFixture(500)); await h.button('hp-tank', 'learn').click();
  const oldUpgrade = h.button('hp-tank', 'upgrade'), oldRefund = h.button('hp-tank', 'refund');
  await h.button('hp-tank', 'refund').click(); await h.button('hp-tank', 'learn').click();
  const before = JSON.stringify(h.state), count = h.calls.length;
  await oldUpgrade.click(); await oldRefund.click();
  assert.equal(JSON.stringify(h.state), before); assert.equal(h.calls.length, count);
  const beforeImport = h.button('hp-tank', 'upgrade'); await h.import(clone(h.state));
  const adopted = JSON.stringify(h.state), adoptedCalls = h.calls.length;
  await beforeImport.click();
  assert.equal(JSON.stringify(h.state), adopted); assert.equal(h.calls.length, adoptedCalls);
  assert.equal(row(h, 'hp-tank').currentRank, 1);
  await h.button('hp-tank', 'upgrade').click(); assert.equal(row(h, 'hp-tank').currentRank, 2);
});

test('an engine no-op or intervening battle cannot produce successful rank feedback', async () => {
  for (const failure of ['noop', 'battle']) {
    const initial = levelFixture(500); engine.act(initial, 'learnAbility', 'hp-tank');
    const h = fullUI(initial, failure === 'noop' ? {noop: true} : {beforeAction: (state, action) => {if (action === 'upgradeAbility') state.mode = 'battle';}});
    await h.button('hp-tank', 'upgrade').click();
    assert.equal(row(h, 'hp-tank').currentRank, 1);
    assert.match(h.dom['ability-feedback'].textContent, /操作未確認完成/);
    assert.doesNotMatch(h.dom['ability-feedback'].textContent, /已升階/);
  }
});

test('live engine capability changes disable upgrading and are rechecked before dispatch', async () => {
  const h = fullUI(levelFixture(500)); await h.button('hp-tank', 'learn').click(); const stale = h.button('hp-tank', 'upgrade');
  // The current three-line budget is generous at rank gates. Exercise the
  // explicit view contract rather than fabricating an invalid over-budget save.
  h.run(`const originalAbilityView = abilityView; abilityView = state => {
    const view = originalAbilityView(state); view.availableAp = 0;
    for (const choice of view.catalog) choice.canUpgrade = false;
    return view;
  };`);
  h.render();
  assert.equal(h.button('hp-tank', 'upgrade').disabled, true);
  assert.match(collect(h.card('hp-tank')), /額外 2 AP · 可用 AP 不足/);
  const before = JSON.stringify(h.state), count = h.calls.length; await stale.click();
  assert.equal(JSON.stringify(h.state), before); assert.equal(h.calls.length, count);
});

test('ranked reload/import preserves learned-versus-active state and rejected imports preserve visible data', async () => {
  const h = fullUI(levelFixture(500)); await learnAndSlot(h, 'hp-tank'); await h.button('hp-tank', 'upgrade').click();
  await h.button('mp-tank', 'learn').click(); await h.button('mp-tank', 'upgrade').click();
  const saved = clone(h.state), reload = fullUI(saved);
  assert.deepEqual(clone(reload.state.abilities), saved.abilities);
  assert.match(collect(reload.card('hp-tank')), /Rank 2 \/ 10.*已裝配 · 生效中/);
  assert.match(collect(reload.card('mp-tank')), /Rank 2 \/ 10.*已學習 · 未生效/);
  const invalid = clone(saved); invalid.abilities.ranks['hp-tank'] = 11;
  const before = JSON.stringify(reload.state); await reload.import(invalid);
  assert.equal(JSON.stringify(reload.state), before);
  await reload.import(levelFixture(19));
  assert.equal(row(reload, 'hp-tank').currentRank, 0); assert.equal(reload.dom['ability-feedback'].textContent, '');
  await reload.import(saved); assert.deepEqual(clone(reload.state.abilities), saved.abilities);
  assert.deepEqual(reload.faults, []);
});

test('rendering ranked previews is pure and keyboard focus survives learning and reaching max rank', async () => {
  const h = fullUI(levelFixture(500));
  const learn = h.button('one-handed-damage', 'learn'); learn.focus(); await learn.click();
  assert.equal(h.document.activeElement, h.button('one-handed-damage', 'slot'));
  while (row(h, 'one-handed-damage').nextRank) { const upgrade = h.button('one-handed-damage', 'upgrade'); upgrade.focus(); await upgrade.click(); }
  assert.equal(h.document.activeElement, h.button('one-handed-damage', 'slot'));
  const before = JSON.stringify(h.state), cards = h.dom['ability-choices'].children, calls = h.calls.length;
  for (let i = 0; i < 10; i++) h.render();
  assert.equal(JSON.stringify(h.state), before); assert.equal(h.dom['ability-choices'].children, cards); assert.equal(h.calls.length, calls);
});

test('rank copy is bounded, native-keyboard accessible, responsive, and warns about old writer tabs before takeover', async () => {
  assert.match(html, /v0\.43 · 來源候選/);
  assert.match(html, /HP Tank（10 階）、MP Tank（10 階）與 1H Damage（3 階）/);
  assert.match(html, /仍不是完整能力樹/);
  assert.doesNotMatch(html, /目前只實作三項 Rank 1|這裡先實作.*的 Rank 1，非/);
  const settings = html.slice(html.indexOf('<dialog id="settings-dialog"'));
  assert.ok(settings.indexOf('v0.10 舊分頁無法讀取 Rank 2 以上') < settings.indexOf('id="takeover-button"'));
  assert.match(settings, /重新整理所有舊版分頁，再接手/);
  for (const key of ['save', 'preferences', 'writer']) assert.ok(js.includes(`${key}-v3`));
  assert.match(js, /candidate-\$\{candidatePath\[1\]/);
  assert.match(css, /\.ability-actions>button \{[^}]*min-width: 0[^}]*white-space: normal[^}]*overflow-wrap: anywhere/);
  assert.match(css, /\.ability-actions>button:focus-visible/);
  assert.match(css, /@media\(max-width:680px\).*ability-actions>button/);
  const h = fullUI(levelFixture(500)); await h.button('hp-tank', 'learn').click();
  assert.equal(h.card('hp-tank').children.find(child => child.className === 'ability-actions').children.length, 3);
  for (const action of ['upgrade', 'slot', 'refund']) {
    const button = h.button('hp-tank', action); assert.equal(button.tag, 'button'); assert.ok(button.attributes['aria-label'].includes(button.textContent));
  }
  assert.doesNotMatch(controllers, /\.innerHTML|confirm\(|showModal\(|Math\.random/);
});
