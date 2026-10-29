import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
const good=['Superior','Exquisite','Magnificent','Legendary','Peerless'];
for(const slot of ['weapon','armor','accessory'])test(`slot hunt ${slot}: correct new loot, full settlement and exact control parity`,()=>{
 const a=g.createGame(42),b=g.createGame(42);a.autoAdvance=b.autoAdvance=false;
 g.act(a,'startUntilQuality',slot);g.act(b,'start');assert.deepEqual(a,b);
 assert.equal(g.qualityThenCampView(a).slot,slot);
 let n=0,wrongObserved=false;
 while(a.mode==='battle'&&n++<10000){
  g.advance(a,.1);g.advance(b,.1);
  const goal=g.qualityThenCampView(a);
  if(goal.reached){assert.equal(a.mode,'battle');assert.ok(a.inventory.some(i=>i.id===goal.matched.id&&i.slot===slot&&good.includes(i.quality)));g.act(b,'finishThenCamp',true);}
  if(goal.active&&!goal.reached&&a.inventory.some(i=>good.includes(i.quality)&&i.slot!==slot))wrongObserved=true;
  if(a.mode==='battle')assert.deepEqual(a,b);
 }
 assert.ok(n<10000);assert.equal(a.mode,'town');assert.equal(a.wave,4);
 if(b.mode==='battle')g.act(b,'finishThenCamp',true);
 assert.deepEqual(a,b);assert.deepEqual(g.expeditionReports(a),g.expeditionReports(b));
 assert.ok(g.expeditionReports(a)[0].loot.some(i=>i.slot===slot&&good.includes(i.quality)));
 if(slot!=='weapon')assert.equal(wrongObserved,true);
});
test('undefined and any goals are identical; invalid values leave state untouched',()=>{
 const a=g.createGame(42),b=g.createGame(42);g.act(a,'startUntilQuality');g.act(b,'startUntilQuality','any');
 for(let n=0;n<1000&&a.mode==='battle';n++){g.advance(a,.1);g.advance(b,.1);assert.deepEqual(a,b);assert.deepEqual(g.qualityThenCampView(a),g.qualityThenCampView(b));}
 for(const bad of [null,true,{},[],1,'','Superior','Weapon','__proto__']){const s=g.createGame(42),before=JSON.stringify(s);g.act(s,'startUntilQuality',bad);assert.equal(JSON.stringify(s),before);assert.equal(g.qualityThenCampView(s).active,false);}
});
test('slot fixed during battle; cancel, retreat, finish and load clear transient target',()=>{
 const s=g.createGame(42);g.act(s,'startUntilQuality','armor');const before=JSON.stringify(s);
 g.act(s,'startUntilQuality','weapon');assert.equal(g.qualityThenCampView(s).slot,'armor');assert.equal(JSON.stringify(s),before);
 assert.equal(g.qualityThenCampView(g.validateSave(JSON.parse(before))).active,false);
 g.act(s,'cancelQualityThenCamp');assert.equal(JSON.stringify(s),before);assert.equal(g.qualityThenCampView(s).slot,'any');
 g.act(s,'retreat');g.act(s,'startUntilQuality','accessory');g.act(s,'finishThenCamp',true);assert.equal(g.qualityThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,true);
});
test('camp UI slot selection has no state mutation and fixes target until cancellation',async()=>{
 const h=fullUI();const select=h.dom['quality-camp-slot'];assert.equal(select.value,'any');const before=JSON.stringify(h.state);
 select.value='armor';await select.emit('change');assert.equal(JSON.stringify(h.state),before);assert.match(h.dom['quality-camp-status'].textContent,/護甲/);
 await h.dom['quality-camp-button'].click();assert.equal(g.qualityThenCampView(h.state).slot,'armor');assert.equal(select.disabled,true);
 select.value='weapon';await select.emit('change');assert.equal(select.value,'armor');assert.equal(g.qualityThenCampView(h.state).slot,'armor');
 await h.dom['quality-camp-button'].click();assert.equal(g.qualityThenCampView(h.state).active,false);assert.equal(select.disabled,true);assert.deepEqual(h.faults,[]);
});
test('fresh UI defaults any and invalid selector input is ignored',async()=>{
 const h=fullUI();h.dom['quality-camp-slot'].value='invalid';await h.dom['quality-camp-slot'].emit('change');assert.equal(h.dom['quality-camp-slot'].value,'any');assert.equal(h.state.mode,'town');assert.deepEqual(h.faults,[]);
});
