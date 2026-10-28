import { beforeManualSaleCap } from './helpers/manual-sale-cap-baseline.mjs';
import { beforeClearReport } from './helpers/clear-report-baseline.mjs';
import { beforeReportExport } from './helpers/report-export-baseline.mjs';
import { beforeStatDelta } from './helpers/stat-delta-baseline.mjs';
import { beforeProtectionFilter } from './helpers/protection-filter-baseline.mjs';
import { beforeNameSearch } from './helpers/name-search-baseline.mjs';
import { beforeQualitySort } from './helpers/quality-sort-baseline.mjs';
import { beforeQualityFilter } from './helpers/quality-filter-baseline.mjs';
import { beforeDetailActionFocus } from './helpers/detail-action-baseline.mjs';
import { beforeImportOrdering } from './helpers/import-order-baseline.mjs';
import { beforeEventObservationReset } from './helpers/event-observation-baseline.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';

// Independent source/Canvas-command audit; not browser or pixel evidence.
const read = path => beforeNameSearch(beforeProtectionFilter(beforeReportExport(beforeClearReport(beforeManualSaleCap(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'),path),path),path),path),path);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const source = beforeImportOrdering(beforeDetailActionFocus(beforeQualityFilter(beforeQualitySort(beforeStatDelta(read('src/ui.js'))))));
const start = source.indexOf('  if(!enemies.length){', source.indexOf('function drawScene('));
const end = source.indexOf('  // Front grass and vignette.', start);
const chest = source.slice(start, end);
const primitives = source.slice(source.indexOf('function rect('), source.indexOf('function drawHero('));

test('chest independent: entire UI outside exact chest block retains frozen v037 bytes', () => {
  assert.ok(start > 0 && end > start);
  // Normalize only the exact v040 observation helper/calls; no broad normalization.
  assert.equal(hash(beforeEventObservationReset(source.slice(0, start) + '<CHEST>\n' + source.slice(end))), '0c5144a8a376778b7abf51c5ab1d5ec15c9140b40973b9550eb91aa89a06f8b8');
});
test('chest independent: gameplay, loot, persistence, CSS and all 14 assets remain byte-identical', () => {
  for (const [path, expected] of Object.entries({
    'src/engine.js':'020c1717d24c20bd914241b3f30adbc091c5a2a851cec8917dca7fc403f21a6d',
    'src/loot.js':'2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7',
    'src/session.js':'821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a',
    'style.css':'c92d96b2648f0ea908daa1e4849b4b1681e0a14d8177a41d24ce04b07b249225',
  })) assert.equal(hash(read(path)), expected, path);
  const root = new URL('../assets/', import.meta.url);
  const walk = (url, prefix='') => readdirSync(url, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(new URL(`${e.name}/`,url),`${prefix}${e.name}/`) : [{path:`${prefix}${e.name}`,sha:hash(readFileSync(new URL(e.name,url)))}]);
  const assets = walk(root).sort((a,b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  assert.equal(assets.length,14);
  assert.equal(hash(assets.map(a=>`${a.path}\0${a.sha}\n`).join('')), 'd4d528961d71f0dc621c8660c6c4d5884f6eb36ff31cc3f770d09c66d539b5f8');
});
function trace(w=640,h=360,count=0,mode='camp',t=0,reducedMotion=true) {
  let transform=[1,1,0,0], color, path=[];
  const stack=[], paints=[];
  const finite = args => args.forEach(n=>assert.ok(Number.isFinite(n),`nonfinite canvas argument ${n}`));
  const point = (x,y) => { finite([x,y]); return [x*transform[0]+transform[2],y*transform[1]+transform[3]]; };
  const ctx = {
    set fillStyle(v){color=v;},get fillStyle(){return color;},
    save(){stack.push({transform:[...transform],color});},
    restore(){assert.ok(stack.length,'unbalanced restore');({transform,color}=stack.pop());},
    translate(x,y){finite([x,y]);transform[2]+=x*transform[0];transform[3]+=y*transform[1];},
    scale(x,y){finite([x,y]);assert.ok(x>0&&y>0);transform[0]*=x;transform[1]*=y;},
    beginPath(){path=[];},closePath(){},moveTo(x,y){path.push(point(x,y));},lineTo(x,y){path.push(point(x,y));},
    fill(){paints.push({color,points:path.map(p=>[...p])});},
    fillRect(x,y,width,height){finite([x,y,width,height]);assert.ok(width>0&&height>0);paints.push({color,points:[point(x,y),point(x+width,y+height)]});},
  };
  const forbidden=()=>assert.fail('chest touched gameplay, persistence, timers or randomness');
  const enemies=Object.freeze(Array.from({length:count},()=>Object.freeze({hp:1})));
  const state=new Proxy(Object.freeze({enemies,mode}),{set:forbidden,get(target,key){assert.ok(['enemies','mode'].includes(key));return target[key];}});
  const denied=new Proxy({},{get:forbidden,set:forbidden});
  const math=Object.create(Math);math.random=forbidden;
  runInNewContext(`'use strict';${primitives}\nconst ground=h*.79;const enemies=(state.enemies||[]).slice(0,3);\n${chest}`,{
    ctx,w,h,t,state,prefs:Object.freeze({reducedMotion}),Math:math,particles:denied,flash:0,
    dispatch:forbidden,act:forbidden,fetch:forbidden,localStorage:denied,sessionStorage:denied,
    setTimeout:forbidden,setInterval:forbidden,requestAnimationFrame:forbidden,
  });
  assert.equal(stack.length,0,'save/restore balanced');
  assert.deepEqual(transform,[1,1,0,0],'transform restored');
  return JSON.parse(JSON.stringify(paints));
}
test('chest independent: empty-enemy gate includes battle interval, excludes all populated encounters', () => {
  const reference=trace();assert.ok(reference.length>3,'dimensional chest has multiple painted faces/details');
  for(const mode of ['camp','battle','arena','item-world','dead']) {
    assert.deepEqual(trace(640,360,0,mode),reference,mode);
    for(const count of [1,2,3,4]) assert.deepEqual(trace(640,360,count,mode),[],`${mode}/${count}`);
  }
});
test('chest independent: static paint never consumes RNG or timers and removes yellow halo', () => {
  assert.doesNotMatch(chest.replace(/\/\/[^\n]*/g,''),/state\.|Math\.(random|sin|cos)|\b(?:t|dt|particles|attackPulse|enemyPulse|flash)\b/);
  assert.doesNotMatch(chest,/ctx\.(?:arc|ellipse|createRadialGradient)|#e2bf7660/);
  for(const time of [0,1,12345,1e9]) for(const reduced of [true,false]) assert.deepEqual(trace(640,360,0,'camp',time,reduced),trace());
});
test('chest independent: finite, balanced and bounded geometry at supported narrow/tall/wide sizes', () => {
  for(const [w,h] of [[320,160],[344,160],[640,360],[320,360],[960,160],[1200,675]]) {
    const paints=trace(w,h);
    for(const paint of paints) for(const [x,y] of paint.points) {
      assert.ok(x>=0&&x<=w&&y>=0&&y<=h,`out of scene at ${w}x${h}: ${x},${y}`);
      assert.ok(x>w*.5&&x<w*.9,'chest stays in original enemy-side placement');
      assert.ok(y<=h*.79+8,'grounded at existing ground baseline');
    }
  }
});

test('chest independent: volume has separate front, side, bevelled lid, paired straps and lock', () => {
  const paints=trace(),x=640*.68,y=360*.79;
  const one=color=>{const matches=paints.filter(p=>p.color===color);assert.equal(matches.length,1,color);return matches[0];};
  assert.equal(paints.length,21);
  assert.equal(paints[0].color,'#18271e80','contact shadow painted beneath volume');
  const front=one('#796044'),side=one('#453e30'),lid=one('#a18459');
  assert.deepEqual(front.points,[[x,y-12],[x+18,y-12],[x+18,y],[x,y]]);
  assert.deepEqual(side.points,[[x+18,y-12],[x+24,y-16],[x+24,y-4],[x+18,y]]);
  assert.equal(lid.points.length,5,'bevelled lid has top silhouette');
  assert.ok(Math.min(...lid.points.map(p=>p[1]))<Math.min(...front.points.map(p=>p[1])));
  assert.equal(paints.filter(p=>p.color==='#687068').length,2,'two perspective top straps');
  assert.equal(paints.filter(p=>p.color==='#4c5651').length,2,'two front straps');
  const lock=one('#b29b64'),keyhole=one('#443e2e');
  assert.ok(keyhole.points[0][0]>=lock.points[0][0]&&keyhole.points[1][0]<=lock.points[1][0]);
  assert.ok(keyhole.points[0][1]>=lock.points[0][1]&&keyhole.points[1][1]<=lock.points[1][1]);
});
test('chest independent: HTML and package retain baseline after exact version and v039 dialog-name normalization', () => {
  const html=read('index.html');
  assert.equal((html.match(/v0\.51/g)||[]).length,2);
  assert.equal(hash(html.replace('<option value="quality">品質優先（非戰力）</option>', '').replace("<label for=\"quality-filter\">\u54c1\u8cea<select id=\"quality-filter\" aria-describedby=\"inventory-filter-help\"><option value=\"all\">\u5168\u90e8\u54c1\u8cea</option></select></label>", '').replaceAll('v0.51','v0.37').replace(' aria-labelledby="help-title"', '').replace(' id="help-title"', '').replace(' aria-labelledby="settings-title"', '').replace(' id="settings-title"', '')),'5dacdb593f9a0258a0b6d82f4c3b2acb4429305df59f02e0640fd0e11ea3dade');
  assert.equal(hash(read('package.json').replace('"version": "0.51.0"','"version": "0.37.0"')),'6887e11e3512b6bf425572a4ce372f4ed6115318917d145c89d57e698a2d4fa3');
});
