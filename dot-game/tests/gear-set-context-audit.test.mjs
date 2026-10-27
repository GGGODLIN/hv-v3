import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createContext,runInContext} from 'node:vm';
import * as engine from '../src/engine.js';
import * as session from '../src/session.js';
import * as loot from '../src/loot.js';

const js=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const copy=value=>JSON.parse(JSON.stringify(value));
const text=node=>[node.textContent,...node.children.map(text)].join(' ');
function harness(initial){
  let document;
  function node(tag='div'){
    const listeners=new Map(),descendants=new Map();
    return {tag,className:'',textContent:'',children:[],hidden:false,disabled:false,open:false,value:'',dataset:{},attributes:{},
      style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},
      append(...children){this.children.push(...children);},replaceChildren(...children){this.children=children;},
      addEventListener(type,listener){listeners.set(type,[...(listeners.get(type)||[]),listener]);},
      async emit(type,event={}){for(const listener of listeners.get(type)||[])await listener({target:this,...event});},
      click(){return this.emit('click');},focus(){document.activeElement=this;},
      setAttribute(key,value){this.attributes[key]=value;},remove(){},
      querySelector(selector){if(!descendants.has(selector))descendants.set(selector,node());return descendants.get(selector);},
      showModal(){this.open=true;},close(){this.open=false;},
      getBoundingClientRect(){return {width:640,height:360,left:0,top:0,right:640,bottom:360};},getContext(){return {};}};
  }
  const dom=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>[match[1],node()]));
  const window=node();document=node();
  Object.assign(document,{hidden:false,body:node(),activeElement:null,getElementById:id=>dom[id],createElement:node,
    querySelectorAll:selector=>selector==='dialog'?Object.entries(dom).filter(([id])=>id.endsWith('-dialog')).map(([,el])=>el):[]});
  window.matchMedia=()=>({matches:true});
  const calls=[],faults=[],writes=[];
  const context=createContext({...engine,...session,...loot,JSON,window,document,location:{pathname:'/'},
    previewSelectedSale:(state,ids)=>engine.previewSelectedSale(state,copy(ids)),
    act(state,action,payload){calls.push({action,payload:payload===undefined?undefined:copy(payload)});return engine.act(state,action,payload&&typeof payload==='object'?copy(payload):payload);},
    performance:{now:()=>0},navigator:{},crypto:{randomUUID:()=> 'gear-context-audit'},
    console:{warn(){},error(...args){faults.push(args);}},confirm:()=>true,
    localStorage:{getItem:key=>key.endsWith('save-v3')?JSON.stringify(initial):null,setItem:(...args)=>writes.push(args)},
    setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},requestAnimationFrame(){},ResizeObserver:class{observe(){}}});
  const run=code=>runInContext(code,context);run(js.replace(/^import .+;\n/gm,''));
  return {dom,run,calls,faults,writes,get state(){return run('state');},
    open(){run("requestGearSet('a','apply')");},confirm(){run('confirmGearSet()');},
    render(){run('render(true)');},context(){return text(dom['gear-set-stats']);},
    async import(value){const raw=JSON.stringify(value);await dom['save-file'].emit('change',{target:{value:'save.json',files:[{size:raw.length,text:async()=>raw}]}});}};
}
// These are synthetic UI boundary fixtures, not earned progression evidence.
function fixture(level=30){
  const s=engine.createGame(42);s.hero.level=level;
  s.inventory=[{...s.equipment.weapon,id:'audit-spare',locked:false,stats:{attack:35}}];
  engine.act(s,'saveGearSet','a');engine.act(s,'equip','audit-spare');return s;
}
const policies=s=>copy({strategy:s.strategy,targetPriority:s.targetPriority,autoProtection:s.autoProtection,emergencySupply:s.emergencySupply,abilities:s.abilities});
const itemIds=s=>[...Object.values(s.equipment),...s.inventory,...s.pendingLoot].map(i=>i.id).sort();

test('v029 audit: gameplay and save/session inputs remain exact v028 bytes (v031 intentionally changes styles)',()=>{
  for(const [path,expected] of Object.entries({
    'src/engine.js':'020c1717d24c20bd914241b3f30adbc091c5a2a851cec8917dca7fc403f21a6d',
    'src/loot.js':'2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7',
    'src/session.js':'821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a',
  }))assert.equal(createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),expected,path);
});

test('v029 audit: apply context observes current choices, never the choices at preset save',()=>{
  const s=fixture();const refs=copy(s.gearSets);
  engine.act(s,'setStrategy','assault');engine.act(s,'targetPriority','caster');
  engine.act(s,'autoProtection',true);engine.act(s,'setEmergencySupply',true);
  engine.act(s,'learnAbility','hp-tank');engine.act(s,'upgradeAbility','hp-tank');engine.act(s,'slotAbility','hp-tank');
  engine.act(s,'learnAbility','mp-tank');engine.act(s,'upgradeAbility','mp-tank');
  const h=harness(s),before=copy(h.state);h.open();
  const visible=h.context();
  assert.match(visible,/猛攻/);assert.match(visible,/施法者優先/);assert.match(visible,/Protection.*ON/);
  assert.match(visible,/HP Tank.*Rank 2/);assert.doesNotMatch(visible,/MP Tank.*Rank/);
  assert.match(visible,/目前/);assert.match(visible,/不.*(儲存|記錄)|只.*(裝備|三件)/);
  assert.deepEqual(copy(h.state),before);assert.deepEqual(copy(h.state.gearSets),refs);
  assert.deepEqual(Object.keys(h.state.gearSets.a).sort(),['accessory','armor','weapon']);assert.equal(h.faults.length,0);
});

test('v029 audit: preview, repeated rendering and cancel cannot mutate progress, RNG, AP or policies',()=>{
  const h=harness(fixture()),before=copy(h.state),writes=h.writes.length,calls=h.calls.length;
  h.open();for(let i=0;i<8;i++)h.render();h.run('closeGearSetDialog();confirmGearSet();');
  assert.deepEqual(copy(h.state),before);assert.equal(h.calls.length,calls);assert.equal(h.writes.length,writes);
  assert.equal(h.dom['gear-set-dialog'].open,false);assert.equal(h.dom['gear-set-confirm'].disabled,true);
});

test('v029 audit: locked Protection, empty slots and policy-versus-active status remain explicit',()=>{
  const early=harness(fixture(1));early.open();
  assert.match(early.context(),/Protection OFF/);assert.match(early.context(),/尚未解鎖（Lv\.10）/);
  assert.match(early.context(),/已裝配能力：無/);assert.match(early.context(),/目前不能施放/);
  const s=fixture();engine.act(s,'autoProtection',true);const h=harness(s);h.open();
  assert.match(h.context(),/Protection ON/);assert.match(h.context(),/政策不代表護盾已生效/);
  assert.equal(engine.protectionView(h.state).active,false);assert.match(h.context(),/8 MP.*取代一次攻擊/);
});

test('v029 audit: Sustain distinguishes retained extra-supply preference from its independent last-bottle rule',()=>{
  for(const enabled of [false,true]){
    const s=fixture();engine.act(s,'setStrategy','sustain');engine.act(s,'setEmergencySupply',enabled);
    const h=harness(s),before=copy(h.state);h.open();const visible=h.context();
    assert.match(visible,/目前戰術：持久/);assert.ok(visible.includes(`額外緊急補給 ${enabled?'ON':'OFF'}`));
    assert.match(visible,/目前為持久：額外緊急補給開關不生效/);assert.match(visible,/可以用最後 1 瓶/);
    assert.equal(engine.emergencySupplyView(h.state).effective,false);assert.deepEqual(copy(h.state),before);
  }
});

test('v029 audit: retained context is text-only and absent from overwrite or clear confirmation',()=>{
  const h=harness(fixture());h.open();const context=h.dom['gear-set-stats'].children.find(n=>n.className.includes('gear-set-retained-context'));
  assert.ok(context);const nodes=n=>[n,...n.children.flatMap(nodes)];
  assert.ok(nodes(context).every(n=>!['button','input','select','textarea'].includes(n.tag)));
  for(const kind of ['save','clear']){
    h.run(`closeGearSetDialog();requestGearSet('a','${kind}')`);
    assert.equal(h.dom['gear-set-stats'].children.length,0);
  }
});

for(const [name,action,payload] of [['strategy','setStrategy','assault'],['target','targetPriority','weakest'],['Protection','autoProtection',true],['supply','setEmergencySupply',true]]){
  test(`v029 audit: changed displayed ${name} invalidates confirmation even before render`,()=>{
    const h=harness(fixture());h.open();engine.act(h.state,action,payload);const changed=copy(h.state),calls=h.calls.length;
    h.confirm();assert.deepEqual(copy(h.state),changed);assert.equal(h.calls.length,calls);
    assert.equal(h.dom['gear-set-confirm'].disabled,true);assert.match(h.dom['gear-set-dialog-feedback'].textContent,/取消|重新預覽/);
    for(let i=0;i<3;i++)h.render();h.confirm();assert.deepEqual(copy(h.state),changed);assert.equal(h.calls.length,calls);
    h.run('closeGearSetDialog()');h.open();assert.equal(h.dom['gear-set-confirm'].disabled,false);
    const preserved=policies(h.state),ids=itemIds(h.state);h.confirm();h.confirm();
    assert.equal(h.state.equipment.weapon.id,'starter-weapon');assert.deepEqual(policies(h.state),preserved);assert.deepEqual(itemIds(h.state),ids);
    assert.equal(h.calls.filter(c=>c.action==='applyGearSet').length,1);
  });
}

test('v029 audit: successful whole-gear application preserves current ranks, policies and resource balances',()=>{
  const s=fixture(100);engine.act(s,'learnAbility','one-handed-damage');engine.act(s,'upgradeAbility','one-handed-damage');engine.act(s,'slotAbility','one-handed-damage');
  engine.act(s,'setStrategy','sustain');engine.act(s,'targetPriority','weakest');engine.act(s,'autoProtection',true);engine.act(s,'setEmergencySupply',true);
  const h=harness(s),before=policies(h.state),ids=itemIds(h.state),resources=copy([h.state.seed,h.state.hero.gold,h.state.soulFragments,h.state.worldSeeds,h.state.potions]),ap=engine.abilityView(h.state).spentAp;
  h.open();assert.match(h.context(),/1H Damage.*Rank 2/);h.confirm();
  assert.deepEqual(policies(h.state),before);assert.deepEqual(itemIds(h.state),ids);
  assert.deepEqual(copy([h.state.seed,h.state.hero.gold,h.state.soulFragments,h.state.worldSeeds,h.state.potions]),resources);
  assert.equal(engine.abilityView(h.state).spentAp,ap);assert.equal(h.state.equipment.weapon.id,'starter-weapon');
});

test('v029 audit: ability rank or slot changes cancel the displayed context instead of learning or restoring it',()=>{
  for(const action of ['upgradeAbility','unslotAbility']){
    const s=fixture();engine.act(s,'learnAbility','hp-tank');engine.act(s,'slotAbility','hp-tank');
    const h=harness(s);h.open();engine.act(h.state,action,'hp-tank');const before=copy(h.state);h.render();h.confirm();
    assert.deepEqual(copy(h.state),before);assert.equal(h.calls.filter(c=>c.action==='applyGearSet').length,0);
    assert.equal(h.dom['gear-set-confirm'].disabled,true);
  }
});

test('v029 audit: readonly takeover and successful import clear old consent without changing an imported loadout',async()=>{
  const h=harness(fixture());h.open();h.run('tabOwner=false;render(true)');const before=copy(h.state);h.confirm();
  assert.deepEqual(copy(h.state),before);assert.equal(h.dom['gear-set-confirm'].disabled,true);
  h.run('tabOwner=true;closeGearSetDialog()');h.open();await h.import(engine.createGame(77));const imported=copy(h.state);h.confirm();
  assert.deepEqual(copy(h.state),imported);assert.equal(h.dom['gear-set-dialog'].open,false);
  assert.equal(h.state.gearSets,undefined);assert.equal(h.calls.filter(c=>c.action==='applyGearSet').length,0);
});
