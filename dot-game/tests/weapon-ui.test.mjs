import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { resolveWeaponFamily, describeWeaponTrait } from '../src/loot.js';
import { PENETRATED_ARMOR_RULES, penetratedArmorStatus } from '../src/engine.js';

const js = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const extract = (name, next) => js.slice(js.indexOf(`function ${name}(`), js.indexOf(`function ${next}(`));
const helpers = {
  resolveWeaponFamily, describeWeaponTrait, PENETRATED_ARMOR_RULES, penetratedArmorStatus,
  format: value => String(Math.round(value)),
};
const weapon = (family, power = 100) => ({ slot: 'weapon', weaponFamily: family, power });

test('weapon detail uses implemented family rules and marks proc parameters as an adaptation', () => {
  const text = runInNewContext(`${extract('weaponRuleText', 'powerComparisonText')} weaponRuleText(item)`, { ...helpers, item: weapon('rapier') });
  for (const fragment of ['25%', '3 層', '7 Tick', '暴擊必觸發', '目標存活', '後續攻擊', '本作選定參數']) assert.ok(text.includes(fragment), fragment);
  for (const family of ['axe', 'club', 'unknown']) {
    assert.equal(runInNewContext(`${extract('weaponRuleText', 'powerComparisonText')} weaponRuleText(item)`, { ...helpers, item: weapon(family) }), '');
    assert.doesNotMatch(describeWeaponTrait(weapon(family)), /附加穿透護甲/);
  }
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
const elements = () => Object.fromEntries(['enemy-status-panel', 'enemy-status-list', 'proc-notice'].map(id => [id, textNode('div')]));

test('enemy cue shows correct target, independent stacks and Tick countdown; expiration and retreat clear it', () => {
  const dom = elements();
  const state = { mode: 'battle', timing: { ticks: 12 }, enemies: [
    { id: 'first', name: '<img src=x onerror=bad()>', hp: 10, penetratedArmor: { stacks: 2, expiresAtTick: 15 } },
    { id: 'second', name: '第二個敵人', hp: 10 },
    { id: 'dead', name: '已擊敗', hp: 0, penetratedArmor: { stacks: 3, expiresAtTick: 19 } },
  ] };
  const context = { ...helpers, state, $: id => dom[id], node: textNode, clearTimeout() {} };
  const source = `let lastEnemyStatusSignature = ''; let procTimer; ${extract('renderEnemyStatuses', 'render')}`;
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
  runInNewContext('renderEnemyStatuses();', context);
  assert.equal(dom['enemy-status-panel'].hidden, true);
  assert.equal(dom['proc-notice'].hidden, true);
  assert.equal(dom['enemy-status-list'].children.length, 0);
});

test('proc notice is text-only, survives reduced motion, refreshes once per event, and ignores dead targets', () => {
  const dom = elements();
  dom['proc-notice'].hidden = true;
  const state = { mode: 'battle', enemies: [{ id: 'target', name: '守門者', hp: 10 }], events: [{ id: 1, type: 'proc', target: 'target', value: 1, text: '<b>穿透護甲 1/3 層 · 7 Tick</b>' }] };
  let sounds = 0, timers = 0;
  const context = { state, $: id => dom[id], prefs: { reducedMotion: true }, playSound() { sounds++; }, clearTimeout() {}, setTimeout() { return ++timers; } };
  const source = `const seenEvents = new Set(); let lastProcessedEvent; let procTimer; ${extract('eventEffects', 'setMeter')}`;
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

test('new combat semantics use isolated v3 save, writer and preference keys with ordered legacy sources', () => {
  for (const key of ['save', 'preferences', 'writer']) assert.ok(js.includes(`${key}-v3`));
  assert.match(js, /const LEGACY_SAVE_KEYS = \[`hv-v3-dot-\$\{storageScope\}-save-v2`, `hv-v3-dot-\$\{storageScope\}-save-v1`\]/);
  assert.match(js, /legacyKeys: LEGACY_SAVE_KEYS/);
  assert.match(js, /舊存檔完整保留。舊版分頁之後的進度不會自動合併/);
});
