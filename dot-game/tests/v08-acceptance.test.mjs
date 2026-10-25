import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  createGame, act, advance, stats, validateSave, resolveAttack, resolveWeaponAttack,
  bleedStatus, AXE_BLEED_RULES,
} from '../src/engine.js';
import {generateItem, scoreItem} from '../src/loot.js';

const clone=value=>structuredClone(value);
const sha=value=>createHash('sha256').update(value).digest('hex');
const axe={slot:'weapon',weaponFamily:'axe'};
const plain={slot:'weapon',weaponFamily:null};
const target=extra=>({id:'qa-bleed-target',name:'Independent QA target',hp:1e6,maxHp:1e6,attack:0,defense:0,evade:0,parry:0,block:0,...extra});
const basic={attack:101.75,crit:0};
function counted(values=[],fallback=.5){let n=0;return {rng:()=>values[n++]??fallback,get count(){return n;}};}
const noncrit=proc=>counted([.9,.9,.9,.9,.9,.9,.9,.5,proc]);
function strike(enemy,tick=10,attacker=basic,proc=0,weapon=axe){return resolveWeaponAttack(attacker,enemy,weapon,tick,noncrit(proc).rng);}
function freezeDeep(value){if(value&&typeof value==='object'){Object.values(value).forEach(freezeDeep);Object.freeze(value);}return value;}
function fight(enemies=[target()],wave=1){
  const s=createGame(42);s.equipment.weapon.weaponFamily=null;act(s,'start');s.enemies=enemies;s.wave=wave;
  s._clock=-1000;s._enemyClock=-1000;return s;
}
function toTick(s,tick,step=.05){
  for(let i=0;i<10000&&s.mode==='battle'&&s._phase==='fight'&&s.timing.ticks<tick;i++)advance(s,step);
  assert.equal(s.timing.ticks,tick,'fixture reaches exact processed global tick');return s;
}
const pulses=s=>s.events.filter(e=>e.effect==='bleed'&&e.type!=='proc');
const attach=(enemy,{stacks=1,expiresAtTick=7,damagePerTick=8}={})=>enemy.bleeding={stacks,expiresAtTick,damagePerTick};

test('v0.8 independent: fixed historical maxima, five-stack cap and floor snapshot are explicit frozen adaptations',()=>{
  assert.deepEqual(AXE_BLEED_RULES,{chance:.25,durationTicks:7,maxStacks:5,damageFractionPerStack:.08});
  assert.ok(Object.isFrozen(AXE_BLEED_RULES));
  const e=target();
  for(let n=1;n<=7;n++){
    const before=e.hp,result=strike(e,10+n-1),stacks=Math.min(5,n),damagePerTick=Math.floor(101.75*.08*stacks);
    assert.equal(e.hp,before,'wrapper snapshots post-hit eligibility but caller owns HP subtraction');
    assert.deepEqual(e.bleeding,{stacks,expiresAtTick:16+n,damagePerTick});
    assert.deepEqual(result.proc,{type:'bleeding',stacks,durationTicks:7,damagePerTick});
    assert.deepEqual(bleedStatus(e,9+n),{stacks,ticksRemaining:7,damagePerTick});
    assert.equal(result.damage,101,'bleed does not modify triggering direct hit');
  }
});

test('v0.8 independent: noncrit boundary spends one proc roll; failed refresh changes neither stacks nor snapshot',()=>{
  for(const value of [0,.249999999,.25,.999999]){
    const e=target(),r=noncrit(value),out=resolveWeaponAttack(basic,e,axe,10,r.rng);
    assert.equal(r.count,9);assert.equal(Boolean(out.proc),value<.25);
    assert.equal(Boolean(e.bleeding),value<.25);
  }
  const e=target();strike(e);const before=clone(e.bleeding);
  strike(e,12,{attack:999,crit:0},.25);assert.deepEqual(e.bleeding,before);
});

test('v0.8 independent: one critical through nine guarantees one stack without extra RNG or crit-scaled snapshot',()=>{
  for(const [multiCrit,expectedCrit] of [[0,1],[1,9]]){
    const a={...basic,crit:1,multiCrit},e=target(),r=counted([],0),b=counted([],0);
    const expected=resolveAttack(a,target(),b.rng),actual=resolveWeaponAttack(a,e,axe,10,r.rng);
    assert.equal(actual.crit,expectedCrit);assert.equal(r.count,b.count);
    assert.equal(actual.proc.stacks,1);assert.equal(actual.proc.damagePerTick,8);
    delete actual.proc;assert.deepEqual(actual,expected);
  }
});

test('v0.8 independent: snapshot ignores all 41 direct-hit dice, mitigation, specific mitigation and critical damage',()=>{
  for(let die=0;die<41;die++)for(const mitigation of [0,.5,.95])for(const specificMit of [0,.5,.95]){
    const e=target({mitigation,specificMit}),r=counted([.9,.9,.9,.9,.9,.9,0,.9,(die+.1)/41]);
    // High enough attack that the .95 × .95 corner remains a positive hit.
    const a={attack:1000.75,crit:1,multiCrit:0},out=resolveWeaponAttack(a,e,axe,10,r.rng);
    assert.ok(out.damage>0);assert.equal(out.crit,1);assert.equal(r.count,9);
    assert.equal(e.bleeding.damagePerTick,Math.floor(1000.75*.08));
  }
});

test('v0.8 independent: any positive partial evade/parry/block may proc; full avoidance cannot',()=>{
  for(const [gate,index] of [['evade',0],['parry',2],['block',4]]){
    const e=target({[gate]:.5}),draws=[.9,.9,.9,.9,.9,.9,.9,.5,0];draws[index]=.1;
    if(gate==='evade')draws.splice(6,1);
    const r=counted(draws),out=resolveWeaponAttack(basic,e,axe,10,r.rng);
    assert.equal(out.damage,50);assert.equal(out.proc.damagePerTick,8);assert.equal(out.crit,0);
    assert.equal(r.count,gate==='evade'?8:9);
  }
});

test('v0.8 independent: skills, magic, whiff, zero, dead/lethal and unresolved identities never proc or spend proc RNG',()=>{
  const cases=[
    [{...basic,skill:true,crit:1},target(),axe],[{...basic,magical:true,crit:1},target(),axe],
    [{...basic,whiff:1},target(),axe],[basic,target({evade:1}),axe],[basic,target({parry:1}),axe],[basic,target({block:1}),axe],
    [{...basic,attack:0},target(),axe],[{...basic,attack:1},target({mitigation:.95}),axe],
    [basic,target({hp:1}),axe],[basic,target({hp:0}),axe],[basic,target({hp:-1}),axe],
    [basic,target({hp:Infinity}),axe],[basic,target({hp:NaN}),axe],
    [basic,target(),plain],[basic,target(),{slot:'armor',weaponFamily:'axe'}],
    [basic,target(),{slot:'weapon',weaponFamily:'Axe'}],[basic,target(),createGame().equipment.weapon],
  ];
  for(const [a,e,w] of cases){
    const r=counted([],0),b=counted([],0),expected=resolveAttack(a,clone(e),b.rng),actual=resolveWeaponAttack(a,e,w,10,r.rng);
    assert.deepEqual(actual,expected);assert.equal(r.count,b.count);assert.equal(e.bleeding,undefined);
  }
});

test('v0.8 independent: positive small basic hits can create a zero-damage snapshot without a hidden minimum',()=>{
  const e=target(),out=strike(e,0,{attack:1,crit:0});assert.equal(out.damage,1);
  assert.deepEqual(out.proc,{type:'bleeding',stacks:1,durationTicks:7,damagePerTick:0});
  const s=fight([e]),seed=s.seed,hp=e.hp;toTick(s,7);
  assert.equal(e.hp,hp);assert.equal(s.seed,seed);assert.equal(e.bleeding,undefined);assert.equal(s.kills,0);
});

test('v0.8 independent: status view is detached, pure and bounded, including zero damage and last tick',()=>{
  const e=freezeDeep(target({bleeding:{stacks:5,expiresAtTick:17,damagePerTick:0}})),before=clone(e);
  const originalRandom=Math.random,originalNow=Date.now;
  try{
    Math.random=()=>{throw Error('status must not roll');};Date.now=()=>{throw Error('status must not read wall time');};
    const a=bleedStatus(e,10),b=bleedStatus(e,10);assert.notEqual(a,b);assert.deepEqual(a,{stacks:5,ticksRemaining:7,damagePerTick:0});
    a.stacks=999;a.damagePerTick=999;assert.deepEqual(bleedStatus(e,16),{stacks:5,ticksRemaining:1,damagePerTick:0});
    assert.equal(bleedStatus(e,17),null);assert.equal(bleedStatus(e,18),null);assert.deepEqual(e,before);
  }finally{Math.random=originalRandom;Date.now=originalNow;}
  for(const tick of [undefined,null,-1,NaN,Infinity,'10',10.1,Number.MAX_SAFE_INTEGER])assert.equal(bleedStatus(e,tick),null);
  for(const hp of [0,-1,NaN,Infinity])assert.equal(bleedStatus({...e,hp},10),null);
  for(const bleeding of [null,{},[],{stacks:0,expiresAtTick:17,damagePerTick:8},{stacks:6,expiresAtTick:17,damagePerTick:8},
    {stacks:1.5,expiresAtTick:17,damagePerTick:8},{stacks:1,expiresAtTick:18,damagePerTick:8},
    {stacks:1,expiresAtTick:10,damagePerTick:8},{stacks:1,expiresAtTick:Infinity,damagePerTick:8},
    ...[-1,1.5,NaN,Infinity,'8',null,Number.MAX_SAFE_INTEGER+1].map(damagePerTick=>({stacks:1,expiresAtTick:17,damagePerTick}))]){
    const bad=target({bleeding}),before=clone(bad);assert.equal(bleedStatus(bad,10),null);assert.deepEqual(bad,before);
  }
});

test('v0.8 independent: exactly seven future global pulses, no application-time hit, seventh paid then removed',()=>{
  const e=target(),s=fight([e]);strike(e,0);const seed=s.seed,hp=e.hp;
  advance(s,.01);assert.equal(e.hp,hp);assert.equal(pulses(s).length,0);
  for(let tick=1;tick<=7;tick++){
    toTick(s,tick);assert.equal(e.hp,hp-tick*8);assert.equal(pulses(s).length,tick);assert.equal(s.seed,seed);
    assert.deepEqual(bleedStatus(e,tick),tick===7?null:{stacks:1,ticksRemaining:7-tick,damagePerTick:8});
  }
  assert.equal(e.bleeding,undefined);toTick(s,8);assert.equal(e.hp,hp-56);assert.equal(pulses(s).length,7);
  assert.ok(pulses(s).every(event=>event.target===e.id&&event.value===8));
  assert.deepEqual(s.battle.actions,{attacks:0,skills:0,heals:0,potions:0,manaSpent:0});
});

test('v0.8 independent: cap refresh replaces the snapshot and gives seven future ticks, not seven ticks per stack',()=>{
  const e=target(),s=fight([e]);for(let n=0;n<5;n++)strike(e,0);
  toTick(s,3);assert.equal(e.hp,1e6-3*40);assert.equal(pulses(s).length,3);
  strike(e,3,{attack:203.5,crit:0});assert.deepEqual(e.bleeding,{stacks:5,expiresAtTick:10,damagePerTick:81});
  const hp=e.hp;advance(s,.01);assert.equal(e.hp,hp,'refresh does not itself pay a pulse');
  toTick(s,10);assert.equal(e.hp,hp-7*81);assert.equal(e.bleeding,undefined);assert.equal(pulses(s).length,10);
  toTick(s,11);assert.equal(e.hp,hp-7*81);
});

test('v0.8 independent: pulses use stored untyped integer damage, no avoidance/crit/mitigation/RNG or current-sheet recomputation',()=>{
  for(const flags of [{},{evade:1,parry:1,block:1,absorb:1,resist:1,mitigation:.95,specificMit:.95},
    {stun:{expiresAtTick:4},penetratedArmor:{stacks:3,expiresAtTick:7}}]){
    const e=target(flags);attach(e,{stacks:3,damagePerTick:23});const s=fight([e]),before=stats(s),seed=s.seed;
    s.equipment.weapon.stats.attack=1e6;s.equipment.weapon.stats.crit=1;
    assert.notDeepEqual(stats(s),before);toTick(s,1);
    assert.equal(e.hp,1e6-23);assert.equal(s.seed,seed);assert.equal(pulses(s)[0].value,23);assert.equal(pulses(s)[0].type,'bleed');
  }
});

test('v0.8 independent: live basic application snapshots the sheet attack rather than resolved direct damage',()=>{
  const e=target({mitigation:.8,specificMit:.5}),s=fight([e]);s.equipment.weapon.weaponFamily='axe';s.equipment.weapon.stats.crit=1;
  s._clock=1.04;const sheet=stats(s).attack;advance(s,.02);
  const proc=s.events.find(event=>event.type==='proc'&&event.effect==='bleed');assert.ok(proc);
  assert.equal(e.bleeding.damagePerTick,Math.floor(sheet*.08));assert.equal(e.bleeding.stacks,1);
  const i=s.events.indexOf(proc);assert.equal(s.events[i-1].type,'crit');assert.equal(s.events[i-1].target,e.id);
  const hp=e.hp;s._clock=-1000;s.equipment.weapon.stats.attack=1e5;toTick(s,1);
  assert.equal(hp-e.hp,Math.floor(sheet*.08),'later sheet changes cannot rewrite a stored snapshot');
});

test('v0.8 independent: expiry boundary pays old seventh pulse before a fresh one-stack application',()=>{
  const e=target(),s=fight([e]);attach(e,{stacks:5,expiresAtTick:7,damagePerTick:40});
  s.timing.ticks=6;s.timing.tu=699;s._clock=1.04;s.equipment.weapon.weaponFamily='axe';s.equipment.weapon.stats.crit=1;
  advance(s,.02);assert.equal(s.timing.ticks,7);assert.equal(pulses(s).length,1);assert.equal(pulses(s)[0].value,40);
  assert.deepEqual(e.bleeding,{stacks:1,expiresAtTick:14,damagePerTick:Math.floor(stats(s).attack*.08)});
  assert.deepEqual(s.events.map(event=>event.type),['bleed','crit','proc']);
});

test('v0.8 independent: multi-enemy lethal pulse rewards once each and old-wave batch never touches replacement spawn',()=>{
  const old=[target({id:'old-a',hp:1}),target({id:'old-b',hp:1})];old.forEach(e=>attach(e,{damagePerTick:1}));
  const s=fight(old,2),beforeXp=s.hero.xp;toTick(s,1);
  assert.equal(s.kills,2);assert.equal(s.hero.gold,12);assert.equal(s.hero.xp,beforeXp+18);assert.equal(s.wave,3);assert.equal(s.wins,0);
  assert.equal(pulses(s).length,2);assert.deepEqual(pulses(s).map(e=>e.target),['old-a','old-b']);
  assert.ok(old.every(e=>e.hp===0&&!e.bleeding));assert.ok(s.enemies.every(e=>e.hp===e.maxHp&&!e.bleeding));
  const rewards={kills:s.kills,gold:s.hero.gold,xp:s.hero.xp,seed:s.seed};toTick(s,2);
  assert.deepEqual({kills:s.kills,gold:s.hero.gold,xp:s.hero.xp,seed:s.seed},rewards);assert.equal(pulses(s).length,2);
});

test('v0.8 independent: final lethal pulse wins exactly once before due recovery/player/enemy actions; reward RNG remains canonical',()=>{
  const e=target({hp:1,boss:true,stunRecoveryPending:true,penetratedArmor:{stacks:3,expiresAtTick:7}});attach(e,{damagePerTick:1});
  const s=fight([e],4);s.timing.tu=99;s._clock=1.04;s._enemyClock=1.89;const actions=clone(s.battle.actions);
  let expectedSeed=s.seed;const expectedItem=generateItem(()=>{expectedSeed=(Math.imul(expectedSeed,1664525)+1013904223)>>>0;return expectedSeed/2**32;},3,'weapon');
  advance(s,.02);
  assert.equal(s.wins,1);assert.equal(s.kills,1);assert.equal(s.hero.gold,46);assert.equal(s.battle.cleared,1);assert.equal(s._phase,'intermission');
  assert.equal(s.seed,expectedSeed,'only ordinary guaranteed drop consumes RNG');assert.equal(s.inventory.length,1);
  assert.deepEqual(s.inventory[0],{...expectedItem,id:'loot-1'});assert.deepEqual(s.battle.actions,actions);
  assert.equal(s.events.filter(event=>event.type==='win').length,1);assert.equal(s.events.some(event=>event.type==='recovery'||event.target==='hero'),false);
  assert.equal(e.hp,0);assert.equal(e.bleeding,undefined);assert.equal(e.stunRecoveryPending,undefined);assert.equal(e.penetratedArmor,undefined);
  assert.deepEqual(s.enemies,[]);const before={gold:s.hero.gold,xp:s.hero.xp,kills:s.kills,wins:s.wins,seed:s.seed};advance(s,1);
  assert.deepEqual({gold:s.hero.gold,xp:s.hero.xp,kills:s.kills,wins:s.wins,seed:s.seed},before);
});

test('v0.8 independent: dead or malformed existing statuses do not damage, reward, persist or become valid at a later tick',()=>{
  for(const extra of [{hp:0,bleeding:{stacks:1,expiresAtTick:7,damagePerTick:8}},
    {bleeding:{stacks:1,expiresAtTick:99,damagePerTick:8}},
    {bleeding:{stacks:1,expiresAtTick:7,damagePerTick:-1}},
    {bleeding:{stacks:1,expiresAtTick:7,damagePerTick:NaN}}]){
    const e=target(extra),s=fight([e,target({id:'still-alive'})]),hp=e.hp,seed=s.seed;toTick(s,1);
    assert.equal(e.hp,hp);assert.equal(e.bleeding,undefined);assert.equal(s.kills,0);assert.equal(s.hero.gold,0);assert.equal(s.seed,seed);assert.equal(pulses(s).length,0);
  }
});

test('v0.8 independent: defeat, retreat, new expedition and load discard bleed without durable schema changes or offline rewards',()=>{
  const s=fight();s.equipment.weapon.weaponFamily='axe';attach(s.enemies[0]);const durable=validateSave(clone(s));
  const loaded=validateSave(clone(s));assert.equal(loaded.mode,'town');assert.deepEqual(loaded.enemies,[]);assert.equal(loaded.timing.ticks,0);
  assert.deepEqual(loaded,durable);assert.equal(loaded.equipment.weapon.weaponFamily,'axe');
  assert.deepEqual(Object.keys(loaded).sort(),Object.keys(validateSave(createGame())).sort());
  act(s,'retreat');assert.deepEqual(s.enemies,[]);act(s,'start');assert.ok(s.enemies.every(e=>!e.bleeding));
  attach(s.enemies[0]);s.enemies[0].attack=1e9;s.hero.hp=1;s._clock=-1000;s._enemyClock=1.89;advance(s,.02);
  assert.equal(s.mode,'defeat');assert.ok(s.enemies.every(e=>!e.bleeding));const dead=clone(s);advance(s,2);assert.deepEqual(s,dead);
  act(s,'retreat');act(s,'start');assert.ok(s.enemies.every(e=>!e.bleeding));
});

test('v0.8 independent: identical processed tick counts yield identical bleed-only pulses across caller partitions; full combat invariance is not claimed',()=>{
  const results=[];
  for(const step of [.02,.05,.1,.2,1,2]){
    const e=target(),s=fight([e]);attach(e,{damagePerTick:9});toTick(s,7,step);
    results.push({hp:e.hp,seed:s.seed,pulses:pulses(s).map(({type,effect,target,value})=>({type,effect,target,value})),bleeding:e.bleeding,kills:s.kills});
  }
  for(const r of results)assert.deepEqual(r,results[0]);assert.equal(results[0].hp,1e6-63);assert.equal(results[0].pulses.length,7);
  const a=fight(),b=clone(a);attach(a.enemies[0]);attach(b.enemies[0]);advance(a,1e9);advance(b,2);assert.deepEqual(a,b,'existing two-second clamp remains exact');
});

test('v0.8 independent: loot, session, validator, durable stats and family scoring retain exact accepted-v0.7 behavior',()=>{
  // Accepted receipt 022-v07-publication-receipt, verified before runtime edits.
  // Live axe trait prose and exact old-trait cleanup are the only allowed loot
  // changes. Freeze all catalog/family data and all sanitizer/generator code.
  const loot=readFileSync(new URL('../src/loot.js',import.meta.url),'utf8');
  assert.equal(sha(loot.slice(0,loot.indexOf('const WEAPON_TRAITS'))),'1244fd797574884277636905a7cf8c5201ef39cbe424694ceaec0224bd1d3db3');
  assert.equal(sha(loot.slice(loot.indexOf('const STAT_KEYS'))),'44f86cb5e777bbf4c6561558eefe67dbce043877ff6cd39973425dcd9d025904');
  assert.equal(sha(readFileSync(new URL('../src/session.js',import.meta.url))),'821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a');
  const engine=readFileSync(new URL('../src/engine.js',import.meta.url),'utf8');
  assert.equal(sha(engine.slice(engine.indexOf('function sanitizeItem'))),'8c3110caeccd48bb103800f615b5c50a90a02bdac0ee86b1742fd4acebc3475b');
  const s=createGame(),sheet=stats(s),score=scoreItem(s.equipment.weapon);
  for(const family of ['axe','rapier','club',null]){s.equipment.weapon.weaponFamily=family;assert.deepEqual(stats(s),sheet);assert.equal(scoreItem(s.equipment.weapon),score);}
});

test('v0.8 independent: non-axe/skill hits preserve an existing wound, and a weaker capped reproc replaces rather than accumulates its snapshot',()=>{
  const e=target();attach(e,{stacks:5,expiresAtTick:17,damagePerTick:81});
  for(const [a,w] of [[basic,plain],[{...basic,skill:true,crit:1},axe],[{...basic,magical:true,crit:1},axe],
    [basic,{slot:'weapon',weaponFamily:'rapier'}],[basic,{slot:'weapon',weaponFamily:'club'}]]){
    const current=clone(e),before=clone(current.bleeding);strike(current,12,a,0,w);assert.deepEqual(current.bleeding,before);
  }
  const result=strike(e,12,{attack:1,crit:0});assert.equal(result.proc.stacks,5);
  assert.deepEqual(e.bleeding,{stacks:5,expiresAtTick:19,damagePerTick:0},'new weaker source snapshots all stacks; never sum old snapshots');
  const lethal=target({hp:1,bleeding:{stacks:5,expiresAtTick:17,damagePerTick:81},penetratedArmor:{stacks:3,expiresAtTick:17},stunRecoveryPending:true});
  strike(lethal,10);assert.equal(lethal.bleeding,undefined);assert.equal(lethal.penetratedArmor,undefined);assert.equal(lethal.stunRecoveryPending,undefined);
});

test('v0.8 independent: same-boundary bleed kill then direct kill rewards each identity once before a single wave transition',()=>{
  const bleeding=target({id:'bleed-first',hp:1}),direct=target({id:'direct-second',hp:1});attach(bleeding,{damagePerTick:7});
  const s=fight([bleeding,direct],2);s.timing.tu=99;s._clock=1.04;s._enemyClock=1.89;
  advance(s,.02);assert.equal(s.kills,2);assert.equal(s.hero.gold,12);assert.equal(s.hero.xp,18);assert.equal(s.wave,3);assert.equal(s.wins,0);
  assert.equal(pulses(s).length,1);assert.equal(pulses(s)[0].value,1,'lethal event displays actual remaining HP, not overkill snapshot');
  assert.equal(pulses(s)[0].target,bleeding.id);
  const hits=s.events.filter(e=>['hit','crit'].includes(e.type));assert.equal(hits.length,1);assert.equal(hits[0].target,direct.id);
  assert.equal(s.battle.actions.attacks,1);assert.equal(bleeding.hp,0);assert.equal(direct.hp,0);assert.equal(bleeding.bleeding,undefined);
  assert.ok(s.enemies.every(e=>e.hp===e.maxHp&&!e.bleeding));assert.equal(s._enemyClock,0);
  s._clock=-1000;s._enemyClock=-1000;const gold=s.hero.gold;toTick(s,2);assert.equal(s.kills,2);assert.equal(s.hero.gold,gold);
});

// These thirteen controlled starter-stat AXE cases replace no historical hash.
// The historical expected data remains archived in v05/v06. This new contract
// checks reproducible current play and one reward per independently observed
// positive→zero HP transition, including death/next-wave/final-win boundaries.
const axeCases=[
  [1,1,'balanced'],[1,42,'balanced'],[1,999,'balanced'],[2,1,'balanced'],[2,42,'balanced'],[2,999,'balanced'],
  [1,42,'assault'],[2,999,'sustain'],[3,42,'balanced'],[4,999,'assault'],[5,42,'sustain'],[15,42,'balanced'],[30,999,'balanced'],
];
function axeRun(stage,seed,strategy){
  const s=createGame(seed);s.stage=stage;s.unlocked=stage;s.strategy=strategy;s.equipment.weapon.weaponFamily='axe';
  let procs=0,pulseCount=0,bleedDamage=0,eventId=0;const deaths=new Set();act(s,'start');
  for(let n=0;n<10000&&s.mode==='battle'&&!s.wins;n++){
    const previous=s.enemies.map(enemy=>({enemy,hp:enemy.hp}));advance(s,.1);
    for(const {enemy,hp} of previous)if(hp>0&&enemy.hp===0){assert.equal(deaths.has(enemy.id),false,'identity cannot die twice');deaths.add(enemy.id);}
    assert.equal(s.kills,deaths.size,'every observed death has exactly one reward count');
    for(const event of s.events.filter(e=>e.id>eventId)){
      if(event.type==='proc'&&event.effect==='bleed')procs++;
      if(event.type==='bleed'){pulseCount++;bleedDamage+=event.value;assert.ok(Number.isSafeInteger(event.value)&&event.value>0);}
      eventId=event.id;
    }
    assert.ok(s.events.length<=30&&s.logs.length<=30);
  }
  assert.ok(s.wins===1||s.mode==='defeat');assert.ok(s.enemies.every(e=>!e.bleeding),'terminal combat cannot retain a wound');
  return {s,procs,pulseCount,bleedDamage};
}
for(const [stage,seed,strategy] of axeCases)test(`v0.8 independent axe replay: stage ${stage}, seed ${seed}, ${strategy}`,t=>{
  const first=axeRun(stage,seed,strategy);assert.deepEqual(axeRun(stage,seed,strategy),first);
  if(stage<=5)assert.ok(first.procs>0&&first.pulseCount>0,'playable fixture actually exercises live bleed');
  t.diagnostic(JSON.stringify({stage,seed,strategy,wins:first.s.wins,mode:first.s.mode,seconds:Number(first.s.battle.elapsed.toFixed(1)),kills:first.s.kills,procs:first.procs,pulses:first.pulseCount,bleedDamage:first.bleedDamage,finalSeed:first.s.seed}));
});

test('v0.8 independent: malformed clock jumps are bounded to already owed pulses and cannot age an invalid wound into validity',()=>{
  for(const jump of [200,1e8]){
    const valid=target({id:'valid-jump'}),invalid=target({id:'invalid-jump'});attach(valid);attach(invalid,{expiresAtTick:8});
    const s=fight([valid,invalid]);s.timing.tu=jump;const seed=s.seed;advance(s,.02);
    const owed=Math.min(7,Math.floor((jump+.02*100/1.05)/100));
    assert.equal(valid.hp,1e6-8*owed);assert.equal(invalid.hp,1e6);assert.equal(invalid.bleeding,undefined);
    assert.equal(pulses(s).length,owed);assert.ok(pulses(s).every(e=>e.target===valid.id));assert.equal(s.seed,seed);
    if(jump>700)assert.equal(valid.bleeding,undefined);
  }
  for(const tu of [NaN,Infinity,Number.MAX_VALUE,-100]){
    const e=target(),s=fight([e]);attach(e);s.timing.tu=tu;advance(s,.02);
    assert.equal(e.hp,1e6);assert.equal(e.bleeding,undefined);assert.equal(pulses(s).length,0);assert.equal(s.kills,0);
  }
  const old=target({hp:1});attach(old,{damagePerTick:1});const s=fight([old],1);s.timing.tu=1e8;
  advance(s,.02);assert.equal(s.kills,1);assert.equal(s.wave,2);assert.equal(pulses(s).length,1);
  assert.ok(s.enemies.every(e=>e.hp===e.maxHp&&!e.bleeding),'remaining old clock jump cannot pay damage to replacements');
});
