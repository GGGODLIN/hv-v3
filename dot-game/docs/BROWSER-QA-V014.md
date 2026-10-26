# v0.14 bounded cloud-browser acceptance

Candidate acceptance PASS at2026-10-26 07:23 UTC. Root promotion and stable-root smoke remain pending. Complete source65e02542472fc4cf9eb9592f2eab1ababd777b39 was backed up/readback verified (133files/132payloads), before candidate sitef3530c6b2e0bcc19b279dda4ad3bbbe5c54ea329. Exact Pages40284707129 succeeded and HTTP6 returned six200 exact frozen-runtime byte/SHA256 matches. Stable v0.13 was unchanged during this acceptance.

## Environment and preservation
Dot cloud Chrome (`cdp`, backend1), actual rendered controls and normal exports/imports. Stable tab26 retained its separate Lv20, gold9528, inventory117, wins87, HP1090, AP19/20 profile. Its normal export SHA256 was `ef96248c05ac6805e7ad5ebb1446ebd47823a0b40dbe1c778bb15e8660fcd888`. Candidate38 started with isolated storage. No hidden-state edits, item injection, forced RNG or user-computer access.

Fresh level1 showed three empty slots. Explicitly saving A recorded the three starter IDs; importing the normal earned root profile then removed that unrelated candidate preset and retained Lv20/gold9528/inventory117 without auto-creating presets.

## Actual gear preservation and clear/overwrite semantics
- Saved A from original clubloot-152/starter-armor/starter-accessory.
- Manually equipped naturally owned axe loot-17, armor loot-42 and accessory loot-8, then saved B. HP was1154, compared with original1090; these are different existing gear, not a preset stat bonus.
- A preview listed all three exact current→target IDs and stats: attack223.38→242.38, HP1154→1090, general mitigation30.25%→8.98%, crit11.90%→14.87%, evade9.86%→6.60%, block10.83%→4%. Conditional counterchance stayed29.24%/oneperturn. Cancel retained1154; confirm returned1090 while inventory117/gold9528 remained unchanged. Focus returned to the same card's usable save button.
- Saved C sharing A's physical items. B's stored armor in inventory showed disabled `配裝保護中` and disabled sale. B clear preview listed all exact IDs and said no item deletion/unlock. Cancel retained B; confirmed clear removed only B. The armor then offered enabled manual unlock but still disabled sale, proving the lock remained.
- Re-equipped the same alternative, previewed overwrite C, canceled, then explicitly confirmed. Old and new IDs were shown; C became the axe/block build while A retained the original. Applied A again.
- Ordinary UI-export SHA256 `9dfe38462c3d3c6486aeacec9ef962283e27e1750e75096e15674fadc8327e66` verified **all120 owned items** (117inventory+3equipped) remained. Their full records were identical except the explicitly saved loot-8/17/42 locks changed false→true. Original equipment, hero, gold, RNG seed, abilities and tactics matched exactly. Saved metadata contained A and C only, with their actual IDs. Reload retained both and A remained equipped.

This browser case proves swapping with117inventory items, not a full120-item backpack. The full-capacity swap is separately covered by independent Node acceptance.

## Ownership and normal combat
A pending C application in tab38 was invalidated when a second candidate tab39 explicitly took ownership. Before takeover all nine preset buttons were disabled there. After takeover tab38 became read-only, closed its modal and disabled its old confirmation; no stale swap occurred. Tab39 previewed/applied C normally.

Starting with117inventory items was refused by the existing expedition-space safeguard; the button itself remained enabled, and the log explained the capacity requirement. Five deliberately chosen ordinary items (loot-164/160/158/155/153) were reviewed and sold for285credits, leaving112inventory/gold9813. This is a manual tradeoff sale, not a claim of conservative safe-downgrade eligibility. All preset mutations were disabled during the subsequent battle.

Two real stage3 victories raised wins87→89. Reports used axe attack223/maxHP1154/generalmitigation30.3%:
-11.6seconds:899basic+632skill+17bleed, no counter,112HP lost/min95.9%.
-10.5seconds:1123basic+365skill+52bleed+8counter actualHP removed, one counter,43HP lost/min98.4%.
The game returned to camp at inventory116. Reload retained Lv20/gold10033/wins89/items116, A and C, active C and HP1154. These runs are not a controlled superiority comparison; presets do not modify combat coefficients.

## Visual and log inspection; limits
An actual desktop screenshot showed the three cards, exact item IDs, wrap-safe labels, protected/current indicators and usable buttons. Supported page scroll worked. One cloud-browser zoom shortcut produced no measurable viewport change (1155CSSpx before/after), so no new narrow-screen or physical-mobile acceptance is claimed. A locator scroll helper was unavailable before action; supported page scroll was used instead. A retreat click attempted after automatic camp return was disabled; the state was read and reloaded normally, not treated as a game failure.

Documented `tab.dev.logs` warn/error inspection returned no app-origin entries after explicitly excluding only known chrome-extension://kcdongibgcplmaagnmgpjhpjgmmaaaaa/content-script.bundle.js metadata noise. This is bounded captured-log inspection, not an exhaustive console guarantee.

Malformed imports, getters, missing references, full120inventory, all disposal paths and exhaustive stale mutations are Node coverage rather than automatically browser coverage. Actual takeover, cancel/clear/overwrite/apply, ID preservation, import/reload and combat were observed. No OS-suspension, exhaustive lifecycle or personal browser-save backup claim is made.

## Final stable-root smoke — 2026-10-26 07:29 UTC

Accepted-source checkpointcc26b628b97fcd665051c3410858ad93195fb27a was backed up/readback verified before root sitea8bc6a82da6f476c6a0b2e53320c95f7ff106fe8. Exact Pages40285780632 succeeded and HTTP6 returned six200 exact byte/SHA256 matches. Only four root runtime files changed; loot/session and3876non-root website blobs were preserved.

Actual root tab26 loadedv0.14 while retaining its own original Lv20/gold9528/inventory117 and no candidate presets. Saved A from the original three items; manually equipped ownedarmor42/accessory8 while keeping club152 and saved B. Exact A preview showed same attack242.38, HP1140→1090, mitigation28.09%→8.98%, block10.83%→4%; confirmed swap retained itemcount and original activebuild. The same five deliberately selected ordinary test items were reviewed and sold for285credits, leaving112items/gold9813; preset references remained protected.

A real stage3 win took11.6seconds:1097basic+451skill actualHPremoved,46HPlost/min97.5%, three stuns, no counter. Retreat/reload retained Lv20, gold9973, inventory113, wins88, HP1090, AP19/20, A and B with A active. Candidate A/C progress did not replace the root A/B profile. All candidate tabs38/39 were closed and root26 left atcamp as Deliverable. Bounded warn/error inspection again had no app-origin entries after the same explicit extension-noise exclusion. No extra narrow/device claim is made.
