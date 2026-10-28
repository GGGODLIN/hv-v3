# Recover v065 source candidate

Restore the complete `dot-game/` subtree from the exact bot/dot commit whose CHECKPOINT.json identifies `198-v065-inventory-stat-sort` and validates every payload byte. Keep its assets, src, tests, scripts, package.json, index.html and docs together. This directory has no external runtime package dependencies; `npm test` runs source tests and `npm start` serves the app. Four runtime syntax checks: `node --check src/engine.js`, `src/loot.js`, `src/session.js`, `src/ui.js`.

v065 adds transient raw gear-stat sorting, not a new save format or hero stat model. Existing v3 save namespace and investment compatibility rules remain. Export saves before recovery and refresh older tabs; never load a test profile into the formal page. Latest prior full accepted restoration is source197 `74811495fc9babf48405f99cf54ec1a0b1a8286c` (v064), formal website `8002ee77afc3bb2ab9ab80835beb7bc24b727f0c`.

This is source-tested candidate material until independent source verification, exact full backup and real candidate browser acceptance are recorded. Do not call source DOM tests browser play. Website release is a separate parent-owned action; this source iteration does not change the public site.
