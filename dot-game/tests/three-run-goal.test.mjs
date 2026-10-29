import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
function until(s,p,max=40000){let n=0;while(!p(s)&&n++<max)g.advance(s,.1);assert.ok(n<max,'bounded progression');}
test('three-clear start equals ordinary state and no durable goal',()=>{
 const a=g.createGame(42),b=g.createGame(42);g.act(a,'startThree');g.act(b,'start');assert.equal(JSON.stringify(a),JSON.stringify(b));
 assert.equal(g.threeThenCampView(a).remaining,3);assert.equal(g.threeThenCampView(g.validateSave(JSON.parse(JSON.stringify(a)))).active,false);
});
test('three complete ordinary victories stop after full reward, never historical wins',()=>{
 const a=g.createGame(42),b=g.createGame(42);a.wins=b.wins=8;g.act(a,'startThree');g.act(b,'start');
 for(let count=1;count<=3;count++){
   until(a,s=>s.wins===8+count);until(b,s=>s.wins===8+count);
   if(count<3){assert.equal(a.mode,'battle');assert.equal(g.threeThenCampView(a).completed,count);assert.equal(JSON.stringify(a),JSON.stringify(b));}
 }
 g.act(b,'finishThenCamp',true);assert.equal(a.mode,'town');assert.equal(a.wave,4);assert.equal(a.wins,11);assert.equal(JSON.stringify(a),JSON.stringify(b));
 const done=JSON.stringify(a);g.advance(a,2);assert.equal(JSON.stringify(a),done);assert.equal(g.threeThenCampView(a).active,false);
});
test('cancel during fight and intermission keeps current expedition and ordinary repeat',()=>{
 for(const duringRest of [false,true]){const s=g.createGame(42);g.act(s,'startThree');if(duringRest)until(s,x=>x.wins===1);const before=JSON.stringify(s);g.act(s,'cancelThreeThenCamp');assert.equal(JSON.stringify(s),before);assert.equal(g.threeThenCampView(s).active,false);until(s,x=>x.wins===3);assert.equal(s.mode,'battle');}
});
test('current-expedition stop supersedes three goal; cancelling stop does not resurrect it',()=>{
 const s=g.createGame(42);g.act(s,'startThree');g.act(s,'finishThenCamp',true);assert.equal(g.threeThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,true);
 g.act(s,'finishThenCamp',false);assert.equal(g.threeThenCampView(s).active,false);until(s,x=>x.wins===3);assert.equal(s.mode,'battle');
});
test('invalid payload and failed start never acquire goal; repeat start cannot reset it',()=>{
 for(const p of [true,3,null,{},'3']){const s=g.createGame(42);g.act(s,'startThree',p);assert.equal(s.mode,'town');assert.equal(g.threeThenCampView(s).active,false);}
 const s=g.createGame(42);s.pendingLoot.push({...s.equipment.weapon,id:'pending'});g.act(s,'startThree');assert.equal(s.mode,'town');assert.equal(g.threeThenCampView(s).active,false);
 const a=g.createGame(42);g.act(a,'startThree');until(a,s=>s.wins===1);g.act(a,'startThree');assert.equal(g.threeThenCampView(a).completed,1);
});
test('retreat and explicit clear remove budget before any next goal',()=>{
 for(const next of ['start','startOnce','startUntilLevel','startUntilQuality']){const s=g.createGame(42);g.act(s,'startThree');g.act(s,'retreat');g.act(s,next);assert.equal(g.threeThenCampView(s).active,false);}
 const s=g.createGame(42);g.act(s,'startThree');g.clearFinishThenCamp(s);assert.equal(g.threeThenCampView(s).active,false);
});
test('UI starts and cancels, 2x completes exactly three clears',async()=>{
 const h=fullUI();await h.dom['three-camp-button'].click();assert.equal(h.state.mode,'battle');assert.match(h.dom['three-camp-status'].textContent,/0／3/);assert.equal(h.dom['three-camp-button'].disabled,false);
 await h.dom['three-camp-button'].click();assert.equal(g.threeThenCampView(h.state).active,false);assert.equal(h.state.mode,'battle');await h.dom['retreat-button'].click();
 h.dom['battle-tempo'].value='2';await h.dom['battle-tempo'].emit('change');await h.dom['three-camp-button'].click();let n=0;while(h.state.mode==='battle'&&n<4000){h.at(++n*250);h.tick();}assert.ok(n<4000);assert.equal(h.state.wins,3);assert.equal(h.state.mode,'town');assert.deepEqual(h.faults,[]);
});
