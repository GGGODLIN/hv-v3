import test from 'node:test';
import assert from 'node:assert/strict';
import { createPump, createOwnership } from '../src/session.js';
const settle = () => new Promise(resolve => setImmediate(resolve));
function fakeLocks() {
  let occupied = false;
  return { async request(name, options, callback) {
    if (occupied) return callback(null);
    occupied = true;
    try { return await callback({name}); } finally { occupied = false; }
  }};
}
test('timer processes background online intervals once, not wall-clock offline time', () => {
  let time = 0, enabled = true, total = 0;
  const pump = createPump({now:()=>time,active:()=>enabled,step:s=>total+=s});
  time=250; assert.equal(pump.tick(),.25);
  assert.equal(pump.tick(),0);
  time=1250; assert.equal(pump.tick(),1);
  enabled=false; time=2250; assert.equal(pump.tick(),0);
  enabled=true; pump.reset(); time=2500; assert.equal(pump.tick(),.25);
  assert.equal(total,1.5);
});
test('long suspension is entirely discarded; medium throttling is bounded', () => {
  let time=0,total=0;
  const pump=createPump({now:()=>time,active:()=>true,step:s=>total+=s});
  time=5000;assert.equal(pump.tick(),2);
  time=10001;assert.equal(pump.tick(),0);
  time=3600000;assert.equal(pump.tick(),0);
  time+=250;assert.equal(pump.tick(),.25);assert.equal(total,2.25);
  time-=500;assert.equal(pump.tick(),0);
});
test('atomic lock permits exactly one writer and saves before handoff', async () => {
  const locks=fakeLocks(),events=[];
  const a=createOwnership({locks,name:'save',releasing:()=>events.push('saved-a')});
  const b=createOwnership({locks,name:'save',acquired:()=>events.push('loaded-b')});
  a.request();b.request();await settle();assert.equal(a.owner,true);assert.equal(b.owner,false);
  a.release();assert.deepEqual(events,['saved-a']);await settle();
  b.resume();await settle();assert.equal(a.owner,false);assert.equal(b.owner,true);
  assert.deepEqual(events,['saved-a','loaded-b']);
  a.request();await settle();assert.equal(a.owner,false);b.release();await settle();
});
test('unsupported and rejected locks never claim persistence authority', async () => {
  const unsupported=createOwnership({name:'save'});await unsupported.request();assert.equal(unsupported.supported,false);assert.equal(unsupported.owner,false);
  const rejected=createOwnership({name:'save',locks:{request:async()=>{throw Error('denied')}}});
  await rejected.request();assert.equal(rejected.owner,false);
});
test('release while async request pending cannot later acquire', async () => {
  let grant;
  const controller=createOwnership({name:'save',locks:{request:(_,__,cb)=>new Promise(resolve=>{grant=()=>resolve(cb({}));})}});
  const pending=controller.request();controller.release();grant();await pending;assert.equal(controller.owner,false);
});

test('v2 migration reads legacy once, preserves original, and existing v2 always wins', async () => {
  const { loadVersionedSave } = await import('../src/session.js');
  const store=new Map([['v1','{"version":1,"score":4}']]);
  const args={read:key=>store.get(key)??null,currentKey:'v2',legacyKey:'v1',validate:value=>value,create:()=>({score:0})};
  const first=loadVersionedSave(args);
  assert.equal(first.migrated,true);assert.equal(first.state.score,4);assert.equal(store.size,1);
  store.set('v2','{"version":1,"score":8}');store.set('v1','{"version":1,"score":99}');
  const second=loadVersionedSave(args);assert.equal(second.migrated,false);assert.equal(second.state.score,8);
  store.set('v2','invalid');const invalid=loadVersionedSave(args);
  assert.equal(invalid.error,true);assert.equal(invalid.migrated,false);assert.equal(store.get('v2'),'invalid');
  store.delete('v2');store.set('v1','invalid legacy');assert.equal(loadVersionedSave(args).error,true);
  assert.equal(store.get('v1'),'invalid legacy');
});
