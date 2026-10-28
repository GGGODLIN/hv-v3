# Recover source-only v0.49

Restore dot-game/ from the exact commit carrying CHECKPOINT.json checkpoint 165-v049-report-export-source on GGGODLIN/hv-v3 bot/dot. Keep all files, tests, scripts, assets and attribution. Check every payload length/SHA-256; manifest excludes itself.

Run `npm test` in dot-game with Node.js; check four src/*.js files using `node --check`. Start `python3 -m http.server 8000`, open index.html. No build/dependencies required. Export a real game save before changing versions. The new report JSON is NOT a restorable game save and must not be used as one; synthetic test fixtures are not personal progress.

Source-tested, not actual-browser accepted or published. Latest complete accepted source remains 2a5354689165d7512d279327db8935c3bbef8570 (v036), formal website f192fec4eff401948d80156f941c01404816cbba. Inherited art and all candidate changes need permitted browser acceptance. Material-scope publication question unresolved: do not retry website writes via another version/host or by removing provenance.

Read ORIGINAL-HV.md for independent research boundaries. Source outside dot-game is not part of this game. No Library dual-sync or platform login/schedule recovery claimed; no raw private play profiles included.
