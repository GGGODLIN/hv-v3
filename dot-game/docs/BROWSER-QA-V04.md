# v0.4 browser acceptance — 2026-10-25

## Candidate evidence
Source candidate `3a0bf240eb6216438f278ffe8064f386e74d919e`: all 38 files / 384184 bytes read back exactly; 37 manifest payload hashes pass. Candidate site commit `77ab8973d5c29cc36eab96b24fd0d9a85b7d2902` adds only six files under `/play/hv-v3-dot/candidates/v0.4/`. Accepted v0.3 and concurrent unrelated website content are preserved. Pages run `40210714831` succeeded for the exact candidate SHA; all six HTTP200 runtime bodies match source SHA-256.

## Automated acceptance
202 Node tests and four JS syntax checks pass. The independent audit found a real timer-partition extra-attack defect and verified its correction using per-enemy player-turn coalescing, not a frame/substep immunity window. Seven partition patterns agree. See ACCEPTANCE-V04.md and COMBAT-DESIGN.md for exact fixtures, a harder case where both builds lose, and the RNG-stream limitation.

The actual prior v0.3 validator round-trip preserves persistent weapon identities and progression. Encounter-only stun/recovery state is discarded on load, so v3 save/lock keys are retained. Older open tabs still execute their old gameplay until refreshed; shared ownership prevents simultaneous writers, not cached code from becoming current automatically.

## Actual browser observations
All observations used dot cloud Chrome via CUA, ordinary UI controls and read-only DOM inspection, not the user’s computer, injected game state, synthetic imports or raw browser automation.

- Opened fresh at Lv1, isolated from stable Lv18. First normal clear took31.6s and dropped an axe. Equipping it raised displayed attack43→107; the next same-stage clear took14.8s. This is the ordinary growth/equip loop, not a controlled stun measurement.
- Natural drops supplied a club and armor. Inspected/locked/equipped the club, then equipped armor through the normal UI. Club explanation correctly states non-refresh, critical eligibility, avoidance suppression, recovery risk, and explicit adaptations; obsolete duplicate/no-proc prose was absent.
- Selected stage2 and enabled automatic progression. The same character cleared stages2–8 and reached9 using the naturally obtained equipment. This is one natural playthrough, not a guarantee all seeds/builds win.
- A living stage3 boss showed stun remaining2ticks and a matching4tick proc notice, with reduced motion enabled. A stage5 screenshot visibly showed the canvas STUN4T badge, status card and text notice. These observations prove actual rendered control feedback, not just source assertions.
- A living stage8 boss produced a visible recovery notice while reduced motion remained active. Earlier stage3 and stage6 recovery actions also appeared in the persistent combat log. Ordinary combat continued after recovery; no perpetual lock was claimed.
- A 300% browser zoom screenshot showed two independent enemy cards, one with3ticks remaining and the other unstunned. innerWidth393 / document scrollWidth388: no horizontal overflow. Restored normal zoom. This is a narrow CSS layout check, not a physical mobile test.
- Return-to-camp hid enemy/proc/recovery panels. Reload preserved Lv10, gold1452, wins11 and equipped club/armor, returning safely to camp with statuses absent.
- Inspected final error logs contain no app-origin errors. Extension errors were excluded only by explicit chrome-extension URL provenance.

Exact expiry/no-refresh/partition invariance and fatal-recovery ordering are covered by automated tests; a real fatal recovery was not observed in this playthrough. File-chooser import was not rerun. Shared-v3 cross-version takeover and final public-root smoke remain post-promotion checks.

## Limits
Original source versions disagree on duration terminology and leave ordinary/recovery turn interaction unknown. Fixed 25% / four simulation ticks and the chosen player-turn recovery policy are adaptations. Magic resist reduction is deferred. Physical mobile, OS suspension and the inherited foreground-only visibility anomaly remain unverified; no offline rewards or universal background guarantee.

## Public root
Candidate bounded desktop acceptance is complete. Public root has not yet been promoted at this source checkpoint; preserve v0.3 until exact accepted-source readback and separately authorized promotion. Record final shared-v3 takeover and public verification in the subsequent receipt.
