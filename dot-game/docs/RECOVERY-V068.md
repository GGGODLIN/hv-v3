# v068 complete source recovery — candidate only

Restore the exact commit carrying CHECKPOINT `213-v068-source` from GGGODLIN/hv-v3 bot/dot; do not substitute a moving branch. `dot-game/` contains complete source, original/licensed assets and credits, all tests, this recovery guide and SHA256 payload manifest (CHECKPOINT excludes its own hash). `dot-probe/` and all other existing repository files are retained without changes.

1. Obtain that exact commit; verify every CHECKPOINT.files path, bytes and SHA256 before running. Keep the source candidate separate from accepted v067.
2. From dot-game, run `npm test` with modern Node (ES modules and node:test); no package installation/build is required. Run `node --check src/engine.js`, `src/loot.js`, `src/session.js`, `src/ui.js`.
3. Serve dot-game with `python3 -m http.server 8000`; do not use file://. Open index.html. Candidate deployments use a /candidates/version/ path, isolating existing storage/lock scopes. Default tempo1×; reload resets tempo and restores canonical camp behavior.
4. Save format remains3 and stable storage namespace unchanged. Back up real progress via normal export first. Never fabricate player data, overwrite other games, or import candidate progress into the accepted page.
5. Publication requires root-managed normal browser acceptance, complete source exact-readback, then scoped website commit/CI/public play. This source checkpoint alone does not authorize a claim that v068 is live.

Last accepted/restorable v067 source:73b143ba7038ca184a947f2682170a023b865bb3. Accepted formal website:08020c163037524b8afcab9792d5a34fc1dd3224, exact Pages40771578708. To retain/restore the playable baseline use that accepted content, never force-push or alter other paths.

No new external assets or research formulas. Existing ASSET-CREDITS.md and ORIGINAL-HV.md remain authoritative. The new speed option is a disclosed local adapter; reports measure simulation rather than wall time. See QA-V068.md for source-only verification and limits. No mobile/full-accessibility/public-HTTP-every-file-hash or Library-sync claim.
