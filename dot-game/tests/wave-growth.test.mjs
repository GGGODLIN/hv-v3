import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,act,advance,stats} from '../src/engine.js';
const enemy=(id='last')=>({id,name:'測試敵人',hp:1,maxHp:1,attack:0,mitigation:0,evade:0,parry:0,block:0,resist:0,boss:false});
function setup({hp,levelUp=true,bleed=false,wave=1}={}){
 const s=createGame(1);act(s,'start');s.wave=wave;s.enemies=[enemy()];
 if(levelUp)s.hero.xp=s.hero.xpNext-1;
 if(hp!==undefined)s.hero.hp=hp;
 s.hero.mp=0;s._enemyClock=-100;
 if(bleed){s._clock=-100;s.enemies[0].bleeding={stacks:1,expiresAtTick:7,damagePerTick:1};}
 return s;
}
for(const bleed of [false,true]){
 test(`wave recovery retains newly earned max HP after ${bleed?'bleed':'basic'} kill level-up`,()=>{
  const s=setup({bleed}),oldMax=stats(s).maxHp;advance(s,1.05);
  assert.equal(s.hero.level,2);assert.equal(s.wave,2);assert.ok(stats(s).maxHp>oldMax);
  assert.equal(s.hero.hp,stats(s).maxHp);assert.equal(s.kills,1);assert.equal(s.wins,0);
 });
 test(`injured ${bleed?'bleed':'basic'} clear uses new maximum for the existing ten-percent recovery`,()=>{
  const s=setup({hp:100,bleed});advance(s,1.05);
  assert.equal(s.hero.level,2);assert.equal(s.wave,2);
  assert.equal(s.hero.hp,100+90+stats(s).maxHp*.1);
 });
 test(`no-level ${bleed?'bleed':'basic'} clear preserves ordinary wave recovery`,()=>{
  const s=setup({hp:100,levelUp:false,bleed}),max=stats(s).maxHp;advance(s,1.05);
  assert.equal(s.hero.level,1);assert.equal(s.wave,2);assert.equal(s.hero.hp,100+max*.1);
 });
}
test('a leveling kill that does not clear the wave gets no extra wave recovery',()=>{
 const s=setup({hp:100});s.enemies.push({...enemy('survivor'),hp:10000,maxHp:10000});advance(s,1.05);
 assert.equal(s.hero.level,2);assert.equal(s.wave,1);assert.equal(s.hero.hp,190);
});
test('final wave still settles the win and existing full recovery once',()=>{
 const s=setup({hp:100,wave:4});advance(s,1.05);
 assert.equal(s.wins,1);assert.equal(s._phase,'intermission');assert.equal(s.hero.hp,stats(s).maxHp);
 const durable=JSON.stringify([s.hero,s.wins,s.inventory,s.pendingLoot]);advance(s,.1);
 assert.equal(JSON.stringify([s.hero,s.wins,s.inventory,s.pendingLoot]),durable);
});
