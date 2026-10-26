/** Natural, deterministic engine-earned cohort. No synthetic stat/seed changes. */
import assert from 'node:assert/strict';
import * as game from '../src/engine.js';
import {scoreItem} from '../src/loot.js';
const copy=structuredClone;
function equipBest(s){for(const slot of ['weapon','armor','accessory']){const best=[s.equipment[slot],...s.inventory.filter(i=>i.slot===slot)].reduce((a,b)=>scoreItem(a)>=scoreItem(b)?a:b);if(best.id!==s.equipment[slot].id)game.act(s,'equip',best.id);}}
function run(s,stage){
 game.act(s,'selectStage',stage);assert.equal(s.stage,stage);
 const wins=s.wins;game.act(s,'start');assert.equal(s.mode,'battle');
 let steps=0,magicCasts=0,lastEvent=s._eventId,targetChanges=0,lastTarget=null;
 while(s.mode==='battle'&&s.wins===wins&&steps++<4000){
  const target=game.targetPriorityView(s).targetId;if(target&&lastTarget&&target!==lastTarget)targetChanges++;if(target)lastTarget=target;
  game.advance(s,.1);magicCasts+=s.events.filter(e=>e.id>lastEvent&&e.type==='cast'&&e.effect==='magic').length;lastEvent=s._eventId;
 }
 assert.ok(steps<4000,'bounded run settled');const r=game.expeditionReports(s)[0];assert.ok(r);game.act(s,'retreat');
 return {outcome:r.outcome,seconds:Number(r.elapsed.toFixed(2)),hpLost:r.survival.hpLost,minHpPercent:r.survival.minHpPercent,counters:r.actions.counters??0,manaSpent:r.actions.manaSpent,magicCasts,targetChanges};
}
const rows=[],acquisition=[];
for(let seed=1;seed<=20;seed++){
 const earned=game.createGame(seed);let previousFailed=false;
 for(let i=0;i<25&&(i<12||earned.unlocked<9);i++){
  equipBest(earned);
  if(earned.hero.level>=4&&!earned.abilities)for(const id of ['hp-tank','mp-tank','one-handed-damage']){game.act(earned,'learnAbility',id);game.act(earned,'slotAbility',id);}
  if(earned.inventory.length>100)game.act(earned,'sellCommon');
  const stage=Math.max(1,Math.min(8,earned.unlocked)-(previousFailed?1:0)),result=run(earned,stage);
  acquisition.push({seed,stage,...result});previousFailed=result.outcome!=='win';
 }
 assert.ok(earned.unlocked>=9,`seed ${seed} naturally unlocked route8+`);equipBest(earned);
 for(const [family,suffix]of [['axe','slaughter'],['club','slaughter'],['rapier','nimble']]){
  const equipped=copy(earned),offer=game.previewWeaponCommission(equipped,family,suffix);assert.equal(offer.available,true);
  game.act(equipped,'commissionWeapon',{family,suffix,quoteBasis:offer.quoteBasis});game.act(equipped,'equip',offer.item.id);assert.equal(equipped.equipment.weapon.id,offer.item.id);
  for(const stage of [5,6,7,8]){
   const outcomes={};for(const policy of ['front','caster','weakest']){const s=copy(equipped);game.act(s,'targetPriority',policy);assert.equal(game.targetPriorityView(s).policy,policy);outcomes[policy]=run(s,stage);}
   rows.push({seed,family,suffix,level:equipped.hero.level,stage,initialSeed:equipped.seed,weaponId:equipped.equipment.weapon.id,...outcomes});
  }
 }
}
const summary={};
for(const policy of ['caster','weakest']){
 const compare=(subset,key)=>({lower:subset.filter(r=>r[policy][key]<r.front[key]).length,equal:subset.filter(r=>r[policy][key]===r.front[key]).length,higher:subset.filter(r=>r[policy][key]>r.front[key]).length});
 summary[policy]={trials:rows.length,wins:rows.filter(r=>r[policy].outcome==='win').length,hpLost:compare(rows,'hpLost'),seconds:compare(rows,'seconds'),magicCasts:compare(rows,'magicCasts'),stages:Object.fromEntries([5,6,7,8].map(stage=>{const subset=rows.filter(r=>r.stage===stage);return [stage,{trials:subset.length,hpLost:compare(subset,'hpLost'),seconds:compare(subset,'seconds'),magicCasts:compare(subset,'magicCasts')}]}))};
}
console.log(JSON.stringify({kind:'v0.21 natural engine-earned, not browser-earned; identical initial saved state and RNG per triple; no tuning',acquisitionRuns:acquisition.length,acquisitionDefeats:acquisition.filter(r=>r.outcome!=='win').length,frontWins:rows.filter(r=>r.front.outcome==='win').length,summary,rows},null,2));
