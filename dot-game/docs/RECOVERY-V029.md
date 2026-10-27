# v0.29 source-only recovery

## Exact base and accepted release

Source base: personal `GGGODLIN/hv-v3`, branch `bot/dot`, exact v0.28 commit `e4121bb89be2b9e29bdbb262c83f16d0be993267`, tree `072d2cbd105dbbce4311821d89766a14c65cfd06` (316 files / 315 manifest payloads). Development owns only `dot-game/`; other authors' code, constants, monsters and artwork are excluded.

Last accepted source remains v0.25 `e5962e728ae4c20db80172916f3e1a9b72815a91`; accepted website remains `f00fdfe1fcad529081057e99592a49466341bb08`. Prepared v0.26 website candidate `14524044ee864ac9ac590ed933c9fd0ef5148680` remains unpublished. Its denied ref update is confirmed unexecuted; there is no uncertain website write to reconcile.

The new source contains the unaccepted v0.26–v0.28 work plus the bounded retained-context display in gear-set apply previews. It does not turn gear presets into full builds or alter engine/loot/session rules. The bounded earned-source play is recorded in `GEAR-SET-CONTEXT-MEASUREMENTS.md`; 1,699/1,699 tests, four runtime syntax checks and independent source audit pass. This document is frozen before checkpoint127 is committed: the exact source commit and remote readback require the separate external backup receipt. It is not advance proof of successful remote backup.

## Restore complete source, not only runtime files

Retrieve the entire `dot-game/` directory from the exact final source commit for checkpoint `127-v029-gear-context-source`, identified in its external backup receipt. Preserve source, original assets, tests, all historical fixtures, scripts, guides and recovery evidence. Verify every payload's byte count and SHA256 against that commit's `CHECKPOINT.json`; the manifest excludes itself. Do not replace this complete recovery point with the six website runtime files. The frozen 159 executable/asset input manifest is `docs/AUDIT-V029-INPUTS.json` (SHA256 `e50a9695336f5d442151ac5555adf24908878b600ab151380f5d2c151b9e7c2b`); all 40 historical fixtures and 2 browser fixtures retain exact bytes.

No package installation or build is needed. Tests require Node20+:

```sh
cd dot-game
node --test tests/*.test.mjs
node --check src/engine.js
node --check src/loot.js
node --check src/session.js
node --check src/ui.js
```

The README's Python HTTP workflow is recovery guidance for an authorized executor, not permission to bypass the known website refusal with an alternate preview. This source-only iteration did not launch localhost, tunnel, staging or browser acceptance. The accepted root tab and failed preview tab remain untouched.

Source recovery does not restore private browser saves, Library contents, account/login state, permissions, schedules or offline progress. Export personal progress separately. Save format3 and namespaces are unchanged; existing Exquisite-IW1 old-reader rejection and emergency-supply preference fallback still apply. No new field or compatibility promise is introduced by the preview context.

## Source backup and publication boundary

Use small immutable blob uploads and a SHA-only tree. Preserve all 409 outside blob IDs/modes, verify the full manifest, read back each changed file from the exact resulting commit and verify unchanged Git identities. Update only personal `GGGODLIN/hv-v3` `bot/dot`, with the reconciled expected HEAD and `force:false`. If a ref result is uncertain, inspect the real ref before any retry.

`PUBLICATION-BLOCKER-V026.md` retains the exact website tool-review refusal. Explicit user consent is already established; repeating consent or previously known scope is not new evidence. No candidate/site ref update, CI trigger, deployment, alternate actor/account/API/host, HTTP acceptance or browser acceptance was attempted here. Successful source backup does not resolve that block.

If the review block is legitimately resolved later, reconcile exact source/site refs and select a candidate for authorized browser acceptance. Do not automatically publish stale v0.26 or promote this source-only iteration. Accepted v0.25 remains the released version until real candidate and root acceptance gates are met.
