import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { createGame, act, advance, INVENTORY_LIMIT } from '../src/engine.js';
import { createPump } from '../src/session.js';

const source = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const dispatchStart = source.indexOf('function dispatch(');
const dispatchEnd = source.indexOf('function commissionQuoteSignature(', dispatchStart);
assert.ok(dispatchStart >= 0 && dispatchEnd > dispatchStart, 'exercise the actual UI dispatcher');
const dispatchSource = source.slice(dispatchStart, dispatchEnd);
const pumpSource = source.match(/^const pump = createPump\(.+\);$/m)?.[0];
assert.ok(pumpSource, 'exercise the actual UI pump construction');

// Only browser presentation/storage are stubbed. Dispatch, pump construction,
// monotonic timer accounting, action validation and combat are production code.
function harness(state = createGame(42)) {
  let now = 0, lease = true, resets = 0;
  const toasts = [], bleedNotice = { hidden: false };
  const context = createContext({
    state, act, advance, createPump, performance: { now: () => now },
    claimLease: () => lease, reconcileWeaponCommission() {}, reconcileItemWorld() {}, render() {}, save() {},
    $: () => bleedNotice, showToast: message => toasts.push(message), console,
  });
  const { dispatch, pump } = runInContext(`${pumpSource}\n${dispatchSource}\n({ dispatch, pump });`, context);
  const reset = pump.reset;
  pump.reset = () => { resets++; reset(); };
  const at = milliseconds => {
    assert.ok(milliseconds >= now, 'test time is monotonic');
    now = milliseconds;
  };
  return {
    state, dispatch, toasts, bleedNotice, at,
    tick(milliseconds = now) { at(milliseconds); return pump.tick(); },
    setLease(value) { lease = value; },
    get resets() { return resets; },
  };
}
function close(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${message}: ${actual} versus ${expected}`);
}

test('UI start between real pump ticks cannot borrow camp time or attack before 1.05 seconds', () => {
  const h = harness();
  assert.equal(h.tick(0), 0);
  h.at(249); assert.equal(h.dispatch('start'), true);
  assert.equal(h.state.mode, 'battle'); assert.equal(h.state.battle.elapsed, 0);
  assert.equal(h.tick(250), .001);
  close(h.state.battle.elapsed, .001, 'only the post-start millisecond is processed');
  close(h.state._clock, .001, 'player clock');
  close(h.state.timing.tu, .001 * 100 / 1.05, 'global TU');
  for (const now of [500, 750, 1000, 1250]) assert.equal(h.tick(now), .25);
  close(h.state.battle.elapsed, 1.001, 'the original early-attack observation');
  assert.equal(h.state.battle.actions.attacks, 0);
  h.tick(1298); assert.equal(h.state.battle.actions.attacks, 0);
  h.tick(1299); assert.equal(h.state.battle.actions.attacks, 1);
  close(h.state.battle.elapsed, 1.05, 'first action needs its full combat interval');
  const before = structuredClone(h.state);
  assert.equal(h.tick(), 0); assert.deepEqual(h.state, before, 'same-instant observation never pays twice');
  assert.equal(h.resets, 1);
});

test('successful start anchors any timer phase, including a long prior camp pause, without adding time', () => {
  for (const startAt of [0, 1, 249, 250, 10000]) {
    const h = harness(); h.at(startAt); h.dispatch('start');
    const before = structuredClone(h.state);
    assert.equal(h.tick(), 0); assert.deepEqual(h.state, before);
    assert.equal(h.tick(startAt + 1), .001);
    close(h.state.battle.elapsed, .001, `start at ${startAt}ms`);
    assert.equal(h.state.battle.actions.attacks, 0); assert.equal(h.resets, 1);
  }
});

test('retry from defeat starts a new interval without carrying defeated time', () => {
  const state = createGame(42); state.mode = 'defeat'; state.hero.hp = 0;
  const h = harness(state); h.at(249); h.dispatch('start');
  assert.equal(state.mode, 'battle'); assert.ok(state.hero.hp > 0);
  assert.equal(h.tick(250), .001); close(state.battle.elapsed, .001, 'retry interval');
  assert.equal(h.resets, 1); assert.equal(state.battle.actions.attacks, 0);
});

for (const phase of ['fight', 'intermission']) {
  test(`retreat from ${phase} and restart between ticks discard camp time but preserve global TU`, () => {
    const h = harness(); h.at(249); h.dispatch('start'); h.tick(250); h.tick(500);
    const oldTU = h.state.timing.tu;
    h.state._phase = phase;
    if (phase === 'intermission') { h.state._rest = 3; h.state.enemies = []; }
    h.at(749); h.dispatch('retreat');
    assert.equal(h.state.mode, 'town'); assert.equal(h.state._phase, 'idle');
    assert.equal(h.state.timing.tu, oldTU); assert.equal(h.resets, 2);
    assert.equal(h.tick(750), .001); assert.equal(h.state.timing.tu, oldTU);
    h.at(999); h.dispatch('start');
    assert.equal(h.tick(1000), .001); close(h.state.battle.elapsed, .001, 'new expedition');
    close(h.state.timing.tu - oldTU, .001 * 100 / 1.05, 'only new battle time advances TU');
    assert.equal(h.resets, 3); assert.equal(h.state.battle.actions.attacks, 0);
  });
}

test('return from defeat resets once; repeated retreat in camp is not another lifecycle boundary', () => {
  const state = createGame(42); state.mode = 'defeat'; state.hero.hp = 0;
  const h = harness(state); h.at(249); h.dispatch('retreat');
  assert.equal(state.mode, 'town'); assert.equal(h.resets, 1);
  assert.equal(h.tick(250), .001);
  h.at(499); h.dispatch('retreat');
  assert.equal(h.resets, 1); assert.equal(h.tick(500), .25);
  assert.equal(state.battle.elapsed, 0); assert.equal(state.timing.tu, 0);
});

for (const blocker of ['pending loot', 'near-full inventory']) {
  test(`rejected start with ${blocker} leaves the pump interval intact`, () => {
    const state = createGame(42), item = state.equipment.armor;
    if (blocker === 'pending loot') state.pendingLoot = [{ ...structuredClone(item), id: 'pending-1' }];
    else state.inventory = Array.from({ length: INVENTORY_LIMIT - 4 }, (_, index) => ({ ...structuredClone(item), id: `bag-${index}` }));
    const h = harness(state); h.at(249); h.dispatch('start');
    assert.equal(state.mode, 'town'); assert.equal(h.resets, 0);
    assert.equal(h.tick(250), .25); assert.equal(state.battle.elapsed, 0); assert.equal(state.timing.tu, 0);
    state.pendingLoot = []; state.inventory = [];
    h.at(499); h.dispatch('start');
    assert.equal(state.mode, 'battle'); assert.equal(h.resets, 1);
    assert.equal(h.tick(500), .001); close(state.battle.elapsed, .001, 'later successful start');
  });
}

for (const phase of ['fight', 'intermission']) {
  test(`repeated start during ${phase} is a no-op and never postpones the next pump`, () => {
    const h = harness(); h.dispatch('start'); h.tick(250);
    h.state._phase = phase;
    if (phase === 'intermission') { h.state._rest = 3; h.state.enemies = []; }
    const expected = structuredClone(h.state);
    h.at(499); h.dispatch('start'); act(expected, 'start');
    assert.equal(h.resets, 1); assert.equal(h.tick(500), .25); advance(expected, .25);
    assert.deepEqual(h.state, expected);
  });
}

test('ordinary successful or rejected combat actions retain every pending millisecond and their engine result', () => {
  for (const [action, payload] of [['heal'], ['setAutoAdvance', true], ['setStrategy', 'assault'], ['selectStage', 1], ['equip', 'missing'], ['lock', 'missing'], ['setAutoSell', true], ['unknown']]) {
    const h = harness(); h.dispatch('start'); h.tick(250); h.state.hero.hp -= 10;
    const expected = structuredClone(h.state);
    h.at(499); h.dispatch(action, payload); act(expected, action, payload);
    assert.equal(h.resets, 1, action); assert.equal(h.tick(500), .25, action); advance(expected, .25);
    assert.deepEqual(h.state, expected, action); close(h.state.battle.elapsed, .5, action);
  }
});

test('camp tactics do not reset time, and subsequent start still establishes its own boundary', () => {
  const h = harness(); h.at(249); h.dispatch('setStrategy', 'assault');
  assert.equal(h.state.strategy, 'assault'); assert.equal(h.resets, 0); assert.equal(h.tick(250), .25);
  assert.equal(h.state.battle.elapsed, 0);
  h.at(499); h.dispatch('start'); assert.equal(h.tick(500), .001);
  close(h.state.battle.elapsed, .001, 'tactic-selected expedition'); assert.equal(h.resets, 1);
});

test('read-only rejected start does not mutate state or reset the real pump', () => {
  const h = harness(), before = structuredClone(h.state);
  h.setLease(false); h.at(249); assert.equal(h.dispatch('start'), false);
  assert.equal(h.resets, 0); assert.deepEqual(h.state, before); assert.equal(h.toasts.length, 1);
  h.setLease(true); assert.equal(h.tick(250), .25);
  h.at(499); h.dispatch('start'); assert.equal(h.tick(500), .001);
  close(h.state.battle.elapsed, .001, 'successful start after rejected action');
});

test('repeated retreat and restart cannot accumulate camp time as player actions or TU ticks', () => {
  const h = harness();
  for (let index = 0; index < 100; index++) {
    const startAt = index * 1000 + 249;
    h.at(startAt); h.dispatch('start'); h.tick(startAt + 1);
    close(h.state.battle.elapsed, .001, `expedition ${index + 1}`);
    h.at(startAt + 249); h.dispatch('retreat');
  }
  close(h.state.timing.tu, .1 * 100 / 1.05, '100 observed one-millisecond battle intervals');
  assert.equal(h.state.timing.turns, 0); assert.equal(h.state.timing.ticks, 0);
  assert.equal(h.resets, 200);
});

test('a start boundary does not change bounded-pump suspension or duplicate-tick safeguards', () => {
  const h = harness(); h.at(249); h.dispatch('start');
  assert.equal(h.tick(10249), 0); assert.equal(h.state.battle.elapsed, 0);
  assert.equal(h.tick(10499), .25); close(h.state.battle.elapsed, .25, 'resumed bounded processing');
  const before = structuredClone(h.state);
  assert.equal(h.tick(), 0); assert.deepEqual(h.state, before);
});

test('natural UI loop clears, earns loot, equips at camp and clears a separately timed replay across five seeds', () => {
  for (const seed of [1, 7, 42, 75, 100]) {
    const h = harness(createGame(seed)); let now = 249;
    const reachWin = expectedWins => {
      for (let ticks = 0; ticks < 2000 && h.state.wins < expectedWins && h.state.mode === 'battle'; ticks++) {
        now += 250; h.tick(now);
      }
      assert.equal(h.state.wins, expectedWins, `seed ${seed} completes expedition ${expectedWins}`);
      assert.equal(h.state._phase, 'intermission');
    };
    h.at(now); h.dispatch('start');
    assert.equal(h.tick(++now), .001); close(h.state.battle.elapsed, .001, 'first expedition start');
    reachWin(1);
    assert.ok(h.state.inventory.length > 0, `seed ${seed} earns natural loot`);
    const firstKills = h.state.kills, firstGold = h.state.hero.gold;
    assert.ok(firstKills > 0); assert.ok(firstGold > 0);

    now += 249; h.at(now); h.dispatch('retreat');
    assert.equal(h.state.mode, 'town'); assert.equal(h.resets, 2);
    const item = h.state.inventory.find(candidate => candidate.stats.attack > (h.state.equipment[candidate.slot].stats.attack || 0)) || h.state.inventory[0];
    const oldItemId = h.state.equipment[item.slot].id;
    h.dispatch('equip', item.id);
    assert.equal(h.state.equipment[item.slot].id, item.id);
    assert.ok(h.state.inventory.some(candidate => candidate.id === oldItemId), 'equipping retains the displaced item');
    assert.equal(h.resets, 2, 'camp equipment action does not create another clock boundary');

    const oldTU = h.state.timing.tu;
    now += 250; h.at(now); h.dispatch('start');
    const startAt = now;
    assert.equal(h.state.battle.elapsed, 0); assert.equal(h.state.timing.tu, oldTU);
    assert.equal(h.tick(++now), .001); close(h.state.battle.elapsed, .001, 'replay start excludes all prior camp time');
    close(h.state.timing.tu - oldTU, .001 * 100 / 1.05, 'only the new battle millisecond reaches TU');
    assert.equal(h.state.battle.actions.attacks, 0); assert.equal(h.resets, 3);
    reachWin(2);
    assert.ok(h.state.kills > firstKills); assert.ok(h.state.hero.gold > firstGold);
    assert.equal(h.state.equipment[item.slot].id, item.id, 'natural equipped loot remains equipped after replay');
    assert.ok(h.state.battle.elapsed <= (now - startAt) / 1000 + 1e-9, 'replay never receives more than observed post-start time');
  }
});
