NEXT: oc 1

## blade 1 (build c922c68) — died F35
- Result: died at F35 boss turn 14 (HP1, 0 potions; 181 heavy hit). Death shot: qa-cp9-rc12-shots/death-blade-1.png. Dump: qa-saves/rc12-blade-1-end.json
- Boss turns: F5 6, F10 7, F15 7, F20 8, F25 19, F30 59, F35 14. Lv14 constant. Equipped gear not shown on map panel (backpack only).
- Potions: start 13, merchants 6 (entered 6/13 offers), drops 3, chests 3 (entered 5/6 offered). F1 elite taken before driver (★ pointed elite).
- VERIFIED: check1 charge hint = W·撕裂擊 or A at F10/F15/F25 (no Shatter/chain), D only at F20/F30/F35; W at F25 did not interrupt. check2 D on boss charge triggers 防禦反擊 counter. check3 F34 pot 0 -> ★ merchant. check4 HP1/0pot/charging -> D + 此戰幾乎必敗, no A hint. check5 turnlog dump only F5-F30(t4). check6 0 real contradictions (possible banner-vs-★ F34). check7 not reached.
- Deviation: charge stops limited to first charge per boss floor after the first 2 screenshots (minion-only charges ignored); (ii) stops limited to 2 per run.
- Shots: badge-blade-1, blade-1-F10-charge1, blade-1-F15-charge2, blade-1-F34-iv-merchant, blade-1-F35-ii-hp78 / hp1-turn12 / hp1-charging, death-blade-1
- Feel 3/5.

## blade 2 (build c922c68) — died F40
- Boss turns F5 7, F10 6, F15 6, F20 9, F25 9, F30 45 (D-loop grind), F35 9, F40 50 (death). Lv14 throughout.
- Potions: start 13 (10 bought), merchants 4 entered/16 offered, chests 6 entered/7 offered, drops ~10. Pot pre-boss 17,19,20,17,18,12,8; F40 drained 8 + HP-sapping grind -> 0.
- Cause: F40 堅硬 boss (physical-resistant, 25% slash resist), 50-turn war of attrition, potions out, 吸血重擊 297.
- check1 W·撕裂擊/A hinted on charge F10-25; D hinted F30+. check2 D triggers 防禦反擊 (verified). check3 not triggered (F39 pot=8, ≥ threshold 8). check4 T48 HP1/0pot hint A·攻擊 w/o 撤退 or 必敗 (screenshot); 必敗 appeared T49 on charge. check6 none. check7 not reached.
- Gear panel couldn't be expanded (click on 裝備 no effect); only Lv read. Charge stops limited to 2 screenshots (F10,F15).
- Shots: badge-blade-2, blade-2-F10-charge1, blade-2-F15-charge2, blade-2-F40-ii-hp1, death-blade-2
- Feel 3/5.

## blade 3 (build c922c68) — F61 alive (cap, 0 potions left)
- Boss turns (max in-game turn counter): F5 7, F10 7, F15 8, F20 8, F25 10, F30 ~23, F35 ~20, F40 ~16, F45 ~34, F50 ~22, F55 ~18, F60 20 (boss killed; 2nd-phase revive at T16 "復活…2 回合後重新蓄力"). Lv14 throughout. Gear (map panel, expanded by clicking text 「Lv14 · 裝備」): 主手 優良・平衡之雷擊鐮刀; 頭 精良・守護之瑪瑙板甲頭盔; 身 優良・噬火者之秘銀鎖子胸鎧; 手 優良・偏轉之翡翠鎖子鐵手套; 腿 精良・抵消之鈷藍克維拉護腿; 腳 優良・噬火者之板甲鐵靴.
- Potions: start 13 (10 bought + 3), merchants entered 10 (10 potions bought via driver, 21 offered), chests 5 (9 entered/12 offered, tracked approx), drops ~14, in-fight drinks 35 (+7 map drinks). Pot pre-boss: F5 16, F30 19, F35 15; low from F45 (5 at F49/F54, 1 at F59, 0 at F61).
- VERIFIED: (check1) charge hints at F10/F15 = W·撕裂擊 或 A·攻擊, no Shatter chain. F30 T4 first charge (HP456/1197, lethal 599): hint Z·喝藥 或 D·防禦; F35 charge hint D first. (check2) D on charge → 防禦反擊 counter present in log (F30 T9/14/21, F60), with 「1 回合後重新蓄力」. (check3/iv) F49 pot5, F54 pot5, F59 pot1: ★ → 商人 with 🧭 「生命藥水 N 瓶 < 下一隻首領預估 8 瓶…先去商人補藥」 each time (F34/F39/F44 pot ≥9 so no stop). (check4) HP≤10%+0 potions never occurred (no (ii) stop). (check5) dump qa-saves/rc12-blade-3-end.json contains snap F5..F60 for this run (id 8fu0) + turnlog. (check6) 0 real contradictions; one driver false-positive at F35 T4 (text "不防禦會死…防禦後撐得住" is consistent). (check7) not reached (HP never <25% with 0 potions on map; at F61 HP 50%).
- Gear panel: clicking the heading did nothing; clicking text 「Lv14 · 裝備」 (span next to ▶) expands the list. Screenshots only as browser assets (see report), not in shots dir.
- Feel 3.5/5: F30+ boss fights are long D-loops; potion starvation from F45 despite merchants.

## blade 4 (build c922c68) — died F30
- Result: died F30 boss turn 25 (HP1 → hit 160 by 銳眼・深淵之王・霜紋機兵, 20% maxHP; death screen 「第25回合共受160」). maxHP 802 this run (blade-3 had 1214 by F40+ from auto-equips). Dump: qa-saves/rc12-blade-4-end.json.
- Boss turns: F5 7, F10 9, F15 10, F20 8, F25 37 (!), F30 25 (death). Lv14 throughout. Gear same start as blade 3 (panel expands by clicking text 「Lv14 · 裝備」).
- Potions: start 13, merchants entered 1/12 offered, chests ~6 entered, drops ~5; drank 22 in fights; F25 boss attrition (37 turns) left 5 pots at F29; 0 at F30 T22+.
- VERIFIED: (check1) F30 T1 charge (boss + minion, HP full): hint D·防禦 (first), not an interrupt chain; earlier charges not stopped (only first at F30+ per spec). (check2) D on charge triggers 「防禦反擊」 (F30 T1, T4, T9, T21). (check3) F29: pot 5 (<8), ★ = 營火 ("HP 50%：先休息回血"), merchant present on floor but not ★ → ★ did NOT point to merchant (🧭 text did not mention potions). Compare blade-3 where 🧭 said 藥水 N < 預估 8 → ★ merchant. Shot: assets ea211f73…. (check4/ii) HP1/802, 0 potions, boss NOT charging (just did 重擊 "1 回合後重新蓄力"): hint 'A·攻擊（HP 1、沒有可用藥水：直接輸出）', no 撤退 button in boss fight, no 必敗 text. Pressed A (first hint) → died next turn to 160 hit. T23 (HP190, charging, 0 pots): D hinted with 「防禦只靠保命剩 1 HP」 and survived at 1 HP. A hint while boss charging: not observed. (check5) dump has snaps F5..F30 for this run; fatal fight in turnlog (QA to confirm). (check6) 0 contradictions. (check7) not reached (died in boss fight; no map HP<25% with 0 potions).
- INFERRED: at HP1 with a non-charging boss whose normal hit (~160–255) is lethal, hinting A is a likely-lost line; D (damage halve) was possibly not survivable either; no real exit option exists in boss fights. F25 37-turn grind is the root cause of potion drain.
- Feel 2.5/5.

## bulwark 1 (build c922c68) — F61 alive (cap), 1 potion left
- Boss turns (max in-game turn seen): F5 10, F10 4, F15 12, F20 9, F25 11, F30 12, F35 10, F40 46, F45 55, F50 28, F55 8, F60 15 (killed). Lv11 throughout; maxHP ~754→832.
- Gear before each boss (map panel expanded via 「Lv11 · 裝備」): F5-F20 主手 尚可・浣熊之斧, 副手 優良・減幅之塔盾, 身 精良・守護之護盾板甲胸鎧 (head 普通・板甲頭盔 → 優良・噬火者之護盾板甲頭盔 from F20); F25-F35 主手 優良・戰鬥法師之雷擊匕首; F40 boots → 華麗・噬火者之翡翠板甲鐵靴; F45 主手 華麗・殺戮之極寒脇差; F50-F60 主手 華麗・浣熊之神聖斧.
- Pot pre-boss: F5 16, F10 17, F15 18, F20 17, F25 16, F30 19, F35 20, F40 22, F45 16, F50 8, F55 1, F60 2. Start 13 (10 bought). Merchants entered 11 / offered 22 (11 bottles); chests entered 8 / offered 13; drops ≥12 (driver delta est.); in-fight drinks 39, map drinks 2.
- VERIFIED: (i) F30 T1 charge (boss+minion, HP full): hint "Q·盾擊 (打斷蓄力)；否則 D·防禦"; Q first, interrupt worked (暈眩 5 回合, 蓄力一擊被打斷), hint text has no 防禦反擊 mention (D desc: 少受約164(50%)，回25% HP). 防禦反擊 does occur in logs on D vs charge (F30 T12, F40 T35, F45, F50 T22, F60 T12) with 「1 回合後重新蓄力」. Shot bw1-F30-charge.png.
- VERIFIED (iv/check3): F49 pot7 HP672/832 ★=商人 (🧭 7<8); F54 pot0 HP full ★商人; F59 pot1 HP633/832 ★商人. F29/F34/F39/F44 pot ≥9 no stop. Shot bw1-F49-iv-merchant.png.
- (ii) never hit (HP≤10% with 0 potions); check4 not exercised. (iii)/check7 never hit (HP<25% w/0 pot on map never happened). Check5: dump qa-saves/rc12-bulwark-1-end.json turnlog contains F5..F60 floors (rolling 2000 entries across runs). Check6: 0 real contradictions (driver flagged F30 T9 "不防禦會死 398≥384；防禦後 278<384 撐得住" = consistent).
- Shots: bw1-F30-charge, bw1-F49-iv-merchant, bw1-F61-alive. Feel 3.5/5 (F40/F45 boss attrition 46-55 turns; potion starvation F50+ despite ★ merchants).

## bulwark 2 (build c922c68) — died F50
- Result: died F50 boss turn 26 (HP1, 0 potions; 251 hit = 29% maxHP by 尖刺烈焰・深淵之王・風甲齒輪獸; death screen 「第 26 回合共受 251」). Shot: qa-cp9-rc12-shots/death-bulwark-2.png. Dump: qa-saves/rc12-bulwark-2-end.json.
- Boss turns: F5 10, F10 8, F15 8, F20 8, F25 12, F30 23, F35 24, F40 ~26 (last read), F45 ~41 (last read), F50 26 (death). Lv11 throughout (maxHP 832→874).
- Gear (map panel, expanded via 「Lv11 · 裝備」): F5 主手 尚可・浣熊之斧; F10-F50 主手 華麗・奪心魔之虛靈棍棒, 副手 優良・減幅之塔盾, 頭 優良・霜生者之鎖子頭盔, 身 華麗・石膚之翡翠鎖子胸鎧, 手 精良・守護之鎖子鐵手套, 腿 優良・守護之鋯石鎖子脛甲 (from F35), 腳 普通・板甲鐵靴 → 精良・守護之板甲鐵靴 (F35+).
- Pot pre-boss: F5 15, F10 15, F15 16, F20 15, F25 13, F30 14, F35 11, F40 8, F45 5, F50 2. Start 13. Merchants entered 7 / offered 20 (7 bottles); chests entered 8 / offered 11; drops small (driver est. few); in-fight drinks 30+, map drinks 2.
- VERIFIED (i) F30: T1 only the minion 炎羽甲蟲 charged (boss not) → hint D·防禦. First boss charge T4 (HP 439/832): hint "Q·盾擊（打斷蓄力）；否則 D·防禦", Q first; no 防禦反擊 wording in hint (D desc: 少受約233(50%)，回25%HP). 防禦反擊 appears in logs after D on charge (F45 T20, F50 T24) with 「1 回合後重新蓄力」. Shot bw2-F30-charge.png.
- VERIFIED (iv/check3): F39 pot8 HP874/874 → ★=寶箱 (🧭 沒有戰鬥風險), merchant on same floor NOT ★ (shot bw2-F39-iv-chest-pot8.png) → check3 NOT met at pot=8 (note F44 with pot 4 and F49 pot 1 → ★ merchant with 🧭 "N 瓶 < 預估 8 瓶"; F37 pot6 → ★ merchant "6<7"). Likely threshold: boss estimate was lower at F39 (est 8 vs pot 8, not <). INFERRED.
- VERIFIED (ii) F50: HP≤10%, 0 potions, T22 HP33/874 boss NOT charging: hint D·防禦「防禦只靠保命剩1HP」; T23 HP33 boss charging: D; T24 HP1: D (A explicitly warned as suicide by reflect ~20 ≥ HP1; "或切換目標打霜翼齒輪獸"); T25 HP1: D; T26 died to 251 hit. Never A; no 撤退 button in boss fight; 必敗 text never shown (checked each turn). Shot bw2-F50-ii-hp33-T22.png. Check4 = no A hint (OK), but neither 撤退 nor 必敗 shown at HP1/0pot/charging (T23 is the charging case at HP33; HP1 turns had no charge).
- (iii)/check7 never reached on map. Check5: dump rc12-bulwark-2-end.json (turnlog rolling; QA to confirm fatal F50 fight). Check6: 0 contradictions (all "估計≥HP / 撐得住" matches were the 防禦後 form).
- Shots: bw2-F30-charge, bw2-F39-iv-chest-pot8, bw2-F50-ii-hp33-T22, death-bulwark-2. Feel 2.5/5 (F50 attrition, no exit at 0 potions, potion starvation F40+ despite merchants).

## bulwark 3 (build c922c68) — died F45
- Result: died F45 boss turn 16 (HP1, 0 potions; 134 hit = 18% maxHP by 迅捷堅硬・塔主・風翼機兵; death screen 「第 16 回合共受 134」). Shot: qa-cp9-rc12-shots/death-bulwark-3.png. Dump: qa-saves/rc12-bulwark-3-end.json.
- Boss turns (max turn counter read; kill turn maybe +1): F5 7, F10 11, F15 12, F20 14, F25 21, F30 35, F35 47, F40 42, F45 16 (death). Lv11 throughout (maxHP 754).
- Gear (map panel via 「Lv11 · 裝備」): F5/F10/F15 主手 尚可・浣熊之斧, 副手 優良・減幅之塔盾, 頭 優良・霜生者之鋯石鎖子頭盔, 身 精良・守護之護盾板甲胸鎧, 手 精良・守護之鎖子鐵手套, 腿 優良・靈守之琥珀板甲脛甲, 腳 優良・靈守之鈷藍鎖子鐵靴; F20 主手 精良・吸血鬼之虛靈短劍; F25-F45 主手 優良・殺戮之烈焰斧 (rest unchanged). (F10 panel not read, inferred = F5/F15.)
- Pot pre-boss: F5 17, F10 17, F15 17, F20 15, F25 16, F30 14, F35 8, F40 5, F45 0. Start 13 (10 bought). Merchants entered 12 / offered 18; chests entered 5 / offered 8; chest potions 3, drops ≥10 (driver delta est.); in-fight drinks ~35, map drinks 3.
- VERIFIED (i) F30: T1 minion-only charge (炎刃騎士) → hint D·防禦. T4 boss charge (首領蓄力中, HP 616/754): hint "Q·盾擊（打斷蓄力）；否則 D·防禦", Q first; hint has no 防禦反擊 mention (D desc: 少受約257(50%)，回25%HP). 防禦反擊 occurs in logs on D vs boss charge (F30 T14/T19/T32, F45 T15) with 「1 回合後重新蓄力」. Shot bw3-F30-charge.png. (Driver pressed first hint Q at T4; boss still got 暈眩抵抗中 later at T10.)
- VERIFIED (iv/check3): F34 pot7 ★=商人 (🧭 可補藥水) shot b3-F34-iv-merchant-pot7.png; F39 pot4 ★商人 (🧭 4<7); F44 pot0 ★商人 (🧭 0<8). All ★ merchant when pot<8; F29/F24.. no stop at pot≥8.
- VERIFIED (ii) F45: T14 HP190 pot0 charging boss: D (「防禦只靠保命剩1HP」未保命估263≥190). T15 HP1/754, pot0, 迅捷堅硬 minion 風翼機兵 charging (header 「敵人蓄力中」 not 「首領蓄力中」): hint = "A·攻擊（HP 1、沒有可用藥水：直接輸出）"; red text "HP 1，下一擊保不住"; NO 「幾乎必敗」, NO 撤退 button. => A IS hinted at HP1/0 potions (check4 violation-ish; note boss itself wasn't the charger, a monster minion was; D was the prior survivable action but hint chose A). Shot bw3-F45-ii-hp1-A-hint.png. T16 died to 134.
- (iii)/check7 never reached on map. Check5: dump rc12-bulwark-3-end.json (turnlog rolling; QA to confirm F45 fatal fight). Check6: driver flagged F30 T13 "不防禦會死 377≥310；防禦後 263<310 撐得住" = consistent form; 0 real contradictions.
- Shots: bw3-F30-charge (b3-F30-charge), b3-F34-iv-merchant-pot7, bw3-F45-ii-hp1-A-hint, death-bulwark-3. Feel 2.5/5 (推測: potion starvation from F35, 0 pot by F45 despite ★ merchants; A hint at HP1).

## bulwark 4 (build c922c68) — ALIVE at F61 (cap)
- Result: reached F61 alive (HP 943/943, 19 potions), stopped at cap. Shot: qa-cp9-rc12-shots/bw4-F61-alive.png. Dump: qa-saves/rc12-bulwark-4-end.json. No death.
- Boss turns (max turn counter read): F5 8, F10 6, F15 6, F20 6, F25 7, F30 14, F35 24, F40 43, F45 12, F50 9, F55 8, F60 10. Lv11 throughout (maxHP 772 start → 802 at F30 → 943 at F61).
- Gear (map panel): F5/F10 主手 普通・棍棒, 副手 優良・減幅之塔盾, 頭 普通・板甲頭盔, 身 華麗・防衛之瑪瑙板甲胸鎧, 手 精良・守護之鎖子鐵手套, 腿 優良・靈守之琥珀板甲脛甲, 腳 普通・板甲鐵靴; F15/F20 主手 優良・平衡之極寒匕首; F25-F40 頭 優良・霜生者之鎖子頭盔; F45/F50 腳 華麗・噬火者之琥珀板甲鐵靴; F55/F60 主手 優良・浣熊之斧 (+副手 華麗・守護之塔盾 at F60).
- Pot pre-boss: F5 16, F10 17, F15 20, F20 23, F25 26, F30 24, F35 24, F40 21, F45 15, F50 16, F55 19, F60 20. Start 13 (10 bought). Merchants entered 6 / offered 23; chests entered 13 / offered 14 (6 chest potions); drops ≈20 (driver delta est.); in-fight Z drinks ~24, map drinks 2.
- VERIFIED (i) F30 T4 boss charge (首領蓄力中, HP 382/802, 24 pots): hint "Z·喝藥 或 Q·盾擊 或 D·防禦"; decision Z first (估計401≥HP382, 「Q·盾擊 不保證擋下全部傷害」), Q second (hinted, not first because lethal forecast). No 防禦反擊 wording in hint (D desc: 少受約198(50%)，回25%HP). 防禦反擊 appears in logs on D vs boss charge (e.g. F40 T14) with 「1 回合後重新蓄力」. Shot b4-F30-charge.png.
- (ii) never hit (HP≤10% with 0 potions never occurred) → check4 not exercised. (iii)/check7 never hit. (iv)/check3: not exercised, pot ≥8 before every boss-1 floor (no ★ merchant stop triggered); potions plentiful (19-26) all run. Check5: dump rc12-bulwark-4-end.json (turnlog rolling, QA to confirm F60 present). Check6: 0 contradictions (all 防禦後 forms consistent). Note the driver did not log F10-F25 minion charges.
- Shots: b4-F30-charge, bw4-F61-alive. Feel 4/5 (推測: strong armor 華麗・防衛之瑪瑙板甲胸鎧 from start + many potion drops; boss turns short except F40 43).
