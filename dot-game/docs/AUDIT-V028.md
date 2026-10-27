# v0.28 independent source audit

This candidate adds pending-loot inspection and an explicit camp-only claim into existing free backpack slots, based on exact v0.27 `6cb7230093f0ddc99bdddd0c1d96efabf4aa8d4b`. It does not add storage, reroll/drop changes, automatic disposal, or a new investment tier. Accepted live v0.25 and the existing publication-tool refusal remain unchanged. Browser acceptance and publication are not run.

## Defect boundary and independent review

A format3 save containing a valid pending item and an empty backpack is already accepted. Loading returns to town and preserves that queue. The old UI disables retreat in town and offers no claim; inventory-only equip/sell/lock cannot reach the pending item, so the accepted save has no visible recovery route despite available space. The new camp control moves existing items FIFO, only up to current free space. The existing count-based stop remains.

This is an **accepted-import recovery defect**, not a claim that ordinary play naturally creates empty-backpack pending saves. Naturally full backpacks have a separate genuine visibility problem: players could see only a pending count/name event, not inspect the queued item's exact tradeoffs before choosing what to sell. The natural measurement documents that flow separately.

The 116-permanent-weapon cap is not newly diagnosed as broken. With one bound weapon worn, 115 permanent backpack weapons leave the unchanged five slots. If an ordinary weapon is worn instead, equipping a bound one and explicitly disposing of the ordinary spare restores that arrangement. Preset references must first be cleared/overwritten and ordinary locks manually removed as applicable. No permanent item needs to be discarded.

Existing encounter topology also remains safe: a normal expedition has five non-boss drop opportunities plus one guaranteed completion item, so entry with115 backpack items can produce at most one pending item. The five-round Item World has seven non-boss opportunities and no guaranteed final equipment, so at most two pending items. These are theoretical structural maxima, not measured drop frequencies, and both remain below the existing save limit8.

## Independent behavior coverage

`tests/pending-loot-audit.test.mjs` contains14 passing audit cases, all capacity/import examples clearly synthetic rather than earned:

- An already-valid empty-backpack save with an invested IW1 weapon can claim it, retain exact identity/anchors, and depart.
- Frozen pure status, FIFO partial delivery at119/120, object identity, total ownership conservation, repeated/no-space no-ops, and refusal of any submitted item/count payload.
- Battle/intermission/defeat refusal; town transfer changes no health, MP, gold, fragments, seeds, RNG, counters, clocks, logs, events, or other state. Read-only destination properties refuse atomically; immutable investment anchors stay immutable.
- Existing import validation still rejects nine pending items, duplicate IDs, unknown item/stat fields and invalid item content. No new item sanitizer weakens that boundary.
- Pending equipment cannot be sold, equipped, locked, bound or entered into a trial directly. Permanent disposal protection survives claim.
- A valid synthetic116-bound collection with8pending moves from107 to115backpack items, preserving all owned bytes/preset references and retaining the five-slot departure reserve.
- Whole-context Soulbind, Item World and gear-set consent becomes stale after ownership location changes.
- Selected-sale engine consent deliberately stays scoped to selected IDs, comparison equipment and exact prices/balance. Claiming an unrelated item does not silently include it in a sale; the newly claimed item survives. The new claim handler explicitly aborts an existing visible selected-sale confirmation only after an actual transfer (`moved > 0`), retaining the chosen IDs for fresh review. This is conservative UI invalidation, not a pre-existing whole-inventory selected-sale signature or a new engine sale rule.
- No new saved keys/version changes; exact pinned v0.26 format3 reader retains the claimed supported IW1 investment. This does not erase older Exquisite-IW restrictions or v0.27's known emergency-preference fallback.
- Real normal encounter previews and synthetic five-round IW stepping confirm the structural overflow bounds above.

## Verification status

- `node --test tests/*.test.mjs`: **1,672 tests / 1,672 pass**, zero failures, skips or cancellations. Final frozen run completed in31.614 seconds. The41 additions comprise13 engine,14 controller/DOM and14 independent audit cases.
- `node --check src/engine.js`, `src/loot.js`, `src/session.js`, `src/ui.js`: all four pass.
- **155 input files unchanged before/after** the final run: `src/`, `tests/`, `scripts/`, `index.html`, `style.css`. [AUDIT-V028-INPUTS.json](AUDIT-V028-INPUTS.json) SHA256: `1847814404fd24ed6b1f615d4f3f8b1d056fa84d93759193e61fb2f05e9aff5e`. Sorted `path + NUL + SHA256 + newline` aggregate: `3f3d2b9f691eac81949e653bb853746f8ba6cf200e78004177126e648c9af3ae`. Prose/checkpoint receipts are outside this executable-input freeze.
- **All40 pre-existing fixture files are byte-identical to exactv0.27.** Their sorted fixture-relative aggregate is `ae64e9c36d890185d9972dbc561a65040a3789546dea1870c32273c087d0dbe2`. No golden bytes or expected historical hashes were rewritten. Existing test edits only update current candidate branding and use current HTML when testing the current controller alongside the preserved old-reader HTML/controller.
- Independent UI source review verified pending details offer comparison only, remain outside backpack filters, preserve inspected identity through claim/automatic refill, check actual transfer before success feedback, and abort visible selected-sale consent after actual claim. The UI author's411-test regression run also passed; the aggregate run above includes those current tests.

Final runtime inputs:

| File | SHA256 |
| --- | --- |
| `src/engine.js` | `020c1717d24c20bd914241b3f30adbc091c5a2a851cec8917dca7fc403f21a6d` |
| `src/loot.js` | `2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7` |
| `src/session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |
| `src/ui.js` | `bc199ded4d5a59bab14a3f422c6e711031b67ad9044c52db865126b612e4e1bb` |
| `index.html` | `7f946a0d27dac6baf1fa428b269efd8debcb347804c54fcae6d5b6c5e2a7b933` |
| `style.css` | `e0294a5df2ba3494f800e41cd233e5bb592e4661690efb4b8bc727f04ea775a0` |

The full final TAP is retained locally as `hv-v3-dot-v028/evidence/audit-full-final.tap`, SHA256 `c5daf97863ef13cb555829fc08251f90be46c34857d52adf1cfacaaed08cca69`. Before/after manifests and fixture receipts are also in that evidence directory; the concise audit and exact input manifest are source-backed. Initial partial-source runs are not final acceptance evidence. One initial independent topology test incorrectly revived already-dead synthetic enemies; the test was corrected to touch only live enemies, without changing engine behavior or historical fixtures, before the frozen passing suite.

## Independent natural reproduction

The audit independently reran:

```sh
node scripts/pending-loot-measurement.mjs --baseline /path/to/exact-v027/dot-game/src/engine.js --output /separate/evidence/audit-pending-natural.json
```

Its output is byte-identical to the source-backed compact measurement: **16,072 bytes**, SHA256 `1cf1c66d9d467092a8f9ea3b80104b49ba4037df3027ff6aadc65c0f31b2f36c`. It reproduces1,430 normal wins /12,267 one-second pulses, no losses or single-fight censor, and17,178 comparisons of full state and all reports against exactv0.27. Only the specific old queued-guaranteed-reward wording is normalized; no other state/RNG/item/resource field is excluded.

Seed42 reaches its first pending item `loot-556` at win315 in both unbound and naturally bound-spare branches. Seeds29/77 have no overflow within their predeclared400-attempt bounds; those neutral outcomes remain. The naturally full state recovers by explicit exact-ID sale using the existing automatic FIFO refill and returns to115 backpack items before another successful start, preserving the invested weapon/anchor. Three separately constructed distributions move an already-earned bound weapon from backpack into pending, validate that supported state, then claim the same object; all non-storage state and owned bytes remain unchanged. Those constructed states are not represented as naturally reached deadlocks. See [PENDING-LOOT-MEASUREMENTS.md](PENDING-LOOT-MEASUREMENTS.md) for protocol, exact results and limits.


## Release boundary

Source/controller simulated DOM tests are not actual browser rendering, mobile/device, background-throttling or comprehensive cross-tab acceptance. No website update, candidate staging, CI trigger, HTTP preview, alternate host, user-computer or local Codex action is part of this audit. Exact source backup/readback is reported separately; a backed-up candidate is not a published or browser-accepted release.
