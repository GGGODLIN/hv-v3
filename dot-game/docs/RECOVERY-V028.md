# v0.28 source-only recovery

## Exact identities and scope

Source base: personal `GGGODLIN/hv-v3`, `bot/dot`, exact `6cb7230093f0ddc99bdddd0c1d96efabf4aa8d4b` (checkpoint125, source-only v0.27). The corresponding Git tree is `00b0635e0bda5447377fc37fb268769a8a33a27f`. Development owns only `dot-game/`; no other author's game source, constants, monsters or artwork is incorporated.

Last accepted source remains v0.25 `e5962e728ae4c20db80172916f3e1a9b72815a91`; accepted website remains `f00fdfe1fcad529081057e99592a49466341bb08`. Prepared v0.26 website candidate `14524044ee864ac9ac590ed933c9fd0ef5148680` remains unpublished. Its denied ref update is confirmed unexecuted, with no uncertain website write outstanding.

The new checkpoint includes the unaccepted v0.26/v0.27 work and a bounded pending-loot visibility/recovery change. A FIFO tray exposes original pending identities and comparisons before any disposal decision. An explicit camp action moves only items that fit into current free backpack slots. It does not spend currency, generate loot, equip items or alter the existing sale-triggered refill. This is **not** an accepted release or a claim of browser play.

## Complete restore

Retrieve the entire `dot-game/` directory at the exact new source commit, not just the six website runtime files. It includes all independent original assets, source, tests, historical fixtures, measurement scripts and recovery documentation. Check every payload's byte count and SHA256 against that commit's `CHECKPOINT.json`; the manifest excludes itself. All pre-existing40 fixture files remain unchanged.

No install or build dependency is needed. Use Node20+ for tests and Python3 for the documented HTTP-server workflow:

```sh
cd dot-game
node --test tests/*.test.mjs
node --check src/engine.js
node --check src/loot.js
node --check src/session.js
node --check src/ui.js
```

The server workflow is recovery guidance for an authorized executor, **not** permission to start an alternate preview or bypass the known website review refusal. This source-only iteration did not launch a website, localhost preview, tunnel or browser acceptance session.

Source recovery does not restore private browser progress, account/Library data, login state, permissions, schedules or offline progress. Neither the live root profile nor the previously failed candidate tab was modified.

## State and evidence boundaries

Save format3, namespaces,120 backpack slots,8-item pending validation,5-free-slot departure guard and116 permanent Soulbound weapon cap remain unchanged. There is no new saved field. Exact current-schema old readers retain the same pending-item data; earlier Exquisite-IW1 incompatibility and v0.27 emergency-supply preference fallback remain as documented. Export progress and refresh older tabs before writer takeover rather than assuming blanket backward compatibility.

Natural full-backpack overflow proves the missing inspection surface. Separately, already-valid imported saves can contain free slots plus pending items; explicit claim provides their direct recovery route. That separate imported-state case is not evidence of a naturally earned deadlock, and the existing permanent-item cap was not found broken or enlarged.

The source audit and compact natural measurement receipt distinguish engine play, simulated-DOM controller coverage, synthetic limit fixtures and actual browser acceptance. Exact final test counts, input hashes and source payloads are recorded in `CHECKPOINT.json`, `AUDIT-V028.md` and `PENDING-LOOT-MEASUREMENTS.md`.

Source backup must use small blob uploads and a SHA-only tree, preserve all409 outside blob IDs/modes, compare the complete source manifest, read back each changed file from the exact resulting commit and verify unchanged Git identities. Update only `bot/dot`, with the expected base HEAD and `force:false`. If a provider reports an uncertain ref result, reconcile the actual ref before any retry; do not blindly repeat a mutation.

## Publication remains blocked

`PUBLICATION-BLOCKER-V026.md` retains the full tool-review refusal. Existing explicit user consent is not missing; repeating it or previously known scope facts is not new evidence. No website/candidate ref update, CI trigger, deployment, alternate actor/account/API/host, HTTP acceptance or browser acceptance was attempted here. Do not treat source completion as resolving or authorizing a retry of that block.

If the review block is legitimately resolved later, first reconcile actual source/site refs and choose an exact candidate for authorized browser acceptance. Do not automatically publish stale v0.26 or promote v0.28 merely because source tests pass. Keep accepted v0.25 distinct until the candidate and root acceptance gates are actually satisfied.
