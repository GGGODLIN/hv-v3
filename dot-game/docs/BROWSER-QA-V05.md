# v0.5 browser acceptance — 2026-10-25

## Candidate evidence
Source `3e692b4008a93ba45aaffe5d5e62d76378927f30` was read back exactly: 45 files / 485821 bytes and 44 manifest payload hashes. Candidate site `7d6ae90e71245984034a8048b0443ec1b62bcf9e` passed exact Pages run `40215716667`; all six candidate HTTP200 runtime bodies match backed-up SHA-256. Accepted v0.4 and other website content remained unchanged during staging.

Actual checks used dot cloud Chrome through CUA, ordinary gameplay controls and read-only DOM inspection. No user computer, injected game state, fabricated screenshots or raw browser automation was used.

## Observations (17:19–17:26 UTC)
- Candidate opened as a fresh Lv1 character, isolated from stable progress. Stage 1 preview showed four baseline waves, 4.3% normal mitigation and 7.3% boss mitigation. Expanded advice accurately distinguished individual avoidance checks from aggregate full-avoidance chance and avoided a universal best-weapon claim.
- Started ordinary combat; preview hid and the first live enemy showed the same 4.3%/2.5%/2%/1.5% baseline rates. First clear took 30.5 s, with naturally dropped rapier and club. Equipped the rapier and cleared stage 2; its preview also retained the old baseline numbers.
- At camp, stage 3 preview showed normal 6.9%, armored 24.9%/1% evade/1% parry, agile 3.9%/10%/7%, and armored boss 27.9% with 6% block. Stage 4 showed armored 26.2% and agile boss 8.2%/10%/7%/6%. Preview content changed with stage selection and contained all four waves.
- Live stage 3 normal and armored boss matched their preview values. A living agile enemy with one PA stack displayed mitigation 2.9% instead of its base 3.9%, while evade/parry remained 10%/7%. This matches rounded relative mitigation, not an additive direct-damage boost.
- Equipped a naturally obtained club and used reduced motion. A stunned living baseline enemy showed evade/parry 0% while block remained 1.5% and mitigation remained 8.2%. Live stage 4 agile boss showed its baseline 8.2%/10%/7%/6% when not stunned.
- Desktop screenshots showed the armored shield and agile sash silhouettes, boss labels and detailed status cards. No clipping was observed; small canvas captions are supplemented by the full text cards.
- Browser zoom 300% gave innerWidth 393 / document scrollWidth 388. A screenshot of camp preview showed wrapping role/rate rows without horizontal overflow; all four DOM rows remained present. Restored 100% zoom. This is not physical-mobile testing.
- Repeated stage 3/4 selection and reload preserved Lv9, gold1216, wins11, equipped club and selected stage 4. Four preview rows remained at camp, and enemy status was hidden. No unrequested rewards/progress changes appeared from preview operations.
- No app-origin console errors in inspected entries. Errors were excluded as extensions only when their source URL explicitly identified chrome-extension.

## Evidence boundaries
262 tests and four JS syntax checks pass, including all 120 actual waves versus preview, stage 1–2 old-state/RNG trajectories, no-RNG/pure preview, PA/stun/recovery defense views, old-validator compatibility and 100-seed progression checks. BUILD-GUIDE.md separates natural progression, paired counterfactuals and generated-item comparisons; short-fight axe damage remains competitive.

Candidate checks did not directly capture armored-target PA or agile-target stun; the public-root follow-up below subsequently observed agile stun. Other actual readout changes and every automated role combination passed. Exact RNG/caps/expiry and all 120 routes are automated evidence, not exhaustive browser play. New file-chooser import was not rerun. Physical mobile, OS suspension and the inherited foreground-only visibility anomaly remain unverified. No offline earnings or universal background guarantee.

## Public root
Accepted source `3cc1a3d4e25205ebb4a969dcf0f8c0cd91de1d76` was read back exactly (46 files / 490515 bytes, 45 manifest payloads) before promotion. Website commit `25b8f474b42de1a68535fe176dc0cb0548a26ed8` passed exact Pages run `40216688254`; all six public HTTP200 runtime bodies match source SHA-256. Four root blobs changed; loot/session, candidates and other works were preserved.

Final root smoke, 17:31–17:33 UTC:
- New v0.5 root opened read-only while v0.4 retained the shared-v3 writer lock. Visible Lv19, XP40/1192, gold8424, kills442, wins73, 94 inventory items, selected stage 3, balanced strategy and equipped club/armor/accessory matched the old tab. Candidate Lv9 progress did not mix.
- Explicit takeover enabled the new tab and made the old tab read-only. Reload retained the character, equipment, stage and four preview rows without creating another timeline.
- Started stage 3 normally. Its first living baseline enemy matched preview (6.9% mitigation). Later a living agile enemy displayed 3.9% mitigation, active stun and 0% evade/parry while block stayed 1.5%; its accompanying baseline enemy remained 6.9%/2.5%/2%/1.5%. Thus the agile+stun combination is also observed on the actual public root, beyond automated coverage.
- Final inspected app-error list was empty after excluding explicitly identified browser-extension URLs. Returned safely to camp at Lv19 / wins76 with four preview rows. Closed old/candidate tabs and retained the public v0.5 deliverable tab.

Bounded desktop publication acceptance passes. This later receipt changes documentation and regenerated manifest only; runtime remains identical to the browser-tested candidate and accepted source. No routine user notification was sent during quiet hours.
