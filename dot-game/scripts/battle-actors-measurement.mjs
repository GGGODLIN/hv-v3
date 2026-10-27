/** Natural source/controller replay only. Canvas command instrumentation is NOT raster/browser acceptance. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import * as engine from '../src/engine.js';
import { scoreItem, resolveWeaponFamily } from '../src/loot.js';
import { fullUI, find } from '../tests/helpers/comparison-focus-harness.mjs';

const json = value => JSON.stringify(value);
const clone = value => JSON.parse(json(value));
const sha = value => createHash('sha256').update(value).digest('hex');
const root = new URL('../', import.meta.url);
const runnerSha256 = sha(readFileSync(new URL(import.meta.url)));
assert.ok(process.env.BASELINE_DOT_GAME, 'Set BASELINE_DOT_GAME to the separately restored exact accepted v034 source 7ade3e41161752c54cbfc4329000bc36e5d8716c dot-game');
const base = pathToFileURL(resolve(process.env.BASELINE_DOT_GAME) + '/');
assert.notEqual(fileURLToPath(base), fileURLToPath(root), 'baseline must be separate from candidate');
const baselineCommit = '7ade3e41161752c54cbfc4329000bc36e5d8716c';
const baselineExpected = {
  'CHECKPOINT.json': 'e3b65cc048e044519588486720678ea9d4a8c2c46a466199c6a6f21602c6bac5',
  'src/ui.js': 'a6d7c274be25174043e25d5882ae922bae0ba96640813e9e5d238f578cfcc90e',
  'index.html': 'dceca1b3574d2774611fb01c2c7cf8367c48bcb0b7a32b908e5b3e657cc8cbc7',
  'style.css': 'c92d96b2648f0ea908daa1e4849b4b1681e0a14d8177a41d24ce04b07b249225',
  'src/engine.js': '020c1717d24c20bd914241b3f30adbc091c5a2a851cec8917dca7fc403f21a6d',
  'src/loot.js': '2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7',
  'src/session.js': '821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a',
};
for (const [path, expected] of Object.entries(baselineExpected)) assert.equal(sha(readFileSync(new URL(path, base))), expected, `exact accepted v034 ${path}`);
const baselineManifest = JSON.parse(readFileSync(new URL('CHECKPOINT.json', base)));
for (const [path, entry] of Object.entries(baselineManifest.files)) {
  const bytes = readFileSync(new URL(path, base));
  assert.equal(bytes.length, entry.bytes, `baseline manifest bytes ${path}`);
  assert.equal(sha(bytes), entry.sha256, `baseline manifest SHA256 ${path}`);
}
for (const path of ['src/engine.js', 'src/loot.js', 'src/session.js']) assert.deepEqual(readFileSync(new URL(path, root)), readFileSync(new URL(path, base)), `unchanged ${path}`);
const baselineEngine = await import(new URL('src/engine.js', base));
const inputPaths = ['src/ui.js', 'index.html', 'style.css', 'src/engine.js', 'src/loot.js', 'src/session.js', 'tests/helpers/comparison-focus-harness.mjs'];
const hashes = () => Object.fromEntries(inputPaths.map(path => [path, sha(readFileSync(new URL(path, root)))]));
const inputSha256 = hashes();
function pathsUnder(path, location = root) {
  return readdirSync(new URL(path, location), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => entry.isDirectory() ? pathsUnder(`${path}/${entry.name}`, location) : [`${path}/${entry.name}`]);
}
const preservedPaths = ['tests/fixtures', 'tests/browser-fixtures', 'tests/helpers'].flatMap(path => pathsUnder(path, base));
const preservedManifest = () => preservedPaths.map(path => {
  const bytes = readFileSync(new URL(path, root));
  assert.deepEqual(bytes, readFileSync(new URL(path, base)), `preserved historical fixture/helper ${path}`);
  return [path, sha(bytes)];
});
const preservedInputSha256 = sha(json(preservedManifest()));
const protocol = {
  seed: 42, attempts: 20, maxStage: 5, maxPulsesPerFight: 1000, pulseSeconds: 1,
  acquisition: 'Fresh seed42, default Balanced. Before each of 20 attempts equip the highest-scored currently owned item per slot (later item wins ties), select min(5, already unlocked stage), start, queue finishThenCamp, advance one-second source pulses until town/defeat or 1000 pulses. Retain losses/censors; retreat after defeat. No grants, edited resources/stats/loot, sales, commissions, AP, binding, IW, rerolls or added attempts. Compare full state and full expedition reports with exact accepted v034 after every public action and pulse.',
  replay: 'Load the identical unchanged canonical earned camp save into baseline and candidate fullUI controllers plus a candidate no-animation control. Select the first owned axe, rapier and club in inventory-then-equipment order (record gaps if absent). Use real item-detail equip buttons. For each available family attempt routes1–5 once, using existing stage/start/finish-to-camp controls and 250ms pump pulses; retain losses/censors. Reduced motion is on for odd routes and off for even routes, changed through the real preference handler. No rerolls or outcome-conditioned extra attempts.',
  animation: 'Every controller action and pump pulse compares complete state, reports, logged actions and tracked storage writes across all three controllers. Baseline/candidate each perform two actual frame calls between simulation pulses; a second candidate runs the same actions/pump/render without frame/drawScene. Each frame-only pair must leave state/reports/actions/writes byte-identical. Also probe fresh-camp starter and hidden/readonly contexts. View-only particles/pulses may change; frame never advances the engine.',
  canvasAdapter: 'Existing comparison-focus-harness remains unchanged. Script-local methods are attached to its empty ctx object, count standard canvas commands, reject nonfinite numeric arguments and check save/restore balance. No rasterization, image comparison, layout, browser, actual rAF scheduling, native input or accessibility claim. Cosmetic Math.random is fixed to .42 only in each VM; engine RNG remains its original state-seeded function.',
};
const classify = enemy => enemy.boss ? 'boss' : ({ '灰霧獵犬': 'hound', '碎晶甲蟲': 'beetle', '荒野影獸': 'shadowbeast', '赤砂守衛': 'guard' }[enemy.name] || 'unknown');
function encounterTracker() {
  const map = new Map();
  return {
    observe(s) { for (const enemy of s.enemies) {
      const kind = classify(enemy);
      if (!map.has(kind)) map.set(kind, { kind, firstId: enemy.id, firstName: enemy.name, stages: new Set(), waves: new Set(), ids: new Set(), alternatingAttackSeen: false });
      const row = map.get(kind); row.stages.add(s.stage); row.waves.add(s.wave); row.ids.add(enemy.id); row.alternatingAttackSeen ||= enemy.attackPattern === 'alternating';
    } },
    rows() { return [...map.values()].sort((a, b) => a.kind.localeCompare(b.kind)).map(row => ({ kind: row.kind, firstId: row.firstId, firstName: row.firstName, stages: [...row.stages].sort((a, b) => a - b), waves: [...row.waves].sort((a, b) => a - b), uniqueEnemyIds: row.ids.size, alternatingAttackSeen: row.alternatingAttackSeen })); },
  };
}
const state = engine.createGame(protocol.seed), oldState = baselineEngine.createGame(protocol.seed), outcomes = [], sourceEncounters = encounterTracker();
let sourceParityChecks = 0, sourcePulses = 0;
function sameSource() {
  assert.equal(json(state), json(oldState), 'complete natural source state/RNG parity');
  assert.equal(json(engine.expeditionReports(state)), json(baselineEngine.expeditionReports(oldState)), 'complete natural source report parity');
  sourceParityChecks++; sourceEncounters.observe(state);
}
function act(action, payload) { engine.act(state, action, payload); baselineEngine.act(oldState, action, payload); sameSource(); }
sameSource();
for (let attempt = 1; attempt <= protocol.attempts; attempt++) {
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const best = [state.equipment[slot], ...state.inventory.filter(item => item.slot === slot)].reduce((a, b) => scoreItem(a) > scoreItem(b) ? a : b);
    if (best.id !== state.equipment[slot].id) act('equip', best.id);
  }
  const stage = Math.min(protocol.maxStage, state.unlocked);
  act('selectStage', stage); assert.equal(state.stage, stage); act('start'); assert.equal(state.mode, 'battle'); act('finishThenCamp', true);
  let pulses = 0;
  while (state.mode === 'battle' && pulses < protocol.maxPulsesPerFight) {
    engine.advance(state, 1); baselineEngine.advance(oldState, 1); sameSource(); pulses++; sourcePulses++;
  }
  outcomes.push({ attempt, stage, pulses, outcome: state.mode === 'battle' ? 'censored' : engine.expeditionReports(state)[0]?.outcome ?? 'no-report', stateSha256: sha(json(state)), reportsSha256: sha(json(engine.expeditionReports(state))) });
  if (state.mode === 'battle') break;
  if (state.mode === 'defeat') act('retreat');
}
const earned = engine.validateSave(clone(state));
assert.equal(json(earned), json(baselineEngine.validateSave(clone(oldState))), 'canonical earned-save parity');
const familyItems = ['axe', 'rapier', 'club'].map(family => ({ family, item: [...earned.inventory, ...Object.values(earned.equipment)].find(item => resolveWeaponFamily(item) === family) }));
const gaps = familyItems.filter(row => !row.item).map(row => `No naturally owned ${row.family} in fixed 20-attempt acquisition; that controller branch was not run.`);
const reachedStages = [...new Set(outcomes.map(row => row.stage))].sort((a, b) => a - b);
if (reachedStages.length < 5) gaps.push(`Only ${reachedStages.length} naturally unlocked/attempted stages; no stage was granted.`);
for (const kind of ['hound', 'beetle', 'shadowbeast', 'guard', 'boss']) if (!sourceEncounters.rows().some(row => row.kind === kind)) gaps.push(`Natural acquisition did not expose ${kind}.`);

function harness(initial, baseline = false) {
  const h = fullUI(initial, baseline ? { source: readFileSync(new URL('src/ui.js', base), 'utf8'), html: readFileSync(new URL('index.html', base), 'utf8') } : {});
  h.run(`
    Math.random = () => .42;
    const measuredCanvas = { commands: 0, calls: {}, depth: 0, maximumDepth: 0 };
    const measuredCommand = (name, args) => {
      for (const value of args.flat()) if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('nonfinite canvas ' + name);
      measuredCanvas.commands++; measuredCanvas.calls[name] = (measuredCanvas.calls[name] || 0) + 1;
      if (name === 'save') { measuredCanvas.depth++; measuredCanvas.maximumDepth = Math.max(measuredCanvas.maximumDepth, measuredCanvas.depth); }
      if (name === 'restore' && --measuredCanvas.depth < 0) throw new Error('unbalanced canvas restore');
    };
    for (const name of ['save','restore','translate','scale','rotate','beginPath','closePath','moveTo','lineTo','arc','ellipse','fill','stroke','fillRect','strokeRect','clearRect','setTransform','resetTransform','quadraticCurveTo','bezierCurveTo','setLineDash','roundRect','fillText','strokeText','clip']) ctx[name] = (...args) => measuredCommand(name, args);
    for (const name of ['createLinearGradient','createRadialGradient']) ctx[name] = (...args) => { measuredCommand(name,args); return { addColorStop(...args) { measuredCommand('addColorStop',args); } }; };
    ctx.measureText = text => ({ width: String(text).length * 3 });
  `);
  return h;
}
const snapshot = h => json({ state: h.state, reports: engine.expeditionReports(h.state), calls: h.calls, writes: h.writes });
let controllerParityChecks = 0, animationNonmutationChecks = 0, frameCalls = 0, controllerPulses = 0, postFinishPulses = 0;
let frameClock = 0;
const checkpoints = [], controllerEncounters = encounterTracker(), replayOutcomes = [];
function parity(group, label, record = false) {
  const expected = snapshot(group[0]);
  for (const h of group) { assert.equal(snapshot(h), expected, label); assert.deepEqual(h.faults, [], `${label}: no controller errors`); }
  controllerParityChecks++; if (record) checkpoints.push(label);
}
function animate(group, label) {
  for (const h of group.slice(0, 2)) {
    const before = snapshot(h);
    for (let repeat = 0; repeat < 2; repeat++) { frameClock += 16; h.run(`frame(${frameClock})`); frameCalls++; }
    assert.equal(snapshot(h), before, `${label}: frame does not change state/reports/actions/writes`);
    assert.equal(h.run('measuredCanvas.depth'), 0, `${label}: balanced canvas state`);
    animationNonmutationChecks++;
  }
  parity(group, label);
}
const fresh = [harness(engine.createGame(42), true), harness(engine.createGame(42)), harness(engine.createGame(42))];
animate(fresh, 'fresh starter camp animation');
parity(fresh, 'original unknown-family starter is rendered without mutation', true);
const group = [harness(earned, true), harness(earned), harness(earned)];
parity(group, 'unchanged canonical earned save loaded into three controllers', true);
let simulationClock = 0;
for (const { family, item } of familyItems.filter(row => row.item)) {
  for (const h of group) {
    if (h.state.equipment.weapon.id !== item.id) {
      const card = h.card('inventory', item.id); assert.ok(card, `${family} real owned inventory ID`); await card.click();
      const equip = find(h.dom['item-detail'], el => el.tag === 'button' && el.textContent === '換上裝備');
      assert.ok(equip && !equip.disabled, `${family} actual equip action available`); await equip.click();
    }
    assert.equal(h.state.equipment.weapon.id, item.id);
  }
  parity(group, `naturally acquired ${family} ${item.id} equipped by original UI action`, true);
  animate(group, `${family} camp rendering`);
  for (let stage = 1; stage <= 5; stage++) {
    const reducedMotion = stage % 2 === 1;
    for (const h of group) { h.dom['motion-toggle'].checked = reducedMotion; await h.dom['motion-toggle'].emit('change'); }
    parity(group, `${family} route${stage} original motion-preference handler`);
    for (const h of group) { h.dom['stage-select'].value = stage; await h.dom['stage-select'].emit('change'); }
    parity(group, `${family} route${stage} original stage handler`);
    for (const h of group) { assert.equal(h.dom['start-button'].disabled, false); await h.dom['start-button'].click(); assert.equal(h.state.mode, 'battle'); }
    parity(group, `${family} route${stage} original start handler`);
    for (const h of group) await h.dom['finish-camp-button'].click();
    parity(group, `${family} route${stage} original finish-to-camp handler`);
    let pulses = 0;
    while (group[0].state.mode === 'battle' && pulses < protocol.maxPulsesPerFight * 4) {
      controllerEncounters.observe(group[1].state); animate(group, `${family} route${stage} before simulation pulse`);
      simulationClock += 250; pulses++; controllerPulses++;
      for (const h of group) { h.at(simulationClock); h.tick(); h.render(); }
      parity(group, `${family} route${stage} simulation pulse${pulses}`);
    }
    const end = group[1].state, outcome = end.mode === 'battle' ? 'censored' : engine.expeditionReports(end)[0]?.outcome ?? 'no-report';
    replayOutcomes.push({ family, id: item.id, stage, reducedMotion, pulses, outcome, stateSha256: sha(json(end)), reportsSha256: sha(json(engine.expeditionReports(end))) });
    parity(group, `${family} route${stage} terminal ${outcome}`, true);
    if (end.mode === 'battle') { gaps.push(`${family} route${stage} censored after fixed limit; remaining replay stopped.`); break; }
    if (end.mode === 'defeat') { for (const h of group) await h.dom['retreat-button'].click(); parity(group, `${family} route${stage} original retreat handler`); }
    const before = group.map(snapshot);
    for (let extra = 0; extra < 8; extra++) {
      simulationClock += 250; postFinishPulses++;
      for (const h of group) { h.at(simulationClock); h.tick(); h.render(); }
      group.forEach((h, index) => assert.equal(snapshot(h), before[index], 'each post-finish pulse is inert'));
      parity(group, `${family} route${stage} post-finish pulse${extra + 1}`);
    }
    group.forEach((h, index) => assert.equal(snapshot(h), before[index], 'post-finish camp pulses do not duplicate rewards or restart'));
    animate(group, `${family} route${stage} post-finish render`);
  }
  if (group[0].state.mode === 'battle') break;
}
for (const h of group) { h.run('tabOwner=false'); h.render(); }
animate(group, 'readonly frame-only context'); parity(group, 'readonly rendering remains game-state and storage neutral', true);
for (const h of group) h.document.hidden = true;
animate(group, 'hidden frame-only context'); parity(group, 'hidden frames remain game-state and storage neutral', true);
for (const h of group) { h.document.hidden = false; h.run('tabOwner=true'); h.render(); }
animate(group, 'restored visible context');
assert.deepEqual(hashes(), inputSha256, 'all source replay inputs frozen throughout measurement');
assert.equal(sha(readFileSync(new URL(import.meta.url))), runnerSha256, 'runner frozen throughout measurement');
assert.equal(sha(json(preservedManifest())), preservedInputSha256, 'historical fixture/helper inputs preserved');
const output = {
  kind: 'v035 natural source-engine plus simulated-DOM canvas-command controller regression; NOT browser/raster/layout/native keyboard/AT acceptance',
  baselineCommit, baselineInputSha256: baselineExpected, baselineManifestFilesVerified: Object.keys(baselineManifest.files).length,
  inputSha256, runnerSha256,
  preservedInputs: { historicalFixtures: preservedPaths.filter(path => path.startsWith('tests/fixtures/')).length, browserFixtures: preservedPaths.filter(path => path.startsWith('tests/browser-fixtures/')).length, helpers: preservedPaths.filter(path => path.startsWith('tests/helpers/')).length, manifestSha256: preservedInputSha256, exactAcceptedV034Bytes: true },
  protocol,
  acquisition: { attempts: outcomes.length, sourcePulses, sourceParityChecks, wins: outcomes.filter(row => row.outcome === 'win').length, lossesOrCensors: outcomes.filter(row => row.outcome !== 'win'), reachedStages, level: earned.hero.level, gold: earned.hero.gold, inventory: earned.inventory.length, pending: earned.pendingLoot.length, fragments: earned.soulFragments, seeds: earned.worldSeeds, canonicalSaveSha256: sha(json(earned)), encounters: sourceEncounters.rows(), outcomes },
  replay: { acquiredWeapons: familyItems.map(({ family, item }) => ({ family, id: item?.id ?? null, name: item?.name ?? null })), controllerParityChecks, animationNonmutationChecks, frameCalls, controllerPulses, postFinishPulses, attempts: replayOutcomes.length, wins: replayOutcomes.filter(row => row.outcome === 'win').length, lossesOrCensors: replayOutcomes.filter(row => row.outcome !== 'win'), finalWins: group[1].state.wins, finalCanonicalSaveSha256: sha(json(engine.validateSave(clone(group[1].state)))), encounters: controllerEncounters.rows(), visibleSceneCalls: { baseline: group[0].run("measuredCanvas.calls.createLinearGradient || 0"), candidate: group[1].run("measuredCanvas.calls.createLinearGradient || 0"), noAnimationControl: group[2].run("measuredCanvas.calls.createLinearGradient || 0") }, canvasCommandCounts: { baseline: group[0].run('measuredCanvas.commands'), candidate: group[1].run('measuredCanvas.commands'), noAnimationControl: group[2].run('measuredCanvas.commands') }, checkpoints, outcomes: replayOutcomes },
  gaps,
  limitations: 'Fixed deterministic sample, not a balance/rate/quality conclusion. Existing fullUI source DOM and script-local canvas commands do not render pixels or exercise CSS, actual frame scheduling, native keyboard, focus visibility, mobile, zoom or accessibility tree. Harness uses unsupported-Web-Locks temporary mode: tracked write parity is not real browser persistence/cross-tab acceptance. Natural camp save is a generated protocol result, not a user private save. No pending overflow, binding/IW or weapon-family unknown-enemy fallback fabrication is claimed by this sample; existing independent tests cover separate boundaries. Full-state/report equality includes RNG and gameplay policies, but source regression is not hosted acceptance. Supplied accepted commit identity is pinned by CHECKPOINT hash and its complete 389-file manifest; this restored directory has no Git metadata and this runner performs no remote lookup.'
};
const dest = process.env.BATTLE_ACTORS_OUTPUT ? pathToFileURL(resolve(process.env.BATTLE_ACTORS_OUTPUT)) : new URL('../docs/battle-actors-measurements.json', import.meta.url);
writeFileSync(dest, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ output: fileURLToPath(dest), sha256: sha(readFileSync(dest)), acquisition: { attempts: output.acquisition.attempts, wins: output.acquisition.wins, stages: reachedStages, sourceParityChecks }, replay: { attempts: output.replay.attempts, wins: output.replay.wins, controllerParityChecks, animationNonmutationChecks, frameCalls, controllerPulses }, gaps }, null, 2));
