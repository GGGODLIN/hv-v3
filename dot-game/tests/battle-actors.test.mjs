import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as engine from '../src/engine.js';
import { resolveWeaponFamily, createCommissionWeapon } from '../src/loot.js';

// Canvas command/source checks, not browser paint, screenshot or mobile evidence.
const source = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const extract = (name, next) => source.slice(source.indexOf(`function ${name}(`), source.indexOf(`function ${next}(`));
const actors = extract('drawHero', 'drawScene');
const clone = value => JSON.parse(JSON.stringify(value));
function harness({ reducedMotion = true, state = engine.createGame(42), attackPulse = 1, enemyPulse = 1 } = {}) {
  const trace = [], stack = [];
  let paint = { fillStyle: '', strokeStyle: '', globalAlpha: 1 };
  const ctx = {};
  for (const key of ['fillStyle', 'strokeStyle', 'globalAlpha', 'font', 'textAlign', 'lineWidth']) {
    Object.defineProperty(ctx, key, { get: () => paint[key], set: value => { paint[key] = value; } });
  }
  for (const key of ['translate', 'rotate', 'scale', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'fill', 'ellipse', 'stroke', 'arc', 'fillText']) {
    ctx[key] = (...args) => trace.push({ op: key, args: clone(args), paint: { ...paint } });
  }
  ctx.save = () => { stack.push({ ...paint }); trace.push({ op: 'save', args: [] }); };
  ctx.restore = () => { assert.ok(stack.length, 'balanced restore'); paint = stack.pop(); trace.push({ op: 'restore', args: [] }); };
  const noRandom = Object.create(Math); noRandom.random = () => { throw new Error('actor attempted RNG'); };
  const context = { ...engine, resolveWeaponFamily, Math: noRandom, ctx, state, prefs: { reducedMotion }, attackPulse, enemyPulse };
  runInNewContext(`${extract('enemyRolePresentation', 'renderRoutePreview')} ${extract('rect', 'drawScene')}`, context);
  return {
    state, context,
    draw(code) { trace.length = 0; paint = { fillStyle: '', strokeStyle: '', globalAlpha: 1 }; runInNewContext(code, context); assert.equal(stack.length, 0); assert.equal(ctx.globalAlpha, 1, 'alpha restored before subsequent scene rendering'); return clone(trace); },
    enemy(enemy, index = 0, t = 0) { context.enemy = enemy; return this.draw(`drawEnemy(enemy, 230, 140, ${index}, ${t});`); },
    hero(t = 0) { return this.draw(`drawHero(90, 140, ${t});`); },
  };
}
const names = ['灰霧獵犬', '碎晶甲蟲', '荒野影獸', '赤砂守衛'];
function enemy(name, extra = {}) { return { id: 'actor', name, roleId: 'baseline', hp: 100, maxHp: 100, defense: 12, mitigation: .12, evade: .04, parry: .03, block: .02, ...extra }; }
// Strip only paint and text to prove a silhouette difference, not a palette swap.
const geometry = trace => JSON.stringify(trace.filter(row => row.op !== 'fillText').map(({ op, args }) => ({ op, args })));
function body(trace) {
  let depth = 0;
  for (let i = 0; i < trace.length; i++) {
    if (trace[i].op === 'save') depth++;
    if (trace[i].op === 'restore' && --depth === 0) return trace.slice(0, i + 1);
  }
  throw new Error('missing actor restore');
}

for (const name of names) test(`${name}: species geometry is stable across role and slot, not selected by palette or index`, () => {
  const h = harness();
  const normal = body(h.enemy(enemy(name)));
  for (const roleId of ['baseline', 'armored', 'agile']) {
    for (const index of [0, 1, 2]) assert.equal(geometry(body(h.enemy(enemy(name, { roleId }), index, 8))), geometry(normal));
  }
});

test('four species, gate guardian and safe unknown each take a different geometry path', () => {
  const h = harness();
  const cases = [...names.map(name => enemy(name)), enemy('裂隙守門者 · 5', { boss: true }), enemy('未識別旅人')];
  assert.equal(new Set(cases.map(value => geometry(body(h.enemy(value))))).size, cases.length);
  const boss = body(h.enemy(cases[4]));
  for (const name of [...names, '未知']) assert.equal(geometry(body(h.enemy(enemy(name, { boss: true })))), geometry(boss), 'boss flag wins over name');
  assert.ok(boss.some(row => row.op === 'scale' && row.args[0] === 1.5));
});

test('unknown names cannot select a species through partial names or prototype keys', () => {
  const h = harness();
  const fallback = geometry(body(h.enemy(enemy('未知'))));
  for (const name of ['灰霧獵犬?', '巨大碎晶甲蟲', '荒野影獸<script>', '赤砂守衛 · 假', '__proto__', 'constructor']) assert.equal(geometry(body(h.enemy(enemy(name)))), fallback);
  const roleShapes = ['baseline', 'armored', 'agile'].map(roleId => geometry(body(h.enemy(enemy('未知', { roleId })))));
  assert.equal(new Set(roleShapes).size, 3, 'safe fallback preserves existing distinct role cues');
});

test('guard crystal is a fixed alternating-capability cue, not an invented action prediction', () => {
  const h = harness();
  const plain = h.enemy(enemy('赤砂守衛'));
  const caster = enemy('赤砂守衛', { attackPattern: 'alternating', attackCount: 0 });
  const first = h.enemy(caster);
  assert.notEqual(geometry(body(plain)), geometry(body(first)));
  caster.attackCount = 5;
  assert.equal(geometry(body(h.enemy(caster, 2, 500))), geometry(body(first)));
  assert.deepEqual(first.filter(row => row.op === 'fillText'), plain.filter(row => row.op === 'fillText'), 'does not invent magic/next-action labels');
});

test('equipped axe, rapier, club and neutral starter sword have distinct silhouettes', () => {
  const h = harness();
  const signatures = [geometry(h.hero())];
  for (const family of ['axe', 'rapier', 'club']) {
    h.state.equipment.weapon = createCommissionWeapon(family, 1);
    assert.equal(resolveWeaponFamily(h.state.equipment.weapon), family);
    signatures.push(geometry(h.hero()));
  }
  assert.equal(new Set(signatures).size, 4);
});

for (const family of ['axe', 'rapier', 'club']) test(`hero ${family} follows authoritative family, not display name, selected item or power`, () => {
  const h = harness(); h.state.equipment.weapon = createCommissionWeapon(family, 1);
  const actual = h.hero();
  Object.assign(h.state.equipment.weapon, { name: '<img>假刺劍戰斧戰棍', power: 99999, stats: { attack: 99999 }, rarityColor: '#ffffff' });
  h.context.selectedId = 'inspect-other'; h.context.selectedSlot = 'weapon';
  h.state.inventory.push({ ...createCommissionWeapon(family === 'axe' ? 'club' : 'axe', 1), id: 'inspect-other' });
  assert.deepEqual(h.hero(), actual);
});

test('exact legacy weapon names still resolve; explicit null and arbitrary family/name use neutral sword', () => {
  const h = harness(); const neutral = h.hero();
  const generated = createCommissionWeapon('rapier', 1);
  h.state.equipment.weapon = generated; const rapier = h.hero();
  delete h.state.equipment.weapon.weaponFamily;
  assert.equal(resolveWeaponFamily(h.state.equipment.weapon), 'rapier');
  assert.deepEqual(h.hero(), rapier);
  for (const item of [null, { ...generated, weaponFamily: null }, { ...generated, weaponFamily: 'laser' }, { slot: 'weapon', name: '戰斧' }, { slot: 'armor', weaponFamily: 'axe' }]) {
    h.state.equipment.weapon = item;
    assert.deepEqual(h.hero(), neutral);
  }
});

test('reduced motion suppresses both bob and pulses, retaining all recognizable static geometry', () => {
  const h = harness();
  for (const value of [...names.map(name => enemy(name)), enemy('首領', { boss: true })]) {
    const frozen = h.enemy(value, 0, 0);
    assert.deepEqual(h.enemy(value, 2, 400), frozen);
    h.context.enemyPulse = 0; assert.deepEqual(h.enemy(value, 2, 900), frozen); h.context.enemyPulse = 1;
  }
  const hero = h.hero(0);
  assert.deepEqual(h.hero(500), hero);
  h.context.attackPulse = 0; assert.deepEqual(h.hero(700), hero);
});

test('normal living animation still uses existing pulse/bob, while defeated actors are static and visibly flattened', () => {
  const h = harness({ reducedMotion: false });
  assert.notEqual(geometry(h.hero(0)), geometry(h.hero(10)));
  for (const value of [...names.map(name => enemy(name)), enemy('首領', { boss: true })]) {
    const alive = body(h.enemy(value, 0, 0));
    assert.notEqual(geometry(body(h.enemy(value, 1, 4))), geometry(alive));
    value.hp = 0;
    const dead = h.enemy(value, 0, 0);
    assert.notEqual(geometry(body(dead)), geometry(alive));
    assert.deepEqual(h.enemy(value, 2, 300), dead);
    assert.ok(body(dead).some(row => row.op === 'scale' && row.args[1] === .28));
    assert.ok(body(dead).some(row => row.paint?.globalAlpha === .45));
    assert.ok(dead.filter(row => row.op === 'fillText').every(row => row.paint.globalAlpha === 1));
  }
});

test('live HP, role, target and stacked PA/STUN/BW overlays retain truth outside body styling', () => {
  const state = engine.createGame(42); engine.act(state, 'start'); state.timing.ticks = 10;
  const target = enemy('碎晶甲蟲', { roleId: 'armored', penetratedArmor: { stacks: 2, expiresAtTick: 17 }, stun: { expiresAtTick: 14 }, bleeding: { stacks: 2, expiresAtTick: 16, damagePerTick: 2 } });
  state.enemies = [target]; const h = harness({ state });
  const trace = h.enemy(target), labels = trace.filter(row => row.op === 'fillText');
  for (const text of ['▼ 集火', '碎晶甲蟲', '▣ 厚甲', 'PA 2 · 7T', 'STUN 4T', 'BW 2 · 6T']) assert.ok(labels.some(row => row.args[0] === text), text);
  assert.ok(labels.every(row => row.paint.globalAlpha === 1));
  assert.ok(trace.some(row => row.op === 'fillRect' && row.args[2] === 40 && row.args[3] === 3), 'full-health bar still drawn at existing dimensions');
});

test('actor draws never mutate game/enemies/items, consume random numbers, dispatch, save or load media', () => {
  const h = harness({ reducedMotion: false });
  for (const family of ['axe', 'rapier', 'club', null]) {
    if (family) h.state.equipment.weapon = createCommissionWeapon(family, 1);
    for (const value of [...names.map(name => enemy(name)), enemy('首領', { boss: true }), enemy('__proto__', { hp: 0 })]) {
      h.state.enemies = [value]; const before = JSON.stringify(h.state), copy = JSON.stringify(value);
      for (let t = 0; t < 4; t++) { h.hero(t); h.enemy(value, t % 3, t); }
      assert.equal(JSON.stringify(h.state), before); assert.equal(JSON.stringify(value), copy);
    }
  }
  assert.doesNotMatch(actors, /Math\.random|\brandom\s*\(|\bact\s*\(|\bdispatch\s*\(|writeStorage|localStorage|new Image|drawImage|fetch\s*\(|https?:\/\//);
  assert.match(actors, /resolveWeaponFamily\(state\.equipment\?\.weapon\)/);
  assert.doesNotMatch(actors, /selectedId|selectedSlot|setTimeout|Date\.now|performance\.now/);
});
