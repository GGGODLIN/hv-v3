import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, act, advance, previewWeaponCommission} from '../src/engine.js';
import {scoreItem, resolveWeaponFamily, WEAPON_FAMILIES} from '../src/loot.js';

const clone = value => JSON.parse(JSON.stringify(value));
const KEYS = ['attack', 'defense', 'hp', 'crit', 'evade', 'block'];
const count = process.env.COMMISSION_SEEDS === undefined ? 5 : Number(process.env.COMMISSION_SEEDS);
assert.ok(Number.isInteger(count) && count >= 1 && count <= 100, 'COMMISSION_SEEDS must be 1..100');
const SEEDS = count === 5 ? [1, 7, 42, 73, 100] : Array.from({length:count}, (_, index) => index + 1);
const round = value => Number(value.toFixed(2));
const median = values => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return round(sorted.length % 2 ? sorted[middle] : (sorted[middle-1] + sorted[middle]) / 2);
};
const distribution = values => values.length ? {min:round(Math.min(...values)), median:median(values), max:round(Math.max(...values))} : null;

// Predeclared in COMMISSION-GUIDE.md before the first measurement: seeds 1..100,
// balanced, stage1 repeated max20, no sales, no injected items/gold/levels or
// enemy/combat edits. Camp equipment uses greatest flat score (first wins ties).
function equipEarned(s) {
  assert.equal(s.mode, 'town');
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const best = [s.equipment[slot], ...s.inventory.filter(item => item.slot === slot)]
      .reduce((best, item) => scoreItem(item) > scoreItem(best) ? item : best);
    if (best.id !== s.equipment[slot].id) act(s, 'equip', best.id);
  }
}

// Independent componentwise oracle, deliberately not score/quality/R/level or
// safe-sale eligibility. All six implemented positive stats participate.
function compare(offer, current) {
  if (!resolveWeaponFamily(current) || resolveWeaponFamily(offer) !== resolveWeaponFamily(current)) return 'different-family';
  const gains = KEYS.filter(key => (offer.stats[key] || 0) > (current.stats[key] || 0));
  const losses = KEYS.filter(key => (offer.stats[key] || 0) < (current.stats[key] || 0));
  return gains.length && losses.length ? 'tradeoff' : gains.length ? 'strict-upgrade' : losses.length ? 'earned-dominates' : 'equal';
}

// Accessors observe production writes only. In particular win increments before
// guaranteed clear loot, clear XP and full recovery. Kill XP/level-up healing is
// retained. The observation-equality regression below forbids changed state/RNG.
function expedition(s, captureTrace = false) {
  const initialWins = s.wins;
  act(s, 'start');
  assert.equal(s.mode, 'battle', 'natural policy has space to start');
  const hero = s.hero;
  let wins = s.wins, hp = hero.hp, mp = hero.mp, seed = s.seed;
  let minimumHp = hp, minimumMp = mp, beforeWin = null, rngCalls = 0;
  let incomingDamage = 0, incomingAttempts = 0, lastEvent = s._eventId;
  const trace = [];
  Object.defineProperty(s, 'wins', {enumerable:true, configurable:true,
    get:() => wins, set:value => {if (value > wins) beforeWin = {hp:hero.hp, mp:hero.mp}; wins = value;}});
  Object.defineProperty(hero, 'hp', {enumerable:true, configurable:true,
    get:() => hp, set:value => {hp = value; if (wins === initialWins) minimumHp = Math.min(minimumHp, value);}});
  Object.defineProperty(hero, 'mp', {enumerable:true, configurable:true,
    get:() => mp, set:value => {mp = value; if (wins === initialWins) minimumMp = Math.min(minimumMp, value);}});
  Object.defineProperty(s, 'seed', {enumerable:true, configurable:true,
    get:() => seed, set:value => {seed = value; rngCalls++;}});
  for (let step = 0; step < 6000 && s.mode === 'battle' && wins === initialWins; step++) {
    advance(s, .1);
    for (const event of s.events.filter(event => event.id > lastEvent)) {
      if (event.target === 'hero' && ['hit','miss','block'].includes(event.type)) {
        incomingDamage += event.value || 0; incomingAttempts++;
      }
      lastEvent = event.id;
    }
    if (captureTrace) trace.push({time:round(s.battle.elapsed), seed, attacks:s.battle.actions.attacks, rngCalls});
  }
  for (const [object, key, value] of [[s,'wins',wins],[s,'seed',seed],[hero,'hp',hp],[hero,'mp',mp]]) {
    Object.defineProperty(object, key, {value,enumerable:true,configurable:true,writable:true});
  }
  assert.ok(s.wins === initialWins + 1 || s.mode === 'defeat', 'production expedition terminates within 600 simulated seconds');
  return {win:s.wins === initialWins + 1, seconds:round(s.battle.elapsed),
    hpBeforeWin:beforeWin ? round(beforeWin.hp) : null, mpBeforeWin:beforeWin ? round(beforeWin.mp) : null,
    minimumHp:round(minimumHp), minimumMp:round(minimumMp), incomingDamage, incomingAttempts,
    actions:clone(s.battle.actions), finalSeed:seed, rngCalls, ...(captureTrace ? {trace} : {})};
}

function checkpoint(s, seconds, offer) {
  return {clears:s.wins, seconds:round(seconds), level:s.hero.level, family:offer.family,
    gold:s.hero.gold, price:offer.price, goldAfter:offer.goldAfter, spentPercent:round(100*offer.price/s.hero.gold),
    current:clone(s.equipment.weapon), offered:clone(offer.item)};
}

function paired(start, family, seconds) {
  const controlState = clone(start), boughtState = clone(start), untouched = clone(start);
  const offer = previewWeaponCommission(boughtState, family);
  assert.equal(offer.available, true);
  assert.deepEqual(boughtState, start, 'preview consumes no resource or RNG');
  act(boughtState, 'commissionWeapon', {family,quoteBasis:offer.quoteBasis});
  assert.equal(boughtState.hero.gold, start.hero.gold - offer.price);
  assert.equal(boughtState.inventory.length, start.inventory.length + 1);
  assert.deepEqual(boughtState.inventory.at(-1), offer.item, 'production delivers the previewed item');
  assert.equal(boughtState.inventory.at(-1).locked, true);
  assert.deepEqual(boughtState.equipment, start.equipment, 'purchase alone does not equip');
  assert.equal(boughtState.seed, start.seed, 'purchase consumes no RNG');
  act(boughtState, 'equip', offer.item.id);
  assert.deepEqual(boughtState.equipment.weapon, offer.item);
  assert.equal(boughtState.seed, controlState.seed, 'paired combat starts on the identical earned RNG state');
  assert.equal(boughtState.stage, controlState.stage);
  assert.equal(boughtState.hero.level, controlState.hero.level);
  assert.deepEqual(start, untouched, 'comparison never mutates the earned natural path');
  const before = expedition(controlState, true), after = expedition(boughtState, true);
  const index = before.trace.findIndex((entry, index) => after.trace[index] && entry.seed !== after.trace[index].seed);
  const divergence = index < 0 ? null : {time:before.trace[index].time,
    controlAttacks:before.trace[index].attacks, purchasedAttacks:after.trace[index].attacks,
    controlRngCalls:before.trace[index].rngCalls, purchasedRngCalls:after.trace[index].rngCalls};
  delete before.trace; delete after.trace;
  return {...checkpoint(start, seconds, offer), initialSeed:start.seed,
    comparison:compare(offer.item,start.equipment.weapon), before, after, divergence};
}

function natural(seed) {
  const s = createGame(seed);
  const result = {seed, clears:0, seconds:0, firstAffordable:null, firstSameFamilyAffordable:null,
    strict:null, tradeoff:null, earnedDominates:null, checkpointCategories:{}};
  for (let clear = 1; clear <= 20; clear++) {
    assert.equal(s.stage, 1); assert.equal(s.strategy, 'balanced');
    assert.equal(s.autoAdvance, false); assert.notEqual(s.autoSell, true);
    const fight = expedition(s);
    result.seconds += fight.seconds;
    if (!fight.win) break;
    result.clears++;
    act(s, 'retreat'); equipEarned(s);
    const beforePreview = clone(s);
    const offers = WEAPON_FAMILIES.map(family => previewWeaponCommission(s,family));
    assert.deepEqual(s, beforePreview);
    const any = offers.find(offer => offer.available);
    if (any && !result.firstAffordable) result.firstAffordable = checkpoint(s,result.seconds,any);
    const same = offers.find(offer => offer.family === resolveWeaponFamily(s.equipment.weapon));
    if (!same?.available) continue;
    if (!result.firstSameFamilyAffordable) result.firstSameFamilyAffordable = checkpoint(s,result.seconds,same);
    const comparison = compare(same.item,s.equipment.weapon);
    result.checkpointCategories[comparison] = (result.checkpointCategories[comparison] || 0) + 1;
    if (comparison === 'strict-upgrade' && !result.strict) result.strict = paired(s,same.family,result.seconds);
    if (comparison === 'tradeoff' && !result.tradeoff) result.tradeoff = paired(s,same.family,result.seconds);
    if (comparison === 'earned-dominates' && !result.earnedDominates) result.earnedDominates = checkpoint(s,result.seconds,same);
  }
  result.seconds = round(result.seconds);
  result.endState = clone(s);
  return result;
}

function pairSummary(pairs) {
  const selected = pairs.filter(Boolean);
  const better = key => selected.filter(pair => pair.after[key] > pair.before[key]).length;
  const same = key => selected.filter(pair => pair.after[key] === pair.before[key]).length;
  return {n:selected.length, faster:selected.filter(p => p.after.seconds < p.before.seconds).length,
    equalTime:same('seconds'), slower:selected.filter(p => p.after.seconds > p.before.seconds).length,
    fasterOrImprovedSurvival:selected.filter(p => p.after.win && (p.after.seconds < p.before.seconds
      || p.after.minimumHp > p.before.minimumHp || p.after.hpBeforeWin > p.before.hpBeforeWin)).length,
    controlWins:selected.filter(p=>p.before.win).length, purchasedWins:selected.filter(p=>p.after.win).length,
    improvedMinimumHp:better('minimumHp'), equalMinimumHp:same('minimumHp'),
    improvedHpBeforeWin:better('hpBeforeWin'), equalHpBeforeWin:same('hpBeforeWin'),
    higherMpBeforeWin:better('mpBeforeWin'), equalMpBeforeWin:same('mpBeforeWin'),
    divergedRng:selected.filter(p=>p.before.finalSeed!==p.after.finalSeed).length,
    clears:distribution(selected.map(p=>p.clears)), combatSeconds:distribution(selected.map(p=>p.seconds)),
    spend:distribution(selected.map(p=>p.price)), goldAfter:distribution(selected.map(p=>p.goldAfter)),
    spentPercent:distribution(selected.map(p=>p.spentPercent)),
    emptiedTreasury:selected.filter(p=>p.goldAfter===0).length,
    control:{seconds:median(selected.map(p=>p.before.seconds)), hpBeforeWin:median(selected.map(p=>p.before.hpBeforeWin)),
      minimumHp:median(selected.map(p=>p.before.minimumHp)), mpBeforeWin:median(selected.map(p=>p.before.mpBeforeWin)),
      manaSpent:median(selected.map(p=>p.before.actions.manaSpent)), incomingDamage:median(selected.map(p=>p.before.incomingDamage))},
    purchase:{seconds:median(selected.map(p=>p.after.seconds)), hpBeforeWin:median(selected.map(p=>p.after.hpBeforeWin)),
      minimumHp:median(selected.map(p=>p.after.minimumHp)), mpBeforeWin:median(selected.map(p=>p.after.mpBeforeWin)),
      manaSpent:median(selected.map(p=>p.after.actions.manaSpent)), incomingDamage:median(selected.map(p=>p.after.incomingDamage))}};
}

const runs = SEEDS.map(natural);

test('commission balance: observation preserves production combat and pre-win resources', () => {
  for (const seed of [1,42,100]) {
    const observed = createGame(seed), ordinary = createGame(seed);
    const metrics = expedition(observed);
    act(ordinary,'start');
    for (let step=0;step<6000 && ordinary.mode==='battle' && !ordinary.wins;step++) advance(ordinary,.1);
    assert.deepEqual(observed,ordinary,'instrumentation leaves every state field and RNG unchanged');
    assert.ok(metrics.hpBeforeWin < observed.hero.hp, 'HP is measured before full win recovery');
    assert.ok(metrics.mpBeforeWin < observed.hero.mp, 'MP is measured before full win recovery');
  }
});

test('commission balance: fixed natural policy reaches affordable same-family growth without injected resources', t => {
  assert.ok(runs.every(run=>run.clears===20),'unchanged default route completes all twenty natural clears');
  assert.ok(runs.every(run=>run.firstAffordable),'each sample reaches an affordable offer');
  const affordable = runs.map(run=>run.firstAffordable).filter(Boolean);
  const useful = runs.filter(run=>run.strict);
  t.diagnostic(JSON.stringify({kind:'natural-commission',seeds:SEEDS,n:runs.length,limitClears:20,
    affordable:affordable.length, firstAffordableClears:distribution(affordable.map(p=>p.clears)),
    firstAffordableCombatSeconds:distribution(affordable.map(p=>p.seconds)),
    sameFamilyAffordable:runs.filter(run=>run.firstSameFamilyAffordable).length,
    strictUpgradeSeeds:useful.length, tradeoffSeeds:runs.filter(run=>run.tradeoff).length,
    firstSameFamilyAffordableStrict:runs.filter(run=>run.firstSameFamilyAffordable
      && compare(run.firstSameFamilyAffordable.offered,run.firstSameFamilyAffordable.current)==='strict-upgrade').length,
    strongEarnedWeaponSeeds:runs.filter(run=>run.earnedDominates).length,
    strict:pairSummary(runs.map(run=>run.strict)), tradeoff:pairSummary(runs.map(run=>run.tradeoff))}));
  const witness = useful.find(run => run.strict.after.win &&
    (run.strict.after.seconds < run.strict.before.seconds || run.strict.after.minimumHp > run.strict.before.minimumHp
      || run.strict.after.hpBeforeWin > run.strict.before.hpBeforeWin));
  assert.ok(witness,'at least one naturally earned same-family strict upgrade improves clear speed or survival margin');
  assert.ok(witness.strict.goldAfter > 0,'reproducible useful purchase does not empty the treasury');
  assert.equal(compare(witness.strict.offered,witness.strict.current),'strict-upgrade');
  t.diagnostic(JSON.stringify({kind:'natural-strict-witness',seed:witness.seed,...witness.strict}));
  const stronger = runs.find(run=>run.earnedDominates);
  if (stronger) t.diagnostic(JSON.stringify({kind:'strong-earned-weapon',seed:stronger.seed,...stronger.earnedDominates}));
  const tradeoff = runs.find(run=>run.tradeoff);
  if (tradeoff) t.diagnostic(JSON.stringify({kind:'natural-tradeoff-example',seed:tradeoff.seed,...tradeoff.tradeoff}));
});

test('commission balance: predeclared fixed path and first-checkpoint treatment replay deterministically', () => {
  const repeated = natural(SEEDS[0]);
  assert.deepEqual(repeated,runs[0]);
});
