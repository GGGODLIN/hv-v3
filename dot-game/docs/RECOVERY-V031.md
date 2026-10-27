# v0.31 scene-first source recovery

Base: personal `GGGODLIN/hv-v3`, branch `bot/dot`, exact v0.30 `f2007293ec2701e7e18e212f5463fddf327ccb62`, tree `70edd11c00b38840dea1f7cc623a2608f4c266bd` (336 own-source files / 335 manifest payloads). Own `dot-game/` only; preserve all 409 outside blob identities/modes. Do not copy other authors' game code, constants, monsters, single-player designs or art.

Accepted release remains v0.25 source `e5962e728ae4c20db80172916f3e1a9b72815a91`, website `f00fdfe1fcad529081057e99592a49466341bb08`. Prepared v0.26 website candidate `14524044ee864ac9ac590ed933c9fd0ef5148680` remains unpublished. Its denied ref update is known unexecuted; no uncertain website write exists. v0.26–v0.31 source work is not browser accepted.

## Restore the complete source

Retrieve the entire `dot-game/` from checkpoint `129-v031-scene-first-source`'s exact source commit, identified by the external backup receipt. Verify every payload byte count and SHA256 against that commit's `CHECKPOINT.json` (which excludes itself). Keep source, original canvas artwork, tests, historical fixtures, scripts and recovery documents—not only website runtime files. No new external art was downloaded or incorporated; the user's X-linked asset identity/license remains unverified.

```sh
cd dot-game
node --test tests/*.test.mjs
node --check src/engine.js
node --check src/loot.js
node --check src/session.js
node --check src/ui.js
```

Final source evidence: 1,767/1,767 Node tests, four runtime syntax checks and 166 unchanged executable inputs. Forty historical fixtures plus two browser fixtures are exact. `AUDIT-V031-INPUTS.json` SHA256 is `eb92fa82c9321f0ccb7af9652982950b8eaec5ccef316fe7caff2e5536a57f26`; independent optional replay exactly matches the 9,562-byte receipt SHA256 `003a05f8a794baa96cee54bad6a9c4c1ba380f226f1fd4196f7cf5d3b9cf1ddf`. These are source evidence, not rendered acceptance.

Node20+; no dependency installation or build is required for the game or portable Node source tests. Independent JSDOM evidence uses an already-installed cloud test dependency; it is explicitly not a browser or paint acceptance requirement for restoring the game.

This revision changes presentation structure/CSS and adds a text-only current-weapon readout. Engine, loot, session, RNG, data format3, storage namespace, migration/rejection boundaries, fees and confirmation policies are unchanged. Existing v0.30 exact-ID comparison focus behavior remains. Previous fixtures retain exact bytes; details of tests and source replay are in `ACCEPTANCE-V031.md`.

Source recovery does not restore private browser saves, Library/account state, permissions, schedules or offline progress. Export personal progress separately. The README's HTTP startup command is recovery guidance, not permission to bypass the known publication refusal with a local/alternate preview.

## Backup and release boundary

Freeze final source inputs and complete manifest before upload. Use small blob uploads, SHA-only tree, exact-parent commit and expected-HEAD/nonforce `bot/dot` update. Verify all changed contents from the exact commit and unchanged Git identities; preserve 409 outside blobs/modes. Reconcile any uncertain ref result before retry. Pre-commit documents are not evidence that a later backup succeeded; consult the external exact-readback receipt.

`PUBLICATION-BLOCKER-V026.md` remains unchanged. Explicit consent is already established; repeating it is not new evidence. No website/candidate ref update, CI trigger, deployment, alternate account/API/host, localhost preview, direct Chromium/headless rendering or actual browser acceptance is attempted. The accepted root, original save and failed preview browser tabs remain untouched. A successful source backup does not resolve that block or authorize publishing this candidate. If legitimately resolved later, reconcile refs and run authorized candidate/root desktop/keyboard/responsive acceptance before any promotion. The nominal 1174×751 first-screen fit remains a design target until rendered and observed; do not advertise it as measured.
