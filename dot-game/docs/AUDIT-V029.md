# v0.29 independent source audit

Base: exact v0.28 `e4121bb89be2b9e29bdbb262c83f16d0be993267`. This is a source-only interface improvement, not a published or browser-accepted release. Accepted v0.25 and the existing website-tool refusal remain unchanged.

## Scope and finding

The gear-only apply preview now shows the **current settings that will remain**: tactic, target policy, Protection policy, extra emergency-supply preference and actually slotted ability ranks. It does not store or restore those settings in a preset, spend AP, choose abilities or become a full-build switch. Preset data remains the same three item IDs.

Previously the preview said abilities/tactics were retained but did not show them; they were spread across other panels. This is an information gap, not evidence that presets secretly changed policies. The old engine already rejected a changed tactic through its quote. The UI now also cancels visible consent when any of the four displayed policies changes, before submission, so the displayed context cannot silently become obsolete. Existing ability/gear/ownership invalidation remains.

Protection ON is expressly not an active buff; locked Lv10 status remains visible. Sustain explicitly retains its independent last-bottle rule even when the extra-supply preference is OFF or ON. Learned but unslotted abilities are not shown as active. Preview and cancel do not write progress; applying changes gear under the existing camp-recovery rules, not policy or allocation.

## Independent behavior and regression

`tests/gear-set-context-audit.test.mjs` adds13 passing cases. Controlled UI fixtures are explicitly synthetic, not earned-play evidence:

- Current-versus-preset-save configuration, exact slotted Rank2, and learned-unslotted omission.
- Preview/repeated render/cancel preserve full state, RNG, AP and persistence calls.
- Each changed tactic/target/Protection/supply setting cancels before rendering; repeated confirmation cannot equip or spend. A fresh preview can apply exactly once and retain current settings.
- Successful apply preserves ranks, policy values, AP expenditure, RNG, gold, fragments, seeds, potions and owned item IDs. Existing HP/MP camp recovery is not incorrectly characterized as a no-op.
- Rank/slot changes, readonly ownership, import, locked Protection, ON-not-active, Sustain exceptions, text-only context and no apply-context leakage into overwrite/clear dialogs.

The UI author's14 new complete-controller cases also cover modal lifecycle, focus and stale snapshot disclosure. Historical tests remain meaningful: all9 changed pre-existing test files are exactly branding substitutions from v0.28 to v0.29, without logic or golden rewrites. `index.html` changes only two version strings; `package.json` changes only the candidate version. Engine, loot, session, style and original assets are unchanged.

Shared policy/ability formatters were separately checked against exact v0.28 report rendering: **3,894 generated DOM trees match byte-for-byte**, with no input mutation. The Cartesian cases include four target values, three Protection values, three supply states,27 ability shapes (all supported ranks, empty/missing/invalid/oversized lists), four equipment shapes and six top-level missing/malformed contexts. This checks detached report output, not real browser layout. Local receipt: `evidence/audit-report-dom-parity.json`; output aggregate SHA256 `d00c02f9d9c9d1722eb1e420717ffc154dd99a5efdfe1e729a9b350d0e0168e8`.

## Final frozen verification

- `node --test tests/*.test.mjs`: **1,699/1,699 pass**, no failures, skips or cancellations;28.783 seconds.
- `node --check src/engine.js`, `src/loot.js`, `src/session.js`, `src/ui.js`: all pass.
- **159 executable/asset inputs unchanged before and after** the full run and independent measurement. Exact paths, sizes and hashes are in [AUDIT-V029-INPUTS.json](AUDIT-V029-INPUTS.json), SHA256 `e50a9695336f5d442151ac5555adf24908878b600ab151380f5d2c151b9e7c2b`.
- Input aggregate: sorted source-relative `path + NUL + SHA256 + newline`, SHA256 `85e238a155f7350b9d0630d8a3f779f06c59220932d1fb2458b78f9ac8512f5e`. Prose and checkpoint receipts are outside this freeze.
- All40 historical `tests/fixtures/` files and both `tests/browser-fixtures/` files are byte-identical to the exact base snapshot. No fixture was added or rewritten. The40-file aggregate using fixture-relative paths and the same formula is `dedc5bef7a4e2537947a3477c938a1688d4bc30c883210dc98ac83ff30b15f08`.
- Final `src/ui.js`: SHA256 `523c98358df0f6085ad4be47ad60c8cb09e37b0320efc970830117a7d60fbe5a`. Full TAP retained locally at `evidence/audit-full-final.tap`, SHA256 `c57bd5178bfff6783c8dde16fe9d61887d6c5ae6d154c8ff251541d2d7eccd1e`.

## Independent earned-source reproduction

Reran the committed measurement independently with a separate output, then compared exact bytes:

```sh
node scripts/gear-set-context-measurement.mjs --output ../evidence/audit-gear-set-context-natural.json
cmp docs/measurements/gear-set-context-v029.json ../evidence/audit-gear-set-context-natural.json
```

Result: **55,907 bytes**, SHA256 `fab6c54b2a59665b1bf9f1d3c59a9508df78b9ba1d3e1874bd20af19d85fefb6`, identical to the source-backed receipt. Fixed seeds29/42/77 naturally reach Lv13 after30 wins each:90 acquisition wins/980 one-second pulses. Nine independent earned-save branches cover all three weapon families and retained-policy/slot profiles: seven actual swaps, two already-current no-ops, and nine follow-on wins/85 pulses. All original item bytes, current policies/ranks and start-report identities are retained. No unfavorable result was discarded, no extra seed/loss search was performed, and no resources or rank milestones were fabricated.

This engine measurement proves read-only inspection and existing gear-only application on earned state; it does **not** simulate a UI Cancel click or prove a speed/survival benefit. Actual UI cancellation is covered separately by the controller tests. A preliminary `--help` probe found the script has no help mode and safely refused overwriting its existing receipt with `EEXIST`; the independent explicit-output run above passed and original bytes remained unchanged.

## Acceptance limits

No browser, website write, candidate staging, CI/deployment, alternate host, localhost preview, user-computer or local Codex operation was performed. The current source is not an accepted live release. Tests do not establish rendered/mobile/device layout, background throttling or comprehensive multi-tab behavior. Complete exact source backup/readback and the unchanged publication blocker are reported separately; source progress does not resolve that blocker.
