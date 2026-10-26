# v025 inventory workbench natural/source measurement

This pass inspects the shipped pure UI predicate against independently calculated AND matches. It does not change gameplay formulas and is not a browser-play or economy-balancing claim. Source-owned files: `scripts/inventory-workbench-natural.mjs`, `tests/inventory-workbench-natural.test.mjs`; five tests pass.

## Existing ordinary browser export, read only

Unchanged ordinaryv0.24 browser export; SHA256 `631c9c2a02c2ed360ec320b3edd6943d31d88f23c14e85392d67dd8a48387ee6`. The original input is not bundled with source or altered. Canonical validation uses the existing engine, then every view is proven non-mutating against that complete canonical state.

Lv16,45 wins,84 backpack /87 total held. Backpack contains28 weapons,27 armor,29 accessories. Weapon choices narrow to10 axes,12 clubs,5 rapiers,1 unrecognized starter sword. Investment categories are mutually exclusive:83 unbound,0 bound-but-not-IW1,1 IW1 (`loot-1`). Equipped IW1 `loot-12` never appears in backpack results. Genuine old rapiers `loot-1` and `loot-9` retain their absent parry fields.

All80 supported slot × family × investment combinations match independently calculated IDs, retain original item references and avoid duplicates. Canonical save, every state byte, RNG and exact selected-sale quote remain unchanged. Investment categories partition the entire backpack with no overlap. Contradictory combinations (e.g. armor × rapier) stay empty rather than relaxing filters.

## Portable fresh source-earned cohort

Fixed seeds29,42,77. Policy: public normal stage1 expeditions with explicit finish-after-clear; equip the currently held highest-score item per slot and learn/slot the existing three rank1 abilities if affordable; stop at20 normal wins (40-attempt bound retains losses). Then explicitly bind two actually held eligible backpack weapons for100 fragments each and spend one earned seed for first target's IW1. No stat/item/currency/seed injection, RNG replacement, forced outcome, auto-sale, or extra reroll. Item score is merely a disclosed acquisition policy and not a recommendation or full proc valuation.

Observed60 normal wins,0 normal losses;3 first-tier IW wins. Final bags38/33/33. Each naturally contains1 bound-not-IW weapon and1 IW1 weapon, with36/31/31 unbound items. Seed77 has no axe; this honest empty category remains in results. All80 view checks and non-mutation assertions pass per seed. One additional frozen-state and one sale-quote check do not count as extra independent players.

## What selection coverage means

A local, explicit two-ID sale selection (one salable weapon plus one other slot) is retained while view filters hide one or both. The existing engine quote and exact IDs stay unchanged; no sale is executed. This proves helper/quote isolation only, **not** that actual hidden-selection count/focus/dialog disclosure works in the DOM. Separate UI and real-browser acceptance owns those claims.

## Portable reproduction

From a restored `dot-game/` directory:

```sh
node scripts/inventory-workbench-natural.mjs --label fresh-check
node --test tests/inventory-workbench-natural.test.mjs
```

The first command creates `measurements/inventory-workbench-fresh-check.json`. Choose a fresh label; existing evidence is never overwritten. `--output /path/to/evidence` changes the destination. Optional `--profile /path/to/ordinary-export.json` substitutes an unchanged ordinary export and records its SHA256; no private save is required for the fresh cohort. The script compiles only `inventoryMatchesFilters` from the current UI source, not the application/DOM.

Initial evidence has live-development UI hashes and is not a final publication identity; use the definitive freeze section below.

## Definitive frozen runtime

All final measurement rows exactly match initial outcomes; reruns are not extra independent players. Five focused tests passed. All six runtime-file hashes were identical immediately before/after the final rerun. Initial live-development hashes are superseded by these final identities.

- Script SHA256 `a8901ceeeb0684553fa60abeaaa97ab20b6f4ec77ed828c88a3eb13743e1725c`.
- UI SHA256 `9303c16d361ece0c2bec431ee1d16b2b5619326db1e30ff4099e6a08aed3436a`.
- Read-only84-item evidence SHA256 `8e4829fd6cb34ec39f35e419b0b2fe5e3ebde8610480c1a85e8b6f8efdcc864b`.
- Fresh cohort evidence SHA256 `415a582d1a0894c4d4b94562529f126018ce4078a6f613e460d9f6a5f0bb3131`.

Raw execution evidence remains in the release workspace; private browser exports are deliberately not bundled. The source includes this protocol, independently reproducible fresh-cohort script and tests.
