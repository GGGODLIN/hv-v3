import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createContext,runInContext} from 'node:vm';
import * as game from '../src/engine.js';
import {generateItem,createCommissionWeapon,createSoulboundItem,QUALITY_TIERS} from '../src/loot.js';
import {beforeLootReport} from './helpers/loot-report-baseline.mjs';
const code=readFileSync(new URL('../src/engine.js',import.meta.url),'utf8');
const old=beforeLootReport(code,'src/engine.js');
assert.equal(createHash('sha256').update(old).digest('hex'),'ad114d6656f0867fc5994a0152674d913ecc3e8ded2ee0bbcb12c7f22be9c52b','exact accepted v069 baseline');
const base=await import('data:text/javascript;base64,'+Buffer.from(old.replace("'./loot.js'",JSON.stringify(new URL('../src/loot.js',import.meta.url).href))).toString('base64'));
const clone=structuredClone;
function ready(api,{seed=42,auto=false,pending=false,cap=false,iw=false}={}){
 const s=api.createGame(seed);
 if(iw){s.hero.level=15;s.worldSeeds=3;s.equipment.weapon=createSoulboundItem({...createCommissionWeapon('axe',1),id:'bound-audit'},15);}
 if(auto)s.inventory=['weapon','armor','accessory'].flatMap(slot=>Array.from({length:3},(_,n)=>{let k=0;return {...generateItem(()=>k++===0?(n+.1)/3:0,3,slot),id:`keeper-${slot}-${n}`,locked:true,stats:{attack:1e5,defense:1e5,hp:1e5,crit:1,evade:1,block:1}};}));
 if(auto)api.act(s,'setAutoSell',true);
 if(iw){const q=api.previewItemWorld(s,'bound-audit');assert.equal(q.available,true,q.reason);api.act(s,'enterItemWorld',q);}else api.act(s,'startOnce');
 if(cap)s.hero.gold=1e12;
 if(pending)while(s.inventory.length<115)s.inventory.push({...clone(s.equipment.armor),id:`filler-${s.inventory.length}`});
 return s;
}
const dropSeed=Array.from({length:10000},(_,i)=>i).find(i=>((Math.imul(i,1664525)+1013904223)>>>0)/4294967296<.14);
function killOne(api,s){
 const e=s.enemies.find(e=>e.hp>0);assert.ok(e);e.hp=1;e.bleeding={stacks:1,expiresAtTick:s.timing.ticks+7,damagePerTick:1};
 s.seed=dropSeed;s._clock=-100;s._enemyClock=-100;s.timing.tu=(s.timing.ticks+1)*100-.001;api.advance(s,.01);
}
function clear(api,s){let n=0;while(s.mode==='battle'&&s._phase==='fight'){killOne(api,s);assert.ok(++n<=8);}return api.expeditionReports(s)[0];}
for(const config of [{},{auto:true},{pending:true},{auto:true,cap:true,pending:true},{iw:true},{iw:true,pending:true}])test(`audit v070 strict v069 state parity ${JSON.stringify(config)}`,()=>{
 const s=ready(game,config),b=ready(base,config);assert.deepEqual(s,b);let n=0;
 while(s.mode==='battle'&&s._phase==='fight'){killOne(game,s);killOne(base,b);assert.deepEqual(s,b);assert.ok(++n<=8);}
 const report=game.expeditionReports(s)[0],oldReport=base.expeditionReports(b)[0];const {loot,...rest}=report;assert.deepEqual(rest,oldReport);assert.ok(loot.length>0);
});
test('audit v070 complete supported maxima: six ordinary drops and seven IW drops, no IW boss clear drop',()=>{
 const normal=ready(game),iw=ready(game,{iw:true});const a=clear(game,normal),b=clear(game,iw);
 assert.equal(a.loot.length,6);assert.equal(b.loot.length,7);assert.equal(normal.kills,6);assert.equal(iw.kills,8);
 assert.equal(new Set(a.loot.map(i=>i.id)).size,6);assert.equal(new Set(b.loot.map(i=>i.id)).size,7);
});
test('audit v070 pending receipt retains original disposition after later FIFO claim',()=>{
 const s=ready(game,{pending:true});const report=clear(game,s);assert.equal(report.loot.filter(i=>i.disposition==='pending').length,1);
 const pending=report.loot.at(-1);assert.equal(s.pendingLoot[0].id,pending.id);
 s.inventory.splice(0,1);game.act(s,'claimPending');assert.equal(s.pendingLoot.length,0);assert.ok(s.inventory.some(i=>i.id===pending.id));assert.deepEqual(game.expeditionReports(s)[0],report);
});
test('audit v070 exact successful auto-sale receipt and cap refusal records retained item',()=>{
 const sold=ready(game,{auto:true}),kept=ready(game,{auto:true,cap:true});const a=clear(game,sold),b=clear(game,kept);
 assert.ok(a.loot.some(i=>i.disposition==='autoSold'));
 for(const entry of a.loot.filter(i=>i.disposition==='autoSold')){assert.ok(entry.saleValue>0);assert.ok(!sold.inventory.some(i=>i.id===entry.id));}
 assert.ok(b.loot.every(i=>i.disposition==='inventory'&&i.saleValue===0));assert.equal(kept.hero.gold,1e12);
});
test('audit v070 caller and held-item edits cannot mutate saved drop snapshots',()=>{
 const s=ready(game);const original=clear(game,s);const view=game.expeditionReports(s);view[0].loot[0].name='caller';view[0].loot.push({id:'fake'});view.length=0;
 const item=s.inventory.find(i=>i.id===original.loot[0].id);item.name='later name';item.level=99;
 assert.deepEqual(game.expeditionReports(s)[0],original);const before=JSON.stringify(s);game.expeditionReports(s);assert.equal(JSON.stringify(s),before);
});
test('audit v070 reports remain bounded and do not leak previous-run drops into empty retreat',()=>{
 const s=ready(game);const first=clear(game,s);game.act(s,'start');game.act(s,'retreat');const second=game.expeditionReports(s)[0];assert.deepEqual(second.loot,[]);assert.deepEqual(game.expeditionReports(s)[1],first);
 game.act(s,'start');game.act(s,'retreat');assert.equal(game.expeditionReports(s).length,2);assert.deepEqual(game.expeditionReports(s).map(r=>r.loot),[[],[]]);
});
test('audit v070 canonical import ignores forged loot-report history',()=>{
 const s=ready(game);clear(game,s);const raw=clone(s);raw.reports=[{loot:[{id:'forged'}]}];raw.loot=[{id:'forged'}];
 const restored=game.validateSave(raw);assert.deepEqual(game.expeditionReports(restored),[]);assert.ok(!Object.hasOwn(restored,'reports'));assert.ok(!Object.hasOwn(restored,'loot'));
});
test('audit v070 partial retreat preserves only actual pre-retreat drops and duplicate settlement is inert',()=>{
 const s=ready(game);killOne(game,s);game.act(s,'retreat');const r=game.expeditionReports(s)[0];assert.equal(r.outcome,'retreat');assert.equal(r.loot.length,1);game.act(s,'retreat');game.advance(s,1);assert.deepEqual(game.expeditionReports(s),[r]);
});
test('audit v070 report loot UI is collapsed safe text with historical and missing-data distinctions',()=>{
 const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');const fn=ui.slice(ui.indexOf('function expeditionLootContext('),ui.indexOf('// Read only the detached departure snapshot'));
 const node=(tag,className='',text='')=>({tag,className,textContent:String(text),children:[],append(...items){this.children.push(...items);}});
 const ctx=createContext({state:{equipment:{},inventory:[],pendingLoot:[]},node,format:String,qualityName:q=>QUALITY_TIERS.find(t=>t.name===q)?.label||q});runInContext(fn,ctx);const render=arg=>{ctx.arg=arg;return runInContext('expeditionLootContext(arg)',ctx);};const text=n=>n.textContent+' '+n.children.map(text).join(' ');
 assert.match(text(render(undefined)),/未記錄掉寶明細/);assert.match(text(render([])),/本場沒有取得裝備/);
 const n=render([{id:'x',name:'<img onerror=attack>',slot:'weapon',quality:'Superior',level:3,disposition:'pending',saleValue:0}]);
 assert.equal(n.tag,'details');assert.equal(n.open,undefined);assert.match(text(n),/取得當時/);assert.match(text(n),/不代表目前仍持有/);assert.match(text(n),/不會再發獎/);assert.match(text(n),/送至待領區/);assert.ok(text(n).includes(QUALITY_TIERS.find(t=>t.name==='Superior').label));assert.ok(text(n).includes('<img onerror=attack>'));assert.ok(!fn.includes('innerHTML'));
});
test('audit v070 existing export and pin preserve detached drop receipt without state writes',async()=>{
 const s=ready(game);const report=clear(game,s),before=JSON.stringify(s);const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 const functions=ui.slice(ui.indexOf('function exportRecentExpeditionReport('),ui.indexOf('function clearPinnedExpeditionReport('));let blob;
 const ctx=createContext({state:s,expeditionReports:game.expeditionReports,Blob,Date,JSON,
 URL:{createObjectURL(value){blob=value;return 'blob:audit';},revokeObjectURL(){}},
 node:()=>({click(){},remove(){}}),document:{body:{append(){}}},setTimeout(){},showToast(){},renderExpeditionReports(){}});
 runInContext('let pinnedExpeditionReport=null;'+functions+';pinRecentExpeditionReport();exportRecentExpeditionReport();',ctx);
 const record=JSON.parse(await blob.text());assert.deepEqual(record.report.loot,report.loot);assert.equal(record.format,'hv-v3-dot-expedition-report');
 const pinned=runInContext('pinnedExpeditionReport',ctx);pinned.loot[0].name='changed pin';assert.deepEqual(game.expeditionReports(s)[0],report);assert.equal(JSON.stringify(s),before);
});
