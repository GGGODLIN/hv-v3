# v0.9 bounded desktop browser acceptance

Observed by the parent in dedicated cloud Chrome, 2026-10-26 02:19–02:22 UTC. Candidate tab 29 used the isolated `/play/hv-v3-dot/candidates/v0.9/` save scope. Existing stable v0.8.1 tab 26 was left untouched.

## Frozen source and deployment

- Complete source/runtime: `d7c6a91c8f8ad854ddd8e01663ce3da630f26ea6`, `GGGODLIN/hv-v3` branch `bot/dot`: 92 files, 91 manifest payloads, 1298610 bytes. All source Git blobs match the frozen snapshot; 26 changed files were read back byte-for-byte at that exact commit and 66 unchanged files were verified against receipt 034 and both exact trees. All 409 outside-source blobs were preserved.
- Candidate website: `6ed32468c73cfd4cbb9e0d2f589fe6bcda57ca20`. Exact Pages run `40258269362` succeeded. A single six-file HTTP pass returned 200 for every runtime body and exact source byte/SHA-256 matches. All 3846 preceding website blobs, including the accepted root and concurrent other work, remained unchanged.
- Existing source evidence: 599/599 Node tests, zero skips/failures, four runtime syntax passes. Independent paired acceptance covers 20 natural routes, 326 expeditions and 36591 sampled steps with identical full gameplay/RNG state and matching report measurements. These checks are not repeated for this documentation-only checkpoint.

## Observed natural play and report values

1. Fresh stage-1 victory: displayed 32.6 seconds; level 1 → 2. Start context retained starter attack 37, maximum HP 575 and mitigation 3.3%. Actual HP removal was 653 basic + 422 skill + 0 bleed = 1075; incoming HP loss 351; minimum HP 64.3%; 31 attack attempts including six skills; MP spent 18.
2. Pinned that completed report. During the next automatic fight, manual retreat after displayed 13.0 seconds produced a distinct 中途回營 report; the original win and its pin were unchanged.
3. Manually equipped a naturally dropped Fair level-3 axe. Subsequent victories displayed 13.7 seconds (start level 2 / attack 78) and 15.8 seconds (start level 3 / attack 84). The latter report showed 847 basic + 221 skill + 7 bleed = 1075 actual HP removal, one bleed application, incoming HP loss 128, minimum HP 88.5%, 15 attacks including three skills and MP spent 9. Displayed level growth matched the observed progression.
4. The recent-report list now contained the two axe victories. The pinned starter report retained its exact original text after eviction from the newest-two list.
5. Manual retreat and reload retained durable level 4, gold 252, three wins and five inventory items. Reports reset to zero, the pin was hidden, and the session-only empty-state notice was correct.

These are natural progression observations, **not a controlled weapon-benefit comparison**: levels, equipment and RNG differed. Faster later clears do not establish a causal axe advantage. No combat/reward tuning claim is made.

## Layout and logs

At 300% browser zoom, the measured viewport was 393 CSS pixels, document scroll width 388 and report width 360.33. Screenshots showed wrapped narrow report text without horizontal overflow; zoom was restored to 100%. This is desktop browser zoom, not physical mobile-device validation.

Inspected logs had no application-origin errors. Explicit extension noise was distinguished from app errors; this is not an assertion about uninspected logs.

## Acceptance boundary

Bounded desktop candidate GO was given after the observations above. Actual defeat, import cancellation and multi-tab pin behavior were not re-tested in the browser during this slice; relevant source/Node coverage is separate. Physical mobile, OS suspension and universal foreground-only pause behavior remain unverified inherited limits. No offline earnings or universal lifecycle guarantee is claimed. Public-root promotion and final stable-save smoke were pending at this pre-promotion observation; both are completed by the publication record below.

Source backups restore source, tests, documentation and available assets; they do not restore personal browser saves, credentials, Library content or schedules. Previous accepted v0.8.1 recovery `c1530bc76aa06716443b9ccca8de6f616e9f5f47` remains historical recovery; the exact verified publication-receipt commit is now the latest accepted restore.

## Public-root publication and smoke — 2026-10-26 02:28 UTC

Accepted source `8d6be5b3c3735021aea8e94570ee88b0efe5eea9` was backed up and verified before promotion. Website commit `08d5066a74c93a69260f384fbd02a02bbf68f81e` passed exact Pages run `40259045608`; one HTTP6 pass returned six 200 responses with byte/SHA-256 identity to the same frozen runtime. Four root blobs changed; loot/session and all 3846 non-root site blobs were preserved, with no additions/removals.

Parent observations in stable cloud-Chrome tab 26:

- Reload of the exact v0.9 public root retained level 19, gold 8018, 78 wins and 105 items. Reports were empty: isolated candidate progress had not mixed into the stable profile.
- Actual stage-3 club victory displayed 11.6 seconds. Start context: attack 237, maximum HP 971, mitigation 8.7%. Report: 1149 basic + 399 skill = 1548 actual HP removal; incoming HP loss 140; minimum HP 90.6%; 11 attacks including two skills; MP spent 6; one stun application.
- The following automatic victory displayed 10.5 seconds. Pinned the latest report: 1169 basic + 379 skill = 1548 actual HP removal; incoming HP loss 77; minimum HP 93.4%; ten attacks including two skills; one stun application.
- Retreat and reload retained level 19, gold 8238, 80 wins and 109 items. Reports reset to zero and the pin was hidden, as documented for session-only data.
- No app-origin errors appeared in inspected logs; only explicitly identified extension noise was present. Candidate tab 29 was closed. Stable tab 26 was left at camp for delivery.

This is bounded root smoke, not exhaustive device/lifecycle testing, a re-test of every import/defeat/multi-tab edge, or a controlled comparison of weapon effectiveness. Runtime and tests remain unchanged from the already tested source; this final receipt updates only documentation and manifest.
