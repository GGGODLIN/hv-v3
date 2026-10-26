/** Predeclared naturally earned cohort; source simulation, not browser play. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as game from '../src/engine.js';
import * as previous from '../tests/fixtures/v0.26/engine.js';
import {scoreItem} from '../src/loot.js';
import {writeShardedMeasurement} from './measurement-shards.mjs';
export const SEEDS=Object.freeze([1,7,12,19,29,42,55,77,101,123]);
export const ROUTES=Object.freeze([1,5,8]);
export const STRATEGIES=Object.freeze(['balanced','assault','sustain']);
export const PROTOCOL=Object.freeze({seeds:SEEDS,acquisitionAttempts:12,acquisitionRouteCap:8,measurementRoutes:ROUTES,strategies:STRATEGIES,maxPulses:20000,pulseSeconds:.25,
  acquisition:'Highest-score currently held gear per slot; attempt learn/slot three rank1 lines; highest unlocked route capped8, one route lower immediately after defeat. Highest-score is a measurement adapter, not a recommended best build. No commission, potion, stat, RNG or resource injection.',
  comparison:'Validate one earned camp save, fork identical bytes; use public camp strategy and emergencySupply actions only. OFF vs ON; no manual potions. Skip locked routes, retain all no-use, defeat and censor outcomes.'});
const copy=structuredClone,hash=x=>createHash('sha256').update(x).digest('hex');
const record=s=>({level:s.hero.level,gold:s.hero.gold,wins:s.wins,kills:s.kills,unlocked:s.unlocked,inventory:s.inventory.length,rng:s.seed,weapon:s.equipment.weapon.id});
function prepare(api,s){
  for(const slot of ['weapon','armor','accessory']){
    const best=[s.equipment[slot],...s.inventory.filter(i=>i.slot===slot)].reduce((a,b)=>scoreItem(a)>=scoreItem(b)?a:b);
    if(best.id!==s.equipment[slot].id)api.act(s,'equip',best.id);
  }
  for(const id of ['hp-tank','mp-tank','one-handed-damage']){api.act(s,'learnAbility',id);api.act(s,'slotAbility',id);}
}
export function play(api,s,stage,{paired=null}={}){
  api.act(s,'selectStage',stage);assert.equal(s.stage,stage);
  api.act(s,'start');assert.equal(s.mode,'battle');api.act(s,'finishThenCamp',true);
  if(paired){previous.act(paired,'selectStage',stage);previous.act(paired,'start');previous.act(paired,'finishThenCamp',true);assert.deepEqual(s,paired);}
  let pulses=0,stockUsed=0,minStock=s.potions,manualUses=0,lastPotions=s.potions;
  while(s.mode==='battle'&&pulses<PROTOCOL.maxPulses){
    api.advance(s,PROTOCOL.pulseSeconds);pulses++;
    stockUsed+=Math.max(0,lastPotions-s.potions);lastPotions=s.potions;minStock=Math.min(minStock,s.potions);
    if(paired){previous.advance(paired,PROTOCOL.pulseSeconds);assert.deepEqual(s,paired);assert.deepEqual(api.expeditionReports(s),previous.expeditionReports(paired));}
  }
  const report=api.expeditionReports(s)[0];
  const row={outcome:s.mode==='battle'?'censored':report?.outcome??'no-report',pulses,elapsed:report?.elapsed??null,potions:report?.actions.potions??s.battle.actions.potions,stockUsed,endingStock:s.potions,minStock,manualUses,
    heals:report?.actions.heals??s.battle.actions.heals,hpLost:report?.survival.hpLost??null,minHpPercent:report?.survival.minHpPercent??null,end:record(s),report};
  if(s.mode!=='town'){api.act(s,'retreat');if(paired)previous.act(paired,'retreat');}
  if(paired){assert.deepEqual(s,paired);assert.deepEqual(api.expeditionReports(s),previous.expeditionReports(paired));}
  return row;
}
export function acquire(seed){
  const state=game.createGame(seed),old=previous.createGame(seed),runs=[];let previousDefeat=false;
  for(let attempt=0;attempt<PROTOCOL.acquisitionAttempts;attempt++){
    prepare(game,state);prepare(previous,old);assert.deepEqual(state,old);
    const stage=Math.max(1,Math.min(PROTOCOL.acquisitionRouteCap,state.unlocked)-(previousDefeat?1:0));
    const result=play(game,state,stage,{paired:old});runs.push({attempt:attempt+1,stage,...result});
    if(result.outcome==='censored')return {state,runs,status:'acquisition-censored'};
    previousDefeat=result.outcome==='defeat';
  }
  prepare(game,state);prepare(previous,old);assert.deepEqual(state,old);
  return {state:game.validateSave(copy(state)),runs,status:'ready'};
}
export function measure(){
  const acquisition=[],rows=[],skipped=[];
  for(const seed of SEEDS){
    const earned=acquire(seed);acquisition.push({seed,status:earned.status,earned:record(earned.state),runs:earned.runs});
    if(earned.status!=='ready')continue;
    const raw=JSON.stringify(earned.state),profileSha256=hash(raw);
    for(const stage of ROUTES){
      if(stage>earned.state.unlocked){skipped.push({seed,stage,reason:'not naturally unlocked'});continue;}
      for(const strategy of STRATEGIES){
        const pair={};
        for(const enabled of [false,true]){
          const s=game.validateSave(JSON.parse(raw));game.act(s,'setStrategy',strategy);game.act(s,'setEmergencySupply',enabled);
          assert.equal(s.strategy,strategy);assert.equal(s.emergencySupply===true,enabled);
          pair[enabled?'on':'off']=play(game,s,stage);
        }
        rows.push({seed,stage,strategy,profileSha256,start:record(earned.state),...pair});
      }
    }
    assert.equal(hash(JSON.stringify(earned.state)),profileSha256,'cohort baseline is immutable');
  }
  const summary=Object.fromEntries(STRATEGIES.map(strategy=>{
    const subset=rows.filter(r=>r.strategy===strategy);
    return [strategy,{pairs:subset.length,offWins:subset.filter(r=>r.off.outcome==='win').length,onWins:subset.filter(r=>r.on.outcome==='win').length,
      changedOutcome:subset.filter(r=>r.off.outcome!==r.on.outcome).length,onPotionUses:subset.reduce((sum,r)=>sum+r.on.potions,0),offPotionUses:subset.reduce((sum,r)=>sum+r.off.potions,0),
      morePotionPairs:subset.filter(r=>r.on.potions>r.off.potions).length,noAdditionalUse:subset.filter(r=>r.on.potions===r.off.potions).length,
      elapsed:{shorter:subset.filter(r=>r.on.elapsed<r.off.elapsed).length,equal:subset.filter(r=>r.on.elapsed===r.off.elapsed).length,longer:subset.filter(r=>r.on.elapsed>r.off.elapsed).length},
      lowestOnStock:Math.min(...subset.map(r=>r.on.minStock)),censored:subset.filter(r=>r.on.outcome==='censored'||r.off.outcome==='censored').length}];
  }));
  return {kind:'v0.27 source engine simulation, not actual browser play',protocol:PROTOCOL,summary,acquisition,rows,skipped};
}
async function main(){
  const args=process.argv.slice(2),at=args.indexOf('--output'),output=resolve(at<0?'docs/measurements/emergency-supply-fixed-routes/index.json':args[at+1]);
  const paths=['src/engine.js','src/loot.js','src/session.js','src/ui.js','index.html','style.css'];
  const runtimeHashes=async()=>Object.fromEntries(await Promise.all(paths.map(async p=>[p,hash(await readFile(new URL('../'+p,import.meta.url)))])));
  const runtimeBefore=await runtimeHashes(),data=measure(),runtimeAfter=await runtimeHashes();assert.deepEqual(runtimeAfter,runtimeBefore,'runtime must remain frozen during measurement');
  Object.assign(data,{runtimeBefore,runtimeAfter,scriptSha256:hash(await readFile(fileURLToPath(import.meta.url)))});
  const storage=await writeShardedMeasurement(data,output,['acquisition','rows','skipped']);
  console.log(JSON.stringify({storage,summary:data.summary,acquisitionRuns:data.acquisition.reduce((n,r)=>n+r.runs.length,0),parityPulses:data.acquisition.reduce((n,r)=>n+r.runs.reduce((m,x)=>m+x.pulses,0),0),skipped:data.skipped,runtimeStable:true},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
