import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../src/engine.js';
import {fullUI, clone} from './helpers/comparison-focus-harness.mjs';

test('gold capacity warning stays absent below the existing storage ceiling', () => {
  const state=createGame(54); state.hero.gold=1e12-1;
  const h=fullUI(state);
  assert.equal(h.dom['gold-cap-warning'].hidden,true);
  assert.equal(h.dom['gold-cap-warning'].textContent,'');
});
test('loaded full balance warns before departure without changing state', () => {
  const state=createGame(54); state.hero.gold=1e12;
  const h=fullUI(state), before=clone(h.state), writes=h.writes.length;
  h.render(); h.render();
  assert.equal(h.dom['gold-cap-warning'].hidden,false);
  assert.match(h.dom['gold-cap-warning'].textContent,/超額不入帳，也不會補發/);
  assert.match(h.dom['gold-cap-warning'].textContent,/出售.*保留裝備/);
  assert.deepEqual(clone(h.state),before);
  assert.equal(h.writes.length,writes);
  assert.equal(h.calls.length,0);
});
test('warning follows current balance without reserving or inventing overflow gold', () => {
  const h=fullUI(); h.run('state.hero.gold=1e12'); h.render();
  assert.equal(h.dom['gold-cap-warning'].hidden,false);
  h.run('state.hero.gold-=1'); h.render();
  assert.equal(h.dom['gold-cap-warning'].hidden,true);
  assert.equal(h.dom['gold-cap-warning'].textContent,'');
  assert.equal(h.state.hero.gold,1e12-1);
});
test('gold capacity hint has a status role and no interactive action', () => {
  const state=createGame(54); state.hero.gold=1e12;
  const h=fullUI(state), hint=h.dom['gold-cap-warning'];
  assert.equal(hint.attributes.role,'status');
  assert.equal(hint.querySelectorAll('button').length,0);
  assert.equal(hint.tag,'p');
});
