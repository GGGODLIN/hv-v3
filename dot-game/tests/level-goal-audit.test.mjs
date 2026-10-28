import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
const snap=s=>JSON.stringify(s);
function levelState(level=10,seed=42){const s=g.createGame(seed);s.hero.level=level;return g.validateSave(JSON.parse(JSON.stringify(s)));}
function until(s,predicate,limit=30000){for(let n=0;n<limit&&!predicate();n++)g.advance(s,.1);assert.ok(predicate(),'bounded source simulation reached intended state');}
function rewards(s){return {hero:s.hero,seed:s.seed,equipment:s.equipment,inventory:s.inventory,pendingLoot:s.pendingLoot,kills:s.kills,wins:s.wins,soulFragments:s.soulFragments,worldSeeds:s.worldSeeds,unlocked:s.unlocked,itemId:s._itemId,bestTimes:s.battle.bestTimes};}

test('v069 audit: fixed level goal survives several completed ordinary expeditions',()=>{
 const s=levelState();g.act(s,'startUntilLevel');assert.equal(g.levelThenCampView(s).targetLevel,11);
 until(s,()=>s.wins===1);assert.equal(s.hero.level,10);assert.equal(s.mode,'battle');assert.equal(g.levelThenCampView(s).targetLevel,11);
 until(s,()=>s.wins===2);assert.equal(g.levelThenCampView(s).targetLevel,11);
 until(s,()=>s.mode!=='battle');assert.equal(s.mode,'town');assert.ok(s.wins>1);assert.ok(s.hero.level>=11);assert.equal(s.wave,4);assert.equal(g.levelThenCampView(s).active,false);
});
test('v069 audit: mid-wave level gain retains live enemies until full clear and complete rewards',()=>{
 const s=g.createGame(42);s.hero.xp=s.hero.xpNext-1;g.act(s,'startUntilLevel');until(s,()=>s.hero.level>=2);
 assert.equal(s.mode,'battle');assert.ok(s.wave<4);assert.equal(s.wins,0);assert.equal(g.levelThenCampView(s).reached,true);assert.equal(g.levelThenCampView(s).targetLevel,2);
 until(s,()=>s.mode==='town');assert.equal(s.wins,1);assert.equal(s.wave,4);assert.equal(s.soulFragments,10);assert.equal(s.worldSeeds,1);assert.equal(g.expeditionReports(s)[0].outcome,'win');
});
test('v069 audit: level reached by final win XP stops without another expedition',()=>{
 const s=g.createGame(42);g.act(s,'startUntilLevel');until(s,()=>s.wave===4&&s.mode==='battle');assert.equal(s.hero.level,1);
 until(s,()=>s.mode!=='battle');assert.equal(s.mode,'town');assert.equal(s.hero.level,2);assert.equal(s.wins,1);
 const end=snap(s);for(let i=0;i<100;i++)g.advance(s,2);assert.equal(snap(s),end);
});
for(const seed of [42,711,908])test(`v069 audit: reward/RNG/report parity at goal completion seed ${seed}`,()=>{
 const a=levelState(10,seed),b=levelState(10,seed);g.act(a,'startUntilLevel');g.act(b,'start');assert.equal(snap(a),snap(b));
 for(let n=0;n<30000&&a.mode==='battle';n++){g.advance(a,.1);g.advance(b,.1);}
 assert.equal(a.mode,'town');assert.equal(b.mode,'battle');assert.deepEqual(rewards(a),rewards(b));assert.deepEqual(g.expeditionReports(a),g.expeditionReports(b));
});
test('v069 audit: explicit cancellation has no durable mutation and permits subsequent clears',()=>{
 const s=g.createGame(42);g.act(s,'startUntilLevel');const before=snap(s);g.act(s,'cancelLevelThenCamp');assert.equal(snap(s),before);assert.equal(g.levelThenCampView(s).active,false);
 until(s,()=>s.wins>=2);assert.equal(s.mode,'battle');
});
test('v069 audit: current-expedition override clears growth and cancel does not resurrect it',()=>{
 const s=levelState();g.act(s,'startUntilLevel');g.act(s,'finishThenCamp',true);assert.equal(g.levelThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,true);
 g.act(s,'finishThenCamp',false);assert.equal(g.finishThenCampView(s).queued,false);assert.equal(g.levelThenCampView(s).active,false);
 until(s,()=>s.wins>=1);assert.equal(s.mode,'battle');
});
test('v069 audit: cap/invalid payload/pending start refusal never leaves goal',()=>{
 const cap=levelState(500),before=snap(cap);g.act(cap,'startUntilLevel');assert.equal(snap(cap),before);assert.equal(g.levelThenCampView(cap).available,false);
 const s=g.createGame(9);g.act(s,'startUntilLevel',true);assert.equal(s.mode,'town');assert.equal(g.levelThenCampView(s).active,false);
 s.pendingLoot.push({...s.equipment.weapon,id:'audit-pending'});g.act(s,'startUntilLevel');assert.equal(s.mode,'town');assert.equal(g.levelThenCampView(s).active,false);
 s.pendingLoot=[];g.act(s,'startOnce');assert.equal(g.levelThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,true);
});
test('v069 audit: retreat and reload clear goal without making it a saved property',()=>{
 const s=levelState();g.act(s,'startUntilLevel');const reloaded=g.validateSave(JSON.parse(snap(s)));assert.equal(reloaded.mode,'town');assert.equal(g.levelThenCampView(reloaded).active,false);
 g.act(s,'retreat');assert.equal(g.levelThenCampView(s).active,false);g.act(s,'start');assert.equal(g.levelThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,false);
});
test('v069 audit: lethal defeat clears goal and keeps completed reward history',()=>{
 const s=g.createGame(881);g.act(s,'startUntilLevel');s.hero.hp=1;s._enemyClock=1.8;s.enemies.forEach(e=>{e.hp=1e5;e.maxHp=1e5;e.attack=1e5;});
 until(s,()=>s.mode==='defeat',1000);assert.equal(g.levelThenCampView(s).active,false);assert.equal(g.expeditionReports(s)[0].outcome,'defeat');g.act(s,'retreat');g.act(s,'start');assert.equal(g.levelThenCampView(s).active,false);
});
test('v069 audit: UI start discards camp time; repeated start cannot move fixed target',async()=>{
 const h=fullUI();h.at(240);await h.dom['level-camp-button'].click();assert.equal(g.levelThenCampView(h.state).targetLevel,2);h.at(250);h.tick();assert.ok(Math.abs(h.state.battle.elapsed-.01)<1e-10);
 g.act(h.state,'startUntilLevel');assert.equal(g.levelThenCampView(h.state).targetLevel,2);h.render();assert.equal(h.dom['level-camp-button'].attributes['aria-pressed'],'true');assert.match(h.dom['level-camp-status'].textContent,/Lv\.2.*出發時鎖定/);assert.deepEqual(h.faults,[]);
});
test('v069 audit: 2x goal completion cannot restart in second half or later ticks',async()=>{
 const h=fullUI();h.dom['battle-tempo'].value='2';await h.dom['battle-tempo'].emit('change');await h.dom['level-camp-button'].click();
 for(let n=1;n<=600&&h.state.mode==='battle';n++){h.at(n*250);h.tick();}
 assert.equal(h.state.mode,'town');assert.equal(h.state.wins,1);const end=snap(h.state);for(let n=601;n<=620;n++){h.at(n*250);h.tick();}assert.equal(snap(h.state),end);h.render();assert.equal(h.dom['level-camp-button'].attributes['aria-pressed'],'false');assert.deepEqual(h.faults,[]);
});
test('v069 audit: UI cancel/import/ownership sync/cap/readonly controls',async()=>{
 const h=fullUI();await h.dom['level-camp-button'].click();const before=snap(h.state);await h.dom['level-camp-button'].click();assert.equal(snap(h.state),before);assert.equal(g.levelThenCampView(h.state).active,false);
 await h.dom['retreat-button'].click();await h.dom['level-camp-button'].click();h.run('syncSelection()');assert.equal(g.levelThenCampView(h.state).active,false);
 await h.dom['retreat-button'].click();await h.dom['level-camp-button'].click();await h.import(g.createGame(17));assert.equal(g.levelThenCampView(h.state).active,false);assert.equal(h.state.mode,'town');
 h.run('tabOwner=false');h.render();assert.equal(h.dom['level-camp-button'].disabled,true);const readonly=snap(h.state);await h.dom['level-camp-button'].click();assert.equal(snap(h.state),readonly);assert.deepEqual(h.faults,[]);
 const cap=fullUI(levelState(500));assert.equal(cap.dom['level-camp-button'].disabled,true);assert.match(cap.dom['level-camp-status'].textContent,/500.*沒有下一級/);
});
test('v069 audit: autoAdvance may change route, not fixed growth target; terminal route is not advanced',()=>{
 const s=levelState(10,42);s.autoAdvance=true;g.act(s,'startUntilLevel');until(s,()=>s.stage>=2);assert.equal(g.levelThenCampView(s).targetLevel,11);
 until(s,()=>s.mode!=='battle');assert.equal(s.mode,'town');assert.ok(s.hero.level>=11);assert.equal(g.expeditionReports(s)[0].stage,s.stage);assert.equal(s.unlocked,s.stage+1);
});
test('v069 audit: capacity stop before next level clears the old goal for later ordinary runs',()=>{
 const s=levelState(100,42);s.inventory=Array.from({length:115},(_,i)=>({...s.equipment.weapon,id:`audit-cap-${i}`}));
 g.act(s,'startUntilLevel');assert.equal(g.levelThenCampView(s).targetLevel,101);until(s,()=>s.mode!=='battle');
 assert.equal(s.mode,'town');assert.equal(s.hero.level,100);assert.equal(s.wins,1);assert.equal(g.levelThenCampView(s).active,false);assert.ok(s.inventory.length>115);
 s.inventory=[];s.pendingLoot=[];g.act(s,'start');assert.equal(g.levelThenCampView(s).active,false);
});
test('v069 audit: intermission cancellation continues and later current-run stop has no duplicate payout',()=>{
 const s=levelState(10,42);g.act(s,'startUntilLevel');until(s,()=>s._phase==='intermission');const paid=rewards(s);g.act(s,'cancelLevelThenCamp');assert.deepEqual(rewards(s),paid);assert.equal(s.mode,'battle');assert.equal(g.levelThenCampView(s).active,false);
 g.act(s,'finishThenCamp',true);assert.equal(s.mode,'town');assert.deepEqual(rewards(s),paid);assert.equal(s.wins,1);
});
