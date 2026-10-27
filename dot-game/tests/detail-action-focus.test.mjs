import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as engine from '../src/engine.js';
import { fullUI, clone, find } from './helpers/comparison-focus-harness.mjs';
const source = process.env.HV_DETAIL_BASELINE ? readFileSync(process.env.HV_DETAIL_BASELINE, 'utf8') : undefined;
function fixture() {
  const s=engine.createGame(42);
  s.inventory=[{...clone(s.equipment.weapon),id:`bag-"']\\:#`,name:'同名裝備',locked:false},{...clone(s.equipment.armor),id:'other',name:'同名裝備',locked:false}];
  return engine.validateSave(s);
}
const action=(h,text)=>find(h.dom['item-detail'],el=>el.tag==='button'&&el.textContent===text);
async function setup(){const h=fullUI(fixture(),{source});await h.card('inventory',h.state.inventory[0].id).click();return h;}
test('lock and unlock repeatedly retain the new exact-item action without extra transactions',async()=>{
 const h=await setup(),id=h.state.inventory[0].id;
 for(let i=0;i<4;i++){
  const b=action(h,i%2?'解鎖':'鎖定');b.focus();const count=h.calls.length;await b.click();
  const next=action(h,i%2?'鎖定':'解鎖');assert.ok(h.document.activeElement===next);assert.equal(next.isConnected,true);assert.equal(h.state.inventory.find(x=>x.id===id).locked,i%2===0);assert.equal(h.calls.length,count+1);
 }
 assert.deepEqual(h.faults,[]);
});
for(const text of ['換上裝備','鎖定','出售'])test(`${text} survives forced repaint without changing any game state`,async()=>{
 const h=await setup();const b=action(h,text);b.focus();const before=JSON.stringify(h.state),calls=clone(h.calls),writes=clone(h.writes);h.render();
 assert.ok(h.document.activeElement===action(h,text));assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.calls,calls);assert.deepEqual(h.writes,writes);assert.deepEqual(clone(h.focusEvents.at(-1).options),{preventScroll:true});
});
test('equipping follows exact item to worn card instead of body or a destructive button',async()=>{
 const h=await setup(),id=h.state.inventory[0].id;const b=action(h,'換上裝備');b.focus();await b.click();
 assert.equal(h.state.equipment.weapon.id,id);assert.ok(h.document.activeElement===h.card('equipment',id));assert.equal(h.document.activeElement.isConnected,true);
});
test('selling removes item and restores non-destructive filter focus',async()=>{
 const h=await setup(),id=h.state.inventory[0].id;const b=action(h,'出售');b.focus();await b.click();
 assert.ok(!h.state.inventory.some(x=>x.id===id));assert.ok(h.document.activeElement===h.dom['slot-filter']);
});
test('disabled replacement action falls back to same exact inventory card',async()=>{
 const h=await setup(),id=h.state.inventory[0].id;action(h,'出售').focus();h.run('tabOwner=false');h.render();
 assert.ok(h.document.activeElement===h.card('inventory',id));assert.equal(action(h,'出售').disabled,true);
});
test('unrelated focus and unchanged render are not disturbed',async()=>{
 const h=await setup();action(h,'鎖定').focus();h.render(false);const b=h.document.activeElement,count=h.focusEvents.length;h.render(false);assert.equal(h.document.activeElement,b);assert.equal(h.focusEvents.length,count);
 h.dom['sort-select'].focus();h.render();assert.equal(h.document.activeElement,h.dom['sort-select']);
});
