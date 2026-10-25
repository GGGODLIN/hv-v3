import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import {
  classifySafeLootItem, dominanceWitness, hasUnknownSaleMetadata, itemSalePrice,
  generateItem, resolveWeaponFamily, scoreItem, QUALITY_TIERS,
} from '../src/loot.js';

const statKeys = ['attack', 'defense', 'hp', 'crit', 'evade', 'block'];
function freezeDeep(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freezeDeep); Object.freeze(value); }
  return value;
}
function item(overrides = {}) {
  return { id: 'candidate', name: '普通・逐風刺劍', slot: 'weapon', weaponFamily: 'rapier', quality: 'Average',
    level: 3, power: 100, stats: { attack: 30, crit: .02 }, locked: false, ...overrides };
}
const keeper = overrides => item({ id: 'keeper', stats: { attack: 31, crit: .02 }, ...overrides });
function seeded(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; }; }

test('safe loot: strict componentwise dominance returns detached evidence without mutations', () => {
  const candidate = freezeDeep(item()), kept = freezeDeep(keeper());
  const keepers = Object.freeze([kept]), before = JSON.stringify({candidate, keepers});
  const witness = dominanceWitness(candidate, keepers);
  assert.deepEqual(witness, {keeperId:'keeper', strictlyBetterKeys:['attack']});
  witness.keeperId = 'changed'; witness.strictlyBetterKeys.push('hp');
  assert.deepEqual(dominanceWitness(candidate, keepers), {keeperId:'keeper', strictlyBetterKeys:['attack']});
  assert.equal(JSON.stringify({candidate, keepers}), before);
});

test('safe loot: all six implemented stats participate; omitted stats are zero', () => {
  const baseline = {attack:10, defense:2, hp:5, crit:.01, evade:.01, block:.01};
  for (const key of statKeys) {
    const improved = {...baseline, [key]:baseline[key] + (['crit','evade','block'].includes(key) ? .01 : 1)};
    assert.deepEqual(dominanceWitness(item({stats:baseline}), [keeper({stats:improved})]),
      {keeperId:'keeper', strictlyBetterKeys:[key]}, key);
    assert.equal(dominanceWitness(item({stats:improved}), [keeper({stats:baseline})]), null, `${key} tradeoff retains`);
  }
  assert.deepEqual(dominanceWitness(item({stats:{attack:10}}), [keeper({stats:baseline})]),
    {keeperId:'keeper', strictlyBetterKeys:['defense','hp','crit','evade','block']});
  assert.equal(dominanceWitness(item({stats:{attack:10, hp:1}}), [keeper({stats:{attack:100}})]), null);
  assert.equal(dominanceWitness(item({stats:{attack:10, hp:0}}), [keeper({stats:{attack:10}})]), null);
});

test('safe loot: ties and incomparable builds never use score, level, quality, or rolls as dominance', () => {
  const candidate = item({power:1, level:1}), equal = keeper({stats:{...candidate.stats}, power:999999, level:1000});
  assert.equal(dominanceWitness(candidate, [equal]), null);
  const tradeoff = keeper({stats:{attack:1000, crit:.019}, power:999999, level:1000});
  assert.ok(scoreItem(tradeoff) > scoreItem(candidate));
  assert.equal(dominanceWitness(candidate, [tradeoff]), null);
  const lowRank = keeper({name:'粗製・逐風刺劍', quality:'Crude', stats:{attack:31, crit:.02}, power:1, level:1});
  assert.deepEqual(dominanceWitness(item({level:1000, power:999999}), [lowRank]),
    {keeperId:'keeper', strictlyBetterKeys:['attack']});
});

test('safe loot: only explicitly unlocked Crude/Fair/Average candidates qualify', () => {
  for (const [index, tier] of QUALITY_TIERS.entries()) {
    const prefix = index >= 6 ? '銳意' : '', suffix = index >= 3 ? '・屠戮' : '';
    const candidate = item({name:`${tier.label}・${prefix}逐風刺劍${suffix}`, quality:tier.name});
    assert.equal(Boolean(dominanceWitness(candidate, [keeper()])), index < 3, tier.name);
  }
  for (const locked of [true, undefined, null, 0, 1, 'false', [], {}]) {
    assert.equal(dominanceWitness(item({locked}), [keeper()]), null);
  }
  const missing = item(); delete missing.locked;
  assert.equal(dominanceWitness(missing, [keeper()]), null);
  for (const quality of ['', 'average', 'Future', null, undefined, [], 3]) {
    assert.equal(dominanceWitness(item({quality}), [keeper()]), null);
    assert.equal(dominanceWitness(item(), [keeper({quality})]), null);
  }
});

test('safe loot: caller-protected keepers may be equipped unlocked or explicitly locked', () => {
  for (const locked of [true, false]) {
    assert.deepEqual(dominanceWitness(item(), [keeper({locked})]), {keeperId:'keeper', strictlyBetterKeys:['attack']});
  }
  assert.equal(dominanceWitness(item(), []), null);
  assert.equal(dominanceWitness(item(), [null, {}, item({id:'unusable', name:'未知裝備'})]), null);
  assert.deepEqual(dominanceWitness(item(), [null, {}, keeper()]), {keeperId:'keeper', strictlyBetterKeys:['attack']});
});

test('safe loot: any matching keeper ID protects the candidate before searching for another witness', () => {
  const candidate = item(), better = keeper();
  for (const self of [candidate, {...candidate}, {id:candidate.id}, {id:candidate.id, stats:null}]) {
    for (const keepers of [[self, better], [better, self]]) assert.equal(dominanceWitness(candidate, keepers), null);
  }
  assert.equal(dominanceWitness(candidate, [keeper({id:candidate.id})]), null);
});

test('safe loot: recognized exact base identity preserves every distinct weapon, armor, and accessory base', () => {
  const bases = [
    ['weapon','暮鋼戰斧','axe'], ['weapon','逐風刺劍','rapier'], ['weapon','裂岩戰棍','club'],
    ['armor','鐵衛胸甲',null], ['armor','巡獵皮甲',null], ['armor','餘燼護衣',null],
    ['accessory','赤晶指環',null], ['accessory','守望墜飾',null], ['accessory','輕羽符印',null],
  ];
  const make = ([slot, base, family], id, attack) => {
    const result = item({id, slot, name:`普通・${base}`, stats:{attack}});
    if (family) result.weaponFamily = family; else delete result.weaponFamily;
    return result;
  };
  for (const a of bases) for (const b of bases) {
    const candidate = make(a,'candidate',1), kept = make(b,'keeper',2);
    assert.equal(Boolean(dominanceWitness(candidate, [kept])), a === b, `${a[1]} vs ${b[1]}`);
    if (a === b) assert.equal(classifySafeLootItem(candidate).base, a[1]);
  }
});

test('safe loot: all current generated items and legacy optional diagnostics are classifiable', () => {
  const rng = seeded(629), families = new Set(), bases = new Set(), qualities = new Set();
  for (let i=0; i<6000; i++) {
    const generated = generateItem(rng, 1+i%1000), before = JSON.stringify(generated);
    const identity = classifySafeLootItem(generated);
    assert.ok(identity, generated.name); assert.equal(hasUnknownSaleMetadata(generated), false);
    bases.add(identity.base); qualities.add(identity.quality);
    const legacy = {...generated}; delete legacy.weaponFamily; delete legacy.rolls; delete legacy.prefix; delete legacy.suffix;
    assert.deepEqual(classifySafeLootItem(legacy), identity);
    if (generated.slot === 'weapon') families.add(identity.weaponFamily);
    assert.equal(JSON.stringify(generated), before);
  }
  assert.equal(bases.size, 9); assert.equal(families.size, 3); assert.equal(qualities.size, 8);
});

test('safe loot: quality-specific name grammar, affix legality and metadata consistency are exact', () => {
  for (const name of [
    '逐風刺劍', '普通・逐風刺劍 ', ' 普通・逐風刺劍', '普通・逐風刺劍\n',
    '普通・逐風刺劍的仿製品', '普通・未知逐風刺劍', '普通·逐風刺劍', '普通・逐風刺劍・追風',
    '普通・逐風刺劍・平衡・屠戮', '粗製・銳意逐風刺劍', '粗製・逐風刺劍・屠戮',
    '優良・逐風刺劍', '傳奇・逐風刺劍・平衡', '普通・暮鋼戰斧・平衡',
  ]) assert.equal(classifySafeLootItem(item({name})), null, name);
  for (const changes of [
    {name:'粗製・逐風刺劍'}, {prefix:'未知'}, {suffix:'平衡'}, {prefix:null}, {suffix:undefined},
    {slot:'armor'}, {weaponFamily:'axe'}, {weaponFamily:'future'}, {weaponFamily:null}, {weaponFamily:undefined},
  ]) {
    assert.equal(classifySafeLootItem(item(changes)), null);
    assert.equal(dominanceWitness(item(changes), [keeper()]), null);
    assert.equal(dominanceWitness(item(), [keeper(changes)]), null);
  }
  const mismatch = item({weaponFamily:'axe'});
  assert.equal(resolveWeaponFamily(mismatch), 'axe', 'combat identity semantics deliberately remain authoritative');
  assert.equal(classifySafeLootItem(mismatch), null, 'safe sale requires name/family agreement too');
  assert.equal(classifySafeLootItem(item({name:'普通・鐵衛胸甲・破陣', slot:'armor', weaponFamily:undefined})), null);
});

test('safe loot: every unknown top-level, stat, or roll metadata key fails closed on both sides', () => {
  for (const update of [
    value => {value.futureProc={chance:.2};}, value => {value.base='other';},
    value => {value.stats.accuracy=.1;}, value => {value.stats.burden=5;},
    value => {value.rolls={attack:80, future:90};}, value => {value[Symbol('future')]=true;},
    value => {Object.defineProperty(value, 'future', {value:true});},
    value => {value.stats[Symbol('future')]=1;},
    value => {Object.defineProperty(value.stats, 'future', {value:1});},
  ]) {
    const candidate = item(), kept = keeper(); update(candidate); update(kept);
    assert.equal(hasUnknownSaleMetadata(candidate), true);
    assert.equal(hasUnknownSaleMetadata(kept), true);
    assert.equal(classifySafeLootItem(candidate), null);
    assert.equal(dominanceWitness(candidate, [keeper()]), null);
    assert.equal(dominanceWitness(item(), [kept]), null);
  }
  assert.equal(hasUnknownSaleMetadata(item({name:'玩家自訂名稱', quality:'Future', locked:true})), false,
    'unknown-key detector is deliberately separate from identity, quality, and lock eligibility');
});

test('safe loot: import detector rejects ambiguous supplied metadata before sanitizers erase it', () => {
  const unsupported = [
    {slot:'armor', name:'普通・鐵衛胸甲'}, {slot:'accessory', name:'普通・赤晶指環'},
    {prefix:null}, {prefix:undefined}, {suffix:3}, {suffix:[]},
    {stats:null}, {stats:undefined}, {stats:[]}, {stats:{attack:undefined}},
    {stats:{attack:NaN}}, {stats:{attack:Infinity}}, {stats:{attack:-1}}, {stats:{crit:1.01}},
    {rolls:null}, {rolls:undefined}, {rolls:[]}, {rolls:{attack:undefined}},
    {rolls:{attack:NaN}}, {rolls:{attack:Infinity}}, {rolls:{attack:-1}}, {rolls:{attack:201}},
    {rolls:{attack:1.5}}, {rolls:{hp:80}},
  ];
  for (const changes of unsupported) assert.equal(hasUnknownSaleMetadata(item(changes)), true, JSON.stringify(changes));
  for (const weaponFamily of [null, undefined, 'future', '', {}, [], 2, false]) {
    assert.equal(hasUnknownSaleMetadata(item({weaponFamily})), false, 'weapon unknown-family sentinel remains loadable');
    assert.equal(classifySafeLootItem(item({weaponFamily})), null);
  }
  const legacy = item(); delete legacy.weaponFamily;
  assert.equal(hasUnknownSaleMetadata(legacy), false);
  assert.ok(classifySafeLootItem(legacy));
  const noOptional = {id:'legacy', name:'粗製・巡獵皮甲', slot:'armor', quality:'Crude',
    level:1, power:10, stats:{defense:5}, locked:false};
  assert.equal(hasUnknownSaleMetadata(noOptional), false);
  assert.ok(classifySafeLootItem(noOptional));
});

test('safe loot: supplied scalar shapes cannot become eligible through sanitizer defaults', () => {
  for (const key of ['name','description','rarityColor','prefix','suffix']) {
    for (const value of [undefined, null, 0, false, {}, []]) assert.equal(hasUnknownSaleMetadata(item({[key]:value})), true, key);
  }
  for (const key of ['level','power','roll']) {
    for (const value of [undefined, null, '1', false, NaN, Infinity, -Infinity, {}, []]) {
      assert.equal(hasUnknownSaleMetadata(item({[key]:value})), true, `${key}: ${String(value)}`);
    }
  }
  for (const locked of [undefined, null, 0, 1, 'true', {}, []]) assert.equal(hasUnknownSaleMetadata(item({locked})), true);
  for (const changes of [{level:1.5}, {level:-1}, {level:1001}, {power:-1}, {power:1000001}, {roll:-1}, {roll:500}]) {
    assert.equal(hasUnknownSaleMetadata(item(changes)), false, 'established finite scalar normalization remains an engine concern');
  }
  const legacy = item();
  for (const key of ['roll','rolls','prefix','suffix','description','rarityColor','weaponFamily']) delete legacy[key];
  assert.equal(hasUnknownSaleMetadata(legacy), false);
  assert.ok(classifySafeLootItem(legacy));
});

test('safe loot: malformed/nonfinite/negative stats fail closed instead of becoming zero', () => {
  for (const value of [NaN, Infinity, -Infinity, -1, '30', true, false, null, undefined, [], {}, () => 1]) {
    for (const key of statKeys) {
      const candidate = item({stats:{attack:30, crit:.02, [key]:value}});
      const kept = keeper({stats:{attack:31, crit:.02, [key]:value}});
      assert.equal(dominanceWitness(candidate, [keeper()]), null, `${key}: ${String(value)}`);
      assert.equal(dominanceWitness(item(), [kept]), null, `keeper ${key}: ${String(value)}`);
    }
  }
  for (const stats of [undefined, null, [], [30], '', 3, false, {}, {attack:1000001}, {crit:1.01}, {evade:1.01}, {block:1.01}]) {
    assert.equal(classifySafeLootItem(item({stats})), null);
    assert.equal(classifySafeLootItem(keeper({stats})), null);
  }
  for (const key of statKeys) {
    const candidate = item({stats:{[key]:0}});
    assert.ok(classifySafeLootItem(candidate), 'explicit finite zero is permitted');
  }
});

test('safe loot: malformed diagnostic/required metadata cannot authorize disposal', () => {
  for (const changes of [
    {id:''}, {id:3}, {id:'x'.repeat(101)}, {level:0}, {level:1001}, {level:1.5}, {level:'3'}, {level:NaN},
    {power:NaN}, {power:Infinity}, {power:-1}, {power:1000001}, {power:'3'},
    {roll:NaN}, {roll:Infinity}, {roll:-1}, {roll:201}, {roll:1.5}, {roll:'1'},
    {rolls:null}, {rolls:[]}, {rolls:{attack:NaN}}, {rolls:{attack:201}}, {rolls:{hp:40}},
    {rarityColor:'red'}, {rarityColor:null}, {description:3}, {description:'x'.repeat(241)},
  ]) {
    assert.equal(classifySafeLootItem(item(changes)), null, JSON.stringify(changes));
    assert.equal(dominanceWitness(item(changes), [keeper()]), null);
    assert.equal(dominanceWitness(item(), [keeper(changes)]), null);
  }
  for (const key of ['id','name','slot','quality','level','power','stats','locked']) {
    const candidate = item(); delete candidate[key]; assert.equal(classifySafeLootItem(candidate), null, key);
  }
});

test('safe loot: untrusted prototypes, accessors and malformed arguments are inert', () => {
  const candidate = item(), kept = keeper();
  for (const value of [null, undefined, false, 1, NaN, 'item', [], () => candidate]) {
    assert.equal(classifySafeLootItem(value), null); assert.equal(hasUnknownSaleMetadata(value), true);
    assert.equal(dominanceWitness(value, [kept]), null);
  }
  for (const keepers of [null, undefined, {}, 'keeper', 1, true]) assert.equal(dominanceWitness(candidate, keepers), null);
  const inherited = Object.assign(Object.create({futureProc:true}), candidate);
  const inheritedStats = item({stats:Object.assign(Object.create({hp:100}), candidate.stats)});
  for (const malformed of [inherited, inheritedStats]) {
    assert.equal(classifySafeLootItem(malformed), null); assert.equal(hasUnknownSaleMetadata(malformed), true);
  }
  let calls = 0;
  const accessor = item(); Object.defineProperty(accessor, 'power', {get(){calls++; throw Error('must not run');}, enumerable:true});
  const accessorStats = item(); Object.defineProperty(accessorStats.stats, 'attack', {get(){calls++; throw Error('must not run');}, enumerable:true});
  const accessorKeeper = keeper(); Object.defineProperty(accessorKeeper, 'id', {get(){calls++; throw Error('must not run');}, enumerable:true});
  assert.equal(dominanceWitness(accessor, [kept]), null); assert.equal(dominanceWitness(accessorStats, [kept]), null);
  assert.equal(dominanceWitness(candidate, [accessorKeeper]), null); assert.equal(calls, 0);
  const throwing = new Proxy({}, {getPrototypeOf(){throw Error('uninspectable');}});
  assert.equal(classifySafeLootItem(throwing), null); assert.equal(hasUnknownSaleMetadata(throwing), true);
  const nullPrototype = Object.assign(Object.create(null), item());
  nullPrototype.stats = Object.assign(Object.create(null), nullPrototype.stats);
  assert.ok(classifySafeLootItem(nullPrototype));
});

test('safe loot: genuine cross-realm JSON records remain supported without admitting inherited metadata', () => {
  const otherRealm = runInNewContext('JSON.parse(input)', {input:JSON.stringify({candidate:item(), keeper:keeper()})});
  assert.notEqual(Object.getPrototypeOf(otherRealm.candidate), Object.prototype);
  assert.equal(hasUnknownSaleMetadata(otherRealm.candidate), false);
  assert.equal(hasUnknownSaleMetadata(otherRealm.keeper), false);
  assert.ok(classifySafeLootItem(otherRealm.candidate));
  assert.deepEqual(dominanceWitness(otherRealm.candidate, [otherRealm.keeper]), {keeperId:'keeper', strictlyBetterKeys:['attack']});
  const fakePrototype = Object.assign(Object.create(null), {constructor:Object, futureProc:1});
  const inherited = Object.assign(Object.create(fakePrototype), item());
  assert.equal(hasUnknownSaleMetadata(inherited), true);
  assert.equal(classifySafeLootItem(inherited), null);
  const pollutedRealm = runInNewContext('Object.prototype.futureProc=1; JSON.parse(input)', {input:JSON.stringify(item())});
  assert.equal(hasUnknownSaleMetadata(pollutedRealm), true);
  assert.equal(classifySafeLootItem(pollutedRealm), null);
});

test('safe loot: existing sale price is independent of witness, stats, family, and quality', () => {
  for (const level of [1,3,100,1000]) for (const power of [0,1,12.5,1000000]) {
    assert.equal(itemSalePrice(item({level,power})), Math.max(1,Math.round(level*3+power)));
  }
  const candidate = item();
  assert.equal(itemSalePrice(candidate), 109);
  assert.equal(itemSalePrice({...candidate, stats:{attack:9999}, quality:'Peerless', weaponFamily:'axe'}), 109);
  for (const value of [null, undefined, {}, {level:NaN,power:3}, {level:3,power:Infinity}, {level:'3',power:1}]) {
    assert.equal(itemSalePrice(value), 0);
  }
});
