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
const source = js.slice(js.indexOf('function expeditionReportCard('), js.indexOf('function renderInventory('));
const copy = value => JSON.parse(JSON.stringify(value));
const collect = element => [element.textContent, ...element.children.map(collect)].filter(Boolean).join(' ');
function element(tag = 'div', className = '', text = '') {
  const listeners = new Map(), descendants = new Map();
  return { tag, className, textContent: String(text), children: [], hidden: false, disabled: false, open: false, value: '', dataset: {},
    style: { setProperty() {} }, classList: { add() {}, remove() {}, toggle() {} },
    append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = children; },
    addEventListener(type, listener) { listeners.set(type, [...(listeners.get(type) || []), listener]); },
    async emit(type, event = {}) { await Promise.all((listeners.get(type) || []).map(listener => listener({target: this, ...event}))); },
    click() { return this.emit('click'); }, setAttribute() {}, remove() {},
    querySelector(selector) { if (!descendants.has(selector)) descendants.set(selector, element()); return descendants.get(selector); },
    showModal() { this.open = true; }, close() { this.open = false; },
    getBoundingClientRect() { return {width: 640, height: 360, left: 0, top: 0, right: 640, bottom: 360}; }, getContext() { return {}; },
  };
}
const elements = () => Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], element()]));
const fixture = overrides => ({ stage: 3, level: 8, endLevel: 9, weapon: {family: 'axe', name: '試煉戰斧'}, strategy: 'sustain', outcome: 'win', elapsed: 18.75,
  startStats: {attack: 123, maxHp: 456, mitigation: .145}, actions: {attacks: 12, skills: 3, heals: 2, potions: 1, manaSpent: 27},
  damage: {basic: 120, skill: 230, bleed: 34}, survival: {hpLost: 144, minHpPercent: 27.45}, procs: {penetratedArmor: 5, stun: 2, bleeding: 4}, ...overrides });
function renderer(reports = []) {
  const dom = elements(), state = engine.createGame(42);
  const context = createContext({state, node: element, $: id => dom[id], STRATEGIES: engine.STRATEGIES,
    weaponFamilyNames: {axe: '戰斧', rapier: '刺劍', club: '戰棍'}, format: value => Math.round(value).toLocaleString('zh-TW'),
    defenseRate: value => `${(value * 100).toFixed(1).replace(/\.0$/, '')}%`, expeditionReports: () => copy(reports)});
  const run = code => runInContext(code, context);
  run(`let lastReportSignature = ''; let pinnedExpeditionReport = null; ${source}`);
  return {dom, state, run, set reports(value) { reports = value; }, get reports() { return reports; }, render() { run('renderExpeditionReports();'); }};
}
// Entire production UI, real engine/session/getter and actual button/import
// listeners. Only DOM, storage and timing APIs are simulated (not browser QA).
function fullUI(initial = engine.createGame(42)) {
  const dom = elements(), window = element('window'), document = element('document'), faults = [], writes = [];
  dom['slot-filter'].value = 'all'; dom['sort-select'].value = 'new';
  Object.assign(document, {hidden: false, body: element('body'), getElementById: id => dom[id], createElement: tag => element(tag),
    querySelectorAll: selector => selector === 'dialog' ? Object.entries(dom).filter(([id]) => id.endsWith('-dialog')).map(([, el]) => el) : []});
  window.matchMedia = () => ({matches: true});
  const raw = JSON.stringify(initial); let approve = true;
  const context = createContext({...engine, ...session, ...loot, JSON, window, document, location: {pathname: '/'},
    performance: {now: () => 0}, navigator: {}, crypto: {randomUUID: () => 'report-ui-test'},
    console: {warn() {}, error(...args) { faults.push(args); }}, confirm: () => approve,
    localStorage: {getItem: key => key.endsWith('save-v3') ? raw : null, setItem: (...args) => writes.push(args)},
    setTimeout() {return 1;}, clearTimeout() {}, setInterval() {return 1;}, requestAnimationFrame() {}, ResizeObserver: class {observe() {}}});
  const run = code => runInContext(code, context);
  run(js.replace(/^import .+;\n/gm, ''));
  return {dom, run, faults, writes, get state() { return run('state'); }, set approve(value) { approve = value; },
    async import(raw) { await dom['save-file'].emit('change', {target: {value: 'save.json', files: [{size: raw.length, text: async () => raw}]}}); },
    render() { run('render(true);'); },
    step() { run('advance(state, .25);'); },
  };
}
function completeNext(h) {
  const before = h.state.wins;
  if (h.state.mode === 'town') h.run("dispatch('start');");
  for (let i = 0; i < 4000 && h.state.wins === before && h.state.mode !== 'defeat'; i++) h.step();
  assert.equal(h.state.wins, before + 1, 'bounded natural starter run clears');
  h.render();
  return engine.expeditionReports(h.state)[0];
}

test('new journey has an automatic empty-state explanation and pin is a no-op without completed reports', async () => {
  const h = fullUI(), before = JSON.stringify(h.state);
  assert.equal(h.dom['report-empty'].hidden, false);
  assert.equal(h.dom['pin-report'].disabled, true);
  assert.equal(h.dom['expedition-report-list'].children.length, 0);
  assert.equal(h.dom['pinned-report'].hidden, true);
  assert.match(h.dom['report-status'].textContent, /通關、戰敗或中途回營/);
  await h.dom['pin-report'].click();
  assert.equal(JSON.stringify(h.state), before); assert.deepEqual(h.faults, []);
});

test('compact cards show exact start/end level, family, strategy, observed damage, loss, actions and successful applications', () => {
  const h = renderer([fixture()]); h.render();
  const card = h.dom['expedition-report-list'].children[0], text = collect(card);
  for (const expected of ['最近一次', '通關', '出發第 3 層 · 等級 8 → 結束 9 · 持久', '戰斧 · 試煉戰斧', '攻擊 123', '生命上限 456', '一般減傷 14.5%',
    '已處理時間 18.8 秒', '實際扣除敵方生命 普攻 120 · 技能 230 · 流血 34', '承受生命損失 144 · 最低生命 27.4%',
    '行動次數 攻擊總數 12（含技能 3） · 治療 2 · 藥水 1', '魔力消耗 27', '特效成功施加／刷新 流血 4 · 穿透護甲 5 · 暈眩 2']) assert.ok(text.includes(expected), expected);
  assert.equal(card.tag, 'article'); assert.equal(h.dom['report-empty'].hidden, true);
  assert.equal(h.dom['pin-report'].disabled, false);
});

for (const [outcome, expected] of [['win', '通關'], ['defeat', '戰敗'], ['retreat', '中途回營']]) {
  test(`outcome ${outcome} is explicit, with zero and non-winning observations preserved`, () => {
    const report = fixture({outcome, elapsed: 0, survival: {hpLost: 0, minHpPercent: 0}, damage: {basic: 0, skill: 0, bleed: 0}});
    const h = renderer([report]); h.render(); const text = collect(h.dom['expedition-report-list']);
    assert.ok(text.includes(expected)); assert.match(text, /已處理時間 0\.0 秒/);
    assert.match(text, /最低生命 0%/); assert.match(text, /普攻 0 · 技能 0 · 流血 0/);
  });
}

test('family and tactic labels are text only, including adversarial names and unsupported identifiers', () => {
  for (const [family, expected] of [['rapier', '刺劍'], ['club', '戰棍'], ['__proto__', '未辨識武器路線'], ['constructor', '未辨識武器路線']]) {
    const h = renderer([fixture({weapon: {family, name: '<img src=x onerror=bad()>'}, strategy: 'constructor'})]); h.render();
    const card = h.dom['expedition-report-list'].children[0];
    assert.ok(collect(card).includes(`${expected} · <img src=x onerror=bad()>`));
    assert.match(collect(card), /未辨識戰術/);
    assert.equal(card.children.find(child => child.className === 'report-weapon').textContent, `${expected} · <img src=x onerror=bad()>`);
    assert.doesNotMatch(source, /\.innerHTML|createElement\('img'\)/);
  }
});

test('renderer stays bounded newest-first, is side-effect-free and preserves unchanged card identity', () => {
  const h = renderer([fixture({stage: 3}), fixture({stage: 2}), fixture({stage: 1})]);
  const before = copy(h.state), reports = copy(h.reports); h.render();
  const cards = h.dom['expedition-report-list'].children;
  assert.equal(cards.length, 2); assert.match(collect(cards[0]), /最近一次.*出發第 3 層/);
  assert.match(collect(cards[1]), /前一次.*出發第 2 層/);
  h.state.mode = 'battle'; h.render(); assert.equal(h.dom['expedition-report-list'].children, cards);
  h.state.mode = before.mode; assert.deepEqual(copy(h.state), before); assert.deepEqual(h.reports, reports);
  assert.doesNotMatch(source, /\bact\(|\badvance\(|\bdispatch\(|\bsave\(|Math\.random/);
});

test('real completed report stays visible through automatic next start, and pin survives older reports being evicted', async () => {
  const h = fullUI(), first = completeNext(h), before = JSON.stringify(h.state), reportsBefore = engine.expeditionReports(h.state);
  await h.dom['pin-report'].click();
  assert.equal(JSON.stringify(h.state), before); assert.deepEqual(engine.expeditionReports(h.state), reportsBefore);
  assert.deepEqual(copy(h.run('pinnedExpeditionReport')), first);
  const pinnedText = collect(h.dom['pinned-report']);
  while (h.state._phase !== 'fight') h.step(); h.render();
  assert.equal(h.state.mode, 'battle'); assert.equal(h.dom['expedition-report-list'].children.length, 1);
  assert.equal(collect(h.dom['pinned-report']), pinnedText);
  completeNext(h); completeNext(h);
  assert.equal(h.dom['expedition-report-list'].children.length, 2);
  assert.equal(collect(h.dom['pinned-report']), pinnedText);
  assert.deepEqual(copy(h.run('pinnedExpeditionReport')), first);
  assert.notDeepEqual(engine.expeditionReports(h.state)[1], first, 'older baseline is no longer one of the latest two');
  assert.deepEqual(h.faults, []);
});

test('pin replaces only the local baseline, is usable as read-only inspection, and never changes RNG or serialized progress', async () => {
  const h = fullUI(); completeNext(h); await h.dom['pin-report'].click(); const first = copy(h.run('pinnedExpeditionReport'));
  const latest = completeNext(h); h.run('tabOwner = false;');
  const before = JSON.stringify(h.state), seed = h.state.seed, writes = h.writes.length;
  await h.dom['pin-report'].click();
  assert.deepEqual(copy(h.run('pinnedExpeditionReport')), latest); assert.notDeepEqual(latest, first);
  assert.equal(JSON.stringify(h.state), before); assert.equal(h.state.seed, seed); assert.equal(h.writes.length, writes);
  h.run('pinnedExpeditionReport.weapon.name = "只改本地測試快照"; pinnedExpeditionReport.damage.basic = -1;');
  assert.deepEqual(engine.expeditionReports(h.state)[0], latest, 'nested pin fields are detached from the real engine');
});

test('actual accepted import and reload clear session reports and local pin without importing forged report payloads', async () => {
  const h = fullUI(); completeNext(h); await h.dom['pin-report'].click();
  const saved = JSON.parse(JSON.stringify(h.state)); saved.expeditionReports = [fixture()]; saved.pinnedExpeditionReport = fixture();
  await h.import(JSON.stringify(saved));
  assert.equal(h.dom['report-empty'].hidden, false); assert.equal(h.dom['pin-report'].disabled, true);
  assert.equal(h.dom['pinned-report'].hidden, true); assert.equal(h.run('pinnedExpeditionReport'), null);
  assert.deepEqual(engine.expeditionReports(h.state), []); assert.equal(h.dom['expedition-report-list'].children.length, 0);
  const reloaded = fullUI(saved); assert.deepEqual(engine.expeditionReports(reloaded.state), []);
  assert.equal(reloaded.run('pinnedExpeditionReport'), null); assert.equal(reloaded.dom['report-empty'].hidden, false);
});

test('canceled and malformed imports retain the current baseline and reports', async () => {
  const h = fullUI(); completeNext(h); await h.dom['pin-report'].click();
  const pinned = copy(h.run('pinnedExpeditionReport')), reports = engine.expeditionReports(h.state), before = JSON.stringify(h.state);
  h.approve = false; await h.import(JSON.stringify(engine.createGame(17))); h.approve = true; await h.import('{broken');
  assert.deepEqual(copy(h.run('pinnedExpeditionReport')), pinned); assert.deepEqual(engine.expeditionReports(h.state), reports);
  assert.equal(JSON.stringify(h.state), before); assert.equal(h.dom['pinned-report'].hidden, false);
});

test('ownership synchronization clears the local baseline without touching engine history', async () => {
  const h = fullUI(); completeNext(h); await h.dom['pin-report'].click();
  const before = JSON.stringify(h.state), reports = engine.expeditionReports(h.state);
  h.run('syncSelection(); render(true);');
  assert.equal(h.run('pinnedExpeditionReport'), null); assert.equal(h.dom['pinned-report'].hidden, true);
  assert.equal(JSON.stringify(h.state), before); assert.deepEqual(engine.expeditionReports(h.state), reports);
});

test('an actual active-fight retreat remains distinct from a completed win; camp repeated retreat does not duplicate', async () => {
  const h = fullUI(); await h.dom['start-button'].click(); h.step(); await h.dom['retreat-button'].click();
  assert.equal(engine.expeditionReports(h.state)[0].outcome, 'retreat');
  assert.match(collect(h.dom['expedition-report-list']), /中途回營/);
  const report = engine.expeditionReports(h.state); await h.dom['retreat-button'].click();
  assert.deepEqual(engine.expeditionReports(h.state), report); assert.equal(h.dom['expedition-report-list'].children.length, 1);
});

test('report markup is persistent, accessible, narrow-screen wrapping, and explicit about measurement limits', () => {
  const section = html.slice(html.indexOf('<section class="expedition-reports'), html.indexOf('<section class="weapon-commission'));
  assert.match(section, /aria-labelledby="report-heading"/); assert.doesNotMatch(section.slice(0, section.indexOf('>')), /\bhidden\b/);
  assert.match(section, /id="report-status"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
  assert.match(section, /<details class="report-rules"><summary>/); assert.equal((section.match(/<button\b/g) || []).length, 2);
  for (const text of ['不寫入存檔', '重新整理、匯入或載入其他進度後清空', '進度控制權變更時清空', '關卡、出發等級、裝備、戰術或隨機判定不同', '不能直接推論差異由換裝造成', '同關也不是受控比較',
    '超過剩餘生命的部分不計', '不扣回治療量', '成功施加／刷新，不是層數或命中率', '沒有估算穿透護甲多打多少、暈眩擋下多少傷害', '不能直接與通關時間相比', '自動重刷也會更新']) assert.ok(section.includes(text), text);
  assert.match(section, /id="export-report"[^>]*disabled/);
  assert.doesNotMatch(section, /<table|最佳配裝|更高分.*更好|每秒傷害\s*\d/);
  assert.match(css, /\.expedition-report-card \{[^}]*min-width: 0[^}]*overflow-wrap: anywhere/);
  assert.match(css, /@media\(max-width:680px\) \{ \.expedition-report-list \{ grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(js, /\$\('pin-report'\)\.addEventListener\('click', pinRecentExpeditionReport\)/);
  assert.match(js, /renderRoutePreview\(\);\s*renderExpeditionReports\(\);/);
});
