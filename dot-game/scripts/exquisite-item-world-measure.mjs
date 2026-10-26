/** Fixed-protocol source simulation; no mutation of resources, items, RNG or combat. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as game from '../src/engine.js';
import * as loot from '../src/loot.js';
const copy=structuredClone, hash=x=>createHash('sha256').update(x).digest('hex');
export const FRESH_SEEDS=Object.freeze([1,7,12,19,29,42,55,77,101,123]);
const held=s=>[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];
const find=(s,id)=>held(s).find(item=>item.id===id);
const targetRecord=i=>({id:i.id,family:loot.resolveWeaponFamily(i),quality:i.quality,level:i.level,stats:copy(i.stats),power:i.power,anchor:copy(i.soulbound??null),iw:i.itemWorld?.level??0,hasParry:Object.hasOwn(i.stats,'parry')});
const stateRecord=s=>({level:s.hero.level,xp:s.hero.xp,gold:s.hero.gold,fragments:s.soulFragments,seeds:s.worldSeeds,wins:s.wins,kills:s.kills,rng:s.seed,inventory:s.inventory.length,pending:s.pendingLoot.length,equipped:s.equipment.weapon.id});
function equipBest(s){for(const slot of ['weapon','armor','accessory']){const items=[s.equipment[slot],...s.inventory.filter(i=>i.slot===slot)];const best=items.reduce((a,b)=>loot.scoreItem(a)>=loot.scoreItem(b)?a:b);if(best.id!==s.equipment[slot].id)game.act(s,'equip',best.id);}}
function learn(s){for(const id of ['hp-tank','mp-tank','one-handed-damage']){game.act(s,'learnAbility',id);game.act(s,'slotAbility',id);}}
function stepUntilCamp(s){let pulses=0;while(s.mode==='battle'&&pulses++<20000)game.advance(s,.25);return {pulses,censored:s.mode==='battle',report:game.expeditionReports(s)[0]??null};}
export function acquireNatural(seed){
  const state=game.createGame(seed),runs=[];
  for(let attempt=0;attempt<40&&state.wins<20;attempt++){
    equipBest(state);learn(state);game.act(state,'selectStage',1);const before=stateRecord(state);game.act(state,'start');
    if(state.mode!=='battle')return {seed,state,runs,status:'ordinary-start-blocked'};
    game.act(state,'finishThenCamp',true);const result=stepUntilCamp(state);runs.push({attempt:attempt+1,outcome:result.censored?'censored':result.report?.outcome??'no-report',elapsed:result.report?.elapsed??null,before,after:stateRecord(state)});
    if(result.censored)return {seed,state,runs,status:'ordinary-censored'};
  }
  if(state.wins<20)return {seed,state,runs,status:'acquisition-limit'};
  const candidates=held(state).filter(i=>i.slot==='weapon'&&i.quality==='Exquisite'&&!i.soulbound&&/^loot-\d+$/.test(i.id)&&['axe','rapier','club'].includes(loot.resolveWeaponFamily(i))).sort((a,b)=>Number(a.id.slice(5))-Number(b.id.slice(5)));
  return {seed,state,runs,status:candidates.length?'ready':'no-exquisite',targetId:candidates[0]?.id??null};
}
export function trialNatural(state,id){
  const before=stateRecord(state),original=copy(find(state,id));assert.ok(original);assert.equal(original.quality,'Exquisite');
  const bind=game.previewSoulbindWeapon(state,id);if(!bind.available)return {status:'binding-blocked',reason:bind.reason,before};
  assert.equal(bind.cost,100);const rng=state.seed;game.act(state,'soulbindWeapon',bind);assert.equal(state.seed,rng);assert.equal(state.soulFragments,before.fragments-100);
  const bound=copy(find(state,id)),quote=game.previewItemWorld(state,id);if(!quote.available)return {status:'iw-blocked',reason:quote.reason,before,bound:targetRecord(bound)};
  const fixed={wins:state.wins,fragments:state.soulFragments,cleared:state.battle.cleared,stage:state.stage,unlocked:state.unlocked,bestTimes:copy(state.battle.bestTimes)};
  const worn=state.equipment.weapon.id,location=worn===id?'equipped':'backpack',entry=stateRecord(state);
  assert.equal(quote.strengthStage,5);assert.equal(quote.rounds,5);assert.equal(quote.cost,1);
  game.act(state,'enterItemWorld',quote);assert.equal(state.worldSeeds,entry.seeds-1);assert.equal(state.equipment.weapon.id,worn);assert.equal(game.itemWorldView(state).active,true);
  const result=stepUntilCamp(state),after=find(state,id),outcome=result.censored?'censored':result.report?.outcome??'no-report';
  assert.deepEqual({wins:state.wins,fragments:state.soulFragments,cleared:state.battle.cleared,stage:state.stage,unlocked:state.unlocked,bestTimes:copy(state.battle.bestTimes)},fixed);
  assert.equal(state.worldSeeds,entry.seeds-1);assert.equal(state.equipment.weapon.id,worn);assert.deepEqual(after.soulbound,bound.soulbound);assert.deepEqual(after.rolls,bound.rolls);assert.equal(after.id,original.id);
  assert.equal(Object.hasOwn(after.stats,'parry'),Object.hasOwn(original.stats,'parry'));
  if(outcome==='win'){assert.equal(after.itemWorld?.level,1);assert.equal(game.previewItemWorld(state,id).available,false);}else assert.equal(after.itemWorld,undefined);
  const sameLevelBefore=loot.scaleSoulboundItem(bound,after.level);
  const deltas=Object.fromEntries(Object.keys(after.stats).map(key=>[key,{before:sameLevelBefore.stats[key],after:after.stats[key],delta:Number((after.stats[key]-sameLevelBefore.stats[key]).toFixed(4))}]));
  const restored=game.validateSave(copy(state));assert.deepEqual(find(restored,id),after);assert.equal(restored.worldSeeds,state.worldSeeds);
  return {status:'completed',outcome,location,before,entry,after:stateRecord(state),original:targetRecord(original),bound:targetRecord(bound),upgraded:targetRecord(after),sameLevelBefore:targetRecord(sameLevelBefore),sameLevelStatDeltas:deltas,neutralStats:Object.keys(deltas).filter(k=>deltas[k].delta===0),trialPulses:result.pulses,report:result.report,reloadPreserved:true};
}
async function main(){
  const args=process.argv.slice(2),option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];},label=option('--label')??'baseline';assert.match(label,/^[a-z0-9-]+$/);
  const output=resolve(option('--output')??`measurements/exquisite-item-world-${label}.json`),profile=option('--profile');
  const paths=['index.html','style.css','src/engine.js','src/loot.js','src/session.js','src/ui.js'];
  const hashes=async()=>Object.fromEntries(await Promise.all(paths.map(async path=>[path,hash(await readFile(new URL('../'+path,import.meta.url)))])));
  const runtimeBefore=await hashes(),fresh=[];
  for(const seed of FRESH_SEEDS){const acquired=acquireNatural(seed);fresh.push({seed,status:acquired.status,runs:acquired.runs,acquired:stateRecord(acquired.state),trial:acquired.status==='ready'?trialNatural(acquired.state,acquired.targetId):null});}
  let actual=null;
  if(profile){const raw=await readFile(profile),sha=hash(raw),expected=option('--expected-sha');if(expected)assert.equal(sha,expected);const parsed=JSON.parse(raw),rows=[];for(const id of ['loot-6','loot-9','loot-15','loot-69'])rows.push({id,...trialNatural(game.validateSave(copy(parsed)),id)});assert.equal(hash(await readFile(profile)),sha);actual={inputSha256:sha,independentForks:true,rows};}
  const runtimeAfter=await hashes();assert.deepEqual(runtimeAfter,runtimeBefore);
  const data={label,kind:'source simulation, not browser play',protocol:{freshSeeds:FRESH_SEEDS,normalWins:20,maxAttempts:40,route:1,policy:'equip highest score held per slot; learn/slot three existing rank1 lines; choose oldest held eligible Exquisite; retain no-access/loss/censor',actualTargets:['loot-6','loot-9','loot-15','loot-69'],actualForks:'independent same-export branches, not four purchases by one profile',notChanged:['resources','generated items','RNG','combat outcomes','difficulty']},runtimeBefore,runtimeAfter,scriptSha256:hash(await readFile(fileURLToPath(import.meta.url))),fresh,actual};
  await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({output,fresh:fresh.map(r=>({seed:r.seed,status:r.status,wins:r.acquired.wins,target:r.trial?.upgraded.id,outcome:r.trial?.outcome,family:r.trial?.upgraded.family,deltas:r.trial?.sameLevelStatDeltas})),actual:actual?.rows.map(r=>({id:r.id,outcome:r.outcome,elapsed:r.report?.elapsed,before:r.sameLevelBefore.stats,after:r.upgraded.stats,level:r.after.level})),runtimeStable:true}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
