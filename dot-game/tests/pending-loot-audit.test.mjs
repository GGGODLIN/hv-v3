import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as game from '../src/engine.js';
import * as old from './fixtures/v0.26/engine.js';
import * as loot from '../src/loot.js';

const copy=structuredClone;
const held=s=>[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];
const weapon=(id,family='axe')=>({...loot.createCommissionWeapon(family,1),id,locked:false});
const invested=(id,iw=false)=>{
  const bound=loot.createSoulboundItem(weapon(id,'rapier'),1);
  return iw?loot.createItemWorldUpgrade(bound,1):bound;
};
function stateWithPending(count=1){
  const raw=game.createGame(42);
  raw.pendingLoot=Array.from({length:count},(_,i)=>weapon(`pending-${i}`));
  return game.validateSave(raw);
}
const noChange=(s,action,payload)=>{const before=copy(s);game.act(s,action,payload);assert.deepEqual(s,before);};
const nonStorage=s=>{const result=copy(s);delete result.inventory;delete result.pendingLoot;return result;};
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};

// All capacity/import fixtures are synthetic boundary cases. They do not assert
// that ordinary generation creates free-space pending saves or 116 earned binds.
test('v028 audit: the already-valid empty-backpack pending save gains an explicit recovery route',()=>{
  const raw=game.createGame(42);raw.pendingLoot=[invested('pending-investment',true)];
  const saved=copy(raw),s=game.validateSave(raw);
  assert.deepEqual(raw,saved);assert.equal(s.inventory.length,0);assert.equal(s.pendingLoot.length,1);
  assert.equal(game.pendingLootView(s).available,true);
  game.act(s,'start');assert.equal(s.mode,'town');
  const before=copy(s),object=s.pendingLoot[0];game.act(s,'claimPending');
  assert.equal(s.inventory.length,1);assert.equal(s.pendingLoot.length,0);assert.equal(s.inventory[0],object);
  assert.deepEqual(s.inventory[0],before.pendingLoot[0]);assert.deepEqual(nonStorage(s),nonStorage(before));
  game.act(s,'start');assert.equal(s.mode,'battle');
});

test('v028 audit: pure status works on frozen saves and cannot change pending items',()=>{
  const s=freeze(stateWithPending(2)),before=copy(s),view=game.pendingLootView(s);
  assert.deepEqual(view,{count:2,freeSlots:120,claimable:2,available:true,reason:''});
  view.count=0;view.available=false;assert.deepEqual(s,before);
});

test('v028 audit: claim is capacity-limited FIFO, retains object identity and never duplicates on repeat',()=>{
  const s=stateWithPending(3);s.inventory=Array.from({length:119},(_,i)=>weapon(`backpack-${i}`));
  const before=copy(s),objects=[...s.pendingLoot],allIds=held(s).map(i=>i.id).sort();
  game.act(s,'claimPending');
  assert.equal(s.inventory.length,120);assert.equal(s.inventory.at(-1),objects[0]);
  assert.deepEqual(s.pendingLoot,objects.slice(1));assert.equal(s.pendingLoot[0],objects[1]);
  assert.deepEqual(held(s).map(i=>i.id).sort(),allIds);assert.deepEqual(nonStorage(s),nonStorage(before));
  noChange(s,'claimPending');assert.equal(game.pendingLootView(s).available,false);
  assert.equal(game.pendingLootView(s).count,2);assert.equal(game.pendingLootView(s).claimable,0);
});

test('v028 audit: no submitted selection/count can turn claim into targeted transfer or disposal',()=>{
  for(const payload of [null,false,true,0,1,'pending-0',[],{},['pending-0'],{ids:['pending-0']},{claimable:99}]){
    const s=stateWithPending(2);noChange(s,'claimPending',payload);
  }
  noChange(game.createGame(42),'claimPending');
});

test('v028 audit: battle, intermission and defeat refuse claim while town preserves wounded pools and clocks',()=>{
  for(const [mode,phase] of [['battle','fight'],['battle','intermission'],['defeat','idle']]){
    const s=stateWithPending();s.mode=mode;s._phase=phase;noChange(s,'claimPending');
    assert.equal(game.pendingLootView(s).available,false);
  }
  const s=stateWithPending();s.hero.hp=1;s.hero.mp=0;s._clock=.7;s._enemyClock=.4;s.timing={turns:8,ticks:7,tu:701};
  const before=nonStorage(s),random=Math.random;Math.random=()=>{throw Error('claim must not draw random');};
  try{game.act(s,'claimPending');}finally{Math.random=random;}
  assert.deepEqual(nonStorage(s),before);assert.equal(s.inventory.length,1);
});

test('v028 audit: readonly state destinations reject atomically, but frozen item anchors need not be mutated',()=>{
  for(const key of ['inventory','pendingLoot']){
    const s=stateWithPending();Object.defineProperty(s,key,{writable:false});noChange(s,'claimPending');
  }
  const s=stateWithPending();s.pendingLoot=[freeze(invested('immutable-iw',true))];
  const item=s.pendingLoot[0];game.act(s,'claimPending');assert.equal(s.inventory[0],item);
  assert.ok(Object.isFrozen(item.soulbound));assert.ok(Object.isFrozen(item.soulbound.stats));
  assert.equal(item.itemWorld.level,1);
});

test('v028 audit: existing strict load validation still refuses invalid pending capacity, duplicate and unknown data',()=>{
  const changes=[s=>{s.pendingLoot=Array.from({length:9},(_,i)=>weapon(`too-many-${i}`));},
    s=>{s.pendingLoot[0].id=s.equipment.weapon.id;},s=>{s.pendingLoot[0].futureField=1;},
    s=>{s.pendingLoot[0].stats.futureStat=1;},s=>{s.pendingLoot[0]=null;}];
  for(const change of changes){const s=stateWithPending();change(s);const before=copy(s);assert.throws(()=>game.validateSave(s));assert.deepEqual(s,before);}
  for(const change of [s=>{s.pendingLoot=null;},s=>{s.inventory=null;},s=>{s.pendingLoot=Array(9).fill(weapon('bad'));},s=>{s.inventory=Array(121).fill(weapon('bad'));}]){
    const s=stateWithPending();change(s);assert.equal(game.pendingLootView(s).available,false);noChange(s,'claimPending');
  }
});

test('v028 audit: pending investment remains excluded from equip, sell, lock, bind and trial before claim',()=>{
  const s=stateWithPending();s.pendingLoot=[invested('waiting-iw',true)];s.soulFragments=1000;s.worldSeeds=2;
  for(const action of ['equip','sell','lock'])noChange(s,action,'waiting-iw');
  assert.equal(game.previewSoulbindWeapon(s,'waiting-iw').available,false);
  assert.equal(game.previewItemWorld(s,'waiting-iw').available,false);
  assert.equal(game.previewSelectedSale(s,['waiting-iw']).available,false);
  const item=copy(s.pendingLoot[0]);game.act(s,'claimPending');
  for(const action of ['sell','lock'])noChange(s,action,'waiting-iw');
  assert.deepEqual(s.inventory[0],item);
});

test('v028 audit: 116 permanent weapons including pending stay intact and five-slot departure remains possible',()=>{
  const raw=game.createGame(42),items=Array.from({length:116},(_,i)=>invested(`bound-${i}`,i===115));
  raw.equipment.weapon=items.shift();raw.pendingLoot=items.splice(-8);raw.inventory=items;
  const s=game.validateSave(raw);game.act(s,'saveGearSet','a');
  const before=copy(s),byId=new Map(held(s).map(i=>[i.id,copy(i)]));
  assert.equal(s.inventory.length,107);assert.equal(s.pendingLoot.length,8);
  game.act(s,'claimPending');assert.equal(s.inventory.length,115);assert.equal(s.pendingLoot.length,0);
  assert.equal(held(s).filter(loot.isSoulboundItem).length,116);assert.deepEqual(s.gearSets,before.gearSets);
  for(const item of held(s))assert.deepEqual(item,byId.get(item.id));
  assert.deepEqual(nonStorage(s),nonStorage(before));assert.doesNotThrow(()=>game.validateSave(s));
  game.act(s,'start');assert.equal(s.mode,'battle');
});

test('v028 audit: claim invalidates full-context binding consent without debit or changed anchors',()=>{
  const s=stateWithPending();s.inventory=[weapon('bind-target')];s.soulFragments=1000;
  const quote=game.previewSoulbindWeapon(s,'bind-target');assert.equal(quote.available,true);
  game.act(s,'claimPending');noChange(s,'soulbindWeapon',quote);
  assert.equal(s.soulFragments,1000);assert.ok(!s.inventory[0].soulbound);
  const fresh=game.previewSoulbindWeapon(s,'bind-target');assert.equal(fresh.available,true);
  assert.notEqual(fresh.quoteBasis,quote.quoteBasis);
});

test('v028 audit: pre-claim Item World and preset full-context quotes cannot be reused',()=>{
  const s=game.createGame(42);s.inventory=[invested('trial-target')];s.worldSeeds=2;
  game.act(s,'saveGearSet','a');game.act(s,'equip','trial-target');
  const trial=game.previewItemWorld(s,'trial-target'),preset=game.previewGearSet(s,'a');
  assert.equal(trial.available,true);assert.equal(preset.available,true);
  s.pendingLoot=[weapon('late-pending')];game.act(s,'claimPending');
  noChange(s,'enterItemWorld',trial);noChange(s,'applyGearSet',{id:'a',quoteBasis:preset.quoteBasis});
  assert.equal(s.worldSeeds,2);assert.equal(s.equipment.weapon.id,'trial-target');
});

test('v028 audit: selective sale quote stays scoped to chosen IDs, never silently includes newly claimed loot',()=>{
  const s=stateWithPending();s.inventory=[weapon('chosen-sale')];
  const quote=game.previewSelectedSale(s,['chosen-sale']);assert.equal(quote.available,true);
  game.act(s,'claimPending');const claimed=copy(s.inventory.find(i=>i.id==='pending-0'));
  const fresh=game.previewSelectedSale(s,['chosen-sale']);assert.equal(fresh.quoteBasis,quote.quoteBasis);
  game.act(s,'sellSelected',{ids:['chosen-sale'],quoteBasis:quote.quoteBasis});
  assert.deepEqual(s.inventory,[claimed]);assert.equal(s.hero.gold,quote.goldAfter);
});

test('v028 audit: no schema fields are added and exact v026 format3 reader retains claimed investment',async()=>{
  const source=await readFile(new URL('./fixtures/v0.26/engine.js',import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'),'60d0d46e7928078b911c266bb719b492ccc5f5b022f24a94ceafda1acd19159a');
  const s=stateWithPending();s.pendingLoot=[invested('old-reader-iw',true)];
  const keys=Object.keys(s).sort();game.act(s,'claimPending');assert.deepEqual(Object.keys(s).sort(),keys);assert.equal(s.version,3);
  const bytes=copy(s);assert.deepEqual(game.validateSave(bytes),old.validateSave(bytes));assert.deepEqual(s,bytes);
});

test('v028 audit: encounter topology preserves existing normal <=1 and IW <=2 overflow bounds',()=>{
  for(let stage=1;stage<=30;stage++){
    const waves=game.previewStage(stage).waves,nonboss=waves.flatMap(w=>w.enemies).filter(e=>!e.boss).length;
    assert.equal(nonboss,5);assert.equal(nonboss+1-(game.INVENTORY_LIMIT-115),1);
  }
  // Synthetic easy-enemy stepping observes the real five-wave IW topology. It
  // does not change/drop-search RNG or claim this is naturally earned strength.
  const s=game.createGame(42);s.equipment.weapon=invested('iw-topology');s.worldSeeds=1;
  s.inventory=Array.from({length:115},(_,i)=>weapon(`iw-room-${i}`));
  game.act(s,'enterItemWorld',game.previewItemWorld(s,'iw-topology'));
  let nonboss=0,observedWave=0,pulses=0;
  while(game.itemWorldView(s).active&&pulses++<1000){
    if(s.wave!==observedWave){observedWave=s.wave;nonboss+=s.enemies.filter(e=>!e.boss).length;}
    for(const e of s.enemies)if(e.hp>0){e.hp=1;e.attack=0;e.evade=0;e.parry=0;e.block=0;e.defense=0;}
    game.advance(s,.25);assert.ok(s.pendingLoot.length<=2);
  }
  assert.ok(pulses<1000);assert.equal(observedWave,5);assert.equal(nonboss,7);
  assert.equal(nonboss-(game.INVENTORY_LIMIT-115),2);assert.doesNotThrow(()=>game.validateSave(s));
});
