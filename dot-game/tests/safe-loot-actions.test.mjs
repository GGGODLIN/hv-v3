import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,advance,previewSafeSale,validateSave,INVENTORY_LIMIT} from '../src/engine.js';
import {generateItem,itemSalePrice,classifySafeLootItem} from '../src/loot.js';

const clone=value=>JSON.parse(JSON.stringify(value));
function freezeDeep(value){if(value&&typeof value==='object'){Object.values(value).forEach(freezeDeep);Object.freeze(value);}return value;}
function item(id,changes={}){
  return {...generateItem(()=>0,3,'weapon'),id,stats:{attack:10},power:20,...changes};
}
function batch(){
  const s=createGame(42);
  s.inventory=[item('keeper',{locked:true,stats:{attack:30}}),item('sale-a'),item('sale-b',{stats:{attack:20},power:30}),item('equal',{stats:{attack:30}})];
  return s;
}
function moneyAndItems(s){return clone({gold:s.hero.gold,inventory:s.inventory,equipment:s.equipment,pendingLoot:s.pendingLoot,seed:s.seed,_itemId:s._itemId});}
function allBaseKeepers(){
  return ['weapon','armor','accessory'].flatMap(slot=>Array.from({length:3},(_,base)=>{
    let n=0;const generated=generateItem(()=>n++===0?(base+.1)/3:0,3,slot);
    return {...generated,id:`keeper-${slot}-${base}`,locked:true,stats:{attack:100000,defense:100000,hp:100000,crit:1,evade:1,block:1}};
  }));
}
function finalWave(seed,auto=false){
  const s=createGame(seed);s.inventory=allBaseKeepers();
  if(auto)act(s,'setAutoSell',true);
  act(s,'start');s.wave=4;s._clock=1;
  s.enemies=[{id:'controlled-final',name:'受控測試敵人',boss:true,hp:1,maxHp:1,attack:0,defense:0,evade:0,parry:0,block:0,resist:0}];
  return s;
}

test('safe preview is pure, RNG-free and deeply detached from live items',()=>{
  const s=freezeDeep(batch()),before=clone(s),originalRandom=Math.random;
  Math.random=()=>{throw Error('preview must not draw RNG');};
  try {
    const preview=previewSafeSale(s);
    assert.deepEqual(preview.items.map(i=>i.id),['sale-a','sale-b']);
    assert.equal(preview.total,itemSalePrice(s.inventory[1])+itemSalePrice(s.inventory[2]));
    assert.deepEqual(preview.items[0],{id:'sale-a',name:s.inventory[1].name,slot:'weapon',quality:'Crude',keeperId:'keeper',keeperName:s.inventory[0].name,value:29,strictlyBetterKeys:['attack']});
    preview.items[0].name='changed';preview.items[0].strictlyBetterKeys.push('hp');preview.items.pop();preview.total=0;
    assert.deepEqual(s,before);assert.deepEqual(previewSafeSale(s).items.map(i=>i.id),['sale-a','sale-b']);
  } finally {Math.random=originalRandom;}
});

test('only equipped and explicitly locked inventory items witness a preview',()=>{
  const s=createGame();s.inventory=[item('unlocked-strong',{stats:{attack:30}}),item('weak')];
  assert.equal(previewSafeSale(s).items.length,0);
  s.pendingLoot=[item('pending-strong',{locked:true,stats:{attack:50}})];
  assert.equal(previewSafeSale(s).items.length,0,'pending storage is not a keeper pool');
  s.equipment.weapon=item('equipped',{locked:false,stats:{attack:20}});
  assert.deepEqual(previewSafeSale(s).items.map(i=>[i.id,i.keeperId]),[['weak','equipped']]);
  assert.ok(!previewSafeSale(s).items.some(i=>i.id==='equipped'));
  s.equipment.weapon=createGame().equipment.weapon;s.inventory[0].locked=true;
  assert.deepEqual(previewSafeSale(s).items.map(i=>[i.id,i.keeperId]),[['weak','unlocked-strong']]);
});

test('engine preview preserves equality, stat tradeoffs, high quality, unknown metadata and locked gear',()=>{
  const s=batch();
  s.inventory.push(item('tradeoff',{stats:{attack:5,hp:1}}),item('locked',{locked:true}),item('unknown',{futureBonus:1}),item('odd-name',{name:'自製裝備'}));
  let n=0;const superior=generateItem(()=>[0,.5,.99,.99,.5][n++]??.5,3,'weapon');
  s.inventory.push({...superior,id:'superior',stats:{attack:1}});
  assert.equal(superior.quality,'Superior');
  assert.deepEqual(previewSafeSale(s).items.map(i=>i.id),['sale-a','sale-b']);
});

test('duplicate live identifiers fail closed, including inventory/equipment/pending collisions',()=>{
  for(const location of ['inventory','equipment','pendingLoot']){
    const s=batch(),duplicate=clone(s.inventory[1]);
    if(location==='equipment')s.equipment.weapon=duplicate;else s[location].push(duplicate);
    assert.deepEqual(previewSafeSale(s),{items:[],total:0});
    const before=moneyAndItems(s);act(s,'sellSafe',{ids:['sale-a']});assert.deepEqual(moneyAndItems(s),before);
  }
  for(const bad of [null,undefined,[],{}, {inventory:[],equipment:{}}])assert.deepEqual(previewSafeSale(bad),{items:[],total:0});
});

test('preview never evaluates unsupported item accessors before refusing their sale or witness',()=>{
  for(const location of ['inventory','equipment','pendingLoot'])for(const field of ['id','locked','name','stats']){
    const s=batch(),unsupported=item('unsupported',{locked:true,stats:{attack:100}});let reads=0;
    Object.defineProperty(unsupported,field,{enumerable:true,get(){reads++;throw Error('item accessors must remain inert');}});
    if(location==='equipment')s.equipment.weapon=unsupported;else s[location].push(unsupported);
    const gold=s.hero.gold,seed=s.seed,preview=previewSafeSale(s);
    assert.equal(reads,0,`${location}.${field}`);assert.equal(s.hero.gold,gold);assert.equal(s.seed,seed);
    if(field==='id')assert.deepEqual(preview,{items:[],total:0});
    else assert.deepEqual(preview.items.map(i=>i.id),['sale-a','sale-b']);
  }
  for(const field of ['locked','id','name','stats']){
    const s=batch();let reads=0;Object.defineProperty(s.inventory[0],field,{enumerable:true,get(){reads++;return true;}});
    assert.deepEqual(previewSafeSale(s),{items:[],total:0});assert.equal(reads,0,'unsupported sole keeper cannot witness');
  }
});

test('safe sale commits only exact requested IDs once and keeps witnesses/equality',()=>{
  const s=batch(),before=moneyAndItems(s),price=itemSalePrice(s.inventory[2]);
  act(s,'sellSafe',{ids:['sale-b']});
  assert.equal(s.hero.gold,before.gold+price);
  assert.deepEqual(s.inventory.map(i=>i.id),['keeper','sale-a','equal']);
  assert.deepEqual(s.equipment,before.equipment);assert.equal(s.seed,before.seed);
  const after=moneyAndItems(s);act(s,'sellSafe',{ids:['sale-b']});
  assert.deepEqual(moneyAndItems(s),after);assert.match(s.logs[0],/取消.*未出售/);
});

test('safe sale credits the recomputed current price and accepts a subset, not a preview object',()=>{
  const s=batch(),preview=previewSafeSale(s);s.inventory[1].power=123;
  act(s,'sellSafe',{ids:[preview.items[0].id]});
  assert.equal(s.hero.gold,132);assert.ok(s.inventory.some(i=>i.id==='sale-b'));
  const unchanged=moneyAndItems(s);act(s,'sellSafe',preview);assert.deepEqual(moneyAndItems(s),unchanged);
});

test('sale revalidates all IDs atomically when any candidate or keeper became stale',()=>{
  const changes=[
    s=>s.inventory[2].locked=true,
    s=>s.inventory[2].stats.attack=100,
    s=>s.inventory[2].stats.hp=1,
    s=>s.inventory[2].quality='Superior',
    s=>s.inventory[2].futureBonus=1,
    s=>s.inventory.splice(2,1),
    s=>s.inventory[0].locked=false,
    s=>s.inventory[0].stats.attack=0,
    s=>s.inventory.splice(0,1),
    s=>act(s,'equip','sale-b'),
  ];
  for(const change of changes){
    const s=batch(),ids=previewSafeSale(s).items.map(i=>i.id);change(s);const before=moneyAndItems(s);
    act(s,'sellSafe',{ids});assert.deepEqual(moneyAndItems(s),before);assert.match(s.logs[0],/取消.*未出售/);
  }
});

test('malformed, duplicate, nonexistent and empty requested sets never partially credit',()=>{
  const payloads=[undefined,null,false,'sale-a',[],['sale-a'],{}, {ids:[]},{ids:['sale-a','sale-a']},{ids:['sale-a','missing']},{ids:['sale-a',1]},{ids:['sale-a',null]},{ids:['']},{ids:[{}]},{ids:['sale-a'],extra:true},{ids:Array(121).fill('sale-a')}];
  let getterCalls=0;payloads.push(Object.defineProperty({},'ids',{get(){getterCalls++;return ['sale-a'];}}));
  for(const payload of payloads){const s=batch(),before=moneyAndItems(s);act(s,'sellSafe',payload);assert.deepEqual(moneyAndItems(s),before);assert.match(s.logs[0],/取消/);}
  assert.equal(getterCalls,0);
});

test('safe sale and auto-sale settings require camp, not battle or defeat',()=>{
  for(const mode of ['battle','defeat']){
    const s=batch();s.mode=mode;const before=moneyAndItems(s);
    act(s,'sellSafe',{ids:['sale-a']});act(s,'setAutoSell',true);
    assert.deepEqual(moneyAndItems(s),before);assert.equal(Object.hasOwn(s,'autoSell'),false);assert.match(s.logs[0],/回營/);
  }
});

test('successful sale refills pending without selling any pending items or new inventory entrants',()=>{
  const s=batch();s.pendingLoot=[item('pending-eligible')];
  const price=itemSalePrice(s.inventory[1])+itemSalePrice(s.inventory[2]);
  act(s,'sellSafe',{ids:['sale-b','sale-a']});
  assert.equal(s.hero.gold,price);assert.deepEqual(s.inventory.map(i=>i.id),['keeper','equal','pending-eligible']);assert.equal(s.pendingLoot.length,0);
});

test('auto-sale is absent by default, strict boolean opt-in, and never sweeps existing items',()=>{
  const s=batch(),before=moneyAndItems(s);assert.equal(Object.hasOwn(s,'autoSell'),false);
  for(const invalid of [undefined,null,0,1,'true',{},[],new Boolean(true)]){act(s,'setAutoSell',invalid);assert.equal(Object.hasOwn(s,'autoSell'),false);}
  act(s,'setAutoSell',true);assert.equal(s.autoSell,true);assert.deepEqual(moneyAndItems(s),before);
  act(s,'setAutoSell','false');assert.equal(s.autoSell,true);
  act(s,'setAutoSell',false);assert.equal(Object.hasOwn(s,'autoSell'),false);assert.deepEqual(moneyAndItems(s),before);
});

test('future auto-sales preserve generated drop/RNG/ID streams and every unsupported drop across 100 seeds',()=>{
  let sold=0,kept=0;
  for(let seed=1;seed<=100;seed++){
    const off=finalWave(seed),on=finalWave(seed,true);
    off.inventory.push(item('existing-low'));on.inventory.push(item('existing-low'));
    advance(off,.1);advance(on,.1);assert.equal(off.wins,1);assert.equal(on.wins,1);
    const drop=off.inventory.find(i=>i.id.startsWith('loot-'));
    assert.ok(drop);assert.ok(classifySafeLootItem(drop));
    const planned=previewSafeSale(off).items.find(i=>i.id===drop.id);
    assert.equal(on.seed,off.seed);assert.equal(on._itemId,off._itemId);assert.equal(on._eventId,off._eventId);
    assert.deepEqual(on.timing,off.timing);assert.deepEqual(on.battle,off.battle);assert.deepEqual(on.equipment,off.equipment);
    assert.deepEqual({...on.hero,gold:0},{...off.hero,gold:0});assert.deepEqual(on.pendingLoot,off.pendingLoot);
    assert.ok(on.inventory.some(i=>i.id==='existing-low'),'opt-in never sweeps an older eligible item');
    if(planned){
      sold++;assert.equal(on.hero.gold,off.hero.gold+planned.value);assert.ok(!on.inventory.some(i=>i.id===drop.id));
      assert.deepEqual(on.inventory,off.inventory.filter(i=>i.id!==drop.id));
      assert.ok(on.events.some(e=>e.text.includes(`自動出售 ${drop.name}`)&&e.value===planned.value));
      assert.match(on.logs[0],/保底裝備已自動出售/);assert.ok(on.logs.some(log=>log.includes(drop.name)&&log.includes(`+${planned.value} 金幣`)));
    }else{
      kept++;assert.equal(on.hero.gold,off.hero.gold);assert.deepEqual(on.inventory,off.inventory);assert.match(on.logs[0],/保底裝備已入背包/);
    }
  }
  assert.ok(sold>10&&kept>10,`covered sold ${sold} and retained ${kept}`);
});

test('non-true auto flag and lack of protected witness preserve a new low drop',()=>{
  for(const autoSell of [false,'true',1,{},[]]){
    const baseline=finalWave(1),s=clone(baseline);s.autoSell=autoSell;advance(baseline,.1);advance(s,.1);
    delete s.autoSell;assert.deepEqual(s,baseline);
  }
  const s=finalWave(1,true);s.inventory=[];advance(s,.1);
  assert.ok(s.inventory.length);assert.ok(!s.logs.some(log=>log.startsWith('自動出售：')));
});

test('later guarantee and probabilistic ordinary drops keep RNG and all three slot distributions unchanged',()=>{
  const slots=new Set();let ordinaryDrops=0,ordinarySales=0;
  for(const ordinary of [false,true])for(let seed=1;seed<=100;seed++){
    const off=finalWave(seed),on=finalWave(seed,true);off.wins=on.wins=1;
    if(ordinary){for(const s of [off,on]){s.wave=1;s.enemies[0].boss=false;}}
    advance(off,.1);advance(on,.1);
    assert.equal(on.seed,off.seed);assert.equal(on._itemId,off._itemId);assert.deepEqual(on.battle,off.battle);
    const drop=off.inventory.find(i=>i.id.startsWith('loot-'));
    if(!drop){assert.equal(on.hero.gold,off.hero.gold);assert.deepEqual(on.inventory,off.inventory);continue;}
    slots.add(drop.slot);if(ordinary)ordinaryDrops++;
    const planned=previewSafeSale(off).items.find(i=>i.id===drop.id);
    if(planned){if(ordinary)ordinarySales++;assert.equal(on.hero.gold,off.hero.gold+planned.value);assert.deepEqual(on.inventory,off.inventory.filter(i=>i.id!==drop.id));}
    else {assert.equal(on.hero.gold,off.hero.gold);assert.deepEqual(on.inventory,off.inventory);}
  }
  assert.deepEqual([...slots].sort(),['accessory','armor','weapon']);assert.ok(ordinaryDrops>0&&ordinaryDrops<100);assert.ok(ordinarySales>0);
});

test('auto-sale does not relax inventory start reserves or pending-loot guard',()=>{
  for(const count of [116,120]){
    const s=createGame();s.inventory=Array.from({length:count},(_,i)=>item(`old-${i}`));act(s,'setAutoSell',true);
    const before=moneyAndItems(s);act(s,'start');assert.equal(s.mode,'town');assert.deepEqual(moneyAndItems(s),before);assert.match(s.logs[0],/背包空間不足/);
  }
  const s=createGame();s.pendingLoot=[item('pending')];act(s,'setAutoSell',true);act(s,'start');assert.equal(s.mode,'town');assert.equal(s.pendingLoot.length,1);
});

test('unsold overflow is held and forces camp even with auto-sale enabled',()=>{
  const s=finalWave(1,true);s.inventory=Array.from({length:INVENTORY_LIMIT},(_,i)=>item(`old-${i}`,{locked:true,name:'不可識別的保留裝備'}));
  advance(s,.1);assert.equal(s.inventory.length,INVENTORY_LIMIT);assert.equal(s.pendingLoot.length,1);assert.equal(s.mode,'town');
  assert.match(s.logs[0],/未出售的戰利品均保留/);assert.ok(s.pendingLoot[0].id.startsWith('loot-'));
});

test('ID assignment still wraps, avoids live collisions and advances for sold drops',()=>{
  for(let seed=1;seed<=20;seed++){
    const s=finalWave(seed,true);s._itemId=999999999;s.inventory[0].id='loot-1';advance(s,.1);
    assert.equal(s._itemId,2);assert.equal(new Set([...Object.values(s.equipment),...s.inventory,...s.pendingLoot].map(i=>i.id)).size,3+s.inventory.length+s.pendingLoot.length);
    assert.ok(s.events.some(e=>e.type==='loot'&&e.target==='loot-2'));
  }
});

test('save validation preserves only strict true auto-sale and keeps default save shape unchanged',()=>{
  for(const value of [undefined,null,false,0,1,'true',{},[]]){
    const source=batch();if(value!==undefined)source.autoSell=value;
    const before=clone(source),loaded=validateSave(source);assert.equal(Object.hasOwn(loaded,'autoSell'),false);assert.deepEqual(source,before);
  }
  const source=batch();source.autoSell=true;source.hero.gold=123;source.mode='battle';
  const loaded=validateSave(clone(source));assert.equal(loaded.autoSell,true);assert.equal(loaded.mode,'town');assert.equal(loaded.hero.gold,123);assert.deepEqual(loaded.inventory,source.inventory);
  assert.deepEqual(validateSave(clone(loaded)),loaded);
  act(loaded,'setAutoSell',false);assert.equal(Object.hasOwn(validateSave(clone(loaded)),'autoSell'),false);
});

test('unknown item/stat/roll schema rejects the whole import before stripping or auto-locking',()=>{
  for(const location of ['equipment','inventory','pendingLoot'])for(const mutate of [i=>i.futureProc={chance:.2},i=>i.stats.futureResist=.1,i=>{i.rolls={...(i.rolls||{}),futureResist:99};}]){
    const s=batch();s.autoSell=true;
    const record=location==='equipment'?s.equipment.weapon:location==='inventory'?s.inventory[1]:(s.pendingLoot=[item('pending')])[0];
    mutate(record);const before=clone(s);
    assert.throws(()=>validateSave(s),/不支援的裝備欄位或格式.*未載入/);assert.deepEqual(s,before,'failed validation cannot rewrite current/original bytes');
  }
});

test('unsupported known-key formats cannot disappear into a new eligible keeper or candidate',()=>{
  const changes=[i=>i.prefix=null,i=>i.suffix={},i=>i.stats=[],i=>i.rolls.attack='80',i=>i.rolls.hp=80,i=>{i.slot='armor';i.name='粗製・鐵衛胸甲';},i=>i.locked='false',i=>i.level='3',i=>i.power='20',i=>i.roll=null,i=>i.description={},i=>i.rarityColor=42];
  for(const change of changes){const s=batch();change(s.inventory[1]);const before=clone(s);assert.throws(()=>validateSave(s),/不支援的裝備欄位或格式/);assert.deepEqual(s,before);}
});

test('supported unknown identities stay loadable but ineligible; root/encounter extras remain ignored',()=>{
  const s=batch();s.inventory.push(item('unknown-name',{name:'未知武器'}),item('unknown-family',{weaponFamily:null}));
  s.futureRoot=true;s.hero.futureHero=true;s.enemies=[{futureEnemy:true}];
  const loaded=validateSave(clone(s));assert.equal(loaded.futureRoot,undefined);assert.equal(loaded.hero.futureHero,undefined);assert.deepEqual(loaded.enemies,[]);
  for(const id of ['unknown-name','unknown-family']){assert.equal(loaded.inventory.find(i=>i.id===id).locked,false);assert.ok(!previewSafeSale(loaded).items.some(i=>i.id===id));}
});

test('legacy sellCommon action remains compatible and distinct from safe preview',()=>{
  const s=batch();assert.ok(!previewSafeSale(s).items.some(i=>i.id==='equal'));
  const expected=s.inventory.filter(i=>!i.locked).reduce((sum,i)=>sum+itemSalePrice(i),0);
  act(s,'sellCommon');assert.equal(s.hero.gold,expected);assert.deepEqual(s.inventory.map(i=>i.id),['keeper']);
});
