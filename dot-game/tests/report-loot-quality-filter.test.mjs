import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const source=ui.slice(ui.indexOf('function expeditionLootContext('),ui.indexOf('// Read only the detached departure snapshot'));
const item=(quality,id=quality,slot='weapon')=>({id,name:id,slot,level:3,quality,disposition:'inventory',saleValue:0});
const walk=n=>[n,...n.children.flatMap(walk)];
function render(loot,state={inventory:[],pendingLoot:[],equipment:{},hero:{gold:99}}){
 const node=(tag,className,text='')=>({tag,className,textContent:String(text),children:[],dataset:{},attributes:{},events:{},append(...children){this.children.push(...children);},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,f){this.events[k]=f;}});
 return runInNewContext(`${source};expeditionLootContext(loot)`,{loot,state,node,format:String,qualityName:String});
}
const buttons=(n,kind='Quality')=>walk(n).filter(n=>n.dataset[`reportLoot${kind}`]);
const choose=(n,value,kind='Quality')=>buttons(n,kind).find(n=>n.dataset[`reportLoot${kind}`]===value).events.click();
const shown=n=>walk(n).filter(n=>n.tag==='li'&&!n.hidden).map(n=>n.textContent.split(' · ')[0]);
const totals=n=>walk(n).filter(n=>n.className==='report-loot-summary').map(n=>n.textContent).join('\n');
const status=n=>walk(n).find(n=>n.attributes.role==='status').textContent;
const pressed=(n,kind='Quality')=>buttons(n,kind).map(n=>n.attributes['aria-pressed']);
test('quality thresholds are inclusive through Peerless; all restores unknown and receipt order',()=>{
 const tiers=['Crude','Fair','Average','Superior','Exquisite','Magnificent','Legendary','Peerless'];
 const loot=[item('mystery','unknown'),...tiers.map(q=>item(q)),null];
 const view=render(loot);assert.deepEqual(shown(view),['unknown',...tiers,'未記錄']);
 choose(view,'Superior');assert.deepEqual(shown(view),tiers.slice(3));
 choose(view,'Exquisite');assert.deepEqual(shown(view),tiers.slice(4));
 choose(view,'all');assert.deepEqual(shown(view),['unknown',...tiers,'未記錄']);
});
test('quality AND slot filters preserve the other selection in either order',()=>{
 const view=render([item('Superior','sw'),item('Exquisite','ew'),item('Legendary','la','armor'),item('Fair','fa','armor')]);
 choose(view,'armor','Slot');choose(view,'Exquisite');assert.deepEqual(shown(view),['la']);assert.deepEqual(pressed(view,'Slot'),['false','false','true','false']);
 assert.match(status(view),/顯示護甲 · Exquisite以上：1 \/ 4 件/);
 choose(view,'weapon','Slot');assert.deepEqual(shown(view),['ew']);assert.deepEqual(pressed(view),['false','false','true']);
 choose(view,'Superior');assert.deepEqual(shown(view),['sw','ew']);
 choose(view,'all','Slot');assert.deepEqual(shown(view),['sw','ew','la']);
 choose(view,'all');assert.equal(shown(view).length,4);
});
test('quality controls have distinct accessible group, labels, type and pressed states',()=>{
 const view=render([]);
 assert.ok(walk(view).some(n=>n.attributes.role==='group'&&n.attributes['aria-label']==='本場掉寶品質篩選'));
 assert.equal(buttons(view).length,3);assert.deepEqual(pressed(view),['true','false','false']);
 for(const b of buttons(view)){assert.equal(b.type,'button');assert.match(b.attributes['aria-label'],/^本場掉寶品質：/);}
 choose(view,'Superior');assert.deepEqual(pressed(view),['false','true','false']);
});
test('empty, unknown-only and missing receipts are not fabricated',()=>{
 for(const loot of [[],[null,item(undefined,'missing'),item('superior','wrongcase'),item('Future','future')]]){
  const view=render(loot);choose(view,'Superior');assert.deepEqual(shown(view),[]);assert.match(status(view),/沒有符合部位與品質的掉寶/);
  choose(view,'all');assert.equal(shown(view).length,loot.length);
 }
 for(const missing of [undefined,null,{}])assert.equal(buttons(render(missing)).length,0);
});
test('whole-run summaries and frozen receipt/live state are invariant for every combination',()=>{
 const loot=Object.freeze([Object.freeze(item('Superior','a')),Object.freeze({...item('Peerless','b','armor'),disposition:'autoSold',saleValue:27})]);
 const state={inventory:[],pendingLoot:[],equipment:{},hero:{gold:999}},before=JSON.stringify({loot,state});
 const view=render(loot,state),summary=totals(view);
 for(const q of ['all','Superior','Exquisite'])for(const s of ['all','weapon','armor','accessory']){
  choose(view,q);choose(view,s,'Slot');assert.equal(totals(view),summary);assert.match(status(view),/上方摘要為本場全部掉寶，不受篩選影響/);
 }
 assert.match(summary,/合計：27 金幣/);assert.equal(JSON.stringify({loot,state}),before);
});
test('each report is independent and reconstruction resets both filters',()=>{
 const loot=[item('Fair','f'),item('Peerless','p','armor')],recent=render(loot),pinned=render(loot);
 choose(recent,'Exquisite');choose(recent,'armor','Slot');assert.deepEqual(shown(pinned),['f','p']);
 choose(pinned,'weapon','Slot');assert.deepEqual(shown(recent),['p']);assert.deepEqual(shown(pinned),['f']);
 const rebuilt=render(loot);assert.deepEqual(shown(rebuilt),['f','p']);assert.equal(pressed(rebuilt)[0],'true');assert.equal(pressed(rebuilt,'Slot')[0],'true');
});
test('filtering retains inspect control identity and does not invoke ownership actions',()=>{
 const owned=item('Peerless','owned'),view=render([owned,item('Fair','low')],{inventory:[owned],pendingLoot:[],equipment:{}});
 const inspect=walk(view).find(n=>n.dataset.reportLootId==='owned');assert.ok(inspect);
 choose(view,'armor','Slot');choose(view,'Exquisite');choose(view,'weapon','Slot');
 assert.deepEqual(shown(view),['owned']);assert.equal(walk(view).find(n=>n.dataset.reportLootId==='owned'),inspect);
});
