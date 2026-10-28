import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as engine from '../src/engine.js';
import {fullUI,clone,find} from './helpers/comparison-focus-harness.mjs';
const source=process.env.HV_DELTA_BASELINE?readFileSync(process.env.HV_DELTA_BASELINE,'utf8'):undefined;
function fixture(){const s=engine.createGame(42);s.inventory=[{...clone(s.equipment.weapon),id:'fractional',stats:{...s.equipment.weapon.stats,crit:.0301,parry:12.00001}}];s.equipment.weapon.stats.crit=.03;s.equipment.weapon.stats.parry=12;return s;}
const row=(h,label)=>find(h.dom['item-detail'],e=>e.className==='compare-row'&&e.children[0]?.textContent===label);
test('tiny real equipment gains retain direction and rate units',async()=>{
 const h=fullUI(fixture(),{source});await h.card('inventory','fractional').click();
 const table=find(h.dom['item-detail'],e=>e.className==='compare-table');
 assert.ok(table.children.some(r=>r.children[2]?.textContent==='+0.01 百分點'));
 assert.ok(table.children.some(r=>r.children[2]?.textContent==='+<0.0001'));
});
test('negative fractions are not presented as negative zero',async()=>{
 const s=fixture();s.inventory[0].stats.crit=.0299;s.inventory[0].stats.parry=11.99999;
 const h=fullUI(s,{source});await h.card('inventory','fractional').click();const table=find(h.dom['item-detail'],e=>e.className==='compare-table');
 assert.ok(table.children.some(r=>r.children[2]?.textContent==='-0.01 百分點'));assert.ok(table.children.some(r=>r.children[2]?.textContent==='-<0.0001'));
});
test('identical stats stay equal and selecting worn equipment is not a gain',async()=>{
 const s=fixture();s.inventory[0].stats=clone(s.equipment.weapon.stats);const h=fullUI(s,{source});await h.card('inventory','fractional').click();
 let table=find(h.dom['item-detail'],e=>e.className==='compare-table');assert.ok(table.children.slice(1).every(r=>r.children[2].textContent==='—'));
 await h.card('equipment',s.equipment.weapon.id).click();table=find(h.dom['item-detail'],e=>e.className==='compare-table');assert.ok(table.children.slice(1).every(r=>r.children[2].textContent==='—'));
});
test('viewing fine differences does not modify gameplay or storage',async()=>{
 const h=fullUI(fixture(),{source}),before=JSON.stringify(h.state),writes=clone(h.writes),calls=clone(h.calls);await h.card('inventory','fractional').click();h.render();assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.writes,writes);assert.deepEqual(h.calls,calls);
});
