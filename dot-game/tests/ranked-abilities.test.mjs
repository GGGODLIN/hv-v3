import { legacyState, legacyEnvelope } from './helpers/soulbind-compat.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,advance,stats,validateSave,abilityView,MAJOR_ABILITIES} from '../src/engine.js';
import * as legacy from './fixtures/v0.10/engine.js';

const ids=['hp-tank','mp-tank','one-handed-damage'];
const gates={'hp-tank':[0,25,50,75,100,120,150,200,250,300],'mp-tank':[0,30,60,90,120,160,210,260,310,350],'one-handed-damage':[0,100,200]};
const costs={'hp-tank':[1,2,3,3,4,4,4,5,5,5],'mp-tank':[1,2,3,3,4,4,4,5,5,5],'one-handed-damage':[2,3,5]};
const actions=['learnAbility','upgradeAbility','slotAbility','unslotAbility','refundAbility'];
const copy=value=>structuredClone(value);
const serialized=value=>JSON.stringify(value);
const row=(s,id)=>abilityView(s).catalog.find(entry=>entry.id===id);
const spent=(id,rank)=>costs[id].slice(0,rank).reduce((sum,cost)=>sum+cost,0);
function profile(level=500,proficiency=1.23456789){const s=createGame(42);s.hero.level=level;s.hero.proficiency=proficiency;return validateSave(s);}
function allocate(s,id,rank=1,active=true){act(s,'learnAbility',id);for(let n=1;n<rank;n++)act(s,'upgradeAbility',id);if(active)act(s,'slotAbility',id);return s;}
function unchanged(s,fn){const before=copy(s);fn();assert.deepEqual(s,before);}
function plain(s){const empty=copy(s);delete empty.abilities;return stats(empty);}
function expected(s,id,rank){
  const before=plain(s),h=s.hero,baseHp=500+10*h.level+6*h.attributes.end,baseMp=10+h.level+h.attributes.wis;
  const sum=key=>Object.values(s.equipment).reduce((total,item)=>total+(item.stats[key]||0),0);
  if(id==='hp-tank')return {...before,maxHp:Math.round(Math.floor(baseHp*(10+rank)/10)+sum('hp'))};
  if(id==='mp-tank')return {...before,maxMp:Math.floor(baseMp*(10+rank)/10)};
  const a=h.attributes,baseAttack=Math.max(1,Math.log(3330+2*a.str+a.dex)/Math.log(1.0003)-27029.81)+sum('attack');
  return {...before,attack:Math.round((baseAttack+(rank+1)*Math.min(h.proficiency,1.2*h.level))*100)/100};
}

test('ranked abilities: complete independent schedules and legacy rank-one catalog metadata',()=>{
  assert.deepEqual(MAJOR_ABILITIES,legacy.MAJOR_ABILITIES);
  const s=profile();
  for(const id of ids){
    const original=row(s,id);assert.equal(original.currentRank,0);assert.equal(original.maxRank,gates[id].length);
    assert.equal(original.spentAp,0);assert.equal(original.canUpgrade,false);
    assert.equal(original.upgradePreviewStats,null);assert.equal(original.upgradePreviewEffects,null);
    for(let rank=1;rank<=gates[id].length;rank++){
      const next=row(s,id).nextRank;
      assert.deepEqual({rank:next.rank,minLevel:next.minLevel,apCost:next.apCost},{rank,minLevel:gates[id][rank-1],apCost:costs[id][rank-1]});
      act(s,rank===1?'learnAbility':'upgradeAbility',id);
      const current=row(s,id);assert.equal(current.currentRank,rank);assert.equal(current.spentAp,spent(id,rank));
      assert.equal(current.description,next.description);assert.equal(current.slotted,false);
      assert.equal(current.rank,1);assert.equal(current.apCost,costs[id][0]);assert.equal(current.minLevel,0);
    }
    assert.equal(row(s,id).nextRank,null);assert.equal(row(s,id).canUpgrade,false);
    assert.equal(row(s,id).upgradePreviewStats,null);assert.equal(row(s,id).upgradePreviewEffects,null);
    s.hero.hp=1;s.hero.mp=0;unchanged(s,()=>act(s,'upgradeAbility',id));
  }
  assert.equal(abilityView(s).spentAp,82);assert.equal(abilityView(s).availableAp,418);
  assert.equal(abilityView(s).majorUsed,0);
});

for(const id of ids)for(let rank=2;rank<=gates[id].length;rank++)test(`ranked abilities: ${id} rank ${rank} exact gate ${gates[id][rank-1]}, one-step cost and slot conservation`,()=>{
  const gate=gates[id][rank-1];
  for(const active of [false,true]){
    const s=allocate(profile(gate-1),id,rank-1,active),view=row(s,id),before=abilityView(s);
    assert.equal(view.currentRank,rank-1);assert.equal(view.nextRank.rank,rank);assert.equal(view.canUpgrade,false);
    s.hero.hp=1;s.hero.mp=0;unchanged(s,()=>act(s,'upgradeAbility',id));
    const tooEarly=copy(s);tooEarly.abilities.ranks={[id]:rank};
    assert.throws(()=>validateSave(tooEarly),/能力配置/,'a save cannot bypass a level gate');
    const eligible=validateSave({...s,hero:{...s.hero,level:gate}}),oldStats=stats(eligible);
    assert.equal(row(eligible,id).canUpgrade,true);const preview=row(eligible,id).upgradePreviewStats;
    act(eligible,'upgradeAbility',id);
    assert.equal(row(eligible,id).currentRank,rank);assert.equal(abilityView(eligible).spentAp,before.spentAp+costs[id][rank-1]);
    assert.deepEqual(eligible.abilities.learned,s.abilities.learned);assert.deepEqual(eligible.abilities.slotted,s.abilities.slotted);
    assert.equal(abilityView(eligible).majorUsed,Number(active));assert.equal(eligible.abilities.ranks[id],rank);
    assert.deepEqual(stats(eligible),active?preview:oldStats);
    assert.equal(eligible.hero.hp,stats(eligible).maxHp);assert.equal(eligible.hero.mp,stats(eligible).maxMp);
    assert.deepEqual(validateSave(copy(eligible)).abilities,eligible.abilities);
    unchanged(eligible,()=>act(eligible,'learnAbility',id));
  }
});

for(const id of ids)for(let rank=1;rank<=gates[id].length;rank++)test(`ranked abilities: ${id} rank ${rank} replaces the previous effect and respects original pool/proficiency boundaries`,()=>{
  const s=profile(500,999999);s.equipment.armor.stats.hp=1234.56;s.equipment.accessory.stats.hp=.12;
  const original=stats(s);allocate(s,id,rank,false);assert.deepEqual(stats(s),original);
  const preview=row(s,id);assert.deepEqual(preview.previewStats,expected(s,id,rank));
  act(s,'slotAbility',id);assert.deepEqual(stats(s),expected(s,id,rank));
  const effects=abilityView(s).effects;
  assert.equal(effects.hpBonusPercent,id==='hp-tank'?10*rank:0);
  assert.equal(effects.mpBonusPercent,id==='mp-tank'?10*rank:0);
  assert.equal(effects.attackBonus,id==='one-handed-damage'?(rank+1)*600:0);
  if(id==='one-handed-damage')for(const proficiency of [0,.08,1.23456789,600,1e6]){
    s.hero.proficiency=proficiency;assert.deepEqual(stats(s),expected(s,id,rank));
  }
  act(s,'unslotAbility',id);assert.deepEqual(stats(s),original);
  assert.equal(row(s,id).currentRank,rank);assert.equal(row(s,id).spentAp,spent(id,rank));
  act(s,'slotAbility',id);assert.deepEqual(stats(s),expected(s,id,rank));
});

test('ranked abilities: full refunds recover cumulative costs, remove only that line, and restore legacy sparse shape',()=>{
  const s=profile();for(const id of ids)allocate(s,id,gates[id].length);
  assert.equal(abilityView(s).spentAp,82);assert.equal(abilityView(s).majorUsed,3);
  for(const [id,refund,remaining] of [['hp-tank',36,46],['mp-tank',36,10],['one-handed-damage',10,0]]){
    const before=abilityView(s);act(s,'refundAbility',id);
    assert.equal(abilityView(s).availableAp,before.availableAp+refund);assert.equal(abilityView(s).spentAp,remaining);
    assert.match(s.logs[0],new RegExp(`${refund} AP`));assert.equal(row(s,id).currentRank,0);
  }
  assert.equal(Object.hasOwn(s,'abilities'),false);assert.deepEqual(stats(s),plain(s));
  allocate(s,'hp-tank',2);allocate(s,'mp-tank',1,false);act(s,'refundAbility','hp-tank');
  assert.deepEqual(s.abilities,{learned:['mp-tank'],slotted:[]});
  act(s,'learnAbility','hp-tank');assert.deepEqual(s.abilities,{learned:['mp-tank','hp-tank'],slotted:[]});
  assert.equal(Object.hasOwn(s.abilities,'ranks'),false);assert.equal(row(s,'hp-tank').currentRank,1);
});

test('ranked abilities: previews distinguish current slotted rank from hypothetical next rank and detach all data',()=>{
  const s=allocate(profile(100,2.5),'hp-tank',3,false);allocate(s,'one-handed-damage',1);
  s.hero.hp=1;s.hero.mp=0;const before=copy(s),original=abilityView(s),expectedView=copy(original);
  const hp=row(s,'hp-tank');assert.equal(hp.canUpgrade,true);
  const current=copy(s);act(current,'slotAbility','hp-tank');assert.deepEqual(hp.previewStats,stats(current));
  const next=copy(s);act(next,'upgradeAbility','hp-tank');act(next,'slotAbility','hp-tank');
  assert.deepEqual(hp.upgradePreviewStats,stats(next));assert.equal(hp.previewEffects.hpBonusPercent,30);assert.equal(hp.upgradePreviewEffects.hpBonusPercent,40);
  original.ranks['hp-tank']=10;original.learned.length=0;original.slotted.push('forged');
  original.currentStats.attack=-1;original.effects.hpBonusPercent=-1;
  for(const entry of original.catalog){
    entry.nextRank.rank=99;entry.nextRank.minLevel=-1;entry.nextRank.apCost=0;entry.nextRank.description='forged';
    entry.previewStats.attack=-1;entry.previewEffects.attackBonus=-1;
    if(entry.upgradePreviewStats)entry.upgradePreviewStats.attack=-1;
    if(entry.upgradePreviewEffects)entry.upgradePreviewEffects.attackBonus=-1;
  }
  assert.deepEqual(abilityView(s),expectedView);assert.deepEqual(s,before);
});

test('ranked abilities: upgrade never auto-learns, skips, accepts object payloads, or acts outside camp',()=>{
  const s=profile();let reads=0;
  for(const id of ids)unchanged(s,()=>act(s,'upgradeAbility',id));
  allocate(s,'hp-tank',1);const hostile={get id(){reads++;return 'hp-tank';},toString(){reads++;return 'hp-tank';}};
  for(const payload of [undefined,null,false,1,[],{},hostile,new String('hp-tank'),Symbol('hp-tank'),'hp-tank ','hp-tank-3','constructor','__proto__',{id:'hp-tank',rank:10}])
    unchanged(s,()=>act(s,'upgradeAbility',payload));
  assert.equal(reads,0);act(s,'upgradeAbility','hp-tank');assert.equal(row(s,'hp-tank').currentRank,2);
  for(const mode of ['battle','defeat','other'])for(const phase of ['fight','intermission','idle']){
    s.mode=mode;s._phase=phase;s.hero.hp=1;s.hero.mp=0;
    assert.equal(row(s,'hp-tank').canUpgrade,false);for(const action of actions)unchanged(s,()=>act(s,action,'hp-tank'));
  }
});

test('ranked abilities: camp upgrades and full refunds never draw RNG, change items, grant currency or advance combat',()=>{
  const s=profile();s.hero.gold=4321;s.autoSell=true;
  s.inventory.push({...copy(s.equipment.armor),id:'test-inventory',locked:false});
  const protectedState=()=>{const result=copy(s);delete result.abilities;delete result.logs;delete result.hero.hp;delete result.hero.mp;return result;};
  const before=protectedState();
  for(const id of ids){
    act(s,'learnAbility',id);
    for(let rank=2;rank<=gates[id].length;rank++){
      s.hero.hp=1;s.hero.mp=0;act(s,'upgradeAbility',id);
      assert.deepEqual(protectedState(),before);assert.equal(s.hero.hp,stats(s).maxHp);assert.equal(s.hero.mp,stats(s).maxMp);
    }
    for(const action of ['slotAbility','unslotAbility','slotAbility','refundAbility']){act(s,action,id);assert.deepEqual(protectedState(),before);}
  }
});

const malformedRanks=[undefined,null,false,0,1,'2',[],{},new Map([['hp-tank',2]]),
  {'hp-tank':undefined},{'hp-tank':null},{'hp-tank':true},{'hp-tank':0},{'hp-tank':1},{'hp-tank':-1},{'hp-tank':2.5},{'hp-tank':'2'},
  {'hp-tank':NaN},{'hp-tank':Infinity},{'hp-tank':11},{'one-handed-damage':4},{'mp-tank':2},{'unknown':2},JSON.parse('{"__proto__":2}'),{'constructor':2}];
for(const [index,ranks] of malformedRanks.entries())test(`ranked abilities: malformed supplied rank mapping ${index} rejects, rather than normalizes, the complete save`,()=>{
  const s=allocate(profile(),'hp-tank',1);s.abilities.ranks=ranks;const before=copy(s);
  assert.throws(()=>validateSave(s),/能力配置/);assert.equal(abilityView(s).valid,false);assert.deepEqual(stats(s),plain(s));
  for(const action of actions)act(s,action,'hp-tank');assert.deepEqual(s,before);
});

test('ranked abilities: rank records reject inherited, hidden, symbolic and getter metadata without invoking getters',()=>{
  let reads=0;const records=[];
  records.push(Object.assign(Object.create({'hp-tank':2}),{}));
  records.push(Object.assign(Object.create({future:true}),{'hp-tank':2}));
  const hidden={};Object.defineProperty(hidden,'hp-tank',{value:2});records.push(hidden);
  const extra={'hp-tank':2};Object.defineProperty(extra,'future',{value:true});records.push(extra);
  const symbol={'hp-tank':2};symbol[Symbol('future')]=2;records.push(symbol);
  const getter={};Object.defineProperty(getter,'hp-tank',{enumerable:true,get(){reads++;return 2;}});records.push(getter);
  for(const ranks of records){
    const s=allocate(profile(),'hp-tank');s.abilities.ranks=ranks;
    assert.throws(()=>validateSave(s),/能力配置/);assert.equal(abilityView(s).valid,false);
    for(const action of actions)act(s,action,'hp-tank');
  }
  const s=allocate(profile(),'hp-tank');Object.defineProperty(s.abilities,'ranks',{enumerable:true,get(){reads++;return {'hp-tank':2};}});
  assert.throws(()=>validateSave(s),/能力配置/);for(const action of actions)act(s,action,'hp-tank');assert.equal(reads,0);
  const valid=allocate(profile(),'hp-tank');valid.abilities.ranks=Object.assign(Object.create(null),{'hp-tank':2});
  assert.deepEqual(validateSave(valid).abilities,{learned:['hp-tank'],slotted:['hp-tank'],ranks:{'hp-tank':2}});
});

test('ranked abilities: save roundtrips retain inactive rank costs without trusting invented AP totals',()=>{
  let s=profile(350);for(const id of ids)allocate(s,id,gates[id].length,id==='hp-tank');
  s.earnedAp=999;s.hero.ap=999;s.spentAp=0;const allocation=copy(s.abilities);
  for(let n=0;n<5;n++){
    s=validateSave(JSON.parse(serialized(s)));assert.deepEqual(s.abilities,allocation);
    assert.equal(abilityView(s).spentAp,82);assert.equal(abilityView(s).availableAp,268);assert.equal(abilityView(s).majorUsed,1);
    assert.equal(abilityView(s).effects.mpBonusPercent,0);assert.equal(abilityView(s).effects.attackBonus,0);
  }
  const overBudget=profile(3);overBudget.abilities={learned:ids,slotted:[],ranks:{}};
  assert.throws(()=>validateSave(overBudget),/能力配置/);delete overBudget.abilities.ranks;
  assert.throws(()=>validateSave(overBudget),/能力配置/);overBudget.hero.level=4;
  assert.equal(abilityView(validateSave(overBudget)).availableAp,0);
  assert.throws(()=>legacy.validateSave(s),/不支援/,'v0.10 rejects version 2 outright');assert.throws(()=>legacy.validateSave(legacyEnvelope(s)),/能力配置/,'historical v1 envelope safely rejects newer rank metadata rather than silently deleting it');
});

for(const selected of [[],['hp-tank'],['mp-tank'],['one-handed-damage'],ids])test(`ranked abilities: frozen v0.10 rank-zero/one actions, saves and pre-loot gameplay stay byte-identical after root version/currency projection (${selected.join('+')||'none'})`,()=>{
  let current=profile(25,7.654321),old=legacy.validateSave(legacyEnvelope(current));
  // Normalize equal load logs once before starting the differential sequence.
  current=validateSave(copy(current));assert.deepEqual(legacyState(current),legacyState(old));
  const apply=(action,payload)=>{act(current,action,payload);legacy.act(old,action,payload);assert.equal(serialized(legacyState(current)),serialized(old));assert.deepEqual(stats(current),{...legacy.stats(old),parry:.035});};
  for(const id of selected){apply('learnAbility',id);apply('slotAbility',id);assert.equal(Object.hasOwn(current.abilities,'ranks'),false);}
  apply('start');
  // Keep this old-gear differential combat free of rewards: new rapier generation
  // intentionally changes loot/RNG, independently covered by current loot tests.
  for(const state of [current,old])for(const enemy of state.enemies){enemy.hp=1e9;enemy.maxHp=1e9;}
  for(let tick=0;tick<400&&current.mode==='battle'&&!current.wins;tick++){
    const before=serialized(current);abilityView(current);assert.equal(serialized(current),before);
    advance(current,.1);legacy.advance(old,.1);assert.equal(serialized(legacyState(current)),serialized(old));
  }
  apply('retreat');assert.deepEqual(legacyState(validateSave(copy(current))),legacy.validateSave(copy(old)));
  for(const id of selected){apply('unslotAbility',id);apply('slotAbility',id);apply('refundAbility',id);}
});
