/** Independent inventory-view measurement. Fresh progress uses only public actions.
 * Optional --profile reads an unchanged ordinary export; no private save is bundled.
 * Views inspect only: no sorting/mutation, RNG replacement, grants, or forced state.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import * as game from '../src/engine.js';
import {resolveWeaponFamily,scoreItem} from '../src/loot.js';
const copy=structuredClone;
const hash=value=>createHash('sha256').update(value).digest('hex');
const slots=['all','weapon','armor','accessory'];
const families=['all','axe','rapier','club','unknown'];
const investments=['all','unbound','bound','iw1'];
const owned=s=>[...Object.values(s.equipment),...s.inventory];

/** Load just the shipped pure view predicate, not the DOM application. */
export async function loadInventoryMatcher(url=new URL('../src/ui.js',import.meta.url)) {
  const source=await readFile(url,'utf8');
  const match=source.match(/^function inventoryMatchesFilters\([^]*?^}/m);
  assert.ok(match,'shipped pure inventory matcher exists');
  return {matches:Function('resolveWeaponFamily',`return (${match[0]});`)(resolveWeaponFamily),sourceSha256:hash(source)};
}
const expected=(item,{slot,family,investment})=>(slot==='all'||item.slot===slot)
  &&(family==='all'||item.slot==='weapon'&&(family==='unknown'?!resolveWeaponFamily(item):resolveWeaponFamily(item)===family))
  &&(investment==='all'||investment==='unbound'&&!Object.hasOwn(item,'soulbound')
    ||investment==='bound'&&Object.hasOwn(item,'soulbound')&&item.itemWorld?.level!==1
    ||investment==='iw1'&&Object.hasOwn(item,'soulbound')&&item.itemWorld?.level===1);

/** Exhaust every supported AND combination on the same intact state. */
export function inspectInventory(s,matches) {
  const before=JSON.stringify(s),saveBefore=JSON.stringify(game.validateSave(copy(s))),seed=s.seed;
  const rows=[];
  for(const slot of slots)for(const family of families)for(const investment of investments){
    const filters={slot,family,investment},items=s.inventory.filter(item=>matches(item,filters));
    const expectedIds=s.inventory.filter(item=>expected(item,filters)).map(item=>item.id);
    assert.deepEqual(items.map(item=>item.id),expectedIds,'shipped view matches independent AND predicate');
    assert.equal(new Set(items.map(item=>item.id)).size,items.length,'unique retained identities');
    assert.ok(items.every(item=>s.inventory.includes(item)),'view retains original item references');
    assert.ok(items.every(item=>!Object.values(s.equipment).includes(item)),'backpack excludes equipped records');
    rows.push({filters,count:items.length,ids:items.map(item=>item.id)});
  }
  const subset=(field,value)=>rows.find(row=>Object.entries(row.filters).every(([key,v])=>v===(key===field?value:'all')));
  const partition=investments.slice(1).map(investment=>subset('investment',investment));
  assert.equal(partition.reduce((sum,row)=>sum+row.count,0),s.inventory.length,'investment categories partition backpack');
  assert.equal(new Set(partition.flatMap(row=>row.ids)).size,s.inventory.length,'investment categories never overlap');
  const salable=s.inventory.filter(item=>game.previewSelectedSale(s,[item.id]).available);
  const first=salable.find(item=>item.slot==='weapon'),second=salable.find(item=>item.slot!=='weapon');
  const ids=first&&second?[first.id,second.id]:salable.slice(0,2).map(item=>item.id);
  const selection=ids.length?game.previewSelectedSale(s,ids):null;
  const hiddenSelection=selection?.available?rows.map(row=>({filters:row.filters,selected:ids.length,
    visibleSelected:ids.filter(id=>row.ids.includes(id)).length,hiddenSelected:ids.filter(id=>!row.ids.includes(id)).length})):[];
  if(selection?.available)assert.deepEqual(game.previewSelectedSale(s,ids),selection,'filtering never changes exact sale quote/IDs');
  const legacyMissingParry=s.inventory.filter(item=>resolveWeaponFamily(item)==='rapier'&&!Object.hasOwn(item.stats,'parry')).map(item=>item.id);
  assert.equal(JSON.stringify(s),before,'all views leave every state byte unchanged');
  assert.equal(JSON.stringify(game.validateSave(copy(s))),saveBefore,'all views leave canonical saved data unchanged');
  assert.equal(s.seed,seed,'all views leave RNG unchanged');
  return {level:s.hero.level,wins:s.wins,inventory:s.inventory.length,held:owned(s).length,
    slotCounts:Object.fromEntries(slots.slice(1).map(value=>[value,subset('slot',value).count])),
    familyCounts:Object.fromEntries(families.slice(1).map(value=>[value,subset('family',value).count])),
    investmentCounts:Object.fromEntries(investments.slice(1).map(value=>[value,subset('investment',value).count])),
    legacyMissingParry,selectedQuoteIds:ids,selectedQuoteCredits:selection?.available?selection.total:null,
    hiddenSelection,rows,stateSha256:hash(before),canonicalSaveSha256:hash(saveBefore),seed,
    mutationChecks:{stateUnchanged:true,saveUnchanged:true,rngUnchanged:true,exactSaleQuoteUnchanged:true}};
}
function equipBest(s){for(const slot of ['weapon','armor','accessory']){
  const best=[s.equipment[slot],...s.inventory.filter(item=>item.slot===slot)].reduce((a,b)=>scoreItem(a)>=scoreItem(b)?a:b);
  if(best.id!==s.equipment[slot].id)game.act(s,'equip',best.id);
}}
function finish(s){let steps=0;while(s.mode==='battle'&&steps++<6000)game.advance(s,.1);
  assert.ok(steps<6000,'bounded natural fight settles');const report=game.expeditionReports(s)[0];assert.ok(report);
  if(s.mode!=='town')game.act(s,'retreat');return {outcome:report.outcome,seconds:report.elapsed};
}
/** Fixed, disclosed 20-clear cohort; all losses remain in returned runs. */
export function earnInventory(seed){
  const s=game.createGame(seed),runs=[];let attempts=0;
  while(s.wins<20&&attempts++<40){
    equipBest(s);for(const id of ['hp-tank','mp-tank','one-handed-damage']){game.act(s,'learnAbility',id);game.act(s,'slotAbility',id);}
    game.act(s,'selectStage',1);game.act(s,'start');assert.equal(s.mode,'battle');game.act(s,'finishThenCamp',true);runs.push(finish(s));
  }
  assert.equal(s.wins,20,'cohort earns 20 ordinary wins');equipBest(s);
  const bound=[];
  for(let i=0;i<2;i++){
    const target=s.inventory.find(item=>['Fair','Average','Superior'].includes(item.quality)
      &&resolveWeaponFamily(item)&&game.previewSoulbindWeapon(s,item.id).available);
    assert.ok(target,'earned backpack has another eligible target');const offer=game.previewSoulbindWeapon(s,target.id);
    assert.equal(offer.cost,100);game.act(s,'soulbindWeapon',offer);assert.ok(s.inventory.find(item=>item.id===target.id).soulbound);bound.push(target.id);
  }
  const offer=game.previewItemWorld(s,bound[0]);assert.equal(offer.available,true,offer.reason);
  game.act(s,'enterItemWorld',offer);assert.equal(game.itemWorldView(s).active,true);const trial=finish(s);
  // Do not discard an unexpected loss or relabel it as a win; no retry or tuning.
  return {state:s,seed,runs,boundTargets:bound,itemWorld:trial};
}
async function main(){
  const args=process.argv.slice(2),option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
  const label=option('--label')??'natural';assert.match(label,/^[a-z0-9-]+$/);
  const directory=resolve(option('--output')??fileURLToPath(new URL('../measurements/',import.meta.url)));
  const output=resolve(directory,`inventory-workbench-${label}.json`);await mkdir(directory,{recursive:true});
  try{await access(output);throw Error(`Evidence already exists: ${output}`);}catch(error){if(error.code!=='ENOENT')throw error;}
  const loaded=await loadInventoryMatcher(),rows=[];
  const profile=option('--profile');
  if(profile){const raw=await readFile(profile);const s=game.validateSave(JSON.parse(raw.toString()));
    rows.push({kind:'unchanged ordinary browser export, read only; not new browser play',inputSha256:hash(raw),...inspectInventory(s,loaded.matches)});
    assert.equal(hash(await readFile(profile)),hash(raw),'private input file unchanged');
  }else for(const seed of [29,42,77]){const earned=earnInventory(seed);rows.push({kind:'source-engine-earned, not browser-earned',seed,
    acquisitionRuns:earned.runs,boundTargets:earned.boundTargets,itemWorld:earned.itemWorld,...inspectInventory(earned.state,loaded.matches)});}
  const result={version:'v0.25',kind:'inventory discovery only; no combat/growth balancing claim',
    uiSourceSha256:loaded.sourceSha256,scriptSha256:hash(await readFile(new URL(import.meta.url))),
    engineSha256:hash(await readFile(new URL('../src/engine.js',import.meta.url))),
    lootSha256:hash(await readFile(new URL('../src/loot.js',import.meta.url))),
    note:'Hidden-selection evidence checks unchanged engine quote, not actual DOM disclosure; separate browser/UI acceptance is required.',rows};
  await writeFile(output,JSON.stringify(result,null,2));
  console.log(JSON.stringify({output,rows:rows.map(({kind,level,wins,inventory,slotCounts,familyCounts,investmentCounts,legacyMissingParry,mutationChecks})=>({kind,level,wins,inventory,slotCounts,familyCounts,investmentCounts,legacyMissingParry,mutationChecks}))},null,2));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await main();
