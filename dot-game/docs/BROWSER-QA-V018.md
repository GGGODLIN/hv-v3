# v0.18 bounded desktop browser acceptance

2026-10-26 13:58–14:02 UTC. Actual cloud Chromium desktop; not physical/mobile acceptance.

## Version and source chain
Combined source92bf6bc0528b0066d63beff10ce0e3d0aa32ed72 (164files,1,253tests,four syntax) → isolated candidate0a450355089637dcf95b6a528dea3388ecc5fea1 → exact Pages40334828295 SUCCESS → six runtime HTTP200 byte/SHA256 matches and six GitHub exact readbacks. Candidate URL: https://gggodlin.github.io/play/hv-v3-dot/candidates/v0.18/ . The fresh 13:44 explicit post-denial authorization permitted this public test page; previous unreferenced021f was stale and never published. Root promotion remains pending this acceptance-source backup.

## Real commission and combat loop
- Normal unedited in-game export/import transferred the earlier natural test profile to the separate candidate namespace: Lv11,gold949,wins17,inventory30,stage3,HP795,attack139,crit12.2%,parry15.15%. Stable profile was not replaced.
- Visible dropdowns showed exactly Axe Slaughter; Club Slaughter/Balance; Rapier Slaughter/Balance/Nimble. Defaults were Slaughter.
- Rapier same-level previews: Slaughter attack54/crit2.96%/parry11.6692 at680 credits; Balance39/6.37%/11.6692 at596; Nimble39/2.96%/18.2569 at608. Canceled previews did not spend949. Seven-stat table, explicit costs and trait caveats were visible.
- Confirmed Nimble: gold949→341, locked loot-31 delivered, old Lv7 Slaughter remained equipped (attack139/parry15.15%). Normal manual equip changed attack132/parry21.76%, demonstrating the defensive/offensive tradeoff. No edited resources, forced RNG or hidden-state writes.
- Played stage3 with the purchased weapon and auto-advanceON; queued finish via Enter. Completed at displayed00:15,wins18,gold451,stillstage3,HP795 and camp; queue false and disabled, auto-advance checkbox stillON. Small observed run is not a controlled superiority comparison.
- After another normal victory, Club Balance preview57 attack/6.38%crit/no parry cost656 against current561; exact shortfall95 and disabled confirmation observed. Preview can still teach the choice while unaffordable.

## Finish-then-camp lifecycle
- During battle queued then canceled; button returned aria-pressedfalse with cancellation message. Ordinary combat continued.
- In the already-settled victory intermission, gold561/wins19 were read before pressing「通關完成，立即回營」and remained561/19 afterward. No second reward; camp stayed onstage3.
- Started again, queuedtrue, then ordinary reload. Loaded safely in camp, queuefalse, purchased Nimble remained equipped, gold561/wins19 unchanged. Suffix UI preference reset to default Slaughter, as documented; purchased item persisted.
- A second real candidate tab was readonly. Finish control, suffix selector and preview all disabled. Closed that duplicate; owner remainedcamp. Final candidate Lv11,gold561,wins19,inventory35,HP795,attack132,parry21.76%.
- Screenshot inspected the scrollable confirmation dialog: seven rows, explanatory copy, price and disabled confirmation/cancel visible without overlap. No narrow/mobile claim. Known extension metadata errors from exact chrome-extension://kcdongibgcplmaagnmgpjhpjgmmaaaaa/content-script.bundle.js excluded; remaining queried error log entries were empty (limit1000).

## Limits
Source/mock tests cover forged/stale inventory quotes, all6×500level items, old-default parity, defeat/ownership/import clearing and reward edge cases; these were not all reenacted in browser. UI selection on an already purchased item was automatic: an attempted redundant checkbox click found no Playwright match; subsequent live AX showed item selected and normal equip succeeded. No application error or data loss followed. Physical/mobile and long-duration balance remain unclaimed. Production root needs separate exact commit CI/HTTP and smoke after promotion.

## Earlier blocked preparation (historical; resolved by fresh authorization)

# v0.18 browser and publication status

## Combined-source update; prior staging commit is stale

2026-10-26: the source candidate now also includes one-shot finish-current-expedition-and-camp. The user explicitly approved standing isolated candidates after the prior denial at 13:44 UTC. This source-only implementation performs no website mutation. Rebuild staging from its latest exact verified source; do not deploy the earlier unreferenced commit `021f68cc4b7aabaf59ff3ce38039cd29a0e22bc8`, which lacks the new UI/runtime.

In addition to commission acceptance below, actual browser QA must queue/cancel during battle, finish and collect a victory once, confirm stage does not auto-advance when stopping, use the control in intermission, verify keyboard and read-only behavior, and confirm reload clears intent. Node/mock evidence is not browser evidence. Stable v0.17 remains accepted until both features pass.

### Historical staging receipt

2026-10-26 13:35 UTC. **Pending: not browser-accepted, not published.**

## Verified source

Runtime commit `c32a5a815e0634d62cc0c5fb00071498d25b2511`, 1,207 tests, four syntax checks. Full 159-file source verification reused 136 previously verified unchanged Git blob identities and directly read back 23 changed files. All 409 source blobs outside dot-game remain unchanged. Independent research/default-parity and 18 naturally earned public-API purchase/equip/fight scenarios passed; these simulations are not browser evidence.

## Blocked staging

A six-runtime-file isolated candidate commit `021f68cc4b7aabaf59ff3ce38039cd29a0e22bc8` was prepared without changing existing site blobs. The public main ref update was denied because the review regarded pre-acceptance staging as unmet publication prerequisites. One reassessment supplied the original explicit test-page authorization; it was also denied, requiring fresh exact post-denial authorization. Both operations were known unexecuted. The website remains `972f55df0b6951efdaa939c3bd7dba6331ace862` and stable v0.17. The unreferenced candidate commit is not a deployed version; do not claim a URL or CI result for it. No further retry, alternate API, forced write or branch movement is authorized by this document.

## Browser preparation and outstanding acceptance

Stable cloud test profile was observed normally at Lv8, gold306, wins10, inventory19, HP729, attack121, crit11.3%, parry15.15%, ProtectionOFF. It was exported by the ordinary in-game export control, without changing its progress. Temporary download paths are not permanent recovery backups and no edited save or forced resources were used.

After the staging permission is resolved: publish only the isolated candidate from the already verified source; verify exact commit CI and HTTP hashes; use separate candidate save namespace; normally import an exported test profile, preview all supported choices/defaults and stat tradeoffs, cancel, buy with earned credits, confirm exact debit/locked delivery/no auto-equip, equip and fight, reload, check read-only controls and no app errors. Only after actual bounded browser acceptance and accepted-source backup may root promotion occur; then exact CI/HTTP and root smoke are still required. Keep stable progress separate. Physical/mobile acceptance remains unclaimed.
