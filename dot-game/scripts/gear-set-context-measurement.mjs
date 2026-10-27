/** Earned gear/policy-context measurement. Source execution, not browser play.
 * Fixed seeds/bounds are declared before acquisition; no favorable-seed search.
 * Engine preview is read-only inspection, not a simulated UI Cancel action.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as game from '../src/engine.js';
import {scoreItem,resolveWeaponFamily} from '../src/loot.js';

export const PROTOCOL=Object.freeze({
  seeds:[29,42,77],attemptsPerSeed:30,pulseSeconds:1,maxPulsesPerFight:1000,
  acquisition:'Fresh stage1 Balanced defaults, exactly30 attempts per fixed seed unless start-blocked/censored. Before each attempt choose highest-score owned item per slot (current/earlier item wins ties), then try legal learn/slot actions for all3 existing rank1 lines. Each start requests finishThenCamp. No potions, commission, sales, binding, IW, upgrades, resource/stat/RNG edits or extra attempts. Retain every defeat/censor/missing-family result.',
  presets:'After acquisition, save the first held axe/rapier/club (equipped item then backpack order) in A/B/C, retaining current armor/accessory; restore the acquisition weapon. Missing families are recorded without replacement or extra runs. No random item is created for a test.',
  profiles:'Independent copies of the same prepared earned save: A Balanced/front/ProtectionOFF/supplyOFF/all3 learned abilities slotted; B Assault/caster/ProtectionON only if naturally unlocked/supplyON/HP+1H slotted; C Sustain/weakest/ProtectionOFF/supplyON retained/HP+MP slotted. Keep earned ranks and record locked Protection or already-current gear without forcing a swap.',
  observation:'Inspect exact gear preview, prove full state/RNG unchanged, apply only a valid non-active exact quote, prove current policies/ability allocation and all owned item bytes unchanged. Already-active application is a complete no-op. Run one stage1 expedition for each available family and check actual start report against that branch configuration. No causal speed/survival comparison is made across different gear or policies.'
});
const BASELINE={
  commit:'e4121bb89be2b9e29bdbb262c83f16d0be993267',
  sha256:{
    'src/engine.js':'020c1717d24c20bd914241b3f30adbc091c5a2a851cec8917dca7fc403f21a6d',
    'src/loot.js':'2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7',
    'src/session.js':'821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a'
  }
};
const clone=structuredClone,sha=bytes=>createHash('sha256').update(bytes).digest('hex'),digest=value=>sha(JSON.stringify(value));
const abilityIds=['hp-tank','mp-tank','one-handed-damage'],slots=['weapon','armor','accessory'];
const held=s=>[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];
const ownedBytes=s=>JSON.stringify(held(s).slice().sort((a,b)=>a.id.localeCompare(b.id)));
const record=s=>({level:s.hero.level,wins:s.wins,kills:s.kills,gold:s.hero.gold,fragments:s.soulFragments,seeds:s.worldSeeds,
  inventory:s.inventory.length,pending:s.pendingLoot.length,rng:s.seed,mode:s.mode});
function configuration(s){
  const abilities=game.abilityView(s),protection=game.protectionView(s),supply=game.emergencySupplyView(s);
  return {strategy:s.strategy,targetPriority:game.targetPriorityView(s).policy,
    autoProtection:protection.enabled,protectionUnlocked:protection.unlocked,
    emergencySupply:supply.enabled,emergencySupplyEffective:supply.effective,
    learned:abilities.catalog.filter(a=>a.learned).map(a=>({id:a.id,rank:a.currentRank})),
    slotted:abilities.catalog.filter(a=>a.slotted).map(a=>({id:a.id,rank:a.currentRank}))};
}
function equipHighestScore(s){for(const slot of slots){
  const best=[s.equipment[slot],...s.inventory.filter(item=>item.slot===slot)].reduce((a,b)=>scoreItem(a)>=scoreItem(b)?a:b);
  if(best.id!==s.equipment[slot].id)game.act(s,'equip',best.id);
}}
function expedition(s){
  const before=record(s);game.act(s,'selectStage',1);game.act(s,'start');
  if(s.mode!=='battle')return {outcome:'start-blocked',pulses:0,before,after:record(s)};
  game.act(s,'finishThenCamp',true);let pulses=0;
  while(s.mode==='battle'&&pulses<PROTOCOL.maxPulsesPerFight){game.advance(s,PROTOCOL.pulseSeconds);pulses++;}
  const report=game.expeditionReports(s)[0],outcome=s.mode==='battle'?'censored':report?.outcome??'missing-report';
  const result={outcome,pulses,before,after:record(s),report:report?clone(report):null};
  if(s.mode==='defeat')game.act(s,'retreat');
  return result;
}
function acquire(seed){
  const s=game.createGame(seed),runs=[],trace=createHash('sha256');let status='completed';
  for(let attempt=1;attempt<=PROTOCOL.attemptsPerSeed;attempt++){
    equipHighestScore(s);for(const id of abilityIds){game.act(s,'learnAbility',id);game.act(s,'slotAbility',id);}
    const run=expedition(s);trace.update(JSON.stringify({attempt,run,state:s})+'\n');
    runs.push({attempt,outcome:run.outcome,pulses:run.pulses,seconds:run.report?.elapsed??null});
    if(['censored','start-blocked','missing-report'].includes(run.outcome)){status=run.outcome;break;}
  }
  if(s.mode==='town')equipHighestScore(s);
  return {state:s,summary:{seed,status,attempts:runs.length,wins:runs.filter(r=>r.outcome==='win').length,
    losses:runs.filter(r=>r.outcome!=='win'),pulses:runs.reduce((n,r)=>n+r.pulses,0),
    elapsedSeconds:runs.reduce((n,r)=>n+(r.seconds??0),0),final:record(s),configuration:configuration(s),
    acquisitionTraceSha256:trace.digest('hex'),earnedStateSha256:digest(s),canonicalSaveSha256:digest(game.validateSave(clone(s)))}};
}
function preparePresets(earned){
  const s=game.validateSave(clone(earned)),originalWeapon=s.equipment.weapon.id,choices=[];
  for(const [id,family] of [['a','axe'],['b','rapier'],['c','club']]){
    const item=held(s).find(item=>item.slot==='weapon'&&resolveWeaponFamily(item)===family);
    if(!item){choices.push({id,family,available:false,reason:'Not naturally held after fixed acquisition; no extra runs.'});continue;}
    game.act(s,'equip',item.id);game.act(s,'saveGearSet',id);
    assert.equal(s.gearSets?.[id]?.weapon,item.id);
    choices.push({id,family,available:true,itemId:item.id,name:item.name,quality:item.quality,level:item.level});
  }
  game.act(s,'equip',originalWeapon);assert.equal(s.equipment.weapon.id,originalWeapon);
  return {state:s,choices,preparedSaveSha256:digest(game.validateSave(clone(s)))};
}
const profiles={
  a:{strategy:'balanced',target:'front',protection:false,supply:false,slotted:abilityIds},
  b:{strategy:'assault',target:'caster',protection:true,supply:true,slotted:['hp-tank','one-handed-damage']},
  c:{strategy:'sustain',target:'weakest',protection:false,supply:true,slotted:['hp-tank','mp-tank']}
};
function inspectAndRun(prepared,choice){
  if(!choice.available)return {...choice,tested:false};
  const s=game.validateSave(clone(prepared)),profile=profiles[choice.id];
  game.act(s,'setStrategy',profile.strategy);game.act(s,'targetPriority',profile.target);
  game.act(s,'autoProtection',profile.protection&&game.protectionView(s).unlocked);game.act(s,'setEmergencySupply',profile.supply);
  for(const id of abilityIds)game.act(s,profile.slotted.includes(id)?'slotAbility':'unslotAbility',id);
  const before=clone(s),config=configuration(s),allocation=clone(s.abilities),beforeOwned=ownedBytes(s);
  const preview=game.previewGearSet(s,choice.id);
  assert.deepEqual(s,before,'engine preview cannot change any state field or RNG');
  assert.ok(preview.active||preview.available,preview.reason);
  const expectedIds=clone(s.gearSets[choice.id]),expectedStats=clone(preview.nextStats);
  game.act(s,'applyGearSet',{id:choice.id,quoteBasis:preview.quoteBasis});
  if(preview.active)assert.deepEqual(s,before,'already-current quote is a complete no-op');
  else{
    assert.deepEqual(Object.fromEntries(slots.map(slot=>[slot,s.equipment[slot].id])),expectedIds);
    assert.deepEqual(game.stats(s),expectedStats);
    const expected=clone(before);expected.equipment=clone(s.equipment);expected.inventory=clone(s.inventory);
    expected.hero.hp=expectedStats.maxHp;expected.hero.mp=expectedStats.maxMp;expected.logs=clone(s.logs);
    assert.deepEqual(s,expected,'successful gear-only apply changes only equipment locations, camp recovery and existing log');
  }
  assert.deepEqual(configuration(s),config);assert.deepEqual(s.abilities,allocation);
  assert.equal(ownedBytes(s),beforeOwned,'all owned item bytes and identity remain unchanged');assert.equal(s.seed,before.seed);
  const appliedStateSha256=digest(s),run=expedition(s);
  if(run.report){
    assert.equal(run.report.strategy,config.strategy);
    assert.equal(run.report.build.targetPriority,config.targetPriority);
    assert.equal(run.report.build.autoProtection,config.autoProtection);
    assert.equal(run.report.build.emergencySupply===true,config.emergencySupply);
    assert.deepEqual(run.report.build.abilities.slice().sort((a,b)=>a.id.localeCompare(b.id)),config.slotted.slice().sort((a,b)=>a.id.localeCompare(b.id)));
    assert.deepEqual(Object.fromEntries(run.report.build.equipment.map(item=>[item.slot,item.id])),expectedIds);
  }
  assert.deepEqual(configuration(s),config,'source expedition retains policies and allocation');
  return {...choice,tested:true,requestedProfile:profile,actualConfiguration:config,
    protectionRequestResult:profile.protection?(config.protectionUnlocked?'enabled':'locked; kept OFF'):'OFF requested',
    preview:{active:preview.active,applied:!preview.active,currentStats:preview.currentStats,nextStats:preview.nextStats,
      currentEquipment:preview.items.map(row=>({slot:row.slot,id:row.current.id})),targetEquipment:expectedIds},
    beforeStateSha256:digest(before),appliedStateSha256,
    checks:{previewFullStateAndRngUnchanged:true,gearOnlyApply:true,allOwnedBytesRetained:true,currentPoliciesAndRanksRetained:true,
      actualStartReportMatches:!!run.report},
    expedition:{outcome:run.outcome,pulses:run.pulses,seconds:run.report?.elapsed??null,before:run.before,after:run.after,
      startBuild:run.report?.build??null,reportSha256:run.report?digest(run.report):null}};
}
export function measure(){
  const rows=PROTOCOL.seeds.map(seed=>{
    const earned=acquire(seed);
    if(earned.state.mode!=='town')return {acquisition:earned.summary,presetsSkipped:'Acquisition did not return to camp.'};
    const prepared=preparePresets(earned.state);
    return {acquisition:earned.summary,preparedSaveSha256:prepared.preparedSaveSha256,branches:prepared.choices.map(choice=>inspectAndRun(prepared.state,choice))};
  });
  return {kind:'v0.29 earned source-engine preset-context measurement; not browser or UI-cancel acceptance',protocol:PROTOCOL,baseline:BASELINE,rows};
}
async function main(){
  const args=process.argv.slice(2),at=args.indexOf('--output');
  const output=resolve(at<0?fileURLToPath(new URL('../docs/measurements/gear-set-context-v029.json',import.meta.url)):args[at+1]);
  const inputs=async()=>Object.fromEntries(await Promise.all([...Object.keys(BASELINE.sha256),'scripts/gear-set-context-measurement.mjs'].map(async path=>[path,sha(await readFile(new URL('../'+path,import.meta.url)))])));
  const before=await inputs();for(const [path,expected] of Object.entries(BASELINE.sha256))assert.equal(before[path],expected,`${path} must retain exact v028 bytes`);
  const result=measure();result.inputSha256=before;assert.deepEqual(await inputs(),before,'measurement inputs stay frozen');
  await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({output,bytes:(await readFile(output)).length,sha256:sha(await readFile(output)),rows:result.rows.map(row=>({seed:row.acquisition.seed,
    attempts:row.acquisition.attempts,wins:row.acquisition.wins,level:row.acquisition.final.level,
    branches:row.branches?.map(branch=>({family:branch.family,tested:branch.tested,applied:branch.preview?.applied,
      outcome:branch.expedition?.outcome,protection:branch.protectionRequestResult}))}))},null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
