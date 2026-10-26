import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,advance,targetPriorityView,enemyAttackView,validateSave,expeditionReports} from '../src/engine.js';
const enemy=(id,hp=10000,extra={})=>({id,name:id,hp,maxHp:hp,attack:0,defense:0,evade:0,parry:0,block:0,...extra});
function fixture(seed=42,policy='caster'){const s=createGame(seed);act(s,'targetPriority',policy);act(s,'start');s.enemies=[enemy('front'),enemy('caster',10000,{attackPattern:'alternating'})];return s;}
function incoming(s){s._clock=-100;s._enemyClock=1.9;advance(s,.001);}
function player(s){s._clock=1.05;s._enemyClock=-100;advance(s,.001);}

test('audit: caster identity survives both physical and magic next-action phases, detached pure views',()=>{
 const s=fixture(),e=s.enemies[1];
 for(const expected of ['physical','magic','physical']){
  assert.equal(enemyAttackView(e).nextKind,expected);
  const before=JSON.stringify(s);for(let i=0;i<100;i++){const v=targetPriorityView(s);assert.equal(v.targetId,'caster');v.targetId='front';}
  assert.equal(JSON.stringify(s),before);incoming(s);
 }
 e.hp=0;assert.equal(targetPriorityView(s).targetId,'front');
 s.enemies[0].hp=0;assert.equal(targetPriorityView(s).targetId,null);
});
test('audit: weakest means absolute remaining HP, not HP fraction, deterministic ties and dead exclusion',()=>{
 const s=fixture(8,'weakest');s.enemies=[enemy('dead',0),enemy('large',20,{maxHp:10000}),enemy('small',19,{maxHp:20}),enemy('tie',19)];
 assert.equal(targetPriorityView(s).targetId,'small');s.enemies[2].hp=0;assert.equal(targetPriorityView(s).targetId,'tie');
 assert.deepEqual(s.enemies.map(e=>e.id),['dead','large','small','tie']);
});
test('audit: strict optional schema never executes accessor; explicit front canonicalizes to absent',()=>{
 for(const value of [null,undefined,false,0,{},[],new String('caster'),'Caster','lowest']){const s=createGame();s.targetPriority=value;assert.throws(()=>validateSave(s));}
 const accessor=createGame();let reads=0;Object.defineProperty(accessor,'targetPriority',{get(){reads++;return 'caster';},enumerable:true});assert.throws(()=>validateSave(accessor));assert.equal(reads,0);
 const inherited=Object.assign(Object.create({targetPriority:'caster'}),createGame());assert.throws(()=>validateSave(inherited));
 const s=createGame();s.targetPriority='front';assert.equal(Object.hasOwn(validateSave(s),'targetPriority'),false);
 for(const policy of ['caster','weakest']){act(s,'targetPriority',policy);assert.equal(validateSave(JSON.parse(JSON.stringify(s))).targetPriority,policy);}
 act(s,'targetPriority','front');assert.equal(Object.hasOwn(s,'targetPriority'),false);
});
test('audit: attacks including cadence skills hit selected actor, not first actor',()=>{
 for(const policy of ['caster','weakest']){const s=fixture(42,policy);s.enemies[1].hp=9999;
  for(let i=0;i<7;i++)player(s);
  assert.equal(s.enemies[0].hp,10000);assert.ok(s.enemies[1].hp<9999);assert.ok(s.battle.actions.skills>0);
  assert.ok(s.events.filter(e=>['hit','crit','miss','block'].includes(e.type)&&e.target!=='hero').every(e=>e.target==='caster'));
 }
});
test('audit: counter retaliation does not follow caster targeting away from actual attacker',()=>{
 let witnessed=0;
 for(let seed=1;seed<=120;seed++){
  const s=createGame(seed);s.equipment.weapon.weaponFamily='rapier';s.equipment.armor.stats.block=1;
  act(s,'targetPriority','caster');act(s,'start');s.enemies=[enemy('attacker'),enemy('caster',10000,{attackPattern:'alternating',stun:{expiresAtTick:4}})];
  incoming(s);const hits=s.events.filter(e=>e.type==='counter');
  if(hits.length){witnessed++;assert.ok(hits.every(e=>e.target==='attacker'));assert.equal(s.enemies[1].hp,10000);}
 }
 assert.ok(witnessed>0,'real deterministic RNG reaches at least one counter');
});
test('audit: existing bleed kills off-policy target once and selection advances without reward duplication',()=>{
 const s=fixture(42);s.enemies[0].hp=1;s.enemies[0].bleeding={stacks:1,expiresAtTick:7,damagePerTick:8};
 const kills=s.kills,gold=s.hero.gold;s._clock=-100;s._enemyClock=-100;
 s.timing.tu=(s.timing.ticks+1)*100-1;advance(s,.02);assert.equal(s.enemies[0].hp,0);assert.equal(s.kills,kills+1);assert.equal(targetPriorityView(s).targetId,'caster');assert.ok(s.hero.gold>gold);
 const paid=s.hero.gold;s.timing.tu=(s.timing.ticks+1)*100-1;advance(s,.02);assert.equal(s.kills,kills+1);assert.equal(s.hero.gold,paid);
});
test('audit: all-dead DoT boundary creates next wave without selecting dead actors or double-settlement',()=>{
 const s=fixture(42,'weakest');s.wave=1;s.totalWaves=3;for(const e of s.enemies){e.hp=1;e.bleeding={stacks:1,expiresAtTick:7,damagePerTick:8};}
 s._clock=-100;s._enemyClock=-100;s.timing.tu=(s.timing.ticks+1)*100-1;advance(s,.02);assert.equal(s.wave,2);assert.equal(s.kills,2);assert.ok(s.enemies.some(e=>e.id===targetPriorityView(s).targetId));
 const ids=s.enemies.map(e=>e.id),gold=s.hero.gold;advance(s,.001);assert.equal(s.wave,2);assert.equal(s.kills,2);assert.equal(s.hero.gold,gold);assert.deepEqual(s.enemies.map(e=>e.id),ids);assert.equal(expeditionReports(s).length,0);
});
