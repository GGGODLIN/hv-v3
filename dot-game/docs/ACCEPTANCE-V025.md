# v0.25 inventory workbench acceptance

## Scope and evidence separation

This release addresses the real84-item backpack in the accepted v0.24 browser profile. It adds transient AND filters for slot/weapon family/investment, truthful matching counts, empty/reset guidance, retained filtered-out inspection, exact hidden-sale selection disclosure and labeled commission reveal. It does not add combat, item growth, economy, save format or IW tiers.

Engine SHA256 `54dda1cf9982b4eab2336071d43cf398a1ad35fbe4397508f6fed5afedb5d974`, loot `8ca322c77ab265d88ebfdf1b64247e9170cbdd47fdb14f68b702903c368259cd` and session `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` remain exact accepted-v0.24 bytes. All31 historical fixtures remain unchanged. Existing UI assertions changed only current release labels and real helper extraction in partial commission harnesses; no behavior assertion was weakened.

## Final source gate —2026-10-26 21:08UTC

**1,538/1,538 tests passed**, including17 independent audit checks; all four runtime modules pass syntax checks. All133 captured source/UI/test/script inputs remained unchanged during the29.3-second final run. UI SHA256 `9303c16d361ece0c2bec431ee1d16b2b5619326db1e30ff4099e6a08aed3436a`. All80filter combinations on the unchanged84-item export and each of three naturally earned source profiles preserve state/RNG/save/quotes.

## Added coverage

- 12 feature UI tests: exact intersections/counts, unknown weapons versus non-weapons, explicit empty recovery, preserved inspection and full selected-sale IDs/hidden markers, commission reveal, native-select focus and defaults, import/ownership/startup reset, no game-state writes.
- 17 independent audit checks: frozen gameplay/fixture identities, independent filter intersections, total/hidden selection invariants, complete quote preservation, stale/repeated/changed ownership and item consent safety, equipped/pending exclusion, keyboard/reset behavior, import and read-only/battle browsing.
- 5 natural-source tests: three fixed fresh cohorts, deeply frozen state and retained sale quotes. These are source tests, not browser observations; their actual measurement protocol and outcomes are in INVENTORY-WORKBENCH-MEASUREMENTS.md.

## Browser gate

Public candidate and actual cloud-browser acceptance are pending until separately recorded in BROWSER-QA-V025.md. A source test does not establish actual focus/layout/import or Pages publication. Ordinary UI controls and an unchanged prior export are the only allowed browser-progress inputs. Formal root remains v0.24 until complete source readback, candidate CI/HTTP/play, accepted-source backup and root CI/HTTP/stable-profile smoke pass.

## Limits

No mobile device, OS sleep, arbitrary multi-tab/browser, offline progress, new formula/balance or laterIW-tier claim. Filters never loosen themselves to manufacture a result; contradictory and absent categories remain genuinely empty. Preserving a selected item outside the view is clearly disclosed, not silently interpreted as permission to sell. Complete exact-ID confirmation remains the only selected-sale authority.
