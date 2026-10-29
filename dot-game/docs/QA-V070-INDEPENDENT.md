# v070 independent source review

Result: **15/15 PASS**, 0 failed, 0 skipped. No blocking issue found. Command: `node --test tests/loot-report-audit.test.mjs`.

## Independent evidence

- Exact reverse projection via `beforeLootReport` produces the accepted v069 engine SHA256 `ad114d6656f0867fc5994a0152674d913ecc3e8ded2ee0bbcb12c7f22be9c52b`. Six controlled public-engine runs compare every complete mutable state after each kill against that engine: ordinary, auto-sale, near-full inventory, capped auto-sale with near-full inventory, IW1, and near-full IW1. Existing report fields are also identical after excluding the new observation-only loot array.
- Existing ordinary composition has five nonboss drop opportunities (1+2+2) and one guaranteed clear drop, so at most six. Existing IW1 has seven nonboss opportunities (1+2+2+2), plus a boss without an ordinary clear drop, so at most seven. Forced-success drop-roll fixtures reach exactly six and seven with distinct IDs; the bound IW target is not an extra generated reward. The implementation cap of seven covers all currently supported routes.
- The receipt keeps acquisition-time inventory/pending/autoSold disposition. FIFO claim after clearing a slot does not rewrite the pending receipt. Successful auto-sales are absent from held gear and carry actual positive proceeds; gold-cap refusal records inventory with zero sale proceeds.
- Mutating returned nested receipt entries, caller arrays, or later held-item names/levels cannot change the engine record. Getter reads do not mutate serialized game state.
- Reports retain only the latest two completed expeditions, do not mix drops into a new empty retreat, and repeated settlement cannot duplicate a partial retreat receipt. Canonical import discards forged report/loot history.
- Extracted production UI creates a collapsed native details list, uses text nodes for item names, distinguishes an absent historical field from an empty observed list, and states that handling is historical, not current ownership or another reward. There are no new item transactions in this view.
- Existing production pin/export functions carry the detached loot receipt into the report JSON, retain the report-only format, and do not mutate game state. Changing the pinned copy cannot alter the engine report.

## Boundaries

These are source simulations with deliberately controlled enemies, drop rolls, inventory capacity and sale fixtures, plus DOM/export controller models. They are **not actual browser play**, not naturally earned progression evidence, and not mobile/full accessibility validation. Exact game-state parity is established for the six tested controlled flows, not all possible future gameplay. The report remains session-only and historical; after reload there is no restored loot history. Normal browser acceptance, exact candidate CI and publication belong to the separate release sequence; formal v069 remains unchanged by this review.
