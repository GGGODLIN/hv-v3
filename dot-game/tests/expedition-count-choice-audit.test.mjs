import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
const snap=s=>JSON.stringify(s);
const until=(s,p)=>{for(let n=0;n<60000&&!p();n++)g.advance(s,.1);assert.ok(p(),'bounded progression');};
const durable=s=>({hero:s.hero,seed:s.seed,equipment:s.equipment,inventory:s.inventory,pendingLoot:s.pendingLoot,kills:s.kills,wins:s.wins,soulFragments:s.soulFragments,worldSeeds:s.worldSeeds,unlocked:s.unlocked,itemId:s._itemId,bestTimes:s.battle.bestTimes});
for(const count of [3,5,10])test(`v076 audit: ${count} complete settlements preserve ordinary loop RNG/reward/report parity`,()=>{
 const a=g.createGame(3),b=g.createGame(3);a.wins=b.wins=50;
 g.act(a,'startCount',count);g.act(b,'start');assert.equal(snap(a),snap(b));assert.equal(g.threeThenCampView(a).total,count);
 for(let n=0;n<60000&&a.mode==='battle';n++){g.advance(a,.1);g.advance(b,.1);}
 assert.equal(a.mode,'town');assert.equal(a.wins,50+count);assert.equal(b.mode,'battle');assert.equal(a.wave,4);
 assert.deepEqual(durable(a),durable(b));assert.deepEqual(g.expeditionReports(a),g.expeditionReports(b));
 assert.equal(a.soulFragments,count*10);assert.equal(a.worldSeeds,count);assert.equal(g.threeThenCampView(a).active,false);
 const end=snap(a);for(let n=0;n<50;n++)g.advance(a,2);assert.equal(snap(a),end);
});
test('v076 audit: legacy default is compatible and enum cannot be extended',()=>{
 assert.deepEqual(g.EXPEDITION_COUNTS,[3,5,10]);assert.ok(Object.isFrozen(g.EXPEDITION_COUNTS));
 const a=g.createGame(7),b=g.createGame(7);g.act(a,'startThree');g.act(b,'startCount',3);assert.equal(snap(a),snap(b));assert.deepEqual(g.threeThenCampView(a),g.threeThenCampView(b));
 for(const payload of [3,5,10]){const s=g.createGame(7),before=snap(s);g.act(s,'startThree',payload);assert.equal(snap(s),before);}
});
test('v076 audit: invalid count values never depart or consume RNG',()=>{
 for(const payload of [undefined,null,true,false,0,1,2,4,6,9,11,-3,3.1,NaN,Infinity,'3','5','10',{},[],[3]]){const s=g.createGame(3),before=snap(s);g.act(s,'startCount',payload);assert.equal(snap(s),before);assert.equal(g.threeThenCampView(s).active,false);}
});
test('v076 audit: active target is immutable in fight/rest and intermission is not a clear',()=>{
 const s=g.createGame(3);g.act(s,'startCount',10);let before=snap(s);g.act(s,'startCount',5);assert.equal(snap(s),before);assert.equal(g.threeThenCampView(s).total,10);
 until(s,()=>s.wins===1);assert.equal(s._phase,'intermission');before=snap(s);g.act(s,'startCount',3);assert.equal(snap(s),before);for(let n=0;n<10;n++)g.advance(s,.1);assert.equal(g.threeThenCampView(s).completed,1);assert.equal(g.threeThenCampView(s).remaining,9);
});
test('v076 audit: cancel and finish-current override do not resurrect count goal',()=>{
 const s=g.createGame(3);g.act(s,'startCount',5);const before=snap(s);g.act(s,'cancelThreeThenCamp');assert.equal(snap(s),before);until(s,()=>s.wins===6);assert.equal(s.mode,'battle');g.act(s,'retreat');
 g.act(s,'startCount',10);g.act(s,'finishThenCamp',true);assert.equal(g.threeThenCampView(s).active,false);g.act(s,'finishThenCamp',false);assert.equal(g.threeThenCampView(s).active,false);g.act(s,'finishThenCamp',true);until(s,()=>s.mode==='town');assert.equal(s.wins,7);
});
test('v076 audit: capacity, defeat, save load and retreat clear nondefault count intent',()=>{
 const s=g.createGame(3);s.inventory=Array.from({length:115},(_,i)=>({...s.equipment.armor,id:`audit-cap-${i}`}));g.act(s,'startCount',10);until(s,()=>s.mode==='town');assert.equal(s.wins,1);assert.equal(g.threeThenCampView(s).active,false);
 const d=g.createGame(3);g.act(d,'startCount',5);const loaded=g.validateSave(JSON.parse(snap(d)));assert.equal(loaded.mode,'town');assert.equal(g.threeThenCampView(loaded).active,false);assert.equal(g.threeThenCampView(loaded).total,3);
 d.hero.hp=1;d._enemyClock=1.8;d.enemies.forEach(e=>{e.hp=e.maxHp=1e5;e.attack=1e5;});until(d,()=>d.mode==='defeat');assert.equal(d.wins,0);assert.equal(g.threeThenCampView(d).active,false);
 const r=g.createGame(3);g.act(r,'startCount',10);g.act(r,'retreat');g.act(r,'start');assert.equal(g.threeThenCampView(r).active,false);
});
test('v076 audit: UI choice is preparation only, immutable during battle and reset on sync/import',async()=>{
 const h=fullUI(g.createGame(3)),select=h.dom['three-camp-count'];assert.equal(select.value,'3');const before=snap(h.state);select.value='10';await select.emit('change');assert.equal(snap(h.state),before);assert.match(h.dom['three-camp-button'].textContent,/10/);
 await h.dom['three-camp-button'].click();assert.equal(g.threeThenCampView(h.state).total,10);assert.equal(select.disabled,true);select.value='5';await select.emit('change');assert.equal(g.threeThenCampView(h.state).total,10);assert.equal(select.value,'10');
 h.run('syncSelection()');h.render();assert.equal(g.threeThenCampView(h.state).active,false);assert.equal(select.value,'3');
 await h.import(g.createGame(3));select.value='5';await select.emit('change');await h.import(g.createGame(7));assert.equal(select.value,'3');assert.equal(h.run('threeCampCount'),3);assert.deepEqual(h.faults,[]);
});
test('v076 audit: invalid UI values and readonly stale change cannot change preparation',async()=>{
 const h=fullUI(),select=h.dom['three-camp-count'];for(const value of ['4','03','5.0','', 'Infinity']){select.value=value;await select.emit('change');assert.equal(select.value,'3');assert.equal(h.run('threeCampCount'),3);}
 h.run('tabOwner=false');h.render();assert.equal(select.disabled,true);assert.equal(h.dom['three-camp-button'].disabled,true);const before=snap(h.state);select.value='10';await select.emit('change');assert.equal(snap(h.state),before);assert.equal(h.run('threeCampCount'),3);assert.deepEqual(h.faults,[]);
});
test('v076 audit: 2x DOM session stops at ten and freezes post-settlement',async()=>{
 const h=fullUI(g.createGame(3));h.dom['three-camp-count'].value='10';await h.dom['three-camp-count'].emit('change');h.dom['battle-tempo'].value='2';await h.dom['battle-tempo'].emit('change');await h.dom['three-camp-button'].click();
 let n=1;for(;n<=8000&&h.state.mode==='battle';n++){h.at(n*250);h.tick();}assert.equal(h.state.mode,'town');assert.equal(h.state.wins,10);assert.equal(h.state.soulFragments,100);assert.equal(h.state.worldSeeds,10);assert.equal(g.threeThenCampView(h.state).active,false);const before=snap(h.state);for(let k=0;k<25;k++,n++){h.at(n*250);h.tick();}assert.equal(snap(h.state),before);assert.deepEqual(h.faults,[]);
});
