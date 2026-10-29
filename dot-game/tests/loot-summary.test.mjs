import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const source=ui.slice(ui.indexOf('function expeditionLootContext('),ui.indexOf('// Read only the detached departure snapshot'));
const item=(quality='Superior',disposition='inventory',saleValue=0)=>({id:'drop',name:'Drop',slot:'weapon',level:3,quality,disposition,saleValue});
function render(loot,state={inventory:[],pendingLoot:[],equipment:{},hero:{gold:9000}}){
 const node=(tag,className,text='')=>({tag,className,textContent:String(text),children:[],dataset:{},append(...children){this.children.push(...children);},setAttribute(){},addEventListener(){}});
 return runInNewContext(`${source};expeditionLootContext(loot)`,{loot,state,node,format:String,qualityName:String});
}
const walk=n=>[n,...n.children.flatMap(walk)];
const summary=n=>walk(n).filter(n=>n.className==='report-loot-summary').map(n=>n.textContent).join('\n');
test('summary counts each quality in fixed tier order and exact historical destinations',()=>{
 const v=summary(render([item('Exquisite','pending'),item('Fair','autoSold',21),item('Superior'),item('Superior'),item('Fair','autoSold',34)]));
 assert.match(v,/Fair 2 件 · Superior 2 件 · Exquisite 1 件/);
 assert.match(v,/入包 2 件 · 待領 1 件 · 自動出售 2 件/);assert.match(v,/合計：55 金幣/);
});
test('empty loot explicitly has zero totals while legacy absent list remains unknown',()=>{
 const v=summary(render([]));assert.match(v,/品質件數：0 件/);assert.match(v,/入包 0 件 · 待領 0 件 · 自動出售 0 件/);assert.match(v,/合計：0 金幣/);
 for(const value of [undefined,null,{}])assert.equal(summary(render(value)),'');
});
test('every current quality is represented exactly once',()=>{
 const names=['Crude','Fair','Average','Superior','Exquisite','Magnificent','Legendary','Peerless'];
 const v=summary(render(names.map(q=>item(q))));for(const q of names)assert.ok(v.includes(`${q} 1 件`));assert.match(v,/入包 8 件/);
});
test('summary does not count manual sale, kill or clear money or mutate live state and receipt',()=>{
 const loot=[item('Superior','inventory',999),item('Average','pending',777),item('Fair','autoSold',21)];
 const state={inventory:[],pendingLoot:[],equipment:{},hero:{gold:999999}};const before=JSON.stringify({loot,state});
 const a=summary(render(loot,state));assert.match(a,/合計：21 金幣/);assert.match(a,/不含擊殺、通關或後續手動出售/);assert.equal(JSON.stringify({loot,state}),before);
 state.hero.gold+=100;assert.equal(summary(render(loot,state)),a);
});
test('unknown quality and disposition are separate from real tier and inventory counts',()=>{
 const v=summary(render([item('__proto__','unknown'),item('Constructor','pending'),null]));assert.match(v,/未辨識品質 3 件/);assert.match(v,/入包 0 件 · 待領 1 件 · 自動出售 0 件 · 處理未記錄 2 件/);
});
test('invalid historical sale amounts are not coerced into known proceeds',()=>{
 const loot=[NaN,Infinity,-1,'35',undefined].map(n=>({...item('Fair','autoSold'),saleValue:n}));loot.push(item('Fair','autoSold',12));
 const v=summary(render(loot));assert.match(v,/自動出售 6 件/);assert.match(v,/合計：12 金幣（另有 5 件金額未記錄）/);
});
test('summary does not alter collapsed detail or historical item order',()=>{
 const loot=[{...item('Legendary'),name:'first'}, {...item('Crude','pending'),name:'second'}];const view=render(loot);
 assert.equal(view.tag,'details');assert.equal(view.open,undefined);assert.deepEqual(walk(view).filter(n=>n.tag==='li').map(n=>n.textContent.split(' · ')[0]),['first','second']);
});
