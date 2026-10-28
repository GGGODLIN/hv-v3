# v0.48 stat difference display (source only)

Base 05ab41e751a329ee40301fb757eb7e232cfcdf02. A 0.0001 critical-chance increase can be shown as equal/zero by the old tolerance/one-decimal display, while a fractional parry difference can appear as signed zero. Now exact zero is equal, any nonzero change retains direction. Probability differences use percentage points, with up to four decimals and `<0.0001` bounds below display precision. Detail and manual-sale comparisons share the formatter. Existing absolute stat displays are unchanged.

Final full suite: 2,045 passed, zero failed/skipped; four runtime syntax checks. Primary four cases (two fail on the old source); independent six cases (four fail on old source). Includes positive/negative/equality/worn-stat suppression, sale preview and non-mutating state/action/storage checks. Synthetic below-precision fixtures test formatting, not a claim of natural loot frequency or material combat gain.

Historical canvas byte pins reverse only the exact helper/call changes; the old parry comparison expectation is updated from rounded -12.3 to -12.345. No engine, loot, session, CSS, research or asset changes. This is not actual browser/pixel/assistive-technology acceptance. Zero website operations, formal v036 remains. Existing material scope blocker is unresolved.
