NEXT: oc 8

## blade 1 (build d2ab55e)
- Reached F30 (passed 29). Died F30 boss, turn 43: 163 dmg (20% max HP) from 迅捷・深淵之王・雷岩鶴, potions 0 left. 死亡畫面「共受 163」(last turn; "第 43 回合共受 163 傷害").
- Potions: start 13 (3 + 10 bought), merchants 5 (1 per merchant), drops 0. In-fight drinks 18 (≥40% HP w/o lethal forecast: 0), map drinks 0.
- Normal fights A vs non-A: A 51 / non-A 9 (driver counts bosses separately; boss actions F5 5, F10 11, F15 11, F20 23, F25 30, F30 51 = 130 total).
- >=20% turns: warned 4 / unwarned 0. Max single turn 34.3%. 「防禦也擋不住」: 0.
- (a) Z hinted on cooldown: 0. 
- (b) 7 contradictions "HP 危險 … ≥ HP" shown next to "防禦後撐得住，先不喝藥": F20 t4, F20 t9, F25 t4, F25 t14, F30 t3, F30 t5, F30 t9, F30 t14 (8 logged by regex incl. F30 t14; list in jsonl). Z>D order seen on other lethal turns (Z first).
- (c) revives 7 events: txt "2 回合後重新蓄力" present in all. No charge within 2 turns: yes F10, F15, F25, F30 (4); F20 flagged charged (possibly tip-text false positive, unverified); F5 not resolved. Heavy-hit (1-turn) case: not reliably detected (driver matched charge announcements only) -> unverified.
- (d) Q repeated same turn: 4 (heuristic, floor/turn not recorded).
- (e) back-to-back 50% heavy: 0.
- (h) No stun of a boss ever occurred / 「暈眩抵抗中」 never seen; no stunres shot. Driver false-positive hs entries (5) ignored.
- (i) merchant entries: 5.
- (g) potion sources start 13 / merchant 5 / drops 0.
- (f) boss actions F30 = 51 (driver action count; in-game last turn 43).
- Shot: qa-cp9-rc8-shots/death-blade-1.png

## blade 2 (build d2ab55e)
- Reached F35 (passed 34). Died F35 boss turn 45: 157 dmg (20% max HP) from 嗜血・守門者・霜鱗騎士; potions 0 left. 死亡畫面「共受 157」(last turn).
- NOTE: driver state was lost mid-run (browser page object reset after an errored call) at F25; counters below cover F25 (partly)–F35 only; F1–F25 values for drinks/merchants/boss actions were carried from the last read before the loss.
- Potions: start 13, merchants 7 visits (7 bought), drops 0. In-fight drinks 19 total (≥40% HP w/o lethal forecast: 0), map drinks 0.
- Normal fights A / non-A (from F25 on): 23 / 5. Boss actions: F5 6, F10 12, F15 12, F20 16, F25 15, F30 35, F35 59.
- >=20% turns (F25+): warned 18 / unwarned 2. Max single turn 39.7%. 「防禦也擋不住」: 0.
- (a) 1 case: F25 turn 10, HP 167 - Z hinted while disabled. Screenshot NOT captured (state was lost / fight ended before I could shoot). No further cases F25-F35.
- (b) Z>D order on lethal turns; "HP 危險 ≥ HP" next to "防禦後撐得住，先不喝藥" on F30 t3,t4, F31 t1, F35 t3,t7,t11,t15,t16,t21 (9 cases, F25+ only).
- (c) revive events after reinstall: none detected (driver recorded 0 revive/heavy events F25-F35); unverified for F1-F25.
- (d) Q repeats: 0 (F25+).
- (e) back-to-back 50% heavy: 0.
- (h) 「暈眩抵抗中」 never seen; boss never stunned by the driver's recommended actions; no stunres shot. Not a verified miss.
- (i) merchant entries: 7.
- (g) potion sources start 13 / merchant 7 / drops 0.
- (f) F30 boss actions 35; F35 59 (driver action counts; in-game last turn 45).
- Shot: qa-cp9-rc8-shots/death-blade-2.png

## blade 3 (build d2ab55e)
- Reached F36 (passed 35). Died on F36 normal fight (not boss): 第 3 回合共受 236 傷害 (20% max HP) from 闇鐮刺客; last 3 turns -236 each; potions 0 left. 死亡畫面「共受 236」.
- Potions: start 13, merchants 5 (5 bought), drops 0. In-fight drinks 14 (≥40% HP w/o lethal forecast: 0), map drinks 4.
- Normal fights A / non-A: 57 / 8. Boss actions: F5 9, F10 17, F15 7, F20 11, F25 10, F30 21, F35 28.
- Boss in-game last turn: F5 7, F10 12, F15 6, F20 8, F25 7, F30 16, F35 22.
- >=20% turns: warned 0 / unwarned 1. Max single turn 39.9%. 「防禦也擋不住」: 0.
- (a) 0.
- (b) 0 contradictions this run (no "HP 危險 ≥ HP" next to "撐得住"); no bug shot. Lethal-turn hint orders: F10t4 Z>D, F30t4 D, F30t6 Z>D, F30t13 Z>D, F31t2 Z>D, F35t4 Z>D, F35t9 D, F35t21 D (Z absent = potion cooldown/none; D-only when Z unavailable, no interrupt skill/S offered).
- (c) heavy hits landed (「重擊！對你造成」) and next turn charge-free: F10 t5 yes, F30 t5 yes, F30 t10 yes, F35 t10 yes (195, 招架), F35 t15 yes; F35 t22 unresolved (not confirmed, driver loop). Revives (2 turns): F5 yes, F10 yes, F25 yes, F30 yes, F35 yes; F15 unresolved (fight ended within 2 turns); F20 unreliable (tip text matches 蓄力). Heavy text 「1 回合後重新蓄力」-style text not matched by driver on heavy hits (txtOK false on heavy events) -> text for heavy not verified.
- (d) Q repeats in same turn: 4 (heuristic).
- (e) back-to-back 50% heavy: 0.
- (h) No stun of boss by driver; 「暈眩抵抗中」 never seen; no stunres shot. 
- (i) merchant entries: 5.
- (g) potion sources start 13 / merchant 5 / drops 0.
- (f) F30 turns 16, F35 turns 22 (in-game).
- Shot: qa-cp9-rc8-shots/death-blade-3.png

## blade 4 (build d2ab55e)
- Reached F41 (passed 40). Died on F41 normal fight turn 1: 160 dmg (20% max HP) from 風毒飛蛾; potions 0 left. 死亡畫面「共受 160」.
- Potions: start 13, merchants 8 (8 bought), drops 0. In-fight drinks 14 (≥40% HP w/o lethal forecast: 0), map drinks 7.
- Normal fights A / non-A: 65 / 10. Boss actions: F5 5, F10 13, F15 10, F20 9, F25 16, F30 8, F35 16, F40 53. In-game last turn: F5 4, F10 10, F15 6, F20 6, F25 12, F30 5, F35 12, F40 39.
- >=20% turns: warned 11 / unwarned 1. Max single turn 34.9%. 「防禦也擋不住」: 0.
- (a) 0. (b) 0 contradictions, no bug shot. Lethal-turn hint orders: Z>D mostly (F10t4, F23t3, F28t1, F35t7, F40t4, t10, t22); D only (Z absent) on F40 t3, t9, t31, t35, t38 — no interrupt skill/S offered.
- (c) Heavy hits landed (「重擊！對你造成」) with no charge next turn per driver: F10 t5 yes (0 dmg, 招架), F25 t5 yes, F25 t11 yes, F35 t5 yes, F40 t14 yes. Driver flagged charged=true (possible violation, UNVERIFIED because the battle log keeps old 「正在蓄力」 lines so detector may false-positive): F40 t5, F35 t11 (195-ish 招架), F40 t24 (second 401 吸血重擊 line at t23 and t24 — maybe stale log line). Unresolved: F10 t10, F15 t4, F25 t10, F35 t10, F40 t22/t31 (fight ended or not checked).
  Revives (2 turns): F5 yes, F10 yes, F15 yes, F25 yes; flagged charged within 2 turns (unverified, same caveat): F30 t4, F35 t7, F40 t34; F40 t33 yes/unclear.
- (d) Q repeats: 0. (e) 50% back-to-back flagged F30 t1-5 by driver (heuristic matches lingering log text; unverified, likely false positive).
- (h) No boss stun by driver; 「暈眩抵抗中」 never seen; no stunres shot.
- (i) merchant entries: 8. (g) start 13 / merchant 8 / drops 0.
- (f) F30 in-game last turn 5; F35 12; F40 39.
- Shot: qa-cp9-rc8-shots/death-blade-4.png

## blade 5 (build d2ab55e; driver drv8 = newest-turn log block only, tips excluded)
- Reached F30 (passed 29). Died F30 boss turn 16: 169 dmg (20% max HP) from 銳眼・深淵之王・雷刃翼龍; potions 0 left. 死亡畫面「共受 169」.
- Potions: start 13, merchants 4 (4 bought), drops 0. In-fight drinks 17 (>=40% HP w/o lethal forecast: 0), map drinks 1.
- Normal fights A/non-A: 52 / 12. Boss actions: F5 5, F10 14, F15 11, F20 18, F25 11, F30 18 (in-game last turn F30 = 16).
- >=20% turns: warned 2 / unwarned 2. Max single turn 36.6%. 「防禦也擋不住」 count 2 (driver; unverified).
- (a) 0.
- (b) driver regex missed (needed literal "HP 危險 ≥ HP"; real text is "HP 危險：下回合全體暴擊估計 N ≥ HP M；防禦後估計 K < HP M，防禦後撐得住，先不喝藥"). By T.H review, danger-≥-HP banner next to 撐得住: F10 t10, F28 t4, F30 t3, F30 t4 (4). No pause/screenshot taken this run (found after run). Lethal-turn orders: Z>D at F10t4, F20t7, F21t2, F30t5; D only (Z absent/potions out) F30 t9,t11,t14; no interrupt skill/S offered.
- (c) revive F5 t4 txt ok, F20 t12 txt ok (2 回合後重新蓄力). Heavy hit then no charge next turn: yes F10 t5, F10 t11, F20 t10; flagged charged (needs verification): F20 t12 revive, F30 t5, F30 t14 (heavy hits 297, boss line 蓄力 seen in following turn's block). F20 t15 heavy no result (fight ended).
- (d) Q repeated same turn: 2 (F15 t4, F25 t4).
- (e) back-to-back 50% heavy: 0.
- (h) 「暈眩抵抗中」 never seen; no boss stun; driver stun-detector hits (F5 t4, F20 t4/t9/t14) are false positives (no stun action taken). No stunres shot.
- (i) merchant entries: 4. (g) start 13 / merchant 4 / drops 0.
- (f) F30 boss in-game last turn 16; F35 not reached.
- Shot: qa-cp9-rc8-shots/death-blade-5.png

## blade 6 (build d2ab55e; drv8 newest-turn log block only)
- Reached F30 (passed 29). Died F30 boss turn 31: 425 dmg (50% max HP charged heavy) from 鐵壁・深淵之王・霜毒幽魂 at HP 1, potions 0. 死亡畫面「共受 425」.
- Potions: start 13, merchants 5, drops 0. In-fight drinks 16 (>=40% w/o lethal forecast: 0), map drinks 2.
- Normal A/non-A: 51 / 9. Boss actions: F5 10, F10 9, F15 9, F20 16, F25 9, F30 34 (in-game last turn F30 31; F20 15).
- >=20% turns: warned 4 / unwarned 1. Max single turn 35.6%. 「防禦也擋不住」 2 (driver, unverified).
- (a) 0.
- (b) F30 t4 (HP 384/850): banner red "下回合全體暴擊估計 425 ≥ HP 384" next to "防禦後撐得住，先不喝藥". Paused + screenshot: qa-cp9-rc8-shots/bug-b-blade-6-F30t4.png. Lethal-turn hint orders: Z>D F28t4, F28t9, F30t6, t13, t16, t19; D only (Z not offered) F30t4, t22, t28.
- (c) Revive txt ok (2 回合後重新蓄力): F20 t11, F30 t22. No charge within 2 turns after revive: yes F20 t11, yes F30 t22. Heavy hit -> no charge next turn: yes F20 t5, F30 t5, F30 t27; FAIL candidate F30 t14 (425 heavy, next turn block showed 「正在蓄力一擊…」 and 蓄力 line) -> boss charged immediately after heavy hit; F20 t10, F20 t15 unresolved.
- (d) Q repeated same turn: 3 (F10 t4, F15 t4, F25 t4).
- (e) back-to-back 50% heavy: none flagged; death was at F30 t31 from 50% charge at HP 1, no potions (game hint at t30: A·攻擊 "HP 1、沒有可用藥水"). No surviving action seen at that point (D would still be ~297 vs HP 1).
- (h) 「暈眩抵抗中」 never seen; boss never stunned; no stunres shot (driver only saw telegraph text "暈眩可打斷").
- (i) merchant entries: 5. (g) start 13 / merchant 5 / drops 0.
- (f) F30 boss in-game last turn 31; F35 not reached.
- Shots: qa-cp9-rc8-shots/death-blade-6.png, bug-b-blade-6-F30t4.png

## blade 7 (build d2ab55e)
- Reached F35 (passed 34). Died F35 boss turn 17: 225 dmg (26% max HP) from 守護・守門者・風角遊俠 蓄力一擊; potions 0 left. 死亡畫面「第 17 回合共受 225」(last 3 turns -173/-85/-225).
- NOTE: driver state (page.__S) was lost once at F30 t5-ish after an errored screenshot call; counters below cover F1-F30t5 partly (from first read) and F30t5-F35 (post-reset). Totals are approximate.
- Potions: start 13; merchants ≥5 by F30 (+1 after), drops 0. In-fight drinks ~10 by F30t4, +9 post-reset (post-reset count only: 9). Drinks at HP>=40% w/o lethal: 0.
- Max single turn 35% (F30 t22 303 dmg = 34.9%). 「防禦也擋不住」: 0 (first read).
- (a) 0 (Z-hinted-while-disabled never detected).
- (b) regex corrected "估計 N ≥ HP" next to "撐得住": F30 t4 (dl: 估計 434 ≥ HP 362; 防禦後估計 303 < HP 362，防禦後撐得住，先不喝藥) + 2 more post-reset hits (3 total logged). Lethal-turn hint order: Z>D normal; D-only when Z gone. No interrupt-skill/S order seen.
- (c) revives: F20 t4 yes (txt 2回合後重新蓄力; no charge in 2 turns), F10 t7 yes. Heavy hit -> next-turn charge: F30 t5 (303 heavy; next turn shows 霜毒光靈 [a second mob, not the boss] 蓄力一擊 - screenshot bug-c-blade-7-F30-t5.png), F30 t22 (303 heavy; header/log with 蓄力 flagged; screenshot bug-c-blade-7-F30-t22.png). F30 t18 heavy 298 -> no charge next turn yes; F25 t4 yes; F10 t5 yes. F30 t21 had boss charge then t22 heavy, t23 follow-up consistent w/ 1-turn rule unverified. F35 t13 charge / t14 heavy 303 -> t15 -173, t17 death by 風角遊俠 蓄力一擊 (3 turns after).
- (d) Q repeated same turn: 0 (post-reset); earlier part 0.
- (e) back-to-back 50% heavy: 0 flagged.
- (h) 「暈眩抵抗中」 never seen; boss never stunned; no stunres shot.
- (i) merchant entries: ~6 (5 + 1 after reset).
- Shots: death-blade-7.png, bug-c-blade-7-F30-t5.png, bug-c-blade-7-F30-t22.png (bug-b shot not saved: page.screenshot path writes blocked)

## blade 8 (build d2ab55e)
- Reached F25 (passed 24). Died F25 boss turn 7: 166 dmg (19% max HP) from 銳眼・塔主・炎紋騎士; turns 5/6/7 = -299/-171/-166. Potions left 10 (!) - death screen: 「倒下時還剩 10 瓶生命藥水：最後一擊 19%，HP 低於 38% 時就按 Z」. 死亡畫面「第 7 回合共受 166」.
- Notes: F25 t4 hp 386 hint D only (Z absent, cooldown); t6 hp 130 hint Z>D (driver pressed Z, then still died t7 at HP<166) -> at t7 potion presumably on cooldown / insufficient heal. Heavy 182 landed t5 (noCharge next turn yes).
- Potions: start 13, merchants 4, drops 0. In-fight drinks 8 (>=40% HP w/o lethal: 0), map drinks 1.
- Normal fights A/non-A: 41 / 5. Boss turns (in-game last): F5 3, F10 8, F15 6, F20 10, F25 6(+1 death turn 7).
- >=20% turns: warned 1 / unwarned 0. Max single turn 28.9%. 「防禦也擋不住」: 0.
- (a) 0. (b) 1: F25 t4 "估計 428 ≥ HP 386" next to "防禦後撐得住，先不喝藥" (1 contradiction, corrected regex). Lethal hint orders: F20t7 Z>D, F25t4 D, F25t6 Z>D.
- (c) revive F5 t3 yes (no charge, txt OK). Heavy -> next turn no charge: F25 t5 yes; F10 t4/5 yes. No fail detected.
- (d) Q repeats: 2 (F10 t4, F15 t4).
- (e) 0. (h) 「暈眩抵抗中」 never seen; boss never stunned; no stunres shot. (i) merchant entries 4. (g) start 13 / merchant 4 / drops 0.
- Shot: qa-cp9-rc8-shots/death-blade-8.png

## oc 1 (build d2ab55e; drv8 patched: bugC auto-break off, boss/elite per-turn snapshots from F56)
- Reached F61 (passed F60) -> logged ">=61". ALIVE, HP 436/1217, no deaths; potions 0 life left at F61 start. Stopped at cap; no death screen/deathlog.
- Potions: start 13, merchants 11 (drops 0). Drinks in fight 22 (>=40% w/o lethal: 0), map drinks 3.
- Normal fights A/non-A: 96 / 11. Max single turn 50%. >=20% turns warned 15 / unwarned 0. 「防禦也擋不住」 0.
- (a) 0. 
- (b) 5 contradictions logged by driver: F30 t9, F30 t10, F45 t3 (+2): banner "估計 N ≥ HP" next to "防禦後撐得住，先不喝藥" (same pattern as blade; the defend-forecast clause explains it, but banner still says HP 危險).
- (c) driver (noisy: "heavy" matches hint text 重擊): heavy then charge-next-turn flagged at F10 t4, F30 t10, F30 t21, F40 t11, F45 t10, F45 t16, F50 t4, F55 t10, F60 t10 (driver "charged" = any 蓄力 line next turn, incl. hint; NOT screenshotted, unverified as BOSS charging). noCharge: F5 t4, F15 t4, F25 t4, F30 t35, F35 t4, F55 t19/t23, F60 t15. Revive F10 t6: txt ok, noCharge yes (2 turns). F20 t0-8 entries are false positives (hint text). Screenshot bug-c-oc-1-F20-t1.png attempted: file not saved (page.screenshot path blocked); it was a false trigger anyway (turn 1, no prior heavy hit).
- (d) Q double-press: 0 (qrep empty).
- (e) driver "50%" flags at F50 t1-16 are false positives (hint text), no real back-to-back confirmed; max single turn 50%.
- (h) 「暈眩抵抗中」 never seen; hint-play only picked Q once (F51 t3 Q>D). Manual Q test NOT done (driver ran past; brief says stop at cap).
- (i) merchant entries 11. (g) start 13 / merchant 11 / drops 0.
- (f) boss driver-action counts: F5 7, F10 9, F15 6, F20 9, F25 14, F30 42, F35 11, F40 32, F45 24, F50 21, F55 34, F60 30 (not in-game turn counter).
- Shot: qa-saves/oc-1-F61-battle-stats.png (in-fight screen; gear panel not reachable mid-fight)
- [continuation from F61, manual QA (h), approved in brief] Wait ~60s, then hint-play from F61 (driver: hint first option, A when none, Z at <50% on map, merchant > rest before boss > battle).
- F61 normal: won at HP 84/1217 (hint said "A, 243 < 20% 不必防禦" while HP 327). F62 merchant: bought 1 life potion (limit 1 per merchant), drank on map F63 -> full HP. F65 reached; merchants entered in continuation: 2; potions bought 1.
- (h) MANUAL Q TEST: F65 boss (狂戰嗜血・塔主・霜尾屍鬼 + 雷翼鴉), turn 1, boss charging (蓄力, ~609 dmg forecast; hint was already "Q·盾擊（打斷蓄力）；否則 D"). Pressed Q once by hand (try 1 of 3): worked first press -> 「暈眩 6 回合（無法行動、無法迴避）」 + 「蓄力一擊被打斷」. No retries needed.
  - 「暈眩抵抗中」 in battle log: NOT shown (turns 2, 3, 4 checked; stun line only appears at turn 2 log; at turn 3/4 no 暈 text in log). On boss HP bar: NOT shown (bar partly covered by the hint panel; canvas, no DOM text; no 抵抗 text anywhere in DOM turns 2-4). => (h) MISSING in log and bar. Screenshot (turn 2, stun just applied): qa-cp9-rc8-shots/stunres-oc-1.png.
  - Also: the stun line "暈眩 6 回合" no longer appears in later turns' log/DOM although the boss did not act on t3 (only 雷翼鴉 acted).
  - Driver counted 暈眩抵抗中 on later boss fights F65-F70: 0 occurrences.
- Boss F65 killed at turn ~23; F70 boss survived (turn 45+). Both by hints.
- DEATH: F73 normal fight (霜鱗妖精 + 霜骨星靈), turn 3, 第 3 回合共受 183 傷害 (15% max HP), last hit 霜骨星靈 183; t1 -243, t2 -181, t3 -183. Entered fight at HP 587/1217 (48%, 0 potions, no Z). Hint on t1-t3: "A·攻擊（下回合估計 243 < 最大 HP 20%，不必防禦）" - forecast 243 vs HP 163 at t3 (hint never warned lethal; potential bug (b)). 死亡畫面「共受 183」. Final floor: died on F73 (passed 72). Returned Lv13->15, power 544->752.
- Death log (fatal fight, 3 turns): qa-cp9-rc8-deathlog.jsonl (affixes not captured).
- Shots: qa-cp9-rc8-shots/stunres-oc-1.png, qa-cp9-rc8-shots/death-oc-1.png, qa-saves/oc-1-gear.png (town equipment; character stats panel text read: Lv15, HP 908, 物攻 235, 招架 28.6%, 格擋 40%).

## oc 2 (build d2ab55e)
- Reached F30 (passed 29). Died F30 boss, turn 42: last turn 17 dmg (2%), final hit 霜尾騎士 蓄力一擊; HP 1 from t40, potions 0 (all 18 drinks used; Z hinted at t34 last potion). 死亡畫面「第 42 回合共受 17」. Boss 嗜血・深淵之王・霜眼騎士 (affix 嗜血) + 霜尾騎士.
- Potions: start 13 (3+10), merchants 5 (1 per visit... 5 bought), drops 0. In-fight drinks 18 (≥40% HP w/o lethal forecast: 0), map drinks 1.
- Normal fights A 56 / non-A 8. Boss F30 42 in-game turns (F5-F25 ~4-10 each).
- ≥20% turns warned 9 / unwarned 1. Max single turn 50%. 「防禦也擋不住」2.
- (a) 0. (b) contradictions "HP 危險 … ≥ HP" next to "防禦後撐得住，先不喝藥": F30 t10,16,17,21,31 (more earlier likely). On t38/t39 hint said defend-after 271/176 survives, but HP 272->177->1 (D pressed): estimate wrong.
- (c) revives F10,F20,F25: 「2 回合後重新蓄力」 present. F30 t23 boss heavy hit (blocked 0): next turn no boss charge (yes). Driver heavy-detect was heuristic.
- (d) 0 repeated Q. (e) 0. (h) no boss stun, no 暈眩抵抗中, no shot; Q hinted once (F30 t25) only. (i) merchants 5.
- Note: driver stalled at F28 (click timeout, switched to force-click); 2 manual A presses at F28 t3-4 (HP 315->146), deviation.
- Death log: qa-cp9-rc8-deathlog.jsonl (run oc-2, t9-42; t0-8 not captured). Shots: qa-cp9-rc8-shots/death-oc-2.png, qa-saves/oc-2-gear.png.

## oc 3 (build d2ab55e)
- Reached F36 (passed 35). Died in a NORMAL F36 fight (風鐵騎士 + 霜鐵怨靈, no affix prefixes) turn 2: 169 dmg (20% max HP) at HP 83/846, potions 0. 死亡畫面「第 2 回合共受 169」. Passed F30 and F35 bosses (~10 turns each); F25 ~16 turns, F20 ~6.
- Potions: start 13, merchants ≥4 (counted from F15 on; F1-15 counters lost to one timed-out driver call), drops 0. In-fight drinks ≥10 (≥40% w/o lethal forecast: 0), map drinks ≥4.
- (a) 0. (b) F25 t6,t13; F30 t5,t9; F35 t7 "HP 危險 … ≥ HP" next to "防禦後撐得住". NEW possible bug: F36 t0-2 banner "HP 危險！建議 A·攻擊" with HP 83/846 and decision "下回合估計 169 < 最大 HP 20%，不必防禦" — forecast 169 > HP 83, no potions; fatal.
- (c) F20 revive 「2 回合後重新蓄力」 ok. F25 t5 boss heavy hit 293; t6 only 霜岩魔像 charging (not boss) → no bug shot. (d) 0. (e) 0. (h) no boss stun, no 暈眩抵抗中. (i) merchants ≥4 (F15+).
- Death log: qa-cp9-rc8-deathlog.jsonl (oc-3, 3 turns). Shots: qa-cp9-rc8-shots/death-oc-3.png, qa-saves/oc-3-gear.png.

## oc 4 (build d2ab55e)
- Reached F30 (passed 29). Died F30 boss turn 43: 206 dmg (25% max HP), final hit 鐵壁・深淵之王・霜影遊俠 重擊 (蓄力大招); HP 1 at t42, potions 0. 死亡畫面「第 43 回合共受 206」; last 3 turns -166/-128/-206. t42 hint was "A·攻擊（HP 1、沒有可用藥水：直接輸出）"; t41 hint "D·防禦" at HP 129. Death-screen: "看到 ⚠ 蓄力就按 D·防禦".
- Potions: start 13 (3+10), merchants 2 bought (merchant visits 2), drops 0. In-fight drinks ~14 (≥40% HP w/o lethal forecast: 0), map drinks 1. Counters are partial: driver state was reset once at F25 (counts summed over the two segments).
- Normal fights A ~33 / non-A ~4. Boss turns: F5 9, F10 11, F15 9, F20 16, F25 14, F30 53 driver actions (in-game turn 43).
- Max single-turn 34.9%; ≥20% turns warned ≥10 / unwarned ≥0. 「防禦也擋不住」≥1.
- (a) 0. (b) contradictions "HP 危險 … 估計 ≥ HP" next to "防禦後撐得住，先不喝藥": F30 t11,14,15,23,39 (all on 417/374/377 forecast vs HP 374-417; defend-after 291). (c) heavy detect heuristic noisy; F25 revive present, F30 t42 boss heavy hit followed by death. (d) qrep 1 (F20 t14: Q pressed twice same turn). (e) 0 flagged. (h) no 暈眩抵抗中 seen, no boss stun, no shot. (i) merchants 2 (partial).
- Bug candidate: F30 t42 hint "A·攻擊（HP 1、沒有可用藥水：直接輸出）" with boss charging — no D hinted, then 25% heavy hit killed; the death screen itself says to press D when ⚠ charge visible (t41 hint was D at HP 129, survived at HP 1).
- Death log: per-turn full log NOT captured (driver state lost on a failed call); only hint rows for lethal-forecast turns recorded here. Monsters: 鐵壁・深淵之王・霜影遊俠 (affix 鐵壁) boss.
- Shots: qa-cp9-rc8-shots/death-oc-4.png, qa-saves/oc-4-gear.png, qa-cp9-rc8-shots/badge-oc-4.png.

## oc 5 (build d2ab55e)
- Reached F40 (passed 39). Died at the F40 BOSS fight (堅硬・災厄・霜鱗魔像 [affixes 堅硬, 災厄] + 炎鐵甲蟲), in-game turn 14: 158 dmg (20% max HP) 魔像 重擊 at HP 1; last 3 turns -238/-0/-158. 死亡畫面「第 14 回合共受 158」. Potions 0 (last drunk t8 at HP 61).
- Hints: t8 "Z or D (防禦後估計 60 < HP 61)"; t11 "D (藥水已用完; 防禦後估計 238 < HP 239; 全體暴擊估計 396 ≥ HP 239)"; t12 HP 1 "A·攻擊（沒有可用藥水：直接輸出）"; t13 "Q·盾擊（打斷吸血重擊）否則 A" → pressed Q once, then died t14 (no stun seen/resisted).
- Potions: start 13, merchants ~6 bought (6 visits, summed over driver segments), drops 0. In-fight drinks ~19 (≥40% HP w/o lethal forecast: 0), map drinks ~3. Counters are summed across segments (driver state reset between calls) → approximate.
- Normal fights A ~69 / non-A ~14. Boss driver actions: F5 10, F10 5, F15 10, F20 4, F25 10, F30 36, F35 26, F40 17 (in-game t14 at death; F30 and F35 listed separately).
- Max single-turn 50%. ≥20% turns warned ≥17 / unwarned 0 seen.
- (a) 0. (b) "HP 危險 … 估計 ≥ HP" next to "防禦後撐得住，先不喝藥": F30 t14,t29; F35 t3,5,9,18,19; F38 t3; F40 t5,t7 (+ possibly more in lost segments). (c) revive F10, F20 txt ok; heavy-hit-then-boss-charges-next-turn flagged by the (noisy) driver at F30 t10, t25 and F35 t10, t14 → possible (c) violations, NOT screenshotted (driver didn't pause); F40 t13 heavy then boss charging next turn t13 (log shows 魔像 蓄力 + 吸血重擊 warning). (d) 0 repeated Q presses. (e) none flagged. (h) no 暈眩抵抗中 and no stun seen. (i) merchants ~6.
- Bug candidates: (1) F40 t12 hint "A·攻擊（HP 1、沒有可用藥水）" at HP 1 while the boss is charging; (2) t5/t7/t11 the banner says HP危險 ≥HP but the decision says 防禦後撐得住, forecast 277 vs HP 338-396.
- Bug lethal screenshots (step 8) were NOT taken during play (driver can't screenshot to disk from inside browser_run_code). Full-turn log t1–t14 in qa-cp9-rc8-deathlog.jsonl (run oc-5; t2/4/6 hp values reconstructed from the driver's snapshots).
- Shots: qa-cp9-rc8-shots/death-oc-5.png, qa-saves/oc-5-gear.png, qa-cp9-rc8-shots/badge-oc-5.png.

## oc 6 (build d2ab55e, drvL.js)
- Reached F40 (passed 39). Died F40 boss turn 14-15 (in-game): no potions left, HP 1 after 烈焰・災厄・霜紋巨人 吸血重擊 273 (34%), killed by 158. 共受 158 (最後一回合, 20%).
- Potions: start 13 (3+10 bought), merchants 7 (1 each), drops ~0-1 (counter unreliable). In-fight drinks 20 (>=40% HP no lethal: 0), map drinks 1.
- Normal fights A 66 / non-A 11. Boss actions F5 4, F10 8, F15 8, F20 11, F25 12, F30 19, F35 24, F40 16.
- >=20% turns warned 7 / unwarned 0 seen. Max single turn 50%. 防禦也擋不住: 0.
- (a) 1: F20 t8 HP 64 hint Z>D while Z on cooldown (shot bug-a-oc-6-F20t8.webp; screen may have lagged to t9).
- (b) banner "HP 危險 … ≥ HP" vs "防禦後撐得住，先不喝藥": F30 t3,t7; F35 t3; F40 t3,t11 (+4 more logged, 9 total).
- bug-lethal shots (D first while forecast>=HP; D-forecast<HP): F30t3, F30t7, F35t3, F40t3 (screen showed t4), F40t11, F40t13. Not shot: F40 t14 hint "A·攻擊（HP 1、沒有可用藥水）" (died before shot).
- (c) revive F30 t5: text "2 回合後重新蓄力" yes; boss did not charge (an add 霜骨刺客 did). Heavy-hit-then-boss-charge: none detected; no bug-c shots.
- (d) 0. (e) 0. (h) no stun, no 暈眩抵抗中, no stunres shot. (i) merchants 7.
- Shots: death-oc-6.png, qa-saves/oc-6-gear.png, badge-oc-6.webp. Deathlog: partial (turns 3,4,9-14) in qa-cp9-rc8-deathlog.jsonl.

## oc 7 (build d2ab55e, drvL.js)
- Reached F40 (passed 39). Died F40 boss turn 22: boss 蓄力大招 378 (50% max HP) through D (D-forecast said 264 < HP 378). 共受 378. Potions left ~2 (hint said D, "倒下時還有 2 瓶生命藥水：最後一擊 50%，HP 低於 100% 時就按 Z").
- Potions: start 13, merchants 7, drops 0. In-fight drinks 17 (>=40% HP no lethal: 0), map drinks 1.
- Normal fights A 59 / non-A 12. Boss actions F5 5, F10 9, F15 10, F20 13, F25 11, F30 27, F35 10, F40 22.
- >=20% turns warned 12 / unwarned 1. Max single turn 50%. 防禦也擋不住: 0.
- (a) 0. (b) banner "HP 危險 ≥ HP" vs "防禦後撐得住，先不喝藥": 8 logged (F30 t17, F35 t7, F40 t3,t5,t21 +).
- bug-lethal shots (hint D, forecast >= HP): F30t17, F35t7, F40t3, F40t5. F40t21 (fatal) shot missed: screen showed death screen by the time (timing lag).
- (c) heavy F10 t5, F30 t12, F40 t14 (吸血重擊): boss-charge next turn not confirmed (charging unit was an add); revive F40 t19 text "2 回合後重新蓄力" yes, boss charged t21 (=2 turns after) ok. No bug-c shots.
- (d) 0. (e) 0 detected. (h) no stun, no 暈眩抵抗中, no stunres shot. (i) merchants 7.
- Note: a browser click hung once at F30 t17 (used desktop click on D).
- Shots: death-oc-7.png, qa-saves/oc-7-gear.png, badge-oc-7.webp. Deathlog partial in qa-cp9-rc8-deathlog.jsonl.
