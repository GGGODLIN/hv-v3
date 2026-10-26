# v0.25 actual cloud-browser acceptance

**Bounded desktop candidate acceptance passed:2026-10-26 21:21UTC.** No runtime changes followed source freeze or candidate verification. Formal-root publication and its separate stable-profile smoke are subsequent gates.

## Exact candidate and unchanged input

- Full source `8c186565ac07b71e30239a0e1ac2550c15256fdc`, checkpoint117:233 files/232 manifest payloads.28 changed files read back exactly,205 unchanged identities verified and409 outside-source blobs/modes preserved before staging.
- Candidate website `7ed4e0127d6100d8d616e9f66346e85ab77e47f4`; exact Pages40402738946 succeeded and all six HTTP200 bodies/SHA256s matched source. All3,942 preexisting website blobs/modes, including formal root, remained unchanged.
- Public candidate: https://gggodlin.github.io/play/hv-v3-dot/candidates/v0.25/ . Dedicated dot-cloud CUA tab20. Stabletab2 was never claimed, imported into or changed by this worker.
- Input was the unchanged ordinaryv0.24 export SHA256`631c9c2a02c2ed360ec320b3edd6943d31d88f23c14e85392d67dd8a48387ee6`, imported through the actual file chooser and visible Lv16 confirmation. No state/RNG/resource injection or edited items/save.

Observed initialLv16/gold3043/wins45/fragments100/seeds0,84backpack/87held. BoundIW1`loot-12` stayed equipped; boundIW1`loot-1` stayed in the backpack. Original armor/accessory and presetA persisted.

## Actual workbench checks

1. Defaultview displayed84/84. Family filters returned10axes,12clubs,5rapiers and1unrecognized starter sword. Investment filters returned83unbound,0bound-without-IW and1IW1. EquippedIW1 was not counted as backpack gear.
2. Opened actual backpackIW1`loot-1`, then applied axe+IW1:0/84 and a clear no-match/backpack-only message, while the inspected rapier remained with an explicit out-of-filter notice. No autoequip/disposal occurred.
3. KeyboardHome on the native family selector changed it toall and retained focus; keyboardEnter on reset restored84/84 and moved focus toslot-filter. An incompatiblearmor+rapier intersection also stayed empty; its explicit reset button restored allitems.
4. Manually selected`loot-3`(132credits) and`loot-2`(48credits). Clubfilter showed one hidden selecteditem; club+IW1 showed both hidden. The full180credit preview retained both exactIDs, both per-item values/comparisons and two conspicuous hidden-row markers.
5. Cancel preserved84items/3043gold and both selections. Reopening and explicitly confirming removed exactly those twoIDs, cleared selection and produced82items/3223gold. No other item was implicitly selected or sold. Repeated/stale confirmations are covered by source audit, not claimed as injected browser actions.
6. With the excludingclub+IW1 filters still active, opened the ordinary820credit rapier commission, canceled without purchase, then explicitly reopened/confirmed. It delivered locked`loot-85`, did not equip it, and visibly announced reset toweapon/latest with newfiltersall. Actual count28/83 and detail selection revealed the newweapon; gold became2403.

Screenshots showed the workbench, native focus ring, complete hidden-item modal, scrollable dialog actions and honest empty state readable at the actual desktop viewport. No narrow/mobile viewport was claimed.

## Normal play and real reload

Set nondefault filters, then reloaded:all three selectors returnedall,83/83 appeared, gold2403/wins45/fragments100/seeds0 and existingequipment remained. This verifies actual native-form restoration behavior, not only absence of filter fields in source saves.

Started stage1, queued finish-after-clear, and switched familyfilter to rapier during actualcombat. Browsing remained available while selectedsale correctly required camp. The expedition won in9.5 processedseconds, returned camp, added one ordinarydrop`loot-86`,76gold,10fragments and1seed; no unintended repeat began. FinalLv16/gold2479/wins46/bag84/fragments110/seeds1. Another nondefaultfilter+reload restored84/84/all selectors and retained that earned progress.

Normal UI export SHA256`3cb1c0e42a28d163a92bec43b73b1ea91be428b4b32af9fec5b8dfebbf5bb583` validates asformat3. Exact comparison against input confirms:
- Removedonly`loot-2`,`loot-3`; addedonlycommission`loot-85` and actualdrop`loot-86`.
- All85 retainedoriginalheld items are byte-equivalent; all equipped records and preset references are unchanged.
- Both existingIW1 targets keep identity, anchor, rolls and actualstats. Legacyrapiers`loot-1`,`loot-9` still have no parryfield; no retrofill.
- Newcommission remainslocked, not equipped. Sourcebackup excludes these privatebrowserexports.

## Console, limits and verdict

Captured91warn/error entries through21:21UTC; every entry was exactly the known `chrome-extension://kcdongibgcplmaagnmgpjhpjgmmaaaaa/content-script.bundle.js` metadataerror. None originated from theapp in this bounded capture. An initial exact-label locator matched no control; switching to its already observedDOMID succeeded. This was a QA locator issue, not an appfailure.

Cloud browser cannot reach this executor'slocalhost. An initial localpreview producedERR_CONNECTION_REFUSED; binding its resultingfailedpage for cleanup was denied bybrowser URLpolicy. The server was stopped and tab19 leftuntouched, with no alternateport/tunnel/retry. Authorizedpubliccandidate flow is separate and succeeded. Future iterations should not repeat the known cross-containerlocalhost attempt.

Not claimed: physicalmobile/narrowviewport, OSsleep, comprehensiveconcurrency, malformedimport or hostile state manipulation inbrowser. Sourceaudit owns those explicitly listed syntheticcases. No newformula, balance, IWhigher-tier or universalbestgear claim.

**GO for complete accepted-source documentation backup/readback, then formal-root promotion of exactly the same sixruntime files.** Parent stabletab2 must retain its own profile; do not import thiscandidate export. No runtime rerun/redeploy is needed for subsequent documents-only receipts.
