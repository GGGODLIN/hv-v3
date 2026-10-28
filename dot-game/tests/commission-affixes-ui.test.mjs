import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createGame, act, previewWeaponCommission, previewSafeSale, PENETRATED_ARMOR_RULES, CLUB_STUN_RULES, AXE_BLEED_RULES } from '../src/engine.js';
import { COMMISSION_WEAPON_FAMILIES, COMMISSION_WEAPON_SUFFIXES, QUALITY_TIERS, createCommissionWeapon, resolveWeaponFamily, describeWeaponTrait } from '../src/loot.js';

const js = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const extract = (first, next) => js.slice(js.indexOf(first), js.indexOf(next));
const controllers = extract('function statDeltaText(', 'function selectedSaleComparison(') + extract('function commissionQuoteSignature(', 'function safeSaleSignature(');
function node(tag, className = '', text = '') {
  return { tag, className, textContent: String(text), open: false, hidden: false, disabled: false, children: [], events: new Map(), attributes: {},
    append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; },
    focus() { this.focused = true; }, setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, listener) { this.events.set(name, [...(this.events.get(name) || []), listener]); },
    emit(name, event = {}) { return Promise.all((this.events.get(name) || []).map(listener => listener({ target: this, ...event }))); },
    showModal() { this.open = true; }, close() { if (!this.open) return; this.open = false; this.emit('close'); },
  };
}
const collect = element => [element.textContent, ...element.children.map(collect)].filter(Boolean).join(' ');
function fixture() {
  const state = createGame(75); state.wins = 1; state.unlocked = 2; state.hero.level = 5; state.hero.gold = 10000;
  return state;
}
function harness(state = fixture(), options = {}) {
  const dom = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], node('div')]));
  const window = node('window'), calls = [], toasts = [];
  // This partial controller harness does not load the independent manual-selection UI.
  const context = { closeGearSetDialog() {}, clearSelectedSale() {}, clearTimeout() {}, state, tabOwner: true, lease: true, window, node, $: id => dom[id], COMMISSION_WEAPON_FAMILIES, COMMISSION_WEAPON_SUFFIXES,
    format: value => String(Math.round(value)), qualityName: quality => QUALITY_TIERS.find(tier => tier.name === quality)?.label || quality,
    itemTypeName: item => COMMISSION_WEAPON_FAMILIES.find(choice => choice.family === resolveWeaponFamily(item))?.label || '武器',
    statNames: { attack: '攻擊', defense: '防禦', hp: '生命', crit: '暴擊', evade: '閃避', block: '格擋', parry: '招架值' }, rateStats: new Set(['crit','evade','block']),
    previewWeaponCommission: options.preview || previewWeaponCommission, resolveWeaponFamily, describeWeaponTrait, PENETRATED_ARMOR_RULES, CLUB_STUN_RULES, AXE_BLEED_RULES,
    claimLease: () => context.tabOwner && context.lease, showToast: message => toasts.push(message),
    render() { runInNewContext('renderWeaponCommission();', context); },
    dispatch(action, payload) {
      calls.push({ action, payload: structuredClone(payload) });
      options.beforeDispatch?.(state);
      if (!options.noop) act(state, action, JSON.parse(JSON.stringify(payload)));
      runInNewContext('reconcileWeaponCommission(); renderWeaponCommission();', context);
      return true;
    },
  };
  runInNewContext(`let counterTimer; let commissionConsent = null; let lastCommissionSignature = ''; let selectedId = null; let selectedSlot = null;
    ${extract('function resetInventoryFilters(', 'function resetInventoryFilterView(')}
    ${extract('function weaponRuleText(', 'function powerComparisonText(')} ${controllers}
    ${extract("$('commission-confirm').addEventListener", "$('motion-toggle').addEventListener")}
    window.addEventListener('popstate', closeWeaponCommission);
    renderWeaponCommission();`, context);
  return { state, dom, context, calls, toasts, window, run: source => runInNewContext(source, context) };
}

const selects = h => h.dom['commission-affixes'].children.map(field => field.children[1]);
const selector = (h, family) => selects(h).find(select => select.id === `commission-suffix-${family}`);

test('commission suffix UI: exactly legal choices, labeled default and separate preview controls', () => {
  const h = harness();
  for (const [family, expected] of Object.entries({ axe: ['slaughter'], club: ['slaughter','balance'], rapier: ['slaughter','balance','nimble'] })) {
    const control = selector(h, family);
    assert.deepEqual(control.children.map(option => option.value), expected);
    assert.equal(control.value, 'slaughter');
    assert.ok(control.attributes['aria-label'].includes('委託詞綴'));
    assert.equal(control.disabled, false);
  }
  assert.equal(h.dom['commission-choices'].children.every(button => button.tag === 'button' && !button.children.some(child => child.tag === 'select')), true);
  assert.equal(h.calls.length, 0);
});

test('commission suffix UI: legal variants show exact seven-stat preview, price and honest tradeoff before locked delivery', () => {
  for (const [family, suffix] of [['club','balance'],['rapier','balance'],['rapier','nimble']]) {
    const h = harness(), before = structuredClone(h.state);
    const control = selector(h, family); control.value = suffix; control.emit('change');
    assert.deepEqual(h.state, before);
    const preview = previewWeaponCommission(h.state, family, suffix);
    h.run(`openWeaponCommission('${family}');`);
    assert.equal(h.dom['commission-item-name'].textContent, preview.item.name);
    assert.equal(h.dom['commission-comparison'].children.length, 8);
    for (const [index,key] of Object.keys(h.context.statNames).entries()) {
      const rate = h.context.rateStats.has(key), value = preview.item.stats[key] || 0;
      assert.equal(h.dom['commission-comparison'].children[index+1].children[1].textContent, `${h.run(`commissionStat(${value}, ${rate})`)}${rate ? '%' : ''}`);
    }
    assert.ok(h.dom['commission-cost'].textContent.includes(`購買後餘額 ${preview.goldAfter}`));
    assert.match(collect(h.dom['commission-trait']), /放棄屠戮/);
    if (suffix === 'nimble') assert.match(collect(h.dom['commission-trait']), /並非等值百分比/);
    assert.deepEqual(h.state, before);
    h.run('confirmWeaponCommission(); confirmWeaponCommission();');
    assert.equal(h.calls.length,1); assert.equal(h.calls[0].payload.suffix,suffix);
    assert.equal(h.state.hero.gold,preview.goldAfter);
    assert.deepEqual(h.state.equipment,before.equipment);
    assert.equal(h.state.inventory.find(item => item.id === preview.item.id).locked,true);
  }
});

test('commission suffix UI: selection closes stale consent; explicit fresh preview required; cancel is free', () => {
  const h = harness(), before = structuredClone(h.state);
  h.run("openWeaponCommission('rapier');");
  const control = selector(h,'rapier'); control.value = 'nimble'; control.emit('change');
  assert.equal(h.dom['commission-dialog'].open,false);
  h.run('confirmWeaponCommission();'); assert.equal(h.calls.length,0); assert.deepEqual(h.state,before);
  h.run("openWeaponCommission('rapier');");
  assert.match(h.dom['commission-item-meta'].textContent,/靈巧（Nimble）/);
  h.dom['commission-dialog'].emit('cancel'); h.run('confirmWeaponCommission();');
  assert.equal(h.calls.length,0); assert.deepEqual(h.state,before);
  h.dom['commission-dialog'].close(); h.run("openWeaponCommission('rapier'); confirmWeaponCommission();");
  assert.equal(h.calls.length,1);
});

test('commission suffix UI: readonly, battle and first-clear gates reject selection and do not mutate saves', () => {
  for (const gate of ['readonly','battle','first-clear']) {
    const h = harness();
    if (gate === 'readonly') h.context.tabOwner = false;
    if (gate === 'battle') h.state.mode = 'battle';
    if (gate === 'first-clear') h.state.wins = 0;
    h.run('renderWeaponCommission();');
    const before = structuredClone(h.state);
    assert.ok(selects(h).every(control => control.disabled));
    h.run("selectCommissionSuffix('rapier','nimble'); openWeaponCommission('rapier'); confirmWeaponCommission();");
    assert.equal(h.run('commissionSuffixSelection.rapier'),'slaughter');
    assert.deepEqual(h.state,before); assert.equal(h.calls.length,0);
  }
});

test('commission suffix UI: focus retained after repaint, invalid choice ignored, independent reload resets preference', () => {
  const h = harness(); h.context.document = { activeElement: { id:'commission-suffix-rapier' } };
  h.run("selectCommissionSuffix('rapier','nimble');");
  assert.equal(selector(h,'rapier').focused,true);
  h.run("selectCommissionSuffix('axe','nimble');");
  assert.equal(selector(h,'axe').value,'slaughter');
  assert.equal(selector(harness(h.state),'rapier').value,'slaughter');
  h.run("openWeaponCommission('rapier');"); h.window.emit('popstate'); h.run('confirmWeaponCommission();');
  assert.equal(h.calls.length,0);
});

test('commission suffix UI: exact suffix quote becomes invalid on inventory, gold or current-weapon changes', () => {
  for (const mutate of [s => { s.hero.gold += 1; }, s => { s.inventory.push({ ...structuredClone(s.equipment.weapon), id: 'added-item' }); }, s => { s.equipment.weapon.stats.parry = 99; }]) {
    const h = harness();
    h.run("selectCommissionSuffix('rapier','nimble'); openWeaponCommission('rapier');");
    mutate(h.state); const before = structuredClone(h.state);
    h.run('confirmWeaponCommission();');
    assert.equal(h.calls.length,0); assert.deepEqual(h.state,before);
    assert.equal(h.dom['commission-confirm'].disabled,true);
    assert.match(h.dom['commission-feedback'].textContent,/取消/);
  }
});

test('commission suffix UI: lease loss and import/navigation cancel pending nondefault purchase', () => {
  for (const lifecycle of ['lease','import','navigation']) {
    const h = harness();
    h.run("selectCommissionSuffix('club','balance'); openWeaponCommission('club');");
    const before = structuredClone(h.state);
    if (lifecycle === 'lease') h.context.lease = false;
    if (lifecycle === 'import') h.dom['import-save'].emit('click');
    if (lifecycle === 'navigation') h.window.emit('popstate');
    h.run('confirmWeaponCommission();');
    assert.equal(h.calls.length,0); assert.deepEqual(h.state,before);
  }
});
