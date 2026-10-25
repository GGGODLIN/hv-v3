import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, act, advance, validateSave } from '../src/engine.js';
import { createPump } from '../src/session.js';

const clone=value=>structuredClone(value);
function encounter() {
  const s=createGame(42);act(s,'start');s.wave=4;s.events=[];s._eventId=0;
  s.enemies=[{id:'clock-target',name:'Independent clock target',hp:1e12,maxHp:1e12,attack:0,defense:0,evade:0,parry:0,block:0,boss:true}];
  return s;
}
// Integer microsecond bookkeeping belongs only to these caller fixtures. The
// real engine and real pump are used unchanged; no scheduler is reimplemented.
function runFor(s,seconds,pattern) {
  let remaining=Math.round(seconds*1e6),index=0,incoming=0;
  while(remaining>0) {
    const us=Math.min(remaining,Math.round(pattern[index++%pattern.length]*1e6)),before=s._eventId;
    advance(s,us/1e6);remaining-=us;
    incoming+=s.events.filter(e=>e.id>before&&e.target==='hero').length;
  }
  return incoming;
}

for(const seconds of [1.05,2.1,21,42]) {
  test(`numeric boundary: ${seconds}s pays every due player action and TU tick across specified partitions`,()=>{
    for(const pattern of [[.05],[.1],[.25],[1],[2],[.249,.251],[.2,.3]]) {
      const s=encounter();runFor(s,seconds,pattern);
      assert.equal(s.battle.actions.attacks,Math.round(seconds/1.05),JSON.stringify(pattern));
      assert.equal(s.timing.ticks,Math.round(seconds/1.05),JSON.stringify(pattern));
      assert.ok(Math.abs(s.battle.elapsed-seconds)<1e-9,'processed elapsed is not rounded or inflated');
    }
  });
}

test('actual UI pump: eighty-four 250ms observations process 21s, twenty player actions and twenty ticks',()=>{
  const s=encounter();let now=0,incoming=0;
  const pump=createPump({now:()=>now,active:()=>true,step:seconds=>{
    const previous=s._eventId;advance(s,seconds);incoming+=s.events.filter(e=>e.id>previous&&e.target==='hero').length;
  }});
  for(let n=1;n<=84;n++){now=n*250;assert.equal(pump.tick(),.25);}
  assert.equal(s.battle.actions.attacks,20);assert.equal(s.timing.ticks,20);assert.equal(incoming,11);
  const before=clone(s);assert.equal(pump.tick(),0);assert.deepEqual(s,before,'same observation cannot pay twice');
});

test('enemy cadence pays the exact 1.9s boundary without resetting its signed residual',()=>{
  for(const pattern of [[.05],[.1],[.25],[1],[2]]) {
    const s=encounter();s._clock=-100;
    assert.equal(runFor(s,1.9,pattern),1,JSON.stringify(pattern));
    assert.ok(Math.abs(s._enemyClock)<1e-9);assert.equal(s.battle.actions.attacks,0);
  }
  const s=encounter();s._clock=-100;s._enemyClock=1.9-.01-1e-10;advance(s,.01);
  assert.equal(s.events.filter(e=>e.target==='hero').length,1);assert.ok(s._enemyClock<0,'early equality decision retains debt');
});

test('three-second intermission completes at equality, with the existing crossing-overshoot rule unchanged',()=>{
  for(const pattern of [[.05],[.1],[.25],[1],[2]]) {
    const s=encounter();s._phase='intermission';s._rest=3;s.enemies=[];
    runFor(s,3,pattern);assert.equal(s._phase,'fight',JSON.stringify(pattern));assert.equal(s.wave,1);
    assert.ok(s.battle.elapsed<1e-9);assert.equal(s.battle.actions.attacks,0);
  }
  const s=encounter();s._phase='intermission';s._rest=.05;s.enemies=[];advance(s,.1);
  assert.equal(s._phase,'fight');assert.equal(s.battle.elapsed,0,'existing surplus inside crossing substep is not replayed');
  const early=encounter();early._phase='intermission';early._rest=.01+5e-10;early.enemies=[];advance(early,.01);
  assert.equal(early._phase,'fight','documented equality window can finish rest by less than 1ns');
});

test('meaningfully below all four boundaries remains not due; tolerance never adds elapsed input',()=>{
  const gap=1e-6,dt=.01,s=encounter();
  s._clock=1.05-dt-gap;s._enemyClock=1.9-dt-gap;s.timing.tu=100-(dt+gap)*100/1.05;
  advance(s,dt);assert.equal(s.battle.actions.attacks,0);assert.equal(s.events.length,0);assert.equal(s.timing.ticks,0);
  assert.equal(s.battle.elapsed,dt);assert.ok(s._clock<1.05);assert.ok(s._enemyClock<1.9);assert.ok(s.timing.tu<100);
  const rest=encounter();rest._phase='intermission';rest._rest=dt+gap;rest.enemies=[];advance(rest,dt);
  assert.equal(rest._phase,'intermission');assert.ok(rest._rest>1e-9);
});

test('zero, negative, nonnumeric and nonfinite deltas remain inert; genuine tiny positive time is not discarded',()=>{
  const s=encounter(),before=clone(s);
  for(const seconds of [0,-1,NaN,Infinity,-Infinity,undefined,null,'1'])advance(s,seconds);
  assert.deepEqual(s,before);
  for(let n=0;n<100;n++)advance(s,1e-12);
  assert.ok(s.battle.elapsed>0);assert.ok(Math.abs(s.battle.elapsed-1e-10)<1e-22);
  assert.ok(s.timing.tu>0);assert.equal(s.timing.ticks,0);assert.equal(s.battle.actions.attacks,0);
  const capped=encounter(),huge=clone(capped);advance(capped,2);advance(huge,1e9);assert.deepEqual(huge,capped);
});

test('twenty thousand slightly short periods preserve aggregate player time debt instead of manufacturing an action',()=>{
  const s=encounter(),period=1.05-1e-10;
  advance(s,period);assert.equal(s.battle.actions.attacks,1);assert.ok(s._clock<0);
  for(let n=1;n<20000;n++)advance(s,period);
  assert.equal(s.battle.actions.attacks,19999,'independent total is 21000s minus 2 microseconds');
  assert.equal(s.timing.ticks,19999);assert.ok(s._clock>1.04999&&s._clock<1.05-1e-9);
});

test('compensated session-global TU reaches ten thousand ticks after 10500s without increasing the equality tolerance',()=>{
  const s=encounter();s._clock=-1e9;s._enemyClock=-1e9;
  for(let n=0;n<210000;n++)advance(s,.05);
  assert.equal(s.timing.tu,1e6);assert.equal(s.timing.ticks,10000);
  assert.equal(s.battle.actions.attacks,0);assert.equal(s.events.length,0);
  assert.ok(Number.isFinite(s._tuCompensation));
});

test('malformed or oversized TU compensation is ignored and even bounded injected carry cannot rewind time',()=>{
  const baseline=encounter();advance(baseline,.1);
  for(const compensation of [NaN,Infinity,-Infinity,1e99,-1e99,'1',{},null]) {
    const s=encounter();s._tuCompensation=compensation;advance(s,.1);assert.deepEqual(s,baseline);
  }
  const s=encounter();s.timing.tu=100;s.timing.ticks=1;s._tuCompensation=Number.EPSILON*100;
  advance(s,1e-18);assert.equal(s.timing.tu,100);assert.equal(s.timing.ticks,1);assert.ok(Number.isFinite(s._tuCompensation));
  const invalid=encounter();invalid.timing.tu=-1e-10;invalid.enemies[0].stun={expiresAtTick:1};
  advance(invalid,1e-15);assert.equal(invalid.timing.ticks,-1,'negative clock is not snapped into a valid zero tick');
  assert.equal(invalid.enemies[0].stunRecoveryPending,undefined);assert.equal(invalid.events.length,0);
});

test('TU carry follows existing global clock lifetime and is discarded, not imported, on validated load',()=>{
  const s=encounter();advance(s,.1);const tu=s.timing.tu,carry=s._tuCompensation;
  act(s,'retreat');assert.equal(s.timing.tu,tu);assert.equal(s._tuCompensation,carry);
  act(s,'start');assert.equal(s.timing.tu,tu);assert.equal(s._tuCompensation,carry);
  const loaded=validateSave({...clone(s),_tuCompensation:1e90});
  assert.equal(loaded.mode,'town');assert.equal(loaded.timing.tu,0);assert.equal(loaded.timing.ticks,0);
  assert.equal(Object.hasOwn(loaded,'_tuCompensation'),false);assert.deepEqual(loaded.enemies,[]);
});

test('at exact equality: old bleed and expiry precede recovery, player action, then unaffected ordinary enemy action',()=>{
  const s=encounter(),e=s.enemies[0];
  e.bleeding={stacks:1,expiresAtTick:1,damagePerTick:3};e.stun={expiresAtTick:1};e.penetratedArmor={stacks:1,expiresAtTick:1};
  s.enemies.push({...e,id:'awake-neighbor',bleeding:undefined,stun:undefined,penetratedArmor:undefined});s._enemyClock=.85;
  runFor(s,1.05,[.05]);
  assert.equal(s.timing.ticks,1);assert.equal(e.penetratedArmor,undefined);assert.equal(e.bleeding,undefined);
  assert.deepEqual(s.events.map(event=>event.type==='bleed'?'bleed':event.type==='recovery'?'recovery':event.target),
    ['bleed','recovery','hero','clock-target','hero']);
  assert.equal(s.battle.actions.attacks,1);assert.equal(e.stunRecoveryTurn,1);
  assert.equal(s.events.filter(event=>event.type==='recovery').length,1,'no duplicated recovery/regular attack for recovered enemy');
});

test('terminal equality bleed still prevents recovery, player and ordinary enemy actions on that boundary',()=>{
  const s=encounter(),e=s.enemies[0];e.hp=1;e.bleeding={stacks:1,expiresAtTick:1,damagePerTick:3};e.stun={expiresAtTick:1};s._enemyClock=.85;
  runFor(s,1.05,[.05]);assert.equal(s.wins,1);assert.equal(s.kills,1);assert.equal(s._phase,'intermission');
  assert.equal(s.events[0].type,'bleed');assert.equal(s.battle.actions.attacks,0);
  assert.equal(s.events.some(event=>event.type==='recovery'||event.target==='hero'),false);
  assert.equal(e.stunRecoveryPending,undefined);assert.equal(e.bleeding,undefined);
});

test('repeated near-period enemy decisions also retain aggregate signed debt',()=>{
  const s=encounter();s._clock=-1e9;let incoming=0;
  for(let n=0;n<20000;n++) {
    const before=s._eventId;advance(s,1.9-1e-10);
    incoming+=s.events.filter(e=>e.id>before&&e.target==='hero').length;
    if(n===0)assert.ok(s._enemyClock<0);
  }
  assert.equal(incoming,19999);assert.ok(s._enemyClock>1.89999&&s._enemyClock<1.9-1e-9);
});

test('fatal earned recovery at exact equality interrupts healing, player attack and remaining enemies',()=>{
  const s=encounter(),e=s.enemies[0];e.attack=1e9;e.stun={expiresAtTick:1};s.hero.hp=1;
  s.enemies.push({...e,id:'later-recovery',stun:{expiresAtTick:1}});s._enemyClock=.85;
  runFor(s,1.05,[.05]);assert.equal(s.mode,'defeat');assert.equal(s.hero.hp,0);
  assert.equal(s.battle.actions.attacks,0);assert.equal(s.battle.actions.heals,0);assert.equal(s.kills,0);assert.equal(s.wins,0);
  assert.equal(s.events.filter(event=>event.type==='recovery').length,1);assert.equal(s.events.filter(event=>event.target==='hero').length,1);
  assert.equal(s.events[0].type,'recovery');assert.ok(s.enemies.every(enemy=>!enemy.stun&&!enemy.stunRecoveryPending));
  const dead=clone(s);advance(s,2);assert.deepEqual(s,dead);
});

test('nonfinite internal due clocks do not become newly valid actions through the tolerant comparator',()=>{
  for(const value of [NaN,Infinity,-Infinity]) {
    const s=encounter(),seed=s.seed;s._clock=value;s._enemyClock=value;
    advance(s,.1);assert.equal(s.battle.actions.attacks,0);assert.equal(s.events.length,0);assert.equal(s.seed,seed);
  }
});

test('correction preserves coarse substep priority rather than promising arbitrary partition invariance',()=>{
  const together=encounter();together._clock=1.01;together._enemyClock=1.88;const split=clone(together);
  advance(together,.05);advance(split,.025);advance(split,.025);
  assert.deepEqual(together.events.map(event=>event.target),['clock-target','hero'],'one substep retains player-before-enemy priority');
  assert.deepEqual(split.events.map(event=>event.target),['hero','clock-target'],'two substeps still observe earlier enemy deadline first');
  assert.equal(together.battle.actions.attacks,1);assert.equal(split.battle.actions.attacks,1);
});
