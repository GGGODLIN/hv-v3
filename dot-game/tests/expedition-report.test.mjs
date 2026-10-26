import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,advance,stats,validateSave,expeditionReports,INVENTORY_LIMIT} from '../src/engine.js';

const clone=value=>structuredClone(value);
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
const target=extra=>({id:'report-target',name:'報告測試敵人',hp:100000,maxHp:100000,attack:0,defense:0,evade:0,parry:0,block:0,boss:true,...extra});
function encounter({seed=42,family=null,stage=1,strategy='balanced',enemy={},wave=1}={}) {
  const s=createGame(seed);s.unlocked=stage;s.stage=stage;s.strategy=strategy;
  s.equipment.weapon.weaponFamily=family;s.equipment.weapon.stats.crit=.8;
  act(s,'start');s.wave=wave;s.enemies=[target(enemy)];s._clock=-100;s._enemyClock=-100;return s;
}
function player(s,skill=false){s._turns=skill?(s.strategy==='assault'?2:4):0;s._clock=1.05;advance(s,.001);}
function incoming(s){s._clock=-100;s._enemyClock=1.9;advance(s,.001);}
function pulse(s){s._clock=-100;s._enemyClock=-100;s.timing.tu=(s.timing.ticks+1)*100-1;advance(s,.02);}
function runUntil(s,predicate){for(let n=0;n<10000&&!predicate(s);n++)advance(s,.1);assert.ok(predicate(s),'bounded encounter must terminate');}
const finish=s=>{act(s,'retreat');return expeditionReports(s)[0];};

function assertPlainBounded(value){
  if(typeof value==='number')assert.ok(Number.isFinite(value)&&value>=0&&value<=Number.MAX_SAFE_INTEGER);
  else if(value&&typeof value==='object'){
    assert.ok(Array.isArray(value)||Object.getPrototypeOf(value)===Object.prototype);
    for(const child of Object.values(value))assertPlainBounded(child);
  }
}

test('reports are lazy, session-only, detached plain views; live/failed starts expose no completion',()=>{
  const s=createGame(42),before=JSON.stringify(s);assert.deepEqual(expeditionReports(s),[]);
  assert.equal(JSON.stringify(s),before);assert.deepEqual(expeditionReports(null),[]);
  const keys=Object.keys(s);act(s,'start');advance(s,.1);
  assert.deepEqual(expeditionReports(s),[]);assert.deepEqual(Object.keys(s),[...keys,'_tuCompensation']);
  const report=finish(s);assert.equal(report.outcome,'retreat');assertPlainBounded(report);
  assert.equal(Object.hasOwn(s,'reports'),false);assert.equal(Object.hasOwn(s,'expeditionReports'),false);
  assert.deepEqual(expeditionReports(clone(s)),[],'ordinary state copies cannot accidentally claim durable history');
});

test('successful start snapshots stage, start level, weapon, strategy and sheet stats, not later camp choices',()=>{
  const s=createGame(42);s.stage=3;s.unlocked=3;act(s,'setStrategy','assault');
  s.equipment.weapon.weaponFamily='axe';s.equipment.weapon.name='出發斧';const p=stats(s);
  act(s,'start');advance(s,.4);const report=finish(s);
  assert.deepEqual({stage:report.stage,level:report.level,weapon:report.weapon,strategy:report.strategy},
    {stage:3,level:1,weapon:{family:'axe',name:'出發斧'},strategy:'assault'});
  assert.deepEqual(report.startStats,{attack:p.attack,maxHp:p.maxHp,mitigation:p.mitigation});
  s.inventory.push({...clone(s.equipment.weapon),id:'replacement',weaponFamily:'club',name:'後來的棍棒'});
  act(s,'equip','replacement');act(s,'setStrategy','sustain');act(s,'selectStage',1);
  assert.deepEqual(expeditionReports(s)[0],report);
});

test('nested report mutations and later action resets cannot alter immutable completed records',()=>{
  const s=encounter();player(s);const expected=finish(s),view=expeditionReports(s);
  view[0].weapon.name='改寫';view[0].startStats.attack=999;view[0].actions.attacks=999;
  view[0].damage.basic=999;view[0].survival.minHpPercent=0;view[0].procs.stun=999;view.splice(0,1);
  assert.deepEqual(expeditionReports(s),[expected]);
  s.battle.actions.attacks=999;act(s,'start');assert.deepEqual(expeditionReports(s),[expected]);
  advance(s,.1);assert.deepEqual(expeditionReports(s),[expected]);
});

for(const skill of [false,true])test(`${skill?'skill':'basic'} totals count actual removed HP, never raw overkill or other damage category`,()=>{
  const s=encounter({enemy:{hp:3,maxHp:3}});player(s,skill);
  const raw=s.events.find(event=>event.target==='report-target'&&['hit','crit'].includes(event.type)).value;
  assert.ok(raw>3);const report=finish(s);
  assert.deepEqual(report.damage,{basic:skill?0:3,skill:skill?3:0,bleed:0});
  assert.equal(report.actions.attacks,1);assert.equal(report.actions.skills,Number(skill));
  assert.deepEqual(report.procs,{penetratedArmor:0,stun:0,bleeding:0});
});

test('basic, skill and bleed are disjoint actual loss buckets, including a lethal remaining-HP pulse',()=>{
  const s=encounter({family:'axe',enemy:{hp:400,maxHp:400}}),e=s.enemies[0];
  player(s);const basic=400-e.hp;player(s,true);const skill=400-basic-e.hp;
  e.bleeding={stacks:5,expiresAtTick:s.timing.ticks+7,damagePerTick:1000};const remaining=e.hp;pulse(s);
  assert.ok(basic>0&&skill>0&&remaining>0);const report=finish(s);
  assert.deepEqual(report.damage,{basic,skill,bleed:remaining});assert.equal(Object.values(report.damage).reduce((a,b)=>a+b),400);
});

for(const [family,type] of [['rapier','penetratedArmor'],['club','stun'],['axe','bleeding']])test(`${family} counts observed applications without estimating bonus/prevented damage`,()=>{
  const s=encounter({family});player(s);const report=finish(s);
  assert.equal(report.procs[type],1);assert.equal(Object.values(report.procs).reduce((a,b)=>a+b),1);
  assert.equal(Object.hasOwn(report,'dps'),false);assert.equal(Object.hasOwn(report,'damagePrevented'),false);
  assert.equal(Object.keys(report.damage).length,3);
});

for(const [family,type,status] of [
  ['rapier','penetratedArmor',{penetratedArmor:{stacks:3,expiresAtTick:7}}],
  ['axe','bleeding',{bleeding:{stacks:5,expiresAtTick:7,damagePerTick:100}}],
])test(`${family} successful capped refresh counts one application, not stack delta`,()=>{
  const s=encounter({family,enemy:status});player(s);const report=finish(s);
  assert.equal(report.procs[type],1);
});

test('active stun cannot refresh and skill/blocked/lethal attacks cannot manufacture proc applications',()=>{
  for(const [family,enemy,skill] of [
    ['club',{stun:{expiresAtTick:4}},false],['rapier',{},true],['axe',{block:1},false],['axe',{hp:1},false]
  ]){
    const s=encounter({family,enemy});player(s,skill);
    assert.deepEqual(finish(s).procs,{penetratedArmor:0,stun:0,bleeding:0});
  }
});

test('zero-damage bleed snapshot still counts its successful application but pays no imaginary damage',()=>{
  const s=createGame(42);s.equipment.weapon.weaponFamily='axe';s.equipment.weapon.stats.crit=.8;
  s.equipment.weapon.stats.attack=0;Object.assign(s.hero.attributes,{str:0,dex:0});
  act(s,'start');s.enemies=[target()];s._clock=1.05;s._enemyClock=-100;advance(s,.001);
  assert.equal(s.enemies[0].bleeding.damagePerTick,0);pulse(s);const report=finish(s);
  assert.equal(report.procs.bleeding,1);assert.equal(report.damage.bleed,0);
});

test('incoming damage uses actual fractional HP lost and defeat minimum zero, not lethal overkill',()=>{
  const s=encounter({enemy:{attack:1e8}});s.hero.hp=7.25;incoming(s);
  assert.equal(s.mode,'defeat');const report=expeditionReports(s)[0];
  assert.equal(report.outcome,'defeat');assert.equal(report.survival.hpLost,7.25);assert.equal(report.survival.minHpPercent,0);
  assert.ok(s.events.find(event=>event.target==='hero'&&event.type==='hit').value>7.25);
  act(s,'retreat');act(s,'retreat');advance(s,2);assert.deepEqual(expeditionReports(s),[report]);
});

test('stun recovery damage is included before the player turn and can settle defeat once',()=>{
  const s=encounter({family:'club',enemy:{attack:1e8,stunRecoveryPending:true}});s.hero.hp=12.5;
  player(s);const report=expeditionReports(s)[0];
  assert.equal(s.mode,'defeat');assert.equal(report.outcome,'defeat');assert.equal(report.survival.hpLost,12.5);
  assert.equal(report.survival.minHpPercent,0);assert.equal(report.actions.attacks,0);
  assert.ok(s.events.some(event=>event.type==='recovery'));act(s,'retreat');assert.equal(expeditionReports(s).length,1);
});

test('healing and retreat recovery never erase the minimum; existing action counters are copied exactly',()=>{
  const s=encounter({enemy:{attack:180}}),maxHp=stats(s).maxHp;
  incoming(s);const hp=s.hero.hp;assert.ok(hp<maxHp);act(s,'heal');player(s,true);
  const actions=clone(s.battle.actions),report=finish(s);
  near(report.survival.hpLost,maxHp-hp);near(report.survival.minHpPercent,hp/maxHp*100);
  assert.deepEqual(report.actions,actions);assert.equal(report.actions.potions,1);assert.equal(report.actions.skills,1);
  assert.equal(s.hero.hp,stats(s).maxHp);
});

test('level-up wave cap is observed against new maxHP; non-attack cap is not incoming damage',()=>{
  const s=encounter({enemy:{hp:1,maxHp:1},wave:1});s.hero.xp=98;const oldMax=stats(s).maxHp;
  player(s);assert.equal(s.hero.level,2);assert.equal(s.hero.hp,oldMax);const newMax=stats(s).maxHp;
  const report=finish(s);assert.equal(report.level,1);assert.equal(report.endLevel,2);
  assert.equal(report.survival.hpLost,0);near(report.survival.minHpPercent,oldMax/newMax*100);
});

test('win includes clear-reward levels but snapshots minimum before full recovery and retains raw processed elapsed',()=>{
  const s=encounter({enemy:{hp:1,maxHp:1,attack:180},wave:4});s.hero.xp=60;
  const maxHp=stats(s).maxHp;incoming(s);const hp=s.hero.hp;player(s);
  assert.equal(s.wins,1);const report=expeditionReports(s)[0];assert.equal(report.level,1);assert.equal(report.endLevel,s.hero.level);
  assert.ok(report.endLevel>report.level);assert.equal(report.outcome,'win');assert.equal(report.elapsed,s.battle.elapsed);
  assert.ok(report.survival.minHpPercent<100);near(report.survival.minHpPercent,hp/maxHp*100);
  assert.equal(s.hero.hp,stats(s).maxHp);const before=clone(report);advance(s,2);act(s,'retreat');act(s,'retreat');
  assert.deepEqual(expeditionReports(s),[before]);
});

test('lethal final bleed completes exactly once and repeated retreat cannot overwrite a win',()=>{
  const s=encounter({wave:4,enemy:{hp:3,maxHp:3,bleeding:{stacks:1,expiresAtTick:7,damagePerTick:8}}});
  s._clock=1.05;s._enemyClock=1.9;pulse(s);const report=expeditionReports(s)[0];
  assert.equal(report.outcome,'win');assert.equal(report.damage.bleed,3);assert.equal(report.actions.attacks,0);
  assert.equal(report.procs.bleeding,0,'preexisting fixture status is not an observed application');
  assert.equal(s.kills,1);assert.equal(s.wins,1);advance(s,0);advance(s,1);act(s,'retreat');act(s,'retreat');
  assert.deepEqual(expeditionReports(s),[report]);
});

test('simultaneous old-wave bleed deaths count once each without adding new-wave damage',()=>{
  const s=encounter({wave:2,enemy:{hp:3,maxHp:3,boss:false,bleeding:{stacks:1,expiresAtTick:7,damagePerTick:8}}});
  s.enemies.push(target({id:'second-target',hp:4,maxHp:4,boss:false,bleeding:{stacks:1,expiresAtTick:7,damagePerTick:8}}));
  pulse(s);assert.equal(s.wave,3);assert.equal(s.kills,2);assert.deepEqual(s.enemies.map(e=>e.hp),s.enemies.map(e=>e.maxHp));
  const report=finish(s);assert.equal(report.damage.bleed,7);assert.equal(report.actions.attacks,0);
});

test('automatic next expedition keeps completed report and only its own settlement creates the next record',()=>{
  const s=encounter({wave:4,enemy:{hp:1,maxHp:1}});player(s);const first=expeditionReports(s)[0];
  advance(s,2);advance(s,1);assert.equal(s._phase,'fight');assert.equal(s.wave,1);
  assert.deepEqual(expeditionReports(s),[first]);act(s,'start');advance(s,.2);const second=finish(s);
  assert.equal(second.outcome,'retreat');assert.equal(second.level,first.endLevel);
  assert.deepEqual(expeditionReports(s),[second,first]);assert.ok(second.elapsed<first.elapsed+1);
});

test('newest two retain order and no-op starts, blocked starts or town retreat never clear or append',()=>{
  const s=createGame(42),reports=[];
  for(const duration of [.1,.2,.3]){act(s,'start');advance(s,duration);reports.unshift(finish(s));}
  assert.deepEqual(expeditionReports(s),reports.slice(0,2));
  const stable=expeditionReports(s);act(s,'retreat');s.inventory=Array.from({length:INVENTORY_LIMIT},(_,i)=>({...clone(s.equipment.armor),id:`held-${i}`}));
  act(s,'start');assert.equal(s.mode,'town');assert.deepEqual(expeditionReports(s),stable);
  s.inventory=[];s.pendingLoot=[{...clone(s.equipment.armor),id:'pending'}];act(s,'start');assert.deepEqual(expeditionReports(s),stable);
});

test('repeated Start during a live fight does not reset context, elapsed, actions or accumulated damage',()=>{
  const s=encounter();player(s);const elapsed=s.battle.elapsed,damage=s.enemies[0].maxHp-s.enemies[0].hp;
  act(s,'start');assert.equal(s.battle.elapsed,elapsed);player(s);const report=finish(s);
  assert.equal(report.actions.attacks,2);assert.ok(report.damage.basic>damage);assert.equal(report.level,1);
});

test('every validated load drops active and completed session feedback, including hostile invented report fields',()=>{
  const s=encounter();player(s);finish(s);act(s,'start');advance(s,.2);
  const raw=clone(s);raw.reports=[{outcome:'win',damage:{basic:Infinity}}];raw.expeditionReports=raw.reports;
  raw._expeditionFeedback={active:{outcome:'win'},reports:raw.reports};raw.battle.reports=raw.reports;
  const restored=validateSave(raw);assert.equal(restored.mode,'town');assert.deepEqual(expeditionReports(restored),[]);
  assert.equal(Object.hasOwn(restored,'reports'),false);assert.equal(Object.hasOwn(restored,'expeditionReports'),false);
  assert.equal(Object.hasOwn(restored,'_expeditionFeedback'),false);assert.equal(Object.hasOwn(restored.battle,'reports'),false);
  assert.equal(expeditionReports(s).length,1,'loading another state does not mutate the old session object');
  act(restored,'retreat');assert.deepEqual(expeditionReports(restored),[]);
  act(restored,'start');advance(restored,.1);assert.equal(finish(restored).outcome,'retreat');
});

test('natural clear damage totals equal all six enemy HP pools, report survives equip/replay, and getters do not perturb gameplay',()=>{
  const a=createGame(42),b=createGame(42);act(a,'start');act(b,'start');
  let priorEnemyIds=new Set(),hpPool=0;
  for(let n=0;n<10000&&a.wins===0&&a.mode==='battle';n++){
    for(const e of a.enemies)if(!priorEnemyIds.has(e.id)){priorEnemyIds.add(e.id);hpPool+=e.maxHp;}
    const before=clone(a);expeditionReports(a);expeditionReports(a);assert.deepEqual(a,before);
    advance(a,.1);advance(b,.1);assert.deepEqual(a,b);
  }
  assert.equal(a.wins,1);const report=expeditionReports(a)[0];assert.equal(priorEnemyIds.size,6);
  assert.equal(Object.values(report.damage).reduce((sum,damage)=>sum+damage),hpPool);
  assert.deepEqual(report.actions,a.battle.actions);assert.equal(report.outcome,'win');assert.equal(report.endLevel,a.hero.level);
  act(a,'retreat');const weapon=a.inventory.find(item=>item.slot==='weapon');act(a,'equip',weapon.id);act(a,'start');
  assert.deepEqual(expeditionReports(a),[report]);runUntil(a,s=>s.wins===2||s.mode==='defeat');
  assert.equal(expeditionReports(a).length,2);assert.deepEqual(expeditionReports(a)[1],report);
});
