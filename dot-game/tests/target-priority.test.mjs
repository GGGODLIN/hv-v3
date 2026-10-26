import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createGame,act,advance,stats,validateSave,targetPriorityView,TARGET_PRIORITIES,enemyAttackView,expeditionReports} from '../src/engine.js';
const copy=structuredClone;
const enemy=(id,hp=100000,caster=false)=>({id,name:id,hp,maxHp:hp,attack:0,defense:0,evade:0,parry:0,block:0,...(caster?{attackPattern:'alternating'}:{})});
function fixture(policy='front',seed=42){const s=createGame(seed);act(s,'targetPriority',policy);act(s,'start');s.enemies=[enemy('front'),enemy('caster',100000,true),enemy('weak',50000)];return s;}
function player(s){s._clock=1.05;s._enemyClock=-100;advance(s,.001);}
function incoming(s){s._clock=-100;s._enemyClock=1.9;advance(s,.001);}
test('policy metadata is immutable; default is omitted and views are detached and pure',()=>{
  const s=createGame(7),before=copy(s);assert.equal(Object.hasOwn(s,'targetPriority'),false);
  const view=targetPriorityView(s);assert.deepEqual(view,{policy:'front',label:'依序集火',targetId:null,targetName:null,targetIndex:-1,reason:'出戰後顯示目前集火目標'});
  view.policy='caster';for(let n=0;n<30;n++)targetPriorityView(s);assert.deepEqual(s,before);
  assert.ok(Object.isFrozen(TARGET_PRIORITIES));assert.ok(TARGET_PRIORITIES.every(Object.isFrozen));
});
test('camp changes are optional, strict and never auto-select or spend RNG',()=>{
  const s=createGame(8),before=copy(s);for(const value of [undefined,null,{},[],true,0,'','auto','CASTER']){act(s,'targetPriority',value);assert.deepEqual(s,before);}
  act(s,'targetPriority','caster');assert.equal(s.targetPriority,'caster');assert.equal(s.seed,before.seed);
  act(s,'targetPriority','front');assert.deepEqual(s,before);
  act(s,'start');const battle=copy(s);act(s,'targetPriority','weakest');assert.deepEqual(s,battle);
  s.mode='defeat';const dead=copy(s);act(s,'targetPriority','caster');assert.deepEqual(s,dead);
});
test('save accepts only own enumerable data enums; default normalizes to omission',()=>{
  for(const value of ['front','caster','weakest']){const s=createGame(9);s.targetPriority=value;const loaded=validateSave(s);assert.equal(loaded.targetPriority,value==='front'?undefined:value);assert.equal(loaded.mode,'town');}
  assert.equal(Object.hasOwn(validateSave(createGame()),'targetPriority'),false);
  for(const value of [undefined,null,true,12,{},[],'unknown']){const s=createGame();s.targetPriority=value;assert.throws(()=>validateSave(s),/集火設定/);}
  for(const descriptor of [{value:'caster',enumerable:false},{get(){throw new Error('getter invoked');},enumerable:true}]){const s=createGame();Object.defineProperty(s,'targetPriority',descriptor);assert.throws(()=>validateSave(s),/集火設定/);}
  const inherited=Object.assign(Object.create({targetPriority:'caster'}),createGame());assert.throws(()=>validateSave(inherited),/集火設定/);
});
test('alive ordering, caster identity, current HP and stable ties are explicit',()=>{
  const s=fixture('caster');assert.equal(enemyAttackView(s.enemies[1]).nextKind,'physical');assert.equal(targetPriorityView(s).targetId,'caster');
  incoming(s);assert.equal(enemyAttackView(s.enemies[1]).nextKind,'magic');assert.equal(targetPriorityView(s).targetId,'caster');
  s.enemies[1].hp=0;assert.equal(targetPriorityView(s).targetId,'front');
  s.targetPriority='weakest';assert.equal(targetPriorityView(s).targetId,'weak');s.enemies[0].hp=50000;assert.equal(targetPriorityView(s).targetId,'front');
  s.enemies[0].hp=0;assert.equal(targetPriorityView(s).targetId,'weak');s.enemies[2].hp=0;assert.equal(targetPriorityView(s).targetId,null);
});
test('normal attacks and skills use chosen target without reorder',()=>{
  for(const policy of ['front','caster','weakest'])for(const skill of [false,true]){
    const s=fixture(policy);if(skill)s._turns=4;const ids=s.enemies.map(e=>e.id);player(s);
    const hit=s.events.findLast(e=>['hit','crit','miss','block'].includes(e.type)&&e.target!=='hero');
    assert.ok(hit);assert.equal(hit.target,policy==='weakest'?'weak':policy);assert.deepEqual(s.enemies.map(e=>e.id),ids);
    assert.equal(s.battle.actions.skills,skill?1:0);
  }
});
test('selected enemy receives weapon proc, counter still retaliates against attacker',()=>{
  for(const family of ['axe','rapier','club']){let observed=false;for(let seed=1;seed<=100&&!observed;seed++){
    const s=fixture('caster',seed);s.equipment.weapon.weaponFamily=family;player(s);const field={axe:'bleeding',rapier:'penetratedArmor',club:'stun'}[family];
    if(s.enemies[1][field]){observed=true;assert.equal(s.enemies[0][field],undefined);assert.equal(s.enemies[2][field],undefined);}
  }assert.ok(observed,family);}
  let observed=false;for(let seed=1;seed<=100&&!observed;seed++){
    const s=fixture('caster',seed);s.equipment.weapon.weaponFamily='rapier';s.equipment.armor.stats.block=1;
    // Only front can act; the selected caster remains alive but stunned.
    s.enemies[1].stun={expiresAtTick:4};s.enemies[2].stun={expiresAtTick:4};incoming(s);
    if(s.battle.actions.counters){observed=true;assert.equal(s.events.findLast(e=>e.type==='counter').target,'front');assert.equal(s.enemies[1].hp,100000);assert.equal(s.enemies[2].hp,50000);}
  }assert.ok(observed);
});
test('bleed stays on its applied enemy, terminal death settles once and next wave retargets',()=>{
  const s=fixture('caster');s.enemies[0].hp=1;s.enemies[0].bleeding={stacks:1,expiresAtTick:7,damagePerTick:9};s._clock=-100;s._enemyClock=-100;
  const kills=s.kills;advance(s,1.05);assert.equal(s.enemies[0].hp,0);assert.equal(s.kills,kills+1);assert.equal(targetPriorityView(s).targetId,'caster');
  const once=s.kills;advance(s,1.05);assert.equal(s.kills,once);
  for(const e of s.enemies){if(e.hp>0){e.hp=1;e.bleeding={stacks:1,expiresAtTick:s.timing.ticks+7,damagePerTick:9};}}
  const wave=s.wave;advance(s,1.05);assert.equal(s.wave,wave+1);assert.ok(targetPriorityView(s).targetId);assert.ok(s.enemies.every(e=>e.hp>0));
});
test('default complete state, RNG and reports match frozen v0.20 across 12,000 steps',()=>{
  // Generated once from accepted ee44bf5b2e270e9f71dc62a5567fe7f82053e93b
  // src/engine.js, independently before changing this assertion. This hashes
  // every complete state (including seed), transient report view and ordering.
  const digest=createHash('sha256');
  for(let seed=1;seed<=12;seed++)for(const stage of [1,3,5,6,10]){
    const s=createGame(seed);s.unlocked=stage;s.stage=stage;act(s,'targetPriority','front');act(s,'start');
    for(let n=0;n<200;n++){advance(s,.25);digest.update(JSON.stringify({state:s,reports:expeditionReports(s).map(({build,...legacyReport})=>legacyReport)}));}
  }
  assert.equal(digest.digest('hex'),'a741b6841bc295dbfcd7e091055341ee4cf70e054892cf2ee46ace54cd0f9618');
});
test('Protection keeps its action priority regardless of target choice',()=>{
  for(const policy of ['front','caster','weakest']){
    const s=fixture(policy);s.hero.level=10;s.autoProtection=true;const before=s.enemies.map(e=>e.hp),seed=s.seed;player(s);
    assert.equal(s.battle.actions.protectionCasts,1);assert.equal(s.battle.actions.attacks,0);assert.deepEqual(s.enemies.map(e=>e.hp),before);assert.equal(s.seed,seed);
  }
});
test('terminal selected-target deaths award victory once and never attack replacement wave in same turn',()=>{
  for(const policy of ['caster','weakest']){
    const s=fixture(policy);s.wave=s.totalWaves;s.enemies=[enemy('last',1,true)];s.enemies[0].bleeding={stacks:1,expiresAtTick:7,damagePerTick:9};s._clock=-100;s._enemyClock=-100;
    const wins=s.wins,kills=s.kills;advance(s,1.05);assert.equal(s.wins,wins+1);assert.equal(s.kills,kills+1);assert.equal(s._phase,'intermission');assert.equal(targetPriorityView(s).targetId,null);
    const gold=s.hero.gold,items=s.inventory.length;advance(s,.25);assert.equal(s.wins,wins+1);assert.equal(s.kills,kills+1);assert.equal(s.hero.gold,gold);assert.equal(s.inventory.length,items);
  }
});
test('existing healing still precedes the chosen attack and does not enable Protection same turn',()=>{
  for(const policy of ['front','caster','weakest']){
    const s=fixture(policy);s.hero.level=10;s.autoProtection=true;s.hero.hp=stats(s).maxHp*.1;player(s);
    assert.equal(s.battle.actions.heals,1);assert.equal(s.battle.actions.protectionCasts,undefined);assert.equal(s.battle.actions.attacks,1);
    assert.equal(s.events.findLast(e=>['hit','crit','miss','block'].includes(e.type)&&e.target!=='hero').target,policy==='weakest'?'weak':policy);
  }
});
