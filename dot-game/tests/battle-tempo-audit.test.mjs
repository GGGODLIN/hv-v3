import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import * as engine from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const body=ui.match(/function advanceBattleTempo\(seconds\) \{[\s\S]*?\n\}/)[0];
const snapshot=s=>JSON.stringify(s);
async function speed(h,value){h.dom['battle-tempo'].value=value;await h.dom['battle-tempo'].emit('change');}
function stepModel({tempo=2,after='battle',owned=true}={}){const calls=[],state={mode:'battle'};const c=createContext({state,battleTempo:tempo,claimLease:()=>owned,advance:(s,t)=>{calls.push(t);s.mode=after;}});runInContext(body+';advanceBattleTempo(.25)',c);return calls;}

test('v068 audit: exact tempo uses at most two equal bounded steps, never a multiplied duration',()=>{
 assert.deepEqual(stepModel(),[.25,.25]);assert.deepEqual(stepModel({tempo:1}),[.25]);
 for(const tempo of [0,3,Infinity,'2',undefined]) if(tempo!==undefined)assert.deepEqual(stepModel({tempo}),[.25]);
});
for(const after of ['town','defeat'])test(`v068 audit: first-step ${after} skips second step`,()=>assert.deepEqual(stepModel({after}),[.25]));
test('v068 audit: ownership changes after the first advance prevent the second advance',()=>{
 const calls=[],state={mode:'battle'};let owner=true;const c=createContext({state,battleTempo:2,claimLease:()=>owner,advance:(_,t)=>{calls.push(t);owner=false;}});
 runInContext(body+';advanceBattleTempo(.25)',c);assert.deepEqual(calls,[.25]);
});
test('v068 audit: selector changes no game data or persistence; invalid and readonly choices refused',async()=>{
 const h=fullUI();const before=snapshot(h.state),writes=h.writes.length;assert.equal(h.dom['battle-tempo'].value,'1');
 await speed(h,'2');assert.equal(h.run('battleTempo'),2);assert.equal(snapshot(h.state),before);assert.equal(h.writes.length,writes);
 await speed(h,'4');assert.equal(h.dom['battle-tempo'].value,'2');assert.equal(h.run('battleTempo'),2);
 h.run('tabOwner=false');h.render();assert.equal(h.dom['battle-tempo'].disabled,true);
 await speed(h,'1');assert.equal(h.run('battleTempo'),2);assert.equal(h.dom['battle-tempo'].value,'2');assert.equal(snapshot(h.state),before);
 assert.deepEqual(h.faults,[]);
});
test('v068 audit: switching tempo discards old wall interval instead of retroactively doubling it',async()=>{
 const h=fullUI();await h.dom['start-button'].click();h.at(240);await speed(h,'2');h.at(250);h.tick();
 assert.ok(Math.abs(h.state.battle.elapsed-.02)<1e-12);h.at(500);h.tick();assert.ok(Math.abs(h.state.battle.elapsed-.52)<1e-12);
});
test('v068 audit: same small-step 1x and 2x combat have exact state/RNG/reward/report parity',async()=>{
 const one=fullUI(engine.createGame(672)),two=fullUI(engine.createGame(672));await one.dom['start-button'].click();await two.dom['start-button'].click();await speed(two,'2');
 for(let n=1;n<=160;n++){one.at((2*n-1)*250);one.tick();one.at(2*n*250);one.tick();two.at(n*250);two.tick();}
 assert.equal(snapshot(two.state),snapshot(one.state));assert.deepEqual(engine.expeditionReports(two.state),engine.expeditionReports(one.state));
 assert.ok(one.state.kills>0);assert.deepEqual(one.faults,[]);assert.deepEqual(two.faults,[]);
});
test('v068 audit: real single-expedition finish never restarts in second step or subsequent ticks',async()=>{
 const h=fullUI(engine.createGame(42));await speed(h,'2');await h.dom['start-once-button'].click();
 for(let n=1;n<=600&&h.state.mode==='battle';n++){h.at(n*250);h.tick();}
 assert.equal(h.state.mode,'town');assert.equal(h.state.wins,1);const end=snapshot(h.state);
 for(let n=601;n<=620;n++){h.at(n*250);h.tick();}assert.equal(snapshot(h.state),end);
});
test('v068 audit: long gaps and readonly/hidden foreground-only ticks grant no catchup at 2x',async()=>{
 const h=fullUI();await h.dom['start-button'].click();await speed(h,'2');const before=snapshot(h.state);
 h.at(6000);assert.equal(h.tick(),0);assert.equal(snapshot(h.state),before);
 h.run('tabOwner=false');h.at(6250);assert.equal(h.tick(),0);assert.equal(snapshot(h.state),before);
 h.run('tabOwner=true');h.document.hidden=true;h.at(6500);assert.equal(h.tick(),0);assert.equal(snapshot(h.state),before);
 h.document.hidden=false;h.at(6750);h.tick();assert.ok(Math.abs(h.state.battle.elapsed-.5)<1e-12);
});
test('v068 audit: importing and ownership reset clear speed; fresh reload starts 1x',async()=>{
 const h=fullUI();await speed(h,'2');h.run('syncSelection()');assert.equal(h.dom['battle-tempo'].value,'1');
 await speed(h,'2');await h.import(engine.createGame(28));assert.equal(h.dom['battle-tempo'].value,'1');assert.equal(h.run('battleTempo'),1);
 const reload=fullUI(h.state);assert.equal(reload.run('battleTempo'),1);assert.equal(reload.dom['battle-tempo'].value,'1');assert.deepEqual(h.faults,[]);
});
test('v068 audit: reduced motion does not disable tempo; markup and clock disclose simulation not attack speed',async()=>{
 const h=fullUI();h.run('prefs.reducedMotion=true');await speed(h,'2');await h.dom['start-button'].click();h.at(250);h.tick();assert.ok(Math.abs(h.state.battle.elapsed-.5)<1e-12);
 assert.match(html,/for="battle-tempo"/);assert.match(html,/aria-describedby="battle-tempo-note"/);assert.match(html,/加速整場模擬，不是攻速增益；戰報與倒數均為模擬時間/);
 assert.equal((ui.match(/setInterval\(/g)||[]).length,1);assert.match(ui,/step: advanceBattleTempo/);assert.deepEqual(h.faults,[]);
});

test('v068 audit: actual lethal first step cannot execute another simulation step',async()=>{
 const h=fullUI(engine.createGame(881));await h.dom['start-button'].click();await speed(h,'2');
 h.run("state.hero.hp=1;state._enemyClock=1.8;state.enemies.forEach(e=>{e.hp=100000;e.maxHp=100000;e.attack=100000;});globalThis.auditAdvanceCalls=[];globalThis.baseAdvance=advance;advance=(s,t)=>{auditAdvanceCalls.push(t);return baseAdvance(s,t);};");
 let terminalCalls=null;
 for(let n=1;n<=80&&h.state.mode==='battle';n++){h.run('auditAdvanceCalls.length=0');h.at(n*250);h.tick();if(h.state.mode==='defeat')terminalCalls=h.run('auditAdvanceCalls.length');}
 assert.equal(h.state.mode,'defeat');assert.equal(terminalCalls,1);
 // Whether death happens in first or second half, there is no extra call after it.
 const before=snapshot(h.state);h.at(20250);h.tick();assert.equal(snapshot(h.state),before);assert.equal(h.state.wins,0);
});
