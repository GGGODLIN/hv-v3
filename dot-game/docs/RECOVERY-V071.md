# v071 complete source recovery — candidate only

Restore the exact commit carrying CHECKPOINT `228-v071-source` from personal GGGODLIN/hv-v3 bot/dot, not moving HEAD. dot-game contains source, tests, assets/provenance, recovery docs and SHA256 payload manifest (manifest excludes itself). Content outside dot-game is unchanged.

1. Verify every CHECKPOINT.files byte length and SHA256.
2. Run npm test from dot-game, then node --check for src/engine.js, src/loot.js, src/session.js, src/ui.js. No dependencies/build required.
3. Serve via python3 -m http.server 8000; candidate requires independent storage namespace and normal cloud-browser play before formal promotion. Do not import candidate progress into formal.
4. Save format3 unchanged. Session reports clear on reload/import; this UI navigation does not create save history or recover sold items.
5. Root owns candidate CI/play, accepted-source backup, formal promotion and smoke. Keep accepted v070 until v071 acceptance.

Previous full recovery: c1c2953a4e7865f9e50deded9dc1f35b071e10f5 (227), formal b2f8c5b5ea65c48fd8e9bf48ce08296cf9ce367f / Pages40793957047 success. Assets/attribution unchanged. No force push, other branches, dot-archive or unrelated paths.

This checkpoint is source-only: no browser/mobile/full accessibility/publicHTTP per-file hashing/Library synchronization claim.
