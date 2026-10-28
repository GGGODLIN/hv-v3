import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { AXE_BLEED_RULES, bleedStatus, resolveWeaponAttack, PENETRATED_ARMOR_RULES, penetratedArmorStatus, CLUB_STUN_RULES, stunStatus, enemyDefenseView, targetPriorityView } from '../src/engine.js';
import { resolveWeaponFamily, describeWeaponTrait, describeItemFlavor } from '../src/loot.js';

const js = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const extract = (name, next) => js.slice(js.indexOf(`function ${name}(`), js.indexOf(`function ${next}(`));
const roleHelpers = runInNewContext(`${extract('enemyRolePresentation', 'renderRoutePreview')} ({enemyRolePresentation, defenseRate, defenseLines})`);
const helpers = { ...roleHelpers, AXE_BLEED_RULES, bleedStatus, PENETRATED_ARMOR_RULES, penetratedArmorStatus, CLUB_STUN_RULES, stunStatus, enemyDefenseView, targetPriorityView, resolveWeaponFamily, describeWeaponTrait, describeItemFlavor, format: value => String(Math.round(value)) };
const axe = { slot: 'weapon', weaponFamily: 'axe' };
function target(id = 'first', stacks = 1, attack = 125, tick = 10) {
  const enemy = { id, name: `敵人 ${id}`, hp: 10000, maxHp: 10000, mitigation: .4, evade: 0, parry: 0, block: 0 };
  for (let i = 0; i < stacks; i++) resolveWeaponAttack({attack, crit: 1, multiCrit: 0}, enemy, axe, tick, () => .99);
  assert.ok(bleedStatus(enemy, tick), 'fixture obtains real bleed state from the engine');
  return enemy;
}
function node(tag, className = '', text = '') {
  return { tag, className, textContent: String(text), hidden: true, children: [], style: {}, removed: false,
    append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = children; }, remove() { this.removed = true; },
  };
}
const collect = element => [element.textContent, ...element.children.map(collect)].filter(Boolean).join(' ');
function harness(state, reducedMotion = true) {
  const dom = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], node('div')]));
  const timers = new Map(); let nextTimer = 0;
  const context = { ...helpers, state, node, $: id => dom[id], prefs: {reducedMotion}, playSound() {},
    setTimeout(fn, delay) { timers.set(++nextTimer, {fn, delay}); return nextTimer; }, clearTimeout(id) { timers.delete(id); },
  };
  runInNewContext(`let lastEnemyStatusSignature = ''; let procTimer; let procTargetId = null; let recoveryTimer; let recoveryTargetId = null; let bleedTimer;
    const seenEvents = new Set(); let lastProcessedEvent; let attackPulse = 0; let enemyPulse = 0; let flash = 0;
    ${extract('eventEffects', 'setMeter')} ${extract('renderEnemyStatuses', 'render')}`, context);
  return {dom, context, timers, run: source => runInNewContext(source, context)};
}

test('axe rule text follows engine constants and is explicit about historical snapshots, eligibility and adaptations', () => {
  const text = runInNewContext(`${extract('weaponRuleText', 'powerComparisonText')} weaponRuleText(item)`, {...helpers, item: axe});
  for (const fragment of [`${AXE_BLEED_RULES.chance * 100}%`, `${AXE_BLEED_RULES.maxStacks} 層`, `未來 ${AXE_BLEED_RULES.durationTicks} Tick`, `${AXE_BLEED_RULES.damageFractionPerStack * 100}%`, '正傷害且目標存活', '暴擊必觸發', '技能與魔法不觸發', '含滿層', '下一個 Tick', '第 7 次結算後解除', '面板攻擊（ADB）', '合計後向下取整', '不是本次直擊傷害', '也可能變弱', '無類型傷害', '不能暴擊', '穿透護甲不增幅流血', '採歷史模型', '本作改編', '不是原版當前數值']) assert.ok(text.includes(fragment), fragment);
  assert.match(describeWeaponTrait(axe), /流血/);
  assert.doesNotMatch(describeWeaponTrait(axe), /尚未實作|未實作武器特效/);
  assert.match(js, /axe: '流血傷口'/, 'commission choices advertise the actual axe route');
  assert.match(extract('openWeaponCommission', 'confirmWeaponCommission'), /weaponRuleText\(item\)/);
  assert.match(extract('renderItemDetail', 'resizeCanvas'), /weaponRuleText\(item\)/);
  assert.match(js, /屬性評分不含流血、穿透護甲、暈眩/);
});

test('every live enemy has its own accurate bleed stacks, remaining ticks and snapshot damage without changing defenses or state', () => {
  const first = target('first', 5), second = target('second', 2, 50), dead = target('dead'); dead.hp = 0;
  first.name = '<img src=x onerror=bad()>';
  first.penetratedArmor = {stacks: 2, expiresAtTick: 17}; first.stun = {expiresAtTick: 14};
  const state = {mode: 'battle', _phase: 'fight', timing: {ticks: 12}, enemies: [first, second, dead], events: []};
  const before = structuredClone(state), h = harness(state);
  h.run('renderEnemyStatuses();');
  const cards = h.dom['enemy-status-list'].children;
  assert.equal(cards.length, 2);
  assert.match(cards[0].className, /has-penetration.*is-stunned.*is-bleeding/);
  assert.match(collect(cards[0]), /流血傷口 5\/5 層 · 剩 5 Tick · 每 Tick 50 傷害/);
  assert.match(collect(cards[1]), /流血傷口 2\/5 層 · 剩 5 Tick · 每 Tick 8 傷害/);
  assert.equal(cards[0].children[0].textContent, '目標 · <img src=x onerror=bad()>');
  assert.match(collect(cards[0]), /穿透護甲 2\/3 層/);
  assert.match(collect(cards[0]), /暈眩 · 剩 2 Tick/);
  assert.match(collect(cards[0]), /目前一般物理減傷 20%/);
  assert.match(cards[0].title, /流血每 Tick 50 點無類型傷害/);
  assert.deepEqual(state, before);
  h.run('renderEnemyStatuses();'); assert.equal(h.dom['enemy-status-list'].children, cards, 'same state is not rebuilt');
  state.timing.ticks = 13; h.run('renderEnemyStatuses();');
  assert.match(collect(h.dom['enemy-status-list']), /剩 4 Tick · 每 Tick 50 傷害/);
  state.timing.ticks = 17; h.run('renderEnemyStatuses();');
  assert.doesNotMatch(collect(h.dom['enemy-status-list']), /流血傷口 [1-5]\/5/);
  assert.match(collect(h.dom['enemy-status-list']), /流血傷口：無/);
  state.enemies = [{id: 'next-wave', name: '新波次', hp: 10}]; h.run('renderEnemyStatuses();');
  assert.doesNotMatch(h.dom['enemy-status-list'].children[0].className, /is-bleeding/);
  state.mode = 'town'; h.run('renderEnemyStatuses();');
  assert.equal(h.dom['enemy-status-panel'].hidden, true); assert.equal(h.dom['enemy-status-list'].children.length, 0);
});

test('bleed proc and damage feedback coexist with reduced motion, remain text-only and deduplicate events', () => {
  const state = {mode: 'battle', _phase: 'fight', timing: {ticks: 10}, enemies: [target()], events: [
    {id: 1, type: 'proc', effect: 'bleed', target: 'first', text: '流血傷口 1/5 層 · 7 Tick'},
    {id: 2, type: 'bleed', effect: 'bleed', target: 'first', value: 10, text: '<b>敵人 first 流血傷口造成 10 傷害</b>'},
  ]};
  const h = harness(state); h.run('eventEffects(); eventEffects();');
  assert.match(h.dom['proc-notice'].className, /bleed-proc/);
  assert.match(h.dom['proc-notice'].textContent, /流血傷口 1\/5 層/);
  assert.equal(h.dom['bleed-notice'].textContent, '流血結算 · <b>敵人 first 流血傷口造成 10 傷害</b>');
  assert.equal(h.dom['bleed-notice'].hidden, false);
  assert.equal(h.dom['floating-layer'].children.length, 0, 'reduced motion does not hide ordinary text feedback');
  assert.equal(h.timers.size, 2, 'one timer per distinct notice; duplicate events do not refresh');
  assert.equal(h.run('attackPulse + enemyPulse + flash'), 0, 'bleed is not presented as a fresh swing or critical hit');
});

test('lethal and final-wave bleed ticks stay visible without a current target and expire after a bounded interval', () => {
  for (const mode of ['battle', 'town']) {
    const state = {mode, timing: {ticks: 17}, enemies: [], events: [{id: 1, type: 'bleed', effect: 'bleed', target: 'departed', value: 4, text: '已擊敗的守門者流血，受到 4 傷害'}]};
    const h = harness(state); h.run('renderEnemyStatuses(); eventEffects();');
    assert.equal(h.dom['enemy-status-panel'].hidden, true);
    assert.equal(h.dom['bleed-notice'].hidden, false);
    assert.match(h.dom['bleed-notice'].textContent, /已擊敗的守門者流血，受到 4 傷害/);
    assert.equal(h.timers.size, 1);
    const timer = [...h.timers.values()][0]; assert.equal(timer.delay, 3200); timer.fn();
    assert.equal(h.dom['bleed-notice'].hidden, true);
  }
  assert.match(js, /function syncSelection\(\) \{\s*\$\('bleed-notice'\)\.hidden = true/);
  assert.match(js, /action === 'start' \|\| action === 'enterItemWorld' \|\| action === 'retreat'\) \$\('bleed-notice'\)\.hidden = true/);
});

test('normal-motion bleeding has a separately labeled floating number and burst feedback is bounded', () => {
  const state = {mode: 'battle', _phase: 'fight', enemies: [], events: Array.from({length: 5}, (_, i) => ({id: i + 1, type: 'bleed', effect: 'bleed', target: `gone-${i}`, value: 10 + i, text: `目標${i}流血受到${10 + i}傷害`}))};
  const h = harness(state, false); h.run('eventEffects();');
  const floats = h.dom['floating-layer'].children;
  assert.equal(floats.length, 3); assert.equal(floats[0].className, 'floating-number bleed');
  assert.equal(floats[0].textContent, '流血 −12');
  assert.deepEqual(floats.map(number => number.style.marginTop), ['0px', '24px', '48px']);
  assert.match(h.dom['bleed-notice'].textContent, /目標2.*目標3.*目標4.*本次共 5 筆，這裡顯示最近 3 筆/);
  assert.doesNotMatch(h.dom['bleed-notice'].textContent, /目標0|目標1/);
  assert.equal(h.run('attackPulse + enemyPulse + flash'), 0);
  h.run('eventEffects();'); assert.equal(floats.length, 3);
  // A proc is identified by the real engine event contract, never by item/target names.
  assert.match(extract('eventEffects', 'setMeter'), /type === 'bleed' && event.effect === 'bleed'/);
});

test('canvas retains PA, stun and BW labels together and a fixed droplet even with reduced motion', () => {
  const labels = [], polygons = [];
  const ctx = new Proxy({fillText(text) {labels.push(text);}}, {get(target, key) {return target[key] ?? (() => {});}});
  const enemy = target('canvas', 3); enemy.penetratedArmor = {stacks: 2, expiresAtTick: 17}; enemy.stun = {expiresAtTick: 14};
  const context = {...helpers, ctx, enemy, rect() {}, polygon(points) {polygons.push(points);}, enemyPulse: 1, prefs: {reducedMotion: true}, state: {timing: {ticks: 10}}};
  const before = structuredClone(enemy);
  runInNewContext(`${extract('drawEnemy', 'drawScene')} drawEnemy(enemy, 230, 140, 0, 0);`, context);
  for (const label of ['PA 2 · 7T', 'STUN 4T', 'BW 3 · 7T']) assert.ok(labels.includes(label), label);
  assert.equal(polygons.at(-1).length, 4, 'fixed drop silhouette is not dependent on animation or color');
  assert.deepEqual(enemy, before);
  delete enemy.stun; enemy.stunRecoveryPending = true;
  labels.length = 0; runInNewContext('drawEnemy(enemy, 230, 140, 0, 0);', context);
  for (const label of ['PA 2 · 7T', 'READY', 'BW 3 · 7T']) assert.ok(labels.includes(label));
  enemy.hp = 0; labels.length = 0; runInNewContext('drawEnemy(enemy, 230, 140, 0, 0);', context);
  assert.equal(labels.some(label => /^(BW|PA|STUN|READY)/.test(label)), false);
});

test('bleeding readouts remain accessible, narrow-screen wrapping and separate from the hidden live-target panel', () => {
  assert.match(html, /id="bleed-notice"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
  assert.match(html, /<\/section>\s*<p id="bleed-notice"/);
  assert.match(html, /BW 為流血傷口/);
  assert.match(html, /流血另列每 Tick 傷害，不改變防線數字/);
  assert.match(css, /\.bleed-damage-notice \{[^}]*overflow-wrap: anywhere/);
  assert.match(css, /\.bleed-damage-notice\[hidden\] \{ display: none; \}/);
  assert.match(css, /@media\(max-width:680px\) \{ \.enemy-status-list \{ grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.floating-number\.bleed/);
  assert.match(html, /v0\.54 · 持續開發/);
  assert.doesNotMatch(js, /\.innerHTML\s*=/);
});
