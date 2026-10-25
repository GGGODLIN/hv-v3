import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,advance,stats,resolveAttack,resolveWeaponAttack,stunStatus,CLUB_STUN_RULES,validateSave} from '../src/engine.js';

const clone=value=>JSON.parse(JSON.stringify(value));
const club={slot:'weapon',weaponFamily:'club'};
const plain={slot:'weapon',weaponFamily:null};
const attack={attack:100,crit:0};
const enemy=()=>({id:'fixture',hp:10000,maxHp:10000,attack:50,mitigation:0,evade:0,parry:0,block:0});
function sequence(values=[],fallback=.99){let count=0;const rng=()=>values[count++]??fallback;return {rng,get count(){return count;}};}
// Six avoidance checks, first critical, damage die, then eligible proc check.
const ordinaryRoll=proc=>sequence([.9,.9,.9,.9,.9,.9,.9,.5,proc]);
const strike=(target,tick=0,attacker=attack,weapon=club,proc=0)=>resolveWeaponAttack(attacker,target,weapon,tick,ordinaryRoll(proc).rng);
function encounter(family='club',{hp=10000,attack:enemyAttack=50,seed=42}={}){
  const s=createGame(seed);s.equipment.weapon.weaponFamily=family;act(s,'start');s.wave=s.totalWaves;
  s.enemies=[{...enemy(),id:'controlled-club-fixture',name:'Controlled test encounter',hp,maxHp:hp,attack:enemyAttack,defense:5,boss:true}];
  delete s.enemies[0].mitigation;return s;
}
function beforeExpiry(s,{playerClock=0,enemyClock=0}={}){
  s.enemies[0].stun={expiresAtTick:4};s.timing.ticks=3;s.timing.tu=395;
  s._clock=playerClock;s._enemyClock=enemyClock;return s;
}
function until(s,predicate,limit=10000){for(let n=0;n<limit&&!predicate(s);n++)advance(s,.1);assert.ok(predicate(s),'fixture reaches requested state');return s;}
const heroEvents=s=>s.events.filter(e=>e.target==='hero'&&['hit','miss','block'].includes(e.type));

test('club maximum chance and duration are immutable explicit adaptation constants',()=>{
  assert.deepEqual(CLUB_STUN_RULES,{chance:.25,durationTicks:4});assert.ok(Object.isFrozen(CLUB_STUN_RULES));
  const target=enemy();const result=strike(target,10);
  assert.deepEqual(result.proc,{type:'stun',durationTicks:4});assert.deepEqual(target.stun,{expiresAtTick:14});
  assert.deepEqual(stunStatus(target,10),{ticksRemaining:4,recoveryPending:false});
  assert.deepEqual(stunStatus(target,13),{ticksRemaining:1,recoveryPending:false});assert.equal(stunStatus(target,14),null);
});

test('noncritical proc threshold is strictly below 25 percent',()=>{
  for(const value of [0,.249999])assert.equal(strike(enemy(),0,attack,club,value).proc.type,'stun');
  for(const value of [.25,.999999]){const target=enemy();assert.equal(strike(target,0,attack,club,value).proc,undefined);assert.equal(target.stun,undefined);}
});

test('an eligible critical, including nine critical counts, guarantees only one stun with no proc RNG',()=>{
  for(const [multiCrit,count] of [[0,1],[1,9]]){
    const target=enemy(),tested=sequence([],0),baseline=sequence([],0);
    const attacker={...attack,crit:1,multiCrit};const result=resolveWeaponAttack(attacker,target,club,0,tested.rng);
    const expected=resolveAttack(attacker,enemy(),baseline.rng);
    assert.equal(result.crit,count);assert.deepEqual(result.proc,{type:'stun',durationTicks:4});
    assert.equal(tested.count,baseline.count);delete result.proc;assert.deepEqual(result,expected);
  }
});

test('active stun never stacks, refreshes or consumes proc RNG even on criticals or skills',()=>{
  for(const attacker of [attack,{...attack,crit:1,multiCrit:1},{...attack,skill:true,crit:1}]){
    const target={...enemy(),stun:{expiresAtTick:4}},tested=sequence([],0),baseline=sequence([],0);
    const expected=resolveAttack(attacker,{...target,stunned:true},baseline.rng);
    assert.deepEqual(resolveWeaponAttack(attacker,target,club,2,tested.rng),expected);
    assert.deepEqual(target.stun,{expiresAtTick:4});assert.equal(tested.count,baseline.count);
  }
  const target={...enemy(),stunRecoveryPending:true},tested=sequence([],0),baseline=sequence([],0);
  assert.deepEqual(resolveWeaponAttack({...attack,crit:1},target,club,4,tested.rng),resolveAttack({...attack,crit:1},enemy(),baseline.rng));
  assert.equal(target.stunRecoveryPending,true);assert.equal(target.stun,undefined);assert.equal(tested.count,baseline.count);
});

test('active stun bypasses evade and parry only, preserves block and damage-chain trace',()=>{
  const target={...enemy(),evade:1,parry:1,stun:{expiresAtTick:4}};
  const result=resolveWeaponAttack(attack,target,plain,0,()=>.5);
  assert.equal(result.damage,100);assert.deepEqual(result.trace,['Whiff','Absorb','Evade','Parry','Block','Resist','MultiCrit','Mitigation','DamageRoll']);
  target.block=1;assert.equal(resolveWeaponAttack(attack,target,plain,0,()=>.5).outcome,'block');
  target.block=0;assert.equal(resolveWeaponAttack(attack,target,plain,4,()=>.5).outcome,'evade');assert.equal(target.stun,undefined);
  assert.equal(resolveAttack(attack,{evade:1,parry:1,stunned:true},()=>.5).damage,100);
});

test('stun applies after triggering hit; fresh full evade/parry/block and whiff cannot proc',()=>{
  for(const [attacker,target] of [[attack,{...enemy(),evade:1}],[attack,{...enemy(),parry:1}],[attack,{...enemy(),block:1}],[{...attack,whiff:1},enemy()]]){
    const tested=sequence([],0),baseline=sequence([],0);
    const expected=resolveAttack(attacker,clone(target),baseline.rng);
    assert.deepEqual(resolveWeaponAttack(attacker,target,club,0,tested.rng),expected);
    assert.equal(target.stun,undefined);assert.equal(tested.count,baseline.count);
  }
});

test('positive partial avoidance may proc; evade glance still cannot critical',()=>{
  for(const [gate,index] of [['evade',0],['parry',2],['block',4]]){
    const target={...enemy(),[gate]:.5};const rolls=[.1,.9,.9,.9,.9,.9,.9,.5,0];rolls[0]=.9;rolls[index]=.1;
    if(gate==='evade')rolls.splice(6,1);
    const result=resolveWeaponAttack(attack,target,club,0,sequence(rolls).rng);
    assert.equal(result.damage,50);assert.equal(result.crit,0);assert.equal(result.proc.type,'stun');
  }
});

test('zero damage, lethal, magic, skill and nonclub paths do not spend a stun proc draw',()=>{
  for(const [attacker,target,weapon] of [
    [{...attack,attack:0},enemy(),club],[{...attack,attack:1},{...enemy(),mitigation:.95},club],
    [attack,{...enemy(),hp:1},club],[{...attack,magical:true,crit:1},enemy(),club],
    [{...attack,skill:true,crit:1},enemy(),club],[attack,enemy(),plain],
    [attack,enemy(),{slot:'weapon'}],[attack,enemy(),{slot:'armor',weaponFamily:'club'}],
    [attack,enemy(),{slot:'weapon',weaponFamily:'Club'}],[attack,enemy(),createGame().equipment.weapon]
  ]){
    const tested=sequence([],0),baseline=sequence([],0);const expected=resolveAttack(attacker,clone(target),baseline.rng);
    assert.deepEqual(resolveWeaponAttack(attacker,target,weapon,0,tested.rng),expected);assert.equal(tested.count,baseline.count);assert.equal(target.stun,undefined);
  }
});

test('lethal hit clears active and queued states along with PA without a stale recovery',()=>{
  for(const status of [{stun:{expiresAtTick:4}},{stunRecoveryPending:true}]){
    const target={...enemy(),...status,hp:1,penetratedArmor:{stacks:2,expiresAtTick:7}};
    strike(target);assert.equal(target.stun,undefined);assert.equal(target.stunRecoveryPending,undefined);assert.equal(target.penetratedArmor,undefined);
  }
});

test('invalid/unbounded stun states and tick inputs are inactive and never become free attacks',()=>{
  for(const status of [null,{},[],{expiresAtTick:Infinity},{expiresAtTick:5},{expiresAtTick:0},{expiresAtTick:1.5}]){
    const target={...enemy(),stun:status};assert.equal(stunStatus(target,0),null);
    resolveWeaponAttack(attack,target,plain,0,()=>.5);assert.equal(target.stun,undefined);
  }
  for(const tick of [-1,NaN,Infinity,1.5,'0',Number.MAX_SAFE_INTEGER]){
    const target=enemy();assert.equal(strike(target,tick).proc,undefined);assert.equal(stunStatus(target,tick),null);
  }
  assert.equal(stunStatus({...enemy(),hp:0,stunRecoveryPending:true},0),null);
  const s=encounter(null);s.enemies[0].stun={expiresAtTick:999999};s._clock=-1;advance(s,1.1);
  assert.equal(s.enemies[0].stun,undefined);assert.equal(s.enemies[0].stunRecoveryPending,undefined);assert.equal(s.events.length,0);
});

test('stunned ordinary enemy actions are skipped without spending attack RNG or banking actions',()=>{
  const s=encounter(null);s.enemies[0].stun={expiresAtTick:4};s._clock=-5;
  const before=s.seed,hp=s.hero.hp;advance(s,2);
  assert.equal(s.seed,before);assert.equal(s.hero.hp,hp);assert.equal(heroEvents(s).length,0);
  assert.ok(Math.abs(s._enemyClock-.1)<1e-8,'shared cadence advances normally rather than banking a skipped strike');
});

test('fourth crossed TU tick queues recovery; no attack until next player action',()=>{
  const s=beforeExpiry(encounter(null),{enemyClock:1.85});const seed=s.seed;
  advance(s,.1);assert.equal(s.timing.ticks,4);assert.equal(s.enemies[0].stun,undefined);
  assert.deepEqual(stunStatus(s.enemies[0],4),{ticksRemaining:0,recoveryPending:true});
  assert.equal(s.seed,seed);assert.equal(s.events.length,0,'pending recovery also suppresses ordinary due attack');
  s._clock=1;advance(s,.1);
  assert.equal(s.events[0].type,'recovery');assert.equal(s.events[0].effect,'stun');assert.equal(s.events[0].target,s.enemies[0].id);
  assert.equal(s.events[1].target,'hero');assert.equal(s.events[2].target,s.enemies[0].id);assert.equal(heroEvents(s).length,1);
  assert.equal(stunStatus(s.enemies[0],4),null);
});

test('recovery replaces ordinary action in its player-turn interval per enemy, not across enemies',()=>{
  const s=beforeExpiry(encounter(null),{playerClock:1,enemyClock:1.85});
  s.enemies.push({...enemy(),id:'awake-neighbor'});advance(s,.1);
  assert.equal(s.events.filter(e=>e.type==='recovery').length,1);assert.equal(heroEvents(s).length,2,'one recovery plus one normal neighbor attack');
  assert.ok(Math.abs(s._enemyClock-.05)<1e-8,'recovery never resets shared cadence');
  const count=heroEvents(s).length;advance(s,1.85);
  assert.equal(heroEvents(s).length,count+2,'both resume on ordinary cadence without a delayed duplicate');
});

test('earned recovery executes before a same-boundary re-stun, never erased by it',()=>{
  const s=beforeExpiry(encounter('club'),{playerClock:1,enemyClock:1.85});s.equipment.weapon.stats.crit=1;
  advance(s,.1);assert.deepEqual(s.events.map(e=>e.type),['recovery','hit','crit','proc']);
  assert.deepEqual(s.enemies[0].stun,{expiresAtTick:8});assert.equal(s.enemies[0].stunRecoveryPending,undefined);
  assert.equal(heroEvents(s).length,1);assert.equal(s.events.at(-1).effect,'stun');
});

test('fatal recovery interrupts hero heal, attack, rewards, and remaining enemy actions',()=>{
  const s=beforeExpiry(encounter('club',{attack:1e8}),{playerClock:1,enemyClock:1.85});
  s.hero.hp=1;s.enemies.push({...enemy(),id:'also-recovering',stunRecoveryPending:true});
  const before=clone(s.battle.actions),targetHp=s.enemies[0].hp,gold=s.hero.gold;
  advance(s,.1);assert.equal(s.mode,'defeat');assert.equal(s.hero.hp,0);assert.deepEqual(s.battle.actions,before);
  assert.equal(s.enemies[0].hp,targetHp);assert.equal(s.hero.gold,gold);assert.equal(s.kills,0);assert.equal(s.wins,0);
  assert.equal(s.events.filter(e=>e.type==='recovery').length,1);assert.equal(heroEvents(s).length,1);
  assert.ok(s.enemies.every(e=>!e.stun&&!e.stunRecoveryPending));
  const dead=clone(s);advance(s,2);assert.deepEqual(s,dead,'defeat does not continue queued actions');
});

test('death, new waves, retreat, fresh expeditions and save load discard every recovery obligation',()=>{
  const s=encounter(null);s.wave=1;s.enemies[0].hp=1;s.enemies[0].stun={expiresAtTick:4};const target=s.enemies[0];
  until(s,x=>x.wave===2);assert.equal(target.stun,undefined);assert.ok(s.enemies.every(e=>!e.stun&&!e.stunRecoveryPending));
  s.enemies[0].stunRecoveryPending=true;const restored=validateSave(clone(s));
  assert.equal(restored.mode,'town');assert.deepEqual(restored.enemies,[]);assert.equal(restored.timing.ticks,0);
  act(s,'retreat');act(s,'start');assert.ok(s.enemies.every(e=>!e.stun&&!e.stunRecoveryPending));
  s.enemies[0].hp=0;s.enemies[0].stunRecoveryPending=true;s._clock=1;advance(s,.1);
  assert.equal(s.events.filter(e=>e.type==='recovery').length,0);assert.equal(s.enemies[0].stunRecoveryPending,undefined);
});

test('status ignores wall seconds and bounded advance matches equal processed TU',()=>{
  const a=encounter(null),b=clone(a);for(const s of [a,b]){s.enemies[0].stun={expiresAtTick:4};s._clock=-10;}
  advance(a,1e9);advance(b,2);assert.deepEqual(a,b);assert.equal(stunStatus(a.enemies[0],a.timing.ticks).ticksRemaining,3);
});

test('same-seed/stat/encounter club utility is reproducible survival, not a free stat increase',()=>{
  function run(family){
    const s=encounter(family,{hp:2000,attack:50});const initialStats=stats(s);let lastEvent=0,procs=0,recoveries=0,minHp=s.hero.hp;
    for(let n=0;n<10000&&!s.wins&&s.mode==='battle';n++){
      advance(s,.1);
      for(const e of s.events.filter(e=>e.id>lastEvent)){
        if(e.type==='proc'&&e.effect==='stun')procs++;if(e.type==='recovery')recoveries++;lastEvent=e.id;
      }
      if(!s.wins)minHp=Math.min(s.hero.hp,minHp);
    }
    assert.ok(s.wins||s.mode==='defeat');return {s,initialStats,procs,recoveries,minHp};
  }
  const off=run(null),on=run('club');assert.deepEqual(off.initialStats,on.initialStats);
  assert.equal(off.s.mode,'defeat');assert.equal(on.s.wins,1);assert.equal(off.s.battle.elapsed.toFixed(1),'43.7');assert.equal(on.s.battle.elapsed.toFixed(1),'45.2');
  assert.equal(on.procs,7);assert.equal(on.recoveries,7);assert.equal(on.minHp,234);
  assert.equal(on.s.battle.actions.potions,0);assert.equal(off.s.battle.actions.potions,0);
  assert.deepEqual(run(null),off);assert.deepEqual(run('club'),on);
});

test('club events retain hit-before-proc order and bounded queues through repeated cycles',()=>{
  const s=encounter('club',{hp:1e8,attack:0});s.equipment.weapon.stats.crit=1;
  until(s,x=>x.events.some(e=>e.type==='proc'));
  const index=s.events.findIndex(e=>e.type==='proc');assert.ok(index>0);assert.equal(s.events[index-1].type,'crit');
  assert.equal(s.events[index].effect,'stun');assert.equal(s.events[index].value,4);assert.equal(s.events[index].target,s.enemies[0].id);
  for(let n=0;n<3000;n++)advance(s,.1);assert.ok(s.events.length<=30);assert.ok(s.logs.length<=30);
});
