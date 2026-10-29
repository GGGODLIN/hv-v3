import test from 'node:test';
import assert from 'node:assert/strict';
import * as g from '../src/engine.js';
import {createCommissionWeapon,createSoulboundItem,generateItem} from '../src/loot.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
const snap=s=>JSON.stringify(s);
const until=(s,p,limit=20000)=>{for(let n=0;n<limit&&!p();n++)g.advance(s,.1);assert.ok(p(),'bounded source simulation reached state');};
const reward=s=>({hero:s.hero,seed:s.seed,equipment:s.equipment,inventory:s.inventory,pendingLoot:s.pendingLoot,kills:s.kills,wins:s.wins,soulFragments:s.soulFragments,worldSeeds:s.worldSeeds,unlocked:s.unlocked,itemId:s._itemId,bestTimes:s.battle.bestTimes});

test('v072 audit: old qualifying inventory and rejected payload do not arm or satisfy a hunt',()=>{
 const s=g.createGame(3);s.inventory.push({...createCommissionWeapon('axe',1),id:'old-superior',quality:'Superior'});const before=snap(s);
 g.act(s,'startUntilQuality',true);assert.equal(snap(s),before);assert.equal(g.qualityThenCampView(s).active,false);
 g.act(s,'startUntilQuality');assert.equal(g.qualityThenCampView(s).reached,false);until(s,()=>s.wins===1);assert.equal(s.mode,'battle');assert.equal(g.qualityThenCampView(s).reached,false);
 until(s,()=>s.mode==='town');assert.equal(s.wins,2);
});
test('v072 audit: mid-wave qualifying drop keeps combat alive until all four waves settle',()=>{
 const s=g.createGame(1);g.act(s,'startUntilQuality');until(s,()=>g.qualityThenCampView(s).reached);assert.ok(s.wave<4);assert.equal(s.wins,0);assert.equal(s.mode,'battle');
 const m=g.qualityThenCampView(s).matched;assert.equal(m.quality,'Superior');assert.ok(s.inventory.some(i=>i.id===m.id));
 until(s,()=>s.mode==='town');assert.equal(s.wave,4);assert.equal(s.wins,1);assert.equal(s.soulFragments,10);assert.equal(s.worldSeeds,1);assert.equal(g.expeditionReports(s)[0].outcome,'win');assert.equal(g.qualityThenCampView(s).active,false);
 const settled=snap(s);for(let n=0;n<100;n++)g.advance(s,2);assert.equal(snap(s),settled);
});
test('v072 audit: last guaranteed drop can satisfy hunt only after full reward settlement',()=>{
 const s=g.createGame(5);g.act(s,'startUntilQuality');until(s,()=>s.wave===4);assert.equal(g.qualityThenCampView(s).reached,false);
 until(s,()=>s.mode==='town');assert.equal(s.wins,1);assert.equal(g.expeditionReports(s)[0].loot.at(-1).quality,'Exquisite');assert.equal(s.soulFragments,10);
});
for(const seed of [1,3,7])test(`v072 audit: active hunt versus ordinary repeat rewards/RNG/reports parity seed${seed}`,()=>{
 const a=g.createGame(seed),b=g.createGame(seed);g.act(a,'startUntilQuality');g.act(b,'start');assert.equal(snap(a),snap(b));
 for(let n=0;n<20000&&a.mode==='battle';n++){g.advance(a,.1);g.advance(b,.1);}
 assert.equal(a.mode,'town');assert.equal(b.mode,'battle');assert.deepEqual(reward(a),reward(b));assert.deepEqual(g.expeditionReports(a),g.expeditionReports(b));
});
test('v072 audit: matched view is detached and cancellation after finding loot does not retreat',()=>{
 const s=g.createGame(1);g.act(s,'startUntilQuality');until(s,()=>g.qualityThenCampView(s).reached);const first=g.qualityThenCampView(s).matched;
 g.qualityThenCampView(s).matched.name='mutated';assert.deepEqual(g.qualityThenCampView(s).matched,first);
 const before=snap(s);g.act(s,'cancelQualityThenCamp',false);assert.equal(g.qualityThenCampView(s).reached,true);g.act(s,'cancelQualityThenCamp');assert.equal(snap(s),before);assert.equal(g.qualityThenCampView(s).active,false);
 until(s,()=>s.wins===2);assert.equal(s.mode,'battle');
});
test('v072 audit: explicit finish-current overrides hunt and its cancellation cannot resurrect hunt',()=>{
 const s=g.createGame(3);g.act(s,'startUntilQuality');g.act(s,'finishThenCamp',true);assert.equal(g.qualityThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,true);
 g.act(s,'finishThenCamp',false);assert.equal(g.qualityThenCampView(s).active,false);until(s,()=>s.wins===2);assert.equal(s.mode,'battle');
});
test('v072 audit: growth/single/ordinary modes cannot retain a prior hunt',()=>{
 const s=g.createGame(3);g.act(s,'startUntilQuality');g.act(s,'startUntilLevel');assert.equal(g.levelThenCampView(s).active,false);assert.equal(g.qualityThenCampView(s).active,true);
 for(const action of ['startUntilLevel','startOnce','start']){g.act(s,'retreat');g.act(s,action);assert.equal(g.qualityThenCampView(s).active,false);}
 g.act(s,'retreat');g.act(s,'startUntilQuality');assert.equal(g.levelThenCampView(s).active,false);assert.equal(g.finishThenCampView(s).queued,false);
});
test('v072 audit: failed start, defeat, retreat and canonical reload clear or refuse intent',()=>{
 const s=g.createGame(3);s.inventory=Array.from({length:116},(_,i)=>({...s.equipment.armor,id:`f-${i}`}));g.act(s,'startUntilQuality');assert.equal(s.mode,'town');assert.equal(g.qualityThenCampView(s).active,false);
 s.inventory=[];s.pendingLoot=[{...s.equipment.armor,id:'pending'}];g.act(s,'startUntilQuality');assert.equal(g.qualityThenCampView(s).active,false);s.pendingLoot=[];
 g.act(s,'startUntilQuality');const loaded=g.validateSave(JSON.parse(snap(s)));assert.equal(g.qualityThenCampView(loaded).active,false);assert.equal(loaded.mode,'town');
 s.hero.hp=1;s._enemyClock=1.8;s.enemies.forEach(e=>{e.hp=1e5;e.maxHp=1e5;e.attack=1e5;});until(s,()=>s.mode==='defeat',1000);assert.equal(g.qualityThenCampView(s).active,false);
 g.act(s,'retreat');g.act(s,'start');assert.equal(g.qualityThenCampView(s).active,false);
});
test('v072 audit: capacity stop before qualifying drop clears intent and preserves reward',()=>{
 const s=g.createGame(3);s.inventory=Array.from({length:115},(_,i)=>({...s.equipment.armor,id:`capacity-${i}`}));g.act(s,'startUntilQuality');until(s,()=>s.mode!=='battle');
 assert.equal(s.mode,'town');assert.equal(s.wins,1);assert.equal(g.expeditionReports(s)[0].loot[0].quality,'Average');assert.equal(g.qualityThenCampView(s).active,false);
});
test('v072 audit: qualifying drop delivered to pending still qualifies without granting twice',()=>{
 const s=g.createGame(1);g.act(s,'startUntilQuality');s.inventory=Array.from({length:120},(_,i)=>({...s.equipment.armor,id:`controlled-full-${i}`}));
 until(s,()=>g.qualityThenCampView(s).reached);const m=g.qualityThenCampView(s).matched;assert.equal(m.disposition,'pending');assert.equal(s.pendingLoot.filter(i=>i.id===m.id).length,1);
 until(s,()=>s.mode==='town');assert.equal(s.wins,1);assert.equal(s.pendingLoot.filter(i=>i.id===m.id).length,1);
});
test('v072 audit: automatic low-quality sale does not qualify, Superior remains held',()=>{
 const s=g.createGame(7);s.inventory=['weapon','armor','accessory'].flatMap(slot=>Array.from({length:3},(_,n)=>{let k=0;return {...generateItem(()=>k++===0?(n+.1)/3:0,3,slot),id:`keeper-${slot}-${n}`,locked:true,stats:{attack:1e5,defense:1e5,hp:1e5,crit:1,evade:1,block:1,parry:1}};}));g.act(s,'setAutoSell',true);g.act(s,'startUntilQuality');
 until(s,()=>s.wins===1);assert.equal(s.mode,'battle');assert.equal(g.qualityThenCampView(s).reached,false);assert.ok(g.expeditionReports(s)[0].loot.some(i=>i.disposition==='autoSold'));
 until(s,()=>s.mode==='town');const m=g.expeditionReports(s)[0].loot.find(i=>['Superior','Exquisite','Magnificent','Legendary','Peerless'].includes(i.quality));assert.ok(m);assert.equal(m.disposition,'inventory');assert.ok(s.inventory.some(i=>i.id===m.id));
});
test('v072 audit: Item World excludes hunt without consuming additional resources',()=>{
 const s=g.createGame(3);s.hero.level=15;s.worldSeeds=3;s.equipment.weapon=createSoulboundItem({...createCommissionWeapon('axe',1),id:'bound-audit'},15);const q=g.previewItemWorld(s,'bound-audit');assert.equal(q.available,true);g.act(s,'enterItemWorld',q);const before=snap(s);
 assert.equal(g.qualityThenCampView(s).available,false);g.act(s,'startUntilQuality');assert.equal(snap(s),before);assert.equal(g.qualityThenCampView(s).active,false);
});
test('v072 audit: UI controls preserve no-mutation cancel, clear sync/import and reject readonly',async()=>{
 const h=fullUI();await h.dom['quality-camp-button'].click();assert.equal(g.qualityThenCampView(h.state).active,true);assert.equal(h.dom['quality-camp-button'].attributes['aria-pressed'],'true');const before=snap(h.state);
 await h.dom['quality-camp-button'].click();assert.equal(snap(h.state),before);assert.equal(g.qualityThenCampView(h.state).active,false);
 await h.dom['retreat-button'].click();await h.dom['quality-camp-button'].click();h.run('syncSelection()');assert.equal(g.qualityThenCampView(h.state).active,false);
 await h.dom['retreat-button'].click();await h.dom['quality-camp-button'].click();await h.import(g.createGame(17));assert.equal(g.qualityThenCampView(h.state).active,false);
 h.run('tabOwner=false');h.render();assert.equal(h.dom['quality-camp-button'].disabled,true);const readonly=snap(h.state);await h.dom['quality-camp-button'].click();assert.equal(snap(h.state),readonly);assert.deepEqual(h.faults,[]);
});
test('v072 audit: 2x timer stops after quality clear and never reopens next expedition',async()=>{
 const h=fullUI(g.createGame(1));h.dom['battle-tempo'].value='2';await h.dom['battle-tempo'].emit('change');await h.dom['quality-camp-button'].click();
 for(let n=1;n<=800&&h.state.mode==='battle';n++){h.at(n*250);h.tick();}assert.equal(h.state.mode,'town');assert.equal(h.state.wins,1);const ended=snap(h.state);
 for(let n=801;n<=820;n++){h.at(n*250);h.tick();}assert.equal(snap(h.state),ended);h.render();assert.equal(h.dom['quality-camp-button'].attributes['aria-pressed'],'false');assert.deepEqual(h.faults,[]);
});
