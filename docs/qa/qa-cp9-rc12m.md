# cp9-rc12m acceptance — blade 1–2 (calibration reference only per producer)
- Build: http://localhost:5371/ ; badge shows **build 1f2f0e9 · CP4–CP9** (tag 7e16c37f is not displayed on the badge; commit 1f2f0e9 matches). Shots bl1-badge-1f2f0e9, bl2-badge-1f2f0e9 (taken before the 4x click, so speed shows 1x).
- Method: rc12l driver copied to /workspace/drvRC12m.js (drvsrv.py pointed at it), preset=postF20-blade&fresh, 13 potions (bought 10), 4x + 跳過動畫, ★ only. State reset before each run. Rules honoured: no game-code change, no debug/console, game server untouched. drvsrv.py stopped.
- Driver additions for rc12m: **tele** event on every telegraph (header 「敵人蓄力中！」 / 「首領蓄力中！」 / log 「X 正在蓄力！」): floor, turn, telegraph text, ★ key, decision+why text, HP, then outcome of that turn (turn damage, interrupted/defended/dodged flags, log). First two telegraphs per run screenshotted. Mid-way (bl2 from ~F100) added **h40** detector: any single hit >40% maxHP (boss or minion) → event + screenshot (new rule from producer).
- Data caveats (honest): the tele rows in data.jsonl store compact fields (floor, turn, boss?, key, turn_dmg, pct, interrupted/defended/dodged); full text only lives in the first events seen in screenshots. "defended" = ★D chosen or 格擋/防禦 in the turn log. A telegraph that spans several turns appears once per decision turn, and the damage lands on the turn the charge fires, not on the telegraph turn. h40 detector was NOT active for bl1 and for bl2 before F100, so non-boss single hits >40% there are checked only through boss max-hit tracking and per-turn damage (turn dmg is a sum of hits).

## Result summary — 已驗證 unless marked
| | bl1 | bl2 |
|---|---|---|
| Outcome | **F100 cleared**, alive F101 HP 897/1063, 3 potions, 102,705C run gold | **F100 cleared** (39-turn boss), alive F101 HP 1306/1306, **0 potions**, 105,610C |
| Death floor | none | none |
| Z cooldown max / same-turn after drink | 1 / 1 (all drinks; ≤8 ✔) | 1 / 1 |
| First 「藥水冷卻中（還剩 N 回合）」 | F28 「決策：★A·攻擊（藥水冷卻中（還剩 1 回合））」 shot bl1-F28-first-cooldown-text | F30 same text, shot bl2-F30-first-cooldown-text |
| Max single boss normal hit | 189 (17.8%, F90) | 214 (21.4%, F60) |
| Max boss charge hit | 342 (32.2%, F90 霜鬃遊俠 蓄力一擊) | 457 (35.0%, F100 吸血重擊) |
| Max single hit overall | 328 (**40.0% exactly**, F38 霜眼機兵 蓄力一擊 on 820 HP; not >40%) | 457 (35.0%) |
| Max single-TURN damage | 410/820 = **50.0%** (F38 t1, minion fight: 328 charge + 82) — not over 50% | 653/1306 = **50.0%** (F91 t1 minion fight; again F100 t17) — not over 50% |
| Hits >40% / turns >50% | none | none |
| 反傷 low-HP thorn attacks | none logged | none logged |
| 自動換武器 lines | 0 | 0 |
| Keys | A121 Q20 W44 E18 Z29 D52 | A101 Q32 W43 E21 Z25 D54 |
| Buff ★ picks | 25 | 28 |
| Boss interrupts (E/慈悲一擊) | 2 (F100) | 4 |
| Merchant buys | F82–F99 ×7 | F97 only |
| Feel (推測) | 7/10 | 6/10 |

## Per-boss tables (HP: start / last observed in fight / on map after; potions start→end; cd = max next-turn (same-turn))
### bl1
| F | turns | pot | HP start (last obs / map after) /max | cd | max normal | max charge |
|---|---|---|---|---|---|---|
| 30 | 3 | 19→19 | 739 (335 / 335) /820 | 0 | 115 | 0 |
| 35 | 3 | 18→18 | 700 (364 / 364) /820 | 0 | 0 | 0 |
| 40 | 1 | 17→17 | 779 (719 / 801) /820 | 0 | 60 | 0 |
| 45 | 1 | 17→17 | 832 (672 / 672) /832 | 0 | 0 | 0 |
| 50 | 7 | 17→16 | 832 (450 / 450) /832 | 1 (1) | 0 | 0 |
| 55 | 15 | 14→11 | 832 (352 / 352) /832 | 1 (1) | 147 | 0 |
| 60 | 1 | 8→8 | 850 (739 / 824) /850 | 0 | 0 | 0 |
| 65 | 9 | 10→10 | 850 (373 / 458) /850 | 0 | 0 | 0 |
| 70 | 18 | 10→8 | 1042 (763 / 869) /1063 | 1 (1) | 158 | 309 |
| 75 | 10 | 9→8 | 1059 (462 / 568) /1063 | 1 (1) | 144 | 284 |
| 80 | 23 | 8→4 | 1063 (687 / 687) /1063 | 1 (1) | 171 | 260 |
| 85 | 7 | 6→5 | 899 (468 / 468) /1063 | 1 (1) | 171 | 304 |
| 90 | 15 | 6→2 | 680 (648 / 648) /1063 | 1 (1) | 189 | 342 |
| 95 | 13 | 4→2 | 860 (942 / 942) /1063 | 1 (1) | 106 | 291 |
| 100 | 11 | 4→3 | 1063 (791 / 897) /1063 | 1 (1) | 151 | 221 |

### bl2
| F | turns | pot | HP start (last obs / map after) /max | cd | max normal | max charge |
|---|---|---|---|---|---|---|
| 30 | 6 | 19→18 | 819 (666 / 998) /832 | 1 (1) | 166 | 0 |
| 35 | 5 | 18→18 | 980 (488 / 488) /998 | 0 | 100 | 0 |
| 40 | 5 | 18→18 | 998 (424 / 524) /998 | 0 | 0 | 0 |
| 45 | 3 | 18→18 | 998 (756 / 856) /998 | 0 | 119 | 0 |
| 50 | 4 | 18→18 | 998 (671 / 771) /998 | 0 | 119 | 0 |
| 55 | 6 | 18→17 | 998 (568 / 568) /998 | 1 (1) | 80 | 0 |
| 60 | 6 | 17→16 | 998 (510 / 510) /998 | 1 (1) | 214 | 0 |
| 65 | 6 | 16→15 | 998 (998 / 998) /998 | 1 (1) | 0 | 0 |
| 70 | 13 | 15→13 | 998 (895 / 995) /998 | 1 (1) | 107 | 310 |
| 75 | 14 | 15→13 | 935 (563 / 563) /998 | 1 (1) | 155 | 200 |
| 80 | 24 | 12→8 | 1098 (514 / 514) /1098 | 1 (1) | 169 | 313 |
| 85 | 14 | 9→9 | 1233 (1153 / 1284) /1306 | 1 (1) | 128 | 0 |
| 90 | 3 | 9→9 | 1306 (579 / 579) /1306 | 0 | 189 | 0 |
| 95 | 21 | 9→7 | 1306 (1011 / 1142) /1306 | 1 (1) | 162 | 295 |
| 100 | 39 | 8→0 | 1306 (1306 / 1306) /1306 | 1 (1) | 205 | 457 |
(Odd "last obs > start" values e.g. F95 bl1 942 come from the heal/buff between observations; 0 in a hit column = the driver parsed no such hit, not proof of no hit.)

## Checkpoints (potions | HP/maxHP | run gold C; gold = 本趟 C shown on map)
- bl1: F10 15|741/820|900 · F20 16|820/820|3,630 · F30 19|739/820|8,558 · F40 17|779/820|15,465 · F50 17|832/832|24,593 · F60 8|850/850|36,023 · F70 10|1042/1063|49,143 · F80 8|1063/1063|64,787 · F90 6|680/1063|81,424 · F100 4|1063/1063|97,167 · F101 3|897/1063|102,705.
- bl2: F10 14|832/832|773 · F20 16|832/832|3,477 · F30 19|819/832|7,933 · F40 18|998/998|14,657 · F50 18|998/998|23,736 · F60 17|998/998|33,709 · F70 15|998/998|46,626 · F80 12|1098/1098|63,291 · F90 9|1306/1306|81,786 · F100 8|1306/1306|100,074 · F101 0|1306/1306|105,610.

## NEW: blade telegraph (重擊/蓄力/預告) log
Counts of telegraph decision-turns logged: bl1 77, bl2 75. Rows: data.jsonl type `tele`.
| ★ key at telegraph | bl1 n | bl2 n | note |
|---|---|---|---|
| D 防禦 | 51 | 54 | all 51/54 took 防禦 (招架/格擋 messages in log); the usual recommendation 「敵人蓄力中，HP 撐得住，不必喝藥」 |
| Z 喝藥 | 10 | 9 | chosen when HP too low to survive (「不防禦會死」/「防禦只靠保命剩1HP」); damage still landed in those turns (up to 410/653 turn dmg) |
| A/W/Q 攻擊類 | 8 | 5 | e.g. F46 t4 / F48 / F53 / F56 / F58 A/Z turn dmg 291–297 (35%), W at F70 t9 and F100 t35 (457 = 35%) |
| E 慈悲一擊 | 8 | 7 | no damage taken in those turns; interrupts recorded: bl1 F100 t4 (also dodged), bl2 F85 t9 and F95 t9 |
- Typical big landing: telegraphed boss/minion charge ≈ 35% maxHP (F70+: 372/1063 and 349–457 on bl2) when defended-or-not turn damage is listed; never >40% single hit. The one 40.0% hit was the F38 霜眼機兵 charge while HP 288/820 (★Z·生命藥水; turn dmg 410 = 50.0%).
- First two telegraphs (screenshots with the forecast panel 「預估傷害…防禦後…」): bl1 F31 t1 雷岩飛龍 正在蓄力！(★Z, HP 172/820, forecast 336–403, outcome 0 dmg that turn) and F31 t3 (★D·防禦, HP 410/820, charge landed 84 after 招招 / 招架); bl2 F23 t1 銳眼嗜血・雷鱗飛龍 (elite, ★D, HP 806/832, forecast 395–474) and F26 t1 反魔堅硬・風爪虎 (elite, ★D, HP 749/832, forecast 449–539). Shots: bl1-tele1-F31t1, bl1-tele2-F31t3, bl2-tele1-F23t1, bl2-tele2-F26t1.

## F30–65 vs F70+ (for calibration)
- bl1: F30–65 8 bosses, 40 turns (avg 5.0), potions 19→10; F70+ 7 bosses, 97 turns (avg 13.9), potions 10→3 with 7 merchant buys. Max normal 147 vs 189, max charge 0 vs 342.
- bl2: F30–65 8 bosses, 41 turns (avg 5.1), potions 19→15; F70+ 7 bosses, 128 turns (avg 18.3), potions 15→0, only 1 merchant buy. Max normal 214 vs 205, max charge 0 vs 457 (35%).
- Pattern (推測): F30–65 bosses die in a few turns; F70+ bosses are 3–4× longer and every telegraph lands ≈35% of maxHP — the F70+ jump is in length and charge size, not in a >40% spike.

## New-rule check (any single hit >40% maxHP = bug): none observed in bl1/bl2 (F38 328/820 = 40.0% is the closest; 40.0%, not >40%, flagged as borderline). No screenshot file exists for a >40% hit because none occurred.

---
# rc12m bulwark (bw1, bw2) — build 1f2f0e9, preset=postF20-bulwark&fresh
- Same procedure as blade (fresh save each run, buy potions to 13 — preset starts with 3, bought 10 —, 4x + 跳過動畫, ★ only, driver state reset). Start Lv11, HP ~772. Badge shots bw1-badge-1f2f0e9, bw2-badge-1f2f0e9. drvsrv.py started and stopped; no game-code change, no debug.
- Single-hit >40% detector (**h40**, every individual hit incl. minions, via 「對你造成 N」 and 「單擊最大 N」 in the turn log) was installed from the start of BOTH runs. Telegraph-screenshot stops were switched off for bulwark (tele rows still logged in data.jsonl).
- Both runs ended by **retreat (撤退回城, kept 100%) at the ★建議 when potions hit 0 and HP was low** — not by death. Two retreats were needed through a dialog (「撤退回城？」) that the driver auto-dismissed once; I accepted it by hand (UI click, dialog accept only).

| | bw1 | bw2 |
|---|---|---|
| End | **retreat at F72** (reached 72, passed 71): HP 138/1372, 0 potions. Came within 1 HP twice: F71 t10–11 HP 1 with 0 potions (★A/★Q 必敗), survived | **retreat at F47** (reached 47, passed 46): HP 289/1230, 0 potions after the F45 boss (23 turns) |
| Death floor | none (no death) | none |
| Bring-back | +2,639 EXP, +64,156C, Lv11→15, 82 items | +1,564 EXP, +27,382C, Lv11→14, 50 items |
| Z cooldown max / same-turn | 2 / 2 (F60 boss; ≤8 ✔) | 1 / 1 |
| First 「藥水冷卻中（還剩 N 回合）」 | F20 「決策：★A·攻擊（藥水冷卻中（還剩 1 回合））」 shot bw1-F20-first-cooldown-text | F10 「決策：★D·防禦（藥水冷卻中（還剩 1 回合））」 shot bw2-F10-first-cooldown-text |
| Max single boss normal hit | 200 (19.1%, F30 霜尾殭屍) | 187 (15.8%, F30 炎棘砲台) |
| Max boss charge hit | 433 (32.2% of 1344, F65 雷鱗飛蛾 蓄力一擊) | **478 (39.9% of 1197, F45 t9 風刃砲台 蓄力一擊)** — 478.8 is the 40% line, so NOT flagged; 1 HP short of a bug |
| Max single-TURN damage | 537/1344 = 40.0% (F63 t2, minion fight) | 488/1197 = **40.8%** (F45 t9: 478 charge + 10) |
| Hits >40% (bug rule) | none | none (near miss above; no screenshot because h40 did not fire; the frame is in no shot) |
| Turns >50% | none | none |
| 反傷 low-HP attacks | none | none |
| 自動換武器 | 1 (F3 尚可・浣熊之斧 → 精良・殺戮之短劍) | 2 (F22 → 普通・吸血鬼之斧, F35 → 普通・斧) |
| Keys | A134 Q37 W17 E2 Z23 D87 | A93 Q23 W15 E1 Z18 D33 |
| Buff ★ picks | 19 | 11 |
| Merchant buys | F47–F62 ×7 (up to 6 per stop; none at F64–69 since gold/price threshold 0 bought) | F37–F44 ×4 |
| Feel (推測) | 3/10 | 2/10 |

## Per-boss tables (HP start / last obs / on map after; potions start→end)
### bw1
| F | turns | pot | HP start (obs / map) /max | cd | max normal | max charge |
|---|---|---|---|---|---|---|
| 30 | 5 | 12→11 | 726 (422 / 1203) /1049 | 1 | 200 | 0 |
| 35 | 8 | 11→11 | 1203 (649 / 769) /1203 | 0 | 59 | 0 |
| 40 | 21 | 10→9 | 1133 (1073 / 1029) /1203 | 1 | 169 | 421 (35.0%) |
| 45 | 11 | 9→7 | 1185 (1109 / 1203) /1203 | 1 | 28 | 373 |
| 50 | 8 | 8→7 | 902 (983 / 1088) /1203 | 1 | 54 | 370 |
| 55 | 8 | 7→6 | 966 (1287 / 1287) /1287 | 1 | 14 | 385 |
| 60 | 18 | 6→2 | 647 (1320 / 1325) /1325 | 2 | 68 | 0 |
| 65 | 12 | 1→0 | 1075 (1248 / 1344) /1344 | 0 | 37 | 433 (32.2%) |
| 70 | 8 | 1→0 | 1029 (892 / 1029) /1372 | 0 | 0 | 0 |

### bw2
| F | turns | pot | HP start (obs / map) /max | cd | max normal | max charge |
|---|---|---|---|---|---|---|
| 30 | 4 | 7→7 | 1181 (464 / 445) /1181 | 0 | 187 | 0 |
| 35 | 14 | 6→4 | 1181 (556 / 674) /1181 | 1 | 180 | 319 |
| 40 | 14 | 5→3 | 980 (1048 / 1166) /1181 | 1 | 144 | 84 |
| 45 | 23 | 5→1 | 951 (736 / 845) /1197 | 1 | 40 | 478 (39.9%) |

## Checkpoints (potions | HP/maxHP | run gold C on map)
- bw1: F10 13|912/958|790 · F20 13|958/958|3,688 · F30 12|726/1049|8,583 · F40 10|1133/1203|15,519 · F50 8|902/1203|24,890 · F60 6|647/1325|33,864 · F70 1|1029/1372|44,436 · F72 (retreat) 0|138/1372|49,351. F80–F100 not reached.
- bw2: F10 13|740/925|639 · F20 10|931/965|3,387 · F30 7|1181/1181|8,141 · F40 5|980/1181|14,538 · F47 (retreat) 0|289/1230|27,382 (that figure is the bring-back total from the retreat screen; the map gold was not captured). F50+ not reached.

## F30–65 vs F70+ (bulwark)
- bw1 never reached F75+; F30–65 = 8 bosses, 91 turns (avg 11.4), potions 12→0 (the bulwark runs out of potions by F65, at ~13 held at the start). F70 boss (8 turns) was fought with 1 potion and HP 1029/1372 then F71 minions took HP to 1 with 0 potions.
- bw2: F30–45 = 4 bosses, 55 turns (avg 13.8), potions 7→1.
- F70+ comparison not possible (neither run reached F75).

## Telegraph log (kept though not required): bw1 113 telegraph decisions (D 86, Q 12 [3 interrupts], A 8, Z 7); bw2 49 (D 33, Z 7, Q 6 [2 interrupts], A 2, W 1). Big landings ≈35% maxHP on minions (430–480 dmg) and bosses (F45 478 = 39.9%). Rows: data.jsonl type `tele`.

## Findings (推測 unless noted)
- 已驗證: no single hit >40% maxHP in bw1/bw2 with the detector active from F1; closest was 478/1197 = 39.9% (bw2 F45 boss charge).
- 已驗證: both bulwark runs run out of potions and retreat (F72, F47); bulwark is much weaker than blade at these rc12m settings (blade cleared F100 twice).
- 推測: bulwark potion drain at F30–45 (−2 to −4 per boss, long 14–23 turn fights) is the cause; fights here are ~3× longer than blade's 5-turn F30–65 bosses.

---
# rc12m bw3 + ar1 (build 1f2f0e9) — driver changes for this batch
- Retreat confirm 「撤退回城？」 is now **accepted** by the driver (page.once('dialog' → accept) at the start of each call); retreat completed with no manual click in both runs.
- h40 detector widened: any single hit ≥ 39% of max HP (within 1% of the 40% line) → event + screenshot file; event has `over` (true only if >40%). Active from F1 in both runs.
- Retreat rule unchanged: ★ itself recommends 撤退回城 (potions 0, low HP); runs end there (kept 100%).

## bw3 (postF20-bulwark&fresh) — 已驗證 unless marked
- Start Lv11, ~772 HP, potions 3→13 (bought 10). Badge shot bw3-badge-1f2f0e9.
- **End: retreat at F62** (reached 62, passed 61); HP 109/1082, 0 potions. Came within 1 HP: F61 t6–7 HP 1 with 0 potions (★A/★Q 必敗), survived and retreated. Bring-back +2,175 EXP, +47,054C, Lv11→15, 68 items. No death.
- Z cooldown max **3** (F55 boss; ≤8 ✔), same-turn 3. First text F15 「決策：★A·攻擊（藥水冷卻中（還剩 1 回合））」 shot bw3-F15-first-cooldown-text.
- **Near-40% hit (within 1%) — saved**: F55 turn 7 炎角騎士 蓄力一擊 **432 on max HP 1082 = 39.9%** (40% line = 432.8) — not over; it was blocked (格擋). Shot `bw3-near40-F55t7-432of1082.png`; data.jsonl type h40 (over:false). Same turn total **481 = 44.5%** (432 + 49 thorn 反傷 from 銳眼烈焰・守門者・霜岩蜥蜴); a turn total, not a single hit; under the 50% turn rule.
- Other: F41 t6 turn damage 468/1025 = 45.7% (minion fight, ★A; made of several hits, no single ≥39%). 
- Max boss normal hit 173 (16.9%, F30); max boss charge 432 (39.9%, F55). Max single-turn 481 = 44.5%. Hits >40%: none. Turns >50%: none. 反傷 low-HP ★ attacks: none logged.
- 自動換武器 ×2 (F17 尚可・浣熊之斧 → 普通・斧; F21 → 精良・戰鬥法師之斧). Keys A102 Q30 W12 E3 Z22 D51. Buff ★ picks 16. Merchant buys F44–F59 ×7 (1–7 each). Feel (推測): 3/10.

| F | turns | pot | HP start (obs / map) /max | cd max (same-turn) | max normal | max charge |
|---|---|---|---|---|---|---|
| 30 | 4 | 11→10 | 845 (852 / 955) /1025 | 1 (1) | 173 | 0 |
| 35 | 3 | 10→10 | 1025 (735 / 744) /1025 | 0 | 49 | 0 |
| 40 | 6 | 9→9 | 1025 (468 / 571) /1025 | 0 | 0 | 0 |
| 45 | 19 | 8→5 | 624 (667 / 770) /1025 | 2 (2) | 0 | 358 (34.9%) |
| 50 | 8 | 4→2 | 812 (704 / 812) /1082 | 2 (2) | 0 | 378 (34.9%) |
| 55 | 14 | 3→1 | 434 (704 / 812) /1082 | 3 (3) | 111 | 432 (39.9%) |
| 60 | 7 | 2→1 | 812 (704 / 434) /1082 | 1 (1) | 0 | 0 |
Checkpoints (potions | HP/maxHP | run gold C): F10 13|721/748|746 · F20 11|595/838|3,434 · F30 11|845/1025|7,841 · F40 9|1025/1025|14,874 · F50 4|812/1082|23,108 · F60 2|812/1082|31,980 · F62 (retreat) 0|109/1082|36,195. F70+ not reached.
F30–65 vs F70+: only F30–60 reached (7 bosses, 61 turns, avg 8.7, potions 11→1). No F70+.

## ar1 (postF20-arcane&fresh) — 已驗證 unless marked
- Start Lv14, 760 HP, potions 3→13 (bought 10). Badge shot ar1-badge-1f2f0e9.
- **End: retreat at F57** (reached 57, passed 56); HP 77/760, 0 potions. Came within 1 HP: F56 t4 (★A 必敗). Bring-back +2,224 EXP, +43,329C, Lv14→16, 69 items. No death.
- **Max HP stayed 760 the whole run** and the main hand stayed 普通・烏木杖+2 at every boss (F30–F55) — no auto-equip (0 自動換武器 lines), so no upgrades; same pattern as rc12l ar2.
- Z cooldown max 1, same-turn 1. First text F13 「決策：★1·烈焰爆破（藥水冷卻中（還剩 1 回合））」 shot ar1-F13-first-cooldown-text.
- **Staff lines: 「你的法杖：魔力合流」 ×4 (F5, F45, F51, F56); 「以太分流」 ×3 (F30, F45, F51).**
- Keys: 1:63 2:28 3:27 4:4 5:7 6:1 · A11 Q1 D41 Z25 (Z25 drinks). Buff ★ picks 14. Merchant buys F52, F54 only (4–5 each).
- Hits: max boss normal 161 (21.2%, F25 堅硬・塔主・霜牙虎); max boss charge 112 (14.7%, F40); max single-turn 265/760 = 34.9% (F25 t1). Nothing within 1% of 40%, nothing >40%, no turn >50%. 反傷 low-HP ★ attacks: none logged. Feel (推測): 2/10 — potions gone by F55, no HP growth.

| F | main hand | turns | pot | HP start (obs / map) /max | cd | max normal | max charge |
|---|---|---|---|---|---|---|---|
| 30 | 普通・烏木杖+2 | 11 | 16→15 | 760 (593 / 669) /760 | 1 (1) | 0 | 0 |
| 35 | 普通・烏木杖+2 | 11 | 14→12 | 760 (609 / 685) /760 | 1 (1) | 151 | 0 |
| 40 | 普通・烏木杖+2 | 14 | 14→12 | 760 (275 / 351) /760 | 1 (1) | 153 | 112 |
| 45 | 普通・烏木杖+2 | 18 | 12→9 | 760 (317 / 393) /760 | 1 (1) | 151 | 0 |
| 50 | 普通・烏木杖+2 | 20 | 9→5 | 760 (371 / 447) /760 | 1 (1) | 151 | 0 |
| 55 | 普通・烏木杖+2 | 27 | 6→0 | 407 (383 / 459) /760 | 1 (1) | 151 | 0 |
Checkpoints: F10 16|760/760|760 · F20 17|760/760|3,899 · F30 16|760/760|8,492 · F40 14|760/760|16,051 · F50 9|760/760|25,145 · F57 (retreat) 0|77/760|43,329 (map gold; the bring-back total was 43,329C as well).
F30–65 vs F70+: only F30–55 (6 bosses, 101 turns, avg 16.8, potions 16→0). No F70+.
- Takeaway (推測): both bw3 and ar1 end around F57–62 once 13 starting potions are gone; max HP/gear do not grow in ar1 (compare rc12l ar1 which reached 1406 HP), so ar1 is gear-luck dependent. Blade (rc12m) is the only class that cleared.

## ar2 (arcane 2) rc12m — build 1f2f0e9 (badge shot ar2-badge-1f2f0e9.png)
- Start 13 potions, ★ only, 4x, skip anim. **Died F60** (turn 7, 0 potions; last hit 129 = 18% maxHP; turns -229/-65/-129). 已驗證
- First cooldown text: F15 「藥水冷卻中（還剩 1 回合）」 (shot ar2-F15-first-cooldown-text.png). Cooldown max 1 (same-turn 1). ≤8 OK.
- Staff lines: 魔力合流 ×7, 以太分流 ×3. Telegraph rows logged: 63 (tele events in jsonl run data). 自動換武器 ×2 (main hand 優良・狐狸之柳木杖 → 普通・毀滅之鐵木杖 by F55).
- Max HP 760 until F40, then 736 from F45 (reduced by -24, 已驗證 values in HUD).
- Hits: max boss normal 201 (27.3%, F55); max charge 294/736 = **39.95%** (F60 t1 雷骨雙頭龍 蓄力一擊) — within 1% of line, NOT >40%, shot ar2-F60-t1-hit294-of-736-39.9pct.png; no hit >40%. Max single-turn 382/760 = **50.3%** (F35 t10: 231 重擊 + 151) — shot ar2-F35-t10-turn50pct.png. 反傷 low-HP ★ attacks: none logged. Feel (推測): 3/10.

| F | main hand | turns | pot | HP start→end(map) /max | cd | max normal | max charge |
|---|---|---|---|---|---|---|---|
| 30 | 優良・狐狸之柳木杖 | 11 | 14→12 | 760→685 /760 | 1 (1) | 148 | 0 |
| 35 | 優良・狐狸之柳木杖 | 19 | 13→9 | 760→475 /760 | 1 (1) | 151 | 231 |
| 40 | 優良・狐狸之柳木杖 | 16 | 11→8 | 760→291 /760 | 1 (1) | 120 | 224 |
| 45 | 優良・狐狸之柳木杖 | 17 | 8→6 | 736→543 /736 | 1 (1) | 88 | 169 |
| 50 | 優良・狐狸之柳木杖 | 12 | 8→5 | 434→386 /736 | 1 (1) | 147 | 0 |
| 55 | 普通・毀滅之鐵木杖 | 28 | 7→0 | 534→500 /736 | 1 (1) | 201 | 245 |
Checkpoints: F10 17|760/760|741C · F20 17|760/760|3,672C · F30 14|760/760|8,797C · F40 11|760/760|15,997C · F50 8|434/736|24,122C · F60 1|391/736|34,495C · death F60 0|0/736.
F30–65 vs F70+: F30–55 only (6 bosses, 103 turns, potions 14→0). No F70+.

## ar3 (arcane 3) rc12m — build 1f2f0e9 (badge shot ar3-badge-1f2f0e9.png)
- 13 potions, ★ only, 4x, skip anim. **Died F70** (boss t14, 0 potions; last hit 144 = 20%; turns -253/-49/-144). 已驗證
- First cooldown text F15 「藥水冷卻中（還剩 1 回合）」 (shot ar3-F15-first-cooldown-text.png); cooldown max 1, same-turn 1.
- Staff lines: 魔力合流 ×14, 以太分流 ×5. 自動換武器 ×1 (F27: 普通・烏木杖+2 → 普通・貓頭鷹之柳木杖). Interrupts 2. Tele rows logged: 61.
- Max HP 760 → 724 from F50. Main hand stayed 普通 quality (貓頭鷹之柳木杖) at every boss F30–65.
- Hits: max boss normal 157 (20.7%, F30); max charge 229/760 = 30.1% (F45 塔主 重擊); max single-turn 265/760 = 34.9% (F15 t1). No hit >40% or within 1% of 40%; no turn >50%. 反傷 low-HP ★ attacks: none logged. Feel (推測): 4/10.

| F | main hand | turns | pot | HP start→end(map) /max | cd | max normal | max charge |
|---|---|---|---|---|---|---|---|
| 30 | 普通・貓頭鷹之柳木杖 | 8 | 11→10 | 760→411 /760 | 1 (1) | 157 | 108 |
| 35 | 同上 | 13 | 10→8 | 760→534 /760 | 1 (1) | 0 | 0 |
| 40 | 同上 | 12 | 8→6 | 760→685 /760 | 1 (1) | 151 | 131 |
| 45 | 同上 | 27 | 8→3 | 572→496 /760 | 1 (1) | 151 | 229 |
| 50 | 同上 | 12 | 4→2 | 760→557 /724 | 1 (1) | 133 | 0 |
| 55 | 同上 | 16 | 4→2 | 449→724 /724 | 1 (1) | 141 | 0 |
| 60 | 同上 | 22 | 4→1 | 414→601 /724 | 1 (1) | 144 | 0 |
| 65 | 同上 | 21 | 3→0 | 724→515 /724 | 1 (1) | 144 | 0 |
Checkpoints: F10 16|760/760|615C · F20 15|760/760|3,779C · F30 11|760/760|8,375C · F40 8|760/760|15,401C · F50 4|760/760|22,616C · F60 4|414/724|31,497C · F70 2|443/724|42,149C · death F70 0|0/724.
F30–65 vs F70+: F30–65 8 bosses, 131 turns (avg 16.4), potions 11→0; F70 boss killed us (t14) with no potions left; no F70+ clear data.

## CORRECTION (dev-verified, 2026-10-29): ar2 F35 "turn >50%" was a misread
The battle log prints the 「第N回合：受到 X」 summary line BEFORE that turn's hits, so the 231 重擊 listed above the summary belonged to the PREVIOUS turn. My driver summed all 「對你造成」 hit lines in the log window, double-counting hits from two turns. **ar2 F35 turn 10 was NOT >50%** (382/760 = 50.3% was wrong); the summary line said 受到 151 for that turn. Real ar2 max single turn = 231 = 30.4% (the F35 重擊, previous turn). Screenshot ar2-F35-t10-turn50pct.png shows the log with the misattributed lines. The same overcounting may affect other rc12m/rc12n "max single turn" figures that were built from hit-line sums (e.g. rc12n bl1/bl2 35.0% values, rc12m tele dmg/dmgpct columns); they are upper bounds, 推測. Driver drvRC12n.js now uses the summary line's 受到 N per turn (fallback to hit lines only if no summary line); max-hit uses 單擊最大.
