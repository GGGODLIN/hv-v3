# v0.35 independent battle-actor audit

## Result and limits

**19/19 independent primitive/transform/controller checks pass. The final full suite passes 1,897/1,897, and all four runtime syntax checks pass.** All **177** runtime/test/asset/HTML/CSS/package inputs are byte-identical before and after that aggregate. The aggregate SHA256 is `34a9d9bb5c09d6c2a9ed2bfe02407bdb7edc0c41cedc2f6227ebf8694af4aa74`. Replay scripts and prose are deliberately outside that aggregate-input manifest; the frozen replay runner is separately verified below.

The first aggregate genuinely ran and passed 1,896/1,897. Its sole failure was an overlooked v0.34 version-label assertion in `tests/counterattack-ui.test.mjs`. The owner changed only that precise expected version, and the **entire suite was rerun**. The first failed receipt is preserved rather than rewritten as a pass.

The exact local accepted-v0.34 baseline is `../../hv-v3-dot-v034/dot-game`. Running these same checks against it gives **12 passes and seven expected failures**. The failed boundaries are four distinct named enemy bodies, exact-name precedence over a conflicting role, a fixed alternating-guard capability cue, equipped weapon-family shapes, static/muted defeated enemies, a static/muted defeated hero, and the authoritative equipped-family lookup. Existing overlays, finite small-canvas commands, reduced-motion behavior, unknown fallback, and drawing nonmutation already pass v0.34; those are preservation checks, not newly repaired features.

This is a **source/Canvas-command audit**, not a screenshot, browser, visual-quality, text-fit, device-pixel, mobile, screen-reader or animation-performance acceptance. The root task owns actual browser QA and publication. The preexisting generic-body problem also has separate root screenshot evidence; this audit does not substitute command traces for that evidence or certify new art from source alone.

## Bounded identity behavior

- Four exact local names now select different geometric bodies even when colors are removed from the recorded command stream: `灰霧獵犬`, `碎晶甲蟲`, `荒野影獸`, and `赤砂守衛`.
- `boss` overrides names. An exact known name overrides a conflicting role for body selection; live defense-role labels remain authoritative. Early-route beetles and shadow beasts still have baseline mechanics, not invented defense bonuses inferred from art.
- Unsupported names, partial-name matches and prototype-like values use a neutral fallback, with existing explicit role cues. A boss-like name without the boss flag does not silently become a boss.
- The guard's alternating-attack ornament is a fixed capability cue. It does not claim a next-cast prediction or respond to the tick clock.
- The hero reads the already-existing `resolveWeaponFamily(state.equipment?.weapon)` resolver. Axe, rapier, club and unsupported/starter neutral sword produce distinct geometry. Inspecting another inventory item cannot change the drawn equipped family. Unsupported fields, arbitrary names, missing weapons and nonweapon objects do not acquire supported-family art.
- Reduced motion suppresses existing bob/pulse transforms while retaining static identity. Defeated enemies are flattened and muted, with no live target/status labels; defeated hero opacity is reduced and residual attack pulse/bob is suppressed. The independent audit caught the latter missing suppression before final freeze; it was corrected only inside `drawHero`.

These are cosmetic selections, not new enemy classes, equipment slots, proc probabilities, damage or defense rules.

## Geometry and overlay checks

A local Canvas recorder validates every numeric argument, affine transforms, nonnegative ellipse/arc radii, balanced save/restore and restored global opacity. It records transformed polygon/rectangle vertices and conservative full-ellipse bounds. It does not rasterize pixels or simulate browser font metrics.

At the minimum logical canvas size **320 × 160**, every tested living/defeated identity and weapon family has finite commands and its actor-body bounds remain inside the canvas, under both normal and reduced motion. Tests exercise the one-, two- and three-position drawing formula. Across actual engine route previews for stages 1–30, all **60 two-enemy pairs** retain positive separation; the minimum body gap is **38.2 logical pixels** (31.2 in the v0.34 baseline).

Important exclusions:

- The engine generates at most two enemies in those routes. The generic renderer's hypothetical three-enemy cap can bring the widest bodies within a few pixels of each other; three-enemy separation is not claimed.
- HP/name/role/defense/target and PA/STUN/BW/READY coordinates and text remain byte-identical. Tests check all labels, separate stack-row Y coordinates, current defense rates, HP-bar dimensions and opacity restoration.
- Existing stacked status plates occupy some upper-body space. For example, at 320 × 160 a boss body's top is about 58.9 while three status rows start at 51.4, 62.4 and 73.4. That preserved arrangement needs actual visual inspection; distinct row coordinates and finite label widths do not establish legibility, text fit or unobscured artwork.

## State and source preservation

Actor rendering runs with recursively frozen state/items/enemies and strict-mode evaluation. Randomness, storage, network, timers and actions are failure traps. Repeated drawing and controller-driven inspection preserve complete state (including seed/RNG and action data), tracked controller calls and storage writes. The controller scenario deliberately uses synthetic equipment/inspection setup; it is not presented as a naturally earned play session.

Exact comparison with v0.34 confirms:

- `src/engine.js`, `src/loot.js`, `src/session.js` and `style.css` are unchanged.
- All **14** asset/license/provenance files, **42** historical/browser fixtures, and **two** shared source-test helpers are unchanged, with no path additions/removals in those groups.
- The **113,951-character prefix** before `drawHero` and **17,442-character suffix** beginning at the existing enemy HP/label overlay are unchanged. This includes all existing scene/background/particle drawing, UI actions, storage isolation, combat overlays and lifecycle code outside the two actor bodies.
- No new module import, DOM handler, external media, network request, persistence field or storage namespace is introduced by actor drawing.
- Exactly **nine existing test files** change version/phase text only. Reversing `v0.35`/`v0\\.35` and the accepted-to-source phase label reproduces each v0.34 file byte-for-byte; no behavioral assertion is weakened. HTML changes only two version labels, and package metadata changes only the version.

## Independent review of the natural replay

The dedicated natural-source replay is separately owned and recorded in `BATTLE-ACTORS-MEASUREMENTS.md`; its result is not manufactured by these synthetic rendering tests. I independently read its protocol and implementation, verified every receipt-recorded input against current bytes, and compared the separate second-process output `/tmp/battle-actors-rerun.json` with the checked-in receipt byte-for-byte. I did **not** run a third replay or claim authorship of the two producer runs.

The protocol pins the accepted v0.34 checkpoint and its 389-file manifest, preserves the three engine/loot/session modules, and performs 20 fixed natural acquisitions using only owned gear and unlocked routes. It compares two separately loaded source engines after each public action/pulse. The unchanged canonical earned save then supplies actual axe/rapier/club IDs to three source controllers: accepted UI with animation, candidate with animation, and candidate without animation. No missing-family or unknown-enemy coverage is fabricated.

The receipt records 20/20 acquisition wins, 15/15 replay wins, **432** complete source parity checks, **1,722** controller parity checks, and **1,542** frame-only nonmutation pairs / **3,084** frame calls. Visible main-replay scene calls are 1,538 each for baseline/candidate and zero for the no-animation control. Tracked storage equality is not real browser persistence, and cosmetic VM randomness is fixed only for reproducible view effects; combat uses the unchanged state-seeded engine. All-win source samples do not establish natural defeat behavior, balance, rates, performance or visual quality.

Separately verified frozen identities:

- Runner `scripts/battle-actors-measurement.mjs`: `f7f4cbb7c0ccb74804dd1d04d6a126810df4eebbac739e2006f47ae142190762`.
- Receipt `docs/battle-actors-measurements.json` (22,121 bytes): `c968b57fe629dfcc6695c3c60d73cd549b689a453694e62fbf232c5476e3029f`.
- Candidate `src/ui.js`: `3453008a505fd769a04ae459db953cecfa4aadeedb9867c1aefcead55c9ffe5b`.


## Evidence

All paths below are relative to the version folder (one level above `dot-game`):

- `evidence/audit-v035-baseline.tap`: 12 baseline passes / seven expected failures.
- `evidence/audit-v035-focused.tap`: 19 final independent passes and generated-pair geometry diagnostic.
- `evidence/audit-v035-preservation.json`: exact core/assets/fixtures/helpers/UI-boundary and nine-test metadata comparison.
- `evidence/audit-v035-final-full.tap`, `audit-v035-syntax.txt`, and `audit-v035-final-verification.json`: aggregate and four-module syntax receipts.
- `evidence/audit-v035-final-inputs-before.json` and `audit-v035-final-inputs-after.json`: executable/test/asset inputs, excluding changing prose, evidence and separately verified replay scripts.
- `evidence/audit-v035-final-check.mjs`: reproducible local aggregate/manifest driver.
- `evidence/audit-v035-initial-final-full.tap` and matching initial manifests/verification, plus `audit-v035-initial-syntax.txt`: retained first run with the missing version assertion.
- `evidence/audit-v035-replay-review.json`: independent protocol/hash review and exact second-process receipt comparison.

No external write or browser/user-machine operation was performed by this auditor.
