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

## v0.2 — published 2026-10-25 14:22 UTC

- Accepted full source: `12e151786047612e7254783288cf890507d55b5f` on bot/dot, 28 files / 209165 bytes, exact content and Git blob SHA readback verified; 27 payload SHA-256 entries verified.
- Website: `6a93b851e3ef7b12bf59fcb569cf3ccafda12895`, parent `9d2829d7e1962fa168e2d7f1adc34c07d1f51b24`. Parallel publication outside our prefix was preserved using the latest tree and expected-head non-force update.
- Pages CI [40201709893](https://github.com/GGGODLIN/GGGODLIN.github.io/actions/runs/40201709893) succeeded at this exact site commit. Six HTTP 200 runtime files matched source hashes.
- Candidate source `c9e6d73ad853e048d09de17be5cb1398a4fa224e` and site `753160bd26f1c7ba2680bd6a6adadfc741bbf25f` remain in history; candidates/v0.1 and candidates/v0.2 remain separate. v0.1 source and publication evidence above are retained for recovery.
- 88 tests / four module syntax checks pass. Final root save migration, policy persistence and battle-start smoke passed; see BROWSER-QA-V02.md. Foreground-only pause did not occur with document.hidden false in cloud Chrome; cause unresolved. Physical mobile and OS-suspend behavior untested. No universal background or pause guarantee, no offline earnings.

| Runtime path | Bytes | SHA-256 |
| --- | ---: | --- |
| index.html | 9722 | 09a9532caf8215b5f548613eefdb5b48c75b4ff960e0b3b22f4728de26fc40d8 |
| src/engine.js | 17664 | e004cb0eca49810723533a7d9103569f663de453d0e62c6d5cbd7bdc54d2a784 |
| src/loot.js | 8337 | 9ba8bbc7ba315b9e1084f0f877603d5c2b253cbe0fffe6abc7c96812c435132b |
| src/session.js | 2615 | d2062500a60223d34b491c232c72cb9d6591d8c7ba60ccd49f0d1aabe3a9a44b |
| src/ui.js | 33626 | 5fe0b7943b4baa7e4a964841a4b353fc135d232431d2129c3cd2237791dcc4da |
| style.css | 16791 | 33f235a937b200c7f2cc7ad5b85257f31a56be6bc3fa3b02602ae99cdf03711c |

This later receipt is documentation-only; the six runtime files are unchanged and require no redeploy. Restore the full accepted source directory and verify its manifest; do not substitute runtime-only files for complete source. This receipt does not claim GPT Library sync, credential restoration or schedule restoration.

## v0.3 — 2026-10-25 15:28 UTC
- Accepted runtime source: `fee2d2ade97b959cb3d396b5f863279ed84edd53` on `GGGODLIN/hv-v3` branch `bot/dot`. 35 files / 299045 bytes read back exactly; 34 manifest payload hashes pass.
- Source candidate: `a930d560d970f0352d78a3329062ce36974aa079`; staged site `6cf12ecddffef17f7c15959fa3589957bd40dd19`, Pages run `40205960885` successful. Candidate retained at `/play/hv-v3-dot/candidates/v0.3/`.
- Accepted site: `45666f8ea1d0612d1e4b294ded7fb98340c73428` on personal-site `main`; Pages run `40206772110` success for exact SHA. All six live HTTP200 runtime files match accepted source SHA-256. Only authorized demo runtime paths changed; all candidates/other works preserved.
- 147 tests + four JS syntax checks pass. Actual cloud browser verified loot/equip loop, natural rapier proc, reduced-motion feedback, save/reload, takeover, legacy migration and retained-old-tab write isolation. Exact limits and observations: BROWSER-QA-V03.md.
- This publication receipt changes documentation and regenerated manifest only. Runtime remains byte-identical to accepted source/candidate. It is the latest recovery documentation when its commit is verified; do not confuse an earlier convenient link with latest verified restore evidence.

## v0.4 — 2026-10-25 16:30 UTC
- Accepted runtime source: `b47ecc87f5fa66bbd2dbf85f7581bdc06626f74f` on `GGGODLIN/hv-v3` branch `bot/dot`. All 39 files / 389175 bytes read back exactly; 38 manifest payloads verified.
- Candidate source: `3a0bf240eb6216438f278ffe8064f386e74d919e`; site candidate `77ab8973d5c29cc36eab96b24fd0d9a85b7d2902`, exact Pages run `40210714831` successful. Candidate remains at `/play/hv-v3-dot/candidates/v0.4/`.
- Accepted site: `5aa89cb1771f3b934e26a8085030830f2747c73b`; exact Pages run `40211704287` successful. Six public runtime HTTP200 bodies match source SHA-256. Five blobs changed because session.js is unchanged. Other works and all candidates preserved, including concurrent website head `c7a80a72eada56c9a8026ff9206686372f1c38de` inherited before staging.
- 202 tests and four JS syntax checks pass. Independent review caught and verified the timer-partition recovery fix. Actual cloud Chrome verified natural club acquisition, active stun, visible recovery, reduced-motion text, progression, narrow layout, reload and shared-v3 old-tab takeover. Exact limits are in BROWSER-QA-V04.md.
- This later publication receipt updates documentation and manifest only; runtime remains identical to the accepted source and browser-tested candidate. Use the latest fully verified receipt commit for recovery documentation, while retaining this runtime/source evidence and old checkpoints.
