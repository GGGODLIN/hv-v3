# v0.2 bounded desktop acceptance

Cloud Chrome, 2026-10-25. Staged runtime at source c9e6d73ad853e048d09de17be5cb1398a4fa224e, site 753160bd26f1c7ba2680bd6a6adadfc741bbf25f. No user computer or other game's code/assets used.

Observed so far:
- v0.2 loads, original v0.1 stable root remains unchanged.
- Assault can be chosen at camp, description updates, selection disables in battle. Repeating stages produce loot/level growth.
- Native Chrome tab switching screenshots show another tab/new-tab page active while candidate runs. After return, kills increased from2 to13 and wins reached2; no reset to camp. Browser automation's read-only document.hidden report did not reliably describe native activation, so this evidence is inactive-tab progress, not a controlled OS-suspension test.
- Second candidate tab is readonly with start/strategy/stage/import controls disabled. Explicit takeover releases prior writer; old tab reports readonly/start disabled, successor enables import, shows saved status and retains strategy. Successor resumes from safe camp as documented.
- Sustain is selectable in camp. Background setting can be disabled and reports foreground-only.

Pending before root promotion: finish foreground-only/return observation, responsive zoom layout, source backup and release acceptance. Physical mobile-device, long OS suspend and long-duration multi-tab stress are not yet verified. Unit/fake-clock tests are not mislabeled browser proof.

## Further observations — 14:15 UTC
- Three policy descriptions update and controls are camp-only; assault and sustain both started successful runs.
- At ordinary browser 300% zoom, CSS viewport width=388 and document scrollWidth=388: no horizontal overflow; responsive scene layout screenshot inspected. This is desktop zoom/layout evidence, NOT mobile device/touch emulation. Returned browser zoom to100% afterward. DevTools was disabled by kiosk policy and was not bypassed.
- Inspected captured console errors: no application-origin errors; browser extension errors excluded explicitly.
- Important limitation: after disabling background mode, native-tab inactivity still showed progress in this cloud environment. The read-only browser observation reported document.hidden=false despite native screenshots showing another tab selected. The source guards that signal correctly and fake visibility tests pass, but actual foreground-only pause is NOT verified here; do not advertise it as tested. Cause is not established. OS suspend/no-offline behavior is bounded-clock test evidence, not a physical-suspend experiment.

Accepted scope: desktop prototype with default online idle, single-v0.2-writer takeover, policy choices and preserving prior saves. Runtime stable-v1 migration will be smoke-tested after source backup/promotion; old v1 storage is preserved so failure cannot overwrite it. Physical mobile and foreground-only/browser visibility compatibility remain explicit limits.
