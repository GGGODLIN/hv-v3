import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {createCommissionWeapon,createSoulboundItem} from '../src/loot.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
const snap=s=>JSON.stringify(s);
const until=(s,p,limit=30000)=>{let n=0;for(;n<limit&&!p();n++)g.advance(s,.1);assert.ok(p(),'bounded source progression');};
const durable=s=>({hero:s.hero,seed:s.seed,equipment:s.equipment,inventory:s.inventory,pendingLoot:s.pendingLoot,kills:s.kills,wins:s.wins,soulFragments:s.soulFragments,worldSeeds:s.worldSeeds,unlocked:s.unlocked,itemId:s._itemId,bestTimes:s.battle.bestTimes});

test('v075 audit: previous wins never spend new three-clear budget; full rewards settle once',()=>{
 const s=g.createGame(3);s.wins=50;g.act(s,'startThree');assert.equal(g.threeThenCampView(s).completed,0);
 until(s,()=>s.wins===51);assert.equal(g.threeThenCampView(s).completed,1);assert.equal(s.mode,'battle');
 until(s,()=>s.wins===52);assert.equal(g.threeThenCampView(s).completed,2);assert.equal(s.mode,'battle');
 until(s,()=>s.mode==='town');assert.equal(s.wins,53);assert.equal(s.wave,4);assert.equal(s.soulFragments,30);assert.equal(s.worldSeeds,3);assert.equal(g.expeditionReports(s)[0].outcome,'win');
 const end=snap(s);for(let n=0;n<100;n++)g.advance(s,2);assert.equal(snap(s),end);assert.equal(g.threeThenCampView(s).active,false);
});
for(const seed of [1,3,7])test(`v075 audit: ordinary loop rewards/RNG/report parity seed ${seed}`,()=>{
 const a=g.createGame(seed),b=g.createGame(seed);g.act(a,'startThree');g.act(b,'start');assert.equal(snap(a),snap(b));
 for(let n=0;n<30000&&a.mode==='battle';n++){g.advance(a,.1);g.advance(b,.1);}
 assert.equal(a.mode,'town');assert.equal(a.wins,3);assert.equal(b.mode,'battle');assert.deepEqual(durable(a),durable(b));assert.deepEqual(g.expeditionReports(a),g.expeditionReports(b));
});
test('v075 audit: intermission does not increment; repeated start does not reset progress',()=>{
 const s=g.createGame(42);g.act(s,'startThree');until(s,()=>s.wins===1);assert.equal(s._phase,'intermission');const before=snap(s);
 g.act(s,'startThree');assert.equal(snap(s),before);assert.equal(g.threeThenCampView(s).completed,1);
 for(let n=0;n<10;n++)g.advance(s,.1);assert.equal(s.wins,1);assert.equal(g.threeThenCampView(s).completed,1);
 until(s,()=>s.mode==='town');assert.equal(s.wins,3);
});
test('v075 audit: cancel is no-mutation and follows ordinary loop; invalid cancel cannot clear',()=>{
 const s=g.createGame(1);g.act(s,'startThree');until(s,()=>s.wins===1);const before=snap(s);g.act(s,'cancelThreeThenCamp',false);assert.equal(g.threeThenCampView(s).active,true);
 g.act(s,'cancelThreeThenCamp');assert.equal(snap(s),before);assert.equal(g.threeThenCampView(s).active,false);until(s,()=>s.wins===4);assert.equal(s.mode,'battle');
});
test('v075 audit: finish-current overrides budget; cancellation never resurrects old goal',()=>{
 const s=g.createGame(42);g.act(s,'startThree');g.act(s,'finishThenCamp',true);assert.equal(g.threeThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,true);
 g.act(s,'finishThenCamp',false);assert.equal(g.threeThenCampView(s).active,false);until(s,()=>s.wins===4);assert.equal(s.mode,'battle');
 g.act(s,'finishThenCamp',true);assert.equal(s.mode,'town');
});
test('v075 audit: normal/single/growth/quality starts cannot inherit three-run goal',()=>{
 const s=g.createGame(3);for(const action of ['start','startOnce','startUntilLevel','startUntilQuality']){g.act(s,'startThree');assert.equal(g.threeThenCampView(s).active,true);g.act(s,'retreat');g.act(s,action);assert.equal(g.threeThenCampView(s).active,false);g.act(s,'retreat');}
 g.act(s,'startThree');assert.equal(g.qualityThenCampView(s).active,false);assert.equal(g.levelThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,false);
});
test('v075 audit: malformed payload, full bag and pending fail without arming',()=>{
 for(const payload of [true,3,{},null]){const s=g.createGame(3),before=snap(s);g.act(s,'startThree',payload);assert.equal(snap(s),before);assert.equal(g.threeThenCampView(s).active,false);}
 for(const location of ['inventory','pendingLoot']){const s=g.createGame(3);s[location]=Array.from({length:location==='inventory'?116:1},(_,i)=>({...s.equipment.armor,id:'held-'+i}));g.act(s,'startThree');assert.equal(s.mode,'town');assert.equal(g.threeThenCampView(s).active,false);}
});
test('v075 audit: early capacity/defeat/reload clear intent without claiming three successes',()=>{
 const s=g.createGame(3);s.inventory=Array.from({length:115},(_,i)=>({...s.equipment.armor,id:'full-'+i}));g.act(s,'startThree');until(s,()=>s.mode==='town');assert.equal(s.wins,1);assert.equal(g.threeThenCampView(s).active,false);
 const d=g.createGame(3);g.act(d,'startThree');const loaded=g.validateSave(JSON.parse(snap(d)));assert.equal(loaded.mode,'town');assert.equal(g.threeThenCampView(loaded).active,false);
 d.hero.hp=1;d._enemyClock=1.8;d.enemies.forEach(e=>{e.hp=e.maxHp=1e5;e.attack=1e5;});until(d,()=>d.mode==='defeat');assert.equal(d.wins,0);assert.equal(g.threeThenCampView(d).active,false);
});
test('v075 audit: autoAdvance keeps prior route policy and target survives stage changes',()=>{
 const s=g.createGame(42);s.autoAdvance=true;s.equipment.weapon.stats.attack=10000;s.equipment.armor.stats.hp=100000;g.act(s,'startThree');until(s,()=>s.wins===1);until(s,()=>s.stage===2);assert.equal(g.threeThenCampView(s).completed,1);until(s,()=>s.mode==='town');assert.equal(s.wins,3);assert.equal(s.stage,3);assert.equal(s.autoAdvance,true);
});
test('v075 audit: Item World cannot arm or consume extra seeds for three-run intent',()=>{
 const s=g.createGame(3);s.hero.level=15;s.worldSeeds=3;s.equipment.weapon=createSoulboundItem({...createCommissionWeapon('axe',1),id:'bound-three-audit'},15);const quote=g.previewItemWorld(s,'bound-three-audit');assert.equal(quote.available,true);g.act(s,'enterItemWorld',quote);const before=snap(s);g.act(s,'startThree');assert.equal(snap(s),before);assert.equal(g.threeThenCampView(s).active,false);assert.equal(g.threeThenCampView(s).available,false);
});
test('v075 audit: UI clears through sync/import and guards readonly; 2x ends at exactly three',async()=>{
 const h=fullUI();await h.dom['three-camp-button'].click();assert.equal(g.threeThenCampView(h.state).active,true);assert.equal(h.dom['three-camp-button'].attributes['aria-pressed'],'true');h.run('syncSelection()');assert.equal(g.threeThenCampView(h.state).active,false);
 await h.dom['retreat-button'].click();await h.dom['three-camp-button'].click();await h.import(g.createGame(42));assert.equal(g.threeThenCampView(h.state).active,false);
 h.run('tabOwner=false');h.render();assert.equal(h.dom['three-camp-button'].disabled,true);const before=snap(h.state);await h.dom['three-camp-button'].click();assert.equal(snap(h.state),before);h.run('tabOwner=true');h.render();
 h.dom['battle-tempo'].value='2';await h.dom['battle-tempo'].emit('change');await h.dom['three-camp-button'].click();for(let n=1;n<=2400&&h.state.mode==='battle';n++){h.at(n*250);h.tick();}assert.equal(h.state.mode,'town');assert.equal(h.state.wins,3);const end=snap(h.state);for(let n=2401;n<2420;n++){h.at(n*250);h.tick();}assert.equal(snap(h.state),end);assert.deepEqual(h.faults,[]);
});
