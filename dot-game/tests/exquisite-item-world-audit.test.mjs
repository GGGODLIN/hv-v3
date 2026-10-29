import {withoutLootReceipts} from './helpers/without-loot-receipts.mjs';
import {withWaveGrowthFix} from './helpers/wave-growth-baseline.mjs';
// v056: historical parity includes the isolated post-kill HP correction, not its old defect.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import * as loot from '../src/loot.js';
const previous = await withWaveGrowthFix(new URL('./fixtures/v0.25/src/engine.js',import.meta.url));
import * as previousLoot from './fixtures/v0.25/src/loot.js';

// Independent synthetic boundary tests, not earned progression or browser play.
const copy=structuredClone;
const held=s=>[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];
const find=(s,id='exquisite-audit')=>held(s).find(i=>i.id===id);
function weapon(family='rapier',level=3){
  const draws=[(['axe','rapier','club'].indexOf(family)+.5)/3,.8];
  const item={...loot.generateItem(()=>draws.shift()??.5,level,'weapon'),id:'exquisite-audit'};
  assert.equal(item.quality,'Exquisite');assert.equal(loot.resolveWeaponFamily(item),family);return item;
}
function fixture({family='rapier',level=16,equipped=false}={}){
  const s=game.createGame(42);s.hero.level=level;s.hero.xpNext=game.cumulativeXp(level+1)-game.cumulativeXp(level);
  for(const key of Object.keys(s.hero.attributes))s.hero.attributes[key]=8+(level-1)*2;
  s.worldSeeds=2;s.soulFragments=100;s.hero.gold=777;s.wins=4;s.battle.cleared=4;
  const bound=loot.createSoulboundItem(weapon(family),level);assert.ok(bound);
  if(equipped)s.equipment.weapon=bound;else s.inventory=[bound];
  const p=game.stats(s);s.hero.hp=p.maxHp;s.hero.mp=p.maxMp;return s;
}
function quote(s){const q=game.previewItemWorld(s,'exquisite-audit');assert.equal(q.available,true,q.reason);return q;}
function refuse(s,q){const before=copy(s);game.act(s,'enterItemWorld',q);assert.deepEqual(s,before);assert.deepEqual(game.itemWorldView(s),{active:false});}
function expected(anchor,level){return Object.fromEntries(Object.entries(anchor.stats).map(([key,value])=>{
  const rate=['crit','evade','block'].includes(key),scale=rate||key==='parry'?2000:key==='attack'?50/3:key==='hp'?12:20;
  const raw=value*(1+level/scale)/(1+anchor.level/scale)*(key==='attack'?1.02:1.01);
  return [key,rate?Math.round(Math.min(.16,raw)*1e4)/1e4:key==='parry'?Math.round(raw*1e4)/1e4:Math.round(raw)];
}));}

test('v026 audit: Exquisite all-family exact anchor arithmetic and direct/stepwise future growth',()=>{
  for(const family of ['axe','rapier','club']){
    const s=fixture({family}),original=copy(find(s)),q=quote(s);assert.deepEqual(q.after.stats,expected(original.soulbound,16));
    let stepped=q.after;for(let level=17;level<=500;level++)stepped=loot.scaleSoulboundItem(stepped,level);
    assert.deepEqual(stepped,loot.scaleSoulboundItem(q.after,500));assert.deepEqual(stepped.stats,expected(original.soulbound,500));
    assert.deepEqual(stepped.soulbound,original.soulbound);assert.deepEqual(stepped.rolls,original.rolls);
    for(const key of ['id','name','prefix','suffix','weaponFamily','quality'])assert.equal(stepped[key],original[key]);
    assert.deepEqual(find(s),original,'quote/scaling are pure');
  }
});

test('v026 audit: absent old parry remains absent; rate cap and neutral rounding are preserved',()=>{
  const raw=weapon();delete raw.stats.parry;delete raw.rolls.parry;raw.stats.crit=.1599;raw.stats.defense=1;raw.power=loot.scoreItem(raw);
  const bound=loot.createSoulboundItem(raw,3),after=loot.createItemWorldUpgrade(bound,3);assert.ok(after);
  assert.equal(after.stats.crit,.16);assert.equal(after.stats.defense,1);
  for(const item of [bound,after,loot.scaleSoulboundItem(after,500)]){
    assert.equal(Object.hasOwn(item.stats,'parry'),false);assert.equal(Object.hasOwn(item.soulbound.stats,'parry'),false);assert.equal(Object.hasOwn(item.rolls,'parry'),false);
  }
});

test('v026 audit: Exquisite current and future overflow rejected before quote/payment',()=>{
  const raw=weapon('axe',1);raw.stats={attack:17000};delete raw.rolls;raw.power=loot.scoreItem(raw);
  const bound=loot.createSoulboundItem(raw,1);assert.ok(bound);assert.ok(loot.scaleSoulboundItem(bound,500));assert.equal(loot.createItemWorldUpgrade(bound,1),null);
  const s=fixture({level:3});s.inventory=[loot.scaleSoulboundItem(bound,3)];s.inventory[0].id='exquisite-audit';
  const q=game.previewItemWorld(s,'exquisite-audit');assert.equal(q.available,false);refuse(s,q);
  const bad=fixture();bad.inventory[0].stats.attack++;assert.equal(game.previewItemWorld(bad,'exquisite-audit').available,false);assert.throws(()=>game.validateSave(bad));
});

test('v026 audit: upgraded cache rejection checks every location, metadata level and anchor field',()=>{
  const template=fixture(),upgrade=quote(template).after;
  const changes=[i=>i.itemWorld.level=2,i=>i.itemWorld.level=15,i=>i.itemWorld.level='1',i=>i.itemWorld.version=2,i=>i.itemWorld.extra=0,i=>i.soulbound.stats.attack++,i=>i.soulbound.level++,i=>i.stats.attack++,i=>i.power++,i=>i.locked=false,i=>delete i.soulbound];
  for(const place of ['equipment','inventory','pendingLoot'])for(const change of changes){
    const s=game.createGame(),item=copy(upgrade);s.hero.level=16;change(item);
    if(place==='equipment')s.equipment.weapon=item;else s[place]=[item];const before=copy(s);assert.throws(()=>game.validateSave(s));assert.deepEqual(s,before);
  }
  const s=fixture();s.inventory[0]=copy(upgrade);const loaded=game.validateSave(copy(s));assert.deepEqual(find(loaded),upgrade);assert.equal(loaded.version,3);
});

test('v026 audit: malformed unrelated held/pending Exquisite metadata cannot be hidden by a legal target quote',()=>{
  for(const place of ['equipment','inventory','pendingLoot']){
    const s=fixture(),foreign={...copy(quote(s).after),id:'foreign'};foreign.stats.attack++;
    if(place==='equipment')s.equipment.weapon=foreign;else s[place].push(foreign);
    assert.equal(game.previewItemWorld(s,'exquisite-audit').available,false);assert.throws(()=>game.validateSave(copy(s)));
  }
});

test('v026 audit: exact Exquisite consent invalidates on target ownership/build/currency changes',()=>{
  const changes=[s=>s.worldSeeds--,s=>s.soulFragments++,s=>s.seed++,s=>s.hero.gold++,s=>s.inventory[0].stats.attack++,s=>s.inventory[0].soulbound.stats.attack++,s=>s.inventory[0].quality='Superior',s=>game.act(s,'equip','exquisite-audit'),s=>game.act(s,'saveGearSet','a'),s=>s.pendingLoot.push({...weapon(),id:'pending'}),s=>s.inventory.push({...weapon(),id:'foreign'})];
  for(const change of changes){const s=fixture(),q=quote(s);s.inventory=copy(s.inventory);change(s);refuse(s,q);}
  for(const change of [q=>q.cost=0,q=>q.id='foreign',q=>q.after.stats.attack++,q=>q.rounds=4,q=>q.strengthStage=6,q=>q.quoteBasis+=' ',q=>q.extra=true]){const s=fixture(),q=quote(s);change(q);refuse(s,q);}
});

test('v026 audit: Exquisite entry pays once, keeps target location, and reload never awards/refunds',()=>{
  for(const equipped of [false,true]){
    const s=fixture({equipped}),before=copy(find(s)),worn=s.equipment.weapon.id,q=quote(s);game.act(s,'enterItemWorld',q);
    assert.equal(s.worldSeeds,1);assert.equal(s.equipment.weapon.id,worn);assert.deepEqual(find(s),before);assert.equal(s.totalWaves,5);
    const paid=copy(s);game.act(s,'enterItemWorld',q);assert.deepEqual(s,paid);
    const loaded=game.validateSave(JSON.parse(JSON.stringify(s)));assert.equal(loaded.mode,'town');assert.equal(loaded.worldSeeds,1);assert.equal(find(loaded).itemWorld,undefined);assert.deepEqual(find(loaded),before);
    game.act(s,'retreat');assert.equal(s.worldSeeds,1);assert.equal(s.mode,'town');assert.equal(find(s).itemWorld,undefined);
  }
});

test('v026 audit: ordinary simulation completes one Exquisite trial, no ordinary rewards/repeat, same-ID preservation',()=>{
  for(const equipped of [false,true]){
    const s=fixture({family:'club',equipped}),before=copy(find(s)),normal={wins:s.wins,fragments:s.soulFragments,cleared:s.battle.cleared,stage:s.stage,unlocked:s.unlocked};
    if(equipped)game.act(s,'saveGearSet','a');const sets=copy(s.gearSets);game.act(s,'enterItemWorld',quote(s));let n=0;
    while(game.itemWorldView(s).active&&n++<10000)game.advance(s,.25);assert.ok(n<10000);assert.equal(find(s).itemWorld?.level,1);assert.equal(s.mode,'town');
    assert.deepEqual({wins:s.wins,fragments:s.soulFragments,cleared:s.battle.cleared,stage:s.stage,unlocked:s.unlocked},normal);assert.equal(s.worldSeeds,1);assert.deepEqual(s.gearSets,sets);
    assert.deepEqual(find(s).stats,expected(before.soulbound,s.hero.level));assert.deepEqual(find(s).soulbound,before.soulbound);assert.deepEqual(find(s).rolls,before.rolls);
    const q=game.previewItemWorld(s,'exquisite-audit');assert.equal(q.available,false);refuse(s,q);const snapshot=copy(s);game.advance(s,100);assert.deepEqual(s,snapshot);
    const loaded=game.validateSave(copy(s));assert.deepEqual(find(loaded),find(s));assert.equal(game.previewSelectedSale(loaded,['exquisite-audit']).available,false);
  }
});

test('v026 audit: nonallowed qualities remain invalid even with a numerically coherent Exquisite-derived IW cache',()=>{
  const after=quote(fixture()).after;
  for(const quality of ['Crude','Magnificent','Legendary','Peerless']){
    const s=fixture(),item=copy(after);item.quality=quality;s.inventory=[item];assert.equal(loot.isSoulboundItem(item),false);assert.equal(loot.scaleSoulboundItem(item,500),null);assert.throws(()=>game.validateSave(s));assert.equal(game.previewItemWorld(s,item.id).available,false);
  }
});


test('v026 audit: all previously eligible quality/family/level IW outputs equal exact frozen v025',()=>{
  for(const qualityDraw of [.03,.4,.5])for(const family of ['axe','rapier','club'])for(const level of [3,16,100,500]){
    const draws=[(['axe','rapier','club'].indexOf(family)+.5)/3,qualityDraw];
    const raw={...loot.generateItem(()=>draws.shift()??.5,3,'weapon'),id:'legacy-eligible'};
    const now=loot.createSoulboundItem(raw,level),old=previousLoot.createSoulboundItem(raw,level);assert.deepEqual(now,old);
    assert.deepEqual(loot.createItemWorldUpgrade(now,level),previousLoot.createItemWorldUpgrade(old,level));
  }
});

test('v026 audit: 36 natural ordinary runs match exact v025 state/RNG/rewards at every pulse',t=>{
  let pulses=0,totalWins=0;
  for(const seed of [1,42,77]){
    const now=game.createGame(seed),old=previous.createGame(seed);
    for(let run=0;run<12;run++){
      for(const [api,s] of [[game,now],[previous,old]]){
        for(const slot of ['weapon','armor','accessory']){const best=[s.equipment[slot],...s.inventory.filter(i=>i.slot===slot)].reduce((a,b)=>loot.scoreItem(a)>=loot.scoreItem(b)?a:b);if(best.id!==s.equipment[slot].id)api.act(s,'equip',best.id);}
        api.act(s,'selectStage',Math.min(1+run%4,s.unlocked));api.act(s,'setStrategy',['balanced','assault','sustain'][run%3]);
        for(const id of ['hp-tank','mp-tank','one-handed-damage']){api.act(s,'learnAbility',id);api.act(s,'slotAbility',id);}
        api.act(s,'start');api.act(s,'finishThenCamp',true);
      }
      assert.deepEqual(now,old);let n=0;
      while(now.mode==='battle'&&n++<20000){game.advance(now,.25);previous.advance(old,.25);assert.deepEqual(now,old);assert.deepEqual(withoutLootReceipts(game.expeditionReports(now)),previous.expeditionReports(old));pulses++;}
      assert.ok(n<20000);assert.deepEqual(now,old);
    }
    totalWins+=now.wins;
  }
  t.diagnostic(JSON.stringify({seeds:[1,42,77],attempts:36,totalWins,pulses,exact:'entire state and RNG exact; historical reports exclude only v070 loot observations'}));
});
