import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, act, advance, INVENTORY_LIMIT} from '../src/engine.js';
import {classifySafeLootItem, itemSalePrice, scoreItem} from '../src/loot.js';

const clone = value => JSON.parse(JSON.stringify(value));
const SLOTS = ['weapon', 'armor', 'accessory'];
const KEYS = ['attack', 'defense', 'hp', 'crit', 'evade', 'block'];
const LOW = new Set(['Crude', 'Fair', 'Average']);
// The default is a fast regression subset, not the broader measurement below.
// Reproduce the documented 100-seed evidence with SAFE_LOOT_SEEDS=100.
const count = process.env.SAFE_LOOT_SEEDS === undefined ? 5 : Number(process.env.SAFE_LOOT_SEEDS);
assert.ok(Number.isInteger(count) && count >= 1 && count <= 100, 'SAFE_LOOT_SEEDS must be 1..100');
const SEEDS = count === 5 ? [1, 7, 42, 73, 100] : Array.from({length:count}, (_, index) => index + 1);
const median = values => {
  const sorted = [...values].sort((a, b) => a - b), half = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[half] : (sorted[half-1] + sorted[half]) / 2;
};
const rounded = value => Number(value.toFixed(2));
const allItems = s => [...Object.values(s.equipment), ...s.inventory, ...s.pendingLoot];
const sameBase = (a, b) => {
  const left = classifySafeLootItem(a), right = classifySafeLootItem(b);
  return left && right && left.slot === right.slot && left.base === right.base && left.weaponFamily === right.weaponFamily;
};
// Independent componentwise oracle. No production dominance helper/preview,
// score, quality ordering, level or R roll participates in this comparison.
const strictlyDominates = (keeper, candidate) => sameBase(keeper, candidate)
  && KEYS.every(key => (keeper.stats[key] || 0) >= (candidate.stats[key] || 0))
  && KEYS.some(key => (keeper.stats[key] || 0) > (candidate.stats[key] || 0));

function equipEarned(s) {
  for (const slot of SLOTS) {
    const best = [s.equipment[slot], ...s.inventory.filter(item => item.slot === slot)]
      .reduce((best, item) => scoreItem(item) > scoreItem(best) ? item : best);
    if (best.id !== s.equipment[slot].id) act(s, 'equip', best.id);
  }
}
function warmup(seed) {
  const s = createGame(seed);
  // Ten actual stage-1 clears, balanced tactics, ordinary naturally earned gear.
  // Camp after every clear, equip each slot's highest flat score (first wins ties).
  // No selling, quality/stat edits, manual potions, rerolls or future-loot knowledge.
  for (let clear = 0; clear < 10; clear++) {
    act(s, 'start');
    for (let step = 0; step < 6000 && s.mode === 'battle' && s.wins === clear; step++) advance(s, .1);
    assert.equal(s.wins, clear + 1, `warmup seed ${seed}, clear ${clear+1}`);
    act(s, 'retreat');
    equipEarned(s);
  }
  return s;
}
function treatment(start, policy) {
  const s = clone(start);
  if (policy === 'locked') {
    const earned = allItems(s).filter(item => classifySafeLootItem(item));
    // Deliberately protect the nondominated alternatives available NOW, not
    // hypothetical perfect gear or keepers chosen from future drops.
    for (const item of s.inventory) {
      if (!item.locked && classifySafeLootItem(item)
        && !earned.some(other => other.id !== item.id && strictlyDominates(other, item))) act(s, 'lock', item.id);
    }
  }
  if (policy !== 'off') act(s, 'setAutoSell', true);
  return s;
}
function combatView(s) {
  const {gold, ...hero} = s.hero;
  return {hero, seed:s.seed, itemId:s._itemId, eventId:s._eventId, wins:s.wins, kills:s.kills,
    equipment:s.equipment, enemies:s.enemies, timing:s.timing, battle:s.battle,
    wave:s.wave, stage:s.stage, unlocked:s.unlocked, potions:s.potions,
    clock:s._clock, enemyClock:s._enemyClock, turns:s._turns, rest:s._rest};
}
function runUntilStop(start) {
  const s = clone(start), originals = clone(allItems(s)), initialGold = s.hero.gold;
  const keepers = [...Object.values(s.equipment), ...s.inventory.filter(item => item.locked === true)];
  const drops = [], rng = [], sales = [], categories = {high:0, equal:0, tradeoff:0, upgrades:0};
  let seed = s.seed;
  Object.defineProperty(s, 'seed', {enumerable:true, configurable:true,
    get:() => seed, set:value => {seed = value; rng.push(value);}});
  act(s, 'start');
  assert.equal(s.mode, 'battle');
  let shadow = clone(s); delete shadow.autoSell;
  let steps = 0;
  for (; steps < 200000 && s.mode === 'battle'; steps++) {
    const previousItemId = s._itemId;
    const priorInventory = shadow.inventory.length, priorPending = shadow.pendingLoot.length;
    advance(shadow, .1);
    advance(s, .1);
    if (s._itemId === previousItemId) continue;
    const generated = [...shadow.inventory.slice(priorInventory), ...shadow.pendingLoot.slice(priorPending)];
    assert.equal(generated.length, 1, 'a single simulation substep awards at most one item');
    const item = generated[0];
    assert.deepEqual(combatView(s), combatView(shadow), 'sale changes neither combat, RNG draws nor generated IDs');
    drops.push(clone({item, seed:s.seed, itemId:s._itemId, wins:s.wins, kills:s.kills}));
    const retained = allItems(s).find(other => other.id === item.id);
    const witnesses = keepers.filter(keeper => strictlyDominates(keeper, item));
    const eligible = LOW.has(item.quality) && !item.locked && witnesses.length > 0;
    if (!retained) {
      assert.equal(s.autoSell, true);
      assert.ok(eligible, `invalid sale of ${item.id}: upgrade/equal/tradeoff/high quality must survive`);
      assert.equal(s.hero.gold - shadow.hero.gold, itemSalePrice(item));
      assert.ok(s.events.some(event => event.target === item.id && event.text.startsWith('自動出售 ') && event.value === itemSalePrice(item)));
      sales.push(clone(item));
    } else {
      assert.deepEqual(retained, item, 'retention never changes quality/stats/locks/metadata');
      assert.equal(s.hero.gold, shadow.hero.gold);
      assert.ok(s.autoSell !== true || !eligible, 'production sells every eligible future drop in this known schema');
    }
    if (!LOW.has(item.quality)) { categories.high++; assert.ok(retained); }
    const matched = keepers.filter(keeper => sameBase(keeper, item));
    if (!witnesses.length && matched.some(keeper => KEYS.every(key => (keeper.stats[key] || 0) === (item.stats[key] || 0)))) {
      categories.equal++; assert.ok(retained);
    }
    if (!witnesses.length && matched.some(keeper => strictlyDominates(item, keeper))) {
      categories.upgrades++; assert.ok(retained);
    }
    if (!witnesses.length && matched.some(keeper =>
      KEYS.some(key => (keeper.stats[key] || 0) < (item.stats[key] || 0))
      && KEYS.some(key => (keeper.stats[key] || 0) > (item.stats[key] || 0)))) {
      categories.tradeoff++; assert.ok(retained);
    }
    // Only the observation companion is resynchronized. The subject is never
    // edited: actual production caps, rewards, combat and sale decisions stand.
    // This also avoids interpreting the companion's hypothetical full-bag stop
    // as the subject's stop when that last generated item was actually sold.
    shadow = clone(s); delete shadow.autoSell;
  }
  Object.defineProperty(s, 'seed', {value:seed, enumerable:true, configurable:true, writable:true});
  assert.ok(steps < 200000, 'bounded run reaches the existing stop without intervening');
  assert.equal(s.mode, 'town', 'these stage-1 runs stop safely, not in defeat');
  assert.ok(s.inventory.length > INVENTORY_LIMIT - 5 && s.inventory.length <= INVENTORY_LIMIT);
  assert.equal(s.pendingLoot.length, 0);
  assert.match(s.logs[0], /背包接近滿額/);
  for (const original of originals) {
    assert.deepEqual(allItems(s).find(item => item.id === original.id), original, 'every original item and lock survives; opt-in never sweeps');
  }
  const soldIds = new Set(sales.map(item => item.id));
  assert.equal(s.inventory.length, start.inventory.length + drops.length - sales.length);
  for (const {item} of drops) if (!soldIds.has(item.id)) assert.deepEqual(allItems(s).find(other => other.id === item.id), item);
  const saleCredits = sales.reduce((sum, item) => sum + itemSalePrice(item), 0);
  return {state:s, drops, rng, categories, metrics:{wins:s.wins-start.wins, seconds:rounded(steps/10),
    initialInventory:start.inventory.length, inventory:s.inventory.length, drops:drops.length,
    sold:sales.length, saleCredits, totalGoldGain:s.hero.gold-initialGold,
    lockedAlternates:start.inventory.filter(item => item.locked && classifySafeLootItem(item)).length}};
}
function summarize(runs) {
  const keys = ['wins','seconds','initialInventory','inventory','drops','sold','saleCredits','totalGoldGain','lockedAlternates'];
  return Object.fromEntries(keys.map(key => [key, {min:Math.min(...runs.map(run => run.metrics[key])),
    median:rounded(median(runs.map(run => run.metrics[key]))), max:Math.max(...runs.map(run => run.metrics[key]))}]));
}

test('safe loot: actual naturally earned idle runs preserve full drop/RNG prefixes and stop at unchanged capacity', t => {
  const results = {off:[], equipped:[], locked:[]};
  for (const seed of SEEDS) {
    const start = warmup(seed), off = runUntilStop(treatment(start, 'off'));
    const equipped = runUntilStop(treatment(start, 'equipped'));
    const locked = runUntilStop(treatment(start, 'locked'));
    for (const on of [equipped, locked]) {
      assert.deepEqual(on.drops.slice(0, off.drops.length), off.drops, `seed ${seed}: every shared generated drop is identical`);
      assert.deepEqual(on.rng.slice(0, off.rng.length), off.rng, `seed ${seed}: every individual RNG assignment matches the shared prefix`);
      assert.ok(on.metrics.wins >= off.metrics.wins);
      assert.ok(on.metrics.seconds >= off.metrics.seconds);
    }
    assert.deepEqual(locked.drops.slice(0, equipped.drops.length), equipped.drops);
    assert.deepEqual(locked.rng.slice(0, equipped.rng.length), equipped.rng);
    assert.ok(locked.metrics.wins >= equipped.metrics.wins, 'additional protected witnesses cannot reduce this fixed-build runway');
    for (const [policy, run] of Object.entries({off,equipped,locked})) results[policy].push(run);
    t.diagnostic(JSON.stringify({kind:'safe-loot-seed', seed, off:off.metrics, equipped:equipped.metrics, locked:locked.metrics}));
  }
  assert.ok(results.equipped.some(run => run.metrics.sold > 0));
  assert.ok(results.locked.some((run,index) => run.metrics.wins > results.off[index].metrics.wins));
  const retained = Object.values(results).flat().reduce((total, run) => {
    for (const key of Object.keys(total)) total[key] += run.categories[key];
    return total;
  }, {high:0,equal:0,tradeoff:0,upgrades:0});
  assert.ok(retained.high > 0 && retained.tradeoff > 0 && retained.upgrades > 0);
  // Natural equality may be absent in a small sample; dedicated predicate/action
  // tests exercise equality deterministically instead of injecting fake gear here.
  t.diagnostic(JSON.stringify({kind:'safe-loot-summary', seeds:SEEDS,
    policies:Object.fromEntries(Object.entries(results).map(([policy,runs]) => [policy,summarize(runs)])), retained}));
});

test('safe loot: long-run observation is transparent against an ordinary production OFF run', () => {
  const start = warmup(42), observed = runUntilStop(start), ordinary = clone(start);
  act(ordinary, 'start');
  for (let step = 0; step < 200000 && ordinary.mode === 'battle'; step++) advance(ordinary, .1);
  assert.deepEqual(observed.state, ordinary, 'RNG accessor and no-sale companion never alter the subject');
});
