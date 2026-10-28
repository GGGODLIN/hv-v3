import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import { fullUI, clone } from './helpers/comparison-focus-harness.mjs';

function finish(h) {
  const wins=h.state.wins;
  if(h.state.mode==='town') h.run("dispatch('start')");
  for(let n=0;n<4000 && h.state.wins===wins && h.state.mode!=='defeat';n++)h.run('advance(state,.25)');
  assert.equal(h.state.wins,wins+1);h.render();
  return clone(engine.expeditionReports(h.state)[0]);
}
const snapshot=h=>({state:JSON.stringify(h.state),reports:clone(engine.expeditionReports(h.state)),writes:clone(h.writes),calls:clone(h.calls)});
function unchanged(h,before){assert.deepEqual(snapshot(h),before);assert.deepEqual(h.faults,[]);}

test('audit: empty disabled clear is a no-op even when directly invoked',async()=>{
  const h=fullUI(), before=snapshot(h);
  assert.equal(h.dom['clear-pinned-report'].disabled,true);
  await h.dom['clear-pinned-report'].click();h.run('clearPinnedExpeditionReport()');
  assert.equal(h.run('pinnedExpeditionReport'),null);unchanged(h,before);
});
test('audit: clear removes only pinned snapshot and leaves the latest two reports intact',async()=>{
  const h=fullUI();const first=finish(h);await h.dom['pin-report'].click();
  finish(h);finish(h);
  assert.deepEqual(clone(h.run('pinnedExpeditionReport')),first);
  const before=snapshot(h);await h.dom['clear-pinned-report'].click();
  assert.equal(h.run('pinnedExpeditionReport'),null);assert.equal(h.dom['pinned-report'].hidden,true);
  assert.equal(h.dom['pinned-report'].children.length,0);assert.equal(h.dom['clear-pinned-report'].disabled,true);
  assert.equal(h.dom['expedition-report-list'].children.length,2);assert.equal(h.dom['export-report'].disabled,false);
  assert.doesNotMatch(h.dom['report-status'].textContent,/比較基準已保留/);unchanged(h,before);
});
test('audit: clear then repin uses latest completed report, not stale baseline',async()=>{
  const h=fullUI();const first=finish(h);await h.dom['pin-report'].click();const latest=finish(h);
  assert.notDeepEqual(first,latest);await h.dom['clear-pinned-report'].click();const before=snapshot(h);
  await h.dom['pin-report'].click();assert.deepEqual(clone(h.run('pinnedExpeditionReport')),latest);
  assert.equal(h.dom['clear-pinned-report'].disabled,false);unchanged(h,before);
});
test('audit: readonly in-progress combat may clear only local comparison',async()=>{
  const h=fullUI();finish(h);await h.dom['pin-report'].click();
  h.run('advance(state,.25); tabOwner=false');h.render();
  assert.equal(h.state.mode,'battle');assert.equal(h.dom['clear-pinned-report'].disabled,false);
  const before=snapshot(h);await h.dom['clear-pinned-report'].click();unchanged(h,before);
  assert.equal(h.run('pinnedExpeditionReport'),null);
});
test('audit: clearing focused button lands on enabled repin and repeat clear is inert',async()=>{
  const h=fullUI();finish(h);await h.dom['pin-report'].click();h.dom['clear-pinned-report'].focus();
  assert.equal(h.document.activeElement,h.dom['clear-pinned-report']);await h.dom['clear-pinned-report'].click();
  assert.equal(h.document.activeElement,h.dom['pin-report']);assert.equal(h.dom['pin-report'].disabled,false);
  const before=snapshot(h),focusCount=h.focusEvents.length;await h.dom['clear-pinned-report'].click();
  assert.equal(h.focusEvents.length,focusCount);unchanged(h,before);
});
test('audit: importing a different journey clears pin and disables clear without requiring use',async()=>{
  const h=fullUI();finish(h);await h.dom['pin-report'].click();assert.equal(h.dom['clear-pinned-report'].disabled,false);
  await h.import(engine.createGame(99));assert.equal(h.run('pinnedExpeditionReport'),null);
  assert.equal(h.dom['clear-pinned-report'].disabled,true);const before=snapshot(h);h.run('clearPinnedExpeditionReport()');unchanged(h,before);
});
