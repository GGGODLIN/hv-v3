/** Natural source/controller regression; canvas commands are NOT browser/raster acceptance. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import * as engine from '../src/engine.js';
import { scoreItem, resolveWeaponFamily } from '../src/loot.js';
import { fullUI, find } from '../tests/helpers/comparison-focus-harness.mjs';

const json = value => JSON.stringify(value), clone = value => JSON.parse(json(value));
const sha = value => createHash('sha256').update(value).digest('hex');
const root = new URL('../', import.meta.url);
assert.ok(process.env.BASELINE_DOT_GAME, 'Set BASELINE_DOT_GAME to exact frozen v037 source 0de5f53220a7660c1fb0c7a304fcd6aa4ebcac8c dot-game');
const base = pathToFileURL(resolve(process.env.BASELINE_DOT_GAME) + '/');
assert.notEqual(fileURLToPath(base), fileURLToPath(root), 'use a separate baseline');
const baselineCommit = '0de5f53220a7660c1fb0c7a304fcd6aa4ebcac8c';
const baselinePins = {
  "CHECKPOINT.json": "5a48af32843485dc270175755f9ac708b60cd9763e15930ea34ce28ba310e238",
  "src/ui.js": "ddfdb6cacd727a421c0387d5a257ef98df65a3ba16333db8bee1eee956399f48",
  "index.html": "5dacdb593f9a0258a0b6d82f4c3b2acb4429305df59f02e0640fd0e11ea3dade",
  "style.css": "c92d96b2648f0ea908daa1e4849b4b1681e0a14d8177a41d24ce04b07b249225",
  "src/engine.js": "020c1717d24c20bd914241b3f30adbc091c5a2a851cec8917dca7fc403f21a6d",
  "src/loot.js": "2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7",
  "src/session.js": "821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a"
};
for (const [path, hash] of Object.entries(baselinePins)) assert.equal(sha(readFileSync(new URL(path, base))), hash, `frozen v037 source ${path}`);
const manifest = JSON.parse(readFileSync(new URL('CHECKPOINT.json', base)));
for (const [path, entry] of Object.entries(manifest.files)) {
  const bytes = readFileSync(new URL(path, base));
  assert.equal(bytes.length, entry.bytes, `baseline bytes ${path}`);
  assert.equal(sha(bytes), entry.sha256, `baseline SHA256 ${path}`);
}
for (const path of ['src/engine.js', 'src/loot.js', 'src/session.js', 'style.css']) assert.deepEqual(readFileSync(new URL(path, root)), readFileSync(new URL(path, base)), `unchanged ${path}`);
const oldEngine = await import(new URL('src/engine.js', base));
const ui = readFileSync(new URL('src/ui.js', root), 'utf8'), oldUI = readFileSync(new URL('src/ui.js', base), 'utf8');
function actorBody(source) {
  const start = source.indexOf('function drawHero('), end = source.indexOf('function drawScene(', start);
  assert.ok(start >= 0 && end > start, 'complete actor and overlay boundary exists');
  return source.slice(start, end);
}
function chestSlice(source) {
  const start = source.indexOf('  if(!enemies.length){', source.indexOf('function drawScene('));
  const end = source.indexOf('  // Front grass and vignette.', start);
  assert.ok(start >= 0 && end > start, 'exclusive chest branch boundary exists');
  return { start, end, body: source.slice(start, end) };
}
function outsideChest(source) {
  const { start, end } = chestSlice(source);
  return source.slice(0, start) + '/* original chest drawing-only slice */\n' + source.slice(end);
}
assert.equal(actorBody(ui), actorBody(oldUI), 'complete hero, enemy and nameplate overlay unchanged');
assert.equal(outsideChest(ui), outsideChest(oldUI), 'entire UI outside original chest branch unchanged');
assert.notEqual(chestSlice(ui).body, chestSlice(oldUI).body, 'candidate chest drawing differs');
assert.ok(!chestSlice(ui).body.includes('ctx.arc('), 'old circular halo removed');
const inputPaths = ['src/ui.js', 'index.html', 'style.css', 'src/engine.js', 'src/loot.js', 'src/session.js', 'tests/helpers/comparison-focus-harness.mjs'];
const inputHashes = () => Object.fromEntries(inputPaths.map(path => [path, sha(readFileSync(new URL(path, root)))]));
const inputSha256 = inputHashes(), runnerSha256 = sha(readFileSync(new URL(import.meta.url)));
function pathsUnder(path, location) {
  return readdirSync(new URL(path, location), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(e => e.isDirectory() ? pathsUnder(`${path}/${e.name}`, location) : [`${path}/${e.name}`]);
}
const preservedDirs = ['tests/fixtures', 'tests/browser-fixtures', 'tests/helpers', 'assets'];
const preservedPaths = preservedDirs.flatMap(path => pathsUnder(path, base));
function preservedHashes() {
  assert.deepEqual(preservedDirs.flatMap(path => pathsUnder(path, root)), preservedPaths, 'no added/deleted historical fixture/helper');
  return preservedPaths.map(path => {
    const bytes = readFileSync(new URL(path, root));
    assert.deepEqual(bytes, readFileSync(new URL(path, base)), `unchanged fixture/helper ${path}`);
    return [path, sha(bytes)];
  });
}
const preservedSha256 = sha(json(preservedHashes()));
const historicalScripts = pathsUnder('scripts', base);
function historicalScriptHashes() {
  return historicalScripts.map(path => {
    const bytes = readFileSync(new URL(path, root));
    assert.deepEqual(bytes, readFileSync(new URL(path, base)), `unchanged historical script ${path}`);
    return [path, sha(bytes)];
  });
}
const historicalScriptsSha256 = sha(json(historicalScriptHashes()));

const protocol = {
  seed: 42, acquisitionAttempts: 20, maximumStage: 5, maximumFightSeconds: 1000,
  acquisition: 'Fresh unedited createGame(42), default Balanced. Before each attempt equip the highest-scored already-owned item per slot (later wins ties), select min(5, already-unlocked stage), start and queue finishThenCamp. Advance 1-second pulses; retain all outcomes and retreat on defeat. No grants, progress injection, sales, commissions, AP, binding, IW, rerolls or outcome-conditioned extra attempts.',
  replay: 'Load the exact naturally earned canonical camp result into frozen v037 source UI, candidate UI and candidate no-frame control. First owned axe/rapier/club in inventory-then-equipment order, equipped through actual item-detail buttons; each attempts routes 1–5 once. Use existing stage/start/finish-to-camp handlers, 250ms pump pulses, reduced motion on odd routes and off on even routes. Compare full state (including RNG/events), full reports, action log and tracked writes after every action/pulse. Two frame calls before and after every battle pulse must preserve those complete snapshots. No-frame control performs identical pump/render/actions.',
  canvas: 'Script-local adapter on unchanged fullUI empty canvas context; finite command arguments and balanced save/restore. No pixels, CSS, browser, native input, AT or rAF scheduling. Cosmetic VM Math.random fixed at .42; state-seeded engine RNG unmodified. Only the no-enemies chest commands intentionally differ; complete UI outside that branch, including background, actors, nameplates, foreground and handlers remains byte-identical. Baseline UI uses the byte-identical candidate engine/session/loot modules in fullUI; core acquisition additionally imports baseline engine independently.',
};
function observations() {
  const kinds = new Set(), stages = new Set(), effects = { penetration: 0, stun: 0, recoveryPending: 0, bleed: 0 }, first = {}, seen = new Set();
  return {
    observe(s) {
      const tick = s.timing?.ticks || 0;
      for (const e of s.enemies) {
        kinds.add(e.boss ? 'boss' : e.name); stages.add(s.stage);
        if (e.hp <= 0) continue;
        const stun = engine.stunStatus(e, tick);
        const active = { penetration: engine.penetratedArmorStatus(e, tick), stun: stun && !stun.recoveryPending ? stun : null, recoveryPending: stun?.recoveryPending ? stun : null, bleed: engine.bleedStatus(e, tick) };
        for (const [key, value] of Object.entries(active)) if (value) {
          const sample = json([key, e.id, s.stage, s.wave, tick, s._clock]);
          if (seen.has(sample)) continue;
          seen.add(sample); effects[key]++;
          first[key] ??= { id: e.id, name: e.name, stage: s.stage, wave: s.wave, tick, value, stateSha256: sha(json(s)) };
        }
      }
    },
    result() { return { enemyKinds: [...kinds].sort(), stages: [...stages].sort((a,b) => a-b), activeEffectSamples: effects, firstActiveEffectWitnesses: first, effectsNotObserved: Object.keys(effects).filter(key => !effects[key]) }; },
  };
}
const sourceSeen = observations(), controllerSeen = observations();
const state = engine.createGame(42), oldState = oldEngine.createGame(42);
const natural = [], sourceLedger = createHash('sha256');
let sourceChecks = 0, sourcePulses = 0;
const sourceSnapshot = (s, module = engine) => json({ state: s, events: s.events, reports: module.expeditionReports(s) });
function sourceParity() {
  const snapshot = sourceSnapshot(state);
  assert.equal(snapshot, sourceSnapshot(oldState, oldEngine), 'complete natural state/events/reports/RNG equality');
  sourceLedger.update(snapshot + '\n'); sourceChecks++; sourceSeen.observe(state);
}
function act(action, payload) { engine.act(state, action, payload); oldEngine.act(oldState, action, payload); sourceParity(); }
sourceParity();
for (let attempt = 1; attempt <= protocol.acquisitionAttempts; attempt++) {
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const best = [state.equipment[slot], ...state.inventory.filter(item => item.slot === slot)].reduce((a,b) => scoreItem(a) > scoreItem(b) ? a : b);
    if (best.id !== state.equipment[slot].id) act('equip', best.id);
  }
  const stage = Math.min(5, state.unlocked);
  act('selectStage', stage); assert.equal(state.stage, stage); act('start'); assert.equal(state.mode, 'battle'); act('finishThenCamp', true);
  let pulses = 0;
  while (state.mode === 'battle' && pulses < protocol.maximumFightSeconds) {
    engine.advance(state, 1); oldEngine.advance(oldState, 1); sourceParity(); pulses++; sourcePulses++;
  }
  natural.push({ attempt, stage, pulses, outcome: state.mode === 'battle' ? 'censored' : engine.expeditionReports(state)[0]?.outcome ?? 'no-report', completeSnapshotSha256: sha(sourceSnapshot(state)) });
  if (state.mode === 'battle') break;
  if (state.mode === 'defeat') act('retreat');
}
const earned = engine.validateSave(clone(state));
assert.equal(json(earned), json(oldEngine.validateSave(clone(oldState))), 'unaltered canonical earned save parity');
const weapons = ['axe', 'rapier', 'club'].map(family => ({ family, item: [...earned.inventory, ...Object.values(earned.equipment)].find(item => resolveWeaponFamily(item) === family) }));
const gaps = weapons.filter(row => !row.item).map(row => `No naturally acquired ${row.family}; branch not fabricated.`);
if (earned.unlocked < 5) gaps.push(`Only stage ${earned.unlocked} unlocked naturally; locked routes not fabricated.`);
function harness(initial, baseline = false) {
  const h = fullUI(initial, baseline ? { source: oldUI, html: readFileSync(new URL('index.html', base), 'utf8') } : {});
  h.run(`
    Math.random = () => .42;
    const measuredCanvas = { commands: 0, depth: 0, scenes: 0 };
    const measuredCommand = (name, args) => {
      for (const value of args.flat()) if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('nonfinite canvas ' + name);
      measuredCanvas.commands++;
      if (name === 'save') measuredCanvas.depth++;
      if (name === 'restore' && --measuredCanvas.depth < 0) throw new Error('canvas restore underflow');
    };
    for (const name of ['save','restore','translate','scale','rotate','beginPath','closePath','moveTo','lineTo','arc','ellipse','fill','stroke','fillRect','strokeRect','clearRect','setTransform','resetTransform','quadraticCurveTo','bezierCurveTo','setLineDash','roundRect','fillText','strokeText','clip']) ctx[name] = (...args) => measuredCommand(name,args);
    for (const name of ['createLinearGradient','createRadialGradient']) ctx[name] = (...args) => { measuredCommand(name,args); return { addColorStop(...args) { measuredCommand('addColorStop',args); } }; };
    ctx.measureText = text => ({ width: String(text).length * 3 });
    const measuredOriginalDrawScene = drawScene;
    drawScene = (...args) => { measuredCanvas.scenes++; return measuredOriginalDrawScene(...args); };
  `);
  return h;
}
const snapshot = h => json({ state: h.state, events: h.state.events, reports: engine.expeditionReports(h.state), calls: h.calls, writes: h.writes });
const controllerLedger = createHash('sha256');
let controllerChecks = 0, frameNonmutationChecks = 0, frameCalls = 0, frameClock = 0, controllerPulses = 0, postFinishPulses = 0;
function parity(group, label) {
  const expected = snapshot(group[0]);
  for (const h of group) { assert.equal(snapshot(h), expected, label); assert.deepEqual(h.faults, [], label + ': no controller errors'); }
  controllerLedger.update(expected + '\n'); controllerChecks++;
}
function frames(group, label) {
  for (const h of group.slice(0,2)) {
    const before = snapshot(h);
    for (let repeat = 0; repeat < 2; repeat++) { frameClock += 16; h.run(`frame(${frameClock})`); frameCalls++; }
    assert.equal(snapshot(h), before, label + ': frame-only state/events/reports/actions/writes unchanged');
    assert.equal(h.run('measuredCanvas.depth'), 0, label + ': balanced canvas'); frameNonmutationChecks++;
  }
  parity(group, label);
}
frames([harness(engine.createGame(42), true), harness(engine.createGame(42)), harness(engine.createGame(42))], 'fresh starter camp');
const group = [harness(earned, true), harness(earned), harness(earned)], replay = [];
parity(group, 'same unedited natural canonical result loaded');
let clock = 0;
for (const { family, item } of weapons.filter(row => row.item)) {
  for (const h of group) {
    if (h.state.equipment.weapon.id !== item.id) {
      const card = h.card('inventory', item.id); assert.ok(card, 'actual naturally owned item'); await card.click();
      const equip = find(h.dom['item-detail'], el => el.tag === 'button' && el.textContent === '換上裝備');
      assert.ok(equip && !equip.disabled); await equip.click();
    }
    assert.equal(h.state.equipment.weapon.id, item.id);
  }
  parity(group, family + ' equipped using real UI'); frames(group, family + ' camp');
  for (let stage = 1; stage <= Math.min(5, earned.unlocked); stage++) {
    const reducedMotion = stage % 2 === 1;
    for (const h of group) { h.dom['motion-toggle'].checked = reducedMotion; await h.dom['motion-toggle'].emit('change'); }
    parity(group, 'original motion handler');
    for (const h of group) { h.dom['stage-select'].value = stage; await h.dom['stage-select'].emit('change'); }
    parity(group, 'original stage handler');
    for (const h of group) { assert.equal(h.dom['start-button'].disabled, false); await h.dom['start-button'].click(); assert.equal(h.state.mode, 'battle'); }
    parity(group, 'original start handler');
    for (const h of group) await h.dom['finish-camp-button'].click();
    parity(group, 'original finish-to-camp handler');
    let pulses = 0;
    while (group[0].state.mode === 'battle' && pulses < protocol.maximumFightSeconds * 4) {
      controllerSeen.observe(group[1].state); frames(group, 'before battle pulse');
      clock += 250; pulses++; controllerPulses++;
      for (const h of group) { h.at(clock); h.tick(); h.render(); }
      parity(group, 'after battle pulse'); controllerSeen.observe(group[1].state); frames(group, 'after battle pulse');
    }
    const end = group[1].state, outcome = end.mode === 'battle' ? 'censored' : engine.expeditionReports(end)[0]?.outcome ?? 'no-report';
    replay.push({ family, stage, reducedMotion, pulses, outcome, completeSnapshotSha256: sha(snapshot(group[1])) });
    if (end.mode === 'battle') { gaps.push(`${family} route${stage} censored; replay stopped.`); break; }
    if (end.mode === 'defeat') { for (const h of group) await h.dom['retreat-button'].click(); parity(group, 'original defeat retreat'); }
    const before = group.map(snapshot);
    for (let i = 0; i < 8; i++) {
      clock += 250; postFinishPulses++;
      for (const h of group) { h.at(clock); h.tick(); h.render(); }
      group.forEach((h, n) => assert.equal(snapshot(h), before[n], 'post-finish pulses never restart or repeat rewards'));
      parity(group, 'inert post-finish pulse');
    }
    frames(group, 'post-finish camp');
  }
  if (group[0].state.mode === 'battle') break;
}
for (const h of group) { h.run('tabOwner=false'); h.render(); }
frames(group, 'readonly rendering');
for (const h of group) h.document.hidden = true;
frames(group, 'hidden frame early-exit');
for (const h of group) { h.document.hidden = false; h.run('tabOwner=true'); h.render(); }
frames(group, 'restored visible rendering');
// Serialize only the normally earned end state, then load through validation and fullUI.
const serializedFinal = json(group[1].state);
const reloadedCanonical = engine.validateSave(JSON.parse(serializedFinal));
assert.equal(json(reloadedCanonical), json(oldEngine.validateSave(JSON.parse(serializedFinal))), 'natural final reload canonical parity');
const reloadGroup = [harness(reloadedCanonical, true), harness(reloadedCanonical), harness(reloadedCanonical)];
parity(reloadGroup, 'serialized final save loaded into all controllers');
frames(reloadGroup, 'reloaded camp');
const reloadEvidence = { serializedSha256: sha(serializedFinal), canonicalSha256: sha(json(reloadedCanonical)), loadedStateSha256: sha(json(reloadGroup[1].state)), fullControllerParity: true, realBrowserStorage: false };
assert.deepEqual(inputHashes(), inputSha256, 'source inputs frozen throughout replay');
assert.equal(sha(readFileSync(new URL(import.meta.url))), runnerSha256, 'runner frozen throughout replay');
for (const [path, hash] of Object.entries(baselinePins)) assert.equal(sha(readFileSync(new URL(path, base))), hash, `baseline still frozen ${path}`);
assert.equal(sha(json(preservedHashes())), preservedSha256, 'historical fixtures/helpers/assets remain untouched');
assert.equal(sha(json(historicalScriptHashes())), historicalScriptsSha256, 'historical scripts remain untouched');
const sourceObservations = sourceSeen.result(), controllerObservations = controllerSeen.result();
for (const [phase, seen] of [['acquisition', sourceObservations], ['controller', controllerObservations]]) for (const effect of seen.effectsNotObserved) gaps.push(`${phase}: active ${effect} not naturally observed; no synthetic substitute claimed.`);
const output = {
  kind: 'v038 natural source plus simulated-DOM/canvas-command regression, NOT browser/raster acceptance',
  baseline: { commit: baselineCommit, pins: baselinePins, fullManifestFilesVerified: Object.keys(manifest.files).length },
  inputSha256, runnerSha256, unchangedActorBodySha256: sha(actorBody(ui)), unchangedOutsideChestSha256: sha(outsideChest(ui)), baselineChestSha256: sha(chestSlice(oldUI).body), candidateChestSha256: sha(chestSlice(ui).body),
  preservedInputs: { fixtures: preservedPaths.filter(p => p.startsWith('tests/fixtures/')).length, browserFixtures: preservedPaths.filter(p => p.startsWith('tests/browser-fixtures/')).length, helpers: preservedPaths.filter(p => p.startsWith('tests/helpers/')).length, manifestSha256: preservedSha256, assets: preservedPaths.filter(p => p.startsWith('assets/')).length, historicalScripts: historicalScripts.length, historicalScriptsSha256, exactFrozenV037SourceBytes: true, noFilesAddedOrDeleted: true },
  protocol,
  acquisition: { attempts: natural.length, wins: natural.filter(row => row.outcome === 'win').length, sourcePulses, fullParityChecks: sourceChecks, orderedFullSnapshotLedgerSha256: sourceLedger.digest('hex'), reachedStages: [...new Set(natural.map(row => row.stage))], level: earned.hero.level, gold: earned.hero.gold, inventory: earned.inventory.length, pending: earned.pendingLoot.length, fragments: earned.soulFragments, worldSeeds: earned.worldSeeds, canonicalSaveSha256: sha(json(earned)), observations: sourceObservations, outcomes: natural },
  replay: { weapons: weapons.map(({family,item}) => ({family,id:item?.id ?? null,name:item?.name ?? null})), attempts: replay.length, wins: replay.filter(row => row.outcome === 'win').length, controllerPulses, postFinishPulses, fullParityChecks: controllerChecks, orderedFullSnapshotLedgerSha256: controllerLedger.digest('hex'), frameNonmutationChecks, frameCalls, finalWins: group[1].state.wins, finalCanonicalSaveSha256: sha(json(engine.validateSave(clone(group[1].state)))), canvas: group.map((h,i) => ({ controller: ['baseline','candidate','noFrameControl'][i], ...clone(h.run('measuredCanvas')) })), observations: controllerObservations, outcomes: replay },
  reload: reloadEvidence,
  gaps,
  limitations: 'Fixed deterministic sample, not balance/win-rate/visual-readability/performance evidence. Existing fullUI uses unsupported-Web-Locks temporary mode; tracked writes are not real browser persistence/cross-tab evidence. Canonical earned save is protocol-generated, not a private user export. No synthetic effects, new fixture, pending-overflow, IW/binding, unknown enemy or defeat fabrication. Baseline identity supplied by frozen source recovery handoff (not browser accepted) and pinned complete manifest; no Git metadata or remote lookup. Entire UI outside chest branch byte equality is source evidence, not pixels; chest commands are deliberately not compared for equality.'
};
const destination = process.env.CAMP_CHEST_OUTPUT ? pathToFileURL(resolve(process.env.CAMP_CHEST_OUTPUT)) : new URL('../docs/camp-chest-measurements.json', import.meta.url);
writeFileSync(destination, JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ output: fileURLToPath(destination), bytes: readFileSync(destination).length, sha256: sha(readFileSync(destination)), acquisition: { attempts: natural.length, wins: output.acquisition.wins, sourcePulses, sourceChecks }, replay: { attempts: replay.length, wins: output.replay.wins, controllerPulses, controllerChecks, frameNonmutationChecks, frameCalls }, gaps }, null, 2));
