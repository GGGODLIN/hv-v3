import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame,validateSave,previewWeaponCommission} from '../src/engine.js';
import {fullUI,clone,collect} from './helpers/comparison-focus-harness.mjs';
const source=process.env.COMMISSION_DELTA_AUDIT_SOURCE?readFileSync(process.env.COMMISSION_DELTA_AUDIT_SOURCE,'utf8'):undefined;
function ready(){const s=createGame(1);s.wins=1;s.hero.gold=10000;return s;}
function setup(key,difference){
 const s=ready(),q=previewWeaponCommission(s,'rapier','slaughter');
 s.equipment.weapon.stats[key]=(q.item.stats[key]||0)-difference;
 const loaded=validateSave(clone(s));
 assert.equal(loaded.equipment.weapon.stats[key],s.equipment.weapon.stats[key],'legitimate saved fractional stat must survive validation');
 return fullUI(loaded,{source});
}
function open(h){const before=JSON.stringify(h.state),writes=clone(h.writes),calls=clone(h.calls);h.run("openWeaponCommission('rapier')");assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.writes,writes);assert.deepEqual(h.calls,calls);assert.deepEqual(h.faults,[]);return h.dom['commission-comparison'];}
const labels={attack:'攻擊',crit:'暴擊',parry:'招架值'};
function row(h,key){const table=h.dom['commission-comparison'];return table.children.find(x=>x.children[0]?.textContent===labels[key]);}
function delta(h,key){const r=row(h,key);assert.ok(r,`missing row ${key}: ${collect(h.dom['commission-comparison'])}`);return r.children.at(-1);}
for(const [name,key,difference,expected] of [
 ['small positive flat','attack',.000001,'+<0.0001'],
 ['small negative flat','attack',-.000001,'-<0.0001'],
 ['small positive percentage point','crit',.000001,'+0.0001 百分點'],
 ['small negative percentage point','crit',-.000001,'-0.0001 百分點'],
 ['subprecision percentage point','crit',.00000001,'+<0.0001 百分點'],
 ['ordinary flat','attack',2,'+2'],
 ['ordinary rate','crit',.01,'+1 百分點'],
 ['true zero','attack',0,'—'],
])test(`commission delta audit: ${name}`,()=>{const h=setup(key,difference);open(h);assert.equal(delta(h,key).textContent,expected);assert.equal(delta(h,key).className,`delta ${difference>0?'positive':difference<0?'negative':''}`);assert.equal(delta(h,key).textContent,h.run(`statDeltaText(${JSON.stringify(key)},previewWeaponCommission(state,'rapier','slaughter').item.stats[${JSON.stringify(key)}]-state.equipment.weapon.stats[${JSON.stringify(key)}])`));});
test('commission delta audit: missing stats render finite values without NaN or invented gain',()=>{const h=fullUI(ready(),{source});open(h);const text=collect(h.dom['commission-comparison']);assert.doesNotMatch(text,/NaN|Infinity|undefined/);const defense=h.dom['commission-comparison'].children.find(x=>x.children[0]?.textContent==='防禦');assert.equal(defense.children.at(-1).textContent,'—');});
test('commission delta audit: close and reopen preserve state, quote and displayed tiny change',()=>{const h=setup('crit',-.000001);open(h);const quote=h.run('JSON.stringify(commissionConsent)'),text=collect(h.dom['commission-comparison']);h.run('closeWeaponCommission()');assert.equal(h.dom['commission-dialog'].open,false);open(h);assert.equal(h.run('JSON.stringify(commissionConsent)'),quote);assert.equal(collect(h.dom['commission-comparison']),text);assert.equal(delta(h,'crit').textContent,'-0.0001 百分點');});
test('commission delta audit: exact purchase still debits quoted cost and delivers quoted item without RNG',()=>{const h=setup('attack',.000001),q=previewWeaponCommission(h.state,'rapier','slaughter'),seed=h.state.seed,gold=h.state.hero.gold,gear=clone(h.state.equipment);open(h);h.run('confirmWeaponCommission()');assert.equal(h.state.hero.gold,gold-q.price);assert.deepEqual(clone(h.state.inventory.at(-1)),q.item);assert.equal(h.state.seed,seed);assert.deepEqual(clone(h.state.equipment),gear);assert.equal(h.dom['commission-dialog'].open,false);const after=JSON.stringify(h.state);h.run('confirmWeaponCommission()');assert.equal(JSON.stringify(h.state),after);});
test('commission delta audit: read-only or battle cannot open or buy via forced handler',()=>{for(const mode of ['readonly','battle']){const h=setup('attack',.000001);h.run(mode==='readonly'?'tabOwner=false':"act(state,'start')");const before=JSON.stringify(h.state);h.run("openWeaponCommission('rapier');confirmWeaponCommission()");assert.equal(h.dom['commission-dialog'].open,false);assert.equal(JSON.stringify(h.state),before);}});
test('commission delta audit: changed quote cancels purchase rather than applying stale comparison',()=>{const h=setup('attack',.000001);open(h);h.run('state.hero.gold-=1');const before=JSON.stringify(h.state);h.run('confirmWeaponCommission()');assert.equal(JSON.stringify(h.state),before);assert.match(h.dom['commission-feedback'].textContent,/取消/);});
test('commission delta audit: invalid nonfinite saved stats are rejected before comparison',()=>{for(const bad of [NaN,Infinity,-Infinity,'invalid']){const s=ready();s.equipment.weapon.stats.crit=bad;assert.throws(()=>validateSave(s),/裝備屬性無效|不支援的裝備欄位或格式/);}});
