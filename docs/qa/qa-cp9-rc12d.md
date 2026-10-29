DONE rc12d
# cp9-rc12d acceptance (server :5363, badge 288baa2) — oc 1 & 2
Method: ?cp9&cp8&cp6&preset=postF20-oc&fresh, 10 potions bought (3+10=13), 4x + skip anim, ONLY ★ primary key in battle (data-primarykey → .cmdbar button[data-primary=K]), ★ map node, ★ option on buff pick-3. Merchant rule: buy until held ≥ next-boss threshold (limit 1/merchant). Driver /workspace/drvRC12d.js. Dumps qa-saves/rc12d-oc-1-end.json, rc12d-oc-2-end.json. Shots qa-cp9-rc12d-shots/oc1-*, oc2-*. Per-turn notes: qa-cp9-rc12d-notes.txt. Lv13 constant.
CAVEATS: Z-label potion parse flaky in places (cf pot counts from 「剩 N 瓶」 text/Z presses); raw 0-dmg regex counts include D/Z turns (strict = non D/Z/X/C/F/S keys); interrupt count (regex 被打斷) undercounts; deathlog partial (driver carry between calls: only last ~5 turns of the fatal fight). oc2 F49 merchant: driver parsed thr=7 (merchant screen lacks 「預估 N 瓶」) so did NOT buy at 7<8 (fixed after).

## oc 1 — died F40 boss t31, 0 potions (Z×26 total)
- Buffs taken (9): 撕裂(F1) 輕盈架勢(F5) 王者氣魄(F10) 戰意湧動(F15) 收斂心神(F18) 魂燃(F20) 熱血(F25) 韌魂(F30) 無盡戰意(F35).
- Boss F30 (烈焰深淵之王 霜羽騎士+炎毒遊俠): 39 turns, pot 20→14, skills 4 (W,Q…), interrupts detected 0 (regex), zero-dmg raw 23 / strict 7. D-on-charge t10 格擋 -0, t19 招架 212 + 防禦反擊 63, 「1 回合後重新蓄力」✔.
- Boss F35 (烈焰守門者霜鋼光靈+霜毒光靈): 18 turns, pot 12→9, skills 2, interrupts 0 det., zero raw 14 / strict 4.
- Boss F40 (冰霜災厄風棘狼+霜鱗戰士): 31 turns, pot 8→0, skills 3, interrupts 0 det., zero raw 25 / strict 2. Death: t29 HP240 D (charging, 0 pot) → t30 239 charge hit leaves HP1 → t30 ★A + 「此戰幾乎必敗」(boss NOT charging; A ok) → t31 159 dead.
- Merchants entered 3 (F4, F14, F34; held 17/19/12 ≥ thr 7 → skip). Pre-boss ★: F4 merchant, F9 rest(HP58), F14 merchant, F19 chest, F24 rest(HP80), F29 rest(HP77), F34 merchant, F39 rest(HP56, pot 8). Potions: start 13, drops → 20 at F30; no merchant F36-39.
- Gear (Lv13, same F14-F39 except legs 優良喚風者 from F19): 主手 精良迅捷棍棒, 副手 普通石膚塔盾, 頭 精良噬火者板甲盔, 身 優良偏轉翡翠板甲, 手 精良靈守秘銀鎖子手套, 腿 優良喚風者板甲脛甲, 腳 精良石膚皮靴. Power 544→586 at death.
- Shots: oc1-buff-pick3-first, oc1-F13t2-HP128-c6-text-decision-vs-red, oc1-F40t29-HP240-0pot-charging-c6-decision-vs-red, oc1-F40t30-HP1-0pot-A-bisheng, oc1-death-F40.

## oc 2 — died F50 boss t44, 0 potions (Z×23 total)
- Buffs taken (11): 魂燃 戰意湧動 輕盈架勢 王者氣魄 無盡戰意 收斂心神 熱血 先手氣勢 韌魂 迅捷調和 生命祝福 (HP max 792→950).
- Boss F30 (F30 boss): 3 turns, pot 17→17, skills 3, zero raw 3 / strict 2.
- Boss F35: 17 turns, pot 18→15, skills 5, interrupt 1 (Q t1), zero raw 14 / strict 8.
- Boss F40 (冰霜災厄霜甲野豬+炎羽鳶龍): 29 turns, pot 16→11, skills 5, interrupts 0 det., zero raw 13 / strict 1.
- Boss F45: 19 turns, pot 11→7, skills 5, zero raw 15 / strict 4.
- Boss F50 (守護尖刺深淵之王 雷眼雙頭龍+霜鬃術士): 44 turns, pot 7→0, skills 5, interrupts 2 (Q t1, t27), zero raw 35 / strict 15. HP1/0 pot at t40: 「此戰幾乎必敗（…沒有選項能確保存活或擊殺）；D·防禦（攻擊…會吃反傷約 15 ≥ HP 1，會自殺」 — D hinted (no A), not overwritten by reflect text ✔ (shot oc2-F50t40). t42 HP25 D survive; t43 必敗 again; t44 169 dead.
- Merchants entered 7 (F7,F9,F12,F22,F29,F47,F49): 0 bought (6 held≥7; F49 7<8 missed by driver bug). Pre-boss ★: F4 rest(65), F9 merchant, F14 rest(48), F19 rest(49), F24 rest(73), F29 merchant, F34 rest(54), F39 chest, F44 rest(56), F49 merchant ("7 瓶 < 下一隻首領預估 8 瓶").
- Gear F4-F39: 棍棒 精良迅捷, 塔盾 普通石膚→優良守護(F39), 頭 精良守護鎖子, 身 優良偏轉翡翠, 手 精良減幅琥珀, 腿 普通雷童, 腳 精良石膚→華麗石膚鈷藍鎖子鐵靴(F39). Power 544→622.
- Shots: oc2-buff-pick3-first-with-inapplicable, oc2-F40t14-HP159-charging-c6-decision-Z-vs-red-D, oc2-F50t40-HP1-0pot-D-bisheng-boss, oc2-death-F50.

## VERIFY results
(1) Buff pick-3 (oc1 9 picks, oc2 11 picks, full lists in qa-cp9-rc12d-notes.txt): ★ was NEVER on a 「需要法術／對你無效」 option; ≥2 applicable in all 20 (all had 3 applicable except 6 picks with 1 inapplicable: oc1 F30 雷之印記; oc2 F1 冰之印記, F10 節能詠唱, F26 魔力池, F40/F45 元素共鳴). Inapplicable cards render with disabled 選這個. Violations: 0. First-pick shots: oc1-buff-pick3-first, oc2-buff-pick3-first-with-inapplicable.
(3)/(4) Retreat ★ & low-HP map text: NOT exercised — no map visit with HP<30% & potions≤1 in either run (both died in boss fights; before bosses ★ rest/merchant kept HP healthy). No retreat ★ seen, no lowmap shots. (Not verifiable this round.)
(5) 「此戰幾乎必敗」 at HP1/0 pot: not observed in NORMAL fights (both deaths in boss fights). In boss fights it shows at HP1/0 pot, not overwritten by reflect text (oc1 F40t30 ★A; oc2 F50 t40/t43 ★D with 「會自殺」 reflect info inside the same line).
(6) c6 text 「這一擊只能靠保命活下來，之後再被打就會倒下」: exact HP-1-charging case did not occur (HP was 128-273 when shown, mostly minion charges / Z first). oc1 F13t2, F40t29 (charging, 0 pot, ★D): decision line == red text ✔. oc2 F40t14 (boss charging, HP159): decision line ★Z「Z·喝藥（…Q·盾擊 不保證擋下全部傷害）」 but red text says 「防禦只靠保命剩 1 HP…這一擊只能靠保命活下來」 and 「按 D·防禦：少受約 246」 → NOT identical (decision=Z vs red advises D) — possible inconsistency, shot oc2-F40t14. Also oc1/oc2 c6 sentence appears in 2 red lines in the panel (說明 + 暴擊估 line).
## Totals
- Potions used: oc1 26 (Z presses), oc2 23. Buffs taken: oc1 9, oc2 11.
- F30+ boss turns: oc1 39+18+31=88; oc2 3+17+29+19+44=112. Strict 0-dmg (non D/Z keys): oc1 7+4+2=13; oc2 2+8+1+4+15=30.
- Interrupts detected (regex, undercount): oc1 0, oc2 3 (Q t1 F35, F50 t1 & t27).
- Feel 推測: 6/10 — ★ single-key play is smooth and ★ buffs never wasted (UI filters inapplicable); oc boss fights still long and potion-draining (F40/F50 deaths with 0 pots after 29-44 turn fights); F35+ merchants skipped because held ≥ 7 yet potions hit 0 by the boss → threshold 7-8 too low for oc.

# cp9-rc12d — oc 3 & 4 (appended)
## oc 3 — died F40 boss t29, 0 potions (Z×28)
- Buffs (10): 鋒刃專精(F1) 弱點洞察(F5) 輕盈架勢(F10) 戰意湧動(F15) 收斂心神(F18) 魂燃(F20) 韌魂(F25) 先手氣勢(F26) 無盡戰意(F30) 熱血(F35). ★ never on inapplicable (F30 冥想【無效】 app2). Lists in notes.
- Boss F30 (堅硬・深淵之王・風鐵幽魂+雷岩螳螂): 53 turns, pot 15→5, skills 5, int 2, zero raw 28/strict 4. F35 (烈焰・守門者・風毒幻靈+霜鱗虎): 16 turns, pot 7→3, skills 3, int 1, zero 12/strict 4. F40 (鐵壁・災厄・霜牙殭屍+霜毒幻靈): 29 turns, pot 4→0, skills 3, int 2, zero 22/strict 3.
- Merchants 6: F4,F9,F14,F24 skipped (held≥7); F32 bought 1 (5→6, thr 6); F39 bought 1 (3→4, thr 7 – limit 1/merchant so stayed short).
- Shots: oc3-buff-pick3-first, oc3-F25t26-HP251-charging-c6-decision-Z-vs-red (decision Z vs panel also says 按D少受112 → same mismatch as oc2), oc3-F40t24-HP1-0pot-A-bisheng, oc3-F40t25-HP1-0pot-charging-D-bisheng (boss charging at HP1: decision line D「必敗…首領蓄力中，防禦也擋不住；D 賭保命」 == red text 「這回合按 D·防禦」 ✔), oc3-death-F40.

## oc 4 — SURVIVED: cleared F60 boss, stopped at F61 (driver cap), HP 733/1013, 5 potions left (Z×27)
- Buffs (15): 輕盈架勢 戰意湧動 魂燃 韌魂 無盡戰意 熱血 王者氣魄 先手氣勢 收斂心神 撕裂 不動之盾 震盪 不滅 良品嗅覺 鋒刃專精. ★ never on inapplicable (6 picks with 1 inapplicable: F20 火之印記, F30 冥想, F45 大秘儀, F55 冥想, F60 節能詠唱).
- Bosses (turns, pot start→end, skills, int, zero raw/strict): F30 20 21→16 3 0 18/6 · F35 28 17→10 5 1 24/7 · F40 17 10→7 5 1 11/5 · F45 20 8→4 5 2 19/7 · F50 17 7→3 5 0 18/9 · F55 17 5→3 4 2 13/7 · F60 7 5→5 3 1 8/5. Total F30+ turns 126.
- Merchants 14 entered; early ones skipped (held ≥7); from F47 thr=8: bought 1 each at F47,F49,F52,F54,F57,F59 (limit 1/merchant; always remained <8).
- Shots: oc4-buff-pick3-first, oc4-F30t11-HP229-minion-charging-c6-decision-Z-vs-red (decision Z, panel also advises 按D少受264 — same mismatch type), oc4-F35t20-HP381-charging-D-decision-vs-red (D with Z on cooldown, consistent), oc4-F61-reached-alive.
- Caveat: driver potOf misparsed Z cooldown label 「冷卻 1｜剩 11」 as pot 1 once (F35 t20), fixed afterwards (regex 剩\s*(\d+)); counts above use corrected parse (cf endpot from F35 end).

## VERIFY results (oc 3-4)
(1) Buff pick-3: oc3 10 picks, oc4 15 picks; ★ never on 【無效/需要法術/對你無效】 option; ≥2 applicable always (inapplicable present in 6 oc4 + 1 oc3 picks). Violations 0. Cards 靈巧/堅守 show a red small note (…才有格擋/招架) but ★ was never on them.
(3)/(4) Retreat ★ on map & low-HP map text: NOT exercised (no map visit with HP<30% & pot≤1 in oc3/oc4; oc3 died in boss fight, oc4 alive). No lowmap shots.
(5) 「此戰幾乎必敗」 in NORMAL fights: not observed (oc3 only in F40 boss at HP1/0 pot ★A not charging; ★D when boss charging: 「首領蓄力中，防禦也擋不住；D 賭保命」 decision == red 「這回合按 D·防禦」 ✔). 
(6) Decision vs red text, boss charging & low HP: oc3 F25t26 (HP251, boss charging), oc4 F30t11 (HP229, minion charging): decision ★Z「先喝藥」 but red panel also shows 「按 D·防禦：少受約N(50%)」 → mismatch (same as oc2 F40t14), shots saved. oc3 F40t25 HP1 boss charging ✔ consistent; oc4 F35t20 D (Z cooldown) ✔ consistent. c6 sentence appears twice in panel (說明 + 暴擊估).
## Totals (oc 3-4)
- Potions used (Z presses): oc3 28, oc4 27. Buffs taken: oc3 10, oc4 15.
- F30+ boss turns: oc3 53+16+29=98; oc4 126. Strict 0-dmg: oc3 4+4+3=11; oc4 6+7+5+7+9+7+5=46. Interrupts detected: oc3 5, oc4 7.
- Merchants: oc3 6 entered/2 bought; oc4 14/6. Merchant rule limit 1 potion/merchant meant threshold (7-8) rarely reached after F30 (oc3 F39 3→4 of 7).
- Feel 推測: 7/10 — ★-only play very smooth; oc3 died F40 again with 0 potions (boss fights drain ~4-10 pots each, F30 53-turn fight cost 10); oc4 went to F61 on 21 starting pots with good drops/merchant support; threshold-buy limited to 1/merchant is the weak point. Decision-line vs panel D-suggestion inconsistency when Z chosen under charge persists.

# cp9-rc12d — arcane 1 & 2 (appended)
Method: ?cp9&cp8&cp6&preset=postF20-arcane&fresh (深淵塔), 10 potions bought (3+10=13), ★-only keys (data-primarykey → .cmdbar button[data-primary=K], spell keys 1-6 clicked this way), ★ map node, ★ buff, merchant rule buy to threshold (thr 7-8, 1/merchant). Driver drvRC12d.js (pasted inline; potOf fixed to 剩\s*N for cooldown label). Dumps qa-saves/rc12d-arcane-1-end.json, rc12d-arcane-2-end.json. Shots qa-cp9-rc12d-shots/ar1-*, ar2-*. Notes qa-cp9-rc12d-notes.txt.

## ar 1 — died F60 boss t24, 0 potions (Z×32, buffs 13)
- Buffs (13): 節儉 節能詠唱 元素共鳴 魔力池 冥想 大秘儀 火之印記 雷之印記 冰之印記 澄心 王者氣魄 魂燃 戰意湧動. Lists in notes. ★ never on 【無效】 option (app2 in 4 picks: F13 鋒刃專精, F20 處刑者, F50 弱點洞察 …).
- Key presses (all fights): 1:0 2:41 3:21 4:1 5:20 6:3 A:55 Q:4 D:51 Z:32. ★ for spells 2-6 appeared (2,3,5 most; 4 once; 6=腐化 3x); 1 never ★.
- Bosses (turns, pot, skills(Q), int, zero raw/strict): F30 15t 15→13 0 0 12/6 · F35 15t 13→10 0 0 13/9 · F40 20t 10→6 0 0 16/8 · F45 24t 8→3 0 0 23/9 · F50 8t 4→4 1 1 3/3 · F55 21t 6→2 1 1 14/5 · F60 24t 4→0 1 0 4/1 (death).
- Merchants: F17 skip(16), F39 skip(10), F42 6→7, F44 7→8, F47 3→4, F49 3→4, F52 4→5, F54 5→6, F57 2→3, F59 3→4 (1 per merchant; never reached 8 → 0 pots at F60). Rests ★ at F4,9,14,19,24,29,34.
- Death: F60 boss 銳眼堅硬災厄霜血刺客 t22 吸血重擊 184 → HP1; t23 HP1/0pot charging ★D 「此戰幾乎必敗…首領蓄力中…」 == red panel ✔ → t24 255 dead. Shots: ar1-buff-pick3-first, ar1-F15t5-HP95-c6-decision-Z-vs-red, ar1-F60t23-HP1-0pot-charging-D-bisheng, ar1-death-F60.
## ar 2 — died F40 boss t14, 0 potions (Z×22, buffs 9)
- Buffs (9): 火之印記 元素共鳴 大秘儀 冥想 節能詠唱 澄心(F21) 魔力池 冰之印記 雷之印記. ★ never on inapplicable (app2 in F1,F10,F15,F25,F30 picks).
- Keys: 2:10 3:12 4:5 6:14 A:46 D:39 Z:22 (1,5,Q never). 
- Bosses: F30 19t 15→12 sk0 int0 z6/3 · F35 34t 10→0 sk0 int0 z26/7 (尖刺盾 phases; drained all potions, no merchant F29-34 since rest ★) · F40 14t 1→0 sk0 int0 z7/4 (died).
- Merchants: F37 0→1, F39 0→1 (thr 7; still far short). Rests F4..F34.
- Death: F40 t11 D charging HP143 → t12 HP1/0pot not charging ★A 「此戰幾乎必敗（HP 1、沒有藥水）；A·攻擊（直接輸出）」 ✔ → t13 charging ★D 「必敗…防禦也擋不住；D 賭保命」 → t14 吸血重擊 265 dead. Shots: ar2-buff-pick3-first-with-inapplicable, ar2-F40t12-HP1-0pot-A-bisheng, ar2-death-F40.
## VERIFY results (arcane 1-2)
(1) Spells 2-6 as ★: yes, per-key counts above. 6=腐化 ★ ar1 3x, ar2 14x (fills early/弱點元素); 5 聖擊 20x ar1/0 ar2; 4 狂風 1/5; 1 烈焰爆破 never ★. Spell keys clicked via .cmdbar button[data-primary=K] — all worked.
(2) Buff pick-3 applicability: 22 picks, ★ never on 【無效】; ≥2 applicable always. Violations 0. Note: ★ sometimes on low-value economy buffs (節儉, 尋寶者-style) — 節儉 ★ at F1 ar1 (not wrong per applicability).
(3) Retreat ★ / lowmap: NOT exercised (no map with HP<30% & pot≤1; ar2 F36-39 pot 0-1 but HP ≥55%). No retreat ★ seen, no lowmap shots.
(4) 「此戰幾乎必敗」 in NORMAL fights: not observed (only boss at HP1/0 pot: ar1 F60 ★D charging; ar2 F40 ★A not charging, ★D charging). Texts consistent.
(5) Decision line vs red text: c6 sentence appears often (HP95-185 etc.) — decision Z/D matched red text in all sampled cases (ar1 F15t5 shot); no Z-vs-panel-D mismatch seen in arcane runs (it appeared in oc runs). c6 event counts tracked in notes.
## Totals (arcane 1-2)
- Potions used (Z): ar1 32, ar2 22. Buffs: ar1 13, ar2 9.
- F30+ boss turns: ar1 15+15+20+24+8+21+24=127; ar2 19+34+14=67. Strict 0-dmg: ar1 6+9+8+9+3+5+1=41; ar2 3+7+4=14. Interrupts: ar1 2 (Q t1 F50, F55), ar2 0. Skill (Q) presses in bosses: ar1 3, ar2 0.
- Feel 推測: 6.5/10 — ★ single-key arcane play is smooth and fast, spells ★ sensible; but pot economy is the same weakness: 1/merchant limit with thr 7-8 leaves 0 pots by F35-F60; ar2 died F40 from potion drain in a 34-turn F35 fight; Q (震盪打擊) almost never ★ so interrupts rare.

# cp9-rc12d — arcane 3 & 4 (appended)
Method identical (drvRC12d.js, potion cooldown-label fix; ?cp9&cp8&cp6&preset=postF20-arcane&fresh, 10 potions → 13, ★-only keys incl 1-6, ★ node, ★ buff, merchant buy to thr). Dumps qa-saves/rc12d-arcane-3-end.json, rc12d-arcane-4-end.json. Shots qa-cp9-rc12d-shots/ar3-*, ar4-*. Notes qa-cp9-rc12d-notes.txt.

## ar 3 — died F50 boss t21, 0 potions (Z×26, buffs 12)
- Buffs: 冰之印記 元素共鳴 大秘儀 冥想 節能詠唱 魔力池 火之印記 雷之印記 澄心 魂燃 震盪 王者氣魄.
- Keys: 2:27 3:15 4:1 6:14 A:59 D:54 Z:26 (1,5,Q never ★).
- Bosses (turns, pot, sk, int, zero raw/strict): F30 9t 14→13 0 0 5/3 · F35 20t 13→9 0 0 7/4 · F40 16t 10→7 0 0 2/2 · F45 31t 8→1 0 0 30/12 (boss charged repeatedly at full HP, D holds) · F50 21t 3→0 0 0 11/3 (died).
- Merchants: F17 skip, F27 skip, F42 7→8, F47 1→2, F49 2→3 (1/merchant, never reached thr 8). Rests ★ F4-F34, F39, F44.
- Death: F50 boss 鐵壁守護・深淵之王・霜蹄殭屍 t17 revive; t18-19 D HP75/0pot (c6 text); t20 HP1/0pot not charging ★A 「此戰幾乎必敗（HP 1、沒有藥水）；A·攻擊」 == red ✔; t21 145 dead. Shots: ar3-buff-pick3-first, ar3-F15t5-HP151-c6-decision-Z-vs-red, ar3-F50t20-HP1-0pot-A-bisheng, ar3-death-F50.
## ar 4 — died F55 boss t33, 0 potions (Z×27, buffs 13)
- Buffs: 雷之印記 元素共鳴 澄心 冥想 冰之印記 魔力池 火之印記 節能詠唱 大秘儀 無盡戰意 撕裂 輕盈架勢 戰意湧動.
- Keys: 2:21 3:33 4:5 5:6 6:11 A:44 D:55 Q:3 Z:27 (1 never ★).
- Bosses: F30 9t 18→17 0 0 3/2 · F35 13t 16→14 0 0 5/2 · F40 10t 15→15 1(Q t1) 1 4/3 · F45 33t 15→10 1(Q t1) 1 13/4 · F50 18t 12→8 0 0 9/4 · F55 33t 8→0 1(Q t1) 1 22/5 (died).
- Merchants: F7, F14, F27, F47 all skipped (held 11-17 ≥ thr); 0 bought. Rests ★ most pre-boss; F4 chest ★, F14 merchant ★.
- Death: F55 boss 堅硬鐵壁・守門者・霜尾光靈 t32 HP1/0pot charging ★D 「此戰幾乎必敗…首領蓄力中：防禦只靠保命剩 1 HP…」 == red panel ✔ (panel also says 生命藥水已用完：這回合改按 D); t32 263 → HP1, t33 141 dead. Shots: ar4-buff-pick3-first, ar4-F10t5-HP138-c6-decision-Z-vs-red, ar4-F55t32-HP1-0pot-charging-D-bisheng, ar4-death-F55.
## VERIFY results (arcane 3-4)
(1) Spell keys as ★ (all-fight totals): ar3 2:27 3:15 4:1 6:14 (1,5 none); ar4 2:21 3:33 4:5 5:6 6:11 (1 none). All clicked via .cmdbar button[data-primary=K], all worked. 烈焰爆破(1) never ★ in 4 arcane runs.
(2) Buff applicability: ar3 12 picks, ar4 13 picks; ★ never on 【無效】; ≥2 applicable always (app2 picks: ar3 F5,F36; ar4 F10,F20,F38). Violations 0.
(3) Retreat ★ / lowmap (HP<30% & pot≤1 at map): NOT exercised (ar3 F46-49 pot 1-2 but HP healthy; ar4 pot ≥8 until the F55 fight). No retreat ★, no map screenshot.
(4) 「此戰幾乎必敗」 in NORMAL fights: not observed; only boss at HP1/0pot (ar3 F50 ★A, ar4 F55 ★D charging) — texts consistent.
(5) Decision vs red text: c6 sentence appeared often (ar3 F15t5 HP151, ar4 F10t5 HP138, many boss turns, up to 2 red lines at F50/F55); decision line == red text in every sampled case; NO mismatch (stop-on-mismatch ON, none triggered). 
## Totals (arcane 3-4)
- Potions used (Z): ar3 26, ar4 27. Buffs: ar3 12, ar4 13. Starting 13 potions.
- F30+ boss turns: ar3 9+20+16+31+21=97; ar4 9+13+10+33+18+33=116. Strict 0-dmg: ar3 3+4+2+12+3=24; ar4 2+2+3+4+4+5=20. Interrupts: ar3 0; ar4 3 (Q t1 at F40/F45/F55). Skill (Q) presses in bosses: ar3 0, ar4 3.
- Across arcane 1-4: 4/4 died at 0 potions (F60, F40, F50, F55); potion drain in long boss fights (F45 31-33 turns D-hold loops) + 1-potion-per-merchant limit is the recurring cause.
- Feel 推測: 6.5/10 — ★-only arcane flow smooth, spell ★ picks sensible (弱點元素), buff ★ always valid, text/decision consistent; but Q almost never ★ (interrupts rare) and bosses with repeated charges at full HP (F45) drag to 30+ turns and burn potions; died at 0 pots again.
## bl 1 & 2 (blade) — both CLEARED F60 boss, stopped by driver cap at F61 (alive, no death)
Method same as oc/arcane (Lv14 preset postF20-blade, 13 pot, ★-only, merchant buy-to-threshold; thr default 7 so merchants always skipped). bl1: 4x only (skip-anim checkbox not actually ticked); bl2: 4x + 跳過動畫 on. Dumps qa-saves/rc12d-blade-1-end.json, rc12d-blade-2-end.json. Shots qa-cp9-rc12d-shots/bl1-*, bl2-*. Notes: qa-cp9-rc12d-notes.txt.
### bl 1 — F60 cleared, pot ~20, HPmax 1108
- Keys: A60 W22 E8 Q11 D21 Z9 (E=粉碎擊 ★ 8x incl. F10/F20/F30+ bosses; Shatter ★ at F40,45,50,55,60 boss turn 1 each). Interrupts 2 (E t1 F50, F60).
- Buffs (16): 銳眼 鋒刃專精 弱點洞察 磨利 破甲直覺 處刑者 精準 輕盈架勢 千刃 王者氣魄 戰意湧動 不動之盾(F41) 不滅 震盪 無盡戰意 撕裂. Full lists in notes.
- Bosses (turns, pot, skills, int, zero raw/strict): F30 7t 24→23 1 0 2/2 · F35 2t 21→21 2 0 1/1 · F40 5t 23→23 3 0 2/2 (shat1) · F45 18t 25→23 3 0 14/4 · F50 7t 20→20 3 1 2/2 · F55 6t 19→19 3 0 3/3 · F60 6t 20→20 4 1 6/5.
- Merchants entered F29 F32 F39 F47 F57: all skipped (held 20-24). Pre-boss ★ rest/merchant, HP 57-87% at rests.
- c6 text ×5 (F31t3 HP247 shot, F45t9, F48t3, F48t6, F51t1), all ★Z, decision line == red text. No 必敗, no lowmap, no retreat★ (pot never <19).
### bl 2 — F60 cleared, pot 34, HPmax 1100
- Keys: A44 W20 E8 Q18 D2 Z2. Interrupts 4 (E t1 at F30/F50/F55/F60).
- Buffs (18): 不動之盾 弱點洞察 千刃 鋒刃專精 處刑者 銳眼 精準 磨利 破甲直覺 無盡戰意 魂燃 戰意湧動 不滅 撕裂 王者氣魄 良品嗅覺 震盪 迅捷調和.
- Bosses: F30 4t 23→23 2 1 1/1 · F35 1-2t 25→25 2 0 1/1 · F40 1-2t 27→27 2 0 1/1 · F45 2-3t 29→29 3 0 3/3 · F50 3t 31→31 3 1 3/3 · F55 4t 33→33 3 1 4/4 · F60 6t 34→34 4 1 3/3.
- Merchants F9 F14 F29 F32 F34 F49 F54: all skipped. No c6, no 必敗, no lowmap/retreat★.
## VERIFY (blade)
(1) Buff applicability: ★ never on a 【無效/需要法術】 option (34 picks). BUT blade has no shield: ★ chose 不動之盾 (稀有; 招架+3% 魔減+3% work, 格擋+3% dead, red 「搭盾才有格擋」) at bl1 F41 and bl2 F1 (shots bl1-F41-buff-star-不動之盾-搭盾才有格擋, bl2-buff-pick3-first-star-不動之盾-搭盾才有格擋) → partially dead ★, not tagged 無效 — flag. 靈巧 (迴避 +3%, same red note) appeared non-★. Non-★ 【無效】 cards seen: 元素共鳴/大秘儀/冥想/震盪?(F30 bl1)/不動之盾 etc.
(2) Shatter 粉碎擊 ★: bl1 8, bl2 8; fires on boss turn 1 (stun/interrupt after W 破甲), mostly effective; interrupts 2 / 4.
(3) Retreat ★ / lowmap: not exercised (pot 19+). (4) 「此戰幾乎必敗」 normal fights: never shown. (5) decision vs red text: c6 in bl1 only, always identical; mismatch stop never triggered.
## Totals (blade 1-2)
Potions used (Z): bl1 9 (13→20 net by drops), bl2 2. Buffs 16/18. F30+ boss turns: bl1 51, bl2 ~22; strict 0-dmg: bl1 23, bl2 17 (raw lower). Interrupts 2 / 4. Skill presses in bosses: bl1 19, bl2 18.
Feel 推測: 8/10 — blade ★ flow is fast and safe (W 破甲→E 粉碎→Q burst kills F35-F60 bosses in 1-7 turns, potions never a constraint, 2/2 clears vs 0/8 for oc/arcane clears); only gripe is ★ buff picking shield-only 不動之盾 for blade, and merchant never needed.

## bulwark 1 & 2 (appended; server :5363 badge 288baa2; driver = drvRC12d.js logic, merchant default thr 8, c6-stop-when-K∉{Z,D}; Lv11 preset postF20-bulwark, 13 pot, 4x + 跳過動畫 ticked, 忽略並出發)
Dumps qa-saves/rc12d-bulwark-1-end.json, rc12d-bulwark-2-end.json. Shots qa-cp9-rc12d-shots/bw1-*, bw2-*. Notes qa-cp9-rc12d-notes.txt. Both runs CLEARED the F60 boss and stopped at driver cap F61 (alive, no death).
### bw 1 — F61 alive, pot 9, HPmax 1123
- Keys A149 Q35 W16 E9 D28 Z23. Buffs 16: 活力 不動之盾 撕裂 震盪 靈巧 堅守 厚皮 不滅 魂燃 王者氣魄 戰意湧動 處刑者 千刃 鋒刃專精 無盡戰意 輕盈架勢.
- Bosses (turns, pot, skills, int, zero raw/strict): F30 25t 17→13 3 0 21/9 · F35 20t 16→13 2 1 12/9 · F40 11t 12→10 2 1 11/7 · F45 15t 11→11 3 1 4/4 · F50 34t 12→8 6 0 21/14 · F55 11t 10→9 2 1 7/5 · F60 7t 10→9 3 0 4/2. (F10 boss c6 shot.)
- Merchants entered 7 (F7 F14 F19 F29 F37 F44 F52): 6 skipped (held>=8), F52 bought 1 (7→8). Pre-boss ★ rest/merchant/chest (HP 48-93%). No lowmap, no 必敗.
### bw 2 — F61 alive, pot 8, HPmax 1074
- Keys A130 Q31 W12 E11 D34 Z23. Buffs 15: 撕裂 不動之盾 靈巧 不滅 震盪 厚皮 活力 堅守 輕盈架勢 魂燃 王者氣魄 千刃 戰意湧動 無盡戰意 鋒刃專精.
- Bosses: F30 11t 16→15 1 0 7/4 · F35 10t 16→14 2 0 11/9 · F40 25t 14→13 3 1 14/8 · F45 29t 16→11 3 0 30/19 · F50 34t 13→8 5 0 16/5 · F55 15t 10→7 5 0 14/11 · F60 14t 9→8 5 0 7/4.
- Merchants entered 10: 9 skipped (held>=8), F57 bought 1 (7→8). No lowmap, no 必敗.
## VERIFY (bulwark 1-2)
(1) Buff pick-3: 31 picks (16+15); ★ NEVER on a 【無效/需要法術】 card; ≥2 applicable in all (app2 picks: bw1 F1,F31,F45,F60; bw2 F10,F43,F55). Many ★ cards carry red 「搭盾才有格擋」 — bulwark has a shield so they are live (not flagged). Flag (low value, not dead): ★ often picks 奔流/刃鋒 cards (魂燃 靈動架勢傷害, 輕盈架勢, 王者氣魄, 無盡戰意, 戰意湧動, 千刃, 鋒刃專精, 處刑者) although bulwark ★-only never presses S 靈動架勢 (only 慈悲一擊 E / Q / W as skills) — mostly marginal, not tagged inapplicable. Violations 0. Shots bw1-buff-pick3-first, bw2-buff-pick3-first.
(2) Interrupts: bw1 4 (Q t4 F35, Q t10 F40, Q t13 F45, Q t4 F55), bw2 1 (Q t9 F40) — driver regex undercount possible. Skill presses in F30+ bosses: bw1 21, bw2 24.
(3) Retreat ★ / lowmap (HP<30% & pot<=1 at map): NOT exercised in either run (potions never <7 at a map). No retreat ★ seen, no map screenshot.
(4) 「此戰幾乎必敗」 in normal fights: never shown (no HP1/0-pot situations in either run).
(5) Decision vs red text (mismatch stop ON): c6 sentence appeared 5× (bw1) / 7× (bw2). Sampled shots: bw1-F10t6 (HP170, Z) and bw2-F35t4 (HP307, boss charging, Z) — decision line == red text. bw2 panel also lists 「按 D·防禦：少受約 213(50%)」 info line beside decision Z (same pattern as oc2/oc3/oc4, advisory not decision). bw1 F35t4 showed c6 with ★Q (not Z/D) — driver did not stop (stop rule added after), so that one case is NOT inspected; bw2 7/7 c6 had K=Z. No mismatch stop triggered.
## Totals (bulwark 1-2)
Potions used (Z): bw1 23, bw2 23 (13 start, drops/merchant keep pot 8-9 at end). Buffs 16/15. F30+ boss turns: bw1 123, bw2 138; strict 0-dmg: bw1 50, bw2 60 (raw higher). Interrupts 4/1. Skill presses 21/24. Clears 2/2.
Feel 推測: 7.5/10 — ★-only bulwark flow is stable (2/2 F60 clears, potions never ran out unlike rc12c bulwark deaths); bosses at F45/F50 still drag 29-34 turns of D/招架 loops with many 0-dmg turns; ★ buffs sensible but lean on 奔流 cards the ★-only flow can't use; retreat/必敗 paths untested (never hit).
