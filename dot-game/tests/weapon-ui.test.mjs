import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolveWeaponFamily, describeWeaponTrait, describeItemFlavor } from '../src/loot.js';
import { PENETRATED_ARMOR_RULES, penetratedArmorStatus, CLUB_STUN_RULES, stunStatus, AXE_BLEED_RULES, bleedStatus, enemyDefenseView, targetPriorityView } from '../src/engine.js';

const js = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const extract = (name, next) => js.slice(js.indexOf(`function ${name}(`), js.indexOf(`function ${next}(`));
const roleHelpers = runInNewContext(`${extract('enemyRolePresentation', 'renderRoutePreview')} ({ enemyRolePresentation, defenseRate, defenseLines })`);
const helpers = {
  ...roleHelpers, enemyDefenseView, targetPriorityView,
  resolveWeaponFamily, describeWeaponTrait, describeItemFlavor, PENETRATED_ARMOR_RULES, penetratedArmorStatus, CLUB_STUN_RULES, stunStatus, AXE_BLEED_RULES, bleedStatus,
  format: value => String(Math.round(value)),
};
const weapon = (family, power = 100) => ({ slot: 'weapon', weaponFamily: family, power });

test('weapon detail uses implemented family rules and marks proc parameters as an adaptation', () => {
  const text = runInNewContext(`${extract('weaponRuleText', 'powerComparisonText')} weaponRuleText(item)`, { ...helpers, item: weapon('rapier') });
  for (const fragment of ['25%', '3 層', '7 Tick', '暴擊必觸發', '目標存活', '後續攻擊', '本作選定參數']) assert.ok(text.includes(fragment), fragment);
  const clubText = runInNewContext(`${extract('weaponRuleText', 'powerComparisonText')} weaponRuleText(item)`, { ...helpers, item: weapon('club') });
  for (const fragment of ['25%', '4 Tick', '符合條件的暴擊必觸發', '目標存活', '不疊層、不刷新', '反擊致敗', '不能視為永久控制', '本作改編參數', '不是原版當前數值']) assert.ok(clubText.includes(fragment), fragment);
  assert.doesNotMatch(clubText, /每層降低|重觸發刷新/);
  for (const family of ['unknown']) {
    assert.equal(runInNewContext(`${extract('weaponRuleText', 'powerComparisonText')} weaponRuleText(item)`, { ...helpers, item: weapon(family) }), '');
    assert.doesNotMatch(describeWeaponTrait(weapon(family)), /附加穿透護甲/);
  }
  assert.doesNotMatch(describeWeaponTrait(weapon('axe')), /附加穿透護甲/);
  assert.doesNotMatch(describeWeaponTrait(weapon('club')), /附加穿透護甲|尚未實作/);
});

test('score markers never promise a cross-family upgrade', () => {
  const source = js.slice(js.indexOf('function powerComparisonText('), js.indexOf('const slotIcons'));
  const compare = (item, current) => runInNewContext(`${source} powerComparisonText(item, current)`, { ...helpers, item, current });
  assert.equal(compare(weapon('axe', 200), weapon('rapier')), '異路線');
  assert.equal(compare(weapon('axe', 200), weapon('axe')), '分數＋');
  assert.equal(compare(weapon('rapier', 100), weapon('axe', 200)), '');
  assert.equal(compare(weapon('rapier'), weapon('rapier')), '');
  assert.match(html, /屬性評分不含特效效益/);
  assert.match(js, /不是 DPS；跨武器路線不能只依高分換裝/);
  assert.doesNotMatch(js, /node\('span', 'item-upgrade', '↑'\)/);
});

function textNode(tag, className, text) {
  return { tag, className: className || '', textContent: text === undefined ? '' : String(text), hidden: false, children: [],
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
  };
}
const elements = () => Object.fromEntries(['enemy-status-panel', 'enemy-status-list', 'proc-notice', 'recovery-notice'].map(id => [id, textNode('div')]));

test('enemy cue shows correct target, independent stacks and Tick countdown; expiration and retreat clear it', () => {
  const dom = elements();
  const state = { mode: 'battle', _phase: 'fight', timing: { ticks: 12 }, enemies: [
    { id: 'first', name: '<img src=x onerror=bad()>', hp: 10, penetratedArmor: { stacks: 2, expiresAtTick: 15 } },
    { id: 'second', name: '第二個敵人', hp: 10 },
    { id: 'dead', name: '已擊敗', hp: 0, penetratedArmor: { stacks: 3, expiresAtTick: 19 } },
  ] };
  const context = { ...helpers, state, $: id => dom[id], node: textNode, clearTimeout() {} };
  const source = `let lastEnemyStatusSignature = ''; let procTimer; let procTargetId = null; let recoveryTimer; let recoveryTargetId = null; ${extract('renderEnemyStatuses', 'render')}`;
  runInNewContext(`${source} renderEnemyStatuses();`, context);
  const cards = dom['enemy-status-list'].children;
  assert.equal(cards.length, 2);
  assert.equal(cards[0].children[0].textContent, '目標 · <img src=x onerror=bad()>');
  assert.equal(cards[0].children[1].textContent, '穿透護甲 2/3 層 · 剩 3 Tick');
  assert.match(cards[0].title, /50%/);
  assert.equal(cards[1].children[1].textContent, '穿透護甲：無');
  state.timing.ticks = 15;
  runInNewContext('renderEnemyStatuses();', context);
  assert.equal(dom['enemy-status-list'].children[0].children[1].textContent, '穿透護甲：無');
  state.mode = 'town';
  dom['proc-notice'].hidden = false;
  dom['recovery-notice'].hidden = false;
  runInNewContext('renderEnemyStatuses();', context);
  assert.equal(dom['enemy-status-panel'].hidden, true);
  assert.equal(dom['proc-notice'].hidden, true);
  assert.equal(dom['recovery-notice'].hidden, true);
  assert.equal(dom['enemy-status-list'].children.length, 0);
});

test('each enemy independently shows PA, active stun countdown, and recovery-ready risk without mutating combat state', () => {
  const dom = elements();
  const state = { mode: 'battle', _phase: 'fight', timing: { ticks: 12 }, enemies: [
    { id: 'first', name: '第一個敵人', hp: 10, penetratedArmor: { stacks: 2, expiresAtTick: 15 }, stun: { expiresAtTick: 16 } },
    { id: 'second', name: '第二個敵人', hp: 10, stunRecoveryPending: true },
    { id: 'third', name: '第三個敵人', hp: 10 },
    { id: 'dead', name: '已擊敗', hp: 0, stunRecoveryPending: true },
  ] };
  const context = { ...helpers, state, $: id => dom[id], node: textNode, clearTimeout() {} };
  const source = `let lastEnemyStatusSignature = ''; let procTimer; let procTargetId = 'first'; let recoveryTimer; let recoveryTargetId = null; ${extract('renderEnemyStatuses', 'render')}`;
  const before = structuredClone(state);
  runInNewContext(`${source} renderEnemyStatuses();`, context);
  let cards = dom['enemy-status-list'].children;
  assert.equal(cards.length, 3);
  assert.match(cards[0].className, /has-penetration.*is-stunned/);
  assert.equal(cards[0].children[1].textContent, '穿透護甲 2/3 層 · 剩 3 Tick');
  assert.equal(cards[0].children[2].textContent, '暈眩 · 剩 4 Tick');
  assert.match(cards[1].className, /recovery-ready/);
  assert.equal(cards[1].children[2].textContent, '甦醒待行動 · 下次我方行動前可反擊');
  assert.equal(cards[2].children[2].textContent, '暈眩：無');
  assert.deepEqual(state, before);
  state.timing.ticks = 15;
  runInNewContext('renderEnemyStatuses();', context);
  assert.equal(dom['enemy-status-list'].children[0].children[2].textContent, '暈眩 · 剩 1 Tick');
  state.timing.ticks = 16;
  delete state.enemies[0].stun;
  state.enemies[0].stunRecoveryPending = true;
  runInNewContext('renderEnemyStatuses();', context);
  assert.match(dom['enemy-status-list'].children[0].children[2].textContent, /甦醒待行動/);
  delete state.enemies[0].stunRecoveryPending;
  runInNewContext('renderEnemyStatuses();', context);
  assert.equal(dom['enemy-status-list'].children[0].children[2].textContent, '暈眩：無');
  dom['proc-notice'].hidden = false;
  state.enemies[0].hp = 0;
  runInNewContext('renderEnemyStatuses();', context);
  assert.equal(dom['proc-notice'].hidden, true, 'dead target notices clear even when other enemies remain');
  assert.equal(dom['enemy-status-list'].children[0].children[0].textContent, '目標 · 第二個敵人');
  state.enemies = [{ id: 'next-wave', name: '下一波', hp: 10 }];
  runInNewContext('renderEnemyStatuses();', context);
  cards = dom['enemy-status-list'].children;
  assert.equal(cards.length, 1);
  assert.equal(cards[0].children[2].textContent, '暈眩：無');
});

test('proc notice is text-only, survives reduced motion, refreshes once per event, and ignores dead targets', () => {
  const dom = elements();
  dom['proc-notice'].hidden = true;
  const state = { mode: 'battle', _phase: 'fight', enemies: [{ id: 'target', name: '守門者', hp: 10 }], events: [{ id: 1, type: 'proc', target: 'target', value: 1, text: '<b>穿透護甲 1/3 層 · 7 Tick</b>' }] };
  let sounds = 0, timers = 0;
  const context = { state, $: id => dom[id], prefs: { reducedMotion: true }, playSound() { sounds++; }, clearTimeout() {}, setTimeout() { return ++timers; } };
  const source = `const seenEvents = new Set(); let lastProcessedEvent; let procTimer; let procTargetId = null; let recoveryTimer; let recoveryTargetId = null; ${extract('eventEffects', 'setMeter')}`;
  runInNewContext(`${source} eventEffects(); eventEffects();`, context);
  assert.equal(dom['proc-notice'].hidden, false);
  assert.equal(dom['proc-notice'].textContent, '守門者 · <b>穿透護甲 1/3 層 · 7 Tick</b>');
  assert.equal(sounds, 1);
  assert.equal(timers, 1);
  state.events.push({ id: 2, type: 'proc', target: 'target', value: 3, text: '穿透護甲 3/3 層 · 7 Tick' });
  runInNewContext('eventEffects(); eventEffects();', context);
  assert.match(dom['proc-notice'].textContent, /3\/3 層/);
  assert.equal(timers, 2);
  state.enemies[0].hp = 0;
  dom['proc-notice'].hidden = true;
  state.events.push({ id: 3, type: 'proc', target: 'target', value: 3, text: '穿透護甲 3/3 層 · 7 Tick' });
  runInNewContext('eventEffects();', context);
  assert.equal(dom['proc-notice'].hidden, true);
  assert.equal(timers, 2);
  assert.match(html, /id="proc-notice"[^>]+role="status"[^>]+aria-live="polite"/);
});

test('stun and recovery notices stay distinct, text-only and readable with reduced motion', () => {
  const dom = elements();
  const state = { mode: 'battle', _phase: 'fight', enemies: [{ id: 'target', name: '守門者', hp: 10 }], events: [
    { id: 1, type: 'proc', effect: 'stun', target: 'target', value: 4, text: '暈眩 · 4 Tick' },
  ] };
  let timers = 0;
  const context = { state, $: id => dom[id], prefs: { reducedMotion: true }, playSound() {}, clearTimeout() {}, setTimeout() { return ++timers; } };
  const source = `const seenEvents = new Set(); let lastProcessedEvent; let procTimer; let procTargetId = null; let recoveryTimer; let recoveryTargetId = null; ${extract('eventEffects', 'setMeter')}`;
  runInNewContext(`${source} eventEffects(); eventEffects();`, context);
  assert.equal(dom['proc-notice'].textContent, '守門者 · 暈眩 · 4 Tick');
  assert.match(dom['proc-notice'].className, /stun-proc/);
  assert.equal(timers, 1);
  state.events.push({ id: 2, type: 'recovery', effect: 'stun', target: 'target', text: '<b>暈眩結束 · 甦醒反擊</b>' });
  runInNewContext('eventEffects(); eventEffects();', context);
  assert.equal(dom['proc-notice'].hidden, false);
  assert.equal(dom['recovery-notice'].hidden, false);
  assert.equal(dom['recovery-notice'].textContent, '守門者 · <b>暈眩結束 · 甦醒反擊</b>');
  assert.match(dom['recovery-notice'].className, /recovery-notice/);
  assert.doesNotMatch(dom['recovery-notice'].className, /stun-proc/);
  assert.equal(timers, 2);
  state.events.push({ id: 3, type: 'proc', effect: 'stun', target: 'target', text: '再度暈眩 · 4 Tick' });
  runInNewContext('eventEffects();', context);
  assert.equal(dom['proc-notice'].textContent, '守門者 · 再度暈眩 · 4 Tick');
  assert.match(dom['recovery-notice'].textContent, /甦醒反擊/, 'same-update re-stun cannot erase the recovery notice');
  assert.equal(timers, 3);
  state.mode = 'town';
  dom['recovery-notice'].hidden = true;
  state.events.push({ id: 4, type: 'recovery', effect: 'stun', target: 'target', text: '不應顯示' });
  runInNewContext('eventEffects();', context);
  assert.equal(dom['recovery-notice'].hidden, true);
  assert.equal(timers, 3);
  assert.match(html, /id="recovery-notice"[^>]+role="status"[^>]+aria-live="polite"/);
});

test('canvas preserves PA alongside stun and recovery-ready labels, including reduced motion', () => {
  const labels = [];
  const ctx = new Proxy({ fillText(text) { labels.push(text); } }, { get(target, key) { return target[key] ?? (() => {}); } });
  const context = { ...helpers, ctx, rect() {}, polygon() {}, enemyPulse: 0, prefs: { reducedMotion: true }, state: { timing: { ticks: 12 } } };
  const enemy = { name: '守門者', hp: 100, maxHp: 100, penetratedArmor: { stacks: 2, expiresAtTick: 15 }, stun: { expiresAtTick: 16 } };
  context.enemy = enemy;
  runInNewContext(`${extract('drawEnemy', 'drawScene')} drawEnemy(enemy, 200, 150, 0, 0);`, context);
  assert.ok(labels.includes('PA 2 · 3T'));
  assert.ok(labels.includes('STUN 4T'));
  labels.length = 0;
  delete enemy.stun;
  enemy.stunRecoveryPending = true;
  runInNewContext('drawEnemy(enemy, 200, 150, 0, 0);', context);
  assert.ok(labels.includes('PA 2 · 3T'));
  assert.ok(labels.includes('READY'));
  assert.equal(labels.some(label => label.startsWith('STUN')), false);
  labels.length = 0;
  enemy.hp = 0;
  runInNewContext('drawEnemy(enemy, 200, 150, 0, 0);', context);
  assert.deepEqual(labels, ['守門者', 'HP 0%']);
});

test('gear detail uses flavor-only prose and one authoritative trait section', () => {
  assert.match(js, /node\('p', 'detail-description', bound \? '[^']+' : describeItemFlavor\(item\)/);
  assert.equal((extract('renderItemDetail', 'resizeCanvas').match(/describeWeaponTrait\(item\)/g) || []).length, 1);
  const item = { ...weapon('club'), description: '穩定的中量武器。 戰棍：本版尚未實作武器特效。' };
  assert.equal(describeItemFlavor(item), '穩定的中量武器。 ');
  assert.equal(item.description, '穩定的中量武器。 戰棍：本版尚未實作武器特效。');
});

test('v0.37 retains the v3 storage namespace and candidate isolation while identifying schema v3', () => {
  for (const key of ['save', 'preferences', 'writer']) assert.ok(js.includes(`${key}-v3`));
  assert.match(js, /const LEGACY_SAVE_KEYS = \[`hv-v3-dot-\$\{storageScope\}-save-v2`, `hv-v3-dot-\$\{storageScope\}-save-v1`\]/);
  assert.match(js, /legacyKeys: LEGACY_SAVE_KEYS/);
  assert.match(js, /舊存檔完整保留。舊版分頁之後的進度不會自動合併/);
  assert.match(js, /v1／v2 儲存位置的進度，將另存至目前的 v3 儲存位置（資料格式 v3）/);
  assert.doesNotMatch(js, /v0\.3 已讀取|請在 v0\.3 繼續/);
  assert.doesNotMatch(js, /save-v4|writer-v4|preferences-v4/);
  assert.match(js, /candidate-\$\{candidatePath\[1\]/);
  assert.match(html, /v0\.37 · 來源候選/);
});
