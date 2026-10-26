# v0.22 bounded cloud-browser QA

## Scope

Dedicated CUA cloud Chrome only, no user-computer access, forced application state, hidden-storage writes, injected RNG or level editing. Candidate and stable save namespaces remain separate. Normal export from stable v0.21 at Lv10, gold610, wins14, inventory26, HP848, HP Tank Rank1 enabled, front-target policy and Protection OFF provides the candidate's earned starting profile.

## Candidate acceptance — passed 2026-10-26T16:39Z

Source `6e0614dd199c958a4d3ce7c84592936d61d2e822` fully read back before isolated candidate site `569f46099afa5b1031b655b527a38f1001e5ce66`. Exact Pages `40360095580` success; six runtime HTTP200/byte/SHA256 matches and GitHub readbacks.

1. Normal exported Lv10 profile imported via visible import/confirm controls. First stage1 expedition won: start front/OFF, HP Tank Rank1, loot-12 rapier, starter armor/accessory. Report recorded HP848/attack133/mitigation6.1%,10.6s; actual HP loss69. Details initially collapsed; keyboard Enter expanded pinned baseline with correct IDs/rank.
2. Camp: unloaded HP Tank but kept it learned; enabled Protection, chose weakest policy, equipped normally earned armor loot-21 (Exquisite Lv3). Old pin text stayed exactly unchanged. Second stage1 win recorded no active ability, weakest/ON, actual loot-21 armor, HP806/attack133/mitigation14.7%.10.5s, HP loss58; separately observed one Protection cast/20 prevented damage and one122-damage counter. These differing results are not a causal comparison.
3. Both report details default-collapsed; expanded latest inspected visually at cloud desktop. Names/IDs wrap inside cards. Returned to camp, re-slotted HP Tank, OFF/front, equipped starter armor. Both previous report text and pin text remained byte-for-byte identical despite current build changes.
4. Started a third ordinary expedition then used visible Retreat. Only two latest reports remained (retreat + second win); first pinned report survived unchanged after eviction.
5. Reload cleared both report list and pin, disabled pin button, retained Lv10/gold762/wins16/HP848, front/OFF. No hidden state writes or seeded replay.
6. Bounded error-log review: no app-origin errors. Only known browser-extension metadata errors from `chrome-extension://kcdongibgcplmaagnmgpjhpjgmmaaaaa/content-script.bundle.js` excluded specifically. Two initially misnamed ability selectors and an inventory-role mismatch failed before mutation; visible DOM resolved exact controls; these were automation selector errors, not game failures.

Candidate acceptance passed; accepted-source backup and root promotion/smoke still pending at this checkpoint. Candidate profile/export remain separate from stable progress.

## Limits

No outcome difference is a causal build comparison: progression and random draws differ. Physical mobile, narrow viewport, OS suspension, all schema-negative imports and long-term/offline execution are not covered by this bounded desktop pass. Highest ability ranks and malformed-data fallback were source-tested, not force-created in the browser.
