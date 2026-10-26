import test from 'node:test';
import assert from 'node:assert/strict';
import {generateItem,createCommissionWeapon,qualityFactor,scoreItem,describeItem,hasUnknownSaleMetadata,classifySafeLootItem,dominanceWitness,resolveWeaponFamily,itemSalePrice} from '../src/loot.js';
import {createGame,stats,act,advance,validateSave,previewSafeSale,previewSelectedSale,previewGearSet,gearSetsView,previewWeaponCommission,resolveAttack} from '../src/engine.js';
const clone=x=>structuredClone(x);
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};}
function generated(seed,level=20){const x=generateItem(rng(seed),level,'weapon');x.id=`loot-${seed}`;return x;}
function expectedParry(item){const [lo,hi]=item.suffix==='靈巧'?[137*.0894,301*.0894]:[75*.0894,211*.0894];return Math.round((lo+(hi-lo)*qualityFactor(item.rolls.parry))*(1+item.level/2000)*10000)/10000;}
const rapier=()=>createCommissionWeapon('rapier',20);
function held(){const s=createGame(42),x=rapier();x.id='loot-1';s.inventory.push(x);s._itemId=1;return {s,x};}

for(const level of [1,20,100,500])test(`parry commission original rating endpoints at level ${level}`,()=>{
 const x=createCommissionWeapon('rapier',level);assert.equal(x.stats.parry,expectedParry(x));assert.equal(x.rolls.parry,110);assert.ok(x.stats.parry>1);assert.equal(x.power,scoreItem(x));
 assert.match(describeItem(x),/招架值 \+\d+\.\d(?: ·|$)/);assert.doesNotMatch(describeItem(x),/招架值[^·]*%/);
});
test('parry generation legal Nimble rapier only; every generated rating follows independent equation',()=>{
 let nimble=0,ordinary=0,high=0;const suffixes=new Set();
 for(let seed=1;seed<=3000;seed++){
  const x=generated(seed,500);assert.equal(hasUnknownSaleMetadata(x),false);assert.ok(classifySafeLootItem(x));
  if(x.weaponFamily==='rapier'){assert.equal(x.stats.parry,expectedParry(x));assert.ok(x.rolls.parry>=0&&x.rolls.parry<=200);suffixes.add(x.suffix);x.suffix==='靈巧'?nimble++:ordinary++;if(x.stats.parry>16)high++;}
  else{assert.equal(x.stats.parry,undefined);assert.equal(x.rolls.parry,undefined);assert.notEqual(x.suffix,'靈巧');}
 }
 assert.ok(nimble>0&&ordinary>0&&high>0);assert.ok(suffixes.has('屠戮')&&suffixes.has('平衡')&&suffixes.has('靈巧'));
});
test('parry maximum rating is not clipped by probability cap',()=>{
 const values=[.5,.9999,0,.99,.9999,.9999,.9999,.9999,.9999];let i=0;
 const x=generateItem(()=>values[i++]??.9999,1000,'weapon');assert.equal(x.weaponFamily,'rapier');assert.equal(x.suffix,'靈巧');assert.equal(x.stats.parry,Math.round(301*.0894*1.5*10000)/10000);assert.ok(x.stats.parry>40);
});
test('parry missing old item remains absent and retains its score',()=>{
 const x=rapier();delete x.stats.parry;delete x.rolls.parry;x.power=scoreItem(x);const before=clone(x),s=createGame(5);x.id='loot-1';s.inventory.push(x);s._itemId=1;
 const restored=validateSave(s);assert.equal(restored.inventory[0].stats.parry,undefined);assert.deepEqual(restored.inventory[0].stats,before.stats);assert.equal(restored.inventory[0].power,before.power);assert.equal(stats(s).parry,.035);
});
test('parry score adds rating weight without mutating existing stats',()=>{
 const x=rapier(),old=clone(x);delete old.stats.parry;const expected=Math.round(old.stats.attack*2+old.stats.crit*260+x.stats.parry*1.8);assert.equal(scoreItem(x),expected);assert.deepEqual(x.stats,rapier().stats);
});
test('Nimble exact identity supports family and safe-sale but rejects false families',()=>{
 let x;for(let seed=1;seed<3000;seed++){const next=generated(seed);if(next.suffix==='靈巧'){x=next;break;}}assert.ok(x);
 const old=clone(x);delete old.weaponFamily;assert.equal(resolveWeaponFamily(old),'rapier');assert.ok(classifySafeLootItem(old));
 assert.equal(classifySafeLootItem({...x,name:x.name.replace('逐風刺劍','裂岩戰棍')}),null);
});
test('parry derived chance retains base and adds equipped rating exactly once with bounded cap',()=>{
 const {s,x}=held();assert.equal(stats(s).parry,.035);act(s,'equip',x.id);assert.equal(stats(s).parry,.035+x.stats.parry/100);
 s.equipment.armor.stats.parry=5;assert.equal(stats(s).parry,.035+(x.stats.parry+5)/100);
 s.equipment.accessory.stats.parry=1000000;assert.equal(stats(s).parry,.5);
});
test('parry resolver uses final fraction; raw rating never enters chance gate',()=>{
 const {s,x}=held();act(s,'equip',x.id);const rolls=[.9,.9,.1,.1];let i=0;
 const hit=resolveAttack({attack:100,trackDefense:true},stats(s),()=>rolls[i++]??.9);assert.equal(hit.outcome,'parry');assert.equal(hit.defenses.parry,2);
 const legacy=createGame();i=0;const old=resolveAttack({attack:100,trackDefense:true},stats(legacy),()=>rolls[i++]??.9);assert.notEqual(old.outcome,'parry');assert.equal(old.defenses.parry,0);
});
test('actual incoming enemy action consumes equipped parry instead of old hardcoded chance',()=>{
 let found=false;
 for(let seed=1;seed<100&&!found;seed++){
  const old=createGame(seed),next=createGame(seed);next.equipment.armor.stats.parry=46.5;
  for(const s of [old,next]){act(s,'start');s._clock=-10;s._enemyClock=1.85;s.events=[];advance(s,.05);}
  const hit=s=>s.events.find(e=>e.target==='hero');
  if(hit(old)?.value>0&&hit(next)?.value===0){assert.equal(stats(next).parry,.5);found=true;}
 }
 assert.ok(found,'found actual incoming event avoided by equipped parry');
});
for(const value of [-1,NaN,Infinity,'12',null,1000001])test(`parry malformed stat rejected ${String(value)}`,()=>{
 const {s,x}=held();x.stats.parry=value;assert.equal(hasUnknownSaleMetadata(x),true);assert.throws(()=>validateSave(s));
});
for(const value of [-1,201,1.2,'10',NaN])test(`parry malformed roll rejected ${String(value)}`,()=>{
 const {s,x}=held();x.rolls.parry=value;assert.equal(hasUnknownSaleMetadata(x),true);assert.throws(()=>validateSave(s));
});
test('parry supported bounds and unknown future field remain strict',()=>{
 const {s,x}=held();for(const value of [0,1,1000000]){x.stats.parry=value;assert.equal(hasUnknownSaleMetadata(x),false);assert.equal(validateSave(s).inventory[0].stats.parry,value);}
 x.stats.futureParry=1;assert.equal(hasUnknownSaleMetadata(x),true);assert.throws(()=>validateSave(s));
});
test('parry getter rejected without executing it in save or previews',()=>{
 const {s,x}=held();let reads=0;Object.defineProperty(x.stats,'parry',{enumerable:true,get(){reads++;return 10;}});
 assert.equal(hasUnknownSaleMetadata(x),true);assert.throws(()=>validateSave(s));assert.equal(previewSelectedSale(s,[x.id]).available,false);assert.deepEqual(previewSafeSale(s),{items:[],total:0});assert.equal(reads,0);
});
test('parry tradeoff prevents safe dominance even when every old stat is better',()=>{
 const base={id:'candidate',name:'普通・逐風刺劍',slot:'weapon',weaponFamily:'rapier',quality:'Average',level:20,power:10,stats:{attack:10,parry:12},locked:false};
 const keeper={...base,id:'keeper',stats:{attack:100,parry:11},locked:true};assert.equal(dominanceWitness(base,[keeper]),null);
 keeper.stats.parry=12;assert.deepEqual(dominanceWitness(base,[keeper]),{keeperId:'keeper',strictlyBetterKeys:['attack']});
 keeper.stats.parry=13;assert.deepEqual(dominanceWitness(base,[keeper]),{keeperId:'keeper',strictlyBetterKeys:['attack','parry']});
 const legacy={...base,stats:{attack:10}};assert.deepEqual(dominanceWitness(legacy,[keeper]),{keeperId:'keeper',strictlyBetterKeys:['attack','parry']});
});
test('parry exact sale quote retains rating and rejects a stale rating atomically',()=>{
 const {s,x}=held();x.locked=false;const preview=previewSelectedSale(s,[x.id]);assert.equal(preview.available,true);assert.equal(preview.items[0].item.stats.parry,x.stats.parry);
 x.stats.parry+=1;const before=clone(s);act(s,'sellSelected',{ids:[x.id],quoteBasis:preview.quoteBasis});assert.deepEqual(s,before);
 const refreshed=previewSelectedSale(s,[x.id]);act(s,'sellSelected',{ids:[x.id],quoteBasis:refreshed.quoteBasis});assert.equal(s.inventory.length,0);assert.equal(s.hero.gold,refreshed.total);
});
test('parry new commission price derives from changed power but old commissions do not gain rating',()=>{
 const s=createGame();s.wins=1;s.hero.gold=10000;
 const p=previewWeaponCommission(s,'rapier');assert.ok(p.item.stats.parry>0);assert.equal(p.price,Math.max(250,4*itemSalePrice(p.item)));
 for(const family of ['axe','club'])assert.equal(createCommissionWeapon(family,20).stats.parry,undefined);
});
test('parry saved gear sets retain exact rating and preview final defensive chance',()=>{
 const {s,x}=held();act(s,'saveGearSet','a');act(s,'equip',x.id);act(s,'saveGearSet','b');
 const restored=validateSave(s);assert.equal(restored.equipment.weapon.stats.parry,x.stats.parry);assert.equal(gearSetsView(restored).valid,true);
 const preview=previewGearSet(restored,'a');assert.equal(preview.currentStats.parry,.035+x.stats.parry/100);assert.equal(preview.nextStats.parry,.035);
});
