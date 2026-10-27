import { beforeEventObservationReset } from './helpers/event-observation-baseline.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';

// Independent source/Canvas-command checks. No pixels, browser or accessibility claim.
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const source = read('src/ui.js');
const sha = s => createHash('sha256').update(s).digest('hex');
const actorStart = source.indexOf('function rect('), sceneStart = source.indexOf('function drawScene(');
const helperSource = source.slice(actorStart, sceneStart);
const pins = {
  'src/engine.js': '020c1717d24c20bd914241b3f30adbc091c5a2a851cec8917dca7fc403f21a6d',
  'src/loot.js': '2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7',
  'src/session.js': '821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a',
  'style.css': 'c92d96b2648f0ea908daa1e4849b4b1681e0a14d8177a41d24ce04b07b249225',
};
test('forest independent: accepted v036 mechanics/session/CSS bytes retained', () => {
  for (const [p, hash] of Object.entries(pins)) assert.equal(sha(read(p)), hash, p);
});
test('forest independent: all pre-drawing controllers and full DOM status bytes retained', () => {
  assert.equal(sha(beforeEventObservationReset(source.slice(0, actorStart))), 'f1425d43ac53f2ca638fc41f82105b1120fd743ae03390402f7525c17dbc76b8');
});
test('forest independent: actor and opaque-nameplate functions byte-identical to v036', () => {
  const functions = runInNewContext(`${helperSource}; [rect, polygon, drawHero, drawEnemy].map(f => f.toString())`);
  const expected = ['df232efe89c962a0fc76c55f5c618f3b2d5e5223b991ee7f46610768ad855850', '4647670fd3f08643c47babe8962e6ccd86a69d6b035fb46bc8b1003d43d3926e', '727e5b1e275b4f96158a69c70917ff44e9aa1bb8ec6cb2e9bfb674e499f2a7ec', '51b3d4dcd75f5a198b6f2e0d2b78cbd081f34f7af94cbe3af460db8f52324f71'];
  functions.forEach((fn, i) => assert.equal(sha(fn), expected[i]));
});
test('forest independent: actor positioning, effects and lifecycle retained outside v038 chest slice', () => {
  // v038 intentionally redraws only the chest; retain independent pre/post slice hashes from v037.
  const ground = source.indexOf('  const ground=h*.79;');
  const chest = source.indexOf('  if(!enemies.length){', ground);
  const front = source.indexOf('  // Front grass', chest);
  assert.ok(ground >= 0 && chest > ground && front > chest);
  assert.equal(sha(source.slice(ground, chest)), 'b47b06ebd0df3ae7e5dcde3502fad0bee22c1a88ecafe8a45f98347b4fc52b6c');
  assert.equal(sha(beforeEventObservationReset(source.slice(front))), 'ad0f67d080f29a5f5f4e4bfaaa0e7c243602a1c678d1c0052c46902bcb35482c');
});

const backgroundEnd = source.indexOf('  const ground=h*.79;', sceneStart);
const background = source.slice(sceneStart, backgroundEnd) + '\n}';
const primitives = source.slice(actorStart, source.indexOf('function drawHero(', actorStart));
function trace(width, height, time = 0, reducedMotion = true) {
  const paints = [], gradients = [];
  let path = [], color;
  const numbers = args => args.forEach(n => assert.ok(Number.isFinite(n), `nonfinite ${n}`));
  const ctx = {
    set fillStyle(value) { color = value; }, get fillStyle() { return color; },
    beginPath() { path = []; }, closePath() {},
    moveTo(...point) { numbers(point); path.push(point); },
    lineTo(...point) { numbers(point); path.push(point); },
    fill() { paints.push({color, points:path.map(p=>[...p])}); },
    fillRect(x,y,w,h) { numbers([x,y,w,h]); assert.ok(w>0&&h>0); paints.push({color,points:[[x,y],[x+w,y+h]],rect:true}); },
    createLinearGradient(...coords) {
      numbers(coords); const gradient = {coords,stops:[],addColorStop(offset,color) { assert.ok(offset>=0&&offset<=1);this.stops.push([offset,color]); }};
      gradients.push(gradient); return gradient;
    },
  };
  const forbidden = () => assert.fail('background touched gameplay, persistence, timers or randomness');
  const math = Object.create(Math); math.random = forbidden;
  const deniedState = new Proxy({}, { get:forbidden, set:forbidden });
  const sandbox = {ctx,sceneWidth:width,sceneHeight:height,time,prefs:Object.freeze({reducedMotion}),Math:math,
    state:deniedState,dispatch:forbidden,act:forbidden,fetch:forbidden,localStorage:deniedState,sessionStorage:deniedState,
    setTimeout:forbidden,setInterval:forbidden,requestAnimationFrame:forbidden};
  runInNewContext(`'use strict';${primitives}\n${background}\ndrawScene(time,0);`,sandbox);
  return JSON.parse(JSON.stringify({paints, gradients}));
}
function box(paint) {
  return {left:Math.min(...paint.points.map(p=>p[0])),right:Math.max(...paint.points.map(p=>p[0])),top:Math.min(...paint.points.map(p=>p[1])),bottom:Math.max(...paint.points.map(p=>p[1]))};
}
test('forest independent: full backdrop coverage, finite geometry and no privileged access at 6 dimensions', () => {
  for (const [w,h] of [[320,160],[344,160],[640,360],[320,360],[960,160],[1200,675]]) {
    const result=trace(w,h,1e6);
    assert.deepEqual(result.paints[0].points,[[0,0],[w,h]]);
    assert.equal(result.gradients.length,2);
    for(const p of result.paints) {
      const b=box(p);assert.ok(b.left>=0&&b.top>=0&&b.right<=w+1&&b.bottom<=h+1);
    }
  }
});
test('forest independent: high-detail edge trunks, canopy and paving stay outside standing-actor corridor', () => {
  for(const [w,h] of [[320,160],[344,160],[640,360]]) {
    const paints=trace(w,h).paints;
    const trunks=paints.filter(p=>['#1a302b','#1b312c','#314a39','#344b39'].includes(p.color));
    assert.equal(trunks.length,6);
    for(const p of trunks) { const b=box(p);assert.ok(b.right<=w*.17||b.left>=w*.85-1e-8); }
    const canopy=paints.filter(p=>['#203b32','#243f34','#172f29','#19322b'].includes(p.color));
    assert.equal(canopy.length,4);for(const p of canopy)assert.ok(box(p).bottom<=h*.24);
    const paving=paints.filter(p=>['#6a6d54','#414c3c'].includes(p.color));
    assert.equal(paving.length,8);for(const p of paving)assert.ok(box(p).top>=h*.86);
  }
});
test('forest independent: reduced-motion complete command geometry is time-invariant', () => {
  assert.deepEqual(trace(320,160,-10000),trace(320,160,10000));
});
test('forest independent: ordinary time changes only translucent six mote rectangles', () => {
  const a=trace(320,160,0,false),b=trace(320,160,1,false);
  assert.equal(a.paints.length,b.paints.length);
  let moved=0;
  a.paints.forEach((p,i)=>{
    if(JSON.stringify(p)!==JSON.stringify(b.paints[i])) {
      moved++;assert.equal(p.color,'#c5cf9950');assert.equal(p.rect,true);
      assert.equal(b.paints[i].color,p.color);
      p.points.forEach((point,j)=>{assert.equal(point[1],b.paints[i].points[j][1]);assert.ok(Math.abs(point[0]-b.paints[i].points[j][0])<=4);});
    }
  });
  assert.ok(moved>0&&moved<=6);
});
