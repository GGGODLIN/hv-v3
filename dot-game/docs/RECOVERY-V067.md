# v067 recovery — source candidate

Use the exact commit carrying CHECKPOINT `208-v067-soulbound-growth-preview` in GGGODLIN/hv-v3 branch bot/dot. Its parent is the full accepted v066 source207 `5274e45d6d3204d28fadb2714aac4af762074c88`. This checkpoint includes full dot-game source, runtime assets/provenance, all tests/helpers, scripts, research/adaptation docs and this recovery guide; not merely website output. CHECKPOINT inventories every payload path/byte count/SHA256 except itself; the external receipt records its hash and exact commit.

1. Restore `dot-game/` from that exact commit into a clean cloud directory. Do not copy other contributors' implementation or touch dot-archive.
2. Verify CHECKPOINT payload hashes, then run `npm test` and `node --check src/engine.js`, `src/loot.js`, `src/session.js`, `src/ui.js`.
3. `python3 -m http.server 8000` serves the unbuilt source. No npm package installation is needed. Use independent candidate storage before normal UI QA; do not import candidate profile into formal.
4. Only after source backup and candidate acceptance may release worker change the authorized website `public/play/hv-v3-dot/`. This source checkpoint itself performs zero website writes.

Accepted formal remains v066 website `426e77fffe719de19eef7927dcf18e705d081030` (Pages40762476547 + desktop UI PASS), backed by source207. v067 is NOT browser-accepted or published at this checkpoint. Engine/loot/session/CSS/assets are byte-identical to v066. Save format stays v3; preview adds no saved preference or metadata. Existing older-reader restrictions for bound/IW items remain unchanged. No claim of public HTTP per-file hashes, physical mobile/full accessibility or Library/Space dual backup.
