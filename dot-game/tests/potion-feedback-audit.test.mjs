import test from 'node:test';
import assert from 'node:assert/strict';
const game=await import(process.env.POTION_AUDIT_ENGINE_URL||'../src/engine.js');
const {createGame,act,advance,stats}=game;
// Synthetic boundary fixtures. These tests are not browser/natural-play evidence.
function battle(){const s=createGame(42);act(s,'start');return s;}
const potions=s=>s.events.filter(event=>event.type==='heal'&&event.text==='補給藥水');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
for(const missing of [1,.25,.75,51.5])test(`independent potion feedback: capped recovery reports rounded actual HP, deficit ${missing}`,()=>{
 const s=battle(),max=stats(s).maxHp;s.hero.hp=max-missing;
 const before=structuredClone(s);act(s,'heal');
 near(s.hero.hp,max);assert.equal(potions(s).at(-1).value,Math.round(missing));
 assert.equal(s.potions,before.potions-1);assert.equal(s.battle.actions.potions,before.battle.actions.potions+1);
 assert.equal(s.seed,before.seed);assert.equal(s._eventId,before._eventId+1);
 const afterWithoutIntended=structuredClone(s);afterWithoutIntended.hero.hp=before.hero.hp;
 afterWithoutIntended.potions=before.potions;afterWithoutIntended.battle.actions.potions=before.battle.actions.potions;
 afterWithoutIntended.events=before.events;afterWithoutIntended._eventId=before._eventId;
 assert.deepEqual(afterWithoutIntended,before,'only original potion mutation surface plus its event may change');
});
test('independent potion feedback: sufficiently injured hero keeps nominal 40 percent recovery',()=>{
 const s=battle(),max=stats(s).maxHp;s.hero.hp=1;const oldHp=s.hero.hp;act(s,'heal');
 near(s.hero.hp,oldHp+max*.4);assert.equal(potions(s).at(-1).value,Math.round(max*.4));
});
test('independent potion feedback: full HP is a complete no-op',()=>{
 const s=battle(),before=structuredClone(s);act(s,'heal');assert.deepEqual(s,before);
});
test('independent potion feedback: zero supply is a complete no-op',()=>{
 const s=battle();s.hero.hp=1;s.potions=0;const before=structuredClone(s);act(s,'heal');assert.deepEqual(s,before);
});
test('independent potion feedback: repeated capped use consumes only the first potion',()=>{
 const s=battle();s.hero.hp=stats(s).maxHp-1;act(s,'heal');const healed=structuredClone(s);
 for(let i=0;i<10;i++)act(s,'heal');assert.deepEqual(s,healed);assert.equal(potions(s).length,1);
});
for(const mode of ['town','defeat'])test(`independent potion feedback: ${mode} cannot consume supply`,()=>{
 const s=createGame(42);s.mode=mode;s.hero.hp=1;const before=structuredClone(s);act(s,'heal');assert.deepEqual(s,before);
});
test('independent potion feedback: battle intermission cannot consume supply',()=>{
 const s=battle();s._phase='intermission';s.hero.hp=1;const before=structuredClone(s);act(s,'heal');assert.deepEqual(s,before);
});
for(const strategy of ['balanced','assault','sustain'])test(`independent potion feedback: ${strategy} automatic supply reports actual recovery and retains its single action`,()=>{
 const s=createGame(42);act(s,'setStrategy',strategy);act(s,'setEmergencySupply',true);act(s,'start');
 s.enemies=[{id:'safe-audit-target',name:'Synthetic target',hp:1e6,maxHp:1e6,attack:0,defense:0,evade:0,parry:0,block:0}];
 s.hero.mp=0;s.hero.hp=stats(s).maxHp*.1;s._clock=1.05;s._enemyClock=-100;
 const before=s.hero.hp,max=stats(s).maxHp;advance(s,.001);
 assert.equal(potions(s).length,1);assert.equal(s.battle.actions.potions,1);assert.equal(s.potions,2);
 assert.equal(s.battle.actions.heals,0);assert.equal(s.battle.actions.attacks,1);assert.equal(s.timing.turns,1);
 near(s.hero.hp,before+max*.4);assert.equal(potions(s)[0].value,Math.round(s.hero.hp-before));
});
test('independent potion feedback: legal fresh Lv1 uses real starter HP rather than an invented tiny maximum',()=>{
 const s=battle();assert.equal(s.hero.level,1);assert.equal(stats(s).maxHp,575);
 s.hero.hp=574;act(s,'heal');assert.equal(s.hero.hp,575);assert.equal(potions(s).at(-1).value,1);
});
