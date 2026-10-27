/** Earned source/controller replay only; no browser, layout, or native keyboard claim. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import * as engine from '../src/engine.js';
import { scoreItem, resolveWeaponFamily } from '../src/loot.js';
import { fullUI, find, collect } from '../tests/helpers/comparison-focus-harness.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value);
const codePoints = value => [...value].length;
const root = new URL('../', import.meta.url);
assert.ok(process.env.BASELINE_DOT_GAME, 'Set BASELINE_DOT_GAME to the separately restored exact v033 checkpoint 135 dot-game');
const base = pathToFileURL(resolve(process.env.BASELINE_DOT_GAME) + '/');
const baselineExpected = {
  'src/ui.js': '40c7da091d64c8579c4bdeb5c27b745e04ac4bae202ad0655595321a57791522',
  'index.html': '2c4565185b9fc510b898c0350f8f57d78f8d4d4e9903c44121cc19378eac09b2',
  'style.css': '6b035814359582d91c23d0ea86c9bbedc9eb948bc4a8869a8cb21e8f8d835336',
  'CHECKPOINT.json': 'bf35dead4ddcb3631213f041a51e4576e733ec89d8db68761b972dc429f2871d',
};
for (const [path, hash] of Object.entries(baselineExpected)) assert.equal(sha(readFileSync(new URL(path, base))), hash, `exact v033 ${path}`);
for (const path of ['src/engine.js', 'src/loot.js', 'src/session.js']) assert.deepEqual(readFileSync(new URL(path, root)), readFileSync(new URL(path, base)), `unchanged ${path}`);
const baselineEngine = await import(new URL('src/engine.js', base));
const inputPaths = ['src/ui.js', 'index.html', 'style.css', 'src/engine.js', 'src/loot.js', 'src/session.js', 'tests/helpers/comparison-focus-harness.mjs'];
const hashes = () => Object.fromEntries(inputPaths.map(path => [path, sha(readFileSync(new URL(path, root)))]));
const inputSha256 = hashes();
const protocol = {
  seed: 42, attempts: 20, maxPulsesPerFight: 1000, pulseSeconds: 1,
  acquisition: 'Fresh fixed seed42, stage1 Balanced. Before each attempt equip the highest-scored already-owned item per slot (later item wins ties). Start, queue finishThenCamp, advance one-second source pulses until town/defeat or 1000 pulses. Retain losses/censors; no grants, sales, rerolls, binding, IW, AP, commissions, fabricated items, or extra attempts. Compare complete state and expedition reports with exact accepted v033 after every public action and pulse.',
  replay: 'Load the unchanged canonical earned save into v033 and v034 controller harnesses. Compare exact state, RNG, action log and tracked storage writes at each checkpoint. Inspect naturally earned axe/rapier/club IDs and the original unknown-family starter. Toggle only transient DOM disclosure state; exercise exact-ID rerender, summary focus, item switching, unrelated filter focus, readonly viewing and a normal source battle.',
  disclosureAdapter: 'The existing focus-faithful test DOM does not implement native summary focus or toggle. In this script only, createElement(summary) sets tabIndex=0 to model native focus capability; disclosure.open is set directly and a toggle event emitted. These adapters are explicitly not real keyboard/browser behavior and do not edit production or shared helper files.',
};

const state = engine.createGame(protocol.seed), oldState = baselineEngine.createGame(protocol.seed), outcomes = [];
let sourceParityChecks = 0, pulses = 0;
function sameSource() {
  assert.equal(json(state), json(oldState));
  assert.equal(json(engine.expeditionReports(state)), json(baselineEngine.expeditionReports(oldState)));
  sourceParityChecks++;
}
function act(action, payload) { engine.act(state, action, payload); baselineEngine.act(oldState, action, payload); sameSource(); }
sameSource();
for (let attempt = 1; attempt <= protocol.attempts; attempt++) {
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const best = [state.equipment[slot], ...state.inventory.filter(item => item.slot === slot)].reduce((a, b) => scoreItem(a) > scoreItem(b) ? a : b);
    if (best.id !== state.equipment[slot].id) act('equip', best.id);
  }
  act('start'); assert.equal(state.mode, 'battle'); act('finishThenCamp', true);
  let localPulses = 0;
  while (state.mode === 'battle' && localPulses < protocol.maxPulsesPerFight) {
    engine.advance(state, 1); baselineEngine.advance(oldState, 1); sameSource(); localPulses++; pulses++;
  }
  outcomes.push({ attempt, pulses: localPulses, outcome: engine.expeditionReports(state)[0]?.outcome ?? 'censored' });
  if (state.mode === 'battle') break;
  if (state.mode === 'defeat') act('retreat');
}
const earned = engine.validateSave(JSON.parse(json(state)));
assert.equal(json(earned), json(baselineEngine.validateSave(JSON.parse(json(oldState)))));
const pair = [
  fullUI(earned, { source: readFileSync(new URL('src/ui.js', base), 'utf8'), html: readFileSync(new URL('index.html', base), 'utf8') }),
  fullUI(earned),
];
for (const h of pair) {
  const create = h.document.createElement;
  h.document.createElement = tag => { const el = create(tag); if (tag === 'summary') el.tabIndex = 0; return el; };
}
const snapshot = h => json({ state: h.state, calls: h.calls, writes: h.writes });
const detailsOf = h => find(h.dom['item-detail'], el => el.className === 'weapon-rule-details');
const summaryOf = h => find(h.dom['item-detail'], el => el.className === 'weapon-rule-summary');
const results = [];
function parity(label) {
  assert.equal(snapshot(pair[0]), snapshot(pair[1]), label);
  for (const h of pair) assert.deepEqual(h.faults, []);
  results.push({ label, exactStateRngActionsWrites: true });
}
async function inspect(location, id) {
  for (const h of pair) { const card = h.card(location, id); assert.ok(card, `${location} ${id}`); card.focus(); await card.click(); assert.equal(h.document.activeElement, h.card(location, id)); }
}
parity('unchanged earned canonical save loaded');
const familyItems = ['axe', 'rapier', 'club'].map(family => {
  const item = earned.inventory.find(item => resolveWeaponFamily(item) === family);
  assert.ok(item, `${family} naturally acquired within the fixed sample`); return { family, item };
});
const textMeasurements = [];
for (const { family, item } of familyItems) {
  const before = pair.map(snapshot);
  await inspect('inventory', item.id);
  const oldTrait = find(pair[0].dom['item-detail'], el => el.className === 'weapon-trait');
  const oldParagraphs = oldTrait.children.filter(el => el.tag === 'p').map(el => el.textContent);
  let details = detailsOf(pair[1]);
  assert.ok(details); assert.equal(details.open, false); assert.equal(details.dataset.weaponRuleId, item.id);
  const expandedParagraphs = details.children.filter(el => el.tag === 'p').map(el => el.textContent);
  assert.deepEqual(expandedParagraphs, oldParagraphs, `${family}: original full paragraphs exact`);
  const concise = ['weapon-trait-summary', 'weapon-trait-model'].map(className => {
    const node = find(pair[1].dom['item-detail'], el => el.className.split(' ').includes(className)); assert.ok(node); assert.ok(!details.contains(node)); return node.textContent;
  });
  const originalCount = codePoints(oldParagraphs.join(' ')), conciseCount = codePoints(concise.join(' '));
  assert.ok(conciseCount < originalCount, `${family}: shorter always-visible effect prose`);
  textMeasurements.push({ family, id: item.id, name: item.name, originalAlwaysVisibleEffectProseCodePoints: originalCount, v034AlwaysVisibleEffectProseCodePoints: conciseCount, reducedCodePoints: originalCount - conciseCount, reductionPercent: Number(((1 - conciseCount / originalCount) * 100).toFixed(1)), originalFullParagraphsPreserved: true });
  for (let repeat = 0; repeat < 3; repeat++) {
    details.open = true; await details.emit('toggle');
    const summary = summaryOf(pair[1]); summary.focus(); assert.equal(pair[1].document.activeElement, summary);
    pair[1].render(); details = detailsOf(pair[1]);
    assert.equal(details.open, true); assert.equal(pair[1].document.activeElement, summaryOf(pair[1]));
    details.open = false; await details.emit('toggle'); pair[1].render(); details = detailsOf(pair[1]);
    assert.equal(details.open, false); assert.equal(pair[1].document.activeElement, summaryOf(pair[1]));
  }
  pair.forEach((h, i) => assert.equal(snapshot(h), before[i]));
  parity(`${family} ${item.id}: three disclosure cycles and summary rerenders remain read-only`);
}
const axe = familyItems.find(row => row.family === 'axe').item;
const rapier = familyItems.find(row => row.family === 'rapier').item;
await inspect('inventory', axe.id); detailsOf(pair[1]).open = true;
await inspect('inventory', rapier.id); assert.equal(detailsOf(pair[1]).open, false);
await inspect('inventory', axe.id); assert.equal(detailsOf(pair[1]).open, false);
parity('switching exact item resets disclosure rather than remembering prior item expansion');

detailsOf(pair[1]).open = true;
for (const h of pair) { h.dom['slot-filter'].focus(); h.render(); assert.equal(h.document.activeElement, h.dom['slot-filter']); }
assert.equal(detailsOf(pair[1]).open, true);
parity('same item expansion survives rerender without stealing unrelated filter focus');
for (const h of pair) { h.dom['family-filter'].value = 'rapier'; await h.dom['family-filter'].emit('change'); }
assert.equal(detailsOf(pair[1]).open, true); assert.match(collect(pair[1].dom['item-detail']), /篩選外/);
parity('hidden selected axe retains explanation and expansion while filter changes no game state');
for (const h of pair) await h.dom['reset-inventory-filters'].click();
const unknown = earned.inventory.find(item => item.slot === 'weapon' && !resolveWeaponFamily(item));
assert.ok(unknown, 'original unknown-family starter retained naturally');
await inspect('inventory', unknown.id);
assert.match(collect(pair[1].dom['item-detail']), /不會觸發武器特效/);
assert.equal(detailsOf(pair[1]), undefined);
parity('unknown original starter remains explicit no-proc, without invented formula disclosure');

const equippedId = earned.equipment.weapon.id;
await inspect('equipment', equippedId);
assert.equal(detailsOf(pair[1]).open, false);
detailsOf(pair[1]).open = true;
for (const h of pair) { h.run('tabOwner=false'); h.render(); }
assert.equal(detailsOf(pair[1]).open, true);
summaryOf(pair[1]).focus(); pair[1].render(); assert.equal(pair[1].document.activeElement, summaryOf(pair[1]));
parity('readonly equipped weapon remains inspectable and same-ID summary focus survives');
for (const h of pair) { h.run('tabOwner=true'); h.render(); }

const beforeBattleWins = pair[0].state.wins;
for (const h of pair) { await h.dom['start-button'].click(); await h.dom['finish-camp-button'].click(); }
parity('after read-only equipment inspection, ordinary start and finish-to-camp actions are identical');
let controllerPulses = 0;
while (pair[0].state.mode === 'battle' && controllerPulses < 4000) {
  controllerPulses++;
  for (const h of pair) { h.at(controllerPulses * 250); h.tick(); h.render(); }
  assert.equal(snapshot(pair[0]), snapshot(pair[1]));
}
assert.equal(pair[0].state.mode, 'town'); assert.equal(pair[0].state.wins, beforeBattleWins + 1);
parity('ordinary source-controller battle completes once with identical rewards and final state');
const afterBattle = pair.map(snapshot);
for (let extra = 1; extra <= 8; extra++) for (const h of pair) { h.at((controllerPulses + extra) * 250); h.tick(); h.render(); }
pair.forEach((h, i) => assert.equal(snapshot(h), afterBattle[i]));
parity('eight post-finish pulses do not restart or duplicate rewards');
assert.deepEqual(hashes(), inputSha256, 'source inputs unchanged throughout measurement');

const output = {
  kind: 'v034 earned source-engine + focus-faithful simulated-DOM controller replay; NOT browser/layout/native keyboard/accessibility-tree acceptance',
  baselineCommit: '9e43771c5ea729d328f465ee5ce91cfcc6e8c90f', baselineInputSha256: baselineExpected,
  inputSha256, runnerSha256: sha(readFileSync(new URL(import.meta.url))), protocol,
  acquisition: { attempts: outcomes.length, pulses, wins: outcomes.filter(row => row.outcome === 'win').length, lossesOrCensors: outcomes.filter(row => row.outcome !== 'win'), level: earned.hero.level, gold: earned.hero.gold, inventory: earned.inventory.length, pending: earned.pendingLoot.length, fragments: earned.soulFragments, seeds: earned.worldSeeds, sourceParityChecks, canonicalSaveSha256: sha(json(earned)), outcomes },
  effectText: { unit: 'Unicode code points of the two effect prose paragraphs joined by one space; excludes headings, disclosure label, stats, actions and safety text. This is not a pixel, screen-height or scrolling measurement.', rows: textMeasurements },
  replay: { checks: results.length, disclosureCycles: 9, inspectedFamilyIds: familyItems.map(({ family, item }) => ({ family, id: item.id })), unknownId: unknown.id, equippedId, controllerQuarterSecondPulses: controllerPulses, completeControllerParityChecks: controllerPulses, finalWins: pair[1].state.wins, finalCanonicalSaveSha256: sha(json(engine.validateSave(JSON.parse(json(pair[1].state))))), results },
  limitations: 'The source DOM does not implement CSS layout, actual details keyboard activation, browser focus visibility, zoom or accessibility-tree/screen-reader behavior. Summary focus and disclosure toggling use the declared adapter, not native browser evidence. Harness runs unsupported-Web-Locks mode; tracked writes establish source behavior, not real durable browser storage or cross-tab ownership. No real private save, pending-loot overflow, binding/IW transaction or narrow/mobile viewport was exercised by this sample. No benefit/rate/balance conclusion follows from this fixed sample.',
};
const dest = process.env.EFFECT_READABILITY_OUTPUT ? pathToFileURL(resolve(process.env.EFFECT_READABILITY_OUTPUT)) : new URL('../docs/measurements/effect-readability-v034.json', import.meta.url);
mkdirSync(dirname(fileURLToPath(dest)), { recursive: true }); writeFileSync(dest, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ output: fileURLToPath(dest), sha256: sha(readFileSync(dest)), acquisition: output.acquisition, effectText: output.effectText, replay: output.replay }, null, 2));
