# Independent acceptance — v0.1 candidate

Status: gameplay engine and Node acceptance suite pass; full release still awaits browser acceptance. This is not a declaration of exact original-HV fidelity or a published game.

## Scope

The reviewer inspected only this independent `dot-game/` source and original-HV research summary, not the existing repository game, excluded datasets/constants/art, or another implementation. Engine/UI authors own fixes; reviewer added `tests/acceptance.test.mjs`.

## Behavioral evidence

- Seeds 1–100: starter stage cleared automatically without manual healing in 26.3–38.9 simulated seconds (median 31.6). Zero failed first clears.
- Equipping the first-clear weapon and replaying stage 1: 10.6–21.1 simulated seconds (median 15.8). Zero failed replays. This includes both equipment and earned character growth, not a controlled gear-only effect estimate.
- Six explicit regression seeds (1, 2, 3, 42, 123, 999) complete first clear, loot, return to camp, equip, faster replay, then clear stage 2. This verifies a tangible progression loop, not subjective long-term fun.
- Forced deep-stage defeat recovers in camp, preserving earned items/currency; player can return to stage 1.
- Locked and equipped items cannot be sold by ordinary/bulk-sale actions; invalid actions and stage inputs leave valid state.
- Full inventory refuses another expedition instead of deleting items. Valid full inventory survives save validation.
- Save loading returns to safe camp, preserves progress, and grants no offline rewards. A huge `advance` delta equals the capped two-second advance.
- Repeated seeded simulation is deterministic; events/logs remain bounded. Save importer rejects malformed records and duplicate IDs.

## Defects found and fixed during review

1. Imported numeric loot IDs at or beyond 2^53 caused all subsequent drops to share an ID, making saves unrecoverable. Added regression; initial unsafe-ID rejection passes.
2. Critical eligibility incorrectly used the combined partial-avoidance multiplier, suppressing crit after partial parry/block/resist. Original-HV research ties this prohibition specifically to evade glance. Engine now tracks evade-only glance; regression passes.

3. Accepted `_itemId=999999999` generated IDs beyond the import whitelist; next reload rejected its own generated item. Engine now wraps its bounded counter and skips occupied identifiers; both boundary regression and full suite pass.

## Remaining browser checks at this report revision
- UI source review found hidden→visible same-tab transition could reload through `validateSave` and silently return a fight to camp rather than pause/resume. UI owner reports fix; browser verification is still required. A static test is not proof of runtime pause/resume or cross-tab safety.
- Browser-rendered combat, equip/sell controls, export/import, cross-tab behavior, hidden-tab pause, audio/motion toggles, mobile layout, and deployed assets are not established by these Node tests. Parent performs cloud-browser acceptance.

## Commands

`node --test tests/*.test.mjs`

At 2026-10-25 12:27 UTC: 54 tests, 54 passed, 0 failed. Includes 9 independent behavioral acceptance tests and author unit/static-UI tests. Browser and publication approval remain separate.

Verified engine SHA-256: `d5f13c425e414c523fe08ff8a018a1dd5ddda73a3699b19c0e7abf17fcc91431`. Loot SHA-256: `9ba8bbc7ba315b9e1084f0f877603d5c2b253cbe0fffe6abc7c96812c435132b`.
