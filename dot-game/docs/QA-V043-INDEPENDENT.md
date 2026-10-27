# v0.43 independent source audit

## Scope

Reviewed the v042 → v043 `src/ui.js` difference independently. Only the basic item-detail action focus capture/restore and exact rendered-node map are added; engine, transactions and artwork are outside this change.

## Evidence

- `node --test tests/detail-action-focus-audit.test.mjs`: 7/7 pass.
- Same seven cases with `HV_DETAIL_AUDIT_BASELINE=../../hv-v3-dot-v042/dot-game/src/ui.js`: four expected failures, three existing no-focus-theft cases pass.
- `node --test tests/detail-action-focus-audit.test.mjs tests/comparison-focus-ui.test.mjs tests/selected-sale-ui.test.mjs`: 44/44 pass.

Coverage: same-name/different-ID selection cannot transfer focus to a different item's sell action; removed exact ID returns to a stable non-destructive control; hidden filter falls back to Settings; unrelated controls with matching labels/data cannot impersonate actual action nodes; modal focus remains untouched; an item moved into pending loot follows its exact card and has no stale basic actions; hidden item details do not trigger restoration. Assertions check that inspection/restoration emits no game actions.

No new defect found within this source/controller scope. Maps use direct rendered-node references and exact IDs, not CSS selectors made from item IDs or item names. Replacements must be connected, enabled and outside hidden/inert/closed dialog ancestors.

## Limitations

The harness executes the complete production UI with a focus-faithful modeled DOM. It is not a browser layout, native keyboard navigation, accessibility tree, screen-reader or actual-play acceptance. No candidate or stable website was changed. Formal v0.36 remains the last browser-accepted publication; inherited candidate artwork is still unaccepted. This audit does not solve or bypass the pending material-scope publication refusal.
