import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,advance,act,stats,validateSave,STRATEGIES} from '../src/engine.js';

function encounter(strategy,{hp=3000,attack=60,seed=42}={}) {
  const s=createGame(seed);
  act(s,'setStrategy',strategy);act(s,'start');
  s.wave=4;
  s.enemies=[{id:'probe',name:'Controlled test encounter',hp,maxHp:hp,attack,defense:5,boss:true,evade:0,parry:0,block:0}];
  return s;
}
function finish(s) {
  for(let i=0;i<30000&&s.mode==='battle'&&!s.wins;i++)advance(s,.1);
  assert.ok(s.mode==='defeat'||s.wins===1,'encounter must terminate');
  return s;
}
function turns(s,n) {
  while(s._turns<n&&s.mode==='battle')advance(s,.1);
  return s;
}

test('three immutable documented policies, balanced default, no free sheet changes',()=>{
  assert.deepEqual(STRATEGIES.map(s=>s.id),['balanced','assault','sustain']);
  const s=createGame(42),base=stats(s);
  assert.equal(s.strategy,'balanced');
  for(const strategy of STRATEGIES){
    assert.ok(strategy.label&&strategy.description);
    assert.equal(Object.isFrozen(strategy),true);
    act(s,'setStrategy',strategy.id);
    assert.deepEqual(stats(s),base);
  }
});

test('strategy round-trips; v0.1 missing and hostile values safely default',()=>{
  for(const strategy of STRATEGIES){
    const s=createGame(42);act(s,'setStrategy',strategy.id);
    assert.equal(validateSave(JSON.parse(JSON.stringify(s))).strategy,strategy.id);
  }
  for(const invalid of [undefined,null,{},[],true,1,'constructor','__proto__','aggressive']){
    const s=createGame(42);s.strategy=invalid;
    assert.equal(validateSave(s).strategy,'balanced');
  }
});

test('selection only in town, invalid action data never starts or changes combat',()=>{
  const s=createGame(42);
  for(const invalid of [undefined,null,{},1,'__proto__','heal'])act(s,'setStrategy',invalid);
  assert.equal(s.strategy,'balanced');assert.equal(s.mode,'town');
  act(s,'setStrategy','assault');act(s,'start');
  for(const mode of ['battle','defeat']){
    s.mode=mode;act(s,'setStrategy','sustain');
    assert.equal(s.strategy,'assault');assert.equal(s.mode,mode);
  }
  act(s,'retreat');act(s,'setStrategy','sustain');assert.equal(s.strategy,'sustain');
});

test('skill cadence costs MP; reserve suppresses sustain burst at low MP',()=>{
  for(const [strategy,expected] of [['balanced',1],['assault',2],['sustain',1]]){
    const s=encounter(strategy,{attack:0});turns(s,6);
    assert.equal(s.battle.actions.skills,expected);
    assert.equal(s.battle.actions.manaSpent,expected*3);
    assert.equal(s.battle.actions.attacks,6);
  }
  const s=encounter('sustain',{attack:0});s.hero.mp=0;turns(s,5);
  assert.equal(s.battle.actions.skills,0);
  assert.ok(Math.abs(s.hero.mp-3)<1e-9);
});

test('sustain heals earlier at the same 6 MP cost, not a free heal',()=>{
  for(const [strategy,heals] of [['balanced',0],['assault',0],['sustain',1]]){
    const s=encounter(strategy,{attack:0});s.hero.hp=stats(s).maxHp*.5;turns(s,1);
    assert.equal(s.battle.actions.heals,heals);
    assert.equal(s.battle.actions.manaSpent,heals*6);
    assert.equal(s.battle.actions.attacks,1,'existing v0.1 support+attack adaptation is unchanged');
  }
});

test('automatic potion only sustain, finite charges; manual potion remains usable',()=>{
  for(const [strategy,potions] of [['balanced',0],['assault',0],['sustain',1]]){
    const s=encounter(strategy,{attack:0});s.hero.hp=50;s.hero.mp=0;turns(s,1);
    assert.equal(s.battle.actions.potions,potions);assert.equal(s.potions,3-potions);
    act(s,'heal');assert.equal(s.battle.actions.potions,potions+1);
  }
  const s=encounter('sustain',{attack:0});s.hero.hp=50;s.hero.mp=0;s.potions=0;turns(s,1);
  assert.equal(s.hero.hp,50);assert.equal(s.battle.actions.potions,0);
});

test('automatic potion threshold checks HP after paid healing',()=>{
  const s=encounter('sustain',{attack:0});s.hero.hp=stats(s).maxHp*.25;turns(s,1);
  assert.equal(s.battle.actions.heals,1);assert.equal(s.battle.actions.potions,0);
  assert.equal(s.potions,3);
});

test('same-seed easy encounter: assault clears sooner but spends more MP',()=>{
  const balanced=finish(encounter('balanced',{hp:2000,attack:0}));
  const assault=finish(encounter('assault',{hp:2000,attack:0}));
  assert.equal(balanced.wins,1);assert.equal(assault.wins,1);
  assert.ok(assault.battle.elapsed<balanced.battle.elapsed);
  assert.equal(balanced.battle.actions.manaSpent,24);
  assert.equal(assault.battle.actions.manaSpent,39);
  assert.equal(assault.battle.actions.heals,0);
});

test('same-seed hard encounter: sustain spends finite potions to survive, not extra damage',()=>{
  const balanced=finish(encounter('balanced')),assault=finish(encounter('assault')),sustain=finish(encounter('sustain'));
  assert.equal(balanced.mode,'defeat');assert.equal(assault.mode,'defeat');assert.equal(sustain.wins,1);
  assert.equal(sustain.battle.actions.potions,3);assert.equal(sustain.potions,0);
  assert.ok(sustain.battle.actions.skills<balanced.battle.actions.skills);
  assert.ok(sustain.battle.actions.heals>balanced.battle.actions.heals);
  assert.deepEqual(finish(encounter('sustain')),sustain,'seed and policy reproduce exact state');
});

test('run counters reset on new expedition and safe load, selected policy persists',()=>{
  const s=encounter('assault',{attack:0});turns(s,6);
  act(s,'retreat');act(s,'start');
  assert.deepEqual(s.battle.actions,{attacks:0,skills:0,heals:0,potions:0,manaSpent:0});
  assert.equal(s.strategy,'assault');
  const restored=validateSave(s);
  assert.equal(restored.mode,'town');assert.equal(restored.strategy,'assault');
  assert.deepEqual(restored.battle.actions,s.battle.actions);
});
