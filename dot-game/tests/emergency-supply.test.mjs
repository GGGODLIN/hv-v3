import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import * as previous from './fixtures/v0.25/src/engine.js';
import {createCommissionWeapon,createSoulboundItem} from '../src/loot.js';

// Synthetic edge fixtures are behavioral tests, not naturally earned play.
const clone=structuredClone;
function fixture(strategy='balanced',enabled=true) {
  const s=game.createGame(42);game.act(s,'setStrategy',strategy);game.act(s,'setEmergencySupply',enabled);game.act(s,'start');
  s.enemies=[{id:'supply-fixture',name:'Supply fixture',hp:1e6,maxHp:1e6,attack:0,defense:0,evade:0,parry:0,block:0}];
  s.hero.mp=0;return s;
}
function turn(s){s._clock=1.05;s._enemyClock=-100;game.advance(s,.001);}
const pct=(s,n)=>{s.hero.hp=game.stats(s).maxHp*n;};

test('emergency supply is absent/OFF by default and detached views are pure',()=>{
  const s=game.createGame(7),before=clone(s),v=game.emergencySupplyView(s);
  assert.deepEqual(v,{enabled:false,effective:false,strategy:'balanced',threshold:.30,reserve:1,remaining:3,available:false,status:'off'});
  assert.equal(Object.hasOwn(s,'emergencySupply'),false);v.enabled=true;v.remaining=999;
  for(let i=0;i<20;i++)game.emergencySupplyView(s);
  assert.deepEqual(s,before);assert.ok(Object.isFrozen(game.EMERGENCY_SUPPLY_RULES));
  assert.equal(game.emergencySupplyView(null).available,false);
});

test('strict boolean camp toggle changes only sparse preference, not resources or RNG',()=>{
  const s=game.createGame(7),before=clone(s);
  for(const value of [undefined,null,0,1,'true',{},[],new Boolean(true)]){game.act(s,'setEmergencySupply',value);assert.deepEqual(s,before);}
  game.act(s,'setEmergencySupply',true);assert.deepEqual(s,{...before,emergencySupply:true});
  game.act(s,'setEmergencySupply',true);assert.deepEqual(s,{...before,emergencySupply:true});
  game.act(s,'setEmergencySupply',false);assert.deepEqual(s,before);
  for(const mode of ['battle','defeat']){s.mode=mode;const snapshot=clone(s);game.act(s,'setEmergencySupply',true);assert.deepEqual(s,snapshot);}
});

for(const strategy of ['balanced','assault'])test(`${strategy}: after-heal strict30% uses exactly one existing40% potion without a new action`,()=>{
  const s=fixture(strategy);pct(s,.29);const hp=s.hero.hp,mp=s.hero.mp,seed=s.seed;
  assert.equal(game.emergencySupplyView(s).available,true);turn(s);
  assert.equal(s.potions,2);assert.equal(s.hero.hp,hp+game.stats(s).maxHp*.4);
  assert.equal(s.battle.actions.potions,1);assert.equal(s.battle.actions.attacks,1);assert.equal(s.timing.turns,1);
  assert.equal(s.battle.actions.heals,0);assert.equal(s.hero.mp,mp+.6);assert.equal(s.battle.actions.manaSpent,0);
  assert.notEqual(s.seed,seed,'ordinary attack still draws its unchanged RNG');
  assert.equal(s.events.filter(e=>e.text==='補給藥水').length,1);
});

for(const strategy of ['balanced','assault'])test(`${strategy}: equal/above30%, full HP and OFF never spend supply`,()=>{
  for(const n of [.30,.31,1]){const s=fixture(strategy);pct(s,n);turn(s);assert.equal(s.potions,3);assert.equal(s.battle.actions.potions,0);}
  const s=fixture(strategy,false);pct(s,.01);turn(s);assert.equal(s.potions,3);assert.equal(s.battle.actions.potions,0);
});

test('existing heal runs first; recovered threshold suppresses potion while very low HP may use both',()=>{
  for(const strategy of ['balanced','assault'])for(const hp of [.03,.02]){
    const s=fixture(strategy);pct(s,hp);s.hero.mp=6;turn(s);
    assert.equal(s.battle.actions.heals,1);assert.equal(s.battle.actions.potions,hp===.03?0:1);
    assert.equal(s.potions,hp===.03?3:2);assert.equal(s.battle.actions.attacks,1);
    assert.equal(s.battle.actions.manaSpent,6);
    if(hp===.02)assert.deepEqual(s.events.filter(e=>e.type==='heal').map(e=>e.text),['自動治癒','補給藥水']);
  }
});

test('reserve stops automatic spending at one; manual use can spend the final potion',()=>{
  const s=fixture();pct(s,.1);turn(s);assert.equal(s.potions,2);
  pct(s,.1);turn(s);assert.equal(s.potions,1);assert.equal(s.battle.actions.potions,2);
  pct(s,.1);assert.equal(game.emergencySupplyView(s).status,'reserved');
  for(let n=0;n<3;n++)turn(s);assert.equal(s.potions,1);assert.equal(s.battle.actions.potions,2);
  game.act(s,'heal');assert.equal(s.potions,0);assert.equal(s.battle.actions.potions,3);
  assert.equal(game.emergencySupplyView(s).status,'empty');
  const before=clone(s);game.act(s,'heal');assert.deepEqual(s,before);
});

test('invalid/empty stock never qualifies the additional rule',()=>{
  for(const stock of [0,-1,1,1.5,NaN,Infinity,'3',undefined]){
    const s=fixture();s.potions=stock;pct(s,.1);assert.equal(game.emergencySupplyView(s).available,false);
    turn(s);assert.equal(s.battle.actions.potions,0);assert.ok(Object.is(s.potions,stock));
  }
});

test('Sustain retains its old after-heal30% policy, including its last potion, with either setting',()=>{
  for(const enabled of [false,true]){
    const s=fixture('sustain',enabled);s.potions=1;pct(s,.1);
    const v=game.emergencySupplyView(s);assert.equal(v.status,'sustain');assert.equal(v.effective,false);assert.equal(v.available,false);
    turn(s);assert.equal(s.potions,0);assert.equal(s.battle.actions.potions,1);assert.equal(s.battle.actions.attacks,1);
    pct(s,.1);turn(s);assert.equal(s.potions,0);assert.equal(s.battle.actions.potions,1);
  }
});

test('preference follows camp tactic changes without changing Sustain or making extra potions',()=>{
  const s=game.createGame();game.act(s,'setEmergencySupply',true);
  for(const strategy of ['sustain','assault','balanced']){
    const before=clone(s);game.act(s,'setStrategy',strategy);
    assert.equal(s.emergencySupply,true);assert.equal(s.potions,before.potions);assert.equal(s.seed,before.seed);
    assert.equal(game.emergencySupplyView(s).effective,strategy!=='sustain');
  }
});

test('automatic supply does not replace or duplicate existing Protection action priority',()=>{
  const s=game.createGame();s.hero.level=10;game.act(s,'setEmergencySupply',true);game.act(s,'autoProtection',true);game.act(s,'start');
  s.enemies=[{id:'supply-fixture',hp:1e6,maxHp:1e6,attack:0,defense:0,evade:0,parry:0,block:0}];
  s.hero.mp=3;pct(s,.1);turn(s);
  assert.equal(s.battle.actions.potions,1);assert.equal(s.battle.actions.protectionCasts,1);assert.equal(s.battle.actions.attacks,0);
  assert.equal(s.battle.actions.manaSpent,3);assert.equal(s.timing.turns,1);
});

test('camp, intermission and defeat do not consume; new expeditions still reset exactly to3',()=>{
  const s=fixture();pct(s,.1);turn(s);assert.equal(s.potions,2);
  game.act(s,'retreat');s.hero.hp=1;const camp=clone(s);game.advance(s,1);assert.deepEqual(s,camp);
  assert.equal(game.emergencySupplyView(s).status,'away');game.act(s,'start');assert.equal(s.potions,3);assert.equal(s.emergencySupply,true);
  s._phase='intermission';s._rest=3;s.hero.hp=1;s.potions=2;game.advance(s,.25);assert.equal(s.potions,2);
  s.mode='defeat';assert.equal(game.emergencySupplyView(s).available,false);game.advance(s,1);assert.equal(s.potions,2);
});

test('save reads v1/v2/v3 with absent or true preference and false normalizes to omission',()=>{
  for(const version of [1,2,3])for(const value of [undefined,false,true]){
    const s=game.createGame();s.version=version;if(version<3)delete s.worldSeeds;if(version<2)delete s.soulFragments;
    if(value!==undefined)s.emergencySupply=value;
    const before=clone(s),loaded=game.validateSave(s);assert.deepEqual(s,before);
    assert.equal(loaded.version,3);assert.equal(loaded.emergencySupply,value===true?true:undefined);
    assert.equal(loaded.potions,3);assert.equal(loaded.mode,'town');
  }
});

for(const value of [undefined,null,1,0,'true',{},[],NaN,Infinity])test(`save refuses malformed emergency preference ${String(value)}`,()=>{
  const s=game.createGame();s.emergencySupply=value;assert.throws(()=>game.validateSave(s),/緊急補給設定/);
});

test('save refuses accessor, hidden and inherited preference without reading executable value',()=>{
  for(const kind of ['accessor','hidden','inherited']){
    const s=game.createGame();let reads=0;
    if(kind==='accessor')Object.defineProperty(s,'emergencySupply',{enumerable:true,get(){reads++;return true;}});
    if(kind==='hidden')Object.defineProperty(s,'emergencySupply',{value:true});
    if(kind==='inherited')Object.setPrototypeOf(s,{emergencySupply:true});
    assert.throws(()=>game.validateSave(s),/緊急補給設定/);assert.equal(reads,0);
  }
});

test('old reader safely drops the new preference rather than pretending to support it',()=>{
  const s=game.createGame();game.act(s,'setEmergencySupply',true);const old=previous.validateSave(clone(s));
  assert.equal(Object.hasOwn(old,'emergencySupply'),false);assert.equal(old.strategy,'balanced');assert.equal(old.version,3);
  const current=game.validateSave(old);assert.equal(game.emergencySupplyView(current).enabled,false);
});

test('report records the opted-in start choice, remains detached, and OFF omits it exactly',()=>{
  for(const enabled of [false,true]){
    const s=fixture('balanced',enabled);game.act(s,'retreat');const reports=game.expeditionReports(s);
    assert.equal(Object.hasOwn(reports[0].build,'emergencySupply'),enabled);
    assert.equal(reports[0].build.emergencySupply,enabled?true:undefined);
    reports[0].build.emergencySupply=!enabled;assert.equal(game.expeditionReports(s)[0].build.emergencySupply,enabled?true:undefined);
  }
});

test('paid IW entry quote includes the preference and refuses stale policy consent atomically',()=>{
  const s=game.createGame();s.worldSeeds=1;s.soulFragments=100;
  const weapon={...createCommissionWeapon('rapier',1,'slaughter'),id:'supply-iw'};
  s.inventory.push(createSoulboundItem(weapon,1));assert.ok(s.inventory[0]);
  const quote=game.previewItemWorld(s,'supply-iw');assert.equal(quote.available,true,quote.reason);
  game.act(s,'setEmergencySupply',true);const before=clone(s);game.act(s,'enterItemWorld',quote);assert.deepEqual(s,before);
  const fresh=game.previewItemWorld(s,'supply-iw');assert.equal(fresh.available,true);assert.notEqual(fresh.quoteBasis,quote.quoteBasis);
  game.act(s,'enterItemWorld',fresh);assert.equal(game.itemWorldView(s).active,true);assert.equal(s.worldSeeds,0);assert.equal(s.emergencySupply,true);
  game.act(s,'retreat');assert.equal(s.worldSeeds,0);
});

test('OFF full state/RNG/reports remain exact against portable v0.25 baseline across all tactics',()=>{
  // v0.26 changed only Exquisite IW1 eligibility; this ordinary-expedition
  // oracle also remains exact for its unchanged combat and supply behavior.
  for(const seed of [1,7,42])for(const stage of [1,3,5,10])for(const strategy of ['balanced','assault','sustain']){
    const a=game.createGame(seed),b=previous.createGame(seed);
    for(const [engine,s] of [[game,a],[previous,b]]){s.unlocked=stage;s.stage=stage;engine.act(s,'setStrategy',strategy);engine.act(s,'start');}
    game.act(a,'setEmergencySupply',false);
    for(let pulse=0;pulse<300;pulse++){
      game.advance(a,.25);previous.advance(b,.25);assert.deepEqual(a,b,`${seed}/${stage}/${strategy}/${pulse}`);
      assert.deepEqual(game.expeditionReports(a),previous.expeditionReports(b));
    }
  }
});
