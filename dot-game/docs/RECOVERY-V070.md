# v070 complete source recovery — candidate only

Restore the exact commit carrying CHECKPOINT `223-v070-source` from personal GGGODLIN/hv-v3 bot/dot, not moving HEAD. dot-game includes complete source, tests, assets/provenance, recovery docs and SHA256 payload manifest; manifest excludes itself. All repository content outside dot-game is unchanged.

1. Verify all CHECKPOINT.files paths, byte lengths and SHA256 values before running.
2. Run `npm test` in dot-game; no dependencies or build needed. Run `node --check` on src/engine.js, src/loot.js, src/session.js and src/ui.js.
3. Serve through `python3 -m http.server 8000`; use a separate candidate namespace and genuine exported progress for browser acceptance. Do not copy candidate progress back to formal.
4. Save format remains3. Completed expedition reports and their acquisition-time drop receipts are session-only, not save history. Dropped items themselves keep existing save rules. Reload/import clears receipts, not earned equipment.
5. Source tests do not replace actual browser play. Root owns candidate CI, play, accepted-source backup, formal promotion and smoke. Keep v069 formal until v070 acceptance.

Last complete accepted restore: `abe095ff5c59f112cbed55b07dedd3fa910c6d7a` (222); website `e5bc70e4a4d2623cdd3536db9ab91b0e1de0cb84`, exact Pages40786260803 success/desktop PASS. No force push, other branches, outside paths or dot-archive.

Assets and licenses unchanged. The receipt is local UI adaptation, not a new original-HV formula. No actual browser/mobile/full-accessibility/publicHTTP per-file hash or Library synchronization is claimed at this source checkpoint.
