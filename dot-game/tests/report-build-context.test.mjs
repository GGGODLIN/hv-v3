import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as g from '../src/engine.js';

const clone=structuredClone;
const projected=s=>({targetPriority:s.targetPriority??'front',autoProtection:s.autoProtection===true,
  abilities:(s.abilities?.slotted??[]).map(id=>({id,rank:s.abilities.ranks?.[id]??1})),
  equipment:['weapon','armor','accessory'].map(slot=>{const {id,name,level,quality}=s.equipment[slot];return {slot,id,name,level,quality};})});
function configured(api=g){
  const s=api.createGame(42);s.hero.level=30;
  s.abilities={learned:['hp-tank','mp-tank','one-handed-damage'],slotted:['hp-tank','one-handed-damage'],ranks:{'hp-tank':2,'mp-tank':2}};
  api.act(s,'targetPriority','caster');api.act(s,'autoProtection',true);return s;
}
function retreat(s){g.act(s,'retreat');return g.expeditionReports(s)[0];}
function finish(s,outcome){
  if(outcome==='retreat')return retreat(s);
  s.wave=4;s.enemies=[{id:'fixture',name:'Fixture',boss:true,hp:outcome==='win'?1:100000,maxHp:100000,attack:outcome==='defeat'?1e8:0,defense:0,evade:0,parry:0,block:0,resist:0}];
  if(outcome==='win'){s._clock=1.05;s._enemyClock=-100;}else{s.hero.hp=1;s._clock=-100;s._enemyClock=1.9;}
  // Start-context protection remains true even though the test makes an attack due.
  s.autoProtection=false;g.advance(s,.001);return g.expeditionReports(s)[0];
}

test('START records actual slotted ranks and current gear, not learned-only abilities or preset labels',()=>{
  const s=configured();g.act(s,'saveGearSet','a');
  assert.equal(s.gearSets.a.weapon,s.equipment.weapon.id);
  const replacement={...clone(s.equipment.weapon),id:'actual-current',name:'Current weapon',level:30,quality:'Legendary'};
  s.inventory.push(replacement);g.act(s,'equip',replacement.id);
  assert.notEqual(s.gearSets.a.weapon,s.equipment.weapon.id);
  const expected=projected(s);g.act(s,'start');assert.deepEqual(g.expeditionReports(s),[]);
  const report=retreat(s);assert.deepEqual(report.build,expected);
  assert.deepEqual(report.build.abilities,[{id:'hp-tank',rank:2},{id:'one-handed-damage',rank:1}]);
  assert.equal(report.build.equipment[0].id,'actual-current');
  assert.deepEqual(Object.keys(report.build),['targetPriority','autoProtection','abilities','equipment']);
  for(const item of report.build.equipment)assert.deepEqual(Object.keys(item),['slot','id','name','level','quality']);
});

for(const outcome of ['win','retreat','defeat'])test(`${outcome} retains one START snapshot through live mutations and repeated Start/settle`,()=>{
  const s=configured(),expected=projected(s);g.act(s,'start');
  s.targetPriority='weakest';s.autoProtection=false;s.abilities.slotted=[];s.abilities.ranks['hp-tank']=1;
  s.equipment.weapon.name='Changed while fighting';g.act(s,'start');
  const report=finish(s,outcome);assert.equal(report.outcome,outcome);assert.deepEqual(report.build,expected);
  g.act(s,'retreat');g.act(s,'retreat');assert.equal(g.expeditionReports(s).length,1);
  assert.deepEqual(g.expeditionReports(s)[0].build,expected);
});

test('all returned build containers and entries detach; pinned copy survives camp edits and later reports',()=>{
  const s=configured();g.act(s,'start');const pinned=retreat(s),expected=clone(pinned);
  const view=g.expeditionReports(s)[0];view.build.targetPriority='weakest';view.build.autoProtection=false;
  view.build.abilities[0].rank=999;view.build.abilities.push({id:'invented',rank:9});
  view.build.equipment[0].name='edited';view.build.equipment.splice(1);assert.deepEqual(g.expeditionReports(s)[0],expected);
  g.act(s,'targetPriority','weakest');g.act(s,'autoProtection',false);g.act(s,'unslotAbility','hp-tank');
  g.act(s,'saveGearSet','a');s.equipment.weapon.name='Later name';g.act(s,'saveGearSet','a');
  for(let i=0;i<3;i++){g.act(s,'start');retreat(s);}
  assert.equal(g.expeditionReports(s).length,2);assert.deepEqual(pinned,expected);
  assert.equal(g.expeditionReports(s)[0].build.targetPriority,'weakest');
});

test('stored active and completed build graph is frozen, not only detached on read',async()=>{
  // Inspect private storage in a test-only module copy, without adding a runtime
  // debug export or weakening the public detached-view contract.
  const source=readFileSync(new URL('../src/engine.js',import.meta.url),'utf8')
    .replace("'./loot.js'",JSON.stringify(new URL('../src/loot.js',import.meta.url).href));
  const api=await import(`data:text/javascript;base64,${Buffer.from(source+'\nexport const stored = s => expeditionFeedback.get(s);').toString('base64')}`);
  const s=configured(api);api.act(s,'start');const build=api.stored(s).active.build;
  const frozen=value=>{assert.ok(Object.isFrozen(value));for(const child of Object.values(value))if(child&&typeof child==='object')frozen(child);};
  frozen(build);assert.throws(()=>{build.equipment[0].name='overwrite';},TypeError);
  api.act(s,'retreat');assert.equal(api.stored(s).reports[0].build,build);frozen(build);
});

test('invalid allocation is empty and invalid gear fields are bounded safe fallbacks',()=>{
  const s=configured();s.abilities={learned:['unknown'],slotted:['unknown']};s.targetPriority='invalid';s.autoProtection='true';
  Object.assign(s.equipment.armor,{id:{nested:'not retained'},name:{nested:'not retained'},level:Infinity,quality:{nested:'not retained'}});
  s.equipment.accessory.name='x'.repeat(10000);g.act(s,'start');const {build}=retreat(s);
  assert.equal(build.targetPriority,'front');assert.equal(build.autoProtection,false);assert.deepEqual(build.abilities,[]);
  assert.deepEqual(build.equipment[1],{slot:'armor',id:null,name:'未知裝備',level:null,quality:null});
  assert.equal(build.equipment[2].name.length,100);assert.equal(build.equipment.length,3);
});

test('validation clears active/completed context and ignores forged build history; reads leave save and RNG unchanged',()=>{
  const s=configured();g.act(s,'start');retreat(s);g.act(s,'start');
  const before=clone(s);for(let i=0;i<10;i++)g.expeditionReports(s);assert.deepEqual(s,before);
  const raw=clone(s);raw.build={targetPriority:'forged'};raw.reports=g.expeditionReports(s);raw.battle.build=raw.build;
  const loaded=g.validateSave(raw);assert.deepEqual(g.expeditionReports(loaded),[]);assert.equal(Object.hasOwn(loaded,'build'),false);
  g.act(loaded,'retreat');assert.deepEqual(g.expeditionReports(loaded),[]);
  const expected=projected(loaded);g.act(loaded,'start');assert.deepEqual(retreat(loaded).build,expected);
});
