import { generateItem, createCommissionWeapon, resolveWeaponFamily, hasUnknownSaleMetadata, dominanceWitness, itemSalePrice } from './loot.js';

export const VERSION = 1;
export const MAX_STAGE = 30;
export const INVENTORY_LIMIT = 120;
// Three original-HV Major ability lines and their researched rank progression.
// The exported rank-one metadata stays compatible with existing callers.
// Training and the separate Support category are outside this slice. Camp-only
// free refunds/reslotting are an explicit adaptation; no permanent gold cost.
export const ABILITY_RULES = Object.freeze({majorSlots:5});
export const MAJOR_ABILITIES = Object.freeze([
  Object.freeze({id:'hp-tank',label:'HP Tank',rank:1,apCost:1,minLevel:0,description:'基礎 HP +10%；裝備的固定 HP 不放大。'}),
  Object.freeze({id:'mp-tank',label:'MP Tank',rank:1,apCost:1,minLevel:0,description:'基礎 MP +10%。'}),
  Object.freeze({id:'one-handed-damage',label:'1H Damage',rank:1,apCost:2,minLevel:0,description:'每點有效單手熟練度 +2 ADB；使用既有的 1.2 × 等級上限。'})
]);
const abilityById = new Map(MAJOR_ABILITIES.map(ability=>[ability.id,ability]));
// Each price is the incremental cost of that rank; each effect replaces the
// earlier total. Buying only the next rank is this game's conservative UI rule.
const tankRankCosts = [1,2,3,3,4,4,4,5,5,5];
const abilityRanks = new Map([
  ['hp-tank',[0,25,50,75,100,120,150,200,250,300].map((minLevel,index)=>({rank:index+1,minLevel,apCost:tankRankCosts[index],description:`基礎 HP +${10*(index+1)}%；裝備的固定 HP 不放大。`}))],
  ['mp-tank',[0,30,60,90,120,160,210,260,310,350].map((minLevel,index)=>({rank:index+1,minLevel,apCost:tankRankCosts[index],description:`基礎 MP +${10*(index+1)}%。`}))],
  ['one-handed-damage',[0,100,200].map((minLevel,index)=>({rank:index+1,minLevel,apCost:[2,3,5][index],description:`每點有效單手熟練度 +${index+2} ADB；使用既有的 1.2 × 等級上限。`}))]
]);
const learnedRank = (allocation,id) => allocation.learned.includes(id)?allocation.ranks?.[id]??1:0;
const rankCost = (id,rank) => abilityRanks.get(id).slice(0,rank).reduce((sum,entry)=>sum+entry.apCost,0);
const allocationCost = allocation => allocation.learned.reduce((sum,id)=>sum+rankCost(id,learnedRank(allocation,id)),0);
// The pinned historical PA model; fixed maximum rate/duration and shared refresh
// are this game's adaptations, not a claim about current original-HV coefficients.
export const PENETRATED_ARMOR_RULES = Object.freeze({chance:.25,durationTicks:7,maxStacks:3,mitigationReductionPerStack:.25});
// Historical weapon maxima applied uniformly: deliberate balance adaptations.
export const CLUB_STUN_RULES = Object.freeze({chance:.25,durationTicks:4});
// Pinned historical shape; fixed maxima, shared refresh and integer snapshots
// are explicit adaptations, not the current original-HV 200-stack model.
export const AXE_BLEED_RULES = Object.freeze({chance:.25,durationTicks:7,maxStacks:5,damageFractionPerStack:.08});
// Original probability/cap shape; partial defensive checks and recognized-family
// eligibility are explicit adaptations. Counter stun/OC/OS are not implemented.
export const COUNTERATTACK_RULES = Object.freeze({baseChance:.25,attributeChance:.0002,proficiencyChance:.001,maxChance:.75});
const counterBudgets = new WeakMap();
// Protection's 25% independent reduction and level-based MP cost are original
// facts. Lv10 / 15 ticks select uncertain research values (10? / 15?). This
// full-action automatic recast is an adaptation, not original Auto-cast Slots.
export const PROTECTION_RULES = Object.freeze({unlockLevel:10,durationTicks:15,reduction:.25});
const protectionSessions = new WeakMap();
// One-shot idle UX adaptation, never an original-HV rule or saved preference.
const finishThenCampSessions = new WeakSet();
export function finishThenCampView(s) {
  const available=s?.mode==='battle'&&['fight','intermission'].includes(s?._phase);
  return {available,queued:available&&finishThenCampSessions.has(s)};
}
export function clearFinishThenCamp(s) { finishThenCampSessions.delete(s); }
function finishThenCamp(s) {
  clearFinishThenCamp(s);s.mode='town';s._phase='idle';s._rest=0;
  s._clock=0;s._enemyClock=0;s.enemies=[];
}

export function protectionView(s) {
  const session=s&&protectionSessions.get(s);
  const level=Math.max(0,finite(s?.hero?.level));
  const remainingTicks=s?.mode==='battle'&&s?._phase==='fight'?Math.max(0,(session?.expiresAtTick??0)-finite(s?.timing?.ticks)):0;
  return {enabled:s?.autoProtection===true,unlocked:level>=10,unlockLevel:10,manaCost:Math.ceil(level*.25),durationTicks:15,
    active:remainingTicks>0,remainingTicks,casts:session?.casts??0,damagePrevented:session?.damagePrevented??0};
}
/** Detached session-only view. Chance is conditional on a reached successful
 * block/parry check, not the chance per incoming attack. */
export function counterattackView(s) {
  const eligible=!!resolveWeaponFamily(s?.equipment?.weapon);
  const level=Math.max(0,finite(s?.hero?.level));
  const effectiveProficiency=clamp(finite(s?.hero?.proficiency),0,1.2*level);
  const attributes=s?.hero?.attributes;
  const probability=clamp(.25+.0002*(Math.max(0,finite(attributes?.str))+Math.max(0,finite(attributes?.dex)))+.001*effectiveProficiency,0,.75);
  const maxPerTurn=effectiveProficiency>=200?3:effectiveProficiency>=100?2:1;
  const usedThisTurn=s?.mode==='battle'&&s?._phase==='fight'?counterBudgets.get(s)?.used??0:0;
  return {eligible,chance:eligible?probability:0,maxPerTurn,usedThisTurn,remainingThisTurn:eligible?Math.max(0,maxPerTurn-usedThisTurn):0,effectiveProficiency};
}
function resetCounterBudget(s,turn=s.timing.turns,force=false){
  // Reserve the upcoming player interval before recovery attacks. A terminal
  // recovery counter can consume this boundary without running playerTurn;
  // the next due boundary must retain that same reserved interval's budget.
  if(force||counterBudgets.get(s)?.turn!==turn)counterBudgets.set(s,{turn,used:0});
}

export const STRATEGIES = Object.freeze([
  Object.freeze({id:'balanced',label:'均衡',description:'每 5 回合破勢斬；HP 低於 38% 時治癒，藥水手動使用。'}),
  Object.freeze({id:'assault',label:'猛攻',description:'每 3 回合破勢斬；HP 低於 22% 才治癒，較快消耗 MP，藥水手動使用。'}),
  Object.freeze({id:'sustain',label:'持久',description:'每 5 回合破勢斬但保留 6 MP；HP 低於 60% 時治癒，治癒後仍低於 30% 自動喝藥。'})
]);
const POLICIES = {balanced:{cadence:5,healAt:.38,reserve:0},assault:{cadence:3,healAt:.22,reserve:0},sustain:{cadence:5,healAt:.60,reserve:6,potionAt:.30}};
const validStrategy = value => STRATEGIES.some(strategy=>strategy.id===value);
const freshActions = () => ({attacks:0,skills:0,heals:0,potions:0,manaSpent:0});
const SLOTS = ['weapon', 'armor', 'accessory'];
const QUALITY = ['Crude','Fair','Average','Superior','Exquisite','Magnificent','Legendary','Peerless'];
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const finite = (n, fallback = 0) => typeof n === 'number' && Number.isFinite(n) ? n : fallback;
const integer = (n, lo, hi, fallback = lo) => clamp(Math.floor(finite(n, fallback)), lo, hi);
const chance = n => clamp(finite(n), 0, 1);
const text = (s, fallback, max = 100) => typeof s === 'string' ? s.slice(0, max) : fallback;
const round = n => Math.round(n * 100) / 100;
export const cumulativeXp = level => level <= 1 ? 0 : Math.round((level+3) ** (2.850263212287058 ** (1+level/1000)));
const nextXp = level => cumulativeXp(level+1)-cumulativeXp(level);
function random(s) { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296; }
function event(s, type, message, value, target, effect) {
  s._eventId += 1;
  s.events.push({id:s._eventId, type, text:message, ...(value === undefined ? {} : {value}), ...(target ? {target} : {}), ...(effect ? {effect} : {})});
  if (s.events.length > 30) s.events.splice(0, s.events.length - 30);
}
function log(s, message) { s.logs.unshift(message); s.logs.length = Math.min(30, s.logs.length); }
function starter(slot) {
  const properties = {weapon:['旅人的鈍劍',{attack:3}],armor:['磨舊旅裝',{defense:2,hp:12}],accessory:['素色護符',{hp:5}]};
  const [name, bonuses] = properties[slot];
  return {id:`starter-${slot}`,name,slot,quality:'Crude',rarityColor:'#8d9bb0',level:1,roll:10,power:1,stats:bonuses,locked:true,description:'獨立設計的入門裝備；換上戰利品即可改善戰力。'};
}
export function createGame(seed = 1) {
  const s = {version:VERSION,seed:integer(seed,0,0xffffffff,1),hero:{level:1,xp:0,xpNext:nextXp(1),hp:1,mp:1,gold:0,proficiency:0,attributes:{str:8,dex:8,agi:8,end:8,int:8,wis:8}},mode:'town',stage:1,unlocked:1,wave:0,totalWaves:4,kills:0,wins:0,autoAdvance:false,strategy:'balanced',inventory:[],equipment:Object.fromEntries(SLOTS.map(slot=>[slot,starter(slot)])),enemies:[],events:[],logs:['整裝出發。戰鬥會自動進行；回營後換上戰利品，再挑戰深處。'],battle:{elapsed:0,cleared:0,bestTimes:{},actions:freshActions()},pendingLoot:[],timing:{turns:0,ticks:0,tu:0},potions:3,_eventId:0,_itemId:0,_clock:0,_enemyClock:0,_turns:0,_phase:'idle',_rest:0};
  recover(s); return s;
}
function readAbilityAllocation(s) {
  const descriptor=Object.getOwnPropertyDescriptor(s,'abilities');
  if(!descriptor){
    if('abilities' in s)throw new Error('能力配置格式無效；未載入，請保留原存檔。');
    return {learned:[],slotted:[]};
  }
  const invalid=()=>{throw new Error('能力配置格式或 AP 預算無效；未載入，請保留原存檔。');};
  if(!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))invalid();
  const raw=descriptor.value;
  if(!raw||typeof raw!=='object'||Array.isArray(raw)
    ||![Object.prototype,null].includes(Object.getPrototypeOf(raw)))invalid();
  const fields=Object.getOwnPropertyDescriptors(raw),keys=Reflect.ownKeys(raw);
  if(![2,3].includes(keys.length)||keys.some(key=>!['learned','slotted','ranks'].includes(key))
    ||!keys.every(key=>fields[key]?.enumerable&&Object.hasOwn(fields[key],'value'))
    ||!['learned','slotted'].every(key=>Object.hasOwn(fields,key)))invalid();
  const readList=key=>{
    const values=fields[key].value;
    if(!Array.isArray(values)||Object.getPrototypeOf(values)!==Array.prototype||values.length>MAJOR_ABILITIES.length
      ||Reflect.ownKeys(values).length!==values.length+1)invalid();
    const ids=[];
    for(let i=0;i<values.length;i++){
      const entry=Object.getOwnPropertyDescriptor(values,String(i));
      if(!entry?.enumerable||!Object.hasOwn(entry,'value')||typeof entry.value!=='string'||!abilityById.has(entry.value))invalid();
      ids.push(entry.value);
    }
    if(new Set(ids).size!==ids.length)invalid();
    return ids;
  };
  const learned=readList('learned'),slotted=readList('slotted'),level=s.hero?.level,ranks={};
  if(Object.hasOwn(fields,'ranks')){
    const supplied=fields.ranks.value;
    if(!supplied||typeof supplied!=='object'||Array.isArray(supplied)
      ||![Object.prototype,null].includes(Object.getPrototypeOf(supplied)))invalid();
    const rankKeys=Reflect.ownKeys(supplied);
    // Rank one remains implicit. Reject redundant/unknown data rather than
    // silently erasing it and pretending to support a future save format.
    if(!rankKeys.length||rankKeys.length>learned.length)invalid();
    for(const id of rankKeys){
      const entry=Object.getOwnPropertyDescriptor(supplied,id);
      if(typeof id!=='string'||!abilityById.has(id)||!learned.includes(id)
        ||!entry?.enumerable||!Object.hasOwn(entry,'value')||!Number.isInteger(entry.value)
        ||entry.value<2||entry.value>abilityRanks.get(id).length)invalid();
      ranks[id]=entry.value;
    }
  }
  const allocation={learned,slotted,...(Object.keys(ranks).length?{ranks}:{})};
  if(!Number.isInteger(level)||level<1||level>500||slotted.length>ABILITY_RULES.majorSlots
    ||slotted.some(id=>!learned.includes(id))
    ||learned.some(id=>abilityRanks.get(id)[learnedRank(allocation,id)-1].minLevel>level)
    ||allocationCost(allocation)>level)invalid();
  return allocation;
}
function abilityEffects(s, allocation) {
  const effectiveProficiency=Math.max(0,Math.min(finite(s.hero.proficiency),1.2*s.hero.level));
  const activeRank=id=>allocation.slotted.includes(id)?learnedRank(allocation,id):0;
  const oneHandedRank=activeRank('one-handed-damage');
  return {hpBonusPercent:10*activeRank('hp-tank'),mpBonusPercent:10*activeRank('mp-tank'),
    attackBonus:oneHandedRank?(oneHandedRank+1)*effectiveProficiency:0,effectiveProficiency};
}
export function stats(s) {
  let allocation;try{allocation=readAbilityAllocation(s);}catch{allocation={learned:[],slotted:[]};}
  return statsWithAbilities(s,allocation);
}
function statsWithAbilities(s, allocation) {
  const h=s.hero, a=h.attributes, sum=key=>SLOTS.reduce((v,slot)=>v+finite(s.equipment[slot]?.stats?.[key]),0);
  const attributeMit=Math.min(.8,1-900/(900+a.end+a.agi/2));
  const equipmentMit=1-SLOTS.reduce((left,slot)=>left*(1-clamp(finite(s.equipment[slot]?.stats?.defense)/100,0,.8)),1);
  const effects=abilityEffects(s,allocation),baseHp=500+10*h.level+6*a.end,baseMp=10+h.level+a.wis;
  // Preserve rank-zero arithmetic exactly. Tanks floor only the original base;
  // this game's existing flat equipment HP and final rounding remain separate.
  // Preserve legacy rank-one floating arithmetic; higher ranks use an exact
  // rational multiplier so e.g. a 30% integer boundary cannot floor one low.
  const tankBase=(base,percent)=>Math.floor(percent===10?base*1.1:base*(100+percent)/100);
  const maxHp=Math.round((effects.hpBonusPercent?tankBase(baseHp,effects.hpBonusPercent):baseHp)+sum('hp'));
  const maxMp=effects.mpBonusPercent?tankBase(baseMp,effects.mpBonusPercent):Math.round(baseMp);
  // Existing flat 3.5% plus one percentage point per equipment parry rating is
  // our bounded adaptation, not the original attacker-accuracy rating formula.
  return {maxHp,maxMp,attack:round(Math.max(1,Math.log(3330+2*a.str+a.dex)/Math.log(1.0003)-27029.81)+sum('attack')+effects.attackBonus), defense:round(sum('defense')),mitigation:1-(1-equipmentMit)*(1-attributeMit),crit:clamp(.05+a.dex*.0015+sum('crit'),0,.8),evade:clamp(.02+a.agi*.001+sum('evade'),0,.5),block:clamp(.04+sum('block'),0,.6),parry:clamp(.035+sum('parry')/100,0,.5)};
}
/** Pure detached camp view. Earned AP is always level (one initially, then one
 * per level); there is no grant counter to duplicate on reload or repeated wins.
 * Row previews show the result IF learned and slotted, never auto-allocate AP.
 */
export function abilityView(s) {
  let allocation,valid=true;
  try{allocation=readAbilityAllocation(s);}catch{allocation={learned:[],slotted:[]};valid=false;}
  const level=s.hero.level,earnedAp=Number.isInteger(level)&&level>=1&&level<=500?level:0;
  if(!earnedAp)valid=false;
  const {learned,slotted}=allocation,spentAp=allocationCost(allocation);
  const availableAp=earnedAp-spentAp,camp=valid&&s.mode==='town';
  const catalog=MAJOR_ABILITIES.map(ability=>{
    const currentRank=learnedRank(allocation,ability.id),known=currentRank>0,active=slotted.includes(ability.id);
    const ladder=abilityRanks.get(ability.id),nextRank=ladder[currentRank]?{...ladder[currentRank]}:null;
    const previewAllocation={...allocation,learned:known?learned:[...learned,ability.id],slotted:active?slotted:[...slotted,ability.id]};
    const upgradeAllocation=known&&nextRank?{...previewAllocation,ranks:{...allocation.ranks,[ability.id]:nextRank.rank}}:null;
    return {...ability,description:ladder[Math.max(1,currentRank)-1].description,learned:known,slotted:active,
      currentRank,maxRank:ladder.length,spentAp:rankCost(ability.id,currentRank),nextRank,
      canLearn:camp&&!known&&level>=ability.minLevel&&availableAp>=ability.apCost,
      canUpgrade:camp&&known&&!!nextRank&&level>=nextRank.minLevel&&availableAp>=nextRank.apCost,
      canSlot:camp&&known&&!active&&slotted.length<ABILITY_RULES.majorSlots,
      canUnslot:camp&&active,canRefund:camp&&known,
      previewStats:statsWithAbilities(s,previewAllocation),previewEffects:abilityEffects(s,previewAllocation),
      upgradePreviewStats:upgradeAllocation?statsWithAbilities(s,upgradeAllocation):null,
      upgradePreviewEffects:upgradeAllocation?abilityEffects(s,upgradeAllocation):null};
  });
  return {valid,earnedAp,spentAp,availableAp,majorCapacity:ABILITY_RULES.majorSlots,majorUsed:slotted.length,
    learned:[...learned],slotted:[...slotted],ranks:{...allocation.ranks},effects:abilityEffects(s,allocation),currentStats:statsWithAbilities(s,allocation),catalog};
}
function recover(s) { const p=stats(s); s.hero.hp=p.maxHp;s.hero.mp=p.maxMp; }

const validTick = tick => Number.isSafeInteger(tick)&&tick>=0&&tick<=Number.MAX_SAFE_INTEGER-PENETRATED_ARMOR_RULES.durationTicks;
const generalMitigation = defender => clamp(finite(defender.mitigation,Math.max(0,finite(defender.defense))/100),0,.95);

// Session expedition feedback (v0.9): observation only, never serialized into
// game/save state. validateSave rebuilds a new state, so imported history (even
// supplied under invented report fields) is never restored or trusted.
const expeditionFeedback = new WeakMap();
const reportNumber = value => clamp(finite(value),0,Number.MAX_SAFE_INTEGER);
function copyExpeditionReport(report) {
  return {...report,weapon:{...report.weapon},startStats:{...report.startStats},
    ...(report.protection?{protection:{...report.protection}}:{}),actions:{...report.actions},damage:{...report.damage},survival:{...report.survival},procs:{...report.procs}};
}
/** Detached newest-first completed expeditions, at most two for this state in
 * this session. Reads never settle a fight, consume RNG, or change game state.
 * Counts describe observations, not causal PA damage/stun savings or gear scores.
 */
export function expeditionReports(s) {
  return (expeditionFeedback.get(s)?.reports||[]).map(copyExpeditionReport);
}
function beginExpeditionReport(s) {
  const p=stats(s),feedback=expeditionFeedback.get(s)||{active:null,reports:[]};
  feedback.active={stage:integer(s.stage,1,MAX_STAGE),level:integer(s.hero.level,1,500),
    weapon:{family:resolveWeaponFamily(s.equipment.weapon),name:text(s.equipment.weapon?.name,'未知武器')},
    strategy:validStrategy(s.strategy)?s.strategy:'balanced',
    startStats:{attack:reportNumber(p.attack),maxHp:reportNumber(p.maxHp),mitigation:chance(p.mitigation)},
    damage:{basic:0,skill:0,bleed:0},survival:{hpLost:0,minHpPercent:100},
    procs:{penetratedArmor:0,stun:0,bleeding:0}};
  expeditionFeedback.set(s,feedback);
}
function observeExpeditionHit(s, source, hpRemoved, proc) {
  const active=expeditionFeedback.get(s)?.active;if(!active)return;
  active.damage[source]=reportNumber((active.damage[source]??0)+reportNumber(hpRemoved));
  if(Object.hasOwn(active.procs,proc))active.procs[proc]=reportNumber(active.procs[proc]+1);
}
function observeExpeditionLoss(s, hpLost, maxHp) {
  const active=expeditionFeedback.get(s)?.active;if(!active)return;
  active.survival.hpLost=reportNumber(active.survival.hpLost+reportNumber(hpLost));
  observeExpeditionHealth(s,maxHp);
}
function observeExpeditionHealth(s, maxHp) {
  const active=expeditionFeedback.get(s)?.active;if(!active)return;
  if(maxHp===undefined)maxHp=stats(s).maxHp;
  if(Number.isFinite(maxHp)&&maxHp>0)active.survival.minHpPercent=Math.min(active.survival.minHpPercent,clamp(finite(s.hero.hp)/maxHp*100,0,100));
}
function settleExpeditionReport(s, outcome) {
  const feedback=expeditionFeedback.get(s),active=feedback?.active;if(!active)return;
  observeExpeditionHealth(s);
  // Consume before publishing. Repeated retreat/defeat/win observations cannot
  // replace a completed win or record the same expedition a second time.
  feedback.active=null;
  const report={...active,outcome,endLevel:integer(s.hero.level,1,500),elapsed:reportNumber(s.battle.elapsed),
    actions:Object.fromEntries([...Object.keys(freshActions()),...(s.battle.actions?.counters>0?['counters']:[])].map(key=>[key,reportNumber(s.battle.actions?.[key])]))};
  const protection=protectionSessions.get(s);
  if(protection?.casts>0)report.protection={casts:protection.casts,damagePrevented:protection.damagePrevented};
  for(const value of Object.values(report))if(value&&typeof value==='object')Object.freeze(value);
  feedback.reports.unshift(Object.freeze(report));feedback.reports.length=Math.min(2,feedback.reports.length);
}
// End session expedition feedback.
/** Read-only UI/combat view. Invalid, expired, or unbounded status is inactive. */
export function penetratedArmorStatus(enemy, tick) {
  const status=enemy?.penetratedArmor;
  if(!validTick(tick)||!status||!Number.isInteger(status.stacks)||status.stacks<1||status.stacks>PENETRATED_ARMOR_RULES.maxStacks||!Number.isSafeInteger(status.expiresAtTick))return null;
  const ticksRemaining=status.expiresAtTick-tick;
  if(ticksRemaining<=0||ticksRemaining>PENETRATED_ARMOR_RULES.durationTicks)return null;
  return {stacks:status.stacks,ticksRemaining,mitigationMultiplier:1-PENETRATED_ARMOR_RULES.mitigationReductionPerStack*status.stacks};
}
function expirePenetratedArmor(enemy, tick) {
  if(enemy.penetratedArmor&&!penetratedArmorStatus(enemy,tick))delete enemy.penetratedArmor;
}
/** Read-only encounter view. The final owed pulse is paid by advance before
 * expiry; reading a status never pays damage, rolls RNG, or changes its timer.
 */
export function bleedStatus(enemy, tick) {
  if(!validTick(tick)||!Number.isFinite(enemy?.hp)||enemy.hp<=0)return null;
  const status=enemy.bleeding;
  if(!status||typeof status!=='object'||Array.isArray(status)
    ||!Number.isInteger(status.stacks)||status.stacks<1||status.stacks>AXE_BLEED_RULES.maxStacks
    ||!Number.isSafeInteger(status.expiresAtTick)||!Number.isSafeInteger(status.damagePerTick)||status.damagePerTick<0)return null;
  const ticksRemaining=status.expiresAtTick-tick;
  if(ticksRemaining<=0||ticksRemaining>AXE_BLEED_RULES.durationTicks)return null;
  return {stacks:status.stacks,ticksRemaining,damagePerTick:status.damagePerTick};
}
function expireBleeding(enemy, tick) {
  if(enemy.bleeding!==undefined&&!bleedStatus(enemy,tick))delete enemy.bleeding;
}
/** Per-enemy, read-only UI view: an owed recovery action is NOT an active stun. */
export function stunStatus(enemy, tick) {
  if(!validTick(tick)||!Number.isFinite(enemy?.hp)||enemy.hp<=0)return null;
  const status=enemy.stun;
  if(status&&!Array.isArray(status)&&Number.isSafeInteger(status.expiresAtTick)){
    const ticksRemaining=status.expiresAtTick-tick;
    if(ticksRemaining>0&&ticksRemaining<=CLUB_STUN_RULES.durationTicks)return {ticksRemaining,recoveryPending:false};
  }
  return enemy.stunRecoveryPending===true?{ticksRemaining:0,recoveryPending:true}:null;
}
/** Read-only physical defense view; values are per check, not net miss chances.
 * PA changes general mitigation only; active stun bypasses evade/parry, not block.
 * An owed recovery action is not active stun. Never rewrites the enemy's defense.
 */
export function enemyDefenseView(enemy, tick) {
  const baseMitigation=generalMitigation(enemy||{}), armor=penetratedArmorStatus(enemy,tick);
  const baseEvade=chance(enemy?.evade),baseParry=chance(enemy?.parry),baseBlock=chance(enemy?.block);
  const stunned=Boolean(enemy?.stunned)||stunStatus(enemy,tick)?.ticksRemaining>0;
  return {baseMitigation,mitigation:baseMitigation*(armor?.mitigationMultiplier??1),baseEvade,evade:stunned?0:baseEvade,baseParry,parry:stunned?0:baseParry,baseBlock,block:baseBlock,stunned};
}
function expireStun(enemy, tick) {
  if(enemy.stun!==undefined&&!(stunStatus(enemy,tick)?.ticksRemaining>0))delete enemy.stun;
  if(enemy.hp<=0)delete enemy.stunRecoveryPending;
}
function clearEnemyStatuses(enemy) {
  delete enemy.penetratedArmor;delete enemy.stun;delete enemy.stunRecoveryPending;delete enemy.stunRecoveryTurn;delete enemy.bleeding;
}

/** Ordered research-derived resolution; coefficients/rates are explicit game adaptations.
 * `trace` exposes every reached phase. No second hidden accuracy check.
 */
export function resolveAttack(attacker, defender, rng = Math.random) {
  const trace=[], roll=()=>clamp(finite(rng(),.5),0,.999999999);
  const result={damage:0,crit:0,outcome:'hit',trace};
  if(attacker.trackDefense===true)result.defenses={parry:0,block:0};
  const stop=name=>{result.outcome=name;return result;};
  trace.push('Whiff'); if(chance(attacker.whiff)>0&&roll()<chance(attacker.whiff)) return stop('whiff');
  // Magic pre-samples critical eligibility only to enforce critical/Absorb incompatibility.
  const magicCrit=attacker.magical&&!attacker.weakened ? roll()<chance(attacker.crit) : false;
  trace.push('Absorb'); if(attacker.magical&&!magicCrit&&chance(defender.absorb)>0&&roll()<chance(defender.absorb)) return stop('absorb');
  let factor=1, glancing=false;
  for(const [label,key] of [['Evade','evade'],['Parry','parry'],['Block','block']]) {
    trace.push(label);
    if(((attacker.skill||defender.stunned)&&(key==='evade'||key==='parry'))||(key==='parry'&&attacker.magical))continue;
    const successes=Number(roll()<chance(defender[key]))+Number(roll()<chance(defender[key]));
    if(result.defenses&&Object.hasOwn(result.defenses,key))result.defenses[key]=successes;
    if(successes===2) return stop(key);
    if(successes===1){factor*=.5;if(key==='evade')glancing=true;}
  }
  trace.push('Resist');
  if(attacker.magical&&!attacker.channeling){const resisted=Number(roll()<chance(defender.resist))+Number(roll()<chance(defender.resist))+Number(roll()<chance(defender.resist));factor *= [1,.5,.25,.1][resisted];}
  trace.push('MultiCrit');
  const firstCrit=!glancing&&!attacker.weakened&&(attacker.magical?magicCrit:roll()<chance(attacker.crit));
  if(firstCrit){result.crit=1;while(result.crit<9&&roll()<Math.min(.25,chance(attacker.multiCrit??.1)))result.crit++;}
  const critFactor=1+result.crit*Math.max(0,finite(attacker.critBonus,.5));
  trace.push('Mitigation');
  const mitigation=generalMitigation(defender);
  const specificMit=attacker.void?0:clamp(finite(defender.specificMit),0,.95);
  trace.push('DamageRoll'); const die=80+Math.floor(roll()*41);
  const rolledDamage=Math.max(0,finite(attacker.attack))*factor*critFactor*(1-mitigation)*(1-specificMit)*die/100;
  result.damage=Math.max(0,Math.floor(rolledDamage+1e-9));
  if(defender.protection===true){result.unprotectedDamage=result.damage;result.damage=Math.max(0,Math.floor(rolledDamage*.75+1e-9));}
  result.outcome=result.crit?'crit':factor<1?'glance':'hit';return result;
}
/** Resolves damage first, then mutates only the defender's bounded proc status.
 * Existing PA/stun benefit physical skills too, but this game's skill procs none.
 * HP subtraction remains the caller's job; a lethal hit does not leave a status.
 * Only live advance owns next-player-turn recovery; this helper is not a scheduler.
 */
export function resolveWeaponAttack(attacker, defender, weapon, tick, rng = Math.random) {
  expirePenetratedArmor(defender,tick);expireStun(defender,tick);expireBleeding(defender,tick);
  const previous=penetratedArmorStatus(defender,tick);
  const stun=stunStatus(defender,tick);
  let effectiveDefender=previous&&!attacker.magical?{...defender,mitigation:generalMitigation(defender)*previous.mitigationMultiplier}:defender;
  if(stun?.ticksRemaining>0)effectiveDefender={...effectiveDefender,stunned:true};
  const result=resolveAttack(attacker,effectiveDefender,rng);
  if(Number.isFinite(defender.hp)&&defender.hp<=result.damage){clearEnemyStatuses(defender);return result;}
  if(attacker.magical||attacker.skill||result.damage<=0||!Number.isFinite(defender.hp)||!validTick(tick))return result;
  const family=resolveWeaponFamily(weapon);
  if(family==='axe'){
    if(!result.crit&&clamp(finite(rng(),.5),0,.999999999)>=AXE_BLEED_RULES.chance)return result;
    const stacks=Math.min(AXE_BLEED_RULES.maxStacks,(bleedStatus(defender,tick)?.stacks||0)+1);
    // Basic sheet attack, not hit damage, critical multiplier, or target armor.
    // Refresh snapshots the whole wound anew, even if its new amount is weaker.
    const damagePerTick=Math.floor(finite(attacker.attack)*AXE_BLEED_RULES.damageFractionPerStack*stacks);
    if(!Number.isSafeInteger(damagePerTick)||damagePerTick<0)return result;
    defender.bleeding={stacks,expiresAtTick:tick+AXE_BLEED_RULES.durationTicks,damagePerTick};
    result.proc={type:'bleeding',stacks,durationTicks:AXE_BLEED_RULES.durationTicks,damagePerTick};
    return result;
  }
  if(family==='club'){
    if(stun)return result; // Active/pending recovery cannot refresh or spend proc RNG.
    if(!result.crit&&clamp(finite(rng(),.5),0,.999999999)>=CLUB_STUN_RULES.chance)return result;
    defender.stun={expiresAtTick:tick+CLUB_STUN_RULES.durationTicks};
    result.proc={type:'stun',durationTicks:CLUB_STUN_RULES.durationTicks};
    return result;
  }
  if(family!=='rapier')return result;
  if(!result.crit&&clamp(finite(rng(),.5),0,.999999999)>=PENETRATED_ARMOR_RULES.chance)return result;
  const stacks=Math.min(PENETRATED_ARMOR_RULES.maxStacks,(previous?.stacks||0)+1);
  defender.penetratedArmor={stacks,expiresAtTick:tick+PENETRATED_ARMOR_RULES.durationTicks};
  result.proc={type:'penetratedArmor',stacks,durationTicks:PENETRATED_ARMOR_RULES.durationTicks};
  return result;
}
/** Counter damage only: no weapon proc, crit, skill resource cost or status
 * mutation. Existing historical PA affects physical mitigation normally. */
export function resolveCounterAttack(attacker, defender, tick, rng = Math.random) {
  const armor=penetratedArmorStatus(defender,tick);
  const effective=armor?{...defender,mitigation:generalMitigation(defender)*armor.mitigationMultiplier}:defender;
  return resolveAttack({attack:finite(attacker?.attack),crit:0,weakened:true,skill:true},effective,rng);
}
// Independently authored defense profiles, not original-HV monster classes/rates.
// Identity is selected by the same stable archetype index as the original names.
const ENEMY_ARCHETYPES = Object.freeze([
  Object.freeze({name:'灰霧獵犬',roleId:'baseline'}),
  Object.freeze({name:'碎晶甲蟲',roleId:'armored'}),
  Object.freeze({name:'荒野影獸',roleId:'agile'}),
  Object.freeze({name:'赤砂守衛',roleId:'baseline'})
]);
const ENEMY_ROLES = Object.freeze({
  baseline:Object.freeze({roleLabel:'均衡',defenseOffset:0,evade:.025,parry:.02}),
  armored:Object.freeze({roleLabel:'厚甲',defenseOffset:18,evade:.01,parry:.01}),
  agile:Object.freeze({roleLabel:'靈巧',defenseOffset:-3,evade:.10,parry:.07})
});
function waveDescriptor(stage, wave) {
  const boss=wave===4, count=boss?1:wave===1?1:2;
  const enemies=Array.from({length:count},(_,i)=>{
    const archetype=ENEMY_ARCHETYPES[(stage+wave+i)%ENEMY_ARCHETYPES.length];
    const roleId=stage<3?'baseline':boss?(stage%2?'armored':'agile'):archetype.roleId;
    const role=ENEMY_ROLES[roleId],defense=Math.max(0,round(3+stage*1.3+(boss?3:0)+role.defenseOffset));
    return {name:boss?`裂隙守門者 · ${stage}`:archetype.name,boss,roleId,roleLabel:role.roleLabel,defense,mitigation:generalMitigation({defense}),evade:role.evade,parry:role.parry,block:boss?.06:.015};
  });
  return {wave,boss,enemies};
}
/** Pure four-wave route preview. No state/seed input or random draws. */
export function previewStage(stage) {
  stage=integer(stage,1,MAX_STAGE);
  return {stage,waves:Array.from({length:4},(_,i)=>waveDescriptor(stage,i+1))};
}
function enemiesFor(s) {
  const stage=s.stage,wave=s.wave;
  return waveDescriptor(stage,wave).enemies.map(({mitigation,...descriptor},i)=>{
    const hp=Math.round((descriptor.boss?340:114+wave*15)*Math.pow(1.20,stage-1));
    // Preview-only mitigation must not shadow the established defense fallback.
    return {id:`e-${s.wins}-${stage}-${wave}-${i}`,...descriptor,hp,maxHp:hp,attack:round((descriptor.boss?27:16+wave*1.0)*Math.pow(1.16,stage-1)),resist:.04};
  });
}
function start(s) {
  if(s.pendingLoot.length||s.inventory.length>INVENTORY_LIMIT-5){log(s,'背包空間不足，請先整理戰利品再出戰。');return;}
  clearFinishThenCamp(s);protectionSessions.delete(s);
  s.mode='battle';s.wave=1;s.battle.elapsed=0;s.battle.actions=freshActions();s._clock=0;s._enemyClock=0;s._turns=0;s._phase='fight';s._rest=0;s.totalWaves=4;
  resetCounterBudget(s,s.timing.turns,true);recover(s);s.potions=3;s.enemies=enemiesFor(s);log(s,`進入第 ${s.stage} 層。`);
  beginExpeditionReport(s);
}

// Three researched starting equipment-set slots; this implementation stores
// gear references only, not original Personas/abilities/quickbars/battle items.
const GEAR_SET_IDS = ['a','b','c'];
const gearSetLabel = id => `配裝 ${id.toUpperCase()}`;
const plainRecord = value => value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
function readGearSets(s, validateHeld=true) {
  const invalid=()=>{throw new Error('配裝資料無效、裝備遺失或未鎖定；未載入，請保留原存檔。');};
  const descriptor=Object.getOwnPropertyDescriptor(s,'gearSets');
  if(!descriptor){if('gearSets' in s)invalid();return {};}
  if(!descriptor.enumerable||!Object.hasOwn(descriptor,'value')||!plainRecord(descriptor.value))invalid();
  const raw=descriptor.value,keys=Reflect.ownKeys(raw),sets={};
  if(!keys.length||keys.length>GEAR_SET_IDS.length)invalid();
  for(const id of keys){
    const field=Object.getOwnPropertyDescriptor(raw,id);
    if(!GEAR_SET_IDS.includes(id)||!field?.enumerable||!Object.hasOwn(field,'value')||!plainRecord(field.value))invalid();
    const entry=field.value,slotKeys=Reflect.ownKeys(entry),ids={};
    if(slotKeys.length!==SLOTS.length||slotKeys.some(slot=>!SLOTS.includes(slot)))invalid();
    for(const slot of SLOTS){
      const ref=Object.getOwnPropertyDescriptor(entry,slot);
      if(!ref?.enumerable||!Object.hasOwn(ref,'value')||typeof ref.value!=='string'||!ref.value||ref.value.length>100)invalid();
      ids[slot]=ref.value;
    }
    if(new Set(Object.values(ids)).size!==SLOTS.length)invalid();
    sets[id]=ids;
  }
  if(validateHeld){
    const held=gearHeldItems(s);
    if(!held)invalid();
    for(const ids of Object.values(sets))for(const slot of SLOTS){
      const item=held.get(ids[slot]);
      if(!item||item.slot!==slot||!item.locked)invalid();
    }
  }
  return sets;
}
function gearHeldItems(s) {
  if(!s.equipment||!Array.isArray(s.inventory)||s.inventory.length>INVENTORY_LIMIT||!Array.isArray(s.pendingLoot)||s.pendingLoot.length>8)return null;
  const equipped=SLOTS.map(slot=>s.equipment[slot]);
  if(equipped.some((item,index)=>!selectedSaleItem(item)||item.slot!==SLOTS[index])||s.inventory.some(item=>!selectedSaleItem(item))||s.pendingLoot.some(item=>!selectedSaleItem(item)))return null;
  const owned=[...equipped,...s.inventory],all=[...owned,...s.pendingLoot];
  const ids=all.map(item=>item&&typeof item==='object'?Object.getOwnPropertyDescriptor(item,'id')?.value:undefined);
  if(ids.some(id=>typeof id!=='string'||!id||id.length>100)||new Set(ids).size!==ids.length)return null;
  return new Map(owned.map(item=>[item.id,item]));
}
/** Protect reference membership even if a live record's lock was corrupted.
 * Malformed metadata fails closed for destructive actions rather than erasing it.
 */
export function isGearSetProtected(s,id) {
  if(typeof id!=='string')return false;
  try{return Object.values(readGearSets(s,false)).some(ids=>Object.values(ids).includes(id));}catch{return true;}
}
/** Detached exact-ID/stats comparison. The quote includes current inventory and
 * build inputs so consent cannot silently follow a different item or build.
 */
export function previewGearSet(s,id) {
  const empty=reason=>({available:false,reason,id:GEAR_SET_IDS.includes(id)?id:null,label:GEAR_SET_IDS.includes(id)?gearSetLabel(id):'',active:false,ids:null,items:[],currentStats:null,nextStats:null,currentCounter:null,nextCounter:null,quoteBasis:null});
  try{
    if(typeof id!=='string'||!GEAR_SET_IDS.includes(id))return empty('配裝欄位無效。');
    const sets=readGearSets(s),ids=sets[id];
    if(!ids)return empty('尚未儲存這組配裝。');
    const held=gearHeldItems(s);if(!held)return empty('裝備資料無效。');
    const nextEquipment=Object.fromEntries(SLOTS.map(slot=>[slot,held.get(ids[slot])])),next={...s,equipment:nextEquipment};
    const copy=value=>JSON.parse(JSON.stringify(value));
    const items=SLOTS.map(slot=>({slot,current:copy(s.equipment[slot]),item:copy(nextEquipment[slot]),changed:s.equipment[slot].id!==ids[slot]}));
    const active=items.every(row=>!row.changed),camp=s.mode==='town';
    const quoteBasis=JSON.stringify([id,sets,s.equipment,s.inventory,s.pendingLoot,s.hero,s.abilities??null,s.strategy]);
    if(quoteBasis.length>1048576)return empty('配裝資料過長，無法套用。');
    return {available:camp&&!active,reason:!camp?'請先回營，再套用配裝。':active?'目前已穿戴這組配裝。':'',id,label:gearSetLabel(id),active,ids:{...ids},items,currentStats:stats(s),nextStats:stats(next),currentCounter:counterattackView(s),nextCounter:counterattackView(next),quoteBasis};
  }catch{return empty('配裝資料無效、裝備遺失或未鎖定；未套用。');}
}
export function gearSetsView(s) {
  let sets={},valid=true;try{sets=readGearSets(s);if(!gearHeldItems(s))valid=false;}catch{valid=false;}
  return {valid,capacity:GEAR_SET_IDS.length,sets:GEAR_SET_IDS.map(id=>{
    const preview=previewGearSet(s,id),saved=Object.hasOwn(sets,id);
    return {id,label:gearSetLabel(id),saved,active:preview.active,available:preview.available,reason:preview.reason,ids:saved?{...sets[id]}:null,
      canSave:valid&&s.mode==='town',canClear:valid&&s.mode==='town'&&saved};
  })};
}

function protectedLootKeepers(s) {
  // Reject unsupported item descriptors before reading lock/name/ID fields.
  return [...SLOTS.map(slot=>s.equipment?.[slot]).filter(item=>!hasUnknownSaleMetadata(item)),...s.inventory.filter(item=>!hasUnknownSaleMetadata(item)&&item.locked===true)];
}
function safeSaleEntry(item, keepers) {
  const witness=dominanceWitness(item,keepers);if(!witness)return null;
  const keeper=keepers.find(kept=>Object.getOwnPropertyDescriptor(kept,'id')?.value===witness.keeperId),value=itemSalePrice(item);
  if(!keeper||!Number.isSafeInteger(value)||value<1)return null;
  return {id:item.id,name:item.name,slot:item.slot,quality:item.quality,keeperId:keeper.id,keeperName:keeper.name,value,strictlyBetterKeys:[...witness.strictlyBetterKeys]};
}
/** Pure, detached exact-ID preview. Only equipped or locked inventory items can
 * witness a sale; pending loot and other sale candidates are never keepers.
 */
export function previewSafeSale(s) {
  const empty={items:[],total:0};
  try {
    if(!s||!Array.isArray(s.inventory)||!s.equipment||!Array.isArray(s.pendingLoot))return empty;
    const live=[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];
    const ids=live.map(item=>item&&typeof item==='object'?Object.getOwnPropertyDescriptor(item,'id')?.value:undefined);
    if(ids.some(id=>typeof id!=='string'||!id||id.length>100)||new Set(ids).size!==ids.length)return empty;
    const keepers=protectedLootKeepers(s),items=[];
    for(const item of s.inventory){if(isGearSetProtected(s,item.id))continue;const entry=safeSaleEntry(item,keepers);if(entry)items.push(entry);}
    return {items,total:items.reduce((sum,item)=>sum+item.value,0)};
  } catch { return empty; }
}
/** A fixed catalog is this game's adaptation, not original Bazaar stock/forging.
 * Pure exact-item preview: predicted ID is not allocated until an accepted buy.
 * Retain the original five-slot expedition reserve after immediate delivery.
 */
// Explicit manual selection, not a safe-sale classifier. Quality, family and
// score never choose a sale here; the UI must ask for these exact selected IDs.
function selectedSaleIds(raw) {
  if(!Array.isArray(raw)||Object.getPrototypeOf(raw)!==Array.prototype||!raw.length||raw.length>INVENTORY_LIMIT
    ||Reflect.ownKeys(raw).length!==raw.length+1)return null;
  const ids=[];
  for(let i=0;i<raw.length;i++){
    const entry=Object.getOwnPropertyDescriptor(raw,String(i));
    if(!entry?.enumerable||!Object.hasOwn(entry,'value')||typeof entry.value!=='string'||!entry.value||entry.value.length>100)return null;
    ids.push(entry.value);
  }
  return new Set(ids).size===ids.length?ids:null;
}
function selectedSaleItem(item) {
  if(hasUnknownSaleMetadata(item))return false;
  return ['id','name','slot','quality','level','power','stats','locked'].every(key=>Object.hasOwn(item,key))
    &&typeof item.id==='string'&&item.id.length>0&&item.id.length<=100
    &&typeof item.name==='string'&&item.name.length<=100
    &&SLOTS.includes(item.slot)&&QUALITY.includes(item.quality)
    &&Number.isInteger(item.level)&&item.level>=1&&item.level<=1000
    &&Number.isFinite(item.power)&&item.power>=0&&item.power<=1000000
    &&typeof item.locked==='boolean'&&item.stats&&typeof item.stats==='object';
}
/** Pure, detached quote for an intentional batch. Bind the full selected items,
 * equipped comparison context and balance; stale consent is never refreshed by
 * the action. Pending items are not selectable, but retain existing refill order.
 */
export function previewSelectedSale(s, requestedIds) {
  const unavailable=reason=>({available:false,reason,items:[],total:0,goldAfter:finite(s?.hero?.gold),quoteBasis:null});
  try {
    const ids=selectedSaleIds(requestedIds);
    if(!ids)return unavailable('請逐件選擇要出售的裝備；清單不可空白、重複或無效。');
    if(s.mode!=='town')return unavailable('請先回營，再預覽勾選出售。');
    if(!Array.isArray(s.inventory)||s.inventory.length>INVENTORY_LIMIT||!Array.isArray(s.pendingLoot)
      ||!s.equipment||!s.hero||!Number.isFinite(s.hero.gold)||s.hero.gold<0||s.hero.gold>1e12)return unavailable('裝備或交易資料無效，未建立出售清單。');
    const equipped=SLOTS.map(slot=>s.equipment[slot]);
    if(equipped.some((item,index)=>!selectedSaleItem(item)||item.slot!==SLOTS[index]))return unavailable('比較裝備資料無效，未建立出售清單。');
    const held=[...equipped,...s.inventory,...s.pendingLoot];
    const heldIds=held.map(item=>item&&typeof item==='object'?Object.getOwnPropertyDescriptor(item,'id')?.value:undefined);
    if(heldIds.some(id=>typeof id!=='string'||!id||id.length>100)||new Set(heldIds).size!==heldIds.length)return unavailable('裝備識別資料無效，未建立出售清單。');
    const items=[];
    for(const id of ids){
      const item=s.inventory.find(held=>Object.getOwnPropertyDescriptor(held,'id')?.value===id);
      if(!selectedSaleItem(item)||item.locked||isGearSetProtected(s,id))return unavailable('選擇包含已鎖定、已裝備、待領、遺失或不支援的裝備；整批未出售。');
      const value=itemSalePrice(item);
      if(!Number.isSafeInteger(value)||value<1)return unavailable('出售價格無效，未建立出售清單。');
      const detached=JSON.parse(JSON.stringify(item)),currentEquipment=JSON.parse(JSON.stringify(s.equipment[item.slot]));
      items.push({id:item.id,name:item.name,slot:item.slot,quality:item.quality,value,item:detached,currentEquipment});
    }
    const total=items.reduce((sum,item)=>sum+item.value,0),goldAfter=s.hero.gold+total;
    if(!Number.isSafeInteger(total)||!Number.isFinite(goldAfter)||goldAfter>1e12)return unavailable('金幣超過可保存上限，整批未出售。');
    const quoteBasis=JSON.stringify([ids,items.map(entry=>entry.item),equipped,s.hero.gold,total]);
    if(quoteBasis.length>1048576)return unavailable('出售資料過長，未建立出售清單。');
    return {available:true,reason:'',items,total,goldAfter,quoteBasis};
  } catch {return unavailable('裝備或交易資料無效，未建立出售清單。');}
}
export function previewWeaponCommission(s, family, suffix = 'slaughter') {
  const unavailable=reason=>({family:typeof family==='string'?family:null,item:null,price:null,goldAfter:null,available:false,reason,quoteBasis:null,currentWeapon:null});
  try {
    const item=createCommissionWeapon(family,s?.hero?.level,suffix);
    if(!item)return unavailable('委託資料無效；請選擇支援的武器與角色等級。');
    if(!Array.isArray(s.inventory)||!Array.isArray(s.pendingLoot)||!s.equipment
      ||!Number.isFinite(s.hero.gold)||s.hero.gold<0||s.hero.gold>1e12
      ||!Number.isSafeInteger(s._itemId)||s._itemId<0||s._itemId>1e9
      ||!Number.isSafeInteger(s.wins)||s.wins<0
      ||hasUnknownSaleMetadata(s.equipment.weapon)||s.equipment.weapon.slot!=='weapon')return unavailable('裝備或交易資料無效；未建立委託。');
    const live=[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];
    const ids=live.map(held=>held&&typeof held==='object'?Object.getOwnPropertyDescriptor(held,'id')?.value:undefined);
    if(ids.some(id=>typeof id!=='string'||!id||id.length>100)||new Set(ids).size!==ids.length)return unavailable('裝備識別資料無效；未建立委託。');
    const used=new Set(ids);let nextCounter=s._itemId;
    // Mirror addLoot's established wrap/collision rule without touching it or RNG.
    do{nextCounter=(nextCounter%999999999)+1;item.id=`loot-${nextCounter}`;}while(used.has(item.id));
    const price=Math.max(250,4*itemSalePrice(item)),goldAfter=s.hero.gold-price;
    const currentWeapon=JSON.parse(JSON.stringify(s.equipment.weapon));
    // No durable receipt: the existing counter/balance and exact comparison make
    // a successful buy or relevant state change invalidate the previous consent.
    const quoteBasis=JSON.stringify([family,suffix,s.hero.level,s.hero.gold,s._itemId,item,price,currentWeapon,ids]);
    const reason=s.mode!=='town'?'請先回營，再委託武器。'
      :s.wins<1?'完成首次遠征後開放武器委託。'
      :s.pendingLoot.length?'請先領取並整理待領戰利品；委託不會放入待領區。'
      :s.inventory.length>INVENTORY_LIMIT-6?'背包需至少 6 格空位：武器占 1 格，另保留出戰所需 5 格。'
      :goldAfter<0?`金幣不足：還差 ${price-s.hero.gold} 金幣。`:'';
    return {family,suffix,item,price,goldAfter,available:!reason,reason,quoteBasis,currentWeapon};
  } catch { return unavailable('裝備或交易資料無效；未建立委託。'); }
}
function addLoot(s, slot) {
  const item=generateItem(()=>random(s),Math.max(1,s.stage+2),slot);
  const used=new Set([...Object.values(s.equipment),...s.inventory,...s.pendingLoot].map(i=>i.id));
  do{s._itemId=(s._itemId%999999999)+1;item.id=`loot-${s._itemId}`;}while(used.has(item.id));
  // Opt-in affects only this newly generated drop, after the unchanged RNG/ID
  // path. It never sweeps inventory/pending items or bypasses the start guard.
  const sale=s.autoSell===true&&!isGearSetProtected(s,item.id)?safeSaleEntry(item,protectedLootKeepers(s)):null;
  if(sale){
    s.hero.gold+=sale.value;
    event(s,'loot',`自動出售 ${item.name} · +${sale.value} 金幣`,sale.value,item.id);
    log(s,`自動出售：${item.name} · +${sale.value} 金幣；保留同型 ${sale.keeperName}。`);
    return sale;
  }
  if(s.inventory.length<INVENTORY_LIMIT)s.inventory.push(item);else s.pendingLoot.push(item);
  event(s,'loot',`獲得 ${item.name}`,undefined,item.id);log(s,`戰利品：${item.name}`);
}
function gainXp(s, amount) {
  s.hero.xp+=amount;
  while(s.hero.xp>=s.hero.xpNext && s.hero.level<500) {
    s.hero.xp-=s.hero.xpNext;s.hero.level++;s.hero.xpNext=nextXp(s.hero.level);
    for(const key of Object.keys(s.hero.attributes))s.hero.attributes[key]+=2;
    const p=stats(s);s.hero.hp=Math.min(p.maxHp,s.hero.hp+90);s.hero.mp=Math.min(p.maxMp,s.hero.mp+6);
    event(s,'level',`成長至 Lv.${s.hero.level}`,s.hero.level);log(s,`升級！力量、耐久與資源上限提高。`);
  }
}
function defeatEnemy(s, e) {
  s.kills++;s.hero.gold+=4+s.stage*2+(e.boss?15:0);gainXp(s,(e.boss?18:7)+s.stage*2);
  if(!e.boss&&random(s)<.14)addLoot(s);
}
function win(s) {
  s.wins++;s.battle.cleared++;s.unlocked=Math.min(MAX_STAGE,Math.max(s.unlocked,s.stage+1));
  const previous=s.battle.bestTimes[s.stage];if(!previous||s.battle.elapsed<previous)s.battle.bestTimes[s.stage]=round(s.battle.elapsed);
  const sale=addLoot(s,s.wins===1?'weapon':undefined);s.hero.gold+=20+s.stage*5;gainXp(s,35+s.stage*5);
  event(s,'win',`第 ${s.stage} 層突破`,round(s.battle.elapsed));log(s,sale?`第 ${s.stage} 層通關 · ${s.battle.elapsed.toFixed(1)} 秒，保底裝備已自動出售 +${sale.value} 金幣。`:`第 ${s.stage} 層通關 · ${s.battle.elapsed.toFixed(1)} 秒，保底裝備已入背包。`);
  settleExpeditionReport(s,'win');
  protectionSessions.delete(s);counterBudgets.delete(s);recover(s);s._phase='intermission';s._rest=3;s.enemies=[];
  if(finishThenCampSessions.has(s)){finishThenCamp(s);return;}
  if(s.inventory.length>INVENTORY_LIMIT-5||s.pendingLoot.length){s.mode='town';s._phase='idle';log(s,s.autoSell===true?'背包接近滿額，已安全回營；未出售的戰利品均保留。':'背包接近滿額，已安全回營，所有戰利品均保留。');}
}
// Only the live-to-dead damage edge settles a kill. Re-reading a dead enemy,
// another pulse, or an already consumed boundary cannot repeat its rewards.
function settleEnemyDeath(s, enemy, previousHp) {
  if(!(previousHp>0)||enemy.hp!==0)return false;
  clearEnemyStatuses(enemy);defeatEnemy(s,enemy);return true;
}
function finishWave(s, maxHp) {
  if(s.mode!=='battle'||s._phase!=='fight'||!s.enemies.length||s.enemies.some(enemy=>enemy.hp>0))return false;
  if(s.wave===s.totalWaves)win(s);
  else{s.wave++;s.enemies=enemiesFor(s);s.hero.hp=Math.min(maxHp,s.hero.hp+maxHp*.10);s._enemyClock=0;}
  observeExpeditionHealth(s);
  return true;
}
function playerTurn(s) {
  const p=stats(s), target=s.enemies.find(e=>e.hp>0);if(!target)return;
  s._turns++;s.timing.turns++;s.hero.mp=Math.min(p.maxMp,s.hero.mp+.6);
  const policy=POLICIES[validStrategy(s.strategy)?s.strategy:'balanced'];
  const actions=s.battle.actions;let healed=false;
  if(s.hero.hp<p.maxHp*policy.healAt&&s.hero.mp>=6){
    healed=true;s.hero.mp-=6;actions.heals++;actions.manaSpent+=6;
    s.hero.hp=Math.min(p.maxHp,s.hero.hp+p.maxHp*.27);event(s,'heal','自動治癒',Math.round(p.maxHp*.27),'hero');
  }
  // Existing v0.1 support actions do not replace the attack. Policies alter
  // eligibility only: no extra turns, free stats, or altered damage formulas.
  if(policy.potionAt&&s.hero.hp<p.maxHp*policy.potionAt)usePotion(s);
  const protection=protectionView(s);
  if(!healed&&protection.enabled&&protection.unlocked&&!protection.active&&s.hero.mp>=protection.manaCost){
    const session=protectionSessions.get(s)||{expiresAtTick:0,casts:0,damagePrevented:0};
    session.expiresAtTick=s.timing.ticks+15;session.casts++;protectionSessions.set(s,session);
    s.hero.mp-=protection.manaCost;actions.manaSpent+=protection.manaCost;actions.protectionCasts=(actions.protectionCasts||0)+1;
    event(s,'protection','護盾術 · 減傷 25% · 15 Tick',protection.manaCost,'hero');return;
  }
  s.hero.proficiency=round(Math.min(1.2*s.hero.level,s.hero.proficiency+.08));
  const skill=s._turns%policy.cadence===0&&s.hero.mp>=3+policy.reserve;
  actions.attacks++;
  if(skill){s.hero.mp-=3;actions.skills++;actions.manaSpent+=3;}
  const attack=resolveWeaponAttack({attack:p.attack*(skill?2.3:1),crit:p.crit,skill},target,s.equipment.weapon,s.timing.ticks,()=>random(s));
  const previousHp=target.hp;
  target.hp=Math.max(0,target.hp-attack.damage);
  observeExpeditionHit(s,skill?'skill':'basic',previousHp-target.hp,attack.proc?.type);
  event(s,attack.damage?attack.crit?'crit':'hit':attack.outcome==='block'?'block':'miss',`${skill?'破勢斬 · ':''}${attack.damage?attack.crit?'暴擊':'斬擊':'未造成傷害'}`,attack.damage,target.id);
  if(attack.proc?.type==='penetratedArmor')event(s,'proc',`穿透護甲 ${attack.proc.stacks}/3 層 · ${attack.proc.durationTicks} Tick`,attack.proc.stacks,target.id);
  if(attack.proc?.type==='stun')event(s,'proc',`暈眩 · ${attack.proc.durationTicks} Tick`,attack.proc.durationTicks,target.id,'stun');
  if(attack.proc?.type==='bleeding')event(s,'proc',`流血傷口 ${attack.proc.stacks}/5 層 · ${attack.proc.durationTicks} Tick · 每 Tick ${attack.proc.damagePerTick}`,attack.proc.stacks,target.id,'bleed');
  settleEnemyDeath(s,target,previousHp);finishWave(s,p.maxHp);
}
function enemyAttack(s, e) {
  if(s.mode!=='battle'||s._phase!=='fight'||e.hp<=0)return;
  const p=stats(s);
  const attack=resolveAttack({attack:e.attack,crit:.20,critBonus:.2,trackDefense:true},protectionView(s).active?{...p,protection:true}:p,()=>random(s));
  const previousHp=s.hero.hp;
  if(attack.unprotectedDamage!==undefined){const session=protectionSessions.get(s);session.damagePrevented+=Math.max(0,Math.min(previousHp,attack.unprotectedDamage)-Math.min(previousHp,attack.damage));}
  s.hero.hp=Math.max(0,s.hero.hp-attack.damage);event(s,attack.damage?'hit':attack.outcome==='block'?'block':'miss',attack.damage?'承受傷害':'化解攻擊',attack.damage,'hero');
  observeExpeditionLoss(s,previousHp-s.hero.hp,p.maxHp);
  if(s.hero.hp<=0){
    settleExpeditionReport(s,'defeat');
    clearFinishThenCamp(s);protectionSessions.delete(s);counterBudgets.delete(s);s.mode='defeat';s._phase='idle';for(const enemy of s.enemies)clearEnemyStatuses(enemy);
    event(s,'defeat','暫時撤退，成長與戰利品保留');log(s,'挑戰失利。不損失裝備與金幣，回營調整後再試。');
    return false;
  }
  // Only actually reached parry/block checks qualify. A generic glance may be
  // evade-only, and full evade exits before either defensive gate is reached.
  const counter=counterattackView(s);
  if(!counter.eligible||counter.remainingThisTurn<=0||e.hp<=0
    ||!(attack.defenses.parry>0||attack.defenses.block>0))return false;
  if(random(s)>=counter.chance)return false;
  const budget=counterBudgets.get(s)||{turn:s.timing.turns,used:0};budget.used++;counterBudgets.set(s,budget);
  s.battle.actions.counters=(s.battle.actions.counters||0)+1;
  const response=resolveCounterAttack({attack:stats(s).attack},e,s.timing.ticks,()=>random(s));
  const before=e.hp;e.hp=Math.max(0,e.hp-response.damage);
  observeExpeditionHit(s,'counter',before-e.hp);
  event(s,'counter',response.damage?'反擊':'反擊未造成傷害',response.damage,e.id,'counter');
  settleEnemyDeath(s,e,before);
  // True means the captured old-wave action batch is terminal. Replacement
  // enemies must never inherit a pending strike/recovery from that old batch.
  return finishWave(s,stats(s).maxHp);
}
function enemyTurn(s) {
  for(const e of s.enemies){
    if(e.stunRecoveryTurn!==s.timing.turns)delete e.stunRecoveryTurn;
    if(e.hp>0&&!stunStatus(e,s.timing.ticks)&&e.stunRecoveryTurn!==s.timing.turns&&enemyAttack(s,e))break;
    if(s.mode!=='battle')break;
  }
}
function tickEnemyStatuses(s, previousTick) {
  const enemies=s.enemies;
  if(!validTick(previousTick)||!validTick(s.timing.ticks)||s.timing.ticks<=previousTick){
    for(const enemy of enemies){expirePenetratedArmor(enemy,s.timing.ticks);expireStun(enemy,s.timing.ticks);expireBleeding(enemy,s.timing.ticks);}
    return false;
  }
  // Every valid status at the prior observation expires within seven ticks.
  // Bounded replay also prevents malformed clocks from causing an unbounded loop.
  for(const enemy of enemies)expireBleeding(enemy,previousTick);
  const lastTick=Math.min(s.timing.ticks,previousTick+AXE_BLEED_RULES.durationTicks);
  for(let tick=previousTick+1;tick<=lastTick;tick++){
    const maxHp=stats(s).maxHp;
    let killed=false;
    for(const enemy of enemies){
      const wasStunned=stunStatus(enemy,tick-1)?.ticksRemaining>0;
      // View the preceding tick so the seventh future boundary pays its final
      // pulse before removal. A fresh proc never pays on its application tick.
      const bleeding=bleedStatus(enemy,tick-1);
      if(bleeding&&bleeding.damagePerTick>0){
        const previousHp=enemy.hp,damage=Math.min(previousHp,bleeding.damagePerTick);
        enemy.hp=Math.max(0,previousHp-damage);
        observeExpeditionHit(s,'bleed',previousHp-enemy.hp);
        event(s,'bleed',`${enemy.name||'敵人'} · 流血 ${damage}`,damage,enemy.id,'bleed');
        if(settleEnemyDeath(s,enemy,previousHp)){
          killed=true;log(s,`${enemy.name||'敵人'} 因流血倒下 · ${damage} 傷害；擊殺獎勵已結算。`);
        }
      }
      expirePenetratedArmor(enemy,tick);expireStun(enemy,tick);expireBleeding(enemy,tick);
      if(wasStunned&&!enemy.stun&&enemy.hp>0)enemy.stunRecoveryPending=true;
    }
    // Settle only after the captured old-wave batch. New enemies cannot inherit
    // an old pulse, and no new-wave action runs on this terminal boundary.
    if(killed&&finishWave(s,maxHp))return true;
  }
  return false;
}
function recoverStunnedEnemies(s) {
  // Selected action-economy adaptation: deliver before the next player action,
  // then replace only this enemy's ordinary strike in that player-turn interval.
  // Do not reset the shared enemy clock or bank skipped ordinary attacks.
  for(const enemy of s.enemies){
    if(enemy.stunRecoveryPending!==true)continue;
    delete enemy.stunRecoveryPending;
    if(enemy.hp<=0){clearEnemyStatuses(enemy);continue;}
    enemy.stunRecoveryTurn=s.timing.turns+1;
    event(s,'recovery','暈眩結束 · 甦醒反擊',undefined,enemy.id,'stun');
    log(s,`${enemy.name||'敵人'} 暈眩結束，先行甦醒反擊。`);
    if(enemyAttack(s,enemy))return true;
    if(s.mode!=='battle')break;
  }
  return false;
}
export function advance(s, seconds) {
  if(s.mode!=='battle')return s;
  // A one-nanosecond equality window repairs representation error, not cadence.
  // Only the due decision is tolerant: subtract the real period afterwards so
  // a small negative remainder remains debt instead of manufacturing free time.
  const boundarySeconds=1e-9;
  const due=(clock,period)=>Number.isFinite(clock)&&clock>=period-boundarySeconds;
  let remaining=clamp(finite(seconds),0,2);
  while(remaining>0&&s.mode==='battle'){
    const dt=Math.min(.1,remaining);remaining-=dt;
    if(s._phase==='intermission'){
      // Existing phase-crossing overshoot is still discarded. Equality can end
      // this bounded countdown at most one nanosecond early; no per-step time is added.
      s._rest-=dt;if(Number.isFinite(s._rest)&&s._rest<=boundarySeconds){if(s.autoAdvance)s.stage=Math.min(s.unlocked,s.stage+1);start(s);}continue;
    }
    s.battle.elapsed+=dt;
    // TU is session-global, so naive addition drifts beyond the equality window
    // during long online sessions. Kahan carry preserves low-order input bits.
    // The lazy internal carry is not restored by validateSave; start/retreat keep
    // it because they also keep global TU. Reject malformed or oversized carry.
    const addedTU=dt*100/1.05,oldTU=s.timing.tu;
    const carryLimit=Number.EPSILON*Math.max(1,Math.abs(oldTU));
    const carry=Number.isFinite(s._tuCompensation)&&Math.abs(s._tuCompensation)<=carryLimit?s._tuCompensation:0;
    let correctedTU=addedTU-carry,nextTU=oldTU+correctedTU;
    // Even a bounded injected carry must not rewind the observed global clock.
    if(nextTU<oldTU){correctedTU=addedTU;nextTU=oldTU+correctedTU;}
    const nextCarry=(nextTU-oldTU)-correctedTU;
    s._tuCompensation=Number.isFinite(nextCarry)&&Math.abs(nextCarry)<=Number.EPSILON*Math.max(1,Math.abs(nextTU))?nextCarry:0;
    s.timing.tu=nextTU;
    const previousTick=s.timing.ticks,tickPosition=s.timing.tu/100;
    let nextTick=Math.floor(tickPosition);
    // Snap only the derived integer decision, never accumulated TU. Invalid
    // negative/nonfinite/unsafe clocks cannot become valid status boundaries.
    if(tickPosition>=0&&Number.isFinite(tickPosition)&&Number.isSafeInteger(nextTick+1)
      &&nextTick+1-tickPosition<=boundarySeconds/1.05)nextTick++;
    s.timing.ticks=nextTick;
    s._clock+=dt;s._enemyClock+=dt;
    if(s.timing.ticks!==previousTick&&tickEnemyStatuses(s,previousTick))continue;
    if(s.mode!=='battle'||s._phase!=='fight')continue;
    if(due(s._clock,1.05)){
      s._clock-=1.05;resetCounterBudget(s,s.timing.turns+1);
      if(recoverStunnedEnemies(s))continue;
      if(s.mode==='battle'&&s._phase==='fight')playerTurn(s);
    }
    if(s.mode==='battle'&&s._phase==='fight'&&due(s._enemyClock,1.9)){s._enemyClock-=1.9;enemyTurn(s);}
  }
  return s;
}
function refillPending(s){while(s.pendingLoot.length&&s.inventory.length<INVENTORY_LIMIT)s.inventory.push(s.pendingLoot.shift());}
function usePotion(s) {
  const p=stats(s);
  if(s.potions>0&&s.hero.hp<p.maxHp){
    s.potions--;s.battle.actions.potions++;
    s.hero.hp=Math.min(p.maxHp,s.hero.hp+p.maxHp*.4);
    event(s,'heal','補給藥水',Math.round(p.maxHp*.4),'hero');
  }
}
export function act(s, action, payload) {
  if(action==='finishThenCamp'){
    if(typeof payload!=='boolean'||!finishThenCampView(s).available)return s;
    if(!payload){clearFinishThenCamp(s);return s;}
    // Intermission already settled the win. Only leave; never settle it again.
    if(s._phase==='intermission')finishThenCamp(s);
    else finishThenCampSessions.add(s);
    return s;
  }

  if(action==='autoProtection'){if(s.mode==='town'&&typeof payload==='boolean'){if(payload)s.autoProtection=true;else delete s.autoProtection;}return s;}

  if(['saveGearSet','clearGearSet','applyGearSet'].includes(action)){
    if(s.mode!=='town')return s;
    let sets,held;try{sets=readGearSets(s);held=gearHeldItems(s);}catch{return s;}
    if(!held)return s;
    if(action==='applyGearSet'){
      let id,quoteBasis;
      try{
        if(!plainRecord(payload)||Reflect.ownKeys(payload).length!==2)return s;
        const fields=Object.getOwnPropertyDescriptors(payload);
        if(!['id','quoteBasis'].every(key=>fields[key]?.enumerable&&Object.hasOwn(fields[key],'value')))return s;
        id=fields.id.value;quoteBasis=fields.quoteBasis.value;
        if(typeof id!=='string'||!GEAR_SET_IDS.includes(id)||typeof quoteBasis!=='string'||quoteBasis.length>1048576)return s;
      }catch{return s;}
      const preview=previewGearSet(s,id);
      if(!preview.available||preview.quoteBasis!==quoteBasis)return s;
      // Construct the entire replacement before committing. Each changed slot
      // exchanges one owned inventory object for its former equipped object.
      const inventory=[...s.inventory],equipment={...s.equipment};
      for(const slot of SLOTS){
        if(equipment[slot].id===sets[id][slot])continue;
        const index=inventory.findIndex(item=>item.id===sets[id][slot]);
        if(index<0)return s;
        [equipment[slot],inventory[index]]=[inventory[index],equipment[slot]];
      }
      s.inventory=inventory;s.equipment=equipment;recover(s);
      log(s,`已套用${gearSetLabel(id)}；僅更換裝備，能力與戰術不變。`);return s;
    }
    if(typeof payload!=='string'||!GEAR_SET_IDS.includes(payload))return s;
    if(action==='clearGearSet'){
      if(!Object.hasOwn(sets,payload))return s;
      delete sets[payload];if(Object.keys(sets).length)s.gearSets=sets;else delete s.gearSets;
      log(s,`已清除${gearSetLabel(payload)}記錄；裝備仍保留鎖定，未出售或換裝。`);return s;
    }
    const ids=Object.fromEntries(SLOTS.map(slot=>[slot,s.equipment[slot].id]));
    if(sets[payload]&&SLOTS.every(slot=>sets[payload][slot]===ids[slot]))return s;
    // Lock only the three explicitly saved objects. Old preset items remain
    // locked after overwrite so replacing a label never silently permits sales.
    for(const slot of SLOTS)s.equipment[slot].locked=true;
    s.gearSets={...sets,[payload]:ids};
    log(s,`已儲存${gearSetLabel(payload)}並鎖定三件裝備；不儲存能力或戰術。`);return s;
  }

  if(['learnAbility','upgradeAbility','slotAbility','unslotAbility','refundAbility'].includes(action)){
    // Validate the entire allocation before changing it. Exact ID payloads only;
    // refused/no-op commands do not heal, log, draw RNG, or touch any clock/item.
    if(s.mode!=='town'||typeof payload!=='string'||!abilityById.has(payload))return s;
    let allocation;try{allocation=readAbilityAllocation(s);}catch{return s;}
    const ability=abilityById.get(payload),{learned,slotted}=allocation,ranks={...allocation.ranks};
    const currentRank=learnedRank(allocation,payload),known=currentRank>0,active=slotted.includes(payload);
    const spent=allocationCost(allocation),nextRank=abilityRanks.get(payload)[currentRank];
    if(!Number.isInteger(s.hero.level)||s.hero.level<1||s.hero.level>500)return s;
    if(action==='learnAbility'){
      if(known||s.hero.level<ability.minLevel||s.hero.level-spent<ability.apCost)return s;
      learned.push(payload);
    }else if(action==='upgradeAbility'){
      if(!known||!nextRank||s.hero.level<nextRank.minLevel||s.hero.level-spent<nextRank.apCost)return s;
      ranks[payload]=nextRank.rank;
    }else if(action==='slotAbility'){
      if(!known||active||slotted.length>=ABILITY_RULES.majorSlots)return s;
      slotted.push(payload);
    }else if(action==='unslotAbility'){
      if(!active)return s;
      slotted.splice(slotted.indexOf(payload),1);
    }else{
      if(!known)return s;
      learned.splice(learned.indexOf(payload),1);delete ranks[payload];
      if(active)slotted.splice(slotted.indexOf(payload),1);
    }
    if(learned.length)s.abilities={learned,slotted,...(Object.keys(ranks).length?{ranks}:{})};else delete s.abilities;
    recover(s);
    const messages={learnAbility:`已學習 ${ability.label} · 消耗 ${ability.apCost} AP；尚未裝入。`,
      upgradeAbility:`已升級 ${ability.label} 至 ${nextRank?.rank} 階 · 消耗 ${nextRank?.apCost} AP；${active?'維持裝入。':'尚未裝入。'}`,
      slotAbility:`已裝入 ${ability.label}；回營資源已恢復。`,
      unslotAbility:`已移出 ${ability.label}；仍保留學習，AP 未退回。`,
      refundAbility:`已退還 ${ability.label} · ${rankCost(payload,currentRank)} AP；若已裝入亦一併移出。`};
    log(s,messages[action]);return s;
  }
  if(action==='commissionWeapon'){
    let family,quoteBasis,suffix='slaughter';
    try {
      const record=payload&&typeof payload==='object'&&!Array.isArray(payload)&&(Object.getPrototypeOf(payload)===Object.prototype||Object.getPrototypeOf(payload)===null);
      const fields=record?Object.getOwnPropertyDescriptors(payload):{};
      const keys=Reflect.ownKeys(fields),hasSuffix=Object.hasOwn(fields,'suffix');
      if(!record||keys.length!==(hasSuffix?3:2)||!(hasSuffix?['family','suffix','quoteBasis']:['family','quoteBasis']).every(key=>fields[key]?.enumerable&&Object.hasOwn(fields[key],'value'))
        ||typeof fields.family.value!=='string'||(hasSuffix&&typeof fields.suffix.value!=='string')||typeof fields.quoteBasis.value!=='string'||fields.quoteBasis.value.length>131072)throw Error('invalid quote');
      family=fields.family.value;quoteBasis=fields.quoteBasis.value;if(hasSuffix)suffix=fields.suffix.value;
    } catch {log(s,'武器委託取消：確認資料無效；未扣款或交付裝備。');return s;}
    const offer=previewWeaponCommission(s,family,suffix);
    if(!offer.available){log(s,`武器委託取消：${offer.reason}未扣款或交付裝備。`);return s;}
    if(offer.quoteBasis!==quoteBasis){log(s,'武器委託取消：報價或比較裝備已變更；請重新預覽，未扣款或交付裝備。');return s;}
    // All validation precedes this synchronous transaction. Never trust submitted
    // item, price or balance, queue delivery, auto-equip, or invoke auto-sale.
    s.hero.gold=offer.goldAfter;s._itemId=Number(offer.item.id.slice(5));s.inventory.push(offer.item);
    event(s,'loot',`委託完成 · 已鎖定 ${offer.item.name}`,undefined,offer.item.id);
    log(s,`武器委託：${offer.item.name} · -${offer.price} 金幣；已鎖定放入背包，尚未裝備。`);
    return s;
  }
  if(action==='setAutoSell'){
    if(s.mode!=='town'){log(s,'請先回營，再調整自動出售。');return s;}
    if(typeof payload!=='boolean'){log(s,'自動出售設定無效，未變更。');return s;}
    if(payload)s.autoSell=true;else delete s.autoSell;
    log(s,payload?'已開啟安全自動出售：只檢查之後新掉落的低品質裝備；既有背包不變。':'已關閉自動出售；之後掉落保留。');
    return s;
  }
  if(action==='sellSelected'){
    // No externally supplied item/price/total is trusted. Even malformed or stale
    // confirmation is a complete no-op, including logs, timing and RNG.
    let ids,quoteBasis;
    try {
      if(!payload||typeof payload!=='object'||Array.isArray(payload)||![Object.prototype,null].includes(Object.getPrototypeOf(payload)))return s;
      const fields=Object.getOwnPropertyDescriptors(payload),keys=Reflect.ownKeys(payload);
      if(keys.length!==2||!['ids','quoteBasis'].every(key=>fields[key]?.enumerable&&Object.hasOwn(fields[key],'value')))return s;
      ids=selectedSaleIds(fields.ids.value);quoteBasis=fields.quoteBasis.value;
      if(!ids||typeof quoteBasis!=='string'||quoteBasis.length>1048576)return s;
    }catch{return s;}
    const preview=previewSelectedSale(s,ids);
    if(!preview.available||preview.quoteBasis!==quoteBasis)return s;
    const selected=new Set(ids);
    s.hero.gold=preview.goldAfter;s.inventory=s.inventory.filter(item=>!selected.has(item.id));refillPending(s);
    log(s,`勾選出售 ${ids.length} 件裝備 · +${preview.total} 金幣；僅處理本次確認的裝備。`);
    return s;
  }
  if(action==='sellSafe'){
    if(s.mode!=='town'){log(s,'安全出售取消：請先回營；未出售任何裝備。');return s;}
    let ids;
    try {
      const record=payload&&typeof payload==='object'&&!Array.isArray(payload)&&(Object.getPrototypeOf(payload)===Object.prototype||Object.getPrototypeOf(payload)===null);
      const descriptor=record?Object.getOwnPropertyDescriptor(payload,'ids'):null;
      ids=descriptor&&Object.hasOwn(descriptor,'value')&&Reflect.ownKeys(payload).length===1?descriptor.value:null;
      if(!Array.isArray(ids)||!ids.length||ids.length>INVENTORY_LIMIT||ids.some(id=>typeof id!=='string'||!id||id.length>100)||new Set(ids).size!==ids.length)ids=null;
    } catch { ids=null; }
    if(!ids){log(s,'安全出售取消：清單無效、空白或含重複識別碼；未出售任何裝備。');return s;}
    const eligible=new Map(previewSafeSale(s).items.map(item=>[item.id,item]));
    if(ids.some(id=>!eligible.has(id))){log(s,'安全出售取消：清單已變更或裝備不再符合條件；未出售任何裝備，請重新預覽。');return s;}
    // Validate the whole exact set before any gold/item mutation. Requested
    // keepers cannot be candidates, so every witness survives this transaction.
    const requested=new Set(ids),total=ids.reduce((sum,id)=>sum+eligible.get(id).value,0);
    s.hero.gold+=total;s.inventory=s.inventory.filter(item=>!requested.has(item.id));refillPending(s);
    log(s,`安全出售 ${ids.length} 件低品質裝備 · +${total} 金幣；同型保留裝備與鎖定裝備均保留。`);
    return s;
  }
  if(action==='setStrategy'){
    if(s.mode==='town'&&validStrategy(payload))s.strategy=payload;
    return s;
  }
  if(action==='setAutoAdvance'&&typeof payload==='boolean'){s.autoAdvance=payload;return s;}
  if(action==='retreat'&&s.mode==='battle'&&s._phase==='fight')settleExpeditionReport(s,'retreat');
  if(action==='retreat') {clearFinishThenCamp(s);protectionSessions.delete(s);counterBudgets.delete(s);s.mode='town';s.enemies=[];s._phase='idle';s._clock=0;s._enemyClock=0;recover(s);refillPending(s);return s;}
  if(action==='heal'&&s.mode==='battle'&&s._phase==='fight'){usePotion(s);return s;}
  if(s.mode==='battle')return s;
  if(action==='selectStage'&&Number.isInteger(payload)&&payload>=1&&payload<=s.unlocked){s.stage=payload;return s;}
  if(action==='start'){start(s);return s;}
  const item=s.inventory.find(i=>i.id===payload);
  if(action==='lock'&&item){if(isGearSetProtected(s,item.id))return s;item.locked=!item.locked;return s;}
  if(action==='equip'&&item){const old=s.equipment[item.slot];s.inventory.splice(s.inventory.indexOf(item),1,old);s.equipment[item.slot]=item;recover(s);event(s,'loot',`已裝備 ${item.name}`);return s;}
  if(action==='sell'&&item&&!item.locked&&!isGearSetProtected(s,item.id)){s.hero.gold+=Math.max(1,Math.round(item.level*3+item.power));s.inventory.splice(s.inventory.indexOf(item),1);refillPending(s);return s;}
  if(action==='sellCommon'){const sold=s.inventory.filter(i=>!i.locked&&!isGearSetProtected(s,i.id)&&['Crude','Fair','Average'].includes(i.quality));s.hero.gold+=sold.reduce((n,i)=>n+Math.max(1,Math.round(i.level*3+i.power)),0);s.inventory=s.inventory.filter(i=>!sold.includes(i));refillPending(s);log(s,`整理了 ${sold.length} 件普通裝備；鎖定裝備均保留。`);}
  return s;
}
function sanitizeItem(raw, expectedSlot) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||!SLOTS.includes(raw.slot)||(expectedSlot&&raw.slot!==expectedSlot))throw new Error('裝備資料不完整');
  if(typeof raw.id!=='string'||!raw.id||raw.id.length>100||(/^loot-/.test(raw.id)&&!/^loot-\d{1,9}$/.test(raw.id)))throw new Error('裝備識別碼無效');
  if(!QUALITY.includes(raw.quality))throw new Error('裝備品質無效');
  const bonuses={};for(const k of ['attack','defense','hp','crit','evade','block','parry']){if(raw.stats?.[k]!==undefined){if(typeof raw.stats[k]!=='number'||!Number.isFinite(raw.stats[k])||raw.stats[k]<0||raw.stats[k]>(['crit','evade','block'].includes(k)?1:1000000))throw new Error('裝備屬性無效');bonuses[k]=raw.stats[k];}}
  const rolls={};for(const key of Object.keys(bonuses)){if(raw.rolls?.[key]!==undefined)rolls[key]=clamp(finite(raw.rolls[key]),0,200);}
  const weaponFamily=resolveWeaponFamily(raw);
  return {...(raw.slot==='weapon'?{weaponFamily}:{}),...(raw.rolls&&typeof raw.rolls==='object'?{rolls}:{}),...(typeof raw.prefix==='string'?{prefix:text(raw.prefix,'',40)}:{}),...(typeof raw.suffix==='string'?{suffix:text(raw.suffix,'',40)}:{}),id:raw.id,name:text(raw.name,'未知裝備'),slot:raw.slot,quality:text(raw.quality,'Average',24),rarityColor:typeof raw.rarityColor==='string'&&/^#[\da-f]{3,8}$/i.test(raw.rarityColor)?raw.rarityColor:'#aab6c8',level:integer(raw.level,1,1000),roll:clamp(finite(raw.roll),0,500),power:clamp(finite(raw.power),0,1000000),stats:bonuses,locked:raw.locked===true,description:text(raw.description,'',240)};
}
export function validateSave(input) {
  if(!input||typeof input!=='object'||Array.isArray(input)||input.version!==VERSION||!input.hero||!input.equipment||!Array.isArray(input.inventory)||input.inventory.length>INVENTORY_LIMIT)throw new Error('不支援或損壞的存檔');
  const h=input.hero;if(!Number.isInteger(h.level)||h.level<1||h.level>500||!Number.isFinite(h.xp)||h.xp<0||!Number.isFinite(h.gold)||h.gold<0)throw new Error('角色資料無效');
  const s=createGame(input.seed);s.hero.level=h.level;s.hero.xpNext=nextXp(h.level);s.hero.xp=clamp(h.xp,0,s.hero.xpNext-1);s.hero.gold=clamp(h.gold,0,1e12);s.hero.proficiency=clamp(finite(h.proficiency),0,1e6);
  const protectionField=Object.getOwnPropertyDescriptor(input,'autoProtection');
  if(protectionField){if(!protectionField.enumerable||!Object.hasOwn(protectionField,'value')||typeof protectionField.value!=='boolean')throw new Error('自動護盾設定無效；未載入，請保留原存檔。');if(protectionField.value)s.autoProtection=true;}
  else if('autoProtection' in input)throw new Error('自動護盾設定無效；未載入，請保留原存檔。');
  const allocation=readAbilityAllocation(input);
  if(allocation.learned.length)s.abilities=allocation;
  // Rebuild allocated growth rather than trusting imported attribute multipliers.
  for(const k of Object.keys(s.hero.attributes))s.hero.attributes[k]=8+(h.level-1)*2;
  const sanitizeForLoad=(raw,slot)=>{
    // Refuse unknown item/stat/roll fields before the historical whitelist can
    // erase them. No auto-lock can silently become a trusted keeper witness.
    if(hasUnknownSaleMetadata(raw))throw new Error('不支援的裝備欄位或格式，未載入；請保留原存檔。');
    return sanitizeItem(raw,slot);
  };
  s.equipment=Object.fromEntries(SLOTS.map(slot=>[slot,sanitizeForLoad(input.equipment[slot],slot)]));
  s.inventory=input.inventory.map(i=>sanitizeForLoad(i));
  if(input.pendingLoot!==undefined&&(!Array.isArray(input.pendingLoot)||input.pendingLoot.length>8))throw new Error('待領戰利品資料無效');
  s.pendingLoot=(input.pendingLoot||[]).map(i=>sanitizeForLoad(i));
  const items=[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];if(new Set(items.map(i=>i.id)).size!==items.length)throw new Error('重複裝備識別碼');
  const gearSets=readGearSets(input);if(Object.keys(gearSets).length)s.gearSets=gearSets;
  s._itemId=Math.max(integer(input._itemId,0,1e9),...items.map(i=>/^loot-\d+$/.test(i.id)?Number(i.id.slice(5)):0));
  s.unlocked=integer(input.unlocked,1,MAX_STAGE);s.stage=integer(input.stage,1,s.unlocked);s.kills=integer(input.kills,0,1e9);s.wins=integer(input.wins,0,1e9);s.autoAdvance=input.autoAdvance===true;s.strategy=validStrategy(input.strategy)?input.strategy:'balanced';s.battle.cleared=s.wins;
  if(input.autoSell===true)s.autoSell=true;
  for(let n=1;n<=MAX_STAGE;n++){const t=input.battle?.bestTimes?.[n];if(typeof t==='number'&&Number.isFinite(t)&&t>0&&t<1e6)s.battle.bestTimes[n]=t;}
  recover(s);log(s,'存檔已讀取，安全回營；不計離線戰鬥收益。');return s;
}
