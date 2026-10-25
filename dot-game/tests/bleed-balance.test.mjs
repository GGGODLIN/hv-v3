import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame, act, advance, stats, previewWeaponCommission, bleedStatus, validateSave} from '../src/engine.js';
import {scoreItem, resolveWeaponFamily} from '../src/loot.js';

const clone = value => JSON.parse(JSON.stringify(value));
const count = process.env.BLEED_SEEDS === undefined ? 5 : Number(process.env.BLEED_SEEDS);
assert.ok(Number.isInteger(count) && count >= 1 && count <= 100, 'BLEED_SEEDS must be 1..100');
const SEEDS = process.env.BLEED_SEEDS === undefined ? [1, 7, 42, 73, 100] : Array.from({length:count}, (_, index) => index + 1);
const round = value => Number(value.toFixed(2));
const median = values => {
  if (!values.length) return null;
  const sorted = [...values].sort((a,b) => a-b), middle = Math.floor(sorted.length/2);
  return round(sorted.length%2 ? sorted[middle] : (sorted[middle-1]+sorted[middle])/2);
};
const distribution = values => values.length ? {min:round(Math.min(...values)),median:median(values),max:round(Math.max(...values))} : null;

// Predeclared before measurement in BLEED-GUIDE.md. All equipment is earned:
// no generated bench items, stat edits, sales, manual potions or injected gold.
function equipEarned(s, slots = ['weapon','armor','accessory']) {
  assert.equal(s.mode, 'town');
  for (const slot of slots) {
    const best = [s.equipment[slot], ...s.inventory.filter(item => item.slot === slot)]
      .reduce((best,item) => scoreItem(item) > scoreItem(best) ? item : best);
    if (best.id !== s.equipment[slot].id) act(s, 'equip', best.id);
  }
}

// Only reads combat events and observes production writes. Capture pre-clear
// resources, not win()'s full heal; retain ordinary level-up/between-wave heals.
function expedition(s) {
  const initialWins = s.wins;
  act(s, 'start');
  if (s.mode !== 'battle') return {win:false,refused:true,timeout:false,seconds:0};
  const hero = s.hero;
  let wins=s.wins, hp=hero.hp, mp=hero.mp, seed=s.seed, rngCalls=0;
  let minimumHp=hp, minimumMp=mp, beforeWin=null, incomingDamage=0, incomingAttempts=0;
  let lastEvent=s._eventId, bleedProcs=0, bleedTicks=0, bleedDamage=0, maximumStacks=0;
  let bossStartTick=null, bossStartSeconds=null, bossTicks=null, bossSeconds=null, bossRole=null, bossBleedTicks=0, bossBleedDamage=0;
  const knownEnemies=new Map(), roleDamage={baseline:0,armored:0,agile:0};
  Object.defineProperty(s,'wins',{enumerable:true,configurable:true,
    get:()=>wins,set:value=>{if(value>wins)beforeWin={hp:hero.hp,mp:hero.mp};wins=value;}});
  Object.defineProperty(hero,'hp',{enumerable:true,configurable:true,
    get:()=>hp,set:value=>{hp=value;if(wins===initialWins)minimumHp=Math.min(minimumHp,value);}});
  Object.defineProperty(hero,'mp',{enumerable:true,configurable:true,
    get:()=>mp,set:value=>{mp=value;if(wins===initialWins)minimumMp=Math.min(minimumMp,value);}});
  Object.defineProperty(s,'seed',{enumerable:true,configurable:true,
    get:()=>seed,set:value=>{seed=value;rngCalls++;}});
  for(let step=0;step<6000&&s.mode==='battle'&&wins===initialWins;step++) {
    for(const enemy of s.enemies) {
      knownEnemies.set(enemy.id,enemy);
      if(enemy.boss&&bossStartTick===null) {bossStartTick=s.timing.ticks;bossStartSeconds=s.battle.elapsed;bossRole=enemy.roleId;}
      maximumStacks=Math.max(maximumStacks,bleedStatus(enemy,s.timing.ticks)?.stacks||0);
    }
    advance(s,.1);
    for(const event of s.events.filter(event=>event.id>lastEvent)) {
      if(event.target==='hero'&&['hit','miss','block'].includes(event.type)) {
        incomingDamage+=event.value||0;incomingAttempts++;
      }
      if(event.type==='proc'&&event.effect==='bleed') {bleedProcs++;maximumStacks=Math.max(maximumStacks,event.value||0);}
      if(event.type==='bleed'&&event.effect==='bleed') {
        bleedTicks++;bleedDamage+=event.value;
        const enemy=knownEnemies.get(event.target);
        assert.ok(enemy,'every bleed pulse belongs to a naturally spawned enemy');
        roleDamage[enemy.roleId]+=event.value;
        if(enemy.boss) {bossBleedTicks++;bossBleedDamage+=event.value;}
      }
      lastEvent=event.id;
    }
    if(bossStartTick!==null) {bossTicks=s.timing.ticks-bossStartTick;bossSeconds=s.battle.elapsed-bossStartSeconds;}
  }
  for(const [object,key,value] of [[s,'wins',wins],[s,'seed',seed],[hero,'hp',hp],[hero,'mp',mp]]) {
    Object.defineProperty(object,key,{value,enumerable:true,configurable:true,writable:true});
  }
  return {win:wins===initialWins+1,refused:false,timeout:wins===initialWins&&s.mode==='battle',
    seconds:round(s.battle.elapsed),hpBeforeWin:beforeWin?round(beforeWin.hp):null,
    mpBeforeWin:beforeWin?round(beforeWin.mp):null,minimumHp:round(minimumHp),minimumMp:round(minimumMp),
    incomingDamage,incomingAttempts,actions:clone(s.battle.actions),rngCalls,finalSeed:seed,
    bleedProcs,bleedTicks,bleedDamage,maximumStacks,roleDamage,
    bossTicks,bossSeconds:bossSeconds===null?null:round(bossSeconds),bossRole,bossBleedTicks,bossBleedDamage};
}

function paired(start) {
  assert.equal(resolveWeaponFamily(start.equipment.weapon),'axe');
  const active=clone(start), control=clone(start), untouched=clone(start);
  // Explicit null suppresses legacy-name inference. This is the only mutation
  // of the control: identical genuinely earned axe stats, not a weaker weapon.
  control.equipment.weapon.weaponFamily=null;
  assert.equal(resolveWeaponFamily(control.equipment.weapon),null);
  assert.deepEqual(stats(active),stats(control));
  const controlWithoutTreatment=clone(control);
  controlWithoutTreatment.equipment.weapon.weaponFamily=start.equipment.weapon.weaponFamily;
  assert.deepEqual(controlWithoutTreatment,start);
  const before=expedition(control), after=expedition(active);
  assert.deepEqual(start,untouched,'comparison does not mutate the natural starting checkpoint');
  assert.equal(before.bleedTicks,0);assert.equal(before.bleedProcs,0);
  return {stage:start.stage,level:start.hero.level,initialSeed:start.seed,clears:start.wins,
    attack:stats(start).attack,weapon:clone(start.equipment.weapon),before,after,state:active};
}

function ordinaryRoute(seed) {
  let s=createGame(seed);
  const results=[], pairs=[];
  for(let stage=1;stage<=5;stage++) {
    equipEarned(s);act(s,'selectStage',stage);
    assert.equal(s.stage,stage,'no manufactured stage unlock');
    assert.equal(s.strategy,'balanced');assert.equal(s.autoAdvance,false);assert.notEqual(s.autoSell,true);
    if(resolveWeaponFamily(s.equipment.weapon)==='axe') {
      const pair=paired(s);s=pair.state;delete pair.state;pairs.push(pair);results.push({stage,...pair.after});
    } else results.push({stage,...expedition(s)});
    if(!results.at(-1).win)break;
    act(s,'retreat');
  }
  return {seed,results,pairs,endState:clone(s)};
}

function commissionRoute(seed, stopBeforeStage = 11) {
  let s=createGame(seed), combatSeconds=0, purchase=null;
  const farm=[],pairs=[];
  for(let clear=1;clear<=20;clear++) {
    assert.equal(s.stage,1);assert.equal(s.strategy,'balanced');assert.equal(s.autoAdvance,false);assert.notEqual(s.autoSell,true);
    const result=expedition(s);farm.push(result);combatSeconds+=result.seconds;
    if(!result.win)break;
    act(s,'retreat');equipEarned(s);
    const untouched=clone(s),offer=previewWeaponCommission(s,'axe');
    assert.deepEqual(s,untouched,'preview never changes earned resources or RNG');
    if(!offer.available)continue;
    purchase={clears:s.wins,combatSeconds:round(combatSeconds),level:s.hero.level,gold:s.hero.gold,
      price:offer.price,goldAfter:offer.goldAfter,weapon:clone(offer.item),initialSeed:s.seed};
    act(s,'commissionWeapon',{family:'axe',quoteBasis:offer.quoteBasis});
    assert.deepEqual(s.inventory.at(-1),offer.item);
    assert.equal(s.hero.gold,untouched.hero.gold-offer.price);assert.equal(s.seed,untouched.seed);
    act(s,'equip',offer.item.id);
    assert.deepEqual(s.equipment.weapon,offer.item);assert.equal(s.seed,untouched.seed);
    break;
  }
  if(purchase)for(let stage=1;stage<=10;stage++) {
    equipEarned(s,['armor','accessory']);act(s,'selectStage',stage);
    assert.equal(s.stage,stage,'every next stage must be earned, never injected');
    assert.deepEqual(s.equipment.weapon,purchase.weapon,'held axe is never silently replaced');
    if(stage===stopBeforeStage)break; // Reusable natural camp witness, not an outcome-selected pair.
    const pair=paired(s);
    pair.higherScoreEarnedWeapons=s.inventory.filter(item=>item.slot==='weapon'&&scoreItem(item)>scoreItem(s.equipment.weapon)).length;
    s=pair.state;delete pair.state;pairs.push(pair);
    if(!pair.after.win)break;
    act(s,'retreat');
  }
  return {seed,farm,purchase,pairs,endState:clone(s)};
}

function resultSummary(results) {
  const wins=results.filter(result=>result.win);
  return {n:results.length,wins:wins.length,failures:results.filter(result=>!result.win&&!result.refused&&!result.timeout).length,
    refused:results.filter(result=>result.refused).length,timeouts:results.filter(result=>result.timeout).length,
    seconds:distribution(wins.map(result=>result.seconds)),minimumHp:distribution(results.map(result=>result.minimumHp).filter(Number.isFinite)),
    hpBeforeWin:median(wins.map(result=>result.hpBeforeWin)),mpBeforeWin:median(wins.map(result=>result.mpBeforeWin)),
    incomingDamage:median(results.map(result=>result.incomingDamage).filter(Number.isFinite)),
    manaSpent:median(results.map(result=>result.actions?.manaSpent).filter(Number.isFinite)),
    withBleedProcs:results.filter(result=>result.bleedProcs>0).length,withBleedTicks:results.filter(result=>result.bleedTicks>0).length,
    bleedDamage:distribution(results.map(result=>result.bleedDamage).filter(Number.isFinite)),
    bleedTicks:distribution(results.map(result=>result.bleedTicks).filter(Number.isFinite)),
    bleedDamageByRole:Object.fromEntries(['baseline','armored','agile'].map(role=>[role,results.reduce((sum,result)=>sum+(result.roleDamage?.[role]||0),0)])),
    maximumStacks:Math.max(0,...results.map(result=>result.maximumStacks||0)),
    bossSeconds:distribution(results.map(result=>result.bossSeconds).filter(Number.isFinite)),
    longBosses:results.filter(result=>result.bossTicks>=7).length,
    longBossesWithBleed:results.filter(result=>result.bossTicks>=7&&result.bossBleedTicks>0).length};
}

function pairSummary(pairs) {
  const mutual=pairs.filter(pair=>pair.before.win&&pair.after.win);
  const delta=(key,sign)=>mutual.filter(pair=>Math.sign(pair.after[key]-pair.before[key])===sign).length;
  return {n:pairs.length,mutualWins:mutual.length,realOnlyWins:pairs.filter(p=>p.after.win&&!p.before.win).length,
    neutralOnlyWins:pairs.filter(p=>p.before.win&&!p.after.win).length,bothFail:pairs.filter(p=>!p.before.win&&!p.after.win).length,
    faster:delta('seconds',-1),equal:delta('seconds',0),slower:delta('seconds',1),
    minimumHp:{higher:delta('minimumHp',1),equal:delta('minimumHp',0),lower:delta('minimumHp',-1)},
    hpBeforeWin:{higher:delta('hpBeforeWin',1),equal:delta('hpBeforeWin',0),lower:delta('hpBeforeWin',-1)},
    improvedSpeedOrHp:mutual.filter(p=>p.after.seconds<p.before.seconds||p.after.minimumHp>p.before.minimumHp||p.after.hpBeforeWin>p.before.hpBeforeWin).length,
    divergedRng:pairs.filter(p=>p.before.finalSeed!==p.after.finalSeed).length,
    neutral:resultSummary(pairs.map(p=>p.before)),real:resultSummary(pairs.map(p=>p.after))};
}

const ordinary=SEEDS.map(seed=>ordinaryRoute(seed)), commissioned=SEEDS.map(seed=>commissionRoute(seed));

test('bleed balance: observation leaves complete production state and RNG unchanged',()=>{
  for(const run of commissioned.slice(0,3)) {
    const starting=clone(run.endState);act(starting,'retreat');act(starting,'selectStage',Math.min(5,starting.unlocked));
    const observed=clone(starting),unobserved=clone(starting),initialWins=starting.wins;
    const result=expedition(observed);act(unobserved,'start');
    for(let step=0;step<6000&&unobserved.mode==='battle'&&unobserved.wins===initialWins;step++)advance(unobserved,.1);
    assert.deepEqual(observed,unobserved,'accessors/event reads are observation-only, including active bleed');
    assert.equal(result.timeout,false);
    if(result.win)assert.ok(result.hpBeforeWin<=observed.hero.hp);
  }
});

test('bleed balance: random-loot natural stages 1–5 retain accessibility, with all axe outcomes reported',t=>{
  for(let stage=1;stage<=5;stage++) {
    const results=ordinary.flatMap(run=>run.results.filter(result=>result.stage===stage));
    const pairs=ordinary.flatMap(run=>run.pairs.filter(pair=>pair.stage===stage));
    t.diagnostic(JSON.stringify({kind:'bleed-random-loot',stage,seeds:SEEDS,natural:resultSummary(results),axePairs:pairSummary(pairs)}));
    assert.equal(results.length,SEEDS.length,'every seed reaches the early stage');
    assert.ok(results.every(result=>result.win),'fixed natural policy has no early survival cliff');
  }
});

test('bleed balance: first-affordable naturally paid axe is measured through longer encounters without hiding failure',t=>{
  const purchases=commissioned.map(run=>run.purchase).filter(Boolean);
  t.diagnostic(JSON.stringify({kind:'bleed-affordability',seeds:SEEDS,n:commissioned.length,affordable:purchases.length,
    clears:distribution(purchases.map(p=>p.clears)),combatSeconds:distribution(purchases.map(p=>p.combatSeconds)),
    price:distribution(purchases.map(p=>p.price)),goldAfter:distribution(purchases.map(p=>p.goldAfter)),
    farmFailures:commissioned.filter(run=>run.farm.some(result=>!result.win)).length}));
  assert.equal(purchases.length,SEEDS.length,'first affordable commission must be naturally reachable on the fixed early route');
  for(let stage=1;stage<=10;stage++) {
    const pairs=commissioned.flatMap(run=>run.pairs.filter(pair=>pair.stage===stage));
    const expectedStarts=stage===1?purchases.length:commissioned.filter(run=>run.pairs.some(pair=>pair.stage===stage-1&&pair.after.win)).length;
    assert.equal(pairs.length,expectedStarts,'every prior natural win continues; no silently truncated or excluded seed');
    t.diagnostic(JSON.stringify({kind:'bleed-paid-axe',stage,...pairSummary(pairs),
      higherScoreEarnedWeaponStarts:pairs.filter(pair=>pair.higherScoreEarnedWeapons>0).length}));
    assert.ok(pairs.every(pair=>!pair.before.timeout&&!pair.after.timeout),'600s bound is a failure, not a removed sample');
    assert.ok(pairs.every(pair=>pair.after.maximumStacks<=5));
  }
  const firstLong=commissioned.flatMap(run=>run.pairs.map(pair=>({seed:run.seed,purchase:run.purchase,...pair})))
    .find(pair=>pair.after.bossTicks>=7&&pair.after.bossBleedTicks>0);
  t.diagnostic(JSON.stringify({kind:'bleed-first-natural-long-witness',witness:firstLong||null}));
  const firstArmoredLong=commissioned.flatMap(run=>run.pairs.map(pair=>({seed:run.seed,purchase:run.purchase,...pair})))
    .find(pair=>pair.after.bossRole==='armored'&&pair.after.bossTicks>=7&&pair.after.bossBleedTicks>0);
  t.diagnostic(JSON.stringify({kind:'bleed-first-natural-long-armored-witness',witness:firstArmoredLong||null}));
  // Existence is a release-evidence check, not a per-seed promise of improvement.
  assert.ok(firstLong,'a naturally reached seven-tick boss must actually exercise bleed, otherwise report the missing slice');
});

test('bleed balance: predeclared routes and identical-dt paired outcomes replay deterministically',()=>{
  assert.deepEqual(ordinaryRoute(SEEDS[0]),ordinary[0]);
  assert.deepEqual(commissionRoute(SEEDS[0]),commissioned[0]);
});

test('bleed balance: naturally earned seed-1 stage-9 camp survives normal import and still exercises bleed',t=>{
  const earned=commissionRoute(1,9).endState, loaded=validateSave(clone(earned));
  assert.equal(earned.stage,9);assert.equal(earned.mode,'town');
  assert.equal(loaded.hero.gold,earned.hero.gold);assert.equal(loaded.wins,earned.wins);
  assert.equal(loaded.unlocked,earned.unlocked);assert.equal(loaded.seed,earned.seed);
  assert.deepEqual(stats(loaded),stats(earned));assert.deepEqual(loaded.equipment.weapon,earned.equipment.weapon);
  assert.deepEqual(loaded.timing,{turns:0,ticks:0,tu:0},'normal import resets timing; this is not full-state invariance');
  const imported=expedition(loaded);
  assert.equal(imported.win,true);assert.ok(imported.bleedTicks>0);assert.ok(imported.bossBleedTicks>0);
  t.diagnostic(JSON.stringify({kind:'bleed-natural-import-witness',seed:1,stage:9,earnedSeed:earned.seed,
    level:earned.hero.level,gold:earned.hero.gold,clears:earned.wins,imported}));
});
