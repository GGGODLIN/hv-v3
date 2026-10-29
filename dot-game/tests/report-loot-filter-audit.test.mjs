import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import {fullUI,clone,collect} from './helpers/comparison-focus-harness.mjs';
const all=n=>[n,...n.children.flatMap(all)];
const buttons=view=>all(view).filter(n=>n.dataset.reportLootSlot);
const filter=async(view,slot)=>{const button=buttons(view).find(n=>n.dataset.reportLootSlot===slot);assert.ok(button,slot);await button.click();};
const rows=view=>all(view).filter(n=>n.tag==='li');
const visible=view=>rows(view).filter(n=>!n.hidden);
const summary=view=>all(view).filter(n=>n.className==='report-loot-summary').map(n=>n.textContent).join('\n');
const receipt=(slot,id=slot)=>({id,name:`receipt-${id}`,slot,quality:'Superior',level:1,disposition:'inventory',saleValue:0});
function draw(h,records){h.run(`globalThis.auditFilterReceipt=${JSON.stringify(records)}; $('expedition-report-list').replaceChildren(expeditionLootContext(auditFilterReceipt));`);return h.dom['expedition-report-list'];}
function snapshot(h){return {state:clone(h.state),writes:clone(h.writes),calls:clone(h.calls),receipt:h.run('JSON.stringify(auditFilterReceipt)')};}
function unchanged(h,before){assert.deepEqual(clone(h.state),before.state);assert.deepEqual(h.writes,before.writes);assert.deepEqual(h.calls,before.calls);assert.equal(h.run('JSON.stringify(auditFilterReceipt)'),before.receipt);}

test('v078 independent: exact slot predicates show all historical acquisition dispositions and unchanged whole totals',async()=>{
 const h=fullUI(),view=draw(h,[receipt('weapon','w1'),{...receipt('armor','a1'),disposition:'pending'}, {...receipt('weapon','w2'),disposition:'autoSold',saleValue:85},receipt('accessory','x1')]);
 const before=summary(view);assert.match(before,/自動出售 1 件/);assert.match(before,/合計：85 金幣/);
 for(const [slot,count] of [['weapon',2],['armor',1],['accessory',1],['all',4]]){await filter(view,slot);assert.equal(visible(view).length,count);assert.equal(summary(view),before);if(slot!=='all')assert.ok(visible(view).every(row=>row.textContent.includes({weapon:'武器',armor:'護甲',accessory:'飾品'}[slot])));}
 assert.match(collect(view),/上方摘要為本場全部掉寶，不受篩選影響/);
});

test('v078 independent: unknown malformed and prototype-like slots remain in All only',async()=>{
 const h=fullUI(),view=draw(h,[null,{},receipt('__proto__'),receipt('constructor'),receipt('Weapon'),receipt('weapon')]);
 assert.equal(visible(view).length,6);await filter(view,'weapon');assert.equal(visible(view).length,1);await filter(view,'armor');assert.equal(visible(view).length,0);assert.match(collect(view),/沒有符合部位的掉寶/);await filter(view,'all');assert.equal(visible(view).length,6);
});

test('v078 independent: missing history is distinct from an empty or zero-match receipt',async()=>{
 const h=fullUI();for(const value of [null,undefined,false,{}]){const view=draw(h,value);assert.equal(buttons(view).length,0);assert.match(collect(view),/未記錄掉寶明細/);}
 const view=draw(h,[]);assert.equal(buttons(view).length,4);await filter(view,'armor');assert.equal(visible(view).length,0);assert.match(collect(view),/本場沒有取得裝備/);assert.match(collect(view),/0 \/ 0 件/);
});

test('v078 independent: controls expose one pressed state and a live result status without replacing rows',async()=>{
 const h=fullUI(),view=draw(h,[receipt('weapon'),receipt('armor')]),original=rows(view);
 const group=all(view).find(n=>n.attributes.role==='group');assert.equal(group.attributes['aria-label'],'本場掉寶部位篩選');
 for(const slot of ['all','armor','accessory','weapon']){await filter(view,slot);assert.equal(buttons(view).filter(n=>n.attributes['aria-pressed']==='true').length,1);assert.equal(buttons(view).find(n=>n.attributes['aria-pressed']==='true').dataset.reportLootSlot,slot);assert.deepEqual(rows(view),original);assert.ok(all(view).some(n=>n.attributes.role==='status'&&n.textContent.includes('顯示')));}
});

test('v078 independent: two report contexts retain independent filters and a fresh render starts at All',async()=>{
 const h=fullUI();h.run(`$('expedition-report-list').replaceChildren(expeditionLootContext(${JSON.stringify([receipt('weapon'),receipt('armor')])}),expeditionLootContext(${JSON.stringify([receipt('accessory'),receipt('weapon')])}));`);
 const [first,second]=h.dom['expedition-report-list'].children;await filter(first,'armor');assert.equal(visible(first).length,1);assert.equal(visible(second).length,2);await filter(second,'accessory');assert.equal(visible(first).length,1);assert.equal(visible(second).length,1);assert.equal(buttons(first).find(n=>n.attributes['aria-pressed']==='true').dataset.reportLootSlot,'armor');
 const fresh=draw(h,[receipt('weapon'),receipt('armor')]);assert.equal(visible(fresh).length,2);assert.equal(buttons(fresh).find(n=>n.attributes['aria-pressed']==='true').dataset.reportLootSlot,'all');
});

test('v078 independent: repeated frozen-receipt filters change no game state rewards RNG persistence or receipt',async()=>{
 const h=fullUI(),view=draw(h,[receipt('weapon'),{...receipt('armor'),disposition:'autoSold',saleValue:7}]);h.run('auditFilterReceipt.forEach(Object.freeze);Object.freeze(auditFilterReceipt)');const before=snapshot(h);
 for(let n=0;n<3;n++)for(const slot of ['weapon','armor','accessory','all'])await filter(view,slot);unchanged(h,before);assert.deepEqual(h.faults,[]);
});

test('v078 independent: naturally earned loot can be filtered then inspected by current exact ID without awarding again',async()=>{
 const h=fullUI(engine.createGame(42));h.run("act(state,'startOnce');for(let n=0;n<20000&&state.mode==='battle';n++)advance(state,.1);render(true);pinRecentExpeditionReport();");
 const report=clone(h.run('expeditionReports(state)[0]')),drop=report.loot.find(item=>h.state.inventory.some(current=>current.id===item.id));assert.ok(drop,'earned inventory drop');
 const view=all(h.dom['pinned-report']).find(n=>n.className.includes('report-loot-details'));assert.ok(view);const before={state:clone(h.state),writes:clone(h.writes),calls:clone(h.calls),report:clone(h.run('pinnedExpeditionReport'))};await filter(view,drop.slot);
 const row=visible(view).find(n=>n.textContent.includes(`ID：${drop.id}`));assert.ok(row);const inspect=all(row).find(n=>n.dataset.reportLootId===drop.id);assert.ok(inspect);await inspect.click();assert.equal(h.run('selectedId'),drop.id);assert.equal(h.dom['camp-panel-gear'].hidden,false);assert.equal(h.document.activeElement.className,'detail-name');assert.deepEqual(clone(h.state),before.state);assert.deepEqual(h.writes,before.writes);assert.deepEqual(h.calls,before.calls);assert.deepEqual(clone(h.run('pinnedExpeditionReport')),before.report);assert.deepEqual(h.faults,[]);
});
