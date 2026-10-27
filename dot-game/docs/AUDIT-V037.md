# v0.37 independent woodland-stage audit

## Scope and result boundaries

This is an independent source and Canvas-command review of the original woodland backdrop. The change replaces the repeated triangular trees, moon, flat-topped pillars and repeated ground flecks with distant forked trunks, an unmoving mist veil, broadleaf edge silhouettes, a receding trail and four paving fragments. It does not add a combat mechanism or use another game's artwork.

Eight independent checks pass. They are **not raster, screenshot, browser, mobile, screen-reader or accessibility acceptance**. Root must inspect and play the isolated candidate before accepting a formal release. A 320×160 logical canvas is not a tested 320-CSS-pixel device. Source geometry cannot certify that the new scene looks better or that labels are legible in actual fonts.

## Hard preservation boundaries

The accepted v0.36 local baseline is identified as source `2a5354689165d7512d279327db8935c3bbef8570`. Its complete 407-payload `CHECKPOINT.json` was independently checked against local byte counts and SHA256 with no mismatch; this is not a new remote readback claim.

The production change is confined inside `drawScene`, after its width/height declaration and before `const ground=h*.79`. Exact comparisons establish:

- All 145,767 UTF-8 bytes before `drawScene` are unchanged, including full controllers, original-HV caveats, enemy DOM details and actor/opaque-nameplate rendering.
- All 14,523 UTF-8 bytes from `const ground=h*.79` onward are unchanged. Character placement, death presentation, target/effect overlays, chest and its old yellow halo, front grass, vignette, particles, flash, handlers and persistence lifecycle remain intact.
- `src/engine.js`, `src/loot.js`, `src/session.js` and `style.css` are byte-identical.
- All 14 asset/license/provenance files, 40 historical test fixtures and two shared test helpers retain identical paths and bytes. No imported art, extra font or external asset dependency was added.
- The candidate UI SHA256 at source review is `ddfdb6cacd727a421c0387d5a257ef98df65a3ba16333db8bee1eee956399f48`.

The independent test suite embeds accepted hashes for core, controller prefix, individual drawing functions and the entire scene/lifecycle suffix. It is portable without keeping the previous checkout beside the game.

## Independent command evidence

A separately written command recorder invokes only the actual background with game-state access, actions, storage, network, timers and randomness trapped. At logical dimensions 320×160, 344×160, 640×360, 320×360, 960×160 and 1200×675, every recorded coordinate is finite, polygon bounds remain inside the canvas and rectangle extents remain within a one-pixel rounding allowance. The first rectangle covers the complete canvas and two valid linear gradients are recorded.

Across three sampled dimensions, the six foreground trunk/limb/highlight polygons remain wholly in the outer left 17% or right 15%; the four canopy silhouettes end by 24% of canvas height. The eight paving-face/shadow polygons start below 86% height. This establishes a deliberately quiet central actor corridor in command space, not final pixel contrast. Distant trunks, the mist veil, ground planes and dim motes still occur behind the actors; nothing is painted over the preserved actor/nameplate layer by the new code.

Reduced-motion command output is identical at times −10,000 and +10,000. With normal motion, only up to six one-pixel translucent mote rectangles move horizontally; the landscape geometry, colors, and vertical mote positions do not change. No game random number is consumed.

The existing vignette and flash still composite after actors and labels. Thus even opaque nameplates' final pixel colors can change; source palette calculations would not establish browser contrast. The old chest halo is intentionally unchanged. Narrow/mobile layout, zoom, real font rasterization, reduced-motion actual browsing and an overall art-direction judgement remain separate validation work.

## Initial checks and corrections

The first focused audit ran 7/8. Its only failure compared gradient recorder functions by object identity across two executions. The recorder was corrected to compare serializable command data, without changing production code, and all eight cases passed.

An initial full aggregate overlapped the integrator's correction of one stale `v0.36` version-label regex in `counterattack-ui.test.mjs`. It failed that old assertion and recorded changed inputs, so it is retained as an initial receipt—not a final pass. No combat assertion was removed. The final aggregate is run afresh only after runtime/tests freeze.

## Final complete source verification

After the explicit freeze, the independent driver ran every `tests/*.test.mjs` using Node v24.22.1 from **14:08:09 to 14:08:48 UTC on 2026-10-27**: **1,934/1,934 pass, zero failures/skips/cancellations/todos**, plus all four runtime syntax checks. The 181 runtime/test/asset/HTML/CSS/package inputs are byte-identical before and after. Their aggregate SHA256 is `a56b0506593ae72e8cba472f9ecef42a51c057a150400df7e73c9b3a0dc83b8d`.

The count is 1,919 accepted baseline cases plus seven implementation and eight independent cases. Nine historical test files normalize exactly to version/phase text changes; no earlier behavior assertion changed. HTML changes only its two version labels and candidate phase, and package metadata changes its version. Prose/evidence and separately verified measurement scripts are not included in that 181-input digest.

Evidence retained outside the runtime package, in the version folder's `evidence/` directory:

- `audit-v037-focused.tap`: eight focused independent passes.
- `audit-v037-initial-final-full.tap` and `audit-v037-initial-final-verification.json`: initial full failure and changed-input receipt, explicitly not final evidence.
- `audit-v037-final-full.tap`, `audit-v037-final-verification.json`, `audit-v037-final-inputs-before.json` and `audit-v037-final-inputs-after.json`: fresh complete pass, syntax results and immutable input lists.

## Separate natural replay review

The auditor read the fixed acquisition/replay protocol and independently ran a **third process** of `scripts/forest-stage-measurement.mjs` against the exact accepted v0.36 directory. Its output matches the producer's canonical `docs/forest-stage-measurements.json` byte-for-byte: **17,494 bytes**, SHA256 `205d65e3585f01533d26df6de225260dd44d0444e0ffeb972942940065c23163`.

The fixed natural protocol has 20 acquisition wins and 15 replay wins, 432 source parity checks, 2,455 complete controller parity checks and 6,084 frame calls / 3,042 nonmutation pairs. Full state, seeded RNG, events, reports, action logs and tracked writes agree with both accepted baseline and no-frame control. Natural final state serialization/validation/reload also agrees. The replay does not synthesize resources, gear or progress. This supports non-interference, not balance, pixel quality, real browser storage or performance claims.

Recovery-pending/READY, defeat, unknown enemies, pending overflow, Item World and soulbinding are absent from this natural sample. Their absence is not success coverage. See `FOREST-STAGE-MEASUREMENTS.md` for exact protocol and natural effect counts. The separate process log is `evidence/audit-v037-replay-run.txt`; the temporary comparison file is `/tmp/forest-stage-audit.json`.

**No source correctness blocker was found within this bounded slice. Browser visual/play acceptance and publication remain separate gates owned by root.**
