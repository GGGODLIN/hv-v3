import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createGame, validateSave, act } from '../src/engine.js';
import { createCommissionWeapon, createSoulboundItem, createItemWorldUpgrade, describeWeaponTrait } from '../src/loot.js';
import { fullUI, clone, find, collect } from './helpers/comparison-focus-harness.mjs';

// Independent source/controller audit, not browser/native-keyboard/layout proof.
const baseline = process.env.HV_EFFECT_AUDIT_BASELINE;
const root = baseline ? resolve(baseline) : new URL('../', import.meta.url);
const read = p => readFileSync(baseline ? resolve(root, p) : new URL(p, root), 'utf8');
const source = read('src/ui.js'), html = read('index.html'), css = read('style.css');
const all = el => [el, ...el.children.flatMap(all)];
const snapshot = h => JSON.stringify({ state: h.state, calls: h.calls, writes: h.writes });
const trait = h => find(h.dom['item-detail'], e => e.className === 'weapon-trait');
const disclosure = h => find(trait(h), e => e.tag === 'details');
const summary = h => disclosure(h)?.children.find(e => e.tag === 'summary');
// Only the summary is semantically visible under a closed native details.
// This does not compute CSS, painted geometry or assistive-technology output.
function exposed(el) {
  if (el.hidden || el.inert) return '';
  return [el.textContent, ...(el.tag === 'details' && !el.open
    ? el.children.filter(e => e.tag === 'summary') : el.children).map(exposed)].filter(Boolean).join(' ');
}
function ui(state = fixture()) {
  const h = fullUI(state, { source, html });
  const create = h.document.createElement;
  // Existing source harness does not model summary's native tabIndex=0.
  // Supply that intrinsic focusability locally; no production/helper change.
  h.document.createElement = tag => {
    const el = create(tag);
    if (tag === 'summary') el.tabIndex = 0;
    return el;
  };
  return h;
}
function fixture() {
  const s = createGame(42);
  s.soulFragments = 1000; s.worldSeeds = 2;
  s.inventory = ['axe', 'rapier', 'club'].map(family => ({ ...createCommissionWeapon(family, 1), id: `effect-${family}`, locked: false }));
  s.inventory.push({ ...clone(s.inventory[0]), id: 'effect-axe-copy' });
  s.inventory.push(createItemWorldUpgrade(createSoulboundItem({ ...createCommissionWeapon('rapier', 1), id: 'effect-iw' }, 1), 1));
  s.inventory.push({ ...clone(s.equipment.armor), id: 'effect-armor', locked: false });
  s.pendingLoot = [{ ...createCommissionWeapon('club', 1), id: 'effect-pending', locked: false }];
  return validateSave(s);
}
const originalRule = {
  axe: '普通攻擊造成正傷害且目標存活時：非暴擊 25% 觸發，暴擊必觸發；技能與魔法不觸發。最多 5 層，重觸發（含滿層）統一刷新為未來 7 Tick，下一個 Tick 才開始，第 7 次結算後解除。每層每 Tick 依觸發時面板攻擊（ADB）的 8% 計算，合計後向下取整；不是本次直擊傷害的百分比。重新觸發會更新全部層數的攻擊快照，也可能變弱。流血為無類型傷害，不受一般／特定減傷及閃避、招架、格擋影響，不能暴擊；穿透護甲不增幅流血。採歷史模型；固定機率、層數上限、時長、快照與刷新時序為本作改編，不是原版當前數值。',
  rapier: '普通攻擊造成傷害且目標存活時：非暴擊 25% 觸發，暴擊必觸發。最多 3 層 · 持續 7 Tick，重觸發刷新。每層降低原本物理總減傷率的 25%，不是直接增加同等傷害；從後續攻擊生效。固定機率與時長為本作選定參數。',
  club: '目標未暈眩、未待恢復行動時，普通攻擊造成傷害且目標存活：非暴擊 25% 觸發，符合條件的暴擊必觸發。持續 4 Tick，不疊層、不刷新。到期後敵人恢復閃避與招架，並在下次我方行動前先行動；可能反擊致敗，不能視為永久控制。固定機率、時長與自動戰鬥時序為本作改編參數，不是原版當前數值。',
};

for (const family of ['axe', 'rapier', 'club']) {
  test(`effect audit: ${family} default view is concise, native and explicitly adapted`, async () => {
    const h = ui(), before = snapshot(h); await h.card('inventory', `effect-${family}`).click();
    const box = trait(h), details = disclosure(h), heading = summary(h);
    assert.ok(details); assert.equal(details.open, false); assert.equal(details.children[0], heading);
    assert.match(heading.textContent, /完整.*規則/); assert.match(heading.textContent, /觸發.*公式.*時序/);
    assert.equal(heading.attributes.role, undefined); assert.equal(details.attributes.role, undefined);
    assert.match(exposed(box), /歷史模型|本作改編/);
    assert.match(exposed(box), /不是原版當前|非原版當前|非原版現行|不等同原版當前/);
    assert.ok(exposed(box).length < describeWeaponTrait(h.state.inventory.find(i => i.id === `effect-${family}`)).length + originalRule[family].length);
    assert.ok(exposed(box).length < 240, exposed(box));
    assert.equal(exposed(box).includes(originalRule[family]), false);
    assert.equal(snapshot(h), before);
  });
  test(`effect audit: ${family} expanded original paragraphs remain byte-exact`, async () => {
    const h = ui(), item = h.state.inventory.find(i => i.id === `effect-${family}`);
    await h.card('inventory', item.id).click();
    const details = disclosure(h); assert.ok(details);
    const paragraphs = all(details).filter(e => e.tag === 'p').map(e => e.textContent);
    assert.ok(paragraphs.includes(describeWeaponTrait(item)));
    assert.ok(paragraphs.includes(originalRule[family]));
    assert.equal(paragraphs.length, 2);
    const before = snapshot(h); details.open = true; await details.emit('toggle');
    assert.ok(exposed(details).includes(originalRule[family])); assert.equal(snapshot(h), before);
  });
}
test('effect audit: visible family summaries retain important non-universal tradeoffs', async () => {
  const h = ui();
  await h.card('inventory', 'effect-axe').click();
  assert.match(exposed(trait(h)), /流血/); assert.match(exposed(trait(h)), /之後|延後|後續|下一/); assert.match(exposed(trait(h)), /變弱|降低/);
  await h.card('inventory', 'effect-rapier').click();
  assert.match(exposed(trait(h)), /後續/); assert.match(exposed(trait(h)), /物理/); assert.match(exposed(trait(h)), /減傷/);
  assert.match(exposed(trait(h)), /不是.*(?:傷害|加傷)|不.*直接.*傷害/);
  await h.card('inventory', 'effect-club').click();
  assert.match(exposed(trait(h)), /不.*刷新/); assert.match(exposed(trait(h)), /先.*行動|恢復行動/); assert.match(exposed(trait(h)), /致敗|戰敗/);
  assert.doesNotMatch(exposed(trait(h)), /必勝|一定更強|永久控制|保證提升/);
});
for (const where of ['inventory', 'equipment', 'pending']) {
  test(`effect audit: ${where} exact same item keeps open disclosure and native-summary focus over repaint`, async () => {
    const s = fixture();
    if (where === 'equipment') act(s, 'equip', 'effect-axe');
    const h = ui(s), id = where === 'pending' ? 'effect-pending' : 'effect-axe';
    await h.card(where, id).click(); const before = snapshot(h);
    for (let repeat = 0; repeat < 3; repeat++) {
      const old = disclosure(h), oldSummary = summary(h); old.open = true; oldSummary.focus();
      assert.equal(h.document.activeElement, oldSummary); h.render();
      assert.equal(disclosure(h).open, true); assert.equal(h.document.activeElement, summary(h));
      assert.notEqual(summary(h), oldSummary); assert.equal(oldSummary.isConnected, false);
    }
    assert.equal(snapshot(h), before);
  });
}
test('effect audit: closing same item stays closed and keeps only actually focused summary', async () => {
  const h = ui(); await h.card('inventory', 'effect-axe').click(); const before = snapshot(h);
  disclosure(h).open = true; h.render(); disclosure(h).open = false; summary(h).focus(); h.render();
  assert.equal(disclosure(h).open, false); assert.equal(h.document.activeElement, summary(h)); assert.equal(snapshot(h), before);
});
test('effect audit: identical-name different ID resets open state without stealing comparison focus', async () => {
  const h = ui();
  assert.equal(h.state.inventory.find(i => i.id === 'effect-axe').name, h.state.inventory.find(i => i.id === 'effect-axe-copy').name);
  await h.card('inventory', 'effect-axe').click(); disclosure(h).open = true; summary(h).focus();
  const next = h.card('inventory', 'effect-axe-copy'); next.focus(); await next.click();
  assert.equal(disclosure(h).open, false); assert.equal(h.document.activeElement, h.card('inventory', 'effect-axe-copy'));
  await h.card('inventory', 'effect-axe').click(); assert.equal(disclosure(h).open, false);
});
test('effect audit: unrelated filter and sale checkbox focus are not stolen by open disclosure', async () => {
  const h = ui(); await h.card('inventory', 'effect-axe').click(); disclosure(h).open = true;
  for (const id of ['slot-filter', 'sort-select', 'settings-toggle']) {
    h.dom[id].focus(); h.render(); assert.equal(h.document.activeElement, h.dom[id]); assert.equal(disclosure(h).open, true);
  }
  const check = find(h.card('inventory', 'effect-club').parentElement, e => e.tag === 'input'); check.focus();
  h.render(); assert.notEqual(h.document.activeElement, summary(h)); assert.equal(disclosure(h).open, true);
});
test('effect audit: changing to armor or empty selection removes disclosure and does not retain stale open state', async () => {
  const h = ui(); await h.card('inventory', 'effect-axe').click(); disclosure(h).open = true;
  await h.card('inventory', 'effect-armor').click(); assert.equal(find(h.dom['item-detail'], e => e.tag === 'details'), undefined);
  await h.card('inventory', 'effect-axe').click(); assert.equal(disclosure(h).open, false);
  h.run('selectedId=null;selectedSlot=null;render(true)');
  assert.equal(find(h.dom['item-detail'], e => e.tag === 'details'), undefined);
  await h.card('inventory', 'effect-axe').click(); assert.equal(disclosure(h).open, false);
});
test('effect audit: unknown legacy weapon shows no-proc boundary, not invented family benefit', async () => {
  const h = ui(); await h.card('equipment', 'starter-weapon').click();
  assert.match(exposed(h.dom['item-detail']), /未識別武器類型：不會觸發武器特效/);
  assert.equal(disclosure(h), undefined);
});
test('effect audit: exact stat comparison, score caution, binding price and IW eligibility stay outside disclosure', async () => {
  const h = ui(); await h.card('inventory', 'effect-axe').click(); const detail = h.dom['item-detail'], details = disclosure(h);
  assert.ok(details); assert.match(exposed(detail), /現穿 → 選取/); assert.match(exposed(detail), /不是 DPS/);
  assert.match(exposed(detail), /品質費用 100 靈魂碎片/); assert.match(exposed(detail), /預覽不扣除、不自動綁定/);
  assert.match(exposed(detail), /靈魂綁定/);
  const actions = all(detail).filter(e => e.tag === 'button');
  assert.ok(actions.length >= 5); assert.ok(actions.every(e => !details.contains(e)));
  assert.doesNotMatch(collect(details), /品質費用|世界之種|永久綁定：|預覽靈魂綁定|出售/);
});
test('effect audit: bound IW1 permanence and original upper-limit boundary remain visible', async () => {
  const h = ui(); await h.card('inventory', 'effect-iw').click(); const detail = h.dom['item-detail'];
  assert.equal(disclosure(h).open, false);
  assert.match(exposed(detail), /永久綁定：不能解除、解鎖或出售/);
  assert.match(exposed(detail), /IW1 已完成/); assert.match(exposed(detail), /原版.*上限 IW10/); assert.match(exposed(detail), /IW2–10 尚未實作/);
  assert.doesNotMatch(collect(disclosure(h)), /永久綁定：不能|IW1 已完成|IW2–10/);
});
test('effect audit: pending FIFO and unavailable operation boundaries remain visible', async () => {
  const h = ui(); await h.card('pending', 'effect-pending').click(); const detail = h.dom['item-detail'];
  assert.match(exposed(detail), /待領裝備只供比較/); assert.match(exposed(detail), /領入背包前不能換裝、鎖定、出售、綁定或挑戰裝備界/);
  assert.match(exposed(detail), /取得先後順序/); assert.equal(all(detail).filter(e => e.tag === 'button').length, 0);
  assert.doesNotMatch(collect(disclosure(h)), /待領裝備|領入背包前/);
});
test('effect audit: readonly effect inspection neither enables operations nor changes state/RNG/actions/writes', async () => {
  const h = ui(); h.run('tabOwner=false;render(true)'); const before = snapshot(h);
  for (const id of ['effect-axe', 'effect-rapier', 'effect-club', 'effect-iw']) {
    await h.card('inventory', id).click(); disclosure(h).open = true; summary(h).focus(); h.render();
    assert.equal(disclosure(h).open, true); assert.ok(all(h.dom['item-detail']).filter(e => e.tag === 'button').every(e => e.disabled));
    assert.match(exposed(h.dom['item-detail']), /唯讀分頁/);
  }
  assert.equal(snapshot(h), before);
});
test('effect audit: transient disclosure is not added to storage, state schema or bespoke key handlers', () => {
  assert.doesNotMatch(source, /(?:localStorage|sessionStorage)\s*\.\s*setItem\([^\n]*(?:weaponRule|weapon-rule|trait|disclosure)/);
  assert.doesNotMatch(source, /(?:weapon-rule-summary|weaponRuleSummary)[^\n]*addEventListener\(['"](?:key|click)/);
  assert.match(css, /summary:focus-visible/);
});
