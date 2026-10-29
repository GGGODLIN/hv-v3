import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const js=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const source=js.slice(js.indexOf('function expeditionLootContext('),js.indexOf('// Read only the detached departure snapshot'));
const receipt={id:'loot-1',name:'Old drop',slot:'weapon',quality:'Superior',level:3,disposition:'inventory',saleValue:0};
function harness(state){
 const calls=[];
 const node=(tag,className,text='')=>({tag,className,textContent:text,children:[],dataset:{},listeners:{},append(...children){this.children.push(...children);},setAttribute(k,v){this[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;}});
 const ctx={state,node,format:String,qualityName:String,selectedSlot:'armor',selectedId:null,lastInventorySignature:'old',lastReportSignature:'old',showToast:t=>calls.push(['toast',t]),render:f=>calls.push(['render',f]),$:id=>id==='camp-tab-gear'?{click:()=>calls.push(['gear'])}:{querySelector:()=>({focus:()=>calls.push(['focus'])})}};
 runInNewContext(`${source};globalThis.make=expeditionLootContext`,ctx);
 return {ctx,calls,make:value=>ctx.make(value)};
}
const walk=n=>[n,...n.children.flatMap(walk)];
const button=n=>walk(n).find(n=>n.tag==='button'&&typeof n.dataset.reportLootId==='string');
const text=n=>walk(n).map(n=>n.textContent).join(' ');
const empty=()=>({inventory:[],pendingLoot:[],equipment:{}});
test('owned receipt opens current item without mutating state or historical record',()=>{
 const s=empty();s.inventory.push({id:'loot-1',name:'Current growth',level:9});const h=harness(s),before=JSON.stringify(s),r=structuredClone(receipt),old=JSON.stringify(r),view=h.make([r]);
 button(view).listeners.click();assert.equal(h.ctx.selectedId,'loot-1');assert.equal(h.ctx.selectedSlot,null);assert.equal(JSON.stringify(s),before);assert.equal(JSON.stringify(r),old);assert.deepEqual(h.calls,[['render',true],['gear'],['focus']]);assert.match(text(view),/Old drop/);
});
test('equipped item resolves exact current slot and pending item uses existing detail selection',()=>{
 for(const place of ['equipment','pendingLoot']){const s=empty();if(place==='equipment')s.equipment.weapon={id:'loot-1'};else s.pendingLoot=[{id:'loot-1'}];const h=harness(s);button(h.make([receipt])).listeners.click();assert.equal(h.ctx.selectedSlot,place==='equipment'?'weapon':null);assert.equal(h.ctx.selectedId,place==='pendingLoot'?'loot-1':null);}
});
test('sold receipt has historical sale wording but no phantom action',()=>{
 const h=harness(empty()),v=h.make([{...receipt,disposition:'autoSold',saleValue:35}]);assert.equal(button(v),undefined);assert.match(text(v),/目前未持有/);assert.match(text(v),/實收 35/);
});
test('stale button rechecks ownership and cannot navigate or change selection',()=>{
 const s=empty();s.inventory=[{id:'loot-1'}];const h=harness(s),b=button(h.make([receipt]));s.inventory=[];b.listeners.click();assert.equal(h.ctx.selectedId,null);assert.equal(h.ctx.selectedSlot,'armor');assert.equal(h.ctx.lastReportSignature,'');assert.equal(h.calls.some(c=>c[0]==='gear'),false);assert.equal(h.calls[0][0],'toast');
});
test('ownership movement after render uses current destination rather than stale card',()=>{
 const s=empty();s.inventory=[{id:'loot-1'}];const h=harness(s),b=button(h.make([receipt]));s.inventory=[];s.equipment.weapon={id:'loot-1'};b.listeners.click();assert.equal(h.ctx.selectedSlot,'weapon');assert.equal(h.ctx.selectedId,null);
});
test('similar name or absent/malformed identifier never matches another owned item',()=>{
 const s=empty();s.inventory=[{id:'other',name:receipt.name}];const h=harness(s);for(const id of ['loot-1','',null,undefined])assert.equal(button(h.make([{...receipt,id}])),undefined);
});
test('battle and readonly inspection remains display-only with no added dispatch path',()=>{
 const s=empty();s.mode='battle';s.inventory=[{id:'loot-1'}];const h=harness(s);h.ctx.tabOwner=false;button(h.make([receipt])).listeners.click();assert.equal(h.ctx.selectedId,'loot-1');assert.doesNotMatch(source,/dispatch\(|save\(/);
});
test('report signature observes all ownership destinations, not just historical snapshots',()=>{
 const render=js.slice(js.indexOf('function renderExpeditionReports()'),js.indexOf('// Export a detached'));
 for(const part of ['state.inventory.map(item => item.id)','state.pendingLoot.map(item => item.id)','Object.values(state.equipment).map(item => item.id)'])assert.ok(render.includes(part));
});
