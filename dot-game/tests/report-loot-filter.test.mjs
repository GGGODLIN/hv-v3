import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const source=ui.slice(ui.indexOf('function expeditionLootContext('),ui.indexOf('// Read only the detached departure snapshot'));
const item=(slot,id=slot)=>({id,name:id,slot,level:3,quality:'Superior',disposition:'inventory',saleValue:0});
const walk=n=>[n,...n.children.flatMap(walk)];
function render(loot,state={inventory:[],pendingLoot:[],equipment:{},hero:{gold:99}}){
 const node=(tag,className,text='')=>({tag,className,textContent:String(text),children:[],dataset:{},attributes:{},events:{},append(...children){this.children.push(...children);},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.events[k]=f;}});
 return runInNewContext(`${source};expeditionLootContext(loot)`,{loot,state,node,format:String,qualityName:String});
}
const buttons=n=>walk(n).filter(n=>n.dataset.reportLootSlot);
const choose=(n,slot)=>buttons(n).find(n=>n.dataset.reportLootSlot===slot).events.click();
const shown=n=>walk(n).filter(n=>n.tag==='li'&&!n.hidden).map(n=>n.textContent.split(' · ')[0]);
const totals=n=>walk(n).filter(n=>n.className==='report-loot-summary').map(n=>n.textContent).join('\n');
const status=n=>walk(n).find(n=>n.attributes.role==='status').textContent;
test('slot filters retain original receipt order and all restores unknown entries',()=>{
 const view=render([item('armor','a'),item('weapon','w1'),item('accessory','x'),item('weapon','w2'),item('mystery','u'),null]);
 assert.deepEqual(shown(view),['a','w1','x','w2','u','未記錄']);
 choose(view,'weapon');assert.deepEqual(shown(view),['w1','w2']);assert.match(status(view),/顯示武器：2 \/ 6 件/);
 choose(view,'armor');assert.deepEqual(shown(view),['a']);
 choose(view,'accessory');assert.deepEqual(shown(view),['x']);
 choose(view,'all');assert.deepEqual(shown(view),['a','w1','x','w2','u','未記錄']);
});
test('buttons have explicit group, labels, type and pressed states',()=>{
 const view=render([item('weapon')]);
 assert.equal(walk(view).find(n=>n.attributes.role==='group').attributes['aria-label'],'本場掉寶部位篩選');
 assert.equal(buttons(view).length,4);
 for(const b of buttons(view)){assert.equal(b.type,'button');assert.match(b.attributes['aria-label'],/^本場掉寶：/);}
 assert.deepEqual(buttons(view).map(b=>b.attributes['aria-pressed']),['true','false','false','false']);
 choose(view,'accessory');assert.deepEqual(buttons(view).map(b=>b.attributes['aria-pressed']),['false','false','false','true']);
});
test('no match and zero receipt are explicit, missing receipt is not fabricated',()=>{
 const view=render([item('weapon')]);choose(view,'armor');assert.deepEqual(shown(view),[]);assert.match(status(view),/顯示護甲：0 \/ 1 件 · 沒有符合部位的掉寶/);
 const empty=render([]);choose(empty,'weapon');assert.match(status(empty),/0 \/ 0 件/);
 for(const missing of [undefined,null,{}])assert.equal(buttons(render(missing)).length,0);
});
test('filtering preserves whole-run totals and frozen receipt/live state',()=>{
 const loot=Object.freeze([Object.freeze(item('weapon')),Object.freeze({...item('armor'),disposition:'autoSold',saleValue:27})]);
 const state={inventory:[],pendingLoot:[],equipment:{},hero:{gold:999}};const before=JSON.stringify({loot,state});
 const view=render(loot,state),summary=totals(view);
 for(const slot of ['weapon','armor','accessory','all']){choose(view,slot);assert.equal(totals(view),summary);assert.match(status(view),/上方摘要為本場全部掉寶，不受篩選影響/);}
 assert.match(summary,/合計：27 金幣/);assert.equal(JSON.stringify({loot,state}),before);
});
test('each report has independent local filter and rebuild defaults to all',()=>{
 const loot=[item('weapon'),item('armor')],recent=render(loot),pinned=render(loot);
 choose(recent,'weapon');assert.deepEqual(shown(pinned),['weapon','armor']);choose(pinned,'armor');assert.deepEqual(shown(recent),['weapon']);assert.deepEqual(shown(render(loot)),['weapon','armor']);
});
test('filter preserves existing ownership inspect controls rather than recreating rewards',()=>{
 const owned=item('weapon','owned'),view=render([owned,item('armor')],{inventory:[owned],pendingLoot:[],equipment:{}});
 const inspect=walk(view).find(n=>n.dataset.reportLootId==='owned');assert.ok(inspect);assert.equal(typeof inspect.events.click,'function');
 choose(view,'armor');choose(view,'weapon');assert.equal(walk(view).find(n=>n.dataset.reportLootId==='owned'),inspect);assert.deepEqual(shown(view),['owned']);
});
