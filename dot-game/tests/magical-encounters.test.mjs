import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,advance,stats,previewStage,enemyAttackView,playerMagicDefenseView,resolveAttack,resolveWeaponAttack,validateSave,protectionView,counterattackView} from '../src/engine.js';
const copy=structuredClone;
const sequence=(values=[],fallback=.99)=>{let calls=0;return {rng:()=>values[calls++]??fallback,get calls(){return calls;}};};
function fixture(seed=42){const s=createGame(seed);s.stage=5;s.unlocked=5;act(s,'start');s.enemies=[{id:'caster',name:'赤砂守衛',hp:1e6,maxHp:1e6,attack:30,defense:0,evade:0,parry:0,block:0,attackPattern:'alternating'}];return s;}
function incoming(s){s._clock=-100;s._enemyClock=1.9;advance(s,.001);}
function player(s){s._clock=1.05;s._enemyClock=-100;advance(s,.001);}

test('only later-route nonboss sand guards alternate; preview is detached and pure',()=>{
  for(let stage=1;stage<=30;stage++){
    const route=previewStage(stage),before=copy(route);
    for(const wave of route.waves)for(const enemy of wave.enemies){
      const expected=stage>=5&&!enemy.boss&&enemy.name==='赤砂守衛';
      assert.equal(enemyAttackView(enemy).mixed,expected);assert.equal(enemyAttackView(enemy).nextKind,'physical');
      if(!expected)assert.equal(Object.hasOwn(enemy,'attackPattern'),false);
    }
    assert.deepEqual(route,before);
  }
  assert.deepEqual(enemyAttackView(null),{mixed:false,nextKind:'physical',nextLabel:'物理攻擊'});
});
test('magical defense is END/WIS attribute only, never physical gear or AGI',()=>{
  const s=createGame(7);s.hero.attributes.end=120;s.hero.attributes.wis=80;s.hero.attributes.agi=900;
  const before=copy(s),view=playerMagicDefenseView(s);assert.equal(view.mitigation,1-900/1060);assert.equal(view.resist,0);assert.deepEqual(s,before);
  s.equipment.armor.stats.defense=80;s.hero.attributes.agi=10000;assert.deepEqual(playerMagicDefenseView(s),view);
  s.hero.attributes.wis=1e9;assert.equal(playerMagicDefenseView(s).mitigation,.8);assert.deepEqual(playerMagicDefenseView(null),{mitigation:0,resist:0});
});
test('actual initiated attacks alternate; reads spend nothing',()=>{
  const s=fixture(),e=s.enemies[0];assert.equal(enemyAttackView(e).nextKind,'physical');
  incoming(s);const before=copy(s);assert.equal(enemyAttackView(e).nextKind,'magic');for(let i=0;i<20;i++)enemyAttackView(e);assert.deepEqual(s,before);
  incoming(s);assert.equal(enemyAttackView(e).nextKind,'physical');assert.equal(s.events.filter(e=>e.effect==='magic').length,1);
});
test('stun skips preserve next cast, actual recovery attack consumes it exactly once',()=>{
  const s=fixture(),e=s.enemies[0];incoming(s);e.stun={expiresAtTick:4};incoming(s);assert.equal(enemyAttackView(e).nextKind,'magic');
  delete e.stun;e.stunRecoveryPending=true;player(s);assert.equal(enemyAttackView(e).nextKind,'physical');assert.equal(s.events.filter(e=>e.effect==='magic').length,1);
  incoming(s);assert.equal(enemyAttackView(e).nextKind,'physical','regular action coalesces with recovery in same player interval');
});
test('retreat and save load discard per-actor intent; new route starts physical',()=>{
  const s=fixture();incoming(s);assert.equal(enemyAttackView(s.enemies[0]).nextKind,'magic');
  const loaded=validateSave(copy(s));assert.equal(loaded.mode,'town');assert.equal(loaded.enemies.length,0);
  act(s,'retreat');act(s,'start');for(const e of s.enemies)assert.equal(enemyAttackView(e).nextKind,'physical');
});
test('magic skips parry without rolls, but tracks block and all three resist checks',()=>{
  const r=sequence([], .5);const hit=resolveAttack({attack:100,magical:true,crit:0,trackDefense:true},{parry:1,evade:0,block:0,resist:0},r.rng);
  assert.equal(hit.damage,100);assert.deepEqual(hit.defenses,{parry:0,block:0});assert.equal(r.calls,9);
  const blocked=sequence([.9,.9,.9,0,0]);const full=resolveAttack({attack:100,magical:true,trackDefense:true},{parry:1,block:1},blocked.rng);
  assert.equal(full.outcome,'block');assert.equal(blocked.calls,5);assert.deepEqual(full.defenses,{parry:0,block:2});
  for(const [values,factor] of [[[.9,.9,.9],1],[[0,.9,.9],.5],[[0,0,.9],.25],[[0,0,0],.1]]){
    const rolls=sequence([.9,.9,.9,.9,.9,...values,.5]);const out=resolveAttack({attack:100,magical:true,crit:0},{resist:.5},rolls.rng);assert.equal(out.damage,100*factor);
  }
});
test('partial evade cannot become magic critical or a parry-triggered counter',()=>{
  const rolls=sequence([0,0,.9,.9,.9,.9,.9,.9,.5]);const out=resolveAttack({attack:100,magical:true,crit:1,trackDefense:true},{evade:.5,parry:1},rolls.rng);
  assert.equal(out.crit,0);assert.equal(out.damage,50);assert.deepEqual(out.defenses,{parry:0,block:0});assert.equal(rolls.calls,9);
});
test('magic cannot apply weapon proc, including crit hits; no extra proc RNG',()=>{
  for(const family of ['axe','rapier','club']){
    const e={hp:1000,defense:0},rolls=sequence([], .5);const out=resolveWeaponAttack({attack:100,magical:true,crit:0},e,{weaponFamily:family},0,rolls.rng);
    assert.equal(out.proc,undefined);assert.equal(rolls.calls,9);assert.deepEqual(e,{hp:1000,defense:0});
    const critical=sequence([0,.9,.9,.9,.9,.9,.9,.9,.9,.5]);
    const crit=resolveWeaponAttack({attack:100,magical:true,crit:1},e,{weaponFamily:family},0,critical.rng);
    assert.equal(crit.crit,1);assert.equal(crit.proc,undefined);assert.equal(critical.calls,10);assert.deepEqual(e,{hp:1000,defense:0});
  }
});
test('real magical action uses magical rather than physical mitigation',()=>{
  const a=fixture(42),b=fixture(42);a.enemies[0].attack=0;b.enemies[0].attack=0;incoming(a);incoming(b);
  a.enemies[0].attack=100;b.enemies[0].attack=100;b.equipment.armor.stats.defense=80;
  const hp=a.hero.hp;incoming(a);incoming(b);assert.equal(a.hero.hp,b.hero.hp);assert.ok(a.hero.hp<hp);assert.equal(a.seed,b.seed);
});
test('magic block may counter under general blocked-attack rule; parry alone never does',()=>{
  let countered=false;
  for(let seed=1;seed<=150;seed++){
    const s=fixture(seed);s.enemies[0].attack=0;incoming(s);s.equipment.weapon.weaponFamily='rapier';s.equipment.armor.stats.block=1;
    incoming(s);if(s.battle.actions.counters){countered=true;assert.equal(s.enemies[0].penetratedArmor,undefined);assert.equal(counterattackView(s).usedThisTurn,1);break;}
  }
  assert.ok(countered);
  for(let seed=1;seed<=100;seed++){
    const s=fixture(seed);s.enemies[0].attack=0;incoming(s);s.equipment.weapon.weaponFamily='rapier';s.equipment.weapon.stats.parry=100;s.equipment.armor.stats.block=-1;
    incoming(s);assert.equal(s.battle.actions.counters,undefined);
  }
});
test('Protection applies same-roll independent 25% mitigation to magic',()=>{
  const a=fixture(42),b=fixture(42);for(const s of [a,b]){s.hero.level=10;s.enemies[0].attack=0;incoming(s);}
  b.autoProtection=true;player(b);assert.equal(protectionView(b).active,true);assert.equal(a.seed,b.seed);
  for(const s of [a,b])s.enemies[0].attack=100;
  const hpA=a.hero.hp,hpB=b.hero.hp;incoming(a);incoming(b);const lossA=hpA-a.hero.hp,lossB=hpB-b.hero.hp;
  assert.ok(lossA>lossB);assert.equal(protectionView(b).damagePrevented,lossA-lossB);assert.equal(a.seed,b.seed);
});
