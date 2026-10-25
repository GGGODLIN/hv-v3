import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createGame, act, advance, stats, validateSave, resolveAttack, resolveWeaponAttack,
  penetratedArmorStatus, PENETRATED_ARMOR_RULES,
} from '../src/engine.js';
import { generateItem, resolveWeaponFamily, scoreItem } from '../src/loot.js';
import { loadVersionedSave } from '../src/session.js';
import { runInNewContext } from 'node:vm';

const clone = value => JSON.parse(JSON.stringify(value));
const rapier = {slot:'weapon',weaponFamily:'rapier'};
const basic = {attack:100,crit:0};
const target = extra => ({hp:10000,maxHp:10000,mitigation:.5,...extra});
const fullTrace = ['Whiff','Absorb','Evade','Parry','Block','Resist','MultiCrit','Mitigation','DamageRoll'];
function counted(values=[], fallback=.5) {
  let calls=0;
  const rng=()=>{const value=values[calls]??fallback;calls++;return value;};
  return {rng,get calls(){return calls;}};
}
const basicDraws = proc => [...Array(8).fill(.5),proc];
function activeTarget(stacks=1,tick=10,extra={}) {
  return target({penetratedArmor:{stacks,expiresAtTick:tick+7},...extra});
}

test('v0.3 independent: PA rules explicitly pin the historical model and chosen clock',()=>{
  assert.deepEqual(PENETRATED_ARMOR_RULES,{chance:.25,durationTicks:7,maxStacks:3,mitigationReductionPerStack:.25});
  assert.equal(Object.isFrozen(PENETRATED_ARMOR_RULES),true);
});
test('v0.3 independent: proc follows damage; each stack changes general mitigation relatively',()=>{
  const enemy=target(), damages=[];
  for(let tick=10;tick<=13;tick++) {
    const r=resolveWeaponAttack(basic,enemy,rapier,tick,counted(basicDraws(.1)).rng);
    damages.push(r.damage);assert.deepEqual(r.trace,fullTrace);
    assert.equal(r.proc.stacks,Math.min(3,tick-9));
  }
  assert.deepEqual(damages,[50,62,75,87]);
  assert.equal(enemy.mitigation,.5,'base defense is never rewritten');
  assert.deepEqual(enemy.penetratedArmor,{stacks:3,expiresAtTick:20});
});
test('v0.3 independent: 25% boundary is strict and critical guarantee costs no extra roll',()=>{
  for(const [roll,procs] of [[0,true],[.249999,true],[.25,false],[.999999,false]]) {
    const enemy=target(), draws=counted(basicDraws(roll));
    const r=resolveWeaponAttack(basic,enemy,rapier,10,draws.rng);
    assert.equal(Boolean(r.proc),procs);assert.equal(draws.calls,9);
  }
  const critical={...basic,crit:1,multiCrit:0}, a=counted(),b=counted();
  const baseline=resolveAttack(critical,target(),a.rng);
  const result=resolveWeaponAttack(critical,target(),rapier,10,b.rng);
  assert.equal(result.crit,1);assert.ok(result.proc);
  assert.equal(result.damage,baseline.damage);assert.equal(b.calls,a.calls);
});
test('v0.3 independent: partial evade may proc but still suppresses critical',()=>{
  const draws=counted([.1,.9,.9,.9,.9,.9,.5,.1]);
  const r=resolveWeaponAttack({...basic,crit:1},target({evade:.5}),rapier,10,draws.rng);
  assert.equal(r.damage,25);assert.equal(r.crit,0);assert.ok(r.proc);assert.equal(draws.calls,8);
});
test('v0.3 independent: misses, zero damage, lethal/dead targets cannot proc or draw proc RNG',()=>{
  const cases=[
    [{...basic,whiff:1},target()], [basic,target({evade:1})],
    [basic,target({parry:1})], [basic,target({block:1})],
    [{...basic,attack:0},target()], [basic,target({hp:40})],
    [basic,target({hp:0})], [basic,target({hp:Infinity})],
  ];
  for(const [attacker,enemy] of cases) {
    const a=counted([],0),b=counted([],0);
    const expected=resolveAttack(attacker,clone(enemy),a.rng);
    const result=resolveWeaponAttack(attacker,enemy,rapier,10,b.rng);
    assert.equal(result.proc,undefined);assert.equal(enemy.penetratedArmor,undefined);
    assert.equal(result.damage,expected.damage);assert.equal(b.calls,a.calls);
  }
});
test('v0.3 independent: skills benefit from existing PA but never create or refresh it',()=>{
  const enemy=activeTarget(2),before=clone(enemy.penetratedArmor),draws=counted();
  const result=resolveWeaponAttack({...basic,skill:true,crit:1,multiCrit:0},enemy,rapier,10,draws.rng);
  assert.equal(result.damage,112);assert.equal(result.proc,undefined);
  assert.deepEqual(enemy.penetratedArmor,before);assert.equal(draws.calls,5);
  const clean=target();resolveWeaponAttack({...basic,skill:true,crit:1,multiCrit:0},clean,rapier,10,()=>.5);
  assert.equal(clean.penetratedArmor,undefined);
});
test('v0.3 independent: magic does not benefit or proc; Void still respects general mitigation',()=>{
  const magical={...basic,magical:true},enemy=activeTarget(3,10,{specificMit:.5});
  const a=counted(),b=counted();
  assert.deepEqual(resolveWeaponAttack(magical,enemy,rapier,10,a.rng),resolveAttack(magical,target({specificMit:.5}),b.rng));
  assert.equal(a.calls,b.calls);
  const physical=resolveWeaponAttack(basic,enemy,{slot:'weapon',weaponFamily:'axe'},10,()=>.5);
  const voidHit=resolveWeaponAttack({...basic,void:true},enemy,{slot:'weapon',weaponFamily:'axe'},10,()=>.5);
  assert.equal(physical.damage,43);assert.equal(voidHit.damage,87);
});
test('v0.3 independent: all 41 damage dice and avoidance/crit order survive existing PA',()=>{
  for(let n=0;n<41;n++) {
    const enemy=activeTarget(2,10,{specificMit:.25});
    const draws=[.9,.9,.1,.9,.1,.9,.1,.9,(n+.1)/41];
    const attacker={attack:100,crit:1,multiCrit:0};
    enemy.parry=.5;enemy.block=.5;
    const actual=resolveWeaponAttack(attacker,enemy,{slot:'weapon',weaponFamily:'club'},10,counted(draws).rng);
    const expected=resolveAttack(attacker,{...enemy,mitigation:.25},counted(draws).rng);
    assert.deepEqual(actual,expected);assert.equal(actual.crit,1);assert.deepEqual(actual.trace,fullTrace);
  }
});
test('v0.3 independent: nonrapier families and unresolved identity preserve the full RNG stream',()=>{
  for(const weapon of [null,{}, {slot:'weapon'}, {slot:'weapon',weaponFamily:'axe'},
    {slot:'weapon',weaponFamily:'club'}, {slot:'armor',weaponFamily:'rapier'},
    {slot:'weapon',weaponFamily:'unknown',name:'普通・逐風刺劍'}]) {
    for(const attacker of [basic,{...basic,crit:1,multiCrit:0}]) {
      const a=counted([],0),b=counted([],0),enemy=target();
      assert.deepEqual(resolveWeaponAttack(attacker,enemy,weapon,10,a.rng),resolveAttack(attacker,target(),b.rng));
      assert.equal(a.calls,b.calls);assert.equal(enemy.penetratedArmor,undefined);
    }
  }
});
test('v0.3 independent: seven simulation ticks expire before exact-boundary damage',()=>{
  const enemy=target();resolveWeaponAttack(basic,enemy,rapier,10,counted(basicDraws(.1)).rng);
  assert.deepEqual(penetratedArmorStatus(enemy,10),{stacks:1,ticksRemaining:7,mitigationMultiplier:.75});
  assert.equal(penetratedArmorStatus(enemy,16).ticksRemaining,1);
  const result=resolveWeaponAttack(basic,enemy,{slot:'weapon',weaponFamily:'axe'},17,()=>.5);
  assert.equal(result.damage,50);assert.equal(penetratedArmorStatus(enemy,17),null);assert.equal(enemy.penetratedArmor,undefined);
});
test('v0.3 independent: lethal damage uses existing PA then clears it without another proc roll',()=>{
  const enemy=activeTarget(2,10,{hp:75}),draws=counted();
  const result=resolveWeaponAttack(basic,enemy,rapier,10,draws.rng);
  assert.equal(result.damage,75);assert.equal(result.proc,undefined);
  assert.equal(enemy.penetratedArmor,undefined);assert.equal(draws.calls,8);
});
test('v0.3 independent: bounded status never transfers to a different target',()=>{
  const a=target(),b=target();resolveWeaponAttack(basic,a,rapier,10,counted(basicDraws(.1)).rng);
  assert.equal(penetratedArmorStatus(a,10).stacks,1);assert.equal(penetratedArmorStatus(b,10),null);
  for(const status of [{stacks:0,expiresAtTick:17},{stacks:4,expiresAtTick:17},{stacks:1.5,expiresAtTick:17},
    {stacks:1,expiresAtTick:18},{stacks:1,expiresAtTick:10},{stacks:1,expiresAtTick:Infinity}]) {
    assert.equal(penetratedArmorStatus({penetratedArmor:status},10),null);
  }
});
test('v0.3 independent: relative reduction has no benefit against zero armor and clamps base defense first',()=>{
  for(const mitigation of [0,.2,.8,.95,2]) {
    const enemy=activeTarget(3,10,{mitigation});
    const expected=Math.floor(100*(1-Math.min(.95,mitigation)*.25)+1e-9);
    assert.equal(resolveWeaponAttack(basic,enemy,{slot:'weapon',weaponFamily:'axe'},10,()=>.5).damage,expected);
  }
  assert.equal(resolveWeaponAttack(basic,activeTarget(2,10,{mitigation:undefined,defense:80}),{},10,()=>.5).damage,60);
});
test('v0.3 independent: same-stat controlled encounter proves stack advantage, not free damage',()=>{
  function duel(weapon,mitigation) {
    const enemy=target({hp:400,maxHp:400,mitigation});let turns=0;
    while(enemy.hp>0&&turns<100) {
      const result=resolveWeaponAttack(basic,enemy,weapon,turns,counted(basicDraws(.1)).rng);
      enemy.hp=Math.max(0,enemy.hp-result.damage);turns++;
    }
    return turns;
  }
  assert.equal(duel(rapier,.8),7);assert.equal(duel({slot:'weapon',weaponFamily:'club'},.8),20);
  assert.equal(duel(rapier,0),4);assert.equal(duel({slot:'weapon',weaponFamily:'club'},0),4);
});
test('v0.3 independent: weapon identity changes neither sheet stats nor scalar score',()=>{
  const s=createGame(42),sheet=stats(s),resource=clone(s.hero),score=scoreItem(s.equipment.weapon);
  for(const weaponFamily of ['rapier','axe','club','unknown']) {
    s.equipment.weapon.weaponFamily=weaponFamily;
    assert.deepEqual(stats(s),sheet);assert.deepEqual(s.hero,resource);assert.equal(scoreItem(s.equipment.weapon),score);
  }
});
test('v0.3 independent: legacy name migration is exact and invalid explicit identity stays inert',()=>{
  for(const [name,family] of [['粗製・逐風刺劍','rapier'],['普通・逐風刺劍','rapier'],
    ['優良・銳意逐風刺劍・平衡','rapier'],['傳奇・銳意暮鋼戰斧・屠戮','axe'],['尚可・裂岩戰棍','club']]) {
    assert.equal(resolveWeaponFamily({slot:'weapon',name}),family,name);
  }
  for(const name of ['逐風刺劍','普通・逐風刺劍 ',' 普通・逐風刺劍','自訂普通・逐風刺劍',
    '粗製・銳意逐風刺劍','優良・逐風刺劍','傳奇・逐風刺劍・平衡','普通・暮鋼戰斧・平衡','普通・逐風刺劍・未知']) {
    assert.equal(resolveWeaponFamily({slot:'weapon',name}),null,name);
  }
  for(const weaponFamily of [null,'unknown','RAPIER',0,{},'__proto__']) {
    assert.equal(resolveWeaponFamily({slot:'weapon',name:'普通・逐風刺劍',weaponFamily}),null);
  }
  assert.equal(resolveWeaponFamily({slot:'armor',name:'普通・逐風刺劍',weaponFamily:'rapier'}),null);
});
test('v0.3 independent: generated weapon identity survives save normalization without numeric changes',()=>{
  let seed=123;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const seen=new Set();
  for(let n=0;n<90;n++) {
    const item=generateItem(rng,3,'weapon');item.id=`acceptance-${n}`;seen.add(item.weaponFamily);
    const s=createGame(42);s.inventory=[item];const saved=validateSave(clone(s));
    assert.equal(saved.inventory[0].weaponFamily,item.weaponFamily);
    assert.deepEqual(saved.inventory[0].stats,item.stats);assert.equal(saved.inventory[0].power,item.power);
    const legacy=clone(item);delete legacy.weaponFamily;
    assert.equal(resolveWeaponFamily(legacy),item.weaponFamily);
  }
  assert.deepEqual([...seen].sort(),['axe','club','rapier']);
});
test('v0.3 independent: unknown identity cannot turn into inferred rapier across repeated reload',()=>{
  const s=createGame(42);Object.assign(s.equipment.weapon,{name:'普通・逐風刺劍',weaponFamily:'future-family'});
  let restored=validateSave(clone(s));
  for(let n=0;n<3;n++) {
    assert.equal(resolveWeaponFamily(restored.equipment.weapon),null);
    restored=validateSave(clone(restored));
  }
});
test('v0.3 independent: reload returns to camp, retaining identity/progress but not enemy proc or rewards',()=>{
  const s=createGame(42);s.equipment.weapon.weaponFamily='rapier';s.hero.gold=123;s.hero.xp=42;
  act(s,'start');s.enemies[0].penetratedArmor={stacks:3,expiresAtTick:7};
  const restored=validateSave(clone(s));
  assert.equal(restored.equipment.weapon.weaponFamily,'rapier');assert.equal(restored.hero.gold,123);
  assert.equal(restored.hero.xp,42);assert.equal(restored.mode,'town');assert.deepEqual(restored.enemies,[]);
  assert.equal(restored.timing.ticks,0);assert.equal(restored.battle.actions.attacks,0);
  act(restored,'start');assert.ok(restored.enemies.every(enemy=>!enemy.penetratedArmor));
  restored.enemies[0].penetratedArmor={stacks:3,expiresAtTick:7};act(restored,'retreat');act(restored,'start');
  assert.ok(restored.enemies.every(enemy=>!enemy.penetratedArmor));
});
test('v0.3 independent: simulation ticks clean stale armor even without a player attack',()=>{
  const s=createGame(42);act(s,'start');s.timing.tu=699;s.timing.ticks=6;s._clock=0;
  s.enemies[0].penetratedArmor={stacks:3,expiresAtTick:7};
  advance(s,.02);assert.equal(s.timing.ticks,7);assert.equal(s.timing.turns,0);
  assert.equal(s.enemies[0].penetratedArmor,undefined);
});
test('v0.3 independent: new wave, repeated expedition and defeat recovery never reuse enemy status',()=>{
  const s=createGame(42);act(s,'start');s.enemies[0].hp=1;s.enemies[0].evade=0;s.enemies[0].parry=0;s.enemies[0].block=0;
  s.enemies[0].penetratedArmor={stacks:3,expiresAtTick:7};advance(s,1.1);
  assert.equal(s.wave,2);assert.ok(s.enemies.every(enemy=>!enemy.penetratedArmor));
  s.hero.hp=1;s.enemies.forEach(enemy=>{enemy.attack=99999;enemy.penetratedArmor={stacks:2,expiresAtTick:s.timing.ticks+7};});
  for(let n=0;n<10&&s.mode==='battle';n++)advance(s,1);
  assert.equal(s.mode,'defeat');act(s,'retreat');act(s,'start');assert.ok(s.enemies.every(enemy=>!enemy.penetratedArmor));
});
test('v0.3 independent: actual battle emits damage before proc with the same target',()=>{
  const s=createGame(42);s.equipment.weapon.weaponFamily='rapier';s.equipment.weapon.stats.crit=.8;
  act(s,'start');s.enemies=[{id:'qa-target',name:'QA target',hp:100000,maxHp:100000,attack:0,defense:80,evade:0,parry:0,block:0}];
  for(let n=0;n<100&&!s.events.some(event=>event.type==='proc');n++)advance(s,.1);
  const i=s.events.findIndex(event=>event.type==='proc');assert.ok(i>0);
  assert.ok(['hit','crit'].includes(s.events[i-1].type));assert.equal(s.events[i-1].target,'qa-target');
  assert.equal(s.events[i].target,'qa-target');assert.equal(s.events[i].value,1);
});
test('v0.3 independent: original starter seeded signatures remain unchanged without rapier',()=>{
  for(const [seed,finalSeed,itemCount] of [[1,2209033545,2],[42,3839731728,1],[999,876178866,1]]) {
    const s=createGame(seed);act(s,'start');
    for(let n=0;n<2400&&s.mode==='battle'&&!s.wins;n++)advance(s,.1);
    assert.equal(s.wins,1);assert.equal(Number(s.battle.elapsed.toFixed(1)),31.6);
    assert.equal(s.seed,finalSeed);assert.equal(s.inventory.length,itemCount);assert.equal(s.hero.gold,76);
    assert.equal(s.hero.level,2);assert.equal(s.hero.xp,6);assert.equal(s.timing.turns,30);
  }
});

// The UI assertions below are source contracts, NOT browser rendering acceptance.
test('v0.3 integration: item comparison discloses score limitations and names the proc',()=>{
  const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
  assert.match(ui,/describeWeaponTrait/);assert.match(ui,/穿透護甲/);
  assert.match(ui,/(?:分數|評分)[^\n]{0,100}(未計|不含|不計)/);
  assert.match(ui,/penetratedArmorStatus/);
});
test('v0.3 integration: stable and candidate saves, locks, and preferences are isolated from v0.2',()=>{
  const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
  const constants=ui.slice(ui.indexOf('const candidatePath ='),ui.indexOf('const $ ='));
  const keys=pathname=>runInNewContext(`${constants}\n({SAVE_KEY,LEGACY_SAVE_KEYS,PREF_KEY,LOCK_NAME})`,{location:{pathname}});
  const stable=keys('/play/hv-v3-dot/'),candidate=keys('/play/hv-v3-dot/candidates/v03-qa/');
  assert.equal(stable.SAVE_KEY,'hv-v3-dot-stable-save-v3');
  assert.equal(stable.LOCK_NAME,'hv-v3-dot-stable-writer-v3');
  assert.equal(stable.PREF_KEY,'hv-v3-dot-stable-preferences-v3');
  assert.deepEqual(Array.from(stable.LEGACY_SAVE_KEYS),['hv-v3-dot-stable-save-v2','hv-v3-dot-stable-save-v1']);
  assert.equal(candidate.SAVE_KEY,'hv-v3-dot-candidate-v03-qa-save-v3');
  assert.equal(candidate.LOCK_NAME,'hv-v3-dot-candidate-v03-qa-writer-v3');
  assert.equal(candidate.PREF_KEY,'hv-v3-dot-candidate-v03-qa-preferences-v3');
  assert.ok(candidate.LEGACY_SAVE_KEYS.every(key=>key.includes('candidate-v03-qa')));
  assert.doesNotMatch(ui,/writeStorage\(LEGACY_SAVE_KEYS|removeItem\(/);
  assert.match(ui,/legacyKeys: LEGACY_SAVE_KEYS/);
});
test('v0.3 independent: old timeline writes cannot erase explicit unknown identity in the migrated save',()=>{
  const legacy=createGame(42);Object.assign(legacy.equipment.weapon,{name:'普通・逐風刺劍',weaponFamily:'future-family'});
  const v2=JSON.stringify(legacy),v1=JSON.stringify(createGame(1));
  const data=new Map([['v2',v2],['v1',v1]]);
  const load=()=>loadVersionedSave({read:key=>data.get(key)??null,currentKey:'v3',legacyKeys:['v2','v1'],validate:validateSave,create:createGame});
  const migrated=load();assert.equal(migrated.migrated,true);assert.equal(resolveWeaponFamily(migrated.state.equipment.weapon),null);
  assert.equal(data.get('v2'),v2);assert.equal(data.get('v1'),v1);
  migrated.state.hero.gold=456;data.set('v3',JSON.stringify(migrated.state));
  // Models the observed old validator omission; actual pinned v0.2 source is
  // separately exercised in the audit evidence, not imported into production.
  delete legacy.equipment.weapon.weaponFamily;legacy.hero.gold=999;data.set('v2',JSON.stringify(legacy));
  const current=load();assert.equal(current.migrated,false);assert.equal(current.state.hero.gold,456);
  assert.equal(resolveWeaponFamily(current.state.equipment.weapon),null);assert.equal(data.get('v1'),v1);
});
test('v0.3 independent: malformed current save never falls through to otherwise valid older progress',()=>{
  for(const raw of ['', '{bad', 'null', '{"version":99}']) {
    const older=JSON.stringify(createGame(42)),reads=[];
    const data=new Map([['v3',raw],['v2',older],['v1',older]]),before=[...data];
    const result=loadVersionedSave({read:key=>{reads.push(key);return data.get(key)??null;},currentKey:'v3',legacyKeys:['v2','v1'],validate:validateSave,create:createGame});
    assert.equal(result.error,true);assert.equal(result.migrated,false);assert.equal(result.raw,raw);
    assert.deepEqual(reads,['v3']);assert.deepEqual([...data],before);
  }
});
