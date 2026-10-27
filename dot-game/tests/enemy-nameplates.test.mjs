import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as engine from '../src/engine.js';
import { resolveWeaponFamily } from '../src/loot.js';

// Canvas command checks only: text metrics, browser pixels and floating DOM animation
// remain browser-review work. A synthetic three-enemy case is not a supported layout.
const source = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const section = (start, end) => source.slice(source.indexOf(`function ${start}(`), source.indexOf(`function ${end}(`));
const clone = value => JSON.parse(JSON.stringify(value));
const target = (extra = {}) => ({ id: 'plate-target', name: '碎晶甲蟲', roleId: 'armored', hp: 80, maxHp: 100, mitigation: .4, evade: .1, parry: .07, block: .06, ...extra });
const statuses = { penetratedArmor: { stacks: 2, expiresAtTick: 17 }, stun: { expiresAtTick: 14 }, bleeding: { stacks: 3, expiresAtTick: 17, damagePerTick: 2 } };
function harness(enemies, { width = 320, reducedMotion = false, policy = 'front' } = {}) {
  const state = engine.createGame(42); engine.act(state, 'targetPriority', policy); engine.act(state, 'start'); state.enemies = enemies; state.timing.ticks = 10;
  const trace = [], stack = [];
  let paint = { fillStyle: '', strokeStyle: '', globalAlpha: 1, font: '', textAlign: '', lineWidth: 1 };
  const ctx = {};
  for (const key of Object.keys(paint)) Object.defineProperty(ctx, key, { get: () => paint[key], set: value => { paint[key] = value; } });
  for (const key of ['translate', 'rotate', 'scale', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'fill', 'ellipse', 'stroke', 'arc', 'fillText']) {
    ctx[key] = (...args) => trace.push({ op: key, args: clone(args), paint: { ...paint } });
  }
  ctx.save = () => { stack.push({ ...paint }); trace.push({ op: 'save', args: [] }); };
  ctx.restore = () => { assert.ok(stack.length); paint = stack.pop(); trace.push({ op: 'restore', args: [] }); };
  const math = Object.create(Math); math.random = () => assert.fail('nameplate attempted RNG');
  const context = { ...engine, resolveWeaponFamily, state, ctx, prefs: { reducedMotion }, sceneWidth: width, enemyPulse: 1, attackPulse: 1, Math: math };
  runInNewContext(`${section('enemyRolePresentation', 'renderRoutePreview')} ${section('rect', 'drawScene')}`, context);
  return { state, context, draw(enemy, { x = width * .72, y = 160 * .79, index = 0, t = 0 } = {}) {
    const before = JSON.stringify(state), beforeEnemy = JSON.stringify(enemy); trace.length = 0;
    Object.assign(context, { enemy, x, y, index, t }); runInNewContext('drawEnemy(enemy, x, y, index, t)', context);
    assert.equal(stack.length, 0); assert.equal(paint.globalAlpha, 1); assert.equal(JSON.stringify(state), before); assert.equal(JSON.stringify(enemy), beforeEnemy);
    let depth = 0, bodyEnd = 0;
    for (let i = 0; i < trace.length; i++) { if (trace[i].op === 'save') depth++; if (trace[i].op === 'restore' && --depth === 0) { bodyEnd = i + 1; break; } }
    const overlay = clone(trace.slice(bodyEnd));
    return { overlay, labels: overlay.filter(row => row.op === 'fillText'), plate: overlay.find(row => row.op === 'fillRect') };
  } };
}
const texts = result => result.labels.map(label => label.args[0]);
const rectangle = result => { const [left, top, width, height] = result.plate.args; return { left, top, right: left + width, bottom: top + height, width, height }; };

test('nameplates separate opaque backing, name, HP, target and active effects with larger type', () => {
  const enemy = target(statuses), h = harness([enemy]), result = h.draw(enemy), labels = texts(result);
  assert.deepEqual(labels, ['碎晶甲蟲', 'HP 80%', '▼ 集火', 'PA 2 · 7T', 'STUN 4T', 'BW 3 · 7T']);
  assert.ok(result.overlay.some(row => row.op === 'fillRect' && row.paint.fillStyle === '#0d191f' && row.args[2] === 74 && row.args[3] === 50));
  assert.equal(result.labels[0].paint.font, '600 8px system-ui'); assert.equal(result.labels[1].paint.font, '7px system-ui');
  assert.ok(result.labels.filter(row => /^(PA |STUN |BW )/.test(row.args[0])).every(row => row.paint.font === '600 6.5px system-ui'));
  assert.ok(result.overlay.some(row => row.op === 'ellipse' && row.args[2] === 18));
  assert.ok(result.labels.every(row => row.paint.globalAlpha === 1));
  assert.ok(!labels.some(label => /現減|閃|招|擋|厚甲|靈巧/.test(label)));
});

test('HP is an explicitly percentage-labelled, bounded view, with live tiny/full rounding distinguished', () => {
  for (const [hp, maxHp, expected] of [[0, 100, '0'], [.01, 100, '<1'], [.99, 100, '<1'], [1, 100, '1'], [79.6, 100, '80'], [99.49, 100, '99'], [99.5, 100, '<100'], [99.99, 100, '<100'], [100, 100, '100'], [120, 100, '100'], [-2, 100, '0']]) {
    const enemy = target({ hp, maxHp, ...statuses }), h = harness([enemy]), result = h.draw(enemy);
    assert.ok(texts(result).includes(`HP ${expected}%`), `${hp}/${maxHp}`);
    assert.equal(texts(result).includes('▼ 集火'), hp > 0);
    assert.equal(texts(result).some(label => label.startsWith('PA ')), hp > 0);
    const bar = result.overlay.filter(row => row.op === 'fillRect' && row.args[3] === 3).at(-1);
    assert.ok(bar.args[2] >= 0 && bar.args[2] <= 66);
  }
  assert.match(html, /HP（四捨五入的生命百分比；不足1%與接近滿血時用小於號區分）/);
});

test('PA/BW stacks, remaining ticks and stun recovery remain authoritative; expiration/death creates no effects', () => {
  const enemy = target(statuses), h = harness([enemy]);
  h.state.timing.ticks = 13;
  assert.deepEqual(texts(h.draw(enemy)).slice(3), ['PA 2 · 4T', 'STUN 1T', 'BW 3 · 4T']);
  delete enemy.stun; enemy.stunRecoveryPending = true;
  assert.deepEqual(texts(h.draw(enemy)).slice(3), ['PA 2 · 4T', 'READY', 'BW 3 · 4T']);
  h.state.timing.ticks = 17; delete enemy.stunRecoveryPending;
  assert.deepEqual(texts(h.draw(enemy)), ['碎晶甲蟲', 'HP 80%', '▼ 集火']);
  Object.assign(enemy, statuses, { hp: 0, stunRecoveryPending: true }); h.state.timing.ticks = 10;
  assert.deepEqual(texts(h.draw(enemy)), ['碎晶甲蟲', 'HP 0%']);
  assert.ok(!h.draw(enemy).overlay.some(row => row.op === 'ellipse'));
});

test('ordinary two-enemy nameplate boxes remain separate and inside 320/480/640 logical widths', () => {
  for (const width of [320, 480, 640]) {
    const enemies = [target({ ...statuses, id: 'first' }), target({ ...statuses, id: 'second', name: '赤砂守衛' })], h = harness(enemies, { width });
    const boxes = enemies.map((enemy, index) => rectangle(h.draw(enemy, { x: width * (.6 + index * .26), y: 160 * .79 - index * 2, index })));
    assert.ok(boxes[0].right < boxes[1].left, JSON.stringify({ width, boxes }));
    for (const box of boxes) { assert.ok(box.left >= 4 && box.right <= width - 4); assert.ok(box.top >= 4 && box.bottom < 160 * .79 - 46); }
  }
});

test('boss triple effects share one bounded row above the unchanged tall silhouette', () => {
  const enemy = target({ ...statuses, boss: true, name: '裂隙守門者 · 30' }), h = harness([enemy]), result = h.draw(enemy), box = rectangle(result);
  assert.equal(box.width, 116); assert.equal(box.height, 42); assert.ok(box.left >= 4 && box.right <= 316);
  assert.ok(box.bottom < 160 * .79 - 69.5, 'source-space gap includes maximum living bob; not a glyph/pixel claim');
  const effectLabels = result.labels.filter(row => /^(PA |STUN |BW )/.test(row.args[0]));
  assert.equal(new Set(effectLabels.map(row => row.args[2])).size, 1);
  for (const row of result.labels) { assert.ok(row.args[1] >= box.left && row.args[1] <= box.right); assert.ok(row.args[2] > box.top && row.args[2] < box.bottom); }
});

test('nameplate anchors and existing text do not drift with bob, pulse, reduced motion or a newly added effect row', () => {
  const enemy = target(), h = harness([enemy]), initial = h.draw(enemy);
  assert.deepEqual(h.draw(enemy, { t: 92.7 }).overlay, initial.overlay);
  h.context.enemyPulse = 0; assert.deepEqual(h.draw(enemy, { t: 400, index: 2 }).overlay, initial.overlay);
  h.context.prefs.reducedMotion = true; assert.deepEqual(h.draw(enemy, { t: 17 }).overlay, initial.overlay);
  Object.assign(enemy, statuses);
  assert.deepEqual(h.draw(enemy).labels.slice(0, 3), initial.labels);
  assert.equal(rectangle(h.draw(enemy)).top, rectangle(initial).top);
});

test('target selection switches the original ring and in-plate arrow without changing effect truth', () => {
  const enemies = [target({ id: 'front', hp: 80, ...statuses }), target({ id: 'weak', hp: 40, ...statuses })], h = harness(enemies, { policy: 'weakest' });
  assert.equal(engine.targetPriorityView(h.state).targetId, 'weak');
  for (const enemy of enemies) {
    const result = h.draw(enemy);
    assert.equal(texts(result).includes('▼ 集火'), enemy.id === 'weak');
    assert.equal(result.overlay.some(row => row.op === 'ellipse'), enemy.id === 'weak');
    assert.deepEqual(texts(result).filter(label => /^(PA |STUN |BW )/.test(label)), ['PA 2 · 7T', 'STUN 4T', 'BW 3 · 7T']);
  }
});

test('canvas aria describes actual placement and spells out recovery/ticks without relocating exact DOM defense data', () => {
  const aria = html.match(/<canvas id="battle-canvas" aria-label="([^"]+)"/)[1];
  for (const text of ['頭頂名牌', 'READY 為甦醒待行動', 'T 為剩餘 Tick', '完整特效資料見下方敵方狀態']) assert.ok(aria.includes(text));
  assert.ok(!aria.includes('現減為'));
  const overlay = section('drawEnemy', 'drawScene').split('// Compact nameplates')[1];
  assert.doesNotMatch(overlay, /enemyDefenseView|defenseRate|Math\.random|dispatch\(|writeStorage|localStorage|Date\.now|performance\.now|\.innerHTML|new Image/);
});
