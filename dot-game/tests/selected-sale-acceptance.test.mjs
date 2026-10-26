import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import * as previous from './fixtures/v0.11/engine.js';
import {generateItem,scoreItem,itemSalePrice} from '../src/loot.js';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const clone=structuredClone;
const withoutLogs=s=>{const copy=clone(s);delete copy.logs;return copy;};
const quote=(s,ids)=>{const q=game.previewSelectedSale(s,ids);assert.equal(q.available,true,q.reason);return {ids:[...ids],quoteBasis:q.quoteBasis};};
const sell=(s,ids)=>game.act(s,'sellSelected',quote(s,ids));
const gear=(id,slot='weapon',rng=()=>.7)=>({...generateItem(rng,12,slot),id});
function fixture(){const s=game.createGame(42);s.inventory=[gear('chosen-a'),gear('chosen-b','armor'),gear('kept-c','accessory'),gear('locked','weapon')];s.inventory[3].locked=true;return s;}
function reject(s,payload){const before=clone(s);game.act(s,'sellSelected',payload);assert.deepEqual(s,before);}

test('selected independent: portable accepted engine and loot fixture identities are fixed',()=>{
  for(const [file,sha]of Object.entries({'engine.js':'f9ce98a168071a00f9f388fd8c3b90bd9f45ac8d650516cb374189a6f66c2602','loot.js':'458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc'}))assert.equal(createHash('sha256').update(readFileSync(new URL(`./fixtures/v0.11/${file}`,import.meta.url))).digest('hex'),sha);
});
test('selected independent: explicit high-quality and stat-tradeoff sales are not falsely treated as safe downgrades',()=>{
  const s=fixture(),ids=['chosen-a','chosen-b'],before=clone(s),q=game.previewSelectedSale(s,ids);
  assert.equal(q.available,true);assert.ok(q.items.every(i=>!['Crude','Fair','Average'].includes(i.quality)));
  assert.ok(ids.every(id=>!game.previewSafeSale(s).items.some(i=>i.id===id)));
  assert.equal(q.total,ids.reduce((sum,id)=>sum+itemSalePrice(s.inventory.find(i=>i.id===id)),0));
  assert.deepEqual(q.items.map(i=>i.id),ids);assert.deepEqual(s,before);
  for(const entry of q.items){assert.deepEqual(entry.item,s.inventory.find(i=>i.id===entry.id));assert.deepEqual(entry.currentEquipment,s.equipment[entry.slot]);}
  q.items[0].item.stats.attack=99999;q.items[0].currentEquipment.stats.attack=99999;q.items[0].value=0;q.total=0;
  assert.deepEqual(s,before);const expected=clone(s);for(const id of ids)previous.act(expected,'sell',id);
  sell(s,ids);assert.deepEqual(withoutLogs(s),withoutLogs(expected));assert.equal(s.inventory.find(i=>i.id==='locked').locked,true);
});

test('selected independent: subset, reversed order, repeat and overlapping old quote cannot sell added items',()=>{
  const s=fixture(),first=quote(s,['chosen-b','chosen-a']),old=quote(s,['chosen-a','kept-c']);
  const added=gear('added-later','accessory');s.inventory.push(added);const expected=clone(s);for(const id of first.ids)previous.act(expected,'sell',id);
  game.act(s,'sellSelected',first);assert.deepEqual(withoutLogs(s),withoutLogs(expected));assert.deepEqual(s.inventory.find(i=>i.id==='added-later'),added);
  reject(s,first);reject(s,old);assert.ok(s.inventory.some(i=>i.id==='kept-c'));
});

for(const mutate of [
  s=>{s.inventory[0].locked=true;},s=>{s.inventory[0].stats.attack+=1;},s=>{s.inventory[0].power+=1;},
  s=>{s.inventory[0].name+='變更';},s=>{s.inventory[0].description+='變更';},s=>{s.inventory.splice(1,1);},
  s=>{s.equipment.weapon.stats.attack+=1;},s=>{s.hero.gold+=1;},s=>game.act(s,'equip','chosen-a'),
  s=>{s.mode='battle';},s=>{s.mode='defeat';},s=>{s.mode='intermission';}
])test(`selected independent: stale selection is atomic (${mutate.toString()})`,()=>{const s=fixture(),q=quote(s,['chosen-a','chosen-b']);mutate(s);reject(s,q);});

test('selected independent: any locked/equipped/pending/missing/duplicate ID makes the whole preview invalid',()=>{
  const s=fixture();s.pendingLoot.push(gear('pending','armor'));
  for(const ids of [[],['chosen-a','locked'],['chosen-a',s.equipment.weapon.id],['chosen-a','pending'],['chosen-a','absent'],['chosen-a','chosen-a'],['chosen-a',null],['chosen-a',3]]){
    const before=clone(s),q=game.previewSelectedSale(s,ids);assert.equal(q.available,false);assert.equal(q.quoteBasis,null);assert.deepEqual(s,before);reject(s,{ids,quoteBasis:'untrusted'});
  }
});

test('selected independent: unknown item schema refuses sale without stripping unknown data',()=>{
  for(const change of [item=>item.futureBonus=7,item=>item.stats.futureBonus=7,item=>item.rolls.futureBonus=7,item=>item.power=Infinity,item=>item.locked='false']){
    const s=fixture(),q=quote(s,['chosen-a','chosen-b']);change(s.inventory[1]);assert.equal(game.previewSelectedSale(s,q.ids).available,false);reject(s,q);
  }
});

test('selected independent: exact payload required, hostile getters stay inert',()=>{
  const s=fixture(),valid=quote(s,['chosen-a']);
  for(const p of [null,undefined,[],{},valid.ids,{ids:valid.ids},{...valid,total:0},{ids:valid.ids,quoteBasis:1},{ids:valid.ids,quoteBasis:''},{ids:['chosen-a','chosen-a'],quoteBasis:valid.quoteBasis}])reject(s,p);
  for(const key of ['ids','quoteBasis']){let reads=0;const p={...valid};Object.defineProperty(p,key,{enumerable:true,get(){reads++;throw Error('getter invoked');}});reject(s,p);assert.equal(reads,0);}
});

test('selected independent: duplicate live identifiers fail closed across all containers',()=>{
  for(const where of ['inventory','pendingLoot','equipment']){const s=fixture(),q=quote(s,['chosen-a']);
    const duplicate=clone(s.inventory[0]);if(where==='equipment')s.equipment.weapon=duplicate;else s[where].push(duplicate);
    assert.equal(game.previewSelectedSale(s,['chosen-a']).available,false);reject(s,q);
  }
});

test('selected independent: pending refill preserves exactly the old FIFO path and does not sell pending records',()=>{
  const s=fixture();s.inventory=Array.from({length:120},(_,i)=>gear(`full-${i}`,i%2?'weapon':'armor'));s.pendingLoot=[gear('pending-a','armor'),gear('pending-b','accessory'),gear('pending-c','weapon')];
  const expected=clone(s),ids=['full-3','full-1'];for(const id of ids)previous.act(expected,'sell',id);
  sell(s,ids);assert.deepEqual(withoutLogs(s),withoutLogs(expected));assert.equal(s.inventory.length,120);assert.deepEqual(s.pendingLoot.map(i=>i.id),['pending-c']);
});

test('selected independent: manual selection is transient and leaves existing save schema unchanged',()=>{
  const s=fixture(),before=game.validateSave(clone(s));quote(s,['chosen-a']);assert.deepEqual(game.validateSave(clone(s)),before);
  sell(s,['chosen-a']);const current=game.validateSave(clone(s)),old=previous.validateSave(clone(s));assert.deepEqual(current,old);assert.equal(Object.hasOwn(current,'selectedSale'),false);
});

// All acquisition uses normal public actions and simulation, not a level, loot,
// resource or browser-save injection. Score-based equips are only a deterministic
// cohort policy, never a new sale recommendation or universally best build claim.
test('selected independent: three natural loot cohorts retain accepted gameplay then batch equals exact singleton sales',t=>{
  const results=[];
  for(const seed of [29,42,77]){
    const s=game.createGame(seed),old=previous.createGame(seed);let steps=0;
    const action=(name,payload)=>{game.act(s,name,payload);previous.act(old,name,payload);assert.deepEqual(s,old);};
    for(let run=0;run<30;run++){
      for(const slot of ['weapon','armor','accessory']){const best=[s.equipment[slot],...s.inventory.filter(i=>i.slot===slot)].reduce((a,b)=>scoreItem(a)>=scoreItem(b)?a:b);if(best.id!==s.equipment[slot].id)action('equip',best.id);}
      if(s.hero.level>=4&&!s.abilities)for(const id of ['hp-tank','mp-tank','one-handed-damage']){action('learnAbility',id);action('slotAbility',id);}
      action('selectStage',Math.min(3,s.unlocked));const wins=s.wins;action('start');
      for(let n=0;n<600&&s.mode==='battle'&&s.wins===wins;n++){game.advance(s,1);previous.advance(old,1);assert.deepEqual(s,old);steps++;}
      assert.equal(s.wins,wins+1);action('retreat');
    }
    const ids=s.inventory.filter(i=>!i.locked).slice(0,12).map(i=>i.id);assert.equal(ids.length,12);const prices=ids.map(id=>itemSalePrice(s.inventory.find(i=>i.id===id))),before=clone(s),expected=clone(s);
    const high=ids.filter(id=>!['Crude','Fair','Average'].includes(s.inventory.find(i=>i.id===id).quality)).length;assert.ok(high>0);
    const safeBefore=game.previewSafeSale(s);quote(s,ids);assert.deepEqual(game.previewSafeSale(s),safeBefore);
    for(const id of ids)previous.act(expected,'sell',id);sell(s,ids);assert.deepEqual(withoutLogs(s),withoutLogs(expected));
    assert.deepEqual(game.validateSave(clone(s)),previous.validateSave(clone(s)));
    results.push({seed,wins:before.wins,level:before.hero.level,steps,inventoryBefore:before.inventory.length,inventoryAfter:s.inventory.length,selected:ids.length,selectedAboveAverage:high,credited:prices.reduce((a,b)=>a+b,0),unchangedSeed:s.seed===before.seed});
  }
  t.diagnostic(JSON.stringify({kind:'engine-earned-not-browser-earned',runs:90,results}));
});


test('selected independent: quote reads frozen state without RNG and aggregate overflow rejects rather than losing credits on reload',()=>{
  const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
  const s=freeze(fixture()),before=clone(s),rng=Math.random;Math.random=()=>{throw Error('no randomness in a preview');};
  try{assert.equal(game.previewSelectedSale(s,['chosen-a']).available,true);assert.deepEqual(s,before);}finally{Math.random=rng;}
  const capped=fixture();capped.hero.gold=1e12;assert.equal(game.previewSelectedSale(capped,['chosen-a']).available,false);reject(capped,{ids:['chosen-a'],quoteBasis:'anything'});
  capped.hero.gold=1e12-itemSalePrice(capped.inventory[0]);sell(capped,['chosen-a']);assert.equal(capped.hero.gold,1e12);assert.equal(game.validateSave(clone(capped)).hero.gold,1e12);
});
