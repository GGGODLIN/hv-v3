# v0.30 source acceptance — comparison keyboard focus

**Final source validation: 1,741/1,741 tests, four runtime syntax checks, and 163 frozen executable/asset inputs unchanged.**

Source base: exact v0.29 `eb134eaf7da676c2834eb5c08bf84cb957e523b4`, tree `8144966d4cb79198ed1e38fc17f4bde3f1b72dc6`. This is source-only work; v0.25 remains the accepted release. No browser acceptance or publication is claimed.

## Reproduce first, repair only the affected control

Both a focus-faithful Node controller harness and an independent JSDOM check reproduce the inventory/equipment bug: focusing and activating a comparison button removes that node and leaves focus on BODY. Pending comparison already restores the replacement by exact ID, including forced rerender; it is preserved behavior, not a newly fixed normal-click bug.

The repair captures actual renderer-owned focused comparison controls, restores only after that control is replaced, and matches exact item identity across rendered locations. It never infers focus from selection or matches by name/slot/interpolated selector. If no visible exact-ID control remains, a visible stable fallback is used. Existing explicit claim/filter/dialog completion behavior remains; unrelated focused controls are not pulled to comparison by automatic updates or a remembered selection.

The bounded change is in UI focus handling only. Engine, loot, session, style and original assets are unchanged. No save data, default RNG, combat, reward, sale consent, filtering choice or ownership rule is added. All historical fixtures remain immutable.

## Evidence and limits

- `tests/comparison-focus-ui.test.mjs`: full-controller source tests with real ancestry/disconnection semantics, repeated comparisons, exact IDs and non-stealing boundaries.
- `tests/comparison-focus-audit.test.mjs`: independent adversarial checks; final frozen inputs/results are recorded in `AUDIT-V030.md` and `AUDIT-V030-INPUTS.json`.
- `COMPARISON-FOCUS-MEASUREMENTS.md`: fixed seed42 naturally earned inventory/equipment/pending replay with exact v0.29 state/report parity. Synthetic edge cases remain separate from earned play.
- Complete-source restoration is described in `RECOVERY-V030.md`. This pre-commit document does not predeclare successful remote backup; the exact checkpoint commit and external readback receipt establish that result.

No real browser/device, keyboard hardware, accessibility tree, layout or screen-reader acceptance is inferred from source DOM emulation. No website/candidate ref update, CI trigger, deployment, alternate host, localhost preview, HTTP or browser acceptance is attempted. Existing publication refusal remains unchanged and known unexecuted; user consent is not missing.

## Final frozen result

- 1,741/1,741 tests pass in 30.832 seconds, including 21 new UI tests and 21 independent tests. Four runtime syntax checks pass; the measurement script also passes its syntax check.
- All 163 executable/asset inputs match before and after the full suite and independent replay; input manifest SHA256 `f75df56a6b0ad9d022c2b4a5f8fff6930566efb9fa90e638e42db9032279a534`. Engine/loot/session/style remain exact v0.29 bytes. All 40 historical fixtures and 2 browser fixtures are unchanged; nine existing tests have branding-only version updates.
- Fixed known seed42 earns the first natural overflow after 315 wins / 2,746 pulses. All 3,817 full-state/report comparisons with v0.29 are exact, with no normalized fields, losses, censoring or additional sampling. Seven earned exact-ID controls × three repetitions retain focus 21/21 after activation and after forced rerender; baseline is 3/21 at both stages (pending only). Both versions preserve state/RNG/dispatch/storage-write bytes through all inspections.
- Independent replay exactly matches the 12,742-byte receipt, SHA256 `75a8af03ef8afd3603f44ace38d235a759312addc6f54362cb9f813ffac07d34`. Eleven separate JSDOM cases cross-check DOM semantics; neither harness is an actual browser.
- The first aggregate run exposed one source-slice integration guard: old Protection tests included the newly placed helper declarations. Relocating the same helpers outside that slice fixed the integration without changing the historical test or runtime behavior; the complete suite was rerun on final inputs.

Final UI SHA256: `51ff734d11a50d0115c7063c3649dc432c6a424b21fc78a13353b1a245ff8442`. These documents freeze before checkpoint128's source commit; successful backup still requires its exact commit and external complete-readback receipt.
