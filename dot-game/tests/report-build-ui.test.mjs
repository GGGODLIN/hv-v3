import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { MAJOR_ABILITIES, TARGET_PRIORITIES } from '../src/engine.js';
import { QUALITY_TIERS } from '../src/loot.js';

const js = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const source = js.slice(js.indexOf('function expeditionBuildContext('), js.indexOf('function renderExpeditionReports('));
const node = (tag, className = '', textContent = '') => ({tag, className, textContent, children: [], open: false, append(...items) { this.children.push(...items); }});
const collect = node => [node.textContent, ...node.children.map(collect)].join(' ');
function render(build) {
  const context = createContext({node, build, MAJOR_ABILITIES, TARGET_PRIORITIES, QUALITY_TIERS, slotNames: {weapon: '武器', armor: '護甲', accessory: '飾品'}});
  return runInContext(`${source}; expeditionBuildContext(build);`, context);
}
const build = () => ({targetPriority: 'caster', autoProtection: true, abilities: [{id: 'hp-tank', rank: 10}, {id: 'one-handed-damage', rank: 3}], equipment: [
  {slot: 'weapon', id: 'unique-17', name: '同名戰斧', level: 48, quality: 'Superior'},
  {slot: 'armor', id: 'armor-22', name: '護甲甲', level: 32, quality: 'Average'},
  {slot: 'accessory', id: 'ring-1', name: '飾品乙', level: 4, quality: 'Crude'},
]});

test('departure policy is compact and explicitly distinct from actual Protection activation/casts', () => {
  const card = render(build()), text = collect(card);
  assert.match(text, /出發政策：施法者優先 · Protection ON/);
  assert.match(text, /政策不代表護盾已生效；有實際施放時另列護盾取捨/);
  assert.match(js, /row\('護盾取捨', `施放 \$\{format\(report.protection.casts\)\}/);
  for (const [targetPriority, label] of [['front', '依序集火'], ['weakest', '低血量收尾']]) {
    assert.ok(collect(render({...build(), targetPriority, autoProtection: false})).includes(`出發政策：${label} · Protection OFF`));
  }
});

test('native collapsed details contain exact slotted ranks and all gear identities, levels and quality', () => {
  const snapshot = build(), before = JSON.stringify(snapshot), card = render(snapshot), details = card.children.find(child => child.tag === 'details');
  assert.equal(details.open, false); assert.equal(details.children[0].tag, 'summary');
  const text = collect(details);
  for (const expected of ['HP Tank · Rank 10 · ID：hp-tank', '1H Damage · Rank 3 · ID：one-handed-damage', '武器：同名戰斧 · ID：unique-17 · Lv.48 · 優良', '護甲：護甲甲 · ID：armor-22 · Lv.32 · 普通', '飾品：飾品乙 · ID：ring-1 · Lv.4 · 粗製']) assert.ok(text.includes(expected), expected);
  assert.doesNotMatch(text, /MP Tank/);
  assert.match(collect(render({...build(), abilities: [{id: 'mp-tank', rank: 10}]})), /MP Tank · Rank 10/);
  assert.match(collect(render({...build(), abilities: [{id: 'one-handed-damage', rank: 10}]})), /1H Damage · Rank 未記錄/);
  assert.match(text, /不代表最佳配裝或勝負原因/);
  assert.equal(JSON.stringify(snapshot), before);
  assert.match(css, /\.report-build-details summary:focus-visible/);
  assert.match(css, /\.report-build-details[^}]+overflow-wrap: anywhere/s);
});

test('old or incomplete reports never infer current loadout and invalid data remain honest text', () => {
  for (const missing of [null, undefined, [], 'bad']) assert.match(collect(render(missing)), /出發配置未記錄；不以目前配置推測/);
  const card = render({targetPriority: '__proto__', autoProtection: 'true', abilities: [null, {id: 'constructor', rank: NaN}], equipment: [null, {slot: 'weapon', id: '<script>x</script>', name: '<img onerror=x>', quality: '__proto__', level: -1}]}), text = collect(card);
  assert.match(text, /出發政策：未記錄 · Protection 未記錄/);
  assert.match(text, /未辨識能力 · Rank 未記錄/);
  assert.match(text, /ID：<script>x<\/script>/);
  assert.match(text, /Lv.未記錄 · 未記錄/);
  assert.match(collect(render({})), /已裝配能力：未記錄/);
  assert.match(collect(render({...build(), abilities: []})), /已裝配能力：無/);
  assert.doesNotMatch(source, /innerHTML|\bstate\b|abilityView\(|\bact\(|\bdispatch\(|localStorage|Math.random/);
});

test('details and reports remain bounded, local pin and v0.16 navigation remain intact', () => {
  const card = render({...build(), abilities: Array(100).fill({id: 'hp-tank', rank: 1})});
  const details = card.children.find(child => child.tag === 'details');
  assert.equal(details.children[1].children.length, 5); assert.equal(details.children[2].children.length, 3);
  assert.match(js, /expeditionReports\(state\)\.slice\(0, 2\)/);
  assert.match(js, /pinnedExpeditionReport = null; lastReportSignature = ''/);
  assert.match(js, /card.append\(expeditionBuildContext\(report.build\)\)/);
});
