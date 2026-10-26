import test from 'node:test';
import assert from 'node:assert/strict';
import {COMMISSION_WEAPON_SUFFIXES,createCommissionWeapon,itemSalePrice} from '../src/loot.js';
import {createGame,previewWeaponCommission,act} from '../src/engine.js';
const clone=x=>JSON.parse(JSON.stringify(x));
const ready=()=>{const s=createGame(42);s.wins=1;s.hero.gold=100000;return s;};
const request=o=>({family:o.family,suffix:o.suffix,quoteBasis:o.quoteBasis});
const economic=s=>{const c=clone(s);delete c.logs;return c;};
const reject=(s,p)=>{const before=economic(s);act(s,'commissionWeapon',p);assert.deepEqual(economic(s),before);};
const pairs={axe:['slaughter'],rapier:['slaughter','balance','nimble'],club:['slaughter','balance']};
const endpoints={axe:{attack:[350,701],slaughter:[470,888]},rapier:{attack:[150,461],slaughter:[230,601],balance:[342,991]},club:{attack:[250,621],slaughter:[353,792],balance:[344,991]}};
const q=(110/200)**1.52;
const interpol=(a,scale,level,rate)=>{const v=(a[0]+(a[1]-a[0])*q)*scale*(1+level/(rate?2000:50/3));return rate?Math.round(v*10000)/10000:Math.round(v);};

test('legal commission catalog is deeply frozen and lists only supported base affixes',()=>{
 assert.ok(Object.isFrozen(COMMISSION_WEAPON_SUFFIXES));
 for(const [family,suffixes] of Object.entries(pairs)){
  assert.ok(Object.isFrozen(COMMISSION_WEAPON_SUFFIXES[family]));
  assert.deepEqual(COMMISSION_WEAPON_SUFFIXES[family].map(c=>c.suffix),suffixes);
  for(const c of COMMISSION_WEAPON_SUFFIXES[family])assert.ok(Object.isFrozen(c));
 }
});
test('all six legal pairs at levels 1–500 retain exact R110 endpoints, prices, ordinary schema and default Slaughter',()=>{
 for(let level=1;level<=500;level++)for(const [family,suffixes] of Object.entries(pairs)){
  assert.deepEqual(createCommissionWeapon(family,level),createCommissionWeapon(family,level,'slaughter'));
  for(const suffix of suffixes){
   const item=createCommissionWeapon(family,level,suffix),base=endpoints[family];
   assert.equal(item.stats.attack,interpol(base[suffix==='slaughter'?'slaughter':'attack'],.0854,level,false));
   if(family!=='axe')assert.equal(item.stats.crit,interpol(suffix==='balance'?base.balance:[124,511],.0105/100,level,true));
   if(family==='rapier')assert.equal(item.stats.parry,interpol(suffix==='nimble'?[137,301]:[75,211],.0894,level,true));
   assert.equal(item.quality,'Superior');assert.equal(item.prefix,'');assert.equal(item.locked,true);
   assert.ok(Object.values(item.rolls).every(r=>r===110));
   const s=ready();s.hero.level=level;const o=previewWeaponCommission(s,family,suffix);
   assert.equal(o.price,Math.max(250,4*itemSalePrice(item)));assert.equal(o.suffix,suffix);
   assert.deepEqual(o.item,{...item,id:'loot-1'});
  }
 }
});
test('affix tradeoffs are real: Balance gives critical chance and Nimble parry, each forgoing Slaughter attack',()=>{
 for(const family of ['rapier','club']){
  const slaughter=createCommissionWeapon(family,7),balance=createCommissionWeapon(family,7,'balance');
  assert.ok(balance.stats.attack<slaughter.stats.attack);assert.ok(balance.stats.crit>slaughter.stats.crit);
 }
 const nimble=createCommissionWeapon('rapier',7,'nimble'),slaughter=createCommissionWeapon('rapier',7);
 assert.ok(nimble.stats.attack<slaughter.stats.attack);assert.ok(nimble.stats.parry>slaughter.stats.parry);assert.equal(nimble.stats.crit,slaughter.stats.crit);
});
test('strict suffix eligibility rejects invalid choices and accessor payload without executing getter',()=>{
 for(const family of Object.keys(pairs))for(const suffix of ['slaughter','balance','nimble','__proto__','constructor',null,1,{},[]]){
  if(pairs[family].includes(suffix))continue;
  assert.equal(createCommissionWeapon(family,7,suffix),null);
  const s=ready();assert.equal(previewWeaponCommission(s,family,suffix).available,false);
  reject(s,{family,suffix,quoteBasis:previewWeaponCommission(s,family).quoteBasis});
 }
 const s=ready(),o=previewWeaponCommission(s,'rapier','nimble');let calls=0;
 reject(s,{family:'rapier',get suffix(){calls++;return 'nimble';},quoteBasis:o.quoteBasis});assert.equal(calls,0);
 reject(s,{...request(o),suffix:undefined});reject(s,{...request(o),item:o.item});reject(s,{...request(o),[Symbol('x')]:1});
});
test('each legal purchase binds suffix, item, price and live IDs; replay/stale/family substitution fail atomically',()=>{
 for(const [family,suffixes] of Object.entries(pairs))for(const suffix of suffixes){
  const s=ready(),o=previewWeaponCommission(s,family,suffix),before=clone(s),p=request(o);
  const original=Math.random;Math.random=()=>{throw Error('no RNG');};
  try{act(s,'commissionWeapon',p);}finally{Math.random=original;}
  assert.equal(s.hero.gold,before.hero.gold-o.price);assert.deepEqual(s.inventory.at(-1),o.item);
  assert.deepEqual(s.equipment,before.equipment);assert.equal(s.seed,before.seed);reject(s,p);
  const changed=ready(),offer=previewWeaponCommission(changed,family,suffix);
  changed.inventory.push({...createCommissionWeapon('axe',1),id:'external-id'});reject(changed,request(offer));
  for(const mutate of [t=>t.hero.level++,t=>t.hero.gold++,t=>t.equipment.weapon.stats.attack++]){
   const t=ready(),v=previewWeaponCommission(t,family,suffix);mutate(t);reject(t,request(v));
  }
  reject(ready(),{...p,family:family==='axe'?'club':'axe'});
  if(suffix!=='slaughter')reject(ready(),{family,quoteBasis:o.quoteBasis});
 }
});
test('legacy two-field requests still buy exactly the default Slaughter item',()=>{
 for(const family of Object.keys(pairs)){const s=ready(),o=previewWeaponCommission(s,family);act(s,'commissionWeapon',{family,quoteBasis:o.quoteBasis});assert.deepEqual(s.inventory.at(-1),o.item);}
});
test('maximum-length valid IDs remain purchasable and duplicate live IDs fail closed',()=>{
 const s=ready();for(let i=0;i<114;i++)s.inventory.push({...createCommissionWeapon('axe',1),id:`${i}`.padEnd(100,'\\')});
 const o=previewWeaponCommission(s,'rapier','nimble');assert.equal(o.available,true);assert.ok(o.quoteBasis.length>8192);
 act(s,'commissionWeapon',request(o));assert.equal(s.inventory.length,115);assert.equal(s.hero.gold,o.goldAfter);
 const duplicate=ready();duplicate.inventory.push({...createCommissionWeapon('axe',1),id:duplicate.equipment.weapon.id});
 assert.equal(previewWeaponCommission(duplicate,'rapier','balance').available,false);
 reject(duplicate,{family:'rapier',suffix:'balance',quoteBasis:o.quoteBasis});
});
test('tampering with quote item, suffix or price cannot authorize a different purchase',()=>{
 const s=ready(),o=previewWeaponCommission(s,'rapier','nimble');
 for(const edit of [q=>q[1]='balance',q=>q[5].stats.attack=999999,q=>q[6]=0]){
  const q=JSON.parse(o.quoteBasis);edit(q);reject(s,{...request(o),quoteBasis:JSON.stringify(q)});
 }
 reject(s,{...request(o),suffix:'balance'});
});
