import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGame } from '../src/engine.js';
import { fullUI, clone } from './helpers/comparison-focus-harness.mjs';
const source=process.env.WAVE_AUDIT_UI_SOURCE?readFileSync(process.env.WAVE_AUDIT_UI_SOURCE,'utf8'):undefined;
const setup=()=>fullUI(createGame(1),{source});
const label=h=>h.dom['progress-label'].textContent;
function repaintWithoutMutation(h){
 const before=JSON.stringify(h.state),reports=h.run('JSON.stringify(expeditionReports(state))'),calls=clone(h.calls),writes=clone(h.writes);
 h.render();h.render(false);
 assert.equal(JSON.stringify(h.state),before,'render must preserve all game fields including RNG and rewards');
 assert.equal(h.run('JSON.stringify(expeditionReports(state))'),reports,'render must preserve session reports');
 assert.deepEqual(h.calls,calls);assert.deepEqual(h.writes,writes);assert.deepEqual(h.faults,[]);
}
function begin(h){h.run("act(state,'start');render(true)");}
function naturalWin(h){
 begin(h);h.run("for(let i=0;i<2000&&state.wins===0&&state.mode==='battle';i++)advance(state,.1)");
 assert.equal(h.state.wins,1);assert.equal(h.state.mode,'battle');assert.equal(h.state._phase,'intermission');
}
test('wave progress audit: fresh camp and first battle both start at zero',()=>{
 const h=setup();assert.equal(label(h),'0 / 4');begin(h);assert.equal(label(h),'0 / 4');repaintWithoutMutation(h);
});
test('wave progress audit: naturally cleared intermediate waves report only completed waves',()=>{
 const h=setup();begin(h);const seen=new Set();
 for(let i=0;i<2000&&h.state.wins===0&&h.state.mode==='battle';i++){
  h.run('advance(state,.1)');
  if(h.state._phase==='fight'&&!seen.has(h.state.wave)){
   seen.add(h.state.wave);repaintWithoutMutation(h);assert.equal(label(h),`${h.state.wave-1} / 4`);
  }
 }
 assert.deepEqual([...seen],[1,2,3,4]);assert.equal(h.state.wins,1);
});
test('wave progress audit: natural victory displays four of four rather than three of four',()=>{
 const h=setup();naturalWin(h);repaintWithoutMutation(h);assert.equal(label(h),'4 / 4');
});
test('wave progress audit: completion stays full throughout the resting countdown',()=>{
 const h=setup();naturalWin(h);
 for(let i=0;i<5;i++){
  h.run('advance(state,.4)');assert.equal(h.state._phase,'intermission');repaintWithoutMutation(h);assert.equal(label(h),'4 / 4');
 }
});
test('wave progress audit: next automatic expedition resets to zero',()=>{
 const h=setup();naturalWin(h);
 h.run("for(let i=0;i<40&&state._phase==='intermission';i++)advance(state,.1)");
 assert.equal(h.state._phase,'fight');assert.equal(h.state.wave,1);repaintWithoutMutation(h);assert.equal(label(h),'0 / 4');
});
test('wave progress audit: retreat during victory countdown returns camp progress to zero',()=>{
 const h=setup();naturalWin(h);h.run("act(state,'retreat')");assert.equal(h.state.mode,'town');repaintWithoutMutation(h);assert.equal(label(h),'0 / 4');
});
test('wave progress audit: read-only viewer sees the same full completion without state or storage writes',()=>{
 const h=setup();naturalWin(h);h.run('tabOwner=false');repaintWithoutMutation(h);assert.equal(label(h),'4 / 4');
});
test('wave progress audit: defeat preserves the existing completed-wave count, never claims final-wave victory',()=>{
 const h=setup();begin(h);h.run("state.wave=4;state.hero.hp=0;state.mode='defeat';state._phase='idle'");
 repaintWithoutMutation(h);assert.equal(label(h),'3 / 4');
});
test('wave progress audit: victory count uses actual expedition length, not hardcoded four',()=>{
 const h=setup();begin(h);h.run("state.wave=7;state.totalWaves=7;state._phase='intermission'");
 repaintWithoutMutation(h);assert.equal(label(h),'7 / 7');
});

test('wave progress audit: finish-then-camp victory uses camp zero and never starts another expedition',()=>{
 const h=setup();begin(h);h.run("act(state,'finishThenCamp',true);for(let i=0;i<2000&&state.wins===0&&state.mode==='battle';i++)advance(state,.1)");
 assert.equal(h.state.wins,1);assert.equal(h.state.mode,'town');repaintWithoutMutation(h);assert.equal(label(h),'0 / 4');
 const before=JSON.stringify(h.state);h.run('advance(state,2)');assert.equal(JSON.stringify(h.state),before);
});
test('wave progress audit: an empty enemy list alone never claims completion during fight',()=>{
 const h=setup();begin(h);h.run("state.enemies=[];state.wave=2");repaintWithoutMutation(h);assert.equal(label(h),'1 / 4');
});
