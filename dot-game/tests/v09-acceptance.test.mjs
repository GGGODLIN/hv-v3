import { legacyState, legacyEnvelope } from './helpers/soulbind-compat.mjs';
import * as historicalV012 from './fixtures/v0.12/engine.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import * as baseline from './fixtures/v0.8.1/engine.js';
import * as current from '../src/engine.js';
import {scoreItem,resolveWeaponFamily} from '../src/loot.js';

const clone=value=>structuredClone(value);
const hash=value=>createHash('sha256').update(value).digest('hex');
const reports=current.expeditionReports;
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
const target=extra=>({id:'independent-report-target',name:'Independent report target',hp:1e6,maxHp:1e6,
  attack:0,defense:0,evade:0,parry:0,block:0,boss:true,...extra});
function battle(extra={}) {
  const s=current.createGame(42);current.act(s,'start');s.wave=4;s.enemies=[target(extra)];return s;
}
function assertReport(actual,expected) {
  assert.deepEqual({...actual,survival:{...actual.survival,minHpPercent:0}},
    {...expected,survival:{...expected.survival,minHpPercent:0}});
  near(actual.survival.minHpPercent,expected.survival.minHpPercent);
}

test('v0.9 independent: exact accepted own-v0.8.1 fixture and historical loot/current session bytes',()=>{
  for(const [path,digest] of [
    ['./fixtures/v0.8.1/engine.js','9ae2378a4818ab92d9e4813ca89e2bed5c4af7f5de5acee01e29575dfeacfa6a'],
    ['./fixtures/v0.8.1/loot.js','458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc'],
    ['./fixtures/v0.14/loot.js','458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc'],
    ['../src/session.js','821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a'],
  ])assert.equal(hash(readFileSync(new URL(path,import.meta.url))),digest,path);
});

test('v0.9 independent: successful start captures immutable context, reads detach nested fields, and history caps newest-first',()=>{
  const s=current.createGame(42),sheet=current.stats(s),weapon=clone(s.equipment.weapon);
  current.act(s,'start');assert.deepEqual(reports(s),[]);
  // Deliberately mutate live objects after capture, not through a supported
  // combat equipment action. Old context must still describe the actual start.
  s.equipment.weapon.name='changed later';s.equipment.weapon.stats.attack=999;s.strategy='assault';
  current.advance(s,.2);current.act(s,'retreat');
  const first=reports(s)[0];assert.equal(first.weapon.name,weapon.name);assert.equal(first.strategy,'balanced');
  assert.equal(first.startStats.attack,sheet.attack);assert.equal(first.elapsed,.2);
  assert.equal(first.outcome,'retreat');assert.equal(first.damage.basic,0);
  const before=clone(s),copy=reports(s);
  for(const key of ['weapon','startStats','actions','damage','survival','procs'])for(const field of Object.keys(copy[0][key]))copy[0][key][field]='tampered';
  copy.length=0;assert.deepEqual(reports(s),[first]);assert.deepEqual(s,before);
  current.act(s,'retreat');assert.deepEqual(reports(s),[first]);
  for(const seconds of [.3,.4]) {current.act(s,'start');current.advance(s,seconds);current.act(s,'retreat');}
  assert.equal(reports(s).length,2);near(reports(s)[0].elapsed,.4);near(reports(s)[1].elapsed,.3);
  assert.deepEqual(first.weapon,{family:null,name:weapon.name});
});

test('v0.9 independent: repeated or refused start does not reset, fabricate, or evict a report',()=>{
  const s=current.createGame(42);current.act(s,'start');current.advance(s,.2);current.act(s,'start');
  current.advance(s,.3);current.act(s,'retreat');near(reports(s)[0].elapsed,.5);
  const previous=reports(s);
  for(const block of ['pending','inventory']) {
    s.pendingLoot=block==='pending'?[clone(s.equipment.weapon)]:[];
    s.inventory=block==='inventory'?Array.from({length:116},()=>clone(s.equipment.weapon)):[];
    current.act(s,'start');assert.equal(s.mode,'town');current.act(s,'retreat');assert.deepEqual(reports(s),previous);
  }
  s.pendingLoot=[];s.inventory=[];current.act(s,'start');current.act(s,'retreat');
  assert.equal(reports(s)[0].elapsed,0);assert.equal(reports(s).length,2);
});

for(const skill of [false,true])test(`v0.9 independent: ${skill?'skill':'basic'} lethal overkill records actual fractional enemy HP once`,()=>{
  const s=battle({hp:.375});s._turns=skill?4:0;s._clock=1.04;s._enemyClock=-100;
  current.advance(s,.02);assert.equal(s.wins,1);
  const report=reports(s)[0];assert.equal(report.damage[skill?'skill':'basic'],.375);
  assert.equal(report.damage[skill?'basic':'skill'],0);assert.equal(report.damage.bleed,0);
  assert.equal(report.actions.attacks,1);assert.equal(report.actions.skills,Number(skill));
  assert.ok(s.events.find(event=>event.target==='independent-report-target').value>.375);
  const rewards={gold:s.hero.gold,kills:s.kills,wins:s.wins,seed:s.seed};
  current.advance(s,1);current.act(s,'retreat');current.act(s,'retreat');
  assert.deepEqual(reports(s),[report]);assert.deepEqual({gold:s.hero.gold,kills:s.kills,wins:s.wins,seed:s.seed},rewards);
});

test('v0.9 independent: terminal bleed pays actual HP once and suppresses queued recovery/player/enemy actions',()=>{
  const s=battle({hp:3,bleeding:{stacks:1,expiresAtTick:7,damagePerTick:1000},stunRecoveryPending:true});
  s.timing={turns:0,ticks:6,tu:699};s._clock=1.04;s._enemyClock=1.89;
  const plain=clone(s);baseline.advance(plain,.02);current.advance(s,.02);assert.deepEqual(legacyState(s),legacyState(plain));
  const report=reports(s)[0];assert.equal(report.outcome,'win');assert.deepEqual(report.damage,{basic:0,skill:0,bleed:3});
  assert.deepEqual(report.procs,{penetratedArmor:0,stun:0,bleeding:0});assert.equal(report.actions.attacks,0);
  assert.equal(report.survival.hpLost,0);assert.equal(s.wins,1);assert.equal(s.kills,1);
  assert.equal(s.events.some(event=>event.type==='recovery'||event.target==='hero'),false);
  current.advance(s,0);current.advance(s,1);current.act(s,'retreat');assert.deepEqual(reports(s),[report]);
});

test('v0.9 independent: fatal stun recovery caps incoming HP and settles defeat before repeated retreat',()=>{
  const s=battle({attack:1e9,stunRecoveryPending:true});s.hero.hp=.625;s._clock=1.04;s._enemyClock=1.89;
  const plain=clone(s);baseline.advance(plain,.02);current.advance(s,.02);assert.deepEqual(legacyState(s),legacyState(plain));
  const report=reports(s)[0];assert.equal(report.outcome,'defeat');assert.equal(report.survival.hpLost,.625);
  assert.equal(report.survival.minHpPercent,0);assert.equal(report.actions.attacks,0);assert.equal(report.actions.heals,0);
  assert.equal(s.events.filter(event=>event.target==='hero').length,1);
  current.advance(s,2);current.act(s,'retreat');current.act(s,'retreat');assert.deepEqual(reports(s),[report]);
});

test('v0.9 independent: report metadata cannot survive JSON reload, cloning, forged import, or another game',()=>{
  const s=current.createGame(42);current.act(s,'start');current.advance(s,.1);current.act(s,'retreat');
  const raw=JSON.parse(JSON.stringify(s));
  // Serialized gameplay retains elapsed/timing until validation; compare both
  // validators rather than introducing any new persistent report allowlist.
  const restored=current.validateSave(raw);assert.throws(()=>baseline.validateSave(raw),/不支援/);assert.deepEqual(legacyState(restored),baseline.validateSave(legacyEnvelope(raw)));
  for(const state of [clone(s),restored,current.createGame(42),current.validateSave({...raw,
    reports:reports(s),expeditionReports:reports(s),_expeditionFeedback:{active:reports(s)[0],reports:reports(s)}})])assert.deepEqual(reports(state),[]);
  assert.equal(JSON.stringify(s).includes('hpLost'),false);assert.equal(reports(s).length,1);
});

// Observe the frozen baseline's actual HP writes and emitted events. Unlike the
// report implementation, this oracle uses no report helpers or internal hooks.
// Accessors return/write the exact same value and are restored after each run.
function observeBaseline(s) {
  const initialWins=s.wins,restores=[],pendingEnemyLoss=new Map();let pendingHeroLoss=0;
  const sheet=baseline.stats(s),metrics={damage:{basic:0,skill:0,bleed:0},survival:{hpLost:0,minHpPercent:100},
    procs:{penetratedArmor:0,stun:0,bleeding:0}};
  const context={stage:s.stage,level:s.hero.level,weapon:{family:resolveWeaponFamily(s.equipment.weapon),name:s.equipment.weapon.name},
    strategy:s.strategy,startStats:{attack:sheet.attack,maxHp:sheet.maxHp,mitigation:sheet.mitigation}};
  function watch(object,key,onSet) {
    let value=object[key];Object.defineProperty(object,key,{enumerable:true,configurable:true,get:()=>value,
      set:next=>{const old=value;value=next;onSet(next,old);}});
    restores.push(()=>Object.defineProperty(object,key,{value,enumerable:true,configurable:true,writable:true}));
  }
  watch(s.hero,'hp',(next,old)=>{
    if(s.wins!==initialWins||s.mode!=='battle'||s._phase!=='fight')return;
    pendingHeroLoss=Math.max(0,old-next);
    metrics.survival.minHpPercent=Math.min(metrics.survival.minHpPercent,Math.max(0,Math.min(100,next/baseline.stats(s).maxHp*100)));
  });
  const seen=new WeakSet(),prepare=list=>{for(const enemy of list)if(!seen.has(enemy)){
    seen.add(enemy);watch(enemy,'hp',(next,old)=>pendingEnemyLoss.set(enemy.id,Math.max(0,old-next)));
  }};
  prepare(s.enemies);watch(s,'enemies',prepare);
  const push=s.events.push;Object.defineProperty(s.events,'push',{configurable:true,value:function(...events){
    for(const event of events) {
      if(event.type==='proc')metrics.procs[event.effect==='bleed'?'bleeding':event.effect==='stun'?'stun':'penetratedArmor']++;
      if(event.target==='hero'&&['hit','miss','block'].includes(event.type))metrics.survival.hpLost+=pendingHeroLoss;
      if(event.type==='bleed'||event.target!=='hero'&&['hit','crit','miss','block'].includes(event.type)) {
        const source=event.type==='bleed'?'bleed':event.text.startsWith('破勢斬')?'skill':'basic';
        metrics.damage[source]+=pendingEnemyLoss.get(event.target)||0;pendingEnemyLoss.delete(event.target);
      }
    }
    return push.apply(this,events);
  }});
  return {finish(outcome) {delete s.events.push;for(const restore of restores)restore();
    return {...context,...metrics,outcome,endLevel:s.hero.level,elapsed:s.battle.elapsed,actions:clone(s.battle.actions)};
  }};
}

// This is the historical v0.9 observation-only invariance claim, not a
// requirement that v0.13 counterattacks preserve pre-counter trajectories.
// Current report and counter accounting are independently exercised elsewhere.
test('v0.9 historical: 20 pre-counter routes preserve full-state/RNG fingerprints and measured report',t=>{
  const current=historicalV012, reports=historicalV012.expeditionReports;
  let expeditions=0,defeats=0,steps=0;const coverage={axe:0,rapier:0,club:0,bleed:0,stun:0,penetratedArmor:0};
  for(let seed=1;seed<=20;seed++) {
    const old=baseline.createGame(seed),s=current.createGame(seed),family=['axe','rapier','club'][(seed-1)%3];
    const cadence=seed%2?.1:.25,oldHash=createHash('sha256'),newHash=createHash('sha256');
    const record=()=>{oldHash.update(JSON.stringify(old)+'\n');newHash.update(JSON.stringify(legacyState(s))+'\n');};
    const action=(name,payload)=>{baseline.act(old,name,payload);current.act(s,name,payload);record();};
    function expedition({retreatAt=null}={}) {
      const wins=old.wins;action('start');assert.equal(old.mode,'battle');const oracle=observeBaseline(old);
      for(let n=0;n<600/cadence&&old.mode==='battle'&&old.wins===wins;n++) {
        baseline.advance(old,cadence);current.advance(s,cadence);record();steps++;
        if(retreatAt!==null&&old.battle.elapsed>=retreatAt){action('retreat');break;}
      }
      assert.ok(old.wins>wins||old.mode==='defeat'||old.mode==='town','natural expedition must terminate');
      const outcome=old.wins>wins?'win':old.mode==='defeat'?'defeat':'retreat',expected=oracle.finish(outcome);
      assertReport(reports(s)[0],expected);assert.deepEqual(legacyState(s),legacyState(old));expeditions++;if(outcome==='defeat')defeats++;
      coverage.bleed+=expected.damage.bleed;coverage.stun+=expected.procs.stun;coverage.penetratedArmor+=expected.procs.penetratedArmor;
      return outcome;
    }
    function camp() {
      action('retreat');for(const slot of ['weapon','armor','accessory']) {
        const best=[old.equipment[slot],...old.inventory.filter(item=>item.slot===slot)].reduce((a,b)=>scoreItem(b)>scoreItem(a)?b:a);
        if(best.id!==old.equipment[slot].id)action('equip',best.id);
      }
    }
    let bought=false;
    for(let run=0;run<20&&!bought;run++) {
      assert.equal(expedition(),'win');camp();const offer=baseline.previewWeaponCommission(old,family);
      assert.deepEqual(current.previewWeaponCommission(s,family),offer);
      if(offer.available){action('commissionWeapon',{family,quoteBasis:offer.quoteBasis});action('equip',offer.item.id);bought=true;coverage[family]++;}
    }
    assert.ok(bought,'natural earned credits must fund the selected family within the fixed horizon');
    action('setStrategy',['balanced','assault','sustain'][Math.floor((seed-1)/3)%3]);
    for(let stage=2;stage<=8;stage++) {
      action('selectStage',stage);const outcome=expedition();camp();if(outcome==='defeat')break;
    }
    expedition({retreatAt:2.3});camp();
    assert.equal(newHash.digest('hex'),oldHash.digest('hex'),`seed ${seed}, ${family}, ${cadence}s full trajectory`);
  }
  for(const value of Object.values(coverage))assert.ok(value>0,'all weapon/proc paths must be naturally observed');
  t.diagnostic(JSON.stringify({seeds:20,expeditions,defeats,steps,coverage}));
});
