import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
const snap=s=>JSON.stringify(s);
const high=['Exquisite','Magnificent','Legendary','Peerless'];
const until=(s,p)=>{for(let n=0;n<50000&&!p();n++)g.advance(s,.1);assert.ok(p(),'bounded simulation reaches condition');};
const reward=s=>({hero:s.hero,seed:s.seed,inventory:s.inventory,pendingLoot:s.pendingLoot,equipment:s.equipment,kills:s.kills,wins:s.wins,soulFragments:s.soulFragments,worldSeeds:s.worldSeeds,unlocked:s.unlocked,itemId:s._itemId,best:s.battle.bestTimes});
for(const slot of ['any','weapon','armor','accessory'])test(`v074 audit: Exquisite ${slot} requires both thresholds and retains exact RNG/reward/report parity`,()=>{
 const a=g.createGame(1),b=g.createGame(1);g.act(a,'startUntilQuality',{slot,threshold:'Exquisite'});g.act(b,'start');assert.equal(snap(a),snap(b));let matched=null;
 for(let n=0;n<50000&&a.mode==='battle';n++){g.advance(a,.1);g.advance(b,.1);const goal=g.qualityThenCampView(a);if(goal.reached){matched=goal.matched;assert.equal(goal.threshold,'Exquisite');const item=a.inventory.concat(a.pendingLoot).find(i=>i.id===matched.id);assert.ok(high.includes(item.quality));assert.ok(slot==='any'||item.slot===slot);}}
 assert.ok(matched);assert.equal(a.mode,'town');assert.equal(a.wave,4);assert.deepEqual(reward(a),reward(b));assert.deepEqual(g.expeditionReports(a),g.expeditionReports(b));assert.equal(g.qualityThenCampView(a).active,false);
 const before=snap(a);for(let n=0;n<20;n++)g.advance(a,2);assert.equal(snap(a),before);
});
test('v074 audit: new Superior is kept but does not satisfy Exquisite and old high gear does not count',()=>{
 const s=g.createGame(1);s.inventory.push({...s.equipment.weapon,id:'old-legendary',quality:'Legendary'});g.act(s,'startUntilQuality',{slot:'any',threshold:'Exquisite'});assert.equal(g.qualityThenCampView(s).reached,false);until(s,()=>s.wins===1);assert.equal(s.mode,'battle');assert.equal(g.qualityThenCampView(s).reached,false);assert.ok(g.expeditionReports(s)[0].loot.some(i=>i.quality==='Superior'));until(s,()=>s.mode==='town');assert.equal(s.wins,2);
});
test('v074 audit: all legacy slot payloads and explicit Superior objects are identical',()=>{
 for(const slot of ['any','weapon','armor','accessory']){const a=g.createGame(1),b=g.createGame(1);g.act(a,'startUntilQuality',slot);g.act(b,'startUntilQuality',{slot,threshold:'Superior'});for(let n=0;n<5000&&a.mode==='battle';n++){g.advance(a,.1);g.advance(b,.1);assert.equal(snap(a),snap(b));assert.deepEqual(g.qualityThenCampView(a),g.qualityThenCampView(b));}assert.equal(a.mode,'town');}
 const s=g.createGame(1);g.act(s,'startUntilQuality');assert.equal(g.qualityThenCampView(s).threshold,'Superior');
});
test('v074 audit: invalid or incomplete goal payloads refuse atomically',()=>{
 for(const payload of [{},{slot:'any'},{threshold:'Exquisite'},{slot:'any',threshold:'Legendary'},{slot:'any',threshold:'Average'},{slot:'any',threshold:null},{slot:'any',threshold:'exquisite'},{slot:'any',threshold:'Exquisite',extra:true},{slot:'bad',threshold:'Exquisite'},['any','Exquisite'],Object.create({slot:'any',threshold:'Exquisite'})]){const s=g.createGame(1),before=snap(s);g.act(s,'startUntilQuality',payload);assert.equal(snap(s),before);assert.equal(g.qualityThenCampView(s).active,false);}
});
test('v074 audit: active goal fixed; cancel/finish/reload clear instead of reviving',()=>{
 const s=g.createGame(1);g.act(s,'startUntilQuality',{slot:'weapon',threshold:'Exquisite'});const before=snap(s);g.act(s,'startUntilQuality',{slot:'any',threshold:'Superior'});assert.equal(snap(s),before);assert.equal(g.qualityThenCampView(s).threshold,'Exquisite');assert.equal(g.qualityThenCampView(s).slot,'weapon');
 g.act(s,'cancelQualityThenCamp');assert.equal(snap(s),before);assert.equal(g.qualityThenCampView(s).active,false);g.act(s,'retreat');g.act(s,'startUntilQuality',{slot:'armor',threshold:'Exquisite'});g.act(s,'finishThenCamp',true);assert.equal(g.qualityThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,true);g.act(s,'finishThenCamp',false);assert.equal(g.qualityThenCampView(s).active,false);
 g.act(s,'retreat');g.act(s,'startUntilQuality',{slot:'any',threshold:'Exquisite'});const loaded=g.validateSave(JSON.parse(snap(s)));assert.equal(g.qualityThenCampView(loaded).active,false);assert.equal(g.qualityThenCampView(loaded).threshold,'Superior');
});
test('v074 audit: failed departure does not retain quality intent',()=>{
 const s=g.createGame(1);s.pendingLoot=[{...s.equipment.armor,id:'waiting'}];g.act(s,'startUntilQuality',{slot:'any',threshold:'Exquisite'});assert.equal(s.mode,'town');assert.equal(g.qualityThenCampView(s).active,false);assert.equal(g.qualityThenCampView(s).threshold,'Superior');
});
test('v074 audit: UI selection is local, focus stable and label agrees with gear quality',async()=>{
 const h=fullUI();const q=h.dom['quality-camp-threshold'];assert.equal(q.value,'Superior');const before=snap(h.state),writes=h.writes.length,calls=h.calls.length;q.focus();q.value='Exquisite';await q.emit('change');assert.equal(h.document.activeElement,q);assert.equal(snap(h.state),before);assert.equal(h.writes.length,writes);assert.equal(h.calls.length,calls);assert.match(h.dom['quality-camp-status'].textContent,/精良（Exquisite）/);assert.match(h.dom['quality-camp-status'].textContent,/不提高掉率/);assert.match(h.dom['quality-camp-button'].textContent,/精良/);
 q.value='Legendary';await q.emit('change');assert.equal(q.value,'Exquisite');assert.equal(snap(h.state),before);assert.deepEqual(h.faults,[]);
});
test('v074 audit: battle synthetic change and readonly change cannot replace threshold',async()=>{
 const h=fullUI();const q=h.dom['quality-camp-threshold'];q.value='Exquisite';await q.emit('change');h.dom['quality-camp-slot'].value='armor';await h.dom['quality-camp-slot'].emit('change');await h.dom['quality-camp-button'].click();assert.equal(q.disabled,true);const before=snap(h.state),writes=h.writes.length;q.value='Superior';await q.emit('change');assert.equal(q.value,'Exquisite');assert.equal(g.qualityThenCampView(h.state).threshold,'Exquisite');assert.equal(snap(h.state),before);assert.equal(h.writes.length,writes);
 const r=fullUI();r.run('tabOwner=false');r.render();const s=snap(r.state),rw=r.writes.length,rc=r.calls.length;r.dom['quality-camp-threshold'].value='Exquisite';await r.dom['quality-camp-threshold'].emit('change');assert.equal(r.dom['quality-camp-threshold'].value,'Superior');assert.equal(r.run('tabOwner'),false);assert.equal(snap(r.state),s);assert.equal(r.writes.length,rw);assert.equal(r.calls.length,rc);assert.deepEqual(h.faults.concat(r.faults),[]);
});
test('v074 audit: sync/import/fresh UI reset quality and slot preparation',async()=>{
 const h=fullUI();h.dom['quality-camp-threshold'].value='Exquisite';await h.dom['quality-camp-threshold'].emit('change');h.dom['quality-camp-slot'].value='weapon';await h.dom['quality-camp-slot'].emit('change');await h.dom['quality-camp-button'].click();h.run('syncSelection()');h.render();assert.equal(g.qualityThenCampView(h.state).active,false);assert.equal(h.dom['quality-camp-threshold'].value,'Superior');assert.equal(h.dom['quality-camp-slot'].value,'any');await h.dom['retreat-button'].click();h.dom['quality-camp-threshold'].value='Exquisite';await h.dom['quality-camp-threshold'].emit('change');await h.import(g.createGame(7));assert.equal(h.dom['quality-camp-threshold'].value,'Superior');assert.equal(fullUI(JSON.parse(snap(h.state))).dom['quality-camp-threshold'].value,'Superior');assert.deepEqual(h.faults,[]);
});
