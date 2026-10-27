import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import * as previous from './fixtures/v0.26/engine.js';
import {generateItem,createCommissionWeapon,createSoulboundItem,isSoulboundItem} from '../src/loot.js';

// These bounded capacity/overflow fixtures are synthetic edge cases, not a
// claim that the player naturally earned 116 bound weapons or every drop.
const clone=structuredClone;
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const item=(id,slot='armor')=>({...generateItem(()=>.4,1,slot),id});
const held=s=>[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];
function ready(backpack=114,pending=3){
  const s=game.createGame(42);
  s.inventory=Array.from({length:backpack},(_,i)=>item(`held-${i}`));
  s.pendingLoot=Array.from({length:pending},(_,i)=>item(`pending-${i}`,i%2?'weapon':'armor'));
  return s;
}
function noop(s,payload){const before=clone(s);game.act(s,'claimPending',payload);assert.deepEqual(s,before);}
function killOneWithDrop(s){
  const enemy=s.enemies.find(enemy=>enemy.hp>0);assert.ok(enemy);
  enemy.hp=1;enemy.bleeding={stacks:1,expiresAtTick:s.timing.ticks+7,damagePerTick:1};
  // Synthetic forced-drop boundary, using the existing seeded RNG. No engine
  // drop formula or RNG function is replaced. 1972's first draw is < .01.
  s.seed=1972;s._clock=-10;s._enemyClock=-10;
  s.timing.tu=(s.timing.ticks+1)*100-.001;game.advance(s,.01);
}

test('pending view is pure, detached, frozen-safe and consumes no RNG',()=>{
  const s=freeze(ready()),before=clone(s),random=Math.random;
  Math.random=()=>{throw Error('view must not draw');};
  try{
    assert.deepEqual(game.pendingLootView(s),{count:3,freeSlots:6,claimable:3,available:true,reason:''});
    const view=game.pendingLootView(s);view.count=100;view.available=false;
    assert.equal(game.pendingLootView(s).count,3);assert.deepEqual(s,before);
  }finally{Math.random=random;}
});

test('claim moves original objects FIFO and changes only the two holding arrays',()=>{
  const s=ready(),before=clone(s),inventory=[...s.inventory],pending=[...s.pendingLoot],equipment=s.equipment;
  const result=game.act(s,'claimPending');assert.equal(result,s);
  assert.deepEqual(s,{...before,inventory:[...before.inventory,...before.pendingLoot],pendingLoot:[]});
  assert.equal(s.equipment,equipment);
  assert.deepEqual(s.inventory.map(i=>i.id),[...inventory,...pending].map(i=>i.id));
  for(let n=0;n<s.inventory.length;n++)assert.equal(s.inventory[n],[...inventory,...pending][n]);
  assert.equal(new Set(held(s).map(i=>i.id)).size,held(s).length);
  noop(s); // Repeated click cannot duplicate any item, event or reward.
});

test('partial claim fills only real free slots and preserves the remaining FIFO queue',()=>{
  const s=ready(117,8),before=clone(s),pending=[...s.pendingLoot];
  assert.equal(game.pendingLootView(s).claimable,3);game.act(s,'claimPending');
  assert.equal(s.inventory.length,120);assert.deepEqual(s.pendingLoot,before.pendingLoot.slice(3));
  pending.slice(0,3).forEach((entry,index)=>assert.equal(s.inventory[117+index],entry));
  pending.slice(3).forEach((entry,index)=>assert.equal(s.pendingLoot[index],entry));
  assert.equal(game.pendingLootView(s).available,false);noop(s);
  assert.doesNotThrow(()=>game.validateSave(s));
});

test('stale rendered capacity cannot overfill or select a different ordering',()=>{
  const s=ready(118,3),old=game.pendingLootView(s);assert.equal(old.claimable,2);
  s.inventory.push(item('newly-held'));game.act(s,'claimPending');
  assert.equal(s.inventory.length,120);assert.equal(s.inventory.at(-1).id,'pending-0');
  assert.deepEqual(s.pendingLoot.map(i=>i.id),['pending-1','pending-2']);noop(s);
});

test('camp-only action refuses battle, intermission and defeat without even logging',()=>{
  for(const [mode,phase] of [['battle','fight'],['battle','intermission'],['defeat','idle']]){
    const s=ready();s.mode=mode;s._phase=phase;
    assert.equal(game.pendingLootView(s).available,false);noop(s);
  }
});

test('empty and full queues and submitted IDs/counts are exact no-ops',()=>{
  for(const s of [ready(114,0),ready(120,3)])noop(s);
  for(const payload of [null,false,0,1,'pending-0',[],{}, {count:1}, {ids:['pending-0']}])noop(ready(),payload);
  const s=ready(),before=clone(s);game.act(s,'claimPendingLoot');assert.deepEqual(s,before);
});

test('malformed container sizes and read-only state slots refuse without partial movement',()=>{
  for(const mutate of [s=>{s.inventory=null;},s=>{s.pendingLoot={};},s=>{s.inventory=Array(121);},s=>{s.pendingLoot=Array(9);}]){
    const s=ready();mutate(s);assert.equal(game.pendingLootView(s).available,false);noop(s);
  }
  assert.equal(game.pendingLootView(null).available,false);
  for(const field of ['inventory','pendingLoot']){
    const s=ready();Object.defineProperty(s,field,{writable:false});noop(s);
  }
  noop(freeze(ready()));
});

test('supported saved pending plus free slots is recoverable without an unrelated sale or retreat',()=>{
  const raw=ready(112,3),original=clone(raw),s=game.validateSave(raw),before=clone(s);
  assert.deepEqual(raw,original);assert.equal(s.pendingLoot.length,3);
  game.act(s,'start');assert.equal(s.mode,'town');
  const startLogs=clone(s.logs);game.act(s,'claimPending');
  assert.equal(s.pendingLoot.length,0);assert.equal(s.inventory.length,115);assert.deepEqual(s.logs,startLogs);
  assert.equal(s.hero.gold,before.hero.gold);assert.equal(s.soulFragments,before.soulFragments);assert.equal(s.worldSeeds,before.worldSeeds);
  game.act(s,'start');assert.equal(s.mode,'battle');
});

test('116 permanent weapons including pending recover with anchors and locks unchanged',()=>{
  const s=game.createGame(42),weapons=Array.from({length:116},(_,i)=>createSoulboundItem({...createCommissionWeapon('rapier',1),id:`bound-${i}`},1));
  s.equipment.weapon=weapons.shift();s.pendingLoot=weapons.splice(-1);s.inventory=weapons;
  const loaded=game.validateSave(s),before=held(loaded),pending=loaded.pendingLoot[0],anchor=pending.soulbound;
  assert.equal(loaded.inventory.length,114);assert.equal(game.previewSafeSale(loaded).items.length,0);
  game.act(loaded,'claimPending');assert.equal(loaded.inventory.at(-1),pending);assert.equal(pending.soulbound,anchor);
  assert.equal(held(loaded).filter(isSoulboundItem).length,116);assert.ok(held(loaded).filter(isSoulboundItem).every(i=>i.locked));
  assert.deepEqual(new Map(held(loaded).map(i=>[i.id,i])),new Map(before.map(i=>[i.id,i])));
  game.act(loaded,'start');assert.equal(loaded.mode,'battle');assert.equal(loaded.inventory.length,115);
});

test('ordinary maximum six drops preserve the queued guarantee and truthful destination log',()=>{
  const s=ready(115,0),before=clone(s);game.act(s,'start');
  while(s.mode==='battle'&&s._phase==='fight')killOneWithDrop(s);
  assert.equal(s.wins,1);assert.equal(s.kills,6);assert.equal(s.inventory.length,120);assert.equal(s.pendingLoot.length,1);
  assert.equal(held(s).length,held(before).length+6);assert.equal(new Set(held(s).map(i=>i.id)).size,held(s).length);
  assert.equal(s.pendingLoot[0].slot,'weapon');assert.match(s.logs.find(line=>line.includes('保底裝備')),/保底裝備已保留於待領區/);
  assert.equal(s.mode,'town');assert.equal(s.soulFragments,10);assert.equal(s.worldSeeds,1);
  assert.doesNotThrow(()=>game.validateSave(s));noop(s);
  const terminal=clone(s);game.advance(s,2);assert.deepEqual(s,terminal);
});

test('Item World maximum seven ordinary drops preserve two queued items and invested target',()=>{
  const raw=ready(115,0);raw.hero.level=15;raw.worldSeeds=1;
  const s=game.validateSave(raw);s.equipment.weapon=createSoulboundItem({...createCommissionWeapon('rapier',1),id:'invested-target'},15);
  const anchor=s.equipment.weapon.soulbound,heldBefore=held(s).length,quote=game.previewItemWorld(s,'invested-target');assert.ok(quote.available,quote.reason);
  game.act(s,'enterItemWorld',quote);while(game.itemWorldView(s).active)killOneWithDrop(s);
  assert.equal(s.kills,8);assert.equal(s.wins,0);assert.equal(s.worldSeeds,0);assert.equal(s.soulFragments,0);
  assert.equal(s.inventory.length,120);assert.equal(s.pendingLoot.length,2);assert.equal(held(s).length,heldBefore+7);
  assert.equal(s.equipment.weapon.id,'invested-target');assert.deepEqual(s.equipment.weapon.soulbound,anchor);assert.equal(s.equipment.weapon.itemWorld.level,1);
  assert.doesNotThrow(()=>game.validateSave(s));noop(s);
});

test('sale still automatically refills the existing queue and manual claim never broadens selected disposal',()=>{
  const s=ready(120,2),pending=[...s.pendingLoot];
  game.act(s,'sell','held-0');assert.equal(s.inventory.length,120);assert.equal(s.inventory.at(-1),pending[0]);assert.equal(s.pendingLoot[0],pending[1]);
  game.act(s,'sell','held-1');assert.equal(s.inventory.at(-1),pending[1]);assert.equal(s.pendingLoot.length,0);
  const after=clone(s);game.act(s,'claimPending');assert.deepEqual(s,after);
});

test('no-overflow normal runs retain exact v0.26 state RNG events logs and reports',()=>{
  let pulses=0;
  for(const strategy of ['balanced','assault','sustain'])for(const seed of [1,29,77]){
    const current=game.createGame(seed),old=previous.createGame(seed);
    game.act(current,'setStrategy',strategy);previous.act(old,'setStrategy',strategy);
    game.act(current,'start');previous.act(old,'start');
    for(let n=0;n<500&&current.wins<2&&current.mode==='battle';n++){
      game.advance(current,.25);previous.advance(old,.25);pulses++;
      assert.deepEqual(current,old,`${seed}/${strategy}/${n}`);
      assert.deepEqual(game.expeditionReports(current),previous.expeditionReports(old));
    }
    assert.equal(current.wins,2);assert.equal(current.pendingLoot.length,0);
  }
  assert.ok(pulses>1000);
});
