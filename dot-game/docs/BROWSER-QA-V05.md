# v0.5 browser acceptance — 2026-10-25

## Candidate evidence
Source `3e692b4008a93ba45aaffe5d5e62d76378927f30` was read back exactly: 45 files / 485821 bytes and 44 manifest payload hashes. Candidate site `7d6ae90e71245984034a8048b0443ec1b62bcf9e` passed exact Pages run `40215716667`; all six candidate HTTP200 runtime bodies match backed-up SHA-256. Accepted v0.4 and other website content remained unchanged during staging.

Actual checks used dot cloud Chrome through CUA, ordinary gameplay controls and read-only DOM inspection. No user computer, injected game state, fabricated screenshots or raw browser automation was used.

## Observations (17:19–17:26 UTC)
- Candidate opened as a fresh Lv1 character, isolated from stable progress. Stage1 preview showed four baseline waves, 4.3% normal mitigation and 7.3% boss mitigation. Expanded advice accurately distinguished individual avoidance checks from aggregate full-avoidance chance and avoided a universal best-weapon claim.
- Started ordinary combat; preview hid and the first live enemy showed the same4.3%/2.5%/2%/1.5% baseline rates. First clear took30.5s, with naturally dropped rapier and club. Equipped the rapier and cleared stage2; its preview also retained the old baseline numbers.
- At camp, stage3 preview showed normal6.9%, armored24.9%/1% evade/1% parry, agile3.9%/10%/7%, and armored boss27.9% with6% block. Stage4 showed armored26.2% and agile boss8.2%/10%/7%/6%. Preview content changed with stage selection and contained all four waves.
- Live stage3 normal and armored boss matched their preview values. A living agile enemy with one PA stack displayed mitigation2.9% instead of its base3.9%, while evade/parry remained10%/7%. This matches rounded relative mitigation, not an additive direct-damage boost.
- Equipped a naturally obtained club and used reduced motion. A stunned living baseline enemy showed evade/parry0% while block remained1.5% and mitigation remained8.2%. Live stage4 agile boss showed its baseline8.2%/10%/7%/6% when not stunned.
- Desktop screenshots showed the armored shield and agile sash silhouettes, boss labels and detailed status cards. No clipping was observed; small canvas captions are supplemented by the full text cards.
- Browser zoom300% gave innerWidth393 / document scrollWidth388. A screenshot of camp preview showed wrapping role/rate rows without horizontal overflow; all four DOM rows remained present. Restored100% zoom. This is not physical-mobile testing.
- Repeated stage3/4 selection and reload preserved Lv9, gold1216, wins11, equipped club and selected stage4. Four preview rows remained at camp, and enemy status was hidden. No unrequested rewards/progress changes appeared from preview operations.
- No app-origin console errors in inspected entries. Errors were excluded as extensions only when their source URL explicitly identified chrome-extension.

## Evidence boundaries
262 tests and four JS syntax checks pass, including all120 actual waves versus preview, stage1–2 old-state/RNG trajectories, no-RNG/pure preview, PA/stun/recovery defense views, old-validator compatibility and 100-seed progression checks. BUILD-GUIDE.md separates natural progression, paired counterfactuals and generated-item comparisons; short-fight axe damage remains competitive.

This browser pass did not directly capture armored-target PA and agile-target stun simultaneously; actual readout changes were witnessed on other valid roles and every combination is tested automatically. Exact RNG/caps/expiry and all120 routes are automated evidence, not exhaustive browser play. New file-chooser import was not rerun. Physical mobile, OS suspension and the inherited foreground-only visibility anomaly remain unverified. No offline earnings or universal background guarantee.

## Public root
Candidate bounded desktop acceptance is complete. Accepted-source backup, live promotion and shared-v3 takeover/root reload smoke are pending at this checkpoint. Record their actual outcome in the later publication receipt; do not infer success from candidate testing alone.
