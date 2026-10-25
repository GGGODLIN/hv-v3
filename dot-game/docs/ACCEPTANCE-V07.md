# v0.7 fixed weapon commission — independent source acceptance

Recorded 2026-10-25 19:27 UTC. Scope: the independently authored `dot-game/` development candidate. This reviewer owns `tests/v07-acceptance.test.mjs`, this document, and a narrowly authorized generator-freeze update in `tests/v05-acceptance.test.mjs`. **No runtime source was edited by this reviewer.** No excluded repository implementation, constants, monster dataset or art was read or reused. No user-computer operation, remote mutation or deployment was performed.

**Source/unit acceptance passes; this is not browser acceptance or publication.** Accepted v0.6 remains separate from candidate v0.7. Parent-owned browser play, exact checkpoint backup/readback, deployment and public-runtime verification are separate gates.

## Results and commands

- Independent v0.7 suite: **17/17 passed**.
- Final aggregate at this checkpoint: **416/416 passed**, zero failures, skips, cancellations or todos.
- All `src/*.js` and `tests/*.test.mjs` pass `node --check`.
- Initial aggregate: 368/369 passed, with the sole failure being the expected obsolete whole-generator-region source hash after authorized shared-builder refactoring. The narrower historical-test update below fixes that mismatch without accepting new candidate output hashes. No runtime defect or required runtime change was found by this audit.

```sh
node --test tests/v07-acceptance.test.mjs
node --test tests/*.test.mjs
for f in src/*.js tests/*.test.mjs; do node --check "$f"; done
```

## Contract checked independently

1. **All 1,500 family × current-level offers and purchases:** axe, rapier and club at every hero level 1–500. Independent arithmetic uses the researched Slaughter endpoints, R110 interpolation and established scaling/rounding. Every output is Superior, no prefix, Slaughter suffix, ordinary supported item fields, fixed stat rolls and initially locked. Price is exactly `max(250, 4 * max(1, round(level * 3 + power)))`. Preview shows the predicted ordinary unique ID, exact item, current weapon, debit and remaining credits.
2. **Pure preview:** repeated calls on deeply frozen state work with `Math.random` and `Date.now` prohibited. State, seed, logs, events and ID counter remain byte-equivalent. Returned item, stats, rolls and current-weapon comparison are detached; caller mutation cannot modify state or future offers. Altering the returned price/item cannot change the reconstructed transaction.
3. **Atomic purchase:** only camp after at least one win, sufficient credits, no pending loot and inventory length at most 114. Exact-price and fractional-surplus balance boundaries are exercised. Successful purchase changes only the debit, ordinary ID counter, one locked inventory item and its normal event/log. It neither auto-equips nor rolls RNG nor passes through auto-sale or pending delivery.
4. **Consent validation:** only an own-data `{family, quoteBasis}` record is accepted. Missing/extra/inherited/hidden/symbol/accessor fields, unsupported families, wrong quote types, altered strings and excessive quote lengths reject. Accessor payloads are never evaluated. A null-prototype ordinary record remains supported.
5. **Staleness and replay:** family, level, balance, item counter, predicted-ID collisions and the complete displayed current weapon bind the quote. Every quoted weapon field is independently changed before confirmation. The entire transaction refuses with no debit/item/event/ID mutation. Repeated confirmation, another concurrently quoted family and replay after a successful buy/export/reload cannot buy twice.
6. **Capacity and IDs:** inventory 114→115 still leaves the existing five-slot expedition reserve and can start. 115/119/120-before-purchase and pending loot refuse; filling inventory after a preview also refuses. Counters 999999998, 999999999 and 1000000000 wrap using the established ordinary allocator rule, skipping equipment and inventory collisions. Delivered IDs remain unique and reloadable. A reload can normalize the counter upward to an existing high ID; the next preview still predicts a collision-free ID.
7. **Sale protection and no arbitrage:** a delivered item cannot be individually sold while locked or selected by common/safe cleanup. After intentional unlock, Superior still excludes it from safe/common disposal. Explicit individual resale credits only the canonical sale price and is strictly less than the purchase debit. A second sale cannot credit again. Both auto-sale OFF and ON leave the commissioned item in inventory.
8. **Actual old-validator compatibility:** every one of the 1,500 bought items is passed through the exact accepted v0.6 sanitizer/validator body, then current validation. Items, stats, family, affixes, roll values, lock, price, credits and optional auto-sale setting survive. The test embeds and hashes the real old validator; it does not merely call the new validator twice or manually strip invented fields. Its current injected state/stat and strict-descriptor helpers are separately byte-frozen against accepted v0.6.
9. **Strict v3 remains unchanged:** unsupported commission/provenance fields, future stats/rolls, malformed locks and invalid rolls still reject at equipment/inventory/pending locations in both actual old and current validators, without mutating input. No commission receipt, marker, ledger or durable field is added.
10. **Natural funding smoke:** an ordinary seeded stage-one expedition/equip loop, without forced kills or edited credits, earns enough to commission a weapon; buying preserves the combat RNG and equipped items. This is a bounded engine gameplay check, not browser play or proof every offered weapon is an upgrade.

### Deliberate scope of quote validation

The engine compares only the displayed current weapon, not unrelated armor/accessory stats or noncolliding inventory contents. Such changes may leave the engine quote valid if the actual capacity/pending guards still pass. The UI imposes a broader presentation/context invalidation boundary. This is intentional: armor does not alter the six raw weapon-stat comparison rows.

A pre-buy quote may remain numerically valid after loading the same unchanged valid state; a successful buy invalidates it through balance and counter changes. The UI does not persist an open confirmation across reload. No durable replay ledger is promised. This is a local single-player game, not a tamper-proof economic or server-authorized transaction system.

## Preserved behavior and historical-test update

The accepted v0.6 sibling was independently verified as the baseline. Remote personal GitHub identity `GGGODLIN`, repository `GGGODLIN/hv-v3` and `bot/dot` HEAD `b197b533ef57e5693b7bdcb86145404691f205e4` were independently read before work, along with pinned own README/STATUS/ROADMAP/ORIGINAL-HV.

| Accepted v0.6 baseline | SHA-256 |
| --- | --- |
| `src/engine.js` | `61d6d04f276e20b7e81542c6e091fead333cfbcf8bac249c6351a47dabaf2b0b` |
| `src/loot.js` | `5d3d97d8e8d53d87fdc006d78e053d7bd1220d0f4eb228b733f283577d10d0a5` |
| `src/session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |
| Exact old sanitizer/validator suffix | `8c3110caeccd48bb103800f615b5c50a90a02bdac0ee86b1742fd4acebc3475b` |

The only reviewer edit to an older test replaces two broad loot-module source-region hashes in `v05-acceptance.test.mjs`. The authorized commission shares the existing item-construction arithmetic, so those regions necessarily move. The replacement checks **3,000 complete ordinary generated items including every field**, RNG draw counts and final RNG states, using three fingerprints independently rerun against accepted v0.6 before changing the test. No newly generated candidate hash is blessed.

Existing combat/proc/scheduler/XP and session source freezes are retained. The existing 24 v0.4 early-game trajectories, 28 complete v0.5 OFF trajectories, quality/affix boundaries, generation fingerprints, safe-loot policy, strict import and prior-validator suites all pass. Thus commission does not silently change OFF combat trajectories, quality distributions, procs or ordinary drop RNG. The engine diff is restricted to the commission import, preview and action branch; old `addLoot` allocation, all combat and strict validator code remain unchanged.

The only other modified historical tests at this audit point are UI-owner `role-ui.test.mjs` and `weapon-ui.test.mjs` header/version assertions; they are not reviewer edits. No other older test file changed.

## Other-owner evidence included in aggregate

Catalog, transaction, value and UI owner suites are included in 416/416, but are not mislabeled as independent reviewer-authored tests. UI-owner harnesses exercise read-only ownership and revocation, hidden/loading/import boundaries, cancellation/Close/Escape/Back, context staleness, immediate action recheck, repeated confirmation and exact locked delivery. The engine intentionally has no writer-ownership field: ownership is enforced by the UI/session boundary, not claimed as an engine guard.

Value experiments compare actual offers and natural progression under declared fixtures. A deterministic commissioned weapon is an equipment option and credit sink, **not a universal improvement** over existing or future drops. The fixed catalog, guaranteed availability, R110 rolls and price are explicit single-player adaptations, not original-HV Bazaar supply, forging, training or a researched original price table.

## Remaining release gates and limits

- Actual browser play must separately verify live review/cancel/confirm, funds and lock display, natural inventory/equip flow, reload and read-only/takeover behavior. Source/DOM tests do not substitute for this.
- No physical-mobile, OS-suspend, universal background-progress or offline-earnings claim is made. Earlier browser limits remain unless separately resolved.
- The inherited v0.6 schema-negative browser gap is not retrospectively marked passed by these Node tests.
- Source checkpoint, deployment, exact public hashes and final live-root verification are parent-owned and not established here.

## Audited local runtime fingerprints

These identify the 416-test source checkpoint, not a published release. Recheck after later edits.

| File | SHA-256 |
| --- | --- |
| `src/engine.js` | `b3104eca2e1bb43d67861c27f29c36d0e2c30e66260eba97158d0dfbff44737d` |
| `src/loot.js` | `720d27170ec4cae8f84e5b166e5feb6cbff272c1dd23b53c3f5a3c1276d0ab6d` |
| `src/session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |
| `src/ui.js` | `c330775863b4560ddff36ba204da72b6af63455d80b7e95c5fe79ea8a1b73755` |
| `index.html` | `b18cf7e835727fe1d5e3760a3b6dd045739f2e36877be751bd5b38f3f5d545b9` |
| `style.css` | `3599623d54ce12fdb9324b6b1d2e9a7582351abac143f9356db54ac207ee9ae5` |

**Decision: source/unit GO for the separate browser/release gate; not a publication approval by itself.**
