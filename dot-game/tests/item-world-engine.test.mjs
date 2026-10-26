import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import {createCommissionWeapon,createSoulboundItem,createItemWorldUpgrade,scaleSoulboundItem,isSoulboundItem} from '../src/loot.js';
const clone=structuredClone;
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
function ready(level=15,family='axe',location='equipment'){
  const raw=game.createGame(42);raw.hero.level=level;raw.worldSeeds=3;raw.soulFragments=123;raw.stage=3;raw.unlocked=7;raw.wins=8;
  const s=game.validateSave(raw),target=createSoulboundItem({...createCommissionWeapon(family,1),id:'loot-1'},level);
  if(location==='equipment')s.equipment.weapon=target;else s.inventory.push(target);
  s._itemId=1;s.battle.bestTimes={1:12,3:34};return s;
}
function enter(s){const q=game.previewItemWorld(s,'loot-1');assert.equal(q.available,true,q.reason);game.act(s,'enterItemWorld',q);assert.equal(s.mode,'battle');assert.equal(game.itemWorldView(s).active,true);return q;}
function target(s){return s.equipment.weapon.id==='loot-1'?s.equipment.weapon:s.inventory.find(i=>i.id==='loot-1');}
function noChange(s,payload){const before=clone(s);game.act(s,'enterItemWorld',payload);assert.deepEqual(s,before);}
function pulse(s,predicate,max=1000){for(let n=0;n<max&&!predicate(s);n++)game.advance(s,.05);assert.ok(predicate(s),'bounded fixture reached condition');}
function wound(s,enemies=s.enemies){for(const enemy of enemies){enemy.hp=1;enemy.bleeding={stacks:1,expiresAtTick:s.timing.ticks+7,damagePerTick:1};}s._clock=-10;s._enemyClock=-10;s.timing.tu=(s.timing.ticks+1)*100-.001;game.advance(s,.01);}
function complete(s,method='basic'){
  while(game.itemWorldView(s).active){
    const wave=s.wave;
    if(method==='bleed')wound(s);
    else{for(const enemy of s.enemies){enemy.hp=1;enemy.evade=0;enemy.parry=0;enemy.block=0;enemy.defense=0;enemy.attack=0;}pulse(s,v=>v.mode==='town'||v.wave!==wave);}
  }
}

test('IW engine: v3 mandatory bounded worldSeeds and zero-grant v1/v2 migrations',()=>{
  assert.equal(game.VERSION,3);assert.equal(game.WORLD_SEED_LIMIT,1e9);assert.equal(game.WORLD_SEEDS_PER_WIN,1);
  for(const version of [1,2]){
    const old=ready();old.version=version;delete old.worldSeeds;
    if(version===1){old.equipment.weapon=createCommissionWeapon('axe',1);delete old.soulFragments;}
    const before=clone(old),loaded=game.validateSave(old);assert.equal(loaded.version,3);assert.equal(loaded.worldSeeds,0);assert.equal(loaded.soulFragments,version===1?0:123);assert.deepEqual(old,before);
    if(version===2)assert.deepEqual(loaded.equipment.weapon,old.equipment.weapon);
    old.worldSeeds=0;assert.throws(()=>game.validateSave(old));
  }
  for(const seeds of [0,1,1e9]){const s=ready();s.worldSeeds=seeds;assert.equal(game.validateSave(s).worldSeeds,seeds);}
  for(const seeds of [undefined,null,false,'1',-1,.5,1e9+1,NaN,Infinity]){const s=ready();s.worldSeeds=seeds;assert.throws(()=>game.validateSave(s));}
  const absent=ready();delete absent.worldSeeds;assert.throws(()=>game.validateSave(absent));
});

test('IW engine: preview is exact, detached, frozen-safe and side-effect/RNG-free',()=>{
  const s=freeze(ready()),before=clone(s),rng=Math.random;Math.random=()=>{throw Error('no RNG');};
  try{
    const q=game.previewItemWorld(s,'loot-1');assert.equal(q.available,true);assert.equal(q.cost,1);assert.equal(q.seedsAfter,2);assert.equal(q.strengthStage,5);assert.equal(q.rounds,5);
    assert.deepEqual(Object.keys(q).sort(),['id','available','reason','cost','seedsAfter','before','after','strengthStage','rounds','quoteBasis'].sort());
    assert.deepEqual(q.after,createItemWorldUpgrade(target(s),15));q.after.stats.attack=0;q.before.stats.attack=0;
    assert.deepEqual(s,before);noChange(s,game.previewItemWorld(s,'loot-1'));
  }finally{Math.random=rng;}
});

test('IW engine: no pending items, five free slots and one seed are required without changing inventory',()=>{
  for(const change of [s=>{s.worldSeeds=0;},s=>{s.mode='battle';},s=>{s.pendingLoot=[{...s.equipment.armor,id:'pending'}];},s=>{s.inventory=Array.from({length:116},(_,i)=>({...s.equipment.armor,id:`held-${i}`}));}]){
    const s=ready();change(s);const q=game.previewItemWorld(s,'loot-1');assert.equal(q.available,false);assert.equal(q.cost,1);assert.equal(q.rounds,5);noChange(s,q);
  }
  const s=ready();s.inventory=Array.from({length:115},(_,i)=>({...clone(s.equipment.armor),id:`held-${i}`}));const inventory=clone(s.inventory);enter(s);assert.deepEqual(s.inventory,inventory);assert.equal(s.worldSeeds,2);
});

test('IW engine: full quote rejects missing, extra, stale and executable consent atomically',()=>{
  const quote=game.previewItemWorld(ready(),'loot-1');
  for(const value of [null,undefined,'loot-1',{},[],{id:quote.id,quoteBasis:quote.quoteBasis},{...quote,cost:0},{...quote,seedsAfter:3},{...quote,strengthStage:1},{...quote,rounds:4},{...quote,extra:true}])noChange(ready(),value);
  for(const key of Object.keys(quote)){const missing=clone(quote);delete missing[key];noChange(ready(),missing);}
  for(const mutate of [s=>{s.hero.level++;},s=>{s.hero.hp--;},s=>{s.hero.xp++;},s=>{s.hero.gold++;},s=>{s.worldSeeds++;},s=>{s.stage++;},s=>{s.unlocked++;},s=>{s.autoAdvance=true;},s=>{s.seed++;},s=>{s.strategy='assault';},s=>{s.targetPriority='caster';},s=>{s.autoProtection=true;},s=>{s.timing.turns++;},s=>{s._itemId++;}]){
    const s=ready(),q=game.previewItemWorld(s,'loot-1');mutate(s);noChange(s,q);
  }
  let reads=0;for(const object of ['quote','after']){const value=clone(quote);Object.defineProperty(object==='quote'?value:value.after,'id',{enumerable:true,get(){reads++;throw Error('must not run');}});noChange(ready(),value);}
  assert.equal(reads,0);
});

test('IW engine: readonly graphs are rejected before debit while frozen anchors are expected',()=>{
  for(const selector of [s=>s,s=>s.hero,s=>s.battle,s=>s.inventory,s=>s.equipment,s=>s.events,s=>s.logs,s=>target(s)]){
    const s=ready(),q=game.previewItemWorld(s,'loot-1');Object.freeze(selector(s));noChange(s,q);assert.equal(game.itemWorldView(s).active,false);
  }
  const s=ready();assert.ok(Object.isFrozen(target(s).soulbound));assert.ok(Object.isFrozen(target(s).soulbound.stats));enter(s);assert.equal(s.worldSeeds,2);
});

test('IW engine: fixed tier5 and five-round 1+2+2+2+boss composition stay independent of character growth',()=>{
  for(const level of [1,3,15,90,500])assert.equal(game.previewItemWorld(ready(level),'loot-1').strengthStage,5);
  const s=ready(15);s.hero.xp=s.hero.xpNext-1;const entryLevel=s.hero.level;enter(s);
  const frozen=clone(game.itemWorldView(s)),roles=game.previewStage(5).waves;
  for(let round=1;round<=5;round++){
    assert.equal(s.wave,round);assert.equal(s.enemies.length,round===1||round===5?1:2);assert.equal(s.enemies.every(e=>e.boss),round===5);
    assert.equal(game.itemWorldView(s).strengthStage,5);assert.equal(game.itemWorldView(s).entryLevel,entryLevel);
    const boss=round===5;assert.equal(s.enemies[0].maxHp,Math.round((boss?340:114+round*15)*1.2**4));
    assert.equal(s.enemies[0].attack,Math.round((boss?27:16+round)*1.16**4*(1+.02*(round-1))*100)/100);
    if(round<4)assert.deepEqual(s.enemies.map(e=>[e.roleId,e.attackPattern]),roles[round-1].enemies.map(e=>[e.roleId,e.attackPattern]));
    wound(s);
  }
  assert.ok(s.hero.level>entryLevel);assert.equal(frozen.strengthStage,5);assert.equal(game.itemWorldView(s).active,false);
});

for(const method of ['basic','bleed'])test(`IW engine: ${method} five-round win upgrades stable target once with only kill rewards`,()=>{
  for(const location of ['equipment','inventory']){
    const s=ready(15,'rapier',location);s.autoAdvance=true;
    const before=clone(s),source=clone(target(s));enter(s);const inventoryIds=s.inventory.map(i=>i.id);complete(s,method);
    assert.equal(s.mode,'town');assert.equal(s.worldSeeds,2);assert.equal(s.kills,before.kills+8);
    assert.equal(s.hero.gold,before.hero.gold+7*Math.floor(14/4)+Math.floor(29/4));assert.equal(s.hero.xp,before.hero.xp+7*17+28);
    for(const key of ['stage','unlocked','wins','soulFragments','autoAdvance'])assert.equal(s[key],before[key]);assert.deepEqual(s.battle.bestTimes,before.battle.bestTimes);assert.equal(s.battle.cleared,before.battle.cleared);
    assert.equal(target(s).id,source.id);assert.deepEqual(target(s),createItemWorldUpgrade(source,s.hero.level));assert.deepEqual(target(s).soulbound,source.soulbound);
    assert.deepEqual(s.inventory.slice(0,inventoryIds.length).map(i=>i.id),inventoryIds);assert.equal(s.equipment.weapon.id,before.equipment.weapon.id);
    const report=game.expeditionReports(s)[0];assert.equal(report.outcome,'win');assert.deepEqual(report.itemWorld,{targetId:'loot-1',targetName:source.name,level:1,reward:true,cost:1,entryLevel:15,strengthStage:5,rounds:5});
    report.itemWorld.reward=false;assert.equal(game.expeditionReports(s)[0].itemWorld.reward,true);
    const terminal=clone(s);game.advance(s,2);assert.deepEqual(s,terminal);noChange(s,game.previewItemWorld(s,'loot-1'));assert.equal(game.previewItemWorld(s,'loot-1').available,false);
    assert.deepEqual(game.validateSave(s).equipment,s.equipment);assert.deepEqual(game.validateSave(s).inventory,s.inventory);
  }
});

for(const recovery of [false,true])test(`IW engine: final ${recovery?'recovery ':''}counter settles once without a player action`,()=>{
  const s=ready();s.hero.attributes.str=2000;s.hero.attributes.dex=2000;s.equipment.armor.stats.block=1;enter(s);
  s.wave=5;s.enemies=[{id:'counter-fixture',name:'Counter fixture',hp:1,maxHp:1,attack:0,defense:0,evade:0,parry:0,block:0,boss:true,...(recovery?{stunRecoveryPending:true}:{})}];
  s.seed=2;s._clock=recovery?1.05:-10;s._enemyClock=1.9;game.advance(s,.01);
  assert.equal(s.mode,'town');assert.equal(s.kills,1);assert.equal(s.battle.actions.counters,1);assert.equal(s.battle.actions.attacks,0);assert.equal(s.hero.gold,7);assert.equal(s.worldSeeds,2);assert.equal(target(s).itemWorld.level,1);
  const report=game.expeditionReports(s)[0];assert.equal(report.damage.counter,1);assert.equal(report.itemWorld.reward,true);
  const types=s.events.map(e=>e.type);assert.ok(types.indexOf('counter')<types.indexOf('win'));if(recovery)assert.ok(types.indexOf('recovery')<types.indexOf('counter'));
  const terminal=clone(s);game.advance(s,2);assert.deepEqual(s,terminal);
});

test('IW engine: retreat and defeat return camp, keep settled kills and never refund or upgrade',()=>{
  for(const outcome of ['retreat','defeat']){
    const s=ready(),source=clone(target(s));enter(s);wound(s);const rewards={xp:s.hero.xp,gold:s.hero.gold,kills:s.kills};
    if(outcome==='retreat')game.act(s,'retreat');else{
      s.hero.hp=1;s.hero.mp=0;s._clock=-10;s._enemyClock=1.9;s.seed=42;
      for(const enemy of s.enemies){enemy.attack=1e9;enemy.hp=1e9;enemy.maxHp=1e9;}
      pulse(s,v=>v.mode==='town');
    }
    assert.equal(s.mode,'town');assert.equal(game.itemWorldView(s).active,false);assert.equal(s.worldSeeds,2);assert.deepEqual(target(s),source);
    assert.deepEqual({xp:s.hero.xp,gold:s.hero.gold,kills:s.kills},rewards);assert.equal(game.expeditionReports(s)[0].outcome,outcome);assert.equal(game.expeditionReports(s)[0].itemWorld.reward,false);
    const noReplay=clone(s);game.advance(s,2);assert.deepEqual(s,noReplay);
  }
});

test('IW engine: midtrial reload drops context but keeps spent seed, earned kill XP and target anchor',()=>{
  const s=ready(),source=clone(target(s));enter(s);wound(s);const loaded=game.validateSave(clone(s));
  assert.equal(loaded.mode,'town');assert.deepEqual(game.itemWorldView(loaded),{active:false});assert.deepEqual(game.expeditionReports(loaded),[]);
  assert.equal(loaded.worldSeeds,2);assert.equal(loaded.hero.xp,s.hero.xp);assert.equal(loaded.hero.gold,s.hero.gold);assert.equal(loaded.kills,s.kills);assert.deepEqual(target(loaded),source);
  assert.equal(Object.keys(s).some(k=>/itemWorld|trial|entryLevel|strengthStage/i.test(k)),false);
});

test('IW engine: trial cannot queue automatic normal continuation; next manual normal run stays normal',()=>{
  const s=ready();s.autoAdvance=true;enter(s);assert.deepEqual(game.finishThenCampView(s),{available:false,queued:false});
  const before=clone(s);game.act(s,'finishThenCamp',true);assert.deepEqual(s,before);complete(s,'bleed');
  game.act(s,'start');assert.equal(game.itemWorldView(s).active,false);assert.equal(s.totalWaves,4);assert.equal(s.stage,3);assert.equal(s.worldSeeds,2);
  game.act(s,'retreat');assert.equal(Object.hasOwn(game.expeditionReports(s)[0],'itemWorld'),false);
});

test('IW engine: legacy metadata placement and current tampered caches fail without repair',()=>{
  for(const place of ['equipment','inventory','pending']){
    const s=ready(),upgraded=createItemWorldUpgrade(target(s),15);s.equipment.weapon=createCommissionWeapon('club',1);
    if(place==='equipment')s.equipment.weapon=upgraded;else if(place==='inventory')s.inventory=[upgraded];else s.pendingLoot=[upgraded];
    assert.ok(isSoulboundItem(upgraded));assert.doesNotThrow(()=>game.validateSave(s));
    for(const version of [1,2]){const old=clone(s);old.version=version;delete old.worldSeeds;if(version===1)delete old.soulFragments;assert.throws(()=>game.validateSave(old));}
    upgraded.stats.attack++;const before=clone(s);assert.throws(()=>game.validateSave(s));assert.deepEqual(s,before);
  }
});
