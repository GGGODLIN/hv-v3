import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fullUI, clone, find } from './helpers/comparison-focus-harness.mjs';
const source = process.env.HV_STAT_DELTA_AUDIT_BASELINE ? readFileSync(process.env.HV_STAT_DELTA_AUDIT_BASELINE, 'utf8') : undefined;
function setup(oldStats, newStats) {
  const h=fullUI(undefined,{source});
  h.run(`state.equipment.weapon.stats=${JSON.stringify(oldStats)};state.inventory=[{...state.equipment.weapon,id:'audit-delta',stats:${JSON.stringify(newStats)}}];selectedId='audit-delta';selectedSlot=null;render(true)`);
  return h;
}
function delta(root,label) {
 const row=find(root,e=>e.className==='compare-row' && e.children[0]?.textContent===label);
 assert.ok(row,`missing ${label}`);return row.children[2].textContent;
}
test('audit: small positive and negative rates remain percentage-point changes',()=>{
 const h=setup({crit:0.025,evade:0.03,block:0.02},{crit:0.0251,evade:0.0299,block:0.02});
 assert.equal(delta(h.dom['item-detail'],'暴擊'),'+0.01 百分點');
 assert.equal(delta(h.dom['item-detail'],'閃避'),'-0.01 百分點');
 assert.equal(delta(h.dom['item-detail'],'格擋'),'—');
});
test('audit: parry and non-rate fractional differences never round to signed zero',()=>{
 const h=setup({parry:4,attack:10,defense:3},{parry:4.0042,attack:9.75,defense:3.00000001});
 assert.equal(delta(h.dom['item-detail'],'招架值'),'+0.0042');
 assert.equal(delta(h.dom['item-detail'],'攻擊'),'-0.25');
 assert.equal(delta(h.dom['item-detail'],'防禦'),'+<0.0001');
});
test('audit: below-precision negative rate is distinguished from true equality',()=>{
 const h=setup({crit:0.1,evade:0.2},{crit:0.1-1e-9,evade:0.2});
 assert.equal(delta(h.dom['item-detail'],'暴擊'),'-<0.0001 百分點');
 assert.equal(delta(h.dom['item-detail'],'閃避'),'—');
});
test('audit: worn item has no comparison even when fractional attributes exist',()=>{
 const h=setup({crit:0.025,parry:1.23456},{crit:0.0251,parry:1.23457});
 h.run("selectedId=null;selectedSlot='weapon';render(true)");
 assert.equal(delta(h.dom['item-detail'],'暴擊'),'—');
 assert.equal(delta(h.dom['item-detail'],'招架值'),'—');
});
test('audit: manual-sale comparison uses same truthful delta units and equality',()=>{
 const h=setup({crit:0.025,parry:1.5,attack:10},{crit:0.0251,parry:1.5-1e-7,attack:10});
 const table=h.run('selectedSaleComparison({item:state.inventory[0],currentEquipment:state.equipment.weapon})');
 assert.equal(delta(table,'暴擊'),'+0.01 百分點');
 assert.equal(delta(table,'招架值'),'-<0.0001');
 assert.equal(delta(table,'攻擊'),'相同');
});
test('audit: repeated rendering and sale preview do not mutate state or perform transactions',()=>{
 const h=setup({crit:0.025,parry:1},{crit:0.0251,parry:1.00001});
 const before=JSON.stringify(h.state), calls=clone(h.calls),writes=clone(h.writes);
 for(let i=0;i<3;i++) { h.render();h.run('selectedSaleComparison({item:state.inventory[0],currentEquipment:state.equipment.weapon})'); }
 assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.calls,calls);assert.deepEqual(h.writes,writes);assert.deepEqual(h.faults,[]);
});
