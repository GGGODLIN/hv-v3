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

Exact expiry/no-refresh/partition invariance and fatal-recovery ordering are covered by automated tests; a real fatal recovery was not observed in this playthrough. File-chooser import was not rerun. The subsequent public-root receipt below records shared-v3 takeover and final smoke.

## Limits
Original source versions disagree on duration terminology and leave ordinary/recovery turn interaction unknown. Fixed 25% / four simulation ticks and the chosen player-turn recovery policy are adaptations. Magic resist reduction is deferred. Physical mobile, OS suspension and the inherited foreground-only visibility anomaly remain unverified; no offline rewards or universal background guarantee.

## Public root
Accepted source `b47ecc87f5fa66bbd2dbf85f7581bdc06626f74f` was verified by exact readback of all 39 files / 389175 bytes before promotion. Website commit `5aa89cb1771f3b934e26a8085030830f2747c73b` passed exact Pages run `40211704287`. All six public runtime HTTP200 bodies match source SHA-256. Only five root blobs changed (session.js unchanged); candidate paths and concurrent unrelated work were preserved.

Final root smoke at 16:28–16:30 UTC:
- Kept the older v0.3 root tab open. New v0.4 root correctly started read-only, preserving Lv18, XP421/1076, gold7874, kills412, wins68, inventory82, balanced strategy and equipped rapier/armor/accessory. Candidate Lv10 progress did not mix.
- Opened settings and explicitly took over. New v0.4 start became enabled; old v0.3 became read-only with start disabled. Reload retained all visible progression/equipment and v0.4 header, with the existing v3 namespace rather than a fresh timeline.
- Selected a pre-existing club from the shared inventory. Its old no-proc description was replaced for display with current truthful stun/recovery explanation, without duplicate trait paragraphs. Equipped it and started stage3.
- On the actual public root, a living enemy displayed stun remaining4ticks and a matching named proc notice. No app-origin console errors appeared in inspected entries.
- Returned safely to camp at Lv19 / wins73. Closed old and candidate test tabs; left the public v0.4 tab as the deliverable. No user-computer access, hidden-storage inspection, or game-state injection occurred.

Bounded desktop publication acceptance passes. This documentation receipt does not change or republish runtime code.
