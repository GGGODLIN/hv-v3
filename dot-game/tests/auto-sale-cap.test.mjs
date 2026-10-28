import test from 'node:test';
import assert from 'node:assert/strict';
const engine = await import(process.env.HV_AUTO_CAP_BASELINE ? new URL(process.env.HV_AUTO_CAP_BASELINE, import.meta.url) : '../src/engine.js');
import {generateItem} from '../src/loot.js';
function fixture(seed,auto=true,full=false){
 const s=engine.createGame(seed);
 s.inventory=['weapon','armor','accessory'].flatMap(slot=>Array.from({length:3},(_,base)=>{let n=0;return {...generateItem(()=>n++===0?(base+.1)/3:0,3,slot),id:`keeper-${slot}-${base}`,locked:true,stats:{attack:100000,defense:100000,hp:100000,crit:1,evade:1,block:1,parry:100000}};}));
 engine.act(s,'setAutoSell',auto);engine.act(s,'start');s.wave=4;s._clock=1;s.enemies=[{id:'controlled-final',name:'受控測試敵人',boss:true,hp:1,maxHp:1,attack:0,defense:0,evade:0,parry:0,block:0,resist:0}];
 if(full)while(s.inventory.length<engine.INVENTORY_LIMIT)s.inventory.push({...s.inventory[0],id:`filler-${s.inventory.length}`});
 return s;
}
function finish(s){for(let n=0;n<1000&&!s.wins;n++)engine.advance(s,.1);assert.equal(s.wins,1);return s;}
function saleSeed(){for(let n=1;n<100;n++){const s=finish(fixture(n));if(s.events.some(e=>e.text.startsWith('自動出售 ')))return n;}throw Error('no sale fixture');}
const seed=saleSeed();
for(const full of [false,true])test(`auto-sale rejects uncreditable drop and preserves exact item/RNG/ID, full=${full}`,()=>{
 const s=fixture(seed,true,full),off=fixture(seed,false,full);s.hero.gold=off.hero.gold=1e12;finish(s);finish(off);
 assert.deepEqual(s.inventory,off.inventory);assert.deepEqual(s.pendingLoot,off.pendingLoot);assert.equal(s.seed,off.seed);assert.equal(s._itemId,off._itemId);assert.equal(s.hero.gold,off.hero.gold);
 assert.ok(!s.events.some(e=>e.text.startsWith('自動出售 ')));assert.ok(s.logs.some(t=>t.includes('戰利品完整保留')));assert.ok(!s.logs.some(t=>t.includes('保底裝備已自動出售')));
});
test('auto-sale retains ordinary complete price when gold has room',()=>{const s=finish(fixture(seed)),off=finish(fixture(seed,false));const sale=s.events.find(e=>e.text.startsWith('自動出售 '));assert.ok(sale);assert.equal(s.hero.gold-off.hero.gold,sale.value);assert.equal(s.inventory.length+1,off.inventory.length);assert.equal(s.seed,off.seed);});
test('cap retention does not disable opt-in policy for later affordable drops',()=>{const s=fixture(seed);s.hero.gold=1e12;finish(s);assert.equal(s.autoSell,true);assert.ok([...s.inventory,...s.pendingLoot].some(i=>i.id==='loot-1'));});
