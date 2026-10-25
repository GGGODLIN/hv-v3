import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, act, advance, stats} from '../src/engine.js';
import {generateItem, scoreItem} from '../src/loot.js';

const clone = value => JSON.parse(JSON.stringify(value));
const SEEDS = Array.from({length:100}, (_, index) => index + 1);
const median = values => {
  const sorted = [...values].sort((a, b) => a - b), middle = sorted.length / 2;
  return sorted.length % 2 ? sorted[Math.floor(middle)] : (sorted[middle-1] + sorted[middle]) / 2;
};
const rounded = value => Number(value.toFixed(2));

// Fixed, intentionally simple player policy: balanced tactics, one clear per
// stage, then camp and equip each slot's highest flat score. No rerolls, farming,
// manual potions, future-loot knowledge or family preference. Score omits procs.
function equipEarned(s) {
  assert.equal(s.mode, 'town');
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const best = [s.equipment[slot], ...s.inventory.filter(item => item.slot === slot)]
      .reduce((best, item) => scoreItem(item) > scoreItem(best) ? item : best);
    if (best.id !== s.equipment[slot].id) act(s, 'equip', best.id);
  }
}

// Test-only v0.4 defensive counterfactual. Use the real current scheduler,
// generated waves, attack/HP/rewards and loot. Replace ONLY the three fields
// changed by roles, before every substep (including each newly spawned wave).
function oldDefense(s) {
  for (const enemy of s.enemies) {
    enemy.defense = rounded(3 + s.stage * 1.3 + (enemy.boss ? 3 : 0));
    enemy.evade = .025;
    enemy.parry = .02;
  }
}

// The ordinary win path immediately restores HP/MP. Observe the entry to win
// instead: after the boss's kill/XP, BEFORE clear rewards/XP and full recovery.
// Accessors observe writes only; all production values and RNG draws are intact.
function expedition(s, {legacy = false} = {}) {
  act(s, 'start');
  assert.equal(s.mode, 'battle');
  const initialWins = s.wins, hero = s.hero;
  let wins = s.wins, hp = hero.hp, mp = hero.mp;
  let minimumHp = hp, minimumMp = mp, beforeWin = null;
  let incomingDamage = 0, incomingAttempts = 0, procs = 0, recoveries = 0;
  let lastEvent = s._eventId;
  Object.defineProperty(s, 'wins', {enumerable:true, configurable:true,
    get:() => wins, set:value => {
      if (value > wins) beforeWin = {hp:hero.hp, mp:hero.mp};
      wins = value;
    }});
  Object.defineProperty(hero, 'hp', {enumerable:true, configurable:true,
    get:() => hp, set:value => {
      hp = value;
      if (wins === initialWins) minimumHp = Math.min(minimumHp, value);
    }});
  Object.defineProperty(hero, 'mp', {enumerable:true, configurable:true,
    get:() => mp, set:value => {
      mp = value;
      if (wins === initialWins) minimumMp = Math.min(minimumMp, value);
    }});
  for (let step = 0; step < 6000 && s.mode === 'battle' && wins === initialWins; step++) {
    if (legacy) oldDefense(s);
    advance(s, .1);
    for (const event of s.events.filter(event => event.id > lastEvent)) {
      if (event.target === 'hero' && ['hit', 'miss', 'block'].includes(event.type)) {
        incomingDamage += event.value || 0;
        incomingAttempts++;
      }
      if (event.type === 'proc') procs++;
      if (event.type === 'recovery') recoveries++;
      lastEvent = event.id;
    }
  }
  for (const [object, key, value] of [[s,'wins',wins],[hero,'hp',hp],[hero,'mp',mp]]) {
    Object.defineProperty(object,key,{value,enumerable:true,configurable:true,writable:true});
  }
  assert.ok(s.wins === initialWins + 1 || s.mode === 'defeat', 'expedition terminates within 600 simulated seconds');
  return {win:s.wins === initialWins + 1, time:rounded(s.battle.elapsed),
    hpBeforeWin:beforeWin?.hp ?? 0, mpBeforeWin:beforeWin?.mp ?? hero.mp,
    minimumHp, minimumMp, incomingDamage, incomingAttempts, procs, recoveries,
    actions:clone(s.battle.actions), finalSeed:s.seed};
}

function natural(seed, legacy = false) {
  const s = createGame(seed), results = [], starts = [], ends = [];
  for (let stage = 1; stage <= 5; stage++) {
    equipEarned(s);
    act(s, 'selectStage', stage);
    assert.equal(s.stage, stage, 'stage is naturally unlocked; no injected levels or items');
    starts.push(clone(s));
    const result = expedition(s, {legacy});
    results.push(result);
    ends.push(clone(s));
    if (!result.win) break;
    act(s, 'retreat');
  }
  return {results, starts, ends};
}

function summary(runs) {
  const wins = runs.filter(run => run.win);
  return {wins:wins.length, n:runs.length, medianSeconds:rounded(median(wins.map(run => run.time))),
    medianHpBeforeWin:rounded(median(wins.map(run => run.hpBeforeWin))),
    medianMinimumHp:rounded(median(runs.map(run => run.minimumHp))),
    lowestHp:rounded(Math.min(...runs.map(run => run.minimumHp))),
    medianMpBeforeWin:rounded(median(wins.map(run => run.mpBeforeWin))),
    medianManaSpent:rounded(median(runs.map(run => run.actions.manaSpent)))};
}

const naturalOld = SEEDS.map(seed => natural(seed, true));
const naturalCurrent = SEEDS.map(seed => natural(seed));

test('v0.5 balance instrumentation observes pre-recovery resources without changing the run', () => {
  for (const seed of [1,42,100]) {
    const observed = createGame(seed), ordinary = createGame(seed);
    const result = expedition(observed);
    act(ordinary, 'start');
    for (let step=0; step<6000 && ordinary.mode==='battle' && !ordinary.wins; step++) advance(ordinary,.1);
    assert.deepEqual(observed, ordinary, 'observation changes neither production state nor RNG');
    assert.ok(result.hpBeforeWin < observed.hero.hp, 'reported HP is not the fully restored post-win value');
    assert.ok(result.mpBeforeWin < observed.hero.mp, 'reported MP is not the fully restored post-win value');
    assert.deepEqual(natural(seed), naturalCurrent[seed-1], 'fixed policy deterministically replays the whole route');
  }
});

test('v0.5 balance: fresh-game stages 1–2 are exactly unchanged with earned camp equipment', () => {
  for (let index = 0; index < SEEDS.length; index++) {
    for (let stage = 0; stage < 2; stage++) {
      assert.equal(naturalCurrent[index].results[stage]?.win, true, `seed ${SEEDS[index]} stage ${stage+1}`);
      assert.deepEqual(naturalCurrent[index].ends[stage], naturalOld[index].ends[stage]);
    }
  }
});

test('v0.5 balance: fixed natural progression has no early cliff and at most 25 percent median slowdown', t => {
  for (let stage = 0; stage < 5; stage++) {
    const oldRuns = naturalOld.map(run => run.results[stage]).filter(Boolean);
    const currentRuns = naturalCurrent.map(run => run.results[stage]).filter(Boolean);
    const previous = summary(oldRuns), current = summary(currentRuns);
    t.diagnostic(JSON.stringify({kind:'natural', stage:stage+1, previous, current}));
    assert.equal(previous.wins, SEEDS.length, 'counterfactual policy reaches and wins every stage');
    assert.equal(current.wins, SEEDS.length, 'unchanged policy reaches and wins every stage');
    assert.ok(current.medianSeconds <= previous.medianSeconds * 1.25, `stage ${stage+1} median clear time`);
    assert.ok(currentRuns.every(run => run.minimumHp > 0));
  }
});

test('v0.5 balance: paired stages 3–5 isolate roles at identical naturally earned stage starts', t => {
  for (let stage = 3; stage <= 5; stage++) {
    const previous = [], current = [];
    for (const run of naturalOld) {
      previous.push(expedition(clone(run.starts[stage-1]), {legacy:true}));
      current.push(expedition(clone(run.starts[stage-1])));
    }
    const before = summary(previous), after = summary(current);
    t.diagnostic(JSON.stringify({kind:'paired-role', stage, previous:before, current:after}));
    assert.equal(before.wins, SEEDS.length);
    assert.equal(after.wins, SEEDS.length);
    assert.ok(after.medianSeconds <= before.medianSeconds * 1.25);
    assert.ok(current.some((run,index) => run.finalSeed !== previous[index].finalSeed), 'role outcomes legitimately diverge later RNG draws');
  }
});

// Real generator, not a renamed axe: level/quality/affix/R are matched and only
// the base-family selection differs. Superior, no prefix, Slaughter, R110 for
// every present stat. These are a reproducible bench, NOT naturally earned loot.
function matchedWeapon(family, level) {
  const families = ['axe','rapier','club'];
  const draws = [(families.indexOf(family)+.5)/3, .5, .99, 0];
  let index = 0;
  const item = generateItem(() => draws[index++] ?? .5, level, 'weapon');
  assert.equal(item.weaponFamily, family);
  assert.equal(item.quality, 'Superior');
  assert.equal(item.prefix, '');
  assert.equal(item.suffix, '屠戮');
  assert.ok(Object.values(item.rolls).every(roll => roll === 110));
  return item;
}

function withWeapon(start, item, proc = true) {
  const s = clone(start), weapon = clone(item);
  weapon.id = 'bench-weapon';
  if (!proc) weapon.weaponFamily = null;
  s.inventory.push(weapon);
  act(s, 'equip', weapon.id);
  return s;
}

test('v0.5 build evidence: generated stats and same-stat proc treatments remain distinct', t => {
  for (const stage of [3,4,5]) {
    const comparisons = {};
    for (const family of ['axe','rapier','club']) {
      const weapon = matchedWeapon(family, stage+2), on = [], off = [];
      for (const run of naturalOld) {
        const active = withWeapon(run.starts[stage-1], weapon);
        const inactive = withWeapon(run.starts[stage-1], weapon, false);
        assert.deepEqual(stats(active), stats(inactive), 'proc treatment alone changes no sheet stat');
        on.push(expedition(active));
        off.push(expedition(inactive));
      }
      t.diagnostic(JSON.stringify({kind:'generated-weapon',stage,family,itemStats:weapon.stats,procOn:summary(on),procOff:summary(off)}));
      comparisons[family] = {weapon, on:summary(on), off:summary(off)};
      assert.ok(on.every(run => run.win) && off.every(run => run.win));
      // v0.8 implements axe bleed; the same-stat OFF control still has null
      // family. Every implemented family must now exercise its real proc.
      assert.ok(on.some(run => run.procs > 0), 'real encounters exercise the implemented proc');
    }
    const {axe,rapier,club} = comparisons;
    assert.ok(axe.weapon.stats.attack > club.weapon.stats.attack && club.weapon.stats.attack > rapier.weapon.stats.attack,
      'genuine generated attack endpoints differ; family toggles are not a weapon comparison');
    assert.ok(club.on.medianHpBeforeWin > club.off.medianHpBeforeWin, 'club control improves aggregate survival margin, not a guaranteed per-seed improvement');
    assert.ok(axe.on.medianSeconds <= club.on.medianSeconds && axe.on.medianSeconds < rapier.on.medianSeconds,
      'these early short routes retain value for higher attack; this is not a universal ranking');
    if (stage === 5) assert.ok(rapier.on.medianSeconds < rapier.off.medianSeconds,
      'PA benefits the same-stat rapier in the thicker stage-five route without claiming it beats the axe');
  }
});
