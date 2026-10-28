import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as g from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
import {beforeBattleTempo} from './helpers/battle-tempo-baseline.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const expected=JSON.parse(readFileSync(new URL('./helpers/v067-runtime-hashes.json',import.meta.url),'utf8'));
test('v068 reverse projection exactly restores accepted v067 runtime/page/package',()=>{
 for(const [p,h]of Object.entries(expected))assert.equal(sha(beforeBattleTempo(readFileSync(new URL('../'+p,import.meta.url),'utf8'),p)),h,p);
});
async function tempo(h,value){h.dom['battle-tempo'].value=String(value);await h.dom['battle-tempo'].emit('change');}
for(const seed of [1,42,173])test(`2x natural UI single expedition seed ${seed}: same complete game and report, half timer calls`,async()=>{
 const normal=fullUI(g.createGame(seed)),fast=fullUI(g.createGame(seed));
 await tempo(fast,2);await normal.dom['start-once-button'].click();await fast.dom['start-once-button'].click();
 let n=0,f=0;
 while(normal.state.mode==='battle'&&n<2000){normal.at(++n*250);normal.tick();}
 while(fast.state.mode==='battle'&&f<2000){fast.at(++f*250);fast.tick();}
 assert.ok(n<2000&&f<2000);assert.equal(f,Math.ceil(n/2));
 assert.equal(JSON.stringify(fast.state),JSON.stringify(normal.state));
 assert.deepEqual(JSON.parse(JSON.stringify(g.expeditionReports(fast.state))),JSON.parse(JSON.stringify(g.expeditionReports(normal.state))));
 const ended=JSON.stringify(fast.state);fast.at((f+1)*250);fast.tick();assert.equal(JSON.stringify(fast.state),ended);
 assert.deepEqual(fast.faults,[]);assert.deepEqual(normal.faults,[]);
});
test('tempo selection alone leaves durable state and RNG unchanged; actual imported journey resets to 1x',async()=>{
 const h=fullUI();const before=JSON.stringify(h.state),writes=h.writes.length;
 await tempo(h,2);assert.equal(JSON.stringify(h.state),before);assert.equal(h.writes.length,writes);assert.equal(h.dom['battle-tempo'].value,'2');
 await h.import(g.createGame(92));assert.equal(h.dom['battle-tempo'].value,'1');assert.equal(h.run('battleTempo'),1);
 assert.equal(Object.hasOwn(h.state,'battleTempo'),false);
});
test('switching tempo drops pending old-rate time, adds no gameplay until next bounded tick',async()=>{
 const h=fullUI();await h.dom['start-once-button'].click();h.at(200);await tempo(h,2);assert.equal(h.state.battle.elapsed,0);
 h.at(250);h.tick();assert.ok(Math.abs(h.state.battle.elapsed-.1)<1e-10);
 h.at(350);await tempo(h,1);h.at(450);h.tick();assert.ok(Math.abs(h.state.battle.elapsed-.2)<1e-10);
});
