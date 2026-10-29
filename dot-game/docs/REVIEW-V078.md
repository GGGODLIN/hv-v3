# v078 independent source review — historical loot slot filter

- Scope: `src/ui.js` / `expeditionLootContext`, only the detached report presentation.
- Independent reviewer owns `tests/report-loot-filter-audit.test.mjs` and this record; no implementation edits.
- Command: `node --test tests/report-loot-filter-audit.test.mjs`.
- Result: **7 / 7 PASS**, 0 failed, 0 skipped (2026-10-29 UTC).

## Evidence

1. Weapon, armor and accessory predicates include each historical destination, including auto-sold receipts. Whole-report quality / acquisition / auto-sale summaries stay byte-identical while filtering; status explicitly labels their full-run scope.
2. Null, malformed, unknown, prototype-like and case-mismatched slots remain visible only under All; no fake match.
3. Missing history remains unknown with no filter controls. An empty receipt remains a known zero-drop run; zero matching slots gets explicit feedback.
4. The group has an accessible label, exactly one button is `aria-pressed=true`, the result has `role=status`, and filtering retains receipt DOM nodes rather than rebuilding them.
5. Separate report views maintain independent filter selections. A newly rendered report defaults to All; no preference persistence is claimed.
6. Repeated filter actions on frozen receipts leave complete game state (including rewards and RNG), engine-call tracking, persistence writes and historical receipts unchanged.
7. A seeded source-engine expedition naturally earns an inventory drop. Its pinned report can be filtered by slot and its exact-ID inspect button opens the currently held detail with focus on the detail title. State, persistence, pinned history and calls remain unchanged; nothing is awarded again.

## Review finding / compatibility

Legacy v071 tests selected the first button or asserted no buttons when no inspection existed. New filter controls make that selector overbroad. Reported to the integration owner; semantic correction is to select `data-report-loot-id` inspection controls specifically, not to weaken ownership checks or remove the new controls.

## Boundaries

This is independent **source + DOM-model** validation, not an actual browser / visual / accessibility-tree acceptance. No website, CI deployment, or formal release was attempted by this reviewer. Formal accepted v072 remains separate; v078 is source-tested and browser-pending. The feature is a local UX adaptation, not an original-HV numerical mechanism or a change to drop odds, acquisition, battle rules, or saves.
