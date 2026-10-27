import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createGame, validateSave, act } from '../src/engine.js';
import { createCommissionWeapon, createSoulboundItem, createItemWorldUpgrade } from '../src/loot.js';
import { fullUI, clone, find, collect } from './helpers/comparison-focus-harness.mjs';

// Independent source/DOM audit. These checks do not emulate browser layout,
// native accessibility trees, scroll/focus paint, physical keyboard or zoom.
const baseline = process.env.HV_GRID_AUDIT_BASELINE;
const sourceRoot = baseline ? resolve(baseline) : new URL('../', import.meta.url);
const read = p => readFileSync(baseline ? resolve(sourceRoot, p) : new URL(p, sourceRoot), 'utf8');
const source = read('src/ui.js'), html = read('index.html'), css = read('style.css');
const ui = state => fullUI(state, { source, html });
const snapshot = h => JSON.stringify({ state: h.state, calls: h.calls, writes: h.writes });
const all = el => [el, ...el.children.flatMap(all)];
function fixture() {
  const s = createGame(42);
  const weapon = {...createCommissionWeapon('rapier', 1, 'nimble'), id: 'readable-rapier', locked: false};
  const iw = createItemWorldUpgrade(createSoulboundItem({...createCommissionWeapon('axe', 1), id: 'readable-iw'}, 1), 1);
  assert.ok(iw);
  s.inventory = [weapon, iw, {...clone(s.equipment.armor), id: 'readable-locked', locked: true}];
  act(s, 'saveGearSet', 'a'); act(s, 'equip', weapon.id);
  s.pendingLoot = [{...createCommissionWeapon('club', 1), id: 'readable-pending', name: '沒有路線字樣的待領物', locked: false}];
  return validateSave(s);
}
const cards = h => [...h.dom.equipment.children, ...h.dom['inventory-list'].children.map(row => row.children[0]).filter(Boolean), ...h.dom['pending-loot-list'].children];
const selected = h => cards(h).filter(card => card.attributes['aria-pressed'] === 'true');

test('readability audit: explicit backpack accessible name includes visible bound and IW1 investment state', () => {
  const h = ui(fixture()), card = h.card('inventory', 'readable-iw');
  assert.match(collect(card), /靈魂綁定/); assert.match(collect(card), /IW1/);
  assert.match(card.attributes['aria-label'], /靈魂綁定/);
  assert.match(card.attributes['aria-label'], /IW1/);
  assert.match(card.attributes['aria-label'], /永久/);
  assert.equal(find(card.parentElement, e => e.tag === 'input').disabled, true);
});
test('readability audit: protected backpack item says gear-set protection rather than only generic locked', () => {
  const h = ui(fixture()), card = h.card('inventory', 'starter-weapon');
  assert.match(collect(card), /配裝/); assert.match(card.attributes['aria-label'], /配裝/);
  assert.equal(find(card.parentElement, e => e.tag === 'input').disabled, true);
});
test('readability audit: pending accessible name includes actual family plus FIFO identity and inspection boundary', () => {
  const h = ui(fixture()), card = h.card('pending', 'readable-pending');
  assert.match(card.attributes['aria-label'], /戰棍/);
  assert.match(card.attributes['aria-label'], /第 1 件待領/);
  assert.match(card.attributes['aria-label'], /ID：readable-pending/);
  assert.match(card.attributes['aria-label'], /僅查看比較/);
  assert.equal(find(card, e => e.tag === 'input'), undefined);
});
for (const [where, id] of [['inventory', 'readable-iw'], ['equipment', 'readable-rapier'], ['pending', 'readable-pending']]) {
  test(`readability audit: ${where} comparison gets readable non-color state and repeated exact-ID focus without mutation`, async () => {
    const h = ui(fixture()), before = snapshot(h);
    for (let count = 0; count < 3; count++) {
      const old = h.card(where, id); old.focus(); await old.click(); h.render();
      const card = h.card(where, id);
      assert.equal(h.document.activeElement, card); assert.equal(card.attributes['aria-pressed'], 'true');
      assert.match(collect(card), /比較中/);
      assert.equal(selected(h).length, 1);
      assert.equal(cards(h).filter(c => /比較中/.test(collect(c))).length, 1);
    }
    assert.equal(h.run('selectedSaleIds.size'), 0); assert.equal(snapshot(h), before);
  });
}
test('readability audit: changing comparison location removes the old visible state without selecting sale', async () => {
  const h = ui(fixture()), before = snapshot(h);
  for (const [where, id] of [['inventory', 'readable-iw'], ['equipment', 'readable-rapier'], ['pending', 'readable-pending'], ['inventory', 'starter-weapon']]) {
    await h.card(where, id).click();
    assert.equal(selected(h).length, 1); assert.equal(selected(h)[0], h.card(where, id));
    const marked = cards(h).filter(c => /比較中/.test(collect(c)));
    assert.equal(marked.length, selected(h).length); assert.ok(marked.every(c => selected(h).includes(c)));
  }
  assert.equal(snapshot(h), before); assert.equal(h.run('selectedSaleIds.size'), 0);
});
test('readability audit: full long CJK/markup-looking name stays one text node and preserves fixed local icon', () => {
  const s = fixture(), item = s.inventory.find(i => i.id === 'readable-locked');
  item.name = '很長的遠征裝備名稱'.repeat(5) + '<img src=x>';
  const h = ui(s), card = h.card('inventory', item.id), actual = h.state.inventory.find(i => i.id === item.id);
  const name = find(card, e => e.tag === 'strong');
  assert.equal(name.textContent, actual.name); assert.equal(name.children.length, 0);
  assert.ok(card.attributes['aria-label'].includes(actual.name));
  assert.equal(all(card).filter(e => e.tag === 'img').length, 1);
  assert.equal(find(card, e => e.tag === 'img').attributes.src, './assets/equipment/armor.svg');
});
test('readability audit: readonly comparison still exposes state without enabling sale or changing writes', async () => {
  const h = ui(fixture()); h.run('tabOwner=false;render(true)'); const before = snapshot(h);
  for (const [where, id] of [['inventory', 'readable-iw'], ['equipment', 'readable-rapier'], ['pending', 'readable-pending']]) {
    const card = h.card(where, id); assert.equal(card.disabled, false); await card.click();
    assert.match(collect(h.card(where, id)), /比較中/);
  }
  assert.ok(h.dom['inventory-list'].children.every(row => find(row, e => e.tag === 'input').disabled));
  assert.equal(snapshot(h), before); assert.equal(h.run('selectedSaleIds.size'), 0);
});

// Minimal source cascade resolver for the explicit outline declarations only.
// It handles actual simple compound selectors, their specificity and active
// width/forced-colors media blocks; it is not a browser CSS/layout engine.
function rules(text, conditions = []) {
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const found = []; let start = 0;
  while (start < text.length) {
    const open = text.indexOf('{', start); if (open < 0) break;
    let depth = 1, end = open + 1;
    for (; end < text.length && depth; end++) { if (text[end] === '{') depth++; else if (text[end] === '}') depth--; }
    const selector = text.slice(start, open).trim(), body = text.slice(open + 1, end - 1); start = end;
    if (selector.startsWith('@media')) found.push(...rules(body, [...conditions, selector]));
    else if (!selector.startsWith('@')) found.push({ selectors: selector.split(',').map(s => s.trim()), body, conditions });
  }
  return found;
}
const parsed = rules(css);
function outlineFor(classes, width, forced) {
  const values = {}, weights = {};
  for (const rule of parsed) {
    if (!rule.conditions.every(c => { const max = /max-width:\s*(\d+)px/.exec(c), min = /min-width:\s*(\d+)px/.exec(c); return (!max || width <= +max[1]) && (!min || width >= +min[1]) && (!c.includes('forced-colors') || forced) && !c.includes('prefers-reduced-motion'); })) continue;
    for (const s of rule.selectors) {
      if (/\s|>|\+|~|\[|#/.test(s) || !/^(?:button)?(?:\.[\w-]+)*(?::focus-visible)?$/.test(s)) continue;
      if ([...s.matchAll(/\.([\w-]+)/g)].some(([, c]) => !classes.includes(c))) continue;
      const weight = [...s.matchAll(/[.:][\w-]+/g)].length * 10 + (s.startsWith('button') ? 1 : 0);
      for (const declaration of rule.body.split(';')) {
        const at = declaration.indexOf(':'); if (at < 0) continue;
        const name = declaration.slice(0, at).trim(), value = declaration.slice(at + 1).trim();
        const add = (key, v) => { if (weight >= (weights[key] ?? -1)) { values[key] = v; weights[key] = weight; } };
        if (name === 'outline') { add('width', parseFloat(value)); add('style', value.split(/\s+/)[1]); add('color', value.split(/\s+/).slice(2).join(' ')); }
        if (name === 'outline-width') add('width', parseFloat(value));
        if (name === 'outline-offset') add('offset', parseFloat(value));
        if (name === 'outline-color') add('color', value);
      }
    }
  }
  return values;
}
for (const forced of [false, true]) for (const width of [320, 680, 768, 1174]) test(`readability audit: focus outline stays inside card border source box at width ${width}, forced colors ${forced}`, () => {
  for (const classes of [['inventory-card'], ['inventory-card', 'pending-loot-card'], ['gear-button']]) for (const isSelected of [false, true]) {
    const result = outlineFor([...classes, ...(isSelected ? ['selected'] : [])], width, forced);
    assert.ok(result.width >= 3, JSON.stringify({ classes, isSelected, result }));
    assert.ok(result.offset + result.width <= 0, `outward ring can clip in scrollport: ${JSON.stringify({ classes, isSelected, result })}`);
    assert.ok(['solid', 'double'].includes(result.style));
    assert.equal(result.color, forced ? 'ButtonText' : '#e4d5b0');
  }
});
