import test from 'node:test';
import * as historicalV08 from './fixtures/v0.8/engine.js';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {createGame,act,advance,stats,validateSave,previewSafeSale,INVENTORY_LIMIT} from '../src/engine.js';
import {generateItem,resolveWeaponFamily,dominanceWitness,classifySafeLootItem} from '../src/loot.js';
import {loadVersionedSave} from '../src/session.js';

const clone=value=>JSON.parse(JSON.stringify(value));
const sha256=value=>createHash('sha256').update(value).digest('hex');
const keys=['attack','defense','hp','crit','evade','block'];
const vector={attack:20,defense:10,hp:50,crit:.1,evade:.1,block:.1};
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
function item(id,{slot='weapon',base=0,tier=0,...changes}={}) {
  let n=0;return {...generateItem(()=>[base/3+.01,tier][n++]??.99,3,slot),id,...changes};
}
function fixture() {
  const s=createGame(42);s.hero.gold=137;
  s.inventory=[item('keeper',{stats:{...vector},locked:true}),item('sale-a',{stats:{...vector,attack:19},power:13.6}),item('sale-b',{stats:{...vector,hp:49},power:0})];
  return s;
}
const durable=s=>{const copy=clone(s);delete copy.logs;return copy;};
const allItems=s=>[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];
const price=i=>Math.max(1,Math.round(i.level*3+i.power));
function freezeDeep(value){if(value&&typeof value==='object'){Object.values(value).forEach(freezeDeep);Object.freeze(value);}return value;}

// Full-state baselines captured from accepted v0.5 engine 2afaaf2ce100607b…,
// not current candidate. No field is omitted: role labels, logs, seed, clocks,
// full generated loot, proc statuses, event IDs and absent OFF flag are covered.
const historicalOffRows = [
  [42,1,null,"assault",286,"battle",1,"a9fb1a059762c67b3a5ae7ed0790dcb0c6e1a7e203a7e11c18011eb29e337a40"],
  [42,1,"axe","assault",286,"battle",1,"1c592801b044b5cf90e80b8bf071f23b1e86739f24d5408472571a1f36d8f583"],
  [42,1,"rapier","assault",255,"battle",1,"12d5b3f723c805a61ed576daf6a7b730a6fe0825f55e27228c638cca7c75742e"],
  [42,1,"club","assault",244,"battle",1,"81122ea4230239f3e3191dd0f7ecfb8d219540f3b38eaa41ad53380272244d2a"],
  [999,2,null,"sustain",381,"battle",1,"e6b737da95749bfe1c748bb050e6fdec479c5fa60445e1fa88b66a1438d33f9c"],
  [999,2,"axe","sustain",381,"battle",1,"c6ec98ab0b34beacc39b70deed3c3fa4ed0a0dc7ca95e65aa7ae94053c88e765"],
  [999,2,"rapier","sustain",370,"battle",1,"657cfe74a3ad560ee74dae87443e0ceae71bf78dc7e6e065b91f028e201314e1"],
  [999,2,"club","sustain",370,"battle",1,"3f05b278456b0393a4915ea95511390a7175a3c5979788483384f6ea6220f508"],
  [42,3,null,"balanced",496,"battle",1,"892521e17ae500b1595c74e8dbbbbaecf950279c90462e099dc7681f3cbd1a0a"],
  [42,3,"axe","balanced",496,"battle",1,"f89544ad393a9c93a51a98f6af824d540ef3a4143da56113f8d4b74edb45da50"],
  [42,3,"rapier","balanced",444,"battle",1,"af8706f59b550529e820292eb7cab12ec322f37d9fef4f952d130b621493e15b"],
  [42,3,"club","balanced",465,"battle",1,"acb6cd6ac0cce5498859328c594c069e9026a765ed0ae25f1bfa0375d4713c2c"],
  [999,4,null,"assault",413,"defeat",0,"d8cd5de27dfa9e679f244953bda374de108e8d618d05aaae423c89a2137104c3"],
  [999,4,"axe","assault",413,"defeat",0,"0c5f51f4ea4a4b2e12d9801052ecde1e298b4f9875f9dccf093d2223271d5e4f"],
  [999,4,"rapier","assault",491,"defeat",0,"75f5a961e0f233aa187be6c718b41f2b04f3adcfb66f270cd24d78d9cadbdf5c"],
  [999,4,"club","assault",499,"defeat",0,"14f9c19e116cabf8632b6813ba333138ca7e76639439c776d2f9ec5ef1ef0ad9"],
  [42,5,null,"sustain",801,"battle",1,"0caf0541a382d12184c37d7fd7235441c9fa44c9a1e95d86f6b9d11270e9bdf8"],
  [42,5,"axe","sustain",801,"battle",1,"932b429b86069690a23aa61913c72985557399b4e15517bfa1c24b1af206fc18"],
  [42,5,"rapier","sustain",717,"battle",1,"a97b211d63dd75d2c0b8b086ca26e4e5bfca6ecd4ff7e20c34b62639bdaaa534"],
  [42,5,"club","sustain",748,"battle",1,"761d5a1f265d187f275fc56094a1b0c5407d7025ec1d7dd35ae8a3c1e86eb352"],
  [42,15,null,"balanced",192,"defeat",0,"d3bf634ae70e6b3dfc3dc516a2a72b40942f341c33c8932e44fa31137e279ee4"],
  [42,15,"axe","balanced",192,"defeat",0,"9e8af0844aff8eef856d59a6d449c077af2600e862f75b4e7e4c940e9f27a754"],
  [42,15,"rapier","balanced",154,"defeat",0,"c559f31cf58596e0d8c07f7822d94a0c5ac83bddedb169d407ab545a8a64f773"],
  [42,15,"club","balanced",268,"defeat",0,"eed42e01f7654533ce802b398f266fc3c07fb3c551c27419b1a97515c3833c45"],
  [999,30,null,"balanced",21,"defeat",0,"afa14faf7285a8d01e436c261e248cd1caa54244c33e91a7014ab6312872b655"],
  [999,30,"axe","balanced",21,"defeat",0,"7f94549dfa24989055818850a5eddef963ee1fdcb3b9ef852914880aa64aa68c"],
  [999,30,"rapier","balanced",21,"defeat",0,"11ac78fe4b07903b592dd79b8d08c9a742503b147fc368430a9dd210edd03990"],
  [999,30,"club","balanced",21,"defeat",0,"a8ae34e952822a5fa43b57875d5e1bec253a50213ebacf6e4168cef3d34de24f"],
];
// Seven pre-bleed axe signatures are historical evidence, not v0.8 promises.
// Keep original data verbatim. Every non-axe digest remains executable against
// frozen v0.8 only: corrected v0.8.1 cannot preserve an old floating-clock hash.
const archivedAxeOffRows=historicalOffRows.filter(row=>row[2]==='axe');
const offRows=historicalOffRows.filter(row=>row[2]!=='axe');
assert.equal(archivedAxeOffRows.length,7);assert.equal(offRows.length,21);
for(const [seed,stage,family,strategy,frames,mode,wins,digest] of offRows) {
  test(`historical v0.5–v0.8 OFF trajectory on frozen v0.8: stage ${stage}, ${family??'none'}, ${strategy}`,()=>{
    const s=historicalV08.createGame(seed);s.unlocked=stage;s.stage=stage;s.equipment.weapon.weaponFamily=family;s.strategy=strategy;
    assert.equal(Object.hasOwn(s,'autoSell'),false);
    const hash=createHash('sha256');let count=0;const record=()=>{hash.update(JSON.stringify(canonical(s))+'\n');count++;};
    record();historicalV08.act(s,'start');record();
    for(let n=0;n<10000&&s.mode==='battle'&&!s.wins;n++){historicalV08.advance(s,.1);record();}
    assert.equal(count,frames);assert.equal(s.mode,mode);assert.equal(s.wins,wins);assert.equal(hash.digest('hex'),digest);
  });
}

test('v0.6 independent: 270 complete generated items, RNG counts and final RNG states match accepted v0.5',()=>{
  const hash=createHash('sha256');let count=0;
  for(const slot of ['weapon','armor','accessory'])for(const level of [1,3,30])for(let seed=1;seed<=30;seed++){
    let state=seed,calls=0;const rng=()=>{calls++;state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    hash.update(JSON.stringify([generateItem(rng,level,slot),calls,state])+'\n');count++;
  }
  assert.equal(count,270);assert.equal(hash.digest('hex'),'fd35840a9b86a90f51bdaaf797677fc023d4d316d86960218072f230fa45a6bd');
});

test('v0.6 independent: every stat is componentwise, not score, level, power, or tier heuristic',()=>{
  const keeper=item('keeper',{stats:{...vector},locked:true,power:0,level:1});
  assert.equal(dominanceWitness(item('equal',{stats:{...vector}}),[keeper]),null);
  for(const lower of keys){
    const candidate=item('candidate',{stats:{...vector,[lower]:vector[lower]/2},power:1000000,level:1000});
    assert.deepEqual(dominanceWitness(candidate,[keeper]),{keeperId:'keeper',strictlyBetterKeys:[lower]});
    for(const higher of keys.filter(key=>key!==lower)){
      candidate.stats[higher]=vector[higher]*1.5;
      assert.equal(dominanceWitness(candidate,[keeper]),null,`${lower} loss cannot compensate ${higher} gain`);
      candidate.stats[higher]=vector[higher];
    }
  }
  const a=item('a',{stats:{attack:1}}),b=item('b',{stats:{attack:2,hp:0},locked:true});
  assert.deepEqual(dominanceWitness(a,[b]),{keeperId:'b',strictlyBetterKeys:['attack']});
  a.stats.hp=.0001;assert.equal(dominanceWitness(a,[b]),null,'missing stats are zero, not ignored');
});

test('v0.6 independent: all nine bases and three low tiers match only same-base protected keepers',()=>{
  for(const slot of ['weapon','armor','accessory'])for(let base=0;base<3;base++)for(const tier of [0,.03,.1]){
    const s=createGame(),candidate=item('candidate',{slot,base,tier,stats:{...vector,attack:19}}),keeper=item('keeper',{slot,base,tier:.5,stats:{...vector},locked:true});
    assert.ok(classifySafeLootItem(candidate));assert.ok(classifySafeLootItem(keeper));
    s.inventory=[keeper,candidate];assert.deepEqual(previewSafeSale(s).items.map(i=>i.id),['candidate']);
    for(const otherSlot of ['weapon','armor','accessory'])for(let otherBase=0;otherBase<3;otherBase++){
      if(slot===otherSlot&&base===otherBase)continue;
      s.inventory[0]=item('other',{slot:otherSlot,base:otherBase,stats:{...vector,attack:100},locked:true});
      assert.equal(previewSafeSale(s).items.length,0,`${slot}/${base} cannot use ${otherSlot}/${otherBase}`);
    }
  }
});

test('v0.6 independent: equality, all higher tiers, protected and unknown identities never become candidates or witnesses',()=>{
  const s=fixture();
  s.inventory.push(item('equal',{stats:{...vector}}),item('locked',{locked:true,stats:{attack:0}}));
  for(const [n,tier] of [.5,.8,.95,.99,.9999].entries())s.inventory.push(item(`high-${n}`,{tier,stats:{attack:0}}));
  for(const [n,change] of [{name:'未知暮鋼戰斧'},{weaponFamily:null},{weaponFamily:'future'},{name:'普通・逐風刺劍',weaponFamily:'axe'},{slot:'armor'},{futureProc:1},{stats:{attack:1,penetration:.1}},{rolls:{attack:1,future:2}}].entries())s.inventory.push(item(`unknown-${n}`,change));
  assert.deepEqual(previewSafeSale(s).items.map(i=>i.id),['sale-a','sale-b']);
  for(const change of [{name:'未知暮鋼戰斧'},{weaponFamily:null},{weaponFamily:'future'},{futureProc:1},{stats:{...vector,future:.1}},{rolls:{attack:1,future:2}}]){
    const bad=fixture();Object.assign(bad.inventory[0],change);assert.equal(previewSafeSale(bad).items.length,0);
  }
});

test('v0.6 independent: only equipped or explicitly locked inventory authorizes; unlocked/pending candidates cannot authorize each other',()=>{
  const s=fixture();s.inventory[0].locked=false;
  assert.equal(previewSafeSale(s).items.length,0);
  s.pendingLoot=[item('pending-keeper',{stats:{...vector},locked:true})];assert.equal(previewSafeSale(s).items.length,0);
  s.equipment.weapon=s.inventory.shift();assert.equal(s.equipment.weapon.locked,false);
  assert.deepEqual(previewSafeSale(s).items.map(i=>i.id),['sale-a','sale-b']);
  assert.ok(!previewSafeSale(s).items.some(i=>i.id===s.equipment.weapon.id));
  for(const owner of ['equipment','inventory','pendingLoot']){
    const bad=fixture();if(owner==='equipment')bad.equipment.weapon=clone(bad.inventory[1]);else bad[owner].push(clone(bad.inventory[1]));
    assert.deepEqual(previewSafeSale(bad),{items:[],total:0},'duplicate live identity invalidates the whole set');
  }
});

test('v0.6 independent: exact-ID preview is pure on frozen state and cannot be mutated into authorization',()=>{
  const s=freezeDeep(fixture()),before=clone(s),random=Math.random;Math.random=()=>{throw Error('preview RNG');};
  try{
    const p=previewSafeSale(s);assert.deepEqual(p.items.map(i=>i.id),['sale-a','sale-b']);
    assert.equal(p.total,23+9);assert.deepEqual(p.items.map(i=>i.value),[23,9]);
    p.items[0].strictlyBetterKeys.push('fake');p.items[0].id='keeper';p.items.length=0;p.total=Infinity;
    assert.deepEqual(s,before);assert.equal(previewSafeSale(s).total,32);
  }finally{Math.random=random;}
});

test('v0.6 independent: exact sets sell once, price is existing formula, pending entrants never join the batch',()=>{
  const s=fixture();s.pendingLoot=[item('pending',{stats:{attack:1}})];const before=durable(s),p=previewSafeSale(s);
  act(s,'sellSafe',{ids:p.items.map(i=>i.id).reverse()});
  assert.equal(s.hero.gold,before.hero.gold+32);assert.deepEqual(s.inventory.map(i=>i.id),['keeper','pending']);assert.equal(s.pendingLoot.length,0);
  assert.deepEqual(s.equipment,before.equipment);assert.equal(s.seed,before.seed);assert.equal(s._itemId,before._itemId);
  const after=durable(s);for(let n=0;n<5;n++)act(s,'sellSafe',{ids:['sale-a','sale-b']});assert.deepEqual(durable(s),after);
  const subset=fixture();act(subset,'sellSafe',{ids:['sale-b']});assert.equal(subset.hero.gold,146);assert.ok(subset.inventory.some(i=>i.id==='sale-a'));
});

test('v0.6 independent: every stale/invalid member aborts the whole set, including a valid member listed first',()=>{
  const mutations=[
    s=>act(s,'lock','sale-b'),s=>act(s,'equip','sale-b'),s=>act(s,'lock','keeper'),
    s=>s.inventory.splice(2,1),s=>s.inventory[2].stats.crit=.2,s=>s.inventory[2].futureProc=true,
    s=>s.inventory[0].stats.attack=0,s=>s.inventory[0].weaponFamily=null,s=>s.inventory[0].futureProc=true,
    s=>{s.equipment.weapon=s.inventory.shift();s.inventory.push(s.equipment.weapon);},
    s=>s.mode='battle',s=>s.mode='defeat',
  ];
  for(const mutate of mutations){const s=fixture(),ids=previewSafeSale(s).items.map(i=>i.id);mutate(s);const before=durable(s);act(s,'sellSafe',{ids});assert.deepEqual(durable(s),before);}
  for(const ids of [[],['sale-a','missing'],['sale-a','sale-a'],['sale-a','keeper'],['sale-a',null],['sale-a',1],Array(121).fill('sale-a')]){
    const s=fixture(),before=durable(s);act(s,'sellSafe',{ids});assert.deepEqual(durable(s),before);
  }
});

test('v0.6 independent: optional strict-true auto flag never sweeps existing/pending, persists true and downgrades OFF',()=>{
  const s=fixture();s.pendingLoot=[item('pending',{stats:{attack:1}})];const before=durable(s);
  assert.equal(Object.hasOwn(s,'autoSell'),false);
  for(const invalid of [undefined,null,0,1,'true',{},[],new Boolean(true)]){act(s,'setAutoSell',invalid);assert.deepEqual(durable(s),before);}
  act(s,'setAutoSell',true);assert.equal(s.autoSell,true);const withoutFlag=durable(s);delete withoutFlag.autoSell;assert.deepEqual(withoutFlag,before);
  const loaded=validateSave(clone(s));assert.equal(loaded.autoSell,true);assert.equal(loaded.mode,'town');assert.deepEqual(loaded.inventory,s.inventory);assert.deepEqual(loaded.pendingLoot,s.pendingLoot);
  act(s,'setAutoSell',false);assert.equal(Object.hasOwn(s,'autoSell'),false);assert.deepEqual(durable(s),before);
  for(const value of [undefined,null,false,1,'true',{},[]]){const raw=fixture();raw.autoSell=value;assert.equal(Object.hasOwn(validateSave(raw),'autoSell'),false);}
});

function strongKeepers(){return ['weapon','armor','accessory'].flatMap(slot=>[0,1,2].map(base=>item(`keeper-${slot}-${base}`,{slot,base,locked:true,stats:{attack:1000,defense:1000,hp:1000,crit:1,evade:1,block:1}})));}
function forceDrop(seed,{auto=false,first=true,overflow=false}={}){
  const s=createGame(seed);s.inventory=strongKeepers();s.wins=first?0:1;if(auto)act(s,'setAutoSell',true);act(s,'start');
  s.wave=4;s._clock=1.04;s._enemyClock=0;
  s.enemies=[{id:'qa-final',name:'測試結算',boss:true,hp:1,maxHp:1,attack:0,defense:0,evade:0,parry:0,block:0,resist:0}];
  if(overflow)while(s.inventory.length<INVENTORY_LIMIT)s.inventory.push(item(`old-${s.inventory.length}`,{name:'保留未知裝備',locked:true}));
  return s;
}
test('v0.6 independent: auto routing follows unchanged RNG/unique-ID path; first-clear weapon and later slots are preserved or exactly credited',()=>{
  let sold=0,kept=0;const slots=new Set();
  for(const first of [true,false])for(let seed=1;seed<=120;seed++){
    const off=forceDrop(seed,{first}),on=forceDrop(seed,{first,auto:true});
    off._itemId=999999999;on._itemId=999999999;off.inventory[0].id='loot-1';on.inventory[0].id='loot-1';
    const oldItems=clone(on.inventory);advance(off,.02);advance(on,.02);
    const drop=off.inventory.at(-1);assert.equal(drop.id,'loot-2');if(first)assert.equal(drop.slot,'weapon');slots.add(drop.slot);
    assert.equal(on.seed,off.seed);assert.equal(on._itemId,2);assert.equal(on._eventId,off._eventId);assert.deepEqual(on.timing,off.timing);assert.deepEqual(on.battle,off.battle);
    assert.deepEqual({...on.hero,gold:0},{...off.hero,gold:0});assert.deepEqual(on.inventory.slice(0,oldItems.length),oldItems,'old inventory never swept');
    const expected=['Crude','Fair','Average'].includes(drop.quality);
    if(expected){sold++;assert.equal(on.inventory.length,oldItems.length);assert.equal(on.hero.gold,off.hero.gold+price(drop));assert.ok(on.events.some(e=>e.type==='loot'&&e.target===drop.id&&e.value===price(drop)));}
    else{kept++;assert.deepEqual(on.inventory,off.inventory);assert.equal(on.hero.gold,off.hero.gold);}
    const normalized=clone(on);delete normalized.autoSell;
    normalized.logs=normalized.logs.filter(log=>!log.startsWith('已開啟安全自動出售：'));
    if(expected){
      normalized.hero.gold-=price(drop);normalized.inventory.push(clone(drop));
      normalized.events=normalized.events.map(e=>e.type==='loot'&&e.target===drop.id?off.events.find(old=>old.id===e.id):e);
      normalized.logs=normalized.logs.map(log=>log.startsWith('自動出售：')?`戰利品：${drop.name}`:log.replace(`保底裝備已自動出售 +${price(drop)} 金幣。`,'保底裝備已入背包。'));
    }
    assert.deepEqual(normalized,off,'only explicit opt-in log/flag and exact routed sale may differ');
  }
  assert.ok(sold>50&&kept>50);assert.deepEqual([...slots].sort(),['accessory','armor','weapon']);
});

test('v0.6 independent: auto filter cannot bypass start reserve, pending guard, cap or safe overflow return',()=>{
  for(const count of [116,120]){const s=fixture();s.inventory=Array.from({length:count},(_,i)=>item(`old-${i}`));act(s,'setAutoSell',true);const before=durable(s);act(s,'start');assert.equal(s.mode,'town');assert.deepEqual(durable(s),before);}
  const pending=fixture();pending.pendingLoot=[item('pending')];act(pending,'setAutoSell',true);const before=durable(pending);act(pending,'start');assert.deepEqual(durable(pending),before);
  let preserved=0;
  for(let seed=1;seed<=20;seed++){
    const s=forceDrop(seed,{auto:true,overflow:true});s.inventory[0].name='未識別戰斧';advance(s,.02);
    assert.equal(s.inventory.length,120);assert.equal(s.mode,'town');
    for(const drop of s.pendingLoot){preserved++;assert.ok(drop.id.startsWith('loot-'));assert.ok(allItems(s).includes(drop));}
  }
  assert.ok(preserved>0);
});

test('v0.6 independent: unsupported item/stat/roll schema rejects atomically at all three save locations',()=>{
  const variants=[
    i=>i.futureProc={chance:1},i=>i.stats.futureDefense=.1,i=>i.rolls={...i.rolls,futureAttack:1},
    i=>i.stats=[],i=>i.stats=null,i=>i.stats='attack',i=>i.rolls=[],i=>i.rolls=null,i=>i.rolls=4,
    i=>i.stats.attack='20',i=>i.stats.attack=-1,i=>i.stats.attack=Infinity,
    i=>i.rolls={attack:'50'},i=>i.rolls={attack:200.1},i=>i.rolls={attack:201},i=>i.rolls={attack:-1},
    i=>{i.stats={attack:1};i.rolls={hp:1};},i=>i.prefix={},i=>i.suffix=[],
    i=>i.locked='true',i=>i.locked={},i=>i.level='3',i=>i.level=[],i=>i.power=NaN,i=>i.power={},
    i=>i.roll=Infinity,i=>i.roll={},i=>i.name=[],i=>i.description={},i=>i.rarityColor=[],
  ];
  for(const location of ['equipment','inventory','pendingLoot'])for(const mutate of variants){
    const s=fixture();s.autoSell=true;
    const record=location==='equipment'?s.equipment.weapon:location==='inventory'?s.inventory[1]:(s.pendingLoot=[item('pending')])[0];
    mutate(record);const before=structuredClone(s);assert.throws(()=>validateSave(s));assert.deepEqual(s,before);
  }
  for(const slot of ['armor','accessory'])for(const family of [null,'axe','future']){
    const s=fixture();s.equipment[slot].weaponFamily=family;const before=clone(s);assert.throws(()=>validateSave(s));assert.deepEqual(s,before);
  }
});

test('v0.6 independent: rejected current/legacy saved bytes stay untouched; corrupt newer save never silently downgrades',()=>{
  const raw=fixture();raw.inventory[0].futureProc=true;const bad=JSON.stringify(raw),good=JSON.stringify(createGame(9));
  for(const entries of [[['v3',bad],['v2',good]],[['v2',bad],['v1',good]]]){
    const store=new Map(entries),before=[...store],reads=[];
    const loaded=loadVersionedSave({read:key=>{reads.push(key);return store.get(key)??null;},currentKey:'v3',legacyKeys:['v2','v1'],validate:validateSave,create:()=>createGame(1)});
    assert.equal(loaded.error,true);assert.equal(loaded.migrated,false);assert.equal(loaded.raw,store.get('v3')??null);assert.deepEqual([...store],before);
    assert.ok(!reads.includes(entries[1][0]),'invalid newer bytes block older fallback');
  }
});

// Exact accepted v0.5 sanitizer/validator text, retained solely for real downgrade
// execution (rather than simulating old behavior by deleting autoSell ourselves).
const legacyValidatorSource = String.raw`function sanitizeItem(raw, expectedSlot) {
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
  s.equipment=Object.fromEntries(SLOTS.map(slot=>[slot,sanitizeItem(input.equipment[slot],slot)]));
  s.inventory=input.inventory.map(i=>sanitizeItem(i));
  if(input.pendingLoot!==undefined&&(!Array.isArray(input.pendingLoot)||input.pendingLoot.length>8))throw new Error('待領戰利品資料無效');
  s.pendingLoot=(input.pendingLoot||[]).map(i=>sanitizeItem(i));
  const items=[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];if(new Set(items.map(i=>i.id)).size!==items.length)throw new Error('重複裝備識別碼');
  s._itemId=Math.max(integer(input._itemId,0,1e9),...items.map(i=>/^loot-\d+$/.test(i.id)?Number(i.id.slice(5)):0));
  s.unlocked=integer(input.unlocked,1,MAX_STAGE);s.stage=integer(input.stage,1,s.unlocked);s.kills=integer(input.kills,0,1e9);s.wins=integer(input.wins,0,1e9);s.autoAdvance=input.autoAdvance===true;s.strategy=validStrategy(input.strategy)?input.strategy:'balanced';s.battle.cleared=s.wins;
  for(let n=1;n<=MAX_STAGE;n++){const t=input.battle?.bestTimes?.[n];if(typeof t==='number'&&Number.isFinite(t)&&t>0&&t<1e6)s.battle.bestTimes[n]=t;}
  recover(s);log(s,'存檔已讀取，安全回營；不計離線戰鬥收益。');return s;
}
`;
const validateOldV05=runInNewContext(`
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
${legacyValidatorSource.replace('export function validateSave','function validateSave')}
validateSave;`,{createGame,stats,resolveWeaponFamily});

test('v0.6 independent: real v0.5 downgrade drops opt-in only, then upgrade stays OFF and preserves ordinary items/gold/locks',()=>{
  assert.equal(sha256(legacyValidatorSource),'158ebd12a17bd231a586667d5cb4333bb1d46ad9e25b0b7f17221049a9199064');
  for(const family of [null,'axe','rapier','club','future']){
    const raw=fixture();raw.autoSell=true;raw.equipment.weapon.weaponFamily=family;raw.pendingLoot=[item('pending',{locked:true})];
    const v6=validateSave(clone(raw)),v5=clone(validateOldV05(clone(v6)));assert.equal(Object.hasOwn(v5,'autoSell'),false);
    for(const key of ['inventory','equipment','pendingLoot'])assert.deepEqual(v5[key],v6[key]);assert.equal(v5.hero.gold,v6.hero.gold);
    const upgraded=validateSave(v5);assert.equal(Object.hasOwn(upgraded,'autoSell'),false);
    for(const key of ['inventory','equipment','pendingLoot'])assert.deepEqual(upgraded[key],v6[key]);assert.equal(upgraded.hero.gold,v6.hero.gold);
    assert.deepEqual(validateSave(clone(upgraded)),upgraded);
  }
});

test('v0.6 independent: supported unknown names/family sentinel stay loaded, unlocked and ineligible through downgrade/upgrade',()=>{
  const s=fixture();s.inventory.push(item('name',{name:'自訂未知裝備'}),item('family',{weaponFamily:'unsupported'}));
  const restored=validateSave(clone(s));assert.equal(restored.inventory.find(i=>i.id==='family').weaponFamily,null);
  for(const state of [restored,validateSave(clone(validateOldV05(clone(restored))))]){
    for(const id of ['name','family']){assert.equal(state.inventory.find(i=>i.id===id).locked,false);assert.ok(!previewSafeSale(state).items.some(i=>i.id===id));}
    assert.equal(state.inventory.find(i=>i.id==='family').weaponFamily,null,'never revive family by reparsing name');
  }
});


test('v0.6 independent: item accessors, own prototype keys, symbols and inherited metadata fail closed before evaluation',()=>{
  let calls=0;
  for(const inject of [
    i=>Object.defineProperty(i,'future',{get(){calls++;throw Error('must not read');},enumerable:true}),
    i=>Object.defineProperty(i,'stats',{get(){calls++;throw Error('must not read');},enumerable:true}),
    i=>Object.defineProperty(i,'locked',{get(){calls++;throw Error('must not read');},enumerable:true}),
    i=>Object.defineProperty(i,'__proto__',{value:{future:true},enumerable:true}),
    i=>i[Symbol('future')]=1,
    i=>Object.setPrototypeOf(i,{future:true}),
    i=>Object.setPrototypeOf(i.stats,{future:true}),
  ]){
    const s=fixture();inject(s.inventory[0]);assert.equal(previewSafeSale(s).items.length,0);assert.throws(()=>validateSave(s));
  }
  assert.equal(calls,0);
});

test('v0.6 independent: 270 ordinary known v0.5 generated exports import with same items, prices and lock bits',()=>{
  for(const slot of ['weapon','armor','accessory'])for(const level of [1,3,30])for(let seed=1;seed<=30;seed++){
    let state=seed;const rng=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    const s=createGame(seed),drop=generateItem(rng,level,slot);drop.id='loot-1';drop.locked=seed%2===0;s.inventory=[drop];s.hero.gold=seed*137;
    const old=clone(validateOldV05(clone(s))),loaded=validateSave(clone(old));
    assert.deepEqual(loaded.inventory,old.inventory);assert.deepEqual(loaded.equipment,old.equipment);assert.equal(loaded.hero.gold,old.hero.gold);
    assert.equal(price(loaded.inventory[0]),price(drop));assert.equal(Object.hasOwn(loaded,'autoSell'),false);
  }
});
