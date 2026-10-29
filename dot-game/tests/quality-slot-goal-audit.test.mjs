import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
const snap=s=>JSON.stringify(s);
const until=(s,p,limit=30000)=>{for(let n=0;n<limit&&!p();n++)g.advance(s,.1);assert.ok(p(),'bounded simulation reaches assertion');};
const reward=s=>({hero:s.hero,seed:s.seed,equipment:s.equipment,inventory:s.inventory,pendingLoot:s.pendingLoot,kills:s.kills,wins:s.wins,soulFragments:s.soulFragments,worldSeeds:s.worldSeeds,unlocked:s.unlocked,itemId:s._itemId,bestTimes:s.battle.bestTimes});
for(const slot of ['weapon','armor','accessory'])test(`v073 audit: ${slot} target observes only new qualifying slot and preserves rewards/RNG`,()=>{
 const a=g.createGame(1),b=g.createGame(1);g.act(a,'startUntilQuality',slot);g.act(b,'start');assert.equal(snap(a),snap(b));assert.equal(g.qualityThenCampView(a).slot,slot);
 for(let n=0;n<30000&&a.mode==='battle';n++){
  g.advance(a,.1);g.advance(b,.1);
  if(g.qualityThenCampView(a).reached){const goal=g.qualityThenCampView(a);const item=a.inventory.concat(a.pendingLoot).find(i=>i.id===goal.matched.id);assert.equal(item.slot,slot);assert.ok(['Superior','Exquisite','Magnificent','Legendary','Peerless'].includes(item.quality));}
 }
 assert.equal(a.mode,'town');assert.equal(a.wave,4);assert.deepEqual(reward(a),reward(b));assert.deepEqual(g.expeditionReports(a),g.expeditionReports(b));
 assert.ok(g.expeditionReports(a)[0].loot.some(i=>i.slot===slot&&['Superior','Exquisite','Magnificent','Legendary','Peerless'].includes(i.quality)));
 const before=snap(a);for(let n=0;n<20;n++)g.advance(a,2);assert.equal(snap(a),before);
});
test('v073 audit: wrong-slot Superior continues beyond whole first expedition',()=>{
 const s=g.createGame(1);g.act(s,'startUntilQuality','weapon');until(s,()=>s.wins===1);assert.equal(s.mode,'battle');assert.equal(g.qualityThenCampView(s).reached,false);assert.equal(g.qualityThenCampView(s).slot,'weapon');
 assert.ok(g.expeditionReports(s)[0].loot.some(i=>i.slot==='armor'&&i.quality==='Superior'));
 until(s,()=>s.mode==='town');assert.equal(s.wins,2);
});
test('v073 audit: omitted selection and explicit any have identical play and do not use existing qualifying gear',()=>{
 const a=g.createGame(1),b=g.createGame(1);for(const s of [a,b])s.inventory.push({...s.equipment.weapon,id:'old-superior',quality:'Superior'});
 g.act(a,'startUntilQuality');g.act(b,'startUntilQuality','any');assert.equal(g.qualityThenCampView(a).slot,'any');assert.equal(g.qualityThenCampView(a).reached,false);
 for(let n=0;n<30000&&a.mode==='battle';n++){g.advance(a,.1);g.advance(b,.1);assert.equal(snap(a),snap(b));assert.deepEqual(g.qualityThenCampView(a),g.qualityThenCampView(b));}
 assert.equal(a.mode,'town');assert.equal(a.wins,1);
});
test('v073 audit: unknown values reject atomically and cannot change an active fixed slot',()=>{
 for(const value of [null,true,false,0,1,'','Superior','WEAPON','weapon ',{},[],{slot:'weapon'}]){const s=g.createGame(1),before=snap(s);g.act(s,'startUntilQuality',value);assert.equal(snap(s),before);assert.equal(g.qualityThenCampView(s).active,false);}
 const s=g.createGame(1);g.act(s,'startUntilQuality','weapon');const before=snap(s);g.act(s,'startUntilQuality','armor');assert.equal(snap(s),before);assert.equal(g.qualityThenCampView(s).slot,'weapon');
});
test('v073 audit: pending qualifying slot counts exactly once without modifying delivery',()=>{
 const a=g.createGame(1),b=g.createGame(1);g.act(a,'startUntilQuality','armor');g.act(b,'start');for(const s of [a,b])s.inventory=Array.from({length:120},(_,n)=>({...s.equipment.armor,id:`controlled-full-${n}`}));
 until(a,()=>g.qualityThenCampView(a).reached);const match=g.qualityThenCampView(a).matched;assert.equal(match.disposition,'pending');assert.equal(a.pendingLoot.filter(i=>i.id===match.id).length,1);
 until(a,()=>a.mode==='town');until(b,()=>b.mode==='town');assert.deepEqual(reward(a),reward(b));assert.deepEqual(g.expeditionReports(a),g.expeditionReports(b));assert.equal(a.pendingLoot.filter(i=>i.id===match.id).length,1);
});
test('v073 audit: failed start leaves no fixed goal; cancellation/override/reload cannot resurrect it',()=>{
 const s=g.createGame(1);s.pendingLoot=[{...s.equipment.armor,id:'waiting'}];const before=snap(s);g.act(s,'startUntilQuality','armor');assert.equal(s.mode,'town');assert.equal(g.qualityThenCampView(s).active,false);s.pendingLoot=[];
 g.act(s,'startUntilQuality','weapon');const active=snap(s);g.act(s,'cancelQualityThenCamp');assert.equal(snap(s),active);assert.equal(g.qualityThenCampView(s).active,false);
 g.act(s,'retreat');g.act(s,'startUntilQuality','accessory');g.act(s,'finishThenCamp',true);assert.equal(g.qualityThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,true);g.act(s,'finishThenCamp',false);assert.equal(g.qualityThenCampView(s).active,false);
 g.act(s,'retreat');g.act(s,'startUntilQuality','armor');const reloaded=g.validateSave(JSON.parse(snap(s)));assert.equal(reloaded.mode,'town');assert.equal(g.qualityThenCampView(reloaded).active,false);assert.equal(g.qualityThenCampView(reloaded).slot,'any');
});
test('v073 audit: preparation has no game/save side effects and preserves native select focus',async()=>{
 const h=fullUI();const select=h.dom['quality-camp-slot'];assert.equal(select.value,'any');assert.equal(select.disabled,false);const before=snap(h.state),writes=h.writes.length,calls=h.calls.length;
 select.focus();select.value='weapon';await select.emit('change');assert.equal(h.document.activeElement,select);assert.equal(snap(h.state),before);assert.equal(h.writes.length,writes);assert.equal(h.calls.length,calls);assert.match(h.dom['quality-camp-status'].textContent,/武器/);assert.match(h.dom['quality-camp-status'].textContent,/不提高掉率/);
 select.value='INVALID';await select.emit('change');assert.equal(select.value,'weapon');assert.equal(snap(h.state),before);assert.equal(h.writes.length,writes);assert.deepEqual(h.faults,[]);
});
test('v073 audit: battle change event cannot replace the fixed target, cancel only clears goal',async()=>{
 const h=fullUI();const select=h.dom['quality-camp-slot'];select.value='accessory';await select.emit('change');await h.dom['quality-camp-button'].click();assert.equal(g.qualityThenCampView(h.state).slot,'accessory');assert.equal(select.disabled,true);
 const before=snap(h.state),writes=h.writes.length;select.value='armor';await select.emit('change');assert.equal(select.value,'accessory');assert.equal(g.qualityThenCampView(h.state).slot,'accessory');assert.equal(snap(h.state),before);assert.equal(h.writes.length,writes);
 await h.dom['quality-camp-button'].click();assert.equal(g.qualityThenCampView(h.state).active,false);assert.equal(h.state.mode,'battle');assert.equal(select.disabled,true);assert.deepEqual(h.faults,[]);
});
test('v073 audit: readonly selector cannot take ownership or change game/selection',async()=>{
 const h=fullUI();h.run('tabOwner=false');h.render();const select=h.dom['quality-camp-slot'];assert.equal(select.disabled,true);const before=snap(h.state),writes=h.writes.length,calls=h.calls.length;
 select.value='armor';await select.emit('change');assert.equal(h.run('tabOwner'),false);assert.equal(select.value,'any');assert.equal(snap(h.state),before);assert.equal(h.writes.length,writes);assert.equal(h.calls.length,calls);assert.deepEqual(h.faults,[]);
});
test('v073 audit: import/adoption resets preparation and active goal; fresh UI defaults any',async()=>{
 const h=fullUI();h.dom['quality-camp-slot'].value='weapon';await h.dom['quality-camp-slot'].emit('change');await h.dom['quality-camp-button'].click();assert.equal(g.qualityThenCampView(h.state).slot,'weapon');
 h.run('syncSelection()');h.render();assert.equal(g.qualityThenCampView(h.state).active,false);assert.equal(h.dom['quality-camp-slot'].value,'any');
 await h.dom['retreat-button'].click();h.dom['quality-camp-slot'].value='armor';await h.dom['quality-camp-slot'].emit('change');await h.import(g.createGame(9));assert.equal(h.dom['quality-camp-slot'].value,'any');assert.equal(g.qualityThenCampView(h.state).active,false);
 assert.equal(fullUI(JSON.parse(snap(h.state))).dom['quality-camp-slot'].value,'any');assert.deepEqual(h.faults,[]);
});
