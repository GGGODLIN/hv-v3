# v073 complete source recovery — source candidate

Restore exact commit carrying CHECKPOINT 238-v073-source in GGGODLIN/hv-v3 bot/dot. dot-game includes source/tests/assets/provenance/recovery, with CHECKPOINT lengths and SHA256 for all payload files except itself.

1. Verify every manifest file length and SHA256 against the exact commit, not mutable HEAD.
2. Run npm test in dot-game and node --check for src/engine.js, src/loot.js, src/session.js, src/ui.js. No dependency installation or build required.
3. Serve via python3 -m http.server 8000; isolate candidate namespace. Root handles normal browser acceptance, exact CI and formal promotion. Never import candidate progress into formal.
4. Existing save format3 unchanged. Hunt goal and selected target are transient; reload/accepted import/control replacement clear them. No old equipment is retroactively a new drop.
5. Prior accepted full recovery b4f137ca108aa41161f8fd961e3fa6d867499f04 and formal c38bd2de429c5dc3e52edbad2cb7ea92365cacf3 remain fallback until actual acceptance.

No force push, other branches, dot-archive or unrelated paths. Source tests are not browser acceptance. No mobile/full-accessibility/HTTP all-file hash/Library sync claim.
