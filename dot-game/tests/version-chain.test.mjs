import {legacyState,legacyEnvelope} from './helpers/soulbind-compat.mjs';
import {createGame,validateSave} from '../src/engine.js';
import * as previous from './fixtures/v0.22/engine.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadVersionedSave} from '../src/session.js';
const setup = entries => {
 const data = new Map(entries), reads=[];
 const result=loadVersionedSave({read:key=>{reads.push(key);return data.has(key)?data.get(key):null;},currentKey:'v3',legacyKeys:['v2','v1'],validate:value=>{if(!value.valid)throw Error('invalid');return value;},create:()=>({fresh:true})});
 return {data,reads,result};
};
test('v3 reads only newest present version and never changes old bytes',()=>{
 const entries=[['v2','{"valid":true,"level":7}'],['v1','{"valid":true,"level":2}']];
 const r=setup(entries); assert.deepEqual(r.reads,['v3','v2']);assert.equal(r.result.state.level,7);assert.equal(r.result.migrated,true);assert.deepEqual([...r.data],entries);
 const newest=setup([['v3','{"valid":true,"level":9}'],...entries]);assert.deepEqual(newest.reads,['v3']);assert.equal(newest.result.migrated,false);assert.equal(newest.result.state.level,9);
});
test('skip absent v2 but never skip corrupt or empty v2',()=>{
 const r=setup([['v1','{"valid":true,"level":2}']]);assert.equal(r.result.state.level,2);assert.deepEqual(r.reads,['v3','v2','v1']);
 for(const value of ['', '{bad', '{"valid":false}']){
  const bad=setup([['v2',value],['v1','{"valid":true}']]);assert.equal(bad.result.error,true);assert.deepEqual(bad.reads,['v3','v2']);
 }
});
test('read exception prevents migration instead of silently starting overwrite',()=>{
 const result=loadVersionedSave({read:()=>{throw Error('denied');},currentKey:'v3',legacyKeys:['v2'],validate:JSON.parse,create:()=>({fresh:true})});
 assert.equal(result.error,true);assert.equal(result.migrated,false);
});

// Test-only historical envelopes must never become a silent downgrade path.
test('historical compatibility projection changes only root version/currency, rejects bound metadata and never invokes accessors',()=>{
 const state=createGame(42);state.soulFragments=123;state.battle.unrelated={soulFragments:99,optional:undefined};
 const before=structuredClone(state),projected=legacyState(state);
 assert.equal(projected.version,1);assert.equal(Object.hasOwn(projected,'soulFragments'),false);
 assert.deepEqual({...projected,version:state.version,soulFragments:state.soulFragments},state);
 assert.deepEqual(state,before);assert.notEqual(projected.inventory,state.inventory);
 for(const placement of ['equipment','inventory','pendingLoot']){
  const bound=structuredClone(state),item=bound.equipment.weapon;
  if(placement!=='equipment')bound[placement].push({...item,id:'bound-test'});
  const target=placement==='equipment'?item:bound[placement][0];target.soulbound={version:1,level:1,stats:{attack:3}};
  assert.throws(()=>legacyState(bound),/must never hide bound metadata/);
 }
 const inherited=structuredClone(state);Object.setPrototypeOf(inherited.equipment.weapon,{soulbound:{version:1}});
 assert.throws(()=>legacyState(inherited),/must never hide bound metadata/);
 let reads=0;const accessor=structuredClone(state);Object.defineProperty(accessor,'version',{enumerable:true,get(){reads++;return 2;}});
 assert.throws(()=>legacyState(accessor),/inert known state envelope/);assert.equal(reads,0);
});
test('actual v2 export rejects in frozen v022; explicit unbound historical v1 input migrates with zero fragments',()=>{
 const state=createGame(73);state.hero.gold=4321;state.soulFragments=123;
 assert.throws(()=>previous.validateSave(JSON.parse(JSON.stringify(state))),/不支援/);
 const historical=legacyEnvelope(state),old=previous.validateSave(historical),migrated=validateSave(old);
 assert.equal(old.version,1);assert.equal(migrated.version,2);assert.equal(migrated.soulFragments,0);
 assert.equal(migrated.hero.gold,4321);assert.deepEqual(migrated.inventory,old.inventory);assert.deepEqual(migrated.equipment,old.equipment);
});
