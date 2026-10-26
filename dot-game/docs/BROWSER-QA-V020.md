# v0.20 actual cloud-browser acceptance

2026-10-26, bounded cloud Chrome desktop (tab12), not the user's computer. No hidden state/save edits, forced RNG, artificial levels, credits or equipment.

## Artifacts and isolation

- Initial six-file runtime source `0e165a96172ec016382d38ed71c95ff6ef655268`; staged site `d08c54b4f47547f554aaaab20afd0a7eb36d4c9b`, exact Pages40347477306success and sixHTTP200 byte/SHA256matches before opening.
- Candidate path `/play/hv-v3-dot/candidates/v0.20/` initially showed a separate Lv1 profile. Stable root remained Lv9/gold458/wins12/items21/HP824/AP8/HP Tank rank1 active/ProtectionOFF in camp.
- Exported stable's normal save using its own UI, then imported unchanged through candidate's filechooser and normal Lv9 confirmation. No source backup contains this browser save.
- First candidate retained old v0.19 visible header; literal-only correction backed up as `bb8c7ec2c070f9bb421d7b7b0a137c235b6aadf1`. This does not change the tested JS or rules. Corrected candidate reload and final exact artifact details are recorded below before acceptance.

## Actual play

1. Started naturally unlocked stage2 with the existing Lv7 Slaughter rapier, HP Tank rank1, starter armor/accessory. Enabled ordinary auto-advance; four normal victories on stages2–5 advanced Lv9→11 and wins12→16, unlocking stage6. Queued finish-then-camp stopped safely; earned inventory grew21→28. No magic cast observed in these fast early clears, not interpreted as proof of absence.
2. Turned auto-advance OFF and normally equipped already-owned starter sword, reducing displayed attack to96; enabled reduced-motion setting. Stage5 cleared with this weaker, unrecognized weapon; no magical cast observed before the caster died. This was a real loadout choice, not a forced damage fixture.
3. Entered naturally unlocked stage6 with the same owned sword. Its first-wave 赤砂守衛 displayed physical-first and magic-defense/resist limitations. A real **最近敵方施法 · 赤砂術式 · 魔法技能（已施放，不代表命中）** notice appeared and persisted across later waves with reduced motion enabled. Screenshot inspection showed the separate notice clearly below enemy cards without covering battle controls. Later-wave HP511/872 was observed. The expedition won in38.9processedseconds, totalHPloss813, minimum33.2%, oneheal,27MP, zero counters. These are whole-expedition costs, not a claim all813damage came from magic.
4. Naturally unlocked Protection atLv11 was explicitly enabled through the growth panel. Repeated stage6 showed a real magic cast and actual shield activity. Final report:36.8s, totalHPloss635, minimum52.9%,30MP,3shieldcasts replacing3attacks,216totalHPdamage prevented, and Lv11→12. This is **not a same-RNG causal ON/OFF comparison**; level, rolls and progression differ. UI reports whole-expedition prevention, not magic-only prevention.
5. Camp correctly hid the recent-cast notice. Examined newly dropped `精良・餘燼護衣・壁壘` Lv7/R139, showing defense16(+14), HP157(+145), block0.8%(+0.8%); equipped through ordinary comparison UI. On the next stage6 run, observed the actual transition to **下一次行動：魔法技能 · 赤砂術式**. New armor did not turn the displayed4.8% END/WIS magic mitigation into physicalarmor mitigation; playerResist0 remains labelledunimplemented.

## Limits

This is actual normal-progress gameplay plus bounded desktop screenshot inspection, not exhaustive probabilistic magic-counter/critical/Resist browser coverage. Those isolated cases have source tests. No narrow/mobile, OSsuspension or cross-device guarantee. No claim of full original monster MP/AI, playerresistgrowth or elemental equipment.

## Final artifact / reload / console

Final candidate site `7ed4e4df8c494baf4207afd7e4f77aa844408d8b`, source `bb8c7ec2c070f9bb421d7b7b0a137c235b6aadf1`, exact Pages40348541936success and sixHTTP200 byte/SHA256matches. Normal reload at15:26UTC displayed v0.20 and retained Lv12/gold1559/wins20/items34/HP1042/MP52, stage6, equipped earnedarmor, ProtectionON and reducedmotion. Cast notice cleared, camp route remained correct, and normal writer ownership settled to進度已保存. No game-origin console error was found; only the previously identified `chrome-extension://kcdongibgcplmaagnmgpjhpjgmmaaaaa/content-script.bundle.js` metadata noise was excluded.

Candidate's final armor run won again (wins20); ordinary export retained this test profile outside the repository. Stable root simultaneously remained Lv9/gold458/wins12/items21/HP824, demonstrating candidate isolation. Root publication is a separate remaining gate; no candidate save is imported into stable.

**Bounded candidate browser acceptance passed at2026-10-26 15:26UTC.** Screenshots inspected the1188-class desktop layout and recent-cast notice; no claim of responsive/mobile acceptance.
