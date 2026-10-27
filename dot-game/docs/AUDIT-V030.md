# v0.30 independent source audit

Base: exact v0.29 `eb134eaf7da676c2834eb5c08bf84cb957e523b4`, locally verified as `127-v029-gear-context-source`. This is a source-only comparison-focus repair. Accepted v0.25 and the existing website-tool refusal remain unchanged; this is not browser or publication acceptance.

## Independently reproduced defect

With an actually focused comparison button, inventory and equipped-item activation replaced that node and left focus on `BODY`. Pending-item activation already restored its exact-ID replacement. An independent JSDOM run of exact v0.29 confirmed all three observations; it is DOM emulation, not a browser. The earned-source replay independently reproduces the same distinction: old inventory/equipment lose focus in18/18 activations; pending retains it in3/3.

The fix captures the actual renderer-owned comparison node before rendering, not the selected item, a name, a forged dataset or a selector assembled from an ID. After rendering it only repairs focus when that same node was replaced and no other control has acquired focus. The exact item ID can follow the item between pending, backpack and equipment. If no visible replacement exists, a visible inventory filter or global settings control is used. Hidden/inert/disconnected/closed-dialog targets are excluded. An unchanged node does not receive another focus call; restoration requests `preventScroll` without claiming that browser scroll behavior has been tested.

Existing explicit post-claim focus behavior is unchanged. This is not a general rewrite of focus management, tab order, dialogs, keyboard navigation or other action controls. Engine, loot, session/save and CSS bytes remain exact v0.29; no combat, RNG, ownership, item, reward or saved-data rule was changed.

## Independent coverage

`tests/comparison-focus-audit.test.mjs` adds **21 dependency-free Node tests**, using its own connected DOM model rather than the implementation author's helper. The model parses actual HTML ancestry, drops focus when a focused subtree is replaced, rejects hidden/disabled/disconnected focus and performs actual descendant lookup. A model self-test guards those assumptions. Controlled data in these tests is synthetic supported-save boundary data, not earned progress.

Coverage includes:

- Repeated inventory, pending and equipment comparisons preserve the new exact node and leave complete game state, dispatch and storage-write observations unchanged.
- Same-name items and valid IDs containing quotes, brackets, backslashes and selector punctuation cannot redirect the restoration.
- Pending-to-backpack and backpack-to-equipment movement; removed or filtered items; no selection/data mutation from filtering; a global visible fallback when the filter is hidden.
- Filter/sort controls, stale detached callbacks, unfocused comparison activations and unrelated controls carrying forged item datasets do not lose focus to a selected comparison.
- Automatic combat, readonly inspection/update, claim/sale dispatches and the actual import handler preserve unrelated focus; readonly comparison remains inspectable without dispatching mutations.
- An unchanged render does not refocus; a later explicit renderer focus wins; hidden or inert previous controls cannot trigger fallback; unrelated camp-tab navigation stays focused.
- Exact SHA256 guards for unchanged engine, loot, session and styles.

The UI author's separate **21 tests** cover complementary controller cases. An additional independent **11-case JSDOM** cross-check passes for all three regions, hostile IDs, exact identity movement, removal fallback, forged datasets, hidden former nodes, readonly inspection and later-render focus precedence. JSDOM is used only by local `evidence/` checks: no dependency or installation requirement was added to the source package or committed test suite.

## Final frozen verification

- `node --test --test-reporter=tap tests/*.test.mjs`: **1,741/1,741 pass**, zero failures/skips/cancellations; **30.832 seconds**.
- `node --check` for `src/engine.js`, `src/loot.js`, `src/session.js` and `src/ui.js`: all four pass.
- **163 executable/asset inputs** are identical before and after the final full suite, syntax checks and independent earned-source replay. Prose/checkpoint receipts are outside this freeze. Exact paths, sizes and hashes: [AUDIT-V030-INPUTS.json](AUDIT-V030-INPUTS.json), SHA256 `f75df56a6b0ad9d022c2b4a5f8fff6930566efb9fa90e638e42db9032279a534`.
- Input aggregate: sort source-relative path strings, concatenate `path + NUL + SHA256 + newline`, then SHA256: `ba49303eedb593c4aa09abe66f2be150a13aa151ef35d25b510aa70c77385c49`.
- All **40 historical fixture files** and **2 browser-fixture files** are byte-identical to the exact base. No fixture was added or rewritten. All9 changed pre-existing test files are strictly `v0.29`→`v0.30` branding replacements, including escaped regex labels; no assertion behavior or golden data was changed. `index.html` changes only two version labels; package version becomes0.30.0.
- Final `src/ui.js` SHA256: `51ff734d11a50d0115c7063c3649dc432c6a424b21fc78a13353b1a245ff8442`.
- Local final TAP: `evidence/audit-full-final.tap`, SHA256 `b3340b4ee811f9dc4efd1e8b622492b93ac8c2b3474ce0924d780452106d4cae`; compact receipt: `evidence/audit-final-summary.json`.

An earlier aggregate run exposed a historical Protection test's source-extraction boundary: the newly inserted helper declarations were inside its `renderProtection`→`render` slice, which forbids focus calls. The helpers were relocated without changing behavior or weakening the historical test. The receipt was regenerated for the new UI hash and the **entire freeze/suite/replay was restarted**. The final passing result above is not a selected subset of that earlier run.

## Independent earned-source replay

Ran the committed script independently, then compared exact bytes with its committed receipt:

```sh
node scripts/measure-comparison-focus.mjs \
  --baseline /path/to/exact-v029/dot-game \
  --output /path/to/new-audit-comparison-focus.json
```

Result: **12,742 bytes**, SHA256 `75a8af03ef8afd3603f44ace38d235a759312addc6f54362cb9f813ffac07d34`, identical to [the source receipt](measurements/comparison-focus.json). Fixed known-overflow seed42 produces315 wins/2,746 one-second pulses, ending with120 backpack items and natural pending `loot-556`. All3,817 full action/pulse state-and-report comparisons with exact v0.29 match without field normalization. No defeats, censored runs, extra seed search or fabricated resources were added.

On that unchanged validated earned save, seven exact controls are activated three times each. New UI retains focus21/21 after activation and21/21 after the next forced render, versus old3/21 at both stages. Both versions preserve complete state/RNG, dispatch and storage-write observations throughout those read-only replays. See [protocol, results and limitations](COMPARISON-FOCUS-MEASUREMENTS.md).

## Acceptance limits

Source execution and programmatic focus/click emulation do not establish actual Tab/Enter behavior, browser focus rings, screen-reader output, scroll position, mobile/device layout or live cross-tab persistence. No website write, candidate staging, CI/deployment, alternate host, localhost preview, real browser, user-computer or local Codex operation was performed. Exact source commit/readback is a separate backup receipt; these passing tests do not resolve the unchanged publication refusal or promote this source candidate to the accepted live version.
