import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGame, validateSave, act } from '../src/engine.js';
import { createCommissionWeapon, createSoulboundItem, createItemWorldUpgrade, describeWeaponTrait } from '../src/loot.js';
import { fullUI, clone, find, collect } from './helpers/comparison-focus-harness.mjs';

// Controlled source DOM tests, not browser layout, real keyboard, or AT evidence.
function fixture() {
  const s = createGame(42);
  s.inventory = ['axe', 'rapier', 'club'].map(family => ({ ...createCommissionWeapon(family, 1), id: `effect-${family}`, locked: false }));
  s.inventory.push({ ...clone(s.inventory[0]), id: 'effect-axe-same-name' });
  s.pendingLoot = [{ ...clone(s.inventory[1]), id: 'effect-pending' }];
  return validateSave(s);
}
function harness(initial = fixture()) {
  const h = fullUI(initial), createElement = h.document.createElement;
  // The source harness omits intrinsic summary focus. Model that capability only
  // in this adapter; real native keyboard toggling remains a browser QA gate.
  h.document.createElement = tag => {
    const el = createElement(tag);
    if (tag === 'summary') el.tabIndex = 0;
    return el;
  };
  return h;
}
const snapshot = h => JSON.stringify({ state: h.state, calls: h.calls, writes: h.writes });
const detail = h => h.dom['item-detail'];
const rules = h => find(detail(h), el => el.className === 'weapon-rule-details');
const summary = h => find(detail(h), el => el.className === 'weapon-rule-summary');
const visible = el => [el.textContent, ...el.children.filter(child => el.tag !== 'details' || el.open || child.tag === 'summary').map(visible)].filter(Boolean).join(' ');

for (const family of ['axe', 'rapier', 'club']) {
  test(`${family} has a concise visible identity and unchanged full rules in a labelled closed native disclosure`, async () => {
    const h = harness(), before = snapshot(h);
    await h.card('inventory', `effect-${family}`).click();
    const item = h.state.inventory.find(item => item.id === `effect-${family}`), disclosure = rules(h);
    assert.equal(disclosure.tag, 'details');
    assert.equal(disclosure.open, false);
    assert.equal(disclosure.dataset.weaponRuleId, item.id);
    assert.equal(disclosure.children[0].tag, 'summary');
    assert.equal(summary(h).textContent, '完整特效規則・觸發、公式與時序');
    assert.equal(find(disclosure, el => el.className === 'weapon-trait-full').textContent, describeWeaponTrait(item));
    assert.equal(find(disclosure, el => el.className === 'weapon-rule-full muted').textContent, h.run(`weaponRuleText(state.inventory.find(item => item.id === 'effect-${family}'))`));
    const concise = find(detail(h), el => el.className === 'weapon-trait-summary');
    assert.ok(concise.textContent.length < 85);
    assert.match(visible(detail(h)), /歷史特效模型.*本作改編.*不等同原版當前規則/);
    assert.doesNotMatch(visible(detail(h)), /每層每 Tick|非暴擊 25%|最多 [35] 層/);
    disclosure.open = true;
    assert.ok(visible(detail(h)).includes(describeWeaponTrait(item)));
    assert.equal(snapshot(h), before);
  });
}

test('visible family summaries preserve delayed, conditional and control tradeoffs without a best-weapon promise', async () => {
  const h = harness();
  for (const [family, expected] of [
    ['axe', /普攻有機會.*之後的 Tick.*可疊層刷新.*可能變弱.*穿透護甲不增幅/],
    ['rapier', /普攻有機會.*一般物理減傷.*後續物理攻擊.*不是直接加傷.*技能不會觸發/],
    ['club', /普攻有機會.*仍可格擋.*不能刷新.*甦醒時會先行動.*反擊致敗/],
  ]) {
    await h.card('inventory', `effect-${family}`).click();
    assert.match(visible(detail(h)), expected);
    assert.match(visible(detail(h)), /屬性評分不含.*不是 DPS.*不能只依高分換裝/);
    assert.doesNotMatch(find(detail(h), el => el.className === 'weapon-trait-summary').textContent, /必勝|最佳|保證提升/);
  }
});

test('same exact item preserves open and closed state across full rerenders without changing game state', async () => {
  const h = harness(), before = snapshot(h);
  await h.card('inventory', 'effect-axe').click();
  for (const open of [true, false, true]) {
    rules(h).open = open;
    for (let n = 0; n < 3; n++) {
      h.render();
      assert.equal(rules(h).open, open);
      assert.equal(rules(h).dataset.weaponRuleId, 'effect-axe');
    }
  }
  assert.equal(snapshot(h), before);
});

test('a different same-name exact item resets disclosure, and returning does not restore a remembered map', async () => {
  const h = harness();
  await h.card('inventory', 'effect-axe').click(); rules(h).open = true;
  await h.card('inventory', 'effect-axe-same-name').click();
  assert.equal(rules(h).open, false);
  assert.equal(rules(h).dataset.weaponRuleId, 'effect-axe-same-name');
  rules(h).open = true;
  await h.card('inventory', 'effect-axe').click();
  assert.equal(rules(h).open, false);
});

test('focused native summary alone is restored to its same-ID replacement without reopening closed rules', async () => {
  const h = harness(), before = snapshot(h);
  await h.card('inventory', 'effect-club').click();
  for (const open of [false, true]) {
    rules(h).open = open;
    const prior = summary(h); prior.focus();
    assert.equal(h.document.activeElement, prior);
    h.render();
    assert.notEqual(summary(h), prior);
    assert.equal(h.document.activeElement, summary(h));
    assert.equal(h.focusEvents.at(-1).options?.preventScroll, true);
    assert.equal(rules(h).open, open);
  }
  assert.equal(snapshot(h), before);
});

test('rerender never steals unrelated filter focus or comparison-button focus', async () => {
  const h = harness();
  await h.card('inventory', 'effect-axe').click(); rules(h).open = true;
  h.dom['slot-filter'].focus(); h.render();
  assert.equal(h.document.activeElement, h.dom['slot-filter']);
  assert.equal(rules(h).open, true);
  const card = h.card('inventory', 'effect-axe'); card.focus(); await card.click();
  assert.equal(h.document.activeElement, h.card('inventory', 'effect-axe'));
  assert.equal(rules(h).open, true);
  await h.card('inventory', 'effect-club').click();
  assert.notEqual(h.document.activeElement, summary(h));
  assert.equal(rules(h).open, false);
});

test('pending restrictions and exact ID stay visible outside the effect disclosure', async () => {
  const h = harness(); await h.card('pending', 'effect-pending').click();
  assert.match(visible(detail(h)), /ID：effect-pending/);
  assert.match(visible(detail(h)), /領入背包前不能換裝、鎖定、出售、綁定或挑戰裝備界/);
  assert.match(visible(detail(h)), /依取得先後順序/);
  assert.doesNotMatch(collect(rules(h)), /領入背包前|世界之種|靈魂碎片/);
  assert.equal(find(detail(h), el => el.tag === 'button'), undefined);
});

test('binding cost, IW condition and actual action controls remain visible outside the disclosure', async () => {
  const h = harness(); await h.card('inventory', 'effect-axe').click();
  const before = visible(detail(h));
  assert.match(before, /換上裝備.*鎖定.*出售/);
  assert.match(before, /預覽靈魂綁定/);
  assert.match(before, /靈魂碎片/);
  assert.match(before, /預覽 Item World/);
  assert.ok(find(detail(h), el => el.className === 'soulbind-item-action')?.parentElement === detail(h));
  assert.ok(find(detail(h), el => el.className === 'item-world-item-action')?.parentElement === detail(h));
  assert.equal(find(rules(h), el => el.tag === 'button'), undefined);
  rules(h).open = true;
  assert.equal(find(detail(h), el => el.className === 'soulbind-item-action')?.parentElement, detail(h));
});

test('permanent binding and original IW limits stay visible, not filed under effect rules', async () => {
  const s = fixture();
  s.inventory[0] = createItemWorldUpgrade(createSoulboundItem(s.inventory[0], 1), 1);
  const h = harness(validateSave(s)); await h.card('inventory', 'effect-axe').click();
  assert.match(visible(detail(h)), /永久綁定：不能解除、解鎖或出售/);
  assert.match(visible(detail(h)), /IW1 已完成/);
  assert.match(visible(detail(h)), /原版 Fair／Average／Superior 上限 IW10/);
  assert.doesNotMatch(collect(rules(h)), /不能解除|上限 IW10|已永久投入靈魂碎片/);
});

test('gear-set protection and filtered-out comparison caution remain visible', async () => {
  const s = fixture(); act(s, 'equip', 'effect-axe'); act(s, 'saveGearSet', 'a'); act(s, 'equip', 'effect-club');
  const h = harness(s); await h.card('inventory', 'effect-axe').click();
  h.dom['family-filter'].value = 'rapier'; await h.dom['family-filter'].emit('change');
  assert.match(visible(detail(h)), /位於背包篩選外/);
  assert.match(visible(detail(h)), /此裝備被配裝記錄使用，不能解鎖或出售/);
  assert.doesNotMatch(collect(rules(h)), /背包篩選外|不能解鎖或出售/);
});

test('unrecognized starter weapon keeps a visible no-proc warning and no empty disclosure', async () => {
  const h = harness(); await h.card('equipment', 'starter-weapon').click();
  assert.match(visible(detail(h)), /未識別武器類型：不會觸發武器特效/);
  assert.equal(rules(h), undefined);
});

test('non-weapon equipment has no weapon disclosure and discards previous open state', async () => {
  const h = harness(); await h.card('inventory', 'effect-axe').click(); rules(h).open = true;
  await h.card('equipment', h.state.equipment.armor.id).click();
  assert.equal(rules(h), undefined);
  await h.card('inventory', 'effect-axe').click(); assert.equal(rules(h).open, false);
});

test('disclosure styles retain native markers, wrap text and provide an inset focus outline', () => {
  const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
  assert.match(css, /\.weapon-rule-summary\s*\{[^}]*min-height: 40px[^}]*overflow-wrap: anywhere/s);
  assert.match(css, /\.weapon-rule-summary:focus-visible\s*\{[^}]*outline: 2px solid[^}]*outline-offset: -2px/s);
  assert.doesNotMatch(css, /\.weapon-rule-summary(?:::marker|::-webkit-details-marker)\s*\{[^}]*(?:display:\s*none|content:\s*['"]{2})/s);
});
