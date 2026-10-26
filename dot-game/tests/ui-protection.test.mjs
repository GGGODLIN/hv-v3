import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const js=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const extract=(from,to)=>js.slice(js.indexOf(`function ${from}(`),js.indexOf(`function ${to}(`));
function node(tag='div',className='',text=''){return {tag,className,textContent:text,children:[],hidden:true,append(...items){this.children.push(...items)}};}
const collect=e=>[e.textContent,...e.children.map(collect)].join(' ');
function harness(overrides={},mode='town',tabOwner=true){
 const dom=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],node()]));
 const state={mode};const view={enabled:false,unlocked:true,unlockLevel:10,manaCost:3,durationTicks:15,active:false,remainingTicks:0,casts:0,damagePrevented:0,...overrides};
 const ctx={state,tabOwner,$:id=>dom[id],protectionView:()=>view,format:n=>String(Math.round(Number(n)||0))};
 runInNewContext(`${extract('renderProtection','render')} renderProtection();`,ctx);return {dom,state,view,ctx};
}
test('Protection starts off and describes opportunity cost rather than mandatory upgrade',()=>{
 const {dom}=harness();assert.equal(dom['auto-protection'].checked,false);assert.equal(dom['auto-protection'].disabled,false);assert.equal(dom['protection-live'].hidden,true);assert.match(dom['protection-cost'].textContent,/3 MP.*15 Tick.*取代一次攻擊/);assert.match(dom['protection-status'].textContent,/省下魔力與施法回合/);
});
test('locked level and noncamp/read-only states disable configuration',()=>{
 const locked=harness({unlocked:false});assert.equal(locked.dom['auto-protection'].disabled,true);assert.match(locked.dom['protection-status'].textContent,/Lv.10 解鎖/);
 for(const mode of ['battle','defeat'])assert.equal(harness({},mode).dom['auto-protection'].disabled,true);
 const read=harness({},'town',false);assert.equal(read.dom['auto-protection'].disabled,true);assert.match(read.dom['protection-status'].textContent,/唯讀/);
});
test('active and waiting readouts preserve current session facts with growth hidden',()=>{
 const active=harness({enabled:true,active:true,remainingTicks:12,casts:2,damagePrevented:34},'battle');assert.equal(active.dom['protection-live'].hidden,false);assert.match(active.dom['protection-live'].textContent,/剩 12 Tick.*施放 2 次.*減免 34 傷害/);
 const wait=harness({enabled:true},'battle');assert.match(wait.dom['protection-live'].textContent,/待命.*3 MP／次/);assert.match(wait.dom['protection-status'].textContent,/本回合已治癒時不施盾.*不足施盾費用就照常攻擊/);
 assert.ok(html.indexOf('id="protection-live"')<html.indexOf('id="camp-panel-growth"'));
});
test('render mutates presentation only and updates existing control without replacing focus',()=>{
 const h=harness({enabled:true});assert.deepEqual(h.state,{mode:'town'});assert.doesNotMatch(extract('renderProtection','render'),/replaceChildren|innerHTML|focus\(/);assert.match(js,/renderCounterattack\(\);\s+renderProtection\(\);/);
});
test('toggle dispatch is boolean and guards stale read-only, battle and locked events',()=>{
 const code=js.slice(js.indexOf("$('auto-protection').addEventListener"),js.indexOf("\n});",js.indexOf("$('auto-protection').addEventListener"))+4);
 for(const [mode,owner,unlocked,allowed] of [['town',true,true,true],['battle',true,true,false],['town',false,true,false],['town',true,false,false]]){
  let handler;const calls=[];let renders=0;runInNewContext(code,{$:()=>({addEventListener:(_,fn)=>handler=fn}),state:{mode},tabOwner:owner,protectionView:()=>({unlocked}),renderProtection:()=>renders++,dispatch:(...args)=>calls.push(args)});handler({target:{checked:true}});
  assert.equal(calls.length,allowed?1:0);if(allowed)assert.deepEqual(calls[0],['autoProtection',true]);else assert.equal(renders,1);
 }
});
test('report adds shield tradeoff only when engine supplies it; legacy reports remain supported',()=>{
 const report={stage:1,level:10,endLevel:10,weapon:{family:'club',name:'棍'},strategy:'balanced',outcome:'win',elapsed:1,damage:{basic:10,skill:20,bleed:3},survival:{hpLost:2,minHpPercent:99},actions:{attacks:2,skills:1,heals:0,potions:0,manaSpent:3},procs:{bleeding:0,penetratedArmor:0,stun:0}};
 const render=()=>runInNewContext(`${extract('expeditionReportCard','renderExpeditionReports')} expeditionReportCard(report,'測試')`,{report,node,weaponFamilyNames:{club:'戰棍'},STRATEGIES:[{id:'balanced',label:'均衡'}],format:n=>String(Math.round(Number(n)||0))});
 assert.doesNotMatch(collect(render()),/護盾取捨/);report.protection={casts:3,damagePrevented:62};assert.match(collect(render()),/護盾取捨 施放 3 次（各取代一次攻擊） · 減免 62 傷害/);
});
test('semantic controls and honest research uncertainty remain explicit',()=>{
 assert.match(html,/aria-labelledby="protection-heading"/);assert.match(html,/id="auto-protection" aria-describedby="protection-cost protection-status"/);
 for(const phrase of ['解鎖等級 10?','基礎時長 15?','不是最大 MP 的 25%','不是原版 Innate Arcana','未實作 supportive 熟練度','不是減傷率直接 +25 百分點'])assert.ok(html.includes(phrase),phrase);
 assert.match(css,/\.protection-panel \{[^}]*min-width: 0/);assert.match(css,/\.protection-live \{[^}]*overflow-wrap: anywhere/);
});
