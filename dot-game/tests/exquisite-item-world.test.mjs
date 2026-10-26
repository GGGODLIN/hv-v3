import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import * as loot from '../src/loot.js';

// Focused synthetic behavioral fixtures, not natural earnings or browser play.
const clone = structuredClone;
const families = ['axe', 'rapier', 'club'];
function weapon(quality = 'Exquisite', family = 'rapier', level = 3) {
  const index = loot.QUALITY_TIERS.findIndex(tier => tier.name === quality), tier = loot.QUALITY_TIERS[index];
  const low = loot.QUALITY_TIERS.slice(0, index).reduce((sum, value) => sum + value.weight, 0);
  const draws = [(families.indexOf(family) + .5) / 3, (low + tier.weight / 2) / 100];
  const item = { ...loot.generateItem(() => draws.shift() ?? .5, level, 'weapon'), id: 'exquisite-target' };
  assert.equal(item.quality, quality); assert.equal(loot.resolveWeaponFamily(item), family);
  return item;
}
function expected(anchor, level) {
  return Object.fromEntries(Object.entries(anchor.stats).map(([key, value]) => {
    const rate = ['crit', 'evade', 'block'].includes(key);
    const divisor = rate || key === 'parry' ? 2000 : key === 'attack' ? 50 / 3 : key === 'hp' ? 12 : 20;
    const raw = value * (1 + level / divisor) / (1 + anchor.level / divisor) * (key === 'attack' ? 1.02 : 1.01);
    return [key, rate ? Math.round(Math.min(.16, raw) * 1e4) / 1e4 : key === 'parry' ? Math.round(raw * 1e4) / 1e4 : Math.round(raw)];
  }));
}
function fixture({ family = 'rapier', location = 'inventory', level = 16, legacy = false } = {}) {
  const state = game.createGame(42); state.hero.level = level; state.worldSeeds = 3; state.soulFragments = 110;
  state.stage = 3; state.unlocked = 7; state.wins = 8;
  const s = game.validateSave(state), item = weapon('Exquisite', family, 3);
  if (legacy) { delete item.stats.parry; delete item.rolls.parry; delete item.weaponFamily; item.power = loot.scoreItem(item); }
  const bound = loot.createSoulboundItem(item, level); assert.ok(bound);
  if (location === 'equipment') s.equipment.weapon = bound; else s.inventory.push(bound);
  s.battle.bestTimes = { 1: 12, 3: 34 }; return s;
}
const target = s => [...Object.values(s.equipment), ...s.inventory, ...s.pendingLoot].find(item => item.id === 'exquisite-target');
function enter(s) {
  const quote = game.previewItemWorld(s, 'exquisite-target'); assert.equal(quote.available, true, quote.reason);
  game.act(s, 'enterItemWorld', quote); assert.equal(game.itemWorldView(s).active, true); return quote;
}
function refuse(s, quote) {
  const before = clone(s); game.act(s, 'enterItemWorld', quote); assert.deepEqual(s, before);
}

test('Exquisite IW1: all four qualities and three families use the same source-anchor rule at current and maximum levels', () => {
  for (const quality of ['Fair', 'Average', 'Superior', 'Exquisite']) for (const family of families) for (const level of [3, 16, 500]) {
    const original = weapon(quality, family), bound = loot.createSoulboundItem(original, level);
    const before = clone(bound), grown = loot.createItemWorldUpgrade(bound, level);
    assert.ok(grown, `${quality}/${family}/Lv${level}`); assert.deepEqual(grown.stats, expected(bound.soulbound, level));
    assert.deepEqual(bound, before); assert.deepEqual(grown.soulbound, before.soulbound);
    for (const key of ['id', 'name', 'quality', 'prefix', 'suffix', 'weaponFamily', 'roll', 'rolls']) assert.deepEqual(grown[key], original[key]);
    assert.deepEqual(grown.itemWorld, { version: 1, level: 1 }); assert.equal(grown.locked, true);
    assert.equal(loot.createItemWorldUpgrade(grown, level), null); assert.equal(loot.createItemWorldUpgrade(original, level), null);
  }
});

test('Exquisite IW1: seven-stat rounding and caps are unchanged, including neutral integer growth', () => {
  const item = weapon(), stats = { attack: 53, defense: 3, hp: 14, crit: .1599, evade: .009, block: .008, parry: 10.1234 };
  item.stats = stats; item.power = loot.scoreItem(item);
  for (const level of [3, 4, 7, 16, 37, 100, 250, 500]) {
    const bound = loot.createSoulboundItem(item, level), grown = loot.createItemWorldUpgrade(bound, level);
    assert.deepEqual(grown.stats, expected(bound.soulbound, level)); assert.equal(grown.stats.crit, .16);
    assert.deepEqual(Object.keys(grown.stats), Object.keys(stats)); assert.equal(grown.power, loot.scoreItem(grown));
  }
  const sameLevel = loot.createItemWorldUpgrade(loot.createSoulboundItem(item, 3), 3);
  assert.equal(sameLevel.stats.defense, 3); assert.equal(sameLevel.stats.hp, 14);
});

test('Exquisite IW1: legacy missing parry and family stay absent through stepwise growth to500', () => {
  const original = weapon(); delete original.stats.parry; delete original.rolls.parry; delete original.weaponFamily;
  original.power = loot.scoreItem(original);
  const bound = loot.createSoulboundItem(original, 16); let stepped = loot.createItemWorldUpgrade(bound, 16);
  for (let level = 17; level <= 500; level++) {
    stepped = loot.scaleSoulboundItem(stepped, level); assert.ok(loot.isSoulboundItem(stepped), `Lv${level}`);
    assert.deepEqual(stepped.stats, expected(bound.soulbound, level));
    for (const record of [stepped.stats, stepped.soulbound.stats, stepped.rolls]) assert.equal(Object.hasOwn(record, 'parry'), false);
    assert.equal(Object.hasOwn(stepped, 'weaponFamily'), false);
  }
  assert.deepEqual(stepped, loot.createItemWorldUpgrade(loot.scaleSoulboundItem(bound, 500), 500));
  assert.deepEqual(stepped.soulbound, bound.soulbound);
});

test('Exquisite IW1: Crude and Magnificent–Peerless remain unsupported with no malformed-metadata escape', () => {
  for (const quality of ['Crude', 'Magnificent', 'Legendary', 'Peerless']) for (const family of families) {
    const s = fixture({ family }); s.inventory[0] = loot.createSoulboundItem(weapon(quality, family), 16);
    const quote = game.previewItemWorld(s, 'exquisite-target'); assert.equal(quote.available, false); refuse(s, quote);
    s.inventory[0].itemWorld = { version: 1, level: 1 };
    assert.equal(loot.isSoulboundItem(s.inventory[0]), false); assert.throws(() => game.validateSave(s));
  }
  const s = fixture(); s.inventory[0] = weapon(); const quote = game.previewItemWorld(s, 'exquisite-target');
  assert.equal(quote.available, false); refuse(s, quote);
});

test('Exquisite IW1: prospective level500 overflow refuses quote/payment before mutating a legal unupgraded cache', () => {
  const original = weapon('Exquisite', 'axe', 1); let bound;
  for (let attack = 16000; attack < 18000; attack++) {
    const candidate = loot.createSoulboundItem({ ...original, stats: { attack }, rolls: { attack: 110 }, power: attack * 2 }, 1);
    if (candidate && !loot.createItemWorldUpgrade(candidate, 1)) { bound = candidate; break; }
  }
  assert.ok(bound); assert.ok(loot.scaleSoulboundItem(bound, 500));
  const s = game.createGame(42); s.worldSeeds = 1; s.inventory = [bound];
  const quote = game.previewItemWorld(s, bound.id); assert.equal(quote.available, false); refuse(s, quote);
  for (const level of [1, 2, 100, 500]) assert.equal(loot.createItemWorldUpgrade(loot.scaleSoulboundItem(bound, level), level), null);
});

test('Exquisite IW1: exact quote is detached, zero-RNG and remains the unchanged five-round/one-seed offer', () => {
  const s = fixture(), before = clone(s), random = Math.random;
  Math.random = () => { throw Error('preview must not draw RNG'); };
  try {
    const quote = game.previewItemWorld(s, 'exquisite-target'); assert.equal(quote.available, true);
    assert.equal(quote.rounds, 5); assert.equal(quote.strengthStage, 5); assert.equal(quote.cost, 1); assert.equal(quote.seedsAfter, 2);
    assert.deepEqual(quote.after, loot.createItemWorldUpgrade(target(s), 16));
    quote.before.stats.attack = 0; quote.after.soulbound.stats.attack = 0; assert.deepEqual(s, before);
  } finally { Math.random = random; }
});

test('Exquisite IW1: current target identity, cache, ownership, balance and full quote must still match before debit', () => {
  for (const mutate of [s => { s.worldSeeds++; }, s => { s.hero.level++; }, s => { target(s).stats.attack++; },
    s => { target(s).power++; }, s => { target(s).locked = false; }, s => { target(s).id = 'changed-id'; },
    s => { target(s).quality = 'Superior'; }, s => { s.equipment.weapon = s.inventory.pop(); },
    s => { s.pendingLoot = s.inventory.splice(0); }]) {
    const s = fixture(), quote = game.previewItemWorld(s, 'exquisite-target'); mutate(s); refuse(s, quote);
  }
  const quote = game.previewItemWorld(fixture(), 'exquisite-target');
  for (const changed of [{ ...quote, cost: 0 }, { ...quote, rounds: 4 }, { ...quote, strengthStage: 1 },
    { ...quote, extra: true }, { id: quote.id, quoteBasis: quote.quoteBasis }]) refuse(fixture(), changed);
});

for (const family of families) for (const location of ['equipment', 'inventory']) test(`Exquisite IW1: ${family}/${location} entry charges once, never auto-equips or grows early`, () => {
  const s = fixture({ family, location }), before = clone(s), quote = enter(s);
  assert.equal(s.worldSeeds, 2); assert.deepEqual(s.inventory, before.inventory); assert.deepEqual(s.equipment, before.equipment);
  assert.equal(game.itemWorldView(s).targetId, 'exquisite-target'); assert.equal(s.totalWaves, 5);
  const entered = clone(s); game.act(s, 'enterItemWorld', quote); assert.deepEqual(s, entered);
  game.act(s, 'retreat'); assert.equal(s.mode, 'town'); assert.equal(s.worldSeeds, 2);
  assert.deepEqual(target(s), target(before)); assert.equal(game.itemWorldView(s).active, false);
});

test('Exquisite IW1: ordinary trial advancement wins once with only kill rewards and preserves backpack legacy identity', () => {
  const s = fixture({ level: 30, legacy: true }), before = clone(s), quote = enter(s);
  let n = 0; while (s.mode === 'battle' && n++ < 4000) game.advance(s, .25);
  assert.ok(n < 4000); assert.equal(s.mode, 'town'); assert.equal(game.expeditionReports(s)[0].outcome, 'win');
  assert.equal(s.worldSeeds, 2); assert.equal(s.kills, before.kills + 8); assert.equal(s.hero.gold, before.hero.gold + 28);
  for (const key of ['wins', 'soulFragments', 'stage', 'unlocked', 'autoAdvance']) assert.equal(s[key], before[key]);
  assert.deepEqual(s.battle.bestTimes, before.battle.bestTimes); assert.equal(s.battle.cleared, before.battle.cleared);
  assert.equal(s.equipment.weapon.id, before.equipment.weapon.id); assert.deepEqual(target(s), loot.createItemWorldUpgrade(target(before), s.hero.level));
  assert.equal(Object.hasOwn(target(s).stats, 'parry'), false); assert.deepEqual(target(s).soulbound, target(before).soulbound);
  assert.equal(game.previewItemWorld(s, 'exquisite-target').available, false); const terminal = clone(s);
  game.act(s, 'enterItemWorld', quote); game.advance(s, 2); assert.deepEqual(s, terminal);
});

test('Exquisite IW1: unfinished reload keeps only the paid seed and settled earnings, not trial or early upgrade', () => {
  const s = fixture({ level: 30, legacy: true }), before = clone(target(s)); enter(s);
  let n = 0; while (!s.kills && n++ < 1000) game.advance(s, .25);
  assert.ok(n < 1000); assert.equal(s.mode, 'battle'); const loaded = game.validateSave(clone(s));
  assert.equal(loaded.mode, 'town'); assert.deepEqual(game.itemWorldView(loaded), { active: false }); assert.equal(loaded.worldSeeds, 2);
  for (const key of ['gold', 'xp']) assert.equal(loaded.hero[key], s.hero[key]); assert.equal(loaded.kills, s.kills);
  assert.deepEqual(target(loaded), before); assert.equal(Object.hasOwn(target(loaded), 'itemWorld'), false);
});

test('Exquisite IW1: format3 roundtrips all held locations but rejects altered cache/anchor and malformed IW levels without repair', () => {
  for (const location of ['equipment', 'inventory', 'pending']) {
    const s = fixture(); const grown = loot.createItemWorldUpgrade(s.inventory.pop(), 16);
    if (location === 'equipment') s.equipment.weapon = grown; else if (location === 'inventory') s.inventory.push(grown); else s.pendingLoot.push(grown);
    assert.equal(game.VERSION, 3); assert.deepEqual(target(game.validateSave(clone(s))), grown);
    for (const mutate of [item => { item.stats.attack++; }, item => { item.soulbound.stats.attack++; },
      item => { item.power++; }, item => { item.itemWorld.level = 2; }, item => { item.itemWorld.level = 15; },
      item => { item.itemWorld.level = '1'; }, item => { item.itemWorld.extra = true; }, item => { item.locked = false; }]) {
      const invalid = clone(s); mutate(target(invalid)); const unchanged = clone(invalid);
      assert.throws(() => game.validateSave(invalid)); assert.deepEqual(invalid, unchanged);
    }
    for (const version of [1, 2]) {
      const legacy = clone(s); legacy.version = version; delete legacy.worldSeeds; if (version === 1) delete legacy.soulFragments;
      assert.throws(() => game.validateSave(legacy));
    }
  }
});
