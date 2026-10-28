import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as g from '../src/engine.js';
import {fullUI} from './helpers/comparison-focus-harness.mjs';
import {beforeSingleExpedition} from './helpers/single-expedition-baseline.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const expected={"src/engine.js": "c52d56e9f1b16a2dee8867b060440bdae77c903f387e91abcce85412c565443c", "src/ui.js": "ba74aa9ab507a62ffb79b6102b5aed5b93ae16d39ba1be9c8e8c0653063045c6", "index.html": "88787980e9c7975385f42fd9dbfe6999057950e9681d6f864cd88022f48ac0bf", "package.json": "a7ff1ab681488c91d777b84ba7115e8a8934b0a9952efc70284462b04c73941d"};
test('exact reverse projection preserves accepted v065 runtime and page bytes',()=>{
 for(const [p,h]of Object.entries(expected))assert.equal(hash(beforeSingleExpedition(readFileSync(new URL('../'+p,import.meta.url),'utf8'),p)),h,p);
});
test('one expedition has no durable preference and normal start remains continuous',()=>{
 const a=g.createGame(42),b=g.createGame(42);g.act(a,'startOnce');g.act(b,'start');
 assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(g.finishThenCampView(a).queued,true);assert.equal(g.finishThenCampView(b).queued,false);
 const reloaded=g.validateSave(JSON.parse(JSON.stringify(a)));assert.equal(reloaded.mode,'town');assert.equal(g.finishThenCampView(reloaded).queued,false);
});
test('single expedition natural full reward and no next route despite autoAdvance',()=>{
 const a=g.createGame(42);a.autoAdvance=true;g.act(a,'startOnce');
 for(let t=0;t<10000&&a.mode==='battle';t++)g.advance(a,.1);
 assert.equal(a.mode,'town');assert.equal(a.wins,1);assert.equal(a.wave,4);assert.equal(a.unlocked,2);assert.equal(a.stage,1);
 assert.ok(a.inventory.length>=1);assert.ok(a.hero.gold>0);assert.equal(a.worldSeeds,1);assert.equal(g.expeditionReports(a)[0].outcome,'win');
 const before=JSON.stringify(a);for(let t=0;t<100;t++)g.advance(a,.1);assert.equal(JSON.stringify(a),before);
});
test('UI single entry advertises complete expedition and restores available camp controls after natural win',async()=>{
 const h=fullUI();assert.match(h.dom['finish-camp-status'].textContent,/全部四波/);assert.equal(h.dom['start-once-button'].disabled,false);
 await h.dom['start-once-button'].click();assert.equal(h.dom['start-once-button'].disabled,true);assert.equal(h.dom['finish-camp-button'].attributes['aria-pressed'],'true');
 for(let t=0;t<10000&&h.state.mode==='battle';t++)g.advance(h.state,.1);h.render();assert.equal(h.dom['start-once-button'].disabled,false);assert.equal(h.dom['finish-camp-button'].attributes['aria-pressed'],'false');assert.deepEqual(h.faults,[]);
});
