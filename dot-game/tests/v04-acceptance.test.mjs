import test from 'node:test';
import * as historicalV08 from './fixtures/v0.8/engine.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import {
  createGame, act, advance, stats, validateSave, resolveAttack, resolveWeaponAttack,
  stunStatus, CLUB_STUN_RULES, penetratedArmorStatus,
} from '../src/engine.js';
import { resolveWeaponFamily, scoreItem } from '../src/loot.js';

const clone = value => JSON.parse(JSON.stringify(value));
const club = {slot:'weapon',weaponFamily:'club'};
const plain = {slot:'weapon',weaponFamily:null};
const basic = {attack:100,crit:0};
const enemy = extra => ({id:'qa-enemy',name:'QA controlled target',hp:100000,maxHp:100000,attack:0,mitigation:0,evade:0,parry:0,block:0,...extra});
const trace = ['Whiff','Absorb','Evade','Parry','Block','Resist','MultiCrit','Mitigation','DamageRoll'];
function counted(values=[], fallback=.5) {
  let calls=0;
  const rng=()=>{const value=values[calls]??fallback;calls++;return value;};
  return {rng,get calls(){return calls;}};
}
const draws = proc => [...Array(8).fill(.5),proc];
function encounter(seed=42,targets=[enemy()]) {
  const s=createGame(seed);s.equipment.weapon.weaponFamily=null;act(s,'start');
  s.wave=s.totalWaves;s.enemies=targets;return s;
}
const heroEvents = s => s.events.filter(event=>event.target==='hero'&&['hit','miss','block'].includes(event.type));
const recoveries = s => s.events.filter(event=>event.type==='recovery'&&event.effect==='stun');
function boundary(s,{player=true,regular=false}={}) {
  s.timing.ticks=3;s.timing.tu=399;s._clock=player?1.04:0;s._enemyClock=regular?1.89:0;
  advance(s,.02);return s;
}
function finish(s,max=20000) {
  for(let n=0;n<max&&s.mode==='battle'&&!s.wins;n++)advance(s,.1);
  assert.ok(s.wins||s.mode==='defeat','controlled fixture must reach a terminal result');return s;
}

test('v0.4 independent: fixed club rate and duration are frozen explicit adaptations',()=>{
  assert.deepEqual(CLUB_STUN_RULES,{chance:.25,durationTicks:4});
  assert.equal(Object.isFrozen(CLUB_STUN_RULES),true);
});
test('v0.4 independent: strict chance boundary applies stun only after unchanged damage',()=>{
  for(const [roll,success] of [[0,true],[.249999,true],[.25,false],[.999999,false]]) {
    const target=enemy(),rng=counted(draws(roll));
    const result=resolveWeaponAttack(basic,target,club,10,rng.rng);
    assert.equal(result.damage,100);assert.deepEqual(result.trace,trace);assert.equal(rng.calls,9);
    assert.equal(Boolean(result.proc),success);
    if(success) {
      assert.deepEqual(result.proc,{type:'stun',durationTicks:4});
      assert.deepEqual(target.stun,{expiresAtTick:14});
      assert.deepEqual(stunStatus(target,10),{ticksRemaining:4,recoveryPending:false});
    } else assert.equal(stunStatus(target,10),null);
  }
});
test('v0.4 independent: one or nine critical counts guarantee one stun without proc RNG',()=>{
  for(const multiCrit of [0,1]) {
    const attacker={...basic,crit:1,multiCrit},a=counted([],0),b=counted([],0),target=enemy();
    const result=resolveWeaponAttack(attacker,target,club,10,a.rng);
    const baseline=resolveAttack(attacker,enemy(),b.rng);
    assert.equal(result.crit,multiCrit?9:1);assert.equal(result.damage,baseline.damage);
    assert.equal(a.calls,b.calls);assert.deepEqual(target.stun,{expiresAtTick:14});
  }
});
test('v0.4 independent: positive partial avoids qualify, but evade glance cannot critical',()=>{
  for(const [gate,index] of [['evade',0],['parry',2],['block',4]]) {
    const rolls=[.9,.9,.9,.9,.9,.9,.9,.5,0];rolls[index]=.1;
    if(gate==='evade')rolls.splice(6,1);
    const target=enemy({[gate]:.5}),result=resolveWeaponAttack({...basic,crit:1},target,club,10,counted(rolls,.99).rng);
    assert.ok(result.damage>0);assert.equal(result.proc.type,'stun');
    if(gate==='evade')assert.equal(result.crit,0);
  }
});
test('v0.4 independent: avoidance, zero, lethal, invalid HP, magic and skills never trigger or draw proc RNG',()=>{
  for(const [attacker,target] of [
    [{...basic,whiff:1},enemy()],[basic,enemy({evade:1})],[basic,enemy({parry:1})],[basic,enemy({block:1})],
    [{...basic,attack:0},enemy()],[{...basic,attack:1},enemy({mitigation:.95})],
    [basic,enemy({hp:80})],[basic,enemy({hp:0})],[basic,enemy({hp:Infinity})],
    [{...basic,magical:true},enemy()],[{...basic,skill:true,crit:1},enemy()],
  ]) {
    const a=counted([],0),b=counted([],0),baseline=resolveAttack(attacker,clone(target),b.rng);
    const result=resolveWeaponAttack(attacker,target,club,10,a.rng);
    assert.deepEqual(result,baseline);assert.equal(a.calls,b.calls);assert.equal(stunStatus(target,10),null);
  }
});
test('v0.4 independent: active stun disables evade and parry but not block or mitigation',()=>{
  const target=enemy({evade:1,parry:1,mitigation:.5,specificMit:.5,stun:{expiresAtTick:14}});
  const a=counted(),b=counted();
  const result=resolveWeaponAttack({...basic,crit:1,multiCrit:0},target,plain,10,a.rng);
  const baseline=resolveAttack({...basic,crit:1,multiCrit:0},{...target,evade:0,parry:0,stunned:true},b.rng);
  assert.equal(result.damage,37);assert.equal(result.crit,1);assert.deepEqual(result.trace,trace);
  assert.equal(a.calls,5,'two block rolls, crit/continuation and one damage die only');
  assert.equal(result.damage,baseline.damage);
  target.block=1;assert.equal(resolveWeaponAttack(basic,target,club,10,()=>.5).outcome,'block');
  assert.equal(target.mitigation,.5);assert.equal(target.specificMit,.5);
});
test('v0.4 independent: active stun never stacks, refreshes, or consumes extra proc RNG',()=>{
  for(const attacker of [basic,{...basic,crit:1,multiCrit:0},{...basic,skill:true}]) {
    const target=enemy({stun:{expiresAtTick:14}}),a=counted(),b=counted();
    const result=resolveWeaponAttack(attacker,target,club,12,a.rng);
    const baseline=resolveAttack(attacker,{...target,stunned:true},b.rng);
    assert.deepEqual(result,baseline);assert.equal(a.calls,b.calls);
    assert.deepEqual(target.stun,{expiresAtTick:14});
    assert.deepEqual(stunStatus(target,13),{ticksRemaining:1,recoveryPending:false});
  }
});
test('v0.4 independent: earned recovery is not canceled by another pure-wrapper club hit',()=>{
  const target=enemy({stunRecoveryPending:true}),a=counted([],0),b=counted([],0);
  const result=resolveWeaponAttack({...basic,crit:1},target,club,14,a.rng);
  assert.deepEqual(result,resolveAttack({...basic,crit:1},enemy(),b.rng));assert.equal(a.calls,b.calls);
  assert.equal(target.stunRecoveryPending,true);assert.equal(target.stun,undefined);
  assert.deepEqual(stunStatus(target,14),{ticksRemaining:0,recoveryPending:true});
});
test('v0.4 independent: exact expiry restores avoidance, with no immortal or malformed active status',()=>{
  const target=enemy({evade:1,parry:1,stun:{expiresAtTick:14}});
  assert.deepEqual(stunStatus(target,13),{ticksRemaining:1,recoveryPending:false});
  assert.notEqual(stunStatus(target,14)?.ticksRemaining,1);
  const result=resolveWeaponAttack(basic,target,plain,14,()=>.5);
  assert.equal(result.outcome,'evade');assert.equal(target.stun,undefined);
  for(const status of [null,{},[],{expiresAtTick:Infinity},{expiresAtTick:15},{expiresAtTick:10},{expiresAtTick:12.5}]) {
    const bad=enemy({stun:status});assert.equal(stunStatus(bad,10),null);
    assert.equal(resolveWeaponAttack(basic,bad,plain,10,()=>.5).damage,100);
  }
  for(const tick of [-1,Infinity,NaN,1.5,'10',Number.MAX_SAFE_INTEGER]) {
    const bad=enemy();assert.equal(resolveWeaponAttack(basic,bad,club,tick,()=>0).proc,undefined);
    assert.equal(bad.stun,undefined);
  }
});
test('v0.4 independent: PA and stun coexist without changing PA timing or damage formula',()=>{
  const target=enemy({mitigation:.8,evade:1,parry:1,stun:{expiresAtTick:14},penetratedArmor:{stacks:2,expiresAtTick:17}});
  const result=resolveWeaponAttack(basic,target,club,10,()=>.5);
  assert.equal(result.damage,60);assert.equal(result.proc,undefined);
  assert.deepEqual(penetratedArmorStatus(target,10),{stacks:2,ticksRemaining:7,mitigationMultiplier:.5});
  assert.deepEqual(target.stun,{expiresAtTick:14});
});
test('v0.4 independent: lethal damage removes active and pending statuses without recovery',()=>{
  for(const status of [{stun:{expiresAtTick:14}},{stunRecoveryPending:true}]) {
    const target=enemy({hp:10,...status,penetratedArmor:{stacks:1,expiresAtTick:17}});
    const result=resolveWeaponAttack(basic,target,club,10,()=>.5);
    assert.equal(result.proc,undefined);assert.equal(target.stun,undefined);assert.equal(target.stunRecoveryPending,undefined);
    assert.equal(target.penetratedArmor,undefined);
  }
});
test('v0.4 independent: ordinary enemy cadence skips active stun without attack RNG or damage',()=>{
  const s=encounter(),before=s.seed;s.enemies[0].stun={expiresAtTick:4};s._enemyClock=1.89;s._clock=0;
  advance(s,.02);assert.equal(s.seed,before);assert.equal(heroEvents(s).length,0);
  assert.equal(recoveries(s).length,0);assert.equal(s.hero.hp,stats(s).maxHp);
});
test('v0.4 independent: expiry between player turns queues once, rather than attacking immediately',()=>{
  const s=encounter();s.enemies[0].stun={expiresAtTick:4};boundary(s,{player:false,regular:true});
  assert.equal(s.timing.ticks,4);assert.equal(s.timing.turns,0);assert.equal(heroEvents(s).length,0);
  assert.equal(s.enemies[0].stun,undefined);assert.equal(s.enemies[0].stunRecoveryPending,true);
  s._clock=1.04;advance(s,.02);
  assert.equal(recoveries(s).length,1);assert.equal(heroEvents(s).length,1);assert.equal(s.timing.turns,1);
  assert.notEqual(s.enemies[0].stunRecoveryPending,true);
  for(let n=0;n<3;n++){s._clock=1.04;advance(s,.02);}
  assert.equal(recoveries(s).length,1,'earned action cannot repeat');
});
test('v0.4 independent: recovery occurs before next player attack and may kill before healing or attacking',()=>{
  const s=encounter(42,[enemy({attack:1e9,stun:{expiresAtTick:4}})]);
  s.hero.hp=1;const mana=s.hero.mp;boundary(s);
  assert.equal(s.mode,'defeat');assert.equal(s.timing.turns,0);assert.equal(s.battle.actions.attacks,0);
  assert.equal(s.battle.actions.heals,0);assert.equal(s.hero.mp,mana);assert.equal(recoveries(s).length,1);
  advance(s,2);assert.equal(recoveries(s).length,1);
});
test('v0.4 independent: coalescing recovery with due ordinary action is per enemy, not global',()=>{
  const s=encounter(42,[enemy({id:'recovering',stun:{expiresAtTick:4}}),enemy({id:'ordinary'})]);
  boundary(s,{regular:true});
  assert.equal(recoveries(s).length,1);assert.equal(recoveries(s)[0].target,'recovering');
  assert.equal(heroEvents(s).length,2,'one recovery plus other enemy ordinary action; no double action');
  assert.ok(s._enemyClock<.1,'shared cadence is consumed once, not reset or delayed');
  const recoveryIndex=s.events.findIndex(event=>event.type==='recovery');
  const playerIndex=s.events.findIndex(event=>event.target==='recovering'&&['hit','crit'].includes(event.type));
  assert.ok(recoveryIndex>=0&&playerIndex>recoveryIndex);
});
test('v0.4 independent: multiple expired enemies recover once each, with unrelated ordinary enemy intact',()=>{
  const s=encounter(42,[enemy({id:'first',stun:{expiresAtTick:4}}),enemy({id:'second',stun:{expiresAtTick:4}}),enemy({id:'third'})]);
  boundary(s,{regular:true});
  assert.deepEqual(recoveries(s).map(event=>event.target),['first','second']);
  assert.equal(heroEvents(s).length,3);assert.ok(s.enemies.every(e=>!e.stun&&!e.stunRecoveryPending));
});
test('v0.4 independent: dead enemies never receive queued recovery or transfer it to another target',()=>{
  const s=encounter(42,[enemy({id:'dead',hp:0,stunRecoveryPending:true}),enemy({id:'living'})]);
  s._clock=1.04;advance(s,.02);
  assert.equal(recoveries(s).length,0);assert.equal(heroEvents(s).length,0);
  assert.equal(s.enemies[1].stunRecoveryPending,undefined);assert.equal(s.enemies[1].stun,undefined);
});
test('v0.4 independent: manual potion, inert actions and repeated zero time do not spend pending recovery',()=>{
  const s=encounter();s.enemies[0].stunRecoveryPending=true;s.hero.hp-=200;
  act(s,'heal');act(s,'setStrategy','assault');advance(s,0);advance(s,NaN);advance(s,-1);
  assert.equal(recoveries(s).length,0);assert.equal(s.enemies[0].stunRecoveryPending,true);assert.equal(s.timing.turns,0);
  s._clock=1.04;advance(s,.02);assert.equal(recoveries(s).length,1);
});
test('v0.4 independent: retreat, new expedition, reload and new wave cannot retain combat statuses',()=>{
  const s=encounter();Object.assign(s.enemies[0],{stun:{expiresAtTick:4},stunRecoveryPending:true});
  s.equipment.weapon.weaponFamily='club';s.hero.gold=123;s.hero.xp=42;
  const loaded=validateSave(clone(s));
  assert.equal(loaded.mode,'town');assert.deepEqual(loaded.enemies,[]);assert.equal(loaded.hero.gold,123);assert.equal(loaded.hero.xp,42);
  assert.equal(loaded.equipment.weapon.weaponFamily,'club');assert.equal(loaded.timing.ticks,0);
  act(s,'retreat');act(s,'start');assert.ok(s.enemies.every(e=>!e.stun&&!e.stunRecoveryPending));
  s.equipment.weapon.weaponFamily=null;s.enemies=[enemy({hp:1,stun:{expiresAtTick:s.timing.ticks+4}})];
  s._clock=1.04;advance(s,.02);assert.equal(s.wave,2);assert.ok(s.enemies.every(e=>!e.stun&&!e.stunRecoveryPending));
});
test('v0.4 independent: club identity changes no sheet stat, item score, or camp resources',()=>{
  const s=createGame(42),sheet=stats(s),hero=clone(s.hero),score=scoreItem(s.equipment.weapon);
  s.equipment.weapon.weaponFamily='club';assert.deepEqual(stats(s),sheet);assert.deepEqual(s.hero,hero);assert.equal(scoreItem(s.equipment.weapon),score);
  for(const family of ['club','rapier','axe',null]) {
    s.equipment.weapon.weaponFamily=family;const loaded=validateSave(clone(s));
    assert.equal(resolveWeaponFamily(loaded.equipment.weapon),family);assert.deepEqual(stats(loaded),sheet);
  }
});
test('historical v0.4–v0.8: nonproc starter signatures run on frozen v0.8, not corrected v0.8.1',()=>{
  for(const [seed,finalSeed,itemCount] of [[1,2209033545,2],[42,3839731728,1],[999,876178866,1]]) {
    const s=historicalV08.createGame(seed);historicalV08.act(s,'start');
    for(let n=0;n<20000&&s.mode==='battle'&&!s.wins;n++)historicalV08.advance(s,.1);
    assert.equal(s.wins,1);assert.equal(Number(s.battle.elapsed.toFixed(1)),31.6);assert.equal(s.seed,finalSeed);
    assert.equal(s.inventory.length,itemCount);assert.equal(s.hero.gold,76);assert.equal(s.hero.level,2);assert.equal(s.hero.xp,6);assert.equal(s.timing.turns,30);
  }
});
// Source contracts are not browser or physical-device acceptance.
test('v0.4 integration: compatible v3 storage and writer keys remain isolated by candidate URL scope',()=>{
  const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
  const constants=ui.slice(ui.indexOf('const candidatePath ='),ui.indexOf('const $ ='));
  const keys=pathname=>runInNewContext(`${constants}\n({SAVE_KEY,LEGACY_SAVE_KEYS,PREF_KEY,LOCK_NAME})`,{location:{pathname}});
  const stable=keys('/play/hv-v3-dot/'),candidate=keys('/play/hv-v3-dot/candidates/v0.4/');
  assert.equal(stable.SAVE_KEY,'hv-v3-dot-stable-save-v3');assert.equal(stable.LOCK_NAME,'hv-v3-dot-stable-writer-v3');
  assert.equal(stable.PREF_KEY,'hv-v3-dot-stable-preferences-v3');
  assert.deepEqual(Array.from(stable.LEGACY_SAVE_KEYS),['hv-v3-dot-stable-save-v2','hv-v3-dot-stable-save-v1']);
  assert.equal(candidate.SAVE_KEY,'hv-v3-dot-candidate-v0.4-save-v3');assert.equal(candidate.LOCK_NAME,'hv-v3-dot-candidate-v0.4-writer-v3');
  assert.ok(candidate.LEGACY_SAVE_KEYS.every(key=>key.includes('candidate-v0.4')));
  assert.doesNotMatch(ui,/writeStorage\(LEGACY_SAVE_KEYS|removeItem\(/);
});

test('v0.4 independent: a crossed tick observed after expiry still queues exactly one recovery',()=>{
  const s=encounter();s.enemies[0].stun={expiresAtTick:4};
  s.timing.ticks=0;s.timing.tu=599;s._clock=0;
  advance(s,.02);assert.equal(s.timing.ticks,6);assert.equal(s.enemies[0].stun,undefined);
  assert.equal(s.enemies[0].stunRecoveryPending,true);assert.equal(recoveries(s).length,0);
  s._clock=1.04;advance(s,.02);assert.equal(recoveries(s).length,1);
  s._clock=1.04;advance(s,.02);assert.equal(recoveries(s).length,1);
});
test('v0.4 independent: re-stun after expiry cannot erase earned recovery or cause same-cycle double attack',()=>{
  const s=encounter();s.equipment.weapon.weaponFamily='club';s.equipment.weapon.stats.crit=1;
  s.enemies[0].stun={expiresAtTick:4};boundary(s,{regular:true});
  assert.equal(recoveries(s).length,1);assert.equal(heroEvents(s).length,1);
  const procIndex=s.events.findIndex(event=>event.type==='proc'&&event.effect==='stun');
  const recoveryIndex=s.events.findIndex(event=>event.type==='recovery');
  assert.ok(procIndex>recoveryIndex);assert.deepEqual(s.enemies[0].stun,{expiresAtTick:8});
  assert.equal(s.enemies[0].stunRecoveryPending,undefined);
  const oldExpiry=s.enemies[0].stun.expiresAtTick;s._clock=1.04;advance(s,.02);
  assert.equal(recoveries(s).length,1);assert.equal(s.enemies[0].stun.expiresAtTick,oldExpiry);
});
test('v0.4 independent: recovery/regular coalescing cannot create an extra attack from caller partitioning',()=>{
  function replay(dt) {
    const s=encounter(42,[enemy({attack:10,stun:{expiresAtTick:18}})]);
    s.timing.ticks=14;s.timing.tu=1400;s.battle.elapsed=14.7;s._clock=0;s._enemyClock=14.7%1.9;
    let remaining=4.5,index=0;
    while(remaining>1e-8){const step=Math.min(Array.isArray(dt)?dt[index++%dt.length]:dt,remaining);advance(s,step);remaining-=step;}
    return {attacks:heroEvents(s).length,recoveries:recoveries(s).length,hp:s.hero.hp,seed:s.seed};
  }
  const baseline=replay(.1);assert.equal(baseline.recoveries,1);
  for(const partition of [.25,2,.05,.17,[.03,.17,.08,.42,.01],[.19,.004,.201,.37,.052]]) {
    assert.deepEqual(replay(partition),baseline,`partition ${JSON.stringify(partition)}`);
  }
});
function controlledClubReplay(family,hp,attack,avoid,engine={createGame,act,advance}) {
    const s=engine.createGame(42);engine.act(s,'start');s.wave=s.totalWaves;
    s.enemies=[enemy({hp,maxHp:hp,attack,evade:avoid,parry:avoid,boss:true})];
    s.equipment.weapon.weaponFamily=family;
    let last=0,incoming=0,incomingAttempts=0,procCount=0,recoveryCount=0;
    for(let n=0;n<20000&&s.mode==='battle'&&!s.wins;n++) {
      engine.advance(s,.1);
      for(const event of s.events.filter(event=>event.id>last)) {
        if(event.target==='hero'&&['hit','miss','block'].includes(event.type)){incoming+=event.value||0;incomingAttempts++;}
        if(event.type==='proc'&&event.effect==='stun')procCount++;
        if(event.type==='recovery'&&event.effect==='stun')recoveryCount++;
        last=event.id;
      }
    }
    assert.ok(s.wins||s.mode==='defeat');
    return {win:s.wins,time:Number(s.battle.elapsed.toFixed(1)),incoming,incomingAttempts,procCount,recoveryCount,actions:clone(s.battle.actions),seed:s.seed};
}
test('v0.8.1 independent: unchanged paired club fixtures show paid recovery and less incoming, not the old forced win/loss split',()=>{
  const replay=controlledClubReplay;
  const ordinary=replay(null,1000,40,.3),controlled=replay('club',1000,40,.3);
  assert.equal(ordinary.win,1);assert.equal(controlled.win,1);
  assert.ok(controlled.time<ordinary.time);assert.ok(controlled.incoming<ordinary.incoming);assert.ok(controlled.incomingAttempts<ordinary.incomingAttempts);
  assert.ok(controlled.procCount>0);assert.ok(controlled.recoveryCount>0);
  assert.deepEqual(replay('club',1000,40,.3),controlled);assert.deepEqual(replay(null,1000,40,.3),ordinary);
  const pressure=replay(null,2000,50,0),protectedRun=replay('club',2000,50,0);
  // The corrected clock gives the same old no-proc fixture its due action in
  // time to win. Keep the seed/stats; do not search for a replacement loser.
  assert.equal(pressure.win,1);assert.equal(protectedRun.win,1);
  assert.ok(protectedRun.incoming<pressure.incoming);assert.ok(protectedRun.incomingAttempts<pressure.incomingAttempts);
  assert.ok(protectedRun.procCount>0);assert.ok(protectedRun.recoveryCount>0);
  assert.deepEqual(replay(null,2000,50,0),pressure);assert.deepEqual(replay('club',2000,50,0),protectedRun);
  assert.equal(replay('club',3000,40,.2).win,1,'the old losing counterexample also changes; it cannot be advertised as a current loss');
  // Current fatal-recovery tests above/below still prove that stun cannot grant
  // immunity; no new hand-picked seed is substituted for the changed result.
});

test('historical v0.4–v0.8: old pressure split and losing club counterexample remain reproducible on frozen v0.8',()=>{
  const replay=(...args)=>controlledClubReplay(...args,historicalV08);
  const pressure=replay(null,2000,50,0),protectedRun=replay('club',2000,50,0),counterexample=replay('club',3000,40,.2);
  assert.equal(pressure.win,0);assert.equal(protectedRun.win,1);assert.equal(counterexample.win,0);
  assert.deepEqual(replay(null,2000,50,0),pressure);assert.deepEqual(replay('club',2000,50,0),protectedRun);assert.deepEqual(replay('club',3000,40,.2),counterexample);
});


test('v0.4 independent: recovery coalescing ends at the next player turn rather than granting lasting immunity',()=>{
  const s=encounter(42,[enemy({attack:10,stun:{expiresAtTick:18}})]);
  s.timing.ticks=14;s.timing.tu=1400;s.battle.elapsed=14.7;s._clock=0;s._enemyClock=14.7%1.9;
  for(let n=0;n<45;n++)advance(s,.1);
  assert.equal(recoveries(s).length,1);assert.equal(heroEvents(s).length,1);
  for(let n=0;n<18;n++)advance(s,.1);
  assert.equal(recoveries(s).length,1);assert.equal(heroEvents(s).length,2,'ordinary next-cycle action resumes');
});
test('v0.4 independent: lethal recovery stops the rest of the enemy queue and clears transient status',()=>{
  const s=encounter(42,[enemy({id:'lethal',attack:1e9,stunRecoveryPending:true}),enemy({id:'later',stunRecoveryPending:true})]);
  s.hero.hp=1;s._clock=1.04;s._enemyClock=1.89;advance(s,.02);
  assert.equal(s.mode,'defeat');assert.equal(recoveries(s).length,1);assert.equal(heroEvents(s).length,1);
  assert.equal(s.battle.actions.attacks,0);
  assert.ok(s.enemies.every(e=>!e.stun&&!e.stunRecoveryPending&&e.stunRecoveryTurn===undefined));
});
test('v0.4 independent: pure damage wrapper cleans stale stun but does not invent a scheduler recovery action',()=>{
  const target=enemy({stun:{expiresAtTick:14}});
  resolveWeaponAttack(basic,target,plain,14,()=>.5);
  assert.equal(target.stun,undefined);assert.equal(target.stunRecoveryPending,undefined);
  assert.equal(stunStatus(target,14),null);
});
