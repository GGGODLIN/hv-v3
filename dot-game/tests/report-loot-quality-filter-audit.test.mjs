import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const body=ui.slice(ui.indexOf('function expeditionLootContext('),ui.indexOf('// Read only the detached departure snapshot'));
const tiers=['Crude','Fair','Average','Superior','Exquisite','Magnificent','Legendary','Peerless'];
const slots=['weapon','armor','accessory','future'];
const tree=n=>[n,...n.children.flatMap(tree)];
function setup(receipt){
 const state={equipment:{},inventory:[],pendingLoot:[]};
 const node=(tag,className,text='')=>({tag,className,textContent:String(text),children:[],dataset:{},attrs:{},handlers:{},append(...n){this.children.push(...n);},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,v){this.handlers[k]=v;}});
 const view=runInNewContext(`${body};expeditionLootContext(receipt)`,{node,receipt,state,format:String,qualityName:q=>'譯名-'+q});
 const controls=(kind)=>tree(view).filter(n=>n.dataset[kind]!==undefined);
 const click=(kind,value)=>controls(kind).find(n=>n.dataset[kind]===value).handlers.click();
 const rows=()=>tree(view).filter(n=>n.tag==='li');
 return {view,state,controls,click,rows,shown:()=>rows().filter(n=>!n.hidden).map(n=>n.textContent.split(' · ')[0])};
}
const record=(q,s,id)=>({quality:q,slot:s,id,name:id,level:1,disposition:'inventory'});
test('independent Cartesian oracle covers every threshold and slot including unknown values',()=>{
 const receipt=[...tiers,'Superior+','Exquisite ',null,0,'__proto__'].flatMap((q,i)=>slots.map(s=>record(q,s,`${i}-${s}`)));
 const v=setup(receipt);
 for(const quality of ['all','Superior','Exquisite'])for(const slot of ['all',...slots.slice(0,3)]){
  v.click('reportLootQuality',quality);v.click('reportLootSlot',slot);
  const expected=receipt.filter(r=>(slot==='all'||r.slot===slot)&&(quality==='all'||tiers.slice(quality==='Superior'?3:4).includes(r.quality))).map(r=>r.id);
  assert.deepEqual(v.shown(),expected);
 }
});
test('quality filtering uses recorded quality, not current inventory quality or ownership',()=>{
 const receipt=[record('Fair','weapon','old-low'),record('Peerless','armor','old-high')],v=setup(receipt);
 v.state.inventory.push(record('Peerless','weapon','old-low'),record('Fair','armor','old-high'));
 v.click('reportLootQuality','Exquisite');assert.deepEqual(v.shown(),['old-high']);
});
test('translations affect accessible labels but never the internal tier comparison',()=>{
 const v=setup([record('Superior','weapon','s'),record('Exquisite','weapon','e')]);
 assert.equal(v.controls('reportLootQuality')[1].attrs['aria-label'],'本場掉寶品質：譯名-Superior以上');
 v.click('reportLootQuality','Superior');assert.deepEqual(v.shown(),['s','e']);
 assert.match(tree(v.view).find(n=>n.attrs.role==='status').textContent,/譯名-Superior以上/);
});
test('repeated controls preserve row node identities, ordering and exactly one pressed value per group',()=>{
 const v=setup([record('Fair','weapon','f'),record('Peerless','accessory','p')]),original=v.rows();
 for(let i=0;i<20;i++){
  v.click('reportLootQuality',i%2?'Exquisite':'all');v.click('reportLootSlot',i%3?'accessory':'all');
  assert.deepEqual(v.rows(),original);
  for(const kind of ['reportLootQuality','reportLootSlot'])assert.equal(v.controls(kind).filter(n=>n.attrs['aria-pressed']==='true').length,1);
 }
});
test('unknown slot can match quality under all slots but never leaks into a named slot',()=>{
 const v=setup([record('Legendary','__proto__','x')]);v.click('reportLootQuality','Exquisite');assert.deepEqual(v.shown(),['x']);
 v.click('reportLootSlot','weapon');assert.deepEqual(v.shown(),[]);
 v.click('reportLootSlot','all');assert.deepEqual(v.shown(),['x']);
});
test('separate reports share no selection even when backed by same frozen receipt array',()=>{
 const receipt=Object.freeze([Object.freeze(record('Fair','armor','f')),Object.freeze(record('Exquisite','weapon','e'))]);
 const a=setup(receipt),b=setup(receipt);a.click('reportLootQuality','Exquisite');b.click('reportLootSlot','armor');
 assert.deepEqual(a.shown(),['e']);assert.deepEqual(b.shown(),['f']);
 b.click('reportLootQuality','Superior');assert.deepEqual(b.shown(),[]);assert.deepEqual(a.shown(),['e']);
});
