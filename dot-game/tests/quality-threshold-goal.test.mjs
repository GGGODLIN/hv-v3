import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
for(const slot of ['any','weapon','armor','accessory'])test(`Exquisite goal ${slot} filters new loot with exact control parity`,()=>{
 const a=g.createGame(42),b=g.createGame(42);a.autoAdvance=b.autoAdvance=false;
 g.act(a,'startUntilQuality',{slot,threshold:'Exquisite'});g.act(b,'start');assert.deepEqual(a,b);
 let n=0,matched=false;
 while(a.mode==='battle'&&n++<30000){g.advance(a,.1);g.advance(b,.1);const goal=g.qualityThenCampView(a);
  if(goal.reached){matched=true;assert.equal(goal.threshold,'Exquisite');assert.ok(['Exquisite','Magnificent','Legendary','Peerless'].includes(goal.matched.quality));assert.ok(a.inventory.some(i=>i.id===goal.matched.id&&(slot==='any'||i.slot===slot)));g.act(b,'finishThenCamp',true);}
  if(a.mode==='battle')assert.deepEqual(a,b);
 }
 assert.ok(n<30000);assert.equal(a.mode,'town');assert.equal(a.wave,4);assert.ok(g.expeditionReports(a)[0].loot.some(i=>['Exquisite','Magnificent','Legendary','Peerless'].includes(i.quality)&&(slot==='any'||i.slot===slot)));if(b.mode==='battle')g.act(b,'finishThenCamp',true);assert.deepEqual(a,b);assert.deepEqual(g.expeditionReports(a),g.expeditionReports(b));
});
test('explicit Superior object is identical to legacy string and no-payload start',()=>{
 for(const payload of [undefined,'any']){const a=g.createGame(42),b=g.createGame(42);g.act(a,'startUntilQuality',payload);g.act(b,'startUntilQuality',{slot:'any',threshold:'Superior'});for(let i=0;i<2000&&a.mode==='battle';i++){g.advance(a,.1);g.advance(b,.1);assert.deepEqual(a,b);assert.deepEqual(g.qualityThenCampView(a),g.qualityThenCampView(b));}}
});
test('invalid threshold objects fail closed without state or intent mutation',()=>{
 for(const payload of [{slot:'any'},{threshold:'Exquisite'},{slot:'any',threshold:'Legendary'},{slot:'any',threshold:null},{slot:'any',threshold:'Superior',extra:true},{slot:'none',threshold:'Exquisite'},[],Object.create({slot:'any',threshold:'Exquisite'})]){const s=g.createGame(42),before=JSON.stringify(s);g.act(s,'startUntilQuality',payload);assert.equal(JSON.stringify(s),before);assert.equal(g.qualityThenCampView(s).active,false);}
});
test('UI threshold choice is local, matches selected slot, fixed in battle and resets on new UI',async()=>{
 const h=fullUI(),select=h.dom['quality-camp-threshold'];assert.equal(select.value,'Superior');const before=JSON.stringify(h.state);
 select.value='Exquisite';await select.emit('change');h.dom['quality-camp-slot'].value='armor';await h.dom['quality-camp-slot'].emit('change');assert.equal(JSON.stringify(h.state),before);assert.match(h.dom['quality-camp-status'].textContent,/精良/);
 await h.dom['quality-camp-button'].click();assert.equal(g.qualityThenCampView(h.state).threshold,'Exquisite');assert.equal(g.qualityThenCampView(h.state).slot,'armor');assert.equal(select.disabled,true);
 select.value='Superior';await select.emit('change');assert.equal(select.value,'Exquisite');assert.equal(g.qualityThenCampView(h.state).threshold,'Exquisite');
 await h.dom['quality-camp-button'].click();assert.equal(g.qualityThenCampView(h.state).active,false);assert.deepEqual(h.faults,[]);assert.equal(fullUI().dom['quality-camp-threshold'].value,'Superior');
});
