# v0.16 browser acceptance

Status: isolated candidate desktop acceptance passed, 2026-10-26 12:33 UTC. Production promotion and stable-root smoke remain pending.

## Baseline and environment
Cloud CUA Chrome/CDP, accepted v0.15 root tab 2; user computer is not used. At 1188 × 761, the old document height was3330px; abilities began y1808, reports y2536 and commission y2853. Actual screenshot showed the long secondary feature stack below departure controls.

Ordinary in-game export before testing:10564bytes, SHA-256 `1cbe27ef3150db258c9c8265b5628602aa85eff86223fd05da5c0db9620ee24c`; Lv7, HP707/707, MP37/37, gold124, wins8, inventory14, parry15.15%. The export is the cloud test character, not a claim that personal browser progress is in source backup. Candidate uses a separate save namespace.

## Focused acceptance checklist
- [x] Normal import retains profile and source data; default 戰況.
- [x] Visible selected state and aria-selected/roving tabIndex agree.
- [x] Left/Right wrap; Home/End; Tab enters only visible panel, hidden controls absent from accessibility snapshot.
- [x] Growth action retains selected pane and focus; exact AP/HP update.
- [x] Preset/commission dialogs cancel or Escape back to visible trigger.
- [x] Start then switch to another pane: clock advances and real victory/drop still occurs; returning to 戰況 shows report.
- [x] Equipment action still works through always-present inventory.
- [x] Read-only tab can navigate but cannot change progress; normal import refreshes data in selected pane.
- [x] Reload resets navigation to 戰況, keeps saved progression.
- [ ] Final production smoke after accepted-source backup and promotion.

## Limits
Physical mobile/device testing and actual narrow viewport are unverified unless supported browser controls establish them. No random-drop or combat-balance efficacy claim belongs to this presentation-only release. Engine/loot/session bytes are unchanged.

## Actual isolated results
Runtime source `bbe6c66619a9dd1942ce6b43e2d4a8d9eb729c73` was backed up before candidate site `162ecd57ab7a3c61157fd06b91bc855ceacbc20f`; exact Pages40322461849 succeeded and all six HTTP files matched the frozen source bytes/SHA-256.

- Normal in-game import reproduced Lv7/gold124/wins8/inventory14/HP707. Default 戰況 document height1986px, down from3330px at the same1188×761 viewport. Screenshot confirmed the three readable tab buttons directly below expedition controls. No feature removal is inferred from that reduction.
- Actual ArrowLeft wrapped 戰況→成長; ArrowRight wrapped 成長→戰況 and advanced 戰況→配裝; End selected 成長 and Home 戰況. Each observation had one aria-selected=true, one tabIndex=0 and matching focused tab/visible panel. Tab then focused camp-panel-battle, its counter-rules summary, report-rules summary, then inventory slot-filter; hidden gear/growth content was skipped. Actual accessibility snapshot contained none of 營地能力／營地配裝方案／武器委託 while inactive.
- On 成長, normal HP Tank learn consumed1AP (7→6) with HP707 unchanged, focus moved to its now-enabled slot control; slotting changed HP707→776, selected tab remained 成長 and focus became the matching unload control.
- On 配裝, saving A locked the current three items. Preview of an already-worn set was correctly disabled (not a navigation failure). An ordinary inventory armor swap then changed HP776→880 and enabled A preview. Dialog opened with cancel focused; Escape returned to the visible 配裝 A preview control. Weapon commission cancel returned to its visible trigger, gold124 unchanged. No background tab switch was forced through a modal.
- Started a real expedition, selected 成長, observed 戰況 hidden, all growth mutation buttons disabled, mode battle and timer running. A second same-scope tab was read-only: all three tabs browsable while Start, abilities and presets stayed disabled. It was closed without takeover. The owner continued to win twice while 戰況 was hidden: wins8→10, inventory14→17, Lv7→8, gold124→276. After retreat and return to 戰況, the prior complete report showed10.5s, normal722/skill269/counter84 actual damage; latest report showed the deliberate0.6s retreat. This is a continuity check, not a claim tabs improved combat balance.
- Ordinary export before import-reset preserved17042bytes, SHA-256 `85bd5d375b105f6190cfd604fe83ab532e47c961fbdf06972e56d2fadea4a9d6`. JSON parsed; all17 original owned item IDs survived,20 total. Then, while 成長 remained selected, normal confirmed import of the earlier export refreshed AP7/HP707/Lv7/wins8 and cleared reports without changing the chosen UI tab. Reload reset only navigation to 戰況 and retained that imported profile/writer ownership. The isolated profile was intentionally restored for this import check; production progress was never imported from it.
- Captured warn/error entries were browser-extension metadata noise at `chrome-extension://kcdongibgcplmaagnmgpjhpjgmmaaaaa/content-script.bundle.js`; no app-origin error appeared in the inspected capture. This is not a guarantee of all possible errors.

No actual narrow/mobile viewport was available through the documented browser controls used here; responsive CSS/source review is not device acceptance.
