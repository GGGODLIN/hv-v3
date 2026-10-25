import { generateItem } from './loot.js';

export const VERSION = 1;
export const MAX_STAGE = 30;
export const INVENTORY_LIMIT = 120;
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
function event(s, type, message, value, target) {
  s._eventId += 1;
  s.events.push({id:s._eventId, type, text:message, ...(value === undefined ? {} : {value}), ...(target ? {target} : {})});
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
export function stats(s) {
  const h=s.hero, a=h.attributes, sum=key=>SLOTS.reduce((v,slot)=>v+finite(s.equipment[slot]?.stats?.[key]),0);
  const attributeMit=Math.min(.8,1-900/(900+a.end+a.agi/2));
  const equipmentMit=1-SLOTS.reduce((left,slot)=>left*(1-clamp(finite(s.equipment[slot]?.stats?.defense)/100,0,.8)),1);
  return {maxHp:Math.round(500+10*h.level+6*a.end+sum('hp')), maxMp:Math.round(10+h.level+a.wis),attack:round(Math.max(1,Math.log(3330+2*a.str+a.dex)/Math.log(1.0003)-27029.81)+sum('attack')), defense:round(sum('defense')),mitigation:1-(1-equipmentMit)*(1-attributeMit),crit:clamp(.05+a.dex*.0015+sum('crit'),0,.8),evade:clamp(.02+a.agi*.001+sum('evade'),0,.5),block:clamp(.04+sum('block'),0,.6)};
}
function recover(s) { const p=stats(s); s.hero.hp=p.maxHp;s.hero.mp=p.maxMp; }

/** Ordered research-derived resolution; coefficients/rates are explicit game adaptations.
 * `trace` exposes every reached phase. No second hidden accuracy check.
 */
export function resolveAttack(attacker, defender, rng = Math.random) {
  const trace=[], roll=()=>clamp(finite(rng(),.5),0,.999999999);
  const result={damage:0,crit:0,outcome:'hit',trace};
  const stop=name=>{result.outcome=name;return result;};
  trace.push('Whiff'); if(chance(attacker.whiff)>0&&roll()<chance(attacker.whiff)) return stop('whiff');
  // Magic pre-samples critical eligibility only to enforce critical/Absorb incompatibility.
  const magicCrit=attacker.magical&&!attacker.weakened ? roll()<chance(attacker.crit) : false;
  trace.push('Absorb'); if(attacker.magical&&!magicCrit&&chance(defender.absorb)>0&&roll()<chance(defender.absorb)) return stop('absorb');
  let factor=1, glancing=false;
  for(const [label,key] of [['Evade','evade'],['Parry','parry'],['Block','block']]) {
    trace.push(label);
    if((attacker.skill&&(key==='evade'||key==='parry'))||(key==='parry'&&(attacker.magical||defender.stunned)))continue;
    const successes=Number(roll()<chance(defender[key]))+Number(roll()<chance(defender[key]));
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
  const defense=Math.max(0,finite(defender.defense));
  const mitigation=clamp(finite(defender.mitigation,defense/100),0,.95);
  const specificMit=attacker.void?0:clamp(finite(defender.specificMit),0,.95);
  trace.push('DamageRoll'); const die=80+Math.floor(roll()*41);
  result.damage=Math.max(0,Math.floor(Math.max(0,finite(attacker.attack))*factor*critFactor*(1-mitigation)*(1-specificMit)*die/100+1e-9));
  result.outcome=result.crit?'crit':factor<1?'glance':'hit';return result;
}
function enemiesFor(s) {
  const stage=s.stage, wave=s.wave, boss=wave===s.totalWaves;
  const names=['灰霧獵犬','碎晶甲蟲','荒野影獸','赤砂守衛'];
  const count=boss?1:wave===1?1:2;
  return Array.from({length:count},(_,i)=>{const hp=Math.round((boss?340:114+wave*15)*Math.pow(1.20,stage-1));return {id:`e-${s.wins}-${stage}-${wave}-${i}`,name:boss?`裂隙守門者 · ${stage}`:names[(stage+wave+i)%names.length],hp,maxHp:hp,attack:round((boss?27:16+wave*1.0)*Math.pow(1.16,stage-1)),defense:round(3+stage*1.3+(boss?3:0)),boss,evade:.025,parry:.02,block:boss?.06:.015,resist:.04};});
}
function start(s) {
  if(s.pendingLoot.length||s.inventory.length>INVENTORY_LIMIT-5){log(s,'背包空間不足，請先整理戰利品再出戰。');return;}
  s.mode='battle';s.wave=1;s.battle.elapsed=0;s.battle.actions=freshActions();s._clock=0;s._enemyClock=0;s._turns=0;s._phase='fight';s._rest=0;s.totalWaves=4;
  recover(s);s.potions=3;s.enemies=enemiesFor(s);log(s,`進入第 ${s.stage} 層。`);
}
function addLoot(s, slot) {
  const item=generateItem(()=>random(s),Math.max(1,s.stage+2),slot);
  const used=new Set([...Object.values(s.equipment),...s.inventory,...s.pendingLoot].map(i=>i.id));
  do{s._itemId=(s._itemId%999999999)+1;item.id=`loot-${s._itemId}`;}while(used.has(item.id));
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
  addLoot(s,s.wins===1?'weapon':undefined);s.hero.gold+=20+s.stage*5;gainXp(s,35+s.stage*5);
  event(s,'win',`第 ${s.stage} 層突破`,round(s.battle.elapsed));log(s,`第 ${s.stage} 層通關 · ${s.battle.elapsed.toFixed(1)} 秒，保底裝備已入背包。`);
  recover(s);s._phase='intermission';s._rest=3;s.enemies=[];
  if(s.inventory.length>INVENTORY_LIMIT-5||s.pendingLoot.length){s.mode='town';s._phase='idle';log(s,'背包接近滿額，已安全回營，所有戰利品均保留。');}
}
function playerTurn(s) {
  const p=stats(s), target=s.enemies.find(e=>e.hp>0);if(!target)return;
  s._turns++;s.timing.turns++;s.hero.proficiency=round(Math.min(1.2*s.hero.level,s.hero.proficiency+.08));s.hero.mp=Math.min(p.maxMp,s.hero.mp+.6);
  const policy=POLICIES[validStrategy(s.strategy)?s.strategy:'balanced'];
  const actions=s.battle.actions;
  if(s.hero.hp<p.maxHp*policy.healAt&&s.hero.mp>=6){
    s.hero.mp-=6;actions.heals++;actions.manaSpent+=6;
    s.hero.hp=Math.min(p.maxHp,s.hero.hp+p.maxHp*.27);event(s,'heal','自動治癒',Math.round(p.maxHp*.27),'hero');
  }
  // Existing v0.1 support actions do not replace the attack. Policies alter
  // eligibility only: no extra turns, free stats, or altered damage formulas.
  if(policy.potionAt&&s.hero.hp<p.maxHp*policy.potionAt)usePotion(s);
  const skill=s._turns%policy.cadence===0&&s.hero.mp>=3+policy.reserve;
  actions.attacks++;
  if(skill){s.hero.mp-=3;actions.skills++;actions.manaSpent+=3;}
  const attack=resolveAttack({attack:p.attack*(skill?2.3:1),crit:p.crit,skill},target,()=>random(s));
  target.hp=Math.max(0,target.hp-attack.damage);
  event(s,attack.damage?attack.crit?'crit':'hit':attack.outcome==='block'?'block':'miss',`${skill?'破勢斬 · ':''}${attack.damage?attack.crit?'暴擊':'斬擊':'未造成傷害'}`,attack.damage,target.id);
  if(target.hp===0)defeatEnemy(s,target);
  if(s.enemies.every(e=>e.hp<=0)){if(s.wave===s.totalWaves)win(s);else{s.wave++;s.enemies=enemiesFor(s);s.hero.hp=Math.min(p.maxHp,s.hero.hp+p.maxHp*.10);s._enemyClock=0;}}
}
function enemyTurn(s) {
  const p=stats(s);
  for(const e of s.enemies.filter(e=>e.hp>0)) {
    const attack=resolveAttack({attack:e.attack,crit:.20,critBonus:.2},{...p,parry:.035},()=>random(s));
    s.hero.hp=Math.max(0,s.hero.hp-attack.damage);event(s,attack.damage?'hit':attack.outcome==='block'?'block':'miss',attack.damage?'承受傷害':'化解攻擊',attack.damage,'hero');
    if(s.hero.hp<=0){s.mode='defeat';s._phase='idle';event(s,'defeat','暫時撤退，成長與戰利品保留');log(s,'挑戰失利。不損失裝備與金幣，回營調整後再試。');break;}
  }
}
export function advance(s, seconds) {
  if(s.mode!=='battle')return s;
  let remaining=clamp(finite(seconds),0,2);
  while(remaining>0&&s.mode==='battle'){
    const dt=Math.min(.1,remaining);remaining-=dt;
    if(s._phase==='intermission'){
      s._rest-=dt;if(s._rest<=0){if(s.autoAdvance)s.stage=Math.min(s.unlocked,s.stage+1);start(s);}continue;
    }
    s.battle.elapsed+=dt;s.timing.tu+=dt*100/1.05;s.timing.ticks=Math.floor(s.timing.tu/100);s._clock+=dt;s._enemyClock+=dt;
    if(s._clock>=1.05){s._clock-=1.05;playerTurn(s);}
    if(s.mode==='battle'&&s._phase==='fight'&&s._enemyClock>=1.9){s._enemyClock-=1.9;enemyTurn(s);}
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
  if(action==='setStrategy'){
    if(s.mode==='town'&&validStrategy(payload))s.strategy=payload;
    return s;
  }
  if(action==='setAutoAdvance'&&typeof payload==='boolean'){s.autoAdvance=payload;return s;}
  if(action==='retreat') {s.mode='town';s.enemies=[];s._phase='idle';s._clock=0;s._enemyClock=0;recover(s);refillPending(s);return s;}
  if(action==='heal'&&s.mode==='battle'&&s._phase==='fight'){usePotion(s);return s;}
  if(s.mode==='battle')return s;
  if(action==='selectStage'&&Number.isInteger(payload)&&payload>=1&&payload<=s.unlocked){s.stage=payload;return s;}
  if(action==='start'){start(s);return s;}
  const item=s.inventory.find(i=>i.id===payload);
  if(action==='lock'&&item){item.locked=!item.locked;return s;}
  if(action==='equip'&&item){const old=s.equipment[item.slot];s.inventory.splice(s.inventory.indexOf(item),1,old);s.equipment[item.slot]=item;recover(s);event(s,'loot',`已裝備 ${item.name}`);return s;}
  if(action==='sell'&&item&&!item.locked){s.hero.gold+=Math.max(1,Math.round(item.level*3+item.power));s.inventory.splice(s.inventory.indexOf(item),1);refillPending(s);return s;}
  if(action==='sellCommon'){const sold=s.inventory.filter(i=>!i.locked&&['Crude','Fair','Average'].includes(i.quality));s.hero.gold+=sold.reduce((n,i)=>n+Math.max(1,Math.round(i.level*3+i.power)),0);s.inventory=s.inventory.filter(i=>!sold.includes(i));refillPending(s);log(s,`整理了 ${sold.length} 件普通裝備；鎖定裝備均保留。`);}
  return s;
}
function sanitizeItem(raw, expectedSlot) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||!SLOTS.includes(raw.slot)||(expectedSlot&&raw.slot!==expectedSlot))throw new Error('裝備資料不完整');
  if(typeof raw.id!=='string'||!raw.id||raw.id.length>100||(/^loot-/.test(raw.id)&&!/^loot-\d{1,9}$/.test(raw.id)))throw new Error('裝備識別碼無效');
  if(!QUALITY.includes(raw.quality))throw new Error('裝備品質無效');
  const bonuses={};for(const k of ['attack','defense','hp','crit','evade','block']){if(raw.stats?.[k]!==undefined){if(typeof raw.stats[k]!=='number'||!Number.isFinite(raw.stats[k])||raw.stats[k]<0||raw.stats[k]>(['crit','evade','block'].includes(k)?1:1000000))throw new Error('裝備屬性無效');bonuses[k]=raw.stats[k];}}
  const rolls={};for(const key of Object.keys(bonuses)){if(raw.rolls?.[key]!==undefined)rolls[key]=clamp(finite(raw.rolls[key]),0,200);}
  return {...(raw.rolls&&typeof raw.rolls==='object'?{rolls}:{}),...(typeof raw.prefix==='string'?{prefix:text(raw.prefix,'',40)}:{}),...(typeof raw.suffix==='string'?{suffix:text(raw.suffix,'',40)}:{}),id:raw.id,name:text(raw.name,'未知裝備'),slot:raw.slot,quality:text(raw.quality,'Average',24),rarityColor:typeof raw.rarityColor==='string'&&/^#[\da-f]{3,8}$/i.test(raw.rarityColor)?raw.rarityColor:'#aab6c8',level:integer(raw.level,1,1000),roll:clamp(finite(raw.roll),0,500),power:clamp(finite(raw.power),0,1000000),stats:bonuses,locked:raw.locked===true,description:text(raw.description,'',240)};
}
export function validateSave(input) {
  if(!input||typeof input!=='object'||Array.isArray(input)||input.version!==VERSION||!input.hero||!input.equipment||!Array.isArray(input.inventory)||input.inventory.length>INVENTORY_LIMIT)throw new Error('不支援或損壞的存檔');
  const h=input.hero;if(!Number.isInteger(h.level)||h.level<1||h.level>500||!Number.isFinite(h.xp)||h.xp<0||!Number.isFinite(h.gold)||h.gold<0)throw new Error('角色資料無效');
  const s=createGame(input.seed);s.hero.level=h.level;s.hero.xpNext=nextXp(h.level);s.hero.xp=clamp(h.xp,0,s.hero.xpNext-1);s.hero.gold=clamp(h.gold,0,1e12);s.hero.proficiency=clamp(finite(h.proficiency),0,1e6);
  // Rebuild allocated growth rather than trusting imported attribute multipliers.
  for(const k of Object.keys(s.hero.attributes))s.hero.attributes[k]=8+(h.level-1)*2;
  s.equipment=Object.fromEntries(SLOTS.map(slot=>[slot,sanitizeItem(input.equipment[slot],slot)]));
  s.inventory=input.inventory.map(i=>sanitizeItem(i));
  if(input.pendingLoot!==undefined&&(!Array.isArray(input.pendingLoot)||input.pendingLoot.length>8))throw new Error('待領戰利品資料無效');
  s.pendingLoot=(input.pendingLoot||[]).map(i=>sanitizeItem(i));
  const items=[...Object.values(s.equipment),...s.inventory,...s.pendingLoot];if(new Set(items.map(i=>i.id)).size!==items.length)throw new Error('重複裝備識別碼');
  s._itemId=Math.max(integer(input._itemId,0,1e9),...items.map(i=>/^loot-\d+$/.test(i.id)?Number(i.id.slice(5)):0));
  s.unlocked=integer(input.unlocked,1,MAX_STAGE);s.stage=integer(input.stage,1,s.unlocked);s.kills=integer(input.kills,0,1e9);s.wins=integer(input.wins,0,1e9);s.autoAdvance=input.autoAdvance===true;s.strategy=validStrategy(input.strategy)?input.strategy:'balanced';s.battle.cleared=s.wins;
  for(let n=1;n<=MAX_STAGE;n++){const t=input.battle?.bestTimes?.[n];if(typeof t==='number'&&Number.isFinite(t)&&t>0&&t<1e6)s.battle.bestTimes[n]=t;}
  recover(s);log(s,'存檔已讀取，安全回營；不計離線戰鬥收益。');return s;
}
