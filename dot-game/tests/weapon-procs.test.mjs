import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,advance,resolveAttack,resolveWeaponAttack,penetratedArmorStatus,PENETRATED_ARMOR_RULES,validateSave} from '../src/engine.js';

const clone=value=>JSON.parse(JSON.stringify(value));
const rapier={slot:'weapon',weaponFamily:'rapier'};
const plain={slot:'weapon',weaponFamily:null};
const attack={attack:100,crit:0};
const enemy=()=>({hp:10000,mitigation:.8});
function sequence(values,fallback=.99){let count=0;const rng=()=>values[count++]??fallback;return {rng,get count(){return count;}};}
// Six avoidance checks, first critical, damage die, then optional noncritical proc.
const ordinaryRoll=proc=>sequence([.9,.9,.9,.9,.9,.9,.9,.5,proc]);
const strike=(target,tick=0,attacker=attack,weapon=rapier,proc=0)=>resolveWeaponAttack(attacker,target,weapon,tick,ordinaryRoll(proc).rng);
function until(s,predicate,limit=20000){for(let n=0;n<limit&&!predicate(s);n++)advance(s,.1);assert.ok(predicate(s),'fixture reached terminal state');return s;}

test('historical PA chosen maximum rate/duration and relative stacking are explicit',()=>{
  assert.deepEqual(PENETRATED_ARMOR_RULES,{chance:.25,durationTicks:7,maxStacks:3,mitigationReductionPerStack:.25});
  assert.ok(Object.isFrozen(PENETRATED_ARMOR_RULES));
  const target=enemy();
  const hits=[];
  for(let n=0;n<4;n++)hits.push(strike(target,n).damage);
  assert.deepEqual(hits,[20,40,60,80],'each new stack applies only AFTER the triggering hit');
  assert.equal(target.mitigation,.8,'source general mitigation is never rewritten');
  assert.deepEqual(target.penetratedArmor,{stacks:3,expiresAtTick:10},'fourth proc refreshes but cannot exceed three stacks');
});

test('25 percent noncritical proc boundary is strict and failures do not refresh',()=>{
  for(const value of [0,.249999])assert.equal(strike(enemy(),0,attack,rapier,value).proc.stacks,1);
  for(const value of [.25,.999999]){
    const target=enemy();assert.equal(strike(target,0,attack,rapier,value).proc,undefined);assert.equal(target.penetratedArmor,undefined);
  }
  const target=enemy();strike(target,0);strike(target,2,attack,rapier,.25);
  assert.deepEqual(target.penetratedArmor,{stacks:1,expiresAtTick:7});
});

test('eligible critical guarantees only one proc, including nine critical counts, without another RNG roll',()=>{
  const rng=sequence([],0),target=enemy();
  const result=resolveWeaponAttack({...attack,crit:1,multiCrit:1},target,rapier,0,rng.rng);
  assert.equal(result.crit,9);assert.equal(result.proc.stacks,1);assert.equal(rng.count,16);
  const weak=enemy();const weakened=strike(weak,0,{...attack,crit:1,weakened:true},rapier,.9);
  assert.equal(weakened.crit,0);assert.equal(weakened.proc,undefined);
});

test('existing PA affects physical and Void general mitigation, not specific mitigation or magic',()=>{
  for(const [attacker,expected] of [[attack,30],[{...attack,void:true},60],[{...attack,magical:true},10]]){
    const target={...enemy(),specificMit:.5,penetratedArmor:{stacks:2,expiresAtTick:7}};
    const result=resolveWeaponAttack(attacker,target,plain,0,()=>.5);
    assert.equal(result.damage,expected);assert.equal(target.specificMit,.5);assert.equal(target.mitigation,.8);
  }
  const noArmor={hp:10000,mitigation:0,penetratedArmor:{stacks:3,expiresAtTick:7}};
  assert.equal(resolveWeaponAttack(attack,noArmor,plain,0,()=>.5).damage,100,'PA is not a direct damage multiplier');
  const fallback={hp:10000,defense:80,penetratedArmor:{stacks:1,expiresAtTick:7}};
  assert.equal(resolveWeaponAttack(attack,fallback,plain,0,()=>.5).damage,40);assert.equal(fallback.defense,80);
});

test('ordinary partial evade, parry, and block positive hits are eligible by explicit adaptation',()=>{
  for(const [gate,index] of [['evade',0],['parry',2],['block',4]]){
    const target={...enemy(),[gate]:.5};
    const rolls=[.9,.9,.9,.9,.9,.9,.9,.5,0];rolls[index]=.1;
    // Evade glance skips the first-critical roll.
    if(gate==='evade')rolls.splice(6,1);
    const result=resolveWeaponAttack({...attack,crit:1},target,rapier,0,sequence(rolls).rng);
    assert.ok(result.damage>0);assert.equal(result.proc.stacks,1);
    if(gate==='evade')assert.equal(result.crit,0);
  }
});

test('full avoidance, whiff, zero damage and lethal hits cannot proc or consume proc RNG',()=>{
  const cases=[
    [attack,{...enemy(),evade:1}],
    [attack,{...enemy(),parry:1}],
    [attack,{...enemy(),block:1}],
    [{...attack,whiff:1},enemy()],
    [{...attack,attack:0},enemy()],
    [{...attack,attack:1},enemy()],
    [attack,{...enemy(),hp:16}],
    [attack,{...enemy(),hp:0}],
  ];
  for(const [attacker,target] of cases){
    const baseline=sequence([],0),tested=sequence([],0);
    const expected=resolveAttack(attacker,clone(target),baseline.rng);
    const result=resolveWeaponAttack(attacker,target,rapier,0,tested.rng);
    assert.deepEqual(result,expected);assert.equal(tested.count,baseline.count);assert.equal(target.penetratedArmor,undefined);
  }
});

test('original automated skill benefits from PA but never triggers or refreshes it',()=>{
  const target={...enemy(),evade:1,parry:1,penetratedArmor:{stacks:2,expiresAtTick:7}};
  const tested=sequence([],.5),baseline=sequence([],.5);
  const result=resolveWeaponAttack({...attack,skill:true,crit:1},target,rapier,3,tested.rng);
  const expected=resolveAttack({...attack,skill:true,crit:1},{...target,mitigation:.4},baseline.rng);
  assert.deepEqual(result,expected);assert.equal(result.damage,90);assert.equal(tested.count,baseline.count);
  assert.deepEqual(target.penetratedArmor,{stacks:2,expiresAtTick:7});
  const fresh=enemy();assert.equal(strike(fresh,0,{...attack,skill:true,crit:1}).proc,undefined);
});

test('magic, starter, axe, club, malformed family and nonweapon cannot trigger or consume proc RNG',()=>{
  for(const weapon of [createGame().equipment.weapon,plain,{slot:'weapon',weaponFamily:'axe'},{slot:'weapon',weaponFamily:'club'},{slot:'weapon',weaponFamily:'Rapier'},{slot:'weapon',weaponFamily:'rapier-extra'},{slot:'armor',weaponFamily:'rapier'},null]){
    const target=enemy(),tested=sequence([],0),baseline=sequence([],0);
    const expected=resolveAttack({...attack,crit:1},clone(target),baseline.rng);
    assert.deepEqual(resolveWeaponAttack({...attack,crit:1},target,weapon,0,tested.rng),expected);
    assert.equal(tested.count,baseline.count);assert.equal(target.penetratedArmor,undefined);
  }
  const target=enemy();assert.equal(strike(target,0,{...attack,magical:true,crit:1}).proc,undefined);
});

test('shared timer expires exactly at seventh crossed tick, before a new hit/proc',()=>{
  const target=enemy();strike(target,10);
  assert.deepEqual(penetratedArmorStatus(target,10),{stacks:1,ticksRemaining:7,mitigationMultiplier:.75});
  assert.equal(penetratedArmorStatus(target,16).ticksRemaining,1);
  assert.equal(penetratedArmorStatus(target,17),null);
  const result=strike(target,17);
  assert.equal(result.damage,20,'old expired stack cannot affect boundary hit');
  assert.deepEqual(target.penetratedArmor,{stacks:1,expiresAtTick:24});
});

test('malformed status/ticks cannot create unbounded mitigation or lifetime',()=>{
  for(const status of [null,{},[],{stacks:-1,expiresAtTick:7},{stacks:4,expiresAtTick:7},{stacks:1.5,expiresAtTick:7},{stacks:1,expiresAtTick:Infinity},{stacks:1,expiresAtTick:8},{stacks:1,expiresAtTick:0}]){
    const target={...enemy(),penetratedArmor:status};assert.equal(penetratedArmorStatus(target,0),null);
    assert.equal(resolveWeaponAttack(attack,target,plain,0,()=>.5).damage,20);
  }
  for(const tick of [-1,NaN,Infinity,1.5,'0',Number.MAX_SAFE_INTEGER]){
    const target=enemy();assert.equal(strike(target,tick).proc,undefined);assert.equal(target.penetratedArmor,undefined);
  }
});

test('engine removes expired statuses at tick boundaries without needing a player attack',()=>{
  const s=createGame();act(s,'start');const target=s.enemies[0];target.penetratedArmor={stacks:3,expiresAtTick:7};
  s.timing.tu=690;s.timing.ticks=6;s._clock=0;
  advance(s,.05);assert.equal(s.timing.ticks,6);assert.equal(target.penetratedArmor.stacks,3);
  advance(s,.1);assert.equal(s.timing.ticks,7);assert.equal(target.penetratedArmor,undefined);assert.equal(s.timing.turns,0);
});

test('bounded advance expires by TU ticks rather than caller seconds or presentation frames',()=>{
  const a=createGame(),b=createGame();
  for(const s of [a,b]){act(s,'start');s.enemies[0].penetratedArmor={stacks:1,expiresAtTick:1};s._clock=-10;}
  advance(a,1e9);advance(b,2);
  assert.deepEqual(a,b);assert.equal(a.timing.ticks,1);assert.equal(a.enemies[0].penetratedArmor,undefined);
});

test('status belongs to enemy identity and is discarded on new wave, retreat and load',()=>{
  const s=createGame(42);act(s,'start');s.enemies[0].hp=1;s.enemies[0].evade=0;s.enemies[0].parry=0;s.enemies[0].block=0;
  const id=s.enemies[0].id;s.enemies[0].penetratedArmor={stacks:3,expiresAtTick:7};
  until(s,x=>x.wave===2);assert.ok(s.enemies.every(e=>e.id!==id&&!e.penetratedArmor));
  s.enemies[0].penetratedArmor={stacks:2,expiresAtTick:s.timing.ticks+7};
  const loaded=validateSave(clone(s));assert.equal(loaded.mode,'town');assert.deepEqual(loaded.enemies,[]);
  act(s,'retreat');assert.deepEqual(s.enemies,[]);act(s,'start');assert.ok(s.enemies.every(e=>!e.penetratedArmor));
});

test('family/save migration cannot silently promote starter or invalid explicit metadata',()=>{
  for(const bad of [null,'unknown','Rapier',{},[],4]){
    const s=createGame();s.equipment.weapon.name='普通・逐風刺劍';s.equipment.weapon.weaponFamily=bad;
    const loaded=validateSave(clone(s));assert.equal(loaded.equipment.weapon.weaponFamily,null);
    assert.equal(validateSave(clone(loaded)).equipment.weapon.weaponFamily,null);
    assert.equal(strike(enemy(),0,{...attack,crit:1},loaded.equipment.weapon).proc,undefined);
  }
  const starter=validateSave(createGame());assert.equal(starter.equipment.weapon.weaponFamily,null);
  const old=createGame();old.equipment.weapon.name='普通・逐風刺劍';old.equipment.weapon.quality='Average';
  const migrated=validateSave(old);assert.equal(migrated.equipment.weapon.weaponFamily,'rapier');
  assert.equal(validateSave(clone(migrated)).equipment.weapon.weaponFamily,'rapier');
  old.equipment.weapon.name='傳說中的普通・逐風刺劍改';assert.equal(validateSave(old).equipment.weapon.weaponFamily,null);
});

test('same-seed same-stat armored encounter has deterministic proc benefit without modifying shipped stages',()=>{
  function encounter(family){
    const s=createGame(42);s.equipment.weapon.weaponFamily=family;
    act(s,'start');s.wave=s.totalWaves;
    s.enemies=[{id:'controlled-armored-fixture',name:'test fixture',hp:1500,maxHp:1500,attack:0,mitigation:.8,defense:80,evade:0,parry:0,block:0,boss:true}];
    return s;
  }
  const finish=s=>until(s,x=>x.wins===1||x.mode==='defeat');
  const plainRun=finish(encounter(null)),rapierRun=finish(encounter('rapier'));
  assert.equal(plainRun.wins,1);assert.equal(rapierRun.wins,1);
  assert.ok(rapierRun.battle.elapsed<plainRun.battle.elapsed*.65);
  assert.ok(rapierRun.battle.actions.attacks<plainRun.battle.actions.attacks);
  assert.deepEqual(finish(encounter('rapier')),rapierRun);
  assert.deepEqual(finish(encounter(null)),plainRun);
});

test('proc and ordinary hit events remain bounded and preserve damage-then-proc order',()=>{
  const s=createGame(42);s.equipment.weapon.weaponFamily='rapier';s.equipment.weapon.stats.crit=1;
  act(s,'start');s.enemies=[{id:'events-fixture',name:'test fixture',hp:1e8,maxHp:1e8,attack:0,mitigation:.8,evade:0,parry:0,block:0}];
  until(s,x=>x.events.some(e=>e.type==='proc'));
  const index=s.events.findIndex(e=>e.type==='proc');assert.ok(index>0);assert.equal(s.events[index-1].type,'crit');
  assert.equal(s.events[index].target,'events-fixture');assert.equal(s.events[index].value,1);
  for(let n=0;n<1000;n++)advance(s,.1);
  assert.ok(s.events.length<=30);assert.ok(s.logs.length<=30);assert.ok(s.enemies[0].penetratedArmor.stacks<=3);
});
