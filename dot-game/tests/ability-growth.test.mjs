import { legacyState, legacyEnvelope } from './helpers/soulbind-compat.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,advance,stats,validateSave,abilityView,MAJOR_ABILITIES,ABILITY_RULES,VERSION,expeditionReports} from '../src/engine.js';
import * as historicalV014 from './fixtures/v0.14/engine.js';
import * as baseline from './fixtures/v0.8.1/engine.js';

const ids=['hp-tank','mp-tank','one-handed-damage'];
const actions=['learnAbility','slotAbility','unslotAbility','refundAbility'];
const clone=value=>structuredClone(value);
const json=value=>JSON.stringify(value);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const row=(s,id)=>abilityView(s).catalog.find(ability=>ability.id===id);
function profile(level=4,proficiency=0) {
  const s=createGame(13);s.hero.level=level;s.hero.proficiency=proficiency;
  return validateSave(s);
}
function learnAndSlot(s,...selected) {
  for(const id of selected){act(s,'learnAbility',id);act(s,'slotAbility',id);}return s;
}
function unchanged(s,fn) {const before=json(s);fn();assert.equal(json(s),before);}
function run(s) {
  const wins=s.wins;act(s,'start');
  for(let i=0;i<10000&&s.wins===wins&&s.mode==='battle';i++)advance(s,.1);
  assert.equal(s.wins,wins+1);act(s,'retreat');return expeditionReports(s)[0];
}

test('ability growth: fixed three rank-one Major entries, original costs and five-slot capacity',()=>{
  assert.equal(VERSION,3);assert.deepEqual(ABILITY_RULES,{majorSlots:5});
  assert.deepEqual(MAJOR_ABILITIES.map(({id,apCost,minLevel,rank})=>({id,apCost,minLevel,rank})),
    ids.map((id,i)=>({id,apCost:i===2?2:1,minLevel:0,rank:1})));
  assert.ok(Object.isFrozen(MAJOR_ABILITIES)&&Object.isFrozen(ABILITY_RULES));
  assert.ok(MAJOR_ABILITIES.every(Object.isFrozen));
});

test('ability growth: new/default game has one derived AP and no durable allocation field',()=>{
  const s=createGame(),view=abilityView(s);
  assert.equal(Object.hasOwn(s,'abilities'),false);
  assert.deepEqual(legacyState(s),baseline.createGame());
  assert.deepEqual(stats(s),{...baseline.stats(s),parry:.035});
  assert.equal(view.earnedAp,1);assert.equal(view.spentAp,0);assert.equal(view.availableAp,1);
  assert.equal(view.majorCapacity,5);assert.equal(view.majorUsed,0);
  assert.equal(row(s,'hp-tank').canLearn,true);assert.equal(row(s,'mp-tank').canLearn,true);
  assert.equal(row(s,'one-handed-damage').canLearn,false);
  assert.ok(view.catalog.every(ability=>!ability.canSlot&&!ability.canRefund&&!ability.canUnslot));
});

for(const level of [1,2,3,4,19,100,500])test(`ability growth: Lv${level} derives exactly ${level} AP without grant state`,()=>{
  const s=profile(level),view=abilityView(s);
  assert.equal(view.earnedAp,level);assert.equal(view.availableAp,level);
  assert.equal(Object.hasOwn(s,'abilities'),false);
  const reloaded=validateSave(clone(s));assert.equal(abilityView(reloaded).earnedAp,level);
});

test('ability growth: learn and slot are separate; unassigned learning spends AP but grants nothing',()=>{
  const s=profile(4,3),original=stats(s);
  for(const id of ids){act(s,'learnAbility',id);assert.deepEqual(stats(s),original);}
  assert.equal(abilityView(s).spentAp,4);assert.equal(abilityView(s).availableAp,0);
  assert.equal(abilityView(s).majorUsed,0);
  for(const id of ids){assert.equal(row(s,id).canSlot,true);act(s,'slotAbility',id);}
  assert.equal(abilityView(s).majorUsed,3);assert.equal(abilityView(s).majorCapacity,5);
  assert.deepEqual(s.abilities,{learned:ids,slotted:ids});
  assert.ok(stats(s).maxHp>original.maxHp&&stats(s).maxMp>original.maxMp&&stats(s).attack>original.attack);
});

test('ability growth: AP shortage never auto-refunds another choice or grants a slot',()=>{
  const s=createGame();act(s,'learnAbility','hp-tank');
  unchanged(s,()=>act(s,'learnAbility','mp-tank'));
  unchanged(s,()=>act(s,'learnAbility','one-handed-damage'));
  unchanged(s,()=>act(s,'slotAbility','mp-tank'));
  assert.deepEqual(s.abilities,{learned:['hp-tank'],slotted:[]});
});

test('ability growth: reslotting is free; unassignment keeps spent AP, refund removes active slot and exact cost',()=>{
  const s=learnAndSlot(profile(4,3),...ids),gold=s.hero.gold;
  act(s,'unslotAbility','one-handed-damage');
  assert.equal(abilityView(s).availableAp,0);assert.equal(row(s,'one-handed-damage').learned,true);
  assert.equal(abilityView(s).effects.attackBonus,0);
  act(s,'slotAbility','one-handed-damage');assert.equal(abilityView(s).effects.attackBonus,6);
  act(s,'refundAbility','one-handed-damage');
  assert.equal(abilityView(s).availableAp,2);assert.equal(row(s,'one-handed-damage').learned,false);
  assert.equal(row(s,'one-handed-damage').slotted,false);assert.equal(s.hero.gold,gold);
  act(s,'refundAbility','hp-tank');assert.equal(abilityView(s).availableAp,3);
  act(s,'refundAbility','mp-tank');assert.equal(abilityView(s).availableAp,4);
  assert.equal(Object.hasOwn(s,'abilities'),false);
});

test('ability growth: unknown/non-string/prototype-looking payloads cannot execute or mutate state',()=>{
  const s=profile();let calls=0;
  const hostile={toString(){calls++;return 'hp-tank';},get id(){calls++;return 'hp-tank';}};
  for(const action of actions)for(const payload of [undefined,null,false,1,[],{},hostile,new String('hp-tank'),
    '__proto__','constructor','HP Tank','hp-tank ','hp-tank-2','support-hp',Symbol('hp-tank'),()=>{}])
    unchanged(s,()=>act(s,action,payload));
  assert.equal(calls,0);
});

test('ability growth: all repeated/no-op actions leave even damaged camp pools and logs unchanged',()=>{
  const s=profile();s.hero.hp=1;s.hero.mp=0;
  for(const action of ['slotAbility','unslotAbility','refundAbility'])unchanged(s,()=>act(s,action,'hp-tank'));
  act(s,'learnAbility','hp-tank');s.hero.hp=1;s.hero.mp=0;
  unchanged(s,()=>act(s,'learnAbility','hp-tank'));unchanged(s,()=>act(s,'unslotAbility','hp-tank'));
  act(s,'slotAbility','hp-tank');s.hero.hp=1;s.hero.mp=0;
  unchanged(s,()=>act(s,'slotAbility','hp-tank'));
  act(s,'unslotAbility','hp-tank');s.hero.hp=1;s.hero.mp=0;
  unchanged(s,()=>act(s,'unslotAbility','hp-tank'));
  act(s,'refundAbility','hp-tank');s.hero.hp=1;s.hero.mp=0;
  unchanged(s,()=>act(s,'refundAbility','hp-tank'));
});

for(const mode of ['battle','defeat','other'])test(`ability growth: ${mode} rejects every ability action, even during intermission`,()=>{
  const s=learnAndSlot(profile(),'hp-tank');s.mode=mode;
  for(const phase of ['fight','intermission','idle']){
    s._phase=phase;
    assert.ok(abilityView(s).catalog.every(entry=>!entry.canLearn&&!entry.canSlot&&!entry.canUnslot&&!entry.canRefund));
    for(const action of actions)for(const id of ids)unchanged(s,()=>act(s,action,id));
  }
});

test('ability growth: accepted camp actions restore pools, but never RNG, clocks, currency, items or combat counters',()=>{
  const s=profile(4,2);s.hero.gold=12345;
  const protectedState=()=>json({seed:s.seed,gold:s.hero.gold,equipment:s.equipment,inventory:s.inventory,pending:s.pendingLoot,
    timing:s.timing,battle:s.battle,itemId:s._itemId,eventId:s._eventId,events:s.events,
    clock:s._clock,enemyClock:s._enemyClock,turns:s._turns,rest:s._rest,potions:s.potions,xp:s.hero.xp,proficiency:s.hero.proficiency});
  const before=protectedState();
  for(const action of actions){s.hero.hp=1;s.hero.mp=0;act(s,action,'hp-tank');
    assert.equal(s.hero.hp,stats(s).maxHp);assert.equal(s.hero.mp,stats(s).maxMp);assert.equal(protectedState(),before);}
});

for(const level of [1,2,4,19,500])test(`ability growth: Lv${level} Tank floors the base before separately adding flat gear HP`,()=>{
  const s=profile(level);s.equipment.armor.stats.hp=1234.56;s.equipment.accessory.stats.hp=.12;
  const before=stats(s),hpBase=500+10*level+6*s.hero.attributes.end;
  learnAndSlot(s,'hp-tank');const hp=stats(s);
  assert.equal(hp.maxHp,Math.round(Math.floor(hpBase*1.1)+1234.68));
  assert.deepEqual({...hp,maxHp:before.maxHp},before);
  act(s,'refundAbility','hp-tank');learnAndSlot(s,'mp-tank');const mp=stats(s);
  assert.equal(mp.maxMp,Math.floor((10+level+s.hero.attributes.wis)*1.1));
  assert.deepEqual({...mp,maxMp:before.maxMp},before);
});

for(const [level,proficiency] of [[2,0],[2,.08],[2,1.23456789],[2,10000],[19,22.8],[500,999999]])
  test(`ability growth: 1H level ${level}, proficiency ${proficiency} adds capped contribution before existing rounding`,()=>{
    const s=profile(level,proficiency),before=stats(s),a=s.hero.attributes;
    const raw=Math.max(1,Math.log(3330+2*a.str+a.dex)/Math.log(1.0003)-27029.81)+s.equipment.weapon.stats.attack;
    learnAndSlot(s,'one-handed-damage');const current=stats(s),bonus=2*Math.min(proficiency,1.2*level);
    assert.equal(abilityView(s).effects.attackBonus,bonus);
    assert.equal(current.attack,Math.round((raw+bonus)*100)/100);
    assert.deepEqual({...current,attack:before.attack},before);
  });

test('ability growth: current and hypothetical views detach all arrays/rows/nested stats/effects and never heal or advance',()=>{
  const s=learnAndSlot(profile(4,2),'hp-tank');s.hero.hp=1;s.hero.mp=0;
  const before=json(s),first=abilityView(s),expected=clone(first);
  first.learned.push('tampered');first.slotted.length=0;first.effects.attackBonus=999;first.currentStats.maxHp=999;
  for(const entry of first.catalog){entry.id='tampered';entry.previewStats.attack=999;entry.previewEffects.attackBonus=999;}
  first.catalog.pop();
  assert.deepEqual(abilityView(s),expected);assert.equal(json(s),before);
  const preview=row(s,'one-handed-damage');assert.equal(preview.previewEffects.attackBonus,4);
  assert.equal(preview.previewStats.attack,stats(learnAndSlot(clone(s),'one-handed-damage')).attack);
});

test('ability growth: a hypothetical slot preview does not pretend the player can afford or learn it',()=>{
  const s=createGame(),before=json(s),one=row(s,'one-handed-damage');
  assert.equal(one.canLearn,false);assert.equal(one.canSlot,false);
  assert.equal(one.previewEffects.attackBonus,0);assert.equal(one.previewEffects.effectiveProficiency,0);
  assert.deepEqual(one.previewStats,stats(s));assert.equal(row(s,'hp-tank').previewStats.maxHp,630);
  assert.equal(row(s,'mp-tank').previewStats.maxMp,20);assert.equal(json(s),before);
});

test('ability growth: historical v1 imports stay allocation-free; old reader rejects v2 but drops v1 allocations without losing gold/items',()=>{
  const legacy=profile(4,2);legacy.hero.gold=4321;
  assert.equal(Object.hasOwn(validateSave(clone(legacy)),'abilities'),false);
  const active=learnAndSlot(legacy,...ids);assert.throws(()=>baseline.validateSave(JSON.parse(json(active))),/不支援/);
  const old=baseline.validateSave(legacyEnvelope(active));
  assert.equal(Object.hasOwn(old,'abilities'),false);assert.equal(old.hero.gold,4321);
  assert.deepEqual(old.equipment,active.equipment);assert.deepEqual(old.inventory,active.inventory);
  const migrated=validateSave(old);assert.equal(migrated.version,3);assert.equal(migrated.soulFragments,0);assert.equal(abilityView(migrated).availableAp,4);
});

test('ability growth: roundtrip retains learned and separate slots, recovers exact pools, and does not replay AP grants',()=>{
  const s=learnAndSlot(profile(19,999999),'hp-tank','one-handed-damage');act(s,'learnAbility','mp-tank');
  act(s,'start');advance(s,1.1);s.hero.hp=1;s.hero.mp=0;
  const raw=JSON.parse(json(s)),before=json(raw),loaded=validateSave(raw);
  assert.equal(json(raw),before);assert.deepEqual(loaded.abilities,s.abilities);assert.equal(loaded.mode,'town');
  assert.equal(loaded.hero.hp,stats(loaded).maxHp);assert.equal(loaded.hero.mp,stats(loaded).maxMp);
  assert.equal(abilityView(loaded).availableAp,15);assert.equal(abilityView(loaded).effects.attackBonus,45.6);
  for(let n=0;n<4;n++){const again=validateSave(clone(loaded));assert.equal(abilityView(again).availableAp,15);assert.deepEqual(again.abilities,loaded.abilities);}
});

test('ability growth: an explicitly empty valid allocation normalizes to legacy omission',()=>{
  const s=createGame();s.abilities={learned:[],slotted:[]};
  const loaded=validateSave(s);assert.equal(Object.hasOwn(loaded,'abilities'),false);
  assert.deepEqual(stats(s),{...baseline.stats(s),parry:.035});
});

const malformed=[undefined,null,false,0,'hp-tank',[],{},
  {learned:[]},{slotted:[]},{learned:null,slotted:[]},{learned:[],slotted:'hp-tank'},
  {learned:['unknown'],slotted:[]},{learned:['HP Tank'],slotted:[]},{learned:[1],slotted:[]},
  {learned:[{id:'hp-tank'}],slotted:[]},{learned:['hp-tank','hp-tank'],slotted:[]},
  {learned:['hp-tank'],slotted:['hp-tank','hp-tank']},{learned:[],slotted:['hp-tank']},
  {learned:['hp-tank'],slotted:['mp-tank']},{learned:['hp-tank'],slotted:['unknown']},
  {learned:['hp-tank'],slotted:[],rank:2},{learned:['hp-tank'],slotted:[],ap:999},
  {learned:['hp-tank'],slotted:[],support:[]},{learned:['hp-tank'],slotted:[],slots:99},
  {learned:['hp-tank','mp-tank','one-handed-damage','other'],slotted:[]}];
for(const [index,allocation] of malformed.entries())test(`ability growth: malformed supplied allocation ${index} rejects the whole save`,()=>{
  const s=profile();s.abilities=allocation;const before=clone(s);
  assert.throws(()=>validateSave(s),/能力配置/);assert.deepEqual(s,before);
  for(const action of actions)unchanged(s,()=>act(s,action,'hp-tank'));
});

test('ability growth: over-budget import cannot be rescued by invented earned/spent/AP-training fields',()=>{
  const s=createGame();s.ap=999;s.earnedAp=999;s.abilityPoints=999;s.hero.ap=999;s.training={abilityBoost:999};
  for(const learned of [['one-handed-damage'],['hp-tank','mp-tank'],ids]){
    s.abilities={learned,slotted:[]};assert.throws(()=>validateSave(s),/能力配置/);
  }
  delete s.abilities;assert.equal(abilityView(validateSave(s)).availableAp,1);
});

test('ability growth: unsupported descriptors/accessors/sparse lists/extra metadata are rejected without invoking getters',()=>{
  let reads=0;
  const allocations=[];
  const accessor={slotted:[]};Object.defineProperty(accessor,'learned',{enumerable:true,get(){reads++;return [];}});allocations.push(accessor);
  const hidden={learned:[],slotted:[]};Object.defineProperty(hidden,'rank',{value:1});allocations.push(hidden);
  const symbol={learned:[],slotted:[]};symbol[Symbol('rank')]=1;allocations.push(symbol);
  allocations.push(Object.assign(Object.create({rank:1}),{learned:[],slotted:[]}));
  const sparse=new Array(1);allocations.push({learned:sparse,slotted:[]});
  const withKey=[];withKey.rank=1;allocations.push({learned:withKey,slotted:[]});
  const withSymbol=[];withSymbol[Symbol('rank')]=1;allocations.push({learned:withSymbol,slotted:[]});
  const arrayGetter=['hp-tank'];Object.defineProperty(arrayGetter,'0',{enumerable:true,get(){reads++;return 'hp-tank';}});
  allocations.push({learned:arrayGetter,slotted:[]});
  for(const allocation of allocations){const s=profile();s.abilities=allocation;assert.throws(()=>validateSave(s),/能力配置/);for(const action of actions)act(s,action,'hp-tank');}
  const root=createGame();Object.defineProperty(root,'abilities',{enumerable:true,get(){reads++;return {learned:[],slotted:[]};}});
  assert.throws(()=>validateSave(root),/能力配置/);
  const inherited=Object.assign(Object.create({abilities:{learned:[],slotted:[]}}),createGame());
  assert.throws(()=>validateSave(inherited),/能力配置/);assert.equal(reads,0);
});

test('ability growth: default natural combat stays identical until the intentional new first-clear rapier roll',()=>{
  const s=createGame(1),old=baseline.createGame(1);act(s,'start');baseline.act(old,'start');
  for(let n=0;n<800&&!s.wins;n++){
    const before=json(s);abilityView(s);assert.equal(json(s),before);
    advance(s,.1);baseline.advance(old,.1);
    if(!s.wins)assert.equal(json(legacyState(s)),json(old));
    else for(const key of ['hero','battle','timing','equipment','kills','wins'])assert.deepEqual(s[key],old[key],key);
  }
  assert.equal(s.wins,1);assert.equal(abilityView(s).earnedAp,s.hero.level);assert.equal(s.hero.level,2);
});

test('ability growth: naturally earned AP supports a real second-expedition 1H benefit without replaying rewards',()=>{
  // Acquire the original example through frozen own v0.14 so the intentional
  // new rapier roll does not rewrite the historical example's following RNG.
  const earned=historicalV014.createGame(1);historicalV014.act(earned,'start');
  while(!earned.wins&&earned.mode==='battle')historicalV014.advance(earned,.1);historicalV014.act(earned,'retreat');assert.equal(earned.hero.level,2);assert.equal(abilityView(earned).availableAp,2);
  const plain=validateSave(clone(earned)),active=validateSave(clone(earned));
  learnAndSlot(active,'one-handed-damage');assert.equal(abilityView(active).availableAp,0);
  const unbuffed=run(plain),buffed=run(active);
  assert.equal(unbuffed.outcome,'win');assert.equal(buffed.outcome,'win');
  assert.equal(unbuffed.startStats.attack,42.9);assert.equal(buffed.startStats.attack,45.3);
  near(unbuffed.elapsed,27.3);near(buffed.elapsed,26.3);
  assert.ok(buffed.elapsed<unbuffed.elapsed);assert.ok(active.hero.proficiency>earned.hero.proficiency);
  assert.equal(abilityView(active).earnedAp,active.hero.level);
  assert.equal(abilityView(active).availableAp,active.hero.level-2);
  const budget=abilityView(active).availableAp;act(active,'retreat');advance(active,2);
  assert.equal(abilityView(active).availableAp,budget);
});
