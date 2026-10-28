import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,validateSave} from '../src/engine.js';
import {fullUI,clone} from './helpers/comparison-focus-harness.mjs';
const source=process.env.RESOURCE_AUDIT_UI_SOURCE?readFileSync(process.env.RESOURCE_AUDIT_UI_SOURCE,'utf8'):undefined;
const setup=()=>fullUI(createGame(1),{source});
function unchanged(h){
 const before=JSON.stringify(h.state),reports=h.run('JSON.stringify(expeditionReports(state))'),calls=clone(h.calls),writes=clone(h.writes);
 h.render();h.render(false);
 assert.equal(JSON.stringify(h.state),before);assert.equal(h.run('JSON.stringify(expeditionReports(state))'),reports);
 assert.deepEqual(h.calls,calls);assert.deepEqual(h.writes,writes);assert.deepEqual(h.faults,[]);
}
for(const [pool,cap] of [['hp','Hp'],['mp','Mp']]){
 test(`resource audit: ${pool} true zero remains zero`,()=>{const h=setup();h.run(`state.hero.${pool}=0`);unchanged(h);assert.equal(h.dom[pool+'-label'].textContent,`0 / ${h.run(`format(stats(state).max${cap})`)}`);});
 test(`resource audit: ${pool} true full has no partial warning`,()=>{const h=setup();h.run(`state.hero.${pool}=stats(state).max${cap}`);unchanged(h);const max=h.run(`format(stats(state).max${cap})`);assert.equal(h.dom[pool+'-label'].textContent,`${max} / ${max}`);});
 test(`resource audit: ${pool} positive fraction is not reported as zero`,()=>{const h=setup();h.run(`state.hero.${pool}=.4`);unchanged(h);assert.equal(h.dom[pool+'-label'].textContent,`<1 / ${h.run(`format(stats(state).max${cap})`)}`);});
 test(`resource audit: ${pool} tiny positive remains explicitly positive`,()=>{const h=setup();h.run(`state.hero.${pool}=Number.MIN_VALUE`);unchanged(h);assert.match(h.dom[pool+'-label'].textContent,/^<1 \/ /);});
 test(`resource audit: ${pool} almost full is not called full`,()=>{const h=setup();h.run(`state.hero.${pool}=stats(state).max${cap}-.2`);unchanged(h);assert.match(h.dom[pool+'-label'].textContent,/（未滿）$/);});
 test(`resource audit: ${pool} ordinary integers retain compact format`,()=>{const h=setup();h.run(`state.hero.${pool}=7`);unchanged(h);assert.equal(h.dom[pool+'-label'].textContent,`7 / ${h.run(`format(stats(state).max${cap})`)}`);});
}
test('resource audit: actual natural combat produces fractional values without render mutation',()=>{
 const h=setup();h.run("act(state,'start')");let sawHp=false,sawMp=false;
 for(let i=0;i<1000&&h.state.mode==='battle';i++){
  h.run('advance(state,.1)');sawHp ||= h.state.hero.hp%1!==0;sawMp ||= h.state.hero.mp%1!==0;
  unchanged(h);assert.doesNotMatch(h.dom['hp-label'].textContent+h.dom['mp-label'].textContent,/NaN|Infinity|∞/);
  if(sawHp&&sawMp)break;
 }
 assert.ok(sawHp);assert.ok(sawMp);
});
test('resource audit: fractional maximum, sub-one maximum and large values retain true boundaries',()=>{
 const h=setup();
 const fn=(c,m)=>h.run(`typeof resourcePoolText==='function'?resourcePoolText(${c},${m}):format(${c})+' / '+format(${m})`);
 assert.equal(fn(575.3,575.4),'575 / 575（未滿）');assert.equal(fn(575.4,575.4),'575 / 575');
 assert.equal(fn(.2,.4),'<1 / <1（未滿）');assert.equal(fn(.4,.4),'<1 / <1');assert.equal(fn(0,.4),'0 / <1');
 assert.equal(fn(999999.8,1000000),'1,000,000 / 1,000,000（未滿）');
});
test('resource audit: markup exposes visible labels without contradictory ARIA values',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 for(const pool of ['hp','mp']){
  assert.match(html,new RegExp(`<strong id="${pool}-label">`));
  assert.doesNotMatch(html.match(new RegExp(`<[^>]+id="${pool}-label"[^>]*>`))[0],/aria-label|aria-valuenow|aria-valuetext/);
 }
});

test('resource audit: imported nonfinite transient pools are recovered before display',()=>{
 const input=createGame(1);input.hero.hp=NaN;input.hero.mp=Infinity;
 const safe=validateSave(input);assert.ok(Number.isFinite(safe.hero.hp));assert.ok(Number.isFinite(safe.hero.mp));
 const h=fullUI(safe,{source});unchanged(h);
 assert.doesNotMatch(h.dom['hp-label'].textContent+h.dom['mp-label'].textContent,/NaN|Infinity|∞/);
});
