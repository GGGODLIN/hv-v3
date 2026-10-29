DONE rc12t
Method: ★ only, 13 potions, 4x + skip anim, preset=postF20-blade&fresh, no manual retreats. Driver drvRC12t.js (+ 'heal' event: HP at last decision of the fight vs HP on next map screen). Events: rc12t-evflush.jsonl. Saves: qa-saves/rc12t-blade-{1,2}-end.json. Shots: qa-cp9-rc12t-shots/ (bl1-death, bl2-death only; mid-run estSpecial/h40 stops were logged as events, not screenshotted).

| run | end | death | F30+ boss turns | max hit % | max turn % | potions end | boss-given pots | feel (推測) |
|---|---|---|---|---|---|---|---|---|
| bl1 | F45 boss (電棘蜥蜴塔主) | boss, 0 pots, HP 1 before | F30:6 F35:9 F40:14 F45:26+ (dead T27) | 40.0% (F36 normal charge 342/856); 39.9% F38 | <50 | 0 | +1 per boss F25-F40 (4) | 2/5 |
| bl2 | F80 boss (雷鋼翼龍 charge 458) | boss charge, 0 pots | F30:3 F35:6 F40:1 F45:18 F50:6 F55:6 F60:6 F65:7 F70:8 F75:24 F80:22+ | 40.0% (458/1145 killing charge, F80); 39.9% F38, F51 | <50 | 0 | +1 per boss F25-F75 (11) | 3/5 |

Normal-fight win heal (HP at last decision -> next map): normally +10% max HP (e.g. bl1 F6 +87/868, F33 +86/856; bl2 F61 +88/880). Values of +20% = two consecutive wins before the map screen; 0 = already full / boss-adjacent. 10% is visible as 'HP +N' in log; at F70+ it is ~115 HP vs charge hits of 400+, i.e. too small to matter. No normal-fight death at 0 potions after F55 in either run (both died in boss fights).
Boss rewards: 王戰獎勵 藥水 ×0 until F20, ×1 from F25 on every boss; 保底 優良(F5-15) 精良(F20-25) 華麗(F30) 傳說(F35+). No potions from normal/elite/chest observed (chest = gear/gold). Merchant buys: bl1 4 merchants, bl2 8 (potions stayed ~13).
Charge telegraph: ★ picked D/Z on 35/50 (bl1) and 69/99 (bl2) telegraphs. ★ estimate vs aligned actual: bl1 4/4 est>=50 aligned mismatches were over-estimates (e.g. 485 vs 184, 521 vs 364); bl2 13/20 >20% off, all est > actual (e.g. 573 vs 400); no under-estimates. Aligned coverage 25/48 (bl1), 41/101 (bl2) estimate turns.
bl1 death: F45 boss, potions 13->0 over 26 turns (HP 1 at last decision), last turns -185/-76/-93. bl2 death: F80, 7->3 potions at F75 (24 turns, 5 Z), 0 by F80; T20 -344, T22 killing charge 458 (40.0%).
Note: first load of 5378 resumed an in-progress F1 tower session (3 potions); I retreated it and bought to 13 before bl1 (counts as one extra aborted 深淵 entry).
Blade end floors: 45, 80 (median 62.5).

## Dispatch 2: bl3 + bw1 (data: qa-cp9-rc12t-data.jsonl, one line per run, bl1-bl3, bw1)
| run | end | F30+ boss turns | max hit % | max turn % | potions end | boss-given pots | feel (推測) |
|---|---|---|---|---|---|---|---|
| bl3 | F51 NORMAL fight, 0 potions (before F55); 霜骨怨靈 charge 260 (30%) | F30:7 F35:5 F40:16 F45:5 F50:5 | 40.0% (F40 342/856) | 50.0% borderline (F36 T1 two chargers, est 428/856; survived via Z) | 0 | +1 per boss F25-F50 | 2/5 |
| bw1 | F66 NORMAL fight, 0 potions (after F55); 霜翼飛龍 charge 319 (30%) | F30:3 F35:11 F40:13 F45:15 F50:17 F55:17 F60:17 F65:23 | 40.0% (416/1041, 426/1066 repeatedly) | <50 | 0 | +1 per boss F25-F65 | 2/5 |
Bulwark F30-65 boss turns (requested): 3, 11, 13, 15, 17, 17, 17, 23 (median 16) - clearly longer than blade F30-65 (1-16, mostly 5-7) despite the F30-65 boss HP x0.3 note; potions fell 13 -> 1 across F40-F65 (boss fights cost 1-2 Z each, but normal fights drained the rest). Bulwark's 40% boss/charge hit (≈416-426) appeared on every boss F40-F65 (flagged, not >40%).
Normal-fight win heal: blade bl3 +10% typical (+20% when two wins before map), bw1 same pattern (10% / 20%); one odd +70% at bw1 F26 (likely rest node included). Heal is visible in log and is ~100-110 HP - too small versus 260-430 charges; both deaths came in normal fights with 0 potions, bl3 at F51 (earlier than F55 threshold) and bw1 at F66.
★ estimate vs aligned actual: bl3 4/7 est>=50 mismatched >20% (over-estimates only); bw1 10/14 mismatched, all over-estimates (many actual 0 because boss died/interrupted). No under-estimates >20%. Aligned coverage bl3 54/65, bw1 51/127.
Charge telegraph ★ D/Z picks: bl3 46/66, bw1 41/127 (bulwark mostly A/Q).
Potion sources: only boss reward (+1 from F25) and merchants; no potions from normal/elite/chest in either run.
Screenshots (files): qa-cp9-rc12t-shots/ bl3-death, bl3-town-after-death, bl3-growth-panel, bw1-death, bw1-town-after-death, bw1-growth-panel. Growth panel (角色與配點) displays correctly after return to town: Lv/EXP updated (bl3 Lv15, 未分配 EXP 3,806; bw1 Lv14), stats and 'next point' costs shown; town header shows potions ❤0 after death (consumables lost as stated). Boss-kill growth panel not separately screenshotted.
Saves: qa-saves/rc12t-blade-3-end.json, rc12t-bulwark-1-end.json.

## Dispatch 3: bw2 + bw3 (appended to qa-cp9-rc12t-data.jsonl)
| run | end | F30-65 boss turns (F30..F65) | max hit % | potions end | feel (推測) |
|---|---|---|---|---|---|
| bw2 | F66 NORMAL fight, 0 potions (after F55); 炎尾鐵偶 charge 332 (30%) | 3, 8, 9, 14, 22, 8, 15, 21 | 40.0% (442/1107 at F35/F50/F56/F60/F65) | 0 | 2/5 |
| bw3 | F65 BOSS, 0 potions; 霜角機兵 charge 496 = 40.0% (turn 32) | 3, 11, 14, 13, 14, 20, 16, 32+ | 40.0% (433, 496) | 0 | 2/5 |
Bulwark F30-65 boss turns over all 3 runs (bw1-3): F30 3/3/3, F35 11/8/11, F40 13/9/14, F45 15/14/13, F50 17/22/14, F55 17/8/20, F60 17/15/16, F65 23/21/32+ -> boss fights lengthen from ~3 turns at F30 to 20-30 at F65; the x0.3 boss HP does not keep F50-65 bosses short.
Potion drain (bulwark): 13 at start; ~12 at F40; 7-9 at F50; 1-2 at F60-65. All three deaths happened with 0 potions at F65-66 (2 normal-fight deaths after F55 = bw1, bw2; 1 boss death = bw3). Heal after normal-fight win: 10% (20% when two wins pass; 0 at full HP) - ~110-125 HP, too small vs 330-500 charges; does not offset potion drain.
★ estimates: normal-fight 下回合全體暴擊估計 UNDER-estimates charge hits: bw2 221 vs actual 332 (+50%) at F36/F51/F58; bw3 247 vs 372 (+51%) at F53/F63 (est20 events; screenshots not captured). Boss est were over-estimates (e.g. 620 vs 433). Aligned coverage bw2 53/109, bw3 47/136.
D/Z on charge telegraphs: bw2 37/120, bw3 71/144.
Growth panel screenshots (files): boss kill screen with 成長 panel (F10 boss victory, Lv 12 本場未升級, HP/MP/ATK/DEF/戰力 before->after shown correctly): qa-cp9-rc12t-shots/bw2-boss-kill-F10-growth-panel.png; town 角色與配點 after death: bw2-growth-panel-town.png; death screen bw2-death.png, bw3-death.png.
Saves: qa-saves/rc12t-bulwark-2-end.json, rc12t-bulwark-3-end.json.
Summary rc12t so far (end floors): blade 45/80/51 (median 51), bulwark 66/66/65 (median 66).

## Dispatch 4: VERDICT on bw2/bw3 "under-estimate ~50%" (221 vs 332, 247 vs 372) + oc1, oc2
VERDICT: FALSE POSITIVE - same turn-misalignment pattern as before, NOT a game bug. Checked all 5 est20 events (bw2 F36 T6, F51 T4, F58 T8; bw3 F53 T8, F63 T10) in rc12t-evflush.jsonl with the [第 N 回合] tags:
- The 332 / 372 hit is the line "[第 6 回合] <怪> 蓄力一擊！ 對你造成 332 傷害" which was ALREADY in the log BEFORE the decision (it hit on the previous turn, when HP dropped to 112 / 124 / 67 / 217). It is not the damage of the turn after the estimate.
- The decision turn itself (第 N+1 回合) printed "造成 0，受到 0": ★ chose Z (HP 112 -> 1107, '生命藥水 +995 HP') or D (HP 217 -> 682, '防禦 +465') and that turn took 0 damage. So the estimate (下回合…估計 221/247) was never contradicted by the next resolved turn.
- Estimate is a whole-turn figure ('下回合全體暴擊估計 X', all monsters, crit case); the logged 332/372 is a single charge hit (one monster) from the previous turn. 332/221 = 372/247 = 1.5 exactly, so the previous-turn charge hit was 1.5x the estimated next-turn per-turn crit number - most likely the 蓄力 multiplier, but the estimate is for the following turn and cannot be compared to it.
- Potion/defend DID change the outcome (next-turn damage 0 after Z/D); that is why the aligned next-turn damage was 0.
Correction: the bw2/bw3 'under-estimate' lines above (Dispatch 3) are retracted; est20 (sum-based) must not be used. Driver patched in drvRC12t.js: est20 now fires only when ALIGNED next-turn damage ([第 N+1 回合] 受到) > 1.2x estimate (est>=50). Result in oc1/oc2: 0 aligned under-estimate events (no panel screenshots needed, none were triggered).

| run | end | F30-65 boss turns (F30..) | max hit % | potions end | feel (推測) |
|---|---|---|---|---|---|
| oc1 | F65 BOSS (塔主 雷刃蛇龍), 0 potions; last 3 turns -76/-228/-90 | 10, 17, 14, 20, 11, 11, 26, 15+ | 40.0% (343/858 F55/F60) | 0 | 2/5 |
| oc2 | F45 BOSS (塔主 炎鐮戰士), 0 potions; last 3 turns -44/-163/-77 | 10, 6, 36(!), 15+ | 40.0% (331/828 F30/35/40) | 0 | 2/5 |
oc normal-fight win heal: 10% typical (20% when two wins pass, 0 at full), ~80-170 HP. No normal-fight deaths at 0 potions in oc (both died in boss fights after the potion stock ran out). oc potion curve: 13 -> 7-8 by F30 -> 6-7 through F60 (oc1) / 1 after the 36-turn F40 boss (oc2, 7 Z).
D/Z on charge telegraphs: oc1 65/113, oc2 44/66. Aligned est coverage oc1 50/114, oc2 20/64.
Shots: oc1-death.png, oc2-death.png. Saves: qa-saves/rc12t-oc-1-end.json, rc12t-oc-2-end.json.
End floors rc12t: blade 45/80/51 (median 51), bulwark 66/66/65 (66), oc 65/45 (median 55).

## Dispatch 6: oc3 + arcane1 (rc12t 5378, 72c2778)
Patched aligned under-estimate check active: 0 aligned under-estimates in both runs (no est20 screenshots needed).
- oc3: DEAD F65 boss (霜影骷髏 final hit 83; HP 94/882 at 0 potions, ★D "靠保命活下來"). F30+ boss turns: F30 21, F35 6, F40 3, F45 22, F50 24, F55 14, F60 23, F65 27. Potions 13->0 at F65 (potions drained 8->2 across F50-F60). Max hit 352 (39.9% of 882, F50/55/60 charge, not >40%); max turn <50%. Z=32, cd max 1. ★ D/Z on telegraphs 72/124. Normal-fight heal 10% typical, 20% on consecutive wins (capped 20). Feel 3/5 (推測): big-fight death, potions run dry ~F60. Shot: qa-cp9-rc12t-shots/oc3-death.png; save rc12t-oc-3-end.
- ar1: RETREAT F57 (★ recommended: "HP 20%、生命藥水 0 瓶：建議撤退回城", HP 195/973) -> returned to town, Lv14->16, 66 items kept. Not a manual retreat. F30+ boss turns: F30 10, F35 11, F40 13, F45 15, F50 9, F55 12. Potions 13->0 by F56 (ckpt F30 10, F40 7, F50 6). Boss reward every boss: potion x1 + 保底 精良/華麗/傳說... Max hit 386/966 = 40.0% (F55 T5 charge, at the line, not >40%), 350/876=40% F13 and F25. Max turn <50%. Z=25, cd max 1. Keys 1:36 2:19 3:22 4:2 5:10 6:9 A31 D35 Z25 Q1. Main hand 普通・蘇爾特之紅木杖 at every boss F30-55 (staff-line counts not separately tallied). Aligned estimates: est>=50 12 turns, 0 under-estimates (6 over-estimates, D-defended). Feel 3/5 (推測). Shot: ar1-retreat-town.png; save rc12t-arcane-1-end.

## Dispatch 7: arcane 2-3 (rc12t 5378, 72c2778)
- ar2: DEAD F75 boss (守門者 蓄力大招 363 = 35% max HP at HP 1, 0 potions; turn 20). F30+ boss turns: F30 12, F35 17, F40 6, F45 6, F50 5, F55 8, F60 13, F65 16, F70 18, F75 20+. Potions 13 -> 8 at F50-60 -> 3 at F70 -> 0. Max hit 40.0% (350/876, 383/958, 408/1020, 415/1038, never >40%). Z=31, cd max 1. Main hand 優良・專注之柳木杖 at every boss. Keys 1:42 2:13 3:30 4:9 5:10 6:25 A34 D53 Z31 Q3. 0 aligned under-estimates (42 est>=50 turns, 36 over-estimates because D/Z defended). Feel 3/5 (推測). Shot ar2-death.png.
- ar3: RETREAT F29 (★ recommended, 1 retreatStar event; HP 1/876, 0 potions after F28). Potions 13 -> 11 (F10) -> 10 (F20) -> 0 at F28 (Z=15); no F30+ boss. Normal-fight heal 10% did not keep it alive through F25-F28 elite/charge fights. Max hit 350/876 = 40.0% (F25). 0 aligned under-estimates. Feel 1/5 (推測). Shot ar3-retreat-town.png.

# FINAL SUMMARY rc12t (72c2778) — 12 runs
Verified = read from log/DOM/events. 推測 = my judgement (feel scores, causes).

| run | end floor | death/retreat | boss vs normal | F30+ boss-turn median | max hit % | feel (推測) |
|---|---|---|---|---|---|---|
| bl1 | 45 | death | boss | 11.5 (6,9,14,26+) | 40.0 | 2 |
| bl2 | 80 | death | boss (charge 458=40%) | 6 (11 bosses) | 40.0 | 3 |
| bl3 | 51 | death | normal (霜骨怨靈 charge 260=30%, 0 pot, pre-F55) | 5 (7,5,16,5,5) | 40.0 (turn 50.0% borderline F36) | 2 |
| bw1 | 66 | death | normal (霜翼飛龍 charge 319=30%, 0 pot) | 16 | 40.0 | 2 |
| bw2 | 66 | death | normal (炎尾鐵偶 charge 332=30%, 0 pot) | 11.5 | 40.0 | 2 |
| bw3 | 65 | death | boss (霜角機兵 charge 496=40%, T32, 0 pot) | 14 | 40.0 | 2 |
| oc1 | 65 | death | boss (F65 塔主, 0 pot) | 14.5 | 40.0 | 2 |
| oc2 | 45 | death | boss (F45 塔主, 0 pot) | 12.5 (6,10,15+,36) | 40.0 | 2 |
| oc3 | 65 | death | boss (霜影骷髏, 0 pot) | 21.5 | 39.9 | 3 |
| ar1 | 57 | retreat (★ recommended) | after 0 potions/HP 20% | 11.5 | 40.0 | 3 |
| ar2 | 75 | death | boss (守門者 charge 363, HP 1, 0 pot) | 12.5 | 40.0 | 3 |
| ar3 | 29 | retreat (★ recommended) | after 0 potions/HP 1 at F28 | n/a (no boss F30+) | 40.0 | 1 |

Median end floor per school (Verified, computed from table): blade 51 (45/51/80), bulwark 66 (65/66/66), oc 65 (45/65/65), arcane 57 (29/57/75).
Gap highest-lowest school median: 66 (bulwark) - 51 (blade) = 15 floors. Within-school spread is far larger for blade (35) and arcane (46) than between medians; n=3 per school so 推測: school ranking is not statistically reliable.

## 0-potion normal-fight deaths after F55 (Verified)
- bw1 F66: 霜翼飛龍 normal fight, charge 319 (30% max HP), 0 potions.
- bw2 F66: 炎尾鐵偶 normal fight, charge 332 (30%), 0 potions.
- None for blade/oc/arcane. (bl3 died in a normal fight at F51 with 0 potions, which is before F55, so not counted.) 2 of 12 runs.

## Bulwark F30-65 boss turns (Verified; bw1/bw2/bw3, HP x0.3 in F30-65)
- F30: 3,3,3 | F35: 11,8,11 | F40: 13,9,14 | F45: 15,14,13 | F50: 17,22,14 | F55: 17,8,20 | F60: 17,15,16 | F65: 23,21,32+.
- Pooled 24 fights: median 14, mean 14.1, min 3 (F30 only), max 32+. F30 is trivially short (3 turns); F35-F65 are 8-32 turns and rise with floor. Bulwark outlasted other schools (end F65/66/66 in all runs) but all three ended with 0 potions, so the long fights drain potions rather than HP-burst killing it. 推測: boss HP x0.3 shortens fights but not enough to remove potion drain at F50+.

## Heal-sufficiency verdict
- Verified: normal-fight win heals 10% max HP (20% on two consecutive wins), visible in the map HP delta (heal events; oc3 range 0-20%, mostly 10/20).
- Verified: 10% = ~85-105 HP at max HP 850-1050, while normal-fight charge hits are ~30% (260-332) and boss charges 35-40% (350-496). One charge hit costs 3-4 heals.
- Verdict (推測 from the above): the heal is visible but NOT sufficient on its own after ~F50: 3 of 12 runs ended in a normal-fight death with 0 potions (bl3 F51, bw1 F66, bw2 F66) and 3 retreats/deaths came at 0 potions (ar1, ar3, plus all boss deaths). It works as chip recovery between fights, not as a replacement for potions.

## Retraction (Verified)
The bulwark "under-estimates by ~50%" (bw2 est 221 vs 332, bw3 est 247 vs 372) are RETRACTED: they were turn-misalignment false positives (the 332/372 hit was already in the log from the previous turn; the decision turn took 0). est20 is now aligned-only; across oc1-3 and ar1-3, 0 aligned under-estimates. The data.jsonl bw2/bw3 notes carrying the old claim are superseded by this retraction.

## Not verified / limits
- Feel scores, "why" explanations, and school-ranking claims are 推測. Arcane staff-line (魔力合流/以太分流) counts not tallied in rc12t.
- F100 clear was never reached in any run.
