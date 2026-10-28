import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/engine.js';
const enemy=(id='growth-target')=>({id,name:'growth audit',hp:1,maxHp:1,attack:0,defense:0,evade:0,parry:0,block:0,boss:false});
function fixture(kind,{levelUp=true,hp,final=false,remaining=false}={}){
  const s=E.createGame(kind==='counter'?3:1);
  if(kind==='counter'){s.equipment.weapon.weaponFamily='axe';s.equipment.armor.stats.block=1;}
  E.act(s,'start');if(levelUp)s.hero.xp=s.hero.xpNext-1;
  if(hp!==undefined){s.hero.hp=hp;s.hero.mp=0;} // Isolate wave recovery from automatic Cure.
  if(final)s.wave=s.totalWaves;
  s.enemies=[enemy()];if(remaining)s.enemies.push({...enemy('survivor'),hp:100000,maxHp:100000});
  if(kind==='skill')s._turns=4;
  if(kind==='bleed'){
    s.enemies[0].bleeding={stacks:1,expiresAtTick:7,damagePerTick:2};
    s._clock=-100;s._enemyClock=-100;s.timing.tu=99;
  }else if(kind==='counter'){s._clock=-100;s._enemyClock=1.9;}
  return s;
}
function step(s,kind){E.advance(s,kind==='bleed'?.02:kind==='counter'?.001:1.05);}
for(const kind of ['basic','skill','bleed','counter'])test(`v056 independent ${kind}: growth at wave boundary keeps current full HP`,()=>{
  const s=fixture(kind),oldMax=E.stats(s).maxHp;step(s,kind);
  assert.equal(s.hero.level,2);assert.equal(s.wave,2);assert.equal(s.kills,1);
  assert.ok(E.stats(s).maxHp>oldMax);assert.equal(s.hero.hp,E.stats(s).maxHp);
  assert.equal(s.battle.actions.attacks,kind==='basic'||kind==='skill'?1:0);
  if(kind==='skill')assert.equal(s.battle.actions.skills,1);
  if(kind==='counter')assert.equal(s.battle.actions.counters,1);
});
for(const kind of ['basic','bleed'])test(`v056 independent ${kind}: injured hero receives 90 level heal then 10% current-max wave heal`,()=>{
  const s=fixture(kind,{hp:100});step(s,kind);
  assert.equal(s.hero.level,2);assert.equal(s.wave,2);
  assert.equal(s.hero.hp,190+E.stats(s).maxHp*.1);
});
for(const kind of ['basic','bleed'])test(`v056 independent ${kind}: unchanged-level wave recovery remains exactly ten percent`,()=>{
  const s=fixture(kind,{levelUp:false,hp:100}),max=E.stats(s).maxHp;step(s,kind);
  assert.equal(s.hero.level,1);assert.equal(s.wave,2);assert.equal(s.hero.hp,100+max*.1);
});
for(const kind of ['basic','bleed'])test(`v056 independent ${kind}: surviving enemy prevents any premature wave recovery`,()=>{
  const s=fixture(kind,{hp:100,remaining:true});step(s,kind);
  assert.equal(s.hero.level,2);assert.equal(s.wave,1);assert.equal(s.hero.hp,190);assert.equal(s.kills,1);
});
for(const kind of ['basic','bleed'])test(`v056 independent ${kind}: final wave retains full recovery and exactly one victory`,()=>{
  const s=fixture(kind,{hp:100,final:true});step(s,kind);
  assert.equal(s.wins,1);assert.equal(s._phase,'intermission');assert.equal(s.hero.hp,E.stats(s).maxHp);
  const xp=s.hero.xp,kills=s.kills;E.advance(s,.1);assert.equal(s.wins,1);assert.equal(s.hero.xp,xp);assert.equal(s.kills,kills);
});

// The item is emitted by this game's own generator; binding and IW entry use
// the full live preview/action contract. Only combat timing/enemies are fixtures.
import {generateItem,isSoulboundItem} from '../src/loot.js';
function boundFixture(kind,world){
  const values=[.1,.5,.1,.3];let index=0;
  const weapon=generateItem(()=>values[index++]??.5,1,'weapon');weapon.id='audit-growth-bound';
  assert.equal(weapon.prefix,'堅守');assert.ok(weapon.stats.hp>0);
  const s=E.createGame(1);s.inventory.push(weapon);s.soulFragments=100;s.worldSeeds=1;
  const binding=E.previewSoulbindWeapon(s,weapon.id);assert.equal(binding.available,true,binding.reason);
  E.act(s,'soulbindWeapon',structuredClone(binding));assert.equal(s.soulFragments,0);
  E.act(s,'equip',weapon.id);assert.equal(isSoulboundItem(s.equipment.weapon),true);
  const anchor=structuredClone(s.equipment.weapon.soulbound),oldHpStat=s.equipment.weapon.stats.hp;
  if(world){const trial=E.previewItemWorld(s,weapon.id);assert.equal(trial.available,true,trial.reason);E.act(s,'enterItemWorld',structuredClone(trial));assert.equal(E.itemWorldView(s).active,true);}
  else E.act(s,'start');
  s.hero.xp=s.hero.xpNext-1;s.enemies=[enemy()];
  if(kind==='bleed'){s.enemies[0].bleeding={stacks:1,expiresAtTick:7,damagePerTick:2};s._clock=-100;s._enemyClock=-100;s.timing.tu=99;}
  return {s,anchor,oldHpStat};
}
for(const world of [false,true])for(const kind of ['basic','bleed'])test(`v056 independent ${world?'Item World':'normal'} ${kind}: equipped bound HP growth is included before nonfinal recovery`,()=>{
  const {s,anchor,oldHpStat}=boundFixture(kind,world),oldMax=E.stats(s).maxHp;step(s,kind);
  assert.equal(s.hero.level,2);assert.equal(s.wave,2);assert.equal(s.kills,1);assert.equal(s.wins,0);
  assert.equal(s.equipment.weapon.level,2);assert.equal(isSoulboundItem(s.equipment.weapon),true);
  assert.deepEqual(s.equipment.weapon.soulbound,anchor);assert.ok(s.equipment.weapon.stats.hp>oldHpStat);
  assert.equal(E.stats(s).maxHp-oldMax,22+s.equipment.weapon.stats.hp-oldHpStat);
  assert.equal(s.hero.hp,E.stats(s).maxHp);assert.equal(E.itemWorldView(s).active,world);
  assert.equal(s.worldSeeds,world?0:1);assert.equal(s.equipment.weapon.itemWorld,undefined);
});
