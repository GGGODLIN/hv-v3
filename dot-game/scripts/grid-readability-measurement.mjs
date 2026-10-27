/** Source engine + focus-faithful DOM replay, not browser layout or assistive-tech acceptance. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import * as engine from '../src/engine.js';
import { scoreItem } from '../src/loot.js';
import { fullUI, find, collect } from '../tests/helpers/comparison-focus-harness.mjs';
const sha = x => createHash('sha256').update(x).digest('hex');
const root = new URL('../', import.meta.url);
assert.ok(process.env.BASELINE_DOT_GAME, 'Set BASELINE_DOT_GAME to separately restored exact v032 dot-game');
const base = pathToFileURL(resolve(process.env.BASELINE_DOT_GAME) + '/');
const expected = {
  'src/ui.js':'118b6bd1b5228c550b0244e29736649001258ebac7df317242bbdc917ee52ec7',
  'index.html':'e6b7cf107c495072e8cb9e45923a0232f0f170398871e4e0367aad8d5d43d6c5',
  'style.css':'fe0948b042bc8f867efe1baa8d79f91edfb442fe997aa66096102718873b333b',
  'CHECKPOINT.json':'7772c2dc1535bbfba2f44efcce8b487c47561b13264e315f3341eae14c004684',
};
for (const [path, hash] of Object.entries(expected)) assert.equal(sha(readFileSync(new URL(path, base))), hash, `exact v032 ${path}`);
for (const path of ['src/engine.js','src/loot.js','src/session.js']) assert.deepEqual(readFileSync(new URL(path, root)), readFileSync(new URL(path, base)), `unchanged ${path}`);
const inputs = ['src/ui.js','style.css','index.html','src/engine.js','src/loot.js','src/session.js','tests/helpers/comparison-focus-harness.mjs'];
const hashes = () => Object.fromEntries(inputs.map(p => [p,sha(readFileSync(new URL(p,root)))]));
const beforeHashes = hashes(), s = engine.createGame(42), outcomes = [];
let pulses = 0;
for (let attempt = 1; attempt <= 20; attempt++) {
  for (const slot of ['weapon','armor','accessory']) {
    const best = [s.equipment[slot],...s.inventory.filter(i=>i.slot===slot)].reduce((a,b)=>scoreItem(a)>scoreItem(b)?a:b);
    if (best.id !== s.equipment[slot].id) engine.act(s,'equip',best.id);
  }
  engine.act(s,'start'); assert.equal(s.mode,'battle'); engine.act(s,'finishThenCamp',true);
  let ticks=0; while(s.mode==='battle' && ticks<1000){engine.advance(s,1);ticks++;pulses++;}
  outcomes.push({attempt,pulses:ticks,outcome:engine.expeditionReports(s)[0]?.outcome||'censored'});
  if(s.mode==='battle') break; if(s.mode==='defeat') engine.act(s,'retreat');
}
const earned=engine.validateSave(JSON.parse(JSON.stringify(s)));
const pair=[fullUI(earned,{source:readFileSync(new URL('src/ui.js',base),'utf8'),html:readFileSync(new URL('index.html',base),'utf8')}),fullUI(earned)];
const snapshot=h=>JSON.stringify({state:h.state,calls:h.calls,writes:h.writes});
const results=[];
function same(label){assert.equal(snapshot(pair[0]),snapshot(pair[1]),label);for(const h of pair)assert.deepEqual(h.faults,[]);results.push({label,exactStateRngActionsWrites:true});}
same('unchanged naturally earned save loaded');
const inspectionIds=[earned.inventory[0].id,earned.inventory[Math.floor(earned.inventory.length/2)].id,earned.inventory.at(-1).id];
for(const [where,id] of [...inspectionIds.map(id=>['inventory',id]),...Object.values(earned.equipment).map(i=>['equipment',i.id])]){
  const neutral=pair.map(snapshot);
  for(let repeat=0;repeat<3;repeat++)for(const h of pair){h.card(where,id).focus();await h.card(where,id).click();h.render();assert.equal(h.document.activeElement,h.card(where,id));}
  pair.forEach((h,i)=>assert.equal(snapshot(h),neutral[i]));
  assert.match(collect(pair[1].card(where,id)),/比較中/);
  assert.equal(pair[1].card(where,id).attributes['aria-pressed'],'true');
  same(`repeat exact-ID ${where} comparison ${id}`);
}
const saleId=earned.inventory.find(i=>engine.previewSelectedSale(earned,[i.id]).available).id;
for(const h of pair){
  const check=find(h.card('inventory',saleId).parentElement,n=>n.tag==='input');check.checked=true;await check.emit('change');
  h.dom['slot-filter'].value=earned.inventory.find(i=>i.id===saleId).slot==='weapon'?'armor':'weapon';await h.dom['slot-filter'].emit('change');
  assert.equal(h.card('inventory',saleId),undefined);assert.equal(h.run('selectedSaleIds.size'),1);
  await h.dom['review-selected-sale'].click();assert.equal(h.dom['selected-sale-dialog'].open,true);
  assert.ok(collect(h.dom['selected-sale-list']).includes(saleId));
  h.dom['selected-sale-dialog'].close();
}
same('hidden selected sale remains explicit exact-ID preview; cancel consumes nothing');
for(const h of pair){await h.dom['reset-inventory-filters'].click();h.run('tabOwner=false');h.render();const id=inspectionIds[0];h.card('inventory',id).focus();await h.card('inventory',id).click();assert.equal(h.document.activeElement,h.card('inventory',id));assert.equal(find(h.card('inventory',id).parentElement,n=>n.tag==='input').disabled,true);}
same('readonly comparison keeps exact focus while independent sale stays disabled');
assert.deepEqual(hashes(),beforeHashes);
const output={kind:'v033 source-engine + simulated DOM replay; NOT browser, geometry, native keyboard, accessibility-tree or screen-reader acceptance',baselineCommit:'0cfde1801d288a94ff485cdc1e9a17442456bf89',baselineInputSha256:expected,inputSha256:beforeHashes,runnerSha256:sha(readFileSync(new URL(import.meta.url))),protocol:'Fixed seed42, 20 attempts, stage1 Balanced, highest owned score per slot before start (later tie wins), finish-to-camp, one-second pulses, 1000 pulse cap; no grants/sales/rerolls/binding/IW or extra attempts. Reuse unchanged earned canonical save in both controller versions; manual sale preview is canceled, not committed.',acquisition:{seed:42,attempts:outcomes.length,pulses,wins:outcomes.filter(x=>x.outcome==='win').length,losses:outcomes.filter(x=>x.outcome!=='win'),inventory:earned.inventory.length,canonicalSaveSha256:sha(JSON.stringify(earned)),outcomes},replay:{checks:results.length,inspectionIds,repeatedComparisons:18,saleId,results},limitations:'Focus-faithful test DOM cannot calculate layout/paint or spoken accessibility output. Ordinary harness runs unsupported-Web-Locks mode, so no real browser lock or saved progress is exercised. Synthetic locked/bound/IW/preset/pending cases are covered separately by labeled tests, not claimed as earned in this replay.'};
const dest=process.env.GRID_READABILITY_OUTPUT?pathToFileURL(resolve(process.env.GRID_READABILITY_OUTPUT)):new URL('../docs/measurements/grid-readability.json',import.meta.url);
mkdirSync(dirname(fileURLToPath(dest)),{recursive:true});writeFileSync(dest,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({output:fileURLToPath(dest),sha256:sha(readFileSync(dest)),checks:results.length,acquisition:output.acquisition},null,2));
