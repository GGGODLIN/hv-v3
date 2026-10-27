/** Independent source/controller measurement. JSDOM is not browser, layout or actual keyboard acceptance. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {createContext,runInContext} from 'node:vm';
// Optional audit dependency only; no game/runtime package dependency or network install.
const jsdomEntry=process.env.JSDOM_MODULE?resolve(process.env.JSDOM_MODULE):createRequire(import.meta.url).resolve('jsdom');
const jsdomPackage=JSON.parse(readFileSync(resolve(dirname(jsdomEntry),'../package.json'),'utf8'));
assert.equal(jsdomPackage.name,'jsdom');assert.equal(jsdomPackage.version,'26.1.0','Optional replay is pinned to tested JSDOM26.1.0');
const {JSDOM}=await import(pathToFileURL(jsdomEntry));
import * as engine from '../src/engine.js';
import * as session from '../src/session.js';
import * as loot from '../src/loot.js';
const sha=v=>createHash('sha256').update(v).digest('hex');
const json=v=>JSON.stringify(v), clone=v=>v===undefined?undefined:JSON.parse(json(v));
assert.ok(process.env.BASELINE_DOT_GAME,'Set BASELINE_DOT_GAME to a separately restored exact e5aa0213 dot-game directory');
const root=new URL('../',import.meta.url),oldRoot=pathToFileURL(resolve(process.env.BASELINE_DOT_GAME)+'/');
const baselineExpected={
 "index.html": "27864e272c3251002f103f9599fc65c97d13f268b1debcd5aa9c700499253434",
 "style.css": "8ffc111e27f0c82ef938e027ba043b2ab011e6c80847e5eb49e044b3e214d1f2",
 "src/ui.js": "d6957762a63725e9d37df3ffcba30069903bbaae5e782ffd690c379e3d5101a4",
 "src/engine.js": "020c1717d24c20bd914241b3f30adbc091c5a2a851cec8917dca7fc403f21a6d",
 "src/loot.js": "2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7",
 "src/session.js": "821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a",
 "CHECKPOINT.json": "a3ad34af8bffb81d9a9f250c58ab04feb921429b9f4331523736c7d0b1119f6c"
};
for(const [path,expected] of Object.entries(baselineExpected))assert.equal(sha(readFileSync(new URL(path,oldRoot))),expected,`exact e5aa0213 baseline ${path}`);
const baselineEngine=await import(new URL('src/engine.js',oldRoot));
const inputPaths=['index.html','style.css','src/ui.js','src/engine.js','src/loot.js','src/session.js'];
const hashes=()=>Object.fromEntries(inputPaths.map(p=>[p,sha(readFileSync(new URL(p,root)))]));
const inputs=hashes();
for(const p of ['src/engine.js','src/loot.js','src/session.js'])assert.equal(inputs[p],sha(readFileSync(new URL(p,oldRoot))),`unchanged ${p}`);
const protocol={seed:42,attempts:20,maxPulsesPerFight:1000,pulseSeconds:1,
 acquisition:'Fresh game at fixed seed42, default Balanced/stage1. Before each of 20 starts choose highest score in each slot from already-owned items (later item wins ties). Queue finishThenCamp, advance one-second source pulses until town/defeat or 1000 pulses. Retain all losses/censors; no sales, grants, stats edits, AP, commissions, binding, IW, rerolls or extra attempts. Compare full state and reports with exact v031 after public actions/pulses.',
 replay:'Unchanged canonical earned save loaded into candidate and v031 controller instances. Native DOM click/change/keydown/cancel dispatch under JSDOM plus deterministic source clock; complete state/RNG/action/storage-write parity at semantic checkpoints. Explicit simulated binding only for one separate naturally-earned investment branch; no real browser save.',
 limitation:'Ordinary replay uses ephemeral unsupported-Web-Locks mode (preference writes tracked; no automatic progress saves). Separate explicit emulated-owned lock callback checks stored progress byte parity and a synthetic version999 protection boundary; neither is a real browser lock or cross-tab test. No browser, real Tab/Enter interaction, CSS geometry, screenshots, scroll/focus visibility, hosted deployment or actual production-save validation. JSDOM dialog show/close polyfills are an explicit emulation boundary.'};
function acquire(){
 const s=engine.createGame(protocol.seed),b=baselineEngine.createGame(protocol.seed),rows=[];
 const same=()=>{assert.equal(json(s),json(b));assert.equal(json(engine.expeditionReports(s)),json(baselineEngine.expeditionReports(b)));};
 const act=(a,p)=>{engine.act(s,a,p);baselineEngine.act(b,a,p);same();};
 let pulses=0;
 for(let n=1;n<=protocol.attempts;n++){
  for(const slot of ['weapon','armor','accessory']){
   const best=[s.equipment[slot],...s.inventory.filter(i=>i.slot===slot)].reduce((a,b)=>loot.scoreItem(a)>loot.scoreItem(b)?a:b);
   if(best.id!==s.equipment[slot].id)act('equip',best.id);
  }
  act('start');assert.equal(s.mode,'battle');act('finishThenCamp',true);
  let local=0;while(s.mode==='battle'&&local<protocol.maxPulsesPerFight){engine.advance(s,1);baselineEngine.advance(b,1);same();pulses++;local++;}
  const outcome=engine.expeditionReports(s)[0]?.outcome??'censored';rows.push({attempt:n,pulses:local,outcome});
  if(s.mode==='battle')break;if(s.mode==='defeat')act('retreat');
 }
 const canonical=engine.validateSave(clone(s));assert.equal(json(canonical),json(baselineEngine.validateSave(clone(b))));
 return {state:canonical,summary:{seed:42,attempts:rows.length,pulses,wins:rows.filter(r=>r.outcome==='win').length,losses:rows.filter(r=>r.outcome!=='win'),rows,level:s.hero.level,inventory:s.inventory.length,pending:s.pendingLoot.length,gold:s.hero.gold,fragments:s.soulFragments,seeds:s.worldSeeds,canonicalSaveSha256:sha(json(canonical)),fullStateAndReportsExactV031:true}};
}
function harness(initial,which,lockMode='unsupported'){
 const sourceRoot=which==='baseline'?oldRoot:root;
 const {window}=new JSDOM(readFileSync(new URL('index.html',sourceRoot),'utf8'),{pretendToBeVisual:true});const {document}=window;
 window.matchMedia=()=>({matches:true});window.HTMLCanvasElement.prototype.getContext=()=>({});
 window.HTMLDialogElement.prototype.showModal=function(){this._returnFocus=document.activeElement;this.open=true;(this.querySelector('[autofocus]')||this.querySelector('button')).focus();};
 window.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;this.dispatchEvent(new window.Event('close'));this._returnFocus?.focus();};
 const calls=[],writes=[],faults=[],storage=new Map([['hv-v3-dot-stable-save-v3',json(initial)]]);let now=0;
 const navigator=lockMode==='emulated-owned'?{locks:{request(name,options,callback){return callback({name});}}}:{};
 const deterministicMath=Object.assign(Object.create(Math),{random:()=>.42});
 const context=createContext({...engine,...session,...loot,JSON,window,document,location:{pathname:'/'},navigator,Math:deterministicMath,performance:{now:()=>now},crypto:{randomUUID:()=> 'v032-independent-play'},console:{warn(){},error(...args){faults.push(args);}},confirm:()=>true,
 previewSelectedSale:(s,ids)=>engine.previewSelectedSale(s,clone(ids)),
 act(s,a,p){calls.push({action:a,payload:clone(p??null)});return engine.act(s,a,clone(p));},
 localStorage:{getItem:key=>storage.get(key)??null,setItem:(...args)=>{writes.push(args);storage.set(...args);}},
 setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},requestAnimationFrame(){},ResizeObserver:class{observe(){}}});
 const run=code=>runInContext(code,context);run(readFileSync(new URL('src/ui.js',sourceRoot),'utf8').replace(/^import .+;\n/gm,''));
 const $=id=>document.getElementById(id);
 return {window,document,$,run,calls,writes,faults,storage,get state(){return run('state');},render(){run('render(true)');},
 click(id){assert.ok($(id),id);assert.equal($(id).disabled,false,id+' enabled');$(id).click();},
 change(id,value){const el=$(id);el.value=value;el.dispatchEvent(new window.Event('change',{bubbles:true}));},
 key(id,key){$(id).dispatchEvent(new window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));},
 step(seconds=.25){now+=seconds*1000;run('pump.tick()');run('render(true)');},
 card(id){return [...document.querySelectorAll('[data-inventory-id]')].find(el=>el.dataset.inventoryId===id);},
 button(data,id){return [...document.querySelectorAll(`[data-${data}]`)].find(el=>el.getAttribute(`data-${data}`)===id);},
 cancel(dialogId){const dialog=$(dialogId);assert.equal(dialog.open,true);(dialog.querySelector('[data-close].secondary-button')||dialog.querySelector('[data-close]')).click();assert.equal(dialog.open,false);},
 snapshot(){return {state:json(this.state),calls:json(calls),writes:json(writes)};},
 };
}
const results=[];function pair(initial,lockMode){return [harness(initial,'baseline',lockMode),harness(initial,'candidate',lockMode)];}
function parity(pair,name){const [a,b]=pair;assert.deepEqual(b.snapshot(),a.snapshot(),name);assert.deepEqual(a.faults,[]);assert.deepEqual(b.faults,[]);results.push({name,exactStateRngActionsAndWrites:true});}
const each=(p,fn)=>p.forEach(fn);
const acquired=acquire(),fresh=pair(engine.createGame(42));
parity(fresh,'fresh camp render');each(fresh,h=>h.click('start-button'));parity(fresh,'start uses original action');
each(fresh,h=>h.click('finish-camp-button'));parity(fresh,'queue finish-to-camp');each(fresh,h=>h.click('finish-camp-button'));parity(fresh,'cancel finish-to-camp');
let damageSteps=0;while(fresh[0].state.hero.hp===engine.stats(fresh[0].state).maxHp&&damageSteps<200){each(fresh,h=>h.step());damageSteps++;}
assert.ok(fresh[0].state.hero.hp<engine.stats(fresh[0].state).maxHp,'natural source combat causes damage');parity(fresh,'naturally damaged after clock pulses');
const potionBefore=fresh[0].state.potions;each(fresh,h=>h.click('heal-button'));assert.equal(fresh[0].state.potions,potionBefore-1);parity(fresh,'manual potion consumes exactly one existing potion');
each(fresh,h=>h.click('finish-camp-button'));each(fresh,h=>h.click('retreat-button'));assert.equal(fresh[0].state.mode,'town');assert.equal(engine.finishThenCampView(fresh[0].state).queued,false);parity(fresh,'immediate retreat cancels queued finish');
each(fresh,h=>h.click('start-button'));each(fresh,h=>h.click('finish-camp-button'));let finishSteps=0;
while(fresh[0].state.mode==='battle'&&finishSteps<1000){each(fresh,h=>h.step());finishSteps++;}
assert.equal(fresh[0].state.mode,'town');assert.equal(fresh[0].state.wins,1);parity(fresh,'one-shot finish completes rewards then camp');
const finishState=json(fresh[0].state);for(let i=0;i<8;i++)each(fresh,h=>h.step());assert.equal(json(fresh[0].state),finishState);parity(fresh,'post-finish pulses do not automatically restart');
const earned=pair(acquired.state);parity(earned,'unchanged canonical earned save loaded');
for(const [control,key,expected] of [['camp-tab-battle','ArrowRight','gear'],['camp-tab-gear','End','growth'],['camp-tab-growth','Home','battle'],['camp-tab-battle','ArrowLeft','growth']]){
 each(earned,h=>{h.$(control).focus();h.key(control,key);assert.equal(h.document.activeElement.id,`camp-tab-${expected}`);assert.equal(h.$(`camp-panel-${expected}`).hidden,false);});parity(earned,`tab ${key} navigates to ${expected} without game mutation`);
}
each(earned,h=>h.click('camp-tab-gear'));const inspectIds=[acquired.state.inventory[0].id,acquired.state.inventory.at(-1).id];
for(const id of inspectIds){
 each(earned,h=>{const before=h.snapshot();for(let repeat=0;repeat<3;repeat++){const old=h.card(id);old.focus();old.click();assert.ok(h.document.activeElement===h.card(id));h.render();assert.ok(h.document.activeElement===h.card(id));}assert.deepEqual(h.snapshot(),before);});parity(earned,`earned backpack ${id} repeated comparison/focus`);
}
each(earned,h=>{const before=h.snapshot();for(const [index,slot] of ['weapon','armor','accessory'].entries()){const btn=h.$('equipment').children[index];btn.focus();btn.click();assert.ok(h.document.activeElement===h.$('equipment').children[index]);assert.equal(h.run('selectedSlot'),slot);}assert.deepEqual(h.snapshot(),before);});parity(earned,'equipped comparison stays state-neutral in exposed equipment area');
const saleId=acquired.state.inventory.find(i=>engine.previewSelectedSale(acquired.state,[i.id]).available).id;
each(earned,h=>{const before=h.snapshot(),check=h.card(saleId).closest('.inventory-entry').querySelector('input');check.checked=true;check.dispatchEvent(new h.window.Event('change',{bubbles:true}));h.click('review-selected-sale');assert.equal(h.$('selected-sale-dialog').open,true);assert.match(h.$('selected-sale-summary').textContent,/1 件/);assert.match(h.$('selected-sale-list').textContent,new RegExp(saleId));h.cancel('selected-sale-dialog');assert.deepEqual(h.snapshot(),before);});parity(earned,'self-selected sale preview/cancel consumes nothing');
each(earned,h=>{const before=h.snapshot();h.click('review-selected-sale');h.window.dispatchEvent(new h.window.PopStateEvent('popstate'));assert.equal(h.$('selected-sale-dialog').open,false);h.$('selected-sale-confirm').dispatchEvent(new h.window.Event('click'));assert.deepEqual(h.snapshot(),before);});parity(earned,'history dismissal and stale sale confirmation consume nothing');
const investment=pair(acquired.state);const bindItem=[...Object.values(acquired.state.equipment),...acquired.state.inventory].find(i=>i.slot==='weapon'&&['Fair','Average','Superior','Exquisite'].includes(i.quality)&&engine.previewSoulbindWeapon(acquired.state,i.id).available);assert.ok(bindItem,'natural owned IW-quality weapon and earned fragments');
function inspect(h,id){h.click('camp-tab-gear');const bag=h.card(id);if(bag){bag.click();return;}const slot=Object.entries(h.state.equipment).find(([,i])=>i.id===id)?.[0];assert.ok(slot);h.$('equipment').children[['weapon','armor','accessory'].indexOf(slot)].click();}
each(investment,h=>{inspect(h,bindItem.id);const before=h.snapshot();h.button('soulbind-id',bindItem.id).click();assert.equal(h.$('soulbind-dialog').open,true);assert.match(h.$('soulbind-cost').textContent,/品質費用/);h.cancel('soulbind-dialog');assert.deepEqual(h.snapshot(),before);});parity(investment,'earned weapon bind preview/cancel leaves all resources');
const bindCost=engine.previewSoulbindWeapon(acquired.state,bindItem.id).cost;
each(investment,h=>{h.button('soulbind-id',bindItem.id).click();h.click('soulbind-confirm');assert.equal(h.state.soulFragments,acquired.state.soulFragments-bindCost);});parity(investment,'explicit simulated bind confirmation spends exact quoted fragments once');
each(investment,h=>{inspect(h,bindItem.id);const before=h.snapshot();h.button('item-world-id',bindItem.id).click();assert.equal(h.$('item-world-dialog').open,true);assert.match(h.$('item-world-warning').textContent,/不退種子/);h.cancel('item-world-dialog');assert.deepEqual(h.snapshot(),before);});parity(investment,'IW preview/cancel retains earned seed and exact weapon');
each(investment,h=>{const before=h.snapshot();h.button('item-world-id',bindItem.id).click();h.window.dispatchEvent(new h.window.PopStateEvent('popstate'));assert.equal(h.$('item-world-dialog').open,false);h.$('item-world-confirm').dispatchEvent(new h.window.Event('click'));assert.deepEqual(h.snapshot(),before);});parity(investment,'history dismissal and stale IW confirmation consume nothing');
const equipmentChange=pair(acquired.state),alternateWeapon=acquired.state.inventory.find(i=>i.slot==='weapon');assert.ok(alternateWeapon);
each(equipmentChange,h=>{h.card(alternateWeapon.id).click();const equip=[...h.$('item-detail').querySelectorAll('button')].find(b=>b.textContent==='換上裝備');assert.ok(equip);equip.click();assert.equal(h.state.equipment.weapon.id,alternateWeapon.id);const label=h.$('current-weapon-label');if(label)assert.equal(label.textContent,alternateWeapon.name);});parity(equipmentChange,'actual earned weapon swap updates compact current-weapon label without gameplay divergence');
const disclosure=pair(acquired.state);const candidateDisclosure=disclosure[1].document.querySelector('.tactics-disclosure');
if(candidateDisclosure){const h=disclosure[1],before=h.snapshot();assert.equal(candidateDisclosure.open,false);candidateDisclosure.querySelector('summary').click();assert.equal(candidateDisclosure.open,true);assert.deepEqual(h.snapshot(),before);}
each(disclosure,h=>h.change('strategy-select','assault'));assert.equal(disclosure[1].state.strategy,'assault');parity(disclosure,'revealed tactic select uses unchanged setting handler');
if(candidateDisclosure){const h=disclosure[1],before=h.snapshot();candidateDisclosure.querySelector('summary').click();assert.equal(candidateDisclosure.open,false);assert.deepEqual(h.snapshot(),before);}
const filterDetails=disclosure[1].document.querySelector('.inventory-filter-details');if(filterDetails){const h=disclosure[1],before=h.snapshot();filterDetails.querySelector('summary').click();assert.equal(filterDetails.open,true);assert.deepEqual(h.snapshot(),before);}
each(disclosure,h=>{const before=h.snapshot();h.change('family-filter','rapier');h.click('reset-inventory-filters');assert.equal(h.$('family-filter').value,'all');assert.equal(h.document.activeElement,h.$('slot-filter'));assert.deepEqual(h.snapshot(),before);});parity(disclosure,'secondary filter disclosure keeps exposed reset fallback and never changes game state');
const readonly=pair(acquired.state);each(readonly,h=>{h.run('tabOwner=false;render(true)');const before=h.snapshot();for(const id of ['start-button','heal-button','retreat-button','finish-camp-button']){assert.equal(h.$(id).disabled,true);h.$(id).dispatchEvent(new h.window.Event('click'));}assert.deepEqual(h.snapshot(),before);});parity(readonly,'readonly controls refuse all battle mutations even with stale dispatch');
const ownedStorage=pair(acquired.state,'emulated-owned');each(ownedStorage,h=>{assert.equal(h.run('ownership.supported'),true);assert.equal(h.run('tabOwner'),true);h.click('start-button');h.click('finish-camp-button');h.click('retreat-button');assert.equal(h.storage.get('hv-v3-dot-stable-save-v3'),json(h.state));assert.equal(h.writes.filter(([key])=>key.endsWith('save-v3')).length,3);});parity(ownedStorage,'emulated-owned storage writes exact state for start/queue/retreat');
each(ownedStorage,h=>{const before=h.snapshot();h.card(inspectIds[0]).focus();h.card(inspectIds[0]).click();assert.deepEqual(h.snapshot(),before);});parity(ownedStorage,'comparison under emulated ownership does not create progress save');
const unsupportedSave={...clone(acquired.state),version:999},protectedStorage=pair(unsupportedSave,'emulated-owned');each(protectedStorage,h=>{assert.equal(h.run('preventOverwrite'),true);assert.equal(h.$('notice').hidden,false);assert.match(h.$('notice').textContent,/阻止覆寫/);const raw=h.storage.get('hv-v3-dot-stable-save-v3');h.click('start-button');h.click('retreat-button');assert.equal(h.storage.get('hv-v3-dot-stable-save-v3'),raw);assert.equal(h.writes.filter(([key])=>key.endsWith('save-v3')).length,0);});parity(protectedStorage,'synthetic unsupported-save boundary preserves raw bytes under emulated ownership');
assert.deepEqual(hashes(),inputs,'inputs frozen during independent measurement');
const output={kind:'Independent v032 source-engine + JSDOM-controller replay; NOT browser/layout/actual keyboard acceptance',baselineCommit:'e5aa0213f14b9ead85e8b81c3b5b340259e469be',protocol,baselineInputSha256:baselineExpected,runnerSha256:sha(readFileSync(new URL(import.meta.url))),jsdomVersion:jsdomPackage.version,inputSha256:inputs,acquisition:acquired.summary,replay:{checks:results.length,damageQuarterSecondPulses:damageSteps,finishQuarterSecondPulses:finishSteps,inspectionIds:inspectIds,saleId,investmentId:bindItem.id,investmentName:bindItem.name,simulatedBindCost:bindCost,emulatedOwnedProgressWrites:ownedStorage[1].writes.filter(([key])=>key.endsWith('save-v3')).length,protectedRawSaveWrites:protectedStorage[1].writes.filter(([key])=>key.endsWith('save-v3')).length,results}};
const out=process.env.RPG_INTERFACE_OUTPUT?pathToFileURL(resolve(process.env.RPG_INTERFACE_OUTPUT)):new URL('../docs/measurements/rpg-interface.json',import.meta.url);mkdirSync(dirname(fileURLToPath(out)),{recursive:true});writeFileSync(out,JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({output:out.pathname,receiptSha256:sha(readFileSync(out)),checks:results.length,acquisition:acquired.summary,replay:output.replay},null,2));
