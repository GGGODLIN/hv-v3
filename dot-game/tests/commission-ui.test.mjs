import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { createGame, act, previewWeaponCommission, previewSafeSale, PENETRATED_ARMOR_RULES, CLUB_STUN_RULES, AXE_BLEED_RULES } from '../src/engine.js';
import { COMMISSION_WEAPON_FAMILIES, QUALITY_TIERS, createCommissionWeapon, resolveWeaponFamily, describeWeaponTrait } from '../src/loot.js';

const js = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const extract = (first, next) => js.slice(js.indexOf(first), js.indexOf(next));
const controllers = extract('function commissionQuoteSignature(', 'function safeSaleSignature(');
function node(tag, className = '', text = '') {
  return { tag, className, textContent: String(text), open: false, hidden: false, disabled: false, children: [], events: new Map(), attributes: {},
    append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; },
    setAttribute(name, value) { this.attributes[name] = value; },
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
  const context = { state, tabOwner: true, lease: true, window, node, $: id => dom[id], COMMISSION_WEAPON_FAMILIES,
    format: value => String(Math.round(value)), qualityName: quality => QUALITY_TIERS.find(tier => tier.name === quality)?.label || quality,
    itemTypeName: item => COMMISSION_WEAPON_FAMILIES.find(choice => choice.family === resolveWeaponFamily(item))?.label || '武器',
    statNames: { attack: '攻擊', defense: '防禦', hp: '生命', crit: '暴擊', evade: '閃避', block: '格擋' }, rateStats: new Set(['crit','evade','block']),
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
  runInNewContext(`let commissionConsent = null; let lastCommissionSignature = ''; let selectedId = null; let selectedSlot = null;
    ${extract('function weaponRuleText(', 'function powerComparisonText(')} ${controllers}
    ${extract("$('commission-confirm').addEventListener", "$('motion-toggle').addEventListener")}
    window.addEventListener('popstate', closeWeaponCommission);
    renderWeaponCommission();`, context);
  return { state, dom, context, calls, toasts, window, run: source => runInNewContext(source, context) };
}

test('commission UI: distinct adaptation with first-clear/camp gate and no automatic purchase', () => {
  const h = harness(createGame(82)), before = structuredClone(h.state);
  assert.equal(h.dom['commission-choices'].children.length, 3);
  assert.equal(h.dom['commission-choices'].children.every(button => button.disabled), true);
  assert.match(h.dom['commission-status'].textContent, /首次遠征/);
  h.run("openWeaponCommission('axe'); confirmWeaponCommission();");
  assert.deepEqual(h.state, before); assert.equal(h.calls.length, 0);
  for (const text of ['本作獨立機制', '不是原版商店庫存、訓練或鍛造', '品質骰 R110', '屠戮（Slaughter）', '無前綴', '不會據此推薦購買', '刷寶仍可能取得更適合或更強的裝備', '不自動裝備、不自動出售', '遠征不收金幣', '委託可能用盡餘額', '不必購買才能繼續']) assert.ok(html.includes(text), text);
  assert.match(html, /v0\.8\.1 · 持續開發/);
  for (const key of ['save','preferences','writer']) assert.ok(js.includes(`${key}-v3`));
  assert.doesNotMatch(controllers, /\.power|scoreItem|\.innerHTML|insertAdjacentHTML/);
});

test('commission UI: every route shows exact item, quality, level, six stats/current values/deltas, effect and balance without mutation', () => {
  for (const choice of COMMISSION_WEAPON_FAMILIES) {
    const h = harness(), before = structuredClone(h.state), preview = previewWeaponCommission(h.state, choice.family);
    h.dom['commission-choices'].children.find(button => collect(button).includes(choice.label)).emit('click');
    assert.equal(h.dom['commission-dialog'].open, true);
    assert.deepEqual(h.state, before); assert.equal(h.calls.length, 0);
    assert.equal(h.dom['commission-item-name'].textContent, preview.item.name);
    assert.match(h.dom['commission-item-meta'].textContent, /優良（Superior） · Lv\.5 · 品質骰 R110 · 屠戮（Slaughter） · 無前綴/);
    assert.ok(h.dom['commission-current'].textContent.includes(h.state.equipment.weapon.name));
    assert.equal(h.dom['commission-comparison'].children.length, 7);
    for (const [index, key] of Object.keys(h.context.statNames).entries()) {
      const row = h.dom['commission-comparison'].children[index + 1], rate = h.context.rateStats.has(key);
      const value = preview.item.stats[key] || 0, old = preview.currentWeapon.stats[key] || 0;
      assert.equal(row.children[0].textContent, h.context.statNames[key]);
      assert.equal(row.children[1].textContent, `${h.run(`commissionStat(${value}, ${rate})`)}${rate ? '%' : ''}`);
      assert.equal(row.children[2].textContent, `${h.run(`commissionStat(${old}, ${rate})`)}${rate ? '%' : ''}`);
      if (value === old) assert.equal(row.children[3].textContent, '—');
      else assert.ok(row.children[3].textContent.startsWith(value > old ? '+' : '-'));
    }
    assert.ok(collect(h.dom['commission-trait']).includes(describeWeaponTrait(preview.item)));
    assert.match(h.dom['commission-cost'].textContent, new RegExp(`委託費用 ${preview.price} 金幣 · 現有 10000 · 購買後餘額 ${preview.goldAfter}`));
    assert.match(h.dom['commission-feedback'].textContent, /尚未購買/);
    assert.equal(h.dom['commission-confirm'].disabled, false);
    const shown = h.dom['commission-item-name'].textContent;
    h.run(`openWeaponCommission('${choice.family === 'axe' ? 'rapier' : 'axe'}');`);
    assert.equal(h.dom['commission-item-name'].textContent, shown, 'repeated selection never swaps the pending offer');
  }
});

test('commission UI: exact fractional comparison is not rounded to integer or one-decimal percent', () => {
  const state = fixture(); state.equipment.weapon.stats = { attack: 3.125, crit: .0211, evade: .0001, block: .0002, defense: 1.25, hp: 12.5 };
  const h = harness(state); h.run("openWeaponCommission('rapier');");
  const rows = h.dom['commission-comparison'].children;
  assert.equal(rows[1].children[2].textContent, '3.125');
  assert.equal(rows[4].children[2].textContent, '2.11%');
  assert.match(rows[4].children[3].textContent, /百分點$/);
  assert.equal(rows[5].children[3].textContent, '-0.01 百分點');
  assert.equal(rows[6].children[3].textContent, '-0.02 百分點');
});

test('commission UI: explicit confirmation buys once, matches quote, delivers locked inventory and does not equip or auto-sell', () => {
  for (const autoSell of [false, true]) {
    const state = fixture(); if (autoSell) state.autoSell = true;
    const h = harness(state), equipment = structuredClone(state.equipment), expected = previewWeaponCommission(state, 'club');
    h.run("openWeaponCommission('club');"); h.dom['commission-confirm'].emit('click'); h.dom['commission-confirm'].emit('click');
    assert.equal(h.calls.length, 1);
    assert.deepEqual(h.calls[0], { action: 'commissionWeapon', payload: { family: 'club', quoteBasis: expected.quoteBasis } });
    assert.equal(state.hero.gold, expected.goldAfter);
    assert.equal(state.inventory.length, 1); assert.deepEqual(state.inventory[0], expected.item);
    assert.equal(state.inventory[0].locked, true); assert.deepEqual(state.equipment, equipment);
    assert.equal(previewSafeSale(state).items.length, 0);
    assert.equal(state.autoSell, autoSell ? true : undefined);
    assert.equal(h.run('commissionConsent'), null); assert.equal(h.dom['commission-dialog'].open, false);
    assert.equal(h.dom['slot-filter'].value, 'weapon'); assert.equal(h.dom['sort-select'].value, 'new');
    assert.match(h.toasts.at(-1), /已鎖定送入背包，未自動裝備/);
  }
});

test('commission UI: close, cancel/Escape, Back, import entry, and queued native close consume consent without a mutation', () => {
  for (const method of ['close','cancel','back','explicit','import','queued-close']) {
    const h = harness(), before = structuredClone(h.state); h.run("openWeaponCommission('rapier');");
    if (method === 'back') h.window.emit('popstate');
    else if (method === 'explicit') h.run('closeWeaponCommission();');
    else if (method === 'import') h.dom['import-save'].emit('click');
    else if (method === 'queued-close') h.dom['commission-dialog'].open = false;
    else h.dom['commission-dialog'].emit(method === 'cancel' ? 'cancel' : 'close');
    h.run('confirmWeaponCommission();');
    assert.equal(h.dom['commission-dialog'].open, false, method);
    assert.equal(h.run('commissionConsent'), null, method);
    assert.deepEqual(h.state, before, method); assert.equal(h.calls.length, 0, method);
    h.run("openWeaponCommission('club'); closeWeaponCommission(); confirmWeaponCommission();");
    assert.equal(h.calls.length, 0);
  }
  assert.equal((html.match(/data-close="commission-dialog"/g) || []).length, 2);
  assert.match(html, /data-close="commission-dialog"[^>]*autofocus/);
  assert.match(js, /window\.addEventListener\('pagehide', \(\) => \{ closeSafeSalePreview\(\); closeWeaponCommission\(\)/);
  assert.match(js, /window\.addEventListener\('popstate', closeWeaponCommission\)/);
});

test('commission UI: ownership loss, import/reload synchronization and return to ownership cannot resurrect consent', () => {
  const h = harness();
  Object.assign(h.context, { lastInventorySignature: '', lastEquipmentSignature: '', lastLogSignature: '', lastEnemyStatusSignature: '', lastStageCount: 0, lastPreviewStage: null });
  h.run(`${extract('function syncSelection(', 'function dispatch(')} openWeaponCommission('axe');`);
  h.context.tabOwner = false; h.run('syncSelection();'); h.context.tabOwner = true;
  const before = structuredClone(h.state); h.run('renderWeaponCommission(); confirmWeaponCommission();');
  assert.deepEqual(h.state, before); assert.equal(h.calls.length, 0);
  h.run("openWeaponCommission('axe'); syncSelection(); confirmWeaponCommission();");
  assert.equal(h.calls.length, 0);
  assert.match(js, /changed: owner => \{ tabOwner = owner; pump\.reset\(\); syncSelection\(\)/);
  assert.match(js, /state = validateSave\(JSON\.parse\(raw\)\); lastSavedRaw = raw; syncSelection\(\)/);
  assert.match(js, /state=restored;preventOverwrite=false;selectedId=null;selectedSlot=null;syncSelection\(\)/);
  const dispatcher = extract('function dispatch(', 'function commissionQuoteSignature(');
  const actAt = dispatcher.indexOf('act(state, action, payload);');
  const reconcileAt = dispatcher.indexOf('reconcileWeaponCommission();');
  const renderAt = dispatcher.indexOf('render(true);');
  assert.ok(actAt >= 0 && reconcileAt > actAt && renderAt > reconcileAt,
    'action must revoke stale commission consent before rendering; lifecycle bookkeeping may intervene');
});

test('commission UI: stale quote, comparison and progress synchronously revoke all consent before dispatch', () => {
  const mutations = {
    gold: h => { h.state.hero.gold++; }, level: h => { h.state.hero.level++; }, counter: h => { h.state._itemId++; },
    comparisonValue: h => { h.state.equipment.weapon.stats.attack++; }, comparisonName: h => { h.state.equipment.weapon.name = '更名武器'; },
    comparisonItem: h => { h.state.equipment.weapon = { ...h.state.equipment.weapon, id: 'other-weapon' }; },
    inventory: h => { h.state.inventory.push({ ...createCommissionWeapon('axe', 5), id: 'held-weapon' }); },
    stage: h => { h.state.stage++; }, wins: h => { h.state.wins++; }, unlocked: h => { h.state.unlocked++; },
    battle: h => { h.state.mode = 'battle'; }, defeat: h => { h.state.mode = 'defeat'; },
    owner: h => { h.context.tabOwner = false; }, lease: h => { h.context.lease = false; },
  };
  for (const [name, change] of Object.entries(mutations)) {
    const h = harness(); h.run("openWeaponCommission('axe');"); change(h);
    const before = structuredClone(h.state); h.run('confirmWeaponCommission(); confirmWeaponCommission();');
    assert.deepEqual(h.state, before, name); assert.equal(h.calls.length, 0, name);
    assert.equal(h.run('commissionConsent'), null, name); assert.equal(h.dom['commission-confirm'].disabled, true, name);
    assert.match(h.dom['commission-feedback'].textContent, /委託已取消，未扣款、未交付/, name);
  }
  const h = harness(); h.run("openWeaponCommission('axe');"); h.state.hero.gold++;
  h.run('reconcileWeaponCommission();'); assert.equal(h.run('commissionConsent'), null);
  h.state.hero.gold--; h.run('renderWeaponCommission(); confirmWeaponCommission();'); assert.equal(h.calls.length, 0);
});

test('commission UI: affordability, inventory reserve and pending delivery have specific reasons with no purchase', () => {
  const cases = {
    insufficient: { change: s => { s.hero.gold = 1; }, reason: /金幣不足.*還差/ },
    capacity: { change: s => { s.inventory = Array.from({length: 115}, (_, i) => ({ ...createCommissionWeapon('axe', 5), id: `held-${i}` })); }, reason: /至少 6 格空位.*保留.*5 格/ },
    pending: { change: s => { s.pendingLoot = [{ ...createCommissionWeapon('club', 5), id: 'pending' }]; }, reason: /待領戰利品.*不會放入待領區/ },
  };
  for (const [name, {change, reason}] of Object.entries(cases)) {
    const state = fixture(); change(state); const h = harness(state), before = structuredClone(state);
    h.run("openWeaponCommission('rapier'); confirmWeaponCommission();");
    assert.equal(h.dom['commission-dialog'].open, true, name);
    assert.equal(h.dom['commission-confirm'].disabled, true, name);
    assert.match(h.dom['commission-feedback'].textContent, reason, name);
    assert.deepEqual(state, before, name); assert.equal(h.calls.length, 0, name);
    if (name === 'insufficient') assert.match(h.dom['commission-cost'].textContent, /購買後餘額 -/);
  }
});

test('commission UI: read-only, battle and defeat are nonmutating even with forced handlers', () => {
  for (const setting of ['readonly','battle','defeat']) {
    const h = harness(); if (setting === 'readonly') h.context.tabOwner = false; else h.state.mode = setting;
    const before = structuredClone(h.state); h.run("renderWeaponCommission(); openWeaponCommission('club'); confirmWeaponCommission();");
    assert.deepEqual(h.state, before); assert.equal(h.calls.length, 0);
    assert.equal(h.dom['commission-choices'].children.every(button => button.disabled), true);
    assert.equal(h.dom['commission-dialog'].open, false);
  }
});

test('commission UI: failed engine completion cannot repeat or claim successful delivery', () => {
  for (const options of [{ noop: true }, { beforeDispatch: state => { state.hero.gold++; } }]) {
    const h = harness(fixture(), options); h.run("openWeaponCommission('club'); confirmWeaponCommission(); confirmWeaponCommission();");
    assert.equal(h.calls.length, 1); assert.equal(h.state.inventory.length, 0);
    assert.equal(h.run('commissionConsent'), null); assert.equal(h.dom['commission-confirm'].disabled, true);
    assert.match(h.dom['commission-feedback'].textContent, /操作未確認完成/);
    assert.equal(h.toasts.some(text => text.includes('已委託')), false);
  }
});

test('commission UI: names render as text, dialog is labeled, long content scrolls and mobile controls remain native', () => {
  const h = harness(fixture(), { preview: (state, family) => {
    const preview = previewWeaponCommission(state, family); preview.item.name = '<img src=x onerror=bad()>'; preview.currentWeapon.name = '<script>bad()</script>'; return preview;
  } });
  h.run("openWeaponCommission('axe');");
  assert.equal(h.dom['commission-item-name'].textContent, '<img src=x onerror=bad()>');
  assert.ok(h.dom['commission-current'].textContent.includes('<script>bad()</script>'));
  assert.match(html, /id="commission-dialog"[^>]*aria-labelledby="commission-title"[^>]*aria-describedby="commission-delivery"/);
  assert.match(css, /\.commission-dialog \{[^}]*max-height:[^}]*overflow-y: auto/);
  assert.match(css, /\.commission-item-name \{[^}]*overflow-wrap: anywhere/);
  assert.match(css, /\.commission-actions \{[^}]*flex-wrap: wrap/);
  assert.match(html, /id="commission-feedback"[^>]*role="status"[^>]*aria-live="polite"/);
});
