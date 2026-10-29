import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import {QUALITY_TIERS} from '../src/loot.js';
import {fullUI,clone,collect} from './helpers/comparison-focus-harness.mjs';
const record=(quality='Superior',disposition='inventory',saleValue=0)=>({id:'audit-drop',name:'Audit drop',slot:'weapon',level:3,quality,disposition,saleValue});
const all=n=>[n,...n.children.flatMap(all)];
function draw(h,loot){h.run(`globalThis.auditReceipt=${JSON.stringify(loot)}; $('expedition-report-list').replaceChildren(expeditionLootContext(auditReceipt));`);return h.dom['expedition-report-list'];}
const summaries=n=>all(n).filter(e=>e.className==='report-loot-summary').map(e=>e.textContent).join('\n');
test('independent: full UI translates all quality tiers in canonical order',()=>{
 const h=fullUI(), view=draw(h,QUALITY_TIERS.toReversed().map(q=>record(q.name)));
 const text=summaries(view);let last=-1;
 for(const tier of QUALITY_TIERS){const i=text.indexOf(`${tier.label} 1 件`);assert.ok(i>last,`${tier.name} order/translation`);last=i;}
 assert.match(text,/入包 8 件 · 待領 0 件 · 自動出售 0 件/);
});
test('independent: historical destinations and actual proceeds exclude non-auto-sale values',()=>{
 const h=fullUI(),v=summaries(draw(h,[record('Fair','pending',900),record('Superior','inventory',800),record('Legendary','autoSold',1234),record('Average','autoSold',56),record('Fair','autoSold',0)]));
 assert.match(v,/入包 1 件 · 待領 1 件 · 自動出售 3 件/);assert.match(v,/合計：1,290 金幣/);assert.match(v,/不含擊殺、通關或後續手動出售/);
});
test('independent: absent receipt is unknown, not an empty run',()=>{
 const h=fullUI();for(const value of [undefined,null,{},false]){const view=draw(h,value);assert.equal(summaries(view),'');assert.match(collect(view),/未記錄掉寶明細/);assert.doesNotMatch(collect(view),/本場沒有取得裝備/);}
 const view=draw(h,[]);assert.match(summaries(view),/品質件數：0 件/);assert.match(collect(view),/本場沒有取得裝備/);
});
test('independent: malformed values remain unknown rather than false income',()=>{
 const h=fullUI();h.run(`globalThis.auditReceipt=[null,{},...[-1,Infinity,NaN,'75',undefined,1.5].map(saleValue=>({id:'bad',name:'bad',quality:'__proto__',slot:'__proto__',level:1,disposition:'autoSold',saleValue}))]; $('expedition-report-list').replaceChildren(expeditionLootContext(auditReceipt));`);
 const v=collect(h.dom['expedition-report-list']);assert.match(v,/未辨識品質 8 件/);assert.match(v,/合計：0 金幣（另有 6 件金額未記錄）/);assert.match(v,/處理未記錄 2 件/);assert.doesNotMatch(v,/NaN|Infinity|∞|實收 -1|實收 75|實收 1.5|\[object Object\]/);const sold=all(h.dom['expedition-report-list']).filter(n=>n.tag==='li'&&n.textContent.includes('取得時自動出售'));assert.equal(sold.length,6);for(const entry of sold){assert.match(entry.textContent,/金額未記錄/);assert.doesNotMatch(entry.textContent,/實收 [0-9]/);}
});
test('independent: malicious labels stay literal text, no injected elements',()=>{
 const h=fullUI(),view=draw(h,[{...record('<img onerror=attack>','constructor'),name:'<script>attack()</script>',id:'<svg onload=attack>'}]);
 assert.ok(collect(view).includes('<script>attack()</script>'));assert.match(summaries(view),/未辨識品質 1 件/);assert.match(summaries(view),/入包 0 件.*處理未記錄 1 件/);assert.equal(all(view).some(n=>['script','img','svg'].includes(n.tag)),false);
});
test('independent: repeat render of frozen receipt leaves state, RNG and persistence untouched',()=>{
 const h=fullUI();draw(h,[record('Fair','autoSold',5)]);h.run('Object.freeze(auditReceipt[0]);Object.freeze(auditReceipt)');const before={state:clone(h.state),writes:clone(h.writes),calls:clone(h.calls),receipt:h.run('JSON.stringify(auditReceipt)')};
 for(let n=0;n<4;n++)h.run("$('expedition-report-list').replaceChildren(expeditionLootContext(auditReceipt))");
 assert.deepEqual(clone(h.state),before.state);assert.deepEqual(h.writes,before.writes);assert.deepEqual(h.calls,before.calls);assert.equal(h.run('JSON.stringify(auditReceipt)'),before.receipt);
});
test('independent: earned report and pinned summary survive later actual selected sale',()=>{
 const h=fullUI(engine.createGame(42));h.run("act(state,'startOnce'); for(let n=0;n<20000&&state.mode==='battle';n++) advance(state,.1); render(true); pinRecentExpeditionReport();");
 const reports=clone(h.run('expeditionReports(state)'));assert.ok(reports[0].loot.length);
 const id=reports[0].loot.find(x=>x.disposition==='inventory'&&h.state.inventory.some(y=>y.id===x.id))?.id;assert.ok(id,'natural run has a sellable inventory drop');
 const before=summaries(h.dom['pinned-report']),q=engine.previewSelectedSale(h.state,[id]);assert.equal(q.available,true,q.reason);const gold=h.state.hero.gold;
 h.run(`act(state,'sellSelected',${JSON.stringify({ids:[id],quoteBasis:q.quoteBasis})});render(true);`);
 assert.equal(h.state.inventory.some(x=>x.id===id),false);assert.equal(h.state.hero.gold,gold+q.total);assert.deepEqual(clone(h.run('expeditionReports(state)')),reports);assert.equal(summaries(h.dom['pinned-report']),before);assert.match(before,/本場掉寶自售實收合計：0 金幣/);
});
