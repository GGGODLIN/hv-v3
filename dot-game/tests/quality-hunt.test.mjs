import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
const tickUntil=(s,p,max=30000)=>{let n=0;while(!p(s)&&n++<max)g.advance(s,.1);assert.ok(n<max,'bounded natural progression');};
test('quality hunt starts identically to ordinary expedition; old inventory never fulfils target',()=>{
 const a=g.createGame(42),b=g.createGame(42);for(const s of[a,b])s.inventory.push({...s.equipment.weapon,id:'old-superior',quality:'Superior'});
 g.act(a,'startUntilQuality');g.act(b,'start');assert.deepEqual(a,b);assert.equal(g.qualityThenCampView(a).active,true);assert.equal(g.qualityThenCampView(a).reached,false);
 assert.equal(g.qualityThenCampView(g.validateSave(JSON.parse(JSON.stringify(a)))).active,false);
});
test('natural matching drop never interrupts waves; full rewards equal an explicit full-clear stop',()=>{
 const a=g.createGame(42),b=g.createGame(42);a.autoAdvance=b.autoAdvance=false;g.act(a,'startUntilQuality');g.act(b,'start');let n=0,observed=false;
 while(a.mode==='battle'&&n++<30000){
   g.advance(a,.1);g.advance(b,.1);
   const goal=g.qualityThenCampView(a);
   if(goal.reached){observed=true;assert.equal(a.mode,'battle');assert.equal(a._phase,'fight');g.act(b,'finishThenCamp',true);}
   if(a.mode==='battle')assert.deepEqual(a,b);
 }
 assert.ok(n<30000);assert.equal(a.mode,'town');assert.equal(a.wave,4);assert.ok(a.wins>=1);
 // A guaranteed-clear match is observed only at settlement; bring the control
 // out of its already-settled intermission without repeating any reward.
 if(b.mode==='battle')g.act(b,'finishThenCamp',true);
 assert.deepEqual(a,b);assert.deepEqual(g.expeditionReports(a),g.expeditionReports(b));
 assert.ok(g.expeditionReports(a)[0].loot.some(x=>['Superior','Exquisite','Magnificent','Legendary','Peerless'].includes(x.quality)));
 const done=JSON.stringify(a);g.advance(a,2);assert.equal(JSON.stringify(a),done);assert.equal(g.qualityThenCampView(a).active,false);
});
test('cancel preserves state and resumes regular repeating expeditions',()=>{
 const s=g.createGame(42);g.act(s,'startUntilQuality');const before=JSON.stringify(s);g.act(s,'cancelQualityThenCamp');assert.equal(JSON.stringify(s),before);assert.equal(g.qualityThenCampView(s).active,false);
 tickUntil(s,x=>x.wins===1);assert.equal(s.mode,'battle');tickUntil(s,x=>x.wave===1&&x._phase==='fight');assert.equal(g.qualityThenCampView(s).active,false);
});
test('explicit finish stop overrides quality; retreat and subsequent starts clear the old goal',()=>{
 const s=g.createGame(42);g.act(s,'startUntilQuality');g.act(s,'finishThenCamp',true);assert.equal(g.qualityThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,true);
 g.act(s,'finishThenCamp',false);assert.equal(g.qualityThenCampView(s).active,false);
 for(const action of ['start','startOnce','startUntilLevel']){g.act(s,'retreat');g.act(s,'startUntilQuality');g.act(s,'retreat');g.act(s,action);assert.equal(g.qualityThenCampView(s).active,false);}
});
test('capacity failure and invalid payload do not leave a hunting goal',()=>{
 const s=g.createGame(42);s.pendingLoot.push({...s.equipment.weapon,id:'pending'});g.act(s,'startUntilQuality');assert.equal(s.mode,'town');assert.equal(g.qualityThenCampView(s).active,false);
 const other=g.createGame(42);g.act(other,'startUntilQuality','Superior');assert.equal(other.mode,'town');assert.equal(g.qualityThenCampView(other).active,false);
 g.act(other,'startUntilQuality');g.act(other,'cancelQualityThenCamp',true);assert.equal(g.qualityThenCampView(other).active,true);g.clearFinishThenCamp(other);assert.equal(g.qualityThenCampView(other).active,false);
});
test('UI explains new held drops and preserves the automatic-sale policy',async()=>{
 const h=fullUI();assert.match(h.dom['quality-camp-status'].textContent,/既有自動出售規則不變/);await h.dom['quality-camp-button'].click();assert.equal(h.state.mode,'battle');assert.equal(g.qualityThenCampView(h.state).active,true);assert.match(h.dom['quality-camp-status'].textContent,/Superior/);
 await h.dom['quality-camp-button'].click();assert.equal(h.state.mode,'battle');assert.equal(g.qualityThenCampView(h.state).active,false);assert.deepEqual(h.faults,[]);
});
test('2x UI hunt returns to camp and never starts an extra expedition',async()=>{
 const h=fullUI();h.dom['battle-tempo'].value='2';await h.dom['battle-tempo'].emit('change');await h.dom['quality-camp-button'].click();let n=0;
 while(h.state.mode==='battle'&&n<10000){h.at(++n*250);h.tick();}
 assert.ok(n<10000);assert.equal(h.state.mode,'town');assert.equal(g.qualityThenCampView(h.state).active,false);const wins=h.state.wins;h.at((n+1)*250);h.tick();assert.equal(h.state.wins,wins);assert.deepEqual(h.faults,[]);
});
