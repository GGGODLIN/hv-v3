# v069 desktop-accepted source checkpoint220

Restore the exact commit carrying CHECKPOINT `220-v069-accepted`. Runtime/tests/assets/index are byte-identical to218 `d50c7adf3fe9260f0a04ad29d3aa6f063389764c`; only acceptance evidence/status/manifest changed. Normal desktop candidate PASS at website8647ea6659496500a7471d5aede6b8762959cca0, Pages40785220830 success. Formal promotion remains pending; retainv068 until root completes it. Source index stays candidate-labeled; see QA-V069-BROWSER.md for bounded evidence and residual limits.

# v069 complete source recovery — candidate only

Restore the exact commit carrying CHECKPOINT `218-v069-source` from personal GGGODLIN/hv-v3 bot/dot, not a moving HEAD. `dot-game/` includes complete source, assets and provenance, tests, docs and SHA256 payload manifest; manifest excludes its own hash. All repository content outside dot-game is unchanged.

1. Verify every CHECKPOINT.files relative path, byte length and SHA256 before running.
2. In dot-game run `npm test`; no dependency installation/build required. Check `node --check` for src/engine.js, src/loot.js, src/session.js and src/ui.js.
3. Serve with `python3 -m http.server 8000`, not file://. Use an isolated candidate URL for browser acceptance. Preserve real progress through normal export, never fabricate player data or copy candidate progress into the accepted page.
4. Save version remains3. The new level goal is session-only and is cleared on reload/import/ownership change. At camp choose 升級後回營; its fixed target is departure level+1. Complete the whole expedition after reaching it. It does not grant a level or modify rewards.
5. Source validation is not browser acceptance. Root owns isolated candidate publication, exact CI, normal browser play, accepted source backup and formal publication/smoke. Do not claim this candidate is live.

Accepted v068 full restore source: `2efdba47e4c2fc877afaccf1d7e9cf813052387d` (217). Accepted website: `c7141473c4d541acdd90e1900b669e3a01983d4b`, Pages40779625900 success and desktop smoke PASS. Keep that version until v069 acceptance; no force-push or other paths.

Existing assets/licenses unchanged. ORIGINAL-HV.md distinguishes research facts/models; level-goal farming is a disclosed local adaptation, not a new original-HV mechanic. Source/DOM tests do not imply real-browser, mobile/full-accessibility, public HTTP per-file hashes or Library synchronization.
