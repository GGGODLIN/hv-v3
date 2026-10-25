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
