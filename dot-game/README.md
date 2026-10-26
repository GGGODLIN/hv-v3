# hv-v3 dot — independent idle loot RPG

An independently designed single-player browser RPG inspired by original HentaiVerse research. This directory is self-contained: do not run or reuse the repository root application. Existing implementation, generated constants, monster dataset, art, and other authors' single-player proposals are excluded.

## Run
Requires Python 3 for static serving and Node 20+ for developer tests. No dependencies, installation, or build step.

```
cd dot-game
python3 -m http.server 8000
```

Open http://localhost:8000/ . Run `node --test tests/*.test.mjs` for checks. Do not open ES-module HTML via file://. Desktop play has been tested; mobile layouts are implemented but not yet device-verified. Game stays local in the browser; no server account, network gameplay, or offline progress.

## Current milestone
Version 0.8.1 is published and bounded-desktop accepted at https://gggodlin.github.io/play/hv-v3-dot/ . Website commit `5f2edb7a6927b6433c1a5d8fd64c0a51e4e7561c` passed exact Pages run `40253248001`; all six public runtime HTTP 200 bodies match the accepted source bytes/SHA-256. Pre-promotion accepted source `f1228ea6e2777c9469fd387c32f2ba312b725a75` was backed up and verified first. The complete runtime originates at `ff6bb071240deef5d86c34e80a1d514daeb9762d`, unchanged by later documentation receipts.

The final public-root browser smoke retained the original v0.7 stable profile, not candidate progress, and verified a real stage-3 win, loot, retreat, reload and saved writer ownership. See docs/BROWSER-QA-V081.md for observed values and limits. The exact verified commit containing this publication receipt is the latest accepted full-source restore point; keep prior v0.7 recovery `e1b576ee2041bd2772f79587e859a80b5ab1f108` as history. This receipt updates docs/manifest only, without another deployment or redundant runtime test run.

### Pre-promotion acceptance (historical; completed by the publication above)

Version 0.8.1 has bounded desktop browser acceptance as of 2026-10-26 01:11 UTC; public-root promotion is pending in this source checkpoint. The exact source/runtime remains the already verified 551-test package at `5a280428eb940d667ee3c2a63ecbc01c5dbe9643` / `ff6bb071240deef5d86c34e80a1d514daeb9762d`. It adds the historical-model axe bleed plus numerical clock, manual-start boundary and repaired-save takeover corrections. Actual candidate play covered natural v0.7 import, purchase/manual equip, visible bleed, progression/reload and writer takeover. See docs/BROWSER-QA-V081.md for evidence and explicit limits; this is not a universal buff or mobile/suspend guarantee.

Candidate site `57f7ab124852d9f0313c2f475ac43a09b069cb03` has exact-commit Pages success and six HTTP 200 byte/hash matches. Earlier HTTP-blocked statements below are historical: normal permitted execution resumed at 01:03 UTC on 2026-10-26, and the old v0.8 HTTP6 also completed successfully. No denied operation was bypassed. Keep the accepted public v0.7 root until the subsequent promotion verifies; this source checkpoint records acceptance before that write.

### Prior milestone notes (historical; superseded by the current status above)

The 23:00 UTC source-only follow-up fixes a protected-save recovery failure: after another tab repairs corrupt data, taking ownership now revalidates the current durable save and permits persistence only if valid. Previously the repaired journey could play indefinitely without saving. 551 tests and four syntax checks pass. Complete 83-file source is exact-readback verified at `ff6bb071240deef5d86c34e80a1d514daeb9762d`; a package reconstructed only from that remote commit also passes all tests and syntax checks. This is an unpublished candidate; browser/public acceptance remains pending. See docs/SAVE-RECOVERY.md.

The 22:00 UTC source-only follow-up rebases the online timer when a manual Start or Retreat actually changes lifecycle mode. Camp time before clicking Start no longer counts toward the new fight. Failed/repeated actions and ordinary combat actions retain their timer interval. All 531 tests and four runtime syntax checks pass. Its complete 81-file source backup is exact-readback verified at `053a5dc7dd05d3332a3a6f1bf3a2667dfc12375a`, including a successful test run from the remotely reconstructed package. It remains an unpublished v0.8.1 candidate; see docs/PUMP-BOUNDARY.md for the narrow scope, recovery evidence and validation.

Version 0.8.1 is a source-only numerical clock-correction candidate. All 515 tests, four runtime syntax checks and the full 100-seed balance run pass; complete source backup/readback is verified at d725a41047bbc77f53113db4b8ae8983877e8b4f, including a successful test run from the remotely reconstructed package. The earlier v0.8 public-file verification is blocked pending a user decision, and no further website writes or HTTP retries are being attempted. Public v0.7 remains the accepted playable version; do not treat either candidate as an accepted release.

Version 0.8 is the next development candidate: historical-model axe Bleeding Wound. Its 469 source tests and full 100-seed balance measurement pass; browser and release gates remain pending; public v0.7 remains accepted. Do not treat a candidate as the latest verified playable checkpoint.

Version 0.7 is published and accepted at https://gggodlin.github.io/play/hv-v3-dot/ . See docs/BROWSER-QA-V07.md and docs/RELEASES.md for verification. It adds an explicitly adapted weapon commission after the first clear: choose axe, rapier or club, preview exact current-level Superior/R110/Slaughter stats and cost, confirm purchase, then equip separately. Item delivery is locked. Spending can leave zero gold; expeditions remain free. It is not an original Bazaar/Forge/Training implementation or a guaranteed upgrade over good random loot. See docs/COMMISSION-GUIDE.md for measured usefulness and limits.

Version 0.6 is published at https://gggodlin.github.io/play/hv-v3-dot/ . See docs/STATUS.md, docs/RELEASES.md and docs/BROWSER-QA-V06.md for exact source evidence, bounded desktop acceptance and the explicit schema-negative browser-test gap. It adds optional conservative future-drop sales and an exact-item cleanup preview. Default OFF, no retroactive sweep, no score-based disposal: only low-quality strict same-base downgrades against equipped/locked keepers qualify. Unknown item-schema imports fail without overwriting the existing save. This is an independent convenience rule, not an original-HV economy claim. See docs/LOOT-MANAGEMENT.md for precise limits.

Retained from v0.5: From stage 3, armored/agile enemy roles make weapon choices visible. Camp preview shows the next route; combat readouts reflect PA/stun effects on actual defenses. New role values are independent adaptations, not imported original monster data. Stages 1–2 remain unchanged. See docs/BUILD-GUIDE.md for honest equipment tradeoffs.

Retained from v0.4: club stun with visible duration/recovery feedback. Fixed 25% chance and four simulation ticks are game adaptations using researched maximum values, not original low-level scaling. Stun cannot refresh; recovery guarantees an enemy action on the next player turn under the documented independent scheduling rule. See docs/COMBAT-DESIGN.md for precise eligibility and ordering.

Retained from v0.3: rapier Penetrated Armor, weapon-family persistence and visible stack/timer feedback. The deliberately historical post-hit model uses a fixed 25% chance and seven simulation ticks; these rates and timing choices are this game’s adaptations, not a claim of exact current HV. Each stack reduces existing general physical mitigation by 25%, up to three. It is not +25% direct damage. Basic critical hits guarantee one stack; 破勢斬 benefits from existing stacks but cannot trigger them. Weapon scores compare stats only, not this effect.

This version retains v0.2’s online background processing where browser timers permit; long pauses and closed-page time give no offline earnings. Web Locks serialize writes, with a safe foreground/export-only fallback if unavailable. Development continues beyond this first loop.

## Play
Choose 均衡 for the original policy, 猛攻 for more skill use at higher MP cost, or 持久 for earlier healing and finite automatic potions. Change tactics at camp. These are independent auto-decision policies, not an original-HV skill-tree claim.

Choose a stage and start an expedition. Combat and skills resolve automatically. Return to camp to compare, equip, lock, and sell loot, then replay or challenge a higher stage. Failed expeditions can recover; no real-money purchases. Export saves periodically; clearing browser storage can lose progress. The UI documents exact controls as implemented.

## Source and fidelity
See docs/ORIGINAL-HV.md for allowed research, docs/COMBAT-DESIGN.md and docs/LOOT-DESIGN.md for explicit adaptations. Original facts, fitted research models, and independent game decisions must remain distinct. Unknown original constants are not presented as exact. Early playable slices are milestones, not a permanent scope limit.

## Recovery and release
Source backups are committed to GGGODLIN/hv-v3 branch bot/dot under dot-game/. Retrieve the exact checkpoint commit; preserve source, tests, documentation and assets together. Verify the checkpoint manifest where provided, then serve and run tests. A source backup is not necessarily an accepted playable release: read docs/STATUS.md and its validation evidence. Browser saves are separate from source backups.

Accepted static releases deploy only to https://gggodlin.github.io/play/hv-v3-dot/ through the separate personal-site repo. Other branches of hv-v3 and other personal-site works are not modified. The old dot-probe is only infrastructure verification, not this game. This package cannot restore credentials, platform permissions or automation schedules.

## Save migration in v0.2
On first v0.2 load without a v2 save, a validated v0.1 save is copied read-only into the new version. The old save is retained untouched. Progress made later in a still-open old tab is not merged; use the new version going forward or export/import deliberately. Multiple v0.2 tabs have one writer; use the explicit takeover control. Candidate builds keep separate save namespaces.

Browser QA limits: inactive-tab progress and safe takeover were observed in cloud Chrome. Foreground-only pause did not occur in that environment while document.hidden reported false; its cause is unresolved. 388 CSS-pixel layout was checked with browser zoom, not a physical mobile device. Do not equate bounded-clock unit tests with real OS-suspend validation.

## Save migration in v0.3
v0.3 uses its own save/writer/preferences namespace. With no v3 save, read a valid v2 save first, or v1 only if v2 is absent. Corrupt newer data blocks automatic replacement rather than silently rolling back. Older save bytes remain untouched; progress made later in an old tab is not merged. An exact legacy name created by this independent game can recover its weapon family; unknown/explicitly invalid identities receive no proc. Importing an old save returns safely to camp without retaining combat statuses.

## Save compatibility in v0.4
The existing v3 save/lock namespace is retained: v0.4 adds no new persistent weapon fields, and loading always discards encounter-only stun/recovery state. Older v0.3 tabs still run their old combat rules until refreshed; only one tab may own and write progress. Refresh the game to use current mechanics, or use the explicit takeover control. The prior v1/v2 migration remains read-only and does not merge later progress from those old namespaces.

## Save compatibility in v0.7
The v3 namespace and ordinary item schema remain unchanged. Commissioned weapons are standard locked items; all1500 purchases passed the actual frozen v0.6 validator without item/gold/lock loss. Old tabs show old UI until refreshed; use refresh or explicit takeover for commission. Candidate saves are separate. Source backups do not back up your personal browser save: export it through the game before clearing site data.

## Save compatibility in v0.8
Existing v3 saves and weapon identities are retained. Bleeding is encounter-only state, discarded on load just like PA and stun; it is not a persistent weapon upgrade. Refresh old tabs to run the new axe behavior and descriptions. Ordinary item generation, commission prices and supported inventory records are unchanged. See docs/ORIGINAL-HV.md for the historical model and docs/BLEED-GUIDE.md for natural-play outcomes and counterexamples.
