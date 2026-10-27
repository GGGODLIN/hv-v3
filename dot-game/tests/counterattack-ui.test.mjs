import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const js=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const extract=(from,to)=>js.slice(js.indexOf(`function ${from}(`),js.indexOf(`function ${to}(`));
function node(tag='div',className='',text=''){return {tag,className,textContent:text,children:[],hidden:true,style:{},classList:{add(){},remove(){}},append(...items){this.children.push(...items)},remove(){},replaceChildren(...items){this.children=items}};}
const collect=e=>[e.textContent,...e.children.map(collect)].join(' ');
function viewHarness(overrides={},mode='town'){
 const dom=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],node()]));
 const state={mode,equipment:{weapon:{weaponFamily:'club'}}};
 const view={eligible:true,chance:.2532,maxPerTurn:1,usedThisTurn:0,remainingThisTurn:1,effectiveProficiency:0,...overrides};
 const context={state,$:id=>dom[id],counterattackView:()=>view,resolveWeaponFamily:item=>item.weaponFamily,weaponFamilyNames:{club:'戰棍'},format:n=>String(Math.round(Number(n)||0))};
 runInNewContext(`${extract('renderCounterattack','render')} renderCounterattack();`,context);
 return {dom,state,view};
}
test('camp advertises conditional chance, actual proficiency and cap without pretending overall trigger rate',()=>{
 const h=viewHarness();assert.match(h.dom['counterattack-status'].textContent,/戰棍.*熟練度 0/);assert.equal(h.dom['counterattack-chance'].textContent,'符合招架／格擋條件後，25.32% 機率反擊');assert.match(h.dom['counterattack-budget'].textContent,/最多 1 次.*出發時重新計數/);
});
test('unknown starter is visibly ineligible rather than offering a fabricated trigger chance',()=>{
 const h=viewHarness({eligible:false});assert.match(h.dom['counterattack-status'].textContent,/未啟用.*入門鈍劍不適用/);assert.equal(h.dom['counterattack-chance'].textContent,'目前武器不會發起反擊');
});
test('battle budget uses initiated action count including blocked attempts',()=>{
 const h=viewHarness({chance:.75,maxPerTurn:3,usedThisTurn:2,remainingThisTurn:1,effectiveProficiency:200},'battle');assert.match(h.dom['counterattack-budget'].textContent,/最多 3 次 · 本回合已發起 2 次，剩 1 次/);assert.match(h.dom['counterattack-chance'].textContent,/75%/);
});
test('render reads view without mutating state or inventing a toggle',()=>{
 const h=viewHarness();assert.deepEqual(h.state,{mode:'town',equipment:{weapon:{weaponFamily:'club'}}});assert.doesNotMatch(html,/id="counterattack-(toggle|enable)"/);
});
function eventHarness(events,reducedMotion=true){
 const dom=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],node()]));const timers=new Map();let next=0;
 const context={state:{events,mode:'town',enemies:[]},prefs:{reducedMotion},$:id=>dom[id],node,format:n=>String(Math.round(Number(n)||0)),playSound(){},setTimeout(fn,delay){timers.set(++next,{fn,delay});return next;},clearTimeout(id){timers.delete(id)}};
 runInNewContext(`let counterTimer,bleedTimer,procTimer,recoveryTimer,procTargetId,recoveryTargetId,bannerTimer,lastProcessedEvent;let attackPulse=0,enemyPulse=0,flash=0;const seenEvents=new Set();const particles=[];${extract('eventEffects','setMeter')} eventEffects();`,context);
 return {dom,timers,run:s=>runInNewContext(s,context)};
}
const counter=(id,value=17)=>({id,type:'counter',effect:'counter',text:value?'反擊':'反擊未造成傷害',value,target:'dead-old-wave-target'});
test('counter remains readable after target death and at camp with reduced motion',()=>{
 const h=eventHarness([counter(1)]);assert.equal(h.dom['counter-notice'].hidden,false);assert.match(h.dom['counter-notice'].textContent,/最近反擊.*17 傷害.*不計入普攻／技能/);assert.equal(h.dom['floating-layer'].children.length,0);assert.equal([...h.timers.values()][0].delay,3200);
});
test('zero-damage initiated counter is explicit, not a miss or critical claim',()=>{
 const h=eventHarness([counter(2,0)]);assert.match(h.dom['counter-notice'].textContent,/反擊未造成傷害 · 0 傷害/);assert.doesNotMatch(h.dom['counter-notice'].textContent,/暴擊/);
});
test('animated counter uses distinct label and never a critical class',()=>{
 const h=eventHarness([counter(3)],false);const item=h.dom['floating-layer'].children[0];assert.equal(item.className,'floating-number counter');assert.equal(item.textContent,'反擊 17');
});
test('same event does not replay while latest event replaces bounded notice honestly',()=>{
 const h=eventHarness([counter(4),counter(5,22)]);assert.match(h.dom['counter-notice'].textContent,/最近反擊.*22 傷害/);const timers=h.timers.size;h.run('eventEffects();');assert.equal(h.timers.size,timers);assert.equal(h.dom['counter-notice'].hidden,false);
});
test('notice expires and resync explicitly clears its timer and visibility',()=>{
 const h=eventHarness([counter(6)]);[...h.timers.values()][0].fn();assert.equal(h.dom['counter-notice'].hidden,true);assert.match(extract('syncSelection','dispatch'),/\$\('counter-notice'\)\.hidden = true; clearTimeout\(counterTimer\)/);
});
test('report separates counter HP removal and initiated counts; old missing fields display zero',()=>{
 const report={stage:1,level:1,endLevel:1,weapon:{family:'club',name:'棍'},strategy:'balanced',outcome:'win',elapsed:1,damage:{basic:10,skill:20,bleed:3},survival:{hpLost:2,minHpPercent:99},actions:{attacks:2,skills:1,heals:0,potions:0,manaSpent:3},procs:{bleeding:0,penetratedArmor:0,stun:0}};
 const render=()=>runInNewContext(`${extract('expeditionReportCard','renderExpeditionReports')} expeditionReportCard(report,'測試')`,{report,node,weaponFamilyNames:{club:'戰棍'},STRATEGIES:[{id:'balanced',label:'均衡'}],format:n=>String(Math.round(Number(n)||0))});
 assert.match(collect(render()),/普攻 10 · 技能 20 · 流血 3 · 反擊 0/);report.damage.counter=7;report.actions.counters=2;assert.match(collect(render()),/反擊 7/);assert.match(collect(render()),/額外反擊次數 2（含未造成傷害；不佔上述攻擊回合）/);
});
test('rules name incomplete original subset and partial-defense adaptation',()=>{
 for(const fragment of ['部分招架／格擋也列為資格','不是已考證的原版部分防禦規則','尚無原版反擊暈眩','Overcharge／Overwhelming Strikes','不施加或刷新穿透護甲、流血、暈眩','純閃避不觸發','不是每次受擊機率'])assert.ok(html.includes(fragment),fragment);
});
test('status/notice layout is semantic, wrap-safe, and version marked',()=>{
 assert.match(html,/aria-labelledby="counterattack-heading"/);assert.match(html,/id="counter-notice"[^>]*role="status"[^>]*aria-live="polite"/);assert.match(css,/\.counterattack-panel \{[^}]*min-width: 0/);assert.match(css,/\.counter-damage-notice \{[^}]*overflow-wrap: anywhere/);assert.match(html,/v0\.43 ·/);
});
