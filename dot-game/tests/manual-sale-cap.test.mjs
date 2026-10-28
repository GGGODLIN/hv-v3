import test from 'node:test';
import assert from 'node:assert/strict';
const engine = await import(process.env.HV_SALE_BASELINE ? new URL(process.env.HV_SALE_BASELINE, import.meta.url) : '../src/engine.js');
import {generateItem,itemSalePrice} from '../src/loot.js';
const clone=structuredClone;
function fixture(){const s=engine.createGame(42);const item=(id,power,attack,locked=false)=>({...generateItem(()=>0,3,'weapon'),id,power,stats:{attack},locked});s.inventory=[item('keeper',50,50,true),item('sale-a',20,10),item('sale-b',30,20)];s.pendingLoot=[item('pending-a',40,40),item('pending-b',40,40)];return s;}
for(const kind of ['sell','sellSafe','sellCommon']){
 const payload=kind==='sell'?'sale-a':kind==='sellSafe'?{ids:['sale-a','sale-b']}:undefined;
 test(`${kind}: over-limit is atomic and does not refill pending or alter RNG`,()=>{const s=fixture();s.hero.gold=1e12;const before=clone(s);engine.act(s,kind,payload);assert.deepEqual(s,before);});
 test(`${kind}: exact-cap credits full proceeds and round-trips without loss`,()=>{const s=fixture();const total=kind==='sell'?29:68;s.hero.gold=1e12-total;engine.act(s,kind,payload);assert.equal(s.hero.gold,1e12);assert.ok(!s.inventory.some(i=>i.id==='sale-a'));assert.equal(s.pendingLoot.length,0);assert.equal(engine.validateSave(clone(s)).hero.gold,1e12);});
 test(`${kind}: one coin beyond capacity rejects entire sale`,()=>{const s=fixture();const total=kind==='sell'?29:68;s.hero.gold=1e12-total+1;const before=clone(s);engine.act(s,kind,payload);assert.deepEqual(s,before);});
}
