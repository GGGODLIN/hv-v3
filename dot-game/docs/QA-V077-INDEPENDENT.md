# v077 independent source/DOM review — 本場掉寶摘要

Scope: review of historical expedition loot summary in `src/ui.js`, using an independently authored full-source DOM harness test file `tests/loot-summary-audit.test.mjs`. This is **not real-browser or public-site acceptance**. No website files, gameplay engine, drop tables, save schema, or RNG were changed by this reviewer.

## Coverage

1. All eight actual `QUALITY_TIERS` translated and ordered canonically (input supplied in reverse order).
2. Inventory / pending / autoSold acquisition-time counts; only actual `saleValue` on autoSold receipts enters proceeds. Non-sale records with misleading monetary fields excluded.
3. Legacy absent/null/non-array receipts distinguished from genuinely empty expeditions.
4. Null/malformed records, inherited-property-like quality/slot names, and invalid monetary values cannot become known proceeds.
5. HTML-like item names/IDs remain literal text, no injected DOM elements.
6. Frozen receipt repeatedly rendered without changing full live state (including RNG), persistence writes, action calls, or receipt snapshot.
7. Seed 42 ordinary `startOnce` expedition progressed using engine time steps, report pinned, then its naturally obtained inventory item sold with a valid `previewSelectedSale` quote. Sale removes the item and grants quoted gold while original historical reports and pinned loot summary stay identical.

## Finding / resolution

Initial independent run: 6 passed, 1 failed. Aggregate calculation handled invalid values safely, but pre-existing receipt detail formatting still displayed negative/coerced/rounded invalid sale proceeds, and `__proto__` slot/quality values produced `[object Object]`. Reported to runtime writer for a scoped detail-rendering fix; audit requires every invalid auto-sale detail to say 金額未記錄 rather than assert known proceeds.

Runtime writer corrected the scoped detail formatting with safe nonnegative-integer sale checks, own-property slot lookup, known-tier quality lookup, and missing name/ID/level labels. Reviewer read the corrected runtime and independently reran the tests at 2026-10-29 07:08 UTC: **7 passed, 0 failed, 0 skipped**. Command:

```sh
node --test tests/loot-summary-audit.test.mjs
```

## Acceptance boundaries

This validates source behavior and a modeled DOM, not browser layout, actual keyboard/accessibility tree, touch interaction, or a published version. Real-browser acceptance remains pending for v073–v077. The previously accepted v072 formal website must remain separate and unchanged. This document is not approval to publish or retry a denied website operation.
