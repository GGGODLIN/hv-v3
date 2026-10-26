import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,advance,validateSave,abilityView,stats,protectionView,expeditionReports,growthReadiness} from '../src/engine.js';

const ids=['hp-tank','mp-tank','one-handed-damage'];
const gates={'hp-tank':[0,25,50,75,100,120,150,200,250,300],'mp-tank':[0,30,60,90,120,160,210,260,310,350],'one-handed-damage':[0,100,200]};
const costs={'hp-tank':[1,2,3,3,4,4,4,5,5,5],'mp-tank':[1,2,3,3,4,4,4,5,5,5],'one-handed-damage':[2,3,5]};
const clone=structuredClone;
function profile(level=1){const s=createGame(42);s.hero.level=level;return validateSave(s);}
function allocate(s,id,rank=1,slotted=true){act(s,'learnAbility',id);for(let n=1;n<rank;n++)act(s,'upgradeAbility',id);if(slotted)act(s,'slotAbility',id);return s;}
const choices=s=>growthReadiness(s).choices;
const choice=(s,id)=>choices(s).find(c=>c.id===id);

// Synthetic fixtures establish boundaries, not claims of naturally earned progression.
test('growth discovery: fresh AP, exact learning costs and AP remainder are honest',()=>{
 const s=profile();assert.deepEqual(choices(s).map(c=>[c.id,c.action,c.cost]),[['hp-tank','learn',1],['mp-tank','learn',1]]);
 assert.deepEqual(growthReadiness(s).counts,{slot:0,learn:2,upgrade:0});
 act(s,'learnAbility','hp-tank');assert.equal(growthReadiness(s).availableAp,0);
 assert.deepEqual(choices(s).map(c=>[c.id,c.action,c.cost]),[['hp-tank','slot',0]]);
 act(s,'slotAbility','hp-tank');assert.deepEqual(choices(s),[]);assert.equal(growthReadiness(s).missingAp,1);
 s.hero.level=2;assert.deepEqual(choices(s).map(c=>c.id),['mp-tank']);
 s.hero.level=3;assert.deepEqual(choices(s).map(c=>c.id),['mp-tank','one-handed-damage']);
 assert.equal(choice(s,'one-handed-damage').cost,2);
});

test('growth discovery: unlearned is never slottable or upgradeable, even with abundant AP',()=>{
 const s=profile(500);assert.ok(choices(s).every(c=>c.action==='learn'));
 assert.deepEqual(growthReadiness(s).counts,{slot:0,learn:3,upgrade:0});
});

for(const id of ids)for(let rank=2;rank<=gates[id].length;rank++)test(`growth discovery: ${id} rank ${rank} exact gate and incremental cost`,()=>{
 const gate=gates[id][rank-1],s=allocate(profile(gate-1),id,rank-1);
 assert.equal(choice(s,id),undefined);
 s.hero.level=gate;assert.equal(choice(s,id).action,'upgrade');assert.equal(choice(s,id).cost,costs[id][rank-1]);
 act(s,'unslotAbility',id);assert.equal(choice(s,id).action,'slot');assert.equal(choice(s,id).cost,0);
 assert.equal(abilityView(s).catalog.find(c=>c.id===id).canUpgrade,true,'unslotted can upgrade mechanically but discovery offers slot first');
});

test('growth discovery: global priority is slot, learn, upgrade without claiming stat gain',()=>{
 const s=allocate(allocate(profile(100),'hp-tank'),'one-handed-damage',1,false);s.hero.proficiency=0;
 assert.deepEqual(choices(s).map(c=>[c.id,c.action]),[['one-handed-damage','slot'],['mp-tank','learn'],['hp-tank','upgrade']]);
 const before=stats(s).attack;act(s,'slotAbility','one-handed-damage');assert.equal(stats(s).attack,before);
});

test('growth discovery: AP alone is not readiness, next gate is accurate, maxed is exhausted',()=>{
 const s=profile(9);for(const id of ids)allocate(s,id);
 assert.equal(growthReadiness(s).availableAp,5);assert.deepEqual(choices(s),[]);assert.equal(growthReadiness(s).nextLevel,25);
 const max=profile(500);for(const id of ids)allocate(max,id,gates[id].length);
 const v=growthReadiness(max);assert.deepEqual(v.choices,[]);assert.deepEqual(v.counts,{slot:0,learn:0,upgrade:0});assert.equal(v.availableAp,418);assert.equal(v.nextLevel,null);assert.equal(v.missingAp,null);
});

test('growth discovery: Protection is separate optional off/on choice at exact Lv10',()=>{
 const s=profile(9);assert.equal(growthReadiness(s).protectionAvailable,false);assert.equal(growthReadiness(s).protectionUnlockLevel,10);
 s.hero.level=10;let v=growthReadiness(s);assert.equal(v.protectionAvailable,true);assert.equal(v.protectionUnlocked,true);assert.equal(v.protectionEnabled,false);
 assert.deepEqual(v.counts,{slot:0,learn:3,upgrade:0});assert.ok(v.choices.every(c=>ids.includes(c.id)));
 act(s,'autoProtection',true);v=growthReadiness(s);assert.equal(v.protectionAvailable,false);assert.equal(v.protectionEnabled,true);
});

test('growth discovery: invalid, readonly, battle and defeat never invite an actionable choice',()=>{
 const s=profile(100);allocate(s,'hp-tank');allocate(s,'mp-tank',1,false);
 for(const mode of ['battle','defeat']){s.mode=mode;const v=growthReadiness(s);assert.equal(v.status,'away');assert.deepEqual(v.choices,[]);assert.equal(v.protectionAvailable,false);}
 s.mode='town';let v=growthReadiness(s,false);assert.equal(v.status,'readonly');assert.deepEqual(v.choices,[]);assert.equal(v.protectionAvailable,false);
 s.abilities.slotted.push('one-handed-damage');v=growthReadiness(s);assert.equal(v.status,'invalid');assert.deepEqual(v.choices,[]);assert.equal(v.protectionAvailable,false);
});

test('growth discovery: repeated and mutated detached reads preserve save, stats, RNG and other views',()=>{
 const s=allocate(profile(100),'hp-tank');allocate(s,'mp-tank',1,false);
 const before=clone(s),expected=growthReadiness(s),other=[stats(s),abilityView(s),protectionView(s),expeditionReports(s)];
 for(let n=0;n<20;n++){const v=growthReadiness(s);v.choices[0].id='forged';v.choices.push({});v.counts.slot=999;v.availableAp=999;assert.deepEqual(growthReadiness(s),expected);assert.deepEqual(s,before);}
 assert.deepEqual([stats(s),abilityView(s),protectionView(s),expeditionReports(s)],other);
 assert.equal(Object.hasOwn(s,'growthReadiness'),false);
});

test('growth discovery: instrumented default runs exactly match unobserved runs',()=>{
 for(const seed of [1,29,42,77]){
  const observed=createGame(seed),control=createGame(seed);
  act(observed,'start');act(control,'start');
  for(let n=0;n<600;n++){
   growthReadiness(observed);growthReadiness(observed,false);
   advance(observed,.25);advance(control,.25);
   assert.deepEqual(observed,control);assert.deepEqual(expeditionReports(observed),expeditionReports(control));
   if(observed.mode==='defeat'){act(observed,'retreat');act(control,'retreat');act(observed,'start');act(control,'start');}
  }
 }
});


test('growth discovery: active Protection session and completed report survive repeated reads',()=>{
 const s=profile(10);act(s,'autoProtection',true);act(s,'start');
 s.enemies=[{id:'fixture',hp:1e6,maxHp:1e6,attack:0,defense:0,evade:0,parry:0,block:0}];
 s._clock=1.05;s._enemyClock=-100;advance(s,.001);
 assert.equal(protectionView(s).active,true);assert.equal(protectionView(s).casts,1);
 const before=clone(s),protection=protectionView(s);
 for(let n=0;n<20;n++){assert.equal(growthReadiness(s).status,'away');assert.deepEqual(protectionView(s),protection);assert.deepEqual(s,before);}
 act(s,'retreat');const reports=expeditionReports(s);assert.equal(reports[0].protection.casts,1);
 for(let n=0;n<20;n++)growthReadiness(s);assert.deepEqual(expeditionReports(s),reports);
});
