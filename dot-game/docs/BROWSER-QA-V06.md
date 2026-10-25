# v0.6 bounded desktop acceptance — 2026-10-25

## Exact source and deployment evidence
- Runtime candidate source: `146744a33a639943851d774c74aeb18c681ac989`; all 53 files / 654613 bytes and 52 payload hashes read back exactly.
- Candidate site: `d5ea327b74f4184b4185915e24ed7a417f9f01d6`; exact Pages run `40221422615` passed; six runtime HTTP200 bodies match source.
- Additional synthetic-fixture source: `0ced806ba924c7eaa3ee9f703884a2d44e9e31a8`; 55 files / 659807 bytes verified. Fixture-only site `7fde7baa8a11c356b30f77b6b9ad6527ca81520e`, exact run `40223139420`, fixture2 + unchanged runtime6 HTTP hashes pass. Fixtures contain generated Lv1 data, not personal information or recoverable game checkpoints.
- Accepted v0.5 public root remained unchanged during all candidate work.

## Actual browser observations
Used only dot cloud Chrome via CUA and ordinary controls. The test character is our own natural-play profile; it was exported/imported through the actual game UI, not injected through page globals.

1. Fresh candidate was Lv1, empty inventory and auto-sale OFF. Empty manual preview had disabled confirmation. Cancel changed nothing.
2. Exported the natural v0.5 test save through its UI download. Candidate file-chooser import cancellation retained Lv1/gold0. A second confirmed import preserved Lv19, gold8764 and 99 inventory items, with auto-sale OFF.
3. Manual preview named exactly `loot-123` and `loot-127`, keeper `loot-114`, and total152 credits. Cancellation preserved the full visible inventory-label list and gold. Confirmation produced inventory99→97 and gold8764→8916; a multiset comparison found only the two quoted low-quality rapier labels removed, no unexpected additions. The locked keeper remained.
4. Explicitly locked naturally obtained alternative keepers and enabled auto-sale. Existing count97/gold8916 did not change: enabling did not sweep old inventory. Toggle persisted through reload; both toggle and cleanup mutation controls were disabled during battle.
5. A later preview quoted two exact items (`loot-144`, `loot-145`) for136 credits. While that preview was open, a second candidate tab was initially read-only with mutation controls disabled. Explicit takeover revoked old consent: the old dialog stayed visible with an explicit cancellation explanation and disabled confirmation. No item or gold changed. A fresh preview in the new owner required confirmation again and produced111→109 items and9749→9885 gold.
6. Normal stage1 repetition continued with auto-sale ON. A subsequent ordinary UI-exported runtime log recorded an actual new-drop sale: `普通・裂岩戰棍・屠戮`, +108 credits, protected by the same-base equipped club. Parsing that user-accessible exported JSON confirmed every original inventory item remained except the four exact manually confirmed IDs. This is observed runtime/export evidence, not a synthetic win/loot fixture; the transient sale banner itself was not captured.
7. The ON run still stopped naturally at118 items and wins92. It did not bypass the original near-full protection. After further normal equipment choices, preview conservatively offered only one37-credit downgrade; cancelling did not clear anything. Turning auto-sale OFF and reloading retained118 items/gold10525 and OFF state. This is bounded inventory relief, not unlimited idle or guaranteed full-bag recovery.
8. Browser zoom300% gave innerWidth393, document scrollWidth388 and dialog width358.3. Screenshot showed the review heading, count/value and item/witness text with vertical scrolling, no horizontal overflow. Restored100%. This is not physical-mobile testing.

## Import-negative coverage: do not conflate outcomes
A synthetic malformed copy placed in the executor-only temporary directory could not be read by the browser file input: the actual warning was `NotFoundError` from file.text. The generic error message, unchanged full visible item list/gold/auto setting, and unchanged state after reload prove file-read-failure preservation, **not** unsupported-schema rejection.

To try the exact schema-negative branch through an authorized same-origin path, a minimal generated Lv1 fixture and download page were backed up and staged separately. Static download APIs timed out despite native browser UI showing completed downloads; no usable consumer path was obtained. A diagnostic attempt to observe the internal downloads page was refused by the browser URL gate. That route was stopped and diagnostic tabs closed; it was not bypassed through another inspection method or the user's computer.

Therefore schema-specific browser rejection remains **unverified**. Strict unsupported item/schema rejection, before any mutation, has extensive Node and UI-harness coverage, including equipment/inventory/pending, malformed fields, cross-realm objects, and original-byte/current-state preservation. Real valid imports and real generic file-read failure preservation were observed separately. Independent QA accepted this boundary for desktop promotion, not an unconditional all-import-path claim.

## Automated evidence and limits
361 tests and four JS syntax checks pass. Parent reran final-runtime100-seed/300-policy long-run checks: additional-win medians OFF59 / equipped64 / locked74; every run stopped safely; generated drop/RNG common prefixes and original items were preserved. The optional long run took23.06s wall time, not game time. See LOOT-MANAGEMENT.md for exact policies, counts, credit totals and limits.

Getter/adversarial schema, stale batch variants and repeated confirm races are automated evidence; browser directly covered cancellation, exact batches and ownership loss. Physical mobile, OS suspension and inherited visibility behavior remain unverified. No offline rewards. The stricter import policy cannot recover metadata an older version already discarded. Old validators drop the opt-in safely to OFF; users should refresh before using current mechanics.

## Release state
Independent QA gives bounded desktop promotion GO. Accepted-source backup, root promotion, old-v0.5/shared-v3 takeover and root default-OFF smoke remain pending at this checkpoint. The 19:00 UTC automation joins this still-active acceptance/release work rather than creating parallel changes.
