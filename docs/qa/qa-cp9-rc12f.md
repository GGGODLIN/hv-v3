DONE rc12f
# cp9-rc12f acceptance (server :5364, badge e5ec28f) — blade 1 & 2
Method as rc12d: ?cp9&cp8&cp6&preset=postF20-blade&fresh, 10 potions bought (13), 4x + 跳過動畫 ticked (verified), 忽略並出發, 深淵塔 (進入深淵塔 — NOT 試煉之塔, which ends at F20), ★-only keys (data-primarykey click), ★ map node, ★ buff, merchant buy-to-threshold (thr 8, 1/merchant). Driver: page-resident driver (drvRC12d logic + per-turn damage accounting from 「對你造成 N」 log sum, >50% maxHP / boss non-charge hit >40% triggers). Cap F101. Dumps qa-saves/rc12f-blade-1-end.json, -2-end.json. Shots qa-cp9-rc12f-shots/bl1-*, bl2-*. Notes qa-cp9-rc12f-notes.txt. (A discarded first attempt entered 試煉之塔 and 'cleared' at F20; not counted.)

## Results (both runs: reached F100, CLEARED F100 boss, alive at F101, no death)
| run | F100 reached | F100 boss | pot start/F30 | pot at end | Z used | HPmax end | keys |
| bl1 | yes | cleared t6 | 13 / 25 | 40 | 12 | 1247 | A71 W47 E20 Q33 D9 Z12 |
| bl2 | yes | cleared t1 | 13 / 21 | 26 | 17 | 1429 | A110 W38 E16 Q25 D26 Z17 |
Per-boss (turns, pot start→end) in qa-cp9-rc12f-data.jsonl. bl1 boss turns F30-100: 96 total (1,5,9,6,6,3,2,6,6,2,6,8,8,7,6); bl2 85 (4,4,7,9,10,1,12,4,5,6,7,3,6,6,1). Potions never a constraint (held ≥17 at every boss start, ≥21 bl1 all, min 17 bl2 F75-80). Merchants: 8 entered each, all skipped (held ≥ thr 8).

## NEW checks
(a) Turn dmg > 50% maxHP: NONE in either run (max turn damage bl1 277, bl2 285 ≈ 20-22% maxHP). No shots needed. (b) Boss normal hit >40% maxHP: NONE. (Charge hits seen max ~236-313 ≈ 20%.) 
(c) F100 reached both, potions at end 40 / 26; start/end per boss in data.jsonl (all within ±2 except bl1 F35-F100 (-1 or +1)).
(d) Buff lists in notes (bl1 28 picks, bl2 26). NEW tag 「部分無效」 only on 不動之盾 (never ★). From ~F65-70 on, every pick-3 = 1 fully applicable + 不動之盾【部分無效】 + 1 【無效】 → ★ always the single applicable card; never on tagged cards. BUT ★ often picks 磐石 cards with red 「搭盾才有格擋」 untagged for shieldless blade (震盪 盾擊暈眩 fully dead, 靈巧/厚皮/不滅/活力/堅守 partly or live) — flag. Driver 'viol' flags from F70 (bl1) were false positives (counted 部分無效 as inapplicable).
(e) Staff mechanics: n/a (blade), none seen.
Boss summary (F30+): skills 2-6/boss, strict 0-dmg 1-5/boss, interrupts regex 0 (E 粉碎擊 ★ fires, stun not logged as 被打斷; undercount), D-on-charge rare (bl1 1, bl2 4: F60 吸血重擊 236/141 with 防禦反擊 + 「1回合後重新蓄力」 ✔).
Checks: decision line vs red text: c6 occurrences bl1 F33t3 (HP209 minion charge), bl2 F26t2 (HP125), F33t3 — all ★Z, decision == red sentence; F33 panel also shows 防禦效果少受約220 advisory (info, same pattern as before). 「此戰幾乎必敗」 never shown. Retreat ★ / low-HP map: never exercised (pot ≥17, HP ≥55% at rests).
Shots: bl1-buff-pick3-first, bl1-F33t3-HP209-minion-charging-c6-decision-Z-vs-red, bl1-F101-reached-alive, bl2-buff-pick3-first, bl2-F26t2-HP125-c6-decision-Z-vs-red.
## Feel 推測
9/10 — blade ★-only is fast and safe to F100 (2/2 clears, ≤1429 HP, never >22% HP in one turn, potions piling up 26-40 unused, merchants never needed). Weak spots: bosses die in 1-12 turns so F100 isn't threatening (推測 difficulty curve flat for blade); ★ buff keeps picking shield-only 磐石 cards late; potion hoard suggests merchant/thr irrelevant.

## Update: blade 3 CANCELLED by producer; bulwark 1 & 2 run (cp9-rc12f, e5ec28f, 深淵塔, ★-only, cap F100 boss cleared)
| run | F100 boss | pot end | Z | HPmax | keys | boss turns F30-100 (sum) |
| bw1 | cleared t7, pot 38→38 | 38 | 12 | 1451 | A153 Q56 W32 D65 E20 | 176 |
| bw2 | cleared t8, pot 22→22 | 22 | 22 | 1409 | A195 Q53 W22 D66 E15 | 226 |
(a) turn dmg >50% maxHP: none either run. (b) boss normal hit >40%: none; one MINION 蓄力一擊 470 (46% of 1025) bw1 F55t7 — shot bw1-F55t7-minion-charge-470-46pct-b40. (c) F100 reached+cleared both; pot start/end per boss in data.jsonl. (d) buff lists in notes; 部分無效 never offered to bulwark; ★ never on 無效. (e) staff mechanics not seen.
Checks: c6 decision==red in all 4 (bw1 none, bw2 F45/F60/F70 → ★Z "先喝藥"); 必敗 never; retreat★ never. Interrupts: Q 盾擊 ★ interrupts charge + stun (count 1-2/boss at ~6 bosses; regex double counts). Strict 0-dmg: not reliable this round (see notes).
Shots: bw1-buff-pick3-first, bw1-F55t7-minion-charge-470-46pct-b40, bw2-F45t13-HP368-c6-decision-Z-vs-red.
## Feel 推測
Bulwark 8/10: also clears F100 2/2, but fights are 3-8x longer than blade (avg 12-15 turns, 34-turn F30 outlier, D×65), potions flat/rising (12-22 left), HP troughs 225-368 at c6 moments — more tension than blade; F55 minion charge hits 46% HP is the biggest spike. Merchants unused (held ≥ thr).

## Update: oc 1 & 2 (cp9-rc12f, e5ec28f, 深淵塔, preset postF20-oc, 13 pot, ★-only, merchant to thr, cap F100 cleared)
(First oc1 attempt invalid: driver state carried over from bulwark; aborted at F25, restarted fresh, not counted.)
| run | result | floor | pot end | Z | HPmax | keys | boss turns F30+ |
| oc1 | DIED F45 boss t13 (HP1, 0 pot, 必敗 ★A) | 45 | 0 | 28 | 858 | A67 Q25 W12 E5 D58 | F30 46, F35 30, F40 25, F45 13 (sum 114, median 27.5) |
| oc2 | F100 boss CLEARED (6t), alive F101 HP 994/1178 | 101 | 19 | 24 | 1178 | A96 Q55 W41 E22 D95 | 2,20,32,3,21,22,9,13,13,3,18,17,13,3,6 (sum 195, median 13) |
Potions boss start->end: oc1 F30 20->11, F35 11->5, F40 5->0, F45 1->0. oc2 F30 19->19, F35 21->19, F40 18->13, F45 16->16, F50 16->12, F55 14->11, F60 14->14, F65 14->14, F70 16->15, F75 16, F80 15->14, F85 15, F90 17->16, F95 17, F100 20->19. Bosses are bimodal in oc (2-3 turns when lucky vs 20-46 with D/Z churn); oc1 spiraled F30-F40 (46/30/25t drained 20->0 pot; merchants 1 bottle/each cap at F39/F44 not enough), oc2 never below 11.
(a) turn dmg >50% maxHP: none in either run (max single-turn hit 447 minion charge oc2 F55t20 = 49% of 912, left HP1; shot). (b) boss non-charge hit >40% maxHP: oc1 none; oc2 F80 t18 hit 496 (43% of 1163) and F90 t11 494 (42%) — driver flagged non-charge but could not tell charge vs normal; screenshot taken after-fight (victory screen) = oc2-F80t18-...; F90 no shot. 推測 likely minion/boss charge not tagged by 首領蓄力中 text.
Buff ★: oc1 11 picks, oc2 30 picks (lists in notes); ★ never on 【無效】; 部分無效 never seen for oc; viol 0. oc2 ★ took 不動之盾 at F80 (untagged for oc), 震盪 F70, 厚皮 F90 (shield-ish cards).
Staff Coalesced Mana/Ether Tap: not seen (regex 凝聚魔力|以太 0 hits both runs). Decision vs red: all c6 (oc1 15, oc2 9) ★Z == red 「先喝藥」; F40t18 oc1 V「存活優先」★D consistent; rc12d mismatch did not recur. 必敗 seen once oc1 F45t12 HP1/0pot ★A (shot). Retreat ★ / lowmap: never triggered.
Shots (qa-cp9-rc12f-shots/): oc1-buff-pick3-first, oc1-F25t5-HP140-c6-decision-Z-vs-red, oc1-F40t18-HP429-charging-V-decision-D-pot3, oc1-F45t12-HP1-0pot-A-bisheng, oc1-death-F45, oc2-buff-pick3-first-with-inapplicable, oc2-F35t16-HP88-c6-decision-Z-vs-red, oc2-F55t20-HP1-minion-charge-447-Z, oc2-F80t18-boss-hit-496-43pct-b40-victory-screen, oc2-F101-reached-alive. Dumps qa-saves/rc12f-oc-1-end.json, rc12f-oc-2-end.json.
## Feel 推測
oc 6.5/10 — high variance: oc2 clears F100 safely (pot never <11), oc1 dies F45 after a 46-turn F30 + 30t F35 + 25t F40 chain with merchant-cap 1 bottle not recovering; 推測 oc F30-F40 boss length (median 27 in oc1) is the weak spot, and 1-bottle merchant cap + threshold 7-8 too small to recover.

## Update: arcane 1 & 2 (cp9-rc12f, e5ec28f, 深淵塔, preset postF20-arcane, 13 pot, ★-only incl. spell keys, merchant to thr, cap F100)
| run | result | floor | pot end | HPmax | boss turns F30+ (known) | median |
| ar1 | DIED F60 boss t27 (HP1, 0 pot, 必敗 ★A) | 60 | 0 | 912 | F30 13, F50 16, F55 38, F60 27 (F35/40/45 not captured) | 21.5 |
| ar2 | DIED F55 boss t16 (HP1, 0 pot, 必敗 ★A) | 55 | 0 | 760 | 12,10,19,21,16,16 | 16 |
Potions boss start→end: ar1 F30 20→18, F50 13→10, F55 13→2, F60 4→0. ar2 F30 15→13, F35 14→12, F40 12→8, F45 8→3, F50 5→1, F55 1→0.
(a) turn dmg >50% maxHP: none. (b) boss normal hit >40%: none (max 260/912, 202/760); killing hits were charge hits 145-151 (16-20%) at HP1. Charge warning ("首領蓄力中") preceded D turns; no shot needed.
Staff Coalesced Mana/Ether Tap: not seen (regex 凝聚魔力|以太 0 hits both; weapon was axe/太刀-type, spells 1-6 used by ★). Buff ★ never on 【無效】; 部分無效 only 不動之盾. Decision vs red: c6 ★Z "先喝藥" identical to red every time (ar1 F20t4, ar2 F30t5 shots). 必敗: both deaths at HP1/0 pot ★A. Retreat★/lowmap never triggered (no map moment with HP<30%). 
Shots: ar1-buff-pick3-first, ar1-F20t4-HP145-c6..., ar1-F60t26-HP1-0pot-A-bisheng, ar1-death-F60, ar2-buff-pick3-first, ar2-F30t5-HP105-c6..., ar2-F55t15-HP1-0pot-A-bisheng.
## Feel 推測
Arcane 3/10: boss fights are 10-38 turns of D/Z churn (★ spends turns on D 防禦 + Z), potions drain 1-2 per 3-5 turns, merchants (1 bottle each) can't refill, HPmax stuck 760-912; dies F55-60 both runs (ar vs blade/bulwark/oc2 clearing F100). Attrition death, not burst.
