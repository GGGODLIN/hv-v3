/** Fixed-protocol naturally earned source play; no generated-state rewriting. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as game from '../src/engine.js';
import {scoreItem} from '../src/loot.js';
import {writeShardedMeasurement} from './measurement-shards.mjs';
const clone=structuredClone,hash=raw=>createHash('sha256').update(raw).digest('hex');
export const SEEDS=Object.freeze([1,7,12,19,29,42,55,77,101,123]);
const TACTICS=['balanced','assault','sustain'],SNAPSHOTS=[0,4,8,12];
const stateRecord=s=>({level:s.hero.level,xp:s.hero.xp,gold:s.hero.gold,fragments:s.soulFragments,seeds:s.worldSeeds,wins:s.wins,kills:s.kills,
  rng:s.seed,inventory:s.inventory.length,pending:s.pendingLoot.length,unlocked:s.unlocked,equipped:Object.fromEntries(Object.entries(s.equipment).map(([slot,item])=>[slot,item.id]))});
function prepare(s){
  for(const slot of ['weapon','armor','accessory']){
    const held=[s.equipment[slot],...s.inventory.filter(i=>i.slot===slot)],best=held.reduce((a,b)=>scoreItem(a)>=scoreItem(b)?a:b);
    if(best.id!==s.equipment[slot].id)game.act(s,'equip',best.id);
  }
  for(const id of ['hp-tank','mp-tank','one-handed-damage']){game.act(s,'learnAbility',id);game.act(s,'slotAbility',id);}
}
function run(s){
  const stage=s.unlocked;game.act(s,'selectStage',stage);assert.equal(s.stage,stage);
  const before=stateRecord(s);game.act(s,'start');
  if(s.mode!=='battle')return {outcome:'start-blocked',stage,before,after:stateRecord(s),pulses:0};
  game.act(s,'finishThenCamp',true);let pulses=0,minStock=s.potions;
  while(s.mode==='battle'&&pulses<20000){game.advance(s,.25);pulses++;minStock=Math.min(minStock,s.potions);}
  const report=game.expeditionReports(s)[0],outcome=s.mode==='battle'?'censored':report?.outcome??'missing-report';
  if(s.emergencySupply&&s.strategy!=='sustain')assert.ok(minStock>=1,'extra rule preserves the last potion');
  const result={outcome,stage,before,after:stateRecord(s),pulses,elapsed:report?.elapsed??null,
    minHpPercent:report?.survival.minHpPercent??null,hpLost:report?.survival.hpLost??null,actions:report?.actions??null,
    remaining:s.potions,minStock,report:report??null};
  game.act(s,'retreat');return result;
}
export function measure(){
  const acquisitions=[],pairs=[];
  for(const seed of SEEDS){
    const earned=game.createGame(seed);prepare(earned);
    for(let attempt=0;attempt<=12;attempt++){
      if(SNAPSHOTS.includes(attempt)){
        const snapshot=clone(earned),snapshotSha256=hash(JSON.stringify(snapshot));
        for(const strategy of TACTICS){
          const off=clone(snapshot),on=clone(snapshot);
          for(const s of [off,on])game.act(s,'setStrategy',strategy);
          game.act(off,'setEmergencySupply',false);game.act(on,'setEmergencySupply',true);
          pairs.push({seed,afterAttempts:attempt,strategy,snapshotSha256,off:run(off),on:run(on)});
        }
        assert.deepEqual(earned,snapshot,'measurement branches cannot change acquisition state');
      }
      if(attempt===12)break;
      const result=run(earned);acquisitions.push({seed,attempt:attempt+1,...result});
      prepare(earned);
    }
  }
  const summary=Object.fromEntries(TACTICS.map(strategy=>{
    const rows=pairs.filter(r=>r.strategy===strategy),bothWins=rows.filter(r=>r.off.outcome==='win'&&r.on.outcome==='win');
    return [strategy,{pairs:rows.length,offWins:rows.filter(r=>r.off.outcome==='win').length,onWins:rows.filter(r=>r.on.outcome==='win').length,
      changedOutcomes:rows.filter(r=>r.off.outcome!==r.on.outcome).map(r=>({seed:r.seed,afterAttempts:r.afterAttempts,off:r.off.outcome,on:r.on.outcome})),
      offPotions:rows.reduce((n,r)=>n+(r.off.actions?.potions??0),0),onPotions:rows.reduce((n,r)=>n+(r.on.actions?.potions??0),0),
      bothWins:bothWins.length,winTime:{lower:bothWins.filter(r=>r.on.elapsed<r.off.elapsed).length,equal:bothWins.filter(r=>r.on.elapsed===r.off.elapsed).length,higher:bothWins.filter(r=>r.on.elapsed>r.off.elapsed).length},
      minimumStockOn:Math.min(...rows.map(r=>r.on.minStock??3)),censored:rows.filter(r=>[r.off.outcome,r.on.outcome].includes('censored')).length}];
  }));
  return {kind:'fixed-protocol naturally earned source simulation; not browser play',seeds:SEEDS,snapshots:SNAPSHOTS,
    acquisitionRuns:acquisitions.length,acquisitionOutcomes:acquisitions.reduce((out,r)=>({...out,[r.outcome]:(out[r.outcome]??0)+1}),{}),summary,acquisitions,pairs};
}
async function main(){
  const output=resolve(process.argv[2]??'docs/measurements/emergency-supply-deepest/index.json');
  const paths=['src/engine.js','src/loot.js','scripts/measure-emergency-supply.mjs','docs/EMERGENCY-SUPPLY-MEASUREMENT-PROTOCOL.md'];
  const fingerprints=async()=>Object.fromEntries(await Promise.all(paths.map(async path=>[path,hash(await readFile(new URL('../'+path,import.meta.url)))])));
  const before=await fingerprints(),result=measure(),after=await fingerprints();assert.deepEqual(before,after);
  const data={...result,sourceBefore:before,sourceAfter:after};
  const storage=await writeShardedMeasurement(data,output,['acquisitions','pairs']);
  console.log(JSON.stringify({storage,acquisitionRuns:result.acquisitionRuns,acquisitionOutcomes:result.acquisitionOutcomes,summary:result.summary,sourceStable:true},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
