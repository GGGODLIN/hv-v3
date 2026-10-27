# v0.30 source-only recovery

Base: personal `GGGODLIN/hv-v3`, branch `bot/dot`, exact v0.29 `eb134eaf7da676c2834eb5c08bf84cb957e523b4`, tree `8144966d4cb79198ed1e38fc17f4bde3f1b72dc6` (325 files / 324 manifest payloads). Own `dot-game/` only; preserve all 409 outside blob identities/modes. Other authors' game code, constants, monsters and artwork are excluded.

Accepted release remains v0.25 source `e5962e728ae4c20db80172916f3e1a9b72815a91`, website `f00fdfe1fcad529081057e99592a49466341bb08`. Prepared v0.26 website candidate `14524044ee864ac9ac590ed933c9fd0ef5148680` remains unpublished. Its denied ref update is known unexecuted; no uncertain website write exists. v0.26–v0.30 source work is not browser accepted.

## Restore the complete source

Retrieve the entire `dot-game/` from checkpoint `128-v030-comparison-focus-source`'s exact source commit, identified by the external backup receipt. Verify every payload's byte count and SHA256 against that commit's `CHECKPOINT.json` (manifest excludes itself). Keep all source, original assets, tests, historical fixtures, scripts and recovery documents—not only the six website runtime files.

```sh
cd dot-game
node --test tests/*.test.mjs
node --check src/engine.js
node --check src/loot.js
node --check src/session.js
node --check src/ui.js
```

Final source evidence: 1,741/1,741 tests, four runtime syntax checks, and 163 frozen inputs; 40 historical fixtures plus 2 browser fixtures retain their exact bytes. `docs/AUDIT-V030-INPUTS.json` SHA256 is `f75df56a6b0ad9d022c2b4a5f8fff6930566efb9fa90e638e42db9032279a534`. Independent natural-source replay exactly matches `docs/measurements/comparison-focus.json` (12,742 bytes; SHA256 `75a8af03ef8afd3603f44ace38d235a759312addc6f54362cb9f813ffac07d34`).

Node20+; no dependency installation or build. Source tests and focus-faithful DOM emulation do not replace actual browser keyboard/layout testing. This repair changes only focus handling for replaced gear comparison buttons, not engine, loot, session, RNG or save format3. Existing Exquisite-IW1 old-reader rejection and emergency-supply preference fallback remain.

Source recovery does not restore private browser saves, Library/account state, permissions, schedules or offline progress. Export personal progress separately. The README's HTTP startup command is recovery guidance, not permission to bypass the known publication refusal with a local/alternate preview.

## Backup and release boundary

Freeze final source inputs and complete manifest before upload. Use small blob uploads, SHA-only tree, exact-parent commit and expected-HEAD/nonforce `bot/dot` update. Verify all changed contents from the exact commit and unchanged Git identities; preserve 409 outside blobs/modes. Reconcile any uncertain ref result before retry. Pre-commit documents are not evidence that a later backup succeeded; use the external readback receipt.

`PUBLICATION-BLOCKER-V026.md` remains unchanged. Explicit consent is already established; repeating it is not new evidence. No website/candidate ref update, CI trigger, deployment, alternate account/API/host, localhost preview, HTTP or actual browser acceptance is attempted. The accepted root and failed preview browser tabs remain untouched. A successful source backup does not resolve that block or authorize publishing this candidate. If legitimately resolved later, reconcile refs and run authorized candidate/root acceptance before any promotion.
