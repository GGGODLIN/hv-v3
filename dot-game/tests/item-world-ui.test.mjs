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
function fixture({ family = 'rapier', equipped = false, seeds = 3, level = 8, quality = 'Superior', bound = true } = {}) {
  const state = engine.createGame(71);
  state.hero.level = level; state.soulFragments = 1000;
  const qualityDraw = { Crude: .01, Fair: .04, Average: .2, Superior: .6, Exquisite: .8, Magnificent: .95, Legendary: .99, Peerless: .9995 }[quality];
  const draws = [({ axe: 0, rapier: .4, club: .8 })[family], qualityDraw];
  const item = { ...loot.generateItem(() => draws.length ? draws.shift() : .5, 1, 'weapon'), id: 'ui-owned-weapon' };
  assert.equal(item.quality, quality); assert.equal(loot.resolveWeaponFamily(item), family);
  if (equipped) state.equipment.weapon = item; else state.inventory.push(item);
  if (bound) engine.act(state, 'soulbindWeapon', engine.previewSoulbindWeapon(state, item.id));
  state.worldSeeds = seeds;
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
  let now = 0;
  const context = createContext({ ...engine, ...session, ...loot, JSON, window, document, location: { pathname: '/' },
    previewItemWorld: options.preview || engine.previewItemWorld,
    previewSelectedSale: (state, ids) => engine.previewSelectedSale(state, clone(ids)),
    act(state, action, payload) { calls.push({ action, payload: clone(payload ?? null) }); options.beforeAction?.(state, action); if (!options.noop) return engine.act(state, action, payload && typeof payload === 'object' ? clone(payload) : payload); return state; },
    performance: { now: () => now }, navigator: {}, crypto: { randomUUID: () => 'item-world-ui-test' },
    console: { warn() {}, error(...args) { faults.push(args); } }, confirm: () => true,
    localStorage: { getItem: key => key.endsWith('save-v3') ? raw : null, setItem: (...args) => writes.push(args) },
    setTimeout() { return 1; }, clearTimeout() {}, setInterval() { return 1; }, requestAnimationFrame() {}, ResizeObserver: class { observe() {} } });
  const run = source => runInContext(source, context); run(js.replace(/^import .+;\n/gm, ''));
  return { dom, window, document, calls, faults, writes, run, at(value) { assert.ok(value >= now); now = value; }, tick() { return run('pump.tick()'); }, get state() { return run('state'); },
    inspect(equipped = false) { run(equipped ? "selectedSlot='weapon';selectedId=null;render(true);" : "selectedSlot=null;selectedId='ui-owned-weapon';render(true);"); },
    render() { run('render(true);'); },
    async import(state) { const input = JSON.stringify(state); await dom['save-file'].emit('change', { target: { value: 'save.json', files: [{ size: input.length, text: async () => input }] } }); },
  };
}
const open = h => h.run("openItemWorld('ui-owned-weapon');");
const trialButton = h => find(h.dom['item-detail'], el => el.dataset.itemWorldId === 'ui-owned-weapon');

test('IW1 UI: sidebar balances are always discoverable, unique and live without automatic spending', () => {
  const h = fullUI(); h.inspect();
  assert.equal(h.dom['world-seed-balance'].textContent, '3 世界之種');
  assert.equal(h.dom['soul-fragment-balance'].textContent, '900 靈魂碎片');
  assert.ok(trialButton(h)); assert.equal(trialButton(h).disabled, false);
  assert.equal(h.calls.length, 0); assert.equal(h.dom['item-world-dialog'].open, false);
  h.run('state.worldSeeds++;state.soulFragments+=10;render();');
  assert.equal(h.dom['world-seed-balance'].textContent, '4 世界之種');
  assert.equal(h.dom['soul-fragment-balance'].textContent, '910 靈魂碎片');
  const aside = html.slice(html.indexOf('<aside'), html.indexOf('</aside>'));
  for (const id of ['world-seed-balance', 'soul-fragment-balance']) {
    assert.ok(aside.includes(`id="${id}"`)); assert.equal(html.match(new RegExp(`id="${id}"`, 'g')).length, 1);
  }
  for (const copy of ['普通遠征每次通關固定 +1 世界之種', '不是原版掉落率', '不補發', 'Fair／Average／Superior', 'IW2–10', '其他品質尚未實作', '不代表原版不合法', '沒有 CP、護符、鍛造或材料獎勵']) assert.ok(html.includes(copy), copy);
  assert.match(html, /v0\.29 · 來源候選/); assert.match(html, /v0\.29 使用資料格式 v3/); assert.match(html, /v0\.23 及更舊版不能讀取新格式/);
});

test('IW1 UI: full exact quote previews seven actual stats, cost and adapted five-round difficulty without mutation', () => {
  const h = fullUI(), before = clone(h.state), quote = engine.previewItemWorld(h.state, 'ui-owned-weapon');
  open(h); assert.deepEqual(clone(h.state), before); assert.equal(h.calls.length, 0);
  assert.equal(h.dom['item-world-dialog'].open, true); assert.equal(h.dom['item-world-confirm'].disabled, false);
  assert.equal(h.dom['item-world-item-name'].textContent, quote.before.name);
  assert.equal(h.dom['item-world-cost'].textContent, '現有 3 − 入場費 1 ＝ 入場後 2 世界之種');
  assert.match(h.dom['item-world-route'].textContent, /5 回合.*Lv\.8.*本作固定強度 5.*不是原版 Lv100／Hard/);
  assert.match(h.dom['item-world-feedback'].textContent, /尚未扣種子.*取消不變更.*不自動換裝/);
  assert.match(h.dom['item-world-confirm'].textContent, /確認消耗 1 世界之種並入場/);
  const rows = h.dom['item-world-comparison'].children; assert.equal(rows.length, 8);
  for (const [index, key] of ['attack', 'defense', 'hp', 'crit', 'evade', 'block', 'parry'].entries()) {
    const rate = ['crit', 'evade', 'block'].includes(key);
    assert.equal(rows[index + 1].children[1].textContent, h.run(`soulbindStat(${quote.before.stats[key] || 0}, ${rate})`));
    assert.equal(rows[index + 1].children[2].textContent, h.run(`soulbindStat(${quote.after.stats[key] || 0}, ${rate})`));
  }
  assert.doesNotMatch(collect(rows[7]), /%/);
  for (const copy of ['攻擊 +2%', '其他基礎屬性 +1%', '實際取整可能不變', 'HP、防禦與整組詞綴縮放屬本作適配', '戰敗、撤退、重載都不退種子（本作適配）', '已結算經驗與戰利品保留', '結束必回營、不自動重刷']) assert.ok(html.includes(copy), copy);
});

test('IW1 UI: fractional values, missing old stats and untrusted names are exact display-only text', () => {
  const h = fullUI(fixture(), { preview: (state, id) => {
    const q = engine.previewItemWorld(state, id);
    if (q.before) { q.before.name = '<img src=x onerror=bad()>'; q.before.stats = { attack: 17, crit: .0211 }; q.after.stats = { attack: 17, crit: .0213 }; }
    return q;
  } }); open(h);
  assert.equal(h.dom['item-world-item-name'].textContent, '<img src=x onerror=bad()>');
  const rows = h.dom['item-world-comparison'].children;
  assert.equal(rows[4].children[1].textContent, '2.11%'); assert.equal(rows[4].children[2].textContent, '2.13%');
  assert.equal(rows[1].children[1].textContent, rows[1].children[2].textContent, 'rounding does not promise a spike');
  assert.equal(rows[7].children[1].textContent, '0'); assert.equal(rows[7].children[2].textContent, '0');
  assert.equal(h.calls.length, 0); assert.doesNotMatch(js, /\.innerHTML\s*=/);
});

for (const quality of ['Superior', 'Exquisite']) for (const family of ['axe', 'rapier', 'club']) for (const equipped of [false, true]) test(`IW1 UI: ${quality} ${family} ${equipped ? 'equipped' : 'backpack'} confirmation dispatches once without equipping or granting early growth`, () => {
  const h = fullUI(fixture({ quality, family, equipped })); h.inspect(equipped);
  const quote = engine.previewItemWorld(h.state, 'ui-owned-weapon'), equipment = clone(h.state.equipment), inventory = clone(h.state.inventory);
  open(h); h.run('confirmItemWorld();confirmItemWorld();');
  assert.deepEqual(h.calls, [{ action: 'enterItemWorld', payload: quote }]);
  assert.equal(h.state.worldSeeds, 2); assert.equal(h.state.mode, 'battle');
  assert.deepEqual(clone(h.state.equipment), equipment); assert.deepEqual(clone(h.state.inventory), inventory);
  assert.equal(engine.itemWorldView(h.state).targetId, quote.id);
  assert.equal(h.dom['item-world-dialog'].open, false); assert.equal(h.run('itemWorldConsent'), null);
  assert.match(h.dom.toast.textContent, /已進入.*IW1.*消耗 1 世界之種.*完成五回合才獲成長/);
  assert.equal(h.document.activeElement, h.dom['retreat-button']); assert.equal(h.faults.length, 0);
});

for (const quality of ['Fair', 'Average', 'Superior', 'Exquisite']) test(`IW1 UI: ${quality} first-tier bound weapon is offered with original maximum disclosed`, () => {
  const h = fullUI(fixture({ quality })); h.inspect(); open(h);
  assert.equal(trialButton(h).disabled, false); assert.equal(h.dom['item-world-confirm'].disabled, false);
  assert.match(h.dom['item-world-item-meta'].textContent, new RegExp(quality));
  assert.ok(html.includes('Fair／Average／Superior 原版上限 IW10')); assert.ok(html.includes('精良（Exquisite）原版上限 IW15'));
  assert.match(h.dom['item-world-status'].textContent, /Fair／Average／Superior／Exquisite.*只實作首階/);
});

test('IW1 UI: zero seeds can inspect costs but cannot enter or invent another payment', () => {
  const h = fullUI(fixture({ seeds: 0 })); h.inspect(); assert.equal(trialButton(h).disabled, false);
  open(h); const before = clone(h.state); h.run('confirmItemWorld();');
  assert.equal(h.dom['item-world-confirm'].disabled, true); assert.equal(h.calls.length, 0); assert.deepEqual(clone(h.state), before);
  assert.match(h.dom['item-world-feedback'].textContent, /不足/); assert.match(h.dom['item-world-cost'].textContent, /入場後 -1/);
  assert.doesNotMatch(h.dom['item-world-confirm'].textContent, /金幣|AP|碎片/);
});

test('IW1 UI: unbound, unimplemented quality, pending-only, armor and completed weapons cannot spend', () => {
  for (const scenario of ['unbound', 'Crude', 'Magnificent', 'Legendary', 'Peerless', 'pending', 'armor', 'completed']) {
    const state = fixture({ bound: scenario !== 'unbound', quality: ['Crude', 'Magnificent', 'Legendary', 'Peerless'].includes(scenario) ? scenario : 'Superior' });
    if (scenario === 'pending') state.pendingLoot = state.inventory.splice(0);
    if (scenario === 'armor') state.inventory = [{ ...state.equipment.armor, id: 'ui-owned-weapon' }];
    if (scenario === 'completed') state.inventory[0] = engine.previewItemWorld(state, 'ui-owned-weapon').after;
    const h = fullUI(state), before = clone(h.state); h.inspect(); open(h); h.run('confirmItemWorld();');
    assert.equal(h.dom['item-world-dialog'].open, false, scenario); assert.equal(h.calls.length, 0, scenario); assert.deepEqual(clone(h.state), before, scenario);
    if (scenario === 'completed') { assert.match(collect(h.dom['item-detail']), /IW1 已完成.*IW10.*尚未實作/); assert.equal(trialButton(h).disabled, true); }
    if (['Crude', 'Magnificent', 'Legendary', 'Peerless'].includes(scenario)) assert.match(h.dom.toast.textContent, /尚未實作|未實作|未開放/);
  }
});

test('IW1 UI: read-only, battle and defeat guards reject forced activations', () => {
  for (const mutation of ['tabOwner=false', "state.mode='battle'", "state.mode='defeat'"]) {
    const h = fullUI(); h.run(`${mutation};`); h.inspect(); assert.equal(trialButton(h).disabled, true);
    const before = clone(h.state); open(h); h.run('confirmItemWorld();');
    assert.deepEqual(clone(h.state), before); assert.equal(h.calls.length, 0); assert.equal(h.dom['item-world-dialog'].open, false);
  }
});

test('IW1 UI: Cancel, Escape, Back, pagehide, import entry and ownership sync clear pending consent', async () => {
  for (const cancel of ['close', 'cancel', 'back', 'pagehide', 'import', 'file-entry', 'sync']) {
    const h = fullUI(); open(h); const before = clone(h.state);
    if (cancel === 'close') h.dom['item-world-dialog'].close();
    if (cancel === 'cancel') await h.dom['item-world-dialog'].emit('cancel');
    if (cancel === 'back') await h.window.emit('popstate');
    if (cancel === 'pagehide') await h.window.emit('pagehide');
    if (cancel === 'import') await h.dom['import-save'].click();
    if (cancel === 'file-entry') await h.dom['save-file'].emit('change', { target: { value: '', files: [] } });
    if (cancel === 'sync') h.run('syncSelection();');
    h.run('confirmItemWorld();'); assert.equal(h.run('itemWorldConsent'), null, cancel);
    assert.equal(h.calls.length, 0, cancel); assert.deepEqual(clone(h.state), before, cancel);
  }
});

test('IW1 UI: adopted import cannot inherit consent or transient active challenge', async () => {
  const h = fullUI(); open(h); await h.import(fixture({ family: 'club', seeds: 5 }));
  h.run('confirmItemWorld();'); assert.equal(h.calls.length, 0); assert.equal(h.run('itemWorldConsent'), null);
  assert.equal(h.dom['item-world-dialog'].open, false); assert.equal(h.state.worldSeeds, 5);
  assert.equal(h.dom['world-seed-balance'].textContent, '5 世界之種');
  open(h); h.run('confirmItemWorld();'); const active = clone(h.state); await h.import(active);
  assert.equal(h.state.mode, 'town'); assert.equal(engine.itemWorldView(h.state).active, false);
  assert.equal(h.state.worldSeeds, 4); assert.equal(h.state.inventory[0].itemWorld, undefined);
  assert.equal(h.dom['report-empty'].hidden, false);
});

test('IW1 UI: changed quote, seeds, identity, level, loadout or ownership permanently revoke stale consent', () => {
  for (const mutation of [
    'state.worldSeeds++', 'state.hero.level++', 'state.stage++', "state.inventory[0].name='changed'",
    'state.inventory[0].stats.attack++', 'state.inventory[0].locked=false', 'state.inventory=[]',
    "[state.inventory[0],state.equipment.weapon]=[state.equipment.weapon,state.inventory[0]]",
    "state.mode='battle'", "state.mode='defeat'", 'tabOwner=false',
  ]) {
    const h = fullUI(); open(h); h.run(`${mutation};`); const before = clone(h.state);
    h.run('confirmItemWorld();confirmItemWorld();');
    assert.equal(h.calls.length, 0, mutation); assert.deepEqual(clone(h.state), before, mutation); assert.equal(h.run('itemWorldConsent'), null, mutation);
    assert.equal(h.dom['item-world-confirm'].disabled, true, mutation); assert.match(h.dom['item-world-feedback'].textContent, /確認已取消/, mutation);
  }
  const h = fullUI(); open(h); h.run('state.worldSeeds++;render();state.worldSeeds--;confirmItemWorld();');
  assert.equal(h.calls.length, 0, 'reverted balance does not resurrect consent');
});

test('IW1 UI: repeated open cannot replace pending target and closed native dialog cannot submit', () => {
  const h = fullUI(); open(h); const shown = h.dom['item-world-item-name'].textContent;
  h.run("openItemWorld('starter-weapon');"); assert.equal(h.dom['item-world-item-name'].textContent, shown);
  h.dom['item-world-dialog'].open = false; h.run('confirmItemWorld();');
  assert.equal(h.calls.length, 0); assert.equal(h.run('itemWorldConsent'), null);
});

test('IW1 UI: engine refusal or dispatch-time race never claims entry and cannot replay', () => {
  for (const options of [{ noop: true }, { beforeAction: state => { state.worldSeeds++; } }]) {
    const h = fullUI(fixture(), options); open(h); h.run('confirmItemWorld();confirmItemWorld();');
    assert.equal(h.calls.length, 1); assert.equal(h.run('itemWorldConsent'), null); assert.equal(h.dom['item-world-confirm'].disabled, true);
    assert.equal(h.state.mode, 'town'); assert.match(h.dom['item-world-feedback'].textContent, /操作未確認完成/);
    assert.doesNotMatch(h.dom.toast.textContent, /已進入/);
  }
});

test('IW1 UI: paid manual departure resets prior camp pump time, rejected repeat does not reset combat time', () => {
  const h = fullUI(); h.at(249); open(h); h.run('confirmItemWorld();');
  h.at(250); assert.equal(h.tick(), .001); assert.equal(h.state.battle.elapsed, .001);
  h.at(499); h.run("dispatch('enterItemWorld', {});"); h.at(500); assert.equal(h.tick(), .25);
  assert.equal(h.state.worldSeeds, 2); assert.equal(h.state.mode, 'battle');
});

test('IW1 UI: live header, target, rounds and controls distinguish trial from auto-repeating ordinary expeditions', async () => {
  const state = fixture(); state.autoAdvance = true;
  const h = fullUI(state); open(h); h.run('confirmItemWorld();');
  assert.match(h.dom['zone-title'].textContent, /Item World/); assert.equal(h.dom['stage-label'].textContent, 'IW1 · 本作強度 5');
  assert.equal(h.dom['wave-label'].textContent, '第 1 / 5 回合'); assert.equal(h.dom['mode-badge'].textContent, '武器試煉進行中');
  assert.equal(h.dom['best-time'].textContent, '不計普通關卡'); assert.match(h.dom['control-hint'].textContent, /目標：.*五回合.*不自動重刷/);
  assert.equal(h.dom['finish-camp-button'].disabled, true); const count = h.calls.length; await h.dom['finish-camp-button'].click(); assert.equal(h.calls.length, count);
  assert.match(h.dom['finish-camp-status'].textContent, /不獲 IW1.*種子不退還（本作適配）/);
  h.run('state.wave=2;render();'); assert.equal(h.dom['wave-label'].textContent, '第 2 / 5 回合');
  await h.dom['retreat-button'].click(); assert.equal(h.state.mode, 'town'); assert.equal(h.state.worldSeeds, 2);
  assert.doesNotMatch(h.dom['stage-label'].textContent, /IW1/); assert.equal(h.dom['wave-label'].textContent, '準備出發');
  assert.equal(h.state.autoAdvance, true, 'trial does not change saved normal policy');
});

test('IW1 UI: retreat report names trial target, spent seed and no reward, not an ordinary-stage win', async () => {
  const h = fullUI(); open(h); h.run('confirmItemWorld();'); await h.dom['retreat-button'].click();
  const report = engine.expeditionReports(h.state)[0], text = collect(h.dom['expedition-report-list']);
  assert.equal(report.itemWorld.reward, false); assert.match(text, /Item World · IW1.*本作強度 5/);
  assert.match(text, /試煉目標：.*ui-owned-weapon.*未獲 IW1.*已消耗 1 世界之種.*不計普通通關/);
  assert.doesNotMatch(text, /出發第 1 層|試煉通關/); assert.match(h.dom['report-status'].textContent, /最近一次 Item World 試煉/);
  const synthetic = clone(report); synthetic.outcome = 'win'; synthetic.itemWorld.reward = true;
  const card = h.run(`expeditionReportCard(${JSON.stringify(synthetic)}, 'result')`);
  assert.match(collect(card), /試煉通關.*已獲永久 IW1/);
  delete synthetic.itemWorld;
  const normal = h.run(`expeditionReportCard(${JSON.stringify(synthetic)}, 'normal')`);
  assert.match(collect(normal), /出發第 1 層/); assert.doesNotMatch(collect(normal), /Item World|世界之種/);
});

test('IW1 UI: native accessible confirmation has safe autofocus, small-screen scrolling and stable selected-item focus', () => {
  const h = fullUI(); h.inspect(); trialButton(h).focus(); h.run('state.worldSeeds++;render();');
  assert.equal(h.document.activeElement, trialButton(h));
  assert.match(html, /id="item-world-dialog"[^>]*aria-labelledby="item-world-title"[^>]*aria-describedby="item-world-warning"/);
  assert.match(html, /data-close="item-world-dialog"[^>]*autofocus>取消，不扣種子/);
  assert.match(html, /id="item-world-feedback"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(css, /\.item-world-dialog \{[^}]*max-height:[^}]*overflow-y: auto/);
  assert.match(css, /\.item-world-actions \{[^}]*flex-wrap: wrap/);
  assert.match(css, /\.item-world-item-name \{[^}]*overflow-wrap: anywhere/);
});

for (const quality of ['Superior', 'Exquisite']) test(`IW1 UI: real ${quality} five-round victory grants target badge and trial reward report once, then stays in camp`, () => {
  const state = fixture({ quality, family: 'axe', equipped: true, level: 8 }); state.autoAdvance = true;
  const h = fullUI(state), normal = { stage: h.state.stage, unlocked: h.state.unlocked, wins: h.state.wins, bestTimes: clone(h.state.battle.bestTimes), fragments: h.state.soulFragments };
  h.inspect(true); open(h); h.run('confirmItemWorld();');
  h.run("for(let i=0;i<2000&&state.mode==='battle';i++)advance(state,.25);render(true);");
  assert.equal(h.state.mode, 'town'); assert.equal(h.state.equipment.weapon.itemWorld.level, 1);
  assert.equal(h.state.worldSeeds, 2); assert.equal(engine.expeditionReports(h.state)[0].itemWorld.reward, true);
  assert.match(collect(h.dom['item-detail']), /IW1 已完成/); assert.match(collect(h.dom.equipment), /IW1 · 永久成長/);
  assert.match(collect(h.dom['item-detail']), quality === 'Exquisite' ? /原版 Exquisite 上限 IW15.*只實作 IW1.*IW2–15 尚未實作/ : /Fair／Average／Superior 上限 IW10.*只實作 IW1.*IW2–10 尚未實作/);
  assert.doesNotMatch(collect(h.dom['item-detail']), quality === 'Exquisite' ? /IW10/ : /IW15/);
  assert.match(collect(h.dom['expedition-report-list']), /試煉通關.*已獲永久 IW1/);
  assert.deepEqual({ stage: h.state.stage, unlocked: h.state.unlocked, wins: h.state.wins, bestTimes: clone(h.state.battle.bestTimes), fragments: h.state.soulFragments }, normal);
  const settled = clone(h.state); h.run('advance(state,30);render(true);'); assert.deepEqual(clone(h.state), settled);
  assert.doesNotMatch(h.dom['wave-label'].textContent, /回合/); assert.equal(h.faults.length, 0);
});

test('IW1 UI: real defeat returns camp with explicit unrewarded trial report and spent seed', () => {
  const h = fullUI(fixture({ level: 1 })); open(h); h.run('confirmItemWorld();');
  // Low-health battle fixture isolates terminal UI; do not change engine damage or outcome.
  h.run("state.hero.hp=1;for(let i=0;i<2000&&state.mode==='battle';i++)advance(state,.25);render(true);");
  const report = engine.expeditionReports(h.state)[0];
  assert.equal(report.outcome, 'defeat'); assert.equal(report.itemWorld.reward, false); assert.equal(h.state.mode, 'town');
  assert.equal(h.state.worldSeeds, 2); assert.equal(h.state.inventory[0].itemWorld, undefined);
  assert.match(collect(h.dom['expedition-report-list']), /戰敗.*Item World.*未獲 IW1.*已消耗 1 世界之種/);
  assert.equal(h.dom['world-seed-balance'].textContent, '2 世界之種'); assert.equal(h.faults.length, 0);
});


for (const quality of ['Fair', 'Average', 'Superior', 'Exquisite']) test(`IW1 UI: completed ${quality} identifies only its original maximum and refuses repeat spending`, () => {
  const state = fixture({ quality });
  state.inventory[0] = engine.previewItemWorld(state, 'ui-owned-weapon').after;
  const h = fullUI(state), before = clone(h.state); h.inspect();
  assert.equal(trialButton(h).disabled, true);
  const detail = collect(h.dom['item-detail']), maximum = quality === 'Exquisite' ? 15 : 10;
  assert.match(detail, new RegExp(`原版 .*上限 IW${maximum}.*本版只實作 IW1，IW2–${maximum} 尚未實作`));
  assert.doesNotMatch(detail, new RegExp(`IW${maximum === 15 ? 10 : 15}`));
  open(h); h.run('confirmItemWorld();confirmItemWorld();');
  assert.equal(h.dom['item-world-dialog'].open, false); assert.equal(h.calls.length, 0);
  assert.deepEqual(clone(h.state), before);
});

test('IW1 UI: Exquisite legacy rapier preview, cancel and completed import preserve absent parry', async () => {
  // Explicit legacy-shape source fixture; absent stats are not real-browser evidence.
  const state = fixture({ quality: 'Exquisite', bound: false });
  delete state.inventory[0].stats.parry; delete state.inventory[0].rolls.parry; state.inventory[0].power = loot.scoreItem(state.inventory[0]);
  engine.act(state, 'soulbindWeapon', engine.previewSoulbindWeapon(state, 'ui-owned-weapon'));
  const h = fullUI(state), before = clone(h.state), quote = engine.previewItemWorld(h.state, 'ui-owned-weapon');
  h.inspect(); open(h);
  assert.equal(quote.before.quality, 'Exquisite'); assert.equal(h.dom['item-world-confirm'].disabled, false);
  assert.equal(Object.hasOwn(quote.before.stats, 'parry'), false); assert.equal(Object.hasOwn(quote.after.stats, 'parry'), false);
  const row = h.dom['item-world-comparison'].children[7];
  assert.equal(row.children[1].textContent, '0'); assert.equal(row.children[2].textContent, '0');
  h.dom['item-world-dialog'].close(); h.run('confirmItemWorld();');
  assert.equal(h.calls.length, 0); assert.deepEqual(clone(h.state), before);
  const completed = clone(state); completed.inventory[0] = quote.after;
  await h.import(completed); h.inspect();
  assert.equal(Object.hasOwn(h.state.inventory[0].stats, 'parry'), false);
  assert.equal(Object.hasOwn(h.state.inventory[0].soulbound.stats, 'parry'), false);
  assert.equal(trialButton(h).disabled, true); assert.match(collect(h.dom['item-detail']), /IW15/);
  assert.equal(h.faults.length, 0);
});

test('IW1 UI: current settings distinguish same-format Exquisite compatibility from v1/v2 migration', () => {
  assert.match(html, /v0\.29 使用資料格式 v3/);
  assert.match(html, /v0\.24／v0\.25 不能讀取含 Exquisite IW1 的進度，即使資料格式同為 v3/);
  assert.match(html, /請先匯出備份並重新整理所有舊版分頁，再接手進度/);
  assert.match(html, /仍沿用 v3 儲存命名空間，與資料格式版本不同/);
  assert.doesNotMatch(html, /Crude 與 Exquisite 以上/);
  assert.match(html, /格式 v1 舊存檔的碎片從 0 開始/);
  assert.match(html, /v2／v3 保留既有碎片/);
  assert.match(html, /格式 v1／v2 舊存檔的種子從 0 開始/);
  assert.match(html, /v3 保留既有種子/);
  assert.doesNotMatch(html, /[；。]舊存檔(?:種子)?從 0 開始/);
});
