DONE rc12ad
# rc12ad QA (build 1f424a4)；事件檔 /workspace/rc12ad-evflush.jsonl
- bw1 起點事件行 0；prep: 自動分配 + 補藥至 13 (bulwark 持 ✦4 ☯1)

## bw1 (事件行 1–983)
- **死於 F60 首領戰（boss），回合 8，0 瓶**。死前 3 回合(maxHP 1107)：T6 -330；T7 -188；T8 -93（尖刺狂戰・災厄・霜鬃術士 首領 93=8%）；最後 2 回合最大單擊 霜鱗魔像 119(11%)，皆非蓄力一擊(首領戰小怪)；無 3 連。F60 首領前藥水 1 瓶。
```
bw1 lastF 60 kinds emembcbrbcembcbrememecememembcbrbmerbmbmbmbmbmbm
ckpt {10: 12, 20: 8, 30: 9, 40: 8, 50: 7, 60: 1}
BOSS F45+:
 F 45 t 9 pot 8 -> 8 rw 1 hp1 [401, 1107]
 F 50 t 10 pot 7 -> 6 rw 1 hp1 [598, 1107]
 F 55 t 16 pot 5 -> 3 rw 1 hp1 [572, 1107]
elite F15-69 [(21, 1), (23, 1), (26, 0), (28, 1), (31, 0), (33, 0), (43, 0)] F70+ []
floors with charged hits 12 max run overall
 floor 56 battle chargedTurns 4 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 58 battle chargedTurns 8 maxrun 2 maxhit24.9% maxturnTot24.9% 
maxhit (34.959349593495936, 43, 1) maxturn (34.959349593495936, 58, 8)
hits>40.0: [] turn>50: []
est [(5, 6, 245, 147), (10, 4, 409, 167), (25, 4, 508, 220), (35, 4, 574, 250)]
F45-69 node:pots 45b:1 46b:0 47m:0 48b:0 49m:0 50b:2 51b:0 52m:0 53b:0 54m:0 55b:3 56b:0 57m:0 58b:0 59m:0 60b:0
totdrinks 16 F45-69 drinks 6
normal fights 14 turns [2, 2, 4, 2, 6, 3, 6, 8, 14, 14, 17, 13, 19, 23]
normal>=20 [(58, 23)]
nonboss charging turns 49 K=A 31 D/defend 7
  D (43, 1, 'D', '說明：D·防禦（敵人蓄力中，HP 873 撐得住，不必喝藥；下回合最多可能受 553（≥ 最大 HP 40%））（小怪不受蓄力鎖）', '第 43 層 · 精英 · 回合 1 · 敵人蓄力中！ · 建議 ★D·防禦 ‖ 尖刺守護狂戰・風羽野豬 正在蓄力！')
  D (46, 8, 'Z', '說明：Z·生命藥水（剩 7 瓶）或 D·防禦（防禦後估計 221 < HP 223）（HP 偏低：223/1107（≤ 35%））', '霜鐵野豬 正在蓄力！')
  D (56, 7, 'D', '說明：D·防禦（不防禦會死：下回合全體暴擊估計 554 ≥ HP 499；防禦後估計 387 < HP 499，防禦後撐得住，先不喝藥）（小', '第 56 層 · 戰鬥 · 回合 7 · 敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎影甲蟲 正在蓄力！')
  D (56, 8, 'A', '說明：A·攻擊 或 D·防禦（防禦後估計 387）（下回合最多可能受 554（≥ 最大 HP 40%），HP 914 還夠，不必喝藥）（小怪', '第 56 層 · 戰鬥 · 回合 8 · 防禦中 · 敵人蓄力中！ · 建議 ★A·攻擊 ‖ 霜眼巨人 正在蓄力！')
  D (58, 7, 'D', '說明：D·防禦（不防禦會死：下回合全體暴擊估計 554 ≥ HP 499；防禦後估計 387 < HP 499，防禦後撐得住，先不喝藥）（小', '第 58 層 · 戰鬥 · 回合 7 · 敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎冠雙頭龍 正在蓄力！')
  D (58, 8, 'A', '說明：A·攻擊 或 D·防禦（防禦後估計 387）（下回合最多可能受 554（≥ 最大 HP 40%），HP 638 還夠，不必喝藥）（小怪', '第 58 層 · 戰鬥 · 回合 8 · 防禦中 · 敵人蓄力中！ · 建議 ★A·攻擊 ‖ 炎翼騎士 正在蓄力！')
  D (58, 21, 'D', '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 276 ≥ HP 223）：這一擊只能靠保命活下來，之後再被打就會倒下，', '第 58 層 · 戰鬥 · 回合 21 · 靈動架勢 · 敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎翼騎士 正在蓄力！')
grp total 17 inside 0 below_lo 17 above_hi 0 skipped 4
```
- 截圖 qa-cp9-rc12ad-shots/bw1-death.webp；save qa-saves/rc12ad-bulwark-1-end.json

## bw2 (事件行 984–1941)
- prep：自動分配、補藥至 13，截圖 bw2-prep.webp。**死於 F61 普通戰（normal），回合 17，0 瓶**。死前 3 回合(maxHP 1115)：T15 -73；T16 -52（炎角蛇龍 蓄力一擊，格擋後 52=4.7%，蓄力）；T17 -167 炎角蛇龍 普攻(15.0%)。蓄力連續 1 回合，無 3 連。HP 於 T16 為 1，無藥水（F60 首領戰後耗盡），★ 推 A（無選項）。
```
bw2 lastF 61 kinds emececeremecemecbcembcbrbcecbmbmbcemecembmbmbmbmb
ckpt {10: 13, 20: 13, 30: 12, 40: 9, 50: 7, 60: 2}
BOSS F45+:
 F 45 t 6 pot 8 -> 8 rw 1 hp1 [948, 1115]
 F 50 t 7 pot 7 -> 6 rw 1 hp1 [837, 1115]
 F 55 t 15 pot 4 -> 3 rw 1 hp1 [813, 1115]
 F 60 t 14 pot 2 -> 1 rw 1 hp1 [503, 1115]
elite F15-69 [(16, 1), (18, 0), (23, 0), (33, 0), (43, 0), (46, 0), (48, 0)] F70+ []
floors with charged hits 12 max run overall
 floor 53 battle chargedTurns 5 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 56 battle chargedTurns 5 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 61 battle chargedTurns 7 maxrun 2 maxhit24.9% maxturnTot24.9% 
maxhit (40.0, 48, 12) maxturn (40.0, 48, 12)
hits>40.0: [] turn>50: []
est [(20, 4, 407, 107), (25, 4, 279, 182), (25, 9, 300, 96), (30, 1, 491, 109)]
F45-69 node:pots 45b:1 46e:0 47c:0 48e:0 49m:0 50b:2 51b:0 52m:0 53b:0 54m:0 55b:2 56b:0 57m:0 58b:0 59m:0 60b:1 61b:0
totdrinks 12 F45-69 drinks 6
normal fights 12 turns [2, 3, 2, 5, 8, 5, 11, 12, 15, 20, 14, 17]
normal>=20 [(56, 20)]
nonboss charging turns 44 K=A 26 D/defend 11
  D (48, 1, 'D', '說明：D·防禦（敵人蓄力中，HP 1105 撐得住，不必喝藥；下回合最多可能受 558（≥ 最大 HP 40%））（小怪不受蓄力鎖）', '第 48 層 · 精英 · 回合 1 · 敵人蓄力中！ · 建議 ★D·防禦 ‖ 尖刺烈焰迅捷・霜紋幽魂 正在蓄力！')
  D (48, 9, 'Z', '說明：Z·生命藥水（剩 8 瓶）或 D·防禦（防禦後估計 390 < HP 440）（不防禦會死：下回合全體暴擊估計 558 ≥ HP 44', '第 48 層 · 精英 · 回合 9 · 敵人蓄力中！ · 建議 ★Z·生命藥水 ‖ 尖刺烈焰迅捷・霜紋幽魂 正在蓄力！')
  D (53, 2, 'A', '說明：A·攻擊 或 D·防禦（防禦後估計 390）（下回合最多可能受 558（≥ 最大 HP 40%），HP 837 還夠，不必喝藥）（小怪', '第 53 層 · 戰鬥 · 回合 2 · 靈動架勢 · 敵人蓄力中！ · 建議 ★A·攻擊 ‖ 闇晶妖精 正在蓄力！')
  D (56, 1, 'A', '說明：A·攻擊 或 D·防禦（防禦後估計 390）（下回合最多可能受 558（≥ 最大 HP 40%），HP 757 還夠，不必喝藥）（小怪', '第 56 層 · 戰鬥 · 回合 1 · 敵人蓄力中！ · 建議 ★A·攻擊 ‖ 雷影地龍 正在蓄力！')
  D (56, 2, 'D', '說明：D·防禦（不防禦會死：下回合全體暴擊估計 558 ≥ HP 479；防禦後估計 390 < HP 479，防禦後撐得住，先不喝藥）（小', '第 56 層 · 戰鬥 · 回合 2 · 敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜鱗星靈 正在蓄力！')
  D (56, 11, 'A', '說明：A·攻擊 或 D·防禦（防禦後估計 390）（下回合最多可能受 558（≥ 最大 HP 40%），HP 670 還夠，不必喝藥）（小怪', '第 56 層 · 戰鬥 · 回合 11 · 敵人蓄力中！ · 建議 ★A·攻擊')
  D (61, 7, 'D', '說明：D·防禦（不防禦會死：下回合全體暴擊估計 558 ≥ HP 503；防禦後估計 390 < HP 503，防禦後撐得住，先不喝藥）（小', '第 61 層 · 戰鬥 · 回合 7 · 敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎角蛇龍 正在蓄力！')
  D (61, 8, 'A', '說明：A·攻擊 或 D·防禦（防禦後估計 390）（下回合最多可能受 558（≥ 最大 HP 40%），HP 643 還夠，不必喝藥）（小怪', '第 61 層 · 戰鬥 · 回合 8 · 防禦中 · 敵人蓄力中！ · 建議 ★A·攻擊 ‖ 霜冠豹 正在蓄力！')
grp total 20 inside 0 below_lo 20 above_hi 0 skipped 4
```
- 截圖 qa-cp9-rc12ad-shots/bw2-death.webp；save qa-saves/rc12ad-bulwark-2-end.json

## bw3 (事件行 1942–3211)
- prep：自動分配、補藥至 13，截圖 bw3-prep.webp。**死於 F81 普通戰（normal），回合 15，0 瓶**。死前 3 回合(maxHP 1222)：T13 -382（風牙蜈蚣 普攻 183=15.0% + 雷甲元素靈 蓄力一擊 199=16.3%〔招架〕，合計 31.3%）；T14 -115；T15 -183 雷甲元素靈 普攻(15.0%)。蓄力連續 T12(風牙蜈蚣 305 閃避)、T13 = 2 回合，T14 無 → 無 3 連。F80 首領前僅 1 瓶。藥水 ckpt F10 13/F20 12/F30 13/F40 16/F50 16/F60 13/F70 11/F80 1。F70 首領 +1 ✓、F75 +0 ✓、F80 +1 ✓。F81 估計：F81 T12 estmis(實際 382 > 預估 hi 305*1.25，雙怪同回合)。
```
bw3 lastF 81 kinds ececemerememececececbcbrecemecembcerbcembcerbcemecbrecembcbmbmbmb
ckpt {10: 13, 20: 12, 30: 13, 40: 16, 50: 16, 60: 13, 70: 11, 80: 1}
BOSS F45+:
 F 45 t 13 pot 17 -> 16 rw 1 hp1 [685, 1222]
 F 50 t 7 pot 16 -> 16 rw 1 hp1 [632, 1222]
 F 55 t 8 pot 15 -> 15 rw 1 hp1 [452, 1222]
 F 60 t 12 pot 13 -> 11 rw 1 hp1 [1039, 1222]
 F 65 t 12 pot 11 -> 10 rw 1 hp1 [856, 1222]
 F 70 t 4 pot 11 -> 12 rw 1 hp1 [610, 1222]
 F 75 t 3 pot 8 -> 8 rw 0 hp1 [619, 1222]
 F 80 t 11 pot 1 -> 1 rw 1 hp1 [719, 1222]
elite F15-69 [(16, 0), (18, 0), (21, 0), (23, 1), (31, 1), (33, 1), (36, 1), (38, 0), (43, 1), (48, 0), (53, 0), (58, 0), (61, 1), (66, 1), (68, 0)] F70+ []
floors with charged hits 17 max run overall
 floor 71 battle chargedTurns 6 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 73 battle chargedTurns 4 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 76 battle chargedTurns 8 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 78 battle chargedTurns 8 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 81 battle chargedTurns 6 maxrun 2 maxhit25.0% maxturnTot25.0% 
maxhit (39.93453355155483, 53, 1) maxturn (39.93453355155483, 78, 9)
hits>40.0: [] turn>50: []
est [(35, 4, 263, 86), (40, 1, 476, 361), (45, 4, 428, 183), (60, 9, 483, 189)]
F45-69 node:pots 45b:2 46b:0 47c:0 48e:0 49m:0 50b:1 51b:0 52c:0 53e:0 54r:0 55b:1 56b:0 57c:0 58e:0 59m:0 60b:3 61e:0 62c:0 63b:0 64r:0 65b:2 66e:0 67c:0 68e:0 69m:0
totdrinks 13 F45-69 drinks 9
normal fights 12 turns [3, 3, 8, 3, 8, 9, 16, 18, 19, 27, 26, 15]
normal>=20 [(76, 27), (78, 26)]
nonboss charging turns 70 K=A 31 D/defend 15
  D (41, 3, 'Z', '說明：Z·生命藥水（剩 17 瓶）或 D·防禦（防禦後估計 244 < HP 307）（HP 偏低：307/1222（≤ 35%））', '風羽精靈 正在蓄力！')
  D (61, 7, 'D', '說明：D·防禦（敵人蓄力中，HP 1031 撐得住，不必喝藥；下回合最多可能受 610（≥ 最大 HP 40%））（小怪不受蓄力鎖）', '第 61 層 · 精英 · 回合 7 · 敵人蓄力中！ · 建議 ★D·防禦 ‖ 守護尖刺冰霜・霜眼殭屍 正在蓄力！')
  D (63, 7, 'D', '說明：D·防禦（不防禦會死：下回合全體暴擊估計 611 ≥ HP 551；防禦後估計 427 < HP 551，防禦後撐得住，先不喝藥）（小', '第 63 層 · 戰鬥 · 回合 7 · 敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜爪野豬 正在蓄力！')
  D (71, 7, 'D', '說明：D·防禦（不防禦會死：下回合全體暴擊估計 611 ≥ HP 551；防禦後估計 427 < HP 551，防禦後撐得住，先不喝藥）（小', '第 71 層 · 戰鬥 · 回合 7 · 敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜牙魔像 正在蓄力！')
  D (71, 8, 'A', '說明：A·攻擊 或 D·防禦（防禦後估計 427）（下回合最多可能受 611（≥ 最大 HP 40%），HP 1009 還夠，不必喝藥）（小', '第 71 層 · 戰鬥 · 回合 8 · 防禦中 · 敵人蓄力中！ · 建議 ★A·攻擊 ‖ 霜眼幻靈 正在蓄力！')
  D (73, 8, 'A', '說明：A·攻擊 或 D·防禦（防禦後估計 427）（下回合最多可能受 611（≥ 最大 HP 40%），HP 917 還夠，不必喝藥）（小怪', '第 73 層 · 戰鬥 · 回合 8 · 靈動架勢 · 敵人蓄力中！ · 建議 ★A·攻擊 ‖ 雷尾地龍 正在蓄力！')
  D (76, 3, 'Z', '說明：Z·生命藥水（剩 8 瓶）或 D·防禦（防禦後估計 244 < HP 421）（HP 偏低：421/1222（≤ 35%））', '炎尾巨人 正在蓄力！')
  D (76, 8, 'A', '說明：A·攻擊 或 D·防禦（防禦後估計 427）（下回合最多可能受 611（≥ 最大 HP 40%），HP 673 還夠，不必喝藥）（小怪', '第 76 層 · 戰鬥 · 回合 8 · 敵人蓄力中！ · 建議 ★A·攻擊 ‖ 霜鋼機兵 正在蓄力！')
grp total 24 inside 0 below_lo 24 above_hi 0 skipped 14
```
- 截圖 qa-cp9-rc12ad-shots/bw3-death.webp；save qa-saves/rc12ad-bulwark-3-end.json

## oc1 (事件行 3212–4150)
- prep：自動分配、補藥至 13（oc 持 ✦3 ☯3），截圖 oc1-prep.webp。**撤退於 F64（非死亡；retreatStar：HP 18%、藥水 0）**。圖為撤退畫面。F63 普通戰打到 T26（風影虎 每 3 回合蓄力 255=25.0%：T17/T20/T23，不連續；T26 盾擊暈眩 6 回合）；★ 該戰顯示『A·攻擊（小怪不受蓄力鎖）』即 ★=A（HP 足夠時）。T26 規則：T26 無新蓄力、單擊 ≤15%（本戰 T26 受 0）；未存 T26 截圖（driver 尚未加觸發，之後的 run 補）。最大單回合 50.0% 為 F55 首領戰（未 >50）。
```
oc1 lastF 64 kinds ececececemembmbrecememembcecbcerbcemecembcbcbmbmbcbr
ckpt {10: 13, 20: 12, 30: 13, 40: 14, 50: 14, 60: 3}
BOSS F45+:
 F 45 t 11 pot 15 -> 14 rw 1 hp1 [508, 846]
 F 50 t 10 pot 14 -> 13 rw 1 hp1 [677, 846]
 F 55 t 16 pot 9 -> 6 rw 1 hp1 [636, 1058]
 F 60 t 3 pot 3 -> 4 rw 1 hp1 [625, 1058]
elite F15-69 [(21, 0), (23, 0), (26, 1), (28, 1), (33, 0), (38, 0), (43, 0), (46, 0), (48, 0)] F70+ []
floors with charged hits 11 max run overall
 floor 53 battle chargedTurns 5 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 58 battle chargedTurns 6 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 63 battle chargedTurns 9 maxrun 2 maxhit25.0% maxturnTot25.0% 
maxhit (39.952718676122934, 20, 6) maxturn (50.0, 55, 4)
hits>40.0: [] turn>50: []
est [(15, 6, 423, 169), (20, 1, 423, 195), (20, 6, 423, 338), (20, 7, 423, 186)]
F45-69 node:pots 45b:2 46e:0 47c:0 48e:0 49m:0 50b:2 51b:0 52c:0 53b:0 54c:0 55b:4 56b:0 57m:0 58b:0 59m:0 60b:0 61b:0 62c:0 63b:0 64r:0
totdrinks 11 F45-69 drinks 8
normal fights 11 turns [2, 2, 2, 8, 3, 11, 17, 24, 24, 26, 28]
normal>=20 [(56, 24), (58, 24), (61, 26), (63, 28)]
nonboss charging turns 55 star letters {'W': 7, 'A': 29, 'Q': 9, 'Z': 3, 'S': 3, 'E': 1, 'D': 3}
 star=D nonboss 3 (elite-floor 0 )
  D (63, 9, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 510 ≥ HP 459；防禦後估計 356 < HP 459，防禦後撐', ' 敵人蓄力中！ · 建議 ★D·防禦 ‖ 風影虎 正在蓄力！')
  D (63, 19, False, '說明：D·防禦（生命藥水已用完；防禦後估計 255 < HP 306，HP 偏低：306/1020（≤ 35%））（小怪', ' 敵人蓄力中！ · 建議 ★D·防禦 ‖ 風影虎 正在蓄力！')
  D (63, 22, False, '說明：D·防禦（生命藥水已用完；防禦後估計 255 < HP 281，HP 偏低：281/1020（≤ 35%））（小怪', ' 敵人蓄力中！ · 建議 ★D·防禦 ‖ 風影虎 正在蓄力！')
grp total 19 inside 1 below_lo 18 above_hi 0 skipped 6
```
- 截圖 qa-cp9-rc12ad-shots/oc1-death.webp；save qa-saves/rc12ad-oc-1-end.json

## oc2 (事件行 4151–5117)
- prep：自動分配、補藥至 13，截圖 oc2-prep.webp。**死於 F63 普通戰（normal），回合 18，0 瓶**。死前 3 回合(maxHP 1145)：T16 -0；T17 -117（炎羽螳螂 蓄力一擊 10.2%，格擋）；T18 -286（風鐵蠍 蓄力一擊 25.0%，正好等於 cap、非超過）。蓄力連 2 回合(T17,T18)，無 3 連。T17 HP 剩 1、0 藥水，★ 推 A（無選項）。F30 T1 estmis（預估傷害 hi 181 vs 實際 242）。
```
oc2 lastF 63 kinds ememecembcbrbcbrececbcbrecembcbrbcemecemembcbmembcb
ckpt {10: 13, 20: 13, 30: 14, 40: 14, 50: 14, 60: 8}
BOSS F45+:
 F 45 t 11 pot 13 -> 12 rw 1 hp1 [1024, 1080]
 F 50 t 14 pot 14 -> 12 rw 1 hp1 [876, 1094]
 F 55 t 11 pot 10 -> 9 rw 1 hp1 [549, 1094]
 F 60 t 15 pot 8 -> 6 rw 1 hp1 [579, 1094]
elite F15-69 [(21, 1), (23, 1), (31, 0), (33, 0), (43, 0), (46, 1), (48, 1), (51, 1), (58, 0)] F70+ []
floors with charged hits 10 max run overall
 floor 61 battle chargedTurns 8 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 63 battle chargedTurns 7 maxrun 2 maxhit25.0% maxturnTot25.0% 
maxhit (40.0, 45, 6) maxturn (49.81718464351005, 55, 9)
hits>40.0: [] turn>50: []
est [(20, 3, 486, 264), (30, 6, 456, 188), (35, 1, 493, 357), (40, 1, 469, 246)]
F45-69 node:pots 45b:2 46e:0 47c:0 48e:0 49m:0 50b:3 51e:0 52m:0 53b:0 54c:0 55b:2 56b:0 57m:0 58e:0 59m:0 60b:3 61b:0 62c:0 63b:0
totdrinks 15 F45-69 drinks 10
normal fights 13 turns [2, 2, 3, 2, 2, 4, 2, 3, 6, 14, 19, 36, 18]
normal>=20 [(61, 36)]
nonboss charging turns 47 star letters {'Q': 11, 'A': 20, 'Z': 3, 'E': 3, 'W': 4, 'D': 5, 'S': 1}
 star=D nonboss 5 (elite-floor 2 )
  D (58, 7, True, '說明：D·防禦（敵人蓄力中，HP 765 撐得住，不必喝藥；下回合最多可能受 546（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 迅捷分裂尖刺・雷爪飛龍 正在蓄力！')
  D (58, 10, True, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 546 ≥ HP 484；防禦後估計 382 < HP 484，防禦後撐', '· 建議 ★D·防禦 ‖ 迅捷分裂尖刺・雷爪飛龍 正在蓄力！')
  D (63, 12, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 573 ≥ HP 460；防禦後估計 400 < HP 460，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎羽螳螂 正在蓄力！')
  D (63, 13, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 573 ≥ HP 460；防禦後估計 400 < HP 460，防禦後撐', ' 敵人蓄力中！ · 建議 ★D·防禦 ‖ 風鐵蠍 正在蓄力！')
  D (63, 16, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 234 ≥ HP 118）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎羽螳螂 正在蓄力！')
grp total 20 inside 0 below_lo 20 above_hi 0 skipped 8
```
- 截圖 qa-cp9-rc12ad-shots/oc2-death.webp；save qa-saves/rc12ad-oc-2-end.json

## oc3 (事件行 5118–6281)
- prep：自動分配、補藥至 13，截圖 oc3-prep.webp。（中途被中斷於 F61 T24，清空 driver 狀態後接續同一局繼續）**死於 F76 普通戰（normal），回合 20，0 瓶**。死前 3 回合(maxHP 1163)：T18 -1；T19 -1；T20 -290（霜眼機兵 蓄力一擊 25.0%，=cap）。無 3 連。T19 HP 1、0 藥水。F70 首領 +1 ✓、F75 +0 ✓。普通戰 ≥T26（F61 33、F68 33、F71 32、F73 39 回合）：T26 後無蓄力一擊、單擊皆 15.0%。t26 截圖：driver 有觸發(5 次)但當時迴圈未中斷截圖，無檔案；arcane/blade 起改為中斷並存圖。
```
oc3 lastF 76 kinds ecememerecemecembcecememecemecembcbmbcemecececembcbrbcbmbmbmb
ckpt {10: 13, 20: 15, 30: 17, 40: 20, 50: 18, 60: 21, 70: 7}
BOSS F45+:
 F 45 t 11 pot 21 -> 20 rw 1 hp1 [649, 1103]
 F 50 t 3 pot 18 -> 19 rw 1 hp1 [663, 1103]
 F 55 t 2 pot 20 -> 21 rw 1 hp1 [663, 1103]
 F 60 t 17 pot 21 -> 18 rw 1 hp1 [443, 1103]
 F 65 t 10 pot 13 -> 12 rw 1 hp1 [467, 1163]
 F 70 t 6 pot 7 -> 7 rw 1 hp1 [1098, 1163]
 F 75 t 5 pot 1 -> 1 rw 0 hp1 [501, 1163]
elite F15-69 [(16, 1), (18, 1), (23, 1), (26, 0), (28, 0), (31, 0), (33, 1), (36, 0), (38, 0), (48, 0), (51, 0), (53, 1), (56, 0), (58, 0)] F70+ []
floors with charged hits 14 max run overall
 floor 61 battle chargedTurns 8 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 68 battle chargedTurns 8 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 73 battle chargedTurns 8 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 76 battle chargedTurns 8 maxrun 2 maxhit24.9% maxturnTot24.9% 
maxhit (39.98280309544282, 65, 6) maxturn (40.75666380051591, 65, 6)
hits>40.0: [] turn>50: []
est [(25, 1, 383, 208), (30, 1, 438, 152), (35, 1, 441, 169), (40, 1, 413, 308)]
F45-69 node:pots 45b:2 46b:0 47c:0 48e:0 49m:0 50b:0 51e:0 52c:0 53e:0 54c:0 55b:0 56e:0 57c:0 58e:0 59m:0 60b:4 61b:0 62c:0 63b:0 64r:0 65b:2 66b:0 67c:0 68b:0 69m:0
totdrinks 9 F45-69 drinks 8
normal fights 11 turns [2, 3, 5, 12, 33, 14, 14, 33, 32, 39, 20]
normal>=20 [(61, 33), (68, 33), (71, 32), (73, 39), (76, 20)]
nonboss charging turns 70 star letters {'Q': 15, 'A': 30, 'W': 10, 'E': 3, 'D': 9, 'Z': 2, 'S': 1}
 star=D nonboss 9 (elite-floor 0 )
  D (68, 8, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 582 ≥ HP 525；防禦後估計 407 < HP 525，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎鐮騎士 正在蓄力！')
  D (68, 9, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 582 ≥ HP 526；防禦後估計 407 < HP 526，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜骨砲台 正在蓄力！')
  D (73, 9, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 582 ≥ HP 467；防禦後估計 407 < HP 467，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜岩遊俠 正在蓄力！')
  D (76, 5, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 290 ≥ HP 235）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎牙翼龍 正在蓄力！')
  D (76, 8, False, '說明：D·防禦（生命藥水已用完；防禦後估計 290 < HP 292，HP 偏低：292/1163（≤ 35%））（小怪', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎牙翼龍 正在蓄力！')
  D (76, 11, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 208 ≥ HP 105）：這一擊只能靠保命活下來，', '靈動架勢 · 防禦中 · 敵人蓄力中！ · 建議 ★D·防禦')
grp total 21 inside 0 below_lo 21 above_hi 0 skipped 12
T26+ F61 turns=33 hits>=T26 (turn,%):[(29, 15.0), (31, 15.0)] chargedHits>=T26:[]
T26+ F68 turns=33 hits>=T26 (turn,%):[(30, 15.0)] chargedHits>=T26:[]
T26+ F71 turns=32 hits>=T26 (turn,%):[(28, 15.0), (29, 15.0)] chargedHits>=T26:[]
T26+ F73 turns=39 hits>=T26 (turn,%):[(30, 15.0)] chargedHits>=T26:[]
```
- 截圖 qa-cp9-rc12ad-shots/oc3-death.webp；save qa-saves/rc12ad-oc-3-end.json

## ar1 (事件行 6282–7413)
- prep：自動分配、買藥（三種各補到 3 瓶，生命 13），截圖 ar1-prep.webp。**死於 F78 普通戰（normal），回合 19，0 瓶**。死前 3 回合(maxHP 1437)：T17 -502（霜角戰士 普攻 215 + 風血獅 蓄力一擊 287=20.0%〔=cap〕，合計 34.9%）；T18 -2；T19 -215 風血獅 普攻(15.0%)。蓄力連續 1 回合，無 3 連。F70 首領 +1 ✓、F75 +0 ✓。
```
ar1 lastF 78 kinds eceremembcececerececemecemerbmerecbcbcbrecembcbmbmbmbmbmbmbmbmb
ckpt {10: 13, 20: 12, 30: 11, 40: 11, 50: 11, 60: 7, 70: 5}
BOSS F45+:
 F 45 t 4 pot 12 -> 13 rw 1 hp1 [484, 1163]
 F 50 t 12 pot 11 -> 9 rw 1 hp1 [962, 1185]
 F 55 t 6 pot 8 -> 8 rw 1 hp1 [485, 1208]
 F 60 t 14 pot 7 -> 6 rw 1 hp1 [948, 1230]
 F 65 t 12 pot 5 -> 5 rw 1 hp1 [1253, 1253]
 F 70 t 6 pot 5 -> 6 rw 1 hp1 [714, 1275]
 F 75 t 6 pot 4 -> 3 rw 0 hp1 [804, 1298]
elite F15-69 [(16, 0), (18, 0), (21, 0), (23, 0), (26, 1), (28, 0), (31, 0), (33, 0), (38, 1), (41, 1), (51, 0), (53, 0)] F70+ []
floors with charged hits 24 max run overall
 floor 46 battle chargedTurns 3 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 48 battle chargedTurns 2 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 56 battle chargedTurns 2 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 58 battle chargedTurns 2 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 63 battle chargedTurns 2 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 78 battle chargedTurns 8 maxrun 2 maxhit20.0% maxturnTot20.0% 
maxhit (39.954337899543376, 18, 2) maxturn (39.954337899543376, 18, 2)
hits>40.0: [] turn>50: []
est [(30, 1, 438, 306), (35, 1, 556, 391), (35, 4, 559, 442), (40, 1, 570, 398)]
F45-69 node:pots 45b:0 46b:0 47c:0 48b:0 49r:0 50b:3 51e:0 52c:0 53e:0 54m:0 55b:1 56b:0 57c:0 58b:0 59m:0 60b:2 61b:0 62m:0 63b:0 64m:0 65b:1 66b:0 67m:0 68b:0 69m:0
totdrinks 13 F45-69 drinks 7
normal fights 15 turns [1, 5, 3, 7, 4, 7, 6, 12, 7, 12, 11, 12, 15, 11, 19]
normal>=20 []
nonboss charging turns 83 star letters {'A': 54, '?': 3, 'D': 13, 'Z': 8, 'Q': 4, 'S': 1}
 star=D nonboss 13 (elite-floor 8 )
  D (28, 1, True, '說明：D·防禦（敵人蓄力中，HP 876 撐得住，不必喝藥；下回合最多可能受 438（≥ 最大 HP 40%））（小怪不', '！ · 建議 ★D·防禦 ‖ 法抗尖刺・霜角光靈 正在蓄力！')
  D (28, 4, True, '說明：D·防禦（敵人蓄力中，HP 450 撐得住，不必喝藥；下回合最多可能受 438（≥ 最大 HP 40%））（小怪不', '！ · 建議 ★D·防禦 ‖ 法抗尖刺・霜角光靈 正在蓄力！')
  D (38, 1, True, '說明：D·防禦（敵人蓄力中，HP 1121 撐得住，不必喝藥；下回合最多可能受 452（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 守護嗜血狂戰・闇鐵亡魂 正在蓄力！')
  D (46, 1, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 583 ≥ HP 543；防禦後估計 408 < HP 543，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 聖血鐵偶 正在蓄力！')
  D (51, 1, True, '說明：D·防禦（敵人蓄力中，HP 1185 撐得住，不必喝藥；下回合最多可能受 594（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 尖刺分裂銳眼・霜紋巨人 正在蓄力！')
  D (51, 4, True, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 594 ≥ HP 591；防禦後估計 416 < HP 591，防禦後撐', '· 建議 ★D·防禦 ‖ 尖刺分裂銳眼・霜紋巨人 正在蓄力！')
grp total 23 inside 0 below_lo 23 above_hi 0 skipped 7
```
- 截圖 qa-cp9-rc12ad-shots/ar1-death.webp；save qa-saves/rc12ad-arcane-1-end.json

## ar2 (事件行 7414–8343)
- prep：自動分配、買藥（三種各補到 3 瓶），截圖 ar2-prep.webp。**死於 F63 普通戰（normal），回合 9，0 瓶**。死前 3 回合(maxHP 994)：T7 -101；T8 -0；T9 -149 霜影熊 普攻(15.0%)；T6 霜棘戰士 蓄力一擊 198=19.9%(≤20)。蓄力不連續，無 3 連。F61–62 期間藥水耗盡（F60 後 4 瓶），F63 開戰 HP 低且 0 瓶。
```
ar2 lastF 63 kinds ecembcecbcececececembcerecerecbrbcbmecbrembmbmbmbmb
ckpt {10: 13, 20: 13, 30: 12, 40: 11, 50: 8, 60: 6}
BOSS F45+:
 F 45 t 11 pot 9 -> 9 rw 1 hp1 [745, 930]
 F 50 t 7 pot 8 -> 8 rw 1 hp1 [572, 948]
 F 55 t 11 pot 7 -> 7 rw 1 hp1 [343, 966]
 F 60 t 15 pot 6 -> 4 rw 1 hp1 [592, 984]
elite F15-69 [(16, 0), (18, 1), (21, 0), (23, 0), (28, 0), (31, 1), (33, 0), (36, 1), (46, 0), (51, 1)] F70+ []
floors with charged hits 18 max run overall
 floor 38 battle chargedTurns 2 maxrun 2 maxhit19.9% maxturnTot19.9% 
 floor 43 battle chargedTurns 2 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 48 battle chargedTurns 3 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 53 battle chargedTurns 5 maxrun 2 maxhit19.9% maxturnTot19.9% 
 floor 56 battle chargedTurns 8 maxrun 2 maxhit19.9% maxturnTot19.9% 
 floor 58 battle chargedTurns 2 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 61 battle chargedTurns 8 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 63 battle chargedTurns 3 maxrun 2 maxhit19.9% maxturnTot19.9% 
maxhit (39.97856377277599, 46, 1) maxturn (39.97856377277599, 46, 1)
hits>40.0: [] turn>50: []
est [(15, 4, 350, 175), (30, 1, 438, 306), (35, 1, 447, 312), (50, 4, 379, 166)]
F45-69 node:pots 45b:1 46e:0 47c:0 48b:0 49r:0 50b:1 51e:0 52m:0 53b:0 54m:0 55b:1 56b:0 57m:0 58b:0 59m:0 60b:3 61b:0 62m:0 63b:0
totdrinks 14 F45-69 drinks 6
normal fights 12 turns [2, 1, 1, 4, 2, 5, 8, 12, 16, 6, 21, 9]
normal>=20 [(61, 21)]
nonboss charging turns 53 star letters {'A': 31, 'D': 13, '?': 2, 'Z': 5, 'Q': 1, 'S': 1}
 star=D nonboss 13 (elite-floor 5 )
  D (21, 1, True, '說明：D·防禦（敵人蓄力中，HP 876 撐得住，不必喝藥；下回合最多可能受 438（≥ 最大 HP 40%））（小怪不', '！ · 建議 ★D·防禦 ‖ 冰霜尖刺・雷鐵螳螂 正在蓄力！')
  D (31, 1, True, '說明：D·防禦（敵人蓄力中，HP 876 撐得住，不必喝藥；下回合最多可能受 439（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 嗜血迅捷尖刺・風冠妖精 正在蓄力！')
  D (36, 1, True, '說明：D·防禦（敵人蓄力中，HP 718 撐得住，不必喝藥；下回合最多可能受 448（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 尖刺狂戰烈焰・雷牙刺客 正在蓄力！')
  D (38, 1, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 452 ≥ HP 449；防禦後估計 316 < HP 449，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜冠魔像 正在蓄力！')
  D (48, 1, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 470 ≥ HP 464；防禦後估計 328 < HP 464，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜刃屍鬼 正在蓄力！')
  D (51, 1, True, '說明：D·防禦（敵人蓄力中，HP 762 撐得住，不必喝藥；下回合最多可能受 475（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 嗜血烈焰尖刺・雷冠蜥蜴 正在蓄力！')
grp total 25 inside 0 below_lo 25 above_hi 0 skipped 5
```
- 截圖 qa-cp9-rc12ad-shots/ar2-death.webp；save qa-saves/rc12ad-arcane-2-end.json

## ar3 (事件行 8344–9235)
- prep：自動分配、買藥（三種各補到 3 瓶），截圖 ar3-prep.webp。**死於 F63 普通戰（normal），回合 18，0 瓶**。死前 3 回合(maxHP 1181)：T16 -120；T17 -0；T18 -238（霜影巨人 蓄力一擊 20.0%，=cap）。無 3 連。T17 HP 1、0 藥水。
```
ar3 lastF 63 kinds ecememembcerecerbcbmececbcerecerecececbmembmbmbmbmb
ckpt {10: 13, 20: 13, 30: 13, 40: 16, 50: 11, 60: 4}
BOSS F45+:
 F 45 t 15 pot 16 -> 14 rw 1 hp1 [1116, 1116]
 F 50 t 9 pot 11 -> 10 rw 1 hp1 [942, 1138]
 F 55 t 18 pot 8 -> 6 rw 1 hp1 [464, 1159]
 F 60 t 16 pot 4 -> 4 rw 1 hp1 [469, 1181]
elite F15-69 [(16, 0), (18, 0), (26, 0), (28, 1), (33, 1), (36, 1), (38, 1), (41, 0), (43, 1), (46, 0), (51, 0)] F70+ []
floors with charged hits 13 max run overall
 floor 48 battle chargedTurns 3 maxrun 2 maxhit19.9% maxturnTot19.9% 
 floor 53 battle chargedTurns 6 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 56 battle chargedTurns 5 maxrun 2 maxhit19.9% maxturnTot19.9% 
 floor 58 battle chargedTurns 4 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 61 battle chargedTurns 4 maxrun 2 maxhit19.9% maxturnTot19.9% 
 floor 63 battle chargedTurns 8 maxrun 2 maxhit19.9% maxturnTot19.9% 
maxhit (39.98118532455315, 33, 4) maxturn (50.0, 45, 4)
hits>40.0: [] turn>50: []
est [(20, 1, 526, 206), (35, 4, 429, 214), (55, 5, 482, 251), (55, 10, 487, 178)]
F45-69 node:pots 45b:3 46e:0 47c:0 48b:0 49m:0 50b:2 51e:0 52m:0 53b:0 54m:0 55b:3 56b:0 57m:0 58b:0 59m:0 60b:1 61b:0 62m:0 63b:0
totdrinks 13 F45-69 drinks 9
normal fights 10 turns [1, 1, 1, 2, 8, 14, 12, 10, 11, 18]
normal>=20 []
nonboss charging turns 46 star letters {'A': 21, 'D': 15, '?': 2, 'Z': 8}
 star=D nonboss 15 (elite-floor 5 )
  D (38, 1, True, '說明：D·防禦（敵人蓄力中，HP 1076 撐得住，不必喝藥；下回合最多可能受 434（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 鐵壁銳眼堅硬・霜鐮光靈 正在蓄力！')
  D (41, 1, True, '說明：D·防禦（敵人蓄力中，HP 1094 撐得住，不必喝藥；下回合最多可能受 549（≥ 最大 HP 40%））（小怪', ' · 建議 ★D·防禦 ‖ 銳眼嗜血尖刺・雷牙梟 正在蓄力！')
  D (46, 1, True, '說明：D·防禦（敵人蓄力中，HP 1116 撐得住，不必喝藥；下回合最多可能受 448（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 銳眼鐵壁分裂・雷棘戰士 正在蓄力！')
  D (46, 4, True, '說明：D·防禦（敵人蓄力中，HP 557 撐得住，不必喝藥；下回合最多可能受 448（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 銳眼鐵壁分裂・雷棘戰士 正在蓄力！')
  D (46, 7, True, '說明：D·防禦（敵人蓄力中，HP 1120 撐得住，不必喝藥；下回合最多可能受 448（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 銳眼鐵壁分裂・雷棘戰士 正在蓄力！')
  D (48, 5, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 564 ≥ HP 509；防禦後估計 394 < HP 509，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜牙騎士 正在蓄力！')
grp total 27 inside 1 below_lo 26 above_hi 0 skipped 0
```
- 截圖 qa-cp9-rc12ad-shots/ar3-death.webp；save qa-saves/rc12ad-arcane-3-end.json

## bl1 (事件行 9236–10572)
- prep：自動分配、買藥（生命 13），截圖 bl1-prep.webp。**死於 F75 首領戰（boss，堅硬鐵壁・守門者・霜影光靈），回合 15，0 瓶**。死前 3 回合(maxHP 880)：T13 -1；T14 -1；T15 -171 守門者 重擊（蓄力大招 19.4%，≤40 boss cap）。無 3 連。F70 首領 +1 ✓。**blade 普通戰回合數(本局，anad 辨識 5 場)：F53 19、F56 25、F58 19、F71 40、F73 40；中位 25、最大 40、≥30 回合 2 場。** T26 截圖：bl1-F71-T26-normal.webp、bl1-F73-T26-normal.webp（另有 F68 精英 T26：bl1-F68-T26-elite.webp）。F71 在 T26 落下一記蓄力一擊 132(15.0%)（由 T25 起蓄，非 T26 新起蓄；已在 T26 後無新蓄力）。T26 後單擊 15.0%。最大單擊 40.0%(F60 T9，非 >40)；最大單回合 40.0%(F73 T24)。
```
bl1 lastF 75 kinds ecemecerecemecemecemecececemecemecemecemecbrbmbmecemecembmbm
ckpt {10: 13, 20: 13, 30: 16, 40: 18, 50: 17, 60: 12, 70: 8}
BOSS F45+:
 F 45 t 8 pot 18 -> 18 rw 1 hp1 [630, 820]
 F 50 t 9 pot 17 -> 17 rw 1 hp1 [759, 820]
 F 55 t 16 pot 16 -> 14 rw 1 hp1 [530, 880]
 F 60 t 19 pot 12 -> 11 rw 1 hp1 [637, 880]
 F 65 t 15 pot 9 -> 9 rw 1 hp1 [584, 880]
 F 70 t 14 pot 8 -> 6 rw 1 hp1 [513, 880]
elite F15-69 [(16, 0), (18, 0), (21, 1), (23, 1), (26, 0), (28, 1), (31, 0), (33, 0), (36, 0), (38, 0), (41, 0), (43, 0), (46, 0), (48, 0), (51, 0), (61, 1), (63, 0), (66, 0), (68, 0)] F70+ []
floors with charged hits 14 max run overall
 floor 53 battle chargedTurns 2 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 56 battle chargedTurns 2 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 58 battle chargedTurns 2 maxrun 2 maxhit19.9% maxturnTot19.9% 
 floor 71 battle chargedTurns 5 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 73 battle chargedTurns 4 maxrun 2 maxhit25.0% maxturnTot25.0% 
maxhit (40.0, 60, 9) maxturn (40.0, 73, 24)
hits>40.0: [] turn>50: []
est [(55, 1, 440, 88), (55, 9, 440, 74), (55, 15, 440, 88), (65, 12, 160, 299)]
F45-69 node:pots 45b:1 46e:0 47c:0 48e:0 49m:0 50b:1 51e:0 52c:0 53b:0 54r:0 55b:3 56b:0 57m:0 58b:0 59m:0 60b:2 61e:0 62c:0 63e:0 64m:0 65b:1 66e:0 67c:0 68e:0 69m:0
totdrinks 12 F45-69 drinks 8
normal fights 5 turns [19, 25, 19, 40, 40]
normal>=20 [(56, 25), (71, 40), (73, 40)]
nonboss charging turns 49 star letters {'D': 9, 'W': 2, 'A': 8, 'Z': 6, 'E': 21, 'S': 3}
 star=D nonboss 9 (elite-floor 8 )
  D (43, 1, True, '說明：D·防禦（敵人蓄力中，HP 738 撐得住，不必喝藥；下回合最多可能受 410（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 尖刺銳眼守護・雷爪地龍 正在蓄力！')
  D (46, 1, True, '說明：D·防禦（敵人蓄力中，HP 794 撐得住，不必喝藥；下回合最多可能受 328（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 烈焰鐵壁銳眼・霜眼蜥蜴 正在蓄力！')
  D (51, 1, True, '說明：D·防禦（敵人蓄力中，HP 732 撐得住，不必喝藥；下回合最多可能受 440（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 尖刺冰霜狂戰・霜爪蛇龍 正在蓄力！')
  D (58, 1, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 440 ≥ HP 397；防禦後估計 307 < HP 397，防禦後撐', '人蓄力中！ · 建議 ★D·防禦 ‖ 炎眼元素靈 正在蓄力！')
  D (61, 1, True, '說明：D·防禦（敵人蓄力中，HP 725 撐得住，不必喝藥；下回合最多可能受 440（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 嗜血尖刺迅捷・雷爪飛龍 正在蓄力！')
  D (61, 15, True, '說明：D·防禦（攻擊嗜血尖刺迅捷・雷爪飛龍會吃反傷約 35 ≥ HP 413，會自殺）（小怪不受蓄力鎖）', '· 建議 ★D·防禦 ‖ 嗜血尖刺迅捷・雷爪飛龍 正在蓄力！')
grp total 28 inside 0 below_lo 28 above_hi 0 skipped 11
T26+ F71 turns=40 hits>=T26 (turn,%):[(31, 15.0)] chargedHits>=T26:[(26, '雷尾雙頭龍')]
T26+ F73 turns=40 hits>=T26 (turn,%):[(31, 15.0)] chargedHits>=T26:[]
```
- 截圖 qa-cp9-rc12ad-shots/bl1-death.webp；save qa-saves/rc12ad-blade-1-end.json

## bl2 (事件行 10573–11429)
- prep：自動分配、買藥（生命 13），截圖 bl2-prep.webp。**死於 F60 首領戰（boss，嗜血冰霜・災厄・風紋飛蛾），回合 27，0 瓶**。死前 3 回合(maxHP 916)：T25 -190（吸血重擊 20.7%，首領自身技）；T26 -19（流血）；T27 -137（15.0%）。無 3 連。T24 時 HP 210、藥水已用完（F55 後 9 瓶→F60 開戰前耗盡）。**blade 普通戰回合數(本局 anad 辨識 5 場)：F? 1、17、15、11、30（F53 30 回合）；中位 15、最大 30、≥30 回合 1 場。** T26 截圖：bl2-F53-T26-normal.webp（普通戰；T26 後無蓄力一擊、無單擊>15%）、bl2-F58-T26-elite.webp（精英）。最大單擊/單回合 39.96%(F60 T9)。
```
bl2 lastF 60 kinds ememecececececemecemecbrecececemecbmbcbmembmemem
ckpt {10: 13, 20: 14, 30: 16, 40: 20, 50: 13, 60: 2}
BOSS F45+:
 F 45 t 6 pot 17 -> 18 rw 1 hp1 [318, 862]
 F 50 t 14 pot 13 -> 13 rw 1 hp1 [552, 916]
 F 55 t 6 pot 9 -> 9 rw 1 hp1 [832, 916]
elite F15-69 [(16, 0), (18, 1), (21, 0), (23, 0), (26, 1), (31, 1), (33, 1), (36, 1), (38, 0), (41, 1), (51, 1), (56, 0), (58, 0)] F70+ []
floors with charged hits 10 max run overall
 floor 43 battle chargedTurns 6 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 46 battle chargedTurns 5 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 48 battle chargedTurns 3 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 53 battle chargedTurns 8 maxrun 2 maxhit25.0% maxturnTot25.0% 
maxhit (39.956331877729255, 60, 9) maxturn (39.956331877729255, 60, 9)
hits>40.0: [] turn>50: []
est [(50, 11, 286, 139), (60, 14, 386, 179), (60, 19, 382, 190)]
F45-69 node:pots 45b:0 46b:0 47c:0 48b:0 49m:0 50b:1 51e:0 52m:0 53b:0 54m:0 55b:1 56e:0 57m:0 58e:0 59m:0 60b:1
totdrinks 4 F45-69 drinks 3
normal fights 5 turns [1, 17, 15, 11, 30]
normal>=20 [(53, 30)]
nonboss charging turns 58 star letters {'A': 26, 'D': 14, 'Z': 9, 'W': 5, 'Q': 2, 'E': 2}
 star=D nonboss 14 (elite-floor 9 )
  D (33, 1, True, '說明：D·防禦（敵人蓄力中，HP 850 撐得住，不必喝藥；下回合最多可能受 430（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 冰霜尖刺鐵壁・風甲甲蟲 正在蓄力！')
  D (33, 4, True, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 430 ≥ HP 361；防禦後估計 301 < HP 361，防禦後撐', '· 建議 ★D·防禦 ‖ 冰霜尖刺鐵壁・風甲甲蟲 正在蓄力！')
  D (41, 1, True, '說明：D·防禦（敵人蓄力中，HP 806 撐得住，不必喝藥；下回合最多可能受 430（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 迅捷守護尖刺・霜鱗怨靈 正在蓄力！')
  D (41, 4, True, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 430 ≥ HP 423；防禦後估計 301 < HP 423，防禦後撐', '· 建議 ★D·防禦 ‖ 迅捷守護尖刺・霜鱗怨靈 正在蓄力！')
  D (41, 7, True, '說明：D·防禦（敵人蓄力中，HP 862 撐得住，不必喝藥；下回合最多可能受 430（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 迅捷守護尖刺・霜鱗怨靈 正在蓄力！')
  D (43, 1, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 431 ≥ HP 369；防禦後估計 301 < HP 369，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 雷蹄飛龍 正在蓄力！')
grp total 13 inside 0 below_lo 13 above_hi 0 skipped 0
T26+ F53 turns=30 hits>=T26 (turn,%):[] chargedHits>=T26:[]
```
- 截圖 qa-cp9-rc12ad-shots/bl2-death.webp；save qa-saves/rc12ad-blade-2-end.json

## bl3 (事件行 11430–12797)
- prep：自動分配、買藥（生命 13），截圖 bl3-prep.webp。（中途中斷於 F19，清空 driver 狀態後接續同一局）**死於 F78 普通戰（normal），回合 15，0 瓶**。死前 3 回合(maxHP 1197)：T13 -4；T14 -2；T15 -179（炎影雙頭龍 蓄力一擊 15.0%）。無 3 連。F70 首領 +1 ✓、F75 +0 ✓。**blade 普通戰回合數：7、7、21、16、34、40、25、34、15（9 場）；中位 21、最大 40、≥30 回合 3 場（F63 34、F71 40、F76 34）。** T26 截圖：bl3-F63/F71/F76-T26-normal.webp（另 F68 精英 bl3-F68-T26-elite.webp）。F71 T26 有一記蓄力一擊 179(15%，T25 起蓄、非 T26 新起蓄)；其餘 T26 後無蓄力、單擊皆 15.0%。最大單擊/單回合 39.98%(F61 T2)，未 >40%。
```
bl3 lastF 78 kinds ecerecececececececerecemecemecececerbcbcbcembcemecbmecerbmbmbmb
ckpt {10: 13, 20: 13, 30: 15, 40: 18, 50: 19, 60: 12, 70: 10}
BOSS F45+:
 F 45 t 4 pot 19 -> 20 rw 1 hp1 [397, 844]
 F 50 t 8 pot 19 -> 19 rw 1 hp1 [450, 844]
 F 55 t 24 pot 17 -> 15 rw 1 hp1 [389, 844]
 F 60 t 10 pot 12 -> 12 rw 1 hp1 [702, 1070]
 F 65 t 22 pot 10 -> 9 rw 1 hp1 [833, 1093]
 F 70 t 10 pot 10 -> 9 rw 1 hp1 [543, 1197]
 F 75 t 6 pot 6 -> 5 rw 0 hp1 [947, 1197]
elite F15-69 [(16, 0), (18, 0), (21, 0), (23, 0), (26, 1), (28, 0), (31, 1), (33, 0), (36, 0), (38, 0), (41, 0), (43, 0), (53, 1), (58, 0), (61, 1), (66, 1), (68, 0)] F70+ []
floors with charged hits 18 max run overall
 floor 48 battle chargedTurns 2 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 51 battle chargedTurns 6 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 56 battle chargedTurns 2 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 63 battle chargedTurns 4 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 71 battle chargedTurns 5 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 73 battle chargedTurns 2 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 76 battle chargedTurns 8 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 78 battle chargedTurns 7 maxrun 2 maxhit25.0% maxturnTot25.0% 
maxhit (39.981701738334856, 61, 2) maxturn (39.981701738334856, 61, 2)
hits>40.0: [] turn>50: []
est [(60, 1, 494, 269), (65, 1, 531, 247), (65, 9, 363, 243), (70, 4, 599, 203)]
F45-69 node:pots 45b:0 46b:0 47c:0 48b:0 49c:0 50b:1 51b:0 52c:0 53e:0 54m:0 55b:3 56b:0 57c:0 58e:0 59m:0 60b:1 61e:0 62c:0 63b:0 64m:0 65b:2 66e:0 67c:0 68e:0 69r:0
totdrinks 10 F45-69 drinks 7
normal fights 9 turns [7, 7, 21, 16, 34, 40, 25, 34, 15]
normal>=20 [(51, 21), (63, 34), (71, 40), (73, 25), (76, 34)]
nonboss charging turns 72 star letters {'A': 16, 'W': 6, 'D': 14, 'S': 6, 'E': 21, 'Z': 9}
 star=D nonboss 14 (elite-floor 1 )
  D (48, 1, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 422 ≥ HP 398；防禦後估計 295 < HP 398，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 風刃鐵偶 正在蓄力！')
  D (48, 2, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 422 ≥ HP 398；防禦後估計 295 < HP 398，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜爪殭屍 正在蓄力！')
  D (51, 1, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 422 ≥ HP 409；防禦後估計 295 < HP 409，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 風鐮光靈 正在蓄力！')
  D (51, 2, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 422 ≥ HP 409；防禦後估計 295 < HP 409，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜毒妖精 正在蓄力！')
  D (51, 6, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 422 ≥ HP 394；防禦後估計 295 < HP 394，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜毒妖精 正在蓄力！')
  D (58, 1, True, '說明：D·防禦（敵人蓄力中，HP 1070 撐得住，不必喝藥；下回合最多可能受 428（≥ 最大 HP 40%））（小怪', ' 建議 ★D·防禦 ‖ 烈焰分裂狂戰・風翼元素靈 正在蓄力！')
grp total 38 inside 0 below_lo 38 above_hi 0 skipped 17
T26+ F63 turns=34 hits>=T26 (turn,%):[] chargedHits>=T26:[]
T26+ F71 turns=40 hits>=T26 (turn,%):[(31, 15.0)] chargedHits>=T26:[(26, '風翼飛蛾')]
T26+ F76 turns=34 hits>=T26 (turn,%):[(32, 15.0)] chargedHits>=T26:[]
```
- 截圖 qa-cp9-rc12ad-shots/bl3-death.webp；save qa-saves/rc12ad-blade-3-end.json

# rc12ad 12 局總結

## 已驗證（腳本對 rc12ad-evflush.jsonl＋qa-saves 重算）
- 終局：bw 60（王 T8 陣亡）/61（一般）/81（一般）→ 中位 61；oc 64（撤退，非陣亡）/63/76 → 64；ar 78/63/63 → 63；bl 75（王 T15）/60（王 T27）/78 → 75。學派差 75−61=14；總中位 63.5；到 F100：0 局。
- 合格線：各學派中位 40–75 ✓（bl 75 剛好在上緣）；差 ≤15 ✓（14）；F100 ≤1 ✓；F30+ 王回合中位 8（6–18）✓。指南目標：oc≈65 → 64 ✓；bl 明顯高於 53 → 75 ✓；bw 61 ≤72、ar 63 ≤71 ✓。
- F45+ 王回合（含陣亡王戰）：bw 9.5、oc 11、ar 11、bl 12；整體 11（模擬 9–12 內）。依層：F45 10、F50 9、F55 13、F60 14.5、F65 12、F70 6、F75 6。
- 王戰用藥（t0pot−endpot+potGain，F45+ 完成戰）：中位 1，最多 4；bw/oc 中位 2，ar/bl 1。
- 菁英掉藥：F15–69 共 143 場菁英，51 場掉藥；F70+ 無菁英節點。王獎勵另計：F70 五局皆 +1、F80（bw3）+1、F75 四局皆 0 → 符合設計。
- 蓄力上限：0 件違規（小怪 ar 20%／其他 25%、菁英本體 40%、王戰小怪 30%）；無三連蓄力；T26 後無 >15% 一般戰單擊。
- 最大單擊 40.0%（bw2 F48 T9），最大單回合 50.0%（oc1 F55 T4 王戰）。
- 非奧術學派小怪蓄力：288 擊中 220 擊打滿 25%（76%），磨耗主要來源。
- 刀一般戰回合（log 回合，含陣亡戰，19 場）：中位 19、最多 40、30+ 回合 6 場（模擬 中位 16／p90 35 → 實測偏長）。
- ★ 一般戰中僅小怪蓄力：非致命 449 回合 → A 284（63%），加攻擊技 Q/W/E/S 共 437（97%），D 僅 3（oc1×2、oc3×1，低 HP 規則）。標為致命（不防禦會死/≥HP）108 回合 → D 66、Z 42、A 0；實際傷害 ≥HP 的回合全為 Z（喝藥），沒有推薦 A 卻被打死的情況。
- 「同回合全體 lo–hi」：grp 的 bt key 皆為 turn+1，與 log 第 N 回合對齊後，354 回合中 352 回合實際低於 lo、0 回合高於 hi、2 回合在區間內。實際/lo 中位 0.50（防禦與否皆 0.50）。例：bl3 F48/F51 面板 422（50%）＝兩隻小怪各蓄力 211 相加，實際只有一隻打 211（另一隻「正在蓄力」）。→ 不是錯位，是面板高估（把同回合所有怪都算成蓄力／滿傷，未計共用蓄力鎖）。

## 推測
- 面板高估連帶觸發 ★「不防禦會死／喝藥」（如 bl3 估 422≥HP 398，實際 211），造成多餘 D／Z 與用藥，可能是刀一般戰回合偏長、藥量吃緊的原因之一。
- 區間內的 2 回合（oc1 F55 T4 529、ar3 F45 T4 558）lo=hi=sum，可能是面板當回合用實際值回填，非真正命中預測。
- bl1 F61 T15「反傷約 35 ≥ HP 413」比較式疑似文字/邏輯錯誤（未單獨重現）。
- 手感：F45–65 王戰長度合理；一般戰小怪 25% 蓄力密集，非奧術學派中後段以磨耗死亡為主（12 局中 8 局死於一般戰）。

## Bug 清單
1. 「同回合全體」估值約為實際 2 倍（352/354 低於 lo），並餵入 ★ 致命判斷。
2. （待確認）bl1 F61 T15 反傷 35 ≥ HP 413 判斷文字。
- 無蓄力上限違規、無三連蓄力。
