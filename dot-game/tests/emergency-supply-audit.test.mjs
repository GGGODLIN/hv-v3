import {withWaveGrowthFix} from './helpers/wave-growth-baseline.mjs';
// v056: historical parity includes the isolated post-kill HP correction, not its old defect.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as game from '../src/engine.js';
const old = await withWaveGrowthFix(new URL('./fixtures/v0.26/engine.js',import.meta.url));
import * as loot from '../src/loot.js';
const copy=structuredClone;
const stripPreference=s=>{const out=copy(s);delete out.emergencySupply;return out;};
// All boundary fixtures below are synthetic, never claimed as earned play.
function fixture(strategy='balanced',enabled=true){
  const s=game.createGame(42);game.act(s,'setStrategy',strategy);game.act(s,'setEmergencySupply',enabled);game.act(s,'start');
  s.enemies=[{id:'audit-target',name:'Audit target',hp:1000000,maxHp:1000000,attack:0,evade:0,parry:0,block:0}];
  s.hero.mp=0;s._enemyClock=-1000;return s;
}
function turn(s){s._clock=.8;s._enemyClock=-1000;game.advance(s,.25);}
function iwFixture(){
  const s=game.createGame(42),draws=[.5,.4],item={...loot.generateItem(()=>draws.shift()??.5,1,'weapon'),id:'audit-supply-iw'};
  s.inventory=[loot.createSoulboundItem(item,1)];s.worldSeeds=2;assert.ok(s.inventory[0]);return s;
}

test('v027 audit: pinned v026 fixture bytes remain exact, not rewritten golden output',async()=>{
  for(const [file,expected] of [['engine.js','60d0d46e7928078b911c266bb719b492ccc5f5b022f24a94ceafda1acd19159a'],['loot.js','2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7']]){
    assert.equal(createHash('sha256').update(await readFile(new URL('./fixtures/v0.26/'+file,import.meta.url))).digest('hex'),expected);
  }
});

test('v027 audit: default-OFF ordinary state, RNG, reports and outcomes equal exact v026 across all strategies',t=>{
  let pulses=0,runs=0,wins=0;
  for(const seed of [1,42,77])for(const strategy of ['balanced','assault','sustain']){
    const now=game.createGame(seed),before=old.createGame(seed);
    for(let run=0;run<8;run++){
      for(const [api,s] of [[game,now],[old,before]]){
        for(const slot of ['weapon','armor','accessory']){
          const best=[s.equipment[slot],...s.inventory.filter(i=>i.slot===slot)].reduce((a,b)=>loot.scoreItem(a)>=loot.scoreItem(b)?a:b);
          if(best.id!==s.equipment[slot].id)api.act(s,'equip',best.id);
        }
        api.act(s,'setStrategy',strategy);
        for(const id of ['hp-tank','mp-tank','one-handed-damage']){api.act(s,'learnAbility',id);api.act(s,'slotAbility',id);}
        api.act(s,'selectStage',Math.min(8,s.unlocked));api.act(s,'start');api.act(s,'finishThenCamp',true);
      }
      assert.deepEqual(now,before);let n=0;
      while(now.mode==='battle'&&n++<20000){game.advance(now,.25);old.advance(before,.25);assert.deepEqual(now,before);assert.deepEqual(game.expeditionReports(now),old.expeditionReports(before));pulses++;}
      assert.ok(n<20000,'run settles');assert.deepEqual(now,before);runs++;
      if(now.mode!=='town'){game.act(now,'retreat');old.act(before,'retreat');}
    }
    wins+=now.wins;
  }
  t.diagnostic(JSON.stringify({runs,wins,pulses,strategies:3,exact:'whole state, RNG and reports; no exclusions'}));
});

test('v027 audit: old v026 accepts supported inventory but drops new true preference rather than preserving it',()=>{
  for(const strategy of ['balanced','assault','sustain']){
    const s=game.createGame();game.act(s,'setStrategy',strategy);game.act(s,'setEmergencySupply',true);
    const bytes=copy(s),newLoad=game.validateSave(bytes),oldLoad=old.validateSave(bytes);
    assert.equal(newLoad.emergencySupply,true);assert.equal(Object.hasOwn(oldLoad,'emergencySupply'),false);
    assert.deepEqual(stripPreference(newLoad),oldLoad);assert.deepEqual(bytes,s);
    assert.equal(game.emergencySupplyView(game.validateSave(copy(oldLoad))).enabled,false,'old writer roundtrip loses opt-in');
  }
});

test('v027 audit: malformed new preference is rejected without getter execution or input mutation',()=>{
  for(const value of [undefined,null,1,0,'true',[],{},NaN,Infinity]){
    const s=game.createGame();s.emergencySupply=value;const original=copy(s);assert.throws(()=>game.validateSave(s),/補給/);assert.deepEqual(s,original);
  }
  for(const kind of ['accessor','hidden','inherited']){
    const s=game.createGame();let reads=0;
    if(kind==='accessor')Object.defineProperty(s,'emergencySupply',{enumerable:true,get(){reads++;return true;}});
    if(kind==='hidden')Object.defineProperty(s,'emergencySupply',{value:true});
    if(kind==='inherited')Object.setPrototypeOf(s,{emergencySupply:true});
    assert.throws(()=>game.validateSave(s),/補給/);assert.equal(reads,0);
  }
});

test('v027 audit: one turn checks post-heal HP, strict threshold and one automatic use maximum',()=>{
  for(const strategy of ['balanced','assault']){
    const healed=fixture(strategy);healed.hero.hp=game.stats(healed).maxHp*.2;healed.hero.mp=6;turn(healed);
    assert.equal(healed.battle.actions.heals,1);assert.equal(healed.battle.actions.potions,0);
    const edge=fixture(strategy);edge.hero.hp=game.stats(edge).maxHp*.3;turn(edge);assert.equal(edge.potions,3);
    const low=fixture(strategy);low.hero.hp=1;turn(low);assert.equal(low.potions,2);assert.equal(low.battle.actions.potions,1);
    assert.equal(low.battle.actions.attacks,1);assert.equal(low.timing.turns,1);
    low.hero.hp=1;game.advance(low,.25);assert.equal(low.potions,2,'sub-turn frame does not drink');
    turn(low);assert.equal(low.potions,1);low.hero.hp=1;turn(low);assert.equal(low.potions,1,'manual reserve remains');
    game.act(low,'heal');assert.equal(low.potions,0,'manual use may spend reserved last potion');assert.equal(low.battle.actions.potions,3);
  }
});

test('v027 audit: resource guard does not coerce malformed stock into an extra automatic supply',()=>{
  for(const remaining of [0,1,1.5,-1,Infinity,NaN,'3',null]){
    const s=fixture();s.potions=remaining;s.hero.hp=1;const before=s.battle.actions.potions;turn(s);
    assert.equal(s.battle.actions.potions,before);assert.ok(Object.is(s.potions,remaining));
  }
});

test('v027 audit: Sustain uses the last potion identically with preference off/on and preserves attack timing',()=>{
  const off=fixture('sustain',false),on=fixture('sustain',true);
  for(const s of [off,on]){s.potions=1;s.hero.hp=1;turn(s);}
  assert.equal(on.potions,0);assert.equal(on.battle.actions.potions,1);assert.deepEqual(stripPreference(on),off);
  assert.equal(game.emergencySupplyView(on).effective,false);assert.equal(game.emergencySupplyView(on).status,'sustain');
});

test('v027 audit: start report freezes preference and counts real stock usage without altering sparse OFF shape',()=>{
  const s=fixture();s.hero.hp=1;turn(s);game.act(s,'retreat');game.act(s,'setEmergencySupply',false);
  const report=game.expeditionReports(s)[0];assert.equal(report.build.emergencySupply,true);assert.equal(report.actions.potions,1);
  report.build.emergencySupply=false;report.actions.potions=999;assert.equal(game.expeditionReports(s)[0].build.emergencySupply,true);assert.equal(game.expeditionReports(s)[0].actions.potions,1);
  game.act(s,'start');game.act(s,'retreat');assert.equal(Object.hasOwn(game.expeditionReports(s)[0].build,'emergencySupply'),false);
});

test('v027 audit: emergency preference change invalidates Item World paid consent atomically',()=>{
  for(const initiallyEnabled of [false,true]){
    const s=iwFixture();game.act(s,'setEmergencySupply',initiallyEnabled);const quote=game.previewItemWorld(s,'audit-supply-iw');assert.equal(quote.available,true,quote.reason);
    game.act(s,'setEmergencySupply',!initiallyEnabled);const before=copy(s);game.act(s,'enterItemWorld',quote);assert.deepEqual(s,before);
    assert.equal(game.itemWorldView(s).active,false);assert.equal(s.worldSeeds,2);
    const fresh=game.previewItemWorld(s,'audit-supply-iw');game.act(s,'enterItemWorld',fresh);assert.equal(s.worldSeeds,1);assert.equal(game.itemWorldView(s).active,true);
  }
});
