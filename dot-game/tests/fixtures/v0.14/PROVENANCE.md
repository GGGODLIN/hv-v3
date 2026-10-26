# Own accepted v0.14 control fixture

These two files are byte-for-byte copies of dot's independent game from the verified source checkpoint `22bdfca3068c7934921c2493eb40de624d684318`, `dot-game/src/`. They are test-only historical controls, not another author's implementation or runtime dependencies.

- engine.js SHA-256: `bf5873f2769e8de504ee8e3a2d0aa49fb39bd860252740b85f610cd0c60e287c`
- loot.js SHA-256: `458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc`

Preserve these identities. New loot fields deliberately change future generation; comparisons must distinguish old owned-item behavior from new generation and must not regenerate old goldens to hide a change.
