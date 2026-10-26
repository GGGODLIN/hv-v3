import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as game from '../src/engine.js';
import * as baseline from './fixtures/v0.21/engine.js';

const copy=structuredClone;
const baselineRoot=new URL('./fixtures/v0.21/',import.meta.url);
// The only intended report delta. No state field, RNG, damage or reward is omitted.
const historicalReports=s=>game.expeditionReports(s).map(({build,...report})=>report);
function equalPair(a,b){assert.deepEqual(a,b);assert.equal(a.seed,b.seed);assert.equal(JSON.stringify(a),JSON.stringify(b));assert.deepEqual(historicalReports(a),baseline.expeditionReports(b));}
const enemy=(extra={})=>({id:'audit-actor',name:'Audit actor',hp:100000,maxHp:100000,attack:35,defense:0,evade:0,parry:0,block:0,...extra});

test('v022 independent audit: own published v021 baseline has unchanged source identities',()=>{
 for(const [name,hash] of Object.entries({'engine.js':'eeab4752f8b32408a33f98171d9ca3c79ed5d5c6a57dd5e69c9c3a0c506290a2','loot.js':'db841ff9d52a2a0d6e58458351ca3c3f59ec8c3bc8b4d7a8baf78c3bbc28f38d'}))
  assert.equal(createHash('sha256').update(readFileSync(new URL(name,baselineRoot))).digest('hex'),hash);
});

test('v022 independent audit: natural default and chosen-policy fights retain every state byte, RNG and historical report field',()=>{
 for(const seed of [1,29,42,77])for(const stage of [1,4,5,6])for(const policy of ['front','caster','weakest']){
  const a=game.createGame(seed),b=baseline.createGame(seed);
  for(const [api,s] of [[game,a],[baseline,b]]){s.unlocked=6;s.stage=stage;api.act(s,'targetPriority',policy);api.act(s,'start');}
  equalPair(a,b);
  for(let i=0;i<450;i++){
   const before=JSON.stringify(a);for(let j=0;j<3;j++)game.expeditionReports(a);assert.equal(JSON.stringify(a),before);
   game.advance(a,.1);baseline.advance(b,.1);equalPair(a,b);
  }
  game.act(a,'retreat');baseline.act(b,'retreat');equalPair(a,b);
  assert.deepEqual(game.validateSave(copy(a)),baseline.validateSave(copy(b)));
 }
});

test('v022 independent audit: actual counters, alternating magic, bleeding death and rewards preserve exact parity',()=>{
 let counters=0,magic=0,bleed=0;
 for(const seed of [2,29,42,77])for(const family of ['rapier','axe','club']){
  const a=game.createGame(seed),b=baseline.createGame(seed);
  for(const [api,s] of [[game,a],[baseline,b]]){
   s.hero.level=30;s.equipment.weapon.weaponFamily=family;s.equipment.armor.stats.block=1;
   api.act(s,'targetPriority','caster');api.act(s,'autoProtection',true);api.act(s,'start');
   s.enemies=[enemy({id:'doomed',hp:1,bleeding:{stacks:1,expiresAtTick:7,damagePerTick:8}}),enemy({attackPattern:'alternating'})];
  }
  for(let i=0;i<160;i++){game.advance(a,.1);baseline.advance(b,.1);equalPair(a,b);magic+=a.events.filter(e=>e.type==='cast'&&e.effect==='magic').length;}
  game.act(a,'retreat');baseline.act(b,'retreat');equalPair(a,b);
  const report=game.expeditionReports(a)[0];counters+=report.actions.counters??0;bleed+=report.damage.bleed;
  assert.ok(a.kills>=1);assert.ok(a.hero.gold>0);
 }
 assert.ok(counters>0,'real counter path exercised');assert.ok(magic>0,'real magical attacks exercised');assert.ok(bleed>0,'actual bleed HP loss exercised');
});

test('v022 independent audit: departure uses actual slotted ranks and actual item identities, never learned-only or preset labels',()=>{
 const s=game.createGame(42);s.hero.level=500;
 for(const id of ['hp-tank','mp-tank','one-handed-damage'])game.act(s,'learnAbility',id);
 for(let i=1;i<10;i++)game.act(s,'upgradeAbility','hp-tank');
 game.act(s,'upgradeAbility','one-handed-damage');
 game.act(s,'slotAbility','one-handed-damage');game.act(s,'slotAbility','hp-tank');
 game.act(s,'targetPriority','weakest');game.act(s,'autoProtection',true);
 const expected={targetPriority:'weakest',autoProtection:true,abilities:[{id:'one-handed-damage',rank:2},{id:'hp-tank',rank:10}],
  equipment:['weapon','armor','accessory'].map(slot=>{const {id,name,level,quality}=s.equipment[slot];return {slot,id,name,level,quality};})};
 game.act(s,'start');assert.equal(s.battle.actions.attacks,0);assert.deepEqual(game.expeditionReports(s),[]);
 // Mutations after departure deliberately discriminate a start capture from settlement capture.
 s.equipment.weapon.name='Changed during expedition';s.equipment.weapon.level=99;
 s.abilities.slotted.reverse();s.abilities.ranks['hp-tank']=2;s.targetPriority='caster';delete s.autoProtection;
 game.act(s,'start');game.act(s,'retreat');const original=game.expeditionReports(s)[0];assert.deepEqual(original.build,expected);
 const altered=game.expeditionReports(s)[0];altered.build.abilities[0].rank=999;altered.build.abilities.push({id:'invented',rank:9});
 altered.build.equipment[0].name='Forged';altered.build.equipment.splice(1);altered.build.targetPriority='front';
 assert.deepEqual(game.expeditionReports(s)[0],original);
 assert.equal(JSON.stringify(s).includes('"build"'),false);
 assert.deepEqual(game.expeditionReports(game.validateSave(copy(s))),[]);
});

test('v022 independent audit: latest two are bounded and a detached retained pin survives subsequent captures',()=>{
 const s=game.createGame(42);game.act(s,'start');game.act(s,'retreat');
 const pin=game.expeditionReports(s)[0],expected=copy(pin);
 assert.equal(pin.build.targetPriority,'front');assert.equal(pin.build.autoProtection,false);assert.deepEqual(pin.build.abilities,[]);
 for(let i=0;i<30;i++){
  game.act(s,'targetPriority',i%2?'caster':'weakest');game.act(s,'start');game.advance(s,.01);game.act(s,'retreat');
  const latest=game.expeditionReports(s);assert.equal(latest.length,2);assert.deepEqual(pin,expected);
  assert.equal(latest[0].build.equipment.length,3);assert.ok(latest[0].build.abilities.length<=5);
 }
 const before=copy(s);for(let i=0;i<100;i++){const reports=game.expeditionReports(s);reports[0].build.equipment[0].id='changed';}assert.deepEqual(s,before);assert.deepEqual(pin,expected);
});
