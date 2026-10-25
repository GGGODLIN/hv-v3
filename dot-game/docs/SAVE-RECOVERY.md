# Repaired-save takeover — source-only v0.8.1 follow-up

## Reproduction and correction
A follower opens while the shared save is corrupt and enters protected mode. Another owner imports a valid backup. The follower's real storage listener displays that valid state, but previously retained preventOverwrite=true; its later ownership callback immediately returned. It could win and equip normally yet never persist, losing that progress on reload. The reproduction used actual import/storage handlers, ownership, save and engine code, not a hypothetical stale flag.

The ownership-acquisition refresh now reads durable storage even when protected. Non-null bytes are validated when protection is active or content differs from the last observed save; only successful validation/adoption clears protection and its obsolete corruption notice. A storage event alone does not authorize writing. Thus a newer durable journey supersedes a cached event, and corrupt-again bytes before takeover remain protected.

A missing current slot is writable only for an initially empty, unprotected journey (including validated migration). Deleting an adopted/persisted or protected save does not authorize replacement. Unsupported schema, invalid JSON and actual storage-read errors remain fail-closed. The existing sticky storeAvailable=false behavior is deliberately retained: this patch does not promise automatic recovery from denied/broken storage APIs. A failed write still warns and leaves the previous durable bytes unchanged. Explicit valid import retains its existing confirmation/ownership contract.

Only refreshSavedState() in src/ui.js changes from source receipt 50b3462ca7bd5d4c90991adc6a22f0939cef9f30. Engine/session/loot and all UI bytes outside that function remain unchanged. No save schema, combat formula, reward or original-HV rule changes.

## Validation
- Twenty new tests execute the entire UI source with production engine/session/loot modules and actual handlers/ownership/pump. Browser APIs/DOM are simulated; this is not a real-browser test.
- Original defect fails before the patch. Valid repair → real takeover → natural win/drop → camp/equip → replay → save/reload now retains progress.
- Negative controls cover corrupt-again/empty/null/unknown metadata/missing/read failure, read-only operation and unsupported locks; cached events cannot authorize overwriting current bad data.
- Parent final full suite and four syntax checks are required before snapshot: 551 tests, zero skips/failures.
- Independent read-only reviewer: ten additional actual-handler cases passed, including newer durable state, same-byte ordinary reacquisition preserving ongoing combat, first save, deletion, and post-recovery write failure. Its 62-test focused run and UI syntax check passed before the final added test cases; final aggregate covers all twenty new cases.

## Recovery and release
Complete source will be backed up only to bot/dot, exact-readback verified with bytes/SHA256/Git blob hashes and restored-package tests; a subsequent receipt identifies that commit. Prior fully verified source-only receipt is 50b3462ca7bd5d4c90991adc6a22f0939cef9f30. Latest accepted playable recovery remains e1b576ee2041bd2772f79587e859a80b5ab1f108 (v0.7).

No website, public HTTP retry, CI or CUA/browser operation occurs in this follow-up. The pending verification gate is not bypassed by Node tests. No GPT Library synchronization, personal browser-save backup, credential or schedule restoration is claimed.
