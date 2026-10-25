import test from 'node:test';
import * as historicalV08 from './fixtures/v0.8/engine.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { generateItem } from '../src/loot.js';
import {
  createGame, act, advance, validateSave, previewStage, enemyDefenseView,
  resolveWeaponAttack, PENETRATED_ARMOR_RULES, CLUB_STUN_RULES,
} from '../src/engine.js';

const clone = value => JSON.parse(JSON.stringify(value));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const source = readFileSync(new URL('../src/engine.js',import.meta.url),'utf8');
const target = extra => ({hp:1e6,maxHp:1e6,defense:0,evade:0,parry:0,block:0,...extra});
const plain = {slot:'weapon',weaponFamily:null};
const families = [null,'axe','rapier','club'];
const near = (actual,expected,message) => assert.ok(Math.abs(actual-expected)<1e-12,`${message}: ${actual} != ${expected}`);
function freezeDeep(value) {
  if(value&&typeof value==='object'){Object.values(value).forEach(freezeDeep);Object.freeze(value);}
  return value;
}
function counted(value=.5) {
  let calls=0;return {rng:()=>{calls++;return value;},get calls(){return calls;}};
}
function battle(stage,seed=42) {
  const s=createGame(seed);s.stage=stage;s.unlocked=stage;act(s,'start');return s;
}
function nextWave(s) {
  const wave=s.wave;
  for(let n=0;n<10&&s.wave===wave&&!s.wins;n++) {
    for(const e of s.enemies.filter(e=>e.hp>0))Object.assign(e,{hp:1,defense:0,evade:0,parry:0,block:0,attack:0});
    s._clock=1.04;s._enemyClock=0;advance(s,.02);
  }
  assert.ok(s.wave!==wave||s.wins,'controlled kills must advance the actual live scheduler');
}
function descriptor(enemy,tick) {
  return Object.fromEntries(['name','boss','roleId','roleLabel','defense','evade','parry','block'].map(key=>[key,enemy[key]]).concat([['mitigation',enemyDefenseView(enemy,tick).baseMitigation]]));
}

test('v0.5 independent: all 120 live waves agree with the pure route, including names/order/counts and boss flags',()=>{
  let waves=0,enemies=0;
  for(let stage=1;stage<=30;stage++) {
    const route=previewStage(stage),s=battle(stage);
    assert.equal(route.stage,stage);assert.equal(route.waves.length,4);
    assert.equal(s.seed,42,'route creation and first spawn consume no random draw');
    for(const wave of route.waves) {
      assert.equal(s.wave,wave.wave);assert.equal(wave.boss,wave.wave===4);
      assert.equal(s.enemies.length,[1,2,2,1][wave.wave-1]);
      assert.deepEqual(s.enemies.map(e=>descriptor(e,s.timing.ticks)),wave.enemies);
      for(const e of s.enemies) {
        assert.equal(Object.hasOwn(e,'mitigation'),false,'preview mitigation must not shadow mutable defense');
        assert.equal(e.hp,Math.round((e.boss?340:114+wave.wave*15)*1.20**(stage-1)));
        assert.equal(e.maxHp,e.hp);
        assert.equal(e.attack,Math.round((e.boss?27:16+wave.wave)*1.16**(stage-1)*100)/100);
        assert.equal(e.resist,.04);enemies++;
      }
      waves++;nextWave(s);
    }
    assert.equal(s.wins,1);
  }
  assert.equal(waves,120);assert.equal(enemies,180);
});

test('v0.5 independent: role identity and arithmetic follow the declared adaptation, not random loot or power bonuses',()=>{
  const archetypes=['灰霧獵犬','碎晶甲蟲','荒野影獸','赤砂守衛'];
  const roles={baseline:{label:'均衡',offset:0,evade:.025,parry:.02},armored:{label:'厚甲',offset:18,evade:.01,parry:.01},agile:{label:'靈巧',offset:-3,evade:.10,parry:.07}};
  const seen=new Set();
  for(let stage=1;stage<=30;stage++)for(const wave of previewStage(stage).waves)for(const [i,e] of wave.enemies.entries()) {
    const index=(stage+wave.wave+i)%4;
    const roleId=stage<=2?'baseline':wave.boss?(stage%2?'armored':'agile'):['baseline','armored','agile','baseline'][index];
    const role=roles[roleId],defense=Math.max(0,Math.round((3+stage*1.3+(wave.boss?3:0)+role.offset)*100)/100);
    assert.equal(e.roleId,roleId);assert.equal(e.roleLabel,role.label);
    assert.equal(e.name,wave.boss?`裂隙守門者 · ${stage}`:archetypes[index]);
    assert.equal(e.defense,defense);near(e.mitigation,Math.min(.95,defense/100),'base mitigation');
    assert.equal(e.evade,role.evade);assert.equal(e.parry,role.parry);assert.equal(e.block,wave.boss?.06:.015);
    if(stage>=3)seen.add(roleId);
  }
  assert.deepEqual([...seen].sort(),['agile','armored','baseline']);
});

test('v0.5 independent: every stage from 3 includes both actionable defense roles without changing waves',()=>{
  for(let stage=3;stage<=30;stage++) {
    const roles=previewStage(stage).waves.flatMap(w=>w.enemies.map(e=>e.roleId));
    assert.ok(roles.includes('armored'),`stage ${stage} armor`);
    assert.ok(roles.includes('agile'),`stage ${stage} avoidance`);
    assert.equal(roles.length,6);
  }
});

test('v0.5 independent: preview sanitizes invalid stages without coercion or mutation',()=>{
  for(const input of [undefined,null,NaN,Infinity,-Infinity,'3',{},[],true,1n,Symbol('stage')]) {
    assert.deepEqual(previewStage(input),previewStage(1));
  }
  for(const [input,stage] of [[-100,1],[0,1],[1.99,1],[2.99,2],[29.9,29],[30,30],[31,30],[1e20,30]])assert.equal(previewStage(input).stage,stage);
  const hostile=Object.freeze({valueOf(){throw Error('do not coerce');}});
  assert.equal(previewStage(hostile).stage,1);
});

test('v0.5 independent: previews and defense views are RNG-free, deeply detached and safe with frozen input',()=>{
  const originalRandom=Math.random;Math.random=()=>{throw Error('pure display helpers cannot draw RNG');};
  try {
    const expected=previewStage(9),a=previewStage(9),b=previewStage(9);
    assert.notEqual(a,b);assert.notEqual(a.waves,b.waves);
    for(let n=0;n<4;n++){assert.notEqual(a.waves[n],b.waves[n]);assert.notEqual(a.waves[n].enemies[0],b.waves[n].enemies[0]);}
    a.stage=1;a.waves[0].enemies[0].defense=999;a.waves[1].enemies.push({});a.waves.pop();
    assert.deepEqual(previewStage(9),expected);assert.deepEqual(b,expected);
    const enemy=freezeDeep(target({defense:80,evade:.1,parry:.07,block:.06,penetratedArmor:{stacks:2,expiresAtTick:17},stun:{expiresAtTick:14}}));
    const before=clone(enemy),view=enemyDefenseView(enemy,10);view.mitigation=999;view.evade=999;
    assert.deepEqual(enemy,before);assert.equal(enemyDefenseView(enemy,10).mitigation,.4);assert.equal(enemyDefenseView(enemy,10).evade,0);
    for(let stage=1;stage<=30;stage++)previewStage(stage);
  } finally {Math.random=originalRandom;}
});

test('v0.5 independent: defense input sanitation and caps match the resolver without yielding NaN',()=>{
  const zero={baseMitigation:0,mitigation:0,baseEvade:0,evade:0,baseParry:0,parry:0,baseBlock:0,block:0,stunned:false};
  for(const enemy of [undefined,null,{},[],0,1,'enemy',false,1n,Symbol('enemy')])assert.deepEqual(enemyDefenseView(enemy,0),zero);
  for(const bad of [NaN,Infinity,-Infinity,'0.5',null,{},[]]) {
    const e=target({defense:80,mitigation:bad,evade:bad,parry:bad,block:bad});
    assert.deepEqual(enemyDefenseView(e,0),{...zero,baseMitigation:.8,mitigation:.8});
  }
  for(const [defense,mitigation] of [[-20,0],[0,0],[80,.8],[95,.95],[200,.95]]) {
    const e=target({defense,evade:2,parry:-1,block:4});
    assert.deepEqual(enemyDefenseView(e,0),{...zero,baseMitigation:mitigation,mitigation,baseEvade:1,evade:1,baseBlock:1,block:1});
  }
  assert.equal(enemyDefenseView(target({defense:80,mitigation:0}),0).mitigation,0);
  assert.equal(enemyDefenseView(target({defense:0,mitigation:2}),0).mitigation,.95);
  assert.equal(enemyDefenseView(target({defense:80,mitigation:-1}),0).mitigation,0);
});

test('v0.5 independent: changing a spawned enemy defense immediately changes display and actual damage',()=>{
  for(const stage of [1,3,12,30]) {
    const e=battle(stage).enemies[0];Object.assign(e,{hp:1e6,maxHp:1e6,evade:0,parry:0,block:0});
    for(const [defense,damage] of [[0,100],[80,20],[500,5]]) {
      e.defense=defense;
      near(enemyDefenseView(e,0).mitigation,1-damage/100,'mutable defense');
      assert.equal(resolveWeaponAttack({attack:100,crit:0},e,plain,0,()=>.5).damage,damage);
      assert.equal(e.defense,defense);
    }
    e.mitigation=.3;e.defense=0;
    assert.equal(enemyDefenseView(e,0).mitigation,.3,'explicit legitimate mitigation still takes precedence');
    assert.equal(resolveWeaponAttack({attack:100,crit:0},e,plain,0,()=>.5).damage,70);
  }
});

test('v0.5 independent: PA displays current general physical mitigation at 0–3 stacks and keeps specific mitigation separate',()=>{
  for(let stacks=0;stacks<=3;stacks++) {
    const e=target({defense:80,specificMit:.5,...(stacks?{penetratedArmor:{stacks,expiresAtTick:17}}:{})});
    const before=clone(e),view=enemyDefenseView(e,10);
    assert.equal(view.baseMitigation,.8);near(view.mitigation,.8*(1-.25*stacks),'PA relative reduction');
    assert.equal(resolveWeaponAttack({attack:100,crit:0},e,plain,10,()=>.5).damage,10+10*stacks);
    assert.equal(resolveWeaponAttack({attack:100,crit:0,skill:true},e,plain,10,()=>.5).damage,10+10*stacks);
    assert.equal(resolveWeaponAttack({attack:100,crit:0,void:true},e,plain,10,()=>.5).damage,20+20*stacks);
    assert.equal(resolveWeaponAttack({attack:100,crit:0,magical:true},e,plain,10,()=>.5).damage,10,'physical preview is not a claim that magic gets PA');
    assert.deepEqual(e,before);
  }
});

test('v0.5 independent: expired/malformed PA never leaks into the read-only current defense',()=>{
  for(const pa of [null,{},[],{stacks:0,expiresAtTick:17},{stacks:4,expiresAtTick:17},{stacks:1.5,expiresAtTick:17},{stacks:2,expiresAtTick:10},{stacks:2,expiresAtTick:18},{stacks:2,expiresAtTick:Infinity}]) {
    const e=target({defense:80,penetratedArmor:pa}),before=clone(e);
    assert.equal(enemyDefenseView(e,10).mitigation,.8);assert.deepEqual(clone(e),before,'view must not clean up owned status');
  }
  const e=freezeDeep(target({defense:80,penetratedArmor:{stacks:3,expiresAtTick:17}}));
  for(const tick of [undefined,null,-1,1.5,'10',NaN,Infinity,Number.MAX_SAFE_INTEGER,17,18])assert.equal(enemyDefenseView(e,tick).mitigation,.8);
  near(enemyDefenseView(e,16).mitigation,.2,'last active tick');
});

test('v0.5 independent: active stun bypasses only evade/parry; pending recovery restores avoidance and never suppresses block',()=>{
  const e=target({defense:50,evade:1,parry:1,block:0,stun:{expiresAtTick:14}});
  const active=enemyDefenseView(e,10);
  assert.deepEqual(active,{baseMitigation:.5,mitigation:.5,baseEvade:1,evade:0,baseParry:1,parry:0,baseBlock:0,block:0,stunned:true});
  const rng=counted();assert.equal(resolveWeaponAttack({attack:100,crit:0},clone(e),plain,10,rng.rng).damage,50);assert.equal(rng.calls,4);
  e.block=1;const blocked=resolveWeaponAttack({attack:100,crit:0},clone(e),plain,10,()=>.5);
  assert.equal(blocked.outcome,'block');assert.equal(enemyDefenseView(e,10).block,1);
  delete e.stun;e.stunRecoveryPending=true;
  assert.deepEqual(enemyDefenseView(e,14),{...active,evade:1,parry:1,baseBlock:1,block:1,stunned:false});
  assert.equal(resolveWeaponAttack({attack:100,crit:0},clone(e),plain,14,()=>.5).outcome,'evade');
  assert.equal(enemyDefenseView({...e,stunned:true},14).stunned,true,'explicit low-level resolver input is also represented');
});

test('v0.5 independent: PA and stun show different current/base rates while keeping the armored and agile source rates intact',()=>{
  for(const stage of [3,4,15,30])for(const wave of previewStage(stage).waves)for(const d of wave.enemies) {
    const e=target({...d,penetratedArmor:{stacks:3,expiresAtTick:17},stun:{expiresAtTick:14}}),before=clone(e),v=enemyDefenseView(e,10);
    near(v.baseMitigation,d.mitigation,'base role mitigation');near(v.mitigation,d.mitigation*.25,'current PA mitigation');
    assert.equal(v.baseEvade,d.evade);assert.equal(v.baseParry,d.parry);assert.equal(v.evade,0);assert.equal(v.parry,0);
    assert.equal(v.block,d.block);assert.deepEqual(e,before);
    delete e.stun;e.stunRecoveryPending=true;
    assert.equal(enemyDefenseView(e,14).evade,d.evade);assert.equal(enemyDefenseView(e,14).parry,d.parry);
  }
});

test('v0.5 independent: malformed, expired or dead-target stun cannot hide current avoidance or mutate its source',()=>{
  for(const stun of [null,{},[],{expiresAtTick:Infinity},{expiresAtTick:10},{expiresAtTick:15},{expiresAtTick:12.5}]) {
    const e=freezeDeep(target({evade:.1,parry:.07,block:.06,stun})),before=clone(e),view=enemyDefenseView(e,10);
    assert.equal(view.stunned,false);assert.equal(view.evade,.1);assert.equal(view.parry,.07);assert.equal(view.block,.06);assert.deepEqual(clone(e),before);
  }
  for(const hp of [0,-1,Infinity,NaN])assert.equal(enemyDefenseView(target({hp,evade:.1,stun:{expiresAtTick:14}}),10).evade,.1);
  for(const tick of [undefined,null,-1,1.5,'10',NaN,Infinity,Number.MAX_SAFE_INTEGER,14])assert.equal(enemyDefenseView(target({evade:.1,stun:{expiresAtTick:14}}),tick).evade,.1);
});

test('v0.5 independent: role metadata itself never changes damage, proc eligibility, or RNG consumption',()=>{
  for(const family of families)for(const attacker of [{attack:100,crit:0},{attack:100,crit:1,multiCrit:0},{attack:100,crit:0,skill:true},{attack:100,crit:0,magical:true}]) {
    const a=target({defense:40,evade:.1,parry:.07,block:.06}),b={...a,roleId:'armored',roleLabel:'厚甲'},ra=counted(.1),rb=counted(.1);
    const one=resolveWeaponAttack(attacker,a,{slot:'weapon',weaponFamily:family},10,ra.rng),two=resolveWeaponAttack(attacker,b,{slot:'weapon',weaponFamily:family},10,rb.rng);
    assert.deepEqual(one,two);assert.equal(ra.calls,rb.calls);delete b.roleId;delete b.roleLabel;assert.deepEqual(a,b);
  }
  assert.deepEqual(PENETRATED_ARMOR_RULES,{chance:.25,durationTicks:7,maxStacks:3,mitigationReductionPerStack:.25});
  assert.deepEqual(CLUB_STUN_RULES,{chance:.25,durationTicks:4});
});

test('v0.5 independent: unchanged combat stays byte-frozen; generator preserves accepted full outputs and RNG',()=>{
  // Frozen from accepted v0.5 engine 2afaaf2c… (loot af7eac11…). v0.6 intentionally
  // adds opt-in sale routing and strict import validation, not new combat/rolls.
  // Narrow unchanged regions replace the old whole-module/action/sanitizer freezes;
  // v06 acceptance still guards current behavior separately. The exact-clock
  // trajectories below are explicitly historical from v0.8.1 onward; current
  // v081 acceptance additionally freezes every engine byte outside advance.
  const region=(code,start,end)=>{const a=code.indexOf(start),b=end?code.indexOf(end,a):code.length;assert.ok(a>=0&&b>a);return code.slice(a,b);};
  // v0.8 adds the authorized axe wrapper/pulse and shared death transition.
  // Retain independently extracted EXACT v0.7 function bodies, not hashes of
  // changed candidate source. Provenance: 022-v07-publication-receipt,
  // engine b3104eca2e1bb43d67861c27f29c36d0e2c30e66260eba97158d0dfbff44737d.
  // New wrapper/pulse behavior is independently asserted in v08-acceptance.
  for(const [name,digest] of [
    ['resolveAttack','3861f61ecbb362d4b18c5341d7be9b49bcfb19b95d862c2714730e3d92e284cb'],
    ['enemyAttack','cbc1c928047f576c828a0e0dceb53f6660ec3264d08dca90d5270003806c50a6'],
    ['enemyTurn','d52ac2e7b95ec9c00691851d3a3716a66e3f05a93e12fcb29d6a882a969a1f0b'],
    ['recoverStunnedEnemies','3793f627724f1f5063ada2aa8133bb666fa0304b8ec072fbba06800a94eb33c8'],
    ['usePotion','f206089133516eacdb5c692b555de6909acd22326248522db65ab34c846be842'],
  ])assert.equal(sha256(region(source,`function ${name}(`,'\n}\n')+'\n}\n'),digest,name);
  assert.equal(sha256(region(source,'function gainXp','function win')),'b9ad55e991bff755212815b09077b4465992fe72ca51158ca12cd1129033aba4','unchanged XP/death rewards');
  // v0.7 shares arithmetic between random drops and the fixed commission.
  // These complete-output/RNG baselines were independently rerun against the
  // accepted v0.6 loot.js (5d3d97d8…); not new hashes of candidate source.
  for(const [initialSeed,callsExpected,finalSeed,digest] of [
    [1,8492,2999494445,'f5730fe72dc281e973aa97bde1e2301dffb1bd6d9b40ebb949a1e0be6e90d0bf'],
    [71,8540,4023059395,'083d70876765ccb7da8fb553630cc349153e9f72da2bec1f839a1ca5660b131f'],
    [1337,8437,2853276008,'66b53959c9195d1459e722143ff3b4547963ea08a17d8abbd49292f2c1bc8246'],
  ]) {
    let seed=initialSeed,calls=0;const rng=()=>{calls++;seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
    const hash=createHash('sha256');
    for(let i=0;i<1000;i++)hash.update(JSON.stringify(generateItem(rng,1+i%80,[undefined,'weapon','armor','accessory'][i%4]))+'\n');
    assert.equal(calls,callsExpected);assert.equal(seed,finalSeed);assert.equal(hash.digest('hex'),digest);
  }
  assert.equal(sha256(readFileSync(new URL('../src/session.js',import.meta.url))),'821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a');
});

// SHA-256 of every canonicalized state: before start, after start, then each 0.1 s.
// Captured using the actual accepted v0.4 engine, SHA-256 1f0f9ca3...d3b7b618.
// Only the two newly added display labels are omitted; numbers, RNG, loot,
// statuses, events, logs, clocks and player resources all remain in the digest.
const baselineRows = [
  [1,1,['eec266f94b6fc1e87cbe329b5eab783a7245ffa51e91dd7c7ee38223bdc6e6fc','b8059e6e2e88f80c5eaf97be92d6fa81b4c81a584c25ac4df64b1f11baa0a723','af2a5e19d7c35ae772de8a79ba7ccc5cece281c911bdbfba58805c3177c80661','d39c155a57b30e6c917bcac0ed095e0924a3b7b9e80c6e08c52a959e1b78899b']],
  [1,42,['df08766cc0f48c2f8c01fadf28b6eb47e4efae82f927e4899f71fff39e32705f','d2b1b602eff1297be9aa6661e11617597df7fc68cd88d79e6baba78a1ff8d30a','f2b12d6a23c86d314732163fbdbbbb94a6918ac81ece1e3af89bb0cec1e8041f','1fa270c6ddfeabff2a2aa3f5e96bd4a6af803c1e85d374df6a360e507e58d1b4']],
  [1,999,['2240bb9e2f34cedfc84dbd67ad0a33a3265f85fea4cd7d2175700407ec20dc5a','f2e52cd4b3b74d7779d8396b8bbb325aca468a56c13d31324b4fdf01cb243bf2','49d71a268eb2813ffdf0e4b7a5de1dcd04d38b360a048ce7a339040f8a645a89','f37749f4c77b696a100e2649123da1d5864a774b7c292af81d62791d55740804']],
  [2,1,['35040dec93db2b6fa17d1e2a9a8f3a6334f454e3b2034f348033a295539dfd28','de65fd474953378115e48fcf2167bbccb4dae74e517b57d3049009274b61d8d1','1087a354d1129c9cc892a1777db55c9de66515036ff467797f359e72a27b59fc','ed26d3f4644bef93f9a9bf3d80a8c9d18a3704ac5d703680fc4c1b786b4c31e0']],
  [2,42,['163c41aa4119fad11f381c6c89615a473059a235d7cd9b2713d3b2d732a8765a','a2c44b99bb89f6bd1bc4f4ea65a6ecb6e063c1189c39ef8ae514babd81ed8d24','ae53b7199e2c66d4d007563c2e43963fd3dc9c24876beefca887845e122bbffb','211a4d27541fb267ff54181e69370db2f7cbb6eb9d05863e1471a778cbd6bb6e']],
  [2,999,['5804636da8f43e9ac60b4d9c60a4e3c4e904bb331217740ebd88ec08cc6b1acb','3ed245e08bd6930de2717b5e205574fd523c3fddf614805ead8e8073561f08fa','8adbbabdfabcefd8774e167badbb83ea5bf7bbc225485a8f78aa8438bf228a75','c51be14a2457d7b1308205eb62d3cfe7a6c8804ddd14aa1711894e6cc87a15a3']],
];
function canonical(value) {
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).filter(key=>!['roleId','roleLabel'].includes(key)).sort().map(key=>[key,canonical(value[key])]));
  return value;
}
// The six axe hashes remain archived verbatim: v0.8 intentionally introduces
// axe bleed. All 18 non-axe digests below remain verbatim and executable against
// frozen v0.8 only: v0.8.1 intentionally corrects the clocks they include.
const archivedAxeV04Rows=baselineRows.map(([stage,seed,hashes])=>[stage,seed,hashes[1]]);
assert.equal(archivedAxeV04Rows.length,6);
for(const [stage,seed,hashes] of baselineRows)for(const [index,family] of families.entries()) {
  if(family==='axe')continue;
  test(`historical v0.4–v0.8 trajectory on frozen v0.8: stage ${stage}, seed ${seed}, family ${family??'none'}`,()=>{
    const s=historicalV08.createGame(seed);s.stage=stage;s.unlocked=stage;s.equipment.weapon.weaponFamily=family;
    const hash=createHash('sha256'),record=()=>hash.update(JSON.stringify(canonical(s))+'\n');
    record();historicalV08.act(s,'start');record();
    for(let n=0;n<20000&&s.mode==='battle'&&!s.wins;n++){historicalV08.advance(s,.1);record();}
    assert.equal(s.wins,1);assert.equal(hash.digest('hex'),hashes[index]);
  });
}

test('v0.5 independent: save v3 retains durable identity/progress and strips only untrusted or volatile role/combat fields',()=>{
  for(const family of families) {
    const s=validateSave(createGame(42));s.unlocked=12;s.stage=3;s.hero.gold=123;s.hero.xp=42;s.hero.proficiency=.72;
    s.kills=19;s.wins=2;s.battle.cleared=2;s.battle.bestTimes={1:31.6,2:40};s.strategy='sustain';s.autoAdvance=true;
    s.equipment.weapon.weaponFamily=family;act(s,'start');
    const durable=validateSave(clone(s));
    for(const e of s.enemies)Object.assign(e,{roleId:'untrusted-role',roleLabel:'<script>bad</script>',penetratedArmor:{stacks:3,expiresAtTick:7},stun:{expiresAtTick:4},stunRecoveryPending:true,stunRecoveryTurn:7});
    s.roleId='untrusted-root';s.routePreview=previewStage(30);s.equipment.weapon.roleId='untrusted-item';s.hero.roleId='untrusted-hero';
    const rejectedBytes=JSON.stringify(s);assert.throws(()=>validateSave(JSON.parse(rejectedBytes)));
    assert.equal(JSON.stringify(s),rejectedBytes,'rejecting unsupported item metadata must not rewrite source save');
    delete s.equipment.weapon.roleId;const bytes=JSON.stringify(s),loaded=validateSave(JSON.parse(bytes));
    assert.deepEqual(loaded,durable);assert.equal(JSON.stringify(s),bytes,'validation must not rewrite source save');
    assert.equal(loaded.mode,'town');assert.deepEqual(loaded.enemies,[]);assert.deepEqual(loaded.timing,{turns:0,ticks:0,tu:0});
    assert.equal(loaded.equipment.weapon.weaponFamily,family);assert.equal(loaded.hero.gold,123);assert.equal(loaded.hero.xp,42);
    assert.equal(loaded.stage,3);assert.equal(loaded.unlocked,12);assert.equal(loaded.strategy,'sustain');assert.equal(loaded.autoAdvance,true);
    assert.deepEqual(validateSave(clone(loaded)),loaded,'repeated compatible validation is idempotent');
  }
});

test('v0.5 independent: stable and candidate save/writer/preferences stay v3 and never share scope',()=>{
  const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
  const constants=ui.slice(ui.indexOf('const candidatePath ='),ui.indexOf('const $ ='));
  const keys=pathname=>runInNewContext(`${constants}\n({SAVE_KEY,LEGACY_SAVE_KEYS,PREF_KEY,LOCK_NAME})`,{location:{pathname}});
  const stable=keys('/play/hv-v3-dot/'),candidate=keys('/play/hv-v3-dot/candidates/v0.5/');
  for(const [actual,scope] of [[stable,'stable'],[candidate,'candidate-v0.5']]) {
    assert.equal(actual.SAVE_KEY,`hv-v3-dot-${scope}-save-v3`);assert.equal(actual.LOCK_NAME,`hv-v3-dot-${scope}-writer-v3`);
    assert.equal(actual.PREF_KEY,`hv-v3-dot-${scope}-preferences-v3`);
    assert.deepEqual(Array.from(actual.LEGACY_SAVE_KEYS),[`hv-v3-dot-${scope}-save-v2`,`hv-v3-dot-${scope}-save-v1`]);
  }
  assert.notEqual(stable.SAVE_KEY,candidate.SAVE_KEY);assert.notEqual(stable.LOCK_NAME,candidate.LOCK_NAME);
});
