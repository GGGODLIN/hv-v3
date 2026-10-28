import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommissionWeapon,createSoulboundItem} from '../src/loot.js';
const E=await import(process.env.HV_COMBAT_GOLD_AUDIT_BASELINE ? new URL(process.env.HV_COMBAT_GOLD_AUDIT_BASELINE,import.meta.url) : '../src/engine.js');
const CAP=1e12;
const enemy=(id,boss=true)=>({id,name:'獨立驗收敵人',boss,hp:1,maxHp:1,attack:0,defense:0,evade:0,parry:0,block:0,resist:0});
function bleed(s){
  for(const e of s.enemies)e.bleeding={stacks:1,expiresAtTick:s.timing.ticks+7,damagePerTick:1};
  s._clock=-10;s._enemyClock=-10;s.timing.tu=(s.timing.ticks+1)*100-.001;E.advance(s,.01);return s;
}
function normal(gold,final=true){const s=E.createGame(42);s.hero.gold=gold;E.act(s,'start');s.wave=final?4:1;s.enemies=[enemy('audit-boss')];return bleed(s);}
function iw(gold,boss=true){
 const raw=E.createGame(42);raw.hero.level=15;raw.worldSeeds=3;raw.stage=3;raw.unlocked=7;raw.wins=8;raw.hero.gold=gold;
 const s=E.validateSave(raw);s.equipment.weapon=createSoulboundItem({...createCommissionWeapon('axe',1),id:'loot-1'},15);s._itemId=1;
 const q=E.previewItemWorld(s,'loot-1');assert.equal(q.available,true,q.reason);E.act(s,'enterItemWorld',q);
 s.wave=boss?5:1;s.enemies=[enemy('audit-iw',boss)];return bleed(s);
}
function persisted(s){return E.validateSave(JSON.parse(JSON.stringify(s))).hero.gold;}
for(const [gold,earned] of [[100,46],[CAP-46,46],[CAP-10,10],[CAP,0]]){
 test(`independent bleed final credit/save roundtrip from ${gold}`,()=>{
  const s=normal(gold);assert.equal(s.kills,1);assert.equal(s.wins,1);assert.equal(s.hero.gold,gold+earned);assert.equal(persisted(s),s.hero.gold);
  assert.equal(s.logs.some(x=>x.includes('未入帳')),earned<46);
  if(earned<46){assert.ok(s.logs.some(x=>x.includes(`實收 ${earned}`)&&x.includes(`超額 ${21-earned}`)));assert.ok(s.logs.some(x=>x.includes('通關')&&x.includes('實收 0')&&x.includes('超額 25')));}
 });
}
test('independent cap leaves RNG, loot, XP and noncurrency events unchanged',()=>{
 const low=normal(0),high=normal(CAP);
 for(const key of ['seed','_itemId','kills','wins','inventory','pendingLoot','events','soulFragments','worldSeeds','unlocked'])assert.deepEqual(high[key],low[key],key);
 for(const key of ['xp','level','proficiency','attributes'])assert.deepEqual(high.hero[key],low.hero[key],key);
});
test('independent cleared enemy cannot pay twice during intermission',()=>{
 const s=normal(CAP-3),before={gold:s.hero.gold,kills:s.kills,wins:s.wins,inventory:structuredClone(s.inventory),xp:s.hero.xp};
 for(let i=0;i<20;i++)E.advance(s,.01);
 assert.deepEqual({gold:s.hero.gold,kills:s.kills,wins:s.wins,inventory:s.inventory,xp:s.hero.xp},before);
 assert.equal(s.hero.gold,CAP);
});
test('independent IW final cap still upgrades exactly once and roundtrips',()=>{
 const s=iw(CAP-3);assert.equal(s.mode,'town');assert.equal(s.hero.gold,CAP);assert.equal(persisted(s),CAP);assert.equal(s.kills,1);assert.equal(s.wins,8);assert.equal(s.worldSeeds,2);assert.equal(s.equipment.weapon.itemWorld.level,1);
 assert.ok(s.logs.some(x=>x.includes('實收 3')&&x.includes('超額 4')));
 const before=structuredClone(s);E.advance(s,2);assert.deepEqual(s,before);
});
test('independent IW quarter-floor payouts unchanged below cap',()=>{
 const boss=iw(100),ordinary=iw(100,false);assert.equal(boss.hero.gold,107);assert.equal(ordinary.hero.gold,103);assert.equal(boss.wins,8);assert.equal(ordinary.wins,8);assert.ok(!boss.logs.some(x=>x.includes('未入帳')));
});
test('independent simultaneous ordinary kills saturate without lost progression',()=>{
 const s=E.createGame(42);s.hero.gold=CAP-5;E.act(s,'start');s.enemies=[enemy('audit-a',false),enemy('audit-b',false)];bleed(s);
 assert.equal(s.kills,2);assert.equal(s.wins,0);assert.equal(s.hero.gold,CAP);assert.equal(persisted(s),CAP);assert.ok(s.logs.some(x=>x.includes('實收 5')&&x.includes('超額 1')));assert.ok(s.logs.some(x=>x.includes('實收 0')&&x.includes('超額 6')));
});
