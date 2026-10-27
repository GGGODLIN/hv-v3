# v0.34 independent equipment-effect readability audit

## Result and scope

**20/20 independent source/controller checks pass. The final aggregate run passes 1,862/1,862 tests, with four runtime syntax checks passing.** All 189 executable, test, replay and asset inputs are byte-identical before and after the final aggregate and independent replay. The source-input aggregate SHA256 is `1d425f579c30b80677c90529d653e689a927cf6bb65fe6d85694eb2ed2e31dd3`.

Baseline is accepted v0.33 source `9e43771c5ea729d328f465ee5ce91cfcc6e8c90f`, restored from checkpoint 135. The same independent tests against that exact baseline produce 2 passes and 18 expected failures because the new disclosure does not exist. Unknown-family no-proc wording and the storage/custom-handler boundary already pass in v0.33; this audit does not invent regressions in those cases.

This is a **source-only** audit, not browser, physical-keyboard, layout, scroll-height, screen-reader, zoom or mobile acceptance. The accepted v0.33 website remains a valid prior release; its resolved historical publication refusals are not a new v0.34 blocker. Candidate publication, actual browser acceptance, exact source readback and any later root promotion are separate gates, not accomplished by these tests.

## Reproduced source problem and bounded change

The old item-detail view displays both `describeWeaponTrait(item)` and `weaponRuleText(item)` as always-open paragraphs. They repeat important concepts while mixing the weapon's identity with proc percentages, tick counts, stack caps, arithmetic and source qualifications. All six original paragraphs remain byte-exact in the new adjacent native `details`; `weaponRuleText` itself is unchanged.

The default presentation keeps a short identity/tradeoff and an explicit historical-model/adaptation caveat visible, with a named native summary: “完整特效規則・觸發、公式與時序”. The visible tradeoffs include:

- Axe: delayed untyped bleeding, refresh/re-snapshot can weaken it, and PA does not increase it.
- Rapier: reduced general physical mitigation benefits subsequent physical attacks; it is not direct added damage and skills do not trigger it.
- Club: control does not refresh, blocking remains possible, and the recovery action can defeat the player.
- Unknown legacy weapon: no supported family proc, rather than an invented effect.

Source-semantic visible text in the effect panel, including its heading, model caveat and disclosure label, changes from 392 to 120 characters for axe, 191 to 108 for rapier, and 258 to 108 for club. The separate natural-replay report measures only the effect prose and therefore uses different explicitly defined counts. Neither count is a measurement of viewport height, scrolling or visual quality.

## Disclosure, identity and safety coverage

The native disclosure defaults closed. Its open state is retained only while inspecting the same exact item ID, including a forced repaint. Switching to a same-name different ID, a different family, armor or an empty selection discards that transient open state; returning does not recover a hidden per-item map. There is no new saved field, storage namespace, timer or keyboard event handler.

Only an actually focused old summary receives focus on its replacement; restoration uses `preventScroll`. Open details do not steal filter, sorting, settings, sale-checkbox or comparison-card focus. Backpack, equipped and pending inspection all receive repeated exact-ID checks. Because the existing source DOM does not implement native summary focus, the independent test adapter locally supplies `tabIndex = 0` to newly created summary objects. Production and the shared harness remain unchanged; this adapter is not actual keyboard evidence.

The unchanged exact stat comparison and score-not-DPS caution remain outside the disclosure. The audit also checks visible binding cost/no-automatic-payment wording, permanently bound sale/lock restrictions, IW1 completion and original upper-limit qualification, pending FIFO/inspection-only restrictions, and read-only operation refusal. The operation buttons and their conditions are not descendants of the effect disclosure. Complete state, RNG, action logs and tracked storage writes remain unchanged through inspection, expansion, collapse and repaint.

The soulbind quote, Item World quote and selected-sale rendering source sections remain byte-identical to v0.33. This is not a general rewrite of transactions or safety disclosures.

## Independent regression and preservation

Byte comparison against checkpoint 135 preserves:

- All three engine, loot and session modules.
- All 14 asset, original-source, license and provenance files.
- All 42 historical and browser fixture files.
- Both shared source-test helpers.
- The unchanged 29,916-character remainder of `ui.js` after the bounded item-detail edit, including existing operations and canvas scene code.

Nine existing UI test files change only version metadata from v0.33 to v0.34; reversing that exact version replacement reproduces each old file byte-for-byte. No behavior assertion or golden fixture was rewritten. The new suites contain 15 implementation tests and 20 independent audit tests.

The final input manifests cover runtime modules, HTML, CSS, package metadata, all tests/helpers/fixtures, scripts and assets. They deliberately exclude changing prose, measurement receipts and the checkpoint. The complete source checkpoint and remote readback must still include those excluded recovery documents; an input-test manifest is not a source backup.

## Independent earned-source replay

The auditor separately reran `scripts/effect-readability-measurement.mjs` against exact v0.33. Its output is byte-identical to `docs/measurements/effect-readability-v034.json`, SHA256 `89f851ad76b88be648beb303548c8800197c74f4942b07d6dbf0072be799ee4d`.

The fixed acquisition protocol makes 20 attempts and earns 20 wins in 237 one-second source pulses, with 286 complete source-state/report parity checks. The unchanged earned save supplies all three known weapon families and the original unknown-family starter. Nine disclosure cycles, 12 controller checkpoints, 34 quarter-second ordinary-play comparisons and eight post-finish pulses preserve v0.33 state, RNG, rewards, actions and tracked writes exactly. This known sample does not establish a drop rate, universally better weapon, balance improvement or actual browser persistence. Synthetic pending/investment safety cases remain separate from that natural acquisition sample.

## Local evidence

- `evidence/audit-v034-focused.tap` and `audit-v034-baseline.tap`
- `evidence/audit-v034-final-full.tap` and `audit-v034-syntax.txt`
- `evidence/audit-v034-final-inputs-before.json` and `audit-v034-final-inputs-after.json`
- `evidence/audit-v034-final-verification.json`
- `evidence/audit-v034-unchanged.json` and `audit-v034-existing-test-diffs.json`
- `evidence/audit-v034-prose.json`
- `evidence/audit-v034-replay.json` and `audit-v034-replay.log`

Remaining actual-UI gates include native keyboard expand/collapse, focus after item selection and repaint, readability of the compact comparison, and ordinary play/reload on the isolated candidate. No browser result is inferred from this audit.
