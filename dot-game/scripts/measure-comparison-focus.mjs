/** Earned-item comparison-focus replay in a focus-faithful emulated DOM.
 * This is source execution, never actual browser/keyboard acceptance.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as game from '../src/engine.js';
import {scoreItem} from '../src/loot.js';

export const PROTOCOL=Object.freeze({
  seed:42,maxAttempts:315,maxPulsesPerFight:1000,pulseSeconds:1,
  acquisition:'Known v0.28 natural-overflow reproduction, not a new random sample. Fresh stage1 Balanced defaults. Before attempts1–10 equip the highest current score per slot, later entry wins ties. Before each start explicitly sell the oldest unlocked backpack item until at most115 remain. Request finishThenCamp; stop at first pending drop or315 attempts. No AP, binding, IW, commissions, potions, automatic sale, RNG/stat/resource edits or extra attempts. Retain defeat/censor/no-overflow results.',
  baseline:'Compare full state and all source expedition reports after every public action and one-second pulse with exact v0.29. No fields or log messages are normalized.',
  replay:'Load the unchanged validated earned save in a focus-faithful full-controller emulated DOM. Focus then activate first/middle/last backpack controls, each equipped slot and each naturally pending control; repeat three times per exact ID, including a forced render after each activation. Compare exact focused node replacement/identity, full game state, RNG, controller dispatches and storage writes. Repeat on exact v0.29 source to preserve pre-fix evidence.',
  limitations:'Programmatic focus plus native click handlers approximates keyboard activation at the controller boundary. No actual Tab/Enter browser dispatch, visual focus ring, scroll position, browser storage, hosted candidate or production acceptance is claimed.'
});
export const BASELINE=Object.freeze({
  commit:'eb134eaf7da676c2834eb5c08bf84cb957e523b4',
  sha256:{
    'src/engine.js':'020c1717d24c20bd914241b3f30adbc091c5a2a851cec8917dca7fc403f21a6d',
    'src/loot.js':'2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7',
    'src/session.js':'821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a',
    'src/ui.js':'523c98358df0f6085ad4be47ad60c8cb09e37b0320efc970830117a7d60fbe5a',
    'index.html':'463de63f43922948734f3bf6ecccb5d9df435bce26f25b132c9b5abb51d860ea'
  }
});
const clone=structuredClone,sha=bytes=>createHash('sha256').update(bytes).digest('hex'),digest=value=>sha(JSON.stringify(value));
const slots=['weapon','armor','accessory'];
const record=s=>({level:s.hero.level,wins:s.wins,kills:s.kills,inventory:s.inventory.length,pending:s.pendingLoot.length,
  gold:s.hero.gold,fragments:s.soulFragments,seeds:s.worldSeeds,rng:s.seed,itemId:s._itemId,mode:s.mode});
const held=s=>[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];
const owned=s=>held(s).slice().sort((a,b)=>a.id.localeCompare(b.id));

export function acquire(baseline){
  const s=game.createGame(PROTOCOL.seed),shadow=baseline.createGame(PROTOCOL.seed),trace=createHash('sha256'),losses=[];
  let comparisons=0,attempts=0,pulses=0,status='attempt-bound';
  const compare=()=>{
    assert.deepEqual(s,shadow,'complete state exact v029 parity');
    assert.deepEqual(game.expeditionReports(s),baseline.expeditionReports(shadow),'all reports exact v029 parity');
    comparisons++;
  };
  const dispatch=(action,payload)=>{game.act(s,action,payload);baseline.act(shadow,action,payload);compare();};
  compare();
  for(let attempt=1;attempt<=PROTOCOL.maxAttempts;attempt++){
    if(attempt<=10)for(const slot of slots){
      const best=[s.equipment[slot],...s.inventory.filter(item=>item.slot===slot)].reduce((a,b)=>scoreItem(a)>scoreItem(b)?a:b);
      if(best.id!==s.equipment[slot].id)dispatch('equip',best.id);
    }
    while(s.inventory.length>115){
      const item=s.inventory.find(item=>!item.locked);assert.ok(item,'existing oldest-unlocked cleanup remains possible');dispatch('sell',item.id);
    }
    assert.equal(s.pendingLoot.length,0);dispatch('start');
    if(s.mode!=='battle'){status='start-blocked';losses.push({attempt,outcome:status,record:record(s)});break;}
    dispatch('finishThenCamp',true);let localPulses=0;
    while(s.mode==='battle'&&localPulses<PROTOCOL.maxPulsesPerFight){
      game.advance(s,PROTOCOL.pulseSeconds);baseline.advance(shadow,PROTOCOL.pulseSeconds);compare();pulses++;localPulses++;
    }
    attempts=attempt;const report=game.expeditionReports(s)[0],outcome=s.mode==='battle'?'censored':report?.outcome??'missing-report';
    trace.update(JSON.stringify({attempt,outcome,pulses:localPulses,stateSha256:digest(s),report})+'\n');
    if(outcome!=='win')losses.push({attempt,outcome,pulses:localPulses,record:record(s)});
    if(s.mode==='defeat')dispatch('retreat');
    if(outcome==='censored'){status='fight-censored';break;}
    if(s.pendingLoot.length){status='first-natural-overflow';break;}
  }
  const canonical=game.validateSave(clone(s));assert.deepEqual(canonical,baseline.validateSave(clone(shadow)));
  return {state:canonical,summary:{seed:PROTOCOL.seed,status,attempts,pulses,losses,final:record(s),comparisons,
    exactFullStateAndReports:true,noNormalizedFields:true,earnedStateSha256:digest(s),canonicalSaveSha256:digest(canonical),
    ownedItemsSha256:digest(owned(s)),acquisitionTraceSha256:trace.digest('hex'),
    pendingItems:s.pendingLoot.map(item=>({id:item.id,name:item.name,slot:item.slot,quality:item.quality}))}};
}

const walk=(root,predicate)=>predicate(root)?root:(root.children||[]).map(child=>walk(child,predicate)).find(Boolean);
function control(h,choice){
  if(choice.location==='equipment')return h.dom.equipment.children[slots.indexOf(choice.slot)];
  const key=choice.location==='inventory'?'inventoryId':'pendingLootId';
  return walk(h.dom[choice.location==='inventory'?'inventory-list':'pending-loot-list'],el=>el.dataset?.[key]===choice.id);
}
function observation(h){return {state:JSON.stringify(h.state),calls:JSON.stringify(h.calls),writes:JSON.stringify(h.writes)};}

async function replay(initial,source,html,fullUI,{expectFixed}){
  const h=fullUI(clone(initial),{source,html}),choices=[];
  assert.equal(JSON.stringify(h.state),JSON.stringify(initial),'controller loads the exact canonical earned save');
  const indexes=[0,Math.floor(initial.inventory.length/2),initial.inventory.length-1];
  for(const index of [...new Set(indexes)].filter(index=>index>=0)){
    const item=initial.inventory[index];choices.push({location:'inventory',id:item.id,name:item.name,index});
  }
  for(const slot of slots){const item=initial.equipment[slot];choices.push({location:'equipment',slot,id:item.id,name:item.name});}
  for(const item of initial.pendingLoot)choices.push({location:'pending',id:item.id,name:item.name});
  const start=observation(h),rows=[];
  for(const choice of choices){
    const repeats=[];
    for(let repeat=1;repeat<=3;repeat++){
      const original=control(h,choice);assert.ok(original,'earned control is rendered');original.focus();
      assert.equal(h.document.activeElement,original,'the measured control actually owns focus before activation');
      const before=observation(h);await original.click();const replacement=control(h,choice);
      assert.notEqual(replacement,original,'comparison activation replaces its control');
      const clickRetained=h.document.activeElement===replacement;
      assert.deepEqual(observation(h),before,'comparison leaves full state, RNG, dispatches and storage writes untouched');
      if(expectFixed)assert.equal(clickRetained,true,`exact ${choice.location}/${choice.id} focus after activation`);
      const beforeRender=observation(h);h.render();const afterRender=control(h,choice);
      const renderRetained=h.document.activeElement===afterRender;
      assert.deepEqual(observation(h),beforeRender,'forced render leaves full state and saves untouched');
      if(expectFixed)assert.equal(renderRetained,true,`exact ${choice.location}/${choice.id} focus after forced render`);
      repeats.push({repeat,clickRetained,renderRetained});
    }
    rows.push({...choice,sameNameOwnedCount:held(initial).filter(item=>item.name===choice.name).length,repeats});
  }
  assert.deepEqual(observation(h),start,'entire comparison replay is read-only');assert.deepEqual(h.faults,[]);
  return {rows,controlCount:rows.length,activations:rows.reduce((n,row)=>n+row.repeats.length,0),
    retainedAfterClick:rows.flatMap(row=>row.repeats).filter(row=>row.clickRetained).length,
    retainedAfterForcedRender:rows.flatMap(row=>row.repeats).filter(row=>row.renderRetained).length,
    fullStateRngDispatchesAndSaveWritesUnchanged:true,initialStateSha256:sha(start.state),finalStateSha256:digest(h.state)};
}

export async function measure({baselineRoot,fullUI}){
  const baseline=await import(pathToFileURL(resolve(baselineRoot,'src/engine.js'))),earned=acquire(baseline);
  const oldSource=await readFile(resolve(baselineRoot,'src/ui.js'),'utf8'),newSource=await readFile(new URL('../src/ui.js',import.meta.url),'utf8');
  const oldHtml=await readFile(resolve(baselineRoot,'index.html'),'utf8'),newHtml=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const previous=await replay(earned.state,oldSource,oldHtml,fullUI,{expectFixed:false});
  const current=await replay(earned.state,newSource,newHtml,fullUI,{expectFixed:true});
  assert.ok(previous.rows.some(row=>row.location==='inventory'&&row.repeats.some(r=>!r.clickRetained)),'reproduce old inventory bug');
  assert.ok(previous.rows.some(row=>row.location==='equipment'&&row.repeats.some(r=>!r.clickRetained)),'reproduce old equipment bug');
  return {kind:'v0.30 earned source-engine plus full-controller emulated-DOM comparison-focus replay; not actual browser acceptance',
    protocol:PROTOCOL,baseline:BASELINE,acquisition:earned.summary,previous,current};
}

async function main(){
  const args=process.argv.slice(2),arg=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
  assert.ok(arg('--baseline'),'Supply --baseline /path/to/exact-v029/dot-game');
  const baselineRoot=resolve(arg('--baseline'));
  for(const [path,expected] of Object.entries(BASELINE.sha256))assert.equal(sha(await readFile(resolve(baselineRoot,path))),expected,`exact v029 ${path}`);
  const inputPaths=['src/engine.js','src/loot.js','src/session.js','src/ui.js','index.html','tests/helpers/comparison-focus-harness.mjs','scripts/measure-comparison-focus.mjs'];
  const inputs=async()=>Object.fromEntries(await Promise.all(inputPaths.map(async path=>[path,sha(await readFile(new URL('../'+path,import.meta.url)))])));
  const before=await inputs();for(const path of ['src/engine.js','src/loot.js','src/session.js'])assert.equal(before[path],BASELINE.sha256[path],`${path} has no gameplay changes`);
  const {fullUI}=await import('../tests/helpers/comparison-focus-harness.mjs');
  const result=await measure({baselineRoot,fullUI});result.inputSha256=before;assert.deepEqual(await inputs(),before,'all replay inputs remain frozen');
  const output=resolve(arg('--output')||fileURLToPath(new URL('../docs/measurements/comparison-focus.json',import.meta.url)));
  await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({output,bytes:(await readFile(output)).length,sha256:sha(await readFile(output)),acquisition:result.acquisition,
    previous:{controls:result.previous.controlCount,activations:result.previous.activations,clickFocus:result.previous.retainedAfterClick,renderFocus:result.previous.retainedAfterForcedRender},
    current:{controls:result.current.controlCount,activations:result.current.activations,clickFocus:result.current.retainedAfterClick,renderFocus:result.current.retainedAfterForcedRender}},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
