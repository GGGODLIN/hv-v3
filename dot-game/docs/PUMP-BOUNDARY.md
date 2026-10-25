# Manual expedition timer boundary — source-only v0.8.1 follow-up

## Defect and contract
The actual UI dispatch, createPump and engine reproduced this sequence: previous timer callback at 0 ms, successful manual Start at 249 ms, next callback at 250 ms. Previously the new fight received 0.25 seconds instead of 0.001, and the first attack could appear at 1250 ms, only 1.001 seconds after Start despite the 1.05-second action period. This is inherited timer accounting, not an HV rule or an intended haste bonus.

After act(), dispatch compares old/new mode and resets the pump only for a start/retreat that actually changed mode. Rendering and commission reconciliation follow. The new fight now receives 0.001 seconds at 250 ms; no attack at 1250 or 1298 ms; first attack at 1299 ms, 1.05 seconds after Start. Same-instant repeated ticks grant nothing.

Failed starts (pending loot or capacity), repeated Start during fight/intermission, read-only rejections and ordinary combat actions do not reset the interval. Retreat from defeat also establishes a camp boundary. Engine-managed waves/auto-advance do not pass through this dispatch and are unchanged. As before, an immediate retreat discards the unprocessed tail of the old encounter rather than retrospectively simulating it. This patch does not claim full wall-clock conservation, arbitrary event-order invariance, offline rewards, or physical browser suspension validation.

Only runtime src/ui.js changes from the preceding source receipt cc51f05172858dbf168d2ccb3217c920d0b4cc54. Engine, session, loot, damage rules, drop RNG and save schema remain byte-identical. Header/version remain v0.8.1; this is another source-only correction within the same unpublished candidate.

## Automated acceptance
- 16 new tests execute extracted actual UI dispatch/pump construction with production createPump, act and advance, using a controlled monotonic clock. Presentation/storage are stubbed; these are not browser tests.
- Tests cover exact start phase, prior long camp pause, defeat retry/return, retreat/restart during fight/intermission, pending/full inventory, repeated start, ordinary combat actions, camp strategy, read-only ownership, 100 repeated starts, long-gap discard and same-instant ticks.
- Five seeds also execute the actual-dispatch natural win → earned loot → camp/equip → separately timed restart → second win loop. Displaced equipment is retained; no injected gold/equipment or exact RNG/time golden is used. This is Node integration evidence, not real browser play.
- Parent full suite: 531/531 pass, zero skips/failures. Four runtime syntax checks pass.
- One existing commission UI assertion changes from exact source-text adjacency to scoped act-before-reconcile-before-render ordering. Actual stale-consent tests remain intact; no golden trajectory values change.
- Independent read-only audit: 90/90 focused tests and 16 additional actual-code VM cases passed, including nine start phases, six no-op actions immediately before a due attack, and the actual valid-import listener followed by Start. Engine/session/loot hash equality independently checked.
- Existing v0.8.1 engine balance measurements remain the same engine revision; their simulated combat outcomes are not newly claimed as actual browser observations.

## Release and recovery boundary
Public v0.7 remains accepted. The prior six-file public HTTP verification is blocked; its retry request and the separate hourly-pause question remain unanswered. No public HTTP retry, website change, CI action or CUA/browser test is part of this source patch. Do not promote it or describe it as a browser-accepted release.

The complete source snapshot is verified at candidate/runtime commit `053a5dc7dd05d3332a3a6f1bf3a2667dfc12375a` on `GGGODLIN/hv-v3` branch `bot/dot`, parent `cc51f05172858dbf168d2ccb3217c920d0b4cc54`. All 81 files / 1117788 bytes and 80 manifest payloads match exact remote readback by content, byte count, SHA256 and Git blob SHA. All 432 outside-dot-game tree/blob entries are unchanged; the update was guarded by the expected head, non-force, with no removals. A package reconstructed exclusively from those remote contents passes 531/531 tests with zero skips/failures and all four runtime syntax checks.

This later receipt changes only README, STATUS, this recovery note, RELEASES and CHECKPOINT; runtime and tests remain exactly the candidate revision. To recover development source, retrieve `dot-game/` from the exact candidate commit (or this documentation-only receipt), verify every CHECKPOINT payload, then run `node --test tests/*.test.mjs` and `for f in src/*.js; do node --check "$f" || exit; done` before serving. For accepted play, restore `e1b576ee2041bd2772f79587e859a80b5ab1f108` instead. No GPT Library, browser save, credential or schedule recovery is claimed.
