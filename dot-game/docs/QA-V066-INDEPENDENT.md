# v066 independent source/controller review

2026-10-28 UTC. Baseline: source checkpoint202, `8ad50429da453977a4c2cc2a4b5d4ef855938e60` (v065). This review owns only `tests/single-expedition-independent.test.mjs` and this report. No website, assets, external game code, save migration, or runtime edits were performed by the reviewer.

## Result

**PASS: 22 independent tests; no blocking defect found in the reviewed single-expedition slice.**

Command: `node --test tests/single-expedition-independent.test.mjs`

- Nine deterministic natural-play runs (seeds 1, 29, 909 × Balanced/Assault/Sustain) compare every 0.25-second observation against the established explicit `start` then `finishThenCamp(true)` flow. Full state and resulting reports match. Each completes four waves, grants exactly one win and one seed, returns to camp and stops advancing/rewarding.
- Repeated startOnce during battle does not restart or reset its clock. After cancellation, a stale single-start cannot silently requeue the existing fight. Cancelled one-shot play naturally completes two expeditions under the unchanged repeat flow.
- Defeat/unsupported modes refuse single-start; a stage30 defeat fixture naturally reaches defeat without a win, then retreat and ordinary start do not retain reservation.
- Pending loot and insufficient backpack capacity cannot start or leave an orphan reservation; removing the blockers and using ordinary start remains continuous.
- Save validation returns camp and does not retain this session-only reservation. No new persistent setting is introduced.
- Live UI controller has a native button, immediate existing cancel/status feedback, correct pump reset on entry, and no reset from repeated stale activation.
- Read-only, hidden, inactive-page and ungranted WebLock controllers cannot begin a single run. Storage-denied/no-lock compatibility remains intentionally playable in foreground but writes no saves; it is not misrepresented as durable storage.
- An actual active Item World fixture rejects both direct engine and stale UI single-start with full state/seed/trial unchanged. Single-expedition is ordinary-route only.

## Review notes and boundaries

`startOnce` checks camp and absence of Item World before calling the established start function, and adds the WeakSet reservation only after start actually reaches battle/fight. Existing start, reward settlement, finishThenCamp cancellation and defeat/retreat cleanup remain the authority. UI dispatch includes this new action in lifecycle reset/feedback handling and rechecks readiness rather than trusting the button disabled state.

This is this game's idle-control adaptation, **not an original HV rule**. It adds no combat math, drop rate, currency cost, stage limit, or saved preference. Original research remains in ORIGINAL-HV.md.

Natural engine simulation and VM-backed DOM/controller tests are not real-browser acceptance. Actual published candidate clicking, layout/responsiveness, mobile rendering, keyboard focus/announcement and formal-profile persistence must be verified separately by the publication/QA owner. Lock/storage boundary cases above are synthetic controller fixtures, not claims about a real browser permission prompt. No claim of public HTTP checks, CI, repository backup, or release is made here.
