/** Reproducible pending-loot recovery evidence; source simulation, not browser play.
 * Every earned run uses public actions. The separate free-space pending scenario
 * is explicitly a supported-save redistribution of earned items, not natural play.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as game from '../src/engine.js';
import {scoreItem,isSoulboundItem} from '../src/loot.js';

export const PROTOCOL=Object.freeze({
  knownReproductionSeed:42,additionalFixedSeeds:[29,77],maxAttempts:400,maxPulsesPerFight:1000,pulseSeconds:1,
  acquisition:'Fresh stage1 Balanced defaults; no AP, potions, commissions, auto-sale, RNG/stat/resource edits. Before attempts1–10 equip the highest current score per slot (later entry wins ties). Before each start, explicitly sell the oldest unlocked backpack item until at most115 remain. Start and request finishThenCamp each time. Stop at first pending drop or400 attempts; retain every defeat/censor.',
  investment:'The invested branch tries to bind one eligible100-fragment backpack weapon from attempt11 onward using its exact quote, then never equips it. No injected currency, new drop, IW, or extra inventory protection rule.',
  populations:'Seed42 reproduces an already-discovered case, not an independent favorable search. Seeds29/77 and400-attempt bound were fixed before these measurements. No frequency or general balance estimate is claimed.',
  supportedSave:'Separately move the naturally earned bound backpack weapon into pending in the last pre-overflow camp state (or final camp state if no overflow), preserving every item and resource; validate it, then explicitly claim it. This deliberately constructed supported-save state is NOT naturally reached by these runs.'
});
const clone=structuredClone,sha=value=>createHash('sha256').update(value).digest('hex');
const digest=value=>sha(JSON.stringify(value));
const held=s=>[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];
const sortedItems=s=>held(s).slice().sort((a,b)=>a.id.localeCompare(b.id));
const find=(s,id)=>held(s).find(item=>item.id===id);
const immutableAnchor=item=>JSON.stringify(item?.soulbound);
const record=s=>({level:s.hero.level,wins:s.wins,kills:s.kills,gold:s.hero.gold,fragments:s.soulFragments,seeds:s.worldSeeds,
  inventory:s.inventory.length,pending:s.pendingLoot.length,seed:s.seed,itemId:s._itemId,mode:s.mode});
function prepare(s,dispatch=game.act){for(const slot of ['weapon','armor','accessory']){
  const best=[s.equipment[slot],...s.inventory.filter(item=>item.slot===slot)].reduce((a,b)=>scoreItem(a)>scoreItem(b)?a:b);
  if(best.id!==s.equipment[slot].id)dispatch(s,'equip',best.id);
}}
function sale(s,ids){const quote=game.previewSelectedSale(s,ids);assert.equal(quote.available,true,quote.reason);
  game.act(s,'sellSelected',{ids,quoteBasis:quote.quoteBasis});return quote;
}

export function earn(seed,{invest=true,baseline=null}={}){
  const s=game.createGame(seed),trace=createHash('sha256'),combatTrace=createHash('sha256'),losses=[];
  const shadow=baseline?.createGame(seed);let parityComparisons=0,allowedRewardLogDifference=false;
  function compare(){
    if(!shadow)return;
    const normalized=clone(s);
    // This is the only admitted difference: the queued guaranteed reward used
    // to say backpack. Every other state field and every report compare exactly.
    normalized.logs=normalized.logs.map(line=>{
      if(!line.includes('保底裝備已保留於待領區。'))return line;
      assert.ok(s.pendingLoot.length>0,'new queued log must have retained pending loot');allowedRewardLogDifference=true;
      return line.replace('保底裝備已保留於待領區。','保底裝備已入背包。');
    });
    assert.deepEqual(normalized,shadow,'exact v027 full state parity apart from queued reward wording');
    assert.deepEqual(game.expeditionReports(s),baseline.expeditionReports(shadow),'exact v027 report parity');parityComparisons++;
  }
  const dispatch=(state,action,payload)=>{assert.equal(state,s);game.act(s,action,payload);if(shadow)baseline.act(shadow,action,payload);compare();};
  let pulses=0,attempts=0,binding=null,preFight=null,status='attempt-bound';
  compare();
  for(let attempt=1;attempt<=PROTOCOL.maxAttempts;attempt++){
    if(attempt<=10)prepare(s,dispatch);
    if(invest&&!binding&&attempt>=11){
      const offer=s.inventory.map(item=>game.previewSoulbindWeapon(s,item.id)).find(offer=>offer.available&&offer.cost===100);
      if(offer){const fragmentsBefore=s.soulFragments;dispatch(s,'soulbindWeapon',offer);const item=find(s,offer.id);
        assert.ok(isSoulboundItem(item));assert.equal(s.soulFragments,fragmentsBefore-100);
        binding={attempt,id:item.id,quality:item.quality,cost:100,initialLevel:item.level,anchor:clone(item.soulbound),anchorSha256:digest(item.soulbound)};
      }
    }
    while(s.inventory.length>115){const item=s.inventory.find(item=>!item.locked);assert.ok(item,'natural oldest-unlocked cleanup remains possible');dispatch(s,'sell',item.id);}
    assert.equal(s.pendingLoot.length,0);preFight=clone(s);
    dispatch(s,'start');assert.equal(s.mode,'battle');dispatch(s,'finishThenCamp',true);
    let localPulses=0;
    while(s.mode==='battle'&&localPulses<PROTOCOL.maxPulsesPerFight){game.advance(s,PROTOCOL.pulseSeconds);if(shadow)baseline.advance(shadow,PROTOCOL.pulseSeconds);compare();localPulses++;pulses++;}
    attempts=attempt;const report=game.expeditionReports(s)[0],outcome=s.mode==='battle'?'censored':report?.outcome??'missing-report';
    if(outcome!=='win')losses.push({attempt,outcome,pulses:localPulses,record:record(s)});
    // Combat trace intentionally excludes inventory sales and binding expenditure,
    // but includes exact RNG, enemy kills, elapsed report, build, damage and actions.
    const combat={attempt,outcome,pulses:localPulses,seed:s.seed,kills:s.kills,report};combatTrace.update(JSON.stringify(combat)+'\n');
    trace.update(JSON.stringify({attempt,outcome,pulses:localPulses,stateSha256:digest(s)})+'\n');
    if(s.mode==='defeat')dispatch(s,'retreat');
    if(binding){const current=find(s,binding.id);assert.ok(isSoulboundItem(current));assert.equal(immutableAnchor(current),JSON.stringify(binding.anchor));}
    if(outcome==='censored'){status='fight-censored';break;}
    if(s.pendingLoot.length){status='first-natural-overflow';break;}
  }
  assert.ok(binding||!invest,'an invested cohort must honestly earn its first supported binding');
  return {state:s,preFight,summary:{seed,invest,status,attempts,pulses,losses,binding,final:record(s),
    stateSha256:digest(s),canonicalSaveSha256:digest(game.validateSave(clone(s))),ownedItemsSha256:digest(sortedItems(s)),
    runStateTraceSha256:trace.digest('hex'),combatTraceSha256:combatTrace.digest('hex'),
    pendingItems:clone(s.pendingLoot),normalWinLog:s.logs.find(line=>line.includes('保底裝備'))??null,
    exactV027Parity:shadow?{comparisons:parityComparisons,allStateFieldsCompared:true,allReportsCompared:true,allowedRewardLogDifference}:null}};
}

function naturalRecovery(earned){
  if(!earned.state.pendingLoot.length)return {tested:false,reason:'No naturally pending item within the predeclared attempts.'};
  const s=game.validateSave(clone(earned.state)),before=clone(s),beforeOwned=sortedItems(s),view=game.pendingLootView(s);
  assert.equal(view.available,false);assert.equal(view.claimable,0);game.act(s,'claimPending');assert.deepEqual(s,before,'claim at full capacity is a complete no-op');
  const pendingIds=s.pendingLoot.map(item=>item.id),boundId=earned.summary.binding?.id,boundBefore=boundId?clone(find(s,boundId)):null;
  const chosen=s.inventory.find(item=>game.previewSelectedSale(s,[item.id]).available);assert.ok(chosen);
  const quote=sale(s,[chosen.id]),expected=beforeOwned.filter(item=>item.id!==chosen.id);
  assert.deepEqual(sortedItems(s),expected,'only the explicitly sold item leaves ownership; pending items retain all metadata');
  assert.equal(s.hero.gold,before.hero.gold+quote.total);assert.equal(s.soulFragments,before.soulFragments);assert.equal(s.worldSeeds,before.worldSeeds);
  assert.equal(s.seed,before.seed);assert.equal(s._itemId,before._itemId);
  assert.equal(s.inventory.at(-1).id,pendingIds[0],'existing sale refill remains FIFO');
  if(boundId)assert.deepEqual(find(s,boundId),boundBefore);
  const additionalSales=[];
  while(s.inventory.length>115||s.pendingLoot.length){const item=s.inventory.find(item=>game.previewSelectedSale(s,[item.id]).available);assert.ok(item);additionalSales.push(item.id);sale(s,[item.id]);}
  if(boundId)assert.deepEqual(find(s,boundId),boundBefore);
  const recovered=record(s),ownedHash=digest(sortedItems(s));game.act(s,'start');assert.equal(s.mode,'battle');
  return {tested:true,fullClaimNoop:true,pendingIds,firstSoldId:chosen.id,firstSaleCredits:quote.total,firstRefilledId:pendingIds[0],additionalSoldIds:additionalSales,
    recovered,ownedItemsAfterRecoverySha256:ownedHash,restarted:true,boundPreserved:boundId?true:null,
    checks:{exactSelectedRemoval:true,fifoRefill:true,noDuplicateIds:new Set(held(s).map(item=>item.id)).size===held(s).length,rngUnaffectedByCollection:true}};
}

function supportedFreeSpaceClaim(earned){
  const source=earned.preFight,sourceHash=digest(source),s=game.validateSave(clone(source)),id=earned.summary.binding.id;
  const index=s.inventory.findIndex(item=>item.id===id);assert.ok(index>=0);assert.equal(s.pendingLoot.length,0);
  const originalItems=sortedItems(s),originalResources={...record(s),inventory:undefined,pending:undefined};
  // Fixture construction is only a location redistribution, never an earned action.
  s.pendingLoot.push(s.inventory.splice(index,1)[0]);const supported=game.validateSave(clone(s));
  assert.deepEqual(sortedItems(supported),originalItems);const before=clone(supported),view=game.pendingLootView(supported),itemRef=supported.pendingLoot[0];
  assert.equal(view.available,true);assert.equal(view.claimable,1);game.act(supported,'claimPending');
  assert.equal(supported.pendingLoot.length,0);assert.equal(supported.inventory.at(-1),itemRef,'claim moves the same object, not a copy');
  assert.deepEqual(sortedItems(supported),originalItems);
  for(const key of Object.keys(before))if(!['inventory','pendingLoot'].includes(key))assert.deepEqual(supported[key],before[key],`claim changes no ${key}`);
  const after=clone(supported);game.act(supported,'claimPending');assert.deepEqual(supported,after,'repeated empty claim is a complete no-op');
  const loaded=game.validateSave(clone(supported));assert.deepEqual(sortedItems(loaded),originalItems);
  assert.equal(digest(source),sourceHash,'earned source snapshot remains untouched');
  return {kind:'constructed supported-save distribution of naturally earned items; not naturally reached',sourceCampSha256:sourceHash,
    movedEarnedBoundId:id,before:record(before),view,after:record(after),ownedItemsSha256:digest(originalItems),resources:originalResources,
    checks:{validBeforeClaim:true,sameObjectMoved:true,allOwnedBytesPreserved:true,allNonInventoryStatePreserved:true,repeatedClaimNoop:true,reloadPreservesItems:true,sourceUnchanged:true}};
}

export function measure({baseline=null}={}){
  const known=earn(PROTOCOL.knownReproductionSeed,{invest:false,baseline}),invested=earn(PROTOCOL.knownReproductionSeed,{baseline}),rows=[invested,...PROTOCOL.additionalFixedSeeds.map(seed=>earn(seed,{baseline}))];
  assert.equal(known.summary.combatTraceSha256,invested.summary.combatTraceSha256,'one un-equipped bound spare does not alter this measured combat/drop stream');
  assert.equal(known.summary.status,'first-natural-overflow');assert.equal(known.summary.attempts,315);assert.equal(known.summary.pulses,2746);
  return {kind:'v0.28 source-engine pending loot measurement; not browser acceptance',protocol:PROTOCOL,
    knownReproduction:known.summary,knownInvestedCombatParity:true,rows:rows.map(earned=>({...earned.summary,naturalRecovery:naturalRecovery(earned),supportedFreeSpaceClaim:supportedFreeSpaceClaim(earned)}))};
}

async function main(){
  const args=process.argv.slice(2),at=args.indexOf('--output'),output=resolve(at<0?fileURLToPath(new URL('../docs/measurements/pending-loot-v028.json',import.meta.url)):args[at+1]);
  const inputPaths=['src/engine.js','src/loot.js','scripts/pending-loot-measurement.mjs'];
  const inputs=async()=>Object.fromEntries(await Promise.all(inputPaths.map(async path=>[path,sha(await readFile(new URL('../'+path,import.meta.url)))])));
  const baselineAt=args.indexOf('--baseline');let baseline=null,baselineEvidence=null;
  if(baselineAt>=0){
    const path=resolve(args[baselineAt+1]),engineHash=sha(await readFile(path));
    assert.equal(engineHash,'76750a0da6b2ecf4a0e61ce0a99bc1c166f76a53ea744098f8f03fe5074b0ffd','baseline is the exact v027 engine');
    const lootHash=sha(await readFile(new URL('./loot.js',pathToFileURL(path))));
    assert.equal(lootHash,sha(await readFile(new URL('../src/loot.js',import.meta.url))),'baseline loot is unchanged exact current loot');
    baseline=await import(pathToFileURL(path));
    baselineEvidence={commit:'6cb7230093f0ddc99bdddd0c1d96efabf4aa8d4b',repositoryPath:'dot-game/src/engine.js',engineSha256:engineHash,lootSha256:lootHash,
      comparison:'Every acquisition action and pulse compares the full state and all reports. Only the exact pending-guaranteed-reward log wording is normalized; RNG, equipment, inventory, pending, resources and all other fields are exact.'};
  }
  const before=await inputs(),result=measure({baseline}),after=await inputs();assert.deepEqual(after,before,'measurement engine/loot/script inputs stay frozen');
  result.baseline=baselineEvidence;
  result.inputSha256=before;await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({output,bytes:(await readFile(output)).length,sha256:sha(await readFile(output)),knownInvestedCombatParity:result.knownInvestedCombatParity,
    rows:result.rows.map(({seed,status,attempts,pulses,final,naturalRecovery,supportedFreeSpaceClaim})=>({seed,status,attempts,pulses,final,naturalRecovery:naturalRecovery.tested,freeSpaceClaim:supportedFreeSpaceClaim.checks}))},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
