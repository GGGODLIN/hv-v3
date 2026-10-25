# Frozen own-v0.8 scheduler baseline

These two files are exact, unmodified copies of this independent game's v0.8
source from verified receipt `024`, commit
`1c0bbd3363c775e030124fb92fe295d4d6561184`.

- `engine.js`: SHA-256 `a9e3b4b8d8ec5ac6ecc8dcdbc72e3586e24e9ca7cce32b6ebb4de3e7346fe8b1`
- `loot.js`: SHA-256 `458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc`

No import-path adjustment was necessary: `engine.js` still imports `./loot.js`.
The copies were taken from the verified local v0.8 package, not reconstructed
from the corrected runtime. They are test-only provenance fixtures and are not
loaded by the game. Keeping old observations executable does not assert that
v0.8.1 has the old scheduler's delayed boundaries, complete trajectories, RNG
interleaving, or outcomes. Current-runtime boundary and unchanged-code guards
live in `tests/v081-acceptance.test.mjs`.
