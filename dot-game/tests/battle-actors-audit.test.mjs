import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import * as engine from '../src/engine.js';
import * as loot from '../src/loot.js';
import { fullUI } from './helpers/comparison-focus-harness.mjs';

// Independent primitive/transform/controller checks, not pixels or browser layout.
const baseline = process.env.HV_ACTOR_AUDIT_BASELINE;
const source = readFileSync(baseline ? resolve(baseline, 'src/ui.js') : new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(baseline ? resolve(baseline, 'index.html') : new URL('../index.html', import.meta.url), 'utf8');
const section = (name, next) => source.slice(source.indexOf(`function ${name}(`), source.indexOf(`function ${next}(`));
const helpers = section('enemyRolePresentation', 'renderRoutePreview');
const actorSource = section('rect', 'drawScene');
const names = ['灰霧獵犬', '碎晶甲蟲', '荒野影獸', '赤砂守衛'];
const copy = value => JSON.parse(JSON.stringify(value));
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
const finite = args => args.forEach(value => assert.ok(Number.isFinite(value), `nonfinite canvas number: ${value}`));
const round = value => Number(value.toFixed(7));

function recorder() {
  let matrix = [1, 0, 0, 1, 0, 0], styles = { fillStyle: '#000', strokeStyle: '#000', globalAlpha: 1, lineWidth: 1, font: '10px sans-serif', textAlign: 'start' };
  let path = [], bodyDone = false;
  const stack = [], paints = [], labels = [], numericCalls = [];
  const point = (x, y) => { finite([x, y]); const [a, b, c, d, e, f] = matrix; return [round(a*x+c*y+e), round(b*x+d*y+f)]; };
  const numeric = (...values) => { finite(values); numericCalls.push(values); };
  const paint = (kind, points) => paints.push({ kind, points: copy(points), body: !bodyDone, ...styles });
  const ellipsePoints = (x, y, rx, ry, rotation) => {
    // Conservative exact full-ellipse AABB under the current affine transform.
    const [a,b,c,d] = matrix, center = point(x,y), cos = Math.cos(rotation), sin = Math.sin(rotation);
    const ex = Math.hypot(rx*(a*cos+c*sin), ry*(-a*sin+c*cos));
    const ey = Math.hypot(rx*(b*cos+d*sin), ry*(-b*sin+d*cos));
    return [[center[0]-ex,center[1]-ey],[center[0]+ex,center[1]+ey]].map(p => p.map(round));
  };
  const ctx = {
    save() { stack.push({ matrix: [...matrix], styles: { ...styles } }); },
    restore() { assert.ok(stack.length, 'unbalanced restore'); ({ matrix, styles } = stack.pop()); if (!stack.length) bodyDone = true; },
    translate(x,y) { numeric(x,y); const [a,b,c,d,e,f] = matrix; matrix=[a,b,c,d,a*x+c*y+e,b*x+d*y+f]; },
    scale(x,y) { numeric(x,y); const [a,b,c,d,e,f] = matrix; matrix=[a*x,b*x,c*y,d*y,e,f]; },
    rotate(angle) { numeric(angle); const [a,b,c,d,e,f]=matrix, co=Math.cos(angle), si=Math.sin(angle); matrix=[a*co+c*si,b*co+d*si,-a*si+c*co,-b*si+d*co,e,f]; },
    beginPath() { path=[]; }, closePath() {},
    moveTo(x,y) { numeric(x,y); path.push(point(x,y)); }, lineTo(x,y) { numeric(x,y); path.push(point(x,y)); },
    ellipse(x,y,rx,ry,r,start,end) { numeric(x,y,rx,ry,r,start,end); assert.ok(rx>=0&&ry>=0); path.push(...ellipsePoints(x,y,rx,ry,r)); },
    arc(x,y,r,start,end) { numeric(x,y,r,start,end); assert.ok(r>=0); path.push(...ellipsePoints(x,y,r,r,0)); },
    fill() { paint('fill',path); }, stroke() { paint('stroke',path); },
    fillRect(x,y,w,h) { numeric(x,y,w,h); paint('rect',[point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)]); },
    fillText(text,x,y,maxWidth) { numeric(x,y,...(maxWidth===undefined?[]:[maxWidth])); labels.push({ text:String(text),x,y,maxWidth }); },
  };
  for (const name of Object.keys(styles)) Object.defineProperty(ctx,name,{ enumerable:true,configurable:true,get:()=>styles[name],set:value=>{ if(typeof styles[name]==='number') finite([value]); styles[name]=value; } });
  return { ctx, paints, labels, numericCalls,
    get body() { return paints.filter(p=>p.body); },
    verify() { assert.equal(stack.length,0); assert.deepEqual(matrix,[1,0,0,1,0,0]); assert.equal(styles.globalAlpha,1); },
  };
}
function enemy(name='未知旅者', changes={}) {
  return { id:'audit-target', name, boss:false, roleId:'baseline', hp:80, maxHp:100, defense:20, mitigation:.4, evade:.1, parry:.07, block:.06, ...changes };
}
function stateFor(target) {
  const state=engine.createGame(42); state.mode='battle'; state._phase='fight'; state.enemies=target?[target]:[]; state.timing.ticks=10; return state;
}
function renderActor(kind, { target=enemy(), state=stateFor(target), reducedMotion=true, t=0, pulse=0, x=0, y=0, index=0 }={}) {
  const rec=recorder(), before=JSON.stringify(state), prefs={reducedMotion};
  const forbidden=()=>assert.fail('drawing attempted RNG, storage, timer, action or network');
  const math=Object.create(Math); math.random=forbidden;
  const context=createContext({ ...engine,...loot,ctx:rec.ctx,state:freeze(state),prefs:freeze(prefs),enemyPulse:pulse,attackPulse:pulse,Math:math,
    localStorage:{getItem:forbidden,setItem:forbidden},sessionStorage:{getItem:forbidden,setItem:forbidden},fetch:forbidden,Image:forbidden,
    setTimeout:forbidden,setInterval:forbidden,requestAnimationFrame:forbidden,dispatch:forbidden,act:forbidden,
    selectedId:'inspected-not-equipped', selectedSlot:null, target:freeze(target),x,y,index,t });
  runInContext(`'use strict'; ${helpers} ${actorSource} ${kind==='hero'?'drawHero(x,y,t)':'drawEnemy(target,x,y,index,t)'}`,context);
  assert.equal(JSON.stringify(state),before); rec.verify(); return rec;
}
const geometry = rec => JSON.stringify(rec.body.map(({kind,points})=>({kind,points})));
const bodyTrace = rec => JSON.stringify(rec.body);
const bounds = rec => {
  const points=rec.body.flatMap(p=>p.points), xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
};

// Neutral role isolates archetype geometry from defense-role decoration and color.
test('actor audit: the four exact local enemy identities have four color-independent shapes',()=>{
  const signatures=names.map(name=>geometry(renderActor('enemy',{target:enemy(name)})));
  assert.equal(new Set(signatures).size,4);
});
test('actor audit: early-route baseline roles retain the known beetle and shadow identities',()=>{
  const low=engine.previewStage(1).waves.concat(engine.previewStage(2).waves).flatMap(w=>w.enemies).filter(e=>!e.boss);
  for(const name of names) {
    const target=low.find(e=>e.name===name); assert.ok(target,name); assert.equal(target.roleId,'baseline');
    assert.equal(geometry(renderActor('enemy',{target:enemy(name,target)})),geometry(renderActor('enemy',{target:enemy(name)})));
  }
});
test('actor audit: a known exact name outranks a conflicting role for body identity',()=>{
  for(const name of names) {
    const plain=geometry(renderActor('enemy',{target:enemy(name)}));
    for(const roleId of ['armored','agile','unsupported']) assert.equal(geometry(renderActor('enemy',{target:enemy(name,{roleId})})),plain,`${name}/${roleId}`);
  }
});
test('actor audit: boss identity outranks all names, and is not merely ordinary body recoloring',()=>{
  const boss=geometry(renderActor('enemy',{target:enemy('裂隙守門者 · 3',{boss:true})}));
  for(const name of [...names,'未知旅者']) assert.equal(geometry(renderActor('enemy',{target:enemy(name,{boss:true})})),boss);
  for(const name of names) assert.notEqual(geometry(renderActor('enemy',{target:enemy(name)})),boss);
});
test('actor audit: unknown exact-name fallback remains neutral and uses actual role cues',()=>{
  const plain=geometry(renderActor('enemy',{target:enemy()}));
  for(const name of ['改名灰霧獵犬','碎晶甲蟲（未辨識）','荒野影獸後綴','赤砂守衛x','裂隙守門者 · 99']) assert.equal(geometry(renderActor('enemy',{target:enemy(name)})),plain);
  assert.equal(geometry(renderActor('enemy',{target:enemy('未知旅者',{roleId:'toString'})})),plain);
  const armored=geometry(renderActor('enemy',{target:enemy('未知旅者',{roleId:'armored'})}));
  const agile=geometry(renderActor('enemy',{target:enemy('未知旅者',{roleId:'agile'})}));
  assert.equal(new Set([plain,armored,agile]).size,3);
});
test('actor audit: alternating guard has a fixed capability cue, not a next-action clock cue',()=>{
  const target=enemy('赤砂守衛',{attackPattern:'alternating'});
  const a=renderActor('enemy',{target,state:stateFor(target)}), state=stateFor(target);state.timing.ticks=11;
  assert.equal(geometry(a),geometry(renderActor('enemy',{target:copy(target),state})));
  assert.notEqual(geometry(a),geometry(renderActor('enemy',{target:enemy('赤砂守衛')})));
});
test('actor audit: equipped axe, rapier, club and legacy fallback are distinct without color',()=>{
  const signatures=[];
  for(const family of ['axe','rapier','club',null]) {
    const state=stateFor();state.equipment.weapon=family?loot.createCommissionWeapon(family,1):state.equipment.weapon;
    signatures.push(geometry(renderActor('hero',{state})));
  }
  assert.equal(new Set(signatures).size,4);
});
test('actor audit: unknown, unsupported, absent and nonweapon equipment do not invent supported-family art',()=>{
  const state=stateFor(),plain=geometry(renderActor('hero',{state:copy(state)}));
  for(const weapon of [null,undefined,{slot:'weapon',name:'超級戰斧'},{slot:'weapon',weaponFamily:'unsupported',name:'戰斧'},{slot:'armor',weaponFamily:'axe'}]) {
    const s=copy(state);s.equipment.weapon=weapon;
    assert.equal(geometry(renderActor('hero',{state:s})),plain);
  }
});
test('actor audit: inspected inventory cannot change the currently equipped actor weapon',()=>{
  const state=stateFor();state.equipment.weapon=loot.createCommissionWeapon('axe',1);
  const plain=geometry(renderActor('hero',{state:copy(state)}));
  state.inventory=[{...loot.createCommissionWeapon('rapier',1),id:'inspected-not-equipped'}];
  assert.equal(geometry(renderActor('hero',{state})),plain);
});
for(const reducedMotion of [false,true]) {
  test(`actor audit: finite restored transforms and actor-body bounds at 320×160 (reduced=${reducedMotion})`,()=>{
    const targets=[...names.map(name=>enemy(name)),enemy('boss',{boss:true}),enemy('unknown',{roleId:'armored'}),enemy('unknown',{roleId:'agile'})];
    for(const target of targets) for(const count of [1,2,3]) for(let index=0;index<count;index++) {
      const x=320*(count===1?.72:.6+index*.26/Math.max(1,count-1)),y=160*.79-index*2;
      for(const hp of [0,80]) {
        const rec=renderActor('enemy',{target:{...target,hp},x,y,index,t:17.3,pulse:1,reducedMotion}),b=bounds(rec);
        assert.ok(rec.numericCalls.length>0); assert.ok(b.left>=0&&b.right<=320&&b.top>=0&&b.bottom<=160,JSON.stringify({target,count,index,hp,b}));
        // Only finite/max-width checks for labels; this is NOT actual text fit.
        for(const label of rec.labels) finite([label.x,label.y,...(label.maxWidth===undefined?[]:[label.maxWidth])]);
      }
    }
    for(const family of ['axe','rapier','club',null]) { const state=stateFor();if(family)state.equipment.weapon=loot.createCommissionWeapon(family,1);
      const b=bounds(renderActor('hero',{state,x:320*.28,y:160*.79,t:17.3,pulse:1,reducedMotion}));
      assert.ok(b.left>=0&&b.right<=320&&b.top>=0&&b.bottom<=160,JSON.stringify({family,b}));
    }
  });
}

test('actor audit: generated two-enemy routes retain separated body bounds at 320 logical pixels', t=>{
  let checkedPairs=0,minGap=Infinity,maxCount=0;
  for(let stage=1;stage<=30;stage++) for(const wave of engine.previewStage(stage).waves) {
    maxCount=Math.max(maxCount,wave.enemies.length);
    const boxes=wave.enemies.map((descriptor,index)=>bounds(renderActor('enemy',{
      target:enemy(descriptor.name,descriptor),x:320*(wave.enemies.length===1?.72:.6+index*.26/Math.max(1,wave.enemies.length-1)),
      y:160*.79-index*2,index,reducedMotion:false,t:13.7,pulse:1,
    })));
    for(let i=1;i<boxes.length;i++) {const gap=boxes[i].left-boxes[i-1].right;assert.ok(gap>0,JSON.stringify({stage,wave:wave.wave,gap}));minGap=Math.min(minGap,gap);checkedPairs++;}
  }
  assert.equal(maxCount,2);assert.ok(checkedPairs>0);
  t.diagnostic(JSON.stringify({logicalWidth:320,logicalHeight:160,stages:30,checkedPairs,maxGeneratedEnemies:maxCount,minimumBodyGap:round(minGap),excludes:'text layout, status/body occlusion, unsupported three-enemy layout'}));
});
test('actor audit: reduced-motion living silhouettes are invariant to time, index and effect pulse',()=>{
  for(const target of [...names.map(name=>enemy(name)),enemy('boss',{boss:true}),enemy('unknown',{roleId:'agile'})]) {
    assert.equal(bodyTrace(renderActor('enemy',{target:copy(target)})),bodyTrace(renderActor('enemy',{target:copy(target),t:100.7,index:2,pulse:1})));
  }
  for(const family of ['axe','rapier','club',null]) {const state=stateFor();if(family)state.equipment.weapon=loot.createCommissionWeapon(family,1);
    assert.equal(bodyTrace(renderActor('hero',{state:copy(state)})),bodyTrace(renderActor('hero',{state:copy(state),t:100.7,pulse:1})));
  }
});
test('actor audit: defeated enemy silhouettes differ, stay static and show no live status/target labels',()=>{
  for(const name of [...names,'unknown','boss']) {
    const target=enemy(name,{boss:name==='boss',penetratedArmor:{stacks:2,expiresAtTick:17},stun:{expiresAtTick:14},bleeding:{stacks:3,expiresAtTick:17,damagePerTick:2}});
    const alive=renderActor('enemy',{target:copy(target)}),dead={...target,hp:0};
    const a=renderActor('enemy',{target:copy(dead),reducedMotion:false}),b=renderActor('enemy',{target:copy(dead),reducedMotion:false,t:92.1,pulse:1,index:2});
    assert.notEqual(bodyTrace(alive),bodyTrace(a));assert.equal(bodyTrace(a),bodyTrace(b));
    assert.deepEqual(a.labels.map(l=>l.text),[name]);
    assert.ok(a.body.some(p=>p.globalAlpha<1),'defeated actor visibly muted in canvas instructions');
  }
});
test('actor audit: defeated hero is static and does not show a fresh attack arc',()=>{
  const state=stateFor(enemy());state.hero.hp=0;state.mode='defeat';
  const a=renderActor('hero',{state:copy(state),reducedMotion:false}),b=renderActor('hero',{state:copy(state),reducedMotion:false,t:92.1,pulse:1});
  assert.equal(bodyTrace(a),bodyTrace(b));
  assert.ok(a.body.some(p=>p.globalAlpha<1));
});
test('actor audit: target, defense, HP, PA, stun, bleed and recovery overlays survive new bodies',()=>{
  for(const target of [...names.map(name=>enemy(name,{roleId:'armored'})),enemy('boss',{boss:true,roleId:'armored'})]) {
    Object.assign(target,{penetratedArmor:{stacks:2,expiresAtTick:17},stun:{expiresAtTick:14},bleeding:{stacks:3,expiresAtTick:17,damagePerTick:2}});
    const rec=renderActor('enemy',{target:copy(target),x:230,y:140});
    for(const text of [target.name,'▼ 集火','▣ 厚甲','現減 20% · 閃 0%','招 0% · 擋 6%','PA 2 · 7T','STUN 4T','BW 3 · 7T']) assert.ok(rec.labels.some(l=>l.text===text),text);
    const statusY=rec.labels.filter(l=>/^(PA |STUN |BW )/.test(l.text)).map(l=>l.y);assert.equal(new Set(statusY).size,3);
    const width=target.boss?57:40, hpBars=rec.paints.filter(p=>!p.body&&p.kind==='rect'&&p.points[2][1]-p.points[1][1]===3);
    assert.ok(hpBars.some(p=>Math.abs(p.points[1][0]-p.points[0][0]-Math.round(width*.8))<=1));
    const recovery=copy(target);delete recovery.stun;recovery.stunRecoveryPending=true;
    const recovered=renderActor('enemy',{target:recovery});
    assert.ok(recovered.labels.some(l=>l.text==='READY'));assert.ok(recovered.labels.some(l=>l.text==='現減 20% · 閃 10%'));
    assert.ok(!recovered.labels.some(l=>l.text.startsWith('STUN')));
  }
});
test('actor audit: controller canvas redraw is read-only over repeated equipped and inspected families',async()=>{
  const initial=engine.createGame(42);initial.inventory=['axe','rapier','club'].map(f=>({...loot.createCommissionWeapon(f,1),id:`audit-${f}`}));
  const h=fullUI(initial,{source,html});const snapshot=()=>JSON.stringify({state:h.state,calls:h.calls,writes:h.writes});
  for(const family of ['axe','rapier','club']) {
    h.run(`state.equipment.weapon=state.inventory.find(i=>i.id==='audit-${family}');`);
    const before=snapshot();
    for(const inspected of ['axe','rapier','club']) {
      await h.card('inventory',`audit-${inspected}`).click();
      const rec=recorder();Object.defineProperties(h.run('ctx'),Object.getOwnPropertyDescriptors(rec.ctx));
      h.run('drawHero(90,125,12.4);');rec.verify();
      assert.equal(snapshot(),before);
    }
  }
});
test('actor audit: drawing contains no new persistence, network, DOM, event, random or module mechanism',()=>{
  assert.doesNotMatch(actorSource,/\b(?:import|export|fetch|XMLHttpRequest|WebSocket|Image|Audio|localStorage|sessionStorage|dispatch|setTimeout|setInterval|requestAnimationFrame)\b|Math\.random|addEventListener|innerHTML|createElement|\.seed\s*=/);
});
test('actor audit: hero source uses the existing authoritative equipped-family resolver',()=>{
  assert.match(section('drawHero','drawEnemy'),/resolveWeaponFamily\(state\.equipment\?\.weapon\)/);
  assert.doesNotMatch(section('drawHero','drawEnemy'),/selectedId|selectedSlot|inventory/);
});
