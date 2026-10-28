import {beforeManualSaleCap} from './helpers/manual-sale-cap-baseline.mjs';
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
const descendants=node=>[node,...node.children.flatMap(descendants)];
// Independent minimal DOM model: real parentage, disconnected-focus loss,
// actual selector lookup, hidden ancestors and native focusability. No browser.
function harness(initial=fixture()) {
  let document;
  const focusLog=[], faults=[], calls=[], writes=[];
  const dataKey=key=>key.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
  function match(node,selector) {
    if(selector.includes(',')) return selector.split(',').some(part=>match(node,part.trim()));
    if(selector==='dialog:not([open])') return node.tag==='dialog'&&!node.open;
    if(selector.startsWith('#')) return node.id===selector.slice(1);
    if(selector.startsWith('.')) return node.className.split(/\s+/).includes(selector.slice(1));
    if(selector.startsWith('[')) return [...selector.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)].every(([,key,value])=>node.getAttribute(key)!==null&&(value===undefined||node.getAttribute(key)===value));
    return node.tagName.toLowerCase()===selector;
  }
  class Element {
    constructor(tag='div') {this.tag=tag;this.tagName=tag.toUpperCase();this.id='';this.className='';this.children=[];this.parentElement=null;this.dataset={};this.attributes={};this.listeners=new Map();this._text='';this.hidden=false;this.disabled=false;this.open=false;this.value='';this.checked=false;this.tabIndex=['button','input','select','textarea','a','summary'].includes(tag)?0:-1;this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}};}
    get parentNode(){return this.parentElement;}
    get isConnected(){return Boolean(document && document.contains(this));}
    get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
    set textContent(value){this.replaceChildren();this._text=String(value);}
    contains(other){return this===other||this.children.some(child=>child.contains(other));}
    append(...nodes){for(const node of nodes){if(node.parentElement)node.remove();this.children.push(node);node.parentElement=this;}}
    appendChild(node){this.append(node);return node;}
    replaceChildren(...nodes){for(const node of this.children){if(document&&node.contains(document.activeElement))document.activeElement=document.body;node.parentElement=null;}this.children=[];this._text='';this.append(...nodes);}
    remove(){const parent=this.parentElement;if(!parent)return;if(this.contains(document.activeElement))document.activeElement=document.body;parent.children=parent.children.filter(child=>child!==this);this.parentElement=null;}
    setAttribute(key,value){this.attributes[key]=String(value);if(key==='id')this.id=String(value);if(key==='class')this.className=String(value);if(key.startsWith('data-'))this.dataset[dataKey(key)]=String(value);if(key==='hidden')this.hidden=true;if(key==='disabled')this.disabled=true;if(key==='tabindex')this.tabIndex=Number(value);if(key==='value')this.value=String(value);}
    getAttribute(key){if(key==='hidden')return this.hidden?'':null;if(key==='inert')return this.inert?'':null;if(key==='open')return this.open?'':null;if(key==='id')return this.id||null;if(key==='class')return this.className||null;if(key.startsWith('data-'))return this.dataset[dataKey(key)]??null;return this.attributes[key]??null;}
    hasAttribute(key){return this.getAttribute(key)!==null;}
    removeAttribute(key){delete this.attributes[key];if(key==='hidden')this.hidden=false;if(key==='disabled')this.disabled=false;}
    closest(selector){for(let node=this;node;node=node.parentElement)if(match(node,selector))return node;return null;}
    querySelectorAll(selector){return this.children.flatMap(descendants).filter(node=>match(node,selector));}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    visible(){for(let node=this;node;node=node.parentElement)if(node.hidden||node.inert||(node.tag==='dialog'&&!node.open))return false;return this.isConnected;}
    focus(options){if(this.disabled||!this.visible()||this.tabIndex<0&&!this.hasAttribute('tabindex'))return;document.activeElement=this;focusLog.push({node:this,options});}
    addEventListener(type,fn){this.listeners.set(type,[...(this.listeners.get(type)||[]),fn]);}
    async emit(type,event={}){for(const fn of this.listeners.get(type)||[])await fn({target:this,...event});}
    click(){if(!this.disabled)return this.emit('click');}
    showModal(){this.open=true;this._returnFocus=document.activeElement;(this.querySelector('button')||this).focus();}
    close(){if(!this.open)return;this.open=false;this._returnFocus?.focus();this.emit('close');}
    getBoundingClientRect(){return {width:640,height:360,left:0,top:0,right:640,bottom:360};}
    getClientRects(){return this.visible()?[this.getBoundingClientRect()]:[];}
    getContext(){return {};}
  }
  document=new Element('document');document.documentElement=new Element('html');document.append(document.documentElement);document.body=new Element('body');document.documentElement.append(document.body);document.activeElement=document.body;document.createElement=tag=>new Element(tag);document.getElementById=id=>descendants(document).find(node=>node.id===id)||null;
  const stack=[document.body];const voids=new Set(['input','meta','link','img','br','hr','source','wbr','area','base','embed','param','track']);
  const body=html.split(/<body[^>]*>/i)[1].split('</body>')[0].replace(/<!--[\s\S]*?-->/g,'').replace(/<script[\s\S]*?<\/script>/g,'');
  for(const token of body.matchAll(/<([^>]+)>|([^<]+)/g)){
    if(token[2]){stack.at(-1)._text+=token[2];continue;}
    if(token[1].startsWith('/')){stack.pop();continue;}
    const [tag]=token[1].match(/^\S+/);const el=new Element(tag);
    for(const attr of token[1].slice(tag.length).matchAll(/([^\s=]+)(?:="([^"]*)"|='([^']*)')?/g))el.setAttribute(attr[1],attr[2]??attr[3]??'');
    stack.at(-1).append(el);if(!voids.has(tag)&&!token[1].endsWith('/'))stack.push(el);
  }
  const window=new Element('window');window.matchMedia=()=>({matches:true});
  let now=0;
  const context=createContext({...engine,...session,...loot,JSON,window,document,location:{pathname:'/'},performance:{now:()=>now},navigator:{},crypto:{randomUUID:()=> 'focus-independent-audit'},
    previewSelectedSale:(state,ids)=>engine.previewSelectedSale(state,copy(ids)),
    act(state,action,payload){calls.push({action,payload:payload===undefined?undefined:copy(payload)});return engine.act(state,action,payload&&typeof payload==='object'?copy(payload):payload);},
    console:{warn(){},error(...args){faults.push(args);}},confirm:()=>true,
    localStorage:{getItem:key=>key.endsWith('save-v3')?JSON.stringify(initial):null,setItem:(...args)=>writes.push(args)},
    setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},requestAnimationFrame(){},ResizeObserver:class{observe(){}}});
  const run=code=>runInContext(code,context);run(js.replace(/^import .+;\n/gm,''));
  const dom=new Proxy({},{get:(_,id)=>document.getElementById(id)});
  dom['camp-tab-gear'].click();focusLog.length=0;
  return {document,window,dom,run,focusLog,faults,calls,writes,get state(){return run('state');},render(force=true){run(`render(${force})`);},
    inventory(id){return dom['inventory-list'].querySelectorAll('button').find(node=>node.dataset.inventoryId===id);},
    pending(id){return dom['pending-loot-list'].querySelectorAll('button').find(node=>node.dataset.pendingLootId===id);},
    equipment(slot){return dom.equipment.children[Object.keys(this.state.equipment).indexOf(slot)];},
    async import(value){const raw=JSON.stringify(value);await dom['save-file'].emit('change',{target:{value:'save.json',files:[{size:raw.length,text:async()=>raw}]}});},
    async tick(ms=1000){now+=ms;run('pump.tick();render();');},
  };
}
// Supported-save boundary fixtures only; no claim of earned progression.
function fixture(){const s=engine.createGame(42);s.inventory=[{...copy(s.equipment.weapon),id:'audit-bag',name:'同名裝備',locked:false},{...copy(s.equipment.weapon),id:'audit-other',name:'同名裝備',locked:false}];s.pendingLoot=[{...copy(s.equipment.weapon),id:'audit-pending',name:'同名裝備',locked:false}];return engine.validateSave(s);}
const identity=h=>({state:JSON.stringify(h.state),calls:JSON.stringify(h.calls),writes:JSON.stringify(h.writes)});
function liveFocus(h,expected){assert.ok(h.document.activeElement===expected,`active ${h.document.activeElement?.tag}:${h.document.activeElement?.id} expected ${expected?.tag}:${expected?.id}`);assert.ok(expected.isConnected);assert.ok(expected.visible());}

test('v030 audit: independent DOM detaches focused descendants and rejects disconnected/hidden focus',()=>{const h=harness();const old=h.inventory('audit-bag');old.focus();liveFocus(h,old);h.dom['inventory-list'].replaceChildren();assert.ok(h.document.activeElement===h.document.body,`active is ${h.document.activeElement.tag}:${h.document.activeElement.id}`);old.focus();assert.ok(h.document.activeElement===h.document.body,`active is ${h.document.activeElement.tag}:${h.document.activeElement.id}`);h.dom['slot-filter'].parentElement.hidden=true;h.dom['slot-filter'].focus();assert.ok(h.document.activeElement===h.document.body,`active is ${h.document.activeElement.tag}:${h.document.activeElement.id}`);});

for(const type of ['inventory','pending','equipment'])test(`v030 audit: ${type} repeated comparison retains actual replacement, not selected name`,async()=>{const h=harness();const get=()=>type==='equipment'?h.equipment('weapon'):h[type](type==='pending'?'audit-pending':'audit-bag');const before=identity(h);for(let i=0;i<6;i++){const old=get();old.focus();await old.click();assert.equal(old.isConnected,false);liveFocus(h,get());}assert.deepEqual(identity(h),before);assert.equal(h.faults.length,0);});

test('v030 audit: hostile but valid exact IDs never become selectors or name matches',async()=>{const s=fixture();const id='x"] [data-inventory-id="audit-other\\#,: 類';s.inventory[0].id=id;const h=harness(s);const old=h.inventory(id);old.focus();await old.click();liveFocus(h,h.inventory(id));assert.ok(h.document.activeElement!==h.inventory('audit-other'));assert.equal(h.run('selectedId'),id);});

test('v030 audit: pending-to-backpack and backpack-to-equipment preserve exact focused identity',()=>{const h=harness();h.pending('audit-pending').focus();h.run("dispatch('claimPending')");liveFocus(h,h.inventory('audit-pending'));h.inventory('audit-pending').focus();h.run("dispatch('equip','audit-pending')");liveFocus(h,h.equipment('weapon'));assert.equal(h.state.equipment.weapon.id,'audit-pending');});

test('v030 audit: removed focused comparison gets visible fallback, not identical-name substitute',()=>{const h=harness();h.inventory('audit-bag').focus();h.run("dispatch('sell','audit-bag')");assert.equal(h.inventory('audit-bag'),undefined);liveFocus(h,h.dom['slot-filter']);assert.ok(h.document.activeElement!==h.inventory('audit-other'));});

test('v030 audit: filtered focused comparison falls back without changing selection or game data',async()=>{const h=harness();h.inventory('audit-bag').focus();await h.inventory('audit-bag').click();const before=identity(h);h.dom['slot-filter'].value='armor';h.render();liveFocus(h,h.dom['slot-filter']);assert.equal(h.run('selectedId'),'audit-bag');assert.deepEqual(identity(h),before);});

test('v030 audit: filtering/sorting controls stay focused during comparison redraw',async()=>{const h=harness();await h.inventory('audit-bag').click();for(const id of ['slot-filter','family-filter','investment-filter','sort-select']){h.dom[id].focus();await h.dom[id].emit('change');liveFocus(h,h.dom[id]);}});

test('v030 audit: fake item data on unrelated connected control cannot seize restoration',()=>{const h=harness();const control=h.dom['sort-select'];control.dataset.inventoryId='audit-bag';control.dataset.pendingLootId='audit-pending';control.focus();h.render();liveFocus(h,control);});

test('v030 audit: stale detached callback cannot steal focus from unrelated control',async()=>{const h=harness();const old=h.inventory('audit-bag');h.render();h.dom['sort-select'].focus();await old.emit('click');liveFocus(h,h.dom['sort-select']);assert.equal(h.run('selectedId'),'audit-bag');});

test('v030 audit: automatic combat and readonly updates leave unrelated focus alone',async()=>{const h=harness();await h.inventory('audit-bag').click();h.run("dispatch('claimPending');dispatch('start')");h.dom['retreat-button'].focus();await h.tick();liveFocus(h,h.dom['retreat-button']);h.run('tabOwner=false;');h.dom['settings-toggle'].focus();h.render();liveFocus(h,h.dom['settings-toggle']);});

test('v030 audit: claim/sale/import render work cannot pull unrelated focus to selected comparison',async()=>{const h=harness();await h.inventory('audit-bag').click();h.dom['sort-select'].focus();h.run("dispatch('claimPending')");liveFocus(h,h.dom['sort-select']);h.run("dispatch('sell','audit-bag')");liveFocus(h,h.dom['sort-select']);await h.import(fixture());liveFocus(h,h.dom['sort-select']);assert.equal(h.run('selectedId'),null);});

test('v030 audit: readonly comparison still retains focus and never dispatches mutation',async()=>{const h=harness();h.run('tabOwner=false;render(true);');const before=identity(h);h.inventory('audit-bag').focus();await h.inventory('audit-bag').click();liveFocus(h,h.inventory('audit-bag'));h.pending('audit-pending').focus();await h.pending('audit-pending').click();liveFocus(h,h.pending('audit-pending'));assert.deepEqual(identity(h),before);});

test('v030 audit: camp tab navigation remains focused during unrelated comparison removal',async()=>{const h=harness();h.inventory('audit-bag').focus();await h.dom['camp-tab-battle'].click();liveFocus(h,h.dom['camp-tab-battle']);h.run("dispatch('sell','audit-bag')");liveFocus(h,h.dom['camp-tab-battle']);assert.equal(h.dom['camp-panel-gear'].hidden,true);});

test('v030 audit: engine, RNG/loot and session/save remain exact v029 bytes (v031 changes styles; v051 sale guard reversed for historical hash)',()=>{for(const [path,expected] of Object.entries({'src/engine.js':'020c1717d24c20bd914241b3f30adbc091c5a2a851cec8917dca7fc403f21a6d','src/loot.js':'2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7','src/session.js':'821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a'}))assert.equal(createHash('sha256').update(beforeManualSaleCap(readFileSync(new URL('../'+path,import.meta.url),'utf8'),path)).digest('hex'),expected,path);});


test('v030 audit: unchanged render leaves original node focused without extra focus calls',async()=>{const h=harness();const old=h.inventory('audit-bag');old.focus();await old.click();const current=h.inventory('audit-bag'),count=h.focusLog.length;h.render(false);liveFocus(h,current);assert.equal(h.focusLog.length,count);assert.equal(h.focusLog.at(-1).options?.preventScroll,true);});

test('v030 audit: an unfocused comparison activation never moves unrelated focus',async()=>{const h=harness();h.dom['sort-select'].focus();await h.inventory('audit-bag').click();liveFocus(h,h.dom['sort-select']);assert.equal(h.run('selectedId'),'audit-bag');});

test('v030 audit: hidden or inert former comparison cannot trigger fallback',()=>{for(const property of ['hidden','inert']){const h=harness();h.inventory('audit-bag').focus();h.dom['inventory-list'][property]=true;const count=h.focusLog.length;h.render();assert.ok(h.document.activeElement===h.document.body);assert.equal(h.focusLog.length,count);}});

test('v030 audit: explicit later-render focus has priority over old comparison restoration',async()=>{const h=harness();h.inventory('audit-bag').focus();h.run("const auditOriginalDetail=renderItemDetail;renderItemDetail=function(){auditOriginalDetail();$('sort-select').focus();};");await h.inventory('audit-bag').click();liveFocus(h,h.dom['sort-select']);});

test('v030 audit: removed control uses global visible fallback when inventory filter is hidden',()=>{const h=harness();h.inventory('audit-bag').focus();h.dom['slot-filter'].hidden=true;h.run("dispatch('sell','audit-bag')");liveFocus(h,h.dom['settings-toggle']);});
