import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as engine from '../src/engine.js';
import {generateItem} from '../src/loot.js';
import {fullUI,clone,collect} from './helpers/comparison-focus-harness.mjs';
import {beforeStatSort} from './helpers/stat-sort-baseline.mjs';
const keys=['attack','hp','defense','crit','evade','block','parry'];
function fixture(){const s=engine.createGame(42);s.inventory=['low','high','tie','missing'].map((id,n)=>({id,name:`Sort ${id}`,slot:'armor',quality:'Average',rarityColor:'#aaa',level:1,roll:50,power:10,locked:false,stats:n===3?{}:Object.fromEntries(keys.map(k=>[k,(k==='crit'||k==='evade'||k==='block')?[.01,.02,.02][n]:[1,2,2][n]]))}));return engine.validateSave(s);}
const ids=h=>h.dom['inventory-list'].querySelectorAll('[data-inventory-id]').map(e=>e.dataset.inventoryId);
async function sort(h,key){h.dom['sort-select'].value=key;await h.dom['sort-select'].emit('change');}
for(const key of keys)test(`raw ${key} descending stable newest ties and missing zero`,async()=>{const h=fullUI(fixture()),before=JSON.stringify(h.state),writes=clone(h.writes),calls=clone(h.calls);await sort(h,`stat-${key}`);assert.deepEqual(ids(h),['tie','high','low','missing']);assert.equal(JSON.stringify(h.state),before);assert.deepEqual(h.writes,writes);assert.deepEqual(h.calls,calls);assert.match(h.dom['inventory-filter-status'].textContent,/按裝備.*由高至低.*非 DPS/);assert.ok(h.card('inventory','tie').querySelector('.item-sort-stat'));assert.deepEqual(h.faults,[]);});
test('exact raw rate sort is not rounded display comparison',async()=>{const h=fullUI(fixture());h.run("state.inventory[0].stats.crit=.02001;state.inventory[1].stats.crit=.02002;state.inventory[2].stats.crit=.02000");await sort(h,'stat-crit');assert.deepEqual(ids(h),['high','low','tie','missing']);});
test('stat sort changes neither inspected nor selected-sale item and keeps control focus',async()=>{const h=fullUI(fixture());await h.card('inventory','low').click();h.run("toggleSelectedSale('low',true)");h.dom['sort-select'].focus();await sort(h,'stat-defense');assert.equal(h.run('selectedId'),'low');assert.deepEqual(clone(h.run('[...selectedSaleIds]')),['low']);assert.equal(h.document.activeElement,h.dom['sort-select']);await sort(h,'new');assert.deepEqual(ids(h),['missing','tie','high','low']);assert.equal(h.card('inventory','low').querySelector('.item-sort-stat'),null);});
test('stat sort keeps filters authoritative, does not hide protected loot',async()=>{const h=fullUI(fixture());h.run("state.inventory[1].locked=true");await sort(h,'stat-hp');assert.equal(ids(h).includes('high'),true);h.dom['protection-filter'].value='protected';await h.dom['protection-filter'].emit('change');assert.deepEqual(ids(h),['high']);});
test('stat sorting options expose seven supported actual gear values once',()=>{const h=fullUI(fixture());assert.deepEqual(h.dom['sort-select'].children.map(e=>e.value),['new','power','level','quality',...keys.map(k=>`stat-${k}`)]);});
test('invalid sort never resolves prototype keys or mutates owned data',async()=>{const h=fullUI(fixture()),before=JSON.stringify(h.state);await sort(h,'stat-constructor');assert.deepEqual(ids(h),['missing','tie','high','low']);assert.equal(JSON.stringify(h.state),before);});
test('v064 baseline reproduces absent stat sorting and exact reverse projection preserves its bytes',async()=>{
 const reads=Object.fromEntries(['src/ui.js','index.html','package.json'].map(path=>[path,beforeStatSort(readFileSync(new URL(`../${path}`,import.meta.url),'utf8'),path)]));
 const hashes={'src/ui.js':'163e7307c4d54a2ffbce6b6602caf7b83d83fe07d3a5bd91c07811dbd965ef87','index.html':'44b0cfd31425b1bae3b1413e7ad98196350f5d9bb45c2781bcac43d3a09f83de','package.json':'0265fd38ef3f11ee1af763de9473527f8f44e429150bc187342ef5f2335a820b'};
 for(const [path,source] of Object.entries(reads))assert.equal(createHash('sha256').update(source).digest('hex'),hashes[path]);
 const h=fullUI(fixture(),{source:reads['src/ui.js'],html:reads['index.html']});
 assert.deepEqual(h.dom['sort-select'].children.map(e=>e.value),['new','power','level','quality']);
 await sort(h,'stat-hp');assert.deepEqual(ids(h),['missing','tie','high','low']);
});
