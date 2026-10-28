import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as g from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
import {beforeLevelGoal} from './helpers/level-goal-baseline.mjs';
const expected=JSON.parse(readFileSync(new URL('./helpers/level-goal-v068-hashes.json',import.meta.url),'utf8'));
test('v069 exact reverse projection preserves accepted v068 source bytes',()=>{
 for(const [p,h]of Object.entries(expected))assert.equal(createHash('sha256').update(beforeLevelGoal(readFileSync(new URL('../'+p,import.meta.url),'utf8'),p)).digest('hex'),h,p);
});
function until(s,predicate,max=20000){let t=0;while(!predicate(s)&&t++<max)g.advance(s,.1);assert.ok(t<max,'bounded progression');}
test('growth goal starts identically to normal; target transient and next level fixed',()=>{
 const a=g.createGame(42),b=g.createGame(42);g.act(a,'startUntilLevel');g.act(b,'start');
 assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(g.levelThenCampView(a).targetLevel,2);
 const loaded=g.validateSave(JSON.parse(JSON.stringify(a)));assert.equal(g.levelThenCampView(loaded).active,false);
});
test('natural level target completes all waves and full rewards exactly once',()=>{
 const a=g.createGame(42),b=g.createGame(42);a.autoAdvance=b.autoAdvance=true;g.act(a,'startUntilLevel');g.act(b,'startOnce');
 until(a,s=>s.mode!=='battle');until(b,s=>s.mode!=='battle');
 assert.equal(a.hero.level,2);assert.equal(a.wins,1);assert.equal(a.wave,4);assert.equal(a.stage,1);assert.equal(JSON.stringify(a),JSON.stringify(b));
 assert.equal(g.levelThenCampView(a).active,false);const done=JSON.stringify(a);g.advance(a,2);assert.equal(JSON.stringify(a),done);
});
test('multiple ordinary expeditions retain original target and stop only after level gain',()=>{
 const s=g.createGame(7);s.hero.level=9;s.hero.xp=0;s.hero.xpNext=300;s.autoAdvance=false;g.act(s,'startUntilLevel');
 until(s,x=>x.wins===1);assert.equal(s.hero.level,9);assert.equal(g.levelThenCampView(s).targetLevel,10);
 until(s,x=>x.wins===2);assert.equal(s.hero.level,9);assert.equal(g.levelThenCampView(s).targetLevel,10);
 until(s,x=>x.mode==='town');assert.ok(s.wins>=3);assert.equal(s.hero.level,10);assert.equal(s.wave,4);
});
test('cancel resumes continuous farming without state edits; explicit one-run stop supersedes goal',()=>{
 const s=g.createGame(42);g.act(s,'startUntilLevel');const before=JSON.stringify(s);g.act(s,'cancelLevelThenCamp');assert.equal(JSON.stringify(s),before);assert.equal(g.levelThenCampView(s).active,false);
 until(s,x=>x.wins===1);assert.equal(s.mode,'battle');g.act(s,'retreat');g.act(s,'startUntilLevel');g.act(s,'finishThenCamp',true);assert.equal(g.levelThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,true);
 g.act(s,'finishThenCamp',false);assert.equal(g.finishThenCampView(s).queued,false);assert.equal(g.levelThenCampView(s).active,false);
});
test('failed capacity start, max level and malformed payload never set growth target',()=>{
 const s=g.createGame(42);s.pendingLoot.push({...s.equipment.weapon,id:'pending-test'});g.act(s,'startUntilLevel');assert.equal(s.mode,'town');assert.equal(g.levelThenCampView(s).active,false);
 const cap=g.createGame(42);cap.hero.level=500;const before=JSON.stringify(cap);g.act(cap,'startUntilLevel');assert.equal(JSON.stringify(cap),before);assert.equal(g.levelThenCampView(cap).available,false);
 const invalid=g.createGame(42);g.act(invalid,'startUntilLevel',true);assert.equal(invalid.mode,'town');assert.equal(g.levelThenCampView(invalid).active,false);
});
test('retreat, explicit clearing, and subsequent ordinary or single departure do not inherit goal',()=>{
 for(const action of ['start','startOnce']){const s=g.createGame(42);g.act(s,'startUntilLevel');g.act(s,'retreat');g.act(s,action);assert.equal(g.levelThenCampView(s).active,false);}
 const s=g.createGame(42);g.act(s,'startUntilLevel');g.clearFinishThenCamp(s);assert.equal(g.levelThenCampView(s).active,false);
});
test('natural UI exposes fixed target, cancellation, 2x stop and max-level explanation',async()=>{
 const h=fullUI();await h.dom['level-camp-button'].click();assert.equal(h.state.mode,'battle');assert.match(h.dom['level-camp-status'].textContent,/目標 Lv.2/);assert.equal(h.dom['level-camp-button'].disabled,false);
 await h.dom['level-camp-button'].click();assert.equal(g.levelThenCampView(h.state).active,false);assert.equal(h.state.mode,'battle');await h.dom['retreat-button'].click();
 h.dom['battle-tempo'].value='2';await h.dom['battle-tempo'].emit('change');await h.dom['level-camp-button'].click();let n=0;while(h.state.mode==='battle'&&n<2000){h.at(++n*250);h.tick();}assert.ok(n<2000);assert.equal(h.state.wins,1);assert.equal(h.state.mode,'town');assert.deepEqual(h.faults,[]);
 const cap=g.createGame(42);cap.hero.level=500;const c=fullUI(cap);assert.equal(c.dom['level-camp-button'].disabled,true);assert.match(c.dom['level-camp-status'].textContent,/沒有下一級/);
});
