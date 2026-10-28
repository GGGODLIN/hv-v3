import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import {fullUI,clone,collect} from './helpers/comparison-focus-harness.mjs';

const keys=['attack','hp','defense','crit','evade','block','parry'];
const rates=new Set(['crit','evade','block']);
function item(id,stats={},extra={}) { return {id,name:`Audit ${id}`,slot:'armor',quality:'Average',rarityColor:'#aaa',level:1,roll:50,power:10,stats,locked:false,...extra}; }
function setup(items){const s=engine.createGame(6501);s.inventory=items;return fullUI(engine.validateSave(s));}
const ids=h=>h.dom['inventory-list'].querySelectorAll('[data-inventory-id]').map(x=>x.dataset.inventoryId);
async function choose(h,id,value){h.dom[id].value=value;await h.dom[id].emit('change');}
for(const key of keys) test(`audit actual ${key} sort descending, stable ties, absent zero, and no transaction`,async()=>{
 const high=rates.has(key)?.013:13, low=rates.has(key)?.012:12;
 const h=setup([item('high-old',{[key]:high},{power:1}),item('low',{[key]:low},{power:999}),item('high-new',{[key]:high},{level:9}),item('zero',{[key]:0}),item('missing')]);
 const before=JSON.stringify(h.state),writes=clone(h.writes),calls=clone(h.calls);
 assert.equal(h.dom['sort-select'].children.filter(x=>x.value===`stat-${key}`).length,1);
 await choose(h,'sort-select',`stat-${key}`);
 assert.deepEqual(ids(h),['high-new','high-old','low','missing','zero']);
 assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.writes,writes);assert.deepEqual(h.calls,calls);assert.deepEqual(h.faults,[]);
 assert.match(collect(h.dom['inventory-filter-status']),/非 DPS／勝率/);
 assert.ok(h.card('inventory','high-new').querySelector('.item-sort-stat'));
});
test('audit rates use exact stored fractions rather than rounded card text',async()=>{
 const h=setup([item('higher',{crit:.0120002}),item('lower-newer',{crit:.0120001})]);
 await choose(h,'sort-select','stat-crit');assert.deepEqual(ids(h),['higher','lower-newer']);
});
test('audit stat sort composes slot, name, quality and protection filters',async()=>{
 const h=setup([item('target',{hp:50},{locked:true,name:'Wanted coat',quality:'Superior'}),item('unlocked',{hp:90},{name:'Wanted coat',quality:'Superior'}),item('other-name',{hp:100},{locked:true,quality:'Superior'}),item('other-slot',{hp:100},{slot:'accessory',locked:true,name:'Wanted ring',quality:'Superior'}),item('other-quality',{hp:100},{locked:true,name:'Wanted coat'})]);
 for(const [id,v] of [['slot-filter','armor'],['quality-filter','Superior'],['protection-filter','protected']])await choose(h,id,v);
 h.dom['name-filter'].value='Wanted';await h.dom['name-filter'].emit('input');
 await choose(h,'sort-select','stat-hp');assert.deepEqual(ids(h),['target']);
});
test('audit sort retains inspection, selected sale IDs, and selector focus',async()=>{
 const h=setup([item('selected',{defense:1}),item('higher',{defense:2}),item('locked',{defense:9},{locked:true})]);
 await h.card('inventory','selected').click();h.run("toggleSelectedSale('selected',true)");
 const before=JSON.stringify(h.state),writes=clone(h.writes),calls=clone(h.calls);
 h.dom['sort-select'].focus();await choose(h,'sort-select','stat-defense');
 assert.deepEqual(ids(h),['locked','higher','selected']);assert.equal(h.run('selectedId'),'selected');assert.deepEqual(clone(h.run('[...selectedSaleIds]')),['selected']);
 assert.equal(h.document.activeElement,h.dom['sort-select']);
 assert.equal(h.run("selectedSaleCheckboxes.get('locked').disabled"),true);
 assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.writes,writes);assert.deepEqual(h.calls,calls);
});
test('audit every original sorting option remains independent and newest restores acquisition',async()=>{
 const h=setup([item('a',{hp:99},{power:1,level:3,quality:'Average'}),item('b',{hp:1},{power:99,level:1,quality:'Superior'}),item('c',{hp:50},{power:50,level:2,quality:'Fair'})]);
 for(const [sort,expected] of [['stat-hp',['a','c','b']],['power',['b','c','a']],['level',['a','c','b']],['quality',['b','a','c']],['new',['c','b','a']]]){await choose(h,'sort-select',sort);assert.deepEqual(ids(h),expected);}
});
test('audit sorting unknown key cannot execute prototype keys or invent statistics',async()=>{
 const h=setup([item('old',{attack:99}),item('new',{attack:1})]);
 for(const sort of ['stat-toString','stat-__proto__','stat-dps']){await choose(h,'sort-select',sort);assert.deepEqual(ids(h),['new','old']);assert.equal(h.card('inventory','old').querySelector('.item-sort-stat'),null);}
});
test('audit equipped and pending inventory are not pulled into sorted backpack',async()=>{
 const s=engine.createGame(6511);s.inventory=[item('owned',{hp:1})];s.pendingLoot=[item('pending',{hp:999})];
 const h=fullUI(engine.validateSave(s));const before=JSON.stringify(h.state);
 await choose(h,'sort-select','stat-hp');assert.deepEqual(ids(h),['owned']);assert.equal(JSON.stringify(h.state),before);
});
test('audit empty filtered stat view can reset without resetting chosen sort',async()=>{
 const h=setup([item('coat',{hp:10})]);await choose(h,'slot-filter','weapon');await choose(h,'sort-select','stat-hp');assert.deepEqual(ids(h),[]);
 await h.dom['reset-inventory-filters'].click();assert.deepEqual(ids(h),['coat']);assert.equal(h.dom['sort-select'].value,'stat-hp');
});
test('audit preset-protected gear remains listed and protected after stat ordering',async()=>{
 const s=engine.createGame(6512);s.inventory=[item('preset',{hp:99},{locked:true}),item('ordinary',{hp:1})];s.gearSets={a:{weapon:s.equipment.weapon.id,armor:'preset',accessory:s.equipment.accessory.id}};
 const h=fullUI(engine.validateSave(s)),before=JSON.stringify(h.state);
 await choose(h,'sort-select','stat-hp');assert.deepEqual(ids(h),['preset','ordinary']);
 assert.equal(h.run("selectedSaleCheckboxes.get('preset').disabled"),true);assert.match(collect(h.card('inventory','preset')),/配裝/);assert.equal(JSON.stringify(h.state),before);
});
for(const context of ['readonly','battle'])test(`audit sorting ${context} is observation-only with sale unavailable`,async()=>{
 const h=setup([item('high',{hp:20}),item('low',{hp:1})]);h.run(context==='readonly'?'tabOwner=false':"act(state,'start')");h.render();
 const before=JSON.stringify(h.state),calls=clone(h.calls),writes=clone(h.writes);
 await choose(h,'sort-select','stat-hp');assert.deepEqual(ids(h),['high','low']);assert.equal(h.run("selectedSaleCheckboxes.get('high').disabled"),true);
 assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.calls,calls);assert.deepEqual(h.writes,writes);
});
