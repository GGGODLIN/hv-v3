import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createGame, validateSave } from '../src/engine.js';
import { COMMISSION_WEAPON_FAMILIES, WEAPON_FAMILIES, createCommissionWeapon, generateItem,
  classifySafeLootItem, hasUnknownSaleMetadata, resolveWeaponFamily, scoreItem, itemSalePrice,
  dominanceWitness } from '../src/loot.js';

const clone = value => JSON.parse(JSON.stringify(value));
const expectedKeys = ['id', 'name', 'slot', 'weaponFamily', 'quality', 'rarityColor', 'level',
  'roll', 'rolls', 'power', 'stats', 'locked', 'description', 'prefix', 'suffix'].sort();

test('commission catalog: three immutable descriptors agree with supported weapon identities', () => {
  assert.deepEqual(COMMISSION_WEAPON_FAMILIES, [
    { family: 'axe', label: '戰斧' }, { family: 'rapier', label: '刺劍' }, { family: 'club', label: '戰棍' },
  ]);
  assert.deepEqual(COMMISSION_WEAPON_FAMILIES.map(row => row.family), WEAPON_FAMILIES);
  assert.ok(Object.isFrozen(COMMISSION_WEAPON_FAMILIES));
  for (const row of COMMISSION_WEAPON_FAMILIES) assert.ok(Object.isFrozen(row));
});

test('commission catalog: level-seven baseline uses existing Slaughter endpoints and scoring', () => {
  for (const [family, name, stats, power, resale] of [
    ['axe', '優良・暮鋼戰斧・屠戮', { attack: 77 }, 154, 175],
    ['rapier', '優良・逐風刺劍・屠戮', { attack: 46, crit: .0295 }, 100, 121],
    ['club', '優良・裂岩戰棍・屠戮', { attack: 64, crit: .0295 }, 136, 157],
  ]) {
    const item = createCommissionWeapon(family, 7);
    assert.equal(item.name, name);
    assert.deepEqual(item.stats, stats);
    assert.equal(item.power, power);
    assert.equal(itemSalePrice(item), resale);
    assert.equal(item.quality, 'Superior');
    assert.equal(item.rarityColor, '#80d8a0');
    assert.equal(item.prefix, '');
    assert.equal(item.suffix, '屠戮');
    assert.equal(item.locked, true);
    assert.equal(item.roll, 110);
    assert.ok(Object.values(item.rolls).every(roll => roll === 110));
  }
});

test('commission catalog: every family and level exactly matches an ordinary same-roll item', () => {
  for (let level = 1; level <= 500; level++) {
    for (const [index, family] of WEAPON_FAMILIES.entries()) {
      // Ordinary generation: chosen base; Superior; no prefix; Slaughter;
      // all applicable stat draws land at R110. Final draw is the ordinary ID.
      const draws = [(index + .5) / 3, .5, .9, 0,
        ...Array(family === 'axe' ? 1 : 2).fill(.5), .25];
      const ordinary = generateItem(() => {
        assert.ok(draws.length, 'ordinary generator used an unexpected draw');
        return draws.shift();
      }, level, 'weapon');
      assert.equal(draws.length, 0);
      const commissioned = createCommissionWeapon(family, level);
      assert.deepEqual(commissioned, { ...ordinary, id: `commission-${family}-${level}`, locked: true });
      assert.equal(commissioned.power, scoreItem(commissioned));
      assert.equal(resolveWeaponFamily(commissioned), family);
      assert.deepEqual(Reflect.ownKeys(commissioned).sort(), expectedKeys);
      assert.deepEqual(Object.keys(commissioned.rolls), Object.keys(commissioned.stats));
    }
  }
});

test('commission catalog: all 1500 offers survive current strict classification and save validation', () => {
  for (let level = 1; level <= 500; level++) {
    const state = createGame(71);
    state.hero.level = level;
    state.inventory = WEAPON_FAMILIES.map((family, index) => {
      const item = createCommissionWeapon(family, level);
      assert.equal(hasUnknownSaleMetadata(item), false);
      const identity = classifySafeLootItem(item);
      assert.equal(identity?.weaponFamily, family);
      assert.equal(identity?.quality, 'Superior');
      assert.equal(identity?.prefix, '');
      assert.equal(identity?.suffix, '屠戮');
      // As on purchase, overwrite only the harmless offer ID with a normal ID.
      item.id = `loot-${index + 1}`;
      return item;
    });
    const saved = validateSave(clone(state));
    assert.deepEqual(saved.inventory, state.inventory);
    assert.equal(saved._itemId, 3);
    for (const item of saved.inventory) assert.ok(classifySafeLootItem(item));
  }
});

test('commission catalog: invalid family or hero level fails closed without coercion', () => {
  const noCoercion = { [Symbol.toPrimitive]() { throw Error('must not coerce'); } };
  for (const family of [undefined, null, '', 'sword', 'Axe', ' axe', 'rapier ', false, 1,
    [], ['axe'], {}, noCoercion, Symbol('axe')]) {
    assert.equal(createCommissionWeapon(family, 7), null);
  }
  for (const level of [undefined, null, 0, -1, 501, 1000, 7.1, NaN, Infinity, -Infinity,
    '7', true, [], [7], {}, noCoercion, Symbol('7'), 7n, new Number(7)]) {
    assert.equal(createCommissionWeapon('axe', level), null);
  }
});

test('commission catalog: output is detached, deterministic, and independent of random globals and time', () => {
  const expected = WEAPON_FAMILIES.map(family => createCommissionWeapon(family, 7));
  const random = Math.random, now = Date.now;
  try {
    Math.random = () => { throw Error('commission must not roll'); };
    Date.now = () => { throw Error('commission must not use time'); };
    assert.deepEqual(WEAPON_FAMILIES.map(family => createCommissionWeapon(family, 7)), expected);
  } finally { Math.random = random; Date.now = now; }
  for (const [index, family] of WEAPON_FAMILIES.entries()) {
    const a = createCommissionWeapon(family, 7), b = createCommissionWeapon(family, 7);
    assert.notEqual(a, b);
    assert.notEqual(a.stats, b.stats);
    assert.notEqual(a.rolls, b.rolls);
    a.stats.attack = -100; a.rolls.attack = 200; a.name = 'changed'; a.locked = false;
    assert.deepEqual(b, expected[index]);
    assert.deepEqual(createCommissionWeapon(family, 7), expected[index]);
  }
});

test('commission catalog: ordinary strict-schema guards and safe-sale protections remain unchanged', () => {
  const item = createCommissionWeapon('axe', 7);
  for (const key of ['commission', 'provenance', 'forge', 'receipt']) {
    const future = { ...item, [key]: {} };
    assert.equal(hasUnknownSaleMetadata(future), true);
    assert.equal(classifySafeLootItem(future), null);
    const state = createGame(); state.inventory = [future];
    assert.throws(() => validateSave(state), /不支援的裝備欄位/);
  }
  const keeper = { ...item, id: 'keeper', stats: { attack: item.stats.attack + 1 } };
  assert.equal(dominanceWitness(item, [keeper]), null, 'delivered item is locked');
  assert.equal(dominanceWitness({ ...item, locked: false }, [keeper]), null, 'Superior is not safe-sale eligible');
});

test('commission catalog: shared builder preserves 3000 complete accepted-v0.6 item fingerprints and RNG streams', () => {
  // Captured from accepted v0.6 loot.js before refactoring. Unlike older identity
  // fingerprints, these include every property, including description/family.
  for (const baseline of [
    { seed: 1, calls: 8492, finalSeed: 2999494445, digest: 'f5730fe72dc281e973aa97bde1e2301dffb1bd6d9b40ebb949a1e0be6e90d0bf' },
    { seed: 71, calls: 8540, finalSeed: 4023059395, digest: '083d70876765ccb7da8fb553630cc349153e9f72da2bec1f839a1ca5660b131f' },
    { seed: 1337, calls: 8437, finalSeed: 2853276008, digest: '66b53959c9195d1459e722143ff3b4547963ea08a17d8abbd49292f2c1bc8246' },
  ]) {
    let seed = baseline.seed, calls = 0;
    const rng = () => { calls++; seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
    const hash = createHash('sha256');
    for (let i = 0; i < 1000; i++) {
      hash.update(JSON.stringify(generateItem(rng, 1 + i % 80, [undefined, 'weapon', 'armor', 'accessory'][i % 4])) + '\n');
    }
    assert.equal(calls, baseline.calls);
    assert.equal(seed, baseline.finalSeed);
    assert.equal(hash.digest('hex'), baseline.digest);
  }
});
