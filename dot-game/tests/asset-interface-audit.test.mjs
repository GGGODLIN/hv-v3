import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createGame, validateSave } from '../src/engine.js';
import { createCommissionWeapon, createSoulboundItem, createItemWorldUpgrade } from '../src/loot.js';
import { fullUI, clone, find, collect } from './helpers/comparison-focus-harness.mjs';

// Independent source/DOM and asset audit. Never browser geometry/paint/a11y-tree evidence.
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root));
const sha = raw => createHash('sha256').update(raw).digest('hex');
const css = read('style.css').toString(), html = read('index.html').toString();
const currentCSS = css.slice(css.indexOf('/* v0.32'));
const image = button => find(button, el => el.tag === 'img');
const snapshot = h => JSON.stringify({ state:h.state, calls:h.calls, writes:h.writes });
function fixture() {
  const s=createGame(42);
  s.inventory=['axe','rapier','club'].map((family,i)=>({...createCommissionWeapon(family,1),id:`audit-${i}`,locked:false}));
  s.inventory.push({...clone(s.equipment.armor),id:'audit-armor',locked:false},{...clone(s.equipment.accessory),id:'audit-accessory',locked:false},{...clone(s.equipment.weapon),id:'audit-unknown',locked:false});
  return validateSave(s);
}
for (const [id,key] of [['audit-0','axe'],['audit-1','rapier'],['audit-2','club'],['audit-armor','armor'],['audit-accessory','accessory'],['audit-unknown','unknown']]) {
  test(`independent asset audit: ${key} maps to the finite local image and keeps readable identity`,()=>{
    const h=fullUI(fixture()), card=h.card('inventory',id), item=h.state.inventory.find(i=>i.id===id), img=image(card);
    assert.equal(img.attributes.src,`./assets/equipment/${key}.svg`);
    assert.equal(img.attributes.alt,''); assert.equal(img.parentElement.attributes['aria-hidden'],'true');
    assert.equal(img.attributes.width,'64'); assert.equal(img.attributes.height,'64');
    assert.ok(collect(card).includes(item.name)); assert.ok(collect(card).includes(`Lv.${item.level}`));
    assert.ok(card.attributes['aria-label'].includes(item.name)); assert.ok(card.attributes['aria-label'].includes('等級'));
  });
}
test('independent asset audit: renamed markup stays text and cannot choose the image URL',()=>{
  const s=fixture(); s.inventory[0].name='<img src=x onerror=evil()>刺劍';
  const h=fullUI(s), card=h.card('inventory','audit-0'), name=find(card,e=>e.tag==='strong');
  assert.equal(name.textContent,s.inventory[0].name); assert.equal(name.children.length,0);
  assert.equal(image(card).attributes.src,'./assets/equipment/axe.svg');
});
test('independent asset audit: icon renders are observational across bag/equipment/pending',async()=>{
  const s=fixture(); s.pendingLoot=[{...clone(s.inventory[0]),id:'audit-pending'}]; const h=fullUI(s), before=snapshot(h);
  for (const [where,id] of [['inventory','audit-0'],['equipment',h.state.equipment.weapon.id],['pending','audit-pending']]) {
    for(let i=0;i<3;i++){ const old=h.card(where,id); old.focus(); await old.click(); h.render(); assert.equal(h.document.activeElement,h.card(where,id)); }
  }
  assert.equal(snapshot(h),before); assert.deepEqual(h.faults,[]);
});
test('independent asset audit: equipped selection exposes native pressed state without selecting a sale',async()=>{
  const h=fullUI(fixture()), id=h.state.equipment.weapon.id, before=snapshot(h);
  assert.equal(h.card('equipment',id).attributes['aria-pressed'],'false');
  await h.card('equipment',id).click(); assert.equal(h.card('equipment',id).attributes['aria-pressed'],'true');
  assert.ok(h.card('equipment',id).className.includes('selected')); assert.equal(h.run('selectedSaleIds.size'),0);
  assert.equal(snapshot(h),before);
});
test('independent asset audit: manual sale is a separate checkbox with full exact-ID accessible name',async()=>{
  const h=fullUI(fixture()), card=h.card('inventory','audit-0'), row=card.parentElement, checkbox=find(row,e=>e.tag==='input');
  assert.equal(checkbox.type,'checkbox'); assert.equal(card.contains(checkbox),false); assert.equal(checkbox.checked,false);
  assert.ok(checkbox.attributes['aria-label'].includes('audit-0')); assert.ok(checkbox.attributes['aria-label'].startsWith('選取出售：'));
  await card.click(); assert.equal(h.run('selectedSaleIds.size'),0);
  checkbox.checked=true; await checkbox.emit('change'); assert.equal(h.run("selectedSaleIds.has('audit-0')"),true);
});
test('independent asset audit: inspect then sale order agrees in source and visual layout',()=>{
  const h=fullUI(fixture()), card=h.card('inventory','audit-0'), row=card.parentElement;
  assert.equal(row.children[0],card); assert.equal(row.children[1].tag,'label');
  assert.match(currentCSS,/\.inventory-entry\s*\{[^}]*flex-direction:\s*column\s*;/);
});
test('independent asset audit: hidden sale selection remains visible in the status and exact preview',async()=>{
  const h=fullUI(fixture()), check=find(h.card('inventory','audit-0').parentElement,e=>e.tag==='input');
  check.checked=true; await check.emit('change'); h.dom['family-filter'].value='club'; await h.dom['family-filter'].emit('change');
  assert.equal(h.card('inventory','audit-0'),undefined); assert.equal(h.run("selectedSaleIds.has('audit-0')"),true);
  assert.match(collect(h.dom['selected-sale-status']),/1/); assert.match(collect(h.dom['selected-sale-status']),/隱藏|篩選外/);
  await h.dom['review-selected-sale'].click(); assert.equal(h.dom['selected-sale-dialog'].open,true);
  assert.ok(collect(h.dom['selected-sale-list']).includes('audit-0'));
});
test('independent asset audit: locked and bound IW1 items retain text and cannot be selected for sale',()=>{
  const s=fixture(); s.inventory[0].locked=true;
  const bound=createSoulboundItem({...s.inventory[1],id:'audit-bound'},1); assert.ok(bound);
  const iw=createItemWorldUpgrade(bound,1); assert.ok(iw); s.inventory[1]=iw;
  const h=fullUI(s);
  for(const id of ['audit-0','audit-bound']) assert.equal(find(h.card('inventory',id).parentElement,e=>e.tag==='input').disabled,true);
  assert.match(collect(h.card('inventory','audit-bound')),/靈魂綁定/); assert.match(collect(h.card('inventory','audit-bound')),/IW1/);
});
test('independent asset audit: read-only inventory keeps comparison but disables manual sale',async()=>{
  const h=fullUI(fixture()); h.run('tabOwner=false;render(true)'); const before=snapshot(h);
  const card=h.card('inventory','audit-0'); assert.equal(card.disabled,false); assert.equal(find(card.parentElement,e=>e.tag==='input').disabled,true);
  await card.click(); assert.equal(h.run('selectedId'),'audit-0'); assert.equal(snapshot(h),before);
});
test('independent asset audit: pending stays FIFO and has no checkbox or equip action',async()=>{
  const s=fixture(); s.pendingLoot=[{...clone(s.inventory[0]),id:'audit-first'},{...clone(s.inventory[1]),id:'audit-second'}];
  const h=fullUI(s),before=snapshot(h); h.dom['family-filter'].value='club'; await h.dom['family-filter'].emit('change');
  assert.deepEqual(h.dom['pending-loot-list'].children.map(e=>e.dataset.pendingLootId),['audit-first','audit-second']);
  assert.equal(find(h.dom['pending-loot-list'],e=>e.tag==='input'),undefined);
  await h.card('pending','audit-second').click();
  assert.equal(find(h.dom['item-detail'],e=>e.tag==='button'&&/換上裝備|出售|預覽靈魂綁定/.test(e.textContent)),undefined);
  assert.match(collect(h.dom['item-detail']),/依取得先後順序/); assert.equal(snapshot(h),before);
});
test('independent asset audit: comparison is immediately after inventory and before sale workbench',()=>{
  const h=fullUI(), list=h.dom['inventory-list'], detail=h.dom['item-detail'], children=list.parentElement.children;
  assert.equal(children[children.indexOf(list)+1],detail);
  assert.ok(children.indexOf(detail)<children.indexOf(find(list.parentElement,e=>e.className==='selected-sale-tools')));
  assert.match(collect(detail),/選售請用獨立勾選框/);
});
test('independent asset audit: stat header has no fake stat row and signed deltas remain text',async()=>{
  const h=fullUI(fixture()); await h.card('inventory','audit-0').click();
  const table=find(h.dom['item-detail'],e=>e.className==='compare-table');
  assert.equal(table.children[0].className,'compare-heading'); assert.match(collect(table.children[0]),/屬性.*現穿 → 選取.*比現穿/);
  assert.ok(table.children.slice(1).every(e=>e.className==='compare-row'));
  assert.ok(table.children.slice(1).some(e=>/^[+−-]/.test(e.children[2].textContent)));
});
test('independent asset audit: Kenney recolors reproduce exactly from preserved originals',()=>{
  const p=JSON.parse(read('assets/kenney-ui/PROVENANCE.json'));
  assert.equal(p.license,'CC0 1.0'); assert.equal(p.source_page,'https://kenney.nl/assets/ui-pack');
  assert.equal(sha(read('assets/kenney-ui/License.txt')),p.license_sha256);
  for(const entry of p.assets){
    const original=read(`assets/kenney-ui/original/${entry.original_package_path.split('/').at(-1)}`);
    assert.equal(sha(original),entry.original_sha256);
    const size=entry.modifications.added_viewBox.split(' ').slice(2);
    let result=original.toString().replace(`<svg width="${size[0]}" height="${size[1]}"`,`<svg width="${size[0]}" height="${size[1]}" viewBox="${entry.modifications.added_viewBox}"`);
    for(const [from,to] of Object.entries(entry.modifications.color_remap)) result=result.split(from).join(to);
    assert.equal(read(entry.path).toString(),result); assert.equal(sha(read(entry.path)),entry.sha256);
  }
});
test('independent asset audit: every SVG is self-contained and all equipment assets use a square viewBox',()=>{
  for(const dir of ['assets/equipment','assets/kenney-ui']) for(const file of readdirSync(new URL(dir+'/',root)).filter(f=>f.endsWith('.svg'))){
    const source=read(`${dir}/${file}`).toString();
    assert.doesNotMatch(source,/<(?:script|foreignObject|image|text|filter|linearGradient|radialGradient)\b/i);
    assert.doesNotMatch(source,/\bon\w+\s*=|(?:href|src)\s*=|url\s*\(/i);
    if(dir.endsWith('equipment'))assert.match(source,/viewBox="0 0 64 64"/);
  }
});
test('independent asset audit: CSS asset URLs exist locally and no runtime remote media/font request is added',()=>{
  for(const [,path] of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)){assert.ok(path.startsWith('./assets/')); assert.ok(read(path).length>0);}
  assert.doesNotMatch(css,/@import|@font-face|https?:\/\//);
  assert.doesNotMatch(html,/<(?:script|link|img)[^>]+(?:src|href)="https?:/);
});
test('independent asset audit: name wrapping, focus treatment, mobile flow and forced-color fallback are explicit source rules',()=>{
  assert.match(currentCSS,/white-space:\s*normal;\s*overflow:\s*visible;\s*text-overflow:\s*clip/);
  assert.match(currentCSS,/outline:\s*3px solid #e4d5b0/);
  assert.match(currentCSS,/@media \(max-width: 1023px\)/); assert.match(currentCSS,/@media \(max-width: 680px\)/);
  assert.match(currentCSS,/@media \(forced-colors: active\)/); assert.match(currentCSS,/border-image:\s*none/);
  assert.doesNotMatch(currentCSS,/position:\s*(?:fixed|sticky)/);
});
