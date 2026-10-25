# v0.2 independent acceptance — candidate

Recorded 2026-10-25 14:05 UTC. Includes old-writer namespace isolation and migration checks. This document concerns the independent `dot-game` only. It does not promote a candidate or claim publication. Exact-commit source backup, CI, public-byte verification and browser acceptance are release-owner responsibilities.

## Executed automated checks

`node --test tests/*.test.mjs`: **88 passed, 0 failed, 0 skipped** at this checkpoint. Of these, 16 independent adversarial checks are in `tests/v02-acceptance.test.mjs`.

- Balanced preserves frozen accepted-v0.1 first-clear signatures for seeds 1, 42 and 999: 31.6 simulated seconds, level 2, gold 76, XP 6, 30 player turns, unchanged final RNG and loot counts.
- Strategy selection changes no instantaneous sheet stats or hero resources, accepts only known choices in camp, refuses battle changes and round-trips through the version-1 save validator. A legacy save without either strategy or action counters defaults safely to balanced and can start combat.
- Identical seeded controlled target (seed 42, final wave, 2,000 HP, 0 attack, defense 5, no avoidance): assault clears faster and spends more MP/skills than balanced. This is a scheduling tradeoff, not a free stat grant.
- Identical pressure target (3,000 HP, 60 attack, otherwise same): balanced and assault fail, sustain wins while using all three finite potions and more healing. This deliberately controlled fixture is evidence of distinct policies, not a universal balance claim.
- Fake monotonic clock: repeat calls at one instant cannot double-step; disabled time is not banked; reset discards elapsed absence; a gap greater than five seconds is discarded entirely; permitted short gaps process at most two seconds.
- Fake atomic lock manager: one writer per namespace, candidate and stable independently owned, follower simulation gated, synchronous save-before-successor-load ordering, safe release and reacquisition.
- Adversarial lock lifecycle: delayed delivery after release, stale request crossing release/resume epoch, reentrant release from acquisition, exceptions during release and acquisition, unsupported API never becoming shared-save owner.
- Source-contract inspection: rAF contains no simulation call; one timer pump calls advance; persistence rejects unsupported/nonowner sessions; async import checks ownership before assigning restored state; pagehide releases and resets. These checks inspect source and are **not runtime UI tests**.

## Defects caught and fixed before this checkpoint

1. Acquisition callback could synchronously release before `owner` was set, leaving a held lock and then advertising ownership. Fixed by lifecycle ordering, guarded acquisition epoch and guaranteed cleanup.
2. A throwing release callback could leave ownership and the atomic lock retained. Fixed by release cleanup in `finally`.

All lifecycle regression tests now pass. No runtime source was edited by the independent reviewer.

## Old-writer migration gate

Old v0.1 tabs do not honor Web Locks. Sharing their `save-v1` key would therefore violate single-writer safety even with a correct new lock implementation. v0.2 now writes only its same-scope `save-v2`, with separate preferences and writer-lock keys. The JSON payload still uses schema version 1; the storage suffix describes writer compatibility, not a changed payload schema.

Three independent tests exercise the actual pure migration loader and actual acquisition-refresh function (executed in a Node VM):

- Migration reads/validates a legacy snapshot without writing or deleting it; after a v2 snapshot exists, later old-tab writes to v1 cannot replace v2 progress.
- Existing v2 wins over legacy. A malformed v2, including empty text, blocks fallback instead of silently replacing progress. Malformed legacy data is preserved and marked as an error.
- A valid v2 appearing between initial load and ownership is adopted on acquisition; malformed/empty v2 appearing during that interval sets overwrite protection. This caught a truthiness check that initially ignored empty text; the implementation now explicitly distinguishes absent (`null`) from corrupt.

The scope-key/write-target inspection confirms no legacy write or deletion path. These are direct function tests plus source integration checks, not an actual two-version browser coexistence test. The release owner must separately verify visible migration behavior and preserve candidate/stable separation.

## Evidence limits / browser gate

Fake clocks/locks do not prove hidden-tab throttling, page lifecycle, browser storage-event timing, DOM import guards, takeover interactions, or mobile layout. In particular, the rAF/timer source check is not proof of a real browser running only once per interval. These require staged browser play by the release owner after source backup; retain v0.1 stable until required checks pass. Actual mobile/device behavior remains untested unless separate browser evidence records it.

A browser that exposes Web Locks but rejects requests currently fails closed (read-only), rather than silently permitting an unsafe storage writer. The API-absent fallback is foreground-only in-memory play and explicitly does not overwrite shared saves. Availability failures must not be represented as successful persistence.

No offline earnings are implemented. More than five seconds without an observed timer tick is deliberately lost, even if caused by aggressive background throttling rather than closing the page. Online-background progress is therefore best-effort, never a promise of full wall-clock yield.

The skill policies, mana rates, support timing and potion rules are this game's adaptations. See ORIGINAL-HV.md and COMBAT-DESIGN.md for the research-supported original rules and separate adaptation ledger.
