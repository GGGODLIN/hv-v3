import test from 'node:test';
import assert from 'node:assert/strict';
import {QUALITY_TIERS,ITEM_WORLD_QUALITIES,generateItem,createCommissionWeapon,createSoulboundItem,
  createItemWorldUpgrade,scaleSoulboundItem,isSoulboundItem,hasUnknownSaleMetadata,classifySafeLootItem,scoreItem,itemSalePrice} from '../src/loot.js';
const clone=structuredClone;
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
function tierWeapon(quality,family='axe',level=3){
  const index=QUALITY_TIERS.findIndex(tier=>tier.name===quality),tier=QUALITY_TIERS[index];
  const low=QUALITY_TIERS.slice(0,index).reduce((n,t)=>n+t.weight,0);
  const draws=[(['axe','rapier','club'].indexOf(family)+.5)/3,(low+tier.weight/2)/100];
  return {...generateItem(()=>draws.shift()??.5,level,'weapon'),id:'loot-1'};
}
function expected(anchor,level){return Object.fromEntries(Object.entries(anchor.stats).map(([key,value])=>{
  const rate=['crit','evade','block'].includes(key),scale=rate||key==='parry'?2000:key==='attack'?50/3:key==='hp'?12:20;
  const raw=value*(1+level/scale)/(1+anchor.level/scale)*(key==='attack'?1.02:1.01);
  return [key,rate?Math.round(Math.min(.16,raw)*1e4)/1e4:key==='parry'?Math.round(raw*1e4)/1e4:Math.round(raw)];
}));}

test('IW loot: exactly Fair/Average/Superior recognized bound families support IW0 to IW1',()=>{
  assert.deepEqual(ITEM_WORLD_QUALITIES,['Fair','Average','Superior']);
  for(const tier of QUALITY_TIERS)for(const family of ['axe','rapier','club'])for(const level of [3,15,500]){
    const item=tierWeapon(tier.name,family),bound=createSoulboundItem(item,level),upgraded=createItemWorldUpgrade(bound,level);
    assert.ok(isSoulboundItem(bound));
    if(ITEM_WORLD_QUALITIES.includes(tier.name)){
      assert.ok(upgraded,`${tier.name} ${family} ${level}`);assert.ok(isSoulboundItem(upgraded));
      assert.deepEqual(upgraded.itemWorld,{version:1,level:1});assert.equal(createItemWorldUpgrade(upgraded,level),null);
      assert.equal(upgraded.id,item.id);assert.deepEqual(upgraded.soulbound,bound.soulbound);
      assert.equal(itemSalePrice(upgraded),0);assert.ok(classifySafeLootItem(upgraded));assert.equal(hasUnknownSaleMetadata(upgraded),false);
    }else assert.equal(upgraded,null);
    assert.equal(createItemWorldUpgrade(item,level),null,'unbound always unsupported');
  }
});

test('IW loot: all seven stats combine source level ratio and IW before exactly one rounding',()=>{
  const base=createCommissionWeapon('rapier',3),stats={attack:53,defense:3,hp:14,crit:.1599,evade:.009,block:.008,parry:10.1234};
  const original={...base,stats,power:scoreItem({stats})};let differsFromRoundedCache=false;
  for(const level of [3,4,7,10,15,37,100,250,500]){
    const bound=createSoulboundItem(original,level),upgraded=createItemWorldUpgrade(bound,level);
    assert.deepEqual(upgraded.stats,expected(bound.soulbound,level));assert.equal(upgraded.power,scoreItem(upgraded));
    assert.deepEqual(Object.keys(upgraded.stats),Object.keys(stats));assert.deepEqual(upgraded.soulbound.stats,stats);
    assert.equal(upgraded.stats.crit,.16);assert.ok(upgraded.stats.parry>10);
    if(Math.round(bound.stats.attack*1.02)!==upgraded.stats.attack||Math.round(bound.stats.hp*1.01)!==upgraded.stats.hp)differsFromRoundedCache=true;
  }
  assert.ok(differsFromRoundedCache,'fixture detects multiplying already-rounded stat caches');
});

test('IW loot: repeated future scaling to 500 equals direct anchor derivation with no cumulative drift',()=>{
  const item=tierWeapon('Average','rapier',1),bound=createSoulboundItem(item,1),first=createItemWorldUpgrade(bound,1);
  let stepped=first;
  for(let level=2;level<=500;level++){
    stepped=scaleSoulboundItem(stepped,level);assert.ok(isSoulboundItem(stepped),`level ${level}`);
    assert.deepEqual(stepped.stats,expected(bound.soulbound,level));assert.deepEqual(stepped.soulbound,bound.soulbound);
  }
  assert.deepEqual(stepped,createItemWorldUpgrade(scaleSoulboundItem(bound,500),500));
  assert.deepEqual(scaleSoulboundItem(stepped,500),stepped);
  for(const level of [0,1.5,501,'15',null,NaN,Infinity])assert.equal(createItemWorldUpgrade(bound,level),null);
  assert.equal(createItemWorldUpgrade(createSoulboundItem(item,15),14),null);
});

test('IW loot: frozen inputs remain immutable; detached result never restores missing old parry',()=>{
  const item=tierWeapon('Superior','rapier',3);delete item.stats.parry;delete item.rolls.parry;delete item.weaponFamily;
  item.power=scoreItem(item);const bound=freeze(createSoulboundItem(item,15)),before=clone(bound);
  const upgraded=createItemWorldUpgrade(bound,15);assert.deepEqual(bound,before);
  assert.equal(Object.hasOwn(upgraded.stats,'parry'),false);assert.equal(Object.hasOwn(upgraded.soulbound.stats,'parry'),false);
  assert.equal(Object.hasOwn(scaleSoulboundItem(upgraded,500).stats,'parry'),false);
  assert.ok(Object.isFrozen(upgraded.soulbound));assert.ok(Object.isFrozen(upgraded.soulbound.stats));assert.ok(Object.isFrozen(upgraded.itemWorld));
  assert.notEqual(upgraded.stats,bound.stats);assert.notEqual(upgraded.rolls,bound.rolls);assert.notEqual(upgraded.soulbound,bound.soulbound);
  upgraded.stats.attack=0;upgraded.rolls.attack=0;assert.deepEqual(bound,before);
});

test('IW loot: prospective level500 overflow fails even when current unupgraded bound cache is legal',()=>{
  const base=createCommissionWeapon('axe',1);let candidate;
  for(let attack=16000;attack<18000;attack++){
    const item={...base,stats:{attack},rolls:{attack:110},power:attack*2},bound=createSoulboundItem(item,1);
    if(bound&&!createItemWorldUpgrade(bound,1)){candidate=bound;break;}
  }
  assert.ok(candidate,'found valid source whose IW future power would exceed schema');
  assert.ok(isSoulboundItem(candidate));assert.ok(scaleSoulboundItem(candidate,500));
  for(const level of [1,2,100,500])assert.equal(createItemWorldUpgrade(scaleSoulboundItem(candidate,level),level),null);
});

test('IW loot: sparse metadata is exact, bound-only, supported-quality-only and cache-checked',()=>{
  const original=createSoulboundItem(tierWeapon('Superior'),15),upgraded=createItemWorldUpgrade(original,15);
  for(const metadata of [null,{},[],{version:1,level:0},{version:1,level:2},{version:1,level:10},{version:2,level:1},
    {version:1,level:1,extra:0},{version:1,level:'1'},{version:1,level:1.5}]){
    const invalid={...clone(upgraded),itemWorld:metadata};assert.equal(isSoulboundItem(invalid),false);assert.equal(hasUnknownSaleMetadata(invalid),true);assert.equal(scaleSoulboundItem(invalid,500),null);
  }
  for(const mutate of [i=>{delete i.soulbound;},i=>{i.stats.attack++;},i=>{i.power++;},i=>{i.locked=false;},i=>{delete i.itemWorld;}]){
    const invalid=clone(upgraded);mutate(invalid);assert.equal(isSoulboundItem(invalid),false);assert.equal(hasUnknownSaleMetadata(invalid),true);
  }
  for(const quality of ['Crude','Exquisite','Legendary']){
    const bound=createSoulboundItem(tierWeapon(quality),15);bound.itemWorld={version:1,level:1};assert.equal(isSoulboundItem(bound),false);
  }
});

test('IW loot: nested accessors, inherited metadata, symbols and unknowns fail without execution',()=>{
  let calls=0;const get=()=>{calls++;throw Error('must not execute');};
  const source=createItemWorldUpgrade(createSoulboundItem(tierWeapon('Fair','club'),15),15);
  for(const path of ['item','world','anchor','stats']){
    const invalid=clone(source),object=path==='item'?invalid:path==='world'?invalid.itemWorld:path==='anchor'?invalid.soulbound:invalid.stats;
    const key=path==='item'?'itemWorld':path==='world'?'level':path==='anchor'?'version':'attack';
    Object.defineProperty(object,key,{get,enumerable:true});assert.equal(isSoulboundItem(invalid),false);assert.equal(hasUnknownSaleMetadata(invalid),true);assert.equal(createItemWorldUpgrade(invalid,15),null);
  }
  for(const mutate of [i=>{i.itemWorld[Symbol('x')]=1;},i=>{Object.setPrototypeOf(i.itemWorld,{future:true});},i=>{Object.defineProperty(i.itemWorld,'level',{enumerable:false});},i=>{i.future=1;}]){
    const invalid=clone(source);mutate(invalid);assert.equal(isSoulboundItem(invalid),false);assert.equal(classifySafeLootItem(invalid),null);
  }
  assert.equal(calls,0);
});
