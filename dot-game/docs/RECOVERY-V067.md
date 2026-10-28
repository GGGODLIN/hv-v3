# v067 accepted source recovery (checkpoint210)

Restore exact commit carrying CHECKPOINT `210-v067-accepted` on GGGODLIN/hv-v3 bot/dot. Parent source208 `1aa2fa45f0e46ef0965dcab82c39ebd9222290fd`; runtime/tests/assets/index remain byte-identical to208. This checkpoint adds actual desktop candidate acceptance receipts/docs only plus complete inventory manifest; formal publication remains separate. Candidate exact7460b65cca9448b5d6f81474be06b1710774ef03 / Pages40770151342 success / normal UI PASS. See QA-V067-BROWSER.md for evidence and limits.

Restore entire dot-game from exact commit; verify CHECKPOINT every payload SHA256/bytes (manifest itself identified in external receipt). Run npm test and node --check on src/engine.js, src/loot.js, src/session.js, src/ui.js, then python3 -m http.server 8000. No package installation needed. Do not use candidate progress to overwrite formal save. No schema change; existing bound/IW legacy-reader limits remain. Full code/assets/provenance/tests/scripts/research/recovery retained, not just website output.

Formal remains v066 website426e77fffe719de19eef7927dcf18e705d081030, backed by fullsource2075274e45d6d3204d28fadb2714aac4af762074c88. Source index still identifies source candidate intentionally; no tested runtime bytes changed for this acceptance. No website writes or Library/Space sync in checkpoint210.
