DONE rc12ae
# rc12ae QA (build a3e94b3)；事件檔 /workspace/rc12ae-evflush.jsonl

## bw1 (事件行 1–1060)
- prep：自動分配、買藥至 13，截圖 bw1-prep.webp。**死於 F66 普通戰（normal），回合 21，0 瓶**。死前 3 回合(maxHP 1173)：T19 -110；T20 -0；T21 -293（霜眼狼 蓄力一擊 25.0%，=cap）。無 3 連。F66 T12 實際 410 > 估計 hi 293（見 bw1-F66-T12-estmis.webp；驅動 estmis 觸發，需與 grp 逐回合比對）。同回合全體 lo–hi（本局）：見下方 grp 行。反傷提示：本局 refl 事件抓到的是戰鬥 log 的『反傷 -N』行，不是提示本文（driver regex 已修，下一局起只抓含『合計』的提示）。T26 截圖 bw1-F63-T26-normal.webp。
```
bw1 lastF 66 kinds ecembmbrbcbmececececececbcembcemecembcbmbcececembmbmb
ckpt {10: 13, 20: 13, 30: 15, 40: 14, 50: 10, 60: 8}
BOSS F45+:
 F 45 t 7 pot 14 -> 14 rw 1 hp1 [497, 1091]
 F 50 t 2 pot 10 -> 11 rw 1 hp1 [576, 1148]
 F 55 t 5 pot 8 -> 8 rw 1 hp1 [989, 1148]
 F 60 t 11 pot 8 -> 7 rw 1 hp1 [575, 1148]
 F 65 t 30 pot 2 -> 1 rw 1 hp1 [472, 1148]
elite F15-69 [(16, 1), (18, 0), (21, 0), (23, 1), (26, 0), (28, 1), (33, 0), (38, 1), (41, 0), (43, 0), (53, 0), (56, 0), (58, 0)] F70+ []
floors with charged hits 10 max run overall
 floor 46 battle chargedTurns 4 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 63 battle chargedTurns 9 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 66 battle chargedTurns 8 maxrun 2 maxhit25.0% maxturnTot25.0% 
maxhit (34.930313588850176, 53, 1) maxturn (39.98257839721254, 63, 9)
hits>40.0: [] turn>50: []
est [(25, 6, 194, 4), (30, 6, 546, 218), (35, 1, 469, 211), (35, 4, 546, 175)]
F45-69 node:pots 45b:1 46b:0 47c:0 48b:0 49m:0 50b:0 51b:0 52c:0 53e:0 54c:0 55b:1 56e:0 57c:0 58e:0 59m:0 60b:2 61b:0 62m:0 63b:0 64m:0 65b:1 66b:0
totdrinks 9 F45-69 drinks 5
normal fights 12 turns [3, 3, 3, 2, 4, 11, 11, 17, 12, 18, 31, 21]
normal>=20 [(63, 31), (66, 21)]
nonboss charging turns 56 star letters {'Q': 9, 'A': 31, 'Z': 4, 'W': 4, 'E': 3, 'D': 5}
 star=D nonboss 5 (elite-floor 1 )
  D (53, 1, True, '說明：D·防禦（敵人蓄力中，HP 907 撐得住，不必喝藥；下回合最多可能受 574（≥ 最大 HP 40%））（小怪不', ' 建議 ★D·防禦 ‖ 尖刺分裂迅捷・炎冠雙頭龍 正在蓄力！')
  D (66, 11, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 293 ≥ HP 266）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 雷影翼龍 正在蓄力！')
  D (66, 12, False, '說明：D·防禦（生命藥水已用完；防禦後估計 410 < HP 441，不防禦會死：下回合全體暴擊估計 468 ≥ HP ', ' 敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜眼狼 正在蓄力！')
  D (66, 15, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 293 ≥ HP 127）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 雷影翼龍 正在蓄力！')
  D (66, 16, False, '說明：D·防禦（生命藥水已用完；防禦後估計 410 < HP 441，不防禦會死：下回合全體暴擊估計 468 ≥ HP ', ' 敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜眼狼 正在蓄力！')
grp total 17 inside 10 below_lo 7 above_hi 0 skipped 9
T26+ F63 turns=31 hits>=T26 (turn,%):[] chargedHits>=T26:[(26, '雷眼翼龍')]
```
- 截圖 qa-cp9-rc12ae-shots/bw1-death.webp；save qa-saves/rc12ae-bulwark-1-end.json

## bw2 (事件行 1061–2281)
- prep：自動分配、買藥至 13，截圖 bw2-prep.webp。**撤退於 F71（retreat，驅動依藥水耗盡/低血撤退規則；1 瓶藥）— 非死亡**。F70 首領 +1 ✓（藥水 1→1，rw 1）。普通戰回合：3,4,2,4,5,5,9,10,9,17,18,32,16,30（F63 32、F68 30）。T26 截圖 bw2-F63-T26-normal.webp、bw2-F68-T26-normal.webp；T26 後無蓄力、單擊 15.0%。最大單回合 49.96%（F30 T4，未>50%）。反傷提示（含『合計』）：本局未出現，refl 事件無『合計』行。
```
bw2 lastF 71 kinds ememecerbmbmbcececembcemecembcbcbcembcececembmbmbmbmbmbmr
ckpt {10: 13, 20: 12, 30: 12, 40: 11, 50: 10, 60: 7, 70: 1}
BOSS F45+:
 F 45 t 9 pot 10 -> 10 rw 1 hp1 [439, 1230]
 F 50 t 9 pot 10 -> 9 rw 1 hp1 [1060, 1247]
 F 55 t 7 pot 8 -> 8 rw 1 hp1 [558, 1247]
 F 60 t 15 pot 7 -> 5 rw 1 hp1 [975, 1247]
 F 65 t 15 pot 2 -> 1 rw 1 hp1 [1082, 1247]
 F 70 t 12 pot 1 -> 1 rw 1 hp1 [40, 1247]
elite F15-69 [(18, 0), (21, 1), (23, 0), (28, 1), (31, 0), (33, 0), (43, 1), (48, 1), (51, 0), (53, 1)] F70+ []
floors with charged hits 14 max run overall
 floor 58 battle chargedTurns 4 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 61 battle chargedTurns 4 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 63 battle chargedTurns 6 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 66 battle chargedTurns 4 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 68 battle chargedTurns 8 maxrun 2 maxhit24.9% maxturnTot24.9% 
maxhit (34.96391339214114, 53, 13) maxturn (49.957081545064376, 30, 4)
hits>40.0: [] turn>50: []
est [(15, 4, 134, 57), (25, 4, 486, 364), (40, 1, 524, 415), (40, 6, 311, 111)]
F45-69 node:pots 45b:1 46b:0 47c:0 48e:0 49c:0 50b:2 51e:0 52c:0 53e:0 54m:0 55b:1 56b:0 57m:0 58b:0 59m:0 60b:3 61b:0 62m:0 63b:0 64m:0 65b:1 66b:0 67m:0 68b:0 69m:0
totdrinks 14 F45-69 drinks 8
normal fights 14 turns [3, 4, 2, 4, 5, 5, 9, 10, 9, 17, 18, 32, 16, 30]
normal>=20 [(63, 32), (68, 30)]
nonboss charging turns 57 star letters {'A': 32, 'W': 3, 'Q': 12, 'Z': 2, 'D': 7, 'E': 1}
 star=D nonboss 7 (elite-floor 3 )
  D (53, 7, True, '說明：D·防禦（敵人蓄力中，HP 1056 撐得住，不必喝藥；下回合最多可能受 623（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 鐵壁尖刺冰霜・炎毒戰士 正在蓄力！')
  D (53, 10, True, '說明：D·防禦（敵人蓄力中，HP 1247 撐得住，不必喝藥；下回合最多可能受 623（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 鐵壁尖刺冰霜・炎毒戰士 正在蓄力！')
  D (53, 13, True, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 623 ≥ HP 568；防禦後估計 436 < HP 568，防禦後撐', '· 建議 ★D·防禦 ‖ 鐵壁尖刺冰霜・炎毒戰士 正在蓄力！')
  D (68, 8, False, '說明：D·防禦（生命藥水已用完；防禦後估計 311 < HP 375，HP 偏低：375/1247（≤ 35%））（小怪', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜冠刺客 正在蓄力！')
  D (68, 16, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 311 ≥ HP 282）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 雷翼翼龍 正在蓄力！')
  D (68, 19, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 311 ≥ HP 282）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 雷翼翼龍 正在蓄力！')
grp total 28 inside 20 below_lo 8 above_hi 0 skipped 8
T26+ F63 turns=32 hits>=T26 (turn,%):[(30, 15.0)] chargedHits>=T26:[]
T26+ F68 turns=30 hits>=T26 (turn,%):[] chargedHits>=T26:[]
```
- 截圖 qa-cp9-rc12ae-shots/bw2-death.webp；save qa-saves/rc12ae-bulwark-2-end.json

## bw3 (事件行 2282–3178)
- prep：自動分配、買藥至 13，截圖 bw3-prep.webp。**死於 F53 普通戰（小怪不受蓄力鎖），回合 17，0 瓶**。死前3回合(maxHP≈1107)：T15 -139；T16 -0；T17 -276（霜爪刺客 蓄力一擊 25.0%，=cap）。無3連。本局無 T26 戰、反傷『合計』提示未出現。
```
bw3 lastF 53 kinds ecemecerecembcembcemecemececbmembmbmbcbmbcb
ckpt {10: 13, 20: 11, 30: 9, 40: 9, 50: 1}
BOSS F45+:
 F 45 t 12 pot 4 -> 2 rw 1 hp1 [933, 1107]
 F 50 t 17 pot 1 -> 1 rw 1 hp1 [433, 1107]
elite F15-69 [(18, 1), (23, 0), (26, 0), (28, 0), (31, 1), (33, 1), (38, 0)] F70+ []
floors with charged hits 9 max run overall
 floor 41 battle chargedTurns 4 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 43 battle chargedTurns 5 maxrun 2 maxhit24.9% maxturnTot24.9% 
 floor 53 battle chargedTurns 5 maxrun 2 maxhit24.9% maxturnTot24.9% 
maxhit (29.97250229147571, 40, 17) maxturn (39.92773261065944, 41, 2)
hits>40.0: [] turn>50: []
est [(25, 10, 219, 152), (35, 1, 485, 372), (40, 1, 488, 381), (40, 11, 488, 369)]
F45-69 node:pots 45b:3 46b:0 47c:0 48b:0 49m:0 50b:0 51b:0 52c:0 53b:0
totdrinks 15 F45-69 drinks 3
normal fights 9 turns [4, 3, 8, 10, 20, 16, 12, 13, 17]
normal>=20 [(43, 20)]
nonboss charging turns 48 star letters {'Q': 7, 'W': 3, 'A': 31, 'Z': 1, 'S': 1, 'D': 5}
 star=D nonboss 5 (elite-floor 0 )
  D (51, 11, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 276 ≥ HP 57）：這一擊只能靠保命活下來，之', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 風牙幻靈 正在蓄力！')
  D (53, 5, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 276 ≥ HP 29）：這一擊只能靠保命活下來，之', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜爪刺客 正在蓄力！')
  D (53, 8, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 276 ≥ HP 250）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜甲戰士 正在蓄力！')
  D (53, 9, False, '說明：D·防禦（生命藥水已用完；防禦後估計 387 < HP 416，不防禦會死：下回合全體暴擊估計 442 ≥ HP ', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜爪刺客 正在蓄力！')
  D (53, 14, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 166 ≥ HP 140）：這一擊只能靠保命活下來，', '霜爪刺客 正在蓄力！')
grp total 12 inside 9 below_lo 3 above_hi 0 skipped 10
```
- 截圖 qa-cp9-rc12ae-shots/bw3-death.webp；save qa-saves/rc12ae-bulwark-3-end.json

## oc1 (事件行 3179–4293)
- prep：自動分配、補藥至 13（oc 持 ✦3 ☯3），截圖 oc1-prep.webp。**死於 F65 普通戰（normal），回合 9，0 瓶，磨耗死（非蓄力）**。死前 3 回合(maxHP≈1094)：T7 -223（~20%）；T8 -223（~20%）；T9 -11（雷角鷹）；最後 2 回合最大單擊 炎鐮鐵偶 144（13%）。無蓄力3連。最大單回合 50.0%（F55 T4，恰等於 50，未 >50）。F63 T26 戰：T26 吃到 167（雷鐮蜥蜴 蓄力一擊，14.9%；蓄力於 T25 開始，T26 之後無新蓄力）。T26 截圖 oc1-F61-T26-normal.webp、oc1-F63-T26-normal.webp。**反傷提示 ✓**（F50 首領戰）：『Z（攻擊…）會吃反傷約 31，加上下回合敵方估計 551，合計 582 ≥ HP 352，會自殺』，同面板 同回合全體約 280–551；31+551=582≥352 比較正確（以 hi 計）；截圖 oc1-F50-refl-hint.webp。
```
oc1 lastF 65 kinds ececememecemecerecembmembcbrbcembcececembmbmbcbmbmbm
ckpt {10: 13, 20: 13, 30: 9, 40: 10, 50: 8, 60: 1}
BOSS F45+:
 F 45 t 11 pot 10 -> 9 rw 1 hp1 [464, 918]
 F 50 t 23 pot 8 -> 3 rw 1 hp1 [750, 1102]
 F 55 t 12 pot 3 -> 1 rw 1 hp1 [888, 1094]
 F 60 t 13 pot 1 -> 1 rw 1 hp1 [411, 1094]
elite F15-69 [(16, 1), (18, 0), (21, 0), (23, 0), (28, None), (38, 0), (43, 0), (46, 0), (48, 1)] F70+ []
floors with charged hits 13 max run overall
 floor 56 battle chargedTurns 4 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 61 battle chargedTurns 9 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 63 battle chargedTurns 10 maxrun 2 maxhit25.0% maxturnTot25.0% 
maxhit (39.97821350762527, 45, 4) maxturn (50.0, 55, 4)
hits>40.0: [] turn>50: []
est [(20, 1, 421, 115), (20, 5, 421, 252), (20, 8, 421, 147), (20, 9, 350, 221)]
F45-69 node:pots 45b:2 46e:0 47c:0 48e:0 49m:0 50b:6 51b:0 52m:0 53b:0 54m:0 55b:2 56b:0 57c:0 58b:0 59m:0 60b:0 61b:0 62m:0 63b:0 64m:0 65b:0
totdrinks 17 F45-69 drinks 10
normal fights 11 turns [2, 2, 3, 2, 6, 12, 13, 14, 15, 28, 32]
normal>=20 [(61, 28), (63, 32)]
nonboss charging turns 55 star letters {'W': 8, 'E': 6, 'A': 16, 'Q': 10, 'D': 13, 'Z': 1, 'S': 1}
 star=D nonboss 13 (elite-floor 1 )
  D (48, 7, True, '說明：D·防禦（敵人蓄力中，HP 943 撐得住，不必喝藥；下回合最多可能受 550（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 尖刺鐵壁烈焰・雷爪飛龍 正在蓄力！')
  D (58, 2, False, '說明：D·防禦（生命藥水已用完；防禦後估計 273 < HP 275，HP 偏低：275/1094（≤ 35%））（小怪', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎眼地龍 正在蓄力！')
  D (58, 5, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 273 ≥ HP 248）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎眼地龍 正在蓄力！')
  D (58, 8, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 273 ≥ HP 247）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎眼地龍 正在蓄力！')
  D (58, 11, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 273 ≥ HP 247）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 炎眼地龍 正在蓄力！')
  D (61, 12, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 279 ≥ HP 253）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 風岩蜈蚣 正在蓄力！')
grp total 26 inside 19 below_lo 7 above_hi 0 skipped 11
T26+ F61 turns=28 hits>=T26 (turn,%):[] chargedHits>=T26:[]
T26+ F63 turns=32 hits>=T26 (turn,%):[] chargedHits>=T26:[(26, '雷鐮蜥蜴')]
```
- 截圖 qa-cp9-rc12ae-shots/oc1-death.webp；save qa-saves/rc12ae-oc-1-end.json

## oc2 (事件行 4294–5026)
- prep：自動分配、補藥至 13，截圖 oc2-prep.webp。**死於 F55 首領戰（boss，鐵壁堅硬・守門者・炎羽蛇龍），回合 44，0 瓶**，磨耗死（反傷+小傷）。死前3回合(maxHP 1244)：T42 -35；T43 -19；T44 -50（皆 <5%）。無蓄力3連。最大單擊 39.95%（497，F46/F55，未 >40）、最大單回合 50.0%（F55 T32，恰=50 未>50）。反傷提示 ✓（F55 T44）：『D·防禦（攻擊…會吃反傷約 124，加上下回合敵方估計 194，合計 318 ≥ HP 36，會自殺』— 124+194=318≥36 比較正確。本局無 T26 普通戰。
```
oc2 lastF 55 kinds ececemececembcembcbrbcbremembcbrbcemecbrecer
ckpt {10: 13, 20: 13, 30: 13, 40: 15, 50: 13}
BOSS F45+:
 F 45 t 13 pot 16 -> 14 rw 1 hp1 [996, 1244]
 F 50 t 21 pot 13 -> 8 rw 1 hp1 [748, 1244]
elite F15-69 [(18, 0), (31, 0), (33, 0), (43, 1), (46, 1), (51, 1), (53, 0)] F70+ []
floors with charged hits 8 max run overall
maxhit (39.951768488745984, 55, 23) maxturn (50.0, 55, 32)
hits>40.0: [] turn>50: []
est [(25, 6, 429, 138), (35, 1, 400, 249), (40, 1, 414, 300), (45, 4, 622, 128)]
F45-69 node:pots 45b:3 46e:0 47c:0 48b:0 49r:0 50b:6 51e:0 52c:0 53e:0 54r:0 55b:8
totdrinks 18 F45-69 drinks 17
normal fights 9 turns [2, 2, 2, 2, 2, 3, 2, 6, 14]
normal>=20 []
nonboss charging turns 15 star letters {'W': 3, 'E': 2, 'A': 6, 'Q': 2, 'D': 2}
 star=D nonboss 2 (elite-floor 2 )
  D (53, 7, True, '說明：D·防禦（敵人蓄力中，HP 952 撐得住，不必喝藥；下回合最多可能受 621（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 分裂烈焰尖刺・霜骨妖精 正在蓄力！')
  D (53, 10, True, '說明：D·防禦（敵人蓄力中，HP 1007 撐得住，不必喝藥；下回合最多可能受 622（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 分裂烈焰尖刺・霜骨妖精 正在蓄力！')
grp total 12 inside 8 below_lo 4 above_hi 0 skipped 3
```
- 截圖 qa-cp9-rc12ae-shots/oc2-death.webp；save qa-saves/rc12ae-oc-2-end.json

## oc3 (事件行 5027–5804)
- prep：自動分配、補藥至 13，截圖 oc3-prep.webp。oc3 其實已完整跑完（中斷時已死亡並匯出）。**死於 F60 首領戰（boss，鐵壁堅硬・災厄・霜血元素靈），回合 8，0 瓶**。死前3回合(maxHP 768)：T6 -191（24.9%）；T7 -49；T8 -31。無3連。最大單擊 39.97%（F55，未>40）、最大單回合 50.0%（F50，恰=50未>50）。F58 普通戰 25 回合（無 T26）。反傷提示 ✓（F50）：『Z（攻擊…會吃反傷約 63，加上下回合敵方估計 384，合計 447 ≥ HP 261，會自殺』63+384=447≥261 正確。
```
oc3 lastF 60 kinds ememecembcbremembcbrbcbrbcbmecembcembcembmembcbm
ckpt {10: 13, 20: 11, 30: 12, 40: 14, 50: 10, 60: -1}
BOSS F45+:
 F 45 t 11 pot 14 -> 13 rw 1 hp1 [445, 768]
 F 50 t 11 pot 10 -> 8 rw 1 hp1 [461, 768]
 F 55 t 15 pot 8 -> 5 rw 1 hp1 [615, 768]
elite F15-69 [(16, 0), (18, 0), (36, 1), (38, 0), (43, 0), (48, 0), (53, 0)] F70+ []
floors with charged hits 10 max run overall
 floor 58 battle chargedTurns 8 maxrun 2 maxhit25.0% maxturnTot25.0% 
maxhit (39.973958333333336, 55, 4) maxturn (50.0, 50, 4)
hits>40.0: [] turn>50: []
est [(25, 1, 382, 208), (30, 1, 402, 281), (35, 1, 402, 281), (35, 4, 402, 241)]
F45-69 node:pots 45b:2 46b:0 47c:0 48e:0 49m:0 50b:3 51b:0 52m:0 53e:0 54m:0 55b:4 56b:0 57c:0 58b:0 59m:0 60b:0
totdrinks 12 F45-69 drinks 9
normal fights 13 turns [3, 2, 2, 3, 2, 3, 2, 2, 7, 14, 11, 15, 25]
normal>=20 [(58, 25)]
nonboss charging turns 29 star letters {'W': 7, 'A': 14, 'Q': 3, 'E': 3, 'Z': 1, 'D': 1}
 star=D nonboss 1 (elite-floor 0 )
  D (58, 21, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 240 ≥ HP 192）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 雷鬃飛龍 正在蓄力！')
grp total 11 inside 10 below_lo 1 above_hi 0 skipped 4
```
- 截圖 qa-cp9-rc12ae-shots/oc3-death.webp；save qa-saves/rc12ae-oc-3-end.json

## ar1 (事件行 5805–6628)
- prep：自動分配、補藥至 13，截圖 ar1-prep.webp。**死於 F63 普通戰（小怪不受蓄力鎖），回合 12，0 瓶**。死前3回合(maxHP≈994)：T10 -149（15%，霜棘星靈）；T11 -100；T12 -149（15.0%）。蓄力連續最多 2 回合（無3連）；arcane 蓄力上限 20%，最大蓄力 19.9–20.0% ✓。最大單擊 40.0%（F45 T4，恰=40 未>40）、最大單回合 50.0%（F60，恰=50）。無 T26 普通戰（最長 12 回合）。反傷『合計』提示本局未出現。**手感（推測）3/5**：普通戰節奏快（中位約 3 回合）、★ 多為 A 好用；但 F60+ 藥水耗盡後被磨死，後段缺藥。
```
ar1 lastF 63 kinds ecbmecembmecbmerecemecembcerecbrecbcbcbrbmembmbmbmb
ckpt {10: 13, 20: 12, 30: 11, 40: 13, 50: 8, 60: 5}
BOSS F45+:
 F 45 t 9 pot 10 -> 9 rw 1 hp1 [560, 930]
 F 50 t 3 pot 8 -> 9 rw 1 hp1 [447, 948]
 F 55 t 17 pot 8 -> 6 rw 1 hp1 [713, 966]
 F 60 t 12 pot 5 -> 3 rw 1 hp1 [492, 984]
elite F15-69 [(18, 0), (21, 0), (23, 0), (26, 0), (28, 0), (33, 0), (36, 1), (41, 0), (53, 0)] F70+ []
floors with charged hits 15 max run overall
 floor 48 battle chargedTurns 2 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 51 battle chargedTurns 3 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 56 battle chargedTurns 4 maxrun 2 maxhit19.9% maxturnTot19.9% 
 floor 58 battle chargedTurns 2 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 61 battle chargedTurns 5 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 63 battle chargedTurns 5 maxrun 2 maxhit19.9% maxturnTot19.9% 
maxhit (40.0, 45, 4) maxturn (50.0, 60, 10)
hits>40.0: [] turn>50: []
est [(15, 1, 398, 107), (15, 5, 398, 263), (30, 1, 438, 306), (35, 6, 446, 173)]
F45-69 node:pots 45b:2 46b:0 47c:0 48b:0 49r:0 50b:0 51b:0 52m:0 53e:0 54m:0 55b:3 56b:0 57m:0 58b:0 59m:0 60b:3 61b:0 62m:0 63b:0
totdrinks 15 F45-69 drinks 8
normal fights 13 turns [1, 1, 1, 2, 2, 4, 3, 5, 8, 12, 6, 12, 12]
normal>=20 []
nonboss charging turns 36 star letters {'A': 30, 'D': 2, 'Z': 3, 'Q': 1}
 star=D nonboss 2 (elite-floor 1 )
  D (41, 1, True, '說明：D·防禦（敵人蓄力中，HP 912 撐得住，不必喝藥；下回合最多可能受 366（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 銳眼迅捷堅硬・炎血遊俠 正在蓄力！')
  D (63, 10, False, '說明：D·防禦（生命藥水已用完；防禦只靠保命剩 1 HP（未保命估 198 ≥ HP 101）：這一擊只能靠保命活下來，', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 霜棘星靈 正在蓄力！')
grp total 31 inside 28 below_lo 3 above_hi 0 skipped 4
```
- 截圖 qa-cp9-rc12ae-shots/ar1-death.webp；save qa-saves/rc12ae-arcane-1-end.json

## ar2 (事件行 6629–7644)
- prep：自動分配、補藥至 13，截圖 ar2-prep.webp。**死於 F75 首領戰（boss，尖刺銳眼・守門者・風毒飛蛾），回合 12，0 瓶**。死前3回合(maxHP≈1450)：T10 -0；T11 -109；T12 -232（重擊/蓄力 16%，首領戰上限 30% 內）。無3連。F70 首領 +1 藥水 ✓（rw 1）。最大單擊 39.96%（F51 T1，未>40）、最大單回合 50.0%（F70 T1，恰=50）。無 T26 普通戰（最長 16 回合）。反傷提示 ✓ 本局 F50（與 oc3 同文）。**手感（推測）3.5/5**：F70 前順，普通戰短；F75 首領戰藥水耗盡突然死、★ 提示『幾乎必敗』太晚。
```
ar2 lastF 75 kinds ecemecemememecembcbremerecemecemembrbcbrecerecerecbrbmbmbmbm
ckpt {10: 13, 20: 13, 30: 12, 40: 12, 50: 12, 60: 11, 70: 6}
BOSS F45+:
 F 45 t 7 pot 12 -> 12 rw 1 hp1 [478, 930]
 F 50 t 7 pot 12 -> 12 rw 1 hp1 [578, 948]
 F 55 t 9 pot 11 -> 12 rw 1 hp1 [464, 1159]
 F 60 t 9 pot 11 -> 11 rw 1 hp1 [1061, 1378]
 F 65 t 10 pot 8 -> 9 rw 1 hp1 [562, 1403]
 F 70 t 6 pot 6 -> 5 rw 1 hp1 [1086, 1428]
elite F15-69 [(16, 0), (18, 1), (26, 0), (28, 0), (31, 0), (33, 1), (36, 1), (38, 0), (41, 0), (51, 0), (53, 0), (56, 0), (58, 1), (61, 0)] F70+ []
floors with charged hits 18 max run overall
 floor 63 battle chargedTurns 4 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 66 battle chargedTurns 5 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 68 battle chargedTurns 5 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 71 battle chargedTurns 5 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 73 battle chargedTurns 6 maxrun 2 maxhit20.0% maxturnTot20.0% 
maxhit (39.95793901156677, 51, 1) maxturn (50.0, 70, 1)
hits>40.0: [] turn>50: []
est [(35, 1, 447, 312), (35, 5, 447, 312), (35, 8, 447, 268), (45, 4, 400, 262)]
F45-69 node:pots 45b:1 46b:0 47c:0 48b:0 49r:0 50b:1 51e:0 52c:0 53e:0 54r:0 55b:0 56e:0 57c:0 58e:0 59r:0 60b:1 61e:0 62c:0 63b:0 64r:0 65b:0 66b:0 67m:0 68b:0 69m:0
totdrinks 14 F45-69 drinks 3
normal fights 10 turns [2, 1, 3, 4, 2, 11, 13, 13, 14, 16]
normal>=20 []
nonboss charging turns 54 star letters {'D': 8, 'A': 37, 'Q': 2, '?': 3, 'Z': 4}
 star=D nonboss 8 (elite-floor 8 )
  D (13, 1, True, '說明：D·防禦（敵人蓄力中，HP 876 撐得住，不必喝藥；下回合最多可能受 438（≥ 最大 HP 40%））（小怪不', ' · 建議 ★D·防禦 ‖ 尖刺鐵壁・炎鱗雙頭龍 正在蓄力！')
  D (41, 1, True, '說明：D·防禦（敵人蓄力中，HP 782 撐得住，不必喝藥；下回合最多可能受 366（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 銳眼守護迅捷・炎眼地龍 正在蓄力！')
  D (53, 1, True, '說明：D·防禦（敵人蓄力中，HP 1141 撐得住，不必喝藥；下回合最多可能受 460（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 嗜血堅硬鐵壁・霜血騎士 正在蓄力！')
  D (56, 4, True, '說明：D·防禦（敵人蓄力中，HP 1128 撐得住，不必喝藥；下回合最多可能受 563（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 嗜血堅硬狂戰・霜鱗巨人 正在蓄力！')
  D (58, 1, True, '說明：D·防禦（敵人蓄力中，HP 1357 撐得住，不必喝藥；下回合最多可能受 683（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 銳眼尖刺守護・炎影螳螂 正在蓄力！')
  D (58, 4, True, '說明：D·防禦（敵人蓄力中，HP 879 撐得住，不必喝藥；下回合最多可能受 683（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 銳眼尖刺守護・炎影螳螂 正在蓄力！')
grp total 26 inside 24 below_lo 2 above_hi 0 skipped 5
```
- 截圖 qa-cp9-rc12ae-shots/ar2-death.webp；save qa-saves/rc12ae-arcane-2-end.json

## ar3 (事件行 7645–8905)
- prep：自動分配、補藥至 13，截圖 ar3-prep.webp。**死於 F86 普通戰（normal），回合 8，0 瓶**（最深）。死前3回合(maxHP 1475)：T6 -369（=霜晶刺客 221 一般 + 霜牙巨人 蓄力一擊 148；單回合 25.0%，蓄力部分僅 10%）；T7 -184；T8 -221（15%，一般攻擊）。無蓄力3連；arcane 蓄力最大 20.0% ✓；單回合總蓄力 <40% ✓。F70 首領 +1 ✓、F80 首領 +1 ✓（rw 1）；F75/F85 首領無獎勵（本就非獎勵層）。最大單擊/單回合 40.0%（F56，恰=40）。無 T26 普通戰（最長 16 回合）。反傷『合計』提示本局未出現。**手感（推測）4/5**：藥水充足（F50 時 18 瓶）、走到 F86，節奏順；F80+ 磨耗仍偏快。
```
ar3 lastF 86 kinds ecerbcemeceremerecemembrecembcemecerecbrecbmecbmecbcemembcbmbmbmbmbmb
ckpt {10: 13, 20: 12, 30: 13, 40: 17, 50: 18, 60: 12, 70: 8, 80: 4}
BOSS F45+:
 F 45 t 5 pot 17 -> 17 rw 1 hp1 [930, 930]
 F 50 t 7 pot 18 -> 18 rw 1 hp1 [863, 948]
 F 55 t 6 pot 15 -> 15 rw 1 hp1 [966, 966]
 F 60 t 14 pot 12 -> 12 rw 1 hp1 [689, 1102]
 F 65 t 12 pot 8 -> 8 rw 1 hp1 [987, 1122]
 F 70 t 7 pot 8 -> 8 rw 1 hp1 [451, 1142]
 F 75 t 6 pot 6 -> 5 rw 0 hp1 [764, 1163]
 F 80 t 10 pot 4 -> 4 rw 1 hp1 [711, 1183]
 F 85 t 7 pot 1 -> 0 rw 0 hp1 [651, 1203]
elite F15-69 [(16, 1), (18, 0), (21, 0), (23, 1), (26, 1), (31, 1), (33, 1), (38, 1), (41, 0), (43, 0), (46, 1), (51, 0), (56, 1), (61, 0), (66, 0), (68, 1)] F70+ []
floors with charged hits 24 max run overall
 floor 53 battle chargedTurns 3 maxrun 2 maxhit19.9% maxturnTot19.9% 
 floor 58 battle chargedTurns 3 maxrun 2 maxhit19.9% maxturnTot19.9% 
 floor 78 battle chargedTurns 5 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 81 battle chargedTurns 4 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 83 battle chargedTurns 5 maxrun 2 maxhit20.0% maxturnTot20.0% 
 floor 86 battle chargedTurns 3 maxrun 2 maxhit20.0% maxturnTot20.0% 
maxhit (40.0, 56, 7) maxturn (40.0, 56, 7)
hits>40.0: [] turn>50: []
est [(40, 1, 456, 319), (40, 4, 364, 182), (60, 6, 550, 258), (70, 4, 456, 288)]
F45-69 node:pots 45b:1 46e:0 47c:0 48b:0 49r:0 50b:1 51e:0 52c:0 53b:0 54m:0 55b:1 56e:0 57c:0 58b:0 59m:0 60b:1 61e:0 62c:0 63b:0 64c:0 65b:1 66e:0 67m:0 68e:0 69m:0
totdrinks 14 F45-69 drinks 5
normal fights 14 turns [1, 1, 1, 3, 9, 7, 10, 14, 12, 13, 16, 14, 15, 8]
normal>=20 []
nonboss charging turns 72 star letters {'A': 45, 'D': 8, 'Z': 8, 'Q': 9, '?': 2}
 star=D nonboss 8 (elite-floor 6 )
  D (41, 1, True, '說明：D·防禦（敵人蓄力中，HP 912 撐得住，不必喝藥；下回合最多可能受 366（≥ 最大 HP 40%））（小怪不', ' · 建議 ★D·防禦 ‖ 鐵壁守護迅捷・風翼虎 正在蓄力！')
  D (56, 1, True, '說明：D·防禦（敵人蓄力中，HP 966 撐得住，不必喝藥；下回合最多可能受 434（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 鐵壁嗜血堅硬・霜爪蛇龍 正在蓄力！')
  D (61, 1, True, '說明：D·防禦（敵人蓄力中，HP 909 撐得住，不必喝藥；下回合最多可能受 442（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 鐵壁守護冰霜・闇爪幻靈 正在蓄力！')
  D (61, 4, True, '說明：D·防禦（敵人蓄力中，HP 1105 撐得住，不必喝藥；下回合最多可能受 442（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 鐵壁守護冰霜・闇爪幻靈 正在蓄力！')
  D (61, 7, True, '說明：D·防禦（敵人蓄力中，HP 554 撐得住，不必喝藥；下回合最多可能受 442（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 鐵壁守護冰霜・闇爪幻靈 正在蓄力！')
  D (61, 12, True, '說明：D·防禦（敵人蓄力中，HP 940 撐得住，不必喝藥；下回合最多可能受 442（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 鐵壁守護冰霜・闇爪幻靈 正在蓄力！')
grp total 19 inside 16 below_lo 3 above_hi 0 skipped 10
```
- 截圖 qa-cp9-rc12ae-shots/ar3-death.webp；save qa-saves/rc12ae-arcane-3-end.json

## bl1 (事件行 8906–9681)
- prep：自動分配、補藥至 13，截圖 bl1-prep.webp。**死於 F55 首領戰（boss，烈焰銳眼・守門者・霜甲獅，磨耗死），回合 26，0 瓶**。死前3回合：T24 -0；T25 -6；T26 -1（皆 <1%）。blade 一般戰回合：2,4,8,11,21,12（中位 9.5、最大 21、≥30 回合 0 場）；F75+ 一般戰：無（未到）。F45 首領 33 回合、F50 首領 25 回合、F55 首領 26+ 回合（死）— 首領戰偏長。最大單擊 39.9%（390，F33–F46 多次；未>40）、最大單回合 39.9%。F51 一般戰 21 回合（無 T26）。反傷『合計』提示本局未出現。**手感（推測）2.5/5**：F45+ 首領戰 25–33 回合太拖，藥水持續被磨耗，F55 磨死。
```
bl1 lastF 55 kinds ecemememecememembcbmememecerecerecbmecbmbmbm
ckpt {10: 13, 20: 14, 30: 14, 40: 18, 50: 10}
BOSS F45+:
 F 45 t 33 pot 16 -> 12 rw 1 hp1 [977, 977]
 F 50 t 25 pot 10 -> 7 rw 1 hp1 [456, 977]
elite F15-69 [(16, 1), (18, 0), (26, 0), (28, 0), (31, 0), (33, 1), (36, 1), (38, 0), (41, 0), (46, 0)] F70+ []
floors with charged hits 9 max run overall
 floor 43 battle chargedTurns 3 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 51 battle chargedTurns 9 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 53 battle chargedTurns 5 maxrun 2 maxhit25.0% maxturnTot25.0% 
maxhit (39.91811668372569, 46, 1) maxturn (39.923224568138195, 53, 2)
hits>40.0: [] turn>50: []
est [(45, 14, 443, 30), (45, 19, 489, 35), (45, 25, 399, 178), (45, 29, 411, 195)]
F45-69 node:pots 45b:5 46e:0 47c:0 48b:0 49m:0 50b:4 51b:0 52m:0 53b:0 54m:0 55b:1
totdrinks 11 F45-69 drinks 10
normal fights 6 turns [2, 4, 8, 11, 21, 12]
normal>=20 [(51, 21)]
nonboss charging turns 37 star letters {'A': 24, 'D': 1, 'Q': 4, 'Z': 5, 'W': 3}
 star=D nonboss 1 (elite-floor 1 )
  D (28, 1, True, '說明：D·防禦（敵人蓄力中，HP 780 撐得住，不必喝藥；下回合最多可能受 406（≥ 最大 HP 40%））（小怪不', '！ · 建議 ★D·防禦 ‖ 嗜血尖刺・霜毒戰士 正在蓄力！')
grp total 14 inside 10 below_lo 4 above_hi 0 skipped 0
```
- 截圖 qa-cp9-rc12ae-shots/bl1-death.webp；save qa-saves/rc12ae-blade-1-end.json

## bl2 (事件行 9682–10591)
- prep：自動分配、補藥至 13，截圖 bl2-prep.webp。**死於 F61 普通戰（normal），回合 8，0 瓶**。死前3回合(maxHP≈1100)：T6 -276（≈25%）；T7 -279（≈25%，雷牙雙頭龍 蓄力一擊，上限 25% ✓）；T8 -165（15%，炎棘遊俠）。蓄力連續最多 2 回合（無3連）。blade 一般戰回合：5,15,16,8（中位 11.5、最大 16、≥30 回合 0 場）；F75+ 一般戰：無。**F60 首領戰 52 回合（極長）**，藥水 5→1（含獎勵 1）；F45 首領 18、F50 11、F55 12 回合。最大單擊 39.9%（419，F33/F51，未>40）、最大單回合 44.8%（F31，未>50）。同回合全體 14 回合中 1 回合高於 hi（F45 T11 實際 381 > hi 353）。反傷『合計』提示本局未出現。**手感（推測）2.5/5**：F60 首領 52 回合太拖，藥水全吃光，之後被蓄力連擊磨死。
```
bl2 lastF 61 kinds ecemecerececememecemecerbcerecemecerecemecembcbmb
ckpt {10: 13, 20: 14, 30: 15, 40: 14, 50: 10, 60: 5}
BOSS F45+:
 F 45 t 18 pot 11 -> 10 rw 1 hp1 [937, 1049]
 F 50 t 11 pot 10 -> 10 rw 1 hp1 [684, 1049]
 F 55 t 12 pot 9 -> 8 rw 1 hp1 [655, 1049]
 F 60 t 52 pot 5 -> 1 rw 1 hp1 [380, 1078]
elite F15-69 [(16, 1), (18, 0), (21, 0), (23, 1), (26, 0), (28, None), (33, 1), (36, 0), (38, 0), (41, 0), (43, 0), (46, 0), (48, 0), (51, 1), (53, 0)] F70+ []
floors with charged hits 9 max run overall
 floor 56 battle chargedTurns 3 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 58 battle chargedTurns 4 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 61 battle chargedTurns 4 maxrun 2 maxhit25.0% maxturnTot25.0% 
maxhit (39.94280266920877, 51, 7) maxturn (44.804575786463296, 31, 1)
hits>40.0: [] turn>50: []
est [(35, 4, 352, 156), (35, 9, 457, 140), (40, 4, 367, 78), (50, 7, 398, 144)]
F45-69 node:pots 45b:2 46e:0 47c:0 48e:0 49m:0 50b:1 51e:0 52c:0 53e:0 54m:0 55b:2 56b:0 57c:0 58b:0 59m:0 60b:4 61b:0
totdrinks 13 F45-69 drinks 9
normal fights 4 turns [5, 15, 16, 8]
normal>=20 []
nonboss charging turns 39 star letters {'A': 16, 'Q': 4, 'Z': 6, 'D': 9, 'W': 2, 'E': 2}
 star=D nonboss 9 (elite-floor 7 )
  D (41, 1, True, '說明：D·防禦（敵人蓄力中，HP 1009 撐得住，不必喝藥；下回合最多可能受 524（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 尖刺守護狂戰・炎冠精靈 正在蓄力！')
  D (41, 4, True, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 524 ≥ HP 435；防禦後估計 367 < HP 435，防禦後撐', '· 建議 ★D·防禦 ‖ 尖刺守護狂戰・炎冠精靈 正在蓄力！')
  D (41, 7, True, '說明：D·防禦（敵人蓄力中，HP 831 撐得住，不必喝藥；下回合最多可能受 524（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 尖刺守護狂戰・炎冠精靈 正在蓄力！')
  D (43, 1, True, '說明：D·防禦（敵人蓄力中，HP 782 撐得住，不必喝藥；下回合最多可能受 524（≥ 最大 HP 40%））（小怪不', '· 建議 ★D·防禦 ‖ 守護尖刺迅捷・霜血遊俠 正在蓄力！')
  D (43, 4, True, '說明：D·防禦（敵人蓄力中，HP 1049 撐得住，不必喝藥；下回合最多可能受 524（≥ 最大 HP 40%））（小怪', '· 建議 ★D·防禦 ‖ 守護尖刺迅捷・霜血遊俠 正在蓄力！')
  D (43, 7, True, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 524 ≥ HP 443；防禦後估計 367 < HP 443，防禦後撐', '· 建議 ★D·防禦 ‖ 守護尖刺迅捷・霜血遊俠 正在蓄力！')
grp total 14 inside 12 below_lo 1 above_hi 1 skipped 2
   ('ABOVE', 45, 11, 124, 353, 381, 'A')
```
- 截圖 qa-cp9-rc12ae-shots/bl2-death.webp；save qa-saves/rc12ae-blade-2-end.json

## bl3 (事件行 10592–11832)
- prep：自動分配、補藥至 13，截圖 bl3-prep.webp。bl3 其實已完整跑完（中斷前已死亡並匯出）。**死於 F76 普通戰（normal，闇刃怨靈），回合 14，0 瓶**。死前3回合(maxHP 868)：T12 -0；T13 -54；T14 -217（蓄力大招 25.0%，上限 25% ✓）。無3連（蓄力最多連2回合）。blade 一般戰回合(15場)：2,1,2,2,5,5,6,9,22,23,25,24,25,31,14；中位 9、最大 31、≥30 回合 1 場（F73=31）。**F75+ 一般戰：F76=14 回合（死）；F73 31 回合不屬 F75+。** T26+ 檢查：F73 T26 截圖 bl3-F73-T26-normal.webp，T26 後最大單擊 15.0%（T28，非蓄力），無新蓄力 ✓。首領回合：F60=25、F65=26、F70=4、F75=3；F70 首領 +1 藥水 ✓。最大單擊 39.98%（F65）/ 40%（347，F41–F65 多次，恰=40未>40）、最大單回合 47.1%（F70，未>50）。同回合全體 23 回合全在區間內（0 低於 lo、0 高於 hi）；F31 T1 估計偏低一次（實際 303 > hi 155）列為 estmis。反傷『合計』提示本局未出現。**手感（推測）3/5**：普通戰 F61–F73 連續 22–31 回合偏拖，藥水 F70 僅剩 2 瓶，F76 磨死；但無不公平爆擊。
```
bl3 lastF 76 kinds ecemecembcbcecececembcbrbcembcbrecerecerecerbcembmbmbcbmbmbmb
ckpt {10: 13, 20: 14, 30: 16, 40: 15, 50: 14, 60: 9, 70: 2}
BOSS F45+:
 F 45 t 6 pot 14 -> 14 rw 1 hp1 [868, 868]
 F 50 t 8 pot 14 -> 13 rw 1 hp1 [728, 868]
 F 55 t 6 pot 12 -> 12 rw 1 hp1 [446, 868]
 F 60 t 25 pot 9 -> 6 rw 1 hp1 [492, 868]
 F 65 t 26 pot 5 -> 3 rw 1 hp1 [435, 868]
 F 70 t 4 pot 2 -> 2 rw 1 hp1 [378, 868]
 F 75 t 3 pot 1 -> 1 rw 0 hp1 [316, 868]
elite F15-69 [(16, 0), (18, 1), (21, 0), (23, 1), (33, 0), (41, 0), (43, 1), (46, 0), (48, 0), (51, 0), (53, 1), (58, 1)] F70+ []
floors with charged hits 21 max run overall
 floor 36 battle chargedTurns 2 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 38 battle chargedTurns 2 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 61 battle chargedTurns 2 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 63 battle chargedTurns 2 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 66 battle chargedTurns 2 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 71 battle chargedTurns 2 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 73 battle chargedTurns 2 maxrun 2 maxhit25.0% maxturnTot25.0% 
 floor 76 battle chargedTurns 4 maxrun 2 maxhit25.0% maxturnTot25.0% 
maxhit (39.97695852534562, 65, 9) maxturn (47.11981566820276, 70, 1)
hits>40.0: [] turn>50: []
est [(50, 7, 434, 140), (60, 1, 434, 303), (60, 11, 374, 159), (60, 23, 347, 260)]
F45-69 node:pots 45b:1 46e:0 47c:0 48e:0 49r:0 50b:2 51e:0 52c:0 53e:0 54r:0 55b:1 56b:0 57c:0 58e:0 59m:0 60b:4 61b:0 62m:0 63b:0 64m:0 65b:3 66b:0 67c:0 68b:0 69m:0
totdrinks 13 F45-69 drinks 11
normal fights 15 turns [2, 1, 2, 2, 5, 5, 6, 9, 22, 23, 25, 24, 25, 31, 14]
normal>=20 [(61, 22), (63, 23), (66, 25), (68, 24), (71, 25), (73, 31)]
nonboss charging turns 61 star letters {'D': 8, 'Q': 6, 'A': 11, 'Z': 12, 'W': 6, 'E': 18}
 star=D nonboss 8 (elite-floor 5 )
  D (23, 1, True, '說明：D·防禦（敵人蓄力中，HP 850 撐得住，不必喝藥；下回合最多可能受 340（≥ 最大 HP 40%））（小怪不', '！ · 建議 ★D·防禦 ‖ 烈焰銳眼・炎爪蛇龍 正在蓄力！')
  D (31, 1, False, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 434 ≥ HP 417；防禦後估計 303 < HP 417，防禦後撐', '敵人蓄力中！ · 建議 ★D·防禦 ‖ 風鋼光靈 正在蓄力！')
  D (43, 1, True, '說明：D·防禦（敵人蓄力中，HP 677 撐得住，不必喝藥；下回合最多可能受 434（≥ 最大 HP 40%））（小怪不', ' · 建議 ★D·防禦 ‖ 分裂尖刺鐵壁・雷鐮鶴 正在蓄力！')
  D (43, 4, True, '說明：D·防禦（敵人蓄力中，HP 868 撐得住，不必喝藥；下回合最多可能受 434（≥ 最大 HP 40%））（小怪不', ' · 建議 ★D·防禦 ‖ 分裂尖刺鐵壁・雷鐮鶴 正在蓄力！')
  D (43, 7, True, '說明：D·防禦（不防禦會死：下回合全體暴擊估計 434 ≥ HP 380；防禦後估計 303 < HP 380，防禦後撐', ' · 建議 ★D·防禦 ‖ 分裂尖刺鐵壁・雷鐮鶴 正在蓄力！')
  D (43, 10, True, '說明：D·防禦（敵人蓄力中，HP 755 撐得住，不必喝藥；下回合最多可能受 434（≥ 最大 HP 40%））（小怪不', ' · 建議 ★D·防禦 ‖ 分裂尖刺鐵壁・雷鐮鶴 正在蓄力！')
grp total 23 inside 23 below_lo 0 above_hi 0 skipped 9
T26+ F73 turns=31 hits>=T26 (turn,%):[(28, 15.0)] chargedHits>=T26:[]
```
- 截圖 qa-cp9-rc12ae-shots/bl3-death.webp；save qa-saves/rc12ae-blade-3-end.json

# rc12ae 12 局總結

## 已驗證（腳本對 rc12ae-evflush.jsonl＋qa-saves 重算）
- 終局：bw 66（一般 T21）/71（撤退，非陣亡）/53（一般 T17）→ 中位 66；oc 65（王 T9）/55（王 T44）/60（王 T8）→ 60；ar 63（一般）/75（王 T12）/86（一般）→ 75；bl 55（王 T26）/61（一般）/76（一般）→ 61。學派差 75−60=15；總中位 64；F100：0 局。
- 更正：oc1 段落寫「F65 普通戰」，但 F65 是王層（tele boss=True），實為王戰 T9 陣亡。
- 合格線：各派中位 40–75 ✓（ar 75 在上緣）；差 ≤15 ✓（剛好 15）；F100 ≤1 ✓；F30+ 王戰回合中位 8（6–18）✓。sim 對照：bl 61 < 65、bw 66 < 68、oc 60 < 70.5、ar 75 > 69。
- F45+ 王戰回合（含陣亡戰）：bw 11、oc 12.5、ar 8、bl 15；整體 11。
- blade 王戰回合（F30+）：bl1 2/1/7/33/25/26（死）；bl2 5/10/7/18/11/12/52；bl3 3/3/9/6/8/6/25/26/4/3。F45+ 中位 15（sim 22），但 ≥25 回合 6 場，最長 bl2 F60 52 回合。
- blade 一般戰回合（25 場）：中位 9、最多 31、>20 回合 7 場、≥30 回合 1 場（bl3 F73 31）。F75+ 一般戰只有 bl3 F76 14 回合（陣亡）。
- 同回合全體 lo–hi（bt key = turn+1 對齊，可對齊 233 回合；另 75 回合 bt 為空或不對齊，未計）：區間內 189（81%），低於 lo 43，高於 hi 1。各派：bw 39/57、oc 37/49、ar 68/76、bl 45/51。
  - 高於 hi（bug）：bl2 F45 T12（王戰）實際 381 > hi 353。
  - 低於 lo、log 無閃避／格擋／招架（依指南不合理）：bw1 F30 T7、F65 T10；bw2 F60 T5、F61 T10、F63 T10；bw3 F40 T16；oc1 F20 T9、F65 T5；ar1 F15 T5；ar2 F73 T14；ar3 F75 T2、F76 T6、F85 T2；bl1 F51 T11、F53 T7。
  - 低於 lo 且有閃避／格擋（合理）：bw1 F25 T7、F35 T2、F35 T5、F60 T5、F65 T20；bw2 F35 T5、F45 T7、F50 T7、F65 T5、F70 T5；bw3 F25 T5、F43 T9；oc1 F20 T2、F20 T13、F25 T10、F30 T6、F60 T11；oc2 F25 T7、F45 T5、F45 T10、F50 T18；oc3 F45 T7；ar1 F15 T2、F61 T6；ar2 F73 T6；bl1 F45 T15、F45 T20；bl2 F58 T7。
- 反傷提示：格式已改成「反傷約 r，加上下回合敵方估計 E，合計 ≥ HP」。出現在 oc1 F50（31+551=582 ≥ HP 352/442）、oc2 F55（124+194=318 ≥ HP 36）、oc3 F50（63+384=447 ≥ HP 156/261）。加總與比較都正確。
- F70/F80 王戰藥水：F70 共 4 局（bw2、ar2、ar3、bl3）皆 +1；F80（ar3）+1；F75/F85 為 0 ✓。
- 蓄力上限 0 違規；無三連蓄力；T26 後無 >15% 一般戰單擊。最大單擊 40.0%（ar1 F45 T4），最大單回合 50.0%（oc1 F50 T9 王戰）。
- 菁英掉藥 F15–69：129 場中 44 場；F70+ 無菁英。非奧術小怪蓄力 218 擊中 171 擊打滿 25%。
- 手感分數（各局段落所填，皆標「推測」）：bw 缺（3 局都沒填）、oc 缺（3 局都沒填，含 oc3）；ar 3/3.5/4 → 中位 3.5 ✗；bl 2.5/2.5/3 → 中位 2.5 ✗。標準 ≥4 不通過。

## 推測
- 估計修正有效（rc12ad 352/354 低於 lo → 現在 81% 落在區間內），比 sim 的 55–68% 還高；有 14 次低於 lo 但沒有閃避／格擋，多在王戰或多隻小怪時，可能是怪物沒出手或擲骰，下限還是略高。
- blade 王戰長尾（33、52 回合）會把藥水磨光，是 bl 手感低的主因；F45+ 中位雖然比 sim 低，但變異很大。
- 後段死因主要是藥水耗盡後被磨死（ar1、oc2、bl1）。

## Bug 清單
1. bl2 F45 T12 實際 381 > hi 353（王戰，估計上限不足一次）。
2. 14 次沒有閃避／格擋卻低於 lo（下限偏高，需確認）。
3. 手感：bw/oc 未填；ar、bl 未達 4。
4. 報告更正：oc1 死因應為 F65 王戰。
