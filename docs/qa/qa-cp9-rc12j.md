DONE rc12j (stopped by producer after ar2; ar3 not run)
# cp9-rc12j acceptance — blade 1 & 2 (build d8938eb, server :5368)
Method as rc12g: ?cp9&cp8&cp6&preset=postF20-blade&fresh (each run: Lv14 / 104,089C→103,589C after 10 potions / 3→13 potions / 0 abyss runs, 已驗證). Badge d8938eb (shots bl1-badge-d8938eb, bl2-badge-d8938eb; 已驗證). 4x + 跳過動畫 on, 忽略並出發, 進入深淵塔, ★-only (data-primarykey), ★ map node, ★ buff, merchant buy-to-threshold. Driver /workspace/drvRC12j.js (= rc12g; only timeouts cut 25000→17000/26000→19000 so each call <20 s; helper tab never reloaded; state kept in helper textarea). No game code/debug/console changes. Dumps qa-saves/rc12j-blade-{1,2}-end.json. Data qa-cp9-rc12j-data.jsonl, deathlog qa-cp9-rc12j-deathlog.jsonl, shots qa-cp9-rc12j-shots/.

## Results
| run | floor / result | pot start | pot end | boss turns F30..F100 | pot start→end per boss | max NORMAL boss hit | max CHARGE hit (boss) | minion charge hits | 自動換武器 | 魔力合流 / 以太 | >50% turn | >40% hit |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| bl1 | DIED F76 (non-boss floor, 霜刃光靈 minion, 0 potions) after clearing F75 boss; 已驗證 | 13 | 0 | F30-F75: 3,5,1,17,14,10,17,29,26,53 (sum 175) | 25→25,25→25,24→25,24→22,21→19,19→18,21→19,18→14,11→8,6→0 | 205 = 14.4% of 1422 (F75 t40) | 318 = 31.2% of 1020 (F65 重擊); F75 238 | F76: 503 (33.0%), 431 (28.2%, 被暴擊), 610 (40.0%, 40.0% of 1526 = 39.97%, killing blow) | 0 lines (death screen says "途中自動換上 5 件" but no 「自動換武器」 text was ever captured, 推測 toasts vanish before scan) | 0 / 0 | none | none strictly >40% (610 = 39.97%, displayed as 40%) |
| bl2 | F100 boss cleared (22t), alive on F101 map HP 1302/1302; 已驗證 | 13 | 2 | F30-F100: 8,1,2,11,6,6,9,24,34,50,33,8,15,26,22 (sum 255) | 20→19,20→20,22→22,23→22,22→21,23→22,25→23,23→20,15→11,14→8,10→4,6→5,6→5,7→3,4→2 | 224 = 19.9% of 1123 (F85 t5); F100 normal not parsed (mn=0) | 310 = 27.6% of 1123 (F100 吸血重擊); F45 302 (36%), F95 293, F65 227 | F70 177 (炎刃刺客), F95 293 (雷鋼元素靈) | 1 line (F76, seen in whole-body scan): 自動換武器：優良・平衡之雷擊鐮刀 → 華麗・平衡之鐮刀 | 0 / 0 | none | none |
Shots: bl1-F76t10-HP1-0pot-bisheng (431 hit, HP→1), bl1-death-F76-610-40pct (death screen), bl1-buff-pick1-first, bl2-F101-alive-HP-full. No shot for >50%-turn (none occurred). No screenshot of the bl2 自動換武器 line (transient, 推測 toast; text captured by driver). No 魔力合流/以太 shots (0 lines; 已驗證 by driver counters mh=0, et=0, whole scan of fight logs).

## Details
- bl1 F75 boss: 53 turns, potions 6→0, skills 20 — potion drain started F65-F75 (F65 29t, F70 26t, F75 53t). Potions at F70 start were 11 (vs rc12g 18-32). Merchants bl1 (11 entered): skipped when held ≥ thr 7; F72 held 7 bought 1 (thr 8), F74 held 5 bought 1 (1/merchant cap, 已驗證).
- bl1 death: F76 HP 1422→1023 (charge 503, minion 霜刃光靈, t2) → 584 (t6) → 432 (t8) → 1 (t10, 431) → dead t12 (610). The 'only ★' D/A alternation had 0 potions; ★ said 必敗 at t10/t11. Death return: Lv14→16, 2493 EXP / 59,045C earned, bring-back 50%×1.3.
- bl2 merchants (14 entered): 7 skipped; F84,89,92,94,99 held 5/5/5/6/3 bought 1 each. F70-F95 bosses drained potions 15→3 (F65 24t, F70 34t, F75 50t, F80 33t, F95 26t). Ended with 2 potions — very close to bl1's death profile (推測 survival partly luck).
- Key counts (已驗證, 只按★): bl1 A183 W37 Q34 Z39 E25 D63; bl2 A157 W70 Q52 Z45 E45 D49. Keys 1–6 (spells): 0 in both (★ never chose a spell although spell buttons were enabled ~half the turns). X/C: 0.
- 魔力合流 lines: 0 (both); 「你的法杖：魔力合流」: 0; 「你的法杖：以太分流」: 0; other 魔力合流 lines: 0. Expected for blade (已驗證).
- Buff ★ picks: bl1 (21): 生命祝福 迅捷調和 銳眼 鋒刃專精 千刃 破甲直覺 弱點洞察 處刑者 精準 磨利 良品嗅覺 韌魂 魂燃 王者氣魄 無盡戰意 戰意湧動 輕盈架勢 收斂心神 生命祝福 不滅【部分無效】(F71) 活力. bl2 (27): 鋒刃專精 弱點洞察 處刑者 破甲直覺 磨利 千刃 銳眼 精準 王者氣魄 戰意湧動 魂燃 節儉 無盡戰意 輕盈架勢 力量祝福 迅捷調和 良品嗅覺 收斂心神 先手氣勢 撕裂 韌魂 力量祝福 不滅【部分無效】(F80) 不動之盾【部分無效】(F85) 熱血 厚皮【部分無效】(F95) 生命祝福. 部分無效 tag: seen on 厚皮/震盪/不動之盾/不滅; ★ landed on 部分無效 cards 4 times (bl1 F71 不滅; bl2 F80 不滅, F85 不動之盾, F95 厚皮) when no fully-applicable card was offered (all alternatives 部分無效/無效). ★ never on 【無效】 (已驗證; first-buff lists: bl1/bl2 [★生命祝福, 力量祝福, 撕裂]).
- Low-HP map red text vs ★: lowmap trigger (HP<30% & ≤1 potion on map) never fired (0). In battle, c6 red 「這一擊只能靠保命活下來…先喝藥」 occurred bl1 5x (F68 t2/t22, F71 t12, F73 t2 ★Z; F76 t9 ★D with 0 potions, red text says 保命 only) and bl2 5x (F31 t3, F65 t14, F66 t2, F80 t28, F96 t10, all ★Z). ★ matched the red text every time (已驗證; at F76 t9 ★D = 防禦只靠保命).
- 必敗 shown at HP1/0 pot only (bl1 F76 t10-11).
- Caveat: the driver state textarea was not cleared between runs (fill of '' did not take), so cumulative counters (S.so/S.pm/dr/mEnt/rmn/rmc) at the end of bl2 include bl1; bl2 numbers above were obtained by subtracting the bl1 end snapshot, and per-boss rows (data.jsonl) are per run (已驗證). Per-run max normal/charge come from per-boss rows.
- Hit % bases: bl1 maxHP 998→1020→1034→1422→1526 (late); bl2 832→874→880→1123→1302.

## Feel (手感分數, 推測)
- bl1: 4/10 — died F76 with 0 potions after a 53-turn F75 boss; minion charge hits 431-610 (28-40% of maxHP) on a non-boss floor; ★ kept D/A alternating with no potions.
- bl2: 6/10 — cleared F100 but only 2 potions left; long mid/late bosses (34/50/33/26/22 turns) and potions 25→2; much weaker than rc12g (13→23/32 potions at end, bosses ≤28 turns).
推測: rc12j blade is clearly more attritional than rc12g (potion drain from F65 on; one death in two runs), likely related to lower maxHP (832-1123 in bl2 vs 1419-1589) — not verified.

---
# Update: blade 3 + bulwark 1 (build d8938eb; each run &fresh; driver state reset before each run — note: helper textarea only accepts writes while its tab is brought to front, so I re-init + bringToFront every call; bl3 Lv14/104,089C/0 abyss runs, bw1 Lv11/115,486C/0 abyss runs, 已驗證; shots bl3-badge-d8938eb, bw1-badge-d8938eb)
| run | result | pot start→end | boss turns | pot per boss (start→end) | max NORMAL boss hit | max CHARGE hit | 自動換武器 | 魔力合流/以太 | >50% turn | >40% hit |
|---|---|---|---|---|---|---|---|---|---|---|
| bl3 | F100 cleared (41t), alive F101 HP 1274/1310; 已驗證 | 13→4 | F30-F100: 6,23,2,2,17,25,13,26,31,24,65,21,22,34,41 (sum 352) | 24→23,25→22,24→24,27→27,27→25,21→17,17→16,19→17,20→17,20→18,19→11,12→10,11→9,11→8,8→4 | 221 = 20.0% of 1106 (F85 t17) | 381 = 29.9% of 1274 (F100 吸血重擊); F80 379 (37.7% of 1006), F70 342 (40.8% of 838), F85 317 | none (all boss 重擊/吸血重擊, no separate minion charge parsed) | 0 lines | 0 / 0 | none | 1: F70 t28 boss 重擊 342 = 40.8% of 838 (shot bl3-F70t28-boss-charge-342-41pct) |
| bw1 | DIED F75 boss fight t17 with 35 potions in bag; 已驗證 | 13→36 (at death; lost) | F30-F70: 1,1,1,6,7,5,6,3,15; F75 died at t17 (sum 45) | 22→22,25→25,27→27,30→29,32→31,32→32,35→34,35→35,37→36,36→36(died) | 129 = 11.8% of 1091 (F45); F75 74 (6.6%) | none from boss itself (parsed minion charges below): F70 354 (31.8% of 1115, 雷棘精靈 minion); F45 381 (34.9% of 1091, 霜棘精靈 minion); F75 ~390 (HP 404→14, 雷刃亡魂 minion charge, 35%) | 4: F15 尚可・浣熊之斧 → 普通・報喪女妖之斧; F25 普通・報喪女妖之斧 → 優良・報喪女妖之斧; F50 優良・報喪女妖之斧 → 華麗・迅捷之極寒棍棒; F60 優良・減幅之塔盾 → 華麗・減幅之秘銀鳶盾 (death screen says 9 auto-equips) | 0 / 0 | none | none (max 381 = 34.9%) |
Shots: bl3-F70t28-boss-charge-342-41pct, bl3-F101-alive, bw1-F75t13-HP1-35pot-potion-cooldown11, bw1-death-F75-thorns52-35pot. Dumps qa-saves/rc12j-blade-3-end.json, rc12j-bulwark-1-end.json. Deathlog bw1 appended; data.jsonl appended (bl3, bw1 rows).
## Blade 3 details
- Key counts (已驗證): A230 W82 Q70 E60 Z46 D60; keys 1–6: 0; X/C: 0. 魔力合流 / 以太分流 / other 魔力合流 lines: 0 (blade, 已驗證); no 自動換武器 line in bl3 at all (whole-body scan each loop incl. map).
- Boss fights bl3 are long and potion-hungry from F80: F80 65 turns (19→11, charge 379), F100 41 turns (8→4). Cleared with 4 potions left. maxHP 796→1274.
- ★ buff picks (28): 磨利 鋒刃專精 銳眼 弱點洞察 千刃 破甲直覺 處刑者 精準 尋寶者 良品嗅覺 無盡戰意 輕盈架勢 戰意湧動 魂燃 撕裂 不動之盾【部分無效 F55】 熱血 先手氣勢 靈巧 堅守 生命祝福 厚皮【部分無效 F75】 迅捷調和 活力 王者氣魄 生命祝福 收斂心神 韌魂. ★ on 部分無效: 2 (F55, F75); never on 【無效】. First buff [★磨利, 熱血, 生命祝福].
- c6 red text (「只能靠保命」): bl3 4x (F51 t4, F80 t25/t30/t52), ★Z each time = red 「先喝藥」 (已驗證). lowmap trigger: 0.
- Merchants (9): all skipped except F97 (held 7, bought 1).
- Feel (推測): bl3 6/10 — F100 cleared but late bosses 22-65 turns and potions 27→4; F70/F80 charges ≥ 37-41% of maxHP (maxHP 838/1006 low).
## Bulwark 1 — does difficulty jump after F65? YES (已驗證 from turn counters/logs)
| | F30–F65 (8 bosses) | F70+ |
|---|---|---|
| boss turns | 1,1,1,6,7,5,6,3 (avg 3.8, max 7) | F70 15, F75 died t17+ (fight unfinished) |
| potion drain per boss | 0–1 (pot 22→35 hoard, 36 at F70) | F70 −1; F75: potions never drunk in the last stretch (Z cooldown) |
| max normal boss hit | 129 (11.8%) F45, 119 F50, 28 F55, 0 elsewhere | F70 71, F75 74 (normal hits small) |
| max charge (minion/boss 蓄力一擊) | 381 (34.9%) F45 | F70 354 (31.8%), F75 ~390 (35%, HP 404→14) |
Reading: normal hits do not grow; the jump is in the minion/boss 蓄力一擊 (~350-390 = 32-35% of 1091-1115 maxHP) and fight length (F70 15t vs ≤7t). F30-F65 boss fights were trivial (30 turns total for 8 bosses) vs rc12g bulwark runs (F40 34t, F45 48t…) — rc12j bulwark is MUCH easier up to F65 (推測 due to the new preset/gear, not verified).
- Death mechanics (已驗證): F75 t9 HP 457/1115 (V「存活優先」★D, est next hit 558) → t11 404 → t12 14 → t13 HP 1 (必敗; Z button showed 「冷卻 11｜剩 35」 = potion on cooldown, so ★ could not drink with 35 potions in the bag) → t14 HP 106 → t16 HP 1 → t17 died to own 反傷 52 (5%) when ★A/Q hit a thorns enemy 迅捷狂戰・守門者・風鋼鐵偶. Death-screen advice: "HP 低於反傷值的兩倍時…不要再普攻有反傷的敵人". Potions were never the constraint (36 held) — the Z cooldown + ★ picking A (attack into 反傷) at HP ≤ 2×thorns was. Candidate bug/UX issue (推測): ★ (decision) picks A/Q at HP 1-106 into a reflect mob.
- Merchants bw1 (8): 7,9,14,17,24,44,67,69 all skipped (held ≥ 17 vs thr 7-8).
- Key counts bw1: A79 Q33 W10 E7 Z9 D38; keys 1–6: 0; X/C 0. 魔力合流/以太: 0/0 (bulwark).
- c6 red 「只能靠保命」: 5x (F50 t4 ★Z; F70 t6 ★Z; F75 t13/t14 ★D; F75 t15 ★Q): ★ matched the red text each time (「先喝藥」 at F50/F70; at F75 t13-15 red said 防禦只靠保命, ★D/Q) — 已驗證. lowmap trigger 0. 必敗 at F75 t13 and t16 (HP 1).
- Buff ★ picks (21): 鋒刃專精 弱點洞察 千刃 震盪 不滅 不動之盾 撕裂 靈巧 厚皮 堅守 活力 磨利 處刑者 良品嗅覺 節儉 無盡戰意 魂燃 戰意湧動 輕盈架勢 銳眼 收斂心神. First buff [★鋒刃專精, 王者氣魄, 收斂心神]. 部分無效 ★ picks: 0; ★ never on 【無效】.
- Death return: Lv11→14, 2151 EXP / 56,579C earned, 50%×1.3.
- Feel (推測): bw1 4/10 — trivial to F65 (3.8t avg bosses) then dies F75 holding 35 potions: ★ can't drink on cooldown and keeps attacking a 反傷 mob at HP 1 (suicide); rc12g-style attrition replaced by burst/cooldown deaths.

---
# Update: bulwark 2 + bulwark 3 (build d8938eb, preset postF20-bulwark&fresh; both Lv11 / 115,486C / 0 abyss runs fresh slot, 已驗證; 13 potions, 4x+跳過動畫, 深淵塔, ★-only; driver state reset before each run; shots bw2-badge-d8938eb, bw3-badge-d8938eb)
Driver drvRC12j.js now also logs (a) 「Z·生命藥水 冷卻 N」 with N>2 once per cooldown episode (first sighting: floor/turn/N/preceding keys+HP + shot, max 6) and (b) ★ A/Q/W/E at HP<30% when page text mentions 反傷 (once per floor:turn, shot max 3). Dumps qa-saves/rc12j-bulwark-{2,3}-end.json.
| run | result | pot start→end | boss turns F30..F100 | pot per boss (start→end) | max NORMAL boss hit | max CHARGE hit | 自動換武器 | 魔力合流/以太 | >50% turn | >40% hit |
|---|---|---|---|---|---|---|---|---|---|---|
| bw2 | F100 boss cleared (17t), alive F101 HP 858/1033; 已驗證 | 13→29 | 1,1,3,3,5,3,3,3,3,10,15,14,11,27,17 (sum 119) | 17→17,20→20,23→23,26→27,28→27,27→27,29→29,31→32,33→33,33→32,31→30,30→30,30→30,29→28,30→29 | 177 = 17.1% of 1033 (F95 t17; F100 normal not parsed) | 344 = 35.0% of 984 (F75 minion 炎角刺客 蓄力一擊, 招架); F90 313 (30%), F60 296 (30%); boss F100 吸血重擊 95 | 3: F20 尚可・浣熊之斧 → 優良・殺戮之極寒短劍; F70 優良・殺戮之極寒短劍 → 精良・公牛之暴風短劍; F75 精良・公牛之暴風短劍 → 華麗・奪心魔之雷擊斧 | 0 / 0 | none | none |
| bw3 | DIED F100 boss t36 (HP 1, 42 potions in bag, Z on cooldown 5 turns); 已驗證 | 13→43 (peak) →42 at death (lost) | F30-F95: 3,2,1,2,3,3,1,3,12,11,12,22,18,9; F100 36+ (died) | 18→18,21→21,23→23,27→27,31→32,35→35,34→34,36→36,35→34,38→37,40→39,40→41,41→41,43→43,43→42 (died) | 202 = 19.6% of 1033 (F25 non-boss 炎鐮蠍); boss normal max 55 (F80), F100 68 | 387 = 35.0% of 1107 (F80 minion 風冠亡魂 蓄力一擊, 格擋); F70 342 (30.9%) | 4: F5 尚可・浣熊之斧 → 優良・吸血鬼之短劍; F38 優良・吸血鬼之短劍 → 精良・浣熊之烈焰短劍; F55 優良・減幅之塔盾 → 華麗・守護之塔盾; F90 精良・浣熊之烈焰短劍 → 華麗・平衡之極寒棍棒 | 0 / 0 | none | none |
Shots: bw2-cd-F80t9-cd20…, bw2-cd-F90t5-cd25…, bw2-cd-F95t14-cd28…, bw2-cd-F100t12-cd30…, bw2-thorn-F95t25-starQ-HP178-cd17, bw2-F101-alive; bw3-cd-F70t9-cd16…, bw3-cd-F75t9-cd19…, bw3-cd-F80t9-cd21…, bw3-cd-F100t11-cd30…, bw3-F100t31-HP1-42pot-Z-cd10, bw3-death-F100t36-42pot-cd5. No >40% hit and no >50% turn occurred.
## F30–F65 vs F70+ (bulwark 2 & 3; combined with bw1 → 已驗證 all three runs)
| | F30–F65 (8 bosses) | F70+ |
|---|---|---|
| bw2 boss turns | 1,1,3,3,5,3,3,3 (sum 22, max 5) | 3,10,15,14,11,27,17 (sum 97, max 27) |
| bw3 boss turns | 3,2,1,2,3,3,1,3 (sum 18, max 3) | 12,11,12,22,18,9,36+ died (sum 120+, max 36+) |
| bw1 (earlier) | 1,1,1,6,7,5,6,3 (sum 30) | 15, 17+ died |
| potion drain per boss | ≈0 (potions grow 17→32 / 18→36) | still small: bw2 −1 per boss, bw3 −1 or +1 per boss; potions never run out (29 / 42 held) |
| max boss normal hit | bw2 0-53; bw3 0-9 (F30-65 bosses almost never hit) | bw2 98-177, bw3 52-68 |
| max minion/boss charge | bw2 296 (F60), 122 (F40); bw3 none | bw2 344, 313, 237; bw3 387, 342, 126 (≈30-35% max HP) |
YES, there is a jump at F70 (已驗證): boss fights go from 1–5 turns (bw3 ≤3) to 9–36 turns; charge hits of 30–35% of max HP appear on every boss from F70 (before, almost none). Normal boss hits stay small; potions are NOT the limiting resource (hoard 29–42) — survival is limited by the potion cooldown (below). Max HP is only 984–1107 at F70–F100 (vs 1091-1115 in bw1) so a 350-390 charge = 1/3 HP.
## Potion cooldown log (Z shows 「冷卻 N｜剩 X」; N counts DOWN 1/turn: bw2 F95 t14 cd 28 → t25 cd 17; bw3 F100 t11 cd 30 → t19 22 → t31 10 → death t36 5). First sighting after each drink (turn is ~2-3 turns after the Z press, so true initial cooldown is ≈2-3 higher; 已驗證):
| run | floor | turn | cd | preceded by (keys:HP) | shot |
|---|---|---|---|---|---|
| bw1 (previous) | F75 | t13 | 11 | HP→1 in 4 turns, 35 potions held | bw1-F75t13-HP1-35pot-potion-cooldown11 |
| bw2 | F80 | 9 | 20 | D:609,D:609,Z:265 → HP 875 (+719) | bw2-cd-F80t9-cd20-after-Z-HP265to875 |
| bw2 | F90 | 5 | 25 | W:672,D:513,Z:152 → HP 923 | bw2-cd-F90t5-cd25-after-Z-HP152to923 |
| bw2 | F95 | 14 | 28 | D:501,A:527,Z:262 → HP 620 | bw2-cd-F95t14-cd28-after-Z-HP262to620 |
| bw2 | F100 | 12 | 30 | A:418,A:418,Z:331 → HP 1033 (+702) | bw2-cd-F100t12-cd30-after-Z-HP331to1033 |
| bw3 | F70 | 9 | 16 | W:642,D:598,Z:211 → HP 1017 | bw3-cd-F70t9-cd16-after-Z-HP211to1017 |
| bw3 | F75 | 9 | 19 | D:720,D:720,Z:333 → HP 1024 | bw3-cd-F75t9-cd19-after-Z-HP333to1024 |
| bw3 | F80 | 9 | 21 | D:704,D:597,Z:210 → HP 1054 | bw3-cd-F80t9-cd21-after-Z-HP210to1054 |
| bw3 | F100 | 11 | 30 | A:550,D:508,Z:121 → HP 1029 | bw3-cd-F100t11-cd30-after-Z-HP121to1029 |
Pattern: cooldown length grows with depth (F70 ≈16, F75 ≈19, F80 ≈20-21, F90 25, F95 28, F100 30) and a drink heals ~700-900 (≈70-90% HP), so after a drink ★ is locked out for 16-30 turns; at F100 the next 20-30 turns must be survived with D/A/Q only. bw3 death: after the F100 t10 Z (HP 121→1029) HP went 1029 → 254 (t19, V存活優先 D) → 15 (t30) → 1 (t31) with Z still 冷卻 10 (42 potions held) → dead t36 to a 83 吸血重擊. The death screen itself says 「藥水沒用完，是還在冷卻（剩 42 瓶，冷卻還要 5 回合）… 冷卻中改用打斷技能（暈眩）、S·靈動架勢 或 D·防禦」. Same mechanism as bw1's F75 death (已驗證); bw2 survived F95/F100 by luck of timing (HP 178 at F95 t25 with cd 17).
Z presses total: bw2 15 (c6 red decisions 9: F15 t4, F25 t12, F80 t8, F81 t2, F90 t4/Q t11, F91 t0, F95 t13 Z/Q t25), bw3 12 (c6 10: F25 t9 Z, F70/75/80 t8 Z, F100 t10 Z then t22 Q, t28/29/30/32 D).
## ★ attacking 反傷 enemies at low HP (log)
- bw2 F95 t25: ★Q 盾擊 at HP 178/1033 (17%) vs 守護冰霜・守門者・霜冠光靈 (反傷 57 per hit; Z cd 17). Q hit for 41 + 反傷 -57 (shot bw2-thorn-F95t25-starQ-HP178-cd17), survived (HP 178 > thorn). Not lethal. (The driver wrote the same event 3x because the turn was re-entered after the stop; only 1 real instance.)
- bw3: 0 such events (HP<30% attack only happened at HP 1 where ★ chose D explicitly because 「攻擊…會吃反傷約 28 ≥ HP 1，會自殺」). So ★ avoided the thorn suicide in bw3 (contrast with bw1 F75 t17 death by 反傷 52 at HP 1 after ★A/Q at HP 75-106; that is the only lethal thorn case seen).
## Other checks
- Key counts: bw2 A125 Q55 W26 Z15 E14 D87; bw3 A117 Q57 W28 Z12 D81 E12; keys 1–6: 0 (both); X/C: 0. 魔力合流 / 以太分流 / other 魔力合流: 0 / 0 / 0 (bulwark; 已驗證).
- ★ buff picks: bw2 (25) 撕裂 不動之盾 堅守 不滅 震盪 厚皮 活力 靈巧 磨利 千刃 鋒刃專精 無盡戰意 弱點洞察 王者氣魄 迅捷調和 戰意湧動 魂燃 處刑者 輕盈架勢 良品嗅覺 精準 先手氣勢 尋寶者 銳眼 力量祝福; bw3 (27) 撕裂 不動之盾 活力 堅守 厚皮 不滅 靈巧 震盪 無盡戰意 弱點洞察 力量祝福 鋒刃專精 輕盈架勢 尋寶者 處刑者 千刃 戰意湧動 魂燃 良品嗅覺 王者氣魄 銳眼 節儉 韌魂 磨利 迅捷調和 破甲直覺 精準. 部分無效 ★ picks: 0 in both; ★ never on 【無效】. First buff: bw2 [輕盈架勢, 精準, ★撕裂]; bw3 [靈巧, 雷之印記【無效】, ★撕裂].
- c6 red 「只能靠保命」 vs ★: matched ★ in all 19 occurrences (Z when a potion was available, Q/D when on cooldown or 保命-only) — 已驗證. lowmap trigger: 0 in both. 必敗: bw3 F100 t31/34/35 (HP 1), bw2 never.
- Merchants: bw2 12 entered, bw3 15 entered, all skipped (held 14-43 ≥ thr 7-8).
- 自動換武器 captured: bw2 3, bw3 4 (lines above; death screen says 9 equips in bw3).
- bw3 death return: Lv11→15, 2914 EXP / 103,272C earned (50%×1.3).
## Feel (手感分數, 推測)
- bw2: 7/10 — easy to F70 (≤5-turn bosses), F75-F100 bosses 10-27 turns, finished with 29 potions; one near-miss at F95 (HP 178, Z cooldown 17).
- bw3: 4/10 — trivial to F65 (≤3 turns), F70+ 9-36 turns; died on the F100 boss with 42 potions because Z was on cooldown (~30 turns at F100) and ★ had only D/Q to hold; 1/3-HP charges (342-387) make a single bad window lethal.
推測 summary: bulwark in rc12j has a hard difficulty step at F70 and a potion-cooldown mechanic (new vs rc12g; 16-30 turns) that makes the potion hoard irrelevant; 2 of 3 bulwark runs died with ≥35 potions (bw1 F75, bw3 F100), the bw2 clear was timing luck. The ★ logic does not appear to plan around the cooldown (drinks at ~HP 120-330 then has no heal for 20-30 turns) — 推測 from patterns, not code-verified.

---
# Update: oc 1 + oc 2 (build d8938eb, preset postF20-oc&fresh; both Lv13 / 110,149C / 3 potions / 0 abyss runs = fresh slot, 已驗證; 13 potions bought, 4x+跳過動畫, 深淵塔, ★-only; driver state reset before each run; shots oc1-badge-d8938eb, oc2-badge-d8938eb)
Driver additions (drvRC12j.js live copy in helper; file patched earlier for cooldown/thorn): per-boss main-hand weapon (read from the map header's <details> [data-mapslot=mainHand] before each boss → `wpn` in fightEnd rows), per-boss and total counters for log lines 「你的法杖：魔力合流」 / 「你的法杖：以太分流」 (screenshot on first of each), cooldown (>2) + thorn logging kept. NOTE: the oc preset starts with a mace (精良・迅捷之棍棒) + tower shield — NOT a staff; no staff was ever equipped in either run.
| run | result | pot start→end | boss turns F30..F100 | pot per boss | main hand per boss | max NORMAL boss hit | max CHARGE hit | 自動換武器 | 「法杖：魔力合流」/「以太分流」 | >50% turn | >40% hit |
|---|---|---|---|---|---|---|---|---|---|---|---|
| oc1 | F100 boss cleared (15t), alive F101 HP 1420/1485; 已驗證 | 13→29 | 13,3,29,23,25,3,3,4,28,6,7,5,11,10,15 (sum 185) | 16→14,17→17,19→14,17→14,17→13,15→15,18→18,18→18,19→17,19→19,19→19,22→22,23→23,26→25,30→29 | F30-F40 精良・迅捷之棍棒 (mace); F45-F100 優良・殺戮之虛靈斧 (axe) | 225 = 27.2% of 828 (F25 t21 non-boss 風蹄骷髏); boss normal max 207 = 15.9% of 1305 (F65 minion), 195 F95, 169 F30 | 522 = 40.0% of 1305 (F70 minion 霜影機兵 蓄力一擊; exactly 40.0%, not >40); F45 386 (37%), F85 363, F40 307 | 3: F20 普通・石膚之塔盾 → 優良・海龜之塔盾; F43 精良・迅捷之棍棒 → 優良・殺戮之虛靈斧; F60 優良・海龜之塔盾 → 華麗・石膚之秘銀鳶盾 | 0 / 0 | none | none strictly (522 = 40.0%) |
| oc2 | F100 boss cleared (9t), alive F101 HP 879/1383; 已驗證 | 13→14 | 35,6,22,35,10,16,5,36,9,3,23,7,5,3,9 (sum 224) | 17→9,12→11,11→9,11→5,7→6,8→6,8→8,8→3,5→5,7→7,8→6,8→6,8→8,10→10,14→14 | F30-F90 精良・迅捷之棍棒 (mace); F95-F100 華麗・獵豹之棍棒 (mace) | 185 = 21.0% of 882 (F45); F30 166 | 403 = 33.8% of 1193 (F80 minion 霜鱗戰士); F65 376, F45 352, F30 boss 重擊 335 = 40.2% of 834 (被暴擊, shot oc2-F30t9-boss-charge-335-40pct-crit) | 2: F35 普通・石膚之塔盾 → 華麗・屏障之秘銀塔盾; F90 精良・迅捷之棍棒 → 華麗・獵豹之棍棒 | 0 / 0 | none | 1: F30 t9 boss 重擊 335 = 40.2% of 834 |
Shots: oc1-badge, oc1-F101-alive, oc2-badge, oc2-F30t9-boss-charge-335-40pct-crit, oc2-F101-alive. Dumps qa-saves/rc12j-oc-{1,2}-end.json. No 魔力合流/以太分流 line appeared so there is no first-of-each shot. No deaths (deathlog rows are 'no death').
## Details
- 「你的法杖：魔力合流」 lines: oc1 0, oc2 0; 「你的法杖：以太分流」 lines: 0, 0; other 魔力合流 lines: 0 (already counted by the older regex too). Per-boss counts all 0 (columns in data.jsonl). 已驗證. Weapon types: oc1 mace→axe (F43), oc2 mace→mace; no staff → staff procs are untestable with this preset (suggest a staff-equipped oc preset if procs are to be verified; 推測 that the oc preset is meant to carry a staff).
- Keys (已驗證): oc1 A109 W39 Q56 Z28 D84 E20; oc2 A126 Q57 W43 Z37 D103 E16. Spell keys 1–6: 0 in both (spell buttons enabled most turns but ★ never selected them — 已驗證, S.so.K has no digit keys). X/C: 0.
- Potion cooldown (Z 冷卻 N>2): NO episode logged in either oc run (0 cd events), even though ★Z was pressed after F70 (oc1 F70 t7; oc2 F80 t10, F85 t3) — unlike bulwark where cd 16-30 appeared from F70 on. At F30 oc2 t9 screenshot Z read 「冷卻 1」. 推測: cooldown length depends on class/preset or HP (not verified), or first sighting fell on a turn where it was ≤2. Thorn (★ A/Q/W/E <30% HP vs 反傷): 0 events in both.
- Difficulty profile: oc1 is easy after F50 (≤11 turns except F70 28t); oc2 is HARD early: F30 35t (potions 17→9), F45 35t (11→5), F65 36t; potions stayed 3-11 for most of the run (merchant top-ups of +1 at F47–F89, 20 merchants) yet it never fell below 3 and cleared F100 in 9 turns. oc2 F30 boss: 35 turns, 335 重擊 = 40.2% of 834 maxHP (crit) — the only >40% hit. oc maxHP 828→1485 (oc1), 834→1383 (oc2).
- Merchants: oc1 10 entered, all skipped (held ≥11); oc2 20 entered, bought 1 at F47,49,52,54,57,59,69,72,74,77,82,84,87,89 (held 4-7 < thr 7-8) — 1/merchant (已驗證).
- c6 red text (「只能靠保命」) vs ★: oc1 9, oc2 10 occurrences, ★Z every time (已驗證). lowmap trigger 0; 必敗 0.
- ★ buff picks: oc1 (30) 熱血 戰意湧動 輕盈架勢 先手氣勢 韌魂 魂燃 收斂心神 王者氣魄 無盡戰意 生命祝福 處刑者 良品嗅覺 弱點洞察 力量祝福 節儉 鋒刃專精 磨利 千刃 不滅 迅捷調和 震盪 尋寶者 不動之盾 撕裂 力量祝福 銳眼 破甲直覺 生命祝福 靈巧 力量祝福; oc2 (25) 先手氣勢 戰意湧動 韌魂 輕盈架勢 魂燃 熱血 收斂心神 無盡戰意 力量祝福 王者氣魄 處刑者 弱點洞察 千刃 鋒刃專精 迅捷調和 良品嗅覺 不滅 精準 不動之盾 震盪 破甲直覺 磨利 撕裂 生命祝福 節儉. 部分無效 ★ picks: 0 both; ★ never on 【無效】. First buff: oc1 [撕裂, ★熱血, 破甲直覺]; oc2 [★先手氣勢, 鋒刃專精, 韌魂].
- Feel (推測): oc1 8/10 — clears, F70 28t with a 40.0% minion charge but otherwise smooth; oc2 6/10 — grindy early (F30/F45/F65 ≈35 turns, 8 potions per boss at F30) then easy; 1-HP margin never seen.

---
# Update: oc 3 + arcane 1 (build d8938eb; oc3 preset postF20-oc&fresh Lv13/110,149C; ar1 preset postF20-arcane&fresh Lv14/117,286C, both fresh, 已驗證; 13 potions bought, 4x+跳過動畫, 深淵塔, ★-only; driver state reset; shots oc3-badge, ar1-badge)
Driver addition: counter/events for ★A while ≥1 spell button enabled (MP sufficient implied by enabled button; MP logged) with decision text, plus check for 「炎爆」 in the ★ decision text. Cooldown/thorn/weapon/staff-line logging kept.
| run | result | pot start→end | boss turns F30..F95 (F100 cleared, turns row not emitted) | pot per boss (start→end) | main hand per boss | max NORMAL boss hit | max CHARGE hit | 自動換武器 | 「法杖：魔力合流」/「以太分流」 | >50% turn | >40% hit |
|---|---|---|---|---|---|---|---|---|---|---|---|
| oc3 | F100 boss cleared, alive F101 HP 771/1208, 已驗證 | 13→28 | 5,3,3,8,36,3,19,15,3,12,3,15,11,3 | 18→17,17→17,19→19,21→21,23→18,21→21,24→21,22→20,22→22,24→23,24→24,25→25,26→26,28→28 | mace 精良・迅捷之棍棒 F30-55; 華麗・敏捷者之脇差 F60-85; 華麗・殺戮之暴風斧 F90+ | 106 (F35 boss minion) ; non-boss max 182 = 22.8% of 798 (F20) | 338 = 40.0% of 846 (F50 boss-fight minion 雷棘鳳凰 蓄力一擊; exactly 40.0%, not >40) | 2: F60 迅捷之棍棒 → 敏捷者之脇差; F90 敏捷者之脇差 → 殺戮之暴風斧 | 0 / 0 (no staff) | none | none strictly |
| ar1 | F100 boss cleared, alive F101 HP 456/959 with 0 potions; 已驗證 | 13→0 | 8,20,14,18,13,11,12,25,10,11,15,14,16,30 | 14→13,12→9,12→11,11→9,10→9,12→12,12→11,13→7,9→8,9→8,9→8,8→7,9→8,8→2 (F100 boss fought with 2 → 0) | staff at EVERY boss: 尼福爾海姆之紅木杖 F30-45; 魔鬼之鐵木杖 F50; 貓頭鷹之惡魔鐵木杖 F55-95; F100 swapped to 華麗・蘇爾特之烏木杖 (all 杖) | 191 = 19.9% of 959 (F95 minion 鐵壁守護・風影妖精; boss normal max 174 F50/F55) | 335 = 34.9% of 959 (F95, 霜角元素靈 蓄力一擊 minion); boss charge F65 221 | 4: F25 烏木杖+2 → 尼福爾海姆之紅木杖; F47 → 魔鬼之鐵木杖; F50 → 貓頭鷹之惡魔鐵木杖; F100 → 蘇爾特之烏木杖 | 14 / 7 (first 以太分流 F10 t5, first 魔力合流 F16 t0; per-boss: F35 1/0, F40 1/0, F45 1/1, F50 2/0, F55 2/0, F85 1/2) | none | none |
Shots: oc3-badge, oc3-F101-alive, ar1-badge, ar1-F10t5-first-以太分流 (log line visible), ar1-F16t0-first-魔力合流-logline-scrolled-off (line text recorded in data events only; screenshot caught the following charge-warning view), ar1-F101-alive-0pot. Dumps qa-saves/rc12j-oc-3-end.json, rc12j-arcane-1-end.json. No deaths.
## Details
- ar1 keys (已驗證): 1:87 2:39 3:66 4:4 5:13 6:64 A:19 Z:44 D:84 Q:11 (spell keys 1–6 total 273). ★ uses spells heavily (first press F1); keys 1–6 all used.
- ★A while a spell was usable & MP sufficient: 19 turns of 432 spell-enabled turns (mp full e.g. 41/41, 61/61). ALL 19 are 「★A·秘法打擊」 with reason 「目標魔力合流中：秘法打擊可觸發以太分流」 (deliberate staff-synergy move, not a plain-attack fallback). Plain 「普通攻擊」 A with spells available: 0 in ar1 (已驗證). Contrast oc3: 83 plain-attack A turns with spells enabled (「普通攻擊」), oc has a mace, and those happen from F1 — so the "no longer happens" claim holds for arcane with a staff, but oc (non-staff) still does it (已驗證 counts; whether it's intended = 推測).
- ★ text quick-cast of 炎爆: 0 occurrences of 「炎爆」 in any A decision/reason text (A is 秘法打擊, not a 炎爆 quick-cast). Note keys 1 (烈焰爆破) is pressed directly 87 times. 已驗證.
- 魔力合流 lines: ar1 14 (「你的法杖：魔力合流（Coalesced Mana）→ <target> 5 回合（對牠施法 MP 消耗減半）」), 以太分流 7 (「…之後 4 回合每回合回復 2% 基礎 MP」); other 魔力合流 lines (not starting 你的法杖：): 0 beyond the 「目標魔力合流中」 decision text. oc3: 0/0.
- oc3 keys: A83 Q52 W36 Z20 E20 D85; spell keys 0 (spells enabled 296 turns, ★ never chose them). Cooldown (Z 冷卻>2) events: 0 in both runs; thorn (★ attack vs 反傷 at <30% HP): 0 in both. W 冷卻11 was seen at F88 (oc3 W button, not Z).
- ar1 hardness: ar1 potion drain is steep — stock fell 13→9 by F45, merchant top-ups only +1 at F67, F87, F97, F99 (threshold 7; held ≥7 mostly), F65 boss 25t 13→7, F95 boss 30t 8→2, F100 cleared with the last potions (0 left, HP 456/959, shot ar1-F101-alive-0pot; map low-HP red text 「HP 456/959 只剩一半以下：建議先喝藥」 appeared but no potion and ★ proceeded to retreat-less cap). Margin thin: 推測 a bit worse luck = death.
- c6 red 「只能靠保命」 vs ★: oc3 7, ar1 9; ★ chose Z each time (已驗證). lowmap red text vs ★ on the map at F101 (ar1): text recommends 喝藥 but 0 potions, so unmatched-by-necessity.
- ★ buff picks: oc3 (29) 魂燃 戰意湧動 輕盈架勢 收斂心神 王者氣魄 熱血 先手氣勢 韌魂 無盡戰意 良品嗅覺 力量祝福 鋒刃專精 弱點洞察 破甲直覺 千刃 節儉 處刑者 震盪 迅捷調和 銳眼 撕裂 不動之盾 磨利 靈巧 精準 厚皮 力量祝福 不滅 活力; ar1 (26) 良品嗅覺 元素共鳴 火之印記 節能詠唱 冥想 冰之印記 大秘儀 雷之印記 魔力池 澄心 撕裂 不滅 王者氣魄 不動之盾 魂燃 戰意湧動 輕盈架勢 堅守 迅捷調和 活力 靈巧 韌魂 力量祝福 無盡戰意 熱血 尋寶者. 部分無效 ★ picks: 0; ★ never on 【無效】 (first buff ar1: [破甲直覺【無效】, ★良品嗅覺, 收斂心神]).
- Merchants: oc3 17 entered, bought 0 (held ≥16); ar1 8 entered, bought +1 at F67/87/97/99.
- Feel (推測): oc3 8/10 (clean; F50 36t); ar1 5/10 — spell rotation works and staff procs fire, but potion economy collapses (13→0) and F95/F65 bosses are 25-30 turns; clear is barely.

---
# Update: arcane 2 (ar2; build d8938eb, postF20-arcane&fresh, Lv14/117,286C, 13 potions; driver reset; ar3 NOT run per producer instruction; shot ar2-badge-d8938eb)
Driver fix before run: fightEnd is now also emitted when the F101 cap screen is reached (so F100 boss turn row is captured); not exercised because ar2 died at F85.
| run | result | pot start→end | boss turns F30..F80 (F85 died t23) | pot per boss | main hand | max NORMAL boss hit | max CHARGE hit | 自動換武器 | 魔力合流/以太分流 | >50% turn | >40% hit |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ar2 | DIED F85 boss 守護嗜血・塔主・霜羽機兵 (turn 23, 0 potions); 已驗證 | 13→0 | 14,7,15,25,17,16,17,12,17,13,27,(22+) | 17→14,14→14,15→13,15→12,11→8,8→6,8→5,7→6,8→5,6→4,6→2,2→0 | staff at EVERY boss: 優良・毀滅之橡木杖 (from F20) | 185 = 25.6% of 724 (F50 minion 鐵壁尖刺・霜翼巨人); F85 boss 144 | 162 = 22.4% (F85 boss 重擊, t22); F50 68; F55 136 | 1: F20 烏木杖+2 → 毀滅之橡木杖 | 7 / 2 (first 魔力合流 F10 t2, first 以太分流 F60 t15) | none | none |
Shots: ar2-badge, ar2-F10t2-first-魔力合流, ar2-F60t15-first-以太分流, ar2-death-F85. Dump qa-saves/rc12j-arcane-2-end.json.
## Details
- Keys (已驗證): 1:56 2:48 3:38 4:5 5:24 6:24 A:13 Z:41 D:79 Q:11 (spell keys 1–6 = 195).
- ★A with a spell usable and MP enough: 13 turns; 11 = 「★A·秘法打擊」 (目標魔力合流中 → 以太分流 synergy), 2 = plain 「★A·攻擊」: F15 t4 (reason 「HP 安全…不需防禦」, MP/spell state not recorded as short) and F85 t22 (HP 1, no potions → 「直接輸出」, 必敗). So the rc claim "never plain-A with spell available" is NOT fully clean in ar2: 2 plain-A turns (F15 t4 one is unexplained, 推測 a spell-less/low-MP case I didn't verify; F85 t22 is the dying turn). 炎爆 quick-cast text: 0 occurrences.
- Death: F85 boss. Potions ran out because the run drained from F30 (17→2 at F80) with +1 top-ups at only 11 merchants (threshold ~7; held ≤7 so bought 1 each). maxHP stayed 724 all run (no HP growth) vs ar1's 959 — ar2 had a less lucky gear path (推測). F80 boss took 27 turns (6→2 potions); F85 boss: t19 雷擊 1199 dmg, t20 HP 163, 重擊 162 → HP 1 (保命), t23 96 killed.
- Cooldown (Z 冷卻>2) events 0; thorn events 0; c6 red text 8 occurrences, ★Z each time (X1 sc=1 once).
- ★ buff picks (19): 節能詠唱 元素共鳴 澄心 冥想 魔力池 冰之印記 火之印記 雷之印記 大秘儀 戰意湧動 魂燃 良品嗅覺 輕盈架勢 無盡戰意 王者氣魄 先手氣勢 撕裂 靈巧 迅捷調和; 部分無效 picks 0. Merchants: 16 entered, +1 at F57,59,62,64,67,69,72,74,77,79,84.
- Feel (推測): 3/10 — spells work but potion economy and 724 maxHP make F75+ bosses (13-27 turns) a coin flip; died with the drain visible from F50.
