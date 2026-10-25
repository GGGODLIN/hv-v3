import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  createGame, act, advance, stats, validateSave, previewStage, enemyDefenseView,
  resolveAttack, resolveWeaponAttack, MAX_STAGE,
} from '../src/engine.js';

const clone = value => JSON.parse(JSON.stringify(value));
const plain = {slot:'weapon',weaponFamily:null};
const basic = {attack:100,crit:0};
const round = value => Math.round(value * 100) / 100;
function finish(s) {
  const wins=s.wins;
  for(let n=0;n<20000&&s.mode==='battle'&&s.wins===wins;n++)advance(s,.1);
  assert.ok(s.wins>wins||s.mode==='defeat','fixture reaches a terminal result');
  return s;
}
function canonical(value) {
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value)
    .filter(key=>key!=='roleId'&&key!=='roleLabel').sort().map(key=>[key,canonical(value[key])]));
  return value;
}
const digest = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');

test('v0.5 stages 1–2 retain every prior state field and RNG result from our frozen v0.4',()=>{
  // Full-state canonical SHA-256 fixtures from our verified own v0.4 engine.
  // Only newly added display roleId/roleLabel are excluded; no numeric, event,
  // item, status, timing, or seed field is removed from either side.
  const fixtures=[
    [1,1,null,'2ca1c38b9cfb4eadc46f187276c635d91d6e1758bf89028a57217ca4f35dec0b'],
    [1,1,'rapier','c557ca017fcfc1a6e55d18c0fe45e9a0538c2b7f3bbccd7f2c846babaa397b33'],
    [1,1,'club','c2844da76e7ddd98faf05625c4efe6d126cb1ae3b7c7280d27d51fc936add31f'],
    [1,42,null,'94fd8ef1e79cbfdf02bc2715947734b43a578e7147fd19cdf794a4438dd023b0'],
    [1,42,'rapier','399bae29bc03dcd65877f3da47bda29e61b5a1f604dd31af43330e956e435098'],
    [1,42,'club','1d94029d1476f8a12e8449ed00ac223ab0d8c32001caab3a495474fd1f44bcdf'],
    [1,999,null,'3b58d03cdab85893fe0ba99668be1229a78391a5ba1f17c611360114a0f39836'],
    [1,999,'rapier','a2ff288c77d3b85c68221d286dcae88191dbf07380c72fed9a6a7e8300d49878'],
    [1,999,'club','5eecfda6eb933bd6e05496edba7d597208ec0fac56e11b10687238c1a4c88606'],
    [2,1,null,'c77e9e4363de94dbd9cab2b374f279b16384c255424f19476bea4d6ddebcd634'],
    [2,1,'rapier','0a7413e4cd49b7937b2e2e7f128132e86e7e73b1b5c8d3d3606a320c393d9a60'],
    [2,1,'club','3fd9cd906897282891c55e664b1b2230435aa4d4f2901afc5530041416faf493'],
    [2,42,null,'d3bddad815207593017d8160ea498d3a3c69801d46e2424b62bdaeb6a57d28b4'],
    [2,42,'rapier','cd4586c7b155813bf0ceccd686e24888db5cb16d5158ef5f7abb2dc189af18b6'],
    [2,42,'club','6451adcaf94542282e0ad85528839b4b06724314ae037a4517bc29b6dfad467e'],
    [2,999,null,'be2ccec1bf9637ee6d6be47248df67d4b517ed8041f7256c2187560c19dfd385'],
    [2,999,'rapier','d762aebca962ea96c2203382af85ac546b75c2465767a090bf80027adccc14b9'],
    [2,999,'club','8127e1aec5f89c81b3fa2bd7e5f6de5af5f48682932c17a21f1fac7983be6217'],
  ];
  for(const [stage,seed,family,expected] of fixtures){
    const s=createGame(seed);s.unlocked=stage;act(s,'selectStage',stage);
    s.equipment.weapon.weaponFamily=family;act(s,'start');finish(s);
    assert.equal(digest(s),expected,`stage ${stage}, seed ${seed}, family ${family}`);
  }
});

test('v0.5 preview preserves original four-wave names, counts and early defense values',()=>{
  const names=['灰霧獵犬','碎晶甲蟲','荒野影獸','赤砂守衛'];
  for(let stage=1;stage<=MAX_STAGE;stage++){
    const route=previewStage(stage);assert.equal(route.stage,stage);assert.equal(route.waves.length,4);
    assert.deepEqual(route.waves.map(wave=>wave.enemies.length),[1,2,2,1]);
    for(const wave of route.waves){
      assert.equal(wave.boss,wave.wave===4);
      for(const [i,enemy] of wave.enemies.entries()){
        assert.equal(enemy.name,wave.boss?`裂隙守門者 · ${stage}`:names[(stage+wave.wave+i)%4]);
        assert.equal(enemy.boss,wave.boss);assert.equal(enemy.block,wave.boss?.06:.015);
        if(stage<3){
          assert.equal(enemy.roleId,'baseline');assert.equal(enemy.roleLabel,'均衡');
          assert.equal(enemy.defense,round(3+stage*1.3+(wave.boss?3:0)));
          assert.equal(enemy.evade,.025);assert.equal(enemy.parry,.02);
        }
        assert.equal(enemy.mitigation,enemy.defense/100);
      }
    }
  }
});

test('v0.5 only the chosen two normal archetypes and alternating bosses change from stage 3',()=>{
  assert.deepEqual(previewStage(3).waves.map(w=>w.enemies.map(e=>e.roleId)),[
    ['baseline'],['armored','agile'],['agile','baseline'],['armored'],
  ]);
  assert.deepEqual(previewStage(4).waves.map(w=>w.enemies.map(e=>e.roleId)),[
    ['armored'],['agile','baseline'],['baseline','baseline'],['agile'],
  ]);
  for(let stage=3;stage<=MAX_STAGE;stage++)for(const wave of previewStage(stage).waves){
    for(const enemy of wave.enemies){
      const role=wave.boss?(stage%2?'armored':'agile'):enemy.name==='碎晶甲蟲'?'armored':enemy.name==='荒野影獸'?'agile':'baseline';
      const [offset,evade,parry,label]={baseline:[0,.025,.02,'均衡'],armored:[18,.01,.01,'厚甲'],agile:[-3,.10,.07,'靈巧']}[role];
      assert.equal(enemy.roleId,role);assert.equal(enemy.roleLabel,label);
      assert.equal(enemy.defense,Math.max(0,round(3+stage*1.3+(wave.boss?3:0)+offset)));
      assert.equal(enemy.evade,evade);assert.equal(enemy.parry,parry);
      assert.equal(enemy.block,wave.boss?.06:.015);
    }
  }
});

test('v0.5 preview is bounded, deterministic, detached and never consults RNG or game state',()=>{
  for(const invalid of [undefined,null,NaN,Infinity,-Infinity,-1,0,'3',{},[]])assert.equal(previewStage(invalid).stage,1);
  assert.equal(previewStage(3.9).stage,3);assert.equal(previewStage(999).stage,30);
  const s=createGame(42),before=clone(s),expected=previewStage(3),random=Math.random;
  try{Math.random=()=>{throw Error('preview must not draw RNG');};assert.deepEqual(previewStage(3),expected);}
  finally{Math.random=random;}
  const damaged=previewStage(3);damaged.waves[1].enemies[0].defense=999;damaged.waves[2].enemies.length=0;
  assert.deepEqual(previewStage(3),expected);assert.deepEqual(s,before);
});

test('v0.5 every live wave matches its shared preview without HP, attack, resist or RNG inflation',()=>{
  for(let stage=1;stage<=MAX_STAGE;stage++){
    const s=createGame(42);s.unlocked=stage;act(s,'selectStage',stage);const route=previewStage(stage);
    act(s,'start');assert.equal(s.seed,42,'enemy creation spends no random draws');
    for(const wave of route.waves){
      assert.equal(s.wave,wave.wave);assert.equal(s.enemies.length,wave.enemies.length);
      for(const [i,enemy] of s.enemies.entries()){
        const actual=Object.fromEntries(Object.keys(wave.enemies[i]).map(key=>[key,key==='mitigation'?enemyDefenseView(enemy,s.timing.ticks).baseMitigation:enemy[key]]));
        assert.deepEqual(actual,wave.enemies[i],`stage ${stage}, wave ${wave.wave}, enemy ${i}`);
        assert.equal(Object.hasOwn(enemy,'mitigation'),false,'defense remains authoritative fallback');
        assert.equal(enemy.hp,Math.round((wave.boss?340:114+wave.wave*15)*Math.pow(1.20,stage-1)));
        assert.equal(enemy.maxHp,enemy.hp);
        assert.equal(enemy.attack,round((wave.boss?27:16+wave.wave)*Math.pow(1.16,stage-1)));
        assert.equal(enemy.resist,.04);
      }
      // Force only the tested wave to end; the next wave is the unmodified factory.
      for(const enemy of s.enemies)Object.assign(enemy,{hp:1,attack:0,defense:0,evade:0,parry:0,block:0});
      for(let n=0;n<100&&s.wave===wave.wave&&!s.wins;n++)advance(s,.1);
      assert.ok(s.wave>wave.wave||s.wins===1);
    }
    assert.equal(s.kills,6);assert.equal(s.hero.gold,59+17*stage,'kill/clear gold formulas are unchanged');
  }
});

test('v0.5 defense view is read-only and shows only active PA/stun reductions',()=>{
  const source={...previewStage(3).waves[1].enemies[1],hp:1000};delete source.mitigation;
  source.penetratedArmor={stacks:2,expiresAtTick:17};source.stun={expiresAtTick:14};
  const before=clone(source),view=enemyDefenseView(source,10);
  assert.deepEqual(view,{baseMitigation:.039,mitigation:.0195,baseEvade:.10,evade:0,baseParry:.07,parry:0,baseBlock:.015,block:.015,stunned:true});
  assert.deepEqual(source,before);
  view.mitigation=1;view.evade=1;assert.deepEqual(source,before);
  assert.equal(enemyDefenseView(source,14).stunned,false);assert.equal(enemyDefenseView(source,14).evade,.10);
  assert.equal(enemyDefenseView(source,14).mitigation,.0195);
  assert.equal(enemyDefenseView(source,17).mitigation,.039);
  source.stunRecoveryPending=true;
  assert.equal(enemyDefenseView(source,14).stunned,false,'owed recovery is not active stun');
  assert.equal(enemyDefenseView(source,14).parry,.07);
  for(const tick of [-1,NaN,Infinity,Number.MAX_SAFE_INTEGER]){
    const current=enemyDefenseView(source,tick);assert.equal(current.mitigation,.039);assert.equal(current.evade,.10);
  }
});

test('v0.5 defense overrides and invalid inputs retain the established resolver semantics',()=>{
  const s=createGame(1);s.unlocked=3;act(s,'selectStage',3);act(s,'start');
  const enemy=s.enemies[0];enemy.defense=80;
  assert.equal(enemyDefenseView(enemy,0).baseMitigation,.8);
  assert.equal(resolveWeaponAttack(basic,enemy,plain,0,()=>.5).damage,20);
  enemy.mitigation=.3;
  assert.equal(enemyDefenseView(enemy,0).baseMitigation,.3,'explicit mitigation remains the existing override');
  assert.equal(resolveWeaponAttack(basic,enemy,plain,0,()=>.5).damage,70);
  enemy.mitigation=NaN;assert.equal(enemyDefenseView(enemy,0).baseMitigation,.8);
  assert.deepEqual(enemyDefenseView(null,0),{baseMitigation:0,mitigation:0,baseEvade:0,evade:0,baseParry:0,parry:0,baseBlock:0,block:0,stunned:false});
  const malformed=enemyDefenseView({defense:Infinity,evade:Infinity,parry:-1,block:2,stun:{expiresAtTick:4}},0);
  assert.equal(malformed.mitigation,0);assert.equal(malformed.evade,0);assert.equal(malformed.parry,0);assert.equal(malformed.block,1);assert.equal(malformed.stunned,false);
});

test('v0.5 role defense views agree with existing PA/stun resolver without new gates',()=>{
  const roles=previewStage(3).waves[1].enemies;
  for(const descriptor of roles)for(const status of [{},{penetratedArmor:{stacks:2,expiresAtTick:17}},{stun:{expiresAtTick:14}},{penetratedArmor:{stacks:2,expiresAtTick:17},stun:{expiresAtTick:14}}]){
    const enemy={...descriptor,...status,hp:10000};delete enemy.mitigation;
    const view=enemyDefenseView(enemy,10),result=resolveWeaponAttack(basic,enemy,plain,10,()=>.5);
    const expected=resolveAttack(basic,{...enemy,mitigation:view.mitigation,stunned:view.stunned},()=>.5);
    assert.deepEqual(result,expected);
    assert.deepEqual(result.trace,['Whiff','Absorb','Evade','Parry','Block','Resist','MultiCrit','Mitigation','DamageRoll']);
  }
  const armor={...roles[0],hp:10000};delete armor.mitigation;
  const damages=[0,1,2,3].map(stacks=>{
    if(stacks)armor.penetratedArmor={stacks,expiresAtTick:17};
    return resolveWeaponAttack(basic,armor,plain,10,()=>.5).damage;
  });
  assert.deepEqual(damages,[75,81,87,93],'PA changes existing mitigation relatively, never adds flat damage');
  const agile={...roles[1],hp:10000};delete agile.mitigation;
  assert.equal(resolveWeaponAttack(basic,agile,plain,10,()=>.05).outcome,'evade');
  agile.stun={expiresAtTick:14};assert.ok(resolveWeaponAttack(basic,agile,plain,10,()=>.05).damage>0);
  agile.block=1;assert.equal(resolveWeaponAttack(basic,agile,plain,10,()=>.05).outcome,'block');
});

test('v0.5 saves restore progress but never import encounter roles or role-like equipment overrides',()=>{
  const s=createGame(42);s.unlocked=4;act(s,'selectStage',4);act(s,'start');advance(s,1.1);
  const raw=clone(s);raw.roleId='agile';raw.roleLabel='spoof';raw.equipment.weapon.roleId='armored';
  raw.enemies[0].roleId='spoof';raw.enemies[0].defense=1e6;raw.enemies[0].stunRecoveryPending=true;
  const before=clone(raw);assert.throws(()=>validateSave(raw));assert.deepEqual(raw,before,'unsupported item extension must not be stripped or rewrite the input');
  delete raw.equipment.weapon.roleId;const restored=validateSave(raw);
  assert.equal(restored.version,1);assert.equal(restored.mode,'town');assert.deepEqual(restored.enemies,[]);
  assert.equal(restored.roleId,undefined);assert.equal(restored.equipment.weapon.roleId,undefined);
  assert.equal(restored.hero.gold,s.hero.gold);assert.equal(restored.stage,4);assert.equal(restored.seed,s.seed);
  assert.equal(restored.hero.hp,stats(restored).maxHp);
  act(restored,'start');assert.equal(restored.enemies[0].roleId,'armored');assert.equal(restored.enemies[0].defense,26.2);
  assert.equal(restored.enemies[0].stunRecoveryPending,undefined);
});

test('v0.5 six genuine starter/equip/replay journeys clear stages 3–5 without fixture stats',()=>{
  for(const seed of [1,2,3,42,123,999]){
    const s=createGame(seed);act(s,'start');finish(s);assert.equal(s.wins,1);
    act(s,'retreat');
    const weapon=s.inventory.filter(item=>item.slot==='weapon').sort((a,b)=>(b.stats.attack||0)-(a.stats.attack||0))[0];
    assert.ok(weapon);act(s,'equip',weapon.id);
    // Keep that one genuinely earned weapon. No later auto-equip, stat grants,
    // manual potions, direct unlocks, enemy replacements, or reward changes.
    for(const stage of [1,2,3,4,5]){
      act(s,'retreat');act(s,'selectStage',stage);assert.equal(s.stage,stage);
      const wins=s.wins;act(s,'start');const replay=clone(s);finish(s);finish(replay);
      assert.equal(s.wins,wins+1,`seed ${seed} clears stage ${stage}`);
      assert.deepEqual(s,replay,'the whole encounter is deterministic');
      assert.ok(s.battle.elapsed<90);assert.equal(s.potions,3);
      assert.equal(s.equipment.weapon.id,weapon.id);
    }
  }
});
