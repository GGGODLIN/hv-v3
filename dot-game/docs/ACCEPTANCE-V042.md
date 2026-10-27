# v0.42 import persistence feedback (source only)

Base: `87af2c1526ee6a38d1b67834ad3708a0bfd6a68e`. Formal stays v036; accepted recovery `2a5354689165d7512d279327db8935c3bbef8570`.

## Reproduction and correction
The actual production import listener ignores the boolean return of save(true). A rejected localStorage write or unsupported Web Locks leaves imported memory loaded but durable bytes unchanged, while the old toast still promises safe continuation. Existing persistent warning/status already reports failure; this change removes the contradictory success toast, not a silent data-loss engine bug.

Capture save's return and announce saved progress only on true; otherwise explicitly say this-tab-only, not saved, export immediately. Preserve validated memory and old durable bytes on rejection, confirmation, ownership checks and async ordering. No engine, schema, RNG, economics, CSS or asset changes.

## Evidence
Primary production UI simulated-browser tests cover rejected write, unsupported locks and actual successful persistence. All three fail old v041's toast expectations, while state/durable-byte assertions already pass. Independent audit and complete aggregate counts are recorded in CHECKPOINT.json. Historical unrelated-source pins reverse only the exact feedback expression, preserving original fixed hashes; version-label expectations updated with metadata.

## Limits
No actual browser storage-quota/OS permission test or new browser acceptance. No website operation; known Kenney scope refusal remains pending. Source backup is distinct from accepted release. Full manifest and external exact-commit readback receipt identify recoverable source; do not claim website or dual-library sync.
