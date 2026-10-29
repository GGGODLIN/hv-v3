import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as game from '../src/engine.js';
import {generateItem,createCommissionWeapon,createSoulboundItem,QUALITY_TIERS} from '../src/loot.js';
const clone=structuredClone;
function finish(s){for(let n=0;n<10000&&s.mode==='battle'&&s._phase==='fight';n++)game.advance(s,.1);assert.notEqual(s._phase,'fight');return game.expeditionReports(s)[0];}
function final(seed=42){const s=game.createGame(seed);game.act(s,'start');s.wave=4;s._clock=1;s.enemies=[{id:'final',name:'fixture',boss:true,hp:1,maxHp:1,attack:0,defense:0,evade:0,parry:0,block:0}];return s;}
function keepers(s){s.inventory=['weapon','armor','accessory'].flatMap(slot=>Array.from({length:3},(_,base)=>{let n=0;return {...generateItem(()=>n++===0?(base+.1)/3:0,3,slot),id:`keeper-${slot}-${base}`,locked:true,stats:{attack:100000,defense:100000,hp:100000,crit:1,evade:1,block:1,parry:100000}};}));}
function soldFixture(){for(let seed=1;seed<100;seed++){const s=final(seed);keepers(s);s.autoSell=true;const r=finish(s);if(r.loot.some(i=>i.disposition==='autoSold'))return {s,r,seed};}throw Error('sale fixture not found');}

test('normal earned clear records every actual drop in acquisition order, with no reward reads',()=>{
 const s=game.createGame(42);game.act(s,'start');game.act(s,'finishThenCamp',true);const r=finish(s);assert.equal(r.outcome,'win');assert.ok(r.loot.length>0&&r.loot.length<=6);
 assert.deepEqual(r.loot.map(i=>i.id),s.inventory.map(i=>i.id));
 for(const entry of r.loot){const item=s.inventory.find(i=>i.id===entry.id);for(const k of ['name','slot','quality','level'])assert.equal(entry[k],item[k]);assert.equal(entry.disposition,'inventory');assert.equal(entry.saleValue,0);assert.equal(Object.hasOwn(entry,'stats'),false);}
 const before=JSON.stringify(s);game.expeditionReports(s);JSON.stringify(game.expeditionReports(s));assert.equal(JSON.stringify(s),before);
});
test('receipts are detached through nested items and later equip/sale never rewrites history',()=>{
 const s=final(),r=finish(s),before=clone(r),views=game.expeditionReports(s);views[0].loot[0].name='changed';views[0].loot.push({});views[0].loot=[];
 assert.deepEqual(game.expeditionReports(s)[0],before);game.act(s,'retreat');game.act(s,'equip',r.loot[0].id);assert.deepEqual(game.expeditionReports(s)[0],before);
});
test('pending records original queue destination even after normal refill',()=>{
 const s=final();while(s.inventory.length<game.INVENTORY_LIMIT)s.inventory.push({...clone(s.equipment.armor),id:`filler-${s.inventory.length}`});
 const r=finish(s);assert.equal(r.loot.length,1);assert.equal(r.loot[0].disposition,'pending');assert.equal(r.loot[0].id,s.pendingLoot[0].id);
 s.inventory.pop();game.act(s,'retreat');assert.ok(s.inventory.some(i=>i.id===r.loot[0].id));assert.deepEqual(game.expeditionReports(s)[0].loot,r.loot);
});
test('automatic sale records actual proceeds and not an owned object',()=>{
 const {s,r}=soldFixture(),entry=r.loot.find(i=>i.disposition==='autoSold');const event=s.events.find(e=>e.target===entry.id&&e.text.startsWith('自動出售 '));
 assert.equal(entry.saleValue,event.value);assert.ok(entry.saleValue>0);assert.ok(!s.inventory.some(i=>i.id===entry.id));assert.equal(r.loot.length,1);
});
test('gold cap prevented automatic sale is recorded as retained, never as sold',()=>{
 const {seed}=soldFixture();const s=final(seed);keepers(s);s.autoSell=true;s.hero.gold=1e12;const r=finish(s);
 assert.equal(r.loot[0].disposition,'inventory');assert.equal(r.loot[0].saleValue,0);assert.equal(s.hero.gold,1e12);
});
test('retreat and defeat retain prior drops; repeated finish does not duplicate',()=>{
 for(const outcome of ['retreat','defeat']){let found;
  for(let seed=1;seed<100&&!found;seed++){const s=game.createGame(seed);game.act(s,'start');
   for(let n=0;n<3000&&s.mode==='battle'&&!s.inventory.length&&s._phase==='fight';n++)game.advance(s,.1);
   if(s.inventory.length&&s._phase==='fight')found=s;
  }
  assert.ok(found);const s=found,ids=s.inventory.map(i=>i.id);
  if(outcome==='retreat')game.act(s,'retreat');else{s.hero.hp=.01;s._clock=-100;s._enemyClock=100;for(const e of s.enemies){e.attack=1e9;e.evade=0;}for(let n=0;n<200&&s.mode==='battle';n++)game.advance(s,.1);}
  const r=game.expeditionReports(s)[0];assert.equal(r.outcome,outcome);assert.deepEqual(r.loot.map(i=>i.id),ids);game.act(s,'retreat');assert.deepEqual(game.expeditionReports(s)[0],r);
 }
});
test('empty expedition has explicit empty array and import cannot preserve or inject receipts',()=>{
 const s=game.createGame(42);game.act(s,'start');game.act(s,'retreat');assert.deepEqual(game.expeditionReports(s)[0].loot,[]);
 s.reports=[{loot:[{id:'invented'}]}];const loaded=game.validateSave(s);assert.deepEqual(game.expeditionReports(loaded),[]);assert.equal(Object.hasOwn(loaded,'reports'),false);
 game.act(loaded,'start');game.act(loaded,'retreat');assert.deepEqual(game.expeditionReports(loaded)[0].loot,[]);
});
test('IW1 records only actual drops, not its existing upgraded target or phantom clear reward',()=>{
 const raw=game.createGame(42);raw.hero.level=15;raw.worldSeeds=3;const s=game.validateSave(raw);s.equipment.weapon=createSoulboundItem({...createCommissionWeapon('axe',1),id:'bound-target'},15);
 const q=game.previewItemWorld(s,'bound-target');assert.equal(q.available,true);game.act(s,'enterItemWorld',q);
 while(game.itemWorldView(s).active){for(const e of s.enemies){if(e.hp<=0)continue;e.hp=1;e.evade=0;e.parry=0;e.block=0;e.defense=0;e.attack=0;}game.advance(s,.1);}
 const r=game.expeditionReports(s)[0];assert.equal(r.outcome,'win');assert.ok(r.loot.length<=7);assert.deepEqual(r.loot.map(i=>i.id),s.inventory.map(i=>i.id));assert.ok(!r.loot.some(i=>i.id==='bound-target'));
});
function renderLoot(value){const js=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');const source=js.slice(js.indexOf('function expeditionLootContext('),js.indexOf('// Read only the detached departure snapshot'));
 const node=(tag,className,text='')=>({tag,className,textContent:text,children:[],dataset:{},setAttribute(){},addEventListener(){},append(...children){this.children.push(...children);}});
 return runInNewContext(`${source};expeditionLootContext(value)`,{value,node,state:{inventory:[],pendingLoot:[],equipment:{}},format:n=>String(n),qualityName:q=>QUALITY_TIERS.find(t=>t.name===q)?.label||q});
}
const text=n=>[n.textContent,...n.children.map(text)].join(' ');
test('UI uses collapsed receipt details with historical-destination caveat and no phantom inspection',()=>{
 const node=renderLoot([{id:'loot-1',name:'<script>not HTML</script>',slot:'weapon',quality:'Superior',level:3,disposition:'autoSold',saleValue:86}]);
 assert.equal(node.tag,'details');assert.equal(node.open,undefined);assert.match(text(node),/取得時自動出售 · 實收 86/);assert.match(text(node),/不代表目前仍持有/);assert.match(text(node),/不會再發獎/);assert.ok(!JSON.stringify(node).includes('"reportLootId"'));
 assert.match(text(renderLoot([])),/本場沒有取得裝備/);assert.match(text(renderLoot(undefined)),/未記錄掉寶明細/);
});
