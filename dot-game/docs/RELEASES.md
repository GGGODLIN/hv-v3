# Published releases

## v0.1 — desktop-first playable prototype, 2026-10-25

- Play: https://gggodlin.github.io/play/hv-v3-dot/
- Complete verified runtime-source checkpoint: [78316483e93480e6c636c3d1ff5a31bdb729e24d](https://github.com/GGGODLIN/hv-v3/tree/78316483e93480e6c636c3d1ff5a31bdb729e24d/dot-game), branch `bot/dot`.
- Website commit: [0cc3c431e7e161936f0c1c80cf88b4453ab2eb74](https://github.com/GGGODLIN/GGGODLIN.github.io/commit/0cc3c431e7e161936f0c1c80cf88b4453ab2eb74).
- [Pages run 40196513414](https://github.com/GGGODLIN/GGGODLIN.github.io/actions/runs/40196513414): completed successfully.
- Full source checkpoint: 21 UTF-8 files, 154,862 bytes, exact GitHub readback content and Git blob SHA matches. Its CHECKPOINT manifest verifies the other 20 files by bytes and SHA-256.
- Website delta: only `public/play/hv-v3-dot/index.html`, `style.css`, and `src/{ui,engine,loot}.js`. The original probe index was replaced; the separately named candidate directory, other game `/play/hv-v3/`, homepage and other site content were unchanged.

### Live publication verification

On October 25 at 13:14 UTC all five runtime URLs returned HTTP 200 and matched the backed-up source byte-for-byte:

| Runtime path | Bytes | SHA-256 |
| --- | ---: | --- |
| index.html | 9045 | 9163569135588b8ef75325a342727af106652ab031b5dcfc6fca23d89919e03e |
| style.css | 16569 | 629cc89dd3604e01f546e85ba3fb6a964f4d24deed27c3e3bf5166ddc8f7ed3d |
| src/ui.js | 30134 | e4e764870aecd68758c8c1942c7c86e68e5f0fcf55e3c5c123970ebf436f061e |
| src/engine.js | 16020 | d5f13c425e414c523fe08ff8a018a1dd5ddda73a3699b19c0e7abf17fcc91431 |
| src/loot.js | 8337 | 9ba8bbc7ba315b9e1084f0f877603d5c2b253cbe0fffe6abc7c96812c435132b |

Final dedicated-cloud-Chrome root smoke at 13:15 UTC: independent fresh save (not candidate progress), first win in 31.5 seconds, two loot items, stage 2 unlocked, consistent quality labels, successful return to camp. No application-origin console errors appeared in inspected entries.

### Acceptance and limits

55 Node tests and syntax checks pass. Prior candidate browser acceptance demonstrated loot/equip attack 43 → 112, same-stage clear 31.5 → 14.8 seconds, higher-stage progression, help, and export/import/reload preservation. See [BROWSER-QA.md](BROWSER-QA.md) for observed scope.

This is a desktop-first playable baseline, not full HV parity or final-quality gameplay. Mobile-device/narrow viewport testing, true browser visibility/multi-tab stress, and audio edges remain unverified. Current prototype pauses while hidden; background online idle is a priority follow-up, distinct from offline earnings. The original-HV research model and explicit independent adaptations are documented separately.

### Restore and continue

Recover the exact source commit above and its complete `dot-game/` directory, not just the deployed runtime. Follow README.md to run and test. Compare CHECKPOINT.json payload bytes/hashes before treating it as restored. This publication record is a later documentation-only checkpoint: runtime source remains exactly the five hashes above. Its manifest adds this record and updates status without hashing the manifest itself. Git history retains the foundation, candidate and accepted source checkpoints.

Do not overwrite the accepted site with an unaccepted candidate. Continue development on `bot/dot`, preserve the isolated website prefix, and back up complete source before future publication. No Library backup or account/credential/schedule restoration is claimed by this release receipt.
