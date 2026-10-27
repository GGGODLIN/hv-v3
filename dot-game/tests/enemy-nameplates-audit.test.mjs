import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';
import * as engine from '../src/engine.js';
import * as loot from '../src/loot.js';
import { fullUI, collect } from './helpers/comparison-focus-harness.mjs';

// Independent source/command/DOM audit. The deterministic measureText below is
// NOT a browser font engine, rasterizer, screenshot or accessibility-tree test.
const baseline = process.env.HV_NAMEPLATE_AUDIT_BASELINE;
const read = path => readFileSync(baseline ? resolve(baseline, path) : new URL(`../${path}`, import.meta.url), 'utf8');
const source = read('src/ui.js'), html = read('index.html');
const section = (name, next) => source.slice(source.indexOf(`function ${name}(`), source.indexOf(`function ${next}(`));
const helpers = section('enemyRolePresentation', 'renderRoutePreview');
const drawing = section('rect', 'drawScene');
const sha = value => createHash('sha256').update(value).digest('hex');
const copy = value => JSON.parse(JSON.stringify(value));
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const finite = values => values.forEach(value => assert.ok(Number.isFinite(value), `nonfinite canvas number: ${value}`));
const names = ['灰霧獵犬', '碎晶甲蟲', '荒野影獸', '赤砂守衛'];

function recorder() {
  let matrix = [1,0,0,1,0,0], path = [], bodyDone = false;
  let style = {fillStyle:'#000',strokeStyle:'#000',globalAlpha:1,lineWidth:1,font:'10px sans-serif',textAlign:'start',textBaseline:'alphabetic'};
  const stack = [], paints = [], texts = [], events = [];
  const point = (x,y) => { finite([x,y]); const [a,b,c,d,e,f]=matrix;return [a*x+c*y+e,b*x+d*y+f]; };
  const paint = (kind,points) => { const record={kind,points:copy(points),body:!bodyDone,...style};paints.push(record);events.push(record); };
  const ellipse = (x,y,rx,ry,r) => {
    const [a,b,c,d]=matrix,center=point(x,y),co=Math.cos(r),si=Math.sin(r);
    const ex=Math.hypot(rx*(a*co+c*si),ry*(-a*si+c*co)),ey=Math.hypot(rx*(b*co+d*si),ry*(-b*si+d*co));
    return [[center[0]-ex,center[1]-ey],[center[0]+ex,center[1]+ey]];
  };
  const measure = text => {
    const size=Number(style.font.match(/([\d.]+)px/)?.[1]||10);
    return [...String(text)].reduce((sum,ch)=>sum+size*(/[^\x00-\x7f]/.test(ch)?1:/[ilI1 .·]/.test(ch)?.34:.64),0);
  };
  const ctx = {
    save(){stack.push({matrix:[...matrix],style:{...style}});},
    restore(){assert.ok(stack.length,'unbalanced canvas restore');({matrix,style}=stack.pop());if(!stack.length)bodyDone=true;},
    translate(x,y){finite([x,y]);const[a,b,c,d,e,f]=matrix;matrix=[a,b,c,d,a*x+c*y+e,b*x+d*y+f];},
    scale(x,y){finite([x,y]);const[a,b,c,d,e,f]=matrix;matrix=[a*x,b*x,c*y,d*y,e,f];},
    rotate(r){finite([r]);const[a,b,c,d,e,f]=matrix,co=Math.cos(r),si=Math.sin(r);matrix=[a*co+c*si,b*co+d*si,-a*si+c*co,-b*si+d*co,e,f];},
    beginPath(){path=[];},closePath(){},moveTo(x,y){path.push(point(x,y));},lineTo(x,y){path.push(point(x,y));},
    ellipse(x,y,rx,ry,r,a,b){finite([x,y,rx,ry,r,a,b]);assert.ok(rx>=0&&ry>=0);path.push(...ellipse(x,y,rx,ry,r));},
    arc(x,y,r,a,b){finite([x,y,r,a,b]);assert.ok(r>=0);path.push(...ellipse(x,y,r,r,0));},
    fill(){paint('fill',path);},stroke(){paint('stroke',path);},
    fillRect(x,y,w,h){finite([x,y,w,h]);assert.ok(w>=0&&h>=0,'negative rectangle dimensions');paint('rect',[point(x,y),point(x+w,y+h)]);},
    measureText(text){return {width:measure(text)};},
    fillText(text,x,y,maxWidth){
      finite([x,y,...(maxWidth===undefined?[]:[maxWidth])]);if(maxWidth!==undefined)assert.ok(maxWidth>0);
      const label={kind:'text',text:String(text),x,y,maxWidth,measuredWidth:measure(text),...style};texts.push(label);events.push(label);
    },
  };
  for(const name of Object.keys(style))Object.defineProperty(ctx,name,{enumerable:true,configurable:true,get:()=>style[name],set:value=>{if(typeof style[name]==='number')finite([value]);style[name]=value;}});
  return {ctx,paints,texts,events,verify(){assert.equal(stack.length,0);assert.deepEqual(matrix,[1,0,0,1,0,0]);assert.equal(style.globalAlpha,1);}};
}
function enemy(name='灰霧獵犬', changes={}) {
  return {id:'audit-0',name,boss:false,roleId:'baseline',hp:80,maxHp:100,defense:20,mitigation:.4,evade:.125,parry:.075,block:.065,...changes};
}
function stateFor(enemies) {
  const state=engine.createGame(42);state.mode='battle';state._phase='fight';state.enemies=enemies;state.timing.ticks=10;return state;
}
function render(target=enemy(), {width=320,height=160,count=1,index=0,reducedMotion=true,t=0,pulse=0,state}={}) {
  const rec=recorder(), enemies=Array.from({length:count},(_,i)=>i===index?target:enemy('未知旅者',{id:`audit-other-${i}`}));
  state ||= stateFor(enemies);
  const before=JSON.stringify(state),forbidden=()=>assert.fail('drawing attempted randomness, action, persistence, network or timer');
  const math=Object.create(Math);math.random=forbidden;
  const x=width*(count===1?.72:.6+index*.26/Math.max(1,count-1)),y=height*.79-index*2;
  const context=createContext({...engine,...loot,ctx:rec.ctx,state:freeze(state),prefs:freeze({reducedMotion}),Math:math,
    sceneWidth:width,sceneHeight:height,canvas:{width,height},enemyPulse:pulse,attackPulse:pulse,
    localStorage:{getItem:forbidden,setItem:forbidden},sessionStorage:{getItem:forbidden,setItem:forbidden},fetch:forbidden,
    setTimeout:forbidden,setInterval:forbidden,requestAnimationFrame:forbidden,dispatch:forbidden,act:forbidden,
    target:freeze(target),x,y,index,t});
  runInContext(`'use strict'; ${helpers} ${drawing} drawEnemy(target,x,y,index,t);`,context);
  rec.verify();assert.equal(JSON.stringify(state),before);return rec;
}
const bounds = points => ({left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))});
const bodyBounds = rec => bounds(rec.paints.filter(p=>p.body).flatMap(p=>p.points));
const labels = rec => rec.texts.map(t=>t.text);
const statuses = {penetratedArmor:{stacks:2,expiresAtTick:17},stun:{expiresAtTick:14},bleeding:{stacks:3,expiresAtTick:17,damagePerTick:2}};
function plate(rec) {
  const candidates=rec.paints.filter(p=>!p.body&&p.kind==='rect').map(p=>({...p,...bounds(p.points)})).filter(p=>p.right-p.left>=70&&p.bottom-p.top>=30);
  assert.equal(candidates.length,2,'a single opaque border + inner nameplate, not separate unbacked text');
  return candidates.sort((a,b)=>(b.right-b.left)*(b.bottom-b.top)-(a.right-a.left)*(a.bottom-a.top))[0];
}
const overlap = (a,b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
function textBox(text) {
  const width=Math.min(text.measuredWidth,text.maxWidth??Infinity),size=Number(text.font.match(/([\d.]+)px/)[1]);
  const left=text.textAlign==='center'?text.x-width/2:text.textAlign==='right'?text.x-width:text.x;
  return {left,right:left+width,top:text.y-size,bottom:text.y};
}
const srgb = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
const luminance = channels => channels.reduce((sum,c,i)=>sum+[.2126,.7152,.0722][i]*(c<=.04045?c/12.92:((c+.055)/1.055)**2.4),0);
function contrast(a,b) {const [lo,hi]=[luminance(srgb(a)),luminance(srgb(b))].sort((a,b)=>a-b);return (hi+.05)/(lo+.05);}

test('nameplate audit: entire enemy status DOM renderer remains byte-identical to accepted v035',()=>{
  assert.equal(sha(section('renderEnemyStatuses','renderCounterattack')),'9a0b20c3e51839c670c762b29b8317c3ab0b8ba202dcd48e75cde17c7188f6f0');
});
test('nameplate audit: hero and enemy body drawing stay byte-identical before the new overlay',()=>{
  assert.equal(sha(section('drawHero','drawEnemy')),'a39389a9dbaf2aa77bbb02d16c09f65db0903654d2fdbbf67ffc13bfff38d357');
  const start=source.indexOf('function drawEnemy(');
  assert.equal(sha(source.slice(start,start+8006)),'17d8694b70aef6c9d36bb796361ae371a531923f251834222a195f1ae2af9ff7');
});
test('nameplate audit: actual ordinary route generator has at most two enemies; renderer cap is separately three',()=>{
  let maximum=0,pairs=0;
  for(let stage=1;stage<=30;stage++)for(const wave of engine.previewStage(stage).waves){maximum=Math.max(maximum,wave.enemies.length);if(wave.enemies.length===2)pairs++;}
  assert.equal(maximum,2);assert.equal(pairs,60);
  assert.match(section('drawScene','renderFinishCamp'),/\(state\.enemies\|\|\[\]\)\.slice\(0,3\)/);
});
test('nameplate audit: complete DOM retains current rates, single-gate semantics and every live status',()=>{
  const target=enemy('赤砂守衛',{roleId:'armored',attackPattern:'alternating',...copy(statuses)});
  const h=fullUI(undefined,{source,html});h.run(`state.mode='battle';state._phase='fight';state.enemies=${JSON.stringify([target])};state.timing.ticks=10;renderEnemyStatuses();`);
  const card=h.dom['enemy-status-list'].children[0],text=collect(card);
  for(const expected of ['目標 · 赤砂守衛','下一次行動','穿透護甲 2/3 層 · 剩 7 Tick','暈眩 · 剩 4 Tick','流血傷口 3/5 層 · 剩 7 Tick · 每 Tick 2 傷害','厚甲','目前一般物理減傷 20%','閃 0% / 招 0% / 擋 6.5%'])assert.ok(text.includes(expected),expected);
  for(const expected of ['各為單次判定機率','不是完全擋下攻擊的總機率','暈眩不取消格擋','穿透護甲不增幅流血'])assert.ok(card.title.includes(expected),expected);
  h.run('state.enemies[0].stunRecoveryPending=true;delete state.enemies[0].stun;renderEnemyStatuses();');
  const pending=h.dom['enemy-status-list'].children[0];assert.match(collect(pending),/甦醒待行動 · 下次我方行動前可反擊/);assert.match(collect(pending),/閃 12.5% \/ 招 7.5% \/ 擋 6.5%/);
  h.run('state.enemies[0].hp=0;renderEnemyStatuses();');assert.equal(h.dom['enemy-status-panel'].hidden,true);assert.equal(h.dom['enemy-status-list'].children.length,0);
});
test('nameplate audit: drawing stays read-only and restores canvas state with frozen complete state',()=>{
  for(const reducedMotion of [false,true])for(const hp of [0,80])for(const name of [...names,'裂隙守門者 · 30','未知旅者']) {
    const target=enemy(name,{hp,boss:name.startsWith('裂隙'),...copy(statuses)});
    const rec=render(target,{reducedMotion,t:12.9,pulse:1});assert.ok(rec.paints.length>0);assert.ok(rec.texts.length>0);
  }
  assert.doesNotMatch(drawing,/\b(?:import|export|fetch|XMLHttpRequest|WebSocket|Image|Audio|localStorage|sessionStorage|dispatch|setTimeout|setInterval|requestAnimationFrame)\b|Math\.random|addEventListener|innerHTML|createElement|\.seed\s*=/);
});
test('nameplate audit: all eight PA/stun/BW combinations and recovery keep exact labels in their backed plate',()=>{
  for(const boss of [false,true])for(let mask=0;mask<8;mask++)for(const recovery of [false,true]) {
    const changes={boss};if(mask&1)changes.penetratedArmor=copy(statuses.penetratedArmor);
    if(mask&2)recovery?changes.stunRecoveryPending=true:changes.stun=copy(statuses.stun);
    if(mask&4)changes.bleeding=copy(statuses.bleeding);
    const rec=render(enemy(boss?'裂隙守門者 · 30':'赤砂守衛',changes)),box=plate(rec),texts=labels(rec);
    assert.equal(texts.filter(t=>t.startsWith('PA ')).length,Number(Boolean(mask&1)));
    assert.equal(texts.includes(recovery?'READY':'STUN 4T'),Boolean(mask&2));
    assert.equal(texts.filter(t=>t.startsWith('BW ')).length,Number(Boolean(mask&4)));
    if(mask&1)assert.ok(texts.includes('PA 2 · 7T'));if(mask&4)assert.ok(texts.includes('BW 3 · 7T'));
    for(const label of rec.texts){const b=textBox(label);assert.ok(b.left>=box.left+1&&b.right<=box.right-1&&b.top>=box.top+1&&b.bottom<=box.bottom-1,JSON.stringify({label,box,b}));}
    const effects=rec.texts.filter(t=>/^(PA |STUN |READY|BW )/.test(t.text));
    for(let i=0;i<effects.length;i++)for(let j=i+1;j<effects.length;j++)assert.equal(overlap(textBox(effects[i]),textBox(effects[j])),false,'status text command boxes must not collide');
    assert.ok(!texts.some(t=>/現減|閃|招|擋|均衡|厚甲|靈巧/.test(t)),'long defenses remain in the preserved DOM, not squeezed into canvas');
  }
});
test('nameplate audit: bounded source rectangles and no actor-body intersection for normal one/two enemies at logical 320',t=>{
  let minimumClearance=Infinity,minimumPlateGap=Infinity;
  for(const width of [320,344,640])for(const reducedMotion of [false,true])for(const clock of [0,Math.PI*.75,1.7,12.8])for(const count of [1,2]) {
    for(const pair of [names,names.toReversed()]) {
      const targets=Array.from({length:count},(_,index)=>enemy(pair[index],{id:`live-${index}`,...copy(statuses)}));
      const records=targets.map((target,index)=>render(target,{width,count,index,reducedMotion,t:clock,pulse:1,state:stateFor(copy(targets))}));
      const plates=records.map(plate),bodies=records.map(bodyBounds);
      for(const p of plates){assert.ok(p.left>=4&&p.right<=width-4&&p.top>=4&&p.bottom<=160);for(const b of bodies){assert.equal(overlap(p,b),false,JSON.stringify({p,b}));if(p.left<b.right&&b.left<p.right)minimumClearance=Math.min(minimumClearance,b.top-p.bottom);}}
      if(count===2){assert.equal(overlap(plates[0],plates[1]),false);minimumPlateGap=Math.min(minimumPlateGap,plates[1].left-plates[0].right);}
    }
    if(count===1){const rec=render(enemy('裂隙守門者 · 30',{boss:true,...copy(statuses)}),{width,reducedMotion,t:clock,pulse:1}),p=plate(rec),b=bodyBounds(rec);assert.equal(overlap(p,b),false);minimumClearance=Math.min(minimumClearance,b.top-p.bottom);}
  }
  t.diagnostic(JSON.stringify({minimumClearance,minimumPlateGap,scope:'source body primitives and plate rectangles only, not glyph pixels or browser layout'}));
});
test('nameplate audit: every actual normal route pair preserves distinct in-bounds plates at logical 320',()=>{
  let pairs=0;
  for(let stage=1;stage<=30;stage++)for(const wave of engine.previewStage(stage).waves) {
    const targets=wave.enemies.map((descriptor,i)=>enemy(descriptor.name,{...descriptor,id:`route-${i}`,...copy(statuses)}));
    const records=targets.map((target,index)=>render(target,{count:targets.length,index,reducedMotion:false,t:13.7,pulse:1,state:stateFor(copy(targets))}));
    const plates=records.map(plate),bodies=records.map(bodyBounds);
    for(const p of plates){assert.ok(p.left>=4&&p.right<=316&&p.top>=4&&p.bottom<=160);for(const b of bodies)assert.equal(overlap(p,b),false);}
    if(plates.length===2){assert.equal(overlap(plates[0],plates[1]),false);pairs++;}
  }
  assert.equal(pairs,60);
});
test('nameplate audit: hypothetical three-position renderer cap stays bounded without asserting three-enemy gameplay',()=>{
  for(let index=0;index<3;index++)for(const boss of [false,true]) {
    const rec=render(enemy(boss?'裂隙守門者 · 30':'赤砂守衛',{boss,...copy(statuses)}),{count:3,index,reducedMotion:false,t:18,pulse:1});
    const p=plate(rec);assert.ok(p.left>=4&&p.right<=316&&p.top>=4&&p.bottom<=160);
    for(const label of rec.texts){const b=textBox(label);assert.ok(b.left>=p.left&&b.right<=p.right&&b.top>=p.top&&b.bottom<=p.bottom);}
  }
  // Pairwise plate separation is intentionally NOT claimed for this unsupported
  // source-cap-only formation; normal engine waveDescriptor creates at most two.
});
test('nameplate audit: plate text is opaque, enlarged and high-contrast against its solid source backing',t=>{
  let minimum=Infinity;
  for(const hp of [0,80])for(const pending of [false,true]) {
    const target=enemy('赤砂守衛',{hp,...copy(statuses)});if(pending){delete target.stun;target.stunRecoveryPending=true;}
    const rec=render(target),box=plate(rec),inner=rec.paints.find(p=>!p.body&&p.kind==='rect'&&p.fillStyle==='#0d191f');
    assert.ok(inner);assert.match(inner.fillStyle,/^#[\da-f]{6}$/i);assert.equal(inner.globalAlpha,1);
    for(const text of rec.texts){assert.equal(text.globalAlpha,1);assert.match(text.fillStyle,/^#[\da-f]{6}$/i);const ratio=contrast(text.fillStyle,inner.fillStyle);minimum=Math.min(minimum,ratio);assert.ok(ratio>=7);assert.ok(Number(text.font.match(/([\d.]+)px/)[1])>=6.5);}
    const name=rec.texts.find(t=>t.text===target.name);assert.match(name.font,/8px/);assert.ok(box.right-box.left>=76);
  }
  t.diagnostic(JSON.stringify({minimumSolidSourceContrast:minimum,excludes:'shared later vignette/flash compositing, browser antialiasing and actual readability; not WCAG certification'}));
});
test('nameplate audit: HP percentage keeps living sub-one-percent enemies active and distinguishes almost-full from full',()=>{
  const cases=[[0,'HP 0%'],[.1,'HP <1%'],[.49,'HP <1%'],[.99,'HP <1%'],[1,'HP 1%'],[49.5,'HP 50%'],[99.4,'HP 99%'],[99.5,'HP <100%'],[99.99,'HP <100%'],[100,'HP 100%']];
  for(const [hp,expected] of cases){const rec=render(enemy('灰霧獵犬',{hp}));assert.ok(labels(rec).includes(expected),`${hp}: ${labels(rec)}`);assert.equal(labels(rec).includes('▼ 集火'),hp>0);}
  assert.match(html,/HP（四捨五入的生命百分比；不足1%與接近滿血時用小於號區分）/);
});
test('nameplate audit: defeated overlays retain identity and zero HP but no target, role or live effects',()=>{
  for(const name of [...names,'裂隙守門者 · 30','未知旅者']) {
    const target=enemy(name,{hp:0,boss:name.startsWith('裂隙'),...copy(statuses)});
    const a=render(copy(target),{reducedMotion:false}),b=render(copy(target),{reducedMotion:false,t:90,pulse:1});
    assert.deepEqual(labels(a),[name,'HP 0%']);assert.deepEqual(a.texts,b.texts);assert.equal(a.paints.some(p=>p.kind==='stroke'),false);
    assert.ok(a.paints.some(p=>p.body&&p.globalAlpha<1));assert.equal(plate(a).bottom-plate(a).top,32);
  }
});
test('nameplate audit: reduced motion and regular time/pulse never shift the screen-space nameplate',()=>{
  for(const boss of [false,true]) {
    const target=enemy(boss?'裂隙守門者 · 30':'赤砂守衛',{boss,...copy(statuses)}),reference=render(copy(target));
    for(const reducedMotion of [false,true])for(const t of [0,3.7,99]){const current=render(copy(target),{reducedMotion,t,pulse:1});assert.deepEqual(current.texts,reference.texts);assert.deepEqual(plate(current),plate(reference));}
  }
});
test('nameplate audit: unknown identities and future roles remain literal labels without invented defenses or statuses',()=>{
  for(const name of ['未知旅者','toString','constructor','赤砂守衛（未辨識）']) {
    const rec=render(enemy(name,{roleId:'not-a-role'}));assert.deepEqual(labels(rec),[name,'HP 80%','▼ 集火']);assert.ok(plate(rec));
  }
  const rec=render(enemy('未知旅者',{stunRecoveryPending:true}));assert.ok(labels(rec).includes('READY'));assert.ok(!labels(rec).some(t=>t.startsWith('STUN')));
});
