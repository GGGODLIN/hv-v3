import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, advance, act, stats, validateSave, resolveAttack, INVENTORY_LIMIT} from '../src/engine.js';

function runUntil(s, predicate, limit=240) {
  let elapsed=0;
  while (!predicate(s) && s.mode==='battle' && elapsed<limit) { advance(s,.1); elapsed+=.1; }
  return elapsed;
}
function firstClear(seed=1) {
  const s=createGame(seed); act(s,'start');
  runUntil(s,s=>s.wins>=1);
  assert.equal(s.wins,1,`seed ${seed} must clear starter expedition without manual heal`);
  return s;
}
const clone=x=>JSON.parse(JSON.stringify(x));

 test('acceptance: six seeds complete loot/equip/replay/progression loop',()=>{
  for(const seed of [1,2,3,42,123,999]) {
    const initial=createGame(seed), baseline=stats(initial);
    const s=firstClear(seed), firstTime=s.battle.elapsed;
    assert.ok(firstTime>=10&&firstTime<=90,`first clear ${firstTime}s seed${seed}`);
    assert.ok(s.inventory.length>=1);assert.ok(s.unlocked>=2);assert.ok(s.hero.level>1);
    act(s,'retreat');
    const weapon=s.inventory.filter(x=>x.slot==='weapon').sort((a,b)=>(b.stats.attack||0)-(a.stats.attack||0))[0];
    assert.ok(weapon,'first clear must offer a weapon for tangible equipment loop');
    const oldWeapon=s.equipment.weapon;act(s,'equip',weapon.id);
    assert.equal(s.equipment.weapon.id,weapon.id);assert.ok(s.inventory.some(x=>x.id===oldWeapon.id));
    assert.ok(stats(s).attack>baseline.attack);
    act(s,'start');runUntil(s,s=>s.wins===2);
    assert.equal(s.wins,2);assert.ok(s.battle.elapsed<firstTime,`seed${seed}: replay ${s.battle.elapsed}s vs ${firstTime}s`);
    act(s,'retreat');act(s,'selectStage',2);act(s,'start');runUntil(s,s=>s.wins===3);
    assert.equal(s.wins,3,`seed${seed} should clear next stage with first equipment upgrade`);
    for(const n of Object.values(stats(s)))assert.ok(Number.isFinite(n));
  }
 });
 test('acceptance: failed deep expedition recovers without losing earned inventory',()=>{
  const s=firstClear(1);act(s,'retreat');const ids=s.inventory.map(x=>x.id),gold=s.hero.gold;
  s.unlocked=30;act(s,'selectStage',30);act(s,'start');runUntil(s,s=>s.mode==='defeat');
  assert.equal(s.mode,'defeat');act(s,'retreat');assert.equal(s.mode,'town');
  assert.ok(s.hero.hp>0);assert.ok(s.hero.gold>=gold);for(const id of ids)assert.ok(s.inventory.some(x=>x.id===id));
  act(s,'selectStage',1);act(s,'start');assert.equal(s.mode,'battle');
 });
 test('acceptance: invalid commands and locked/equipped sale cannot lose equipment',()=>{
  const s=firstClear(2);act(s,'retreat');const item=s.inventory[0];act(s,'lock',item.id);
  const before=clone(s);act(s,'sell',item.id);act(s,'sell',s.equipment.weapon.id);act(s,'selectStage',NaN);act(s,'selectStage',10000);act(s,'equip','nonexistent');
  assert.deepEqual(s,before);act(s,'sellCommon');assert.ok(s.inventory.some(x=>x.id===item.id));
  act(s,'start');const equip=clone(s.equipment);act(s,'equip',item.id);assert.deepEqual(s.equipment,equip);
 });
 test('acceptance: storage limit prevents starting instead of discarding items',()=>{
  const s=createGame();const template=clone(s.equipment.weapon);s.inventory=Array.from({length:INVENTORY_LIMIT},(_,n)=>({...clone(template),id:`test-${n}`,locked:true}));
  act(s,'start');assert.equal(s.mode,'town');assert.equal(s.inventory.length,INVENTORY_LIMIT);act(s,'sellCommon');assert.equal(s.inventory.length,INVENTORY_LIMIT);
  const recovered=validateSave(clone(s));assert.equal(recovered.inventory.length,INVENTORY_LIMIT);
 });
 test('acceptance: save load safely returns town and preserves progress without offline gains',()=>{
  const s=firstClear(42);const encoded=clone(s), restored=validateSave(encoded);
  assert.equal(restored.mode,'town');assert.equal(restored.wins,s.wins);assert.equal(restored.hero.gold,s.hero.gold);assert.equal(restored.inventory.length,s.inventory.length);
  const idle=clone(restored);advance(restored,3600);assert.deepEqual(restored,idle);
  const a=createGame(10),b=createGame(10);act(a,'start');act(b,'start');advance(a,1e9);advance(b,2);assert.deepEqual(a,b);
 });
 test('acceptance: malformed imports reject unusable records and future duplicate IDs',()=>{
  for(const invalid of [null,[],{}, {version:999}])assert.throws(()=>validateSave(invalid));
  const cases=[
    s=>{s.hero.level=NaN},s=>{s.hero.gold=Infinity},s=>{s.inventory=[clone(s.equipment.weapon)]},
    s=>{s.equipment.weapon.stats.attack=-1},s=>{s.equipment.weapon.slot='armor'},
    s=>{s.pendingLoot=Array(9).fill(clone(s.equipment.weapon))},
    s=>{s.equipment.weapon.id='loot-9007199254740992'},
    s=>{s.equipment.weapon.id='loot-999999999999999999999999999999999999999999999999999999999999999999'},
  ];
  for(const mutate of cases){const s=createGame();mutate(s);assert.throws(()=>validateSave(s));}
 });
 test('acceptance: seeded simulations reproduce and event queues remain bounded',()=>{
  const a=createGame(34),b=createGame(34);act(a,'start');act(b,'start');
  for(let n=0;n<5000;n++){advance(a,.1);advance(b,.1)}
  assert.deepEqual(a,b);assert.ok(a.events.length<=30);assert.ok(a.logs.length<=30);
  assert.equal(new Set([...Object.values(a.equipment),...a.inventory,...a.pendingLoot].map(x=>x.id)).size,3+a.inventory.length+a.pendingLoot.length);
 });
 test('acceptance: partial block does not inherit evade-only no-critical rule',()=>{
  const values=[.9,.9,.9,.9,.1,.9,.1,.9,.5];let n=0;
  const r=resolveAttack({attack:100,crit:1,multiCrit:0},{block:.5},()=>values[n++]??.9);
  assert.equal(r.crit,1);assert.ok(r.damage>0);
 });
 test('acceptance: an accepted near-boundary item counter remains reloadable after loot',()=>{
  let s=createGame(1);s._itemId=999999999;s=validateSave(s);
  act(s,'start');runUntil(s,s=>s.wins===1);assert.equal(s.wins,1);
  assert.doesNotThrow(()=>validateSave(clone(s)));
  const ids=[...Object.values(s.equipment),...s.inventory,...s.pendingLoot].map(x=>x.id);
  assert.equal(new Set(ids).size,ids.length);
 });
