# v075 independent source audit: three-expedition budget

2026-10-29. Independent reviewer owns only this document and tests/three-run-goal-audit.test.mjs. Runtime implementation was reviewed, not edited by this reviewer.

Result: **13/13 PASS**, no blocking findings. Command: `node --test tests/three-run-goal-audit.test.mjs` from dot-game. This is deterministic engine simulation and the existing focus-aware DOM harness, not a real browser or public deployment acceptance.

Coverage:
1. Starting with 50 historical wins still requires three new full clears. All four waves and resources settle, and further ticks cannot reopen combat or repeat rewards.
2. Three seeded ordinary-repeat comparisons preserve hero, items, pending, RNG, kills/wins, fragments/seeds, unlocks, item IDs, best times and retained reports. Only intended post-third-win camp state differs.
3. Intermission time and repeated start actions do not reset or increment the count.
4. Cancel leaves serialized gameplay unchanged and resumes ordinary repeating combat. Malformed cancel payload cannot clear intent.
5. Existing finish-current control supersedes budget; cancelling it does not revive the prior budget.
6. Normal, single, growth and quality starts after retreat have no three-run residue; new budget contains no conflicting existing goals.
7. Invalid start payloads, insufficient free slots and pending loot refuse to arm a goal.
8. Capacity can stop after the first victory; defeat and canonical reload clear transient goal without claiming three successes.
9. Existing autoAdvance policy changes stages normally while count survives; controlled stronger equipment prevents unrelated defeat in this boundary fixture.
10. Item World refuses the ordinary three-run start without extra seed/resource use.
11. DOM controls expose active state and clear through sync/import; readonly prevents action. Bounded 2x timer simulation settles exactly three wins and cannot restart afterward.

Limitations: No actual cloud-browser play, screen-reader/layout/mobile audit, public CI/HTTP deployment, real wall-clock timing claim, or natural full-bag/Item World play was performed by this reviewer. Controlled fixtures are source tests, not natural player evidence. The public candidate write is already blocked upstream; this audit performs no retry or workaround. Formal accepted v072 remains unchanged.
