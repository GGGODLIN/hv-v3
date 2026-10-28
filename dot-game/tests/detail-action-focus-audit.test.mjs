// Historical direct-sale behavior is checked against the exact reversible v063 UI projection.
import {beforeDetailSale} from './helpers/detail-sale-baseline.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as engine from '../src/engine.js';
import {fullUI,clone,find} from './helpers/comparison-focus-harness.mjs';
const source=process.env.HV_DETAIL_AUDIT_BASELINE?readFileSync(process.env.HV_DETAIL_AUDIT_BASELINE,'utf8'):beforeDetailSale(readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8'), 'src/ui.js');
function make(){
 const s=engine.createGame(77);
 s.inventory=[{...clone(s.equipment.armor),id:'same-\"\\[]:#',name:'完全同名',locked:false},{...clone(s.equipment.armor),id:'another',name:'完全同名',locked:false}];
 return fullUI(engine.validateSave(s),{source});
}
const button=(h,label)=>find(h.dom['item-detail'],e=>e.tag==='button'&&e.textContent===label);
async function selected(){const h=make();await h.card('inventory',h.state.inventory[0].id).click();return h;}
test('audit: same-name selection change cannot restore action belonging to another ID',async()=>{
 const h=await selected(),first=h.state.inventory[0].id;button(h,'出售').focus();h.run("selectedId='another';render(true)");
 assert.ok(h.document.activeElement === h.card('inventory',first));assert.ok(h.document.activeElement !== button(h,'出售'));assert.equal(h.calls.length,0);
});
test('audit: missing exact item never substitutes a same-name item after repaint',async()=>{
 const h=await selected();button(h,'出售').focus();h.run("state.inventory.shift();selectedId='another';render(true)");
 assert.ok(h.document.activeElement === h.dom['slot-filter']);assert.ok(h.document.activeElement !== button(h,'出售'));assert.equal(h.calls.length,0);
});
test('audit: disappearing item and hidden filter restore settings without destructive focus',async()=>{
 const h=await selected();button(h,'出售').focus();h.dom['slot-filter'].hidden=true;h.run('state.inventory.shift();render(true)');
 assert.ok(h.document.activeElement === h.dom['settings-toggle']);assert.equal(h.calls.length,0);
});
test('audit: unrelated matching text and data attributes cannot impersonate exact rendered action',async()=>{
 const h=await selected(),filter=h.dom['slot-filter'];filter.textContent='出售';filter.dataset.itemId=h.state.inventory[0].id;filter.dataset.action='sell';filter.focus();const n=h.focusEvents.length;h.render();
 assert.ok(h.document.activeElement === filter);assert.equal(h.focusEvents.length,n);assert.equal(h.calls.length,0);
});
test('audit: setting-dialog focus is preserved while equipment details rerender',async()=>{
 const h=await selected();button(h,'鎖定').focus();h.dom['settings-dialog'].showModal();h.dom['import-save'].focus();const n=h.focusEvents.length;h.render();
 assert.ok(h.document.activeElement === h.dom['import-save']);assert.equal(h.focusEvents.length,n);assert.equal(h.calls.length,0);
});
test('audit: pending and worn details have no stale basic action entries',async()=>{
 const h=await selected(),id=h.state.inventory[0].id;button(h,'鎖定').focus();h.run('state.pendingLoot.push(state.inventory.shift());render(true)');
 assert.ok(h.document.activeElement === h.card('pending',id));assert.equal(button(h,'鎖定'),undefined);assert.equal(button(h,'出售'),undefined);assert.equal(button(h,'換上裝備'),undefined);
 h.run("selectedId=null;selectedSlot='armor';render(true)");assert.equal(button(h,'出售'),undefined);assert.equal(h.calls.length,0);
});
test('audit: hidden item detail is not treated as an active focus source',async()=>{
 const h=await selected();button(h,'鎖定').focus();h.dom['item-detail'].hidden=true;const n=h.focusEvents.length;h.render();
 assert.ok(h.document.activeElement === h.document.body);assert.equal(h.focusEvents.length,n);assert.equal(h.calls.length,0);
});
