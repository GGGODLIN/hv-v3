import { legacyState, legacyEnvelope } from './helpers/soulbind-compat.mjs';
import * as historicalV012 from './fixtures/v0.12/engine.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import * as accepted from './fixtures/v0.8.1/engine.js';
import * as current from '../src/engine.js';
import {scoreItem} from '../src/loot.js';

const clone=value=>structuredClone(value);
const ids=['hp-tank','mp-tank','one-handed-damage'];
const costs={'hp-tank':1,'mp-tank':1,'one-handed-damage':2};
const actions=['learnAbility','slotAbility','unslotAbility','refundAbility'];
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const sha=value=>createHash('sha256').update(value).digest('hex');
function fixture(level=4) {
  const raw=current.createGame(42);raw.hero.level=level;raw.hero.gold=731;raw.hero.proficiency=2.75;
  return current.validateSave(raw);
}
function allocate(s,chosen=ids) {
  for(const id of chosen){current.act(s,'learnAbility',id);current.act(s,'slotAbility',id);}
  return s;
}
function ledger(s) {
  const view=current.abilityView(s),spent=(s.abilities?.learned||[]).reduce((n,id)=>n+costs[id],0);
  assert.equal(view.earnedAp,s.hero.level);assert.equal(view.spentAp,spent);
  assert.equal(view.availableAp,s.hero.level-spent);assert.equal(view.majorCapacity,5);
  assert.equal(view.majorUsed,s.abilities?.slotted.length||0);return view;
}
function oracle(s,active=[]) {
  const h=s.hero,a=h.attributes,sum=key=>Object.values(s.equipment).reduce((n,item)=>n+(item.stats[key]||0),0);
  const baseHp=500+10*h.level+6*a.end,baseMp=10+h.level+a.wis;
  const attack=Math.max(1,Math.log(3330+2*a.str+a.dex)/Math.log(1.0003)-27029.81)+sum('attack');
  return {...accepted.stats(s),parry:Math.min(.5,Math.max(0,.035+sum('parry')/100)),
    maxHp:Math.round((active.includes('hp-tank')?Math.floor(baseHp*11/10):baseHp)+sum('hp')),
    maxMp:active.includes('mp-tank')?Math.floor(baseMp*11/10):Math.round(baseMp),
    attack:Math.round((attack+(active.includes('one-handed-damage')?2*Math.max(0,Math.min(h.proficiency,1.2*h.level)):0))*100)/100};
}
const target=()=>({id:'ability-oracle',name:'Independent ability target',hp:1e7,maxHp:1e7,attack:0,defense:0,evade:0,parry:0,block:0,boss:true});
function live(chosen=ids) {
  const s=allocate(fixture(),chosen);current.act(s,'start');s.enemies=[target()];s._enemyClock=-100;return s;
}
function firstTurn(s) {s._clock=1.04;current.advance(s,.02);assert.equal(s.battle.actions.attacks,1);}
function rng(seed) {return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

// Original equations and accepted rank-zero gameplay are separate oracles. The
// frozen engine is own v0.8.1 source, not falsely identified as a v0.9 copy.
test('v0.10 independent: accepted baseline/historical loot and current session retain exact original digests',()=>{
  for(const [path,digest] of [
    ['./fixtures/v0.8.1/engine.js','9ae2378a4818ab92d9e4813ca89e2bed5c4af7f5de5acee01e29575dfeacfa6a'],
    ['./fixtures/v0.8.1/loot.js','458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc'],
    ['./fixtures/v0.14/loot.js','458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc'],
    ['../src/session.js','821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a'],
  ])assert.equal(sha(readFileSync(new URL(path,import.meta.url))),digest,path);
  assert.equal(current.VERSION,3);
});

test('v0.10 independent: rank-one source equations floor bases, exclude flat gear HP, cap proficiency and require both learning and slotting',()=>{
  for(const level of [1,2,4,17,500])for(const proficiency of [0,1.25,1.2*level,1e6]) {
    const s=fixture(level);s.hero.proficiency=proficiency;s.equipment.armor.stats.hp=12.5;s.equipment.accessory.stats.hp=5.25;
    assert.deepEqual(current.stats(s),oracle(s));
    for(const id of ids.filter(id=>costs[id]<=level)) {
      const branch=clone(s);current.act(branch,'learnAbility',id);
      assert.deepEqual(current.stats(branch),oracle(branch),`${id} learned but not slotted`);
      current.act(branch,'slotAbility',id);assert.deepEqual(current.stats(branch),oracle(branch,[id]));
      current.act(branch,'unslotAbility',id);assert.deepEqual(current.stats(branch),oracle(branch));
    }
    if(level>=4){allocate(s);assert.deepEqual(current.stats(s),oracle(s,ids));}
  }
  // Exact rational oracle detects an integer-boundary loss from binary 1.1.
  for(let level=1;level<=500;level++)for(const id of ['hp-tank','mp-tank']) {
    const s=allocate(fixture(level),[id]);assert.deepEqual(current.stats(s),oracle(s,[id]),`exact Tank floor at level ${level}`);
  }
  const initial=current.createGame(42);assert.equal(ledger(initial).availableAp,1);
  assert.deepEqual(current.MAJOR_ABILITIES.map(({id,rank,apCost})=>({id,rank,apCost})),ids.map(id=>({id,rank:1,apCost:costs[id]})));
});

test('v0.10 independent: camp AP is conserved across repeated learn, slot, refund, gear changes, no-ops and repeated imports',()=>{
  let s=fixture(),gold=s.hero.gold,seed=s.seed;
  s.inventory.push({...clone(s.equipment.armor),id:'alternative-armor',stats:{defense:3,hp:25}});
  for(let repeat=0;repeat<8;repeat++) {
    for(const id of ids) {
      current.act(s,'learnAbility',id);ledger(s);const learned=clone(s);
      current.act(s,'learnAbility',id);assert.deepEqual(s,learned);
      current.act(s,'slotAbility',id);ledger(s);const slotted=clone(s);
      current.act(s,'slotAbility',id);assert.deepEqual(s,slotted);
    }
    assert.equal(ledger(s).availableAp,0);assert.equal(s.hero.gold,gold);assert.equal(s.seed,seed);
    current.act(s,'equip',s.inventory[0].id);ledger(s);assert.deepEqual(current.stats(s),oracle(s,ids));
    for(let imported=0;imported<3;imported++){s=current.validateSave(JSON.parse(JSON.stringify(s)));assert.equal(ledger(s).availableAp,0);}
    for(const id of ids) {
      current.act(s,'unslotAbility',id);assert.equal(ledger(s).spentAp,4);
      const unslotted=clone(s);current.act(s,'unslotAbility',id);assert.deepEqual(s,unslotted);
    }
    assert.deepEqual(current.stats(s),oracle(s));
    for(const id of ids) {
      current.act(s,'refundAbility',id);ledger(s);const refunded=clone(s);
      current.act(s,'refundAbility',id);assert.deepEqual(s,refunded);
    }
    assert.equal(Object.hasOwn(s,'abilities'),false);assert.equal(ledger(s).availableAp,4);
    assert.equal(s.hero.gold,gold);assert.equal(s.seed,seed);
  }
  const one=current.createGame(42),before=clone(one);current.act(one,'learnAbility','one-handed-damage');assert.deepEqual(one,before);
});

test('v0.10 independent: all allocation mutations refuse battle, intermission, defeat, invalid IDs and unaffordable/no-op paths without healing or RNG',()=>{
  for(const [mode,phase] of [['battle','fight'],['battle','intermission'],['defeat','idle']]) {
    const s=allocate(fixture());s.mode=mode;s._phase=phase;s.hero.hp=3;s.hero.mp=0;
    const before=clone(s);for(const action of actions)for(const id of ids)current.act(s,action,id);
    assert.deepEqual(s,before);assert.ok(current.abilityView(s).catalog.every(row=>!row.canLearn&&!row.canSlot&&!row.canUnslot&&!row.canRefund));
  }
  const s=fixture();s.hero.hp=3;s.hero.mp=0;const before=clone(s);
  for(const action of actions)for(const invalid of [undefined,null,{},[],1,true,'constructor','__proto__','HP Tank',{id:'hp-tank'}])current.act(s,action,invalid);
  for(const action of ['slotAbility','unslotAbility','refundAbility'])for(const id of ids)current.act(s,action,id);
  assert.deepEqual(s,before);
});

test('v0.10 independent: optional save allocation is strict, failure leaves input untouched, legacy omission stays omitted and old validators reject v2 and historical v1 validators safely drop allocation',()=>{
  const malformed=[undefined,null,false,0,'hp-tank',[],{},
    {learned:[],slotted:[],ap:999},{learned:['missing'],slotted:[]},
    {learned:['hp-tank','hp-tank'],slotted:[]},{learned:['hp-tank'],slotted:['hp-tank','hp-tank']},
    {learned:[],slotted:['hp-tank']},{learned:['hp-tank'],slotted:['mp-tank']},
    {learned:{'0':'hp-tank'},slotted:[]},{learned:['hp-tank'],slotted:null},
    {learned:['hp-tank'],slotted:[],ranks:{'hp-tank':2}}];
  for(const allocation of malformed) {
    const raw=fixture();raw.abilities=allocation;const before=clone(raw);
    assert.throws(()=>current.validateSave(raw));assert.equal(current.abilityView(raw).valid,false);
    assert.deepEqual(current.stats(raw),oracle(raw));assert.deepEqual(raw,before);
  }
  const overBudget=current.createGame(42);overBudget.abilities={learned:['one-handed-damage'],slotted:[]};assert.throws(()=>current.validateSave(overBudget));
  const sparse=fixture();sparse.abilities={learned:new Array(1),slotted:[]};assert.throws(()=>current.validateSave(sparse));
  const extra=fixture();extra.abilities={learned:[],slotted:[]};extra.abilities.learned.ap=999;assert.throws(()=>current.validateSave(extra));
  let invoked=0;const accessor=fixture();Object.defineProperty(accessor,'abilities',{enumerable:true,get(){invoked++;return {learned:[],slotted:[]};}});
  assert.throws(()=>current.validateSave(accessor));assert.equal(invoked,0);
  for(const level of [1,4,500]) {
    const raw=fixture(level),before=clone(raw),restored=current.validateSave(raw);
    assert.throws(()=>accepted.validateSave(raw),/不支援/);assert.deepEqual(legacyState(restored),accepted.validateSave(legacyEnvelope(raw)));assert.deepEqual(raw,before);
    assert.equal(Object.hasOwn(restored,'abilities'),false);assert.deepEqual(current.stats(restored),{...accepted.stats(restored),parry:.035});
  }
  const allocated=allocate(fixture()),before=clone(allocated),old=accepted.validateSave(legacyEnvelope(allocated));
  assert.equal(Object.hasOwn(old,'abilities'),false);assert.equal(old.hero.gold,allocated.hero.gold);
  assert.deepEqual(old.equipment,allocated.equipment);assert.deepEqual(old.inventory,allocated.inventory);
  const returned=current.validateSave(old);assert.equal(ledger(returned).availableAp,returned.hero.level);
  assert.deepEqual(current.stats(returned),{...accepted.stats(returned),parry:.035});assert.deepEqual(allocated,before);
});

test('v0.10 independent: preview reads are detached, side-effect free and cannot grant abilities/AP or settle combat',()=>{
  for(const s of [fixture(),allocate(fixture()),live()]) {
    const before=clone(s),expected=clone(current.abilityView(s));
    for(let n=0;n<5;n++) {
      const view=current.abilityView(s);view.learned.push('forged');view.slotted.length=0;
      view.effects.attackBonus=999;view.currentStats.attack=999;
      for(const row of view.catalog){row.previewStats.attack=999;row.previewEffects.attackBonus=999;row.apCost=0;}
      assert.deepEqual(current.abilityView(s),expected);assert.deepEqual(s,before);
    }
    for(const row of expected.catalog) {
      const active=[...new Set([...(s.abilities?.slotted||[]),row.id])];
      assert.deepEqual(row.previewStats,oracle(s,active));
    }
  }
});

for(const skill of [false,true])test(`v0.10 independent: live ${skill?'skill':'basic'} uses effective sheet attack exactly once before same-turn proficiency growth`,()=>{
  const s=live(['one-handed-damage']);s.equipment.weapon.weaponFamily=null;s._turns=skill?4:0;
  const p=oracle(s,['one-handed-damage']),expected=accepted.resolveAttack({attack:p.attack*(skill?2.3:1),crit:p.crit,skill},target(),rng(s.seed));
  const proficiency=s.hero.proficiency;firstTurn(s);
  assert.equal(s.events.find(event=>event.target==='ability-oracle').value,expected.damage);
  near(s.enemies[0].hp,1e7-expected.damage);assert.equal(s.battle.actions.skills,Number(skill));
  near(s.hero.proficiency,Math.min(1.2*s.hero.level,proficiency+.08));
  assert.deepEqual(current.stats(s),oracle(s,['one-handed-damage']));
});

test('v0.10 independent: live axe snapshots ability-inclusive basic ADB once and pays later tick without a second ability bonus',()=>{
  const s=live(['one-handed-damage']);s.equipment.weapon.weaponFamily='axe';s.equipment.weapon.stats.crit=1;
  const p=oracle(s,['one-handed-damage']),expected=accepted.resolveWeaponAttack({attack:p.attack,crit:p.crit,skill:false},target(),s.equipment.weapon,0,rng(s.seed));
  assert.ok(expected.proc,'fixed seed produces an eligible proc');firstTurn(s);
  assert.equal(s.enemies[0].bleeding.damagePerTick,Math.floor(p.attack*.08));
  assert.equal(s.enemies[0].hp,1e7-expected.damage,'no immediate bleed');
  const damage=s.enemies[0].bleeding.damagePerTick,hp=s.enemies[0].hp;
  s._clock=-100;s._enemyClock=-100;s.timing.tu=(s.timing.ticks+1)*100-1;current.advance(s,.02);
  assert.equal(s.enemies[0].hp,hp-damage);assert.equal(s.events.filter(event=>event.type==='bleed').at(-1).value,damage);
});

test('v0.10 independent: inherited auto-heal, potion, regeneration, start/report and camp recovery use new maxima without masquerading as original Cure',()=>{
  const s=live(),p=current.stats(s);s.hero.hp=p.maxHp*.2;s.hero.mp=6;
  firstTurn(s);near(s.hero.hp,p.maxHp*(.2+.27));near(s.hero.mp,.6);
  assert.equal(s.battle.actions.heals,1);assert.equal(s.battle.actions.manaSpent,6);
  s.hero.hp=1;current.act(s,'heal');near(s.hero.hp,1+p.maxHp*.4);
  assert.equal(s.potions,2);assert.equal(s.battle.actions.potions,1);
  current.act(s,'retreat');assert.equal(s.hero.hp,p.maxHp);assert.equal(s.hero.mp,p.maxMp);
  const report=current.expeditionReports(s)[0];assert.equal(report.startStats.maxHp,p.maxHp);assert.equal(report.startStats.attack,p.attack);
  current.act(s,'unslotAbility','hp-tank');assert.equal(s.hero.hp,current.stats(s).maxHp);
  current.act(s,'start');s.enemies=[target()];s._enemyClock=-100;s.hero.mp=current.stats(s).maxMp-.2;firstTurn(s);
  assert.equal(s.hero.mp,current.stats(s).maxMp,'regeneration remains capped at effective max MP');
});

// Narrow natural cohort: earn everything through accepted public gameplay.
// Paired branches differ only in the player's explicit camp allocation. Once
// damage changes, future RNG/reward paths may diverge; no universal buff claim.
// Freeze only pre-counter acquisition equality. Actual allocation, formulas,
// paired fights and saves below continue exercising the current engine.
test('v0.10 independent: historical earned profiles and current paired growth choices',t=>{
  let trainingRuns=0,trainingSteps=0,pairedSteps=0;const results=[];
  for(let seed=1;seed<=3;seed++) {
    const old=accepted.createGame(seed),s=current.createGame(seed),family=['axe','rapier','club'][seed-1],strategy=['balanced','assault','sustain'][seed-1],dt=seed===1?.1:.25;
    const oldHash=createHash('sha256'),newHash=createHash('sha256');
    const record=()=>{oldHash.update(JSON.stringify(old)+'\n');newHash.update(JSON.stringify(legacyState(s))+'\n');ledger(s);};
    const action=(name,payload)=>{accepted.act(old,name,payload);historicalV012.act(s,name,payload);record();};
    function expedition() {
      const wins=s.wins;action('start');
      for(let n=0;n<600/dt&&s.mode==='battle'&&s.wins===wins;n++) {accepted.advance(old,dt);historicalV012.advance(s,dt);record();trainingSteps++;}
      assert.equal(s.wins,wins+1,'earned profile reaches the next camp without fixture boosts');assert.deepEqual(legacyState(s),legacyState(old));trainingRuns++;action('retreat');
    }
    function equipBest() {
      for(const slot of ['weapon','armor','accessory']) {
        const best=[s.equipment[slot],...s.inventory.filter(item=>item.slot===slot)].reduce((a,b)=>scoreItem(b)>scoreItem(a)?b:a);
        if(best.id!==s.equipment[slot].id)action('equip',best.id);
      }
    }
    let bought=false;
    for(let n=0;n<20&&!bought;n++) {
      expedition();equipBest();const offer=historicalV012.previewWeaponCommission(s,family);
      if(offer.available){action('commissionWeapon',{family,quoteBasis:offer.quoteBasis});action('equip',offer.item.id);bought=true;}
    }
    assert.ok(bought);action('setStrategy',strategy);
    for(const stage of [2,3]){action('selectStage',stage);expedition();}
    assert.ok(s.hero.level>=4);assert.equal(oldHash.digest('hex'),newHash.digest('hex'));assert.deepEqual(legacyState(s),legacyState(old));
    const profile=current.validateSave(JSON.parse(JSON.stringify(s))),initialSeed=profile.seed,initialGold=profile.hero.gold;
    const choices=[[],['hp-tank'],['mp-tank'],['one-handed-damage'],ids];
    const pairs=[];
    for(const chosen of choices) {
      const branch=allocate(clone(profile),chosen),before=current.stats(branch),wins=branch.wins;
      assert.equal(branch.seed,initialSeed);assert.equal(branch.hero.gold,initialGold);assert.deepEqual(before,oracle(branch,chosen));
      for(const key of ['equipment','inventory','pendingLoot'])assert.deepEqual(branch[key],profile[key]);
      assert.equal(ledger(branch).spentAp,chosen.reduce((n,id)=>n+costs[id],0));current.act(branch,'start');
      for(let n=0;n<600/dt&&branch.mode==='battle'&&branch.wins===wins;n++){current.advance(branch,dt);ledger(branch);pairedSteps++;}
      assert.ok(branch.wins===wins+1||branch.mode==='defeat','bounded paired run must settle');
      const report=current.expeditionReports(branch)[0];assert.ok(report);assert.equal(report.startStats.attack,before.attack);assert.equal(report.startStats.maxHp,before.maxHp);
      const restored=current.validateSave(JSON.parse(JSON.stringify(branch)));ledger(restored);
      assert.deepEqual(restored.abilities,branch.abilities);assert.equal(restored.hero.gold,branch.hero.gold);
      pairs.push({allocation:chosen.join('+')||'none',attack:before.attack,maxHp:before.maxHp,maxMp:before.maxMp,
        outcome:report.outcome,endLevel:branch.hero.level,seconds:Number(report.elapsed.toFixed(2)),hpLost:report.survival.hpLost,
        minHpPercent:Number(report.survival.minHpPercent.toFixed(2)),manaSpent:report.actions.manaSpent});
    }
    results.push({seed,family,strategy,level:profile.hero.level,proficiency:profile.hero.proficiency,gold:initialGold,pairs});
  }
  t.diagnostic(JSON.stringify({profiles:3,trainingRuns,trainingSteps,pairedRuns:15,pairedSteps,results}));
});
