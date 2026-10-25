import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createGame,act,advance,stats,validateSave,resolveAttack} from '../src/engine.js';
import {createPump} from '../src/session.js';
import {generateItem} from '../src/loot.js';
import * as historical from './fixtures/v0.8/engine.js';

const clone=value=>structuredClone(value);
const sha=value=>createHash('sha256').update(value).digest('hex');
const near=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} is not within ${tolerance} of ${b}`);
const target=extra=>({id:'independent-clock-target',name:'Independent clock target',hp:1e12,maxHp:1e12,attack:0,defense:0,evade:0,parry:0,block:0,...extra});
function fight(enemies=[target()],engine={createGame,act}) {
  const s=engine.createGame(42);s.equipment.weapon.weaponFamily=null;engine.act(s,'start');s.enemies=enemies;return s;
}
function repeat(s,count,seconds,step=advance){for(let n=0;n<count;n++)step(s,seconds);return s;}
const enemyActions=s=>s._eventId-s.battle.actions.attacks;
const directEvents=s=>s.events.filter(e=>['hit','crit','miss','block'].includes(e.type));

test('v0.8.1 independent: every engine byte outside advance and all loot/session bytes retain verified v0.8 provenance',()=>{
  const source=readFileSync(new URL('../src/engine.js',import.meta.url),'utf8');
  assert.equal(sha(source.slice(0,source.indexOf('export function advance(s, seconds) {'))),'d0e87b4314fc11520cb0d9d22377194909a0f6ba5e0ade27a6817ca149f69d96');
  assert.equal(sha(source.slice(source.indexOf('function refillPending(s)'))),'d56ef0bc3c189055643c6b817ca36f822116afb085333904df06cbdea87c27ca');
  assert.equal(sha(readFileSync(new URL('../src/loot.js',import.meta.url))),'458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc');
  assert.equal(sha(readFileSync(new URL('../src/session.js',import.meta.url))),'821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a');
  assert.equal(sha(readFileSync(new URL('./fixtures/v0.8/engine.js',import.meta.url))),'a9e3b4b8d8ec5ac6ecc8dcdbc72e3586e24e9ca7cce32b6ebb4de3e7346fe8b1');
  assert.equal(sha(readFileSync(new URL('./fixtures/v0.8/loot.js',import.meta.url))),'458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc');
});

test('v0.8.1 independent: frozen v0.8 actually reproduces all three reported boundary defects',()=>{
  const action=fight(undefined,historical);repeat(action,84,.25,historical.advance);
  assert.equal(action.battle.actions.attacks,19);assert.equal(action.timing.ticks,20);assert.equal(action._clock,1.0499999999999998);
  const tick=fight(undefined,historical);repeat(tick,21,.05,historical.advance);
  assert.equal(tick.battle.actions.attacks,1);assert.equal(tick.timing.ticks,0);assert.equal(tick.timing.tu,99.99999999999997);
  const rest=fight(undefined,historical);rest._phase='intermission';rest._rest=3;rest.enemies=[];repeat(rest,60,.05,historical.advance);
  assert.equal(rest._phase,'intermission');assert.equal(rest._rest,2.2898349882893854e-15);
});

test('v0.8.1 independent: real createPump 250ms cadence pays the twentieth action at21s without duplicate same-instant credit',()=>{
  let now=0;const s=fight(),pump=createPump({now:()=>now,active:()=>true,step:dt=>advance(s,dt)});
  for(let n=0;n<84;n++){now+=250;assert.equal(pump.tick(),.25);const before=clone(s);assert.equal(pump.tick(),0);assert.deepEqual(s,before);}
  assert.equal(s.battle.actions.attacks,20);assert.equal(s.timing.turns,20);assert.equal(s.timing.ticks,20);assert.equal(enemyActions(s),11);
  near(s._clock,0);near(s.timing.tu,2000);
});

for(const [count,dt,seconds,turns,ticks,enemies] of [[21,.05,1.05,1,1,0],[42,.05,2.1,2,2,1],[210,.1,21,20,20,11],[84,.25,21,20,20,11],[20,1.05,21,20,20,11],[38,.05,1.9,1,1,1]]){
  test(`v0.8.1 independent: isolated exact ${count} × ${dt}s boundary pays expected actions and TU`,()=>{
    const s=fight();repeat(s,count,dt);assert.equal(s.battle.actions.attacks,turns);assert.equal(s.timing.ticks,ticks);assert.equal(enemyActions(s),enemies);
    near(s.battle.elapsed,seconds);near(s.timing.tu,seconds*100/1.05);
  });
}

test('v0.8.1 independent: one microsecond below player/TU/enemy/rest boundaries is never due',()=>{
  const player=fight();advance(player,1.05-1e-6);assert.equal(player.battle.actions.attacks,0);assert.equal(player.timing.ticks,0);
  advance(player,1e-6);assert.equal(player.battle.actions.attacks,1);assert.equal(player.timing.ticks,1);
  const enemy=fight();advance(enemy,1.9-1e-6);assert.equal(enemyActions(enemy),0);advance(enemy,1e-6);assert.equal(enemyActions(enemy),1);
  const rest=fight();rest._phase='intermission';rest._rest=3;rest.enemies=[];advance(rest,2);advance(rest,1-1e-6);
  assert.equal(rest._phase,'intermission');assert.ok(rest._rest>1e-9);advance(rest,1e-6);assert.equal(rest._phase,'fight');
  assert.equal(rest.battle.actions.attacks,0);assert.equal(rest.timing.ticks,0);
});

test('v0.8.1 independent: invalid and zero inputs never settle even already-due clocks; positive tiny budgets are not discarded',()=>{
  for(const value of [0,-0,-1,-Number.MIN_VALUE,NaN,Infinity,-Infinity,undefined,null,'1',{},[]]){
    const s=fight();s._clock=1.05;s._enemyClock=1.9;s.timing.tu=100;const before=clone(s);assert.equal(advance(s,value),s);assert.deepEqual(s,before);
  }
  for(const value of [Number.MIN_VALUE,1e-15,1e-12]){
    const s=fight();advance(s,value);assert.equal(s.battle.elapsed,value);assert.ok(s.timing.tu>0);assert.equal(s.battle.actions.attacks,0);assert.equal(s.timing.ticks,0);assert.equal(s._eventId,0);
  }
  const s=fight();repeat(s,10000,1e-12);near(s.battle.elapsed,1e-8,1e-20);near(s._clock,1e-8,1e-20);assert.equal(s._eventId,0);
});

test('v0.8.1 independent: repeated near-period deficits accumulate instead of donating tolerance on every action',()=>{
  const player=fight();repeat(player,20000,1.05-1e-10);
  assert.equal(player.battle.actions.attacks,19999);assert.equal(player.timing.ticks,19999);
  near(player._clock+player.battle.actions.attacks*1.05,20000*(1.05-1e-10));
  const enemy=fight();repeat(enemy,20000,1.9-1e-10);assert.equal(enemyActions(enemy),19999);
  near(enemy._enemyClock+enemyActions(enemy)*1.9,20000*(1.9-1e-10));
});

test('v0.8.1 independent: signed subnanosecond player/enemy debt survives the first early comparison',()=>{
  const s=fight();s._clock=1.05-5e-10;s._enemyClock=1.9-5e-10;advance(s,1e-12);
  assert.equal(s.battle.actions.attacks,1);assert.equal(enemyActions(s),1);assert.ok(s._clock<0);assert.ok(s._enemyClock<0);
  near(s._clock,-4.99e-10,1e-15);near(s._enemyClock,-4.99e-10,1e-15);
  const counts={hero:s.battle.actions.attacks,enemy:enemyActions(s)};repeat(s,100,1e-12);
  assert.deepEqual({hero:s.battle.actions.attacks,enemy:enemyActions(s)},counts);
});

test('v0.8.1 independent: compensated TU reaches10000 exact ticks over10500 simulated seconds',()=>{
  const s=fight();repeat(s,210000,.05);
  assert.equal(s.timing.ticks,10000);assert.equal(s.battle.actions.attacks,10000);near(s.timing.tu,1e6,1e-7);
  assert.equal(enemyActions(s),Math.floor(10500/1.9));assert.equal(s.kills,0);assert.equal(s.wins,0);
});

test('v0.8.1 independent:840000 quarter-second calls retain exact200000 boundaries over58h20m simulated time',()=>{
  const s=fight();repeat(s,840000,.25);
  assert.equal(s.battle.actions.attacks,200000);assert.equal(s.timing.ticks,200000);assert.equal(s.timing.tu,2e7);
  assert.equal(enemyActions(s),110526);near(s._clock,0,1e-9);near(s._enemyClock,.6,1e-9);
  assert.equal(s.kills,0);assert.equal(s.wins,0);
});

test('v0.8.1 independent: exact rest completion freezes combat time and starts a fresh action clock',()=>{
  for(const [count,dt] of [[60,.05],[30,.1],[12,.25]]){
    const s=fight();s._phase='intermission';s._rest=3;s.enemies=[];s.timing={turns:20,ticks:20,tu:2000};s._clock=.7;s._enemyClock=.3;
    repeat(s,count,dt);assert.equal(s._phase,'fight');assert.equal(s._rest,0);assert.equal(s.battle.elapsed,0);assert.equal(s._clock,0);assert.equal(s._enemyClock,0);
    assert.deepEqual(s.timing,{turns:20,ticks:20,tu:2000});assert.equal(s.battle.actions.attacks,0);
  }
});

test('v0.8.1 independent: engine cap, pump5s gap boundary, inactivity and reset still forbid offline credit',()=>{
  const cap=fight(),two=clone(cap);advance(cap,1e9);advance(two,2);assert.deepEqual(cap,two);
  let now=0,active=true;const s=fight(),pump=createPump({now:()=>now,active:()=>active,step:dt=>advance(s,dt)});
  now=5000;assert.equal(pump.tick(),2);near(s.battle.elapsed,2);const before=clone(s);
  now=10000.001;assert.equal(pump.tick(),0);assert.deepEqual(s,before);
  active=false;now+=1000;assert.equal(pump.tick(),0);assert.deepEqual(s,before);
  active=true;now+=250;assert.equal(pump.tick(),.25);near(s.battle.elapsed,2.25);
  now+=1e9;pump.reset();const reset=clone(s);assert.equal(pump.tick(),0);assert.deepEqual(s,reset);
});

test('v0.8.1 independent: seventh bleed pulse and PA/stun expiry precede recovery then player; regular enemy attack is coalesced',()=>{
  const e=target({mitigation:.8,penetratedArmor:{stacks:3,expiresAtTick:7},stun:{expiresAtTick:7},bleeding:{stacks:1,expiresAtTick:7,damagePerTick:8}});
  const s=fight([e]);s.timing.ticks=6;s.timing.tu=600;s._enemyClock=.85;repeat(s,21,.05);
  assert.equal(s.timing.ticks,7);assert.equal(e.penetratedArmor,undefined);assert.equal(e.stun,undefined);assert.equal(e.bleeding,undefined);assert.equal(e.stunRecoveryPending,undefined);
  assert.equal(s.events[0].type,'bleed');assert.equal(s.events[0].value,8);assert.equal(s.events[1].type,'recovery');
  assert.equal(directEvents(s).length,2);assert.equal(directEvents(s)[0].target,'hero');assert.equal(directEvents(s)[1].target,e.id);
  assert.equal(s.battle.actions.attacks,1);assert.equal(s.events.filter(event=>event.target==='hero').length,1);
  let seed=42;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  const sheet=stats(createGame(42));resolveAttack({attack:0,crit:.2,critBonus:.2},{...sheet,parry:.035},rng);
  const expected=resolveAttack({attack:sheet.attack,crit:sheet.crit,skill:false},{...e,mitigation:.8},rng);
  assert.equal(directEvents(s)[1].value,expected.damage,'expired PA cannot still reduce mitigation');assert.equal(s.seed,seed);
});

test('v0.8.1 independent: lethal final pulse transitions old wave once without recovery or replacement-wave actions',()=>{
  const old=[target({id:'old-a',hp:1}),target({id:'old-b',hp:1})];
  for(const e of old){e.bleeding={stacks:1,expiresAtTick:7,damagePerTick:1};e.stunRecoveryPending=true;}
  const s=fight(old);s.wave=2;s.timing.ticks=6;s.timing.tu=600;s._enemyClock=.85;repeat(s,21,.05);
  assert.equal(s.wave,3);assert.equal(s.kills,2);assert.equal(s.hero.gold,12);assert.equal(s.battle.actions.attacks,0);
  assert.equal(s.events.filter(e=>e.type==='bleed').length,2);assert.equal(s.events.some(e=>e.type==='recovery'||e.target==='hero'),false);
  assert.ok(s.enemies.every(e=>e.hp===e.maxHp&&!e.bleeding));assert.equal(s._enemyClock,0);
  const before=clone(s);advance(s,0);assert.deepEqual(s,before);
});

test('v0.8.1 independent: exact final boss pulse pays canonical drop RNG once and suppresses all queued combat',()=>{
  const e=target({hp:1,boss:true,stunRecoveryPending:true,bleeding:{stacks:1,expiresAtTick:7,damagePerTick:1}});
  const s=fight([e]);s.wave=4;s.timing.ticks=6;s.timing.tu=600;s._enemyClock=.85;
  let seed=s.seed;const drop=generateItem(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;},3,'weapon');
  repeat(s,21,.05);assert.equal(s.wins,1);assert.equal(s.kills,1);assert.equal(s.hero.gold,46);assert.equal(s._phase,'intermission');assert.equal(s.seed,seed);
  assert.deepEqual(s.inventory,[{...drop,id:'loot-1'}]);assert.equal(s.battle.actions.attacks,0);assert.equal(s.events.filter(e=>e.type==='win').length,1);
  assert.equal(s.events.some(e=>e.type==='recovery'||e.target==='hero'),false);
  const rewards={gold:s.hero.gold,kills:s.kills,wins:s.wins,seed:s.seed};advance(s,1);assert.deepEqual({gold:s.hero.gold,kills:s.kills,wins:s.wins,seed:s.seed},rewards);
});

test('v0.8.1 independent: fatal recovery still interrupts the due player heal and attack at an exact tick boundary',()=>{
  const e=target({attack:1e9,stun:{expiresAtTick:7}}),s=fight([e]);s.hero.hp=1;s.timing.ticks=6;s.timing.tu=600;s._enemyClock=.85;
  repeat(s,21,.05);assert.equal(s.mode,'defeat');assert.equal(s.hero.hp,0);assert.equal(s.battle.actions.attacks,0);assert.equal(s.battle.actions.heals,0);
  assert.equal(s.events.filter(e=>e.type==='recovery').length,1);assert.equal(s.events.filter(e=>e.target==='hero').length,1);
  assert.equal(e.stun,undefined);assert.equal(e.stunRecoveryPending,undefined);const before=clone(s);advance(s,2);assert.deepEqual(s,before);
});

test('v0.8.1 independent: compensation is transient, load resets clocks without changing inventory/economy or the v3 schema',()=>{
  const s=fight();repeat(s,11,.1);assert.ok(Object.hasOwn(s,'_tuCompensation'));assert.ok(Number.isFinite(s._tuCompensation));
  const originalKeys=Object.keys(validateSave(createGame())).sort(),before={inventory:clone(s.inventory),equipment:clone(s.equipment),gold:s.hero.gold};
  for(const value of [s._tuCompensation,NaN,Infinity,-Infinity,1e99,-1e99,'1',{},[]]){
    const raw=clone(s);raw._tuCompensation=value;const restored=validateSave(raw);
    assert.deepEqual(historical.validateSave(raw),restored,'the actual frozen v0.8 validator gives the same safe-town durable state');
    assert.equal(restored._tuCompensation,undefined);assert.deepEqual(Object.keys(restored).sort(),originalKeys);assert.equal(restored.mode,'town');
    assert.deepEqual(restored.timing,{turns:0,ticks:0,tu:0});assert.deepEqual(restored.inventory,before.inventory);assert.equal(restored.hero.gold,before.gold);
  }
  const compensation=s._tuCompensation;act(s,'retreat');assert.equal(s._tuCompensation,compensation);act(s,'start');assert.equal(s._tuCompensation,compensation);
  assert.deepEqual(s.equipment,before.equipment);
});
