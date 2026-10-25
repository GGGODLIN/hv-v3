import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,advance,act,stats,resolveAttack,validateSave,cumulativeXp,INVENTORY_LIMIT} from '../src/engine.js';
const seq = values => {let i=0;return ()=>values[i++]??.99;};
const atk={attack:100,crit:0};
const empty={};
const fullTrace=['Whiff','Absorb','Evade','Parry','Block','Resist','MultiCrit','Mitigation','DamageRoll'];
const clone = s=>JSON.parse(JSON.stringify(s));
function until(s, predicate, max=5000){for(let i=0;i<max&&!predicate(s);i++)advance(s,.1);return s;}

test('original character pools, logarithmic ADB, and XP increments',()=>{
 const s=createGame(1),p=stats(s); assert.equal(p.maxHp,575); assert.equal(p.maxMp,19);assert.equal(p.attack,36.95);
 assert.equal(cumulativeXp(2),99);assert.equal(cumulativeXp(3)-cumulativeXp(2),69);
 assert.equal(s.hero.xpNext,99);
});
test('ordinary zero probability attack has no hidden hit gate',()=>{
 const r=resolveAttack(atk,empty,()=>0);assert.equal(r.damage,80);assert.deepEqual(r.trace,fullTrace);
});
test('Whiff applies only when explicitly eligible chance exists',()=>{
 const r=resolveAttack({...atk,whiff:.1},empty,()=>0);assert.equal(r.outcome,'whiff');assert.deepEqual(r.trace,['Whiff']);
});
test('physical attacks cannot be absorbed by ward',()=>{
 assert.ok(resolveAttack(atk,{absorb:1},()=>.5).damage>0);
});
test('noncritical magic may be absorbed, critical magic is not',()=>{
 assert.equal(resolveAttack({...atk,magical:true},{absorb:1},()=>.5).outcome,'absorb');
 const r=resolveAttack({...atk,magical:true,crit:1,multiCrit:0},{absorb:1},()=>.5);assert.equal(r.crit,1);assert.equal(r.damage,150);
});
for(const gate of ['evade','parry','block'])test(`${gate} two successes fully avoid`,()=>{
 const r=resolveAttack(atk,{[gate]:1},()=>.5);assert.equal(r.damage,0);assert.equal(r.outcome,gate);
});
test('partial evade has half damage and suppresses critical',()=>{
 const r=resolveAttack({...atk,crit:1},{evade:.5},seq([.1,.9,.9,.9,.9,.9,.5]));assert.equal(r.damage,50);assert.equal(r.crit,0);
});
test('partial avoidances multiply',()=>{
 const r=resolveAttack(atk,{evade:.5,parry:.5},seq([.1,.9,.1,.9,.9,.9,.5]));assert.equal(r.damage,25);
});
test('weapon skill bypasses evade and parry, not block',()=>{
 const r=resolveAttack({...atk,skill:true},{evade:1,parry:1},()=>.5);assert.equal(r.damage,100);
 assert.equal(resolveAttack({...atk,skill:true},{block:1},()=>.5).damage,0);
});
test('magic and stun bypass physical parry',()=>{
 assert.ok(resolveAttack({...atk,magical:true},{parry:1},()=>.5).damage>0);
 assert.ok(resolveAttack(atk,{parry:1,stunned:true},()=>.5).damage>0);
});
test('three magic resists retain 10 percent damage; physical unaffected',()=>{
 assert.equal(resolveAttack({...atk,magical:true},{resist:1},()=>.5).damage,10);
 assert.equal(resolveAttack(atk,{resist:1},()=>.5).damage,100);
 assert.equal(resolveAttack({...atk,magical:true,channeling:true},{resist:1},()=>.5).damage,100);
});
test('multi critical caps at nine and adds .5 per tier',()=>{
 const r=resolveAttack({...atk,crit:1,multiCrit:1},empty,()=>0);assert.equal(r.crit,9);assert.equal(r.damage,440);
});
test('weaken disables criticals',()=>assert.equal(resolveAttack({...atk,crit:1,weakened:true},empty,()=>0).crit,0));
test('mitigation multiplies and Void bypasses specific only',()=>{
 assert.equal(resolveAttack(atk,{mitigation:.5,specificMit:.5},()=>.5).damage,25);
 assert.equal(resolveAttack({...atk,void:true},{mitigation:.5,specificMit:.5},()=>.5).damage,50);
});
test('final dice spans exactly 41 discrete factors with floor',()=>{
 const results=new Set();for(let n=0;n<41;n++) {const r=resolveAttack(atk,{},seq([.99,.99,.99,.99,.99,.99,.99,(n+.1)/41]));results.add(r.damage);}
 assert.equal(results.size,41);assert.equal(Math.min(...results),80);assert.equal(Math.max(...results),120);
 assert.equal(resolveAttack({attack:0},{},()=>.5).damage,0);
});
test('first seeded clear gives progression, weapon, and unlocked stage',()=>{
 const s=createGame(1);act(s,'start');until(s,x=>x.wins===1||x.mode==='defeat');assert.equal(s.wins,1);
 assert.ok(s.battle.elapsed>20&&s.battle.elapsed<65);assert.ok(s.hero.level>1);assert.equal(s.unlocked,2);assert.ok(s.inventory.some(i=>i.slot==='weapon'));
 assert.ok(s.hero.gold>0);assert.ok(s.timing.turns>0&&s.timing.ticks>0);
});
test('equipping a drop improves attack and same-stage clear speed',()=>{
 const s=createGame(1);act(s,'start');until(s,x=>x.wins===1);const first=s.battle.elapsed;
 act(s,'retreat');const best=s.inventory.filter(i=>i.slot==='weapon').sort((a,b)=>b.stats.attack-a.stats.attack)[0];const before=stats(s).attack;act(s,'equip',best.id);assert.ok(stats(s).attack>before);
 act(s,'start');until(s,x=>x.wins===2||x.mode==='defeat');assert.equal(s.wins,2);assert.ok(s.battle.elapsed<first);
});
test('seeded simulation is deterministic',()=>{
 const a=createGame(101),b=createGame(101);act(a,'start');act(b,'start');for(let i=0;i<400;i++){advance(a,.1);advance(b,.1);}assert.deepEqual(a,b);
});
test('advance caps catchup and ignores invalid delta',()=>{
 const s=createGame();act(s,'start');advance(s,100000);assert.ok(s.battle.elapsed<=2.00001);const before=clone(s);advance(s,NaN);advance(s,-5);assert.deepEqual(s,before);
});
test('auto repeats same stage or progresses when selected',()=>{
 const s=createGame(1);act(s,'start');until(s,x=>x.wins===1);advance(s,2);advance(s,2);assert.equal(s.stage,1);
 const b=createGame(1);act(b,'setAutoAdvance',true);act(b,'start');until(b,x=>x.wins===1);advance(b,2);advance(b,2);assert.equal(b.stage,2);
});
test('retreat preserves earned progress, recovers safely',()=>{
 const s=createGame();act(s,'start');advance(s,1);s.hero.hp=1;act(s,'retreat');assert.equal(s.mode,'town');assert.equal(s.hero.hp,stats(s).maxHp);assert.equal(s.enemies.length,0);
});
test('defeat is recoverable and does not delete progression',()=>{
 const s=createGame();act(s,'start');s.hero.hp=1;s.enemies[0].attack=99999;advance(s,2);assert.equal(s.mode,'defeat');act(s,'retreat');assert.equal(s.mode,'town');assert.equal(s.hero.hp,stats(s).maxHp);
});
test('invalid commands do not corrupt state and equipment cannot change midfight',()=>{
 const s=createGame();const before=clone(s);act(s,'selectStage',9999);act(s,'selectStage',NaN);act(s,'equip','nonexistent');act(s,'setAutoAdvance','yes');assert.deepEqual(s,before);
 act(s,'start');const equipped=clone(s.equipment);act(s,'equip','starter-weapon');assert.deepEqual(s.equipment,equipped);
});
test('locked loot survives bulk sale and cannot be individually sold',()=>{
 const s=createGame(1);act(s,'start');until(s,x=>x.wins===1);act(s,'retreat');const item=s.inventory[0];item.quality='Average';act(s,'lock',item.id);act(s,'sell',item.id);act(s,'sellCommon');assert.ok(s.inventory.some(i=>i.id===item.id));
});
test('inventory full prevents another expedition without deleting loot',()=>{
 const s=createGame();s.inventory=Array.from({length:INVENTORY_LIMIT},(_,i)=>({...clone(s.equipment.weapon),id:`copy-${i}`}));act(s,'start');assert.equal(s.mode,'town');assert.equal(s.inventory.length,INVENTORY_LIMIT);
});
test('save roundtrip preserves equipment/progress and returns safe town',()=>{
 const s=createGame(1);act(s,'start');until(s,x=>x.wins===1);const restored=validateSave(clone(s));assert.equal(restored.mode,'town');assert.deepEqual(restored.inventory,s.inventory);assert.equal(restored.hero.level,s.hero.level);assert.equal(restored.wins,s.wins);assert.equal(restored.hero.hp,stats(restored).maxHp);
});
test('malformed and huge save fields fail safely',()=>{
 for(const bad of [null,[],{}, {version:2}, {...createGame(),inventory:Array(121).fill({})}])assert.throws(()=>validateSave(bad));
 for(const mutate of [s=>s.hero.level=-1,s=>s.hero.gold=Infinity,s=>s.equipment.weapon.stats.attack=NaN,s=>s.equipment.weapon.id='loot-9999999999999999999999',s=>s.equipment.weapon.slot='armor',s=>s.inventory.push(clone(s.equipment.weapon))]){const s=createGame();mutate(s);assert.throws(()=>validateSave(s));}
});
test('unknown save properties are not propagated',()=>{
 const s=createGame();s.evil='<script>';s.hero.attributes.str=1e99;s.equipment.weapon.evil=true;const restored=validateSave(s);assert.equal(restored.evil,undefined);assert.equal(restored.equipment.weapon.evil,undefined);assert.equal(restored.hero.attributes.str,8);
});
test('event and log buffers stay bounded across many runs',()=>{
 const s=createGame(1);act(s,'start');for(let i=0;i<6000;i++)advance(s,.1);assert.ok(s.events.length<=30);assert.ok(s.logs.length<=30);assert.ok(Number.isFinite(s.hero.hp));
});
test('large imported item counter wraps without duplicate or unrestorable ID',()=>{
 const source=createGame(1);source._itemId=1e9;const s=validateSave(source);act(s,'start');until(s,x=>x.wins===1);assert.ok(s.inventory.length);assert.doesNotThrow(()=>validateSave(clone(s)));assert.equal(new Set(s.inventory.map(i=>i.id)).size,s.inventory.length);
});
