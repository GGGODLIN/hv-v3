import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as engine from '../src/engine.js';
const source = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const extract = (name, next) => source.slice(source.indexOf(`function ${name}(`), source.indexOf(`function ${next}(`));
const node = (tag, className = '', text = '') => ({ tag, className, textContent: String(text), children: [], hidden: false,
  append(...children) { this.children.push(...children); }, replaceChildren(...children) { this.children = children; } });
const flatten = element => [element.textContent, ...element.children.map(flatten)].join(' ');
function harness(state, tabOwner = true) {
  const dom = Object.fromEntries(['target-priority-select','target-priority-description','target-priority-live'].map(id => [id, node('div')]));
  const context = { ...engine, state, tabOwner, $: id => dom[id] };
  runInNewContext(extract('renderTargetPriority', 'render'), context);
  return { dom, context, render: () => runInNewContext('renderTargetPriority()', context) };
}
test('camp target selector uses engine policy with exact tradeoff and leaves save/RNG untouched', () => {
  const state = engine.createGame(32), h = harness(state);
  for (const [policy, cue] of [['front','既定順序'],['caster','即使下一動是物理攻擊'],['weakest','不是血量百分比']]) {
    engine.act(state,'targetPriority',policy);
    const before = JSON.stringify(state); h.render();
    assert.equal(h.dom['target-priority-select'].value,policy);
    assert.equal(h.dom['target-priority-select'].disabled,false);
    assert.match(h.dom['target-priority-description'].textContent,new RegExp(cue));
    assert.equal(h.dom['target-priority-live'].hidden,true);
    assert.equal(JSON.stringify(state),before);
  }
});
test('battle/live caption follows real selected enemy and tells the exception rules', () => {
  const state = engine.createGame(82); engine.act(state,'targetPriority','caster'); engine.act(state,'start');
  state.enemies = [{id:'a',name:'前方',hp:100},{id:'b',name:'施法者',hp:70,attackPattern:'alternating'}];
  const h=harness(state); h.render();
  assert.equal(h.dom['target-priority-select'].disabled,true);
  assert.equal(h.dom['target-priority-live'].hidden,false);
  assert.match(h.dom['target-priority-live'].textContent,/目前集火：施法者/);
  assert.match(h.dom['target-priority-live'].textContent,/治癒／護盾仍優先，反擊仍打攻擊者/);
  state.enemies[1].hp=0; h.render();
  assert.match(h.dom['target-priority-live'].textContent,/目前集火：前方/);
  state.mode='town'; h.render(); assert.equal(h.dom['target-priority-live'].hidden,true);
});
test('read-only and defeated views disable editing; stale change event cannot dispatch', () => {
  const state=engine.createGame(4),h=harness(state,false); h.render();
  assert.equal(h.dom['target-priority-select'].disabled,true);
  assert.match(h.dom['target-priority-description'].textContent,/唯讀分頁/);
  h.context.tabOwner=true; state.mode='defeat'; h.render();
  assert.equal(h.dom['target-priority-select'].disabled,true);
  const start=source.indexOf("$('target-priority-select').addEventListener('change'");
  const end=source.indexOf("$('auto-protection').addEventListener",start);
  let listener, calls=0, renders=0;
  const context={state,tabOwner:true,$:()=>({addEventListener:(name,fn)=>listener=fn}),renderTargetPriority:()=>renders++,dispatch:()=>calls++};
  runInNewContext(source.slice(start,end),context);
  listener({target:{value:'caster'}}); assert.equal(calls,0); assert.equal(renders,1);
  state.mode='town';context.tabOwner=false;listener({target:{value:'weakest'}});assert.equal(calls,0);
  context.tabOwner=true;listener({target:{value:'caster'}});assert.equal(calls,1);
  const staleBefore=renders; context.dispatch=()=>false;listener({target:{value:'weakest'}});
  assert.equal(renders,staleBefore+1,'failed lease acquisition repaints the native selector from unchanged state');
});
test('enemy cards label actual selected target and refresh when policy changes without HP changes', () => {
  const state=engine.createGame(42);engine.act(state,'start');
  state.enemies=[{id:'a',name:'前方',hp:100},{id:'b',name:'施法者',hp:70,attackPattern:'alternating'}];
  const dom=Object.fromEntries(['enemy-status-panel','enemy-status-list','proc-notice','recovery-notice'].map(id=>[id,node('div')]));
  const context={...engine,state,node,$:id=>dom[id],format:value=>String(Math.round(value)),clearTimeout(){}};
  runInNewContext(`${extract('enemyRolePresentation','renderRoutePreview')} let lastEnemyStatusSignature='';let procTargetId=null;let procTimer;let recoveryTargetId=null;let recoveryTimer;${extract('renderEnemyStatuses','renderCounterattack')}`,context);
  runInNewContext('renderEnemyStatuses()',context);
  assert.match(flatten(dom['enemy-status-list'].children[0]),/目標 · 前方/);
  // Renderer fixture changes policy directly only to test signature invalidation;
  // gameplay action guards and genuine selection are tested separately.
  state.targetPriority='caster';runInNewContext('renderEnemyStatuses()',context);
  assert.doesNotMatch(flatten(dom['enemy-status-list'].children[0]),/目標 ·/);
  assert.match(flatten(dom['enemy-status-list'].children[1]),/目標 · 施法者/);
});
test('target UI is labelled, text-visible without motion, and not presented as original AI or an optimum', () => {
  assert.match(html,/label for="target-priority-select">集火策略/);
  assert.match(html,/id="target-priority-select" aria-describedby="target-priority-description target-priority-scope"/);
  assert.match(html,/本作自動選敵改編，非原版自動 AI/);
  assert.match(html,/沒有保證最佳策略/);
  assert.match(css,/\.target-priority-live\[hidden\]/);
  assert.match(extract('drawEnemy','drawScene'),/enemy\.id === targetPriorityView\(state\)\.targetId/);
  assert.match(extract('drawEnemy','drawScene'),/▼ 集火/);
  assert.doesNotMatch(extract('renderTargetPriority','render'),/act\(|dispatch\(|Math\.random|\.innerHTML/);
});
