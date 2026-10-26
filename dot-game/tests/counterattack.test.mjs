import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,advance,stats,resolveAttack,resolveCounterAttack,counterattackView,COUNTERATTACK_RULES,expeditionReports,validateSave} from '../src/engine.js';
const copy=x=>structuredClone(x);
const enemy=(id='counter-target',extra={})=>({id,name:'反擊測試敵人',hp:100000,maxHp:100000,attack:0,defense:0,evade:0,parry:0,block:0,boss:false,...extra});
function sequence(values=[],fallback=.99){let n=0;return {rng:()=>values[n++]??fallback,get calls(){return n;}};}
function fixture(seed=1,{level=500,prof=600,family='axe',count=1,hp=100000,wave=1,attack=0}={}){
  const s=createGame(seed);s.hero.level=level;s.hero.proficiency=prof;
  for(const key of Object.keys(s.hero.attributes))s.hero.attributes[key]=10000;
  s.equipment.weapon.weaponFamily=family;s.equipment.armor.stats.block=1;
  act(s,'start');s.wave=wave;s.enemies=Array.from({length:count},(_,i)=>enemy(`counter-${i}`,{hp,maxHp:hp,attack}));
  s._clock=-100;s._enemyClock=1.9;return s;
}
function incoming(s){s._clock=-100;s._enemyClock=1.9;advance(s,.001);}
function player(s){s._clock=1.05;s._enemyClock=-100;advance(s,.001);}
const counters=s=>s.events.filter(e=>e.type==='counter');
function successful(options={},predicate=s=>counters(s).length>0){for(let seed=1;seed<1000;seed++){const s=fixture(seed,options);advance(s,.001);if(predicate(s))return s;}throw Error('no deterministic fixture seed');}

test('counter rule metadata and conditional probability are detached bounded views',()=>{
  assert.deepEqual(COUNTERATTACK_RULES,{baseChance:.25,attributeChance:.0002,proficiencyChance:.001,maxChance:.75});assert.ok(Object.isFrozen(COUNTERATTACK_RULES));
  const s=createGame(42),before=copy(s);assert.equal(counterattackView(s).eligible,false);assert.equal(counterattackView(s).chance,0);assert.deepEqual(s,before);
  s.equipment.weapon.weaponFamily='rapier';s.hero.proficiency=1;s.hero.attributes.str=8;s.hero.attributes.dex=12;
  assert.equal(counterattackView(s).chance,.255);assert.equal(counterattackView(s).effectiveProficiency,1);
  const view=counterattackView(s);view.chance=1;assert.equal(counterattackView(s).chance,.255);
  s.hero.proficiency=10000;assert.equal(counterattackView(s).effectiveProficiency,1.2);
  s.hero.attributes.str=1e6;assert.equal(counterattackView(s).chance,.75);
  assert.equal(counterattackView(null).eligible,false);
});
for(const [prof,limit] of [[0,1],[99.999,1],[100,2],[199.999,2],[200,3],[600,3]])test(`cap at effective proficiency ${prof} is ${limit}`,()=>{
  const s=fixture(1,{prof});assert.equal(counterattackView(s).maxPerTurn,limit);
  const found=successful({prof,count:30},s=>(s.battle.actions.counters||0)===limit);
  assert.equal(found.battle.actions.counters,limit);assert.equal(counterattackView(found).usedThisTurn,limit);assert.equal(counterattackView(found).remainingThisTurn,0);
  const before=found.battle.actions.counters;incoming(found);assert.equal(found.battle.actions.counters,before);
});
for(const family of ['axe','rapier','club'])test(`${family} uses counter damage without its weapon proc`,()=>{
  const s=successful({family});assert.equal(s.battle.actions.counters,1);assert.equal(s.battle.actions.attacks,0);assert.equal(s.hero.proficiency,600);assert.equal(s.hero.mp,stats(s).maxMp);
  for(const e of s.enemies){assert.equal(e.penetratedArmor,undefined);assert.equal(e.bleeding,undefined);assert.equal(e.stun,undefined);}
  assert.equal(counters(s)[0].effect,'counter');assert.equal(s.timing.turns,0);
});
for(const family of [null,'sword','Axe',undefined])test(`unrecognized family ${family} never counters`,()=>{
  const s=fixture(42,{family,count:30});s.equipment.weapon.weaponFamily=family;advance(s,.001);assert.equal(s.battle.actions.counters,undefined);assert.equal(counters(s).length,0);
});
test('tracking defensive gates does not alter default resolver shape or random consumption',()=>{
  const a=sequence([.9,.9,.1,.9,.2,.9,.9,.5]),b=sequence([.9,.9,.1,.9,.2,.9,.9,.5]);
  const defender={evade:0,parry:.2,block:.3,defense:0};
  const plain=resolveAttack({attack:100,crit:0},defender,a.rng),tracked=resolveAttack({attack:100,crit:0,trackDefense:true},defender,b.rng);
  assert.deepEqual(tracked.defenses,{parry:1,block:1});delete tracked.defenses;assert.deepEqual(tracked,plain);assert.equal(a.calls,b.calls);assert.equal(plain.damage,25);
});
for(const [name,values,defender,expected] of [
  ['full evade',[0,0],{evade:1,parry:1,block:1},{parry:0,block:0}],
  ['full parry',[.9,.9,0,0],{evade:0,parry:1,block:1},{parry:2,block:0}],
  ['full block',[.9,.9,.9,.9,0,0],{evade:0,parry:0,block:1},{parry:0,block:2}],
  ['evade-only glance',[0,.9,.9,.9,.9,.9],{evade:.5,parry:0,block:0},{parry:0,block:0}],
  ['combined partial evade/parry',[0,.9,0,.9,.9,.9],{evade:.5,parry:.5,block:0},{parry:1,block:0}],
])test(`tracked ${name} exposes only reached successful gates`,()=>{
  const r=resolveAttack({attack:100,trackDefense:true},{defense:0,...defender},sequence(values).rng);assert.deepEqual(r.defenses,expected);
});
test('counter is sheet damage with block/mitigation/die, never crit/evade/parry/proc',()=>{
  const d=enemy('pure',{evade:1,parry:1,block:0,mitigation:.2,specificMit:.5});const before=copy(d);
  const r=resolveCounterAttack({attack:100,crit:1,multiCrit:1,magical:true,void:true},d,0,sequence([.9,.9,.5]).rng);
  assert.equal(r.damage,40);assert.equal(r.crit,0);assert.equal(r.proc,undefined);assert.deepEqual(d,before);
  const block=resolveCounterAttack({attack:100,crit:1},enemy('blocked',{block:1}),0,()=>0);assert.equal(block.damage,0);assert.equal(block.outcome,'block');
});
test('existing PA improves counter mitigation without refreshing or adding stacks',()=>{
  const d=enemy('pa',{mitigation:.8,penetratedArmor:{stacks:2,expiresAtTick:7}}),before=copy(d);
  const r=resolveCounterAttack({attack:100},d,1,sequence([.9,.9,.5]).rng);assert.equal(r.damage,60);assert.deepEqual(d,before);
  const expired=resolveCounterAttack({attack:100},d,7,sequence([.9,.9,.5]).rng);assert.equal(expired.damage,20);assert.deepEqual(d,before);
});
test('zero-damage initiated counters consume budget and report count, not actual damage',()=>{
  let found;for(let seed=1;seed<100;seed++){const s=fixture(seed,{prof:0,count:4});s.enemies.forEach(e=>e.block=1);advance(s,.001);if(s.battle.actions.counters){found=s;break;}}
  assert.ok(found);assert.equal(found.battle.actions.counters,1);assert.equal(counterattackView(found).usedThisTurn,1);assert.equal(counters(found)[0].value,0);
  act(found,'retreat');const r=expeditionReports(found)[0];assert.equal(r.actions.counters,1);assert.equal(r.damage.counter,0);
});
test('counter kill rewards once and does not attack the replacement wave in the old batch',()=>{
  const s=successful({prof:600,hp:1,wave:1});assert.equal(s.kills,1);assert.equal(s.wave,2);assert.equal(counters(s).length,1);
  assert.ok(s.enemies.every(e=>e.hp===e.maxHp));assert.equal(s.events.filter(e=>e.target==='hero').length,1);
  const kills=s.kills;advance(s,0);assert.equal(s.kills,kills);
});
test('terminal counter victory settles once and records actual overkill-capped counter HP removal',()=>{
  const s=successful({prof:0,hp:1,wave:4});assert.equal(s.kills,1);assert.equal(s.wins,1);assert.equal(s._phase,'intermission');
  const r=expeditionReports(s)[0];assert.equal(r.outcome,'win');assert.equal(r.damage.counter,1);assert.equal(r.damage.basic,0);assert.equal(r.actions.counters,1);
  assert.equal(counterattackView(s).usedThisTurn,0);const before=s.wins;advance(s,0);assert.equal(s.wins,before);
});
test('fatal incoming damage never retaliates, even after a partial defensive check',()=>{
  let observed=false;for(let seed=1;seed<100;seed++){const s=fixture(seed,{attack:1e12,count:1});s.hero.hp=1;advance(s,.001);if(s.mode==='defeat'){observed=true;assert.equal(counters(s).length,0);assert.equal(s.battle.actions.counters,undefined);assert.equal(counterattackView(s).usedThisTurn,0);}}
  assert.ok(observed);
});
test('new player interval resets cap before recovery, recovery and ordinary strikes share it',()=>{
  const s=successful({prof:0,count:12});assert.equal(s.battle.actions.counters,1);
  for(const e of s.enemies)e.stunRecoveryPending=true;
  player(s);assert.equal(s.timing.turns,1);assert.ok(s.battle.actions.counters<=2);assert.equal(counterattackView(s).usedThisTurn,s.battle.actions.counters-1);
  const before=s.battle.actions.counters;incoming(s);assert.equal(s.battle.actions.counters,before); // recovery suppresses ordinary strikes in this turn
});
test('recovery counter killing old final enemy does not execute player attack on replacement wave',()=>{
  let found;for(let seed=1;seed<100;seed++){const s=fixture(seed,{prof:0,hp:1});s._enemyClock=-100;s.enemies[0].stunRecoveryPending=true;player(s);if(s.wave===2&&counters(s).length){found=s;break;}}
  assert.ok(found);assert.equal(found.battle.actions.attacks,0);assert.equal(found.timing.turns,0);assert.ok(found.enemies.every(e=>e.hp===e.maxHp));
});
test('counter budget does not serialize, reload/import clears it, retreat/start reset it',()=>{
  const s=successful({level:10,prof:0});assert.ok(counterattackView(s).usedThisTurn);
  const loaded=validateSave(JSON.parse(JSON.stringify(s)));assert.equal(loaded.mode,'town');assert.equal(counterattackView(loaded).usedThisTurn,0);assert.equal(loaded.battle.actions.counters,undefined);
  assert.ok(!Object.keys(s).some(k=>/counter/i.test(k)));act(s,'retreat');assert.equal(counterattackView(s).usedThisTurn,0);act(s,'start');assert.equal(counterattackView(s).usedThisTurn,0);assert.equal(s.battle.actions.counters,undefined);
});

test('terminal recovery preserves reserved upcoming turn budget across replacement waves',()=>{
  let found;
  for(let seed=1;seed<100;seed++){
    const s=fixture(seed,{prof:0,hp:1});s._enemyClock=-100;s.enemies[0].stunRecoveryPending=true;player(s);
    if(s.wave===2&&counters(s).length){found=s;break;}
  }
  assert.ok(found);assert.equal(found.timing.turns,0);assert.equal(counterattackView(found).usedThisTurn,1);
  // A different wave gets a recovery opportunity at the next due boundary,
  // but the reserved player interval has still not executed its actual action.
  for(const e of found.enemies){e.hp=100000;e.maxHp=100000;e.attack=0;e.stunRecoveryPending=true;}
  player(found);
  assert.equal(found.battle.actions.counters,1);assert.equal(found.timing.turns,1);
  assert.equal(counterattackView(found).usedThisTurn,1);assert.equal(counterattackView(found).remainingThisTurn,0);
  // Only reserving the following real player interval may now restore budget.
  for(const e of found.enemies){delete e.stunRecoveryPending;e.stun={expiresAtTick:found.timing.ticks+4};}
  player(found);assert.equal(found.timing.turns,2);assert.equal(counterattackView(found).usedThisTurn,0);
});
