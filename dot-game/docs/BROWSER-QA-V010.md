# v0.10 bounded desktop browser acceptance

Observed by the parent in dedicated cloud Chrome, 2026-10-26 03:20–03:24 UTC. Candidate tabs 30 and 31 used the isolated `/play/hv-v3-dot/candidates/v0.10/` save scope. Existing accepted v0.9 stable tab 26 was left untouched.

## Frozen source and deployment

- Complete source/runtime: `a2406ee8ae7dfeeb0edeed268c59fd728dba1833`, `GGGODLIN/hv-v3` branch `bot/dot`: 98 files, 97 manifest payloads, 1407656 bytes. All exact Git blobs and manifest entries match; 23 changed files were read back byte-for-byte at that commit and 75 unchanged identities were tied to verified receipt 038. All 409 outside-source blobs were preserved, with no removals.
- Candidate website: `7ae873625722522e4980e754d944ae8b0fdefaa3`. Exact Pages run `40263377697` succeeded. One HTTP6 pass returned six 200 responses and exact frozen-source byte/SHA-256 matches. Only six candidate files were added; all 3852 previous site blobs, including the accepted root and other works, remained unchanged.
- Existing final source evidence: 694/694 Node tests, zero failures, plus four runtime syntax checks and independent acceptance GO. The aggregate source guard was corrected while retaining the historical hash before the final passing run. These results are reused because this checkpoint changes only documentation/manifest, not runtime or tests.

## Observed learning, slots and refunds

1. Fresh level 1 showed 1 AP and 0/5 occupied slots. Learning HP Tank spent the AP but maximum HP stayed 575 until the ability was slotted, then became 630. MP Tank learning was disabled for insufficient AP.
2. Unslotting HP Tank restored maximum HP 575 without refunding AP. Free forgetting returned AP to 1. Learning and slotting MP Tank changed maximum MP 19 → 20; forgetting restored MP 19 and AP 1. Gold stayed zero.
3. At zero effective one-handed proficiency, the 1H Damage preview honestly showed attack 36.95 → 36.95 and a +0 benefit.
4. A normal UI import of an older natural v0.7 export retained the established level-19 profile (gold 7888, 102 inventory items plus three equipped items) and equipment, with no abilities allocated and 19 AP. Learning and slotting all three abilities cost four AP: 15/19 remaining, 3/5 slots. Maximum HP changed 971 → 1066, MP 73 → 80, attack 236.6 → 282.2; the +45.6 attack matched effective proficiency 22.8. Gold was unchanged by allocation.
5. Ability/refund controls were disabled in battle. A natural stage-3 win displayed 10.6 seconds. Its report recorded start attack 282 and maximum HP 1066, 1310 basic + 238 skill actual HP removal, incoming loss 70, minimum HP 96.3% and two stun applications.
6. The automatic loop naturally reached level 20. AP became 16/20 with the same four points spent; visible maximum HP 1090, MP 83 and attack 289 reflected progression. Retreat/reload retained gold 8438, 82 wins, 111 inventory items plus three equipped items (114 total: nine newly earned) and all three learned/slotted abilities.
7. A normally opened second candidate tab was read-only and its refund control disabled. Explicit Takeover made tab 31 the owner and tab 30 read-only, preserving AP 16/20.
8. A normal UI export confirmed the exact three known learned/slotted IDs and preservation of all 105 original imported items, counted across 102 inventory items and three equipped items. Export SHA-256: `9569c6a9ec6eb544e1d5e7a537aab952d9275857795adeeebb87eefe8c14ff99`. No private export path or personal save payload is included in source.

Natural progression and different combat/RNG histories are **not a controlled pure-buff comparison**. These observations do not imply every ability makes every expedition faster or preserves later drop sequences.

## Layout and logs

At 300% desktop browser zoom, the viewport measured 393 CSS pixels, document width 388 and ability panel width 360.33. Screenshots showed readable wrapped content; zoom was restored to 100%. This is not physical mobile validation.

No application-origin errors appeared in inspected logs. Explicit extension noise was excluded; no claim is made about uninspected logs.

## Acceptance boundary and recovery

The parent gave bounded desktop candidate GO. Actual malformed imports, specific repaired-corrupt-save reproduction and old-writer ability downgrade remain source/Node coverage rather than browser proof in this slice. The prior universal foreground-pause, physical mobile and OS-suspension limitations remain. No offline earnings or universal lifecycle guarantee is claimed. Existing v3 saves remain compatible; old running versions should be refreshed before taking ownership, and may otherwise omit optional ability allocation.

This pre-promotion checkpoint adds this report and updates documentation/manifest only. It must be backed up and exact-readback verified before the same frozen six runtime files are promoted. Public-root promotion and final stable-save smoke are pending here; accepted public v0.9 recovery remains `83a973bcf2586ed5994e707cfc5faaeb519873cd` until those gates pass.

Source backups restore source, tests, documentation and available assets, not personal browser saves, credentials, Library content or schedules.
