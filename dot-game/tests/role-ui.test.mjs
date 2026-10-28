import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createGame, act, previewStage, enemyDefenseView, PENETRATED_ARMOR_RULES, penetratedArmorStatus, stunStatus, AXE_BLEED_RULES, bleedStatus, targetPriorityView } from '../src/engine.js';

const js = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const extract = (name, next) => js.slice(js.indexOf(`function ${name}(`), js.indexOf(`function ${next}(`));
const helperSource = extract('enemyRolePresentation', 'renderRoutePreview');
const helpers = runInNewContext(`${helperSource} ({enemyRolePresentation, defenseRate, defenseLines})`);
const node = (tag, className = '', text = '') => ({tag, className, textContent: String(text), hidden: false, children: [],
  append(...children) { this.children.push(...children); },
  replaceChildren(...children) { this.children = children; },
});
const collect = element => [element.textContent, ...element.children.map(collect)].filter(Boolean).join(' ');
const elements = ids => Object.fromEntries(ids.map(id => [id, node('div')]));
const previewIds = ['route-preview', 'route-preview-title', 'route-preview-intro', 'route-preview-list'];
const statusIds = ['enemy-status-panel', 'enemy-status-list', 'proc-notice', 'recovery-notice'];
const format = value => String(Math.round(value));

test('camp route renders all four waves from the engine, without advancing or mutating the journey', () => {
  for (const stage of [1, 2, 3, 4, 30]) {
    const state = createGame(42); state.stage = stage; state.unlocked = stage;
    const before = structuredClone(state), dom = elements(previewIds);
    const context = {...helpers, format, state, previewStage, node, $: id => dom[id]};
    runInNewContext(`let lastPreviewStage = null; ${extract('renderRoutePreview', 'readStorage')} renderRoutePreview();`, context);
    const route = previewStage(stage), rows = dom['route-preview-list'].children;
    assert.equal(dom['route-preview'].hidden, false);
    assert.equal(rows.length, 4);
    assert.equal(dom['route-preview-title'].textContent, `第 ${stage} 層 · 四波路線`);
    route.waves.forEach((wave, index) => {
      const text = collect(rows[index]);
      for (const enemy of wave.enemies) {
        const role = helpers.enemyRolePresentation(enemy);
        assert.ok(text.includes(role.label));
        assert.ok(text.includes(`基礎一般物理減傷 ${helpers.defenseRate(enemy.mitigation)}`));
        assert.ok(text.includes(`閃 ${helpers.defenseRate(enemy.evade)} / 招 ${helpers.defenseRate(enemy.parry)} / 擋 ${helpers.defenseRate(enemy.block)}`));
        const groups = rows[index].children[1].children;
        assert.ok(groups.some(group => group.title.includes(`基礎防禦 ${enemy.defense}；`)), 'tooltip preserves the engine defense precision');
      }
    });
    if (stage < 3) assert.doesNotMatch(collect(dom['route-preview-list']), /厚甲|靈巧/);
    else assert.match(collect(dom['route-preview-list']), /厚甲|靈巧/);
    assert.deepEqual(state, before);
  }
});

test('preview updates on route changes, hides outside camp, and remains read-only', () => {
  const state = createGame(71), dom = elements(previewIds);
  const context = {...helpers, format, state, previewStage, node, $: id => dom[id]};
  runInNewContext(`let lastPreviewStage = null; ${extract('renderRoutePreview', 'readStorage')} renderRoutePreview();`, context);
  const old = dom['route-preview-list'].children;
  runInNewContext('renderRoutePreview();', context);
  assert.equal(dom['route-preview-list'].children, old, 'unchanged route does not rebuild focused details');
  state.stage = 4;
  runInNewContext('renderRoutePreview();', context);
  assert.notEqual(dom['route-preview-list'].children, old);
  assert.match(dom['route-preview-title'].textContent, /第 4 層/);
  for (const mode of ['battle', 'defeat']) {
    state.mode = mode; runInNewContext('renderRoutePreview();', context);
    assert.equal(dom['route-preview'].hidden, true);
  }
  state.mode = 'town'; runInNewContext('renderRoutePreview();', context);
  assert.equal(dom['route-preview'].hidden, false);
  assert.doesNotMatch(extract('renderRoutePreview', 'readStorage'), /act\(|dispatch\(|random\(|Math\.random|\.innerHTML/);
});

test('battle cards show actual current mitigation and all avoidance gates through PA, stun, and recovery', () => {
  const state = createGame(90); state.stage = 3; act(state, 'start'); state.timing.ticks = 10;
  const target = state.enemies[0];
  Object.assign(target, { roleId: 'agile', hp: 100, maxHp: 100, mitigation: .4, evade: .1, parry: .07, block: .06,
    penetratedArmor: {stacks: 2, expiresAtTick: 17}, stun: {expiresAtTick: 14} });
  const dom = elements(statusIds), context = {...helpers, format, state, enemyDefenseView, PENETRATED_ARMOR_RULES, penetratedArmorStatus, stunStatus, AXE_BLEED_RULES, bleedStatus, targetPriorityView, node, $: id => dom[id], clearTimeout() {}};
  runInNewContext(`let lastEnemyStatusSignature = ''; let procTimer; let procTargetId = null; let recoveryTimer; let recoveryTargetId = null; ${extract('renderEnemyStatuses', 'render')} renderEnemyStatuses();`, context);
  let card = dom['enemy-status-list'].children[0];
  assert.match(collect(card), /靈巧/);
  assert.match(collect(card), /目前一般物理減傷 20%/);
  assert.match(collect(card), /閃 0% \/ 招 0% \/ 擋 6%/);
  assert.match(collect(card), /穿透護甲 2\/3 層 · 剩 7 Tick/);
  assert.match(collect(card), /暈眩 · 剩 4 Tick/);
  assert.match(card.title, /基礎一般物理減傷 40%/);
  assert.match(card.title, /單次判定機率/);
  const before = structuredClone(state);
  runInNewContext('renderEnemyStatuses();', context);
  assert.deepEqual(state, before);
  state.timing.ticks = 14; delete target.stun; target.stunRecoveryPending = true;
  runInNewContext('renderEnemyStatuses();', context);
  card = dom['enemy-status-list'].children[0];
  assert.match(collect(card), /閃 10% \/ 招 7% \/ 擋 6%/);
  assert.match(collect(card), /甦醒待行動/);
  assert.match(collect(card), /目前一般物理減傷 20%/);
  state.timing.ticks = 17;
  runInNewContext('renderEnemyStatuses();', context);
  assert.match(collect(dom['enemy-status-list'].children[0]), /目前一般物理減傷 40%/);
  state.mode = 'town'; runInNewContext('renderEnemyStatuses();', context);
  assert.equal(dom['enemy-status-panel'].hidden, true);
  assert.equal(dom['enemy-status-list'].children.length, 0);
});

test('canvas defers duplicate role/rates to DOM while retaining HP and PA/stun with reduced motion', () => {
  const labels = [], polygons = [];
  const ctx = new Proxy({fillText(text) {labels.push(text);}}, {get(target, key) {return target[key] ?? (() => {});}});
  const context = {...helpers, ctx, rect() {}, polygon(points) {polygons.push(points);}, enemyDefenseView, penetratedArmorStatus, stunStatus, AXE_BLEED_RULES, bleedStatus, targetPriorityView, enemyPulse: 1, prefs: {reducedMotion: true}, state: {timing: {ticks: 10}}};
  const target = {name: '可讀的目標', roleId: 'armored', hp: 100, maxHp: 100, mitigation: .4, evade: .1, parry: .07, block: .06, penetratedArmor: {stacks: 2, expiresAtTick: 17}, stun: {expiresAtTick: 14}};
  context.enemy = target;
  runInNewContext(`${extract('drawEnemy', 'drawScene')} drawEnemy(enemy, 230, 140, 0, 0);`, context);
  for (const label of ['可讀的目標', 'HP 100%', 'PA 2 · 7T', 'STUN 4T']) assert.ok(labels.includes(label), label);
  const armoredShapes = polygons.length;
  labels.length = 0; polygons.length = 0; target.roleId = 'agile';
  runInNewContext('drawEnemy(enemy, 230, 140, 0, 0);', context);
  assert.ok(!labels.some(label => /厚甲|靈巧|現減|閃|招|擋/.test(label)), 'role and precise rates remain in the unchanged DOM status renderer');
  assert.notEqual(polygons.length, armoredShapes, 'roles have distinct silhouettes, not only colors');
  context.state.timing.ticks = 14; delete target.stun; target.stunRecoveryPending = true;
  labels.length = 0; runInNewContext('drawEnemy(enemy, 230, 140, 0, 0);', context);
  for (const label of ['HP 100%', 'READY']) assert.ok(labels.includes(label), label);
  assert.equal(labels.some(label => label.startsWith('STUN')), false);
});

test('role and defense strings stay text-only, bounded and explicit about tradeoffs', () => {
  for (const roleId of ['<img src=x onerror=bad()>', '__proto__', 'constructor', undefined]) {
    assert.equal(helpers.enemyRolePresentation({roleId}).id, 'baseline');
  }
  assert.equal(helpers.defenseRate(.015), '1.5%');
  assert.equal(helpers.defenseRate(NaN), '0%');
  assert.equal(helpers.defenseRate(2), '100%');
  for (const text of ['刺劍可能有助於較高的一般物理減傷', '戰棍須先打出傷害', '不能忽略格擋', '戰斧的直接攻擊力仍有價值', '沒有通吃所有敵人的最佳武器', '不是最終完全迴避率', '本作改編']) assert.ok(html.includes(text), text);
  assert.match(html, /<details class="route-advice"><summary>/, 'touch and keyboard users can read hints without hover');
  assert.match(css, /\.route-preview\[hidden\]\s*\{\s*display:\s*none/);
  assert.match(html, /v0\.53 · 來源候選/);
  for (const key of ['save', 'writer', 'preferences']) assert.ok(js.includes(`${key}-v3`));
  assert.doesNotMatch(js, /save-v5|writer-v5|preferences-v5|\.innerHTML\s*=/);
});
