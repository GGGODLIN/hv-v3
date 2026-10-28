// Historical single-sale UI test retains its exact v063 behavior; v064 selection tests cover the new flow.
import {beforeDetailSale} from './helpers/detail-sale-baseline.mjs';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { fullUI, find, clone } from './helpers/comparison-focus-harness.mjs';
import { generateItem, itemSalePrice } from '../src/loot.js';
const engine = await import(process.env.HV_SALE_CAP_ENGINE ? pathToFileURL(process.env.HV_SALE_CAP_ENGINE).href : '../src/engine.js');
const cap=1e12;
function item(id,stats={attack:10}) {return {...generateItem(()=>0,3,'weapon'),id,stats,power:20};}
function fixture() {const s=engine.createGame(42);s.inventory=[{...item('keeper',{attack:50}),locked:true},item('candidate-a'),item('candidate-b')];s.pendingLoot=[item('pending-a'),item('pending-b')];return s;}
function operation(s,action) {const ids=['candidate-a','candidate-b'];return action==='sell' ? {payload:ids[0],total:itemSalePrice(s.inventory[1])} : action==='sellSafe' ? {payload:{ids},total:engine.previewSafeSale(s).items.reduce((n,i)=>n+i.value,0)} : {payload:undefined,total:s.inventory.filter(i=>!i.locked).reduce((n,i)=>n+itemSalePrice(i),0)};}

test('audit: each manual lane rejects one-credit overflow without losing items, FIFO, logs or RNG',()=>{
 for(const action of ['sell','sellSafe','sellCommon']) {const s=fixture(),op=operation(s,action);assert.ok(op.total>0);s.hero.gold=cap-op.total+1;const before=structuredClone(s);assert.equal(engine.act(s,action,op.payload),s);assert.deepEqual(s,before,action);}
});
test('audit: exact ceiling succeeds at unchanged prices and survives save roundtrip',()=>{
 for(const action of ['sell','sellSafe','sellCommon']) {const s=fixture(),op=operation(s,action);s.hero.gold=cap-op.total;engine.act(s,action,op.payload);assert.equal(s.hero.gold,cap,action);assert.ok(!s.inventory.some(i=>i.id==='candidate-a'));assert.equal(s.inventory[0].id,'keeper');assert.deepEqual(s.inventory.slice(-2).map(i=>i.id),['pending-a','pending-b']);const restored=engine.validateSave(structuredClone(s));assert.equal(restored.hero.gold,cap);assert.deepEqual(restored.inventory,s.inventory);}
});
test('audit: batch affordability never sells a first affordable member partially',()=>{
 for(const action of ['sellSafe','sellCommon']) {const s=fixture();s.hero.gold=cap-itemSalePrice(s.inventory[1]);const op=operation(s,action),before=structuredClone(s);engine.act(s,action,op.payload);assert.deepEqual(s,before,action);}
});
test('audit: nonfinite, negative, or already excessive balances fail closed across manual lanes',()=>{
 for(const gold of [NaN,Infinity,-1,cap+1])for(const action of ['sell','sellSafe','sellCommon']) {const s=fixture(),op=operation(s,action);s.hero.gold=gold;const before=structuredClone(s);engine.act(s,action,op.payload);assert.deepEqual(s,before,`${action}/${gold}`);}
});
test('audit: sufficient funds do not remove locked gear and successful FIFO refill stays ordered',()=>{
 const s=fixture();s.hero.gold=123;const keeper=structuredClone(s.inventory[0]);engine.act(s,'sell','keeper');assert.equal(s.hero.gold,123);assert.deepEqual(s.inventory[0],keeper);const price=itemSalePrice(s.inventory[1]);engine.act(s,'sell','candidate-a');assert.equal(s.hero.gold,123+price);assert.deepEqual(s.inventory.map(i=>i.id),['keeper','candidate-b','pending-a','pending-b']);assert.equal(s.pendingLoot.length,0);
});
test('audit: single-sale overflow UI retains inspected item rather than pretending it disappeared',async()=>{
 const s=fixture();s.hero.gold=cap;const h=fullUI(s,{source:beforeDetailSale(readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8'),'src/ui.js')});await h.card('inventory','candidate-a').click();const before=JSON.stringify(h.state);const button=find(h.dom['item-detail'],e=>e.tag==='button'&&e.textContent==='出售');assert.ok(button);await button.click();assert.equal(JSON.stringify(h.state),before);assert.equal(h.run('selectedId'),'candidate-a');assert.ok(h.card('inventory','candidate-a'));assert.match(h.dom.toast.textContent,/未出售|尚未出售|未完成/);assert.deepEqual(clone(h.faults),[]);
});
