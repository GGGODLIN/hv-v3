# v070 formal verified and fully restorable — checkpoint 227

Formal website `b2f8c5b5ea65c48fd8e9bf48ce08296cf9ce367f`, exact Pages `40793957047` SUCCESS. Publisher verified 21 runtime files byte-exact and 4295 outside files retained. Original formal profile was played via cloud normal UI, with no candidate save import: a natural 2× single expedition produced 3 new items (loot-26/27/28), 17 wins, 1378 gold, Lv10 and 27 bag items. Every receipt ID/name/slot/quality/level matched actual inventory and normal report JSON. Reload cleared report history while preserving permanent progress. Desktop 1180 px: no overflow or broken images.

Formal evidence: `docs/QA-V070-FORMAL-BROWSER-RECEIPT.json`, SHA256 `ae7e08669cd7326fac8f18c74b391879f62db218505b5df44954b10711c12608`. Candidate separately tested pin, manual-sale historical immutability, filter and empty retreat; these were not repeated on formal. Automatic sale, pending and Item World remain source-only; mobile/full accessibility/public HTTP all-file hashing/Library sync were not verified.

Restore the exact commit carrying `227-v070-restorable`, verifying every CHECKPOINT payload byte length/SHA256. Runtime/tests/assets remain identical to accepted source `e9846684f639ffb8bed1738c1d38252cdd9c24f1`; 2427 tests plus 4 syntax checks were freshly passed at checkpoint 225, NOT rerun at 227 (docs/evidence-only). Use recovery instructions below; candidate and formal progress stay separate. Previous accepted v069 recovery `abe095ff5c59f112cbed55b07dedd3fa910c6d7a` remains available for rollback.

Earlier source-stage record (historical):

# v070 candidate accepted — checkpoint 225

Candidate `631e972ac5f5e20a523a5b2e99f2aa24d3edee34`, exact Pages run `40793004431` success, was played through cloud normal UI using genuine progress. Source runtime `cf41a9e0b47d2138951cb10031bed45612071302` is unchanged. This checkpoint backs up acceptance evidence; formal remains v069 `e5bc70e4a4d2623cdd3536db9ab91b0e1de0cb84` until separate promotion/smoke.

Verified: normal victory acquired loot-26/27/28, all receipt identity/name/slot/quality/level fields matched actual inventory; pin/export JSON; manual sale of loot-28 for 35 gold left the entire historical report unchanged; backpack filtering did not hide historical armor; empty retreat produced zero receipts while prior/pinned report retained three; reload cleared transient reports and retained permanent progress. Desktop 1180 px viewport: no horizontal overflow, zero broken images.

Automatic-sale proceeds, pending pickup/full bag, Item World, defeat with earlier loot and controlled RNG parity remain source-test-only. Mobile, full accessibility, public HTTP per-file hashing and Library synchronization were not verified. Manual sale is not automatic-sale coverage. Evidence: `docs/QA-V070-BROWSER-RECEIPT.json`, SHA256 `e3d833107914fa8a09ad95c0db62ec99cebe5e2aeeee8bb65f4b872fd7de5207`.

Earlier source-stage record (historical):

# v070 complete source recovery — candidate only

Restore the exact commit carrying CHECKPOINT `223-v070-source` from personal GGGODLIN/hv-v3 bot/dot, not moving HEAD. dot-game includes complete source, tests, assets/provenance, recovery docs and SHA256 payload manifest; manifest excludes itself. All repository content outside dot-game is unchanged.

1. Verify all CHECKPOINT.files paths, byte lengths and SHA256 values before running.
2. Run `npm test` in dot-game; no dependencies or build needed. Run `node --check` on src/engine.js, src/loot.js, src/session.js and src/ui.js.
3. Serve through `python3 -m http.server 8000`; use a separate candidate namespace and genuine exported progress for browser acceptance. Do not copy candidate progress back to formal.
4. Save format remains3. Completed expedition reports and their acquisition-time drop receipts are session-only, not save history. Dropped items themselves keep existing save rules. Reload/import clears receipts, not earned equipment.
5. Source tests do not replace actual browser play. Root owns candidate CI, play, accepted-source backup, formal promotion and smoke. Keep v069 formal until v070 acceptance.

Last complete accepted restore: `abe095ff5c59f112cbed55b07dedd3fa910c6d7a` (222); website `e5bc70e4a4d2623cdd3536db9ab91b0e1de0cb84`, exact Pages40786260803 success/desktop PASS. No force push, other branches, outside paths or dot-archive.

Assets and licenses unchanged. The receipt is local UI adaptation, not a new original-HV formula. No actual browser/mobile/full-accessibility/publicHTTP per-file hash or Library synchronization is claimed at this source checkpoint.
