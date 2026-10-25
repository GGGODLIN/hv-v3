import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, act, advance, stats, resolveAttack, resolveWeaponAttack,
  AXE_BLEED_RULES, bleedStatus, validateSave,
} from '../src/engine.js';

const clone=value=>structuredClone(value);
const axe={slot:'weapon',weaponFamily:'axe'},plain={slot:'weapon',weaponFamily:null};
const attack={attack:100,crit:0};
const enemy=()=>({id:'bleed-fixture',name:'流血測試敵人',hp:10000,maxHp:10000,attack:0,mitigation:0,evade:0,parry:0,block:0,boss:true});
function sequence(values=[],fallback=.99){let calls=0;return {rng:()=>values[calls++]??fallback,get calls(){return calls;}};}
const ordinary=proc=>sequence([.9,.9,.9,.9,.9,.9,.9,.5,proc]);
const strike=(target,tick=0,attacker=attack,proc=0)=>resolveWeaponAttack(attacker,target,axe,tick,ordinary(proc).rng);
function encounter({hp=10000,boss=true,wave=4,damagePerTick=8}={}){
  const s=createGame(42);act(s,'start');s.wave=wave;
  s.enemies=[{...enemy(),hp,maxHp:hp,boss,bleeding:{stacks:1,expiresAtTick:7,damagePerTick}}];
  s._clock=-100;s._enemyClock=-100;return s;
}
function crossTick(s){s.timing.tu=(s.timing.ticks+1)*100-1;advance(s,.02);}
const bleedEvents=s=>s.events.filter(e=>e.type==='bleed');
const heroEvents=s=>s.events.filter(e=>e.target==='hero'&&['hit','miss','block'].includes(e.type));

test('historical axe constants and detached bounded status view are explicit',()=>{
  assert.deepEqual(AXE_BLEED_RULES,{chance:.25,durationTicks:7,maxStacks:5,damageFractionPerStack:.08});
  assert.ok(Object.isFrozen(AXE_BLEED_RULES));
  const target=enemy(),result=strike(target,10);
  assert.deepEqual(result.proc,{type:'bleeding',stacks:1,durationTicks:7,damagePerTick:8});
  assert.deepEqual(target.bleeding,{stacks:1,expiresAtTick:17,damagePerTick:8});
  const before=clone(target),view=bleedStatus(target,10);view.stacks=5;view.damagePerTick=1e6;
  assert.deepEqual(bleedStatus(target,10),{stacks:1,ticksRemaining:7,damagePerTick:8});
  assert.deepEqual(target,before);assert.equal(bleedStatus(target,17),null);
  assert.deepEqual(bleedStatus(Object.freeze({...target,bleeding:Object.freeze(target.bleeding)}),16),{stacks:1,ticksRemaining:1,damagePerTick:8});
});

test('strict 25 percent noncritical boundary and critical guarantee consume only intended RNG',()=>{
  for(const value of [0,.249999])assert.equal(strike(enemy(),0,attack,value).proc.type,'bleeding');
  for(const value of [.25,.999999])assert.equal(strike(enemy(),0,attack,value).proc,undefined);
  for(const multiCrit of [0,1]){
    const a=sequence([],0),b=sequence([],0),target=enemy(),attacker={...attack,crit:1,multiCrit};
    const result=resolveWeaponAttack(attacker,target,axe,0,a.rng),expected=resolveAttack(attacker,enemy(),b.rng);
    assert.equal(result.crit,multiCrit?9:1);assert.equal(result.proc.stacks,1);assert.equal(result.proc.damagePerTick,8);
    delete result.proc;assert.deepEqual(result,expected);assert.equal(a.calls,b.calls);
  }
  const weak=strike(enemy(),0,{...attack,crit:1,weakened:true},.9);
  assert.equal(weak.crit,0);assert.equal(weak.proc,undefined);
});

test('only the positive surviving basic axe hit may proc; rejected paths spend no proc RNG',()=>{
  const cases=[
    [{...attack,attack:0},enemy(),axe],[{...attack,attack:1},{...enemy(),mitigation:.95},axe],
    [attack,{...enemy(),hp:1},axe],[attack,{...enemy(),hp:0},axe],[attack,{...enemy(),hp:NaN},axe],
    [{...attack,skill:true,crit:1},enemy(),axe],[{...attack,magical:true,crit:1},enemy(),axe],
    [{...attack,whiff:1},enemy(),axe],[attack,{...enemy(),evade:1},axe],
    [attack,{...enemy(),parry:1},axe],[attack,{...enemy(),block:1},axe],
    [attack,enemy(),plain],[attack,enemy(),{slot:'armor',weaponFamily:'axe'}],
    [attack,enemy(),{slot:'weapon',weaponFamily:'Axe'}],[attack,enemy(),createGame().equipment.weapon],
  ];
  for(const [attacker,target,weapon] of cases){
    const a=sequence([],0),b=sequence([],0),expected=resolveAttack(attacker,clone(target),b.rng);
    assert.deepEqual(resolveWeaponAttack(attacker,target,weapon,0,a.rng),expected);
    assert.equal(a.calls,b.calls);assert.equal(target.bleeding,undefined);
  }
});

test('positive partial avoidance may proc, but its reduced hit is not the snapshot source',()=>{
  for(const [gate,index] of [['evade',0],['parry',2],['block',4]]){
    const rolls=[.9,.9,.9,.9,.9,.9,.9,.5,0];rolls[index]=.1;
    if(gate==='evade')rolls.splice(6,1);
    const target={...enemy(),[gate]:.5};
    const result=resolveWeaponAttack(attack,target,axe,0,sequence(rolls).rng);
    assert.equal(result.damage,50);assert.equal(result.proc.damagePerTick,8);
    assert.equal(result.crit,0);
  }
});

test('snapshots floor total sheet attack times 0.08 times stacks; damage dice, PA and mitigation do not enter it',()=>{
  for(const mitigation of [0,.8,.95])for(const die of [0,.5,.999999]){
    const target={...enemy(),mitigation,specificMit:.5,penetratedArmor:{stacks:3,expiresAtTick:7}};
    const rolls=[.9,.9,.9,.9,.9,.9,.9,die,0];
    const result=resolveWeaponAttack({...attack,attack:123},target,axe,0,sequence(rolls).rng);
    assert.ok(result.damage>0);assert.equal(result.proc.damagePerTick,9);
    assert.equal(target.mitigation,mitigation);assert.equal(target.specificMit,.5);
  }
  const target=enemy();strike(target,0,{attack:13,crit:0});strike(target,1,{attack:13,crit:0});
  assert.equal(target.bleeding.damagePerTick,2,'floor after total stacks, not before per-stack sum');
});

test('stacks stop at five; every success refreshes seven future ticks and may replace a stronger snapshot',()=>{
  const target=enemy();
  for(let tick=0;tick<8;tick++){
    const result=strike(target,tick),stacks=Math.min(tick+1,5);
    assert.deepEqual(target.bleeding,{stacks,expiresAtTick:tick+7,damagePerTick:8*stacks});
    assert.equal(result.proc.stacks,stacks);
  }
  const before=clone(target.bleeding);assert.equal(strike(target,8,attack,.25).proc,undefined);
  assert.deepEqual(target.bleeding,before,'failed proc never refreshes');
  strike(target,9,{attack:20,crit:0});
  assert.deepEqual(target.bleeding,{stacks:5,expiresAtTick:16,damagePerTick:8},'weaker whole-wound refresh is the explicit adaptation');
  const restarted=strike(target,16);assert.equal(restarted.proc.stacks,1);assert.equal(target.bleeding.expiresAtTick,23);
});

test('zero floored snapshot remains a visible timed wound without a hidden minimum or damage events',()=>{
  const target=enemy(),result=strike(target,0,{attack:1,crit:0});
  assert.equal(result.damage,1);assert.equal(result.proc.damagePerTick,0);
  assert.deepEqual(bleedStatus(target,0),{stacks:1,ticksRemaining:7,damagePerTick:0});
  const s=encounter({damagePerTick:0}),before=clone(s);
  for(let tick=0;tick<7;tick++)crossTick(s);
  assert.equal(s.enemies[0].hp,before.enemies[0].hp);assert.equal(s.enemies[0].bleeding,undefined);
  assert.equal(s.seed,before.seed);assert.equal(s.kills,0);assert.equal(bleedEvents(s).length,0);
});

test('malformed or unbounded status and invalid tick inputs fail closed without later activation',()=>{
  const statuses=[null,{},[],{stacks:0,expiresAtTick:7,damagePerTick:8},{stacks:6,expiresAtTick:7,damagePerTick:8},
    {stacks:1.5,expiresAtTick:7,damagePerTick:8},{stacks:1,expiresAtTick:8,damagePerTick:8},
    {stacks:1,expiresAtTick:0,damagePerTick:8},{stacks:1,expiresAtTick:Infinity,damagePerTick:8},
    {stacks:1,expiresAtTick:7.5,damagePerTick:8},...[-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'8'].map(damagePerTick=>({stacks:1,expiresAtTick:7,damagePerTick}))];
  for(const status of statuses){
    const target={...enemy(),bleeding:status};assert.equal(bleedStatus(target,0),null);
    resolveWeaponAttack(attack,target,plain,0,()=>.5);assert.equal(target.bleeding,undefined);
    const s=encounter();s.enemies[0].bleeding=clone(status);crossTick(s);
    assert.equal(s.enemies[0].bleeding,undefined);assert.equal(bleedEvents(s).length,0);
  }
  for(const tick of [-1,NaN,Infinity,1.5,'0',Number.MAX_SAFE_INTEGER]){
    const target=enemy();assert.equal(strike(target,tick).proc,undefined);assert.equal(bleedStatus(target,tick),null);
  }
  const target={...enemy(),hp:0,bleeding:{stacks:1,expiresAtTick:7,damagePerTick:8}};
  assert.equal(bleedStatus(target,0),null);
  const huge=enemy();huge.hp=1e30;huge.bleeding={stacks:1,expiresAtTick:7,damagePerTick:8};
  const before=clone(huge.bleeding);assert.equal(strike(huge,0,{attack:1e20,crit:0}).proc,undefined);assert.deepEqual(huge.bleeding,before);
});

test('application never deals immediate bleed and exactly seven future boundaries pay, including expiry',()=>{
  const s=encounter();delete s.enemies[0].bleeding;s.timing.ticks=10;s.timing.tu=1000;
  strike(s.enemies[0],10);const hp=s.enemies[0].hp,seed=s.seed;
  assert.equal(bleedEvents(s).length,0);advance(s,0);assert.equal(s.enemies[0].hp,hp);
  for(let n=1;n<=7;n++){
    crossTick(s);assert.equal(s.timing.ticks,10+n);assert.equal(s.enemies[0].hp,hp-8*n);
    assert.equal(bleedEvents(s).length,n);
    assert.deepEqual(bleedEvents(s).at(-1),{id:n,type:'bleed',text:'流血測試敵人 · 流血 8',value:8,target:'bleed-fixture',effect:'bleed'});
    assert.equal(bleedStatus(s.enemies[0],s.timing.ticks)?.ticksRemaining??0,7-n);
  }
  assert.equal(s.enemies[0].bleeding,undefined);crossTick(s);assert.equal(bleedEvents(s).length,7);
  assert.equal(s.seed,seed);assert.equal(s.battle.actions.attacks,0);assert.equal(s.hero.proficiency,0);
});

test('global-tick pulses bypass every defense and do not consult current hero attack or trigger another proc',()=>{
  const s=encounter(),target=s.enemies[0];
  Object.assign(target,{mitigation:1,specificMit:1,evade:1,parry:1,block:1,resist:1,absorb:1,penetratedArmor:{stacks:3,expiresAtTick:7},stun:{expiresAtTick:4}});
  s.equipment.weapon.weaponFamily='axe';s.equipment.weapon.stats.attack=1e6;
  const seed=s.seed,hp=target.hp,statsBefore=clone(stats(s));crossTick(s);
  assert.equal(target.hp,hp-8);assert.equal(s.seed,seed);assert.equal(s.events.filter(e=>e.type==='proc').length,0);
  assert.equal(target.mitigation,1);assert.equal(target.block,1);assert.deepEqual(stats(s),statsBefore);
});

test('crossed ticks replay chronologically once with bounded work, never aggregate a repeated death',()=>{
  const s=encounter(),seed=s.seed;s.timing.tu=600;
  advance(s,.01);assert.equal(s.timing.ticks,6);assert.equal(bleedEvents(s).length,6);assert.equal(s.enemies[0].hp,9952);
  const before=clone(s);advance(s,0);assert.deepEqual(s,before);
  const late=encounter();late.timing.tu=1e9;advance(late,.01);
  assert.equal(bleedEvents(late).length,7);assert.equal(late.enemies[0].hp,9944);assert.equal(late.enemies[0].bleeding,undefined);
  assert.equal(late.seed,seed);
});

test('same processed integer ticks give the same pulse sequence across caller partitions, not a global cadence claim',()=>{
  // Stay off the inherited floating boundary at exactly 8.4 s. This test is
  // about equal observed integer ticks, not repairing the legacy TU clock.
  const patterns=[[...Array(168).fill(.05),.01],[...Array(84).fill(.1),.01],[...Array(33).fill(.25),.16],[...Array(8).fill(1),.41],[2,2,2,2,.41]];
  const results=patterns.map(pattern=>{
    const s=encounter();for(const dt of pattern)advance(s,dt);
    assert.equal(s.timing.ticks,8);return {hp:s.enemies[0].hp,status:s.enemies[0].bleeding,seed:s.seed,events:s.events,kills:s.kills,actions:s.battle.actions};
  });
  for(const result of results)assert.deepEqual(result,results[0]);
  assert.equal(results[0].hp,9944);assert.equal(results[0].events.length,7);
  const a=encounter(),b=clone(a);advance(a,1e9);advance(b,2);assert.deepEqual(a,b,'existing two-second cap remains');
});

test('a lethal pulse caps actual damage, pays ordinary kill once and cannot attack the new wave on that boundary',()=>{
  const s=encounter({hp:3,boss:false,wave:1}),old=s.enemies[0];
  old.stun={expiresAtTick:1};old.stunRecoveryPending=true;old.stunRecoveryTurn=1;
  old.penetratedArmor={stacks:2,expiresAtTick:7};s._clock=1.04;s._enemyClock=1.89;
  const hp=s.hero.hp;crossTick(s);
  assert.equal(s.kills,1);assert.equal(s.hero.gold,6);assert.equal(s.wave,2);assert.equal(s.wins,0);
  assert.equal(bleedEvents(s)[0].value,3);assert.match(bleedEvents(s)[0].text,/流血測試敵人.*流血 3/);
  assert.ok(s.logs.some(line=>/流血測試敵人 因流血倒下/.test(line)));
  assert.equal(s.battle.actions.attacks,0);assert.equal(heroEvents(s).length,0);assert.equal(s.hero.hp,hp);
  assert.equal(s._enemyClock,0);assert.ok(s.enemies.every(e=>e.id!==old.id&&!e.bleeding&&!e.stunRecoveryPending));
  for(const key of ['bleeding','stun','stunRecoveryPending','stunRecoveryTurn','penetratedArmor'])assert.equal(old[key],undefined);
  assert.ok(s._clock>=1.05,'player time is retained, not silently discarded');
  advance(s,.01);assert.equal(s.battle.actions.attacks,1,'new wave resumes at the following substep');
  assert.equal(s.kills,1);
});

test('two simultaneous lethal pulses settle only the captured old wave and never transfer to its replacements',()=>{
  const s=encounter({hp:3,boss:false,wave:2});s.enemies.push({...enemy(),id:'second-old-enemy',hp:4,boss:false,bleeding:{stacks:1,expiresAtTick:7,damagePerTick:8}});
  const olds=[...s.enemies];crossTick(s);
  assert.equal(s.kills,2);assert.equal(s.hero.gold,12);assert.equal(s.wave,3);assert.equal(s.enemies.length,2);
  assert.deepEqual(bleedEvents(s).map(e=>[e.target,e.value]),[['bleed-fixture',3],['second-old-enemy',4]]);
  assert.ok(olds.every(e=>e.hp===0&&!e.bleeding));assert.ok(s.enemies.every(e=>!e.bleeding&&e.hp===e.maxHp));
  crossTick(s);assert.equal(s.kills,2);assert.equal(bleedEvents(s).length,2);
});

test('final boss bleed settles the clear exactly once, stops same-boundary actions and keeps final damage feedback',()=>{
  const s=encounter({hp:3}),target=s.enemies[0];s._clock=1.04;s._enemyClock=1.89;
  crossTick(s);
  assert.equal(s.kills,1);assert.equal(s.wins,1);assert.equal(s.battle.cleared,1);assert.equal(s.hero.gold,46);
  assert.equal(s.inventory.length,1);assert.equal(s._itemId,1);assert.equal(s.unlocked,2);
  assert.equal(s.mode,'battle');assert.equal(s._phase,'intermission');assert.deepEqual(s.enemies,[]);
  assert.equal(s.battle.actions.attacks,0);assert.equal(heroEvents(s).length,0);assert.equal(target.bleeding,undefined);
  assert.equal(s.events[0].type,'bleed');assert.ok(s.events.some(e=>e.type==='win'));
  const stable={kills:s.kills,wins:s.wins,gold:s.hero.gold,itemId:s._itemId,seed:s.seed};advance(s,1);
  assert.deepEqual({kills:s.kills,wins:s.wins,gold:s.hero.gold,itemId:s._itemId,seed:s.seed},stable);
});

test('bleed clear preserves inventory-cap forced camp stop and no-repeat payout',()=>{
  const s=encounter({hp:3});s.inventory=Array.from({length:115},(_,n)=>({...clone(s.equipment.armor),id:`held-${n}`}));
  crossTick(s);assert.equal(s.wins,1);assert.equal(s.inventory.length,116);assert.equal(s.pendingLoot.length,0);
  assert.equal(s.mode,'town');assert.equal(s._phase,'idle');assert.deepEqual(s.enemies,[]);
  const before=clone(s);advance(s,2);assert.deepEqual(s,before);
});

test('lethal bleed precedes same-boundary stun recovery; a surviving neighbor can still recover and cause defeat',()=>{
  const s=encounter({hp:3});s.enemies[0].stun={expiresAtTick:1};s._clock=1.04;s._enemyClock=1.89;
  s.enemies.push({...enemy(),id:'fatal-recovery',attack:1e8,stunRecoveryPending:true});s.hero.hp=1;
  crossTick(s);assert.equal(s.mode,'defeat');assert.equal(s.kills,1);assert.equal(s.wins,0);
  assert.equal(s.battle.actions.attacks,0);assert.equal(s.events[0].type,'bleed');assert.equal(s.events.filter(e=>e.type==='recovery').length,1);
  assert.equal(s.events.find(e=>e.type==='recovery').target,'fatal-recovery');assert.equal(heroEvents(s).length,1);
  assert.ok(s.enemies.every(e=>!e.bleeding&&!e.stun&&!e.stunRecoveryPending));
  const before=clone(s);advance(s,2);assert.deepEqual(s,before);
});

test('ordinary lethal attacks, retreat, new expedition and safe load discard the transient wound',()=>{
  const target={...enemy(),hp:1,bleeding:{stacks:3,expiresAtTick:7,damagePerTick:24}};
  assert.equal(strike(target).proc,undefined);assert.equal(target.bleeding,undefined);
  const s=encounter();const loaded=validateSave(JSON.parse(JSON.stringify(s)));
  assert.equal(loaded.mode,'town');assert.deepEqual(loaded.enemies,[]);assert.equal(loaded.timing.ticks,0);
  assert.deepEqual(Object.keys(loaded).sort(),Object.keys(validateSave(createGame())).sort(),'no durable bleed field');
  act(s,'retreat');assert.deepEqual(s.enemies,[]);act(s,'start');assert.ok(s.enemies.every(e=>!e.bleeding));
});

test('live axe hit feedback stays hit-before-proc and bounded across repeated waves',()=>{
  const s=createGame(42);s.equipment.weapon.weaponFamily='axe';s.equipment.weapon.stats.crit=1;
  act(s,'start');s.enemies=[{...enemy(),hp:1e8,maxHp:1e8}];
  for(let n=0;n<100&&!s.events.some(e=>e.type==='proc');n++)advance(s,.1);
  const index=s.events.findIndex(e=>e.type==='proc'),proc=s.events[index];
  assert.ok(index>0);assert.equal(s.events[index-1].type,'crit');assert.equal(proc.effect,'bleed');assert.equal(proc.target,'bleed-fixture');
  assert.match(proc.text,/流血傷口 1\/5 層.*7 Tick.*每 Tick/);
  for(let n=0;n<3000;n++)advance(s,.1);
  assert.ok(s.events.length<=30);assert.ok(s.logs.length<=30);assert.ok(s.enemies[0].bleeding.stacks<=5);
});
