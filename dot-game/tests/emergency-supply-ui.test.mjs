import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext, runInContext, runInNewContext} from 'node:vm';
import * as engine from '../src/engine.js';
import * as session from '../src/session.js';
import * as loot from '../src/loot.js';

const js=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
const KEY='hv-v3-dot-stable-save-v3';
const copy=value=>JSON.parse(JSON.stringify(value));
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const collect=el=>[el.textContent,...el.children.map(collect)].join(' ');
const extract=(from,to)=>js.slice(js.indexOf(`function ${from}(`),js.indexOf(`function ${to}(`));

// Production controller and ownership/session code in a source-DOM harness.
// Only browser APIs are simulated; this is not browser or natural-play evidence.
function world(raw=JSON.stringify(engine.createGame(27))) {
  const storage=new Map([[KEY,raw]]),held=new Map(),channels=[],tabs=[],writes=[];
  let serial=0;
  function tab() {
    let document;
    function element(tag='div') {
      const listeners=new Map(),descendants=new Map();
      return {tag,textContent:'',children:[],hidden:false,disabled:false,open:false,checked:false,value:'',dataset:{},attributes:{},
        style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},
        append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;},
        addEventListener(type,fn){listeners.set(type,[...(listeners.get(type)||[]),fn]);},
        async emit(type,event={}){for(const fn of listeners.get(type)||[])await fn({target:this,...event});},
        click(){return this.emit('click');},focus(){document.activeElement=this;},
        setAttribute(key,value){this.attributes[key]=value;},remove(){},
        querySelector(selector){if(!descendants.has(selector))descendants.set(selector,element());return descendants.get(selector);},
        showModal(){this.open=true;},close(){if(this.open){this.open=false;void this.emit('close');}},
        getBoundingClientRect(){return {width:640,height:360,left:0,top:0,right:640,bottom:360};},getContext(){return {};},
      };
    }
    const id=`supply-tab-${++serial}`,dom=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>[match[1],element()]));
    const window=element('window');document=element('document');
    Object.assign(document,{hidden:false,activeElement:null,body:element('body'),getElementById:key=>dom[key],createElement:element,
      querySelectorAll:selector=>selector==='dialog'?Object.entries(dom).filter(([key])=>key.endsWith('-dialog')).map(([,value])=>value):[]});
    window.matchMedia=()=>({matches:true});dom['slot-filter'].value='all';dom['sort-select'].value='new';
    let now=0,confirmations=0;const timers=[],faults=[],calls=[];
    const context=createContext({...engine,...session,...loot,JSON,window,document,
      location:{pathname:'/'},performance:{now:()=>now},crypto:{randomUUID:()=>id},
      console:{warn(){},error(...args){faults.push(args);}},confirm(){confirmations++;return true;},
      act(state,action,payload){calls.push({action,payload});return engine.act(state,action,payload);},
      setTimeout(){return 1;},clearTimeout(){},setInterval(fn){timers.push(fn);return timers.length;},requestAnimationFrame(){},ResizeObserver:class{observe(){}},
      navigator:{locks:{async request(name,options,callback){if(held.has(name))return callback(null);held.set(name,id);try{return await callback({name});}finally{held.delete(name);}}}},
      localStorage:{getItem:key=>storage.get(key)??null,setItem(key,value){storage.set(key,value);if(key===KEY)writes.push({id,raw:value});}},
      BroadcastChannel:class{constructor(name){this.name=name;channels.push(this);}postMessage(data){for(const other of channels)if(other!==this&&other.name===this.name)queueMicrotask(()=>other.onmessage?.({data}));}},
    });
    const run=code=>runInContext(code,context);run(js.replace(/^import .+;\n/gm,''));
    const result={id,dom,window,document,calls,faults,run,
      get state(){return run('state');},get owner(){return run('tabOwner');},get protected(){return run('preventOverwrite');},get confirmations(){return confirmations;},
      render(){run('render(true);');},
      async toggle(checked){dom['emergency-supply'].checked=checked;await dom['emergency-supply'].emit('change');},
      async strategy(value){dom['strategy-select'].value=value;await dom['strategy-select'].emit('change');},
      async import(next){const value=typeof next==='string'?next:JSON.stringify(next);await dom['save-file'].emit('change',{target:{value:'fixture.json',files:[{size:value.length,text:async()=>value}]}});},
      tick(ms=250){now+=ms;for(const fn of timers)fn();},
      async close(){await window.emit('pagehide');await settle();},
    };tabs.push(result);return result;
  }
  return {tab,writes,storage,get raw(){return storage.get(KEY);},async ready(){await settle();},async close(){for(const t of tabs)await t.close();}};
}
async function ready(t,raw){const w=world(raw),h=w.tab();t.after(()=>w.close());await w.ready();return {w,h};}

test('extra supply uses an unchecked native checkbox with truthful bounded adapter rules',()=>{
  const input=html.match(/<input[^>]+id="emergency-supply"[^>]*>/)?.[0];assert.ok(input);assert.match(input,/type="checkbox"/);assert.doesNotMatch(input,/\bchecked\b|tabindex="-1"/);
  assert.match(input,/aria-describedby="emergency-supply-status emergency-supply-rules"/);
  assert.match(html,/aria-labelledby="emergency-supply-heading"/);
  for(const cue of ['均衡／猛攻 · 額外緊急補給','剛好 30% 不使用','可以用到最後 1 瓶','不受此開關控制','每次出征補到 3 瓶','每瓶恢復最大 HP 的 40%','不是原版 HV 藥水公式','不會自動購買'])assert.ok(html.includes(cue),cue);
  assert.match(css,/#emergency-supply:focus-visible/);assert.match(css,/\.emergency-supply-live\[hidden\]/);assert.match(css,/\.emergency-supply-panel \{ min-width: 0/);
  assert.match(html,/v0\.57 · 來源候選/);
});
test('default OFF keeps manual-only wording and repeated renders never spend stock or move focus',async t=>{
  const {h}=await ready(t);const before=JSON.stringify(h.state),toggle=h.dom['emergency-supply'];
  assert.equal(toggle.checked,false);assert.equal(toggle.disabled,false);assert.match(h.dom['strategy-description'].textContent,/藥水手動使用/);assert.equal(h.dom['emergency-supply-live'].hidden,true);
  toggle.focus();for(let i=0;i<15;i++)h.render();assert.equal(h.document.activeElement,toggle);assert.equal(h.dom['emergency-supply'],toggle);assert.equal(JSON.stringify(h.state),before);
  assert.doesNotMatch(extract('renderEmergencySupply','renderProtection'),/act\(|dispatch\(|Math\.random|innerHTML|replaceChildren|focus\(/);
});
test('camp opt-in removes manual-only contradiction and persists through the real dispatcher',async t=>{
  const {w,h}=await ready(t);const before=copy(h.state);await h.toggle(true);
  assert.equal(h.state.emergencySupply,true);assert.equal(h.dom['emergency-supply'].checked,true);assert.equal(JSON.parse(w.raw).emergencySupply,true);
  assert.match(h.dom['strategy-description'].textContent,/額外緊急補給已開啟/);assert.doesNotMatch(h.dom['strategy-description'].textContent,/藥水手動使用/);
  assert.match(h.dom['emergency-supply-status'].textContent,/先依戰術判斷治癒.*低於 30%.*超過 1 瓶/);
  assert.deepEqual(copy(h.state.hero),before.hero);assert.equal(h.state.seed,before.seed);assert.equal(h.state.potions,3);
  await h.strategy('assault');assert.match(h.dom['strategy-description'].textContent,/額外緊急補給已開啟/);
  await h.toggle(false);assert.equal(Object.hasOwn(h.state,'emergencySupply'),false);assert.match(h.dom['strategy-description'].textContent,/藥水手動使用/);
});
test('Sustain disables this control, retains its saved choice, and stale change events cannot mutate it',async t=>{
  const {h}=await ready(t);await h.toggle(true);await h.strategy('sustain');
  assert.equal(h.dom['emergency-supply'].disabled,true);assert.equal(h.dom['emergency-supply'].checked,true);
  assert.match(h.dom['emergency-supply-status'].textContent,/持久戰術不受此開關控制.*可用最後 1 瓶.*保留為開啟/);
  const before=JSON.stringify(h.state),count=h.calls.length;await h.toggle(false);
  assert.equal(JSON.stringify(h.state),before);assert.equal(h.calls.length,count);assert.equal(h.dom['emergency-supply'].checked,true);
  await h.strategy('balanced');assert.equal(h.dom['emergency-supply'].disabled,false);assert.equal(h.dom['emergency-supply'].checked,true);
  await h.toggle(false);await h.strategy('sustain');assert.match(h.dom['emergency-supply-status'].textContent,/仍按既有規則.*保留為關閉/);
});
test('battle, defeat and follower controls reject stale events; ownership loss repaints actual setting',async t=>{
  const {w,h}=await ready(t);const follower=w.tab();await w.ready();assert.equal(follower.owner,false);assert.equal(follower.dom['emergency-supply'].disabled,true);
  await follower.toggle(true);assert.equal(follower.calls.length,0);assert.equal(follower.dom['emergency-supply'].checked,false);assert.match(follower.dom['emergency-supply-status'].textContent,/唯讀分頁/);
  await h.dom['start-button'].click();const before=JSON.stringify(h.state),count=h.calls.length;await h.toggle(true);assert.equal(JSON.stringify(h.state),before);assert.equal(h.calls.length,count);
  // Explicit rendering fixture for a terminal mode; no natural-play claim.
  h.state.mode='defeat';h.render();await h.toggle(true);assert.equal(h.state.emergencySupply,undefined);assert.equal(h.dom['emergency-supply'].disabled,true);
  await h.dom['retreat-button'].click();h.run('pageActive=false;');await h.toggle(true);assert.equal(h.state.emergencySupply,undefined);assert.equal(h.dom['emergency-supply'].checked,false);
});
test('live stock and reserve distinguish current eligibility from the next after-heal decision',async t=>{
  const {h}=await ready(t);await h.toggle(true);await h.dom['start-button'].click();
  // Renderer fixtures deliberately vary health/stock; engine behavior is tested separately.
  h.state.hero.hp=engine.stats(h.state).maxHp*.2;h.render();
  assert.equal(h.dom['emergency-supply-live'].hidden,false);assert.match(h.dom['emergency-supply-live'].textContent,/補給剩 3 瓶.*本場已用 0 瓶.*保留 1 瓶.*先判斷治癒.*不是立即觸發/);
  const before=JSON.stringify(h.state);for(let i=0;i<20;i++)h.render();assert.equal(JSON.stringify(h.state),before);
  h.state.potions=1;h.state.battle.actions.potions=2;h.render();assert.match(h.dom['emergency-supply-live'].textContent,/剩 1 瓶.*已用 2 瓶.*已到保留量.*仍可手動/);
  h.state.potions=0;h.render();assert.match(h.dom['emergency-supply-live'].textContent,/庫存已空.*不會購買/);
  h.state.mode='town';h.render();assert.equal(h.dom['emergency-supply-live'].hidden,true);assert.equal(h.dom['emergency-supply-live'].textContent,'');
});
test('manual use remains available for the reserved last potion and reflects full/empty guards',async t=>{
  const {h}=await ready(t);await h.toggle(true);await h.dom['start-button'].click();assert.equal(h.dom['heal-button'].disabled,true);
  h.state.hero.hp=engine.stats(h.state).maxHp*.2;h.state.potions=1;h.render();assert.equal(h.dom['heal-button'].disabled,false);
  await h.dom['heal-button'].click();assert.equal(h.state.potions,0);assert.equal(h.state.battle.actions.potions,1);assert.equal(h.dom['heal-button'].disabled,true);
  assert.match(h.dom['emergency-supply-live'].textContent,/剩 0 瓶.*已用 1 瓶/);
});
test('Sustain battle wording does not falsely promise a one-potion reserve when this option is OFF',async t=>{
  const {h}=await ready(t);await h.strategy('sustain');await h.dom['start-button'].click();assert.equal(h.state.emergencySupply,undefined);
  assert.match(h.dom['emergency-supply-live'].textContent,/持久既有自動補給.*可用最後 1 瓶.*不受額外補給開關控制/);
  assert.doesNotMatch(h.dom['emergency-supply-live'].textContent,/額外緊急補給關閉；均衡/);
});
test('actual persistence/reload/import follows sparse saved option rather than native checkbox state',async t=>{
  const {w,h}=await ready(t);await h.toggle(true);await h.close();const reloaded=w.tab();await w.ready();assert.equal(reloaded.owner,true);assert.equal(reloaded.dom['emergency-supply'].checked,true);assert.equal(reloaded.state.emergencySupply,true);
  const legacy=engine.createGame(46);await reloaded.import(legacy);assert.equal(reloaded.dom['emergency-supply'].checked,false);assert.equal(Object.hasOwn(JSON.parse(w.raw),'emergencySupply'),false);
  engine.act(legacy,'setEmergencySupply',true);await reloaded.import(legacy);assert.equal(reloaded.dom['emergency-supply'].checked,true);assert.equal(JSON.parse(w.raw).emergencySupply,true);assert.deepEqual(reloaded.faults,[]);
});
test('invalid import and protected startup never replace existing durable bytes',async t=>{
  const {w,h}=await ready(t,'{broken original');assert.equal(h.protected,true);assert.equal(h.owner,true);
  await h.toggle(true);h.tick(5000);assert.equal(w.raw,'{broken original');assert.equal(w.writes.length,0);
  const invalid={...engine.createGame(8),emergencySupply:'true'},before=JSON.stringify(h.state),confirmations=h.confirmations;
  await h.import(invalid);assert.equal(h.confirmations,confirmations);assert.equal(JSON.stringify(h.state),before);assert.equal(w.raw,'{broken original');
  await h.import(engine.createGame(9));assert.equal(h.protected,false);assert.equal(h.dom['emergency-supply'].checked,false);assert.equal(JSON.parse(w.raw).seed,9);
});
test('report describes only recorded opt-in and separates aggregate actual potion count from setting',()=>{
  const base={targetPriority:'front',autoProtection:false,abilities:[],equipment:[]};
  const render=build=>runInNewContext(`${extract('expeditionBuildContext','renderExpeditionReports')} expeditionBuildContext(build)`,{...engine,...loot,build,node:(tag,className='',textContent='')=>({tag,className,textContent,children:[],append(...items){this.children.push(...items);}}),slotNames:{weapon:'武器',armor:'護甲',accessory:'飾品'}});
  assert.doesNotMatch(collect(render(base)),/額外緊急補給/);
  for(const field of [false,'true',null])assert.doesNotMatch(collect(render({...base,emergencySupply:field})),/額外緊急補給/);
  const selected={...base,emergencySupply:true},before=JSON.stringify(selected),text=collect(render(selected));
  assert.match(text,/出發設定：額外緊急補給 ON.*僅均衡／猛攻.*保留 1 瓶手動.*持久仍用既有規則/);
  assert.match(text,/不代表實際喝藥.*實際藥水消耗（含手動／自動）/);assert.equal(JSON.stringify(selected),before);
});
