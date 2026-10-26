# v0.12 bounded cloud-browser acceptance

Candidate acceptance PASS at 2026-10-26 05:13 UTC. Root promotion and stable-root smoke remain pending. Source `21247944ce2615847be37ae31f18b2b5c1e86841` was backed up/readback verified first (115 files / 114 payloads). Candidate site `5b3c9cbc86cf7d321db153b88c2070c3f62be920` passed exact Pages run `40272612375` and HTTP6: six 200 responses with exact runtime bytes/SHA256. Public v0.11 remained unchanged during staging and this acceptance.

## Initial preservation and fresh controls

Cloud Chromium only, using rendered controls and ordinary exports/imports. No user-computer access or hidden browser-state edits. Stable tab26 retained the naturally earned level20, gold8880 and inventory114 profile. Its normal UI-export SHA256 is `8f22ed955883b777ff08d47030ad6cfeea170167ad632caca440869e33f953e0`.

Isolated candidate tab35 began fresh at level1, inventory0 and selection0, with review disabled. The old profile was imported through the normal file chooser and explicit confirmation, retaining level20/gold8880/items114. Candidate progress never replaced the stable root profile.

## Exact selection and intentional tradeoffs

- Sale selectors are separate native checkboxes. Existing locked rapier `loot-114` and `starter-weapon` checkboxes were disabled.
- Clicking exact `loot-168` retained keyboard focus on that same ID after repaint.
- Selecting `loot-168`, `loot-167` and `loot-166` showed three items / 219 credits. Switching to the weapon filter and power sort retained all three IDs and explicitly reported two selected items outside the current filter.
- Review still listed all three exact IDs, names, qualities and individual prices39/151/29, total219 and post-sale balance9099. Six-stat comparisons showed positive accessory attributes against the starter accessory, with an explicit stronger/rare-gear warning. The axe-versus-club trait warning was visible. No score-based selection occurred.
- Cancel retained all114 items and gold8880, and retained the intentional selection without selling. Reopening and confirming once produced inventory111/gold9099, zero selection, a closed dialog and disabled confirmation.
- Normal UI-export SHA256 `a3c301546222ffe41a6991517fca06006616ef1a9e2390db3007ced7dc6de109` verified exactly `loot-166`, `loot-167` and `loot-168` removed. All111 survivors matched their original item records, equipment was identical, and hero data was identical except for the219-credit increase. Reload retained111/gold9099 with zero selection.

This deliberately chosen sale included Superior-quality tradeoffs. It is not described as safe-downgrade cleanup or a recommended optimal build decision.

## Layout, ownership and interruption

At300% browser zoom the viewport was393 CSSpx and document388px. Review dialog width358.33px / scroll width351px showed no horizontal overflow. A screenshot showed wrapped title, exact summary, item ID and item details. Zoom returned to100%. This is a narrow desktop check, not a physical-phone test.

A second candidate tab36 loaded111 items/gold9099 read-only, with all sale checkboxes and review disabled. Explicit takeover closed tab35's pending one-item sale and disabled its confirmation; tab35 became read-only. The new owner settled with saved state and zero selection. Selecting `loot-165` then starting an expedition cleared selection and disabled every sale checkbox during battle. No sale occurred from the abandoned preview.

## Actual play after cleanup

Three ordinary stage3 victories raised wins84→87. The latest two reports showed9.5s and10.5s, attack242/maxHP1090/general mitigation9%, with100 and123 incoming HP loss respectively. These are observed gameplay, not a controlled claim that selling equipment improves combat.

Retreat/reload retained level20, gold9429, wins87, inventory114, HP Tank rank1, AP19/20 and zero selection. Selling three chosen items made three additional inventory slots; ordinary drops filled them again. The feature does not solve unlimited idle storage.

## Explicit limits

Node acceptance separately covers malformed, stale-price/item/lock, overflow, pending FIFO and repeated transactions. Browser evidence covers cancel, sorting/filtering, exact exported survivors, reload, ownership, combat guards and actual victories. No physical-mobile, OS-suspension, exhaustive lifecycle or application-console inspection is claimed. Explicit manual selection can intentionally sell better equipment after review; it has no automatic quality protection beyond locked/equipped exclusions.
