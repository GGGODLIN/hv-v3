import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, stats} from '../src/engine.js';
import {fullUI, clone, find, collect} from './helpers/comparison-focus-harness.mjs';
function setup(slot='weapon', pending=false) {
 const s=createGame(55), item={...clone(s.equipment[slot]),id:'preview-item',name:'比較用裝備',locked:false};
 item.stats={...item.stats,attack:80,hp:40,defense:25,parry:8,crit:.06,evade:.03,block:.02};
 s[pending?'pendingLoot':'inventory']=[item];
 const h=fullUI(s);return {h,item,pending};
}
const row=(h,key)=>find(h.dom['item-detail'],el=>el.dataset.stat===key);
for(const slot of ['weapon','armor','accessory'])test(`same-slot ${slot} preview matches existing derived stats and leaves state untouched`,async()=>{
 const {h,item}=setup(slot);const before=clone(h.state),writes=h.writes.length;
 await h.card('inventory',item.id).click();
 const expected=stats({...h.state,equipment:{...h.state.equipment,[slot]:h.state.inventory[0]}});
 assert.equal(row(h,'attack').children[1].textContent,`${stats(h.state).attack} → ${expected.attack}`);
 assert.deepEqual(clone(h.state),before);assert.equal(h.calls.length,0);assert.equal(h.writes.length,writes);
 assert.equal(h.dom['item-detail'].querySelectorAll('.loadout-preview-row').length,7);
 assert.match(collect(h.dom['item-detail']),/不是 DPS 或勝率預測/);
});
test('parry is a derived probability here, not the raw rating delta',async()=>{
 const {h,item}=setup();await h.card('inventory',item.id).click();
 assert.match(row(h,'parry').children[1].textContent,/% → .*%/);
 assert.match(row(h,'parry').children[2].textContent,/百分點/);
 const rawTable=h.dom['item-detail'].children.find(el=>el.className==='compare-table');assert.ok(rawTable);
});
test('identical replacement displays equality, current equipment has no hypothetical preview',async()=>{
 const s=createGame(55);s.inventory=[{...clone(s.equipment.weapon),id:'same',locked:false}];const h=fullUI(s);
 await h.card('inventory','same').click();for(const key of ['maxHp','attack','mitigation','crit','evade','block','parry'])assert.equal(row(h,key).children[2].textContent,'相同');
 await h.card('equipment',h.state.equipment.weapon.id).click();assert.equal(h.dom['item-detail'].querySelector('.loadout-preview'),null);
});
test('pending comparison stays inspection only and clearly requires collection',async()=>{
 const {h,item}=setup('weapon',true);const before=clone(h.state);await h.card('pending',item.id).click();
 assert.match(collect(h.dom['item-detail']),/先領入背包/);assert.deepEqual(clone(h.state),before);assert.equal(h.calls.length,0);
 assert.equal(find(h.dom['item-detail'],el=>el.tag==='button'&&el.textContent==='換上裝備'),undefined);
});
test('read-only and battle views communicate constraints without losing preview',async()=>{
 const {h,item}=setup();await h.card('inventory',item.id).click();h.run('tabOwner=false');h.render();assert.match(collect(h.dom['item-detail']),/唯讀預覽/);
 h.run("tabOwner=true;state.mode='battle'");h.render();assert.match(collect(h.dom['item-detail']),/回營後才能換裝/);assert.ok(row(h,'attack'));
});
test('attribute change invalidates the preview cache on ordinary render',async()=>{
 const {h,item}=setup();await h.card('inventory',item.id).click();const old=row(h,'attack').children[1].textContent;
 h.run('state.hero.attributes.str+=10');h.render(false);assert.notEqual(row(h,'attack').children[1].textContent,old);assert.equal(h.calls.length,0);
});
