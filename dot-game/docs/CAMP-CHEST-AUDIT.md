# v0.38 original camp chest — independent source audit

## Scope and result

Source-only candidate; no publication, browser, screenshot, accessibility or pixel-quality claim. Independently reviewed the frozen v0.37 baseline against v0.38 and added `tests/camp-chest-independent.test.mjs` (7/7 passing).

Audited `src/ui.js` SHA-256: `fb0e874e9a185fb7797148aeeb854e3210e6c0af19ab465e499c0c12196a3a2c`.

## Verified contracts

- Entire UI before and after the exact empty-enemies chest block is byte-identical to v0.37, pinned by a baseline-derived SHA-256. This includes actors, nameplates, forest, controller/lifecycle behavior, particles and effects. No broad version normalization applies to UI.
- Engine, loot, session and CSS retain exact baseline hashes. All 14 asset files, including existing provenance and license files, retain the exact sorted path/content manifest hash.
- HTML differs only in its two `v0.38` candidate labels; package JSON differs only in version `0.38.0`. Tests normalize those exact strings and pin the remaining complete bytes.
- Chest remains visible exactly when the existing sliced enemies list is empty, including the empty-enemy battle interval. Populated encounters with 1–4 enemies produce no chest commands. Mode does not change its appearance.
- 21 paint operations form a contact shadow, front planks, darker receding side, bevelled lid/end cap, two iron straps and central lock/keyhole. Shared front/side boundaries and the keyhole within the lock are asserted.
- Yellow radial halo is removed. No chest state access, randomness, time-dependent animation, dispatch, persistence, network or timer calls are introduced. Traces are identical for four times and both reduced-motion settings.
- Canvas arguments are finite, rect dimensions positive, and transform/save/restore balance unchanged. Geometry stays within scene bounds at 320×160, 344×160, 640×360, 320×360, 960×160 and 1200×675; the existing resize minimum is 320×160. Chest retains the original enemy-side position and ground baseline.

## Limitations and external boundary

The harness executes the isolated chest block with real source primitives and instrumented Canvas methods. It verifies command geometry and side-effect boundaries, not rasterized pixels or natural gameplay in a browser. No assets were fetched, imported or edited. The previously denied Kenney website provenance `create_blob` write was not retried, redirected or bypassed; existing source attribution remains unchanged.

## Verification commands

- `node --test tests/camp-chest-independent.test.mjs`: 7 passed, 0 failed.
- `npm test`: 1,940 passed, 0 failed, 0 skipped (64.6 s). This run started before the final HTML/package-only independent assertion was added; the subsequent focused run passed all 7 checks. Final aggregate rerun remains the parent task's release check.
