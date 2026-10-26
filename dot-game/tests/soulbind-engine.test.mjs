import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import * as legacy from './fixtures/v0.21/engine.js';
import {createCommissionWeapon,createSoulboundItem,scaleSoulboundItem,isSoulboundItem,itemSalePrice,soulbindCost,scoreItem,generateItem} from '../src/loot.js';

const copy=structuredClone;
const slots=['weapon','armor','accessory'];
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const weapon=(id='loot-1',family='axe',level=3)=>({...createCommissionWeapon(family,level),id});
function ready(){const s=game.createGame(42);s.hero.level=7;s.soulFragments=1000;s.inventory=[weapon()];s._itemId=1;return s;}
function bind(s,id=s.inventory[0].id){const quote=game.previewSoulbindWeapon(s,id);assert.equal(quote.available,true,quote.reason);game.act(s,'soulbindWeapon',quote);return quote;}
function noChange(s,action,payload){const before=copy(s);assert.equal(game.act(s,action,payload),s);assert.deepEqual(s,before);}
function pulseUntil(s,predicate,max=60000){for(let i=0;i<max&&!predicate(s);i++){game.advance(s,.25);if(s.mode==='defeat')game.act(s,'start');}assert.ok(predicate(s),'bounded simulation reached its condition');}
function earnWins(s,count){if(s.mode!=='battle')game.act(s,'start');pulseUntil(s,state=>state.wins>=count);}
function killForXp(s){game.act(s,'start');s.enemies=[{id:'level-test',name:'Level test',hp:1,maxHp:1,attack:0,defense:0,evade:0,parry:0,block:0}];pulseUntil(s,x=>x.kills>0,100);}

test('schema v2 owns bounded fragments; old saves migrate zero without retrospective wins',()=>{
 assert.equal(game.VERSION,2);assert.equal(game.SOUL_FRAGMENT_LIMIT,1e9);assert.equal(game.SOUL_FRAGMENTS_PER_WIN,10);
 const fresh=game.createGame();assert.equal(fresh.soulFragments,0);assert.equal(fresh.version,2);
 const old=legacy.createGame(123);old.wins=500;old.kills=1234;const before=copy(old);
 const loaded=game.validateSave(old);assert.equal(loaded.version,2);assert.equal(loaded.soulFragments,0);assert.equal(loaded.wins,500);assert.deepEqual(old,before);
 assert.throws(()=>legacy.validateSave(copy(fresh)),'even a fragment-only v2 save must not be accepted by v1');
 for(const value of [0,1,100,1e9]){const s=game.createGame();s.soulFragments=value;assert.equal(game.validateSave(copy(s)).soulFragments,value);}
});

test('version/currency descriptors, missing v2 currency, nonintegers and legacy new fields fail closed',()=>{
 for(const value of [undefined,null,false,'10',-1,1.5,NaN,Infinity,1e9+1]){const s=game.createGame();s.soulFragments=value;assert.throws(()=>game.validateSave(s));}
 const absent=game.createGame();delete absent.soulFragments;assert.throws(()=>game.validateSave(absent));
 for(const version of [0,3,'2',null]){const s=game.createGame();s.version=version;assert.throws(()=>game.validateSave(s));}
 for(const fragments of [0,100]){const s=legacy.createGame();s.soulFragments=fragments;assert.throws(()=>game.validateSave(s));}
 let reads=0;
 for(const key of ['soulFragments','version','hero','inventory']){const s=game.createGame();Object.defineProperty(s,key,{enumerable:true,get(){reads++;throw Error('must not run');}});assert.throws(()=>game.validateSave(s));}
 for(const mutate of [s=>Object.defineProperty(s,'soulFragments',{value:0,enumerable:false}),s=>{delete s.soulFragments;Object.setPrototypeOf(s,{soulFragments:0});}]){const s=game.createGame();mutate(s);assert.throws(()=>game.validateSave(s));}
 assert.equal(reads,0);
});

test('preview is frozen-input safe, detached, exact and contains no RNG or side effects',()=>{
 const s=freeze(ready()),before=copy(s),random=Math.random;Math.random=()=>{throw Error('RNG forbidden');};
 try{const q=game.previewSoulbindWeapon(s,'loot-1');assert.equal(q.available,true);assert.equal(q.cost,100);assert.equal(q.fragmentsAfter,900);assert.deepEqual(q.before,s.inventory[0]);assert.deepEqual(q.after,createSoulboundItem(s.inventory[0],7));
  assert.deepEqual(Object.keys(q).sort(),['id','available','reason','cost','fragmentsAfter','before','after','quoteBasis'].sort());
  q.before.stats.attack=0;q.after.stats.attack=999;q.after.soulbound.stats.attack=999;
  assert.deepEqual(s,before);assert.deepEqual(game.previewSoulbindWeapon(s,'loot-1').after,createSoulboundItem(s.inventory[0],7));
 }finally{Math.random=random;}
});

test('only town-owned supported weapons can bind, with exact unavailable quotes for balance/town',()=>{
 for(const location of ['inventory','equipment']){const s=ready();if(location==='equipment'){s.equipment.weapon=s.inventory.pop();}assert.equal(game.previewSoulbindWeapon(s,'loot-1').available,true);}
 const poor=ready();poor.soulFragments=99;const q=game.previewSoulbindWeapon(poor,'loot-1');assert.equal(q.available,false);assert.equal(q.cost,100);assert.equal(q.fragmentsAfter,-1);assert.ok(q.after);assert.match(q.reason,/不足/);noChange(poor,'soulbindWeapon',q);
 for(const mode of ['battle','defeat','intermission','other']){const s=ready();s.mode=mode;const q=game.previewSoulbindWeapon(s,'loot-1');assert.equal(q.available,false);assert.equal(q.cost,100);assert.match(q.reason,/回營/);noChange(s,'soulbindWeapon',q);}
 for(const mutate of [s=>s.pendingLoot.push(s.inventory.pop()),s=>s.inventory[0].weaponFamily='sword',s=>s.inventory[0].level=8,s=>s.inventory[0].name='Unknown',s=>s.inventory[0].future=1]){const s=ready();mutate(s);assert.equal(game.previewSoulbindWeapon(s,'loot-1').available,false);}
 for(const id of [undefined,null,1,'','missing','starter-weapon','starter-armor'])assert.equal(game.previewSoulbindWeapon(ready(),id).available,false);
});

test('success spends exactly once, replaces only the owned item and preserves immutable source anchor',()=>{
 for(const location of ['inventory','equipment']){const s=ready();if(location==='equipment')s.equipment.weapon=s.inventory.pop();const before=copy(s),q=bind(s,'loot-1');
  assert.equal(s.soulFragments,900);const bound=location==='inventory'?s.inventory[0]:s.equipment.weapon;
  assert.deepEqual(bound,q.after);assert.equal(bound.id,'loot-1');assert.equal(bound.level,7);assert.ok(isSoulboundItem(bound));assert.ok(Object.isFrozen(bound.soulbound));assert.ok(Object.isFrozen(bound.soulbound.stats));
  assert.deepEqual(bound.soulbound,{version:1,level:3,stats:q.before.stats});
  assert.deepEqual(bound.rolls,q.before.rolls);assert.equal(bound.prefix,q.before.prefix);assert.equal(bound.suffix,q.before.suffix);
  const normalized=copy(s);normalized.soulFragments=before.soulFragments;normalized.inventory=before.inventory;normalized.equipment=before.equipment;normalized.logs=before.logs;assert.deepEqual(normalized,before);
  noChange(s,'soulbindWeapon',q);s.soulFragments=1000;noChange(s,'soulbindWeapon',q);
  assert.match(s.logs[0],/靈魂綁定.*永久鎖定.*不可出售/);
 }
 const exact=ready();exact.soulFragments=100;bind(exact);assert.equal(exact.soulFragments,0);
});

test('complete quote comparison refuses missing, extra, changed and executable confirmation fields',()=>{
 const q=game.previewSoulbindWeapon(ready(),'loot-1');
 for(const payload of [undefined,null,false,[],{},'loot-1',{id:q.id,quoteBasis:q.quoteBasis},{...q,extra:true},{...q,cost:0},{...q,fragmentsAfter:1000},{...q,available:false},{...q,reason:'forged'},{...q,id:'starter-weapon'},{...q,quoteBasis:q.quoteBasis+'x'},{...q,after:{...q.after,locked:false}},{...q,[Symbol('bad')]:1},Object.create(q)])noChange(ready(),'soulbindWeapon',payload);
 for(const field of Object.keys(q)){const payload=copy(q);delete payload[field];noChange(ready(),'soulbindWeapon',payload);}
 let reads=0;
 for(const field of ['id','quoteBasis','before','after']){const payload=copy(q);Object.defineProperty(payload,field,{enumerable:true,get(){reads++;throw Error('no getter');}});noChange(ready(),'soulbindWeapon',payload);}
 const nested=copy(q);Object.defineProperty(nested.after.soulbound.stats,'attack',{enumerable:true,get(){reads++;return 1;}});noChange(ready(),'soulbindWeapon',nested);assert.equal(reads,0);
 const s=ready();const reordered=Object.fromEntries(Object.entries(game.previewSoulbindWeapon(s,'loot-1')).reverse());game.act(s,'soulbindWeapon',JSON.parse(JSON.stringify(reordered)));assert.equal(s.soulFragments,900);
});

test('every material hero, item, inventory, equipment, preset or balance change invalidates consent atomically',()=>{
 const mutations=[s=>s.hero.level++,s=>s.hero.xp++,s=>s.hero.hp--,s=>s.hero.gold++,s=>s.hero.attributes.str++,s=>s.soulFragments++,s=>s.soulFragments--,
  s=>s.inventory[0].stats.attack++,s=>s.inventory[0].power++,s=>s.inventory[0].id='loot-2',s=>s.inventory[0].name+='x',s=>s.inventory[0].locked=false,s=>s.inventory[0].roll++,s=>s.inventory[0].rolls.attack++,s=>s.inventory[0].description+='x',
  s=>s.inventory.push(weapon('loot-2')),s=>s.pendingLoot.push(weapon('loot-2')),s=>s.equipment.armor.stats.hp++,s=>s.equipment.accessory.description+='x',s=>game.act(s,'saveGearSet','a'),s=>game.act(s,'learnAbility','hp-tank')];
 for(const mutate of mutations){const s=ready(),q=game.previewSoulbindWeapon(s,'loot-1');mutate(s);noChange(s,'soulbindWeapon',q);}
 const s=ready(),q=game.previewSoulbindWeapon(s,'loot-1');s.logs.unshift('unrelated display feedback');s.seed++;s._eventId++;game.act(s,'soulbindWeapon',q);assert.equal(s.soulFragments,900,'unrelated feedback/RNG is not purchase context');
});

test('preview and confirmation never invoke getters in root, hero, item, arrays or presets',()=>{
 const locations=[s=>s,s=>s.hero,s=>s.inventory[0],s=>s.inventory[0].stats,s=>s.equipment,s=>s.inventory,s=>s.pendingLoot];
 const keys=['soulFragments','level','name','attack','weapon','0','0'];let calls=0;
 for(let i=0;i<locations.length;i++){const s=ready(),q=game.previewSoulbindWeapon(s,'loot-1'),record=locations[i](s);Object.defineProperty(record,keys[i],{enumerable:true,configurable:true,get(){calls++;throw Error('no getter');}});
  assert.equal(game.previewSoulbindWeapon(s,'loot-1').available,false);game.act(s,'soulbindWeapon',q);
 }
 const s=ready();game.act(s,'saveGearSet','a');const q=game.previewSoulbindWeapon(s,'loot-1');Object.defineProperty(s.gearSets.a,'weapon',{enumerable:true,get(){calls++;return 'starter-weapon';}});assert.equal(game.previewSoulbindWeapon(s,'loot-1').available,false);game.act(s,'soulbindWeapon',q);assert.equal(calls,0);
});

test('bound locks are irreversible and every sale path independently excludes their metadata',()=>{
 const s=ready();bind(s);const bound=copy(s.inventory[0]),gold=s.hero.gold;
 noChange(s,'lock',bound.id);game.act(s,'sell',bound.id);game.act(s,'sellCommon');game.act(s,'sellSelected',{ids:[bound.id],quoteBasis:'x'});game.act(s,'sellSafe',{ids:[bound.id]});
 assert.deepEqual(s.inventory,[bound]);assert.equal(s.hero.gold,gold);assert.equal(itemSalePrice(s.inventory[0]),0);assert.deepEqual(game.previewSafeSale(s).items,[]);assert.equal(game.previewSelectedSale(s,[bound.id]).available,false);
 // The explicit metadata guard still protects a corrupt live lock, independent
 // of isSoulboundItem validation (which correctly rejects this corrupt cache).
 s.inventory[0].locked=false;const corrupted=copy(s.inventory[0]);game.act(s,'sell',bound.id);game.act(s,'sellCommon');game.act(s,'lock',bound.id);assert.deepEqual(s.inventory[0],corrupted);assert.equal(s.hero.gold,gold);assert.equal(game.previewSelectedSale(s,[bound.id]).available,false);
});

test('equipment sets preserve bound identity, reject stale quotes and retain protection after clear',()=>{
 const s=ready();game.act(s,'equip','loot-1');game.act(s,'saveGearSet','a');const ids=copy(s.gearSets),q=bind(s,'loot-1');assert.deepEqual(s.gearSets,ids);assert.ok(game.isGearSetProtected(s,'loot-1'));
 game.act(s,'equip','starter-weapon');const set=game.previewGearSet(s,'a');assert.equal(set.available,true);game.act(s,'applyGearSet',{id:'a',quoteBasis:set.quoteBasis});assert.equal(s.equipment.weapon.id,'loot-1');assert.deepEqual(s.equipment.weapon,q.after);
 game.act(s,'clearGearSet','a');game.act(s,'equip','starter-weapon');noChange(s,'lock','loot-1');game.act(s,'sell','loot-1');assert.ok(s.inventory.some(item=>item.id==='loot-1'));assert.ok(isSoulboundItem(game.validateSave(copy(s)).inventory.find(item=>item.id==='loot-1')));
});

test('natural ten clears earn exactly 100, fund binding, then naturally grow that same weapon',()=>{
 const s=game.createGame(1);earnWins(s,10);assert.equal(s.soulFragments,100);game.act(s,'retreat');
 const target=s.inventory.find(item=>soulbindCost(item,s.hero.level)===100);assert.ok(target);const id=target.id,q=bind(s,id);assert.equal(s.soulFragments,0);assert.equal(s.inventory.find(i=>i.id===id).level,s.hero.level);
 game.act(s,'equip',id);const anchor=copy(s.equipment.weapon.soulbound),originalLevel=s.hero.level;game.act(s,'start');pulseUntil(s,state=>state.hero.level>originalLevel);assert.equal(s.equipment.weapon.level,s.hero.level);assert.deepEqual(s.equipment.weapon.soulbound,anchor);assert.deepEqual(s.equipment.weapon,scaleSoulboundItem(q.after,s.hero.level));
 game.act(s,'retreat');const loaded=game.validateSave(copy(s));assert.deepEqual(loaded.equipment.weapon,s.equipment.weapon);assert.equal(loaded.soulFragments,s.soulFragments);
});

test('XP synchronizes bound equipped/inventory/pending caches from immutable anchors, never unbound items',()=>{
 const s=game.createGame(29);s.hero.level=7;s.hero.xp=s.hero.xpNext-1;
 const originals=[weapon('loot-1','axe',1),weapon('loot-2','rapier',2),weapon('loot-3','club',3)];
 s.equipment.weapon=createSoulboundItem(originals[0],7);s.inventory=[createSoulboundItem(originals[1],7),weapon('loot-4','axe',3)];
 const unbound=s.inventory[1],unchanged=copy(unbound);game.act(s,'start');s.pendingLoot=[createSoulboundItem(originals[2],7)];
 s.enemies=[{id:'sync',name:'Sync',hp:1,maxHp:1,attack:0,defense:0,evade:0,parry:0,block:0}];pulseUntil(s,state=>state.hero.level>7,100);
 const bound=[s.equipment.weapon,s.inventory[0],s.pendingLoot[0]];
 bound.forEach((item,index)=>{assert.equal(item.level,s.hero.level);assert.deepEqual(item,createSoulboundItem(originals[index],s.hero.level));assert.ok(Object.isFrozen(item.soulbound.stats));});assert.equal(s.inventory[1],unbound);assert.deepEqual(unbound,unchanged);
 const direct=createSoulboundItem(originals[1],30),stepped=Array.from({length:23},(_,i)=>8+i).reduce((item,level)=>scaleSoulboundItem(item,level),createSoulboundItem(originals[1],7));assert.deepEqual(stepped,direct);
});

test('ordinary load validates anchors/caches before canonical catch-up across every held location',()=>{
 for(const location of ['inventory','equipment','pendingLoot']){const s=ready();s.inventory=[];const bound=createSoulboundItem(weapon(),3);if(location==='equipment')s.equipment.weapon=bound;else s[location].push(bound);const before=copy(s),loaded=game.validateSave(s);const actual=location==='equipment'?loaded.equipment.weapon:loaded[location][0];assert.deepEqual(actual,scaleSoulboundItem(bound,7));assert.ok(Object.isFrozen(actual.soulbound));assert.ok(Object.isFrozen(actual.soulbound.stats));assert.deepEqual(s,before);}
});

test('legacy saves reject bound metadata in equipment, inventory and pending rather than stripping it',()=>{
 for(const location of ['inventory','equipment','pendingLoot']){const s=legacy.createGame();const bound=createSoulboundItem(weapon('loot-1','axe',1),1);if(location==='equipment')s.equipment.weapon=bound;else s[location].push(bound);assert.throws(()=>game.validateSave(s));}
});

test('malformed bound anchors/caches/locks/families fail in all import locations without repair',()=>{
 const mutations=[i=>delete i.soulbound,i=>i.soulbound=null,i=>i.soulbound=false,i=>i.soulbound.version=2,i=>i.soulbound.level=0,i=>i.soulbound.level=8,i=>i.soulbound.level=1.5,i=>i.soulbound.extra=true,
  i=>i.soulbound.stats.attack++,i=>i.soulbound.stats.attack=NaN,i=>i.soulbound.stats.parry=1,i=>i.soulbound.stats.future=1,i=>i.stats.attack++,i=>i.power++,i=>i.level=6,i=>i.level=8,i=>i.locked=false,i=>i.weaponFamily=null,i=>i.slot='armor',i=>i.stats.future=1];
 // Removing all binding evidence intentionally produces an ordinary user-edited
 // item, not proof of tampering. Only remaining metadata can be validated.
 mutations.shift();
 for(const location of ['inventory','equipment','pendingLoot'])for(const mutate of mutations){const s=ready(),item=copy(createSoulboundItem(weapon(),7));s.inventory=[];mutate(item);if(location==='equipment')s.equipment.weapon=item;else s[location].push(item);assert.throws(()=>game.validateSave(s),`${location}: ${mutate}`);}
 let reads=0;
 for(const record of ['anchor','stats']){const s=ready();s.inventory=[copy(createSoulboundItem(weapon(),7))];const target=record==='anchor'?s.inventory[0].soulbound:s.inventory[0].soulbound.stats;Object.defineProperty(target,record==='anchor'?'version':'attack',{enumerable:true,get(){reads++;return 1;}});assert.throws(()=>game.validateSave(s));}assert.equal(reads,0);
});

test('legacy rapier subset stays unchanged: binding and later growth never retrofit missing parry',()=>{
 const s=ready();const item=weapon('loot-1','rapier',3);delete item.stats.parry;delete item.rolls.parry;
 // A historical item's diagnostic power must agree with its surviving stats.
 // Use the existing generator score through a same-level bound candidate.
 item.power=scoreItem(item);s.inventory=[item];const q=bind(s);assert.equal(Object.hasOwn(q.after.stats,'parry'),false);assert.equal(Object.hasOwn(q.after.soulbound.stats,'parry'),false);const scaled=scaleSoulboundItem(s.inventory[0],100);assert.equal(Object.hasOwn(scaled.stats,'parry'),false);assert.equal(game.validateSave({...copy(s),hero:{...s.hero,level:100}}).inventory[0].stats.parry,undefined);
});

test('normal victory fragments preserve the existing exact event/log stream and saturate truthfully at cap',()=>{
 for(const initial of [0,1e9-15,1e9-5,1e9]){
  const s=game.createGame(1);s.soulFragments=initial;earnWins(s,1);
  const expected=Math.min(1e9,initial+10);assert.equal(s.soulFragments,expected);assert.ok(s.events.every(e=>e.type!=='soulFragments'));
  if(expected===1e9)assert.ok(s.logs.some(log=>log.includes(`本次增加 ${expected-initial} 個`)));else assert.ok(s.logs.every(log=>!log.startsWith('靈魂碎片 +')));
  const after=copy(s);game.act(s,'finishThenCamp',true);assert.equal(s.soulFragments,expected);game.advance(s,10);assert.equal(s.soulFragments,expected);
  const loaded=game.validateSave(copy(s));assert.equal(loaded.soulFragments,expected);assert.equal(loaded.hero.gold,after.hero.gold);
 }
});

test('kills, retreat, defeat, reload, cancel and already-settled intermission never award extra fragments',()=>{
 const s=game.createGame(42);killForXp(s);assert.equal(s.wins,0);assert.equal(s.soulFragments,0);game.act(s,'retreat');assert.equal(s.soulFragments,0);assert.equal(game.validateSave(copy(s)).soulFragments,0);
 game.act(s,'start');game.act(s,'finishThenCamp',true);game.act(s,'finishThenCamp',false);assert.equal(s.soulFragments,0);game.act(s,'retreat');assert.equal(s.soulFragments,0);
 const doomed=game.createGame(42);game.act(doomed,'start');doomed.hero.hp=1;doomed.enemies=[{id:'fatal',name:'Fatal',hp:1e9,maxHp:1e9,attack:1e6,defense:0,evade:0,parry:0,block:0}];for(let i=0;i<200&&doomed.mode==='battle';i++)game.advance(doomed,.25);assert.equal(doomed.mode,'defeat');assert.equal(doomed.soulFragments,0);assert.equal(game.validateSave(copy(doomed)).soulFragments,0);
 const queued=game.createGame(1);game.act(queued,'start');game.act(queued,'finishThenCamp',true);pulseUntil(queued,state=>state.wins===1);assert.equal(queued.mode,'town');assert.equal(queued.soulFragments,10);for(let i=0;i<100;i++){game.advance(queued,.25);game.act(queued,'finishThenCamp',true);}assert.equal(queued.soulFragments,10);
 const active=game.createGame(1);game.act(active,'start');game.act(active,'finishThenCamp',true);const loaded=game.validateSave(copy(active));assert.equal(loaded.soulFragments,0);assert.equal(game.finishThenCampView(loaded).queued,false);
});

test('full-bag safe camp retains the normal reward exactly once and never autoselects bound loot',()=>{
 const s=game.createGame(1);game.act(s,'start');s.inventory=Array.from({length:119},(_,i)=>weapon(`loot-${i+1}`));s.inventory[0]=createSoulboundItem(weapon('loot-1','axe',1),1);s._itemId=119;
 pulseUntil(s,state=>state.wins===1);assert.equal(s.mode,'town');assert.equal(s.soulFragments,10);assert.ok(s.inventory.some(i=>i.id==='loot-1'&&isSoulboundItem(i)));const balance=s.soulFragments;game.advance(s,30);assert.equal(s.soulFragments,balance);
});

test('no-binding default and chosen-policy trajectories match legacy byte-for-byte except schema/currency',t=>{
 // v0.21's runtime is the preserved predecessor combat/loot baseline; v0.22
 // changes only detached report build context, which is not serialized state.
 let ticks=0,wins=0;
 for(const seed of [1,29,42])for(const policy of ['front','caster','weakest']){
  const a=game.createGame(seed),b=legacy.createGame(seed);
  game.act(a,'targetPriority',policy);legacy.act(b,'targetPriority',policy);game.act(a,'start');legacy.act(b,'start');
  for(let i=0;i<6000&&a.wins<3;i++){
   // Opening/closing repeatedly, with no binding, must consume no RNG or state.
   const snapshot=copy(a);for(const item of [...a.inventory,a.equipment.weapon])game.previewSoulbindWeapon(a,item.id);assert.deepEqual(a,snapshot);
   game.advance(a,.25);legacy.advance(b,.25);const normalized=copy(a);normalized.version=1;delete normalized.soulFragments;
   assert.deepEqual(normalized,b);assert.equal(JSON.stringify(normalized),JSON.stringify(b));assert.equal(a.soulFragments,a.wins*10);ticks++;
   if(a.mode==='defeat'){game.act(a,'start');legacy.act(b,'start');}
  }
  wins+=a.wins;game.act(a,'retreat');legacy.act(b,'retreat');const loaded=game.validateSave(copy(a)),old=legacy.validateSave(copy(b));loaded.version=1;delete loaded.soulFragments;assert.deepEqual(loaded,old);
 }
 assert.equal(wins,27);assert.ok(ticks>1000);t.diagnostic(`${ticks} exact paired ticks across 27 natural clears and nine seed/policy routes`);
});

test('malformed live hero/context and nonwritable transaction targets reject before any debit',()=>{
 for(const mutate of [s=>s.hero.gold='100',s=>s.hero.xp=-1,s=>s.hero.xpNext=0,s=>s.hero.hp=NaN,s=>delete s.hero.attributes.str,s=>s.gearSets=undefined,s=>s.abilities=undefined,s=>s.inventory.foo=true,s=>s.inventory.push(copy(s.inventory[0]))]){
  const s=ready(),q=game.previewSoulbindWeapon(s,'loot-1');mutate(s);assert.equal(game.previewSoulbindWeapon(s,'loot-1').available,false);noChange(s,'soulbindWeapon',q);
 }
 for(const mutate of [s=>Object.defineProperty(s,'soulFragments',{writable:false}),s=>Object.defineProperty(s.inventory,'0',{writable:false}),s=>Object.defineProperty(s,'logs',{writable:false}),s=>s.logs=null]){const s=ready(),q=game.previewSoulbindWeapon(s,'loot-1');mutate(s);noChange(s,'soulbindWeapon',q);}
 const strange=ready(),oldQuote=game.previewSoulbindWeapon(strange,'loot-1'),prototype=[];Object.setPrototypeOf(strange.inventory,prototype);const before=JSON.stringify(strange);assert.equal(game.previewSoulbindWeapon(strange,'loot-1').available,false);game.act(strange,'soulbindWeapon',oldQuote);assert.equal(JSON.stringify(strange),before);assert.equal(Object.getPrototypeOf(strange.inventory),prototype);
 const frozen=freeze(ready()),q=game.previewSoulbindWeapon(frozen,'loot-1');noChange(frozen,'soulbindWeapon',q);
});


test('equipped binding can raise HP capacity but never refills current HP/MP, even after repetition',()=>{
 const draws=[0,.9,.1,.3,.1];const item={...generateItem(()=>draws.length?draws.shift():.5,3,'weapon'),id:'loot-1'};assert.ok(item.stats.hp>0);
 const s=ready();s.inventory=[];s.equipment.weapon=item;s.hero.hp=42;s.hero.mp=3;const oldMax=game.stats(s).maxHp;const q=bind(s,'loot-1');assert.ok(game.stats(s).maxHp>oldMax);assert.equal(s.hero.hp,42);assert.equal(s.hero.mp,3);noChange(s,'soulbindWeapon',q);
});

function collection({bound=115,pending=0,equipped=true}={}){
 const s=ready();s.inventory=[];s.pendingLoot=[];
 const held=Array.from({length:bound},(_,i)=>createSoulboundItem(weapon(`bound-${i}`),s.hero.level));
 if(equipped&&held.length)s.equipment.weapon=held.shift();
 s.pendingLoot=held.splice(0,pending);s.inventory=held;
 s.inventory.push({...weapon('target-a'),locked:false},{...weapon('target-b'),locked:false});
 return s;
}

test('permanent collection limit accepts 115 to 116, refuses 117th and still permits five-space recovery',()=>{
 assert.equal(game.SOULBOUND_WEAPON_LIMIT,game.INVENTORY_LIMIT-5+1);assert.equal(game.SOULBOUND_WEAPON_LIMIT,116);
 const s=collection(),first=game.previewSoulbindWeapon(s,'target-a'),staleSecond=game.previewSoulbindWeapon(s,'target-b');
 assert.equal(first.available,true);assert.equal(first.cost,100);assert.equal(staleSecond.available,true);
 game.act(s,'soulbindWeapon',first);assert.equal(s.soulFragments,900);assert.ok(isSoulboundItem(s.inventory.find(i=>i.id==='target-a')));
 const denied=game.previewSoulbindWeapon(s,'target-b');assert.equal(denied.available,false);assert.equal(denied.cost,null);assert.equal(denied.after,null);assert.match(denied.reason,/永久收藏.*116.*5 格/);
 noChange(s,'soulbindWeapon',denied);noChange(s,'soulbindWeapon',staleSecond);
 const loaded=game.validateSave(copy(s));assert.equal([...Object.values(loaded.equipment),...loaded.inventory,...loaded.pendingLoot].filter(isSoulboundItem).length,116);
 // The only remaining extra weapon is ordinary, so an explicit sale recovers
 // the unchanged start reserve without deleting/unbinding any permanent item.
 game.act(s,'sell','target-b');assert.equal(s.inventory.length,115);assert.equal(s.pendingLoot.length,0);game.act(s,'start');assert.equal(s.mode,'battle');assert.equal(s.soulFragments,900);
});

test('permanent collection counting includes pending and equipped bound weapons, not only inventory',()=>{
 for(const configuration of [{bound:116,pending:1,equipped:true},{bound:116,pending:8,equipped:true},{bound:116,pending:1,equipped:false},{bound:116,pending:0,equipped:false}]){
  const s=collection(configuration),before=copy(s),q=game.previewSoulbindWeapon(s,'target-a');assert.equal(q.available,false);assert.match(q.reason,/永久收藏.*116.*5 格/);assert.deepEqual(s,before);noChange(s,'soulbindWeapon',q);assert.doesNotThrow(()=>game.validateSave(copy(s)));
 }
 const s=collection({bound:115,pending:8});const q=game.previewSoulbindWeapon(s,'target-a');assert.equal(q.available,true);game.act(s,'soulbindWeapon',q);assert.equal(s.soulFragments,900);assert.equal(game.previewSoulbindWeapon(s,'target-b').available,false);
});

test('over-limit v2 imports reject without repair/deletion or input mutation across all held layouts',()=>{
 for(const configuration of [{bound:117,pending:0,equipped:true},{bound:117,pending:1,equipped:true},{bound:117,pending:8,equipped:true},{bound:117,pending:0,equipped:false},{bound:117,pending:8,equipped:false}]){
  const s=collection(configuration),before=copy(s);assert.throws(()=>game.validateSave(s),/永久收藏 116.*5 格.*未載入/);assert.deepEqual(s,before);assert.equal(s.soulFragments,1000);
 }
});

test('a valid quote becomes unusable if another held weapon reaches the permanent cap before confirmation',()=>{
 const s=collection({bound:115,pending:1}),q=game.previewSoulbindWeapon(s,'target-a');assert.equal(q.available,true);
 // This stands for a newly loaded/changed collection, not automatic binding:
 // the action must re-read the present entire state rather than trust consent.
 s.pendingLoot.push(createSoulboundItem(weapon('late-bound'),s.hero.level));const before=copy(s);
 noChange(s,'soulbindWeapon',q);assert.deepEqual(s,before);assert.equal(game.previewSoulbindWeapon(s,'target-a').available,false);
});
