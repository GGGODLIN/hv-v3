# v0.15 source-backed candidate; staging blocked

## Current accepted recovery — 2026-10-26 12:07 UTC
The source-only blocker below is historical and resolved. v0.15 is now accepted and live at https://gggodlin.github.io/play/hv-v3-dot/ . Restore this exact fully verified publication-receipt commit for current source/docs; runtime is3f5b3cce, accepted prepublication sourcef791ea3f, website66358960. BROWSER-QA-V015.md records exact CI/HTTP and ordinary candidate/root play. Prior v0.14 recovery22bdfca remains valid as an older release, not the newest accepted version. Never use stale unreferenced71c68c26.

## Updated: prior staging blocker resolved, 2026-10-26 11:59 UTC
Explicit user approval enabled isolated candidate1fa69a69 from newer corrected runtime3f5b3cce. Exact CI/HTTP and bounded browser acceptance now pass; see BROWSER-QA-V015.md. The earlier blocker below is historical. This acceptance receipt is the latest candidate-source restore after exact readback; root promotion remains pending and accepted public v0.14 is still valid. Never deploy stale71c68c26.

## v0.15 source-only departure feedback correction — 2026-10-26 09:00 UTC

This candidate fixes the existing camp control mismatch: departure requires at least five free inventory slots and no pending loot, exactly as the unchanged engine already enforces. The Start button now reflects that condition, and its adjacent hint states the remaining slot deficit or pending-loot reason. A rejected/repeated start no longer plays the successful-departure sound. Successful/manual lifecycle timing and rejected-action clock preservation are unchanged. See docs/DEPARTURE-FEEDBACK.md.

Final source aggregate: **1,155/1,155 tests pass**, zero failures/skips, and all four runtime syntax checks pass. Independent new UI/engine/pump acceptance:15/15; existing pump-transition checks:16/16. Runtime engine/loot/session bytes are unchanged from the previously verified v0.15 candidate. No browser/site verification was performed.

This remains a source-only candidate awaiting the existing isolated-test-page authorization; no website write, v0.15 browser acceptance, CI or HTTP verification is claimed. Public v0.14 and accepted recovery `22bdfca3068c7934921c2493eb40de624d684318` remain unchanged. The previously prepared unreferenced website commit `71c68c269745526f3dd4c9af70a9d69fb4432cf5` contains the older UI: do not publish it as this corrected candidate. A future permitted stage must be rebuilt from the latest exact verified source while preserving any concurrent website changes.


Status at2026-10-26 08:48 UTC: **source complete and verified; browser acceptance and publication NOT completed**.

## Restore the correct version
- Latest accepted playable release remains **v0.14**, source recovery `22bdfca3068c7934921c2493eb40de624d684318`, website `a8bc6a82da6f476c6a0b2e53320c95f7ff106fe8` at https://gggodlin.github.io/play/hv-v3-dot/ . Do not call v0.15 the latest accepted playable version.
- v0.15 development runtime is safely backed up at `48776a2cac13eaf6842c46de7e26ef264c115bd1` on `GGGODLIN/hv-v3` `bot/dot`. All142 source files were verified:42 exact changed-file readbacks,100 previously verified unchanged blob identities;409 files outside dot-game remained unchanged. The manifest lists141 payloads plus itself.
- The source-only receipt containing this document adds recovery/source-terminology clarification, not gameplay changes. Its exact verified commit is a newer development-source restore, **not browser acceptance**.
- Checkout the desired exact commit, enter `dot-game`, run `python3 -m http.server 8000` and open localhost:8000. Node20+ runs `node --test tests/*.test.mjs`. No build/dependencies/external assets are required. Historical accepted source remains recoverable through Git; no history was removed.
- Source backup does not restore personal browser saves, credentials, permissions, Library files or schedules. Keep normal browser save exports separately. v0.14 readers reject new v0.15 parry fields; do not import a new-item save into an old writer.

## What is actually verified
1,140 Node tests passed,0 failed/skipped; engine/loot/session/ui syntax checks passed. Independent source acceptance covers new rapier equipment input, legal Nimble suffix, actual combat fraction, strict schema, seventh-stat safe disposal, exact quotes and preset preservation. Historical byte guards retain original digests against frozen own-code controls; they do not claim new rapier RNG is identical. See ACCEPTANCE-V015.md and PARRY-GEAR-GUIDE.md.

No v0.15 browser game was loaded, no v0.15 exact-commit CI/public HTTP check ran, and no v0.15 candidate or root page was published. The existing cloud v0.14 profile was only normally exported; no v0.15 progress replaced it.

## Staging blocker and safe continuation
The intended staging commit `71c68c269745526f3dd4c9af70a9d69fb4432cf5` (tree `b2635a2c629efc60f46208e1efd421ae0adbcb6b`) exists as an **unreferenced preparation object**, not a published or accepted version. It adds only six files under `public/play/hv-v3-dot/candidates/v0.15/`; all3882 previous website blobs are preserved, with zero changed existing files. The six runtime paths are index.html, style.css, src/engine.js, src/loot.js, src/session.js and src/ui.js.

The site's `main` ref update was denied because the candidate had not yet passed browser acceptance. One reassessment used the prior explicit deployment-test approval and a fresh exact tree diff proving isolated additions/unchanged root; it was also denied. A final readback at08:47 confirmed website HEAD still `a8bc6a82da6f476c6a0b2e53320c95f7ff106fe8`. All website writes stopped. No alternate route or further retry was attempted.

Needed decision: specific permission for **publishing this isolated unaccepted test page** on website main solely to perform ordinary browser QA, without replacing the accepted root. If granted, first reread source/site HEAD, verify the prepared candidate against the frozen source and current website, and reconcile any concurrent changes. Do not blindly reuse an outdated parent. Only after a permitted staging update should exact CI/HTTP and actual ordinary browser purchase/equip/reload/combat acceptance run. Back up the acceptance receipt before any root promotion; failing acceptance leaves root v0.14 intact. No further feature development is needed to resolve this blocker.

## Recovered source upload timeout
The initial source `create_tree` call with42 inline contents stalled from08:19 to08:37 and was interrupted without a returned object identity. No commit/ref/site call had been submitted at that point. Source and website refs were read back unchanged. A locally derived expected Git tree hash, with the derivation validated against the known baseline, was queried and not found. Recovery used40 small content-addressed blob writes,2 existing blob identities, and a SHA-only tree request; its returned tree matched the derived expected identity. One non-force expected-HEAD source update and exact readback then completed successfully at48776a2c. The earlier call's orphan-object outcome was not assumed successful, and no branch write was blindly repeated.
