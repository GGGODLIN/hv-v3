import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as game from '../src/engine.js';
import * as loot from '../src/loot.js';
import * as previous from './fixtures/v0.23/engine.js';
import {legacyState} from './helpers/soulbind-compat.mjs';

// Independent behavioral audit. Except the ordinary-play parity scenarios,
// these are deliberately synthetic focused fixtures, not natural-play claims.
const clone=structuredClone;
const slots=['weapon','armor','accessory'];
const held=s=>[...slots.map(slot=>s.equipment[slot]),...s.inventory,...s.pendingLoot];
const find=(s,id='iw-audit-target')=>held(s).find(item=>item.id===id);
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
function weapon(id='iw-audit-target',level=1,family='rapier'){return {...loot.createCommissionWeapon(family,level),id};}
function fixture({level=7,equipped=false,seed=42}={}){
  const s=game.createGame(seed);s.hero.level=level;s.hero.xpNext=game.cumulativeXp(level+1)-game.cumulativeXp(level);
  for(const key of Object.keys(s.hero.attributes))s.hero.attributes[key]=8+(level-1)*2;
  s.worldSeeds=10;s.stage=17;s.unlocked=18;s.wins=9;s.battle.cleared=9;s.battle.bestTimes={1:12.3,17:98.7};
  const target=loot.createSoulboundItem(weapon(),level);assert.ok(target);
  if(equipped)s.equipment.weapon=target;else s.inventory=[target];
  const p=game.stats(s);s.hero.hp=p.maxHp;s.hero.mp=p.maxMp;
  return s;
}
function quote(s,id='iw-audit-target'){const q=game.previewItemWorld(s,id);assert.equal(q.available,true,q.reason);return q;}
function enter(s){const q=quote(s);game.act(s,'enterItemWorld',clone(q));assert.equal(game.itemWorldView(s).active,true);return q;}
function refuse(s,payload){const before=clone(s);assert.doesNotThrow(()=>game.act(s,'enterItemWorld',payload));assert.deepEqual(s,before);assert.deepEqual(game.itemWorldView(s),{active:false});}
function expectedStats(anchor,level){return Object.fromEntries(Object.entries(anchor.stats).map(([key,value])=>{
  const rate=['crit','evade','block'].includes(key),scale=rate||key==='parry'?2000:key==='attack'?50/3:key==='hp'?12:20;
  const raw=value*(1+level/scale)/(1+anchor.level/scale)*(key==='attack'?1.02:1.01);
  return [key,rate?Math.round(Math.min(.16,raw)*10000)/10000:key==='parry'?Math.round(raw*10000)/10000:Math.round(raw)];
}));}
const progress=s=>{const c=clone(s);delete c.version;delete c.worldSeeds;return c;};
function equalNormal(a,b){assert.equal(a.version,3);assert.equal(b.version,2);assert.deepEqual(progress(a),progress(b));assert.deepEqual(game.expeditionReports(a),previous.expeditionReports(b));}
function equipBest(api,s){for(const slot of slots){const best=[s.equipment[slot],...s.inventory.filter(i=>i.slot===slot)].reduce((a,b)=>loot.scoreItem(a)>=loot.scoreItem(b)?a:b);if(best.id!==s.equipment[slot].id)api.act(s,'equip',best.id);}}
function oneNormal(api,s,step=()=>{}){const wins=s.wins;api.act(s,'start');step();assert.equal(s.mode,'battle');let n=0;while(s.mode==='battle'&&s.wins===wins&&n++<4000){api.advance(s,.25);step();}assert.ok(n<4000);api.act(s,'retreat');step();return s.wins===wins+1;}
const normalContext=s=>({stage:s.stage,unlocked:s.unlocked,wins:s.wins,cleared:s.battle.cleared,bestTimes:clone(s.battle.bestTimes),autoAdvance:s.autoAdvance,soulFragments:s.soulFragments});
function bossFixture(s){s.wave=5;s.enemies=[{id:'audit-terminal-boss',name:'audit boss',boss:true,hp:1,maxHp:1,attack:0,defense:0,evade:0,parry:0,block:0,resist:0}];s._clock=-100;s._enemyClock=-100;return s.enemies[0];}
function basicKill(s){s._clock=1.05;s._enemyClock=-100;game.advance(s,.001);}
function bleedKill(s,enemy=s.enemies[0]){enemy.bleeding={stacks:1,expiresAtTick:s.timing.ticks+7,damagePerTick:Math.ceil(enemy.hp)};s._clock=-100;s._enemyClock=-100;s.timing.tu=(s.timing.ticks+1)*100-1;game.advance(s,.02);}

// The imported baseline bytes are the accepted publication snapshot, not a
// source copy produced after implementation began.
test('v024 independent: exact accepted v023 baseline hashes',()=>{
  for(const [file,sha] of Object.entries({'engine.js':'8b89bc08955d504ab6dfe7b207db4f210053c4b0fd918b632c0b5db9220e77ae','loot.js':'46ff81d7167069607f7d0d2efc2d0cb2a4bcc90fd306397e6a9e02507bab3884'})){
    assert.equal(createHash('sha256').update(readFileSync(new URL(`./fixtures/v0.23/${file}`,import.meta.url))).digest('hex'),sha);
  }
});

test('v024 independent: natural ordinary-play replay differs ONLY by version and earned seeds',t=>{
  let pulses=0,totalWins=0;
  for(const seed of [1,42,77]){
    const s=game.createGame(seed),old=previous.createGame(seed);
    for(let run=0;run<12;run++){
      equipBest(game,s);equipBest(previous,old);equalNormal(s,old);
      const stage=Math.min(1+run%4,s.unlocked),strategy=['balanced','assault','sustain'][run%3];
      for(const [action,payload] of [['selectStage',stage],['setStrategy',strategy],['targetPriority',['front','caster','weakest'][run%3]],['autoProtection',true],['learnAbility','hp-tank'],['slotAbility','hp-tank']]){game.act(s,action,payload);previous.act(old,action,payload);equalNormal(s,old);}
      const wins=s.wins;game.act(s,'start');previous.act(old,'start');equalNormal(s,old);
      let n=0;while(s.mode==='battle'&&s.wins===wins&&n++<4000){game.advance(s,.25);previous.advance(old,.25);equalNormal(s,old);assert.equal(s.worldSeeds,s.wins);pulses++;}
      assert.ok(n<4000);game.act(s,'retreat');previous.act(old,'retreat');equalNormal(s,old);
    }
    assert.ok(s.wins>0);totalWins+=s.wins;
  }
  t.diagnostic(JSON.stringify({kind:'natural engine replay; no item/resource injection',seeds:[1,42,77],runs:36,totalWins,pulses,excluded:['root version','root worldSeeds']}));
});

test('v024 independent: normal seed cap adds no RNG/event/log delta or repeat reward',()=>{
  for(const seeds of [999999999,1000000000]){
    const s=game.createGame(42),old=previous.createGame(42);s.worldSeeds=seeds;
    game.act(s,'start');previous.act(old,'start');const wins=s.wins;let n=0;
    while(s.wins===wins&&s.mode==='battle'&&n++<3000){game.advance(s,.25);previous.advance(old,.25);equalNormal(s,old);}
    assert.equal(s.wins,1);assert.equal(s.worldSeeds,1000000000);
    game.act(s,'finishThenCamp',true);previous.act(old,'finishThenCamp',true);equalNormal(s,old);
    const before=clone(s);game.advance(s,2);game.act(s,'finishThenCamp',true);assert.deepEqual(s,before);
  }
});

test('v024 independent: v1/v2 migrations are lossless for supported items; old readers reject actual v3',()=>{
  const v2=previous.createGame(42);v2.soulFragments=321;v2.hero.gold=987;v2.inventory=[loot.createSoulboundItem(weapon(),1)];
  const before=clone(v2),migrated=game.validateSave(v2),canonical=previous.validateSave(clone(v2));
  assert.deepEqual(v2,before);assert.equal(migrated.version,3);assert.equal(migrated.worldSeeds,0);assert.equal(migrated.soulFragments,321);assert.deepEqual(progress(migrated),progress(canonical));
  assert.throws(()=>previous.validateSave(clone(migrated)));
  const v1=previous.createGame(1);v1.version=1;delete v1.soulFragments;
  const first=game.validateSave(v1);assert.equal(first.version,3);assert.equal(first.soulFragments,0);assert.equal(first.worldSeeds,0);
  for(const version of [1,2])for(const seeds of [0,undefined]){const s=clone(v1);s.version=version;if(version===2)s.soulFragments=0;s.worldSeeds=seeds;assert.throws(()=>game.validateSave(s));}
  for(const version of [1,2]){const s=clone(migrated);s.version=version;delete s.worldSeeds;if(version===1)delete s.soulFragments;s.inventory[0]=loot.createItemWorldUpgrade(s.inventory[0],1);assert.ok(s.inventory[0]);assert.throws(()=>game.validateSave(s));}
  for(const value of [undefined,null,-1,.1,'0',NaN,Infinity,1000000001]){const s=game.createGame();s.worldSeeds=value;assert.throws(()=>game.validateSave(s));}
  const absent=game.createGame();delete absent.worldSeeds;assert.throws(()=>game.validateSave(absent));
  for(const version of [0,4,'3',null]){const s=game.createGame();s.version=version;assert.throws(()=>game.validateSave(s));}
});

test('v024 independent: Fair/Average/Superior only; absolute seven-stat IW anchor and no invented old parry',()=>{
  for(const [r,quality,allowed] of [[.01,'Crude',false],[.03,'Fair',true],[.4,'Average',true],[.5,'Superior',true],[.8,'Exquisite',false],[.95,'Magnificent',false],[.99,'Legendary',false],[.9999,'Peerless',false]]){
    const raw={...loot.generateItem(()=>r,1,'weapon'),id:`quality-${quality}`};assert.equal(raw.quality,quality);
    const item=loot.createSoulboundItem(raw,7);assert.ok(item);
    assert.equal(Boolean(loot.createItemWorldUpgrade(item,7)),allowed,quality);
  }
  const stats={attack:43,defense:3,hp:11,crit:.1599,evade:.0087,block:.0123,parry:7.8912};
  const raw={...weapon('seven',7),stats,power:loot.scoreItem({stats})};delete raw.rolls;
  const bound=loot.createSoulboundItem(raw,8),anchor=clone(bound.soulbound),before=clone(bound),upgraded=loot.createItemWorldUpgrade(freeze(bound),8);
  assert.deepEqual(bound,before);assert.deepEqual(upgraded.soulbound,anchor);assert.deepEqual(upgraded.stats,expectedStats(anchor,8));assert.deepEqual(upgraded.itemWorld,{version:1,level:1});
  assert.ok(Object.isFrozen(upgraded.soulbound));assert.ok(Object.isFrozen(upgraded.soulbound.stats));assert.ok(Object.isFrozen(upgraded.itemWorld));
  let stepped=upgraded;for(const level of [9,11,25,99,250,499,500])stepped=loot.scaleSoulboundItem(stepped,level);
  const direct=loot.scaleSoulboundItem(upgraded,500);assert.deepEqual(stepped,direct);assert.deepEqual(direct.stats,expectedStats(anchor,500));assert.equal(direct.power,loot.scoreItem(direct));
  const legacy=weapon('legacy-parry');delete legacy.stats.parry;delete legacy.rolls.parry;legacy.power=loot.scoreItem(legacy);
  const noParry=loot.scaleSoulboundItem(loot.createItemWorldUpgrade(loot.createSoulboundItem(legacy,1),1),500);
  assert.equal(Object.hasOwn(noParry.stats,'parry'),false);assert.equal(Object.hasOwn(noParry.soulbound.stats,'parry'),false);
});

test('v024 independent: coherent old IW caches grow on load; stale/unknown/rank metadata rejects without input repair',()=>{
  const s=fixture({level:7}),upgraded=loot.createItemWorldUpgrade(find(s),7);s.inventory[0]=upgraded;
  const old=clone(s);old.inventory[0]=loot.scaleSoulboundItem(upgraded,1);assert.equal(old.inventory[0].level,1);
  const before=clone(old),loaded=game.validateSave(old);assert.deepEqual(old,before);assert.deepEqual(find(loaded),upgraded);
  const mutations=[i=>i.itemWorld=null,i=>i.itemWorld={},i=>i.itemWorld={version:1,level:0},i=>i.itemWorld.level=2,i=>i.itemWorld.level=1.5,i=>i.itemWorld.level='1',i=>i.itemWorld.version=2,i=>i.itemWorld.extra=true,i=>i.stats.attack++,i=>i.power++,i=>i.soulbound.stats.attack++,i=>i.locked=false,i=>i.level++,i=>i.future=1,i=>i.stats.future=1,i=>i.soulbound.stats.future=1,i=>delete i.soulbound];
  for(const change of mutations){const data=clone(s);change(find(data));const before=clone(data);assert.throws(()=>game.validateSave(data));assert.deepEqual(data,before);assert.equal(game.previewItemWorld(data,'iw-audit-target').available,false);}
  for(const location of ['equipment','inventory','pendingLoot']){const data=game.createGame();const item={...weapon(),itemWorld:{version:1,level:1}};if(location==='equipment')data.equipment.weapon=item;else data[location]=[item];assert.throws(()=>game.validateSave(data));}
});

test('v024 independent: world/target/anchor/quote accessors never execute',()=>{
  let reads=0;const getter={enumerable:true,configurable:true,get(){reads++;throw Error('must not execute');}};
  for(const path of ['worldSeeds','heroLevel','itemWorld','iwLevel','anchor','anchorStat','pending']){
    const s=fixture();s.inventory[0]=loot.createItemWorldUpgrade(find(s),s.hero.level);let object,key;
    if(path==='worldSeeds'){object=s;key='worldSeeds';}if(path==='heroLevel'){object=s.hero;key='level';}if(path==='itemWorld'){object=s.inventory[0];key='itemWorld';}if(path==='iwLevel'){object=s.inventory[0].itemWorld;key='level';}if(path==='anchor'){object=s.inventory[0].soulbound;key='level';}if(path==='anchorStat'){object=s.inventory[0].soulbound.stats;key='attack';}if(path==='pending'){s.pendingLoot=[weapon('pending')];object=s.pendingLoot[0];key='description';}
    // Upgrade anchors are intentionally immutable; use detached test data.
    const data=clone(s);if(path==='worldSeeds')object=data;if(path==='heroLevel')object=data.hero;if(path==='itemWorld')object=data.inventory[0];if(path==='iwLevel')object=data.inventory[0].itemWorld;if(path==='anchor')object=data.inventory[0].soulbound;if(path==='anchorStat')object=data.inventory[0].soulbound.stats;if(path==='pending')object=data.pendingLoot[0];
    Object.defineProperty(object,key,getter);assert.throws(()=>game.validateSave(data));assert.equal(game.previewItemWorld(data,'iw-audit-target').available,false);assert.equal(reads,0,path);
  }
  for(const key of Object.keys(quote(fixture()))){const s=fixture(),payload=quote(s);Object.defineProperty(payload,key,getter);refuse(s,payload);assert.equal(reads,0,key);}
});

test('v024 independent: exact whole quote rejects every missing/extra/changed field and detached preview cannot mutate state',()=>{
  const original=fixture(),before=clone(original),pure=quote(freeze(clone(original)));pure.before.stats.attack++;pure.after.stats.attack++;assert.deepEqual(original,before);refuse(original,pure);
  const keys=Object.keys(quote(fixture()));
  for(const key of keys){const s=fixture(),q=quote(s);delete q[key];refuse(s,q);}
  for(const mutate of [q=>q.id='other',q=>q.available=false,q=>q.reason='forged',q=>q.cost=0,q=>q.seedsAfter++,q=>q.strengthStage++,q=>q.rounds=4,q=>q.before.power++,q=>q.after.power++,q=>q.quoteBasis+=' ',q=>q.extra=undefined]){const s=fixture(),q=quote(s);mutate(q);refuse(s,q);}
  const s=fixture(),q=quote(s),reordered=Object.fromEntries(Object.entries(q).reverse());game.act(s,'enterItemWorld',reordered);assert.equal(game.itemWorldView(s).active,true);assert.equal(s.worldSeeds,9);
  const cross=fixture(),crossQuote=vm.runInNewContext(`JSON.parse(${JSON.stringify(JSON.stringify(quote(cross)))})`);game.act(cross,'enterItemWorld',crossQuote);assert.equal(game.itemWorldView(cross).active,true);
});

test('v024 independent: stale gameplay, ownership, currencies and build consent is atomic',()=>{
  const mutations=[s=>s.worldSeeds--,s=>s.seed++,s=>s._itemId++,s=>s.kills++,s=>s.timing.turns++,s=>s.timing.ticks++,s=>s.timing.tu++,s=>s.autoAdvance=true,s=>s.autoSell=true,s=>s.soulFragments++,s=>s.hero.level++,s=>s.hero.xp++,s=>s.hero.hp--,s=>s.hero.mp--,s=>s.hero.gold++,s=>s.hero.proficiency++,s=>s.hero.attributes.str++,s=>s.stage--,s=>s.unlocked++,s=>s.strategy='assault',s=>s.autoProtection=true,s=>s.targetPriority='weakest',s=>s.inventory[0].locked=false,s=>s.inventory[0].stats.attack++,s=>s.equipment.armor.stats.defense++,s=>s.inventory.push(weapon('new')),s=>s.pendingLoot.push(weapon('pending')),s=>s.mode='battle',s=>game.act(s,'saveGearSet','a'),s=>game.act(s,'learnAbility','hp-tank')];
  for(const mutate of mutations){const s=fixture(),q=quote(s);mutate(s);refuse(s,q);}
  const insufficient=fixture();insufficient.worldSeeds=0;const q=game.previewItemWorld(insufficient,'iw-audit-target');assert.equal(q.available,false);refuse(insufficient,q);
  const pending=fixture();pending.pendingLoot=pending.inventory;pending.inventory=[];assert.equal(game.previewItemWorld(pending,'iw-audit-target').available,false);
});

test('v024 independent: frozen/read-only transaction destinations never debit or partially enter',()=>{
  for(const lock of [s=>Object.freeze(s),s=>Object.freeze(s.hero),s=>Object.freeze(s.battle),s=>Object.freeze(s.timing),s=>Object.defineProperty(s,'worldSeeds',{writable:false}),s=>Object.defineProperty(s,'mode',{writable:false}),s=>Object.defineProperty(s,'enemies',{writable:false}),s=>Object.defineProperty(s,'logs',{writable:false})]){
    const s=fixture(),q=quote(s);lock(s);refuse(s,q);
  }
});

test('v024 independent: entry creates only transient detached view, freezes strength, never auto-equips',()=>{
  const s=fixture({level:7}),item=clone(find(s)),equipment=clone(s.equipment),normal=normalContext(s),q=enter(s);
  assert.equal(s.worldSeeds,9);assert.equal(s.totalWaves,5);assert.equal(s.wave,1);assert.deepEqual(find(s),item);assert.deepEqual(s.equipment,equipment);assert.deepEqual(normalContext(s),normal);
  const view=game.itemWorldView(s);assert.equal(view.targetId,item.id);assert.equal(view.strengthStage,5);assert.equal(view.entryLevel,7);view.strengthStage=500;view.targetId='forged';
  assert.equal(game.itemWorldView(s).strengthStage,5);assert.equal(game.itemWorldView(s).targetId,item.id);
  s.hero.xp=s.hero.xpNext-1;s.enemies[0].hp=1;s.enemies[0].defense=s.enemies[0].evade=s.enemies[0].parry=s.enemies[0].block=0;
  basicKill(s);assert.equal(s.hero.level,8);assert.equal(game.itemWorldView(s).strengthStage,5);assert.equal(game.itemWorldView(s).entryLevel,7);assert.equal(find(s).itemWorld,undefined);
  const before=clone(s);game.act(s,'enterItemWorld',q);assert.deepEqual(s,before);
  assert.ok(!Object.keys(s).some(key=>/itemWorld|trial|entryLevel|strengthStage/i.test(key)),'trial session is not a serializable root field');
});

test('v024 independent: five rounds, boss only last, seven nonboss drops fit five free + pending without truncation',()=>{
  const s=fixture({level:7});while(s.inventory.length<115)s.inventory.push(weapon(`reserve-${s.inventory.length}`));
  const initial=held(s).length,normal=normalContext(s),startGold=s.hero.gold,startXp=game.cumulativeXp(s.hero.level)+s.hero.xp;enter(s);
  const seen=[],initialKills=s.kills;let n=0;
  while(game.itemWorldView(s).active&&n++<20){
    seen.push({wave:s.wave,actors:s.enemies.length,bosses:s.enemies.filter(e=>e.boss).length});
    // A one-enemy bleed edge guarantees one drop draw per nonboss. Seed is an
    // explicitly controlled unit-test input, never an earned-play assertion.
    const target=s.enemies.find(e=>e.hp>0);target.hp=1;s.seed=12345;bleedKill(s,target);
  }
  assert.ok(n<20);assert.deepEqual([...new Map(seen.map(row=>[row.wave,row])).values()],[{wave:1,actors:1,bosses:0},{wave:2,actors:2,bosses:0},{wave:3,actors:2,bosses:0},{wave:4,actors:2,bosses:0},{wave:5,actors:1,bosses:1}]);
  assert.equal(s.kills-initialKills,8);assert.equal(held(s).length-initial,7);assert.equal(s.inventory.length,120);assert.equal(s.pendingLoot.length,2);
  assert.equal(s.hero.gold-startGold,7*Math.floor((4+5*2)/4)+Math.floor((4+5*2+15)/4));
  assert.equal(game.cumulativeXp(s.hero.level)+s.hero.xp-startXp,7*(7+5*2)+(18+5*2));
  assert.deepEqual(normalContext(s),normal);assert.equal(s.mode,'town');assert.equal(find(s).itemWorld.level,1);
  assert.equal(new Set(held(s).map(i=>i.id)).size,held(s).length);assert.doesNotThrow(()=>game.validateSave(clone(s)));
});

for(const method of ['basic','bleed','counter','stun-recovery-counter'])test(`v024 independent: terminal ${method} upgrades exactly once and suppresses old batch actions`,()=>{
  let settled;
  for(let seed=1;seed<=100&&!settled;seed++){
    const s=fixture({equipped:true,seed}),normal=normalContext(s);enter(s);const target=bossFixture(s),beforeGold=s.hero.gold,beforeXp=game.cumulativeXp(s.hero.level)+s.hero.xp,beforeCount=held(s).length;
    if(method==='basic')basicKill(s);
    if(method==='bleed')bleedKill(s,target);
    if(method.includes('counter')){s.equipment.armor.stats.block=1;s._clock=-100;s._enemyClock=1.9;if(method==='stun-recovery-counter'){s._enemyClock=-100;s._clock=1.05;target.stunRecoveryPending=true;}game.advance(s,.001);}
    if(game.itemWorldView(s).active||method.includes('counter')&&(s.battle.actions.counters??0)!==1)continue;
    settled=s;assert.equal(s.mode,'town');assert.equal(s._phase,'idle');assert.equal(s.kills,1);assert.deepEqual(normalContext(s),normal);assert.deepEqual(find(s).itemWorld,{version:1,level:1});assert.equal(s.equipment.weapon.id,'iw-audit-target');
    assert.equal(s.hero.gold-beforeGold,Math.floor((4+5*2+15)/4));assert.equal(game.cumulativeXp(s.hero.level)+s.hero.xp-beforeXp,18+5*2);assert.equal(held(s).length,beforeCount,'no ordinary completion drop');
    const r=game.expeditionReports(s)[0];assert.equal(r.outcome,'win');assert.equal(r.itemWorld.reward,true);
    if(method.includes('counter')){assert.equal(r.actions.attacks,0);assert.equal(r.actions.counters,1);}
    const done=clone(s);for(let i=0;i<5;i++)game.advance(s,2);game.act(s,'enterItemWorld',quoteFromDone(done));assert.deepEqual(s,done);
    assert.equal(game.previewItemWorld(s,'iw-audit-target').available,false);assert.equal(game.validateSave(clone(s)).equipment.weapon.itemWorld.level,1);
  }
  assert.ok(settled,`deterministic ${method} settlement fixture exists`);
});
function quoteFromDone(s){return {id:'iw-audit-target',available:true,reason:'',cost:1,seedsAfter:s.worldSeeds-1,before:find(s),after:find(s),strengthStage:5,rounds:5,quoteBasis:'stale'};}

test('v024 independent: retreat, defeat and reload keep spent seed and kills but no upgrade, return camp and no auto-repeat',()=>{
  for(const path of ['retreat','defeat','reload']){
    const s=fixture({equipped:true});s.autoAdvance=true;const normal=normalContext(s),anchor=clone(find(s).soulbound);enter(s);
    s.enemies[0].hp=1;bleedKill(s);assert.equal(s.kills,1);const gold=s.hero.gold,xp=game.cumulativeXp(s.hero.level)+s.hero.xp;
    let out=s;if(path==='retreat')game.act(s,'retreat');if(path==='reload')out=game.validateSave(clone(s));
    if(path==='defeat'){
      s.hero.hp=1;s.enemies.forEach(e=>{e.attack=1e12;e.hp=1e6;});s._clock=-100;s._enemyClock=1.9;game.advance(s,.001);
      assert.equal(s.mode,'town');
    }
    assert.deepEqual(game.itemWorldView(out),{active:false});assert.equal(out.mode,'town');assert.equal(out.worldSeeds,9);assert.equal(find(out).itemWorld,undefined);assert.deepEqual(find(out).soulbound,anchor);assert.deepEqual(normalContext(out),normal);assert.equal(out.hero.gold,gold);assert.equal(game.cumulativeXp(out.hero.level)+out.hero.xp,xp);assert.equal(out.kills,1);
    const before=clone(out);game.advance(out,2);assert.deepEqual(out,before);
  }
});

test('v024 independent: future overflow is rejected BEFORE seed spend and bound collection cap remains 116',()=>{
  const raw=weapon('overflow',1,'axe');raw.stats={attack:17000};delete raw.rolls;raw.power=loot.scoreItem(raw);
  const item=loot.createSoulboundItem(raw,1);assert.ok(item,'IW0 may still fit max hero level');assert.equal(loot.createItemWorldUpgrade(item,1),null,'IW1 cannot make max-level cache unsavable');
  const s=fixture({level:1});s.inventory=[{...item,id:'iw-audit-target'}];const q=game.previewItemWorld(s,'iw-audit-target');assert.equal(q.available,false);refuse(s,q);
  assert.equal(game.SOULBOUND_WEAPON_LIMIT,116);
  const capacity=fixture({equipped:true});capacity.inventory=Array.from({length:115},(_,i)=>loot.createSoulboundItem(weapon(`bound-${i}`),7));
  assert.doesNotThrow(()=>game.validateSave(clone(capacity)));enter(capacity);const enemy=bossFixture(capacity);bleedKill(capacity,enemy);assert.equal(held(capacity).filter(loot.isSoulboundItem).length,116);assert.doesNotThrow(()=>game.validateSave(clone(capacity)));
  const over=clone(capacity);over.pendingLoot=[loot.createSoulboundItem(weapon('bound-over'),7)];assert.throws(()=>game.validateSave(over));
});

test('v024 independent: IW1 IDs survive preset roundtrip, subsequent level growth, reload and disposal attempts',()=>{
  const s=fixture({equipped:true});game.act(s,'saveGearSet','a');const refs=clone(s.gearSets.a),original=clone(find(s));enter(s);bleedKill(s,bossFixture(s));
  assert.deepEqual(s.gearSets.a,refs);const grown=loot.scaleSoulboundItem(find(s),10);s.hero.level=10;s.hero.xpNext=game.cumulativeXp(11)-game.cumulativeXp(10);s.equipment.weapon=grown;
  const loaded=game.validateSave(clone(s));assert.deepEqual(find(loaded),grown);assert.deepEqual(find(loaded).soulbound,original.soulbound);assert.deepEqual(find(loaded).stats,expectedStats(original.soulbound,10));
  loaded.inventory.push(weapon('ordinary-spare',10));game.act(loaded,'equip','ordinary-spare');const q=game.previewGearSet(loaded,'a');assert.equal(q.available,true,q.reason);game.act(loaded,'applyGearSet',{id:'a',quoteBasis:q.quoteBasis});assert.deepEqual(loaded.equipment.weapon,grown);game.act(loaded,'clearGearSet','a');game.act(loaded,'equip','ordinary-spare');
  for(const action of ['lock','sell','sellCommon','sellSafe','sellSelected']){const before=clone(find(loaded)),gold=loaded.hero.gold;game.act(loaded,action,action==='sellSafe'?{ids:[grown.id]}:action==='sellSelected'?{ids:[grown.id],quoteBasis:'forged'}:grown.id);assert.deepEqual(find(loaded),before);assert.equal(loaded.hero.gold,gold);}
  assert.equal(loot.itemSalePrice(find(loaded)),0);assert.equal(game.previewSelectedSale(loaded,[grown.id]).available,false);assert.equal(game.previewSafeSale(loaded).items.some(i=>i.id===grown.id),false);
});

test('v024 independent: malformed live data, descriptors and target identity refuse without spending or getter execution',()=>{
  for(const change of [
    s=>s.inventory.push({...clone(find(s)),id:'iw-audit-target'}),
    s=>s.inventory.push({...weapon('foreign'),future:'unknown'}),
    s=>s.inventory.push({...weapon('foreign'),stats:{attack:1,future:1}}),
    s=>{find(s).weaponFamily=null;},s=>{find(s).name='unknown';},s=>{find(s).slot='armor';},
    s=>{delete find(s).soulbound;},s=>{find(s).itemWorld={version:1,level:1};},
    s=>{s.pendingLoot=[weapon('waiting')];},
    s=>{while(s.inventory.length<116)s.inventory.push(weapon(`full-${s.inventory.length}`));},
    s=>{s.version=2;},s=>{s.worldSeeds=-1;},s=>{s.worldSeeds=1.5;},s=>{s.worldSeeds='1';},s=>{s.worldSeeds=1e9+1;},
    s=>{s.hero.level=501;},s=>{s.hero.level=0;},s=>{s.hero.level=7.5;},
  ]){const s=fixture(),q=quote(s);change(s);assert.equal(game.previewItemWorld(s,'iw-audit-target').available,false);refuse(s,q);}
  for(const value of [null,[],true,1,'iw-audit-target',Object.create({id:'iw-audit-target'})])refuse(fixture(),value);
  for(const mutation of [q=>{q[Symbol('future')]=1;},q=>Object.defineProperty(q,'cost',{enumerable:false}),q=>Object.setPrototypeOf(q,{future:true}),q=>{q.before.stats.attack=Infinity;}]){const s=fixture(),q=quote(s);mutation(q);refuse(s,q);}
  let reads=0;
  for(const key of ['logs','events','battle','timing','_eventId','futureRoot']){
    const s=fixture(),q=quote(s);Object.defineProperty(s,key,{enumerable:true,configurable:true,get(){reads++;throw Error('getter invoked');}});
    const descriptors=Object.getOwnPropertyDescriptors(s);assert.doesNotThrow(()=>game.act(s,'enterItemWorld',q));assert.equal(reads,0);assert.deepEqual(Object.getOwnPropertyDescriptors(s),descriptors);assert.equal(s.worldSeeds,10);assert.equal(game.itemWorldView(s).active,false);
  }
});

test('v024 independent: newly introduced metadata rejects sparse, inherited, symbolic and nonenumerable save shapes',()=>{
  const s=fixture();s.inventory[0]=loot.createItemWorldUpgrade(find(s),7);
  for(const change of [
    d=>{Object.defineProperty(d,'worldSeeds',{enumerable:false});},
    d=>{delete d.worldSeeds;Object.setPrototypeOf(d,{worldSeeds:10});},
    d=>{d.inventory[0].itemWorld=[];},d=>{d.inventory[0].itemWorld={version:1,level:1,rank:1};},
    d=>{d.inventory[0].itemWorld[Symbol('unknown')]=1;},
    d=>{Object.defineProperty(d.inventory[0].itemWorld,'level',{enumerable:false});},
    d=>{delete d.inventory[0].itemWorld.level;Object.setPrototypeOf(d.inventory[0].itemWorld,{level:1});},
    d=>{d.inventory[0].itemWorld={version:1,level:1,toJSON(){return {version:1,level:1};}};},
    d=>{delete d.inventory[0];},d=>{d.inventory.extra=1;},
  ]){const data=clone(s);change(data);assert.throws(()=>game.validateSave(data));}
  const cross=vm.runInNewContext(`JSON.parse(${JSON.stringify(JSON.stringify(s))})`);assert.deepEqual(find(game.validateSave(cross)),find(s));
});

test('v024 independent: actual combat level-up preserves every IW1 collection location and original anchor',()=>{
  const s=fixture({level:7,equipped:true});s.equipment.weapon=loot.createItemWorldUpgrade(find(s),7);
  s.inventory=[loot.createItemWorldUpgrade(loot.createSoulboundItem(weapon('iw-inventory'),7),7)];
  const originals=clone(held(s));s.hero.xp=s.hero.xpNext-1;game.act(s,'start');assert.equal(s.mode,'battle');
  s.pendingLoot=[loot.createItemWorldUpgrade(loot.createSoulboundItem(weapon('iw-pending'),7),7)];const pendingAnchor=clone(s.pendingLoot[0].soulbound);
  s.enemies[0].hp=1;bleedKill(s);assert.equal(s.hero.level,8);
  for(const id of ['iw-audit-target','iw-inventory','iw-pending']){const item=find(s,id),anchor=id==='iw-pending'?pendingAnchor:originals.find(i=>i.id===id).soulbound;assert.equal(item.level,8);assert.deepEqual(item.itemWorld,{version:1,level:1});assert.deepEqual(item.soulbound,anchor);assert.deepEqual(item.stats,expectedStats(anchor,8));}
});

test('v024 independent: natural earned commissioning, binding and IW1 trials retain every seeded outcome',t=>{
  const rows=[];
  for(const seed of [1,42,77]){
    const earned=game.createGame(seed);
    for(let run=0;run<10;run++){equipBest(game,earned);game.act(earned,'selectStage',Math.min(3,earned.unlocked));assert.equal(oneNormal(game,earned),true);}
    assert.equal(earned.wins,10);assert.equal(earned.soulFragments,100);assert.equal(earned.worldSeeds,10);
    // Each family/location is a replay branch from the same genuinely earned
    // camp save. No credits, fragments, seeds, XP, gear or HP are injected.
    for(const family of ['axe','rapier','club'])for(const equipped of [false,true]){
      const s=game.validateSave(clone(earned)),commission=game.previewWeaponCommission(s,family);assert.equal(commission.available,true,commission.reason);
      game.act(s,'commissionWeapon',{family,quoteBasis:commission.quoteBasis});const id=commission.item.id;
      if(equipped)game.act(s,'equip',id);
      for(const ability of ['hp-tank','one-handed-damage']){game.act(s,'learnAbility',ability);game.act(s,'slotAbility',ability);}
      const binding=game.previewSoulbindWeapon(s,id);assert.equal(binding.available,true,binding.reason);game.act(s,'soulbindWeapon',binding);assert.equal(s.soulFragments,0);
      const normal=normalContext(s),wearing=s.equipment.weapon.id,target=clone(find(s,id)),q=quote(s,id),gold=s.hero.gold,xp=game.cumulativeXp(s.hero.level)+s.hero.xp;
      game.act(s,'enterItemWorld',q);assert.equal(game.itemWorldView(s).active,true);let pulses=0;while(game.itemWorldView(s).active&&pulses++<4000)game.advance(s,.25);assert.ok(pulses<4000,'trial reaches a terminal outcome');
      const report=game.expeditionReports(s)[0],won=report.outcome==='win';assert.deepEqual(normalContext(s),normal);assert.equal(s.worldSeeds,9);assert.equal(s.mode,'town');assert.equal(s.equipment.weapon.id,wearing);assert.deepEqual(find(s,id).soulbound,target.soulbound);
      if(won){assert.deepEqual(find(s,id).itemWorld,{version:1,level:1});assert.deepEqual(find(s,id).stats,expectedStats(target.soulbound,s.hero.level));assert.equal(s.hero.gold-gold,28);assert.equal(game.cumulativeXp(s.hero.level)+s.hero.xp-xp,147);}else assert.equal(find(s,id).itemWorld,undefined);
      assert.doesNotThrow(()=>game.validateSave(clone(s)));rows.push({seed,family,equipped,entryLevel:q.before.level,outcome:report.outcome,seconds:Number(report.elapsed.toFixed(2)),hpLost:report.survival.hpLost,minHpPercent:Number(report.survival.minHpPercent.toFixed(2)),earnedGold:s.hero.gold-gold,earnedXp:game.cumulativeXp(s.hero.level)+s.hero.xp-xp,pulses});
    }
  }
  for(const family of ['axe','rapier','club'])assert.ok(rows.some(row=>row.family===family&&row.outcome==='win'));
  assert.ok(rows.some(row=>!row.equipped&&row.outcome==='win'));
  t.diagnostic(JSON.stringify({kind:'engine-earned, not browser-earned; 10 ordinary wins per source save; all 18 branches retained; no fixture edits or rerolls',rows}));
});

test('v024 independent: legacy comparator strips only root envelopes and never hides protected/future item metadata',()=>{
  const s=game.createGame();s.worldSeeds=123;s.soulFragments=456;s.futureRoot={version:9,worldSeeds:99,soulFragments:88,unknown:'preserve'};s.battle.future={worldSeeds:77,optional:undefined};s.inventory=[{...weapon('future'),futureItem:{nested:12}}];
  const before=clone(s),projected=legacyState(s);assert.equal(projected.version,1);assert.equal(Object.hasOwn(projected,'worldSeeds'),false);assert.equal(Object.hasOwn(projected,'soulFragments'),false);
  assert.deepEqual({...projected,version:3,worldSeeds:s.worldSeeds,soulFragments:s.soulFragments},s);assert.deepEqual(s,before);
  for(const field of ['itemWorld','soulbound'])for(const location of ['equipment','inventory','pendingLoot','unrelated'])for(const inherited of [false,true]){
    const data=game.createGame();let target;if(location==='equipment')target=data.equipment.weapon;else if(location==='unrelated'){data.unrelated={deep:{}};target=data.unrelated.deep;}else{data[location]=[weapon('held')];target=data[location][0];}
    if(inherited)Object.setPrototypeOf(target,{[field]:{version:1,level:1}});else target[field]={version:1,level:1};assert.throws(()=>legacyState(data),/must never hide/);
  }
  let reads=0;const data=game.createGame();data.deep={};Object.defineProperty(data.deep,'future',{enumerable:true,get(){reads++;throw Error('not data');}});assert.throws(()=>legacyState(data),/inert data/);assert.equal(reads,0);
});
