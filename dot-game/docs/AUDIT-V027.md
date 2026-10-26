# v0.27 independent source audit receipt

Source-only emergency supply, based on exact v0.26 checkpoint `3460fb0e4a634f35f00f6262970521a969f51492`. This audit does not publish or browser-accept the candidate. Accepted live v0.25 and the existing staging-tool refusal remain unchanged.

## Final checks

- `node --test tests/*.test.mjs`: **1,631 tests; 1,631 pass; zero failures, skips or cancellations**. The final input-frozen rerun completed in29.826 seconds; an earlier full run after legitimate branding/fixture-scope fixes also passed all1,631.
- `node --check src/engine.js`, `src/loot.js`, `src/session.js`, `src/ui.js`: all four pass.
- **151 inputs unchanged before/after** the final suite: `src/`, `tests/`, `scripts/`, `index.html`, `style.css`. Per-file SHA256 values are retained in [AUDIT-V027-INPUTS.json](AUDIT-V027-INPUTS.json). Its exact file SHA256 is `c94c969da8aed75f9b2b85d47da72205cd127c328b32e8b9697eaf622618189c`; sorted `path + NUL + SHA256 + newline` aggregate is `d070cd9103a290cdd0409adfa0bb4b0870c9fc99a81bbd8f8f136a66c5aedca1`. Documentation/checkpoint receipts are not in that runtime/test-input freeze.
- All**37 pre-existing fixture files** match immutable checkpoint124 byte-for-byte. Sorted fixture-relative path/NUL/SHA256/newline aggregate: `7945b232956057ae13b32c0da2ae40e80e336f4f5d59d3f1f7c410d82d2b70f4`.
- Historical prior31 identity assertion keeps its original31 and aggregate `285b3af0981f7cb06c7e5a2bed8d6cf32f37847660e08b65e5ebc0ba62761b09`. It now excludes the newly addedv0.26 directory, just as it already excludedv0.25; no historical file or golden hash changed.
- Three new portable baseline files contain exactv0.26 engine/loot and provenance. The independent audit pins the two executable hashes and compares full ordinary state/RNG/reports against them.

Final runtime SHA256:

| File | SHA256 |
|---|---|
| `src/engine.js` | `76750a0da6b2ecf4a0e61ce0a99bc1c166f76a53ea744098f8f03fe5074b0ffd` |
| `src/loot.js` | `2ee338bfd17388746784cda8788afdc18e45afcbf0a1a32808a34b4bf3783ce7` |
| `src/session.js` | `821ae6b192933435b0139e7557eaa08e0712a174a3961a66bf963fc03e524a6a` |
| `src/ui.js` | `f66be60ee9d0194db918e7d5afa6fcc04caa5a9e013c5fc96288ff5dd289bd09` |
| `index.html` | `bf9d919a74f060edc93bad6de0746fe4c9cfe939a3cf8f6ed156b3c42e46d8c3` |
| `style.css` | `248263ac4a0f503a5aaf0bf2e7f9af3e0e0fc0637a92afd196708387d131dbba` |

## Independent behavior evidence

Nine audit cases cover pinned baseline integrity;72 ordinary runs /6,568 pulses across all3 strategies with full-state/RNG/report default-OFF identity; honest old-reader loss of the new preference; strict malformed/accessor/hidden/inherited preference refusal; post-heal and exact30% timing; one-per-decision/resource reserve/manual final use; malformed-stock guards; unchanged Sustain last-bottle behavior; immutable start-report context and real aggregate consumption; and atomic stale Item World consent refusal. Multiple related assertions share some named cases.

The independently rerun deepest-route measurement exactly reproduces the engine author's original observations. The audit's separate fixed-route cohort retains the neutral result. **No modified weaker-loadout cohort was executed to force a benefit.** Full data and both protocols are described in [EMERGENCY-SUPPLY-MEASUREMENTS.md](EMERGENCY-SUPPLY-MEASUREMENTS.md).

- Deepest-route protocol:120 acquisition wins;120 OFF/ON pairs /240 branch wins. Assault uses16 potions in9/40 pairs, preserving at least one bottle. All paired clear times remain equal. Eight used pairs improve minimum HP, but seed101 falls16.214%→15.214%; this adverse observation is retained. Balanced/Sustain use none in this natural cohort.
- Fixed-route protocol:120 acquisition wins,11,296 exactv0.26 parity pulses;90 pairs /180 branch wins, no potion use and equal times throughout. Same ten seed IDs as the deeper protocol, not statistically independent populations.
- Source tests include synthetic boundary inputs; they are not represented as naturally earned or browser-played scenarios. No loss or censor occurred in either natural cohort; no claim of win-rate improvement follows.

## Complete measurement preservation

Both original observations are losslessly retained in**41 small source-backed files**. Every shard and each reconstructed complete JSON is byte/hash checked; reconstruction was compared structurally with the pre-split original observations. Only source-fingerprint metadata reflects the new lossless output writer. Separate temporary UTF8/multi-shard/empty-array roundtrip and deliberate corruption checks passed; corrupt bytes were refused.

| Cohort | Index SHA256 | Reconstructed complete JSON SHA256 |
|---|---|---|
| Deepest route | `cc7863dac78e295f693f64016068c9acc5da3e9cdab97d17f2e0179de08fc8c9` | `fe1dc6f1561dd89898c32fba69b6f311537368ac8c8906049121a8113e51be19` |
| Fixed routes | `351a26b4e1a00c8d680a77226f6628a464d977e1f0659ead838bb01505ac9190` | `52475721fc6645adde7130d9f01297bd729494d08af9ee6e0e37bf8f47baa1b4` |

Full final TAP remains in local `hv-v3-dot-v027/evidence/audit-full-frozen.tap`, SHA256 `63de4a986e11ef23fb9c51d7186834131b4ce46aef6d1e742b1db502e4b4c5c4`. Full before/after manifests, source-reproduction receipts and original monolithic measurements also remain there. This concise receipt, exact input manifest, complete shards, tests and reproducible scripts are in the source backup; recovery does not depend on those temporary local files.

## Limits and release boundary

Source-controller/DOM tests are not actual browser rendering, keyboard/device, background-throttling or comprehensive cross-tab acceptance. Oldv0.26 drops the unknown emergency preference rather than preserving or rejecting it; existing invested-item and older-format guards remain distinct. No staging, website update, CI trigger, HTTP preview, alternate hosting, local browser or user computer was used. Candidate browser acceptance and publication are**not run**, not passed. Source backup/readback is owned by the parent; its exact committed identity belongs in the checkpoint/recovery receipt rather than being guessed here.
