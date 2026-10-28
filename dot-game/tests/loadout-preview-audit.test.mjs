import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, act, stats } from '../src/engine.js';
import { fullUI, clone, find, collect } from './helpers/comparison-focus-harness.mjs';

const keys = ['maxHp','attack','mitigation','crit','evade','block','parry'];
const rates = new Set(['mitigation','crit','evade','block','parry']);
const shown = (key, value) => `${Number((value * (rates.has(key) ? 100 : 1)).toFixed(4))}${rates.has(key) ? '%' : ''}`;
const difference = (key, before, after) => {
  const amount = after - before;
  if (amount === 0) return '相同';
  const magnitude = Math.abs(amount) * (rates.has(key) ? 100 : 1);
  return `${amount > 0 ? '+' : '-'}${magnitude < .0001 ? '<0.0001' : Number(magnitude.toFixed(4))}${rates.has(key) ? ' 百分點' : ''}`;
};
function fixture(slot='weapon') {
  const s=createGame(8128);
  s.hero.level=30;s.hero.proficiency=3;
  act(s,'learnAbility','hp-tank');act(s,'slotAbility','hp-tank');
  act(s,'learnAbility','one-handed-damage');act(s,'slotAbility','one-handed-damage');
  s.inventory=[{...clone(s.equipment[slot]),id:'audit-preview',name:'預覽審核裝備',locked:false}];
  return s;
}
function setup(s=fixture(), pending=false) {
  const h=fullUI(s);
  h.run(`selectedId='audit-preview';selectedSlot=null;render(true)`);
  return h;
}
function preview(h) { return find(h.dom['item-detail'],e=>e.className.split(' ').includes('loadout-preview')); }
function row(h,key) { const root=preview(h);assert.ok(root,'preview exists');const found=find(root,e=>e.dataset.stat===key);assert.ok(found,`row ${key}`);return found; }
function expectedAfter(s,id='audit-preview') {
  const next=clone(s);next.mode='town';
  const pending=next.pendingLoot.find(item=>item.id===id);
  if(pending) {next.pendingLoot=next.pendingLoot.filter(item=>item!==pending);next.inventory.push(pending);}
  act(next,'equip',id);return stats(next);
}
function assertRows(h) {
  const before=stats(h.state),after=expectedAfter(h.state);
  for(const key of keys) {
    const r=row(h,key), text=collect(r);
    assert.ok(text.includes(`${shown(key,before[key])} → ${shown(key,after[key])}`),`${key}: ${text}`);
    assert.equal(r.children.at(-1).textContent,difference(key,before[key],after[key]),`delta ${key}`);
  }
}
test('audit: all visible projected totals match actual equip with abilities, without transactions',()=>{
  const s=fixture();s.inventory[0].stats={attack:48.75,hp:23,defense:8,crit:.002,evade:.004,block:.008,parry:6.125};
  const h=setup(s),snapshot=JSON.stringify(h.state),calls=clone(h.calls),writes=clone(h.writes);
  assertRows(h);for(let i=0;i<3;i++)h.render();
  assert.equal(JSON.stringify(h.state),snapshot);assert.deepEqual(h.calls,calls);assert.deepEqual(h.writes,writes);assert.deepEqual(h.faults,[]);
});
test('audit: mitigation is multiplicative panel percentage, not sum of defense ratings',()=>{
  const s=fixture('armor');s.equipment.weapon.stats.defense=30;s.equipment.accessory.stats.defense=20;
  s.equipment.armor.stats.defense=10;s.inventory[0].stats.defense=20;
  const h=setup(s);assertRows(h);
  const delta=row(h,'mitigation').children.at(-1).textContent;
  assert.notEqual(delta,'+10 百分點');assert.match(delta,/百分點/);
});
test('audit: parry rating improvement above cap correctly projects zero probability gain',()=>{
  const s=fixture();s.equipment.weapon.stats.parry=48;s.inventory[0].stats.parry=60;
  const h=setup(s);assertRows(h);assert.equal(row(h,'parry').children.at(-1).textContent,'相同');
  assert.ok(collect(row(h,'parry')).includes('50% → 50%'));
});
test('audit: unchanged equip totals show equality rather than imaginary positive upgrade',()=>{
  const h=setup();assertRows(h);for(const key of keys)assert.equal(row(h,key).children.at(-1).textContent,'相同');
});
test('audit: negative stats and very small rates preserve downgrade direction',()=>{
  const s=fixture();s.inventory[0].stats.attack=Math.max(0,s.inventory[0].stats.attack-1.25);
  s.equipment.weapon.stats.crit=.02;s.inventory[0].stats.crit=.02-1e-9;
  const h=setup(s);assertRows(h);assert.equal(row(h,'crit').children.at(-1).textContent,'-<0.0001 百分點');
});
test('audit: non-forced repaint follows proficiency, attributes and equipped abilities',()=>{
  const h=setup();const initial=collect(preview(h));
  h.run('state.hero.proficiency+=1;render(false)');assertRows(h);assert.notEqual(collect(preview(h)),initial);
  h.run('state.hero.attributes.str+=3;state.hero.attributes.agi+=4;state.hero.attributes.end+=5;render(false)');assertRows(h);
  h.run("act(state,'unslotAbility','hp-tank');render(false)");assertRows(h);
});
test('audit: pending and readonly/battle projection remains available but does not equip',()=>{
  const s=fixture();s.pendingLoot=[s.inventory.pop()];const h=setup(s);
  assertRows(h);assert.match(collect(preview(h)),/領/);
  h.run("state.mode='battle';tabOwner=false;render(true)");const before=JSON.stringify(h.state),calls=clone(h.calls),writes=clone(h.writes);
  assertRows(h);assert.match(collect(h.dom['item-detail']),/回營|領/);h.render();
  assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.calls,calls);assert.deepEqual(h.writes,writes);
});
test('audit: worn and empty selection do not present self-equipping projections',()=>{
  const h=setup();h.run("selectedId=null;selectedSlot='weapon';render(true)");assert.equal(preview(h),undefined);
  h.run('selectedId=null;selectedSlot=null;render(true)');assert.equal(preview(h),undefined);
});
test('audit: preview states modeling limits rather than promises of DPS or win rate',()=>{
  const h=setup();const text=collect(preview(h));assert.match(text,/DPS/);assert.match(text,/勝率/);assert.match(text,/特效/);assert.match(text,/敵/);
});
test('audit: saved-set protected equipment remains inspectable without unlocking references',()=>{
  const s=fixture('accessory'),old=s.equipment.accessory.id;
  act(s,'equip','audit-preview');act(s,'saveGearSet','a');act(s,'equip',old);
  const h=setup(s);h.run('state.hero.hp=1;state.hero.mp=0;render(true)');
  const before=JSON.stringify(h.state),calls=clone(h.calls),writes=clone(h.writes);
  assertRows(h);assert.match(collect(h.dom['item-detail']),/配裝保護中/);h.render();
  assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.calls,calls);assert.deepEqual(h.writes,writes);
  assert.equal(h.state.hero.hp,1);assert.equal(h.state.hero.mp,0);
});
test('audit: changing viewed slot updates projection using that exact item, not the prior weapon',()=>{
  const h=setup();h.run("state.inventory.push({...state.equipment.armor,id:'audit-armor',stats:{defense:20,hp:101}});selectedId='audit-armor';render(true)");
  const before=stats(h.state),after=expectedAfter(h.state,'audit-armor');
  for(const key of keys)assert.ok(collect(row(h,key)).includes(`${shown(key,before[key])} → ${shown(key,after[key])}`));
});
test('audit: defeat condition does not claim equip is forbidden while the existing action remains enabled',()=>{
  const h=setup();h.run("state.mode='defeat';tabOwner=true;render(true)");
  const equip=find(h.dom['item-detail'],e=>e.tag==='button'&&e.textContent==='換上裝備');
  assert.equal(equip.disabled,false);
  const condition=find(preview(h),e=>e.className==='loadout-preview-condition');
  assert.doesNotMatch(condition.textContent,/回營後才能換裝/);
  assertRows(h);
});
