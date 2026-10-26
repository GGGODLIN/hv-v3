# Frozen own-v0.8.1 report-observation baseline

These runtime modules are exact, unmodified copies of this independent game's
accepted v0.8.1 publication receipt `034-v081-publication-receipt`. The receipt's
runtime originates at source commit `ff6bb071240deef5d86c34e80a1d514daeb9762d`;
the public website commit was `5f2edb7a6927b6433c1a5d8fd64c0a51e4e7561c`.

- `engine.js`: SHA-256 `9ae2378a4818ab92d9e4813ca89e2bed5c4af7f5de5acee01e29575dfeacfa6a`
- `loot.js`: SHA-256 `458ab1548f806cd8ce1f40b50751164cf4eebaa8538cf2651d47d24603a235fc`

No import-path adjustment was necessary: `engine.js` still imports `./loot.js`.
These are test-only copies of our accepted implementation, not another author's
code or reconstructed report-free candidate code. v0.9 acceptance hashes full
natural trajectories from both modules independently to establish that report
observation leaves gameplay, RNG, rewards and scheduling unchanged.
