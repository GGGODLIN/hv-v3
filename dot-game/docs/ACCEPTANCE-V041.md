# v0.41 source-only import ordering correction

Base: `dea3309663278b7f4a5a9834906740956f700bab`. Accepted recovery: `2a5354689165d7512d279327db8935c3bbef8570`; public website remains v036 `f192fec4eff401948d80156f941c01404816cbba`.

## Reproduced failure
Two ordinary file-change handlers overlap while `file.text()` is pending. B finishes and is confirmed first; A later finishes, prompts again, and can replace B. Full production UI with real engine/session and simulated browser APIs reproduces A gold111 overwriting newer B gold222. This requires a second confirmation on the old version, not silent bypass of consent. An older read failure can also replace the newer successful-import toast with an error.

## Minimal correction
A transient generation counter increments at import-button entry, each file-change event (before empty/oversized checks), and pagehide. After await, a stale read returns before parsing, validation or confirmation. The catch branch also ignores stale failures. This does not cancel the OS read itself; it discards its obsolete result. New invalid/canceled/oversized choices intentionally supersede older work without importing anything. The normal latest file retains format validation, explicit replacement confirmation and both live ownership checks. No engine, RNG, save schema, economics, assets or layout changes.

## Evidence
- Main full-production-UI suite: 7/7 passing; identical suite against v040 UI: 0 pass / 7 expected failures. Latest wins; newer empty, oversized, invalid and picker-entry choices; old rejected reads; pagehide/resume.
- Independent full-production-UI suite: 6/6 passing; against v040: 1 pass / 5 expected failures. Includes latest confirmation canceled, invalid/empty/oversized choices, late rejection and normal single valid/invalid behavior.
- Two legacy partial-controller tests now include the real generation declaration/entry instead of omitting a new dependency.
- Historical forest/chest source pins use a helper that reverses only the exact new import edits; original pinned hashes remain unchanged. Their engine/CSS/asset pins remain direct. An initial aggregate exposed these intentionally changed lifecycle bytes; corrected exact normalization and reran the entire fixed file set.
- Final aggregate and syntax counts are recorded in CHECKPOINT.json. No gameplay changes are inferred from mock file tests.

## Limits
Source-only, not browser accepted or published. No actual OS picker speed/reordering demonstration, no new visual acceptance; inherited v037/v038 art remains unaccepted. Existing website Kenney scope refusal remains unresolved. Zero website actions, no alternate route, no removed attribution, no schedule or dot-archive changes. Full source backup/readback receipt is external to the snapshot to avoid self-referential commit claims.
