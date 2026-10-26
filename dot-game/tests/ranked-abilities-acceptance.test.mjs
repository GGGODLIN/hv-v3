import { legacyState, legacyEnvelope } from './helpers/soulbind-compat.mjs';
import * as historicalV012 from './fixtures/v0.12/engine.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as current from '../src/engine.js';
import * as accepted from './fixtures/v0.10/engine.js';
import {scoreItem} from '../src/loot.js';

// Independent researched schedules, not copied from production exports.
const schedules={
  'hp-tank':{gates:[0,25,50,75,100,120,150,200,250,300],costs:[1,2,3,3,4,4,4,5,5,5]},
  'mp-tank':{gates:[0,30,60,90,120,160,210,260,310,350],costs:[1,2,3,3,4,4,4,5,5,5]},
  'one-handed-damage':{gates:[0,100,200],costs:[2,3,5]},
};
const ids=Object.keys(schedules),actions=['learnAbility','upgradeAbility','slotAbility','unslotAbility','refundAbility'];
const clone=value=>structuredClone(value),json=value=>JSON.stringify(value);
const row=(s,id)=>current.abilityView(s).catalog.find(entry=>entry.id===id);
const cost=(id,rank)=>schedules[id].costs.slice(0,rank).reduce((a,b)=>a+b,0);
const rank=(s,id)=>s.abilities?.learned.includes(id)?s.abilities.ranks?.[id]??1:0;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function unchanged(s,fn){const before=clone(s);fn();assert.deepEqual(s,before);}
// These are deliberately synthetic equation/boundary fixtures, not earned play.
function fixture(level=500,proficiency=3.25){const s=current.createGame(42);s.hero.level=level;s.hero.proficiency=proficiency;return current.validateSave(s);}
function allocate(s,id,target=1,slotted=true){current.act(s,'learnAbility',id);for(let r=1;r<target;r++)current.act(s,'upgradeAbility',id);if(slotted)current.act(s,'slotAbility',id);return s;}
function oracle(s,active=Object.fromEntries((s.abilities?.slotted||[]).map(id=>[id,rank(s,id)]))){
  const base=clone(s);delete base.abilities;const h=s.hero,a=h.attributes;
  const hp=500+10*h.level+6*a.end,mp=10+h.level+a.wis,gear=Object.values(s.equipment).reduce((sum,item)=>sum+(item.stats.hp||0),0);
  const tank=(value,r)=>r?Math.floor(value*(10+r)/10):value;
  const unroundedAttack=Math.max(1,Math.log(3330+2*a.str+a.dex)/Math.log(1.0003)-27029.81)+Object.values(s.equipment).reduce((sum,item)=>sum+(item.stats.attack||0),0);
  const bonus=active['one-handed-damage']?(1+active['one-handed-damage'])*Math.max(0,Math.min(h.proficiency,1.2*h.level)):0;
  return {...accepted.stats(base),parry:Math.min(.5,Math.max(0,.035+Object.values(s.equipment).reduce((sum,item)=>sum+(item.stats.parry||0),0)/100)),maxHp:Math.round(tank(hp,active['hp-tank']||0)+gear),maxMp:active['mp-tank']?tank(mp,active['mp-tank']):Math.round(mp),attack:Math.round((unroundedAttack+bonus)*100)/100};
}
function ledger(s){const view=current.abilityView(s),spent=ids.reduce((n,id)=>n+cost(id,rank(s,id)),0);
  assert.equal(view.valid,true);assert.equal(view.earnedAp,s.hero.level);assert.equal(view.spentAp,spent);assert.equal(view.availableAp,s.hero.level-spent);
  assert.equal(view.majorCapacity,5);assert.equal(view.majorUsed,s.abilities?.slotted.length||0);return view;}

test('ranked independent: all three complete ladders retain the rank-one API and expose honest unlearned/max-rank previews',()=>{
  const s=fixture();assert.equal(current.VERSION,2);assert.deepEqual(current.ABILITY_RULES,{majorSlots:5});
  assert.deepEqual(current.MAJOR_ABILITIES,accepted.MAJOR_ABILITIES);
  for(const id of ids){let entry=row(s,id);assert.equal(entry.currentRank,0);assert.equal(entry.maxRank,schedules[id].gates.length);assert.equal(entry.spentAp,0);
    assert.equal(entry.nextRank.rank,1);assert.equal(entry.nextRank.minLevel,0);assert.equal(entry.nextRank.apCost,schedules[id].costs[0]);
    assert.equal(entry.upgradePreviewStats,null);assert.equal(entry.upgradePreviewEffects,null);assert.equal(entry.canUpgrade,false);
    assert.deepEqual(entry.previewStats,oracle(s,{...Object.fromEntries((s.abilities?.slotted||[]).map(key=>[key,rank(s,key)])),[id]:1}));
    allocate(s,id,schedules[id].gates.length);entry=row(s,id);assert.equal(entry.currentRank,entry.maxRank);assert.equal(entry.nextRank,null);
    assert.equal(entry.canUpgrade,false);assert.equal(entry.upgradePreviewStats,null);assert.equal(entry.upgradePreviewEffects,null);assert.equal(entry.spentAp,id==='one-handed-damage'?10:36);
    unchanged(s,()=>current.act(s,'upgradeAbility',id));
  }
  assert.equal(ledger(s).spentAp,82);assert.equal(ledger(s).majorUsed,3);assert.deepEqual(current.stats(s),oracle(s));
});

for(const [id,{gates,costs}] of Object.entries(schedules))for(let index=1;index<gates.length;index++)
  test(`ranked independent: ${id} rank ${index+1} exact Lv${gates[index]} gate and +${costs[index]} AP, never skips or adds a slot`,()=>{
    const before=allocate(fixture(gates[index]-1),id,index),locked=row(before,id);
    assert.equal(locked.canUpgrade,false);assert.equal(locked.nextRank.rank,index+1);assert.equal(locked.nextRank.minLevel,gates[index]);assert.equal(locked.nextRank.apCost,costs[index]);
    unchanged(before,()=>current.act(before,'upgradeAbility',id));
    for(const slotted of [false,true]){const s=allocate(fixture(gates[index]),id,index,slotted),oldStats=current.stats(s),view=ledger(s),expected=row(s,id).upgradePreviewStats;
      const protectedState=json({...s,abilities:undefined,logs:undefined,hero:{...s.hero,hp:undefined,mp:undefined}});
      assert.equal(row(s,id).canUpgrade,true);current.act(s,'upgradeAbility',id);
      assert.equal(rank(s,id),index+1);assert.equal(ledger(s).spentAp,view.spentAp+costs[index]);assert.equal(ledger(s).majorUsed,Number(slotted));
      assert.equal(row(s,id).slotted,slotted);assert.equal(row(s,id).spentAp,cost(id,index+1));assert.deepEqual(current.stats(s),slotted?expected:oldStats);
      assert.equal(json({...s,abilities:undefined,logs:undefined,hero:{...s.hero,hp:undefined,mp:undefined}}),protectedState);
      assert.equal(s.hero.hp,current.stats(s).maxHp);assert.equal(s.hero.mp,current.stats(s).maxMp);
      unchanged(s,()=>current.act(s,'learnAbility',id));unchanged(s,()=>current.act(s,'upgradeAbility',id));
      assert.deepEqual(current.validateSave(clone(s)).abilities,s.abilities);
    }
  });

test('ranked independent: every affordable rank at every eligible level uses exact rational Tank floors and replacement rather than cumulative bonuses',()=>{
  let cases=0;
  for(const id of ['hp-tank','mp-tank'])for(let r=1;r<=10;r++)for(let level=Math.max(1,schedules[id].gates[r-1]);level<=500;level++){
    const s=allocate(fixture(level),id,r);s.equipment.armor.stats.hp=12.5;s.equipment.accessory.stats.hp=5.25;
    assert.deepEqual(current.stats(s),oracle(s),`${id} rank ${r}, level ${level}`);assert.equal(current.abilityView(s).effects[id==='hp-tank'?'hpBonusPercent':'mpBonusPercent'],10*r);cases++;
  }
  assert.equal(cases,7158);
});

for(const r of [1,2,3])test(`ranked independent: 1H rank ${r} replaces its coefficient and caps proficiency before existing attack rounding`,()=>{
  for(const level of [Math.max(2,schedules['one-handed-damage'].gates[r-1]),500])for(const proficiency of [0,.08,1.23456789,1.2*level,1e6]){
    const s=allocate(fixture(level,proficiency),'one-handed-damage',r),effects=current.abilityView(s).effects;
    assert.equal(effects.attackBonus,(r+1)*Math.min(proficiency,1.2*level));assert.deepEqual(current.stats(s),oracle(s));
    const active=current.stats(s);current.act(s,'unslotAbility','one-handed-damage');assert.equal(current.abilityView(s).effects.attackBonus,0);assert.deepEqual(current.stats(s),oracle(s));
    current.act(s,'slotAbility','one-handed-damage');assert.deepEqual(current.stats(s),active);
  }
});

test('ranked independent: full refund removes only its complete rank cost and map key; rank-one relearning omits metadata',()=>{
  const s=fixture();for(const id of ids)allocate(s,id,schedules[id].gates.length);const gold=s.hero.gold,seed=s.seed;
  for(const id of ids){const prior=ledger(s),spent=cost(id,rank(s,id));current.act(s,'unslotAbility',id);assert.equal(ledger(s).spentAp,prior.spentAp);
    current.act(s,'slotAbility',id);assert.equal(ledger(s).spentAp,prior.spentAp);current.act(s,'refundAbility',id);
    assert.equal(ledger(s).spentAp,prior.spentAp-spent);assert.equal(row(s,id).currentRank,0);assert.equal(Object.hasOwn(s.abilities?.ranks||{},id),false);assert.equal(row(s,id).slotted,false);
    unchanged(s,()=>current.act(s,'refundAbility',id));assert.equal(s.hero.gold,gold);assert.equal(s.seed,seed);
  }
  assert.equal(Object.hasOwn(s,'abilities'),false);for(const id of ids)allocate(s,id);assert.equal(Object.hasOwn(s.abilities,'ranks'),false);
  assert.deepEqual(s.abilities,{learned:ids,slotted:ids});assert.equal(ledger(s).spentAp,4);
});

test('ranked independent: repeated next-rank actions buy exactly one rank at a time; damage and no-op paths do not create healing or grants',()=>{
  const s=fixture();unchanged(s,()=>current.act(s,'upgradeAbility','hp-tank'));allocate(s,'hp-tank',1,false);
  for(let r=2;r<=10;r++){const prior=ledger(s);s.hero.hp=1;s.hero.mp=0;current.act(s,'upgradeAbility','hp-tank');assert.equal(rank(s,'hp-tank'),r);
    assert.equal(ledger(s).availableAp,prior.availableAp-schedules['hp-tank'].costs[r-1]);assert.equal(ledger(s).majorUsed,0);assert.deepEqual(current.stats(s),oracle(s));}
  s.hero.hp=1;s.hero.mp=0;for(const action of ['learnAbility','upgradeAbility','unslotAbility'])unchanged(s,()=>current.act(s,action,'hp-tank'));
});

for(const mode of ['battle','defeat','other'])test(`ranked independent: ${mode} refuses every rank action and disables all five mutating controls`,()=>{
  const s=allocate(fixture(),'hp-tank',2);s.mode=mode;s.hero.hp=1;s.hero.mp=0;
  for(const phase of ['fight','intermission','idle']){s._phase=phase;
    assert.ok(current.abilityView(s).catalog.every(entry=>['canLearn','canUpgrade','canSlot','canUnslot','canRefund'].every(key=>!entry[key])));
    for(const id of ids)for(const action of actions)unchanged(s,()=>current.act(s,action,id));}
});

test('ranked independent: upgrade accepts exact string IDs only and does not run payload getters/coercion',()=>{
  const s=allocate(fixture(),'hp-tank');let reads=0;
  const hostile={get id(){reads++;return 'hp-tank';},toString(){reads++;return 'hp-tank';}};
  for(const payload of [null,undefined,{},[],hostile,new String('hp-tank'),true,2,'hp-tank-2','__proto__','constructor',Symbol('hp-tank'),()=>{}])unchanged(s,()=>current.act(s,'upgradeAbility',payload));
  assert.equal(reads,0);
});

test('ranked independent: next-rank previews force a hypothetical slot, preserve other current ranks, detach metadata and never mutate damaged state',()=>{
  const s=allocate(allocate(allocate(fixture(200),'hp-tank',4),'mp-tank',3),'one-handed-damage',2,false);s.hero.hp=1;s.hero.mp=0;
  const before=clone(s),expected=current.abilityView(s);
  for(const entry of expected.catalog){const active=Object.fromEntries(s.abilities.slotted.map(id=>[id,rank(s,id)]));
    assert.deepEqual(entry.previewStats,oracle(s,{...active,[entry.id]:entry.currentRank}));
    assert.deepEqual(entry.upgradePreviewStats,oracle(s,{...active,[entry.id]:entry.currentRank+1}));}
  for(let n=0;n<3;n++){const view=current.abilityView(s);view.learned.length=0;view.slotted.length=0;view.ranks['hp-tank']=10;view.effects.hpBonusPercent=999;view.currentStats.maxHp=999;
    for(const entry of view.catalog){entry.nextRank.rank=10;entry.nextRank.apCost=0;entry.previewStats.maxHp=0;entry.previewEffects.attackBonus=999;entry.upgradePreviewStats.attack=999;entry.upgradePreviewEffects.attackBonus=999;}
    assert.deepEqual(current.abilityView(s),expected);assert.deepEqual(s,before);}
});

test('ranked independent: strict sparse ranks map rejects unknown, nonlearned, redundant, oversized, wrong-type and inaccessible metadata without partial recovery',()=>{
  const bad=[undefined,null,false,0,'hp-tank',[],{}, {'hp-tank':0},{'hp-tank':1},{'hp-tank':-1},{'hp-tank':1.5},{'hp-tank':'2'},{'hp-tank':NaN},{'hp-tank':Infinity},{'hp-tank':11},{'mp-tank':2},{'one-handed-damage':4},{unknown:2},JSON.parse('{"__proto__":2}'),{constructor:2}];
  for(const ranks of bad){const s=allocate(fixture(),'hp-tank');s.abilities.ranks=ranks;const before=clone(s);
    assert.throws(()=>current.validateSave(s),/能力配置/);assert.equal(current.abilityView(s).valid,false);assert.deepEqual(current.stats(s),oracle(s,{}));assert.deepEqual(s,before);
    for(const action of actions)unchanged(s,()=>current.act(s,action,'hp-tank'));}
  let reads=0;const maps=[];
  for(const enumerable of [false,true]){const map={};Object.defineProperty(map,'hp-tank',{enumerable,get(){reads++;return 2;}});maps.push(map);}
  const hidden={};Object.defineProperty(hidden,'hp-tank',{value:2});maps.push(hidden);
  maps.push(Object.assign(Object.create({'hp-tank':2}),{'mp-tank':2}));const sym={'hp-tank':2};sym[Symbol('rank')]=2;maps.push(sym);
  for(const ranks of maps){const s=allocate(fixture(),'hp-tank');s.abilities.ranks=ranks;assert.throws(()=>current.validateSave(s),/能力配置/);current.abilityView(s);current.stats(s);for(const action of actions)current.act(s,action,'hp-tank');}
  const accessor=allocate(fixture(),'hp-tank');Object.defineProperty(accessor.abilities,'ranks',{enumerable:true,get(){reads++;return {'hp-tank':2};}});assert.throws(()=>current.validateSave(accessor));assert.equal(reads,0);
  const valid=allocate(fixture(),'hp-tank',2);valid.abilities.ranks=Object.assign(Object.create(null),{'hp-tank':2});assert.deepEqual(current.validateSave(valid).abilities,{learned:['hp-tank'],slotted:['hp-tank'],ranks:{'hp-tank':2}});
});

test('ranked independent: save gate and total AP budget cannot be bypassed by supplied grants, rank gaps, or inferred rank-one migrations',()=>{
  for(const id of ids)for(let r=2;r<=schedules[id].gates.length;r++){const s=fixture(schedules[id].gates[r-1]-1);s.abilities={learned:[id],slotted:[id],ranks:{[id]:r}};
    s.earnedAp=999;s.hero.ap=999;s.abilityPoints=999;assert.throws(()=>current.validateSave(s),/能力配置/);assert.equal(current.abilityView(s).valid,false);}
  const low=fixture(1);low.abilities={learned:['hp-tank','mp-tank'],slotted:[]};assert.throws(()=>current.validateSave(low),/能力配置/);
  for(const level of [1,25,30,100,200,350,500]){const legacy=fixture(level),returned=current.validateSave(clone(legacy));assert.deepEqual(legacyState(returned),accepted.validateSave(legacyEnvelope(legacy)));assert.equal(Object.hasOwn(returned,'abilities'),false);
    for(const id of ids.filter(id=>schedules[id].costs[0]<=level)){const allocated=allocate(clone(legacy),id);assert.deepEqual(legacyState(current.validateSave(clone(allocated))),accepted.validateSave(legacyEnvelope(allocated)));assert.equal(Object.hasOwn(allocated.abilities,'ranks'),false);assert.deepEqual(current.stats(allocated),{...accepted.stats(allocated),parry:.035});}}
  const learned=allocate(fixture(),'hp-tank',10),before=clone(learned);for(let i=0;i<4;i++){const loaded=current.validateSave(JSON.parse(json(learned)));assert.equal(ledger(loaded).spentAp,36);assert.deepEqual(loaded.abilities,learned.abilities);}assert.deepEqual(learned,before);
});

const target=()=>({id:'rank-oracle',name:'Synthetic rank target',hp:1e7,maxHp:1e7,attack:0,defense:0,evade:0,parry:0,block:0,boss:true});
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
for(const r of [2,3])for(const skill of [false,true])test(`ranked independent: live rank ${r} ${skill?'skill':'basic'} includes the replacement 1H bonus exactly once before proficiency growth`,()=>{
  const s=allocate(fixture(schedules['one-handed-damage'].gates[r-1]),'one-handed-damage',r);current.act(s,'start');s.enemies=[target()];s._enemyClock=-100;s._turns=skill?4:0;s.equipment.weapon.weaponFamily=null;
  const p=oracle(s),expected=accepted.resolveAttack({attack:p.attack*(skill?2.3:1),crit:p.crit,skill},target(),random(s.seed)),prof=s.hero.proficiency;
  s._clock=1.04;current.advance(s,.02);assert.equal(s.events.find(event=>event.target==='rank-oracle').value,expected.damage);near(s.enemies[0].hp,1e7-expected.damage);
  near(s.hero.proficiency,prof+.08);assert.deepEqual(current.stats(s),oracle(s));
});

test('ranked independent: rank-three axe bleed snapshots effective attack once and never adds the 1H bonus again at payout',()=>{
  const s=allocate(fixture(200),'one-handed-damage',3);current.act(s,'start');s.enemies=[target()];s._enemyClock=-100;s.equipment.weapon.weaponFamily='axe';s.equipment.weapon.stats.crit=1;
  const p=oracle(s),expected=accepted.resolveWeaponAttack({attack:p.attack,crit:p.crit,skill:false},target(),s.equipment.weapon,0,random(s.seed));
  assert.ok(expected.proc,'fixed natural RNG seed triggers the synthetic eligible proc');s._clock=1.04;current.advance(s,.02);
  assert.equal(s.enemies[0].hp,1e7-expected.damage);assert.equal(s.enemies[0].bleeding.damagePerTick,Math.floor(p.attack*.08));
  const hp=s.enemies[0].hp,damage=s.enemies[0].bleeding.damagePerTick;s._clock=-100;s._enemyClock=-100;s.timing.tu=(s.timing.ticks+1)*100-1;current.advance(s,.02);
  assert.equal(s.enemies[0].hp,hp-damage);assert.equal(s.events.filter(event=>event.type==='bleed').at(-1).value,damage);
});

test('ranked independent: max-rank Tank support remains the existing maxHP adaptation, not an original Cure claim',()=>{
  const s=allocate(allocate(fixture(),'hp-tank',10),'mp-tank',10);current.act(s,'start');s.enemies=[target()];s._enemyClock=-100;
  const p=oracle(s);s.hero.hp=p.maxHp*.2;s.hero.mp=6;s._clock=1.04;current.advance(s,.02);near(s.hero.hp,p.maxHp*.47);near(s.hero.mp,.6);
  assert.equal(s.battle.actions.heals,1);s.hero.hp=1;current.act(s,'heal');near(s.hero.hp,1+p.maxHp*.4);
  current.act(s,'retreat');assert.equal(s.hero.hp,p.maxHp);assert.equal(s.hero.mp,p.maxMp);
});

// All natural growth below is produced by public engine actions. There is no
// level/resource/proficiency injection and it is not browser-input coverage.
// v0.13 changes eligible combat with counters. Freeze only this historical
// acquisition-equality trajectory; upgrades and paired runs remain current.
test('ranked independent: historical pre-counter acquisition preserves v0.10 through both gates, then current next-rank choices',t=>{
  const results=[];
  for(const seed of [29,42,77]){
    const s=current.createGame(seed),old=accepted.createGame(seed);let steps=0,runs=0;const gates={};
    const action=(name,payload)=>{current.act(s,name,payload);accepted.act(old,name,payload);assert.deepEqual(legacyState(s),legacyState(old));};
    function camp(){for(const slot of ['weapon','armor','accessory']){const best=[s.equipment[slot],...s.inventory.filter(item=>item.slot===slot)].reduce((a,b)=>scoreItem(a)>=scoreItem(b)?a:b);if(best.id!==s.equipment[slot].id)action('equip',best.id);}
      if(s.inventory.length>50)for(const item of [...s.inventory])if(!item.locked)action('sell',item.id);
      if(s.hero.level>=4&&!s.abilities)for(const id of ids){action('learnAbility',id);action('slotAbility',id);}action('selectStage',Math.min(3,s.unlocked));}
    while(s.hero.level<30&&runs<1000){camp();const level=s.hero.level,wins=s.wins;
      if([24,29].includes(level)){const id=level===24?'hp-tank':'mp-tank';assert.equal(row(s,id).canUpgrade,false);gates[level]={xp:s.hero.xp,xpNext:s.hero.xpNext,wins:s.wins};}
      action('start');for(let n=0;n<600&&s.mode==='battle'&&s.wins===wins;n++){historicalV012.advance(s,1);accepted.advance(old,1);assert.deepEqual(legacyState(s),legacyState(old));steps++;}
      assert.equal(s.wins,wins+1,'natural cohort must win without fixture edits');runs++;action('retreat');ledger(s);
      if([24,29].includes(level)&&s.hero.level>level){const id=level===24?'hp-tank':'mp-tank';assert.equal(row(s,id).canUpgrade,true);const branch=clone(s),prior=ledger(branch);current.act(branch,'upgradeAbility',id);assert.equal(rank(branch,id),2);assert.equal(ledger(branch).availableAp,prior.availableAp-2);}
    }
    assert.equal(s.hero.level,30);assert.ok(gates[24]&&gates[29]);assert.deepEqual(legacyState(s),legacyState(old));
    const profile=current.validateSave(clone(s)),pairs=[];
    for(const upgrades of [[],['hp-tank'],['mp-tank'],['hp-tank','mp-tank']]){const branch=clone(profile);for(const id of upgrades)current.act(branch,'upgradeAbility',id);
      const p=current.stats(branch),wins=branch.wins;assert.deepEqual(p,oracle(branch));assert.equal(branch.seed,profile.seed);assert.equal(branch.hero.gold,profile.hero.gold);assert.deepEqual(branch.equipment,profile.equipment);
      current.act(branch,'start');for(let n=0;n<600&&branch.mode==='battle'&&branch.wins===wins;n++)current.advance(branch,1);
      assert.ok(branch.wins===wins+1||branch.mode==='defeat');const report=current.expeditionReports(branch)[0];assert.ok(report);assert.deepEqual(report.startStats.maxHp,p.maxHp);
      const restored=current.validateSave(clone(branch));ledger(restored);assert.deepEqual(restored.abilities,branch.abilities);
      pairs.push({upgrades:upgrades.join('+')||'rank1',spentAp:ledger(branch).spentAp,maxHp:p.maxHp,maxMp:p.maxMp,attack:p.attack,outcome:report.outcome,seconds:Number(report.elapsed.toFixed(2)),hpLost:report.survival.hpLost,minHpPercent:Number(report.survival.minHpPercent.toFixed(2)),manaSpent:report.actions.manaSpent});
    }
    results.push({seed,runs,steps,gates,level:profile.hero.level,wins:profile.wins,proficiency:profile.hero.proficiency,weaponFamily:profile.equipment.weapon.weaponFamily,pairs});
  }
  t.diagnostic(JSON.stringify({kind:'engine-earned-not-browser-earned',profiles:results.length,pairedRuns:12,results}));
});
