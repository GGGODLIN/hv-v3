DONE rc12l (stopped by producer after ar2; ar3 not run)
# cp9-rc12l acceptance — blade 1 & 2 (server :5370)
Header: URL ?cp9&cp8&cp6&preset=postF20-blade&fresh. Badge shows "build 0ac0c03 · CP4 … CP9" (NOT 70c3549; 0ac0c03 = commit asked for; no "tag 70c3549" text on badge; 已驗證, shots bl1-badge-0ac0c03 / bl2-badge-0ac0c03). Each run: Lv14, 104,089C→103,589C, potions 3→13 (已驗證), 4x + 跳過動畫 on, 忽略並出發, 進入深淵塔, ★-only (data-primarykey), ★ map node, ★ buff, merchant buy-to-threshold (thr 7).
Driver /workspace/drvRC12l.js = drvRC12j.js + patches: potion-cooldown tracking (per-drink `drink` events, cdmax per boss/run; Z-button regex now matches 「還剩 N 回合」 — rc12j regex only matched 「冷卻 N」), cd shot only if >8, first 「藥水冷卻中」 text stop, boss start/end HP. State reset before each run (helper reloaded, #s cleared). No game code/console/debug changes; helper drvsrv.py (edited to serve drvRC12l.js) started and stopped (:8765 closed). Dumps qa-saves/rc12l-blade-{1,2}-end.json.
Caveat: first bl1 attempt (to F69) was discarded because the cooldown regex did not match this build; bl1 below is a complete fresh rerun. hp_end is the last HP seen during the boss fight (not necessarily the post-kill value; 已驗證 method limit). Per-boss charge hit: "mc" parsed from 蓄力/重擊 lines, mostly minion charges; no boss 蓄力 > 193.

## Results
| run | result | pot start→end | boss turns F30..F100 (sum) | max normal hit | max charge hit | cd max (run) | 自動換武器 | 魔力合流/以太 | >40% hit | >50% turn | thorn-attack <30% |
|---|---|---|---|---|---|---|---|---|---|---|---|
| bl1 | F100 boss cleared (13t), alive F101 HP 1241/1241; 已驗證 | 13→25 | 3,3,6,4,2,8,2,6,12,15,10,6,9,24,13 (123) | 221 = 26.8% of 826 (F65 boss, 塔主) / minion; 非 boss-only | 255 = 23.8% of 1070 (F95 minion 霜羽術士 蓄力一擊); boss 重擊 193 = 23.4% of 826 (F70) | 1 | 1 line: F10 優良・平衡之雷擊鐮刀 → 優良・平衡之鐮刀 | 0/0 | none | none | none (0 events) |
| bl2 | F100 boss cleared (7t), alive F101 HP 929/1448; 已驗證 | 13→27 | 2,3,1,1,3,10,2,6,11,5,17,20,12,19,7 (119) | 187 = 21.3% of 880 (F50) | 310 = 23.5% of 1320 (F85 minion 風角光靈 蓄力一擊); no boss 重擊 > 0 recorded | 1 | 1 line: F40 優良・平衡之雷擊鐮刀 → 精良・戰鬥法師之鐮刀 | 0/0 | none | none | none (0 events) |

## Per boss (pot start→end; HP start → last observed in fight / maxHP; cd max)
bl1: F30 25→25 753→398/826 cd0 | F35 24→24 744→536 cd0 | F40 24→23 826→661 cd1 | F45 23→23 826→308 cd0 | F50 23→23 826→389 cd0 | F55 23→21 826→685 cd1 | F60 26→26 806→498 cd0 | F65 27→26 826→605 cd1 | F70 28→25 756→624 cd1 | F75 26→24 790→644 cd1 | F80 26→24 763→737 cd0 | F85 26→27 826→395 cd0 | F90 28→27 1070→700 cd0 | F95 29→25 1021→855/1070 cd0 | F100 27→25 1070→910 cd0.
bl2: F30 18→18 880 | F35 20→20 | F40 21→21 | F45 24→24 | F50 25→25 | F55 25→24 cd1 | F60 23→23 | F65 26→25 cd1 | F70 27→25 1138 cd1 | F75 27→27 | F80 29→27 1320 cd1 | F85 28→26 cd1 | F90 28→27 cd1 | F95 28→26 cd1 | F100 27→27 1337 (see qa-cp9-rc12l-data.jsonl for exact values).
Boss-fight drinks (cooldown value displayed on the Z button at the next decision after each drink = 還剩 1 回合; all 1): bl1 F40 t6, F55 t4/t7, F65 t5, F70 t4/t10/t12, F75 t7/t14 (9 drinks, max 1); bl2 F55 t10, F65 t6, F70 t7/t11, F80 t7/t13, F85 t8/t19, F90 t8, F95 t7/t11 (11 drinks, max 1). Per-run max = 1 for both (≤8, 已驗證 with that observation point; the initial cooldown right at the drink moment isn't visible between turns — 推測 it may be larger than the next-turn reading). No value >8 → no >8 screenshot.
First 「藥水冷卻中（還剩 N 回合）」: bl1 F21 t? (non-boss, 決策：★A·攻擊（藥水冷卻中（還剩 1 回合））), shot bl1-F21-first-cooldown-text; bl2 F26, shot bl2-F26-first-cooldown-text. (已驗證)

## Other items
- ★ attacks 反傷 enemy at HP<30% (A/Q/W/E, thorn events): 0 in both runs (已驗證 by driver; no shot needed).
- Hits >40% maxHP / turns >50%: none (max normal 26.8%, max charge 23.8%); no shots. 已驗證.
- Key counts (只按★; 已驗證): bl1 A90 W38 Q33 E16 D48 Z24; bl2 A110 W37 Q25 E18 D41 Z16; keys 1–6: 0 in both (spell buttons enabled ~249 off-turns bl1, ★ never chose them); X/C 0. 「你的法杖：魔力合流/以太分流」 0/0 both (blade).
- 自動換武器: 1 line each (above); no screenshot (transient toast, captured in body text by driver).
- Buff ★ picks bl1 (28): 堅守 撕裂 處刑者 鋒刃專精 輕盈架勢 王者氣魄 精準 破甲直覺 磨利 銳眼 弱點洞察 戰意湧動 千刃 無盡戰意 韌魂 魂燃 先手氣勢 良品嗅覺 不動之盾 力量祝福 迅捷調和 靈巧 力量祝福 不滅 收斂心神 熱血 力量祝福 生命祝福. bl2 (28): 鋒刃專精 處刑者 銳眼 破甲直覺 磨利 精準 千刃 弱點洞察 魂燃 輕盈架勢 戰意湧動 韌魂 良品嗅覺 撕裂 收斂心神 無盡戰意 熱血 不動之盾 不滅 尋寶者 生命祝福 力量祝福 堅守 厚皮 靈巧 王者氣魄 先手氣勢 活力. 部分無效 cards: 不動之盾/不滅/厚皮/震盪 appeared as 【部分無效】 options; ★ picked 不動之盾 and 不滅 (and bl2 厚皮) — whether each pick was the 部分無效 version is 推測 (not tallied per pick); ★ never on 【無效】 (已驗證: no violation flag raised).
- Red text vs ★: c6 「這一擊只能靠保命…先喝藥」 bl1 F43 t6, F55 t6, F95 t6; bl2 F58 t6, F80 t6, F90 t7 — ★ was Z (先喝藥) every time (已驗證). lowmap trigger 0.
- Merchants: bl1 13 entered, bl2 9; all skipped (held ≥ thr 7, 0 purchases). 
- Difficulty: very easy compared to rc12j blade (rc12j bl1 died F76, potions 13→0); here potions end 25/27, bosses ≤24 turns. 魔力 none.

## Feel (手感分數, 推測)
- bl1: 8/10 — clean F100 clear, 25 potions left, longest boss 24t, no hit >27% maxHP.
- bl2: 8/10 — F100 clear, 27 potions, F85 20t / F95 19t longest.

---
# Update: blade 3 + bulwark 1 (build 0ac0c03, :5370; each run &fresh, driver state reset before each run; helper restarted and stopped again)
Driver addition: `drinkNow` events read the Z button / log right after the Z click resolves, i.e. in the same turn as the drink (已驗證 the text is shown then: Z button 「藥水冷卻中（還剩 N 回合）｜剩 X 瓶」). bl3 Lv14/104,089C→103,589C, bw1 Lv11/115,486C→114,986C, 13 potions each (已驗證). Badges: build 0ac0c03 (shots bl3-badge-0ac0c03, bw1-badge-0ac0c03). Dumps qa-saves/rc12l-blade-3-end.json, rc12l-bulwark-1-end.json.

| run | result | pot start→end | boss turns F30..F100 (sum) | max normal hit | max charge hit | same-turn cd max | 自動換武器 | 魔力/以太 | >40% hit | >50% turn | thorn <30% |
|---|---|---|---|---|---|---|---|---|---|---|---|
| bl3 | F100 cleared (18t), alive F101 1306/1306; 已驗證 | 13→30 | 6,6,5,8,5,6,6,6,29,29,19,12,27,15,18 (197) | 245 = 23.0% of 1063 (F60) | minion 蓄力一擊 379 = 34.9% of 1085 (F90); F75 312, F100 311, F70 291 | 1 (F25–F65 drinks); on F70+ drinks Z showed only 「×N」 (no cooldown text, 已驗證 for 17 drinks) | 0 | 0/0 | none | none | none |
| bw1 | F100 cleared (6t), alive F101 794/1107; 已驗證 | 13→36 | 6,9,10,9,12,3,11,4,2,3,7,6,7,5,6 (100) | 206 = 19.9% of 1033 (F40, 霜刃刺客) | minion 蓄力一擊 423 = 40.0% of 1058 (F95 風岩遊俠, 被格擋; 423/1058=39.98%, not >40%); F45/50/60 370 = 35.0% | 5 (≤8) | 2 (F40): 尚可・浣熊之斧 → 華麗・敏捷者之暴風匕首; 優良・減幅之塔盾 → 華麗・屏障之靈巧圓盾 | 0/0 | none (423 = 39.98%) | none | none |

## bl3 per boss (pot start→end; HP start→last observed/maxHP; turns)
F30 25→25 850→850/850 6t | F35 28→27 850→739 6t | F40 30→29 824→795 5t | F45 32→32 850→316 8t | F50 32→31 850→677 5t | F55 33→32 1063→710 6t | F60 33→32 1063→818 6t | F65 35→34 1085→1085 6t | F70 36→33 1085→595 29t | F75 34→30 1085→693 29t | F80 31→29 1085→759 19t | F85 31→30 1085→1085 12t | F90 32→30 1085→415 27t | F95 31→29 1189→1108 15t | F100 31→30 1140→958 18t. Exact rows in qa-cp9-rc12l-data.jsonl.
- Same-turn cooldown (bl3): F25 t4, F30 t5, F35 t5, F40 t4, F50 t4, F55 t4, F60 t5, F65 t5 all 「還剩 1 回合」; F70–F100 (17 drinks) no cooldown text, Z showed 「×N」. 推測: cooldown not shown/active at F70+ — odd vs bw1 where it grows; not investigated. Max per run 1, per boss 1 (F30–F65) / 0 (F70+). No value >8, no >8 shot. First 「藥水冷卻中」: F25 (non-boss), shot bl3-F25-first-cooldown-text.
- Difficulty: F30–F65 bosses 5–8 turns (sum 48, avg 6.0), F70+ bosses 12–29 turns (sum 149, avg 21.3); potion drain F30–65 ≈ 0–1 per boss, F70–90 3–4 per boss (F70 36→33, F75 34→30), but potions stayed ≥29. Ends F100 with 30 potions. Max charge hits all minion 蓄力一擊 (291–379) from F70 on vs none >0 from F30–F65 in the parsed data (mc=0). 已驗證 (driver per-boss rows).
- Keys (已驗證): A89 W52 Q51 E33 D42 Z24; keys 1–6: 0; X/C 0. 魔力合流/以太分流/你的法杖：…: 0 (blade). Merchants 9 entered, all skipped (held ≥ thr). Buff ★ picks 30: 戰意湧動 魂燃 先手氣勢 無盡戰意 輕盈架勢 熱血 王者氣魄 收斂心神 銳眼 韌魂 鋒刃專精 千刃 處刑者 精準 弱點洞察 不滅 撕裂 良品嗅覺 靈巧 迅捷調和 堅守 不動之盾 磨利 厚皮 尋寶者 破甲直覺 活力 節儉 力量祝福 生命祝福 (not tallied which were 部分無效; ★ never on 【無效】, 已驗證).
- c6 red 「只能靠保命…先喝藥」: F55 t4, F70 t6, F95 t6; ★ was Z each time (已驗證). lowmap 0. No 自動換武器 line.
- Feel (推測): bl3 6/10 — cleared with 30 potions but F70+ bosses 19–29 turns (F70, F75, F90) and minion charges up to 35% maxHP.

## bw1 per boss (pot start→end; turns; max normal / max charge / same-turn cd)
F30 22→21 6t 110/0 cd1 | F35 25→23 9t 176/0 cd1 | F40 24→23 10t 206/211 cd1 | F45 25→24 9t 10/370 cd2 | F50 26→26 12t 109/370 cd0 | F55 26→26 3t 67/0 | F60 26→25 11t 25/370 cd3 | F65 25→25 4t 31/0 | F70 28→28 2t 0/0 | F75 31→31 3t 0/0 | F80 33→32 7t 0/0 cd4 | F85 34→34 6t 0/0 | F90 35→34 7t 51/350 cd5 | F95 36→36 5t 118/423 | F100 36→36 6t 0/0 (maxHP 1033–1058).
- Same-turn cooldown (bw1): drinks at F10,F15,F25,F30,F35×2,F40: 1; F45: 2; F60: 3; F80: 4; F90: 5 (已驗證: cooldown after drink rises with how many drinks/where in the run; max 5 ≤ 8). First 「藥水冷卻中（還剩 1 回合）」 at F6 (non-boss), shot bw1-F6-first-cooldown-text. No value >8, no >8 shot.
- F30–65 vs F70+ (bulwark; 已驗證 from per-boss rows):
| | F30–F65 (8 bosses) | F70+ (7 bosses) |
|---|---|---|
| boss turns | 6,9,10,9,12,3,11,4 = 64 (avg 8.0, max 12) | 2,3,7,6,7,5,6 = 36 (avg 5.1, max 7) |
| potion drain at bosses | 22→25 start range; per-boss drain 1,2,1,1,0,0,1,0 = 6 total | 0,0,1,0,1,0,0 = 2 total; potions rose 28→36 |
| max normal boss hit | 206 (19.9%, F40); F35 176, F30 110, F50 109 | 118 (11.2%, F95); F90 51; others 0 |
| max charge hit (minion) | 370 (35.0% of 1058, F45/F50/F60); F40 211 | 423 (40.0%/39.98%, F95); F90 350 (33.1%) |
Reading: for bulwark rc12l, F70+ is NOT harder — bosses end faster (avg 5.1 vs 8.0 turns) and drain fewer potions; normal hits shrink, only minion 蓄力一擊 is slightly bigger (350–423 vs 370). Opposite of rc12j bw1 (which died F75). (已驗證 for this single run; one run → 推測 for the general trend.)
- Key counts (已驗證): A122 Q54 W28 D50 E7 Z14 S1; keys 1–6: 0; X/C 0. Merchants 10 entered, all skipped. Buff ★ picks 29: 尋寶者 不滅 不動之盾 震盪 撕裂 厚皮 堅守 活力 靈巧 節儉 弱點洞察 處刑者 鋒刃專精 良品嗅覺 戰意湧動 王者氣魄 精準 無盡戰意 輕盈架勢 千刃 力量祝福 迅捷調和 魂燃 破甲直覺 磨利 先手氣勢 熱血 銳眼 韌魂 (★ 部分無效 version of 不滅/不動之盾/震盪/厚皮 likely — 推測, not tallied; never 【無效】).
- c6 red text: F56 t2, F60 t6, F80 t4 — ★ was Z each time (已驗證). Thorn <30% attack: 0 events. lowmap 0. 魔力/以太 0.
- Feel (推測): bw1 8/10 — smooth clear, 36 potions, bosses ≤12 turns, only one charge at 40% of maxHP (F95, blocked).

---
# Update: bulwark 2 + bulwark 3 (build 0ac0c03, preset=postF20-bulwark&fresh; state reset before each run; both Lv11 / 115,486C→114,986C / 13 potions, 已驗證; shots bw2-badge-0ac0c03, bw3-badge-0ac0c03; helper restarted/stopped; dumps qa-saves/rc12l-bulwark-{2,3}-end.json)
| run | result | pot start→end | boss turns F30..F100 (sum) | max normal hit | max charge hit (minion) | same-turn cd max | 自動換武器 | 魔力/以太 | >40% hit | >50% turn | thorn<30% |
|---|---|---|---|---|---|---|---|---|---|---|---|
| bw2 | F100 cleared (4t), alive F101 HP 827/1181; 已驗證 | 13→22 | 3,5,11,9,11,11,8,26,3,3,5,8,8,6,4 (121) | 228 = 20.7% of 1099 (F35) | 472 = 40.0% (39.97% of 1181, F95 霜眼殭屍, 招架); F65 387 | 4 (F65 t6/t12) | 3: F5 尚可・浣熊之斧→優良・殺戮之烈焰棍棒; F60 優良・殺戮之烈焰棍棒→華麗・公牛之極寒斧; F61 優良・減幅之塔盾→優良・守護之塔盾 | 0/0 | none (39.97%) | none | none |
| bw3 | F100 cleared (12t), alive F101 HP 1526/1526; 已驗證 | 13→15 (low 6 at F65 end, F70 7) | 11,8,15,5,6,21,6,27,3,10,12,7,6,11,12 (160) | 187 = 16.8% of 1115 (F40) | 469 = 40.0% (39.98% of 1173, F80 炎血術士); F90 469; F60/F65/F75 398 | 6 (F100 t4) | 5: F3 尚可・浣熊之斧→優良・獵豹之暴風脇差; F30 →優良・奪心魔之斧; F40 →華麗・浣熊之暴風脇差; F42 →傳說・殺戮之虛靈棍棒; F90 優良・減幅之塔盾→優良・石膚之塔盾 | 0/0 | none (39.98%) | none | none |

## Same-turn cooldown (已驗證, Z button text on the drink turn)
- bw2 boss drinks: F5(non-boss first text) F20 F35 F40×2 F45 F50: 1; F55 ×2, F60: 3; F65 t6/t12: 4, F65 t24: 1 (cooldown decayed back); F70+ drinks: only F100 t3 seen, 「×22」 no cooldown. Max per run 4, per boss: F55 3, F60 3, F65 4. No >8, no >8 shot. First 「藥水冷卻中（還剩 1 回合）」: F5 (shot bw2-F5-first-cooldown-text).
- bw3 boss drinks: F10..F50: 1; F55 ×4: 2; F60 t4 「×10」 (none shown); F65 ×3: 3; F75 「×9」 (none); F80: 4; F90: 5; F100: 6. Max per run 6 (F100), ≤8. Not >8 → no >8 shot. First text: F10 (shot bw3-F10-first-cooldown-text).
- Pattern across bw1/bw2/bw3 (推測): cooldown shown after a drink grows with consecutive/ close drinks (1→6), resets to 1 or absent after a quiet stretch; max seen 6.

## bw2 per boss (pot start→end; turns; HP start→last obs/maxHP; max normal/charge)
F30 20→21 3t 980 100/0 | F35 21→20 5t 228/0 | F40 23→21 11t 173/0 | F45 24→23 9t 18/366 | F50 23→22 11t 34/384 | F55 21→19 11t 212/378 cd3 | F60 19→18 8t 0/0 cd3 | F65 21→18 26t 57/387 cd4 | F70 19→19 3t 0/0 | F75 21→21 3t 63/324 | F80 20→20 5t 48/0 | F85 22→22 8t 0/0 | F90 23→23 8t 104/0 | F95 23→23 6t 0/472 | F100 23→22 4t 35/0 (maxHP 980–1181).
## bw3 per boss
F30 19→17 11t 171/0 | F35 19→18 8t 140/113 | F40 18→17 15t 187/110 | F45 17→17 5t 78/320 | F50 17→17 6t 53/352 cd1 | F55 17→13 21t 114/305 cd2 | F60 11→10 6t 0/398 | F65 9→6 27t 96/398 cd3 | F70 7→7 3t 0/0 | F75 10→10 10t 0/398 | F80 12→11 12t 21/469 cd4 | F85 14→14 7t 135/0 | F90 15→14 6t 0/469 cd5 | F95 14→14 11t 0/0 | F100 16→15 12t 0/0 cd6 (maxHP 1099–1353).

## F30–65 vs F70+ (已驗證 from per-boss rows; bw1 for reference)
| | bw1 | bw2 | bw3 |
|---|---|---|---|
| boss turns F30–65 (8 bosses) | 64, avg 8.0, max 12 | 84, avg 10.5, max 26 | 99, avg 12.4, max 27 |
| boss turns F70+ (7 bosses) | 36, avg 5.1, max 7 | 37, avg 5.3, max 8 | 61, avg 8.7, max 12 |
| net potions used at bosses F30–65 / F70+ | 6 / 2 | 10 / 1 | 12 / 3 |
| max normal hit F30–65 → F70+ | 206 (19.9%) → 118 (11.2%) | 228 (20.7%) → 104 (8.8%) | 187 (16.8%) → 135 (11.5%) |
| max minion charge F30–65 → F70+ | 370 (35.0%) → 423 (40.0%) | 387 (35.0%) → 472 (40.0%) | 398 (34.9%) → 469 (40.0%) |
| potion count trend | 22→36 up | 20→23 flat | 19→6 (F65) then 7→16 recovering |
Reading: in all 3 bulwark runs F70+ bosses are shorter and cheaper than F30–F65 (the long fights are F55 and F65: bw2 F65 26t, bw3 F55 21t/F65 27t); normal hits drop after F65; only minion 蓄力一擊 grows ~+14% (≈35% → ≈40% maxHP, never >40%: 423/1058, 472/1181, 469/1173 = 39.97–40.0%). No difficulty jump after F65 at this build (已驗證 for these 3 runs).

## Other items
- Thorn <30% attacks: 0 events both runs. No hit >40%, no turn >50% (no shots). 
- Keys (已驗證): bw2 A147 Q51 W21 Z21 E3 D77; bw3 A164 Q54 W17 Z27 E9 D90. Keys 1–6 and X/C: 0. 魔力合流/以太: 0.
- Merchants: bw2 9 entered, 0 purchases (held ≥ thr). bw3 16 entered, 2 purchases (F69 held 6 thr 8 bought 1; F72 held 7 thr 8 bought 1) — the only merchant buys; potions were low there (已驗證).
- c6 red text: bw2 F53 t2, F58 t2, F60 t4, F65 t6/t12, F68 t2, F78 t2 = ★Z; F65 t10 = ★D. bw3 F36 t1, F50 t4, F55 t10/14/18, F63 t2, F65 t6/14/24, F75 t8, F80 t4, F90 t4, F100 t4 all ★Z. ★ matched red text every time (已驗證; c6 'D' at bw2 F65 t10 = red said 防禦/保命 — 推測, not rechecked).
- Buff ★ picks: bw2 25 (輕盈架勢 不動之盾 撕裂 靈巧 震盪 不滅 厚皮 活力 堅守 魂燃 銳眼 處刑者 良品嗅覺 千刃 鋒刃專精 弱點洞察 戰意湧動 磨利 熱血 無盡戰意 迅捷調和 王者氣魄 先手氣勢 尋寶者 破甲直覺); bw3 25 (不動之盾 震盪 撕裂 靈巧 不滅 活力 厚皮 堅守 良品嗅覺 弱點洞察 處刑者 鋒刃專精 迅捷調和 千刃 王者氣魄 無盡戰意 戰意湧動 破甲直覺 先手氣勢 魂燃 磨利 輕盈架勢 銳眼 生命祝福 ×2). 部分無效 picks (不動之盾/震盪/不滅/厚皮) not tallied — 推測 several; never 【無效】.
- Feel (推測): bw2 7/10 — cleared with 22 potions, but F65 26-turn boss with cooldown 4; bw3 5/10 — potions fell to 6 at F65 (F55 21t, F65 27t), cooldown reached 6, close to running dry before recovering; cleared with 15.

---
# Update: oc 1 + oc 2 (build 0ac0c03, preset=postF20-oc&fresh; both Lv13 / 110,149C→109,649C / 13 potions, 已驗證; state reset before each run; shots oc1-badge-0ac0c03, oc2-badge-0ac0c03; dumps qa-saves/rc12l-oc-1-end.json, rc12l-oc-2-end.json)
Driver additions: boss end HP read from the map right after the fight (hp_end_map), plus `ckpt` rows every 10 floors (producer request: potions, HP/maxHP, gold). Gold: the map only shows 「本趟：EXP · NNNC」 = C earned this run (total town gold is not displayed in the run; start 109,649C). ckpt rows are in qa-cp9-rc12l-data.jsonl as type 'ckpt'. NOT available for bl1–bl3/bw1–bw3 (the ckpt driver step did not exist yet; unknown — 已驗證 absent, not reconstructed).
Note: oc1 started with the ckpt step missing for F10/F20 (the driver call was interrupted by the parent steer and I swapped in the patched driver at F6; F10/F20 rows came out empty) → F10/F20 for oc1 = unknown; only pre-floor readings known (F9: 16 potions, HP 100%; F19: 15 potions, HP 66%).

| run | result | pot start→end | boss turns F30.. | max normal | max charge (minion) | same-turn cd max | 自動換武器 | 魔力/以太 | >40% hit | >50% turn | thorn<30% |
|---|---|---|---|---|---|---|---|---|---|---|---|
| oc1 | DIED F45 (non-boss floor, t14, 0 potions); 已驗證 | 13→0 | F30 53, F35 15, F40 33 (sum 101), F45 died in fight (t14) | 187 = 22.3% of 840 (F40) | 324 = 40.0% (324/810, F30 霜鐵巨人 t20); F35 255, F40 230 | 1 | 0 | 0/0 | 324 = 40.0% exactly (not >40%) | none | none |
| oc2 | F100 cleared (8t), alive F101 HP 975/1432; 已驗證 | 13→28 | 37,12,12,55,32,9,7,3,8,7,2,3,10,2,8 (sum 207) | 229 = 17.4% of 1314 (F75, 格擋) | 345 = 39.9% of 864 (F45 風鐵螳螂 t37); F50 302 | 1 | 5 (F5, F28, F40, F50×2) | 0/0 | none | none | none |
Correction on oc1 row: the driver treats F45 as a boss floor (f%5==0); the death occurred at F45 turn 14 vs the minion 雷甲元素靈 charge 145 (17% of 840), and the F45 fight log was the death fight, so oc1 has 3 completed bosses (F30/F35/F40) and died in the F45 boss fight (推測 whether the killer was a minion: the death screen says 「（蓄力大招）雷甲元素靈 蓄力一擊！ 145」).

## Required: every F30+ boss — pot start→end, HP start→end(map)/maxHP
oc1: F30 15→5, HP 810→696/810, 53t | F35 6→4, 840→584/840, 15t | F40 6→0, 706→478/840, 33t | F45 0→died (HP 1→0/840), 14+ turns.
oc2: F30 25→19, 798→804/804, 37t | F35 21→21, 804→672(last obs; map after 804)/804, 12t | F40 22→20, 852→852/852, 12t | F45 22→12, 864→864/864, 55t | F50 15→9, 847→757/864, 32t | F55 11→11, 870→1044/870→1044 (buff 生命祝福 raised max), 9t | F60 14→14, 1044→987/1044, 7t | F65 16→16, 1087→1087, 3t | F70 18→17, 1314→1179/1314, 8t | F75 20→21, 1314→511 (last obs)/1314, 7t | F80 21→22, 1271→1039/1314, 2t | F85 22→22, 1314→1184, 3t | F90 24→24, 1314→1231, 10t | F95 26→26, 1314→1314, 2t | F100 28→28, 1314→975/1314, 8t. (All in data.jsonl.)

## Checkpoints (potions | HP/maxHP | run-earned C) — 已驗證 for rows shown
oc1: F10 unknown (pre-F9: 16 pot, HP 100%) | F20 unknown (pre-F19: 15 pot, HP 66%) | F30 15 | 810/810 | 8,438C | F40 6 | 706/840 | 13,933C | death F45: 0 pot | HP 0/840 | 17,293C earned (帶回 +11,240C).
oc2: F10 17 | 798/798 | 850C; F20 21 | 798/798 | 3,786C; F30 25 | 798/804 | 9,398C; F40 22 | 852/852 | 15,698C; F50 15 | 847/864 | 25,209C; F60 14 | 1044/1044 | 35,777C; F70 18 | 1314/1314 | 49,293C; F80 21 | 1271/1314 | 64,316C; F90 24 | 1314/1314 | 82,337C; F100 28 | 1314/1314 | 100,512C; F101 28 | 975/1432 | 106,051C.

## F30–65 vs F70+ (oc; dev's focus: F70+ boss damage ×1→×1.5 @F100)
| | oc2 F30–65 (8 bosses) | oc2 F70+ (7 bosses) | oc1 |
|---|---|---|---|
| boss turns | 37,12,12,55,32,9,7,3 = 167 (avg 20.9, max 55) | 8,7,2,3,10,2,8 = 40 (avg 5.7, max 10) | died F45 (never reached F70) |
| net potions used at bosses | 6,0,2,10,6,0,0,0 = 24 | 1,−1,−1,0,0,0,0 = −1 (potions rose 17→28) | 13→0 by F40 (F30 −10!) |
| max normal hit | 147 = 17.0% (F45) | 229 = 17.4% (F75, 格擋) | 187 = 22.3% (F40) |
| max charge hit | 345 = 39.9% (F45), F50 302 | 145 (F75), F100 103 | 324 = 40.0% (F30) |
Reading (已驗證 for oc2 run; one clear run → 推測 for trend): no sign that F70+ is harder for oc in this run. Normal boss hit sizes are about the same in percent of maxHP (17.0% → 17.4%; absolute 147 → 229 because maxHP grew 864 → 1314), but bosses die within 2–10 turns instead of 12–55, so total damage taken is far smaller. The costly bosses are F30 (oc1 53t, oc2 37t) and F45 (oc2 55t): the oc potion drain lives in F30–F50, not F70+. oc1 shows the danger: potions 15→5 at F30 alone, 0 potions by F40 and death at F45. HP at F100 start 1314/1314, end 975/1432.

## Other items
- Same-turn cooldown: oc1 all drinks 1 (20 drinks seen, last two at F40 t25 / F45 t5 without cooldown text); oc2 all 1 (30 drinks). Max 1 each, ≤8. First 「藥水冷卻中（還剩 1 回合）」: oc1 F6, oc2 F5 (shots oc1-F6-…, oc2-F5-…). No >8 shot.
- Thorn <30% attack: 0. >40%/>50%: none (oc1 324/810 = 40.0%, oc2 345/864 = 39.9%) → no shots.
- Keys (已驗證): oc1 A83 Q24 W15 Z25 E7 D62 S1; oc2 A107 Q49 W29 Z31 E29 D66. Keys 1–6: 0 both; X/C: 0. 魔力合流/以太分流/你的法杖: 0/0 both (oc build here is shield/OC style per ★ choices — 已驗證 no staff procs).
- Merchants: oc1 9 entered: bought 1 at F32 (held 5, thr 6), F37 (4), F39 (5), F42 (0), F44 (0). oc2 18 entered, 0 purchases (potions held ≥ thr).
- c6 red text: oc1 F30 t8/18/35/39, F40 t4/8/21/25 (★Z), F40 t27 and F45 t12 (★D); oc2 F30 t14/18, F40 t5, F45 ×7, F50 t13, F70 t6 (all ★Z). ★ matched red every time (已驗證; the ★D cases were red text 防禦/只靠保命 — 推測).
- 自動換武器 lines: oc1 0 (death screen: 3 auto-equips, no text captured); oc2 5 (shield/dagger/staff swaps).
- Buff ★ picks: oc1 (10) 魂燃 戰意湧動 王者氣魄 韌魂 輕盈架勢 無盡戰意 收斂心神 先手氣勢 熱血 迅捷調和; oc2 (31) 節儉 輕盈架勢 戰意湧動 王者氣魄 無盡戰意 魂燃 先手氣勢 收斂心神 熱血 韌魂 鋒刃專精 千刃 良品嗅覺 弱點洞察 精準 處刑者 生命祝福 磨利 破甲直覺 震盪 不滅 不動之盾 力量祝福 迅捷調和 撕裂 尋寶者 堅守 力量祝福 銳眼 力量祝福 活力. 部分無效 picks not tallied (推測 several: 震盪/不滅/不動之盾); never 【無效】.
- Death (oc1): F45 t12 −293, t13 −58 (HP 1, ★A 必敗, 0 potions), t14 −145 (雷甲元素靈 蓄力一擊, 17% maxHP). Death screen: Lv13→14, +737 EXP, +11,240C, 3 auto-equips. Shot oc1-death-F45.
- Feel (推測): oc1 2/10 — potion drain at F30 (15→5 in one 53-turn fight) then 0 potions by F40; ★ ran out of drinks and died F45. oc2 7/10 — clean clear with 28 potions, but F30/F45/F50 bosses of 37/55/32 turns; F70+ is easy.

## oc3 (postF20-oc&fresh) — 已驗證 unless marked
- Badge: build 0ac0c03 (shot oc3-badge-0ac0c03). Start Lv13, 13 potions after buying 10, 4x + 跳過動畫 on.
- Result: **cleared F100 (3 turns), alive at F101 map HP 822/1148, 10 potions, run gold 97,852C. No death.** Helper dump: qa-saves/rc12l-oc-3-end.json.
- Cooldown: max 1 per boss and per run (≤8 ✔); same-turn read after Z = 1 (28/28 drinks). First 「藥水冷卻中（還剩 N 回合）」 text: F11 Z button 「還剩 1 回合｜剩 15 瓶」 (shot oc3-F11-first-cooldown-text; victory overlay was on top, so the button is not visible in the picture — text came from DOM).
- 反傷 low-HP ★ attacks: none logged. Red-text vs ★: no mismatch seen (推測, only the driver's viol check).
- Keys: A126 Q58 W39 E21 Z34 D113; 1–6 unused (blade-style kit, 慈悲一擊 E×21). 自動換武器 ×2 (F50 shield → 華麗・減幅之強固鳶盾, F60 → 華麗・奪心魔之暴風斧). Buff ★ picks 25, no 部分無效 seen in picks.
- Max hit: normal 168 (21.2% F40); charge 438 (40.0% of 1095, F90 霜晶光靈 蓄力一擊 — exactly at the 40% line, no shot taken); no turn >50%.

| F | turns | pot start→end | HP start (last obs / map after) /max | cd max (same-turn) | max normal | max charge |
|---|---|---|---|---|---|---|
| 30 | 6 | 20→20 | 768 (347 / 426) /792 | 0 | 72 | 103 |
| 35 | 30 | 20→13 | 792 (339 / 418) /792 | 1 (1) | 125 | 316 |
| 40 | 36 | 14→9 | 792 (792 / 792) /792 | 1 (1) | 168 | 198 |
| 45 | 6 | 11→12 | 775 (343 / 422) /792 | 0 | 80 | 277 |
| 50 | 33 | 12→8 | 792 (440 / 519) /792 | 1 (1) | 125 | 298 |
| 55 | 19 | 9→6 | 829 (444 / 528) /840 | 1 (1) | 105 | 210 |
| 60 | 19 | 7→5 | 840 (441 / 525) /840 | 1 (1) | 104 | 0 |
| 65 | 13 | 6→6 | 741 (537 / 621) /840 | 1 (1) | 136 | 157 |
| 70 | 15 | 8→6 | 682 (609 / 625) /840 | 1 (1) | 90 | 0 |
| 75 | 14 | 8→7 | 622 (689 / 775) /858 | 1 (1) | 53 | 300 |
| 80 | 13 | 9→7 | 858 (524 / 610) /858 | 1 (1) | 58 | 255 |
| 85 | 3 | 8→8 | 1095 (905 / 1015) /1095 | 0 | 24 | 166 |
| 90 | 21 | 10→9 | 1056 (710 / 820) /1095 | 1 (1) | 120 | 438 |
| 95 | 5 | 10→10 | 1095 (737 / 737) /1095 | 0 | 110 | 98 |
| 100 | 3 | 10→10 | 1095 (712 / 822) /1095 | 0 | 50 | 333 |

Checkpoints (pot | HP/max | run gold C): F10 16|792/792|650 · F20 17|792/792|3,499 · F30 20|768/792|8,289 · F40 14|792/792|15,553 · F50 12|792/792|24,094 · F60 7|840/840|33,616 · F70 8|682/840|44,221 · F80 9|858/858|56,546 · F90 10|1056/1095|73,377 · F100 10|1095/1095|92,352 · F101 10|822/1148|97,852. (gold = 本趟 C on map; town total not shown.)

F30–65 vs F70+ (oc3): F30–65 8 bosses, 162 turns (avg 20.3), potions 20→6 (−14, bottom at F60 end = 5; merchants bought potions from F57). F70+ 7 bosses, 74 turns (avg 10.6), potions 8→10 despite F70/F75/F80 each costing 1–2. Max normal hit 168 (F30–65) vs 120 (F70+); max charge 316 (39.9%) vs 438 (40.0%). The "stronger F70+ boss damage" shows only in charge % (F90 438 ≈40%) and F70/F75 starting HP 682/622 — not in turn count or potion drain; F70+ was easier than F30–65 (推測: gear/maxHP growth 792→1095 outpaces it).
- Feel (推測): oc3 8/10 — clean clear, F35/40/50 bosses 30–36 turns drag, F70+ quick.

## ar1 (postF20-arcane&fresh) — 已驗證 unless marked
- Badge: build 0ac0c03 (shot ar1-badge-0ac0c03; taken on the 出發前整備 dialog, badge visible bottom-right). Start Lv14, 760 HP, 13 potions after buying 10 (3 mana potions), 4x + 跳過動畫.
- Result: **cleared F100 (24 turns), alive at F101 map HP 1406/1406, 6 potions, run gold 102,754C. No death.** Dump: qa-saves/rc12l-arcane-1-end.json.
- Cooldown: max 1 per boss/run (≤8 ✔); same-turn 1 (41 drinks logged). First text: F15 「決策：★1·烈焰爆破（藥水冷卻中（還剩 1 回合））」 (shot ar1-F15-first-cooldown-text).
- 反傷 low-HP ★ attacks: none logged. Red text vs ★: no mismatch seen (推測).
- Keys: 1:87 2:47 3:44 4:9 5:10 6:28 · A34 Q12 D52 Z41 (all six spell keys used; 1·烈焰爆破 and 2·冰封 dominant). 自動換武器 ×3: F5 烏木杖+2 → 優良・尼福爾海姆之神聖烏木杖; F40 → 華麗・毀滅之極寒柳木杖; F55 same-name → same-name (no-op line). Buff ★ picks 26.
- Main hand at every boss: F30/35/40 優良・尼福爾海姆之神聖烏木杖; F45–F100 華麗・毀滅之極寒柳木杖 (always a staff).
- 「你的法杖：魔力合流」 ×10 (F35 ×4, F40, F85, F90, F95, F100 ×2); 「以太分流」 ×3 (F30, F75, F100). 
- Max hit: normal 238 (19.9% of 1195, F100); **charge 470 = 46.4% of 1014 at F65 turn 19 (冰霜守護・塔主・炎冠精靈 重擊, shot ar1-F65-charge470-46pct)**; no turn >50%. Per-boss normal column of 0 means the driver parsed no boss hit that fight (data gap, 推測), the run max above is from the global tracker.

| F | main hand | turns | pot start→end | HP start (last obs / map after) /max | cd max (same-turn) | max normal | max charge |
|---|---|---|---|---|---|---|---|
| 30 | 神聖烏木杖 | 9 | 21→19 | 760 (347 / 423) /760 | 1 (1) | – | – |
| 35 | 神聖烏木杖 | 20 | 19→16 | 760 (404 / 480) /760 | 1 (1) | 151 | 0 |
| 40 | 神聖烏木杖 | 11 | 16→14 | 724 (535 / 607) /724 | 1 (1) | 137 | 0 |
| 45 | 極寒柳木杖 | 5 | 16→16 | 724 (436 / 508) /724 | 0 | – | – |
| 50 | 極寒柳木杖 | 15 | 18→16 | 652 (340 / 869) /724 | 0 | – | – |
| 55 | 極寒柳木杖 | 18 | 19→14 | 869 (353 / 1014) /869 | 0 | 183 | 325 |
| 60 | 極寒柳木杖 | 9 | 17→16 | 1014 (665 / 766) /1014 | 0 | – | – |
| 65 | 極寒柳木杖 | 28 | 17→11 | 1014 (512 / 613) /1014 | 0 | 202 | 470 |
| 70 | 極寒柳木杖 | 16 | 12→9 | 1014 (812 / 913) /1014 | 0 | 159 | 0 |
| 75 | 極寒柳木杖 | 17 | 11→8 | 1014 (889 / 990) /1014 | 0 | 166 | 0 |
| 80 | 極寒柳木杖 | 20 | 11→8 | 990 (670 / 771) /1014 | 0 | 202 | 0 |
| 85 | 極寒柳木杖 | 15 | 9→8 | 1014 (629 / 730) /1014 | 0 | 111 | 0 |
| 90 | 極寒柳木杖 | 20 | 8→6 | 1195 (679 / 766) /1195 | 0 | 217 | 0 |
| 95 | 極寒柳木杖 | 16 | 8→6 | 741 (441 / 561) /1195 | 0 | 137 | 0 |
| 100 | 極寒柳木杖 | 24 | 8→6 | 801 (786 / 1406) /1195 | 0 | 238 | 0 |

(The cd column for F45+ shows 0 because ★ casts spells, drinking was rare; cd_max field is 0 when no drink happened in that fight.)

Checkpoints (pot | HP/max | run gold C): F10 16|760/760|703 · F20 21|760/760|3,654 · F30 21|760/760|8,564 · F40 16|724/724|15,986 · F50 18|652/724|24,845 · F60 17|1014/1014|35,663 · F70 12|1014/1014|48,827 · F80 11|990/1014|63,583 · F90 8|1195/1195|81,541 · F100 8|801/1195|97,254 · F101 6|1406/1406|102,754.

F30–65 vs F70+ (ar1): F30–65 8 bosses, 115 turns (avg 14.4), potions 21→11 (−10). F70+ 7 bosses, 128 turns (avg 18.3), potions 12→6 (−6, with 4 merchant buys at F92–99). Max normal 202 vs 238; max charge 470 (46%) vs 0 logged (no big charges F70+). Arcane F70+ fights are ~27% longer per boss but cheaper in potions; the heavy hit was F65. F95/F100 started at 741/801 HP, the lowest relative starts.
- Feel (推測): ar1 7/10 — strong, never in danger of dying, but F65 charge 46% and long F65/F100 fights (28/24 turns); MP-economy lines (魔力合流) fire reliably.

## ar2 (postF20-arcane&fresh) — 已驗證 unless marked  (ar3 NOT run, per producer)
- Badge: build 0ac0c03 (shot ar2-badge-0ac0c03). Start Lv14, 760 HP, 13 potions after buying 10, 4x + 跳過動畫.
- Result: **DIED at F60** (boss, turn 17). Dump: qa-saves/rc12l-arcane-2-end.json; shots ar2-F60-HP1-nopotion, ar2-death-F60.
- Death: potions 8 at F55 start → 3 at F55 end, 4 at F60 start; last Z at F60 turn 13 (「剩 1 瓶」→用完). Then HP 456 (t14, D) → 213 (t15) → 1 (t16, −212, ★A「幾乎必敗」, 0 potions) → dead t17 (−61, 尖刺銳眼・災厄・霜鐮光靈; last 3 turns −243/−212/−61; biggest charge in last 2 turns 風翼遊俠 82 = 11%). Max HP stayed 760 all run (no HP growth from drops) — contrast ar1, which reached 1014 by F55. Death screen: Lv14→15, +1,126 EXP, +21,992C kept (earned 1,733 EXP / 33,834C, 50%).
- Cooldown: max 1 per boss/run (≤8 ✔); same-turn 1. First text F10: 「決策：★3·雷擊（藥水冷卻中（還剩 1 回合））」 (shot ar2-F10-first-cooldown-text).
- 反傷 low-HP ★ attacks: none logged. Red text vs ★: no mismatch seen (推測).
- Keys: 1:33 2:28 3:37 4:14 5:9 6:14 · A17 Z32 D46 (Q unused). 自動換武器 ×2 (F12 烏木杖+2 → 普通・芬里爾之柳木杖; F32 → 普通・紅木杖). Buff ★ picks 14.
- Main hand per boss: F30 普通・芬里爾之柳木杖; F35–F60 普通・紅木杖 (never upgraded past 普通 — vs ar1 優良/華麗 staves).
- 「魔力合流」 ×8 (F10, F25, F33, F35 ×2, F50, F51, F60), 「以太分流」 ×6 (F25, F33, F35, F50 ×2, F60).
- Max hit: normal 185 (24.3% of 760, F30 t2); charge 243 (32.0%, F30 t4). No hit >40% and no turn >50% → no >40% screenshot needed. 

| F | main hand | turns | pot start→end | HP start (last obs / map after) /max | cd max (same-turn) | max normal | max charge |
|---|---|---|---|---|---|---|---|
| 30 | 芬里爾之柳木杖 | 16 | 18→15 | 760 (307 / 383) /760 | 1 (1) | 185 | 243 |
| 35 | 紅木杖 | 8 | 15→14 | 760 (335 / 411) /760 | 1 (1) | 76 | 0 |
| 40 | 紅木杖 | 16 | 13→10 | 760 (609 / 685) /760 | 1 (1) | – | – |
| 45 | 紅木杖 | 14 | 13→10 | 741 (609 / 685) /760 | 1 (1) | 138 | 0 |
| 50 | 紅木杖 | 22 | 11→8 | 760 (359 / 435) /760 | 1 (1) | 143 | 142 |
| 55 | 紅木杖 | 24 | 8→3 | 796 (375 / 455) /796 | 0 | 139 | 0 |
| 60 | 紅木杖 | 17 (died) | 4→0 | 760 → 0 | 1 | – | 82 |

Checkpoints (pot | HP/max | run gold C): F10 17|760/760|782 · F20 17|760/760|3,578 · F30 18|760/760|8,353 · F40 13|760/760|14,895 · F50 11|760/760|24,901 · F60 (at death) 4→0|0/760|33,834. F70–F100 not reached (unknown).

F30–65 vs F70+: F70+ not reached. F30–55: 6 bosses, 99 turns (avg 16.5), potions 18→3 (−15), only 3 merchant buys (F52 7, F57 2, F59 3 held).
- Feel (推測): ar2 3/10 — same preset as ar1 (which cleared with 6 potions left), but with no gear upgrade, no max-HP growth and fewer merchant potions, potions ran out by F60. Large run-to-run variance for arcane.
