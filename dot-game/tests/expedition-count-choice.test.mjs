import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
const snapshot=s=>JSON.stringify(s);
function until(s,p,max=100000){let n=0;while(!p(s)&&n++<max)g.advance(s,.1);assert.ok(n<max,'bounded progression');}

test('count choices are fixed and legacy no-payload three action remains compatible',()=>{
 assert.deepEqual(g.EXPEDITION_COUNTS,[3,5,10]);assert.ok(Object.isFrozen(g.EXPEDITION_COUNTS));
 const a=g.createGame(42),b=g.createGame(42);g.act(a,'startThree');g.act(b,'startCount',3);
 assert.equal(snapshot(a),snapshot(b));assert.deepEqual(g.threeThenCampView(a),g.threeThenCampView(b));
});
for(const total of [3,5,10])test(`selected ${total} counts complete fresh expeditions and preserves ordinary rewards/RNG`,()=>{
 const a=g.createGame(42),b=g.createGame(42);a.wins=b.wins=20;
 g.act(a,'startCount',total);g.act(b,'start');assert.equal(snapshot(a),snapshot(b));
 assert.equal(g.threeThenCampView(a).total,total);
 for(let count=1;count<=total;count++){
  until(a,s=>s.wins===20+count);until(b,s=>s.wins===20+count);
  if(count<total){
   assert.equal(a.mode,'battle');assert.equal(g.threeThenCampView(a).completed,count);
   assert.equal(g.threeThenCampView(a).remaining,total-count);assert.equal(snapshot(a),snapshot(b));
   g.act(a,'startCount',total===10?3:10);assert.equal(g.threeThenCampView(a).total,total);
  }
 }
 g.act(b,'finishThenCamp',true);assert.equal(a.mode,'town');assert.equal(snapshot(a),snapshot(b));
 const stopped=snapshot(a);g.advance(a,30);assert.equal(snapshot(a),stopped);
});
test('strict invalid count payload and blocked departure never arm or mutate',()=>{
 for(const payload of [undefined,null,true,0,1,4,6,11,3.5,NaN,Infinity,'3','5','10',{},[],{total:5}]){
  const s=g.createGame(42),before=snapshot(s);g.act(s,'startCount',payload);
  assert.equal(snapshot(s),before);assert.equal(g.threeThenCampView(s).active,false);
 }
 const s=g.createGame(42);s.pendingLoot.push({...s.equipment.weapon,id:'pending'});
 const ordinary=JSON.parse(snapshot(s));g.act(ordinary,'start');g.act(s,'startCount',10);assert.equal(snapshot(s),snapshot(ordinary));assert.equal(g.threeThenCampView(s).active,false);
});
test('selected count is transient, detached view cannot alter captured budget',()=>{
 const s=g.createGame(42);g.act(s,'startCount',10);
 const view=g.threeThenCampView(s);view.total=3;view.completed=9;
 assert.equal(g.threeThenCampView(s).total,10);assert.equal(g.threeThenCampView(s).completed,0);
 const restored=g.validateSave(JSON.parse(snapshot(s)));assert.equal(g.threeThenCampView(restored).active,false);
 g.act(s,'cancelThreeThenCamp');assert.equal(g.threeThenCampView(s).active,false);assert.equal(s.mode,'battle');
});
test('UI selection is preparation only, captured at departure, guarded during battle and reset on import',async()=>{
 const h=fullUI(),before=snapshot(h.state);
 assert.equal(h.dom['three-camp-count'].value,'3');
 h.dom['three-camp-count'].value='5';await h.dom['three-camp-count'].emit('change');
 assert.equal(snapshot(h.state),before);assert.match(h.dom['three-camp-button'].textContent,/5 場/);
 await h.dom['three-camp-button'].click();assert.equal(g.threeThenCampView(h.state).total,5);
 assert.equal(h.dom['three-camp-count'].disabled,true);assert.match(h.dom['three-camp-status'].textContent,/0／5/);
 h.dom['three-camp-count'].value='10';await h.dom['three-camp-count'].emit('change');
 assert.equal(h.dom['three-camp-count'].value,'5');assert.equal(g.threeThenCampView(h.state).total,5);
 await h.import(g.createGame(42));assert.equal(h.dom['three-camp-count'].value,'3');assert.equal(g.threeThenCampView(h.state).active,false);
 assert.deepEqual(h.faults,[]);
});
for(const total of [5,10])test(`UI 2x chosen ${total} stops with exact successful count`,async()=>{
 const h=fullUI();
 h.dom['three-camp-count'].value=String(total);await h.dom['three-camp-count'].emit('change');
 h.dom['battle-tempo'].value='2';await h.dom['battle-tempo'].emit('change');
 await h.dom['three-camp-button'].click();
 let n=0;while(h.state.mode==='battle'&&n<12000){h.at(++n*250);h.tick();}
 assert.ok(n<12000);assert.equal(h.state.mode,'town');assert.equal(h.state.wins,total);
 h.render();assert.equal(h.dom['three-camp-count'].value,String(total));assert.equal(h.dom['three-camp-count'].disabled,false);
 assert.deepEqual(h.faults,[]);
});
