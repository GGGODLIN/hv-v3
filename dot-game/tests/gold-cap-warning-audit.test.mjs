import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import {fullUI,clone} from './helpers/comparison-focus-harness.mjs';
const CAP=1e12;
function fixture(gold=CAP){const s=engine.createGame(42);s.hero.gold=gold;return s;}
function shown(h){assert.equal(h.dom['gold-cap-warning'].hidden,false);assert.match(h.dom['gold-cap-warning'].textContent,/超額不入帳.*不會補發/);}
test('independent cap warning is present on loaded save, passive and state/RNG/storage neutral',()=>{
 const h=fullUI(fixture());shown(h);assert.equal(h.dom['gold-cap-warning'].attributes.role,'status');
 assert.equal(h.dom['gold-cap-warning'].tag,'p');assert.equal(h.dom['gold-cap-warning'].children.length,0);
 const state=clone(h.state),writes=h.writes.length,calls=h.calls.length;
 h.render();h.render();shown(h);assert.deepEqual(clone(h.state),state);assert.equal(h.writes.length,writes);assert.equal(h.calls.length,calls);
 assert.equal(h.dom['start-button'].disabled,false);
});
test('independent one gold below limit has no warning, exact threshold does',()=>{
 const h=fullUI(fixture(CAP-1));assert.equal(h.dom['gold-cap-warning'].hidden,true);assert.equal(h.dom['gold-cap-warning'].textContent,'');
 h.state.hero.gold=CAP;h.render();shown(h);
});
test('independent real commission spending clears warning without removing equipment',()=>{
 const initial=fixture();initial.wins=1;const h=fullUI(initial);shown(h);const q=engine.previewWeaponCommission(h.state,'axe','slaughter');assert.equal(q.available,true,q.reason);
 const equipment=clone(h.state.equipment),count=h.state.inventory.length;
 h.run(`dispatch('commissionWeapon', ${JSON.stringify({family:'axe',suffix:'slaughter',quoteBasis:q.quoteBasis})})`);
 assert.equal(h.state.hero.gold,q.goldAfter);assert.ok(h.state.hero.gold<CAP);assert.equal(h.state.inventory.length,count+1);assert.deepEqual(clone(h.state.equipment),equipment);
 assert.equal(h.dom['gold-cap-warning'].hidden,true);assert.equal(h.dom['gold-cap-warning'].textContent,'');
});
test('independent imported cap save warns immediately and imported lower balance clears',async()=>{
 const h=fullUI(fixture(10));await h.import(fixture());shown(h);assert.equal(h.state.hero.gold,CAP);
 await h.import(fixture(50));assert.equal(h.state.hero.gold,50);assert.equal(h.dom['gold-cap-warning'].hidden,true);
});
test('independent read-only rendering still warns and does not change lease or save',()=>{
 const h=fullUI(fixture());h.run('tabOwner=false');const state=clone(h.state),writes=h.writes.length;
 h.render();shown(h);assert.equal(h.run('tabOwner'),false);assert.deepEqual(clone(h.state),state);assert.equal(h.writes.length,writes);assert.equal(h.dom['start-button'].disabled,true);
});
test('independent warning does not block departure or disappear during battle',()=>{
 const h=fullUI(fixture());h.run("dispatch('start')");assert.equal(h.state.mode,'battle');shown(h);assert.equal(h.state.hero.gold,CAP);
});
