import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const source = js.slice(js.indexOf('function setupCampNavigation()'), js.indexOf('// Simulation has exactly one clock:'));
const names = ['battle', 'gear', 'growth'];
function harness() {
  const document = { activeElement: null }, elements = {};
  for (const name of names) for (const kind of ['tab', 'panel']) {
    const id = `camp-${kind}-${name}`;
    assert.ok(html.includes(`id="${id}"`), `real DOM target: ${id}`);
    elements[id] = { id, hidden: false, attributes: {}, handlers: {}, tabIndex: 0,
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(type, handler) { this.handlers[type] = handler; },
      focus() { document.activeElement = this; },
    };
  }
  // No state, saving, pump or render supplied: navigation must not depend on them.
  runInNewContext(source, { $: id => elements[id] });
  const tab = name => elements[`camp-tab-${name}`];
  function key(name, value) { let prevented = false; tab(name).handlers.keydown({ key: value, preventDefault() { prevented = true; } }); return prevented; }
  function selected(name) {
    for (const entry of names) {
      assert.equal(tab(entry).attributes['aria-selected'], String(entry === name));
      assert.equal(tab(entry).tabIndex, entry === name ? 0 : -1);
      assert.equal(elements[`camp-panel-${entry}`].hidden, entry !== name);
    }
  }
  return { elements, document, tab, key, selected };
}
test('camp tabs have unique semantic relationships and default battle panel', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.match(html, /role="tablist" aria-label="切換營地工具"/);
  for (const name of names) {
    assert.match(html, new RegExp(`id="camp-tab-${name}" role="tab" aria-selected="${name === 'battle'}" aria-controls="camp-panel-${name}" tabindex="${name === 'battle' ? 0 : -1}"`));
    assert.match(html, new RegExp(`id="camp-panel-${name}" class="camp-tab-panel" role="tabpanel" aria-labelledby="camp-tab-${name}" tabindex="0"${name === 'battle' ? '' : ' hidden'}`));
  }
  harness().selected('battle');
});
test('every real tab binds click and keydown; clicking moves focus out of hidden content', () => {
  const h = harness();
  for (const name of names) {
    assert.equal(typeof h.tab(name).handlers.keydown, 'function');
    h.document.activeElement = { id: 'old-panel-button' };
    h.tab(name).handlers.click(); h.selected(name);
    assert.equal(h.document.activeElement, h.tab(name));
  }
});
test('horizontal arrow keys wrap and activate with a single roving tab stop', () => {
  const h = harness();
  for (const [from, key, to] of [['battle','ArrowLeft','growth'],['growth','ArrowRight','battle'],['battle','ArrowRight','gear'],['gear','ArrowRight','growth'],['growth','ArrowLeft','gear']]) {
    assert.equal(h.key(from, key), true); h.selected(to); assert.equal(h.document.activeElement, h.tab(to));
  }
});
test('Home and End activate boundaries while unrelated keys retain browser defaults', () => {
  const h = harness();
  assert.equal(h.key('battle', 'End'), true); h.selected('growth');
  assert.equal(h.key('growth', 'Home'), true); h.selected('battle');
  for (const key of ['Tab', 'ArrowDown', 'ArrowUp', 'Escape', 'Enter', ' ']) assert.equal(h.key('battle', key), false);
  h.selected('battle');
});
test('selection is transient and independent of readonly, progress, import and battle clocks', () => {
  const h = harness(); h.tab('growth').handlers.click(); h.selected('growth');
  harness().selected('battle');
  assert.doesNotMatch(source, /\b(?:state|prefs|save|dispatch|render|syncSelection|pump|ownership|localStorage|sessionStorage)\b/);
  const timer = js.slice(js.indexOf('// Simulation has exactly one clock:'), js.indexOf('function frame(now)'));
  assert.match(timer, /pump\.tick\(\)/); assert.doesNotMatch(timer, /camp-|tabpanel|panels\[/);
});
test('original panels remain in the intended groups, with all dialogs outside main', () => {
  const groups = Object.fromEntries(names.map((name, i) => {
    const start = html.indexOf(`id="camp-panel-${name}"`);
    const end = i + 1 < names.length ? html.indexOf(`id="camp-panel-${names[i + 1]}"`) : html.indexOf('</main>');
    return [name, html.slice(start, end)];
  }));
  for (const cls of ['counterattack-panel', 'expedition-reports', 'combat-log']) assert.ok(groups.battle.includes(`class="${cls}`));
  for (const cls of ['camp-gear-sets', 'weapon-commission']) assert.ok(groups.gear.includes(`class="${cls}`));
  assert.ok(groups.growth.includes('class="camp-abilities'));
  assert.ok(html.indexOf('id="start-button"') < html.indexOf('class="camp-workspace"'));
  assert.ok(html.indexOf('id="inventory-list"') > html.indexOf('<aside class="loot-panel'));
  assert.ok(html.indexOf('<dialog') > html.indexOf('</main>'));
});
test('hidden panels have display:none and focus outline styles', () => {
  assert.match(css, /\.camp-tab-panel\[hidden\]\s*\{\s*display:\s*none/);
  assert.match(css, /\.camp-tab-panel:focus-visible\s*\{[^}]*outline:/);
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
});
