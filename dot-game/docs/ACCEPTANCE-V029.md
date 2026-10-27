# v0.29 source acceptance — retained context in gear preview

**Source validation passed: 1,699/1,699 tests and four runtime syntax checks.** This is source-only work, not browser acceptance or publication. The last accepted game remains v0.25. Source base is exact v0.28 `e4121bb89be2b9e29bdbb262c83f16d0be993267`, tree `072d2cbd105dbbce4311821d89766a14c65cfd06`.

## Observed gap and bounded change

The existing gear-set apply dialog shows exact item identities, sheet deltas and conditional counter context, but only generically says current abilities/tactics are retained. The underlying settings are elsewhere, including a separate Growth tab. This is a preparation information gap, not a broken equipment-set implementation.

The preview now includes the current strategy, target policy, Protection policy, extra emergency supply behavior and slotted ability ranks. They are current context, not stored preset values or settings that will be restored. Only equipped ability ranks count as enabled. Protection ON does not claim an already-active shield; unlock status is separate. Sustain still follows its independent automatic potion rule, including permission to use the final bottle; the extra-supply preference is retained but ineffective under Sustain.

The three presets remain gear-only. No new saved field, full-build recall, AP spending, automatic loadout selection, engine rule, loot rule or economic change is included. Existing item/stat/counter comparisons, ID ownership, lock protection, whole-set atomic swap and camp recovery remain.

## Verified source checks and truthful boundaries

- Actual UI/controller logic executes in the simulated-DOM harness, covering all strategy/policy states, legacy defaults, nontrivial slotted ranks, learned-unslotted exclusion, Protection eligibility and the Sustain exception.
- Opening/canceling leaves complete state and RNG unchanged; applying preserves abilities, policies, identities and gear-only semantics apart from the existing swap/recovery/log effects.
- Stale visible consent is canceled when a displayed policy or ability context changes. Import, ownership, departure, repeated-click and cancel protections are retained.
- The full source suite and four runtime syntax checks pass against frozen final inputs. Existing fixtures are preserved; engine/loot/session identities match exact v0.28.
- Independent reproduction confirms the bounded earned-source equipment-change/play loop without fabricated rewards or claiming controller simulation is a rendered browser.
- Independent source audit passes. Complete source backup/readback remains a separate required receipt, preserving all 409 outside blobs/modes.

## Completed earned-source play

The fixed seeds 29/42/77 each completed 30 ordinary stage-1 acquisition attempts: 90 wins/980 one-second pulses, all naturally reaching Lv13 and holding all three supported weapon families. Nine independent current-setting/preset branches produced 7 actual gear swaps and 2 honest already-current no-ops, then 9 follow-on wins/85 pulses. There were no defeats, censored fights, missing families or replacement-seed searches; no loss case is invented. Only Rank 1 abilities were naturally exercised; higher ranks and locked Protection are separate synthetic test boundaries.

Every engine preview preserved complete state/RNG; each actual apply retained all policy choices, learned/slotted allocation and held item bytes, with only the existing gear locations/recovery/log effects. Actual start reports contained the retained policy/ability/gear configuration. This is source-engine play, not a UI Cancel test or evidence of faster combat. The simulated-DOM tests separately exercise the dialog.

See [GEAR-SET-CONTEXT-MEASUREMENTS.md](GEAR-SET-CONTEXT-MEASUREMENTS.md). The single reproducible receipt is 55,907 bytes, SHA256 `fab6c54b2a59665b1bf9f1d3c59a9508df78b9ba1d3e1874bd20af19d85fefb6`. No private browser save is included.

## Final frozen validation

The full suite passes **1,699/1,699 tests** (28.783 seconds), including 14 new controller cases and 13 independent audit cases; all four runtime syntax checks pass. All 159 executable/asset inputs retained identical bytes before and after the final suite, syntax checks and independent natural rerun. All 40 historical fixture files and 2 browser fixtures remain unchanged. Nine existing tests have branding-only version-label updates, not rewritten behavioral expectations.

The common report-display extraction also preserves exact detached DOM output across 3,894 synthetic historical-context cases, with no input mutation. This separately guards historical reports; it is not real layout/browser acceptance.

The input manifest is [AUDIT-V029-INPUTS.json](AUDIT-V029-INPUTS.json), SHA256 `e50a9695336f5d442151ac5555adf24908878b600ab151380f5d2c151b9e7c2b`. See [AUDIT-V029.md](AUDIT-V029.md) for independent scope and limits. Independent source-play reproduction matches the complete 55,907-byte receipt above.

These documents are frozen before creating checkpoint127's source commit. The exact final commit, complete manifest and remote readback result must be verified through that commit's `CHECKPOINT.json` and the separate external backup receipt; this pre-commit document does not predeclare successful remote backup. Historical counts in older documents remain their own results.

No real browser/device, mobile layout, OS sleep or broad cross-tab acceptance is claimed. The existing publication review block remains; no candidate/site ref update, CI trigger, deployment, alternate hosting, localhost preview, HTTP acceptance or browser acceptance was attempted for this slice. See `RECOVERY-V029.md` and the unchanged `PUBLICATION-BLOCKER-V026.md`.
