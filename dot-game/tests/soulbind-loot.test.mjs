import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import {
  QUALITY_TIERS, createCommissionWeapon, generateItem, scoreItem,
  soulbindCost, createSoulboundItem, scaleSoulboundItem, isSoulboundItem,
  classifySafeLootItem, dominanceWitness, hasUnknownSaleMetadata, itemSalePrice,
} from '../src/loot.js';

function seeded(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; }; }
function freezeDeep(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freezeDeep); Object.freeze(value); }
  return value;
}
const clone = value => JSON.parse(JSON.stringify(value));
function weapon(overrides = {}) {
  const item = { ...createCommissionWeapon('rapier', 7), ...overrides };
  item.power = scoreItem(item);
  return item;
}
function tierWeapon(tier, level, family = 'axe') {
  const index = QUALITY_TIERS.indexOf(tier);
  const low = QUALITY_TIERS.slice(0, index).reduce((sum, value) => sum + value.weight, 0);
  const families = ['axe', 'rapier', 'club'];
  const draws = [(families.indexOf(family) + .5) / families.length, (low + tier.weight / 2) / 100];
  return generateItem(() => draws.shift() ?? .5, level, 'weapon');
}
function expectedStats(stats, from, to) {
  const rates = ['crit', 'evade', 'block'];
  return Object.fromEntries(Object.entries(stats).map(([key, value]) => {
    const divisor = rates.includes(key) || key === 'parry' ? 2000 : key === 'attack' ? 50 / 3 : key === 'hp' ? 12 : 20;
    const scaled = value * (1 + to / divisor) / (1 + from / divisor);
    return [key, rates.includes(key) ? Math.round(Math.min(.16, scaled) * 10000) / 10000
      : key === 'parry' ? Math.round(scaled * 10000) / 10000 : Math.round(scaled)];
  }));
}

test('soulbind loot: all eight quality costs at levels 1 and 500 and all own weapon families', () => {
  const costs = [100, 100, 100, 100, 100, 250, 500, 1000];
  for (const level of [1, 500]) for (const family of ['axe', 'rapier', 'club']) {
    for (const [index, tier] of QUALITY_TIERS.entries()) {
      const item = tierWeapon(tier, level, family);
      assert.equal(item.quality, tier.name);
      assert.equal(item.weaponFamily, family);
      assert.equal(soulbindCost(item, level), costs[index], `${tier.name} ${family} L${level}`);
      const bound = createSoulboundItem(item, level);
      assert.ok(isSoulboundItem(bound));
      assert.deepEqual(bound.stats, item.stats);
      assert.equal(bound.level, level);
      assert.equal(bound.locked, true);
      assert.equal(soulbindCost(bound, level), null);
      assert.equal(createSoulboundItem(bound, level), null);
    }
  }
});

test('soulbind loot: strict level and recognized weapon eligibility; lower-level binding immediately scales', () => {
  const item = weapon();
  for (const level of [undefined, null, false, '7', NaN, Infinity, -1, 0, 1.5, 6, 501]) {
    assert.equal(soulbindCost(item, level), null);
    assert.equal(createSoulboundItem(item, level), null);
  }
  for (const changes of [
    { name: '玩家自訂武器' }, { weaponFamily: null }, { weaponFamily: 'axe' },
    { weaponFamily: 'future' }, { quality: 'Legendary' }, { prefix: '銳意' },
    { suffix: '未知' }, { level: 0 }, { level: 1.5 }, { level: 501 }, { level: 1000 },
  ]) assert.equal(soulbindCost(weapon(changes), 500), null, JSON.stringify(changes));
  for (const slot of ['armor', 'accessory']) assert.equal(soulbindCost(generateItem(seeded(42), 7, slot), 7), null);
  const bound = createSoulboundItem(item, 500);
  assert.ok(isSoulboundItem(bound));
  assert.equal(bound.soulbound.level, 7);
  assert.deepEqual(bound.stats, expectedStats(item.stats, 7, 500));
  assert.equal(bound.power, scoreItem(bound));
});

test('soulbind loot: absolute compatibility scaling covers all seven existing stats, cap and rounding', () => {
  const item = weapon({ stats: { attack: 53, defense: 3, hp: 14, crit: .1599, evade: .009,
    block: .008, parry: 10.1234 } });
  const bound = createSoulboundItem(item, 500);
  assert.ok(isSoulboundItem(bound));
  assert.deepEqual(bound.stats, expectedStats(item.stats, 7, 500));
  assert.equal(bound.stats.crit, .16);
  assert.equal(bound.stats.parry, 12.6101, 'parry remains a rating, not a capped chance');
  for (const key of ['attack', 'defense', 'hp']) assert.ok(Number.isInteger(bound.stats[key]));
  for (const key of ['crit', 'evade', 'block', 'parry']) assert.equal(bound.stats[key], Math.round(bound.stats[key] * 10000) / 10000);
  assert.deepEqual(Object.keys(bound.stats), Object.keys(item.stats));
  assert.deepEqual(bound.soulbound.stats, item.stats);
});

test('soulbind loot: direct and stepwise level growth are identical without cumulative rounding drift', () => {
  const item = weapon({ stats: { attack: 53, defense: 3, hp: 14, crit: .0295, evade: .009, parry: 10.1234 } });
  const direct = createSoulboundItem(item, 500);
  let stepped = createSoulboundItem(item, 7);
  for (let level = 8; level <= 500; level++) {
    stepped = scaleSoulboundItem(stepped, level);
    assert.ok(isSoulboundItem(stepped), `level ${level}`);
    assert.deepEqual(stepped.soulbound.stats, item.stats);
  }
  assert.deepEqual(stepped, direct);
  assert.deepEqual(scaleSoulboundItem(stepped, 500), direct, 'repeated same-level scaling is idempotent');
  assert.deepEqual(scaleSoulboundItem(stepped, 7), createSoulboundItem(item, 7));
  for (const level of [0, 6, 501, 7.5, '8', null, NaN, Infinity]) assert.equal(scaleSoulboundItem(stepped, level), null);
});

test('soulbind loot: binding and scaling detach nested data, freeze anchors, and accept frozen input', () => {
  const item = freezeDeep(weapon({ locked: false })), before = JSON.stringify(item);
  const bound = createSoulboundItem(item, 10);
  assert.equal(JSON.stringify(item), before);
  assert.notEqual(bound, item);
  assert.notEqual(bound.stats, item.stats);
  assert.notEqual(bound.rolls, item.rolls);
  assert.notEqual(bound.soulbound.stats, item.stats);
  assert.ok(Object.isFrozen(bound.soulbound));
  assert.ok(Object.isFrozen(bound.soulbound.stats));
  assert.throws(() => { bound.soulbound.level = 1; }, TypeError);
  assert.throws(() => { bound.soulbound.stats.attack = 1; }, TypeError);
  for (const key of Object.keys(item).filter(key => !['level', 'stats', 'power', 'locked'].includes(key))) {
    assert.deepEqual(bound[key], item[key], `preserved ${key}`);
  }
  freezeDeep(bound);
  const boundBefore = JSON.stringify(bound), grown = scaleSoulboundItem(bound, 500);
  assert.equal(JSON.stringify(bound), boundBefore);
  assert.notEqual(grown.stats, bound.stats);
  assert.notEqual(grown.rolls, bound.rolls);
  assert.notEqual(grown.soulbound, bound.soulbound);
  grown.stats.attack = 1; grown.rolls.attack = 1;
  assert.equal(JSON.stringify(bound), boundBefore);
});

test('soulbind loot: exact legacy names bind without optional diagnostics and never invent missing parry', () => {
  const legacy = weapon();
  for (const key of ['weaponFamily', 'roll', 'rolls', 'prefix', 'suffix', 'description', 'rarityColor']) delete legacy[key];
  delete legacy.stats.parry;
  legacy.power = scoreItem(legacy);
  const before = clone(legacy), bound = createSoulboundItem(freezeDeep(legacy), 10);
  assert.ok(isSoulboundItem(bound));
  assert.deepEqual(legacy, before);
  for (const item of [bound, scaleSoulboundItem(bound, 500)]) {
    assert.ok(isSoulboundItem(item));
    assert.equal(Object.hasOwn(item.stats, 'parry'), false);
    assert.equal(Object.hasOwn(item.soulbound.stats, 'parry'), false);
    for (const key of ['weaponFamily', 'roll', 'rolls', 'prefix', 'suffix', 'description', 'rarityColor']) {
      assert.equal(Object.hasOwn(item, key), false, `${key} remains absent`);
    }
  }
});

test('soulbind loot: bound JSON and foreign-realm saves validate and rebuild an immutable anchor', () => {
  const bound = createSoulboundItem(weapon(), 50);
  const json = JSON.stringify(bound);
  for (const restored of [JSON.parse(json), runInNewContext(`JSON.parse(${JSON.stringify(json)})`)]) {
    assert.ok(isSoulboundItem(restored));
    assert.equal(hasUnknownSaleMetadata(restored), false);
    assert.ok(classifySafeLootItem(restored));
    const scaled = scaleSoulboundItem(restored, 500);
    assert.deepEqual(scaled, createSoulboundItem(weapon(), 500));
    assert.ok(Object.isFrozen(scaled.soulbound.stats));
  }
});

test('soulbind loot: stale or altered cached stats, level and power are rejected before rescaling', () => {
  const source = createSoulboundItem(weapon(), 50);
  const updates = [
    item => { item.level = 51; }, item => { item.level = 6; }, item => { item.level = 501; },
    item => { item.stats.attack++; }, item => { item.stats.parry += .0001; },
    item => { delete item.stats.parry; }, item => { item.stats.hp = 0; },
    item => { item.power++; }, item => { item.power = NaN; }, item => { item.locked = false; },
    item => { item.soulbound.stats.attack++; }, item => { item.soulbound.level++; },
    item => { item.rolls.hp = 110; }, item => { item.name = '未知武器'; },
  ];
  for (const update of updates) {
    const item = clone(source); update(item);
    assert.equal(isSoulboundItem(item), false, String(update));
    assert.equal(scaleSoulboundItem(item, 500), null, String(update));
    assert.equal(hasUnknownSaleMetadata(item), true, String(update));
    assert.equal(classifySafeLootItem(item), null, String(update));
    assert.equal(itemSalePrice(item), 0, String(update));
  }
});

test('soulbind loot: only exact versioned anchor structures are accepted', () => {
  const source = createSoulboundItem(weapon(), 50);
  const invalid = [undefined, null, false, 1, [], {},
    { version: 1, level: 7 }, { version: 1, stats: source.soulbound.stats },
    { level: 7, stats: source.soulbound.stats },
    { ...source.soulbound, version: 2 }, { ...source.soulbound, version: '1' },
    { ...source.soulbound, level: 0 }, { ...source.soulbound, level: 7.5 },
    { ...source.soulbound, level: 51 }, { ...source.soulbound, level: '7' },
    { ...source.soulbound, extra: true }, { ...source.soulbound, stats: null },
    { ...source.soulbound, stats: { ...source.soulbound.stats, future: 1 } },
  ];
  for (const soulbound of invalid) {
    const item = { ...source, soulbound };
    assert.equal(isSoulboundItem(item), false);
    assert.equal(scaleSoulboundItem(item, 500), null);
    assert.equal(soulbindCost(item, 500), null);
    assert.equal(createSoulboundItem(item, 500), null);
    assert.equal(hasUnknownSaleMetadata(item), true);
    assert.equal(classifySafeLootItem(item), null);
    assert.equal(itemSalePrice(item), 0);
  }
});

test('soulbind loot: reject malformed, noncanonical or excessive stats and mismatched power', () => {
  for (const [key, values] of [
    ['attack', [0, -1, 1.25, '1', NaN, Infinity, 1000001]],
    ['defense', [-1, .5, NaN]], ['hp', [-1, .5, NaN]],
    ['crit', [-.01, .1601, .012345, '0.01', Infinity]],
    ['evade', [.1601, .012345]], ['block', [.1601, .012345]],
    ['parry', [-1, 1.23456, Infinity, 1000001]],
  ]) for (const value of values) {
    const item = weapon({ stats: { attack: 30, [key]: value } });
    assert.equal(soulbindCost(item, 7), null, `${key} ${String(value)}`);
    assert.equal(createSoulboundItem(item, 7), null);
    const forged = { ...item, soulbound: { version: 1, level: 7, stats: { ...item.stats } } };
    assert.equal(isSoulboundItem(forged), false);
  }
  const wrongPower = weapon(); wrongPower.power++;
  assert.equal(soulbindCost(wrongPower, 7), null);
  for (const attack of [490000, 499999]) {
    const oversized = weapon({ level: 1, stats: { attack }, rolls: { attack: 110 } });
    assert.ok(classifySafeLootItem(oversized), 'ordinary unbound identity remains loadable');
    assert.equal(hasUnknownSaleMetadata(oversized), false);
    for (const level of [1, 2, 500]) {
      assert.equal(soulbindCost(oversized, level), null, 'never quote an anchor with unsafe future growth');
      assert.equal(createSoulboundItem(oversized, level), null);
    }
    const forged = { ...oversized, soulbound: { version: 1, level: 1, stats: { attack } } };
    assert.equal(isSoulboundItem(forged), false, 'current valid cache cannot admit future-overflowing anchors');
    assert.equal(hasUnknownSaleMetadata(forged), true);
    assert.equal(classifySafeLootItem(forged), null);
    assert.equal(scaleSoulboundItem(forged, 1), null);
    assert.equal(scaleSoulboundItem(forged, 500), null);
  }
});

test('soulbind loot: getters and unknown metadata fail closed without evaluating accessors', () => {
  let getterCalls = 0;
  const getter = () => { getterCalls++; throw new Error('must not run'); };
  const source = createSoulboundItem(weapon(), 50);
  const invalid = [];
  for (const key of ['id', 'name', 'weaponFamily', 'stats', 'power', 'locked', 'soulbound']) {
    const item = clone(source); Object.defineProperty(item, key, { enumerable: true, get: getter }); invalid.push(item);
  }
  for (const path of ['anchor', 'anchorStats', 'stats', 'rolls']) {
    const item = clone(source);
    const object = path === 'anchor' ? item.soulbound : path === 'anchorStats' ? item.soulbound.stats : item[path];
    const key = path === 'anchor' ? 'level' : 'attack';
    Object.defineProperty(object, key, { enumerable: true, get: getter }); invalid.push(item);
  }
  for (const path of ['item', 'anchor', 'anchorStats', 'stats', 'rolls']) {
    for (const key of ['future', Symbol('future')]) {
      const item = clone(source);
      const object = path === 'item' ? item : path === 'anchor' ? item.soulbound : path === 'anchorStats' ? item.soulbound.stats : item[path];
      object[key] = 1; invalid.push(item);
    }
    const item = clone(source);
    const object = path === 'item' ? item : path === 'anchor' ? item.soulbound : path === 'anchorStats' ? item.soulbound.stats : item[path];
    Object.defineProperty(object, path === 'anchor' ? 'version' : path === 'item' ? 'id' : 'attack', { enumerable: false });
    invalid.push(item);
  }
  for (const item of invalid) {
    assert.equal(isSoulboundItem(item), false);
    assert.equal(scaleSoulboundItem(item, 500), null);
    assert.equal(soulbindCost(item, 500), null);
    assert.equal(createSoulboundItem(item, 500), null);
    assert.equal(hasUnknownSaleMetadata(item), true);
    assert.equal(classifySafeLootItem(item), null);
    assert.equal(itemSalePrice(item), 0);
  }
  assert.equal(getterCalls, 0);
});

test('soulbind loot: bound keepers participate in all seven dominance stats but are never sale candidates', () => {
  const base = { attack: 30, defense: 3, hp: 10, crit: .02, evade: .01, block: .01, parry: 12 };
  const candidate = { id: 'candidate', name: '普通・逐風刺劍', slot: 'weapon', weaponFamily: 'rapier',
    quality: 'Average', level: 7, stats: base, power: scoreItem({ stats: base }), locked: false };
  for (const key of Object.keys(base)) {
    const stats = { ...base, [key]: base[key] + (['crit', 'evade', 'block'].includes(key) ? .01 : 1) };
    const bound = createSoulboundItem({ ...candidate, id: 'keeper', stats, power: scoreItem({ stats }) }, 7);
    assert.ok(isSoulboundItem(bound));
    assert.deepEqual(dominanceWitness(candidate, [bound]), { keeperId: 'keeper', strictlyBetterKeys: [key] });
    assert.equal(dominanceWitness(bound, [weapon()]), null);
    assert.equal(dominanceWitness({ ...bound, locked: false }, [weapon()]), null);
    assert.equal(itemSalePrice(bound), 0);
  }
  assert.ok(itemSalePrice(candidate) > 0, 'ordinary unbound sale formula is unchanged');
});

test('soulbind loot: frozen historical drop and commission fixtures remain unchanged and consume no extra RNG', () => {
  const expected = {
    id: 'loot-7-61-vrqy7z', name: '普通・暮鋼戰斧・屠戮', slot: 'weapon', weaponFamily: 'axe',
    quality: 'Average', rarityColor: '#b6c6d8', level: 7, roll: 61, rolls: { attack: 61 },
    power: 130, stats: { attack: 65 }, locked: false,
    description: '重視基礎斬擊傷害。詞綴：屠戮基底攻擊區間。', prefix: '', suffix: '屠戮',
  };
  const rng = seeded(42), control = seeded(42);
  const item = generateItem(rng, 7, 'weapon');
  assert.deepEqual(item, expected);
  assert.deepEqual(generateItem(control, 7, 'weapon'), expected);
  const originalRandom = Math.random;
  try {
    Math.random = () => { throw new Error('soulbind must never draw randomness'); };
    assert.equal(soulbindCost(item, 500), 100);
    const bound = createSoulboundItem(freezeDeep(item), 7);
    assert.ok(isSoulboundItem(scaleSoulboundItem(bound, 500)));
  } finally { Math.random = originalRandom; }
  assert.equal(rng(), control());
  const commission = createCommissionWeapon('rapier', 10);
  assert.deepEqual(commission.stats, { attack: 52, crit: .0295, parry: 11.6634 });
  assert.deepEqual(commission.rolls, { attack: 110, crit: 110, parry: 110 });
  assert.equal(commission.power, 133);
  assert.equal(Object.hasOwn(commission, 'soulbound'), false);
});

test('soulbind loot: generated items remain eligible across historical levels and affixes', () => {
  const rng = seeded(10319);
  for (let i = 0; i < 1200; i++) {
    const item = generateItem(rng, 1 + i % 500, 'weapon'), before = JSON.stringify(item);
    const bound = createSoulboundItem(item, 500);
    assert.ok(isSoulboundItem(bound), item.name);
    assert.equal(hasUnknownSaleMetadata(bound), false);
    assert.ok(classifySafeLootItem(bound));
    assert.equal(JSON.stringify(item), before);
    assert.deepEqual(bound.rolls, item.rolls);
    assert.deepEqual(Object.keys(bound.stats), Object.keys(item.stats));
    assert.equal(bound.name, item.name);
  }
});
