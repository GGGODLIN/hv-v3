import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
const copy=structuredClone;
const incoming=s=>{s._clock=-100;s._enemyClock=1.9;game.advance(s,.001);};
function fixture(seed){const s=game.createGame(seed);game.act(s,'start');s.enemies=[{id:'audit-caster',name:'audit',hp:1e6,maxHp:1e6,attack:20,defense:0,evade:0,parry:0,block:0,attackPattern:'alternating'}];return s;}
test('independent magic audit: magical mitigation reads END/WIS, not level INT AGI or physical armor',()=>{
 const s=game.createGame(1);s.hero.attributes.end=200;s.hero.attributes.wis=300;
 assert.equal(game.playerMagicDefenseView(s).mitigation,1-900/1250);
 const before=game.playerMagicDefenseView(s);s.hero.level=500;s.hero.attributes.int=10000;s.hero.attributes.agi=10000;s.equipment.armor.stats.defense=80;
 assert.deepEqual(game.playerMagicDefenseView(s),before);assert.equal(before.resist,0);
 s.hero.attributes.end=1e9;assert.equal(game.playerMagicDefenseView(s).mitigation,.8);
});
test('independent magic audit: no parry checks or defenses, evade-only glance cannot qualify a counter',()=>{
 let n=0;const rolls=[.99,0,.99,.99,.99,.99,.99,.99,.5];
 const r=game.resolveAttack({magical:true,attack:100,crit:0,trackDefense:true},{evade:.5,parry:1,block:0,resist:0},()=>rolls[n++]);
 assert.equal(n,9);assert.deepEqual(r.defenses,{parry:0,block:0});assert.equal(r.damage,50);assert.equal(r.crit,0);
});
test('independent magic audit: eligible weapon adds no counter RNG to magic without actual block',()=>{
 for(let seed=1;seed<=150;seed++){
  const s=fixture(seed);incoming(s);assert.equal(game.enemyAttackView(s.enemies[0]).nextKind,'magic');
  s.equipment.weapon.weaponFamily='rapier';s.equipment.weapon.stats.parry=100;s.equipment.armor.stats.block=-.04;
  const p={...game.stats(s),...game.playerMagicDefenseView(s)};let expectedSeed=s.seed;
  const rng=()=>{expectedSeed=(Math.imul(expectedSeed,1664525)+1013904223)>>>0;return expectedSeed/4294967296;};
  const expected=game.resolveAttack({attack:20,crit:.2,critBonus:.2,trackDefense:true,magical:true},p,rng);
  const hp=s.hero.hp,oldCounters=s.battle.actions.counters??0;incoming(s);
  assert.equal(s.seed,expectedSeed,`seed ${seed}`);assert.equal(s.hero.hp,Math.max(0,hp-expected.damage));
  assert.equal(s.battle.actions.counters??0,oldCounters);assert.equal(game.enemyAttackView(s.enemies[0]).nextKind,'physical');
 }
});
test('independent magic audit: full avoided initiated attacks advance, active stun skips preserve next kind',()=>{
 const s=fixture(123),e=s.enemies[0];s.equipment.armor.stats.evade=1;
 const before=copy(s);for(let i=0;i<10;i++)game.enemyAttackView(e);assert.deepEqual(s,before);
 incoming(s);assert.equal(game.enemyAttackView(e).nextKind,'magic');
 e.stun={expiresAtTick:s.timing.ticks+4};const seed=s.seed;incoming(s);assert.equal(s.seed,seed);assert.equal(game.enemyAttackView(e).nextKind,'magic');
 delete e.stun;incoming(s);assert.equal(game.enemyAttackView(e).nextKind,'physical');
 const loaded=game.validateSave(copy(s));assert.equal(loaded.mode,'town');assert.deepEqual(loaded.enemies,[]);
 assert.equal(game.enemyAttackView(copy(e)).nextKind,'physical');
});

import * as previous from './fixtures/v0.19/engine.js';
import {scoreItem} from '../src/loot.js';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('independent magic audit: immutable own v0.19 baseline identities',()=>{
 for(const [file,sha]of Object.entries({'engine.js':'908bf5b7e63c4a8a5612499a2cc3c6707621157c0edb46e2087b858671f93a7e','loot.js':'db841ff9d52a2a0d6e58458351ca3c3f59ec8c3bc8b4d7a8baf78c3bbc28f38d'}))assert.equal(createHash('sha256').update(readFileSync(new URL(`./fixtures/v0.19/${file}`,import.meta.url))).digest('hex'),sha);
});
test('independent magic audit: first four stages retain exact state/RNG/reports',()=>{
 for(const seed of [1,29,42,77,100])for(const stage of [1,2,3,4]){
  const s=game.createGame(seed),old=previous.createGame(seed);s.unlocked=old.unlocked=4;s.stage=old.stage=stage;
  game.act(s,'start');previous.act(old,'start');
  for(let i=0;i<600;i++){game.advance(s,.1);previous.advance(old,.1);assert.deepEqual(s,old);assert.deepEqual(game.expeditionReports(s),previous.expeditionReports(old));}
 }
});
function equipBest(api,s){for(const slot of ['weapon','armor','accessory']){const best=[s.equipment[slot],...s.inventory.filter(i=>i.slot===slot)].reduce((a,b)=>scoreItem(a)>=scoreItem(b)?a:b);if(best.id!==s.equipment[slot].id)api.act(s,'equip',best.id);}}
function run(api,s,stage){api.act(s,'selectStage',stage);assert.equal(s.stage,stage);const wins=s.wins;api.act(s,'start');assert.equal(s.mode,'battle');let steps=0,magicCasts=0,lastEvent=s._eventId;while(s.mode==='battle'&&s.wins===wins&&steps++<4000){api.advance(s,.1);magicCasts+=s.events.filter(e=>e.id>lastEvent&&e.type==='cast'&&e.effect==='magic').length;lastEvent=s._eventId;}assert.ok(steps<4000);const r=api.expeditionReports(s)[0];assert.ok(r);api.act(s,'retreat');return {outcome:r.outcome,seconds:Number(r.elapsed.toFixed(2)),hpLost:r.survival.hpLost,minHpPercent:r.survival.minHpPercent,counters:r.actions.counters??0,manaSpent:r.actions.manaSpent,magicCasts};}
test('independent magic audit: natural earned gear paired cohort keeps worse outcomes',t=>{
 const rows=[],acquisition=[];
 for(let seed=1;seed<=20;seed++){
  const earned=previous.createGame(seed);
  for(let i=0;i<25&&(i<8||earned.unlocked<6);i++){
   equipBest(previous,earned);
   if(earned.hero.level>=4&&!earned.abilities)for(const id of ['hp-tank','mp-tank','one-handed-damage']){previous.act(earned,'learnAbility',id);previous.act(earned,'slotAbility',id);}
   if(earned.inventory.length>100)previous.act(earned,'sellCommon');
   const r=run(previous,earned,Math.min(5,earned.unlocked));acquisition.push({seed,stage:earned.stage,outcome:r.outcome});
  }
  assert.ok(earned.unlocked>=6);
  for(const [family,suffix]of [['axe','slaughter'],['club','slaughter'],['rapier','nimble']]){
   const equipped=copy(earned),offer=previous.previewWeaponCommission(equipped,family,suffix);assert.equal(offer.available,true);
   previous.act(equipped,'commissionWeapon',{family,suffix,quoteBasis:offer.quoteBasis});previous.act(equipped,'equip',offer.item.id);assert.equal(equipped.equipment.weapon.id,offer.item.id);
   for(const stage of [4,5,6]){
    const before=run(previous,copy(equipped),stage),after=run(game,copy(equipped),stage);
    rows.push({seed,family,suffix,level:equipped.hero.level,stage,parry:previous.stats(equipped).parry,block:previous.stats(equipped).block,before,after});
    if(stage===4)assert.deepEqual(after,before);
   }
  }
 }
 assert.ok(rows.some(r=>r.stage>=5&&r.after.hpLost>r.before.hpLost));
 t.diagnostic('MAGIC_MEASUREMENT '+JSON.stringify({kind:'engine-earned, not browser-earned; same saved seed/items before each paired run; zero tuning; v0.19 versus v0.20',acquisitionRuns:acquisition.length,acquisitionDefeats:acquisition.filter(r=>r.outcome!=='win').length,rows}));
});
