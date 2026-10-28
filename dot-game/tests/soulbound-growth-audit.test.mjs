import test from 'node:test';
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import * as loot from '../src/loot.js';
import {fullUI,clone,collect} from './helpers/comparison-focus-harness.mjs';

// Independent source-DOM audit; this does not claim browser, layout or accessibility-tree coverage.
function bound(family='rapier',level=7,{iw=false,missingParry=false}={}) {
  const base={...loot.createCommissionWeapon(family,1),id:`audit-${family}`};
  if(missingParry){delete base.stats.parry;delete base.rolls.parry;base.power=loot.scoreItem(base);}
  let item=loot.createSoulboundItem(base,level);assert.ok(item);
  if(iw){item=loot.createItemWorldUpgrade(item,level);assert.ok(item);}
  return item;
}
function fixture(item,location='inventory') {
  const s=game.createGame(42);s.hero.level=item.level;s.hero.xpNext=game.cumulativeXp(Math.min(500,item.level+1))-game.cumulativeXp(item.level);
  if(location==='equipped')s.equipment.weapon=item;else if(location==='inventory')s.inventory=[item];else s.pendingLoot=[item];
  return s;
}
function select(h,item,location='inventory') {
  h.run(`selectedSlot=${location==='equipped'?"'weapon'":'null'};selectedId=${JSON.stringify(item.id)};renderItemDetail();`);
  return h.dom['item-detail'].querySelector('.soulbound-growth-preview');
}
function checkRows(section,item,next) {
  assert.ok(section);const rows=section.querySelectorAll('.soulbound-growth-row');
  assert.equal(rows.length,Object.keys(item.stats).length);
  for(const row of rows){const key=row.dataset.stat;const display=n=>['crit','evade','block'].includes(key)?`${Number((n*100).toFixed(4))}%`:String(Number(n.toFixed(4)));
    assert.equal(row.children[1].textContent,`${display(item.stats[key])} → ${display(next.stats[key])}`,key);
    assert.ok(!row.children[1].textContent.includes('NaN'));
    const difference=next.stats[key]-item.stats[key],rate=['crit','evade','block'].includes(key),magnitude=Math.abs(difference)*(rate?100:1);
    const expected=difference===0?'相同':`${difference>0?'+':'-'}${magnitude<0.0001?'<0.0001':Number(magnitude.toFixed(4))}${rate?' 百分點':''}`;
    assert.equal(row.children[2].textContent,expected,`${key} signed absolute delta`);
  }
}
for(const family of ['axe','rapier','club'])for(const location of ['equipped','inventory','pending'])test(`v067 independent: ${family} ${location} next growth exactly matches scaler without writes`,()=>{
  const item=bound(family),h=fullUI(fixture(item,location));const before=JSON.stringify(h.state),writes=clone(h.writes),calls=clone(h.calls);
  h.run('Math.random=()=>{throw Error("preview RNG forbidden")};');
  for(let n=0;n<3;n++){const section=select(h,item,location);checkRows(section,item,loot.scaleSoulboundItem(item,8));assert.equal(section.querySelectorAll('button').length,0);assert.match(collect(section),/不是下一級角色總面板/);}
  assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.writes,writes);assert.deepEqual(h.calls,calls);assert.deepEqual(h.faults,[]);
});
for(const iw of [false,true])for(const missingParry of [false,true])test(`v067 independent: IW=${iw}, legacy missing parry=${missingParry} preserves anchor and exact fields`,()=>{
  const item=bound('rapier',7,{iw,missingParry}),h=fullUI(fixture(item)),before=JSON.stringify(h.state);
  const section=select(h,item);checkRows(section,item,loot.scaleSoulboundItem(item,8));
  assert.equal(section.querySelectorAll('.soulbound-growth-row').some(row=>row.dataset.stat==='parry'),!missingParry);
  assert.equal(collect(section).includes('既有 IW1 加成'),iw);assert.equal(JSON.stringify(h.state),before);
});
test('v067 independent: max 500 has no next-level rows and unbound has no growth section',()=>{
  const max=bound('axe',500),h=fullUI(fixture(max)),section=select(h,max);
  assert.match(collect(section),/Lv.500/);assert.equal(section.querySelectorAll('.soulbound-growth-row').length,0);
  const unbound={...loot.createCommissionWeapon('club',1),id:'unbound-audit'};h.state.inventory=[unbound];assert.equal(select(h,unbound),null);
});
test('v067 independent: damaged binding and mismatched live level fail closed without mutation',()=>{
  for(const change of [h=>h.state.inventory[0].soulbound={...h.state.inventory[0].soulbound,version:99},h=>h.state.inventory[0].stats.attack++,h=>h.state.hero.level++,h=>h.state.hero.level=7.5,h=>h.state.inventory[0].locked=false]){
    const item=bound(),h=fullUI(fixture(item));change(h);const before=JSON.stringify(h.state),writes=clone(h.writes);
    const section=select(h,item);assert.match(collect(section),/無法預覽/);assert.equal(section.querySelectorAll('.soulbound-growth-row').length,0);assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.writes,writes);
  }
});
test('v067 independent: readonly and battle inspection stay available and observational',()=>{
  for(const mode of ['readonly','battle']){const item=bound('club'),h=fullUI(fixture(item));if(mode==='readonly')h.run('tabOwner=false');else game.act(h.state,'start');
    const before=JSON.stringify(h.state),writes=clone(h.writes),calls=clone(h.calls);const section=select(h,item);checkRows(section,item,loot.scaleSoulboundItem(item,8));
    assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.writes,writes);assert.deepEqual(h.calls,calls);
  }
});
test('v067 independent: real kill synchronizes all locations to preview and UI advances to subsequent level',()=>{
  const equipped=bound('axe',1),inventory=bound('rapier',1),pending=bound('club',1),s=fixture(equipped,'equipped');s.inventory=[inventory];s.hero.xp=s.hero.xpNext-1;
  const h=fullUI(s);game.act(h.state,'start');h.state.pendingLoot=[pending];
  const expected=[equipped,inventory,pending].map(item=>loot.scaleSoulboundItem(item,2));
  for(const [i,location]of ['equipped','inventory','pending'].entries())checkRows(select(h,[equipped,inventory,pending][i],location),[equipped,inventory,pending][i],expected[i]);
  h.state.enemies.forEach(enemy=>enemy.hp=1);game.advance(h.state,1.1);assert.equal(h.state.hero.level,2);
  for(const [i,location]of ['equipped','inventory','pending'].entries()){
    const actual=location==='equipped'?h.state.equipment.weapon:location==='inventory'?h.state.inventory.find(x=>x.id===expected[i].id):h.state.pendingLoot.find(x=>x.id===expected[i].id);
    assert.deepEqual(clone(actual),clone(expected[i]));const section=select(h,actual,location);checkRows(section,actual,loot.scaleSoulboundItem(actual,3));assert.match(collect(section),/Lv.2 → Lv.3/);
  }
});

test('v067 independent: capped rates stay equal and deeply frozen item is never touched',()=>{
  const base={...loot.createCommissionWeapon('rapier',1),id:'audit-cap'};base.stats.crit=.16;base.power=loot.scoreItem(base);
  const item=loot.createSoulboundItem(base,499);assert.ok(item);const h=fullUI(fixture(item));
  function freeze(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;}
  freeze(h.state.inventory[0]);const before=JSON.stringify(h.state);const section=select(h,item);checkRows(section,item,loot.scaleSoulboundItem(item,500));
  const crit=section.querySelectorAll('.soulbound-growth-row').find(row=>row.dataset.stat==='crit');assert.equal(crit.children[1].textContent,'16% → 16%');assert.equal(crit.children[2].textContent,'相同');assert.equal(JSON.stringify(h.state),before);
});
