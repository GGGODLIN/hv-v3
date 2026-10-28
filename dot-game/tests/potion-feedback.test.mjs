import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as current from '../src/engine.js';
import {beforePotionFeedback} from './helpers/potion-feedback-baseline.mjs';
const url=new URL('../src/engine.js',import.meta.url);
const source=readFileSync(url,'utf8');
const before=beforePotionFeedback(source,'src/engine.js').replace(/from (['"])(\.\.?\/[^'"]+)\1/g,(_,q,path)=>`from ${q}${new URL(path,url).href}${q}`);
const previous=await import(`data:text/javascript;base64,${Buffer.from(before).toString('base64')}`);
const setup=(game,seed=42)=>{const s=game.createGame(seed);game.act(s,'start');return s;};
for(const missing of [1,.25,.75,100,400])test(`effective potion feedback: ${missing} HP deficit never reports unreceived health`,()=>{
 const a=setup(current),b=setup(previous),max=current.stats(a).maxHp;
 a.hero.hp=b.hero.hp=max-missing;
 current.act(a,'heal');previous.act(b,'heal');
 const event=a.events.at(-1),legacy=b.events.at(-1);
 assert.equal(event.type,'heal');assert.equal(event.text,'補給藥水');
 assert.equal(event.value,Math.round(Math.min(missing,max*.4)));
 assert.equal(legacy.value,Math.round(max*.4));
 // Preserve the full state assertion. Normalize only this one intentional event field.
 assert.deepEqual(a,{...b,events:b.events.map((e,i)=>i===b.events.length-1?{...e,value:event.value}:e)});
});
test('effective potion feedback: exact inverse rejects any unrelated or missing implementation anchor',()=>{
 assert.throws(()=>beforePotionFeedback(source.replace('const previousHp=s.hero.hp;\n    s.potions','const previousHp=0;\n    s.potions'),'src/engine.js'));
 assert.equal(beforePotionFeedback('unrelated','src/loot.js'),'unrelated');
});
test('effective potion feedback: ordinary seeded expeditions preserve all state and reports',()=>{
 for(const seed of [1,42,999])for(const strategy of ['balanced','assault','sustain']){
  const a=current.createGame(seed),b=previous.createGame(seed);
  for(const [g,s] of [[current,a],[previous,b]]){g.act(s,'setStrategy',strategy);g.act(s,'start');}
  for(let n=0;n<900&&!a.wins&&a.mode==='battle';n++){current.advance(a,.1);previous.advance(b,.1);assert.deepEqual(a,b);}
  assert.deepEqual(current.expeditionReports(a),previous.expeditionReports(b));
 }
});
