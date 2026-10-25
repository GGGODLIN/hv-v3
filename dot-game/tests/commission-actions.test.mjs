import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,advance,previewWeaponCommission,previewSafeSale,validateSave,INVENTORY_LIMIT} from '../src/engine.js';
import {createCommissionWeapon,itemSalePrice,resolveWeaponFamily} from '../src/loot.js';

const families=['axe','rapier','club'];
const clone=value=>JSON.parse(JSON.stringify(value));
function freezeDeep(value){if(value&&typeof value==='object'){Object.values(value).forEach(freezeDeep);Object.freeze(value);}return value;}
function ready(level=7){const s=createGame(42);s.wins=1;s.hero.level=level;s.hero.gold=100000;return s;}
function request(offer){return {family:offer.family,quoteBasis:offer.quoteBasis};}
function withoutLogs(s){const copy=clone(s);delete copy.logs;return copy;}
function held(id){return {...createCommissionWeapon('axe',3),id};}
function rejects(s,payload){const before=withoutLogs(s);assert.equal(act(s,'commissionWeapon',payload),s);assert.deepEqual(withoutLogs(s),before);assert.match(s.logs[0],/委託取消.*未扣款或交付|委託取消.*未扣款/);}

test('commission preview is frozen-input safe, detached, exact and entirely RNG/state/log free',()=>{
  const s=freezeDeep(ready()),before=clone(s),originalRandom=Math.random;
  Math.random=()=>{throw Error('commission cannot draw random numbers');};
  try {
    for(const family of families){
      const offer=previewWeaponCommission(s,family);
      assert.equal(offer.available,true);assert.equal(offer.reason,'');
      assert.equal(offer.price,Math.max(250,4*itemSalePrice(offer.item)));
      assert.equal(offer.goldAfter,s.hero.gold-offer.price);
      assert.deepEqual(offer.item,{...createCommissionWeapon(family,7),id:'loot-1'});
      assert.deepEqual(offer.currentWeapon,s.equipment.weapon);
      assert.deepEqual(previewWeaponCommission(s,family),offer);
      assert.equal(typeof offer.quoteBasis,'string');
      offer.item.stats.attack=999999;offer.item.rolls.attack=0;offer.item.locked=false;
      offer.currentWeapon.stats.attack=0;offer.currentWeapon.name='changed';
      offer.price=0;offer.goldAfter=0;offer.quoteBasis='changed';
      assert.deepEqual(s,before);
      assert.deepEqual(previewWeaponCommission(s,family).item,{...createCommissionWeapon(family,7),id:'loot-1'});
    }
  } finally {Math.random=originalRandom;}
});

test('same family and hero level keep the exact offer on reopening and supported save reload',()=>{
  const s=ready(),before=clone(s);
  for(const family of families){
    const offer=previewWeaponCommission(s,family);
    assert.deepEqual(previewWeaponCommission(validateSave(clone(s)),family).item,offer.item);
    assert.equal(previewWeaponCommission(validateSave(clone(s)),family).price,offer.price);
  }
  assert.deepEqual(s,before);
  // ID prediction follows existing live IDs, not generator IDs, clocks or seeds.
  const other=ready();other.seed=7;other._clock=100;other.timing.ticks=123;
  assert.deepEqual(previewWeaponCommission(other,'axe').item,previewWeaponCommission(s,'axe').item);
});

test('invalid family/level/state is unavailable and preview does not repair or mutate it',()=>{
  for(const family of [undefined,null,'','sword','AXE',1,{},[],new String('axe')]){
    const s=ready(),before=clone(s),offer=previewWeaponCommission(s,family);
    assert.equal(offer.available,false);assert.equal(offer.item,null);assert.equal(offer.quoteBasis,null);assert.deepEqual(s,before);
  }
  for(const level of [0,501,7.5,NaN,Infinity,'7']){const s=ready();s.hero.level=level;assert.equal(previewWeaponCommission(s,'axe').item,null);}
  for(const s of [undefined,null,{},[],{hero:{level:7}}])assert.equal(previewWeaponCommission(s,'axe').available,false);
  for(const mutate of [s=>s.hero.gold=-1,s=>s.hero.gold=Infinity,s=>s.hero.gold=1e12+1,s=>s._itemId=-1,s=>s._itemId=1.5,s=>s._itemId=1e9+1,s=>s.wins=NaN,s=>s.inventory=null,s=>s.pendingLoot=null,s=>s.equipment.weapon.futureProc=true]){
    const s=ready();mutate(s);assert.equal(previewWeaponCommission(s,'axe').item,null);
  }
});

test('first clear, camp, balance and capacity reasons are exact and do not hide valid specifications',()=>{
  const s=ready();s.wins=0;
  let offer=previewWeaponCommission(s,'rapier');assert.equal(offer.available,false);assert.match(offer.reason,/首次遠征/);assert.equal(offer.item.weaponFamily,'rapier');
  s.wins=1;
  for(const mode of ['battle','defeat']){s.mode=mode;offer=previewWeaponCommission(s,'rapier');assert.equal(offer.available,false);assert.match(offer.reason,/回營/);}
  s.mode='town';s.hero.gold=0;offer=previewWeaponCommission(s,'rapier');assert.match(offer.reason,/金幣不足/);assert.equal(offer.goldAfter,-offer.price);
  s.hero.gold=offer.price;assert.equal(previewWeaponCommission(s,'rapier').available,true);
});

test('one accepted purchase debits exactly once, allocates one ordinary locked item and never equips',()=>{
  for(const family of families){
    const s=ready(),offer=previewWeaponCommission(s,family),before=clone(s),payload=request(offer);
    // Returned data is not the authoritative transaction source.
    offer.item.stats.attack=999999;offer.item.locked=false;offer.price=1;offer.goldAfter=1;
    const canonical=previewWeaponCommission(s,family);
    assert.equal(act(s,'commissionWeapon',payload),s);
    assert.equal(s.hero.gold,before.hero.gold-canonical.price);assert.equal(s._itemId,1);
    assert.deepEqual(s.inventory,[canonical.item]);assert.equal(s.inventory[0].locked,true);
    assert.deepEqual(s.equipment,before.equipment);assert.equal(s.seed,before.seed);
    const changes=clone(s);changes.hero.gold=before.hero.gold;changes._itemId=before._itemId;
    changes.inventory=before.inventory;changes.logs=before.logs;changes.events=before.events;changes._eventId=before._eventId;
    assert.deepEqual(changes,before,'only debit, allocation, insertion and bounded feedback change');
    assert.match(s.logs[0],/已鎖定.*尚未裝備/);
    rejects(s,payload);
  }
});

test('exact-price purchase reaches zero without negative gold, and fresh consent allows an intentional second purchase',()=>{
  const s=ready(),price=previewWeaponCommission(s,'club').price;s.hero.gold=price;
  let offer=previewWeaponCommission(s,'club');act(s,'commissionWeapon',request(offer));assert.equal(s.hero.gold,0);
  rejects(s,request(offer));
  s.hero.gold=price*2;offer=previewWeaponCommission(s,'club');act(s,'commissionWeapon',request(offer));
  assert.equal(s.hero.gold,price);assert.deepEqual(s.inventory.map(item=>item.id),['loot-1','loot-2']);
  assert.equal(s.inventory.length,2);
});

test('missing, malformed, forged and accessor payloads cannot debit or allocate',()=>{
  const offer=previewWeaponCommission(ready(),'axe');
  const invalid=[undefined,null,false,'axe',[],['axe',offer.quoteBasis],{}, {family:'axe'}, {quoteBasis:offer.quoteBasis},
    {family:'sword',quoteBasis:offer.quoteBasis},{family:1,quoteBasis:offer.quoteBasis},{family:'axe',quoteBasis:0},
    {family:'axe',quoteBasis:{}},{family:'axe',quoteBasis:''},{family:'axe',quoteBasis:'x'.repeat(8193)},
    {...request(offer),price:1},{...request(offer),item:offer.item},{...request(offer),goldAfter:0},
    {...request(offer),[Symbol('extra')]:true},Object.create(request(offer))];
  let reads=0;
  for(const key of ['family','quoteBasis']){
    const payload=request(offer);Object.defineProperty(payload,key,{enumerable:true,get(){reads++;throw Error('do not run imported getter');}});invalid.push(payload);
  }
  for(const payload of invalid)rejects(ready(),payload);
  assert.equal(reads,0);
  const s=ready();act(s,'commissionWeapon',Object.assign(Object.create(null),request(previewWeaponCommission(s,'axe'))));assert.equal(s.inventory.length,1);
});

test('all quoted purchase and displayed-comparison changes invalidate consent before mutation',()=>{
  const mutations=[
    s=>s.hero.level++,s=>s.hero.gold++,s=>s.hero.gold--,s=>s._itemId++,
    s=>s.equipment.weapon.id='replacement',s=>s.equipment.weapon.name+=' changed',
    s=>s.equipment.weapon.stats.attack++,s=>s.equipment.weapon.stats.crit=.02,
    s=>s.equipment.weapon.weaponFamily='club',s=>s.equipment.weapon.locked=false,
    s=>s.equipment.weapon.roll++,s=>s.equipment.weapon.description+=' changed',
    s=>s.inventory.push(held('loot-1')),
  ];
  for(const mutate of mutations){const s=ready(),payload=request(previewWeaponCommission(s,'axe'));mutate(s);rejects(s,payload);}
  const s=ready(),offer=previewWeaponCommission(s,'axe'),basis=JSON.parse(offer.quoteBasis);
  basis[5]=1;rejects(s,{family:'axe',quoteBasis:JSON.stringify(basis)});
  rejects(s,{family:'club',quoteBasis:offer.quoteBasis});
  s._eventId++;s.logs.unshift('unrelated UI feedback');
  act(s,'commissionWeapon',request(offer));assert.equal(s.inventory.length,1,'irrelevant feedback is not purchase state');
});

test('state becoming unavailable after preview rejects the whole purchase without partial delivery',()=>{
  for(const mutate of [s=>s.mode='battle',s=>s.mode='defeat',s=>s.wins=0,s=>s.hero.gold=0,
    s=>s.inventory=Array.from({length:115},(_,i)=>held(`old-${i}`)),s=>s.pendingLoot=[held('pending')]]){
    const s=ready(),payload=request(previewWeaponCommission(s,'axe'));mutate(s);rejects(s,payload);
  }
});

test('purchase leaves five expedition slots; full/reserved bags and pending delivery never accept payment',()=>{
  const s=ready();s.inventory=Array.from({length:114},(_,i)=>held(`old-${i}`));
  act(s,'commissionWeapon',request(previewWeaponCommission(s,'axe')));
  assert.equal(s.inventory.length,INVENTORY_LIMIT-5);assert.equal(s.pendingLoot.length,0);
  act(s,'start');assert.equal(s.mode,'battle','the original five-slot start reserve remains usable');
  for(const count of [115,116,119,120]){
    const full=ready();full.inventory=Array.from({length:count},(_,i)=>held(`old-${i}`));
    const offer=previewWeaponCommission(full,'axe');assert.equal(offer.available,false);assert.match(offer.reason,/6 格.*5 格/);rejects(full,request(offer));
  }
  const pending=ready();pending.pendingLoot=[held('pending')];
  const offer=previewWeaponCommission(pending,'axe');assert.match(offer.reason,/待領戰利品/);rejects(pending,request(offer));
});

test('preview and commit mirror the original collision-safe wrap, without changing old item IDs',()=>{
  for(const counter of [0,999999999,1e9]){
    const s=ready();s._itemId=counter;s.equipment.weapon.id='loot-1';s.inventory=[held('loot-2')];
    const offer=previewWeaponCommission(s,'club');assert.equal(offer.item.id,'loot-3');assert.equal(s._itemId,counter);
    act(s,'commissionWeapon',request(offer));assert.equal(s._itemId,3);
    assert.deepEqual(s.inventory.map(item=>item.id),['loot-2','loot-3']);assert.equal(s.equipment.weapon.id,'loot-1');
    assert.equal(validateSave(clone(s)).inventory[1].id,'loot-3');
  }
  const s=ready();s._itemId=999999998;
  const offer=previewWeaponCommission(s,'axe');assert.equal(offer.item.id,'loot-999999999');
  act(s,'commissionWeapon',request(offer));assert.equal(s._itemId,999999999);
  assert.equal(previewWeaponCommission(s,'axe').item.id,'loot-1');
});

test('duplicate IDs and ID/current-weapon accessors fail closed without evaluating item getters',()=>{
  for(const location of ['inventory','equipment','pendingLoot']){
    const s=ready(),duplicate=clone(s.equipment.weapon);
    if(location==='equipment')s.equipment.armor=duplicate;else s[location].push(duplicate);
    assert.equal(previewWeaponCommission(s,'axe').item,null);
  }
  for(const location of ['inventory','equipment','pendingLoot']){
    const s=ready(),item=held('unsupported');let reads=0;
    Object.defineProperty(item,'id',{enumerable:true,get(){reads++;throw Error('do not read item getter');}});
    if(location==='equipment')s.equipment.weapon=item;else s[location].push(item);
    assert.equal(previewWeaponCommission(s,'axe').item,null);assert.equal(reads,0);
  }
  for(const field of ['name','stats','locked']){
    const s=ready();let reads=0;
    Object.defineProperty(s.equipment.weapon,field,{enumerable:true,get(){reads++;throw Error('do not read current-weapon getter');}});
    assert.equal(previewWeaponCommission(s,'axe').item,null);assert.equal(reads,0);
  }
});

test('repeat consent remains invalid after restoring the quoted balance or selling the first item',()=>{
  const s=ready(),offer=previewWeaponCommission(s,'rapier'),balance=s.hero.gold;
  act(s,'commissionWeapon',request(offer));s.hero.gold=balance;rejects(s,request(offer));
  const id=s.inventory[0].id;act(s,'lock',id);act(s,'sell',id);s.hero.gold=balance;
  assert.equal(s.inventory.length,0);rejects(s,request(offer));assert.equal(s._itemId,1);
});

test('commission delivery is locked, survives all sale paths, and resale remains an explicit losing transaction',()=>{
  for(const family of families){
    const s=ready();act(s,'setAutoSell',true);const offer=previewWeaponCommission(s,family),gold=s.hero.gold;
    act(s,'commissionWeapon',request(offer));const purchased=clone(s.inventory[0]);
    assert.equal(previewSafeSale(s).items.length,0);act(s,'sell',purchased.id);act(s,'sellCommon');act(s,'sellSafe',{ids:[purchased.id]});
    assert.deepEqual(s.inventory,[purchased]);assert.equal(s.hero.gold,gold-offer.price);
    act(s,'lock',purchased.id);act(s,'sell',purchased.id);
    assert.equal(s.inventory.length,0);assert.equal(s.hero.gold,gold-offer.price+itemSalePrice(purchased));
    assert.ok(s.hero.gold<gold);assert.ok(itemSalePrice(purchased)<=offer.price/4);
  }
});

test('all 1500 ordinary catalog purchases roundtrip strict saves with locks, identity and no durable new fields',()=>{
  for(let level=1;level<=500;level++)for(const family of families){
    const s=ready(level),rootKeys=Object.keys(s).sort(),offer=previewWeaponCommission(s,family);
    act(s,'commissionWeapon',request(offer));
    const loaded=validateSave(clone(s));assert.deepEqual(loaded.inventory,s.inventory);
    assert.equal(loaded.hero.gold,s.hero.gold);assert.equal(loaded.inventory[0].locked,true);
    assert.equal(resolveWeaponFamily(loaded.inventory[0]),family);
    assert.deepEqual(Object.keys(s).sort(),rootKeys);assert.deepEqual(Object.keys(loaded).sort(),rootKeys);
    assert.ok(itemSalePrice(offer.item)<=offer.price/4);
    assert.deepEqual(previewWeaponCommission(loaded,family).item,previewWeaponCommission(s,family).item);
  }
});

test('frequent unopened/unbought previews preserve seeded default expedition trajectories byte for byte',()=>{
  for(const seed of [1,2,3,42,123,999]){
    const plain=createGame(seed),viewed=createGame(seed);act(plain,'start');act(viewed,'start');
    for(let i=0;i<2000&&plain.wins<2&&plain.mode==='battle';i++){
      for(const family of families)previewWeaponCommission(viewed,family);
      advance(plain,.5);advance(viewed,.5);
    }
    assert.equal(plain.wins,2);assert.deepEqual(viewed,plain);
  }
});
