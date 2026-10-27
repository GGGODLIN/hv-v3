# v0.33 independent readability audit

## Scope and result

**17/17 independent source/DOM checks pass.** Running those same checks with the exact v0.32 UI, HTML and CSS produces **1 pass / 16 expected failures**. The already-safe long-name/text-node case passes in both versions; no wrapping defect or viewport-fit improvement is invented.

This is a source-only audit. There was no browser, headless browser, native accessibility-tree/screen-reader, physical-keyboard, zoom, mobile or screenshot acceptance. No website/candidate ref, CI, deployment, alternate host, preview or browser save was changed. The existing publication rejection remains known unexecuted and was not retried. Source backup completion is established separately by the exact commit/checkpoint readback, not by this pre-commit note.

Baseline: exact v0.32 `0cfde1801d288a94ff485cdc1e9a17442456bf89`.

The final independent aggregate rerun passes **1,827/1,827 tests** and all four runtime syntax checks. An initial aggregate run found only nine stale v0.32 header-version expectations; these were updated to v0.33 without changing their behavioral assertions. The complete final run, not that earlier partial pass, is the acceptance count. All 186 recorded inputs remained byte-identical across the final run.

## Reproduced defects and bounded fixes

1. **Edge focus is drawn outside the reserved scroll area.** The inventory list has `overflow-y:auto` and 4px padding; the original global 3px outline plus 3px offset extends 6px outward, leaving 2px unreserved at an edge. Pending loot has no list padding and a 2px outline plus 2px offset, leaving 4px outside its edge. This is a concrete CSS source-box mismatch and clipping risk, not a screenshot measurement. The new card-specific 3px outline with `outline-offset:-3px` has zero outward extent. An independent small cascade resolver checks the actual applicable simple selectors at widths 320, 680, 768 and 1174, selected/unselected and ordinary/forced-color modes. The forced-color focus declaration retains `ButtonText`; this does not predict the user's system palette.
2. **Explicit accessible names omit visible metadata.** A valid bound IW1 backpack card shows IW1 but its previous `aria-label` omits it. A preset-protected backpack item shows “配裝” but its name exposes only generic locked state. A valid renamed pending item can lose its weapon-family identity from the explicit name. The fixed names include actual family, quality, level and applicable investment/protection metadata; pending FIFO position, exact ID and inspection-only boundary remain. Equipped cards continue to derive their names from their visible content. These are DOM name-input checks, not claims of tested spoken output.
3. **Comparison state lacks a persistent textual marker.** The selected card now says “比較中” in all three locations, alongside its existing pressed state and styling. Repeated selections and location changes leave exactly one marked card. The marker is not a sale checkbox and does not select, equip or sell anything.

## Safety and regression coverage

The independent tests exercise repeated exact-ID focus restoration; switching among backpack, equipped and pending cards; bound/IW1 and preset-protected sale refusal; read-only inspection; a long CJK/markup-looking name remaining a plain text node; fixed local icon identity; and complete game-state/RNG/action/storage-write neutrality for inspection. Controlled fixtures are explicitly synthetic, not represented as naturally earned investments or overflow.

Byte comparisons against exact v0.32 preserve:

- `src/engine.js`, `src/loot.js`, `src/session.js`;
- 40 historical fixture files and two browser fixture files;
- all 14 asset, original-source, license and provenance files;
- the complete canvas/scene code tail.

`AUDIT-V033-INPUTS.json` records 186 executable, test, replay and asset inputs. Prose, measurement receipts and the checkpoint are deliberately excluded from that input manifest. Historical manifests remain unchanged.

## Independent natural-source replay

The auditor separately reran `scripts/grid-readability-measurement.mjs`. Its receipt is byte-identical to `docs/measurements/grid-readability.json`: SHA256 `cbee39e9981d37332c3aee8d085bc697c28fc6af20e0ca132baf79c6eed45231`.

The fixed acquisition sample completes 20 attempts / 20 wins in 237 one-second source pulses. Reusing its unchanged earned save gives 18 repeated exact-ID inspections across three backpack and three equipped items. All nine paired checkpoints match exact v0.32 in complete state, RNG, actions and storage writes, including hidden-selection sale preview/cancel and read-only comparison. This known sample is not a balance claim. The ordinary harness uses unsupported-Web-Locks mode and does not exercise real browser persistence, locks, layout or assistive technology. Synthetic investment/pending cases are separate tests.

## Readability limits and retained findings

Static source-color arithmetic gives 8.68:1 for the comparison badge against the selected tile, 9.09:1 against hover, and 11.88:1 for the focus color against the default tile. All eight built-in quality colors against the detail background remain at least 5.85:1. These calculations are not browser computed styles or a complete contrast certification; disabled opacity and every legacy component are not certified here.

The pre-existing arbitrary imported `rarityColor` can match a background and is deliberately outside this bounded fix. Long names already wrap in source; actual narrow two-column layout, enlarged text, scroll behavior and real visible focus remain browser-acceptance work. Existing scene art was not replaced and unchanged assets were not relabeled.

## Local evidence

- `evidence/audit-v033-baseline.tap` and `audit-v033-focused.tap`
- `evidence/audit-v033-readability-source.json`
- `evidence/audit-v033-unchanged.json`
- `evidence/audit-v033-replay.json` and `audit-v033-replay.log`
- `evidence/audit-v033-final-full.tap` and `audit-v033-syntax.txt`
