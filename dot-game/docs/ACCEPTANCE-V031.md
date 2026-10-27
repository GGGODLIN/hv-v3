# v0.31 source acceptance — scene first

## Status and scope

**Source candidate only. No actual browser/rendered-layout acceptance and no website publication.** Accepted v0.25 remains unchanged. Base is exact personal `GGGODLIN/hv-v3` `bot/dot` commit `f2007293ec2701e7e18e212f5463fddf327ccb62`.

The latest user feedback prioritizes presentation over additional mechanics. This slice replaces the three-column dashboard hierarchy with a compact traveler/status strip, broad expedition region, adjacent route/actions, visible backpack/equipped comparisons and secondary native disclosures. It removes the large decorative portrait and visible glyph item ornaments. The sole `ui.js` change is two text-only lines in `renderEquipment()` updating the compact actual equipped-weapon name. All comparison/focus, event, draw, dispatch, engine and session logic otherwise stays intact.

No new outside art or license was acquired. The X-linked asset remains unidentified after 403; no retry, mirror, guessed pack or download. Original independently drawn canvas art is temporary. This is not a finished coherent asset-grid/art overhaul.

## Source behavior

The aggregate Node suite passes **1,767/1,767** tests: the existing 1,741 plus 11 targeted controller/structure tests and 15 independent audit cases. All four runtime JavaScript syntax checks pass, and 166 frozen executable inputs remain unchanged before/after the final independent suite. Exact independent results and input manifest are recorded in `AUDIT-V031.md` and `AUDIT-V031-INPUTS.json`.

New targeted cases cover:
- The current-weapon readout follows actual equipped identity, not a selected comparison; update after a real equip, accepted import and readonly storage refresh; name inserted as text only.
- Re-render and native-disclosure view changes do not mutate state, RNG, dispatched actions or storage calls; existing strategy handler is reused.
- Queued finish-to-camp survives collapsed/expanded tactics; compact header updates do not steal exact-ID comparison focus.
- Parsed source order is scene → route/actions → live enemy/readouts → tactics; health, ownership, mode and focus anchors remain outside closed disclosures/hidden tool panels.

The independent 15 cases add closed-native-details ancestry (which the shared focus helper itself does not model), all tool tabs in town/battle/defeat, readonly stale actions, rejected-save protection, keyboard-event tab navigation, all three equipment controls, exact-ID cross-location/fallback, pending claim, hidden selected-sale items/cancel/ownership invalidation, permanent-binding quote/cancel and paid IW seed-loss/retreat warning. Synthetic valid boundary fixtures are labelled test inputs, not natural play. An additional independent JSDOM parse pass is documented separately; it is not added to the portable Node test count.

## Existing-test amendments are explicit

No test case is removed and no historical fixture is rewritten.

1. Nine existing UI files change only the candidate version label from0.30 to 0.31.
2. The camp-navigation source-group check uses `</main>` instead of the now-earlier backpack start to locate the last tool panel; the group contents and every dialog-outside-main assertion remain.
3. Two historical audit cases previously pinned `style.css` as unchanged for their own nonvisual revisions. Only those obsolete style pins are removed and their test names explain the deliberate v0.31 layout change. All exact engine/loot/session hash pins remain. Style behavior is now reviewed as an intentionally changed input, not silently assigned a replacement golden hash.
4. 40 historical source fixtures and 2 browser fixtures retain identical bytes. Engine, loot and session remain exact v0.30 bytes; data format3, namespace, RNG, prices, consent and old-reader boundaries are unchanged.

## Source design review, not pixel acceptance

Independent parsed-source review resolves all 198 unique IDs and every label/ARIA target. The only removed old ID is decorative SVG gradient `cloak`; the newly added functional ID is `current-weapon-label`. Existing control IDs and hooks remain. Three equipped controls and `slot-filter` stay outside optional panels to preserve the v0.30 exact-ID focus contract.

The later CSS overrides reset the earlier 680/1150/1450 breakpoint assumptions, including old tablet item-detail grid positions and the old hidden save-indicator rule. At 1023px and below the main columns become one and reset explicit grid rows, matching source reading order. Critical warnings do not gain clipping/truncation. Secondary native summaries have focus styles and no nested interactive controls.

Declared CSS arithmetic at 1174px is 804px expedition plus 312px backpack with 20px outer gutters and 18px gap. The declared desktop scene clamp chooses 331px at 751px height. **These are not measured bounding boxes or proof of above-the-fold fit.** Long equipped names, readonly/migration/error text, font fallback and zoom can increase height. Full names/warnings must win over an artificial fixed-height target.

## Earned-source replay and limitations

See `SCENE-FIRST-MEASUREMENTS.md` and the reproducible optional `scripts/scene-first-measurement.mjs`. It starts a predetermined seed 42 acquisition, retains all outcomes and uses real earned gear/resources; no imported personal progress or fabricated resource grant is called natural. Complete state/report/controller parity with exact v0.30 is checked. Ordinary replay is ephemeral; separate explicit lock-callback/save-protection emulation does not claim real Web Locks or cross-tab acceptance.

No screenshot, CSS geometry measurement, real Tab/Enter focus visibility, native dialog behavior, assistive technology output, contrast pass, high-zoom or mobile-device validation is claimed. No direct Chromium/headless, localhost server, CUA, website candidate, CI or alternate host was used. Publication tool denial remains known unexecuted; it was not retried. The user's original website save was untouched. Full source backup/readback must be identified from checkpoint 129's exact commit and external receipt; this precommit document is not evidence that the later push succeeded.
