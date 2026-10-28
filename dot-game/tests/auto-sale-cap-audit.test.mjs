import test from 'node:test';
import assert from 'node:assert/strict';
import {generateItem} from '../src/loot.js';
const engine=await import(process.env.HV_AUTO_SALE_BASELINE ? new URL(process.env.HV_AUTO_SALE_BASELINE,import.meta.url) : '../src/engine.js');
const {createGame,act,advance,INVENTORY_LIMIT}=engine;
// Controlled final-enemy fixtures exercise public advance(), not natural play.
function final(auto=true,gold=0){
 const s=createGame(9);
 s.inventory=['weapon','armor','accessory'].flatMap(slot=>Array.from({length:3},(_,base)=>{let n=0;return {...generateItem(()=>n++===0?(base+.1)/3:0,3,slot),id:`keeper-${slot}-${base}`,locked:true,stats:{attack:100000,defense:100000,hp:100000,crit:1,evade:1,block:1}};}));
 if(auto)act(s,'setAutoSell',true);act(s,'start');s.hero.gold=gold;s.wave=4;s._clock=1;
 s.enemies=[{id:'audit-final',name:'受控驗收敵人',boss:true,hp:1,maxHp:1,attack:0,defense:0,evade:0,parry:0,block:0,resist:0}];return s;
}
const held=s=>[...s.inventory,...s.pendingLoot];
const drop=s=>held(s).find(i=>i.id==='loot-1');
test('audit: uncreditable auto sale retains full generated item and unchanged RNG/id/event path',()=>{
 const off=final(false,1e12),on=final(true,1e12);advance(off,.1);advance(on,.1);
 assert.ok(drop(on));assert.deepEqual(drop(on),drop(off));assert.deepEqual(on.inventory,off.inventory);
 assert.equal(on.seed,off.seed);assert.equal(on._itemId,off._itemId);assert.equal(on._eventId,off._eventId);
 assert.equal(on.hero.gold,off.hero.gold);assert.deepEqual(on.battle,off.battle);
});
test('audit: enough capacity still sells only the new item at the ordinary full price',()=>{
 const off=final(false),on=final(true);advance(off,.1);advance(on,.1);
 assert.ok(drop(off));assert.equal(drop(on),undefined);assert.equal(on.hero.gold-off.hero.gold,95);
 assert.deepEqual(on.inventory,off.inventory.filter(i=>i.id!=='loot-1'));
 assert.ok(on.events.some(e=>e.target==='loot-1'&&e.value===95&&e.text.startsWith('自動出售 ')));
});
test('audit: one coin short at sale boundary retains rather than truncating price',()=>{
 // Boss kill credits 21 before the 95-value generated drop, then clear credits 25.
 const s=final(true,1e12-21-95+1);advance(s,.1);
 assert.ok(drop(s));assert.equal(s.hero.gold,1e12-95+26);
 assert.ok(s.logs.some(text=>text.includes('自動出售未執行')));
});
test('audit: capacity-blocked overflow retains FIFO and returns to camp',()=>{
 const s=final(true,1e12);
 while(s.inventory.length<INVENTORY_LIMIT)s.inventory.push({...s.inventory[0],id:`filler-${s.inventory.length}`});
 s.pendingLoot=[{...s.inventory[0],id:'older-pending'}];const before=structuredClone(s.inventory);advance(s,.1);
 assert.deepEqual(s.inventory,before);assert.deepEqual(s.pendingLoot.map(i=>i.id),['older-pending','loot-1']);
 assert.equal(s.mode,'town');assert.ok(s.logs.some(text=>text.includes('保底裝備已保留於待領區')));
});
test('audit: blocked drop never emits successful sale event or clear summary',()=>{
 const s=final(true,1e12);advance(s,.1);
 assert.ok(s.events.some(e=>e.target==='loot-1'&&e.text.startsWith('獲得 ')));
 assert.ok(!s.events.some(e=>e.target==='loot-1'&&e.text.startsWith('自動出售 ')));
 assert.ok(!s.logs.some(text=>text.includes('保底裝備已自動出售')));
 assert.ok(s.logs.some(text=>text.includes('保底裝備已入背包')));
});
test('audit: exact sale capacity succeeds; subsequent clear gold is transparently capped by v053',()=>{
 const s=final(true,1e12-21-95);advance(s,.1);
 assert.equal(drop(s),undefined);assert.ok(s.events.some(e=>e.target==='loot-1'&&e.value===95));
 // v053 now caps the subsequent clear reward; the exact-cap sale still succeeds.
 assert.equal(s.hero.gold,1e12);assert.ok(s.logs.some(text=>text.includes('通關金幣達保存上限：實收 0，超額 25 未入帳')));
});
