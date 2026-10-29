# v072 complete source recovery — source candidate

Restore exact commit carrying CHECKPOINT 233-v072-source in GGGODLIN/hv-v3 bot/dot, not mutable HEAD. dot-game contains all source/tests/assets/provenance/recovery and CHECKPOINT payload lengths/SHA256 (excluding manifest itself); outside paths unchanged.

1. Verify every manifest payload length and SHA256.
2. Run npm test in dot-game and node --check src/engine.js, src/loot.js, src/session.js, src/ui.js. No dependencies/build required.
3. Serve with python3 -m http.server 8000. Use isolated candidate namespace and normal cloud browser play before formal promotion. Do not import candidate progress into formal.
4. Save format3 unchanged; quality hunt is session-only and deliberately clears on reload/import/takeover. It does not restore old drop goals or retrospectively qualify existing equipment.
5. Root owns candidate CI/play, accepted source backup, formal promotion and smoke. Formal remains v071 until acceptance; previous full recovery 08f6694a221ef6ea106347823647d421d3dd051f and website 1dedaca6c1dc56f4e9e29241f5902e86835b62d6 remain rollback references.

No force push/other branches/dot-archive/unrelated paths. Source checkpoint is not browser/publication proof; no mobile/full accessibility/public HTTP all-file hash/Library synchronization claim.
