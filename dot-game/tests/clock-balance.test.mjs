import test from 'node:test';
import assert from 'node:assert/strict';
import * as baseline from './fixtures/v0.8/engine.js';
// Historical pre-parry clock cohort: later loot fields intentionally change reward RNG.
// Current numerical-boundary tests remain in v081-acceptance and clock-focused suites.
import * as candidate from './fixtures/v0.14/engine.js';
import {scoreItem, resolveWeaponFamily} from '../src/loot.js';
import {createPump} from '../src/session.js';

const clone = value => JSON.parse(JSON.stringify(value));
const count = process.env.CLOCK_SEEDS === undefined ? 5 : Number(process.env.CLOCK_SEEDS);
assert.ok(Number.isInteger(count) && count >= 1 && count <= 100, 'CLOCK_SEEDS must be 1..100');
const SEEDS = process.env.CLOCK_SEEDS === undefined ? [1,7,42,73,100] : Array.from({length:count},(_,i)=>i+1);
const DRIVERS = ['advance100ms','createPump250ms'];
const FAMILIES = ['axe','rapier','club'];
const round = value => Number(value.toFixed(6));
const median = values => {
  if (!values.length) return null;
  const sorted=[...values].sort((a,b)=>a-b), middle=Math.floor(sorted.length/2);
  return round(sorted.length%2 ? sorted[middle] : (sorted[middle-1]+sorted[middle])/2);
};
const distribution = values => values.length ? {min:round(Math.min(...values)),median:median(values),max:round(Math.max(...values))} : null;
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const statusKeys = ['bleeding','penetratedArmor','stun'];
const observationStarts = new Map();

function driverFor(api,s,driver) {
  if(driver==='advance100ms')return {seconds:.1,tick:()=>api.advance(s,.1)};
  let now=0;
  const pump=createPump({now:()=>now,active:()=>s.mode==='battle',step:seconds=>api.advance(s,seconds)});
  return {seconds:.25,tick:()=>{now+=250;assert.equal(pump.tick(),.25);}};
}

// Observe production writes, never consume randomness or rewrite their values.
// Non-enumerable push instrumentation and transparent enemy proxies are removed
// before return, then equality-tested against wholly uninstrumented simulation.
function expedition(api,s,driver,{observed=true}={}) {
  const initialWins=s.wins;
  api.act(s,'start');
  if(s.mode!=='battle')return {win:false,refused:true,timeout:false,seconds:0};
  const initialLoot=clone(s.inventory), hero=s.hero, restore=[];
  const data={incomingAttempts:0,incomingDamage:0,rngCalls:0,procs:0,bleedTicks:0,bleedDamage:0,recoveries:0,
    restoredPlayerPayments:0,restoredEnemyPayments:0,expiryTrace:[],expiries:{bleeding:0,penetratedArmor:0,stun:0}};
  let minimumHp=hero.hp,minimumMp=hero.mp,beforeWin=null,firstRestored=null,firstExpiry=null;
  function watch(object,key,onWrite) {
    let value=object[key];
    Object.defineProperty(object,key,{enumerable:true,configurable:true,get:()=>value,
      set:next=>{onWrite(next,value);value=next;}});
    restore.push(()=>Object.defineProperty(object,key,{value,enumerable:true,configurable:true,writable:true}));
  }
  let originalPush;
  if(observed) {
    watch(s,'wins',(value,old)=>{if(value>old)beforeWin={hp:hero.hp,mp:hero.mp};});
    watch(hero,'hp',value=>{if(s.wins===initialWins)minimumHp=Math.min(minimumHp,value);});
    watch(hero,'mp',value=>{if(s.wins===initialWins)minimumMp=Math.min(minimumMp,value);});
    watch(s,'seed',()=>data.rngCalls++);
    for(const [key,metric] of [['_clock','restoredPlayerPayments'],['_enemyClock','restoredEnemyPayments']]) {
      watch(s,key,(next,old)=>{
        if(old-next>1&&next<0&&next>=-1e-9) {
          data[metric]++;
          firstRestored??={clock:key,seconds:round(s.battle.elapsed),tick:s.timing.ticks,before:old,after:next};
        }
      });
    }
    originalPush=s.events.push;
    Object.defineProperty(s.events,'push',{configurable:true,value:function(...events){
      for(const event of events) {
        if(event.target==='hero'&&['hit','miss','block'].includes(event.type)) {data.incomingAttempts++;data.incomingDamage+=event.value||0;}
        if(event.type==='proc')data.procs++;
        if(event.type==='bleed') {data.bleedTicks++;data.bleedDamage+=event.value;}
        if(event.type==='recovery')data.recoveries++;
      }
      return originalPush.apply(this,events);
    }});
    const originals=new WeakMap();
    const wrap=list=>list.map(enemy=>{
      const proxy=new Proxy(enemy,{deleteProperty(target,key){
        const status=target[key];
        if(statusKeys.includes(key)&&status&&target.hp>0&&s.timing.ticks>=status.expiresAtTick) {
          data.expiries[key]++;
          data.expiryTrace.push({status:key,seconds:round(s.battle.elapsed),tick:s.timing.ticks,expiresAtTick:status.expiresAtTick,enemy:target.id});
          firstExpiry??={status:key,seconds:round(s.battle.elapsed),tick:s.timing.ticks,expiresAtTick:status.expiresAtTick,enemy:target.id};
        }
        return Reflect.deleteProperty(target,key);
      }});
      originals.set(proxy,enemy);return proxy;
    });
    let enemies=wrap(s.enemies);
    Object.defineProperty(s,'enemies',{enumerable:true,configurable:true,get:()=>enemies,set:list=>{enemies=wrap(list);}});
    restore.push(()=>Object.defineProperty(s,'enemies',{value:enemies.map(enemy=>originals.get(enemy)||enemy),enumerable:true,configurable:true,writable:true}));
  }
  const clock=driverFor(api,s,driver);
  for(let step=0;step<Math.round(600/clock.seconds)&&s.mode==='battle'&&s.wins===initialWins;step++)clock.tick();
  if(observed) {delete s.events.push;for(const fn of restore)fn();}
  const timeout=s.wins===initialWins&&s.mode==='battle';
  return {win:s.wins===initialWins+1,refused:false,timeout,seconds:round(s.battle.elapsed),
    minimumHp:round(minimumHp),minimumMp:round(minimumMp),hpBeforeWin:beforeWin?round(beforeWin.hp):null,
    actions:clone(s.battle.actions),finalSeed:s.seed,loot:clone(s.inventory.slice(initialLoot.length)),pendingLoot:clone(s.pendingLoot),
    ...data,firstRestored,firstExpiry};
}

function equipEarned(api,s,slots=['weapon','armor','accessory']) {
  assert.equal(s.mode,'town');
  for(const slot of slots) {
    const best=[s.equipment[slot],...s.inventory.filter(item=>item.slot===slot)]
      .reduce((best,item)=>scoreItem(item)>scoreItem(best)?item:best);
    if(best.id!==s.equipment[slot].id)api.act(s,'equip',best.id);
  }
}
function checkPolicy(s) {
  assert.equal(s.strategy,'balanced');assert.equal(s.autoAdvance,false);assert.notEqual(s.autoSell,true);
  assert.equal(s.pendingLoot.length,0);
}
function paired(start,driver,seed) {
  const untouched=clone(start),beforeState=clone(start),afterState=clone(start);
  assert.deepEqual(baseline.stats(beforeState),candidate.stats(afterState));
  const before=expedition(baseline,beforeState,driver),after=expedition(candidate,afterState,driver);
  assert.deepEqual(start,untouched);
  return {seed,driver,stage:start.stage,initialSeed:start.seed,level:start.hero.level,clears:start.wins,
    weapon:clone(start.equipment.weapon),before,after,state:beforeState};
}

// Protocol fixed in CLOCK-BALANCE.md before measurement; the v0.8 path supplies
// all earned checkpoints, so candidate outcomes cannot cherry-pick the cohort.
function earnedRoute(seed,driver,family) {
  let s=baseline.createGame(seed),purchase=null;
  const farm=[],pairs=[];
  for(let clear=1;clear<=20;clear++) {
    checkPolicy(s);assert.equal(s.stage,1);
    const result=expedition(baseline,s,driver);farm.push(result);
    if(!result.win)break;
    baseline.act(s,'retreat');equipEarned(baseline,s);
    const untouched=clone(s),offer=baseline.previewWeaponCommission(s,family);
    assert.deepEqual(s,untouched);
    if(!offer.available)continue;
    baseline.act(s,'commissionWeapon',{family,quoteBasis:offer.quoteBasis});
    assert.equal(s.hero.gold,untouched.hero.gold-offer.price);assert.equal(s.seed,untouched.seed);
    assert.deepEqual(s.inventory.at(-1),offer.item);
    baseline.act(s,'equip',offer.item.id);
    purchase={clears:s.wins,level:s.hero.level,price:offer.price,goldBefore:untouched.hero.gold,goldAfter:s.hero.gold,weapon:clone(offer.item)};
    break;
  }
  if(purchase)for(let stage=1;stage<=20;stage++) {
    checkPolicy(s);equipEarned(baseline,s,['armor','accessory']);baseline.act(s,'selectStage',stage);
    assert.equal(s.stage,stage,'stage must actually be naturally unlocked');
    assert.deepEqual(s.equipment.weapon,purchase.weapon,'never replace the paid family weapon');
    assert.equal(resolveWeaponFamily(s.equipment.weapon),family);
    if(seed===SEEDS[0]&&stage===10)observationStarts.set(`${driver}:${family}`,clone(s));
    const pair=paired(s,driver,seed);s=pair.state;delete pair.state;pairs.push(pair);
    if(!pair.before.win)break;
    baseline.act(s,'retreat');
  }
  return {seed,driver,family,purchase,farm,pairs};
}
function summary(results) {
  const wins=results.filter(result=>result.win);
  const sum=key=>results.reduce((n,result)=>n+(result[key]||0),0);
  return {n:results.length,wins:wins.length,losses:results.filter(r=>!r.win&&!r.refused&&!r.timeout).length,
    refused:results.filter(r=>r.refused).length,timeouts:results.filter(r=>r.timeout).length,
    winningSeconds:distribution(wins.map(r=>r.seconds)),minimumHp:distribution(results.map(r=>r.minimumHp).filter(Number.isFinite)),
    playerAttacks:results.reduce((n,r)=>n+(r.actions?.attacks||0),0),
    incomingAttempts:sum('incomingAttempts'),incomingDamage:sum('incomingDamage'),procs:sum('procs'),bleedTicks:sum('bleedTicks'),bleedDamage:sum('bleedDamage'),recoveries:sum('recoveries'),
    restoredPlayerPayments:sum('restoredPlayerPayments'),restoredEnemyPayments:sum('restoredEnemyPayments'),
    expiries:Object.fromEntries(statusKeys.map(key=>[key,results.reduce((n,r)=>n+(r.expiries?.[key]||0),0)]))};
}
function pairSummary(pairs) {
  const mutual=pairs.filter(p=>p.before.win&&p.after.win);
  const expiryDeltas=[];
  for(const pair of pairs)for(const before of pair.before.expiryTrace||[]) {
    const after=pair.after.expiryTrace?.find(item=>item.status===before.status&&item.enemy===before.enemy&&item.expiresAtTick===before.expiresAtTick);
    if(after)expiryDeltas.push(round(after.seconds-before.seconds));
  }
  return {n:pairs.length,mutualWins:mutual.length,baselineOnlyWins:pairs.filter(p=>p.before.win&&!p.after.win).length,
    candidateOnlyWins:pairs.filter(p=>!p.before.win&&p.after.win).length,bothLose:pairs.filter(p=>!p.before.win&&!p.after.win).length,
    faster:mutual.filter(p=>p.after.seconds<p.before.seconds).length,equal:mutual.filter(p=>p.after.seconds===p.before.seconds).length,
    slower:mutual.filter(p=>p.after.seconds>p.before.seconds).length,
    winningSecondsDelta:distribution(mutual.map(p=>p.after.seconds-p.before.seconds)),
    sharedExpiryEvents:expiryDeltas.length,earlierSharedExpiries:expiryDeltas.filter(delta=>delta<0).length,sharedExpirySecondsDelta:distribution(expiryDeltas),
    lowerMinimumHp:pairs.filter(p=>p.after.minimumHp<p.before.minimumHp).length,
    changedRng:pairs.filter(p=>p.before.finalSeed!==p.after.finalSeed).length,
    changedLoot:pairs.filter(p=>!same(p.before.loot,p.after.loot)||!same(p.before.pendingLoot,p.after.pendingLoot)).length,
    baseline:summary(pairs.map(p=>p.before)),candidate:summary(pairs.map(p=>p.after))};
}

const firstClears=DRIVERS.map(driver=>({driver,pairs:SEEDS.map(seed=>{
  const pair=paired(baseline.createGame(seed),driver,seed);delete pair.state;return pair;
})}));
const routes=DRIVERS.flatMap(driver=>FAMILIES.flatMap(family=>SEEDS.map(seed=>earnedRoute(seed,driver,family))));

test('historical pre-parry clock balance: observation leaves complete production state and RNG unchanged in both versions/drivers',()=>{
  for(const api of [baseline,candidate])for(const driver of DRIVERS) {
    for(const start of [baseline.createGame(SEEDS[0]),...FAMILIES.map(family=>observationStarts.get(`${driver}:${family}`)).filter(Boolean)]) {
      const observed=clone(start),ordinary=clone(start);
      expedition(api,observed,driver);expedition(api,ordinary,driver,{observed:false});
      assert.deepEqual(observed,ordinary,'status-bearing natural fights preserve every production field and RNG');
    }
  }
});

test('historical pre-parry clock balance: every declared starter first clear reports wins, loot, RNG and timing without outcome selection',t=>{
  for(const {driver,pairs} of firstClears) {
    assert.equal(pairs.length,SEEDS.length);
    assert.ok(pairs.every(p=>!p.before.timeout&&!p.after.timeout));
    for(const pair of pairs) {
      assert.equal(pair.before.win,true);assert.equal(pair.after.win,true);
      assert.equal(pair.after.finalSeed,pair.before.finalSeed,'starter first-clear RNG remains unchanged');
      assert.deepEqual(pair.after.loot,pair.before.loot,'complete starter first-clear loot remains unchanged');
      assert.deepEqual(pair.after.pendingLoot,pair.before.pendingLoot);
      assert.deepEqual(pair.after.actions,pair.before.actions);
      assert.ok(pair.after.seconds<=pair.before.seconds&&pair.before.seconds-pair.after.seconds<=.100000001,
        'starter timing changes by at most one 100ms internal observation step, never a slower clear');
    }
    t.diagnostic(JSON.stringify({kind:'clock-starter',driver,seeds:SEEDS,...pairSummary(pairs)}));
  }
});

test('historical pre-parry clock balance: naturally paid held families retain every outcome and baseline-path denominator',t=>{
  for(const driver of DRIVERS)for(const family of FAMILIES) {
    const selected=routes.filter(r=>r.driver===driver&&r.family===family),purchases=selected.map(r=>r.purchase).filter(Boolean);
    t.diagnostic(JSON.stringify({kind:'clock-affordability',driver,family,n:SEEDS.length,affordable:purchases.length,
      clears:distribution(purchases.map(p=>p.clears)),price:distribution(purchases.map(p=>p.price)),goldAfter:distribution(purchases.map(p=>p.goldAfter)),
      farmLosses:selected.filter(r=>r.farm.some(f=>!f.win)).length}));
    const firstLosses=arm=>selected.map(r=>r.pairs.find(p=>!p[arm].win)?.stage).filter(Number.isFinite);
    const histogram=values=>Object.fromEntries([...new Set(values)].sort((a,b)=>a-b).map(stage=>[stage,values.filter(value=>value===stage).length]));
    const afterCandidateFailure=selected.flatMap(r=>{
      const first=r.pairs.findIndex(p=>!p.after.win);
      return first<0?[]:r.pairs.slice(first+1);
    });
    t.diagnostic(JSON.stringify({kind:'clock-route-attrition',driver,family,n:SEEDS.length,
      firstBaselineFailureStage:histogram(firstLosses('before')),firstCandidateFailureStage:histogram(firstLosses('after')),
      baselineSurvivesThrough20:selected.filter(r=>r.pairs.at(-1)?.stage===20&&r.pairs.at(-1).before.win).length,
      baselineFailureCount:firstLosses('before').length,candidateFailureCount:firstLosses('after').length,
      conditionalPairsAfterCandidateFailure:afterCandidateFailure.length,
      candidateWinsInConditionalPairsAfterFailure:afterCandidateFailure.filter(p=>p.after.win).length}));
    for(let stage=1;stage<=20;stage++) {
      const pairs=selected.flatMap(r=>r.pairs.filter(p=>p.stage===stage));
      const expected=stage===1?purchases.length:selected.filter(r=>r.pairs.some(p=>p.stage===stage-1&&p.before.win)).length;
      assert.equal(pairs.length,expected,'every and only prior baseline win supplies its next natural checkpoint');
      assert.ok(pairs.every(p=>!p.before.timeout&&!p.after.timeout),'timeout is reported, never silently excluded');
      t.diagnostic(JSON.stringify({kind:'clock-held-family',driver,family,stage,...pairSummary(pairs)}));
    }
    const pairs=selected.flatMap(r=>r.pairs.filter(p=>p.stage>=3));
    t.diagnostic(JSON.stringify({kind:'clock-stage3to10',driver,family,...pairSummary(pairs.filter(p=>p.stage<=10))}));
    t.diagnostic(JSON.stringify({kind:'clock-stage11to20',driver,family,...pairSummary(pairs.filter(p=>p.stage>=11))}));
    for(const [outcome,predicate] of [
      ['slower',p=>p.before.win&&p.after.win&&p.after.seconds>p.before.seconds],
      ['baseline-only-win',p=>p.before.win&&!p.after.win],
      ['candidate-only-win',p=>!p.before.win&&p.after.win],
      ['restored-boundary',p=>p.after.restoredPlayerPayments+p.after.restoredEnemyPayments>0],
    ]) {
      const witness=pairs.find(predicate);
      if(witness)t.diagnostic(JSON.stringify({kind:'clock-witness',outcome,driver,family,...witness}));
    }
  }
});

test('historical pre-parry clock balance: fixed policy and metrics replay deterministically',()=>{
  assert.deepEqual(earnedRoute(SEEDS[0],DRIVERS[0],FAMILIES[0]),routes[0]);
});
