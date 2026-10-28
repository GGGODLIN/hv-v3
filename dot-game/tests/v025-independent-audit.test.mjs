import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';
import * as engine from '../src/engine.js';
import * as session from '../src/session.js';
import * as loot from '../src/loot.js';

// Independent UI/controller audit. Item locations and currencies below are
// deliberately synthetic, valid fixtures; they are not natural-play evidence.
const source=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const copy=value=>JSON.parse(JSON.stringify(value));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const collect=el=>[el.textContent,...el.children.map(collect)].filter(Boolean).join(' ');
const descendants=(el,predicate)=>[...(predicate(el)?[el]:[]),...el.children.flatMap(child=>descendants(child,predicate))];
function fixture(){
  const s=engine.createGame(73),make=(id,family='rapier')=>({...loot.createCommissionWeapon(family,1),id,locked:false});
  const legacy=make('legacy-rapier');delete legacy.weaponFamily;
  const unknown=make('explicit-unknown');unknown.weaponFamily=null;
  const boundLegacy=make('bound-legacy');delete boundLegacy.weaponFamily;
  s.inventory=[make('axe','axe'),make('club','club'),make('rapier'),legacy,unknown,
    loot.createSoulboundItem(boundLegacy,1),loot.createItemWorldUpgrade(loot.createSoulboundItem(make('iw-rapier'),1),1),
    {...s.equipment.armor,id:'armor',locked:false},{...s.equipment.accessory,id:'accessory',locked:false}];
  assert.ok(s.inventory.every(Boolean));
  return engine.validateSave(s);
}
function fullUI(initial=fixture()){
  let document;
  function element(tag='div'){
    const listeners=new Map(),fallback=new Map();
    return {tag,className:'',textContent:'',children:[],hidden:false,disabled:false,open:false,value:'',dataset:{},attributes:{},
      style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;},
      addEventListener(type,fn){listeners.set(type,[...(listeners.get(type)||[]),fn]);},
      async emit(type,event={}){for(const fn of listeners.get(type)||[])await fn({target:this,...event});},
      click(){return this.emit('click');},focus(){document.activeElement=this;},setAttribute(key,value){this.attributes[key]=value;},remove(){},
      querySelector(selector){const found=selector.startsWith('.')&&descendants(this,el=>el.className.split(' ').includes(selector.slice(1)))[0];if(found)return found;if(!fallback.has(selector))fallback.set(selector,element());return fallback.get(selector);},
      showModal(){this.open=true;},close(){if(!this.open)return;this.open=false;this.emit('close');},
      getBoundingClientRect(){return {width:640,height:360,left:0,top:0,right:640,bottom:360};},getContext(){return {};}};
  }
  const dom=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],element()]));
  for(const [,id,body] of html.matchAll(/<select\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){
    const options=[...body.matchAll(/<option\b([^>]*)value="([^"]+)"([^>]*)>/g)];
    dom[id].value=(options.find(m=>/\bselected\b/.test(m[1]+m[3]))||options[0])?.[2]??'';
  }
  const window=element('window');document=element('document');
  Object.assign(document,{hidden:false,body:element('body'),activeElement:null,getElementById:id=>dom[id],createElement:element,
    querySelectorAll:selector=>selector==='dialog'?Object.entries(dom).filter(([id])=>id.endsWith('-dialog')).map(([,el])=>el):[]});
  window.matchMedia=()=>({matches:true});
  let raw=JSON.stringify(initial),now=0;const calls=[],faults=[],writes=[];
  const context=createContext({...engine,...session,...loot,JSON,window,document,location:{pathname:'/play/hv-v3-dot/candidates/audit-v025/'},
    previewSelectedSale:(state,ids)=>engine.previewSelectedSale(state,copy(ids)),
    act(state,action,payload){calls.push({action,payload:payload===undefined?null:copy(payload)});return engine.act(state,action,payload&&typeof payload==='object'?copy(payload):payload);},
    performance:{now:()=>now},navigator:{},crypto:{randomUUID:()=> 'inventory-independent-audit'},console:{warn(){},error(...args){faults.push(args);}},confirm:()=>true,
    localStorage:{getItem:key=>key.endsWith('save-v3')?raw:null,setItem:(...args)=>writes.push(args)},setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},requestAnimationFrame(){},ResizeObserver:class{observe(){}}});
  const run=code=>runInContext(code,context);run(source.replace(/^import .+;\n/gm,''));
  return {dom,window,document,calls,faults,writes,run,get state(){return run('state');},render(){run('render(true)');},
    async filter(id,value){dom[id].value=value;dom[id].focus();await dom[id].emit('change');},
    async import(value){const text=JSON.stringify(value);await dom['save-file'].emit('change',{target:{value:'audit.json',files:[{size:text.length,text:async()=>text}]}});},
    set saved(value){raw=JSON.stringify(value);},at(value){now=value;}};
}
const choose=(h,id)=>h.run(`toggleSelectedSale(${JSON.stringify(id)},true)`);
const visibleIds=h=>[...h.run('selectedSaleCheckboxes.keys()')];
const filter=(slot='all',family='all',investment='all')=>({slot,family,investment,quality:'all',protection:'all',name:''});
const matches=(h,item,filters)=>h.run(`inventoryMatchesFilters(${JSON.stringify(item)},${JSON.stringify(filters)})`);

test('v026 compatibility: frozen v025 gameplay/session preserve v024 identities; current session and prior31 fixtures stay exact',()=>{
  for(const [name,expected] of Object.entries({'engine.js':'54dda1cf9982b4eab2336071d43cf398a1ad35fbe4397508f6fed5afedb5d974','loot.js':'8ca322c77ab265d88ebfdf1b64247e9170cbdd47fdb14f68b702903c368259cd','session.js':'821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a'}))assert.equal(hash(readFileSync(new URL(`./fixtures/v0.25/src/${name}`,import.meta.url))),expected,name);
  assert.equal(hash(readFileSync(new URL('../src/session.js',import.meta.url))),'821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a','current session remains exact v025');
  const base=new URL('./fixtures/',import.meta.url);let count=0;
  const visit=(url,prefix='')=>readdirSync(url,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en')).flatMap(entry=>entry.isDirectory()?visit(new URL(`${entry.name}/`,url),`${prefix}${entry.name}/`):[{path:`${prefix}${entry.name}`,sha:hash(readFileSync(new URL(entry.name,url)))}]);
  // New exact baselines are audited separately; this remains the original31.
  const rows=visit(base).filter(row=>!row.path.startsWith('v0.25/')&&!row.path.startsWith('v0.26/')).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);count=rows.length;
  assert.equal(count,31);assert.equal(hash(rows.map(row=>`${row.path}\0${row.sha}\n`).join('')),'285b3af0981f7cb06c7e5a2bed8d6cf32f37847660e08b65e5ebc0ba62761b09');
});

test('v025 independent: family filter follows exact actual identity, legacy fallback, unknown sentinel and never prose',()=>{
  const h=fullUI(),s=h.state;
  const expected={axe:['axe'],club:['club'],rapier:['rapier','legacy-rapier','bound-legacy','iw-rapier'],unknown:['explicit-unknown']};
  for(const [family,ids] of Object.entries(expected))assert.deepEqual(s.inventory.filter(item=>matches(h,item,filter('all',family))).map(i=>i.id),ids);
  const misleading={...copy(s.inventory[0]),name:'刺劍・靈巧',description:'刺劍',weaponFamily:'axe'};
  assert.equal(matches(h,misleading,filter('all','axe')),true);assert.equal(matches(h,misleading,filter('all','rapier')),false);
  const unknown={...misleading,weaponFamily:null};assert.equal(matches(h,unknown,filter('all','unknown')),true);
  for(const slot of ['armor','accessory'])assert.equal(matches(h,{...unknown,slot},filter('all','unknown')),false);
  assert.equal(h.calls.length,0);assert.equal(h.faults.length,0);
});

test('v025 independent: investment buckets are disjoint, no implicit lock/preset interpretation or higher-IW fiction',()=>{
  const h=fullUI(),s=h.state;
  const expected={unbound:['axe','club','rapier','legacy-rapier','explicit-unknown','armor','accessory'],bound:['bound-legacy'],iw1:['iw-rapier']};
  for(const [investment,ids] of Object.entries(expected))assert.deepEqual(s.inventory.filter(item=>matches(h,item,filter('all','all',investment))).map(i=>i.id),ids);
  const locked={...copy(s.inventory[0]),locked:true};assert.equal(matches(h,locked,filter('all','all','unbound')),true);
  assert.equal(matches(h,locked,filter('all','all','bound')),false);
  assert.equal(s.inventory.filter(i=>matches(h,i,filter('armor','rapier','all'))).length,0);
  assert.equal(s.inventory.filter(i=>matches(h,i,filter('weapon','rapier','bound')))[0].id,'bound-legacy');
});

test('v025 independent: 48 filter intersections agree with rendered IDs and hidden-sale counts without changing save/RNG/items',async()=>{
  const h=fullUI();for(const id of ['axe','rapier','armor'])choose(h,id);
  const before=JSON.stringify(h.state),selected=copy(h.run('[...selectedSaleIds]')),writes=h.writes.length,calls=h.calls.length;
  for(const slot of ['all','weapon','armor','accessory'])for(const family of ['all','rapier','unknown'])for(const investment of ['all','unbound','bound','iw1']){
    const f=filter(slot,family,investment);await h.filter('slot-filter',slot);await h.filter('family-filter',family);await h.filter('investment-filter',investment);
    const expected=h.state.inventory.filter(item=>matches(h,item,f)).map(i=>i.id).reverse();assert.deepEqual(visibleIds(h),expected);assert.match(h.dom['inventory-filter-status'].textContent,new RegExp(`背包顯示 ${expected.length}／9 件`));
    const hidden=selected.filter(id=>!expected.includes(id)).length;
    assert.match(h.dom['selected-sale-status'].textContent,/已選 3 件/);
    if(hidden)assert.match(h.dom['selected-sale-status'].textContent,new RegExp(`另有 ${hidden} 件在目前篩選外`));else assert.doesNotMatch(h.dom['selected-sale-status'].textContent,/在目前篩選外/);
    assert.deepEqual(copy(h.run('[...selectedSaleIds]')),selected);assert.equal(JSON.stringify(h.state),before);
  }
  assert.equal(h.writes.length,writes);assert.equal(h.calls.length,calls);assert.equal(h.faults.length,0);
});

test('v025 independent: hidden selections remain in exact full quote; confirmation sells just those IDs once',async()=>{
  const h=fullUI(),equipment=copy(h.state.equipment);for(const id of ['axe','rapier','armor'])choose(h,id);
  await h.filter('family-filter','club');await h.filter('investment-filter','bound');
  assert.equal(visibleIds(h).length,0);const price=engine.previewSelectedSale(h.state,['axe','rapier','armor']).total,gold=h.state.hero.gold;
  h.run('openSelectedSale()');const text=collect(h.dom['selected-sale-list']);
  for(const id of ['axe','rapier','armor'])assert.ok(text.includes(`ID：${id}`),id);
  assert.equal(h.dom['selected-sale-list'].children.length,3);h.run('confirmSelectedSale();confirmSelectedSale()');
  assert.deepEqual(h.calls.filter(c=>c.action==='sellSelected').map(c=>c.payload.ids),[['axe','rapier','armor']]);
  assert.equal(h.state.hero.gold,gold+price);assert.deepEqual(copy(h.state.equipment),equipment);
  assert.ok(h.state.inventory.every(i=>!['axe','rapier','armor'].includes(i.id)));assert.ok(h.state.inventory.some(i=>i.id==='bound-legacy'));assert.ok(h.state.inventory.some(i=>i.id==='iw-rapier'));
});

for(const mutation of ['state.hero.gold++','state.inventory.find(i=>i.id==="axe").locked=true','state.equipment.weapon.name="changed"','tabOwner=false','state.mode="battle"'])test(`v025 independent: filtered stale sale ${mutation} is rejected atomically`,async()=>{
  const h=fullUI();choose(h,'axe');choose(h,'armor');await h.filter('family-filter','unknown');h.run('openSelectedSale()');h.run(mutation);const before=JSON.stringify(h.state);
  h.render();h.run('confirmSelectedSale();confirmSelectedSale()');assert.equal(JSON.stringify(h.state),before);assert.equal(h.calls.filter(c=>c.action==='sellSelected').length,0);assert.equal(h.dom['selected-sale-confirm'].disabled,true);
});

test('v025 independent: native filter controls keep keyboard focus and never change inspected item or selections',async()=>{
  const h=fullUI();choose(h,'axe');h.run('selectedId="rapier";selectedSlot=null;render(true)');
  for(const [id,value] of [['slot-filter','weapon'],['family-filter','club'],['investment-filter','iw1'],['sort-select','level']]){
    await h.filter(id,value);assert.equal(h.document.activeElement,h.dom[id],id);assert.equal(h.run('selectedId'),'rapier');assert.equal(h.run('selectedSlot'),null);assert.deepEqual(copy(h.run('[...selectedSaleIds]')),['axe']);
  }
  assert.ok(collect(h.dom['item-detail']).includes('刺劍'));assert.match(collect(h.dom['item-detail']),/篩選/);
  const before=JSON.stringify(h.state);await h.dom['reset-inventory-filters'].click();assert.equal(JSON.stringify(h.state),before);assert.deepEqual(copy(h.run('[...selectedSaleIds]')),['axe']);assert.equal(visibleIds(h).length,9);
});

test('v025 independent: filter state is transient, fresh load resets defaults and import never carries sale consent',async()=>{
  const h=fullUI();choose(h,'axe');await h.filter('family-filter','club');await h.filter('investment-filter','iw1');h.run('openSelectedSale()');
  const saved=copy(h.state);assert.ok(!Object.keys(saved).some(k=>/filter/i.test(k)));
  const reloaded=fullUI(saved);assert.deepEqual(copy(reloaded.run('inventoryFilters()')),filter());assert.equal(reloaded.run('selectedSaleIds.size'),0);assert.equal(visibleIds(reloaded).length,9);
  await h.import(saved);assert.equal(h.run('selectedSaleIds.size'),0);assert.equal(h.dom['selected-sale-dialog'].open,false);assert.equal(h.calls.filter(c=>c.action==='sellSelected').length,0);
  assert.deepEqual(copy(h.run('inventoryFilters()')),filter());
});

test('v025 independent: filters are read-only during battle and preserve disabled sale controls',async()=>{
  const h=fullUI();h.run('dispatch("start")');assert.equal(h.state.mode,'battle');const before=JSON.stringify(h.state),calls=h.calls.length,writes=h.writes.length;
  await h.filter('family-filter','rapier');await h.filter('investment-filter','iw1');h.render();
  assert.equal(JSON.stringify(h.state),before);assert.equal(h.calls.length,calls);assert.equal(h.writes.length,writes);assert.ok([...h.run('selectedSaleCheckboxes.values()')].every(check=>check.disabled));assert.equal(h.dom['review-selected-sale'].disabled,true);
});

test('v025 independent: zero-match reset is an explicit focused view action, not empty-backpack or equipment loss',async()=>{
  const h=fullUI();await h.filter('slot-filter','armor');await h.filter('family-filter','rapier');const before=JSON.stringify(h.state);
  assert.equal(visibleIds(h).length,0);assert.match(collect(h.dom['inventory-list']),/同時符合/);assert.match(h.dom['inventory-filter-status'].textContent,/0／9 件/);
  const reset=descendants(h.dom['inventory-list'],el=>el.tag==='button')[0];assert.ok(reset);await reset.click();
  assert.equal(visibleIds(h).length,9);assert.equal(h.document.activeElement,h.dom['slot-filter']);assert.equal(JSON.stringify(h.state),before);assert.equal(h.calls.length,0);
  const empty=fullUI(engine.createGame(9));assert.match(empty.dom['inventory-filter-status'].textContent,/0／0 件/);assert.match(collect(empty.dom['inventory-list']),/背包還很輕/);assert.equal(empty.dom['reset-inventory-filters'].disabled,true);
});

test('v025 independent: counts never include equipped or pending items and read-only browsing never obtains sale rights',async()=>{
  const initial=fixture();initial.pendingLoot=[{...loot.createCommissionWeapon('rapier',1),id:'pending-rapier'}];
  const h=fullUI(initial);h.run('tabOwner=false');const before=JSON.stringify(h.state),calls=h.calls.length,writes=h.writes.length;
  await h.filter('family-filter','rapier');assert.deepEqual(visibleIds(h),['iw-rapier','bound-legacy','legacy-rapier','rapier']);assert.match(h.dom['inventory-filter-status'].textContent,/4／9 件/);
  assert.equal(h.state.pendingLoot.length,1);assert.equal(h.state.equipment.weapon.id,initial.equipment.weapon.id);assert.ok([...h.run('selectedSaleCheckboxes.values()')].every(c=>c.disabled));
  assert.equal(JSON.stringify(h.state),before);assert.equal(h.calls.length,calls);assert.equal(h.writes.length,writes);
});

test('v025 independent: successful commission explicitly reveals delivered weapon despite excluding filters, only once',async()=>{
  const initial=fixture();initial.wins=1;initial.hero.gold=5000;const h=fullUI(initial),beforeEquipment=copy(h.state.equipment),beforeIds=h.state.inventory.map(i=>i.id);
  await h.filter('slot-filter','armor');await h.filter('family-filter','axe');await h.filter('investment-filter','iw1');await h.filter('sort-select','power');
  h.run('openWeaponCommission("club")');const quote=copy(h.run('commissionConsent'));assert.ok(quote);h.run('confirmWeaponCommission();confirmWeaponCommission()');
  const item=h.state.inventory.find(i=>!beforeIds.includes(i.id));assert.ok(item);assert.equal(item.weaponFamily,'club');assert.equal(item.locked,true);
  assert.deepEqual(copy(h.run('inventoryFilters()')),filter('weapon'));assert.equal(h.dom['sort-select'].value,'new');assert.ok(visibleIds(h).includes(item.id));assert.equal(h.run('selectedId'),item.id);
  assert.match(h.dom['toast'].textContent,/重設背包篩選/);assert.deepEqual(copy(h.state.equipment),beforeEquipment);assert.equal(h.state.hero.gold,quote.goldAfter);
  assert.equal(h.calls.filter(c=>c.action==='commissionWeapon').length,1);assert.equal(h.calls.filter(c=>['equip','sellSelected','sellSafe'].includes(c.action)).length,0);
});

test('v025 independent: control labels and status distinguish backpack view from equipped gear and mutation actions',()=>{
  for(const id of ['family-filter','investment-filter'])assert.match(html,new RegExp(`<label for="${id}">`));
  assert.match(html,/id="inventory-filter-status" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(html,/條件同時符合才顯示/);assert.match(html,/只篩選背包/);assert.match(html,/重載[^。；]*恢復全部/);assert.match(html,/不自動選售或換裝/);
  const controller=source.slice(source.indexOf('function inventoryFilters('),source.indexOf('// Explicit personal selection'));
  assert.doesNotMatch(controller,/\b(?:act|dispatch|writeStorage|save)\s*\(/);assert.doesNotMatch(controller,/Math\.random|\.innerHTML/);
});
