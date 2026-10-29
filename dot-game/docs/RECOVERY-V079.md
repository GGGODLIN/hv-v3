# v079 recovery and origin migration — checkpoint247

## 2026-10-29 13:00 UTC · checkpoint247 documentation update (v079 unchanged)

This current status supersedes earlier historical “not published / all browser pending” entries below. No runtime, tests, assets, index or version changed; no suite was rerun for this documentation checkpoint. v079 source remains a candidate, not accepted.

- User approved publication (“發布阿”) at 09:51:55 UTC. v073 isolated candidate website commit `58651a9060a63c8e5a56066bdae1e836a92ce4b5`, Pages run `40853181431` succeeded. Cloud UI gameplay receipt records PASS at 10:16 UTC, with its stated limited coverage; this is not promotion of the formal v072 route. Exact receipt: `docs/evidence/qa-v073-browser-receipt.json`, SHA256 `4588c5ab5065e8d642af82c738c5fcf8e7008656d99e4d6f21e19223291f4501`.
- v079 source `d6dae543083e4179c7abd25d9400a0eface9588e` was published ONLY as an isolated candidate in website commit `7a4c44b1ae141602eb22b51f702da30198324bde`; Pages run `40853632238` succeeded. Publication evidence verifies 21 runtime Git blobs and preserves 4379 outside blobs/modes; this is not public HTTP per-file hashing. See `docs/evidence/v079-candidate-publication.json`.
- v079 actual gameplay remains pending: its second import tool confirmation is awaiting approval. This is a specific tool confirmation, NOT missing general publication authorization. Do not retry/bypass it or label v079 accepted. Formal route remains v072. Previous source tests 2595 PASS + 4 syntax belong to checkpoint245, not a new run here.
- Candidate links: https://blog.gggodlin.com/play/hv-v3-dot/candidates/v0.73/ and https://blog.gggodlin.com/play/hv-v3-dot/candidates/v0.79/ . External canonical configuration redirects github.io to blog.gggodlin.com; this checkpoint does not alter that configuration.

### Cross-origin save precaution

Browser saves do not automatically migrate to a new origin. Keep the old-origin tab open and **do not reload it first**; export a normal game save there, then import it through the new-origin game's normal UI and confirmation. Import replaces rather than merges current progress. The report JSON export is NOT a save and cannot restore progress. QA preserved old formal tab2 and exported its genuine save, SHA256 `cc27352a62de693023a25fbf6d57f27a7b786f5ba78db51e0b5ed74206975751`; this proves that QA profile's export only, not every player's recovery. Without an old tab or an exported game save, the game has no cross-origin recovery interface. Do not claim progress definitely deleted or definitely recoverable. Preserve existing tabs/exports before further action.

Restore the exact bot/dot commit carrying CHECKPOINT 247-v079-docs. Verify every CHECKPOINT payload byte length and SHA256; CHECKPOINT excludes itself. Complete source/assets/tests/attribution remain included and unchanged from checkpoint245 except documented evidence/status/recovery. The manifest records checkpoint245 tests as inherited evidence, not a new test run. No build dependencies are required; normal validation remains npm test and node --check of engine, loot, session and ui. Restore source separately from website deployment.

Last formal accepted source recovery: b4f137ca108aa41161f8fd961e3fa6d867499f04; formal runtime originally published by c38bd2de429c5dc3e52edbad2cb7ea92365cacf3. Isolated candidate deployments did not change formal runtime. v073 receipt's limited PASS does not establish v079 acceptance. No force/main/other-branch or website operations in this documentation checkpoint.
