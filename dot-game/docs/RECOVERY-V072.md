# v072 candidate accepted — checkpoint 235

Source candidate 1c0d13d773eef6a381c0c48f7d4d68916cdfca34; candidate website b32a93ab46856da231e75cd2649a29419e62f7bc, exact Pages 40805448256 SUCCESS. Normal isolated cloud browser accepted the new quality-hunt control using a genuine formal export, without synthetic saves or RNG/state injection. Formal v071 remains unchanged pending promotion.

Existing Superior+ inventory did not trigger. First expedition yielded Average loot-31 and repeated; next expedition wave 4 acquired Superior loot-32 while battle remained active, then completed the full win and returned camp. Wins18→20, gold1454→1606; report and owned inventory agree on Superior loot-32 and Exquisite loot-33. Cancel preserved natural repeating battle; finish-current overrode hunt. Reload cleared active hunt and reset tempo1× while permanent save remained equal (eight known transient keys differ). Candidate final Lv12, gold2138, wins27, bag46. No candidate progress is imported into formal.

Evidence: docs/QA-V072-BROWSER-CANDIDATE.json, SHA256 e3f186b39b75dcab2f1aa42718e60fe06dae576608dac202fdb9caa78b3dc3cd. Qualified drop was observed in wave4 ONLY, not a proven nonfinal-wave boundary. Natural full-capacity pending, low-quality auto-sale, defeat, failed-start, Item World exclusion, ownership transfer, import-active, and stale races remain source-test-only. No controlled RNG/timing parity, mobile/full accessibility audit, public HTTP per-file hash, or Library-sync claim.

Fresh accepted-source regression: 2470/2470 tests, zero failed/skipped/cancelled, plus four runtime syntax checks. Runtime, assets and attribution are byte-identical to source233. Complete manifest/recovery accompanies this source acceptance; formal promotion236 and smoke remain pending.

## Accepted recovery
Restore the exact commit carrying CHECKPOINT 235-v072-accepted, not a mutable branch HEAD. Check every CHECKPOINT payload length/SHA256, run npm test and node --check on src/engine.js, src/loot.js, src/session.js, src/ui.js. Serve dot-game with python3 -m http.server 8000 in isolated candidate namespace. Do not copy candidate saves to formal. Source233 is the unchanged runtime baseline. Source232 and formal v071 remain rollback until formal236 smoke succeeds. Save format3 stays unchanged; transient hunt is deliberately not resumed.

Historical source-candidate recovery follows:

# v072 complete source recovery — source candidate

Restore exact commit carrying CHECKPOINT 233-v072-source in GGGODLIN/hv-v3 bot/dot, not mutable HEAD. dot-game contains all source/tests/assets/provenance/recovery and CHECKPOINT payload lengths/SHA256 (excluding manifest itself); outside paths unchanged.

1. Verify every manifest payload length and SHA256.
2. Run npm test in dot-game and node --check src/engine.js, src/loot.js, src/session.js, src/ui.js. No dependencies/build required.
3. Serve with python3 -m http.server 8000. Use isolated candidate namespace and normal cloud browser play before formal promotion. Do not import candidate progress into formal.
4. Save format3 unchanged; quality hunt is session-only and deliberately clears on reload/import/takeover. It does not restore old drop goals or retrospectively qualify existing equipment.
5. Root owns candidate CI/play, accepted source backup, formal promotion and smoke. Formal remains v071 until acceptance; previous full recovery 08f6694a221ef6ea106347823647d421d3dd051f and website 1dedaca6c1dc56f4e9e29241f5902e86835b62d6 remain rollback references.

No force push/other branches/dot-archive/unrelated paths. Source checkpoint is not browser/publication proof; no mobile/full accessibility/public HTTP all-file hash/Library synchronization claim.
