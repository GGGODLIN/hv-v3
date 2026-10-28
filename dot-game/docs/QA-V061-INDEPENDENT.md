# v0.61 independent selection-retention audit

## Result

Independent test file `tests/selection-retention-audit.test.mjs`: **14 passed, 0 failed**. Running the same file with `SELECTION_AUDIT_UI_SOURCE` pointing at the v0.60 UI yields **5 passed, 9 failed**. Failures reproduce loss of the remaining explicitly selected item.

The audit uses the repository's focus-faithful full-UI source DOM harness, real engine transactions, and generated item fixtures accepted by `validateSave`. This is not a browser, layout or natural-drop playthrough. No website write or publication occurred.

## Coverage

- Selecting two bag IDs, then locking, equipping or selling one preserves only the other selected ID.
- Unlocking the removed item does not automatically select it again.
- An open confirmation is invalidated before pruning. Its confirmation button becomes disabled and a stale confirmation call changes no game state. A newly opened quote contains only the retained ID and its newly calculated total; confirming it sells only that item once.
- A retained item outside the current visual filter remains selected and the hidden-count warning remains accurate.
- Pending loot refilled after a sale never becomes automatically selected.
- Actual permanent binding prunes only the bound item.
- Actual equip → save gear set → swap back leaves the saved item protected, with no replacement item added to sale intent.
- Leaving camp, losing ownership and importing another journey still clear local sale intent.
- Aggregate saved-gold cap rejection remains fail-closed; no arbitrary subset is chosen to fit the cap.
- Zero survivors leaves the preview disabled and does not sell anything.
- After each relevant transition, repeated render preserves full game state, action history and persistence writes. RNG is contained in the compared complete state.

## Scope and limits

The runtime diff is confined to selection reconciliation in `src/ui.js`. Confirmation invalidation precedes pruning; engine quote validation remains the final authority. The preserved set is an intersection of prior explicit IDs and still-eligible bag items, never newly generated IDs or a replacement for removed gear. Unknown/invalid aggregate data still clears selection rather than guessing which item may safely be sold.

This does not claim browser acceptance, visual focus verification, mobile acceptance or publication. Formal public game remains v0.55; v0.56 through v0.61 remain source candidates until separately accepted.
