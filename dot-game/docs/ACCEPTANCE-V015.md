# v0.15 independent parry equipment acceptance

Status: source-level independent acceptance PASS. This is not a browser or publication receipt; aggregate checks and actual browser acceptance are recorded separately.

## Scope and evidence boundary

The implementation adds a seventh item value, **raw parry rating**, to newly generated rapiers and newly purchased rapier commissions. Ordinary and Nimble endpoint/level scaling follows the permitted original-HV research described in ORIGINAL-HV.md. The quality exponent remains the declared research fit, not an exact published server equation.

The game's character conversion is explicitly adapted: `clamp(0.035 + sum(equipped raw parry)/100, 0, 0.5)`. The fixed old 3.5% base remains. Original attacker-accuracy-dependent avoidance conversion is not implemented. Raw rating is not displayed or stored as a probability, and is not clipped by the previous 16% generation cap for other rate stats.

Old owned items have no parry added merely by loading. A new rapier can therefore differ from an otherwise similar old rapier. The `1.8 × raw rating` comparison-score weight and its effect on this game's existing sale/commission prices are adaptations, not original economy prices. Refresh old writers: the v0.14 validator rejects items with this new stat rather than preserving it.

## Independent suite

`tests/parry-acceptance.test.mjs`: **18/18 passed**, zero skipped. Test-only accepted v0.14 engine/loot controls retain fixed SHA-256 identities and their original provenance. No third-party game implementation is used.

- **5,000 seeded new weapon samples** independently recompute ordinary/Nimble raw rating from per-stat R, the appropriate endpoint pair and level scale. The sample includes both suffix cases and values over20, demonstrating no probability-cap truncation. Only rapiers gain the generated value; legal generated identities remain recognized.
- **1,500 seeded slot samples** compare non-rapier output byte-for-byte against v0.14 and check the subsequent RNG value remains aligned. New rapier stat draws and expanded suffix choice intentionally alter later streams; no global post-drop equality is asserted.
- Fixed commissions at levels1/20/100/500 use ordinary rapier endpoints and R110. Existing attack/crit values are unchanged; axe/club commission objects remain byte-identical. Rating receives its explicit score weight exactly once.
- Legacy saves match their previous canonicalization with no new item value. New raw rating and its diagnostic roll survive reload; malformed negative/nonfinite/non-numeric/over-limit values and unknown future keys fail closed. Accessor metadata is refused without executing getters.
- Pure new stats use the old base, add raw rating once and clamp at the declared50% adaptation. Combined gear contributions do not recursively multiply a prior character maximum.
- A candidate with higher parry is **not** a safe-sale downgrade merely because its six older stats are worse. Equal parry allows other strict dominance; parry-only strict improvement is correctly named in the witness.
- Exact manual-sale quotes retain the raw stat; changing it after review rejects the entire transaction. Detached preview edits cannot alter live gear.
- Saved build application previews the real final parry chance and preserves all owned item records, sparse new stat/roll metadata and reference locks across A→B switching and reload.
- Three legacy starter fights remain identical in state/RNG through their tested pre-loot boundaries. This is not a claim that future new-item generation is unchanged.

The engine author's focused suite additionally tests actual incoming enemy attacks consuming the new character fraction rather than the former hardcoded chance. Its boundary fixtures are synthetic, not naturally earned browser progress.

## Naturally earned paired choices

Seeds29/42/77 each completed30 expeditions using the accepted v0.14 public game APIs, reaching level14: **90 historical engine-earned victories**. The acquisition policy chooses existing score-best gear and the three early abilities for reproducibility, not as a universal best-build recommendation. No resources or item statistics were injected.

Each profile buys an old rapier with its earned credits, migrates normally, then buys a new rapier through the current exact commission quote, paying **764 credits**. Both physical items remain owned. Three matched stage1/2/3 comparisons then equip the actual old or actual new item in cloned profiles with equal resources and starting RNG. Their attack/crit are equal; the new rating11.6866 changes the adapted parry check from3.5% to15.1866%.

| Seed | Stage | Old/new clear seconds | Old/new HP lost | Old/new counter count |
|---|---:|---:|---:|---:|
|29|1|7.4 / 5.3|44 / 0|0 / 1|
|29|2|8.4 / 5.3|51 / 0|0 / 1|
|29|3|10.5 / 10.5|98 / 98|0 / 0|
|42|1|5.3 / 7.4|16 / 21|1 / 0|
|42|2|6.3 / 9.5|18 / 27|1 / 0|
|42|3|10.5 / 13.7|75 / 121|0 / 0|
|77|1|8.4 / 8.4|61 / 39|0 / 0|
|77|2|9.5 / 8.4|70 / 46|0 / 0|
|77|3|11.6 / 9.5|127 / 52|0 / 0|

All18 runs win. The new branch is **4 faster, 2 equal, 3 slower**; HP loss is **5 lower, 1 equal, 3 higher**. Totals are560→404 HP lost. Counter count is2→2, actual counter damage350→317. These outcomes do not prove a universal survival, speed or retaliation benefit. Changed defensive decisions affect later shared RNG and can produce worse individual trajectories. No encounter coefficients were tuned to remove the negative cases.

The cohort tests new ordinary-parry commissions against actually owned legacy counterparts. It is not a natural Nimble-drop superiority comparison, high-level difficulty balance, actual browser play or evidence that all new loot is better.

## Review limits

Independent source review covers the raw-value/rate distinction, exact quote/schema integration and conservative disposal. UI-specific text/layout and normal browser-generated drop/purchase/equip/reload behavior are separately verified by their owners. Full physical-mobile, OS suspension and exhaustive lifecycle-race coverage are not claimed. Source backup does not restore the user's browser save.

## Independent UI source review

Reviewed the separate raw-rating `招架值` versus character-fraction `招架判定率` labels, seven-stat commission/manual-sale/dominance explanations, saved-build current→target preview, old-item/new-price warnings and absence of automatic retroactive upgrades. Re-ran the UI owner's focused file: **12/12 passed**. Actual render/equip tests show legacy3.50% and new paid rapier integration; DOM/VM checks are not browser layout acceptance. No remaining source defect was found in this bounded review.

## Narrow historical-test maintenance

Three assigned existing files required schema-aware updates; no golden digest or expected historical item bytes were regenerated.

- `safe-loot-longrun.test.mjs` keeps actual **current** naturally earned runs, exact per-drop/RNG-prefix checks, transparent observation controls and inventory/currency invariants. Its independent componentwise oracle now includes parry as a seventh key. It had falsely called a new parry tradeoff a downgrade when ignoring that key; the production classifier correctly retained it.
- `v06-acceptance.test.mjs` keeps all current sale/opt-in routing behavior. Synthetic item stat overrides now remove only orphan diagnostic rolls, so a generated rapier's `rolls.parry` is not left behind after that fixture deliberately replaces its stats. The deliberately dominating synthetic keepers now include raw parry1000, just as their other synthetic stats dominate, preserving the test's declared all-low-tier-sale premise. All exact old hashes and routing equality assertions are unchanged.
- `gear-sets-acceptance.test.mjs` explicitly runs its historical acquisition comparison using frozen v0.14 versus v0.13. The earned gear then exercises **current** preset application, **current** ordinary manual equip and **current-versus-current** subsequent battle equality. It no longer incorrectly claims new parry loot generation must remain identical to pre-parry generation.

The three-file focused maintenance run passes **71/71 tests**, zero skips/failures. Current seven-stat invariants remain active; historical comparisons are narrowly and honestly labeled.

## Integrated source validation — 2026-10-26 08:18 UTC

`node --test tests/*.test.mjs`: **1,140 passed, 0 failed, 0 skipped**. `node --check` passes for engine.js, loot.js, session.js and ui.js. These are source checks, not browser/publication evidence.

Historical byte-identity/seeded economy guards that predate the new rapier stat retain their original digests against the verified frozen v0.14 loot control. The historical clock-balance cohort likewise uses the frozen pre-parry v0.14 engine, so it does not mislabel changed future loot RNG as a clock regression. Current clock boundaries, transactions, new parry RNG/stat behavior, and new-item compatibility are tested separately. No historical golden was regenerated to hide a mismatch.
