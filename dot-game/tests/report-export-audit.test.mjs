import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import { fullUI, clone } from './helpers/comparison-focus-harness.mjs';

// Independent full production UI test. DOM/download APIs are simulated;
// this proves controller contracts, not a browser or filesystem download.
function harness() {
  const h = fullUI(engine.createGame(42));
  h.run(`globalThis.exportBlobs=[]; globalThis.exportUrls=[]; globalThis.revokedUrls=[]; globalThis.exportTimers=[];
    globalThis.Blob=class { constructor(parts,options){ this.parts=parts;this.type=options.type;exportBlobs.push(this); } };
    globalThis.URL={createObjectURL(blob){const url='blob:audit-'+exportUrls.length;exportUrls.push(url);return url;},revokeObjectURL(url){revokedUrls.push(url);}};
    globalThis.setTimeout=(fn,ms)=>{exportTimers.push({fn,ms});return exportTimers.length;};`);
  const links=[];
  const create=h.document.createElement;
  h.document.createElement=tag=>{const el=create(tag);if(tag==='a'){links.push(el);el.click=()=>{el.clicked=true;if(h.failClick)throw Error('download blocked');};}return el;};
  return Object.assign(h,{links,payload(){return JSON.parse(h.run('exportBlobs.at(-1).parts.join("")'));},cleanup(){h.run('for(const timer of exportTimers)timer.fn();');}});
}
function finish(h) {
  const wins=h.state.wins;
  if(h.state.mode==='town')h.run("dispatch('start');");
  for(let i=0;i<5000 && h.state.wins===wins && h.state.mode!=='defeat';i++)h.run('advance(state,.25);');
  assert.equal(h.state.wins,wins+1,'natural starter expedition completed within bound');
  h.render();
  return clone(engine.expeditionReports(h.state)[0]);
}
function snapshot(h){return {state:JSON.stringify(h.state),calls:JSON.stringify(h.calls),writes:JSON.stringify(h.writes),pin:JSON.stringify(h.run('pinnedExpeditionReport'))};}

test('audit: empty or just-started expedition has no export or payload',async()=>{
 const h=harness();assert.equal(h.dom['export-report'].disabled,true);await h.dom['export-report'].click();assert.equal(h.links.length,0);
 h.run("dispatch('start');");h.render();assert.equal(h.dom['export-report'].disabled,true);h.run('exportRecentExpeditionReport();');assert.equal(h.links.length,0);assert.equal(h.run('exportBlobs.length'),0);
});
test('audit: natural completed report downloads only the detached report envelope',async()=>{
 const h=harness(),expected=finish(h),before=snapshot(h);assert.equal(h.dom['export-report'].disabled,false);await h.dom['export-report'].click();
 const value=h.payload();assert.equal(value.format,'hv-v3-dot-expedition-report');assert.equal(value.version,1);assert.deepEqual(value.report,expected);assert.ok(Number.isFinite(Date.parse(value.exportedAt)));assert.equal(typeof value.notice,'string');assert.ok(value.notice.length>0);
 assert.deepEqual(Object.keys(value).sort(),['exportedAt','format','notice','report','version']);assert.ok(!('hero' in value)&&!('inventory' in value)&&!('rng' in value));assert.equal(h.run('exportBlobs[0].type'),'application/json');assert.match(h.links[0].download,/\.json$/);assert.equal(h.links[0].clicked,true);assert.equal(h.links[0].isConnected,false);assert.deepEqual(snapshot(h),before);h.cleanup();assert.deepEqual(clone(h.run('revokedUrls')),clone(h.run('exportUrls')));
});
test('audit: readonly active fight exports the latest ended report, not pin or live fight',async()=>{
 const h=harness();finish(h);await h.dom['pin-report'].click();const pinned=clone(h.run('pinnedExpeditionReport'));const expected=finish(h);h.run("dispatch('start'); tabOwner=false;");h.render();const before=snapshot(h);
 assert.equal(h.dom['export-report'].disabled,false);await h.dom['export-report'].click();assert.deepEqual(h.payload().report,expected);assert.deepEqual(clone(h.run('pinnedExpeditionReport')),pinned);assert.deepEqual(snapshot(h),before);assert.deepEqual(h.faults,[]);
});
test('audit: download click failure cleans temporary anchor and URL without changing progress',async()=>{
 const h=harness();finish(h);h.failClick=true;const before=snapshot(h);await h.dom['export-report'].click();h.cleanup();assert.deepEqual(snapshot(h),before);assert.equal(h.links.length,1);assert.equal(h.links[0].isConnected,false);assert.deepEqual(clone(h.run('revokedUrls')),clone(h.run('exportUrls')));assert.match(h.dom.toast.textContent,/失敗/);
});
test('audit: Blob construction failure cannot mutate state or create a lingering link',async()=>{
 const h=harness();finish(h);h.run('globalThis.Blob=class{constructor(){throw Error("quota");}}');const before=snapshot(h);await h.dom['export-report'].click();assert.deepEqual(snapshot(h),before);assert.equal(h.links.length,0);assert.equal(h.run('exportUrls.length'),0);assert.match(h.dom.toast.textContent,/失敗/);
});
test('audit: importing another journey clears export availability rather than exporting stale report',async()=>{
 const h=harness();finish(h);await h.import(engine.createGame(78));assert.equal(h.dom['export-report'].disabled,true);const before=snapshot(h);h.run('exportRecentExpeditionReport();');assert.equal(h.links.length,0);assert.deepEqual(snapshot(h),before);
});
