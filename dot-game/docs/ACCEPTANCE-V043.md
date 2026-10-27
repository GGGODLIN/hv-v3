# v0.43 detail-action keyboard continuity (source only)

Base: bbb2e0956856160bf024728dde2046ec97ee8da6. Formal and accepted recovery remain v036.

The existing UI rebuilds basic detail action buttons after a lock/equip/sale or forced inventory refresh. Focus falls to body, interrupting keyboard inventory work. Existing comparison-card retention did not cover these actions.

Track exact rendered nodes by action and item ID, capture before render, restore enabled same-item action only after its node was removed and no other renderer chose focus. When unavailable, follow the same item's visible card; removed/hidden items fall back to non-destructive filters/settings. Equip follows to worn card; sale does not focus another sale action. No selectors derived from item IDs or names.

Primary full production UI harness tests: eight cases; baseline v042 fails seven, unchanged/unrelated focus passes. Repeated lock/unlock, passive repaint of three actions, equip, sale, disabled replacement and unchanged/unrelated focus covered. Independent tests and aggregate counts are in CHECKPOINT.json. Historical art pins reverse only the exact focus delta; original hashes stay intact.

No actual browser keyboard, screen reader or layout acceptance in this version. Simulated DOM tests are not browser evidence. No game state, engine, RNG, storage, CSS or assets changed. Known Kenney scope refusal remains unresolved: zero website writes and no attempted bypass. New source is not accepted/published.
