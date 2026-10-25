import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, act, advance, stats, validateSave, STRATEGIES } from '../src/engine.js';

const clone = value => JSON.parse(JSON.stringify(value));
function finish(s) {
  for(let n=0;n<2400 && s.mode==='battle' && !s.wins;n++) advance(s,.1);
  return s;
}
function probe(strategy, hp, attack) {
  const s=createGame(42);act(s,'setStrategy',strategy);act(s,'start');s.wave=4;
  s.enemies=[{id:'probe',name:'Acceptance probe',hp,maxHp:hp,attack,defense:5,boss:true,evade:0,parry:0,block:0}];
  return finish(s);
}

test('v0.2 independent: balanced retains accepted v0.1 seeded first-clear signatures',()=>{
  // Frozen signatures generated from our accepted v0.1 source, not a second implementation.
  for(const [seed,finalSeed,itemCount] of [[1,2209033545,2],[42,3839731728,1],[999,876178866,1]]) {
    const s=createGame(seed);act(s,'start');finish(s);
    assert.equal(s.wins,1);assert.equal(Number(s.battle.elapsed.toFixed(1)),31.6);
    assert.equal(s.seed,finalSeed);assert.equal(s.hero.gold,76);assert.equal(s.hero.xp,6);
    assert.equal(s.hero.level,2);assert.equal(s.timing.turns,30);assert.equal(s.inventory.length,itemCount);
  }
});
test('v0.2 independent: strategies give no instant stats or resources; are camp-only',()=>{
  const s=createGame(42), sheet=stats(s), resources=clone(s.hero);
  for(const {id} of STRATEGIES) {
    act(s,'setStrategy',id);assert.equal(s.strategy,id);
    assert.deepEqual(stats(s),sheet);assert.deepEqual(s.hero,resources);
    assert.equal(validateSave(clone(s)).strategy,id);
  }
  for(const bad of [null,undefined,'__proto__','godmode',{},1]) {
    const before=clone(s);act(s,'setStrategy',bad);assert.deepEqual(s,before);
  }
  act(s,'start');const before=clone(s);act(s,'setStrategy','assault');assert.deepEqual(s,before);
  const legacy=clone(s);delete legacy.strategy;delete legacy.battle.actions;
  const restored=validateSave(legacy);assert.equal(restored.version,1);assert.equal(restored.strategy,'balanced');
  assert.equal(restored.mode,'town');assert.equal(restored.hero.gold,s.hero.gold);
  act(restored,'start');assert.doesNotThrow(()=>advance(restored,2));
});
test('v0.2 independent: assault trades mana for speed against identical seeded target',()=>{
  const balanced=probe('balanced',2000,0), assault=probe('assault',2000,0);
  assert.equal(balanced.wins,1);assert.equal(assault.wins,1);
  assert.ok(assault.battle.elapsed<balanced.battle.elapsed);
  assert.ok(assault.battle.actions.manaSpent>balanced.battle.actions.manaSpent);
  assert.ok(assault.battle.actions.skills>balanced.battle.actions.skills);
});
test('v0.2 independent: sustain survives pressure by consuming finite supplies, not bonus stats',()=>{
  const balanced=probe('balanced',3000,60),assault=probe('assault',3000,60),sustain=probe('sustain',3000,60);
  assert.equal(balanced.mode,'defeat');assert.equal(assault.mode,'defeat');assert.equal(sustain.wins,1);
  assert.equal(balanced.battle.actions.potions,0);assert.equal(assault.battle.actions.potions,0);
  assert.equal(sustain.battle.actions.potions,3);
  assert.ok(sustain.battle.actions.heals>balanced.battle.actions.heals);
  assert.ok(sustain.battle.elapsed>balanced.battle.elapsed);
});

import { createPump, createOwnership } from '../src/session.js';
import { readFileSync } from 'node:fs';
const flush = async () => { for(let n=0;n<8;n++) await Promise.resolve(); };
function lockServer() {
  const held=new Set();
  return {held,request:async(name,options,callback)=>{
    assert.equal(options.mode,'exclusive');assert.equal(options.ifAvailable,true);
    if(held.has(name))return callback(null);
    held.add(name);try {return await callback({name});}finally{held.delete(name);}
  }};
}

test('v0.2 independent: single elapsed clock bounds gaps and cannot double-step same instant',()=>{
  let clock=0,enabled=true,total=0;
  const p=createPump({now:()=>clock,active:()=>enabled,step:s=>total+=s});
  clock=250;assert.equal(p.tick(),.25);assert.equal(p.tick(),0);assert.equal(total,.25);
  clock=6000;assert.equal(p.tick(),0);assert.equal(total,.25,'suspended interval wholly discarded');
  clock=6250;assert.equal(p.tick(),.25);
  enabled=false;clock=10000;p.tick();enabled=true;clock=10250;p.tick();assert.equal(total,.75,'inactive time not banked');
  clock=20250;p.reset();assert.equal(p.tick(),0,'resume rebases rather than grants offline rewards');
  clock=24250;assert.equal(p.tick(),2,'short throttling interval bounded at engine cap');
});
test('v0.2 independent: atomic owner only simulates/saves, then releases before successor',async()=>{
  const locks=lockServer(),events=[];
  const a=createOwnership({locks,name:'candidate',releasing:()=>events.push('saved-a')});
  const b=createOwnership({locks,name:'candidate',acquired:()=>events.push('loaded-b')});
  const c=createOwnership({locks,name:'stable'});
  a.request();b.request();c.request();await flush();
  assert.equal(a.owner,true);assert.equal(b.owner,false);assert.equal(c.owner,true);
  let clock=0,writes=0,steps=0;
  const p=createPump({now:()=>clock,active:()=>b.owner,step:()=>steps++});
  clock=1000;p.tick();if(b.owner)writes++;assert.equal(steps,0);assert.equal(writes,0);
  a.release();await flush();b.resume();await flush();
  assert.equal(b.owner,true);assert.deepEqual(events,['saved-a','loaded-b']);
  b.release();c.release();await flush();assert.equal(locks.held.size,0);
});
test('v0.2 independent: delayed lock delivery after release never becomes writer',async()=>{
  let deliver,acquired=0;
  const locks={request:(_name,_options,callback)=>new Promise(resolve=>{deliver=()=>resolve(callback({}));})};
  const owner=createOwnership({locks,name:'candidate',acquired:()=>acquired++});
  owner.request();owner.release();deliver();await flush();
  assert.equal(owner.owner,false);assert.equal(acquired,0);
});
test('v0.2 independent: reentrant release during acquisition cannot leak ownership',async()=>{
  const locks=lockServer();let owner;
  owner=createOwnership({locks,name:'candidate',acquired:()=>owner.release()});
  owner.request();await flush();assert.equal(owner.owner,false);assert.equal(locks.held.size,0);
});
test('v0.2 independent: throwing release callback still frees atomic lock',async()=>{
  const locks=lockServer();
  const owner=createOwnership({locks,name:'candidate',releasing:()=>{throw Error('storage unavailable');}});
  owner.request();await flush();try{owner.release();}catch{}
  await flush();assert.equal(owner.owner,false);assert.equal(locks.held.size,0);
});
test('v0.2 independent: unsupported lock does not manufacture a shared-save writer',async()=>{
  let acquired=0;const owner=createOwnership({locks:undefined,name:'x',acquired:()=>acquired++});
  await owner.resume();assert.equal(owner.supported,false);assert.equal(owner.owner,false);assert.equal(acquired,0);
});
test('v0.2 integration source contract: rAF renders only; import and persistence guarded',()=>{
  // Source-level guard checks, NOT an actual browser lifecycle/hidden-tab proof.
  const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
  const frame=ui.slice(ui.indexOf('function frame(now)'),ui.indexOf('if (loadProblem)'));
  assert.doesNotMatch(frame,/advance\(|pump\.tick\(/);
  assert.equal((ui.match(/step: seconds => advance\(state, seconds\)/g)||[]).length,1);
  assert.match(ui,/if \(!ownership.supported \|\| !tabOwner/);
  const imports=ui.slice(ui.indexOf("$('save-file').addEventListener"),ui.indexOf("window.addEventListener('pagehide'"));
  assert.ok(imports.indexOf('if(!claimLease')<imports.indexOf('state=restored'));
  assert.match(ui,/storageScope.*save-v1/);
  assert.match(ui,/pageActive = false; releaseLease\(\); pump.reset\(\)/);
});
test('v0.2 independent: stale request cannot cross pagehide/pageshow epoch',async()=>{
  const deliveries=[];let acquired=0;
  const locks={request:(_name,_options,callback)=>new Promise(resolve=>deliveries.push(()=>resolve(callback({}))))};
  const owner=createOwnership({locks,name:'candidate',acquired:()=>acquired++});
  owner.request();owner.release();owner.resume();deliveries.shift()();await flush();
  assert.equal(owner.owner,false);assert.equal(acquired,0);
  owner.request();deliveries.shift()();await flush();assert.equal(owner.owner,true);assert.equal(acquired,1);
  owner.release();await flush();assert.equal(owner.owner,false);
});
test('v0.2 independent: load error releases lock and never advertises ownership',async()=>{
  const locks=lockServer(),states=[];
  const owner=createOwnership({locks,name:'candidate',acquired:()=>{throw Error('corrupt storage');},changed:v=>states.push(v)});
  owner.request();await flush();assert.equal(owner.owner,false);assert.equal(locks.held.size,0);
  assert.ok(!states.includes(true));
});

import { loadVersionedSave } from '../src/session.js';
import { runInNewContext } from 'node:vm';
function migrationStore(entries=[]) {
  const data=new Map(entries), options={read:key=>data.has(key)?data.get(key):null,currentKey:'save-v2',legacyKey:'save-v1',validate:validateSave,create:()=>createGame(100)};
  return {data,load:()=>loadVersionedSave(options)};
}
test('v0.2 independent: migration is read-only and legacy writer cannot clobber new namespace',()=>{
  const legacy=createGame(42);legacy.hero.gold=123;const raw=JSON.stringify(legacy);
  const store=migrationStore([['save-v1',raw]]), migrated=store.load();
  assert.equal(migrated.migrated,true);assert.equal(migrated.state.hero.gold,123);
  assert.equal(store.data.size,1);assert.equal(store.data.get('save-v1'),raw);
  store.data.set('save-v2',JSON.stringify({...migrated.state,hero:{...migrated.state.hero,gold:456}}));
  legacy.hero.gold=999;store.data.set('save-v1',JSON.stringify(legacy));
  const latest=store.load();assert.equal(latest.migrated,false);assert.equal(latest.state.hero.gold,456);
  assert.equal(JSON.parse(store.data.get('save-v1')).hero.gold,999,'legacy timeline remains untouched');
});
test('v0.2 independent: existing corrupt v2 blocks legacy fallback, including empty string',()=>{
  for(const corrupt of ['', '{broken', 'null', '{"version":99}']) {
    const store=migrationStore([['save-v1',JSON.stringify(createGame(42))],['save-v2',corrupt]]);
    const before=[...store.data], loaded=store.load();
    assert.equal(loaded.error,true);assert.equal(loaded.migrated,false);assert.equal(loaded.raw,corrupt);
    assert.deepEqual([...store.data],before);
  }
  const store=migrationStore([['save-v1','{broken']]),before=[...store.data],loaded=store.load();
  assert.equal(loaded.error,true);assert.equal(loaded.migrated,false);assert.deepEqual([...store.data],before);
});
test('v0.2 integration: actual acquisition refresh adopts raced v2 or protects malformed v2',()=>{
  const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
  const start=ui.indexOf('function refreshSavedState()'),end=ui.indexOf('const ownership =',start);
  assert.ok(start>=0&&end>start);
  const refresh=ui.slice(start,end);
  for(const raw of [JSON.stringify({...createGame(42),hero:{...createGame(42).hero,gold:987}}),'','{broken']) {
    const context={storeAvailable:true,preventOverwrite:false,readStorage:()=>raw,SAVE_KEY:'save-v2',lastSavedRaw:null,state:createGame(1),validateSave,syncSelection:()=>{},notice:()=>{}};
    runInNewContext(`${refresh}\nrefreshSavedState();`,context);
    if(raw.startsWith('{"version"')){assert.equal(context.state.hero.gold,987);assert.equal(context.lastSavedRaw,raw);}
    else assert.equal(context.preventOverwrite,true,'a corrupt save appearing before ownership cannot be overwritten');
  }
  const denied={storeAvailable:false,preventOverwrite:false,readStorage:()=>null,SAVE_KEY:'save-v2',lastSavedRaw:null,state:createGame(1),validateSave,syncSelection:()=>{},notice:()=>{}};
  runInNewContext(`${refresh}\nrefreshSavedState();`,denied);
  assert.equal(denied.preventOverwrite,true,'failed read must not turn into replacement save');
  assert.match(ui,/const SAVE_KEY = `hv-v3-dot-\$\{storageScope\}-save-v2`/);
  assert.doesNotMatch(ui,/writeStorage\(LEGACY_SAVE_KEY|removeItem\(/);
});
