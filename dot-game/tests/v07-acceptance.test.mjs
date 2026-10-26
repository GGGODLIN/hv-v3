import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {createGame,act,advance,stats,validateSave,previewWeaponCommission,previewSafeSale,INVENTORY_LIMIT} from '../src/engine.js';
import {createCommissionWeapon,generateItem,itemSalePrice,scoreItem,hasUnknownSaleMetadata,resolveWeaponFamily} from '../src/loot.js';

const clone=value=>structuredClone(value);
const jsonClone=value=>JSON.parse(JSON.stringify(value));
const sha256=value=>createHash('sha256').update(value).digest('hex');
const families=['axe','rapier','club'];
const source=readFileSync(new URL('../src/engine.js',import.meta.url),'utf8');
const historicalEngineSource=readFileSync(new URL('./fixtures/v0.8.1/engine.js',import.meta.url),'utf8');
const lootSource=readFileSync(new URL('../src/loot.js',import.meta.url),'utf8');
const region=(s,start,end)=>{const a=s.indexOf(start),b=end?s.indexOf(end,a):s.length;assert.ok(a>=0&&b>a);return s.slice(a,b);};
const durable=s=>{const copy=clone(s);delete copy.logs;return copy;};
function camp(level=7,gold=1e6){const s=createGame(42);s.hero.level=level;s.hero.gold=gold;s.wins=1;return s;}
function request(s,family='axe'){const q=previewWeaponCommission(s,family);return {family:q.family,quoteBasis:q.quoteBasis};}
function buy(s,family='axe'){const q=previewWeaponCommission(s,family);assert.equal(q.available,true,q.reason);act(s,'commissionWeapon',{family,quoteBasis:q.quoteBasis});return q;}
function frozen(value){if(value&&typeof value==='object'){Object.values(value).forEach(frozen);Object.freeze(value);}return value;}
function refuse(s,payload){const before=durable(s);assert.equal(act(s,'commissionWeapon',payload),s);assert.deepEqual(durable(s),before);assert.match(s.logs[0],/取消.*未扣款或交付裝備/);}
function held(id,family='axe'){return {...createCommissionWeapon(family,1),id};}

test('v0.7 independent: all 1500 family/level offers obey independent R110 Slaughter arithmetic, exact prices and atomic delivery',()=>{
  const endpoints={axe:[470,888],rapier:[230,601],club:[353,792]},q=(110/200)**1.52;
  for(let level=1;level<=500;level++)for(const family of families){
    const s=camp(level),before=clone(s),offer=previewWeaponCommission(s,family),item=offer.item;
    const [low,high]=endpoints[family],attack=Math.max(1,Math.round((low+(high-low)*q)*.0854*(1+level/(50/3))));
    const crit=Math.round(Math.min(.16,(124+(511-124)*q)*.0105/100*(1+level/2000))*10000)/10000;
    assert.deepEqual(item.stats,family==='axe'?{attack}:{attack,crit});
    assert.deepEqual(item.rolls,family==='axe'?{attack:110}:{attack:110,crit:110});
    assert.equal(item.level,level);assert.equal(item.quality,'Superior');assert.equal(item.roll,110);
    assert.equal(item.prefix,'');assert.equal(item.suffix,'屠戮');assert.equal(item.locked,true);
    assert.equal(item.weaponFamily,family);assert.equal(item.power,scoreItem(item));assert.equal(item.id,'loot-1');
    const resale=Math.max(1,Math.round(level*3+item.power));
    assert.equal(offer.price,Math.max(250,4*resale));assert.equal(itemSalePrice(item),resale);assert.equal(offer.goldAfter,s.hero.gold-offer.price);
    assert.equal(offer.available,true);assert.deepEqual(s,before,'preview must not allocate ID, debit, roll or log');
    act(s,'commissionWeapon',{family,quoteBasis:offer.quoteBasis});
    assert.deepEqual(s.inventory,[item]);assert.equal(s.hero.gold,before.hero.gold-offer.price);assert.equal(s._itemId,1);
    assert.deepEqual(s.equipment,before.equipment,'buy is not equip');assert.equal(s.seed,before.seed);assert.equal(s._eventId,before._eventId+1);
    const expected=clone(before);expected.hero.gold=s.hero.gold;expected._itemId=1;expected.inventory=[clone(item)];expected._eventId++;
    delete expected.events;delete expected.logs;const actual=clone(s);delete actual.events;delete actual.logs;assert.deepEqual(actual,expected,'only intended transaction fields change');
    assert.equal(s.events.at(-1).target,item.id);assert.match(s.logs[0],new RegExp(`-${offer.price}`));
  }
});

test('v0.7 independent: preview is detached and accepts deeply frozen state with no randomness or clock access',()=>{
  const s=frozen(camp()),before=clone(s),expected=families.map(f=>previewWeaponCommission(s,f));
  const random=Math.random,now=Date.now;
  try {Math.random=()=>{throw Error('no RNG');};Date.now=()=>{throw Error('no clock');};
    for(let n=0;n<20;n++)assert.deepEqual(families.map(f=>previewWeaponCommission(s,f)),expected);
  }finally{Math.random=random;Date.now=now;}
  for(let n=0;n<3;n++){
    const a=previewWeaponCommission(s,families[n]),b=previewWeaponCommission(s,families[n]);
    assert.notEqual(a,b);assert.notEqual(a.item,b.item);assert.notEqual(a.item.stats,b.item.stats);assert.notEqual(a.item.rolls,b.item.rolls);assert.notEqual(a.currentWeapon,s.equipment.weapon);
    a.item.stats.attack=1e6;a.item.rolls.attack=0;a.item.id='forged';a.currentWeapon.stats.attack=1e6;
    assert.deepEqual(b,expected[n]);assert.deepEqual(previewWeaponCommission(s,families[n]),expected[n]);
  }
  assert.deepEqual(s,before);
});

test('v0.7 independent: changed preview object cannot dictate price, stats, lock, quality or delivered identity',()=>{
  const s=camp(),q=previewWeaponCommission(s,'club'),expected=clone(q.item),gold=s.hero.gold;
  q.item.stats.attack=1e6;q.item.locked=false;q.item.id='forged';q.item.quality='Peerless';q.price=0;q.goldAfter=gold+999;
  act(s,'commissionWeapon',{family:'club',quoteBasis:q.quoteBasis});
  assert.deepEqual(s.inventory,[expected]);assert.equal(s.hero.gold,gold-Math.max(250,4*itemSalePrice(expected)));
});

test('v0.7 independent: camp after first win and sufficient exact balance are mandatory; rejected buys are atomic',()=>{
  for(const change of [s=>s.wins=0,s=>s.mode='battle',s=>{s.mode='battle';s._phase='intermission';},s=>s.mode='defeat',s=>s.mode='unknown']){
    const s=camp(),p=request(s);change(s);assert.equal(previewWeaponCommission(s,'axe').available,false);refuse(s,p);
  }
  const q=previewWeaponCommission(camp(),'axe');
  for(const gold of [0,q.price-1,q.price-.01]){const s=camp(7,gold);assert.equal(previewWeaponCommission(s,'axe').available,false);refuse(s,request(s));}
  for(const gold of [q.price,q.price+.5]){const s=camp(7,gold);buy(s);assert.equal(s.hero.gold,gold-q.price);assert.equal(s.inventory.length,1);}
});

test('v0.7 independent: invalid family/level/gold/counter/state fails without coercion or a partial purchase',()=>{
  const coercion={valueOf(){throw Error('do not coerce');},toString(){throw Error('do not stringify');}};
  for(const family of [undefined,null,1,false,[],{},coercion,'','Axe',' axe','sword',Symbol('axe'),1n]){
    const s=camp(),before=clone(s),q=previewWeaponCommission(s,family);assert.equal(q.available,false);assert.equal(q.item,null);assert.deepEqual(s,before);
  }
  for(const [key,values] of [['level',[0,-1,501,1.1,NaN,Infinity,'7',null]],['gold',[-1,1e12+1,NaN,Infinity,'1000',null]]])for(const value of values){
    const s=camp();s.hero[key]=value;const q=previewWeaponCommission(s,'axe');assert.equal(q.available,false);refuse(s,{family:'axe',quoteBasis:'invalid'});
  }
  for(const value of [-1,1e9+1,NaN,Infinity,1.1,'1',null]){const s=camp();s._itemId=value;assert.equal(previewWeaponCommission(s,'axe').available,false);refuse(s,{family:'axe',quoteBasis:'invalid'});}
  for(const s of [undefined,null,{},[],{hero:{level:7}}])assert.equal(previewWeaponCommission(s,'axe').available,false);
});

test('v0.7 independent: malformed/tampered payloads reject, including inherited, hidden, symbol and accessor fields',()=>{
  let getterCalls=0;
  const mutations=[p=>undefined,p=>null,p=>false,p=>1,p=>'axe',p=>[],p=>({}),p=>({family:p.family}),p=>({quoteBasis:p.quoteBasis}),
    p=>({...p,price:0}),p=>({...p,item:held('forged')}),p=>({...p,goldAfter:1e12}),p=>({...p,family:'club'}),p=>({...p,family:'Axe'}),
    p=>({...p,quoteBasis:p.quoteBasis+' '}),p=>({...p,quoteBasis:''}),p=>({...p,quoteBasis:'x'.repeat(8193)}),p=>({...p,quoteBasis:42}),
    p=>Object.create(p),p=>Object.assign(Object.create({extra:true}),p),p=>({...p,[Symbol('extra')]:1}),
    p=>Object.defineProperty({...p},'quoteBasis',{value:p.quoteBasis,enumerable:false}),
    p=>Object.defineProperty({...p},'family',{get(){getterCalls++;throw Error('do not invoke');},enumerable:true}),
    p=>Object.defineProperty({...p},'quoteBasis',{get(){getterCalls++;throw Error('do not invoke');},enumerable:true}),
    p=>Object.defineProperty({...p},'extra',{value:1,enumerable:false}),
    p=>new Proxy(p,{ownKeys(){throw Error('uninspectable');}})];
  for(const mutation of mutations){const s=camp(),p=mutation(request(s));refuse(s,p);}
  assert.equal(getterCalls,0);
  const s=camp(),p=Object.assign(Object.create(null),request(s));act(s,'commissionWeapon',p);assert.equal(s.inventory.length,1,'plain null-prototype data remains supported');
});

test('v0.7 independent: all quoted current-weapon fields, level, balance, item counter and predicted-ID collision invalidate consent',()=>{
  const changes=[s=>s.hero.level++,s=>s.hero.gold++,s=>s.hero.gold--,s=>s._itemId++,
    s=>s.equipment.weapon.id+='x',s=>s.equipment.weapon.name+='x',s=>s.equipment.weapon.stats.attack++,
    s=>s.equipment.weapon.locked=false,s=>s.equipment.weapon.description+='x',s=>s.equipment.weapon.level++,
    s=>s.equipment.weapon.roll++,s=>s.equipment.weapon.power++,s=>s.equipment.weapon.quality='Fair',
    s=>s.equipment.weapon.rarityColor='#ffffff',s=>s.equipment.weapon.weaponFamily='club',
    s=>s.inventory.push(held('loot-1'))];
  for(const change of changes){const s=camp(),p=request(s);change(s);assert.notEqual(previewWeaponCommission(s,'axe').quoteBasis,p.quoteBasis);refuse(s,p);}
});

test('v0.7 independent: unrelated armor/inventory changes do not masquerade as changed weapon comparison; commit still rechecks capacity',()=>{
  const s=camp(),p=request(s);s.equipment.armor.stats.hp++;s.inventory.push(held('unrelated'));
  assert.equal(previewWeaponCommission(s,'axe').quoteBasis,p.quoteBasis);act(s,'commissionWeapon',p);assert.equal(s.inventory.length,2);
});

test('v0.7 independent: second confirmation, replay after reload and another-family confirmation cannot double debit or deliver',()=>{
  const s=camp(),a=request(s,'axe'),b=request(s,'club');act(s,'commissionWeapon',a);assert.equal(s.inventory.length,1);
  refuse(s,a);refuse(s,b);const restored=validateSave(jsonClone(s));refuse(restored,a);refuse(restored,b);
  const fresh=request(restored,'club'),before=restored.hero.gold;act(restored,'commissionWeapon',fresh);assert.equal(restored.inventory.length,2);assert.ok(restored.hero.gold<before);
});

test('v0.7 independent: 114-before/115-after reserve boundary permits expedition, while 115+ and pending refuse direct delivery',()=>{
  for(const length of [113,114,115,119,120]){
    const s=camp();s.inventory=Array.from({length},(_,n)=>held(`held-${n}`));const p=request(s),q=previewWeaponCommission(s,'axe');
    if(length<=114){assert.equal(q.available,true);act(s,'commissionWeapon',p);assert.equal(s.inventory.length,length+1);assert.equal(s.pendingLoot.length,0);act(s,'start');assert.equal(s.mode,'battle');}
    else{assert.equal(q.available,false);refuse(s,p);}
  }
  const s=camp(),p=request(s);s.pendingLoot=[held('pending')];assert.equal(previewWeaponCommission(s,'axe').available,false);refuse(s,p);
  const stale=camp(),old=request(stale);stale.inventory=Array.from({length:115},(_,n)=>held(`held-${n}`));refuse(stale,old);
  assert.equal(INVENTORY_LIMIT,120);
});

test('v0.7 independent: normal ID wrap skips equipment/inventory collisions, leaves no duplicates and survives strict reload',()=>{
  for(const counter of [999999998,999999999,1000000000]){
    const s=camp();s._itemId=counter;s.equipment.weapon.id='loot-1';s.equipment.armor.id='loot-2';s.inventory=[held('loot-3'),held('loot-999999999')];
    const q=previewWeaponCommission(s,'rapier');assert.equal(q.item.id,'loot-4');assert.equal(s._itemId,counter);
    buy(s,'rapier');assert.equal(s._itemId,4);assert.equal(s.inventory.at(-1).id,'loot-4');
    const ids=[...Object.values(s.equipment),...s.inventory,...s.pendingLoot].map(i=>i.id);assert.equal(new Set(ids).size,ids.length);
    const restored=validateSave(jsonClone(s));assert.deepEqual(restored.inventory,s.inventory);assert.equal(restored._itemId,999999999);
    assert.equal(previewWeaponCommission(restored,'club').item.id,'loot-5');
  }
  for(const mutate of [s=>s.inventory.push(held(s.equipment.weapon.id)),s=>s.inventory.push(held('')),s=>s.inventory.push(held('x'.repeat(101)))]){
    const s=camp(),p=request(s);mutate(s);assert.equal(previewWeaponCommission(s,'axe').available,false);refuse(s,p);
  }
});

test('v0.7 independent: bought lock and Superior protection survive cleanup; intentional unlock/resale always loses credits',()=>{
  for(const level of [1,2,7,19,100,500])for(const family of families){
    const s=camp(level),initial=s.hero.gold;s.autoSell=true;const q=buy(s,family),id=q.item.id;
    assert.equal(previewSafeSale(s).items.some(i=>i.id===id),false);const gold=s.hero.gold;
    act(s,'sell',id);assert.equal(s.hero.gold,gold);assert.equal(s.inventory.length,1);
    act(s,'sellCommon');assert.equal(s.inventory.length,1);
    act(s,'lock',id);assert.equal(s.inventory[0].locked,false);assert.equal(previewSafeSale(s).items.some(i=>i.id===id),false);
    act(s,'sellSafe',{ids:[id]});assert.equal(s.hero.gold,gold);assert.equal(s.inventory.length,1);
    act(s,'sell',id);assert.equal(s.inventory.length,0);assert.equal(s.hero.gold,initial-q.price+itemSalePrice(q.item));assert.ok(s.hero.gold<initial);
    const after=s.hero.gold;act(s,'sell',id);assert.equal(s.hero.gold,after);
  }
});

test('v0.7 independent: imported valid pre-buy quote may still work, but bought export/reload never automatically repeats a transaction',()=>{
  const s=validateSave(jsonClone(camp())),p=request(s),before=s.hero.gold;
  const restored=validateSave(jsonClone(s));act(restored,'commissionWeapon',p);assert.equal(restored.inventory.length,1);assert.ok(restored.hero.gold<before);
  const after=validateSave(jsonClone(restored));assert.deepEqual(after.inventory,restored.inventory);assert.equal(after.hero.gold,restored.hero.gold);assert.equal(after.mode,'town');refuse(after,p);
  assert.deepEqual(Object.keys(after).sort(),Object.keys(validateSave(jsonClone(createGame()))).sort(),'no durable commission ledger or marker');
});

// Exact accepted v0.6 sanitizer/validator, not current code or a simulated downgrade.
const oldV06ValidatorSource=String.raw`function sanitizeItem(raw, expectedSlot) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||!SLOTS.includes(raw.slot)||(expectedSlot&&raw.slot!==expectedSlot))throw new Error('裝備資料不完整');
  if(typeof raw.id!=='string'||!raw.id||raw.id.length>100||(/^loot-/.test(raw.id)&&!/^loot-\d{1,9}$/.test(raw.id)))throw new Error('裝備識別碼無效');
  if(!QUALITY.includes(raw.quality))throw new Error('裝備品質無效');
  const bonuses={};for(const k of ['attack','defense','hp','crit','evade','block']){if(raw.stats?.[k]!==undefined){if(typeof raw.stats[k]!=='number'||!Number.isFinite(raw.stats[k])||raw.stats[k]<0||raw.stats[k]>(['crit','evade','block'].includes(k)?1:1000000))throw new Error('裝備屬性無效');bonuses[k]=raw.stats[k];}}
  const rolls={};for(const key of Object.keys(bonuses)){if(raw.rolls?.[key]!==undefined)rolls[key]=clamp(finite(raw.rolls[key]),0,200);}
  const weaponFamily=resolveWeaponFamily(raw);
  return {...(raw.slot==='weapon'?{weaponFamily}:{}),...(raw.rolls&&typeof raw.rolls==='object'?{rolls}:{}),...(typeof raw.prefix==='string'?{prefix:text(raw.prefix,'',40)}:{}),...(typeof raw.suffix==='string'?{suffix:text(raw.suffix,'',40)}:{}),id:raw.id,name:text(raw.name,'未知裝備'),slot:raw.slot,quality:text(raw.quality,'Average',24),rarityColor:typeof raw.rarityColor==='string'&&/^#[\da-f]{3,8}$/i.test(raw.rarityColor)?raw.rarityColor:'#aab6c8',level:integer(raw.level,1,1000),roll:clamp(finite(raw.roll),0,500),power:clamp(finite(raw.power),0,1000000),stats:bonuses,locked:raw.locked===true,description:text(raw.description,'',240)};
}
export function validateSave(input) {
  if(!input||typeof input!=='object'||Array.isArray(input)||input.version!==VERSION||!input.hero||!input.equipment||!Array.isArray(input.inventory)||input.inventory.length>INVENTORY_LIMIT)throw new Error('不支援或損壞的存檔');
  const h=input.hero;if(!Number.isInteger(h.level)||h.level<1||h.level>500||!Number.isFinite(h.xp)||h.xp<0||!Number.isFinite(h.gold)||h.gold<0)throw new Error('角色資料無效');
  const s=createGame(input.seed);s.hero.level=h.level;s.hero.xpNext=nextXp(h.level);s.hero.xp=clamp(h.xp,0,s.hero.xpNext-1);s.hero.gold=clamp(h.gold,0,1e12);s.hero.proficiency=clamp(finite(h.proficiency),0,1e6);
  // Rebuild allocated growth rather than trusting imported attribute multipliers.
  for(const k of Object.keys(s.hero.attributes))s.hero.attributes[k]=8+(h.level-1)*2;
  const sanitizeForLoad=(raw,slot)=>{
    // Refuse unknown item/stat/roll fields before the historical whitelist can
    // erase them. No auto-lock can silently become a trusted keeper witness.
    if(hasUnknownSaleMetadata(raw))throw new Error('不支援的裝備欄位或格式，未載入；請保留原存檔。');
    return sanitizeItem(raw,slot);
  };
  s.equipment=Object.fromEntries(SLOTS.map(slot=>[slot,sanitizeForLoad(input.equipment[slot],slot)]));
  s.inventory=input.inventory.map(i=>sanitizeForLoad(i));
  if(input.pendingLoot!==undefined&&(!Array.isArray(input.pendingLoot)||input.pendingLoot.length>8))throw new Error('待領戰利品資料無效');
  s.pendingLoot=(input.pendingLoot||[]).map(i=>sanitizeForLoad(i));
  const items=[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];if(new Set(items.map(i=>i.id)).size!==items.length)throw new Error('重複裝備識別碼');
  s._itemId=Math.max(integer(input._itemId,0,1e9),...items.map(i=>/^loot-\d+$/.test(i.id)?Number(i.id.slice(5)):0));
  s.unlocked=integer(input.unlocked,1,MAX_STAGE);s.stage=integer(input.stage,1,s.unlocked);s.kills=integer(input.kills,0,1e9);s.wins=integer(input.wins,0,1e9);s.autoAdvance=input.autoAdvance===true;s.strategy=validStrategy(input.strategy)?input.strategy:'balanced';s.battle.cleared=s.wins;
  if(input.autoSell===true)s.autoSell=true;
  for(let n=1;n<=MAX_STAGE;n++){const t=input.battle?.bestTimes?.[n];if(typeof t==='number'&&Number.isFinite(t)&&t>0&&t<1e6)s.battle.bestTimes[n]=t;}
  recover(s);log(s,'存檔已讀取，安全回營；不計離線戰鬥收益。');return s;
}
`;
const validateOldV06=runInNewContext(`
const VERSION=1,MAX_STAGE=30,INVENTORY_LIMIT=120,SLOTS=['weapon','armor','accessory'];
const QUALITY=['Crude','Fair','Average','Superior','Exquisite','Magnificent','Legendary','Peerless'];
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const finite=(n,fallback=0)=>typeof n==='number'&&Number.isFinite(n)?n:fallback;
const integer=(n,lo,hi,fallback=lo)=>clamp(Math.floor(finite(n,fallback)),lo,hi);
const text=(s,fallback,max=100)=>typeof s==='string'?s.slice(0,max):fallback;
const cumulativeXp=level=>level<=1?0:Math.round((level+3)**(2.850263212287058**(1+level/1000)));
const nextXp=level=>cumulativeXp(level+1)-cumulativeXp(level);
const validStrategy=value=>['balanced','assault','sustain'].includes(value);
const recover=s=>{const p=stats(s);s.hero.hp=p.maxHp;s.hero.mp=p.maxMp;};
const log=(s,message)=>{s.logs.unshift(message);s.logs.length=Math.min(30,s.logs.length);};
${oldV06ValidatorSource.replace('export function validateSave','function validateSave')}
validateSave;`,{createGame,stats,resolveWeaponFamily,hasUnknownSaleMetadata});

test('v0.7 historical: strict import/ordinary state helpers and the actual old validator fixture remain exact',()=>{
  // v0.10 intentionally adds optional ability validation and sheet growth.
  // Preserve these historical hashes against the already frozen own-v0.8.1
  // source; all behavioral tests still exercise the current runtime.
  assert.equal(sha256(oldV06ValidatorSource),'8c3110caeccd48bb103800f615b5c50a90a02bdac0ee86b1742fd4acebc3475b');
  assert.equal(sha256(region(historicalEngineSource,'function sanitizeItem')),'8c3110caeccd48bb103800f615b5c50a90a02bdac0ee86b1742fd4acebc3475b','historical v3 strict validator unchanged');
  assert.equal(sha256(region(historicalEngineSource,'export const STRATEGIES','const validTick')),'92c3b09c2f4c00d71d53d4c08905bfc4ec006742454ce54aec13fcf998885a05','historical old-validator support createGame/stats/helpers unchanged');
  assert.equal(sha256(region(lootSource,'export function resolveWeaponFamily','// Safe-sale identity')),'3f1099b173e7cca96840559fcc0093887bf873444d3a26fd14e24305d3fc0959','old validator family resolver unchanged');
  assert.equal(sha256(region(lootSource,'const STAT_KEYS','/** Pure fail-closed classification')),'ec9c5e2b9d9ac3def55c71ae4359576d1c77ed538d3c6de3ad287a524aff591e','old validator strict descriptor guard unchanged');
});

test('v0.7 independent: every bought family/level item survives ACTUAL v0.6 validator then current reload unchanged',()=>{
  for(let level=1;level<=500;level++)for(const family of families){
    const s=camp(level);s.autoSell=true;const q=buy(s,family),old=jsonClone(validateOldV06(jsonClone(s))),upgraded=validateSave(old);
    for(const state of [old,upgraded]){
      assert.deepEqual(state.inventory,[q.item]);assert.deepEqual(state.equipment,validateSave(jsonClone(s)).equipment);
      assert.equal(state.hero.gold,s.hero.gold);assert.equal(state.inventory[0].locked,true);assert.equal(state.inventory[0].weaponFamily,family);
      assert.equal(state.autoSell,true);assert.equal(state._itemId,1);assert.equal(itemSalePrice(state.inventory[0]),itemSalePrice(q.item));
      assert.equal(state.mode,'town');assert.deepEqual(state.pendingLoot,[]);
    }
    assert.deepEqual(validateSave(jsonClone(upgraded)),upgraded);
  }
});

test('v0.7 independent: new commission provenance/stat/roll fields still reject in old and current strict v3 validators without mutation',()=>{
  for(const placement of ['inventory','equipment','pendingLoot'])for(const mutate of [i=>i.commission=true,i=>i.provenance={source:'shop'},i=>i.stats.future=1,i=>i.rolls.future=110,i=>i.locked='true',i=>i.rolls.attack=110.5]){
    const s=camp(),i=held('malformed');mutate(i);
    if(placement==='equipment')s.equipment.weapon=i;else s[placement]=[i];
    const before=clone(s);assert.throws(()=>validateSave(s),/不支援的裝備/);assert.throws(()=>validateOldV06(s),/不支援的裝備/);assert.deepEqual(s,before);
  }
});

test('v0.7 independent: natural ordinary expedition can fund a commission without changing seed or auto-equipping on purchase',()=>{
  const s=createGame(42);
  for(let run=0;run<30&&!previewWeaponCommission(s,'axe').available;run++){
    act(s,'start');for(let n=0;n<3000&&s.mode==='battle'&&s._phase!=='intermission';n++)advance(s,.1);
    assert.equal(s.mode,'battle','bounded ordinary stage-one run wins rather than synthetic kills');assert.equal(s._phase,'intermission');act(s,'retreat');
    for(const slot of ['weapon','armor','accessory']){const best=s.inventory.filter(i=>i.slot===slot).sort((a,b)=>b.power-a.power)[0];if(best&&best.power>s.equipment[slot].power)act(s,'equip',best.id);}
  }
  assert.ok(s.wins>1);assert.equal(previewWeaponCommission(s,'axe').available,true);const seed=s.seed,equipment=clone(s.equipment);buy(s,'axe');
  assert.equal(s.seed,seed);assert.deepEqual(s.equipment,equipment);assert.equal(s.inventory.at(-1).locked,true);
});
