# v0.36 independent enemy-nameplate audit

## Result and limits

**1,919/1,919 tests pass, all four runtime syntax checks pass, and all 179 executable/test/asset/HTML/CSS/package inputs are byte-identical before and after the independent final aggregate.** There are **14 new independent audit tests** and **eight new implementation tests** above the accepted v0.35 total of 1,897. The final input aggregate SHA256 is `acdad29b3e480974968d6aebacde9f26b3ce67f554152ddd6f6742cbc91dc6d7`.

The independent aggregate ran after the implementation owner explicitly froze production and tests: 2026-10-27 13:09:41–13:10:24 UTC, Node v24.22.1. No test was skipped, canceled or marked todo. The driver executes every `tests/*.test.mjs` file and `node --check` for `src/engine.js`, `src/loot.js`, `src/session.js` and `src/ui.js`. Prose, evidence and separately verified replay scripts are deliberately outside the 179-input aggregate.

**This is source, simulated-DOM and Canvas-command evidence—not a browser, screenshot, pixel, font-rasterization, mobile, screen-reader or WCAG acceptance.** Root owns actual browser/play validation and publication. No browser or external write was performed by this auditor. A 320-pixel logical canvas is not evidence of a 320-CSS-pixel device viewport passing visual QA.

The same 14 audit cases against the exact local accepted v0.35 baseline produce **five passes and nine expected failures**. The five preservation checks already pass v0.35: full enemy DOM bytes, actor-body bytes, actual two-enemy generation/cap distinction, complete DOM semantics, and frozen-state nonmutation. The other cases require the new backed plate/HP presentation. Their baseline failures do not imply that reduced motion, unknown fallback or death suppression were previously broken; those behaviors were already present and are now checked with the new plate contract.

The initial focused candidate run was 13/14: the audit expected a different Chinese wording for the percentage explanation. The rendered percentage boundary cases already passed. The assertion was corrected to the exact implemented explanation, `HP（四捨五入的生命百分比；不足1%與接近滿血時用小於號區分）`, and all 14 cases and the complete suite were rerun. That initial receipt is retained, not relabeled as a production defect or successful run.

## Presentation and truth boundaries

- Ordinary plates are 76 logical pixels wide; Boss plates are 116. The name uses an 8px source font, HP 7px, and target/effects 6.5px. Both border and inner backing are opaque. The complete name is still passed to `fillText`; its `maxWidth` may horizontally compress long text rather than preserving the nominal glyph size.
- Current HP is displayed as a rounded **percentage**, not an exact hit-point count. Positive values below 1% display `HP <1%`; unfilled HP that would round to 100% displays `HP <100%`; actual zero displays `HP 0%`. Tests exercise 0, 0.1, 0.49, 0.99, 1, 49.5, 99.4, 99.5, 99.99 and 100 out of 100. A living sub-1% enemy retains its target indicator. These are synthetic boundary inputs, not naturally observed gameplay samples.
- Name, HP, target arrow and the existing gold ground ring remain distinct. PA, STUN, READY and BW keep their exact stack/time text. Ordinary PA/STUN share one row and BW uses a second; Boss effects share one row. The fixed droplet stays within the plate. All eight PA/stun/BW presence combinations are exercised with both stun and recovery-pending variants.
- Redundant canvas role/defense lines are intentionally removed, **not deleted from the game**. `renderEnemyStatuses` is byte-identical, including exact current mitigation/avoidance values, single-gate probability caveats, PA/stun interactions, bleeding damage, next-action information and recovery text. A separate full-controller DOM check confirms those live and recovery details remain available and dead enemies disappear from the live-status list.
- Dead enemies retain their name and `HP 0%`, but no target ring/arrow, live status or defense labels. Existing muted/flattened bodies remain unchanged. Reduced motion and ordinary time/pulse changes do not move the screen-space plate. Unsupported names and roles stay literal/neutral and do not acquire invented effects or defenses.
- All drawing tests use recursively frozen state/enemies and trap random draws, actions, persistence, network and timers. They verify finite numeric calls, balanced transforms/save/restore, restored opacity and complete state equality. They are read-only source invocations, not private save manipulation.

## Bounds, stacking and contrast

The independent recorder tracks transformed body primitives, opaque rectangles and text calls. Its deterministic text-width approximation is only a stub: it does not simulate actual system fonts, antialiasing, hinting or browser `fillText` compression. No pixel screenshot is produced.

At logical widths 320, 344 and 640 with height 160, normal one/two-enemy samples cover all four identities, Boss, normal/reduced motion, maximum pulse, several clock values and the exact lowest Boss bob phase. The backed rectangles remain in bounds and do not intersect the recorded actor-body bounds. The smallest observed source body clearance is **3.9 logical pixels**; the smallest normal two-plate gap is **28 logical pixels**. Route previews for stages 1–30 cover all **60 generated two-enemy pairs** with no plate/plate or plate/body intersection in the sampled command geometry. Text-command boxes and the droplet remain within each backing; distinct effect-command boxes do not overlap under the stub metrics.

**Normal engine generation is at most two enemies.** `waveDescriptor` creates one or two, while `drawScene` merely caps arbitrary input with `slice(0,3)`. The hypothetical three-position source-cap tests establish finite, individually in-bounds plates, not three-enemy gameplay or separated plates. At width 320, three ordinary plates can overlap one another; for the current layout their horizontal ranges are approximately 136–212, 200–276 and 240–316. That unsupported formation is explicitly excluded from the normal two-enemy separation claim. A fabricated multi-Boss formation is likewise not a game encounter.

The solid source foreground/backing pairs have a minimum calculated contrast of **7.457:1** (`#9eaaa8` defeated name against `#0d191f`). This is **not final pixel contrast**: the unchanged scene vignette and flash are painted after the enemies and can alter both foreground and backing. The opaque plate removes the underlying moon/forest from the local backing, but does not bypass that later compositing. Effects may also be compressed by `maxWidth`, particularly three Boss statuses; nominal 6.5px is not proof of effective raster glyph width or readability. Actual desktop inspection remains required; mobile/narrow layout, zoom, text legibility and accessibility compliance are not certified here.

## Exact scope and preservation

The accepted baseline is `../../hv-v3-dot-v035/dot-game`, identified by handoff as `609cf796630d03973ccf0a3d4a9f224b848b00c4`. Its complete **398-payload** `CHECKPOINT.json` manifest is independently verified against local bytes before comparison; this audit does not claim a new remote readback.

Exact comparisons establish:

- `src/engine.js`, `src/loot.js`, `src/session.js` and `style.css` are unchanged.
- All **14** asset/license/provenance files, **40** historical fixtures, **two** browser fixtures and **two** shared test helpers have the same paths and bytes. No fixture or asset was added or removed.
- The UI prefix before `drawEnemy` is unchanged: 133,957 UTF-8 bytes / 117,679 characters. It includes the complete `drawHero` function and all prior controller behavior.
- Every `drawEnemy` body branch through its final body `ctx.restore()` is unchanged: 8,038 UTF-8 bytes / 8,006 characters, SHA256 `17d8694b70aef6c9d36bb796361ae371a531923f251834222a195f1ae2af9ff7`.
- The entire suffix beginning at `drawScene` is unchanged: 16,119 UTF-8 bytes / 14,998 characters. Therefore scene/background/particle/vignette behavior, handlers and lifecycle outside the overlay remain unchanged.
- The complete enemy status DOM renderer is unchanged: 4,523 UTF-8 bytes, SHA256 `9a0b20c3e51839c670c762b29b8317c3ab0b8ba202dcd48e75cde17c7188f6f0`.
- HTML changes only its two version/phase labels and the battle-canvas accessible description. Package metadata changes only the version.
- **Eleven existing test files** change. Seven normalize byte-for-byte to version/phase text only. Four have narrowly reviewed overlay expectations: `battle-actors.test.mjs`, `battle-actors-audit.test.mjs`, `role-ui.test.mjs` and `weapon-ui.test.mjs`. They replace the intentionally removed canvas role/defense expectations with HP/absence checks, update exact bar widths and effect-row counts, and add `HP 0%` to dead-name expectations. Existing test declarations, body-shape checks, exact effect text and live-DOM correctness checks remain. No behavioral fixture was regenerated or assertion broadly disabled.

Candidate UI SHA256: `b9d2e32cc38e7ab19284347ee4586139e4fc65950586347b0e00add5955be1c6`.

## Independently rerun natural replay

The dedicated measurement uses a fixed seed-42 natural acquisition protocol, then the unchanged naturally earned save in baseline, candidate and no-frame source controllers. It does not grant gear/resources, inject effects, rewrite progress, select successful seeds or fabricate missing observations. I read its protocol/implementation, verified its pinned baseline and current input hashes, **executed a separate third process**, and compared its output byte-for-byte with the producer's already double-run canonical receipt.

The exact 16,962-byte receipt records 20/20 acquisition wins, 15/15 three-weapon replay wins, **432** complete natural-source parity checks, **2,453** complete controller parity checks and **3,040** frame-nonmutation pairs / **6,080** frame calls. Baseline and candidate each execute 3,036 visible-scene draws; no-frame control executes none. State/RNG/events/reports/action logs and tracked writes match. Tracked writes are not browser persistence or cross-tab evidence, and source wins do not establish balance, visual quality or universal win rates.

Natural acquisition does not observe active PA or recovery-pending; the controller replay observes PA/stun/BW but not recovery-pending. The READY boundary is covered only by this audit's explicitly synthetic tests. Unknown identities, defeat, pending overflow and other absent branches are not silently claimed as natural observations.

- Runner `scripts/enemy-nameplates-measurement.mjs`: `8925151681f85c08ef8b84a9d342fc9e05cb2ec86ae15f1adcdcf978660e2c72`.
- Canonical `docs/enemy-nameplates-measurements.json`: `a88d761a503f239f9558c30abe3bb881e46403d02779bd50d6b18ba69c92fa80`.
- Independent third-process output: `/tmp/audit-nameplates-v036.json`, exact canonical bytes at review time.

## Evidence

These new v0.36 files are in the version folder's `evidence/` directory, one level above `dot-game`; no v0.35 evidence was overwritten:

- `audit-v036-focused.tap`: 14/14 independent checks and geometry/contrast diagnostics.
- `audit-v036-baseline.tap`: five accepted-baseline preservation passes / nine expected new-contract failures.
- `audit-v036-focused-initial.tap`: retained 13/14 initial wording-assertion failure.
- `audit-v036-final-full.tap`, `audit-v036-syntax.txt`, `audit-v036-final-verification.json`: final complete 1,919/1,919 and four syntax receipts.
- `audit-v036-final-inputs-before.json`, `audit-v036-final-inputs-after.json`: identical 179-input manifests and aggregate hash.
- `audit-v036-final-check.mjs`: reproducible aggregate/manifest driver.
- `audit-v036-preservation.json`, `audit-v036-existing-tests.diff`, `audit-v036-preservation-check.py`: exact accepted-baseline preservation and reviewed test changes.
- `audit-v036-replay-run.txt`, `audit-v036-replay-review.json`: independent natural-replay execution and exact-byte comparison.
- `audit-v036-initial-inputs.json`, `audit-v036-baseline-sections.json`: initial snapshot and immutable actor/DOM section identities. The initial snapshot already contains the parent's version-label edits; it is not mislabeled as an all-baseline-equal snapshot.

Browser acceptance, candidate/official publication and any later accepted-phase metadata require their own root-owned evidence and, if executable/test inputs change, a fresh aggregate check.

## 接受phase後重新驗證

root於2026-10-27 13:28 UTC明確接受有限desktop候選，見 BROWSER-QA-V036.md。只將index的「來源候選」改「持續開發」與8個對應精確測試標示；功能runtime/CSS/assets不改。再次完整 **1,919/1,919** 與四runtime syntax通過，179輸入前後一致，aggregate `6d16bf1abb1f187c886cc47aa3d62e604b20347b190ec6ce90b98fd8da4e8aa5`。自然receipt保留原來源phase的hash，沒有誤稱該receipt原HTML hash等於接受phase。
