import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as engine from '../src/engine.js';

const source = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const extract = (name, next) => source.slice(source.indexOf(`function ${name}(`), source.indexOf(`function ${next}(`));
function node(tag, className = '', text = '') {
  return { tag, className, textContent: String(text), children: [], hidden: false,
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; } };
}
const flatten = element => [element.textContent, ...element.children.map(flatten)].join(' ');
const helpers = extract('enemyRolePresentation', 'renderRoutePreview');
function harness(state, overrides = {}) {
  const dom = Object.fromEntries(['route-preview', 'route-preview-title', 'route-preview-intro', 'route-preview-list', 'enemy-status-panel', 'enemy-status-list', 'proc-notice', 'recovery-notice'].map(id => [id, node('div')]));
  const context = { ...engine, ...overrides, state, node, $: id => dom[id], format: value => String(Math.round(value)), clearTimeout() {} };
  runInNewContext(`${helpers}; let lastPreviewStage = null; let lastEnemyStatusSignature = ''; let procTimer; let procTargetId = null; let recoveryTimer; let recoveryTargetId = null; ${source.slice(source.indexOf('function renderRoutePreview('), source.indexOf('const slotIcons'))} ${extract('renderEnemyStatuses', 'renderCounterattack')}`, context);
  return { dom, render: name => runInNewContext(`${name}();`, context) };
}

test('later-route preview clearly distinguishes the adapted magical skill without changing first four route cues', () => {
  const state = engine.createGame(25);
  const h = harness(state);
  for (const stage of [1, 2, 3, 4]) {
    state.stage = stage; h.render('renderRoutePreview');
    assert.doesNotMatch(flatten(h.dom['route-preview-list']), /赤砂術式|魔法/);
    assert.doesNotMatch(h.dom['route-preview-intro'].textContent, /魔法/);
  }
  state.stage = 5;
  const before = JSON.stringify(state);
  h.render('renderRoutePreview');
  assert.match(flatten(h.dom['route-preview-list']), /物理 → 赤砂術式（魔法）→ 重複/);
  for (const text of ['本作節奏改編', '物理護甲、招架不防魔法', '閃避、格擋仍有效', 'Protection', '尚未實作（0%）']) assert.ok(h.dom['route-preview-intro'].textContent.includes(text), text);
  assert.equal(JSON.stringify(state), before);
});

test('current enemy cue is visible text, preserves control status, and refreshes on next action even without HP change', () => {
  const state = engine.createGame(25); state.stage = 5; engine.act(state, 'start');
  // Independent renderer fixture: attacks are mocked as a pure changing view;
  // actual strike progression belongs to the engine acceptance tests.
  state.enemies = [{ id: 'sand', name: '赤砂守衛', hp: 100, attackPattern: 'alternating', stun: { expiresAtTick: state.timing.ticks + 2 } }];
  let nextLabel = '物理攻擊';
  const h = harness(state, { enemyAttackView: () => ({ mixed: true, nextKind: nextLabel === '物理攻擊' ? 'physical' : 'magic', nextLabel }) });
  const before = JSON.stringify(state);
  h.render('renderEnemyStatuses');
  const physical = flatten(h.dom['enemy-status-list']);
  assert.match(physical, /下一次行動：物理攻擊/);
  assert.match(physical, /暈眩中，暫不行動/);
  assert.match(physical, /抵抗 0%（尚未實作）/);
  assert.match(physical, /魔法不吃物理護甲／招架/);
  assert.match(h.dom['enemy-status-list'].children[0].title, /通用格擋規則推論/);
  assert.equal(JSON.stringify(state), before);
  nextLabel = '魔法技能 · 赤砂術式';
  h.render('renderEnemyStatuses');
  assert.match(flatten(h.dom['enemy-status-list']), /下一次行動：魔法技能 · 赤砂術式/);
  assert.equal(JSON.stringify(state), before);
  state.mode = 'town'; h.render('renderEnemyStatuses');
  assert.equal(h.dom['enemy-status-panel'].hidden, true);
  assert.equal(h.dom['enemy-status-list'].children.length, 0);
});

test('actual magic cast remains visible with reduced motion and clears in camp, readonly or adopted journey', () => {
  const notice = node('p'); notice.hidden = true;
  const state = { mode: 'battle', events: [{ id: 1, type: 'cast', effect: 'magic', text: '赤砂術式 · 魔法技能' }] };
  const context = { state, tabOwner: true, prefs: { reducedMotion: true }, seenEvents: new Set(), lastProcessedEvent: '', $: id => id === 'magic-notice' ? notice : null };
  runInNewContext(extract('eventEffects', 'setMeter'), context);
  runInNewContext('eventEffects()', context);
  assert.equal(notice.hidden, false);
  assert.match(notice.textContent, /最近敵方施法 · 赤砂術式 · 魔法技能/);
  assert.match(notice.textContent, /已施放，不代表命中/);
  state.events = []; runInNewContext('eventEffects()', context);
  assert.equal(notice.hidden, false, 'last real cast persists across frames');
  context.tabOwner = false; runInNewContext('eventEffects()', context);
  assert.equal(notice.hidden, true);
  context.tabOwner = true; state.events = [{ id: 2, type: 'cast', effect: 'magic' }];
  runInNewContext('eventEffects()', context); assert.equal(notice.hidden, false);
  state.mode = 'town'; runInNewContext('eventEffects()', context); assert.equal(notice.hidden, true);
  assert.match(source.slice(source.indexOf('function syncSelection()'), source.indexOf('function syncSelection()') + 300), /magic-notice.*hidden = true/);
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="magic-notice"[^>]*role="status"[^>]*aria-live="polite"[^>]*hidden/);
});

test('predictions and unrelated casts never claim a magical cast; readonly and loaded historical events do not replay', () => {
  const notice = node('p'); notice.hidden = true;
  const state = { mode: 'battle', events: [] };
  const context = { state, tabOwner: true, prefs: { reducedMotion: true }, seenEvents: new Set(['historical']), lastProcessedEvent: '', $: id => id === 'magic-notice' ? notice : null };
  runInNewContext(extract('eventEffects', 'setMeter'), context);
  for (const events of [[], [{ id: 'physical', type: 'cast', effect: 'physical' }], [{ id: 'protection', type: 'cast', effect: 'protection' }], [{ id: 'historical', type: 'cast', effect: 'magic' }]]) {
    state.events = events; runInNewContext('eventEffects()', context); assert.equal(notice.hidden, true);
  }
  context.tabOwner = false; state.events = [{ id: 'readonly-cast', type: 'cast', effect: 'magic' }];
  runInNewContext('eventEffects()', context); assert.equal(notice.hidden, true);
  context.tabOwner = true; runInNewContext('eventEffects()', context); assert.equal(notice.hidden, true);
  state.events = [{ id: 'live', type: 'cast', effect: 'magic' }];
  runInNewContext('eventEffects()', context); assert.equal(notice.hidden, false);
  state.mode = 'defeat'; runInNewContext('eventEffects()', context); assert.equal(notice.hidden, true);
});


test('counter help no longer incorrectly limits eligible blocked attacks to physical', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /敵方物理攻擊確實出現/);
  assert.match(html, /敵方攻擊確實出現至少一次適用的招架／格擋成功/);
  assert.match(html, /魔法不可招架；魔法格擋後反擊沿用通用格擋規則的推論/);
});
