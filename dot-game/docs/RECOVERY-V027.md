# v0.27 source-only recovery

## Identities and scope

Source base: personal `GGGODLIN/hv-v3`, `bot/dot`, exact `3460fb0e4a634f35f00f6262970521a969f51492` (checkpoint124, source-only v0.26 with its publication-blocker receipt). New development owns only `dot-game/`; no other repository source, constants, monsters or artwork is incorporated.

Last accepted recovery remains `e5962e728ae4c20db80172916f3e1a9b72815a91` (v0.25). Accepted website remains `f00fdfe1fcad529081057e99592a49466341bb08`. Prepared but unpublished v0.26 website candidate `14524044ee864ac9ac590ed933c9fd0ef5148680` is not a released backup. Its denied ref update is confirmed unexecuted; no uncertain write is outstanding.

The v0.27 source candidate includes unaccepted v0.26 Exquisite IW1 plus the bounded, default-OFF Balanced/Assault emergency-supply policy. This is **not** an accepted release or a claim of browser play.

## Complete restore

Retrieve the entire `dot-game/` directory at the exact source commit, including source, original independent assets, tests, historical fixtures, scripts and documentation. Verify every payload's byte count and SHA256 against that commit's `CHECKPOINT.json`; the manifest excludes itself. Do not substitute the six runtime website files for a complete source backup.

Node20+ and Python3 are sufficient; no install/build dependency:

```sh
cd dot-game
node --test tests/*.test.mjs
node --check src/engine.js
node --check src/loot.js
node --check src/session.js
node --check src/ui.js
```

The ordinary project's documented HTTP-server workflow remains valid for an authorized executor, but **this blocked publication task did not start an alternative preview, localhost, browser or host**. Do not treat recovery instructions as permission to bypass the existing tool refusal.

Source backup does not include private browser exports, account/Library data, login state, permissions, schedules or offline progress. The live root profile and failed candidate tab were left untouched.

## Save and source verification

Format3 and existing namespaces remain. `emergencySupply` is a strict optional boolean with sparse true storage and OFF default. Historical v0.26 readers drop this preference on save, rather than rejecting it. Existing v0.24/v0.25 Exquisite-IW1 refusal and all invested-item protections still apply. Export progress and refresh older tabs before writer takeover.

Source-only completion requires full tests and four syntax checks on the final source, fixed-cohort paired engine measurements, complete manifest, small-blob/SHA-only-tree backup to bot/dot with expected HEAD and no force, exact changed-file readback and unchanged identity verification, preserving all409 outside blobs/modes. No old fixtures are rewritten. New v0.26 fixtures are independently copied exact source baselines with provenance for portable parity.

## Public work remains blocked

Read PUBLICATION-BLOCKER-V026.md for the full refusal. The user already gave explicit candidate consent; the block is tool review, not missing consent. Repeating known consent or scope facts is not new evidence and does not justify retry. Do not use an alternate actor, account, API, host, tunnel, browser or path.

No new website commit/ref mutation, deployment, CI trigger, HTTP acceptance or browser acceptance belongs to this source-only iteration. If the tool block is legitimately resolved later, reconcile actual source/site refs before deciding which candidate to validate; do not automatically publish stale v0.26 or promote v0.27 from source tests alone. Keep accepted v0.25 separate until actual authorized candidate and root acceptance is established.
