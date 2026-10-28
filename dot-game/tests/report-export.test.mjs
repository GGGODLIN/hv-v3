import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine.js';
import { fullUI, clone } from './helpers/comparison-focus-harness.mjs';
function setup(){const h=fullUI(); h.run(`globalThis.downloads=[]; globalThis.revoked=[];globalThis.timers=[];
 globalThis.Blob=class { constructor(parts, options){this.parts=parts;this.type=options.type;} };
 globalThis.URL={createObjectURL(blob){downloads.push(blob);return 'blob:report-'+downloads.length;},revokeObjectURL(url){revoked.push(url);}};
 globalThis.setTimeout=(fn,delay)=>{timers.push({fn,delay});return timers.length;};`);return h;}
function finish(h){h.run("dispatch('start');"); for(let i=0;i<4000 && !h.state.wins && h.state.mode!=='defeat';i++)h.run('advance(state,.25)');h.render();assert.equal(h.state.wins,1);}
test('latest ended report download is detached JSON, never a save or state mutation',async()=>{
 const h=setup();finish(h);const report=engine.expeditionReports(h.state)[0],before=JSON.stringify(h.state),writes=clone(h.writes),calls=clone(h.calls);
 assert.equal(h.dom['export-report'].disabled,false);await h.dom['export-report'].click();
 const blob=h.run('downloads[0]'),record=JSON.parse(blob.parts.join(''));
 assert.equal(blob.type,'application/json');assert.equal(record.format,'hv-v3-dot-expedition-report');assert.equal(record.version,1);assert.ok(Number.isFinite(Date.parse(record.exportedAt)));assert.deepEqual(record.report,report);assert.match(record.notice,/不是遊戲存檔/);assert.equal(record.hero,undefined);assert.equal(record.inventory,undefined);assert.equal(record.rng,undefined);assert.equal(record.state,undefined);
 assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.writes,writes);assert.deepEqual(h.calls,calls);assert.equal(h.document.body.children.filter(x=>x.tag==='a').length,0);
 assert.match(h.dom.toast.textContent,/準備下載/);assert.doesNotMatch(h.dom.toast.textContent,/已保存/);
 h.run('timers.find(t=>t.delay===10000).fn()');assert.deepEqual(clone(h.run('revoked')),['blob:report-1']);
});
test('empty report stays disabled and forced handler does not create download',async()=>{const h=setup();assert.equal(h.dom['export-report'].disabled,true);h.run('exportRecentExpeditionReport()');assert.equal(h.run('downloads.length'),0);assert.match(h.dom.toast.textContent,/還沒有/);});
test('current in-progress run does not replace last completed report, readonly can export',async()=>{const h=setup();finish(h);const ended=clone(engine.expeditionReports(h.state)[0]);h.run('advance(state,.25)');h.run('tabOwner=false');h.render();await h.dom['export-report'].click();assert.deepEqual(JSON.parse(h.run('downloads[0].parts.join(\"\")')).report,ended);assert.equal(h.dom['export-report'].disabled,false);});
test('download failure is honest, cleans link and URL, preserves report and game',()=>{const h=setup();finish(h);const before=JSON.stringify(h.state);h.run(`const originalCreateElement=document.createElement;document.createElement=tag=>{const el=originalCreateElement(tag);if(tag==='a')el.click=()=>{throw Error('blocked')};return el;};`);h.run('exportRecentExpeditionReport()');assert.match(h.dom.toast.textContent,/匯出失敗/);assert.equal(JSON.stringify(h.state),before);assert.deepEqual(clone(h.run('revoked')),['blob:report-1']);assert.equal(h.document.body.children.filter(x=>x.tag==='a').length,0);});
