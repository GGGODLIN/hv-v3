/** Predeclared source simulation. All gameplay writes go through public APIs. */
import assert from 'node:assert/strict';
import {access, mkdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {relative, resolve, sep} from 'node:path';
import * as game from '../src/engine.js';
import {scoreItem, resolveWeaponFamily, isSoulboundItem} from '../src/loot.js';

const args=process.argv.slice(2), option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
const label=option('--label')??'baseline';
assert.match(label,/^[a-z0-9-]+$/,'safe evidence label');
const advancedPath=option('--advanced');
const advancedTarget=option('--advanced-target');
const cohort=option('--cohort')??'invested';
assert.ok(['invested','early'].includes(cohort),'known predeclared cohort');
const evidence=option('--output')?pathToFileURL(resolve(option('--output'))+sep):new URL('../measurements/',import.meta.url);
const protocolName=cohort==='early'?'ITEM-WORLD-EARLY-PROTOCOL.md':'ITEM-WORLD-NATURAL-PROTOCOL.md';
const protocolUrl=new URL(`../docs/${protocolName}`,import.meta.url);
const protocolLink=relative(fileURLToPath(evidence),fileURLToPath(protocolUrl)).split(sep).join('/');
await mkdir(evidence,{recursive:true});
for(const extension of ['json','md']){
  try{await access(new URL(`item-world-natural-${label}.${extension}`,evidence));}
  catch(error){if(error.code==='ENOENT')continue;throw error;}
  throw new Error(`Evidence label ${label} already exists; choose a new --label to preserve previous outcomes.`);
}
const sourceUrls={engine:new URL('../src/engine.js',import.meta.url),loot:new URL('../src/loot.js',import.meta.url),
  script:new URL(import.meta.url),protocol:protocolUrl};
const hash=value=>createHash('sha256').update(value).digest('hex');
const sourceHashes=async()=>Object.fromEntries(await Promise.all(Object.entries(sourceUrls).map(async([k,p])=>[k,hash(await readFile(p))])));
const startedAt=new Date().toISOString(),wallStart=performance.now(),beforeHashes=await sourceHashes();
assert.equal(game.ITEM_WORLD_STRENGTH_STAGE,5,'predeclared fixed local strength');
assert.equal(game.ITEM_WORLD_ROUNDS,5);

const copy=structuredClone, rates=new Set(['crit','evade','block']), statKeys=['attack','defense','hp','crit','evade','block','parry'];
const held=s=>[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];
const owned=s=>[...Object.values(s.equipment),...s.inventory];
const findItem=(s,id)=>owned(s).find(i=>i.id===id);
const eligible=item=>item?.slot==='weapon'&&['Fair','Average','Superior'].includes(item.quality)
  &&['axe','rapier','club'].includes(resolveWeaponFamily(item));
const itemRecord=item=>item?{id:item.id,name:item.name,quality:item.quality,family:resolveWeaponFamily(item),
  slot:item.slot,level:item.level,stats:copy(item.stats),score:scoreItem(item),
  bound:isSoulboundItem(item),itemWorld:item.itemWorld?.level??0}:null;
const totalXp=s=>game.cumulativeXp(s.hero.level)+s.hero.xp;
const stateRecord=s=>({level:s.hero.level,xp:s.hero.xp,totalXp:totalXp(s),gold:s.hero.gold,fragments:s.soulFragments,
  seeds:s.worldSeeds,wins:s.wins,kills:s.kills,unlocked:s.unlocked,stage:s.stage,held:held(s).length,
  inventory:s.inventory.length,pending:s.pendingLoot.length,rng:s.seed,equipment:Object.fromEntries(Object.entries(s.equipment).map(([k,v])=>[k,itemRecord(v)])),
  abilities:copy(s.abilities??null),derived:game.stats(s)});
const unchangedCounters=s=>({wins:s.wins,cleared:s.battle.cleared,unlocked:s.unlocked,stage:s.stage,
  bestTimes:copy(s.battle.bestTimes),fragments:s.soulFragments});
const canonical=s=>game.validateSave(copy(s));
function equipId(s,id){const item=findItem(s,id);assert.ok(item,`held item ${id}`);if(s.equipment[item.slot].id!==id)game.act(s,'equip',id);assert.equal(s.equipment[item.slot].id,id);}
function equipBest(s,excludeWeaponId=null){
  for(const slot of ['weapon','armor','accessory']){
    const candidates=[s.equipment[slot],...s.inventory.filter(i=>i.slot===slot)].filter(i=>slot!=='weapon'||i.id!==excludeWeaponId);
    assert.ok(candidates.length);const best=candidates.reduce((a,b)=>scoreItem(a)>=scoreItem(b)?a:b);equipId(s,best.id);
  }
}
function learnRankOne(s){for(const id of ['hp-tank','mp-tank','one-handed-damage']){game.act(s,'learnAbility',id);game.act(s,'slotAbility',id);}}
function oldestSupportedDrop(s){return owned(s).filter(i=>eligible(i)&&/^loot-\d+$/.test(i.id))
  .sort((a,b)=>Number(a.id.slice(5))-Number(b.id.slice(5)))[0]??null;}
const quoteDisplay=(key,value)=>Number(((Number(value)||0)*(rates.has(key)?100:1)).toFixed(8));
const itemDetailDisplay=(key,value)=>rates.has(key)?Number(((Number(value)||0)*100).toFixed(1))
  :key==='parry'?Number((Number(value)||0).toFixed(1)):Math.round(Number(value)||0);
function quoteDeltas(offer){return statKeys.map(key=>({key,presentBefore:Object.hasOwn(offer.before.stats,key),
  presentAfter:Object.hasOwn(offer.after.stats,key),before:offer.before.stats[key]??0,after:offer.after.stats[key]??0,
  delta:(offer.after.stats[key]??0)-(offer.before.stats[key]??0),
  quoteDisplayBefore:quoteDisplay(key,offer.before.stats[key]),quoteDisplayAfter:quoteDisplay(key,offer.after.stats[key]),
  itemDetailBefore:itemDetailDisplay(key,offer.before.stats[key]),itemDetailAfter:itemDetailDisplay(key,offer.after.stats[key])}));}

function advanceToEnd(s,kind,stage){
  const start=stateRecord(s),startIds=new Set(held(s).map(i=>i.id));
  let steps=0,expectedGold=0,expectedXp=0,observedKills=0,nonbossKills=0,bossKills=0,bossOnlyDropAnomalies=0;
  while(s.mode==='battle'&&steps<4000){
    const living=s.enemies.filter(e=>e.hp>0),ids=new Set(held(s).map(i=>i.id));
    game.advance(s,.1);steps++;
    const killed=living.filter(e=>e.hp===0);
    for(const enemy of killed){
      observedKills++;if(enemy.boss)bossKills++;else nonbossKills++;
      const ordinaryCredits=4+stage*2+(enemy.boss?15:0);
      expectedGold+=kind==='item-world'?Math.floor(ordinaryCredits/4):ordinaryCredits;
      expectedXp+=(enemy.boss?18:7)+stage*2;
    }
    if(kind==='item-world'&&killed.length&&killed.every(e=>e.boss)&&held(s).some(i=>!ids.has(i.id)))bossOnlyDropAnomalies++;
  }
  const censored=s.mode==='battle',report=game.expeditionReports(s)[0]??null;
  const outcome=censored?'censored':report?.outcome??'no-report';
  const end=stateRecord(s),drops=held(s).filter(i=>!startIds.has(i.id)).map(itemRecord);
  const result={outcome,steps,simulatedSeconds:Number((steps*.1).toFixed(1)),report:copy(report),start,end,
    drops,dropCount:drops.length,observedKills,nonbossKills,bossKills,
    deltaGold:end.gold-start.gold,deltaXp:end.totalXp-start.totalXp,expectedKillGold:expectedGold,expectedKillXp:expectedXp,bossOnlyDropAnomalies};
  if(censored||s.mode!=='town')game.act(s,'retreat');
  assert.equal(s.mode,'town');
  if(kind==='item-world'){
    assert.equal(result.deltaGold,expectedGold,'IW grants only quartered kill gold');
    assert.equal(result.deltaXp,expectedXp,'IW grants only kill XP');
    assert.equal(result.end.kills-result.start.kills,observedKills,'observed live-to-dead kills');
    assert.equal(bossOnlyDropAnomalies,0,'no ordinary boss completion item');
  }
  return result;
}
function runNormal(s,stage){
  game.act(s,'selectStage',stage);assert.equal(s.stage,stage);
  const before=stateRecord(s);game.act(s,'start');
  if(s.mode!=='battle')return {outcome:'blocked',start:before,end:stateRecord(s),reason:s.logs[0]};
  game.act(s,'finishThenCamp',true);
  const result=advanceToEnd(s,'normal',stage);
  if(result.outcome==='win'){assert.equal(s.wins,before.wins+1);assert.equal(s.worldSeeds,before.seeds+1);assert.equal(s.soulFragments,before.fragments+10);}
  else {assert.equal(s.wins,before.wins);assert.equal(s.worldSeeds,before.seeds);assert.equal(s.soulFragments,before.fragments);}
  return {stage,...result};
}
function acquire(seed){
  const s=game.createGame(seed),starters=Object.fromEntries(Object.entries(s.equipment).map(([slot,item])=>[slot,item.id]));
  const runs=[];let previousFailed=false;
  while(runs.length<40){
    if(cohort==='invested'){equipBest(s);learnRankOne(s);}
    const target=oldestSupportedDrop(s);
    if(s.wins>=10&&s.soulFragments>=100&&target){
      const before=stateRecord(s),offer=game.previewSoulbindWeapon(s,target.id);
      if(!offer.available)return {seed,status:'binding-blocked',reason:offer.reason,runs,state:before,starters};
      assert.equal(offer.cost,100);game.act(s,'soulbindWeapon',offer);
      assert.ok(isSoulboundItem(findItem(s,target.id)),'natural target successfully bound');
      assert.equal(s.soulFragments,before.fragments-100);assert.equal(s.seed,before.rng,'binding consumes no RNG');
      return {seed,status:'ready',runs,starters,targetId:target.id,targetBeforeBinding:itemRecord(offer.before),
        targetAfterBinding:itemRecord(findItem(s,target.id)),beforeBinding:before,entryProfile:stateRecord(s),state:s};
    }
    const stage=cohort==='early'?1:Math.max(1,Math.min(5,s.unlocked)-(previousFailed?1:0));
    const result=runNormal(s,stage);runs.push({attempt:runs.length+1,...result});
    if(['blocked','censored','no-report'].includes(result.outcome))return {seed,status:result.outcome,runs,starters,state:stateRecord(s)};
    previousFailed=result.outcome!=='win';
  }
  return {seed,status:'acquisition-limit',runs,starters,state:stateRecord(s)};
}
function prepareArm(profile,targetId,starters,policy,location){
  const s=canonical(profile);
  if(policy==='score-best')equipBest(s,location==='backpack'?targetId:null);
  else for(const slot of ['weapon','armor','accessory'])equipId(s,starters[slot]);
  if(location==='equipped')equipId(s,targetId);
  assert.equal(s.equipment.weapon.id===targetId,location==='equipped');
  assert.equal(s.seed,profile.seed,'gear policy never draws RNG');return s;
}
function trial(s,targetId,attempt){
  const before=stateRecord(s),counters=unchangedCounters(s),offer=game.previewItemWorld(s,targetId);
  if(!offer.available)return {attempt,outcome:'blocked',reason:offer.reason,start:before};
  assert.equal(offer.strengthStage,5);assert.equal(offer.cost,1);assert.equal(offer.rounds,5);
  const targetBefore=itemRecord(findItem(s,targetId)),rows=quoteDeltas(offer);
  game.act(s,'enterItemWorld',offer);
  assert.equal(game.itemWorldView(s).active,true,'public quote starts IW');assert.equal(s.worldSeeds,before.seeds-1);
  const result=advanceToEnd(s,'item-world',5);
  assert.deepEqual(unchangedCounters(s),counters,'IW does not pollute normal completion counters/rewards');
  assert.equal(s.worldSeeds,before.seeds-1,'no refund and no completion seed');
  const targetAfter=itemRecord(findItem(s,targetId));
  if(result.outcome==='win')assert.equal(targetAfter.itemWorld,1);else assert.equal(targetAfter.itemWorld,0);
  return {attempt,...result,entry:before,targetBefore,targetAfter,previewDeltas:rows,
    zeroQuoteFields:rows.filter(r=>r.presentBefore&&r.quoteDisplayBefore===r.quoteDisplayAfter).map(r=>r.key),
    zeroItemDetailFields:rows.filter(r=>r.presentBefore&&r.itemDetailBefore===r.itemDetailAfter).map(r=>r.key),
    absentFields:rows.filter(r=>!r.presentBefore&&!r.presentAfter).map(r=>r.key),
    everyPresentQuoteFieldNeutral:rows.filter(r=>r.presentBefore).every(r=>r.quoteDisplayBefore===r.quoteDisplayAfter),
    leveledDuringTrial:result.end.level!==before.level,ordinaryRewardCountersUnchanged:true,
    seedsBefore:before.seeds,seedsAfter:s.worldSeeds};
}
const profiles=[];
for(let seed=1;seed<=100;seed++){
  const acquisition=acquire(seed);
  if(acquisition.status!=='ready'){profiles.push(acquisition);continue;}
  const {state,...record}=acquisition,arms=[];
  for(const policy of (cohort==='early'?['original-starter']:['score-best','original-starter']))for(const location of ['backpack','equipped']){
    const s=prepareArm(state,record.targetId,record.starters,policy,location),initial=stateRecord(s),attempts=[];
    attempts.push(trial(s,record.targetId,1));
    if(attempts[0].outcome==='defeat')attempts.push(trial(s,record.targetId,2));
    arms.push({policy,location,initial,attempts,final:stateRecord(s)});
  }
  profiles.push({...record,arms});
}

let advanced=null;
if(advancedPath){
  const bytes=await readFile(advancedPath),raw=JSON.parse(bytes),s=game.validateSave(raw),imported=stateRecord(s);
  assert.equal(raw.version,2,'advanced profile is an unchanged v0.23 save');assert.equal(s.worldSeeds,0);
  const normal=runNormal(s,s.stage);
  const target=owned(s).filter(i=>eligible(i)&&isSoulboundItem(i)&&!i.itemWorld&&(!advancedTarget||i.id===advancedTarget))
    .sort((a,b)=>Number(a.id.replace('loot-',''))-Number(b.id.replace('loot-','')))[0];
  advanced={kind:'separate unchanged ordinary v0.23 advanced profile, not fresh cohort',inputSha256:hash(bytes),
    inputFilename:advancedPath.split('/').at(-1),imported,normal,targetId:target?.id??null,
    trial:normal.outcome==='win'&&target?trial(s,target.id,1):null,final:stateRecord(s)};
}
const distribution=values=>Object.fromEntries([...new Set(values)].sort((a,b)=>typeof a==='number'?a-b:String(a).localeCompare(String(b)))
  .map(value=>[value,values.filter(v=>v===value).length]));
const describe=values=>{const sorted=[...values].sort((a,b)=>a-b);return sorted.length?{count:sorted.length,min:sorted[0],
  median:sorted[Math.floor((sorted.length-1)/2)],p90:sorted[Math.ceil(sorted.length*.9)-1],max:sorted.at(-1),mean:sorted.reduce((a,b)=>a+b,0)/sorted.length}:null;};
const ready=profiles.filter(p=>p.status==='ready'),allRuns=profiles.flatMap(p=>p.runs),arms=ready.flatMap(p=>p.arms),attempts=arms.flatMap(a=>a.attempts);
const byArm=Object.fromEntries((cohort==='early'?['original-starter']:['score-best','original-starter']).flatMap(policy=>['backpack','equipped'].map(location=>{
  const subset=arms.filter(a=>a.policy===policy&&a.location===location),first=subset.map(a=>a.attempts[0]),retry=subset.flatMap(a=>a.attempts.slice(1));
  return [`${policy}/${location}`,{profiles:subset.length,firstOutcomes:distribution(first.map(r=>r.outcome)),retryOutcomes:distribution(retry.map(r=>r.outcome)),
    finalOutcomes:distribution(subset.map(a=>a.attempts.at(-1).outcome)),firstElapsed:describe(first.filter(r=>r.report).map(r=>r.report.elapsed)),
    firstHpLost:describe(first.filter(r=>r.report).map(r=>r.report.survival.hpLost)),dropCounts:distribution(subset.flatMap(a=>a.attempts).map(r=>r.dropCount??0)),
    firstAllPresentQuoteFieldsNeutral:first.filter(r=>r.everyPresentQuoteFieldNeutral).length,
    firstWithAnyPresentNeutralQuoteField:first.filter(r=>r.zeroQuoteFields?.length).length,
    firstWithAnyPresentNeutralItemDetailField:first.filter(r=>r.zeroItemDetailFields?.length).length,
    finalSeedBalances:distribution(subset.map(a=>a.final.seeds))}];
})));
const afterHashes=await sourceHashes();
const result={kind:'v0.24 predeclared natural engine-earned source simulation; NOT browser evidence; no outcome-driven tuning',
  startedAt,finishedAt:new Date().toISOString(),wallSeconds:(performance.now()-wallStart)/1000,label,cohort,sourceHashes:beforeHashes,
  sourceHashesAfter:afterHashes,sourceStable:JSON.stringify(beforeHashes)===JSON.stringify(afterHashes),
  protocol:protocolName,parameters:{freshSeeds:[1,100],maxAcquisitionAttempts:40,maxSimulatedSecondsPerEncounter:400,
    normalStageCeiling:cohort==='early'?1:5,abilities:cohort==='early'?'none purchased':'rank1 HP/MP/1H',normalWinsBeforeBinding:10,bindingCost:100,itemWorldStrengthStage:5,rounds:5,defeatRetries:1},
  summary:{profiles:profiles.length,acquisitionStatus:distribution(profiles.map(p=>p.status)),normalRuns:allRuns.length,
    normalOutcomes:distribution(allRuns.map(r=>r.outcome)),normalSimulatedSeconds:allRuns.reduce((n,r)=>n+(r.report?.elapsed??0),0),
    acquisitionAttempts:distribution(profiles.map(p=>p.runs.length)),entryLevels:distribution(ready.map(p=>p.entryProfile.level)),
    targetQualities:distribution(ready.map(p=>p.targetAfterBinding.quality)),targetFamilies:distribution(ready.map(p=>p.targetAfterBinding.family)),
    arms:arms.length,attempts:attempts.length,outcomes:distribution(attempts.map(r=>r.outcome)),
    trialSimulatedSeconds:attempts.reduce((n,r)=>n+(r.report?.elapsed??0),0),byArm},profiles,advanced};
const outputUrl=new URL(`item-world-natural-${label}.json`,evidence);
await writeFile(outputUrl,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
const table=Object.entries(byArm).map(([arm,row])=>`| ${arm} | ${row.profiles} | ${JSON.stringify(row.firstOutcomes)} | ${JSON.stringify(row.retryOutcomes)} | ${JSON.stringify(row.finalOutcomes)} | ${row.firstElapsed?.median??'—'} |`).join('\n');
const md=`# Item World natural source measurement — ${label}\n\nCohort: **${cohort}**. ${cohort==='early'?'Exploratory cohort declared after the original baseline; not a replacement for it. ':''}This is source simulation, not browser evidence or a universal balance claim. Fixed strength5 was declared before outcomes; starter-gear arms are deliberately weaker choices.\n\n- Source stable during run: **${result.sourceStable}**.\n- Fresh profiles: ${profiles.length}; acquisition statuses: ${JSON.stringify(result.summary.acquisitionStatus)}.\n- Normal runs: ${allRuns.length}; outcomes: ${JSON.stringify(result.summary.normalOutcomes)}.\n- Entry levels: ${JSON.stringify(result.summary.entryLevels)}.\n- Bound target quality/family: ${JSON.stringify(result.summary.targetQualities)} / ${JSON.stringify(result.summary.targetFamilies)}.\n- IW attempts: ${attempts.length}; outcomes: ${JSON.stringify(result.summary.outcomes)}.\n- Wall time: ${result.wallSeconds.toFixed(2)} seconds. Simulated normal/IW time: ${result.summary.normalSimulatedSeconds.toFixed(1)} / ${result.summary.trialSimulatedSeconds.toFixed(1)} seconds.\n\n| Arm | Profiles | First entry | Defeat retry | Final outcome | First median seconds |\n|---|---:|---|---|---|---:|\n${table}\n\nAll IW attempts checked exact kill-only quarter-gold/XP ledgers and unchanged normal wins, cleared count, unlock, best-times, fragments and post-entry seed balances. Neutral quote/item-detail fields, absent legacy fields, all drops and losses remain in JSON. Entry preview isolates IW1 at entry level; actual later stats may also include earned level growth.\n\n${advanced?`Separate unchanged v0.23 advanced profile: imported Lv.${advanced.imported.level}, normal ${advanced.normal.outcome}, target ${advanced.targetId}, IW ${advanced.trial?.outcome??'not entered'}; source input SHA256 ${advanced.inputSha256}.\n\n`:''}Protocol: [predeclared protocol](${protocolLink}). Full outcomes/source hashes: [JSON](item-world-natural-${label}.json).\n`;
await writeFile(new URL(`item-world-natural-${label}.md`,evidence),md,{flag:'wx'});
console.log(JSON.stringify({output:fileURLToPath(outputUrl),sourceStable:result.sourceStable,summary:result.summary,
  advanced:advanced?{level:advanced.imported.level,normal:advanced.normal.outcome,trial:advanced.trial?.outcome??null}:null},null,2));
